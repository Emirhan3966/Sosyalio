import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const orderNumber = "SYL-260924-021D47";
const projectRoot = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/u, (value) => value.slice(1)));
const excludedDirectories = new Set([".deployment", ".next", "node_modules", ".git"]);
const forensicScripts = new Set([
  "scripts/audit-test-orders.mjs",
  "scripts/cleanup-confirmed-test-orders.mjs",
  "scripts/inspect-order-readonly.mjs",
  "scripts/verify-admin-orders-page.mjs",
]);

async function sourceFiles(directory, relative = "") {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    const childRelative = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(absolute, childRelative));
    else if (/\.(?:ts|tsx|mjs|json|sql)$/iu.test(entry.name)) files.push({ absolute, relative: childRelative.replaceAll("\\", "/") });
  }
  return files;
}

function emailSignals(value) {
  const email = value.trim().toLowerCase();
  const [local = "", domain = ""] = email.split("@", 2);
  return {
    testDomain: ["example.com", "example.invalid", "sosyalio.local"].includes(domain),
    testKeyword: /(?:^|[._+-])(test|qa|smoke)(?:$|[._+-])/u.test(local),
  };
}

function targetSignals(value) {
  const target = value.trim().toLowerCase();
  return {
    testKeyword: /(?:^|[_@.\/-])(test|qa|smoke)(?:$|[_@.\/-])/u.test(target) || target.includes("_test"),
  };
}

try {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      paymentAttempt: true,
      paymentEvents: { orderBy: [{ receivedAt: "asc" }, { id: "asc" }] },
    },
  });
  if (!order) throw new Error("Sipariş bulunamadı.");

  const matchingSources = [];
  for (const file of await sourceFiles(projectRoot)) {
    if (forensicScripts.has(file.relative)) continue;
    const contents = await readFile(file.absolute, "utf8");
    if (contents.includes(order.customerEmail) || contents.includes(order.targetUrlOrUsername) || contents.includes(order.orderNumber)) {
      matchingSources.push(file.relative);
    }
  }

  const attempt = order.paymentAttempt;
  console.log(JSON.stringify({
    readOnly: true,
    order: {
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentProvider: order.paymentProvider,
      providerOrderIdPresent: Boolean(order.providerOrderId),
      providerOrderIdMockShape: order.providerOrderId?.startsWith("mock_order_") ?? false,
      paidAt: order.paidAt?.toISOString() ?? null,
      paymentAmountPresent: order.paymentAmount !== null,
      paymentCurrency: order.paymentCurrency,
    },
    paymentAttempt: attempt ? {
      present: true,
      provider: attempt.provider,
      checkoutReferencePresent: Boolean(attempt.checkoutReference),
      checkoutReferenceMockShape: attempt.checkoutReference.startsWith("mock_product_"),
      mockTokenHashPresent: Boolean(attempt.mockTokenHash),
      checkoutUrlIsLocalMockRoute: new URL(attempt.checkoutUrl).pathname.includes("/odeme/mock"),
      createdAt: attempt.createdAt.toISOString(),
      updatedAt: attempt.updatedAt.toISOString(),
    } : { present: false },
    paymentEvents: order.paymentEvents.map((event) => ({
      provider: event.provider,
      eventType: event.eventType,
      result: event.result,
      providerOrderIdPresent: Boolean(event.providerOrderId),
      providerOrderIdMockShape: event.providerOrderId?.startsWith("mock_order_") ?? false,
      receivedAt: event.receivedAt.toISOString(),
      processedAt: event.processedAt?.toISOString() ?? null,
    })),
    customerSignals: {
      email: emailSignals(order.customerEmail),
      target: targetSignals(order.targetUrlOrUsername),
    },
    sourceEvidence: {
      exactValueMatchFound: matchingSources.length > 0,
      matchingFiles: matchingSources,
    },
  }, null, 2));
} finally {
  await prisma.$disconnect();
}

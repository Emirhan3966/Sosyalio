import "dotenv/config";
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const exportPayload = JSON.parse(await readFile(new URL("../prisma/migration-data/sqlite-export-20260923-185227.json", import.meta.url), "utf8"));
const exportedOrders = exportPayload.tables?.Order ?? [];

function normalized(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function hasExplicitTestEmail(order) {
  const email = normalized(order.customerEmail);
  return email.endsWith("@example.com")
    || email.endsWith("@example.invalid")
    || email.endsWith("@sosyalio.local");
}

function hasExplicitTestTarget(order) {
  const target = normalized(order.targetUrlOrUsername);
  return /(?:^|[_@.-])(qa|smoke|test)(?:$|[_@.-])/u.test(target)
    || target.includes("_test")
    || target.includes("smoke");
}

function matchesExportedFixture(order) {
  return exportedOrders.some((fixture) => fixture.id === order.id
    && fixture.orderNumber === order.orderNumber
    && fixture.customerEmail === order.customerEmail
    && fixture.targetUrlOrUsername === order.targetUrlOrUsername);
}

function classify(order) {
  const explicitEmail = hasExplicitTestEmail(order);
  const explicitTarget = hasExplicitTestTarget(order);
  const exportedFixture = matchesExportedFixture(order);
  const mockPayment = order.paymentProvider === "MOCK"
    || order.paymentAttempt?.provider === "MOCK"
    || order.paymentEvents.some((event) => event.provider === "MOCK");
  const scriptedSmoke = normalized(order.customerEmail) === "neon-migration-smoke@example.invalid"
    && normalized(order.targetUrlOrUsername) === "@neon_migration_smoke";

  const signals = [
    exportedFixture ? "legacy-export-fixture-match" : null,
    explicitEmail ? "explicit-test-email-domain" : null,
    explicitTarget ? "explicit-test-target" : null,
    mockPayment ? "mock-payment-relation" : null,
    scriptedSmoke ? "exact-smoke-script-marker" : null,
  ].filter(Boolean);

  if ((exportedFixture && explicitEmail && explicitTarget) || scriptedSmoke) {
    return { classification: "kesin test", signals };
  }
  if ((explicitEmail && explicitTarget) || (mockPayment && (explicitEmail || explicitTarget))) {
    return { classification: "muhtemel test", signals };
  }
  return { classification: "belirsiz / korunmalı", signals };
}

try {
  const [orders, counts, orphanAttempts, orphanEvents] = await Promise.all([
    prisma.order.findMany({
      orderBy: [{ createdAt: "asc" }, { orderNumber: "asc" }],
      include: {
        paymentAttempt: { select: { id: true, provider: true } },
        paymentEvents: { select: { id: true, provider: true } },
      },
    }),
    Promise.all([
      prisma.servicePlatform.count(),
      prisma.service.count(),
      prisma.package.count(),
      prisma.supportConversation.count(),
      prisma.supportMessage.count(),
      prisma.adminUser.count(),
      prisma.adminSession.count(),
      prisma.paymentAttempt.count(),
      prisma.paymentEvent.count(),
    ]),
    prisma.$queryRaw`SELECT COUNT(*)::int AS "count" FROM "PaymentAttempt" pa LEFT JOIN "Order" o ON o."id" = pa."orderId" WHERE o."id" IS NULL`,
    prisma.$queryRaw`SELECT COUNT(*)::int AS "count" FROM "PaymentEvent" pe LEFT JOIN "Order" o ON o."id" = pe."orderId" WHERE pe."orderId" IS NOT NULL AND o."id" IS NULL`,
  ]);

  const auditedOrders = orders.map((order) => {
    const result = classify(order);
    return {
      id: result.classification === "kesin test" ? order.id : undefined,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      paymentStatus: order.paymentStatus,
      classification: result.classification,
      signals: result.signals,
      paymentAttemptCount: order.paymentAttempt ? 1 : 0,
      paymentEventCount: order.paymentEvents.length,
    };
  });

  console.log(JSON.stringify({
    readOnly: true,
    orderCount: orders.length,
    orders: auditedOrders,
    relationCounts: { paymentAttempts: counts[7], paymentEvents: counts[8] },
    protectedCounts: {
      platforms: counts[0],
      services: counts[1],
      packages: counts[2],
      supportConversations: counts[3],
      supportMessages: counts[4],
      adminUsers: counts[5],
      adminSessions: counts[6],
    },
    orphans: {
      paymentAttempts: orphanAttempts[0]?.count ?? null,
      paymentEvents: orphanEvents[0]?.count ?? null,
    },
  }, null, 2));
} finally {
  await prisma.$disconnect();
}

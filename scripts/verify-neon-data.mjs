import "dotenv/config";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";

const inputPath = resolve(process.argv[2] ?? "prisma/migration-data/sqlite-export.json");
const prisma = new PrismaClient();

function normalize(value) {
  if (value instanceof Date) return value.toISOString();
  if (Prisma.Decimal.isDecimal(value)) return value.toString();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])]));
  }
  return value;
}

function fingerprint(value) {
  return createHash("sha256").update(JSON.stringify(normalize(value))).digest("hex");
}

function duplicateCount(rows, key) {
  return rows.length - new Set(rows.map(key)).size;
}

try {
  const source = JSON.parse(await readFile(inputPath, "utf8")).tables;
  const target = {
    ServicePlatform: await prisma.servicePlatform.findMany({ orderBy: { id: "asc" } }),
    Service: await prisma.service.findMany({ orderBy: { id: "asc" } }),
    Package: await prisma.package.findMany({ orderBy: { id: "asc" } }),
    AdminUser: await prisma.adminUser.findMany({ orderBy: { id: "asc" } }),
    AdminSession: await prisma.adminSession.findMany({ orderBy: { id: "asc" } }),
    Order: await prisma.order.findMany({ orderBy: { id: "asc" } }),
    PaymentAttempt: await prisma.paymentAttempt.findMany({ orderBy: { id: "asc" } }),
    PaymentEvent: await prisma.paymentEvent.findMany({ orderBy: { id: "asc" } }),
    SupportConversation: await prisma.supportConversation.findMany({ orderBy: { id: "asc" } }),
    SupportMessage: await prisma.supportMessage.findMany({ orderBy: { id: "asc" } }),
  };

  const counts = {};
  const exact = {};
  const mismatchFields = {};
  for (const table of Object.keys(source)) {
    counts[table] = { sqlite: source[table].length, neon: target[table].length };
    exact[table] = fingerprint(source[table]) === fingerprint(target[table]);
    if (!exact[table]) {
      const sourceById = new Map(source[table].map((row) => [row.id, normalize(row)]));
      const fields = new Set();
      for (const targetRow of target[table].map(normalize)) {
        const sourceRow = sourceById.get(targetRow.id) ?? {};
        for (const field of new Set([...Object.keys(sourceRow), ...Object.keys(targetRow)])) {
          if (JSON.stringify(sourceRow[field]) !== JSON.stringify(targetRow[field])) fields.add(field);
        }
      }
      mismatchFields[table] = [...fields].sort();
    }
  }

  const platformIds = new Set(target.ServicePlatform.map((row) => row.id));
  const serviceIds = new Set(target.Service.map((row) => row.id));
  const packageIds = new Set(target.Package.map((row) => row.id));
  const orderIds = new Set(target.Order.map((row) => row.id));
  const adminIds = new Set(target.AdminUser.map((row) => row.id));
  const conversationIds = new Set(target.SupportConversation.map((row) => row.id));

  const duplicates = {
    platformSlug: duplicateCount(target.ServicePlatform, (row) => row.slug),
    platformServiceSlug: duplicateCount(target.Service, (row) => `${row.platformId}:${row.slug}`),
    servicePackageQuantity: duplicateCount(target.Package, (row) => `${row.serviceId}:${row.quantity}`),
  };
  const orphans = {
    service: target.Service.filter((row) => !platformIds.has(row.platformId)).length,
    package: target.Package.filter((row) => !serviceIds.has(row.serviceId)).length,
    order: target.Order.filter((row) => !platformIds.has(row.platformId) || !serviceIds.has(row.serviceId) || !packageIds.has(row.packageId)).length,
    paymentAttempt: target.PaymentAttempt.filter((row) => !orderIds.has(row.orderId)).length,
    paymentEvent: target.PaymentEvent.filter((row) => row.orderId && !orderIds.has(row.orderId)).length,
    adminSession: target.AdminSession.filter((row) => !adminIds.has(row.adminId)).length,
    supportMessage: target.SupportMessage.filter((row) => !conversationIds.has(row.conversationId)).length,
  };
  const activePlatformIds = new Set(target.ServicePlatform.filter((row) => row.isActive).map((row) => row.id));
  const sellableServices = target.Service.filter((row) => row.isActive && activePlatformIds.has(row.platformId));
  const sellableServiceIds = new Set(sellableServices.map((row) => row.id));
  const storefront = {
    activePlatforms: activePlatformIds.size,
    sellableServices: sellableServices.length,
    sellablePackages: target.Package.filter((row) => row.isActive && sellableServiceIds.has(row.serviceId)).length,
  };
  const sourcePrices = new Map(source.Package.map((row) => [row.id, `${row.price}|${row.referencePrice ?? ""}`]));
  const sourceOrderPrices = new Map(source.Order.map((row) => [row.id, `${row.price}|${row.paymentAmount ?? ""}`]));
  const priceMismatches =
    target.Package.filter((row) => sourcePrices.get(row.id) !== `${row.price.toString()}|${row.referencePrice?.toString() ?? ""}`).length +
    target.Order.filter((row) => sourceOrderPrices.get(row.id) !== `${row.price.toString()}|${row.paymentAmount?.toString() ?? ""}`).length;
  const allExact = Object.values(exact).every(Boolean);
  const allCountsMatch = Object.values(counts).every(({ sqlite, neon }) => sqlite === neon);
  const cleanRelations = [...Object.values(duplicates), ...Object.values(orphans)].every((count) => count === 0);
  const success = allExact && allCountsMatch && cleanRelations && priceMismatches === 0;

  console.log(JSON.stringify({ success, counts, exact, mismatchFields, storefront, duplicates, orphans, priceMismatches }));
  if (!success) process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

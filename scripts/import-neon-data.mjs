import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const inputPath = resolve(process.argv[2] ?? "prisma/migration-data/sqlite-export.json");
const prisma = new PrismaClient();

const dateFields = {
  ServicePlatform: ["createdAt", "updatedAt"],
  Service: ["createdAt", "updatedAt"],
  Package: ["createdAt", "updatedAt"],
  AdminUser: ["lastLoginAt", "createdAt", "updatedAt"],
  AdminSession: ["expiresAt", "createdAt"],
  Order: ["paidAt", "createdAt", "updatedAt"],
  PaymentAttempt: ["createdAt", "updatedAt"],
  PaymentEvent: ["receivedAt", "processedAt"],
  SupportConversation: ["createdAt", "updatedAt", "lastMessageAt"],
  SupportMessage: ["createdAt", "readAt"],
};

function hydrate(table, rows) {
  return rows.map((source) => {
    const row = { ...source };
    for (const field of dateFields[table] ?? []) {
      if (row[field] != null) row[field] = new Date(row[field]);
    }
    return row;
  });
}

const modelByTable = {
  ServicePlatform: "servicePlatform",
  Service: "service",
  Package: "package",
  AdminUser: "adminUser",
  AdminSession: "adminSession",
  Order: "order",
  PaymentAttempt: "paymentAttempt",
  PaymentEvent: "paymentEvent",
  SupportConversation: "supportConversation",
  SupportMessage: "supportMessage",
};

try {
  const payload = JSON.parse(await readFile(inputPath, "utf8"));
  if (payload.formatVersion !== 1 || !payload.tables) throw new Error("Desteklenmeyen aktarım dosyası biçimi.");

  const targetCounts = {};
  for (const [table, model] of Object.entries(modelByTable)) {
    targetCounts[table] = await prisma[model].count();
  }
  const populated = Object.entries(targetCounts).filter(([, count]) => count !== 0);
  if (populated.length) {
    throw new Error(`Hedef veritabanı boş değil; içe aktarma durduruldu (${populated.map(([name]) => name).join(", ")}).`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.servicePlatform.createMany({ data: hydrate("ServicePlatform", payload.tables.ServicePlatform) });
    await tx.service.createMany({ data: hydrate("Service", payload.tables.Service) });
    await tx.package.createMany({ data: hydrate("Package", payload.tables.Package) });
    await tx.adminUser.createMany({ data: hydrate("AdminUser", payload.tables.AdminUser) });
    await tx.adminSession.createMany({ data: hydrate("AdminSession", payload.tables.AdminSession) });
    await tx.order.createMany({ data: hydrate("Order", payload.tables.Order) });
    await tx.paymentAttempt.createMany({ data: hydrate("PaymentAttempt", payload.tables.PaymentAttempt) });
    await tx.paymentEvent.createMany({ data: hydrate("PaymentEvent", payload.tables.PaymentEvent) });
    await tx.supportConversation.createMany({ data: hydrate("SupportConversation", payload.tables.SupportConversation) });
    await tx.supportMessage.createMany({ data: hydrate("SupportMessage", payload.tables.SupportMessage) });

    await tx.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"ServicePlatform"', 'id'), COALESCE(MAX("id"), 1), MAX("id") IS NOT NULL) FROM "ServicePlatform"`,
    );
    await tx.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"Service"', 'id'), COALESCE(MAX("id"), 1), MAX("id") IS NOT NULL) FROM "Service"`,
    );
    await tx.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"Package"', 'id'), COALESCE(MAX("id"), 1), MAX("id") IS NOT NULL) FROM "Package"`,
    );
  }, { timeout: 60_000 });

  const importedCounts = {};
  for (const [table, model] of Object.entries(modelByTable)) {
    importedCounts[table] = await prisma[model].count();
  }
  console.log(JSON.stringify({ success: true, counts: importedCounts }));
} finally {
  await prisma.$disconnect();
}

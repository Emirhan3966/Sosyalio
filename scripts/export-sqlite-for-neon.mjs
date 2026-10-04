import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const outputPath = resolve(process.argv[2] ?? "prisma/migration-data/sqlite-export.json");
const prisma = new PrismaClient();

function serializeValue(value) {
  if (value instanceof Date) return { $type: "DateTime", value: value.toISOString() };
  if (value && typeof value === "object" && value.constructor?.name === "Decimal") {
    return { $type: "Decimal", value: value.toString() };
  }
  return value;
}

function replacer(_key, value) {
  return serializeValue(value);
}

try {
  const [
    servicePlatforms,
    services,
    packages,
    adminUsers,
    adminSessions,
    orders,
    paymentAttempts,
    paymentEvents,
    supportConversations,
    supportMessages,
  ] = await Promise.all([
    prisma.servicePlatform.findMany({ orderBy: { id: "asc" } }),
    prisma.service.findMany({ orderBy: { id: "asc" } }),
    prisma.package.findMany({ orderBy: { id: "asc" } }),
    prisma.adminUser.findMany({ orderBy: { id: "asc" } }),
    prisma.adminSession.findMany({ orderBy: { id: "asc" } }),
    prisma.order.findMany({ orderBy: { id: "asc" } }),
    prisma.paymentAttempt.findMany({ orderBy: { id: "asc" } }),
    prisma.paymentEvent.findMany({ orderBy: { id: "asc" } }),
    prisma.supportConversation.findMany({ orderBy: { id: "asc" } }),
    prisma.supportMessage.findMany({ orderBy: { id: "asc" } }),
  ]);

  const data = {
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    tables: {
      ServicePlatform: servicePlatforms,
      Service: services,
      Package: packages,
      AdminUser: adminUsers,
      AdminSession: adminSessions,
      Order: orders,
      PaymentAttempt: paymentAttempts,
      PaymentEvent: paymentEvents,
      SupportConversation: supportConversations,
      SupportMessage: supportMessages,
    },
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(data, replacer, 2)}\n`, { flag: "wx" });

  const counts = Object.fromEntries(
    Object.entries(data.tables).map(([table, rows]) => [table, rows.length]),
  );
  const storefront = {
    activePlatforms: servicePlatforms.filter((row) => row.isActive).length,
    sellableServices: services.filter(
      (row) => row.isActive && servicePlatforms.some((platform) => platform.id === row.platformId && platform.isActive),
    ).length,
    sellablePackages: packages.filter((row) => {
      if (!row.isActive) return false;
      const service = services.find((candidate) => candidate.id === row.serviceId);
      return Boolean(
        service?.isActive &&
          servicePlatforms.some((platform) => platform.id === service.platformId && platform.isActive),
      );
    }).length,
  };

  console.log(JSON.stringify({ outputPath, counts, storefront }));
} finally {
  await prisma.$disconnect();
}

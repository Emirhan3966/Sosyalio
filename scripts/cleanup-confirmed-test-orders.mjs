import "dotenv/config";
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const confirmedPlan = [
  { id: "cmub9d5ng0001v8iwarxme1g3", orderNumber: "SYL-260921-26638D" },
  { id: "cmub9wsbw0003v8dowlb483nx", orderNumber: "SYL-260921-6C6857" },
  { id: "cmubaqpg70001v844laok93sa", orderNumber: "SYL-260921-38F2B2" },
  { id: "cmubc2ksk0001v8bs8fkizgrx", orderNumber: "SYL-260921-749E4B" },
];
const protectedOrderNumber = "SYL-260924-021D47";
const exportPayload = JSON.parse(await readFile(new URL("../prisma/migration-data/sqlite-export-20260923-185227.json", import.meta.url), "utf8"));
const exportedOrders = exportPayload.tables?.Order ?? [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isExplicitTestFixture(order) {
  const fixture = exportedOrders.find((candidate) => candidate.id === order.id && candidate.orderNumber === order.orderNumber);
  if (!fixture) return false;
  const email = order.customerEmail.trim().toLowerCase();
  const target = order.targetUrlOrUsername.trim().toLowerCase();
  const explicitEmail = email.endsWith("@example.com") || email.endsWith("@example.invalid") || email.endsWith("@sosyalio.local");
  const explicitTarget = target.includes("_test") || /(?:^|[_@.-])(qa|smoke|test)(?:$|[_@.-])/u.test(target);
  return fixture.customerEmail === order.customerEmail
    && fixture.targetUrlOrUsername === order.targetUrlOrUsername
    && explicitEmail
    && explicitTarget;
}

async function protectedCounts(client) {
  const [platforms, services, packages, supportConversations, supportMessages, adminUsers, adminSessions] = await Promise.all([
    client.servicePlatform.count(),
    client.service.count(),
    client.package.count(),
    client.supportConversation.count(),
    client.supportMessage.count(),
    client.adminUser.count(),
    client.adminSession.count(),
  ]);
  return { platforms, services, packages, supportConversations, supportMessages, adminUsers, adminSessions };
}

try {
  const targetIds = confirmedPlan.map((item) => item.id);
  const before = {
    orders: await prisma.order.count(),
    paymentAttempts: await prisma.paymentAttempt.count(),
    paymentEvents: await prisma.paymentEvent.count(),
    protected: await protectedCounts(prisma),
  };

  const deleted = await prisma.$transaction(async (tx) => {
    const targets = await tx.order.findMany({
      where: { id: { in: targetIds } },
      include: { paymentAttempt: { select: { id: true } }, paymentEvents: { select: { id: true } } },
      orderBy: { createdAt: "asc" },
    });
    assert(targets.length === confirmedPlan.length, "Planlanan kesin test siparişlerinin tamamı bulunamadı; transaction durduruldu.");
    for (const planItem of confirmedPlan) {
      const order = targets.find((candidate) => candidate.id === planItem.id);
      assert(order?.orderNumber === planItem.orderNumber, `Sipariş kimliği/numarası değişmiş: ${planItem.orderNumber}`);
      assert(isExplicitTestFixture(order), `Kesin test sinyalleri artık doğrulanamıyor: ${planItem.orderNumber}`);
    }

    const expectedAttemptCount = targets.filter((order) => order.paymentAttempt).length;
    const expectedEventCount = targets.reduce((total, order) => total + order.paymentEvents.length, 0);
    const paymentEvents = await tx.paymentEvent.deleteMany({ where: { orderId: { in: targetIds } } });
    const paymentAttempts = await tx.paymentAttempt.deleteMany({ where: { orderId: { in: targetIds } } });
    const orders = await tx.order.deleteMany({ where: { id: { in: targetIds } } });

    assert(paymentEvents.count === expectedEventCount, "PaymentEvent silme sayısı audit ile eşleşmedi.");
    assert(paymentAttempts.count === expectedAttemptCount, "PaymentAttempt silme sayısı audit ile eşleşmedi.");
    assert(orders.count === confirmedPlan.length, "Order silme sayısı planla eşleşmedi.");
    return { orders: orders.count, paymentAttempts: paymentAttempts.count, paymentEvents: paymentEvents.count };
  });

  const [afterOrders, afterAttempts, afterEvents, protectedAfter, protectedOrder, deletedStillPresent, orphanAttempts, orphanEvents] = await Promise.all([
    prisma.order.count(),
    prisma.paymentAttempt.count(),
    prisma.paymentEvent.count(),
    protectedCounts(prisma),
    prisma.order.findUnique({ where: { orderNumber: protectedOrderNumber }, select: { orderNumber: true, createdAt: true, status: true, paymentStatus: true } }),
    prisma.order.count({ where: { id: { in: targetIds } } }),
    prisma.$queryRaw`SELECT COUNT(*)::int AS "count" FROM "PaymentAttempt" pa LEFT JOIN "Order" o ON o."id" = pa."orderId" WHERE o."id" IS NULL`,
    prisma.$queryRaw`SELECT COUNT(*)::int AS "count" FROM "PaymentEvent" pe LEFT JOIN "Order" o ON o."id" = pe."orderId" WHERE pe."orderId" IS NOT NULL AND o."id" IS NULL`,
  ]);

  assert(protectedOrder, "Korunması gereken belirsiz sipariş bulunamadı.");
  assert(deletedStillPresent === 0, "Kesin test siparişlerinden bazıları hâlâ mevcut.");
  assert(JSON.stringify(before.protected) === JSON.stringify(protectedAfter), "Korunan tablo sayıları değişti.");
  assert(orphanAttempts[0]?.count === 0 && orphanEvents[0]?.count === 0, "Ödeme ilişkilerinde orphan kayıt oluştu.");

  console.log(JSON.stringify({
    success: true,
    before: { orders: before.orders, paymentAttempts: before.paymentAttempts, paymentEvents: before.paymentEvents },
    deleted,
    after: { orders: afterOrders, paymentAttempts: afterAttempts, paymentEvents: afterEvents },
    protectedOrder: {
      orderNumber: protectedOrder.orderNumber,
      createdAt: protectedOrder.createdAt.toISOString(),
      status: protectedOrder.status,
      paymentStatus: protectedOrder.paymentStatus,
    },
    orphans: { paymentAttempts: orphanAttempts[0]?.count, paymentEvents: orphanEvents[0]?.count },
    protectedTablesUnchanged: true,
  }, null, 2));
} finally {
  await prisma.$disconnect();
}

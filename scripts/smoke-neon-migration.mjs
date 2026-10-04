import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";
let testOrderId = null;
let testConversationId = null;
let adminSnapshot = null;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, options = {}) {
  const response = await fetch(new URL(path, baseUrl), options);
  const text = await response.text();
  let body = null;
  if ((response.headers.get("content-type") ?? "").includes("application/json") && text) body = JSON.parse(text);
  return { response, body, text };
}

async function counts() {
  return {
    ServicePlatform: await prisma.servicePlatform.count(),
    Service: await prisma.service.count(),
    Package: await prisma.package.count(),
    AdminUser: await prisma.adminUser.count(),
    AdminSession: await prisma.adminSession.count(),
    Order: await prisma.order.count(),
    PaymentAttempt: await prisma.paymentAttempt.count(),
    PaymentEvent: await prisma.paymentEvent.count(),
    SupportConversation: await prisma.supportConversation.count(),
    SupportMessage: await prisma.supportMessage.count(),
  };
}

const before = await counts();

try {
  assert(process.env.SHOPIER_MODE === "mock", "Smoke test yalnızca SHOPIER_MODE=mock ile çalışır.");

  const admin = await prisma.adminUser.findUnique({
    where: { email: process.env.ADMIN_EMAIL },
    include: { sessions: true },
  });
  assert(admin, "Smoke test admin hesabını bulamadı.");
  adminSnapshot = {
    id: admin.id,
    lastLoginAt: admin.lastLoginAt,
    updatedAt: admin.updatedAt,
    sessions: admin.sessions.map(({ id, tokenHash, adminId, expiresAt, createdAt }) => ({ id, tokenHash, adminId, expiresAt, createdAt })),
  };

  const item = await prisma.package.findFirst({
    where: { isActive: true, service: { isActive: true, platform: { isActive: true } } },
    include: { service: { include: { platform: true } } },
    orderBy: { id: "asc" },
  });
  assert(item, "Aktif test paketi bulunamadı.");

  const home = await request("/");
  assert(home.response.ok, "Ana sayfa açılmadı.");
  const platform = await request(`/${item.service.platform.slug}`);
  assert(platform.response.ok, "Platform sayfası açılmadı.");
  const service = await request(`/${item.service.platform.slug}/${item.service.slug}`);
  assert(service.response.ok && service.text.includes(`package=${item.id}`), "Hizmet/paket sayfası doğrulanamadı.");

  const login = await request("/api/admin/auth/login", {
    method: "POST",
    headers: { Origin: baseUrl, "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
  });
  assert(login.response.ok, "Admin login başarısız.");
  const adminCookie = login.response.headers.getSetCookie()[0]?.split(";")[0];
  assert(adminCookie, "Admin session cookie üretilmedi.");
  const ordersPage = await request("/admin/siparisler", { headers: { Cookie: adminCookie } });
  assert(ordersPage.response.ok, "Admin sipariş listesi açılamadı.");

  const createOrder = await request("/api/orders", {
    method: "POST",
    headers: { Origin: baseUrl, "Content-Type": "application/json" },
    body: JSON.stringify({ packageId: item.id, customerEmail: "neon-migration-smoke@example.invalid", targetUrlOrUsername: "@neon_migration_smoke" }),
  });
  assert(createOrder.response.status === 201 && createOrder.body?.orderNumber, "Test siparişi oluşturulamadı.");
  const testOrder = await prisma.order.findUnique({ where: { orderNumber: createOrder.body.orderNumber } });
  assert(testOrder, "Oluşturulan test siparişi DB'de bulunamadı.");
  testOrderId = testOrder.id;

  const orderPage = await request(`/siparis/${testOrder.orderNumber}`);
  assert(orderPage.response.ok, "Sipariş sayfası açılamadı.");
  const checkout = await request(`/api/payments/${testOrder.orderNumber}/checkout`, {
    method: "POST",
    headers: { Origin: baseUrl },
  });
  assert(checkout.response.ok && checkout.body?.provider === "MOCK", "Mock ödeme bağlantısı oluşturulamadı.");
  const mockUrl = new URL(checkout.body.url);
  const token = mockUrl.searchParams.get("token");
  assert(token, "Mock ödeme tokenı üretilmedi.");
  const confirm = await request("/api/payments/mock/confirm", {
    method: "POST",
    headers: { Origin: baseUrl, "Content-Type": "application/json" },
    body: JSON.stringify({ orderNumber: testOrder.orderNumber, token }),
  });
  assert(confirm.response.ok && confirm.body?.success, "Mock ödeme tamamlanamadı.");
  const paid = await prisma.order.findUnique({ where: { id: testOrder.id }, select: { paymentStatus: true } });
  assert(paid?.paymentStatus === "PAID", "Mock ödeme siparişi PAID yapmadı.");

  const conversation = await request("/api/support/conversation", { method: "POST", headers: { Origin: baseUrl } });
  assert(conversation.response.status === 201 && conversation.body?.messages?.length === 1, "Destek konuşması oluşturulamadı.");
  assert(conversation.body.messages[0].sender === "SYSTEM", "İlk destek mesajı SYSTEM değil.");
  testConversationId = conversation.body.conversation.id;
  const visitorCookie = conversation.response.headers.getSetCookie()[0]?.split(";")[0];
  assert(visitorCookie, "Visitor cookie üretilmedi.");
  const visitorMessage = await request("/api/support/message", {
    method: "POST",
    headers: { Cookie: visitorCookie, Origin: baseUrl, "Content-Type": "application/json" },
    body: JSON.stringify({ content: "Neon migration smoke visitor mesajı" }),
  });
  assert(visitorMessage.response.status === 201, "Visitor destek mesajı kaydedilemedi.");
  const adminReply = await request(`/api/admin/support/conversations/${testConversationId}/reply`, {
    method: "POST",
    headers: { Cookie: adminCookie, Origin: baseUrl, "Content-Type": "application/json" },
    body: JSON.stringify({ content: "Neon migration smoke admin yanıtı" }),
  });
  assert(adminReply.response.status === 201, "Admin destek yanıtı kaydedilemedi.");
  const visitorPoll = await request(`/api/support/messages?after=${visitorMessage.body.message.id}`, { headers: { Cookie: visitorCookie } });
  assert(visitorPoll.response.ok && visitorPoll.body?.messages?.some((message) => message.sender === "ADMIN"), "Admin yanıtı visitor polling ile alınamadı.");

  console.log(JSON.stringify({ success: true, storefront: true, adminLogin: true, order: true, mockPayment: true, supportFlow: true }));
} finally {
  if (testConversationId) await prisma.supportConversation.deleteMany({ where: { id: testConversationId } });
  if (testOrderId) {
    await prisma.paymentEvent.deleteMany({ where: { orderId: testOrderId } });
    await prisma.order.deleteMany({ where: { id: testOrderId } });
  }
  if (adminSnapshot) {
    await prisma.$transaction(async (tx) => {
      await tx.adminSession.deleteMany({ where: { adminId: adminSnapshot.id } });
      if (adminSnapshot.sessions.length) await tx.adminSession.createMany({ data: adminSnapshot.sessions });
      await tx.adminUser.update({
        where: { id: adminSnapshot.id },
        data: { lastLoginAt: adminSnapshot.lastLoginAt, updatedAt: adminSnapshot.updatedAt },
      });
    });
  }
  const after = await counts();
  assert(JSON.stringify(after) === JSON.stringify(before), `Smoke test temizliği tablo sayılarını geri yüklemedi: ${JSON.stringify({ before, after })}`);
  console.log(JSON.stringify({ cleanup: true, countsRestored: true }));
  await prisma.$disconnect();
}

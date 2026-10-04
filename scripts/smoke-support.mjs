import "dotenv/config";
import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const prisma = new PrismaClient();
let conversationId = null;
let newConversationId = null;
let sameNameConversationId = null;
let adminSessionId = null;
let supportCountsBefore = null;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function jsonRequest(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  assert(contentType.includes("application/json"), `${options.method || "GET"} ${path} JSON dönmedi: ${contentType}`);
  assert(text.trim(), `${options.method || "GET"} ${path} boş body döndü.`);
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`${options.method || "GET"} ${path} geçersiz JSON döndü: ${text.slice(0, 160)}`);
  }
  if (path.includes("/support/")) assert(typeof body.ok === "boolean", `${options.method || "GET"} ${path} ok alanı döndürmedi.`);
  console.log(`${options.method || "GET"} ${path} -> ${response.status} ${contentType.split(";")[0]} (${text.length} byte)`);
  return { response, body };
}

try {
  supportCountsBefore = {
    conversations: await prisma.supportConversation.count(),
    messages: await prisma.supportMessage.count(),
  };

  const before = {
    platforms: await prisma.servicePlatform.count(),
    services: await prisma.service.count(),
    packages: await prisma.package.count(),
    orders: await prisma.order.count(),
    admins: await prisma.adminUser.count(),
  };

  const emptyConversation = await jsonRequest("/api/support/conversation");
  assert(emptyConversation.response.status === 200 && emptyConversation.body.conversation === null, "Cookie olmadan GET conversation beklenen boş durumu dönmedi.");

  const invalidName = await jsonRequest("/api/support/conversation", { method: "POST", headers: { Origin: baseUrl, "Content-Type": "application/json" }, body: JSON.stringify({ visitorName: " <script> " }) });
  assert(invalidName.response.status === 400, "Geçersiz visitor name kabul edildi.");

  const created = await jsonRequest("/api/support/conversation", { method: "POST", headers: { Origin: baseUrl, "Content-Type": "application/json" }, body: JSON.stringify({ visitorName: "  Emir  " }) });
  assert(created.response.status === 201, "Visitor conversation oluşturulamadı.");
  const visitorCookie = created.response.headers.getSetCookie()[0].split(";")[0];
  conversationId = created.body.conversation.id;
  assert(created.body.messages.length === 1, "İlk konuşmada tek sistem mesajı olmalı.");
  assert(created.body.conversation.visitorName === "Emir", "Visitor name trim edilerek kaydedilmedi.");
  assert(created.body.messages[0].content === "Merhaba Emir 👋 Nasıl yardımcı olabilirim?", "Otomatik karşılama mesajı hatalı.");

  const reopened = await jsonRequest("/api/support/conversation", { method: "POST", headers: { Cookie: visitorCookie } });
  assert(reopened.body.messages.length === 1, "Sistem mesajı ikinci kez eklenmiş.");

  const visitorMessage = await jsonRequest("/api/support/message", {
    method: "POST",
    headers: { Cookie: visitorCookie, Origin: baseUrl, "Content-Type": "application/json" },
    body: JSON.stringify({ content: "Merhaba, bilgi almak istiyorum." }),
  });
  assert(visitorMessage.response.status === 201 && visitorMessage.body.message.sender === "VISITOR", "Visitor mesajı kaydedilemedi.");

  const unauthorized = await jsonRequest("/api/admin/support/conversations");
  assert(unauthorized.response.status === 401, "Admin endpoint'i public erişime açık.");

  const admin = await prisma.adminUser.findFirst({ where: { isActive: true }, select: { id: true } });
  assert(admin, "Smoke testi için aktif admin bulunamadı.");
  const adminToken = randomBytes(32).toString("base64url");
  const adminSession = await prisma.adminSession.create({ data: { adminId: admin.id, tokenHash: createHash("sha256").update(adminToken).digest("hex"), expiresAt: new Date(Date.now() + 10 * 60 * 1000) }, select: { id: true } });
  adminSessionId = adminSession.id;
  const adminHeaders = { Cookie: `sosyalio_admin_session=${adminToken}` };

  const adminList = await jsonRequest("/api/admin/support/conversations", { headers: adminHeaders });
  assert(adminList.body.conversations.some((item) => item.id === conversationId && item.visitorName === "Emir"), "Admin listesinde Emir görünmedi.");

  const adminDetail = await jsonRequest(`/api/admin/support/conversations/${conversationId}`, { headers: adminHeaders });
  assert(adminDetail.body.conversation.visitorName === "Emir" && adminDetail.body.conversation.createdAt, "Admin chat header visitor name bilgisini döndürmedi.");

  const adminVisibleConversation = await prisma.supportConversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
  });
  assert(adminVisibleConversation?.visitorName === "Emir", "Visitor name admin verisinde bulunamadı.");
  assert(adminVisibleConversation?.messages.some((message) => message.content === "Merhaba, bilgi almak istiyorum."), "Visitor mesajı admin görünümünde bulunamadı.");

  const adminReply = await jsonRequest(`/api/admin/support/conversations/${conversationId}/reply`, { method: "POST", headers: { ...adminHeaders, Origin: baseUrl, "Content-Type": "application/json" }, body: JSON.stringify({ content: "Merhaba, nasıl yardımcı olabiliriz?" }) });
  assert(adminReply.response.status === 201, "Admin reply API yanıt gönderemedi.");

  const visitorPoll = await jsonRequest(`/api/support/messages?after=${visitorMessage.body.message.id}`, { headers: { Cookie: visitorCookie } });
  assert(visitorPoll.body.messages.some((message) => message.content === "Merhaba, nasıl yardımcı olabiliriz?"), "Admin yanıtı visitor endpoint'inde görünmedi.");

  const closed = await jsonRequest(`/api/admin/support/conversations/${conversationId}`, { method: "PATCH", headers: { ...adminHeaders, Origin: baseUrl, "Content-Type": "application/json" }, body: JSON.stringify({ status: "CLOSED" }) });
  assert(closed.response.status === 200 && closed.body.conversation.status === "CLOSED", "Konuşma kapatılamadı.");

  const history = await jsonRequest("/api/support/conversation", { headers: { Cookie: visitorCookie } });
  assert(history.body.conversation === null && history.body.messages.length === 0, "Kapalı konuşma ziyaretçiye yeniden bağlandı.");

  const nextConversation = await jsonRequest("/api/support/conversation", { method: "POST", headers: { Cookie: visitorCookie, Origin: baseUrl, "Content-Type": "application/json" }, body: JSON.stringify({ visitorName: "Ahmet" }) });
  assert(nextConversation.response.status === 201, "Kapalı konuşmadan sonra yeni konuşma oluşturulmadı.");
  newConversationId = nextConversation.body.conversation.id;
  assert(newConversationId !== conversationId, "Kapalı konuşma yeniden kullanıldı.");
  assert(nextConversation.body.conversation.visitorName === "Ahmet", "Yeni conversation yeni visitor name kullanmadı.");
  assert(nextConversation.body.messages.length === 1 && nextConversation.body.messages[0].sender === "SYSTEM", "Yeni konuşmanın greeting mesajı hatalı.");
  assert(nextConversation.body.messages[0].content === "Merhaba Ahmet 👋 Nasıl yardımcı olabilirim?", "Yeni conversation greeting adı hatalı.");

  const repeatedOpen = await jsonRequest("/api/support/conversation", { method: "POST", headers: { Cookie: visitorCookie, Origin: baseUrl } });
  assert(repeatedOpen.response.status === 200 && repeatedOpen.body.conversation.id === newConversationId, "Aktif konuşmadan devam edilmedi.");
  assert(repeatedOpen.body.messages.length === 1, "Greeting mesajı birden fazla kez oluşturuldu.");

  const nextVisitorMessage = await jsonRequest("/api/support/message", {
    method: "POST",
    headers: { Cookie: visitorCookie, Origin: baseUrl, "Content-Type": "application/json" },
    body: JSON.stringify({ content: "Yeni görüşme mesajı" }),
  });
  assert(nextVisitorMessage.response.status === 201, "Yeni konuşmaya visitor mesajı kaydedilemedi.");

  const lifecycleList = await prisma.supportConversation.findMany({ where: { id: { in: [conversationId, newConversationId] } } });
  const archivedConversation = lifecycleList.find((item) => item.id === conversationId);
  const activeConversation = lifecycleList.find((item) => item.id === newConversationId);
  assert(archivedConversation?.status === "CLOSED", "Eski konuşma admin geçmişinde CLOSED olarak kalmadı.");
  assert(activeConversation?.status === "OPEN", "Yeni konuşma admin panelinde ayrı OPEN kayıt olarak görünmedi.");

  const sameNameVisitor = await jsonRequest("/api/support/conversation", { method: "POST", headers: { Origin: baseUrl, "Content-Type": "application/json" }, body: JSON.stringify({ visitorName: "Emir" }) });
  sameNameConversationId = sameNameVisitor.body.conversation.id;
  assert(sameNameVisitor.response.status === 201 && sameNameConversationId !== conversationId, "Aynı isimli farklı visitor ayrı conversation oluşturamadı.");
  const sameNameRows = await prisma.supportConversation.findMany({ where: { id: { in: [conversationId, sameNameConversationId] } }, select: { id: true, visitorId: true, visitorName: true } });
  assert(sameNameRows.length === 2 && sameNameRows.every((item) => item.visitorName === "Emir") && new Set(sameNameRows.map((item) => item.visitorId)).size === 2, "Aynı isimli visitor conversation kayıtları birbirine karıştı.");

  const after = {
    platforms: await prisma.servicePlatform.count(),
    services: await prisma.service.count(),
    packages: await prisma.package.count(),
    orders: await prisma.order.count(),
    admins: await prisma.adminUser.count(),
  };
  assert(JSON.stringify(before) === JSON.stringify(after), "Mevcut veri sayıları değişti.");

  console.log(JSON.stringify({ success: true, before, after, flow: ["visitor name validated", "Emir created", "visitor message", "admin read", "admin reply", "visitor received", "closed", "archived", "Ahmet created", "single greeting", "same-name visitors isolated"] }, null, 2));
} finally {
  const smokeConversationIds = [conversationId, newConversationId, sameNameConversationId].filter(Boolean);
  if (smokeConversationIds.length) {
    await prisma.supportConversation.deleteMany({ where: { id: { in: smokeConversationIds } } });
  }
  if (adminSessionId) await prisma.adminSession.deleteMany({ where: { id: adminSessionId } });
  if (supportCountsBefore) {
    const supportCountsAfter = {
      conversations: await prisma.supportConversation.count(),
      messages: await prisma.supportMessage.count(),
    };
    assert(JSON.stringify(supportCountsAfter) === JSON.stringify(supportCountsBefore), "Smoke support kayıtları güvenli şekilde temizlenemedi.");
  }
  await prisma.$disconnect();
}

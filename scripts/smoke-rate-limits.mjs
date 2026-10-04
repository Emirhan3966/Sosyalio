import "dotenv/config";
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3001";
const remoteTest = process.env.SMOKE_REMOTE === "true";
const startedAt = new Date();
const testId = randomUUID();
const adminEmail = `rate-limit-${testId}@example.invalid`;
const adminPassword = randomBytes(32).toString("base64url");
const testIps = {
  admin: "192.0.2.10",
  create: "192.0.2.20",
  lookup: "192.0.2.30",
  notFound: "192.0.2.40",
};
const scopes = {
  admin: "admin-login-failed",
  create: "order-create",
  lookup: "order-lookup",
};
const remoteRateEntryIds = new Set();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function keyHash(scope, ip) {
  const configuredSecret = process.env.RATE_LIMIT_HASH_SECRET?.trim();
  const secret = configuredSecret && configuredSecret.length >= 32
    ? configuredSecret
    : "sosyalio-development-rate-limit-key";
  return createHmac("sha256", secret).update(`${scope}\0${ip}`).digest("hex");
}

async function post(path, ip, body) {
  const response = await fetch(new URL(path, baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": baseUrl,
      "x-nf-client-connection-ip": ip,
    },
    body: JSON.stringify(body),
  });
  return { response, body: await response.json() };
}

async function captureRemoteRateEntry(scope) {
  if (!remoteTest) return;
  const entry = await prisma.rateLimitEntry.findFirst({
    where: { scope, createdAt: { gte: startedAt } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  assert(entry, `${scope} production limiter kaydı bulunamadı.`);
  remoteRateEntryIds.add(entry.id);
}

try {
  await prisma.adminUser.create({
    data: { email: adminEmail, passwordHash: await hash(adminPassword, 4), isActive: true },
  });

  const failedLogin = await post("/api/admin/auth/login", testIps.admin, { email: adminEmail, password: `${adminPassword}-wrong` });
  assert(failedLogin.response.status === 401, "İlk başarısız admin login 401 dönmedi.");
  await captureRemoteRateEntry(scopes.admin);

  const successfulLogin = await post("/api/admin/auth/login", testIps.admin, { email: adminEmail, password: adminPassword });
  assert(successfulLogin.response.status === 200 && successfulLogin.body?.success === true, "Başarılı admin login çalışmadı.");
  const resetCount = await prisma.rateLimitEntry.count({
    where: { scope: scopes.admin, keyHash: keyHash(scopes.admin, testIps.admin) },
  });
  assert(resetCount === 0, "Başarılı admin login başarısız denemeleri sıfırlamadı.");

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const failure = await post("/api/admin/auth/login", testIps.admin, { email: adminEmail, password: `${adminPassword}-wrong` });
    assert(failure.response.status === 401, `Admin login ${attempt}. başarısız denemede erken bloklandı.`);
    if (attempt === 1) await captureRemoteRateEntry(scopes.admin);
  }
  const blockedLogin = await post("/api/admin/auth/login", testIps.admin, { email: adminEmail, password: `${adminPassword}-wrong` });
  assert(blockedLogin.response.status === 429, "Admin login limit aşımında 429 dönmedi.");
  assert(blockedLogin.body?.ok === false && blockedLogin.body?.error === "Çok fazla giriş denemesi yapıldı. Lütfen daha sonra tekrar deneyin.", "Admin 429 cevabı generic değil.");

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const create = await post("/api/orders", testIps.create, {});
    assert(create.response.status === 400, `Sipariş oluşturma ${attempt}. istekte erken bloklandı.`);
    if (attempt === 1) await captureRemoteRateEntry(scopes.create);
  }
  const blockedCreate = await post("/api/orders", testIps.create, {});
  assert(blockedCreate.response.status === 429, "Sipariş oluşturma limit aşımında 429 dönmedi.");

  const existingOrder = await prisma.order.findFirst({
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true, customerEmail: true },
  });
  assert(existingOrder, "Normal lookup testi için mevcut sipariş bulunamadı.");
  const lookup = await post("/api/orders/lookup", testIps.lookup, {
    orderNumber: existingOrder.orderNumber,
    email: existingOrder.customerEmail,
  });
  assert(lookup.response.status === 200 && lookup.body?.orderNumber === existingOrder.orderNumber, "Normal sipariş sorgulama çalışmadı.");
  await captureRemoteRateEntry(scopes.lookup);

  const fakeOrderNumber = `SYL-000000-${createHash("sha256").update(testId).digest("hex").slice(0, 6).toUpperCase()}`;
  const notFound = await post("/api/orders/lookup", testIps.notFound, {
    orderNumber: fakeOrderNumber,
    email: "rate-limit-not-found@example.invalid",
  });
  assert(notFound.response.status === 404, "Bulunamayan sipariş sorgusu 404 dönmedi.");
  assert(Object.keys(notFound.body ?? {}).length === 1 && typeof notFound.body?.error === "string", "Bulunamadı cevabı gereksiz alan sızdırıyor.");

  const lookupStartAttempt = remoteTest ? 3 : 2;
  for (let attempt = lookupStartAttempt; attempt <= 20; attempt += 1) {
    const extraLookup = await post("/api/orders/lookup", testIps.lookup, {});
    assert(extraLookup.response.status === 400, `Sipariş sorgulama ${attempt}. istekte erken bloklandı.`);
  }
  const blockedLookup = await post("/api/orders/lookup", testIps.lookup, {});
  assert(blockedLookup.response.status === 429, "Sipariş sorgulama limit aşımında 429 dönmedi.");

  console.log(JSON.stringify({
    success: true,
    adminLogin: { successReset: true, failedAttempts: true, blockedWith429: true },
    orderCreate: { normalRequestsAllowed: true, blockedWith429: true },
    orderLookup: { normalLookup: true, blockedWith429: true, notFoundGeneric: true },
  }));
} finally {
  if (remoteTest) {
    await prisma.rateLimitEntry.deleteMany({ where: { id: { in: [...remoteRateEntryIds] } } });
  } else {
    await prisma.rateLimitEntry.deleteMany({
      where: {
        createdAt: { gte: startedAt },
        OR: [
          { scope: scopes.admin, keyHash: keyHash(scopes.admin, testIps.admin) },
          { scope: scopes.create, keyHash: keyHash(scopes.create, testIps.create) },
          { scope: scopes.lookup, keyHash: { in: [keyHash(scopes.lookup, testIps.lookup), keyHash(scopes.lookup, testIps.notFound)] } },
        ],
      },
    });
  }
  await prisma.adminUser.deleteMany({ where: { email: adminEmail } });
  await prisma.$disconnect();
  console.log(JSON.stringify({ cleanup: true }));
}

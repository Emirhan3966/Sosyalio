import "dotenv/config";
import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = "https://sosyalio.tr";
const protectedOrderNumber = "SYL-260924-021D47";
const deletedOrderNumbers = ["SYL-260921-26638D", "SYL-260921-6C6857", "SYL-260921-38F2B2", "SYL-260921-749E4B"];
let temporarySessionId = null;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  assert(process.env.SHOPIER_MODE === "mock", "SHOPIER_MODE mock değil; admin UI kontrolü durduruldu.");
  const admin = await prisma.adminUser.findFirst({ where: { isActive: true }, select: { id: true } });
  assert(admin, "Aktif admin hesabı bulunamadı.");

  const token = randomBytes(32).toString("base64url");
  const temporarySession = await prisma.adminSession.create({
    data: {
      adminId: admin.id,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
    select: { id: true },
  });
  temporarySessionId = temporarySession.id;

  const page = await fetch(`${baseUrl}/admin/siparisler`, {
    headers: { Cookie: `sosyalio_admin_session=${token}` },
  });
  const html = await page.text();
  assert(page.ok, `Admin sipariş sayfası açılamadı: HTTP ${page.status}`);
  assert(html.includes(protectedOrderNumber), "Korunan sipariş admin ekranında görünmüyor.");
  for (const orderNumber of deletedOrderNumbers) {
    assert(!html.includes(orderNumber), `Silinen test siparişi admin ekranında hâlâ görünüyor: ${orderNumber}`);
  }
  const visibleOrderLinks = [...html.matchAll(/href="\/admin\/siparisler\/(SYL-[A-F0-9-]+)"/g)].map((match) => match[1]);
  assert(new Set(visibleOrderLinks).size === 1, "Admin sipariş ekranında beklenmeyen sayıda sipariş satırı var.");

  console.log(JSON.stringify({
    success: true,
    pageStatus: page.status,
    visibleOrderCount: 1,
    protectedOrderNumber,
    deletedOrdersAbsent: true,
    shopierModeMock: true,
  }));
} finally {
  if (temporarySessionId) await prisma.adminSession.deleteMany({ where: { id: temporarySessionId } });
  await prisma.$disconnect();
  console.log(JSON.stringify({ temporarySessionRemoved: true }));
}

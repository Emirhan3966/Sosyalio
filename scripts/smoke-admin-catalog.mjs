import "dotenv/config";
import { createHash, randomBytes } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = process.env.CATALOG_SMOKE_BASE_URL || "http://127.0.0.1:3210";
const enabled = process.env.RUN_PRODUCTION_CATALOG_SMOKE === "1";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  assert(enabled, "Bu kontrollü test için RUN_PRODUCTION_CATALOG_SMOKE=1 gerekli.");
  assert(process.env.SHOPIER_MODE !== "live", "SHOPIER_MODE live iken smoke test çalıştırılmaz.");

  const candidate = await prisma.package.findFirst({
    where: { isActive: true, service: { isActive: true, platform: { isActive: true } }, orders: { some: {} } },
    include: {
      service: { include: { platform: true } },
      orders: { take: 1, orderBy: { createdAt: "asc" }, select: { id: true, price: true } },
    },
    orderBy: { id: "asc" },
  });
  assert(candidate, "Sipariş snapshot testi için uygun aktif paket bulunamadı.");

  const admin = await prisma.adminUser.findFirst({ where: { isActive: true }, select: { id: true } });
  assert(admin, "Aktif admin bulunamadı.");

  const original = {
    name: candidate.name,
    quantity: candidate.quantity,
    price: candidate.price.toString(),
    referencePrice: candidate.referencePrice?.toString() ?? null,
    deliveryLabel: candidate.deliveryLabel,
    isActive: candidate.isActive,
    isPopular: candidate.isPopular,
  };
  const orderId = candidate.orders[0].id;
  const orderPrice = candidate.orders[0].price.toString();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  let sessionId = null;

  const patchPackage = async (body, expectedStatus = 200) => {
    const response = await fetch(`${baseUrl}/api/admin/packages/${candidate.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `sosyalio_admin_session=${token}`,
      },
      body: JSON.stringify(body),
    });
    assert(response.status === expectedStatus, `Paket API beklenen ${expectedStatus}, dönen ${response.status}.`);
    return response.json();
  };

  try {
    const session = await prisma.adminSession.create({ data: { adminId: admin.id, tokenHash, expiresAt: new Date(Date.now() + 10 * 60 * 1000) }, select: { id: true } });
    sessionId = session.id;

    const unauthorized = await fetch(`${baseUrl}/api/admin/packages/${candidate.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" });
    assert(unauthorized.status === 401, `Admin auth koruması beklenen 401 yerine ${unauthorized.status} döndürdü.`);

    await patchPackage({ ...original, quantity: 0 }, 400);
    await patchPackage({ ...original, price: "1.999" }, 400);
    await patchPackage({ ...original, price: "0" }, 400);

    const nextPrice = new Prisma.Decimal(original.price).plus("0.01").toFixed(2);
    const updated = await patchPackage({ ...original, price: nextPrice });
    assert(updated.package?.price === nextPrice, "API güncellenen hassas fiyatı döndürmedi.");

    const storefrontUrl = `${baseUrl}/${candidate.service.platform.slug}/${candidate.service.slug}`;
    const changedHtml = await (await fetch(storefrontUrl, { cache: "no-store" })).text();
    const formattedNextPrice = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(nextPrice));
    assert(changedHtml.includes(formattedNextPrice), "Yeni fiyat storefront HTML içinde görülmedi.");

    const snapshotAfterPrice = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, select: { price: true } });
    assert(snapshotAfterPrice.price.toString() === orderPrice, "Eski Order.price snapshot değeri değişti.");

    await patchPackage({ ...original, isActive: false });
    const inactiveHtml = await (await fetch(storefrontUrl, { cache: "no-store" })).text();
    assert(!inactiveHtml.includes(`/siparis?package=${candidate.id}\"`), "Pasif paket storefront üzerinde satın alınabilir kaldı.");

    await patchPackage(original);
    const restoredHtml = await (await fetch(storefrontUrl, { cache: "no-store" })).text();
    assert(restoredHtml.includes(`/siparis?package=${candidate.id}\"`), "Aktif paket storefront üzerinde geri görünmedi.");

    const finalOrder = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, select: { price: true } });
    assert(finalOrder.price.toString() === orderPrice, "Order.price snapshot final kontrolde değişti.");
    console.log("Catalog smoke: PASS (auth, validation, price, storefront, active/passive, order snapshot, restore)");
  } finally {
    await prisma.package.update({ where: { id: candidate.id }, data: original });
    if (sessionId) await prisma.adminSession.deleteMany({ where: { id: sessionId } });
    const restored = await prisma.package.findUniqueOrThrow({ where: { id: candidate.id } });
    assert(restored.price.toString() === original.price && restored.isActive === original.isActive, "Paket test sonrası özgün haline dönemedi.");
    console.log("Catalog smoke cleanup: PASS");
  }
}

main().catch((error) => {
  console.error(`Catalog smoke failed: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());

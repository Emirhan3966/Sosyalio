import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { Prisma, type Order, type PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SHOPIER_API_BASE = "https://api.shopier.com/v1";

export type ShopierMode = "disabled" | "mock" | "live";

type CheckoutOrder = Pick<Order, "id" | "orderNumber" | "platform" | "service" | "quantity" | "price" | "paymentCurrency">;

type ShopierOrderPayload = {
  id?: unknown;
  paymentStatus?: unknown;
  currency?: unknown;
  totals?: { total?: unknown };
  lineItems?: Array<{ productId?: unknown; quantity?: unknown; total?: unknown }>;
};

export type VerifiedPayment = {
  provider: "SHOPIER" | "MOCK";
  eventId: string;
  eventType: string;
  providerOrderId: string;
  checkoutReference: string;
  amount: string;
  currency: string;
  payloadHash: string;
};

export function getShopierMode(): ShopierMode {
  const mode = process.env.SHOPIER_MODE?.trim().toLowerCase();
  if (mode === "live") return "live";
  if (mode === "mock") return process.env.NODE_ENV === "production" ? "disabled" : "mock";
  return "disabled";
}

function getAppUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!value) throw new Error("NEXT_PUBLIC_APP_URL tanımlı değil.");
  const url = new URL(value);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") throw new Error("Production ortamında NEXT_PUBLIC_APP_URL HTTPS olmalı.");
  return url.origin;
}

function getLiveConfig() {
  const accessToken = process.env.SHOPIER_ACCESS_TOKEN?.trim();
  const imageUrl = process.env.SHOPIER_PRODUCT_IMAGE_URL?.trim();
  const webhookSecret = process.env.SHOPIER_WEBHOOK_SECRET?.trim();
  if (!accessToken || !imageUrl || !webhookSecret) throw new Error("Canlı Shopier yapılandırması eksik.");
  const parsedImageUrl = new URL(imageUrl);
  if (parsedImageUrl.protocol !== "https:") throw new Error("SHOPIER_PRODUCT_IMAGE_URL HTTPS olmalı.");
  return { accessToken, imageUrl, webhookSecret };
}

function money(value: { toString(): string } | string | number) {
  return Number(value.toString()).toFixed(2);
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function createShopierCheckout(order: CheckoutOrder) {
  const mode = getShopierMode();
  if (mode === "disabled") throw new Error("Shopier ödemeleri yapılandırılmamış veya bu ortamda devre dışı.");

  const provider = mode === "mock" ? "MOCK" : "SHOPIER";
  const existing = await prisma.paymentAttempt.findUnique({ where: { orderId: order.id } });
  if (existing) {
    if (existing.provider !== provider) throw new Error("Mevcut ödeme denemesi etkin ödeme sağlayıcısıyla eşleşmiyor.");
    return { url: existing.checkoutUrl, provider: existing.provider };
  }

  if (mode === "mock") {
    const token = randomBytes(32).toString("base64url");
    const checkoutReference = `mock_product_${randomUUID()}`;
    const url = `${getAppUrl()}/siparis/${encodeURIComponent(order.orderNumber)}/odeme/mock?token=${encodeURIComponent(token)}`;
    await prisma.$transaction([
      prisma.paymentAttempt.create({ data: { orderId: order.id, provider: "MOCK", checkoutReference, checkoutUrl: url, mockTokenHash: hashValue(token) } }),
      prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "PENDING", paymentProvider: "MOCK" } }),
    ]);
    return { url, provider: "MOCK" };
  }

  const { accessToken, imageUrl } = getLiveConfig();
  const response = await fetch(`${SHOPIER_API_BASE}/products`, {
    method: "POST",
    headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      title: `Sosyalio ${order.platform} ${order.service} - ${order.orderNumber}`,
      description: `${order.quantity.toLocaleString("tr-TR")} adet ${order.platform} ${order.service} hizmeti. Sipariş: ${order.orderNumber}`,
      type: "digital",
      media: [{ type: "image", url: imageUrl, placement: 1 }],
      priceData: { currency: order.paymentCurrency, price: money(order.price) },
      stockQuantity: 1,
      shippingPayer: "sellerPays",
      customListing: true,
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Shopier ödeme bağlantısı oluşturulamadı (${response.status}).`);

  const product = await response.json() as { id?: unknown; url?: unknown };
  if (typeof product.id !== "string" || typeof product.url !== "string") throw new Error("Shopier geçersiz ürün yanıtı döndürdü.");
  const checkoutUrl = new URL(product.url);
  if (checkoutUrl.protocol !== "https:" || !checkoutUrl.hostname.endsWith("shopier.com")) throw new Error("Shopier güvenli olmayan bir ödeme URL'si döndürdü.");

  await prisma.$transaction([
    prisma.paymentAttempt.create({ data: { orderId: order.id, provider: "SHOPIER", checkoutReference: product.id, checkoutUrl: checkoutUrl.toString() } }),
    prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "PENDING", paymentProvider: "SHOPIER" } }),
  ]);
  return { url: checkoutUrl.toString(), provider: "SHOPIER" };
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyShopierSignature(rawBody: string, suppliedSignature: string, secret: string) {
  const signature = suppliedSignature.trim().replace(/^sha256=/i, "");
  const digest = createHmac("sha256", secret).update(rawBody, "utf8");
  const hex = digest.digest("hex");
  const base64 = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  return safeEqual(signature.toLowerCase(), hex.toLowerCase()) || safeEqual(signature, base64);
}

function parseVerifiedPayload(payload: ShopierOrderPayload, rawBody: string, eventId: string, eventType: string, provider: "SHOPIER" | "MOCK"): VerifiedPayment {
  if (eventType !== "order.created") throw new Error("IGNORED_EVENT");
  if (typeof payload.id !== "string" || !payload.id.trim()) throw new Error("INVALID_PROVIDER_ORDER");
  if (payload.paymentStatus !== "paid") throw new Error("PAYMENT_NOT_PAID");
  if (typeof payload.currency !== "string") throw new Error("INVALID_CURRENCY");
  if (typeof payload.totals?.total !== "string") throw new Error("INVALID_AMOUNT");
  const productIds = payload.lineItems?.map((item) => item.productId).filter((item): item is string => typeof item === "string") ?? [];
  if (productIds.length !== 1) throw new Error("INVALID_CHECKOUT_REFERENCE");
  return { provider, eventId, eventType, providerOrderId: payload.id, checkoutReference: productIds[0], amount: payload.totals.total, currency: payload.currency, payloadHash: hashValue(rawBody) };
}

export async function verifyShopierWebhookPayload(rawBody: string, eventId: string, eventType: string) {
  const parsed = JSON.parse(rawBody) as ShopierOrderPayload;
  const mode = getShopierMode();
  if (mode === "mock") return parseVerifiedPayload(parsed, rawBody, eventId, eventType, "MOCK");
  if (mode !== "live") throw new Error("SHOPIER_DISABLED");

  const initial = parseVerifiedPayload(parsed, rawBody, eventId, eventType, "SHOPIER");
  const { accessToken } = getLiveConfig();
  const response = await fetch(`${SHOPIER_API_BASE}/orders/${encodeURIComponent(initial.providerOrderId)}`, { headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  if (!response.ok) throw new Error(`SHOPIER_API_${response.status}`);
  const verifiedPayload = await response.json() as ShopierOrderPayload;
  const verifiedRaw = JSON.stringify(verifiedPayload);
  const verified = parseVerifiedPayload(verifiedPayload, verifiedRaw, eventId, eventType, "SHOPIER");
  if (verified.providerOrderId !== initial.providerOrderId) throw new Error("PROVIDER_ORDER_MISMATCH");
  return { ...verified, payloadHash: initial.payloadHash };
}

function cents(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  return Math.round(Number(value) * 100);
}

export async function applyVerifiedPayment(payment: VerifiedPayment) {
  const attempt = await prisma.paymentAttempt.findUnique({ where: { checkoutReference: payment.checkoutReference }, include: { order: true } });
  if (!attempt || attempt.provider !== payment.provider) return { ok: false as const, status: 404, error: "Ödeme denemesi bulunamadı." };

  const order = attempt.order;
  const existingEvent = await prisma.paymentEvent.findUnique({ where: { provider_eventId: { provider: payment.provider, eventId: payment.eventId } } });
  if (existingEvent) {
    if (existingEvent.payloadHash !== payment.payloadHash) return { ok: false as const, status: 409, error: "Webhook kimliği farklı bir içerikle daha önce kullanılmış." };
    if (existingEvent.result === "PAID" || existingEvent.result === "ALREADY_PAID") return { ok: true as const, duplicate: true, orderNumber: order.orderNumber };
  }

  const expectedCents = cents(money(order.price));
  const receivedCents = cents(payment.amount);
  if (receivedCents === null || receivedCents !== expectedCents) {
    await recordRejectedEvent(payment, order.id, "REJECTED_AMOUNT");
    return { ok: false as const, status: 422, error: "Ödeme tutarı siparişle eşleşmiyor." };
  }
  if (payment.currency !== order.paymentCurrency) {
    await recordRejectedEvent(payment, order.id, "REJECTED_CURRENCY");
    return { ok: false as const, status: 422, error: "Ödeme para birimi siparişle eşleşmiyor." };
  }

  const existingTransaction = await prisma.order.findFirst({ where: { providerOrderId: payment.providerOrderId }, select: { id: true } });
  if (existingTransaction && existingTransaction.id !== order.id) {
    await recordRejectedEvent(payment, order.id, "REJECTED_DUPLICATE_TRANSACTION");
    return { ok: false as const, status: 409, error: "Bu ödeme işlemi başka bir siparişle eşleşmiş." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.paymentEvent.create({ data: { provider: payment.provider, eventId: payment.eventId, eventType: payment.eventType, providerOrderId: payment.providerOrderId, payloadHash: payment.payloadHash, result: order.paymentStatus === "PAID" ? "ALREADY_PAID" : "PAID", orderId: order.id, processedAt: new Date() } });
      if (order.paymentStatus !== "PAID") {
        await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "PAID", paymentProvider: payment.provider, providerOrderId: payment.providerOrderId, paymentAmount: payment.amount, paymentCurrency: payment.currency, paidAt: new Date() } });
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const duplicate = await prisma.paymentEvent.findUnique({ where: { provider_eventId: { provider: payment.provider, eventId: payment.eventId } } });
      if (duplicate?.payloadHash === payment.payloadHash) return { ok: true as const, duplicate: true, orderNumber: order.orderNumber };
      return { ok: false as const, status: 409, error: "Ödeme işlemi daha önce işlendi." };
    }
    throw error;
  }
  return { ok: true as const, duplicate: false, orderNumber: order.orderNumber };
}

async function recordRejectedEvent(payment: VerifiedPayment, orderId: string, result: string) {
  await prisma.paymentEvent.upsert({
    where: { provider_eventId: { provider: payment.provider, eventId: payment.eventId } },
    update: {},
    create: { provider: payment.provider, eventId: payment.eventId, eventType: payment.eventType, providerOrderId: payment.providerOrderId, payloadHash: payment.payloadHash, result, orderId, processedAt: new Date() },
  });
}

export async function confirmMockPayment(orderNumber: string, token: string) {
  if (getShopierMode() !== "mock") throw new Error("Mock ödeme modu aktif değil.");
  const order = await prisma.order.findUnique({ where: { orderNumber }, include: { paymentAttempt: true } });
  if (!order?.paymentAttempt || order.paymentAttempt.provider !== "MOCK" || !order.paymentAttempt.mockTokenHash || !safeEqual(hashValue(token), order.paymentAttempt.mockTokenHash)) throw new Error("Geçersiz mock ödeme bağlantısı.");
  return applyVerifiedPayment({ provider: "MOCK", eventId: `mock_event_${randomUUID()}`, eventType: "order.created", providerOrderId: `mock_order_${randomUUID()}`, checkoutReference: order.paymentAttempt.checkoutReference, amount: money(order.price), currency: order.paymentCurrency, payloadHash: hashValue(`${order.orderNumber}:${Date.now()}`) });
}

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  UNPAID: "Ödenmedi",
  PENDING: "Ödeme Bekleniyor",
  PAID: "Ödendi",
  FAILED: "Başarısız",
  REFUNDED: "İade Edildi",
};

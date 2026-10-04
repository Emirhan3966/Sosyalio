import { applyVerifiedPayment, getShopierMode, verifyShopierSignature, verifyShopierWebhookPayload } from "@/lib/payments/shopier";

const maximumWebhookAgeSeconds = 7 * 24 * 60 * 60;

export async function POST(request: Request) {
  const secret = process.env.SHOPIER_WEBHOOK_SECRET?.trim();
  if (!secret || getShopierMode() === "disabled") return Response.json({ error: "Shopier webhook yapılandırılmamış." }, { status: 503 });

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) return Response.json({ error: "Geçersiz içerik türü." }, { status: 415 });
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 1_000_000) return Response.json({ error: "Webhook gövdesi çok büyük." }, { status: 413 });

  const signature = request.headers.get("shopier-signature") ?? "";
  const eventId = request.headers.get("shopier-webhook-id")?.trim() ?? "";
  const eventType = request.headers.get("shopier-event")?.trim() ?? "";
  const timestamp = Number(request.headers.get("shopier-timestamp"));
  if (!signature || !eventId || eventId.length > 200 || !eventType || !Number.isInteger(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > maximumWebhookAgeSeconds) {
    return Response.json({ error: "Eksik veya geçersiz webhook başlıkları." }, { status: 400 });
  }

  const rawBody = await request.text();
  if (rawBody.length > 1_000_000) return Response.json({ error: "Webhook gövdesi çok büyük." }, { status: 413 });
  if (!verifyShopierSignature(rawBody, signature, secret)) return Response.json({ error: "Geçersiz webhook imzası." }, { status: 401 });
  if (eventType !== "order.created") return Response.json({ received: true, ignored: true });

  try {
    const verified = await verifyShopierWebhookPayload(rawBody, eventId, eventType);
    const result = await applyVerifiedPayment(verified);
    if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
    return Response.json({ received: true, duplicate: result.duplicate });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook işlenemedi.";
    if (message.startsWith("SHOPIER_API_")) return Response.json({ error: "Shopier API doğrulaması geçici olarak kullanılamıyor." }, { status: 503 });
    console.error("Shopier webhook doğrulama işlemi başarısız oldu.");
    return Response.json({ error: "Webhook verisi doğrulanamadı." }, { status: 422 });
  }
}

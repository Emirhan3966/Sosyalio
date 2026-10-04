import { isValidEmail } from "@/lib/order";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, RATE_LIMIT_SCOPES, rateLimitResponse } from "@/lib/rate-limit";

type LookupBody = { orderNumber?: unknown; email?: unknown };

export async function POST(request: Request) {
  const rateLimit = await consumeRateLimit(request, {
    scope: RATE_LIMIT_SCOPES.orderLookup,
    limit: 20,
    windowMs: 5 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return rateLimitResponse("Çok fazla sipariş sorgulama isteği yapıldı. Lütfen daha sonra tekrar deneyin.", rateLimit.retryAfterSeconds);
  }

  let body: LookupBody;

  try {
    body = await request.json() as LookupBody;
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const orderNumber = typeof body.orderNumber === "string" ? body.orderNumber.trim().toUpperCase() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!/^SYL-\d{6}-[A-F0-9]{6}$/.test(orderNumber) || !isValidEmail(email)) {
    return Response.json({ error: "Sipariş numarası ve e-posta bilgilerini kontrol edin." }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { orderNumber, customerEmail: email },
    select: { orderNumber: true, platform: true, service: true, quantity: true, price: true, status: true, paymentStatus: true, createdAt: true },
  });

  if (!order) {
    return Response.json({ error: "Bu bilgilerle eşleşen bir sipariş bulunamadı." }, { status: 404 });
  }

  return Response.json({
    ...order,
    price: order.price.toString(),
    createdAt: order.createdAt.toISOString(),
  });
}

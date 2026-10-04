import { createShopierCheckout } from "@/lib/payments/shopier";
import { prisma } from "@/lib/prisma";
import { isSameOrigin } from "@/lib/admin-auth";

export async function POST(request: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  if (!isSameOrigin(request)) return Response.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({ where: { orderNumber: orderNumber.toUpperCase() } });
  if (!order) return Response.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  if (order.paymentStatus === "PAID") return Response.json({ url: `/siparis/${order.orderNumber}/odeme/sonuc` });
  if (order.paymentStatus === "REFUNDED") return Response.json({ error: "İade edilmiş sipariş için yeniden ödeme alınamaz." }, { status: 409 });

  try {
    const checkout = await createShopierCheckout(order);
    return Response.json(checkout);
  } catch {
    console.error("Ödeme bağlantısı oluşturma işlemi başarısız oldu.");
    return Response.json(
      { ok: false, error: "Ödeme işlemi başlatılamadı. Lütfen tekrar deneyin." },
      { status: 503 },
    );
  }
}

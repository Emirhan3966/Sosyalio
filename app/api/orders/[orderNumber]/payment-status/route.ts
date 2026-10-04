import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({ where: { orderNumber: orderNumber.toUpperCase() }, select: { paymentStatus: true, paidAt: true } });
  if (!order) return Response.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  return Response.json({ paymentStatus: order.paymentStatus, paidAt: order.paidAt?.toISOString() ?? null }, { headers: { "Cache-Control": "no-store" } });
}

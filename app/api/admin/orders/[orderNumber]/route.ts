import { OrderStatus } from "@prisma/client";
import { isSameOrigin, requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const validStatuses = new Set<OrderStatus>(["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  if (!isSameOrigin(request)) return Response.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });
  if (!await requireAdminApi()) return Response.json({ error: "Yetkisiz erişim." }, { status: 401 });

  let body: { status?: unknown };
  try {
    body = await request.json() as { status?: unknown };
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const status = typeof body.status === "string" ? body.status as OrderStatus : null;
  if (!status || !validStatuses.has(status)) return Response.json({ error: "Geçersiz sipariş durumu." }, { status: 400 });

  const { orderNumber } = await params;
  const existingOrder = await prisma.order.findUnique({ where: { orderNumber: orderNumber.toUpperCase() }, select: { id: true } });
  if (!existingOrder) return Response.json({ error: "Sipariş bulunamadı." }, { status: 404 });

  const order = await prisma.order.update({
    where: { id: existingOrder.id },
    data: { status },
    select: { orderNumber: true, status: true, updatedAt: true },
  });
  return Response.json(order);
}

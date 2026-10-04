import { Prisma } from "@prisma/client";
import { isSameOrigin, requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type UpdatePackageBody = { quantity?: unknown; price?: unknown; referencePrice?: unknown; deliveryLabel?: unknown; isActive?: unknown; isPopular?: unknown };

function parsePrice(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const normalized = String(value).trim().replace(",", ".");
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(normalized)) return null;
  const number = Number(normalized);
  return number > 0 && number <= 10_000_000 ? normalized : null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return Response.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });
  if (!await requireAdminApi()) return Response.json({ error: "Yetkisiz erişim." }, { status: 401 });

  const { id } = await params;
  const packageId = Number(id);
  if (!Number.isInteger(packageId) || packageId <= 0) return Response.json({ error: "Geçersiz paket." }, { status: 400 });

  let body: UpdatePackageBody;
  try {
    body = await request.json() as UpdatePackageBody;
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const quantity = Number(body.quantity);
  const price = parsePrice(body.price);
  const referencePrice = body.referencePrice === "" || body.referencePrice == null ? null : parsePrice(body.referencePrice);
  const deliveryLabel = typeof body.deliveryLabel === "string" ? body.deliveryLabel.trim() : "";
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100_000_000 || !price || (body.referencePrice !== "" && body.referencePrice != null && !referencePrice) || deliveryLabel.length < 2 || deliveryLabel.length > 100 || typeof body.isActive !== "boolean" || typeof body.isPopular !== "boolean") {
    return Response.json({ error: "Paket bilgilerini kontrol edin." }, { status: 400 });
  }

  const existingPackage = await prisma.package.findUnique({ where: { id: packageId }, include: { service: { select: { name: true } } } });
  if (!existingPackage) return Response.json({ error: "Paket bulunamadı." }, { status: 404 });

  try {
    const updatedPackage = await prisma.package.update({
      where: { id: packageId },
      data: { name: `${quantity.toLocaleString("tr-TR")} ${existingPackage.service.name}`, quantity, price, referencePrice, deliveryLabel, isActive: body.isActive, isPopular: body.isPopular },
      select: { id: true, quantity: true, price: true, referencePrice: true, deliveryLabel: true, isActive: true, isPopular: true },
    });
    return Response.json({
      success: true,
      package: {
        ...updatedPackage,
        price: updatedPackage.price.toString(),
        referencePrice: updatedPackage.referencePrice?.toString() ?? null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "Bu hizmet için aynı miktarda bir paket zaten var." }, { status: 409 });
    }
    throw error;
  }
}

import { isSameOrigin, requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type CreatePackageBody = { serviceId?: unknown; quantity?: unknown; price?: unknown; referencePrice?: unknown; deliveryLabel?: unknown; isPopular?: unknown };

function parsePrice(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const normalized = String(value).trim().replace(",", ".");
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(normalized)) return null;
  const number = Number(normalized);
  return number > 0 && number <= 10_000_000 ? normalized : null;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });
  if (!await requireAdminApi()) return Response.json({ error: "Yetkisiz erişim." }, { status: 401 });

  let body: CreatePackageBody;
  try {
    body = await request.json() as CreatePackageBody;
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const serviceId = Number(body.serviceId);
  const quantity = Number(body.quantity);
  const price = parsePrice(body.price);
  const referencePrice = body.referencePrice === "" || body.referencePrice == null ? null : parsePrice(body.referencePrice);
  const deliveryLabel = typeof body.deliveryLabel === "string" ? body.deliveryLabel.trim() : "";
  if (!Number.isInteger(serviceId) || serviceId <= 0 || !Number.isInteger(quantity) || quantity <= 0 || quantity > 100_000_000 || !price || (body.referencePrice !== "" && body.referencePrice != null && !referencePrice) || deliveryLabel.length < 2 || deliveryLabel.length > 100) {
    return Response.json({ error: "Paket bilgilerini kontrol edin." }, { status: 400 });
  }

  const service = await prisma.service.findFirst({ where: { id: serviceId, isActive: true }, select: { id: true, name: true } });
  if (!service) return Response.json({ error: "Hizmet bulunamadı veya aktif değil." }, { status: 404 });

  const duplicate = await prisma.package.findUnique({ where: { serviceId_quantity: { serviceId, quantity } }, select: { id: true } });
  if (duplicate) return Response.json({ error: "Bu hizmet için aynı miktarda bir paket zaten var." }, { status: 409 });

  const createdPackage = await prisma.package.create({
    data: { serviceId, name: `${quantity.toLocaleString("tr-TR")} ${service.name}`, quantity, price, referencePrice, deliveryLabel, isPopular: body.isPopular === true, isActive: true },
    select: { id: true, quantity: true, price: true, referencePrice: true, deliveryLabel: true, isActive: true, isPopular: true },
  });
  return Response.json({
    package: {
      ...createdPackage,
      price: createdPackage.price.toString(),
      referencePrice: createdPackage.referencePrice?.toString() ?? null,
    },
  }, { status: 201 });
}

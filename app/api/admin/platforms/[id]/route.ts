import { Prisma } from "@prisma/client";
import { isSameOrigin, requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return Response.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });
  if (!await requireAdminApi()) return Response.json({ error: "Yetkisiz erişim." }, { status: 401 });
  const id = Number((await params).id);
  let body: { name?: unknown; slug?: unknown; description?: unknown; displayOrder?: unknown; isActive?: unknown };
  try { body = await request.json() as typeof body; } catch { return Response.json({ error: "Geçersiz istek." }, { status: 400 }); }
  const name = typeof body.name === "string" ? body.name.trim() : ""; const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : ""; const description = typeof body.description === "string" ? body.description.trim() : ""; const displayOrder = Number(body.displayOrder);
  if (!Number.isInteger(id) || id <= 0 || name.length < 2 || name.length > 60 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 60 || description.length < 5 || description.length > 240 || !Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 999 || typeof body.isActive !== "boolean") return Response.json({ error: "Platform bilgilerini kontrol edin." }, { status: 400 });
  try {
    const result = await prisma.servicePlatform.updateMany({ where: { id }, data: { name, slug, description, displayOrder, isActive: body.isActive } });
    return result.count ? Response.json({ success: true }) : Response.json({ error: "Platform bulunamadı." }, { status: 404 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return Response.json({ error: "Bu platform slug değeri zaten kullanılıyor." }, { status: 409 });
    throw error;
  }
}

import { Prisma } from "@prisma/client";
import { isSameOrigin, requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return Response.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });
  if (!await requireAdminApi()) return Response.json({ error: "Yetkisiz erişim." }, { status: 401 });
  const id = Number((await params).id);
  let body: { name?: unknown; slug?: unknown; description?: unknown; platformId?: unknown; isActive?: unknown };
  try { body = await request.json() as typeof body; } catch { return Response.json({ error: "Geçersiz istek." }, { status: 400 }); }
  const name = typeof body.name === "string" ? body.name.trim() : ""; const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : ""; const description = typeof body.description === "string" ? body.description.trim() : ""; const platformId = Number(body.platformId);
  if (!Number.isInteger(id) || id <= 0 || name.length < 2 || name.length > 80 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80 || description.length < 5 || description.length > 240 || !Number.isInteger(platformId) || platformId <= 0 || typeof body.isActive !== "boolean") return Response.json({ error: "Hizmet bilgilerini kontrol edin." }, { status: 400 });
  const platformExists = await prisma.servicePlatform.findUnique({ where: { id: platformId }, select: { id: true } });
  if (!platformExists) return Response.json({ error: "Platform bulunamadı." }, { status: 404 });
  const slugConflict = await prisma.service.findFirst({
    where: { platformId, slug, id: { not: id } },
    select: { id: true },
  });
  if (slugConflict) return Response.json({ error: "Bu platformda aynı slug değerine sahip bir hizmet var." }, { status: 409 });
  try {
    const result = await prisma.service.updateMany({ where: { id }, data: { name, slug, description, platformId, isActive: body.isActive } });
    return result.count ? Response.json({ success: true }) : Response.json({ error: "Hizmet bulunamadı." }, { status: 404 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return Response.json({ error: "Bu platformda aynı slug değerine sahip bir hizmet var." }, { status: 409 });
    throw error;
  }
}

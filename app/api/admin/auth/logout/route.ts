import { destroyAdminSession, isSameOrigin, requireAdminApi } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });
  const admin = await requireAdminApi();
  if (!admin) return Response.json({ error: "Yetkisiz erişim." }, { status: 401 });
  await destroyAdminSession();
  return Response.json({ success: true });
}

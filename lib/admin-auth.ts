import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { isRequestSameOrigin } from "./request-origin";

export const ADMIN_SESSION_COOKIE = "sosyalio_admin_session";
export const ADMIN_SESSION_DURATION_SECONDS = 60 * 60 * 8;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAdminSession(adminId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_DURATION_SECONDS * 1000);

  await prisma.$transaction([
    prisma.adminSession.deleteMany({ where: { adminId } }),
    prisma.adminSession.create({ data: { adminId, tokenHash: hashToken(token), expiresAt } }),
    prisma.adminUser.update({ where: { id: adminId }, data: { lastLoginAt: new Date() } }),
  ]);

  return { token, expiresAt };
}

export async function setAdminSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
    maxAge: ADMIN_SESSION_DURATION_SECONDS,
    priority: "high",
  });
}

export async function getAdminSession() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  return prisma.adminSession.findFirst({
    where: { tokenHash: hashToken(token), expiresAt: { gt: new Date() }, admin: { isActive: true } },
    select: { id: true, expiresAt: true, admin: { select: { id: true, email: true } } },
  });
}

export async function requireAdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session.admin;
}

export async function requireAdminApi() {
  const session = await getAdminSession();
  return session?.admin ?? null;
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) await prisma.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  cookieStore.set(ADMIN_SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
}

export function isSameOrigin(request: Request) {
  return isRequestSameOrigin(request);
}

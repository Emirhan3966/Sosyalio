import { compare, hash } from "bcryptjs";
import { createAdminSession, isSameOrigin, setAdminSessionCookie } from "@/lib/admin-auth";
import { isValidEmail } from "@/lib/order";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, consumeRateLimit, RATE_LIMIT_SCOPES, rateLimitResponse, resetRateLimit } from "@/lib/rate-limit";

type LoginBody = { email?: unknown; password?: unknown };

const dummyHash = hash("not-a-real-admin-password", 12);
const loginPolicy = { scope: RATE_LIMIT_SCOPES.adminLogin, limit: 5, windowMs: 10 * 60 * 1000 };
const tooManyAttemptsMessage = "Çok fazla giriş denemesi yapıldı. Lütfen daha sonra tekrar deneyin.";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });

  const currentAttempt = await checkRateLimit(request, loginPolicy);
  if (!currentAttempt.allowed) return rateLimitResponse(tooManyAttemptsMessage, currentAttempt.retryAfterSeconds);

  let body: LoginBody;
  try {
    body = await request.json() as LoginBody;
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!isValidEmail(email) || password.length < 12 || password.length > 200) {
    const attempt = await consumeRateLimit(request, loginPolicy);
    if (!attempt.allowed) return rateLimitResponse(tooManyAttemptsMessage, attempt.retryAfterSeconds);
    return Response.json({ error: "E-posta veya parola hatalı." }, { status: 401 });
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  const validPassword = await compare(password, admin?.passwordHash ?? await dummyHash);
  if (!admin || !admin.isActive || !validPassword) {
    const attempt = await consumeRateLimit(request, loginPolicy);
    if (!attempt.allowed) return rateLimitResponse(tooManyAttemptsMessage, attempt.retryAfterSeconds);
    return Response.json({ error: "E-posta veya parola hatalı." }, { status: 401 });
  }

  await resetRateLimit(request, RATE_LIMIT_SCOPES.adminLogin);
  const session = await createAdminSession(admin.id);
  await setAdminSessionCookie(session.token, session.expiresAt);
  return Response.json({ success: true });
}

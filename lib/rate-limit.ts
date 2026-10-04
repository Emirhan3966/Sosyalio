import { createHmac, randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export const RATE_LIMIT_SCOPES = {
  adminLogin: "admin-login-failed",
  orderCreate: "order-create",
  orderLookup: "order-lookup",
} as const;

type RateLimitPolicy = {
  scope: string;
  limit: number;
  windowMs: number;
};

type RateLimitRow = {
  attempts: number;
  expiresAt: Date;
};

export type RateLimitResult = {
  allowed: boolean;
  attempts: number;
  remaining: number;
  retryAfterSeconds: number;
};

function getHashSecret() {
  const secret = process.env.RATE_LIMIT_HASH_SECRET?.trim();
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV !== "production") return "sosyalio-development-rate-limit-key";
  throw new Error("RATE_LIMIT_HASH_SECRET eksik veya çok kısa.");
}

function getClientIp(request: Request) {
  const candidate = request.headers.get("x-nf-client-connection-ip")?.trim();
  return candidate && isIP(candidate) ? candidate : "netlify-ip-unavailable";
}

export function getRateLimitKeyHash(request: Request, scope: string) {
  return createHmac("sha256", getHashSecret())
    .update(`${scope}\0${getClientIp(request)}`)
    .digest("hex");
}

function toResult(row: RateLimitRow | null, limit: number, now: Date): RateLimitResult {
  if (!row || row.expiresAt <= now) {
    return { allowed: true, attempts: 0, remaining: limit, retryAfterSeconds: 0 };
  }

  return {
    allowed: row.attempts < limit,
    attempts: row.attempts,
    remaining: Math.max(0, limit - row.attempts),
    retryAfterSeconds: Math.max(1, Math.ceil((row.expiresAt.getTime() - now.getTime()) / 1000)),
  };
}

export async function checkRateLimit(request: Request, policy: RateLimitPolicy) {
  const now = new Date();
  const row = await prisma.rateLimitEntry.findFirst({
    where: {
      scope: policy.scope,
      keyHash: getRateLimitKeyHash(request, policy.scope),
      expiresAt: { gt: now },
    },
    select: { attempts: true, expiresAt: true },
  });

  return toResult(row, policy.limit, now);
}

export async function consumeRateLimit(request: Request, policy: RateLimitPolicy) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + policy.windowMs);
  const keyHash = getRateLimitKeyHash(request, policy.scope);

  const rows = await prisma.$queryRaw<RateLimitRow[]>(Prisma.sql`
    INSERT INTO "RateLimitEntry" (
      "id", "scope", "keyHash", "attempts", "windowStart", "expiresAt", "createdAt", "updatedAt"
    )
    VALUES (${randomUUID()}, ${policy.scope}, ${keyHash}, 1, ${now}, ${expiresAt}, ${now}, ${now})
    ON CONFLICT ("scope", "keyHash") DO UPDATE SET
      "attempts" = CASE
        WHEN "RateLimitEntry"."expiresAt" <= ${now} THEN 1
        ELSE "RateLimitEntry"."attempts" + 1
      END,
      "windowStart" = CASE
        WHEN "RateLimitEntry"."expiresAt" <= ${now} THEN ${now}
        ELSE "RateLimitEntry"."windowStart"
      END,
      "expiresAt" = CASE
        WHEN "RateLimitEntry"."expiresAt" <= ${now} THEN ${expiresAt}
        ELSE "RateLimitEntry"."expiresAt"
      END,
      "updatedAt" = ${now}
    RETURNING "attempts", "expiresAt"
  `);

  const row = rows[0] ?? { attempts: 1, expiresAt };
  return {
    allowed: row.attempts <= policy.limit,
    attempts: row.attempts,
    remaining: Math.max(0, policy.limit - row.attempts),
    retryAfterSeconds: Math.max(1, Math.ceil((row.expiresAt.getTime() - now.getTime()) / 1000)),
  };
}

export async function resetRateLimit(request: Request, scope: string) {
  await prisma.rateLimitEntry.deleteMany({
    where: { scope, keyHash: getRateLimitKeyHash(request, scope) },
  });
}

export function rateLimitResponse(error: string, retryAfterSeconds: number) {
  return Response.json(
    { ok: false, error },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(Math.max(1, retryAfterSeconds)),
      },
    },
  );
}

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { isRequestSameOrigin } from "./request-origin";

export const SUPPORT_VISITOR_COOKIE = "sosyalio_support_visitor";
export const SUPPORT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const SUPPORT_MESSAGE_MAX_LENGTH = 1000;
export const SUPPORT_VISITOR_NAME_MIN_LENGTH = 2;
export const SUPPORT_VISITOR_NAME_MAX_LENGTH = 30;
export const SUPPORT_POLL_INTERVAL_MS = 4000;

export type SupportMessageDto = {
  id: string;
  sender: "VISITOR" | "ADMIN" | "SYSTEM";
  content: string;
  createdAt: string;
  readAt: string | null;
};

export function serializeSupportMessage(message: {
  id: string;
  sender: "VISITOR" | "ADMIN" | "SYSTEM";
  content: string;
  createdAt: Date;
  readAt: Date | null;
}): SupportMessageDto {
  return {
    ...message,
    createdAt: message.createdAt.toISOString(),
    readAt: message.readAt?.toISOString() ?? null,
  };
}

export function normalizeSupportContent(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").trim();
}

export function normalizeSupportVisitorName(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length < SUPPORT_VISITOR_NAME_MIN_LENGTH || normalized.length > SUPPORT_VISITOR_NAME_MAX_LENGTH) return null;
  if (/[<>\u0000-\u001f\u007f]/u.test(normalized)) return null;
  return normalized;
}

export function supportGreeting(visitorName: string) {
  return `Merhaba ${visitorName} 👋 Nasıl yardımcı olabilirim?`;
}

export async function getVisitorId() {
  return (await cookies()).get(SUPPORT_VISITOR_COOKIE)?.value ?? null;
}

export async function setVisitorId(visitorId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SUPPORT_VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SUPPORT_COOKIE_MAX_AGE,
    priority: "high",
  });
}

export function createVisitorId() {
  return randomBytes(32).toString("base64url");
}

export async function getVisitorConversation(visitorId: string | null) {
  if (!visitorId) return null;
  return prisma.supportConversation.findFirst({
    where: { visitorId, status: "OPEN" },
    orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
  });
}

export function isSameOriginRequest(request: Request) {
  return isRequestSameOrigin(request);
}

export function noStoreJson(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  const status = init?.status ?? 200;
  const payload = typeof data === "object" && data !== null
    ? { ok: status < 400, ...data }
    : { ok: status < 400, data };
  return NextResponse.json(payload, { ...init, headers });
}

export async function handleSupportRoute(label: string, handler: () => Promise<Response>) {
  try {
    return await handler();
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : null;
    const name = error instanceof Error ? error.name : "UnknownError";
    console.error(`[support] ${label} başarısız (${code ?? name}).`);
    return noStoreJson({ error: "Canlı destek servisine şu anda ulaşılamıyor. Lütfen tekrar deneyin." }, { status: 500 });
  }
}

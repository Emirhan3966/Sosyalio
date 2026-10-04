import type { SupportConversationStatus } from "@prisma/client";
import { isSameOrigin, requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { handleSupportRoute, noStoreJson, serializeSupportMessage } from "@/lib/support";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleSupportRoute("GET /api/admin/support/conversations/[id]", async () => {
    if (!await requireAdminApi()) return noStoreJson({ error: "Yetkisiz erişim." }, { status: 401 });
    const { id } = await params;
    const conversation = await prisma.supportConversation.findUnique({
      where: { id },
      include: { messages: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
    });
    if (!conversation) return noStoreJson({ error: "Konuşma bulunamadı." }, { status: 404 });

  const readAt = new Date();
  await prisma.supportMessage.updateMany({ where: { conversationId: id, sender: "VISITOR", readAt: null }, data: { readAt } });

    return noStoreJson({
      conversation: { id: conversation.id, visitorName: conversation.visitorName, status: conversation.status, createdAt: conversation.createdAt.toISOString() },
      messages: conversation.messages.map((message) => serializeSupportMessage({ ...message, readAt: message.sender === "VISITOR" && !message.readAt ? readAt : message.readAt })),
    });
  });
}

type PatchBody = { status?: unknown };

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleSupportRoute("PATCH /api/admin/support/conversations/[id]", async () => {
    if (!await requireAdminApi()) return noStoreJson({ error: "Yetkisiz erişim." }, { status: 401 });
    if (!isSameOrigin(request)) return noStoreJson({ error: "Geçersiz istek kaynağı." }, { status: 403 });

  let body: PatchBody;
  try {
    body = await request.json() as PatchBody;
  } catch {
    return noStoreJson({ error: "Geçersiz istek." }, { status: 400 });
  }
  const status = body.status as SupportConversationStatus;
  if (status !== "OPEN" && status !== "CLOSED") return noStoreJson({ error: "Geçersiz konuşma durumu." }, { status: 400 });

  const { id } = await params;
    const conversation = await prisma.supportConversation.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!conversation) return noStoreJson({ error: "Konuşma bulunamadı." }, { status: 404 });
    if (conversation.status === "CLOSED" && status === "OPEN") {
      return noStoreJson({ error: "Kapalı konuşmalar arşiv kaydıdır ve yeniden açılamaz." }, { status: 409 });
    }
    const updated = await prisma.supportConversation.update({ where: { id }, data: { status }, select: { id: true, status: true } });
    return noStoreJson({ conversation: updated });
  });
}

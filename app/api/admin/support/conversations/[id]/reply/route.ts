import { isSameOrigin, requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { handleSupportRoute, noStoreJson, normalizeSupportContent, serializeSupportMessage, SUPPORT_MESSAGE_MAX_LENGTH } from "@/lib/support";

type ReplyBody = { content?: unknown };

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleSupportRoute("POST /api/admin/support/conversations/[id]/reply", async () => {
    if (!await requireAdminApi()) return noStoreJson({ error: "Yetkisiz erişim." }, { status: 401 });
    if (!isSameOrigin(request)) return noStoreJson({ error: "Geçersiz istek kaynağı." }, { status: 403 });

  let body: ReplyBody;
  try {
    body = await request.json() as ReplyBody;
  } catch {
    return noStoreJson({ error: "Geçersiz istek." }, { status: 400 });
  }
  const content = normalizeSupportContent(body.content);
  if (!content) return noStoreJson({ error: "Mesaj boş olamaz." }, { status: 400 });
  if (content.length > SUPPORT_MESSAGE_MAX_LENGTH) return noStoreJson({ error: `Mesaj en fazla ${SUPPORT_MESSAGE_MAX_LENGTH} karakter olabilir.` }, { status: 400 });

  const { id } = await params;
  const exists = await prisma.supportConversation.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!exists) return noStoreJson({ error: "Konuşma bulunamadı." }, { status: 404 });
  if (exists.status === "CLOSED") return noStoreJson({ error: "Kapalı konuşmaya yanıt gönderilemez." }, { status: 409 });

  const now = new Date();
  const [, message] = await prisma.$transaction([
    prisma.supportConversation.update({ where: { id }, data: { lastMessageAt: now } }),
    prisma.supportMessage.create({ data: { conversationId: id, sender: "ADMIN", content, createdAt: now, readAt: now }, select: { id: true, sender: true, content: true, createdAt: true, readAt: true } }),
  ]);
    return noStoreJson({ message: serializeSupportMessage(message), status: "OPEN" }, { status: 201 });
  });
}

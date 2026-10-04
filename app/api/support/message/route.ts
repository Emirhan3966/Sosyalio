import { prisma } from "@/lib/prisma";
import { getVisitorConversation, getVisitorId, handleSupportRoute, isSameOriginRequest, noStoreJson, normalizeSupportContent, serializeSupportMessage, SUPPORT_MESSAGE_MAX_LENGTH } from "@/lib/support";

type MessageBody = { content?: unknown };

export async function POST(request: Request) {
  return handleSupportRoute("POST /api/support/message", async () => {
    if (!isSameOriginRequest(request)) return noStoreJson({ error: "Geçersiz istek kaynağı." }, { status: 403 });

  const conversation = await getVisitorConversation(await getVisitorId());
  if (!conversation) return noStoreJson({ error: "Önce destek görüşmesini başlatın." }, { status: 404 });

  let body: MessageBody;
  try {
    body = await request.json() as MessageBody;
  } catch {
    return noStoreJson({ error: "Geçersiz istek." }, { status: 400 });
  }

  const content = normalizeSupportContent(body.content);
  if (!content) return noStoreJson({ error: "Mesaj boş olamaz." }, { status: 400 });
  if (content.length > SUPPORT_MESSAGE_MAX_LENGTH) return noStoreJson({ error: `Mesaj en fazla ${SUPPORT_MESSAGE_MAX_LENGTH} karakter olabilir.` }, { status: 400 });

  const minuteAgo = new Date(Date.now() - 60_000);
  const [recentCount, latestMessage] = await Promise.all([
    prisma.supportMessage.count({ where: { conversationId: conversation.id, sender: "VISITOR", createdAt: { gte: minuteAgo } } }),
    prisma.supportMessage.findFirst({ where: { conversationId: conversation.id, sender: "VISITOR" }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
  ]);
  if (recentCount >= 10 || (latestMessage && Date.now() - latestMessage.createdAt.getTime() < 800)) {
    return noStoreJson({ error: "Çok hızlı mesaj gönderiyorsunuz. Lütfen kısa bir süre bekleyin." }, { status: 429 });
  }

  const now = new Date();
  const [, message] = await prisma.$transaction([
    prisma.supportConversation.update({ where: { id: conversation.id }, data: { lastMessageAt: now } }),
    prisma.supportMessage.create({
      data: { conversationId: conversation.id, sender: "VISITOR", content, createdAt: now },
      select: { id: true, sender: true, content: true, createdAt: true, readAt: true },
    }),
  ]);

    return noStoreJson({ message: serializeSupportMessage(message), status: "OPEN" }, { status: 201 });
  });
}

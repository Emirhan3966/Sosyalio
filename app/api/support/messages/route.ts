import { getVisitorConversation, getVisitorId, handleSupportRoute, noStoreJson, serializeSupportMessage } from "@/lib/support";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleSupportRoute("GET /api/support/messages", async () => {
    const conversation = await getVisitorConversation(await getVisitorId());
    if (!conversation) return noStoreJson({ error: "Konuşma bulunamadı." }, { status: 404 });

  const after = new URL(request.url).searchParams.get("after")?.slice(0, 40);
  const cursor = after ? await prisma.supportMessage.findFirst({
    where: { id: after, conversationId: conversation.id },
    select: { id: true, createdAt: true },
  }) : null;

  const messages = await prisma.supportMessage.findMany({
    where: {
      conversationId: conversation.id,
      ...(cursor ? { createdAt: { gte: cursor.createdAt }, NOT: { id: cursor.id } } : {}),
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 100,
    select: { id: true, sender: true, content: true, createdAt: true, readAt: true },
  });

    return noStoreJson({
      status: conversation.status,
      messages: messages.map(serializeSupportMessage),
    });
  });
}

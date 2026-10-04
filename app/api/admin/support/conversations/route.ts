import type { Prisma, SupportConversationStatus } from "@prisma/client";
import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { handleSupportRoute, noStoreJson } from "@/lib/support";

export const dynamic = "force-dynamic";

const validStatuses = new Set<SupportConversationStatus>(["OPEN", "CLOSED"]);

export async function GET(request: Request) {
  return handleSupportRoute("GET /api/admin/support/conversations", async () => {
    if (!await requireAdminApi()) return noStoreJson({ error: "Yetkisiz erişim." }, { status: 401 });

  const searchParams = new URL(request.url).searchParams;
  if (searchParams.get("summary") === "1") {
    const unreadTotal = await prisma.supportMessage.count({ where: { sender: "VISITOR", readAt: null } });
    return noStoreJson({ unreadTotal });
  }

  const requestedStatus = searchParams.get("status") as SupportConversationStatus | null;
  const where: Prisma.SupportConversationWhereInput = requestedStatus && validStatuses.has(requestedStatus) ? { status: requestedStatus } : {};

  const [conversations, unreadTotal] = await Promise.all([
    prisma.supportConversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      take: 100,
      select: {
        id: true,
        visitorName: true,
        status: true,
        lastMessageAt: true,
        messages: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1, select: { content: true, sender: true } },
        _count: { select: { messages: { where: { sender: "VISITOR", readAt: null } } } },
      },
    }),
    prisma.supportMessage.count({ where: { sender: "VISITOR", readAt: null } }),
  ]);

    return noStoreJson({
      unreadTotal,
      conversations: conversations.map((conversation) => ({
        id: conversation.id,
        visitorName: conversation.visitorName,
        status: conversation.status,
        lastMessageAt: conversation.lastMessageAt.toISOString(),
        lastMessage: conversation.messages[0] ?? null,
        unreadCount: conversation._count.messages,
      })),
    });
  });
}

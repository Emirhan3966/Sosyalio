import { Prisma } from "@prisma/client";
import { createVisitorId, getVisitorConversation, getVisitorId, handleSupportRoute, isSameOriginRequest, noStoreJson, normalizeSupportVisitorName, serializeSupportMessage, setVisitorId, supportGreeting } from "@/lib/support";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleSupportRoute("GET /api/support/conversation", async () => {
    const visitorId = await getVisitorId();
    const conversation = await getVisitorConversation(visitorId);

    if (!conversation) return noStoreJson({ conversation: null, messages: [] });

    const messages = await prisma.supportMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, sender: true, content: true, createdAt: true, readAt: true },
    });

    return noStoreJson({
      conversation: { id: conversation.id, visitorName: conversation.visitorName, status: conversation.status },
      messages: messages.map(serializeSupportMessage),
    });
  });
}

export async function POST(request: Request) {
  return handleSupportRoute("POST /api/support/conversation", async () => {
    if (!isSameOriginRequest(request)) return noStoreJson({ error: "Geçersiz istek kaynağı." }, { status: 403 });
    let visitorId = await getVisitorId();
    let shouldSetCookie = false;

    if (!visitorId) {
      visitorId = createVisitorId();
      shouldSetCookie = true;
    }

    let created = false;
    let conversation = await prisma.supportConversation.findFirst({
      where: { visitorId, status: "OPEN" },
      orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
      include: { messages: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
    });

    if (!conversation) {
      let body: { visitorName?: unknown };
      try {
        body = await request.json() as { visitorName?: unknown };
      } catch {
        return noStoreJson({ error: "Geçersiz istek." }, { status: 400 });
      }
      const visitorName = normalizeSupportVisitorName(body.visitorName);
      if (!visitorName) return noStoreJson({ error: "Ad veya kullanıcı adı 2–30 karakter olmalı ve geçersiz karakter içermemelidir." }, { status: 400 });

      try {
        conversation = await prisma.supportConversation.create({
          data: {
            visitorId,
            visitorName,
            messages: { create: { sender: "SYSTEM", content: supportGreeting(visitorName), readAt: new Date() } },
          },
          include: { messages: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
        });
        created = true;
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
        conversation = await prisma.supportConversation.findFirst({
          where: { visitorId, status: "OPEN" },
          orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
          include: { messages: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
        });
        if (!conversation) throw error;
      }
    }

    if (shouldSetCookie) await setVisitorId(visitorId);

    return noStoreJson({
      conversation: { id: conversation.id, visitorName: conversation.visitorName, status: conversation.status },
      messages: conversation.messages.map(serializeSupportMessage),
    }, { status: created ? 201 : 200 });
  });
}

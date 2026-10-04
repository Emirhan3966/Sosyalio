-- CreateTable
CREATE TABLE "SupportConversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastMessageAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" DATETIME,
    CONSTRAINT "SupportMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "SupportConversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SupportConversation_visitorId_key" ON "SupportConversation"("visitorId");

-- CreateIndex
CREATE INDEX "SupportConversation_status_lastMessageAt_idx" ON "SupportConversation"("status", "lastMessageAt");

-- CreateIndex
CREATE INDEX "SupportConversation_lastMessageAt_idx" ON "SupportConversation"("lastMessageAt");

-- CreateIndex
CREATE INDEX "SupportMessage_conversationId_createdAt_idx" ON "SupportMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportMessage_conversationId_sender_readAt_idx" ON "SupportMessage"("conversationId", "sender", "readAt");

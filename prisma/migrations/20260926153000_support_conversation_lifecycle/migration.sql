-- Closed support conversations remain immutable history, while the same
-- visitor may start a new conversation later.
DROP INDEX "SupportConversation_visitorId_key";

CREATE INDEX "SupportConversation_visitorId_status_lastMessageAt_idx"
ON "SupportConversation"("visitorId", "status", "lastMessageAt");

-- Protect against concurrent requests creating two active conversations for
-- the same opaque visitor cookie. PostgreSQL partial indexes are not currently
-- expressible in Prisma schema syntax, so this invariant lives in SQL.
CREATE UNIQUE INDEX "SupportConversation_one_open_per_visitor_key"
ON "SupportConversation"("visitorId")
WHERE "status" = 'OPEN';

-- Preserve all existing support history while adding a display-only visitor name.
-- The temporary default backfills existing rows safely; new rows must provide a name.
ALTER TABLE "SupportConversation"
ADD COLUMN "visitorName" TEXT NOT NULL DEFAULT 'Ziyaretçi';

ALTER TABLE "SupportConversation"
ALTER COLUMN "visitorName" DROP DEFAULT;

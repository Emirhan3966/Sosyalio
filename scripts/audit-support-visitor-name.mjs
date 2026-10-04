import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const [summary] = await prisma.$queryRawUnsafe(`
    SELECT
      (SELECT COUNT(*)::int FROM "SupportConversation") AS conversations,
      (SELECT COUNT(*)::int FROM "SupportMessage") AS messages,
      (SELECT COUNT(*)::int FROM "SupportConversation" WHERE "status" = 'OPEN') AS open,
      (SELECT COUNT(*)::int FROM "SupportConversation" WHERE "status" = 'CLOSED') AS closed,
      (SELECT COUNT(*)::int FROM "SupportMessage" m LEFT JOIN "SupportConversation" c ON c."id" = m."conversationId" WHERE c."id" IS NULL) AS orphans,
      (SELECT COUNT(*)::int FROM (SELECT "visitorId" FROM "SupportConversation" WHERE "status" = 'OPEN' GROUP BY "visitorId" HAVING COUNT(*) > 1) d) AS duplicate_open_visitors,
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'SupportConversation' AND column_name = 'visitorName') AS visitor_name_column,
      EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE migration_name = '20260926213000_support_visitor_name' AND finished_at IS NOT NULL AND rolled_back_at IS NULL) AS migration_applied
  `);
  const names = summary.visitor_name_column
    ? (await prisma.$queryRawUnsafe(`SELECT COUNT(*) FILTER (WHERE "visitorName" IS NULL OR LENGTH(BTRIM("visitorName")) < 2 OR LENGTH("visitorName") > 30)::int AS invalid_names, COUNT(*) FILTER (WHERE "visitorName" = 'Ziyaretçi')::int AS fallback_names FROM "SupportConversation"`))[0]
    : null;
  console.log(JSON.stringify({ ...summary, ...(names ?? {}) }));
  if (summary.orphans !== 0 || summary.duplicate_open_visitors !== 0) process.exitCode = 2;
} finally {
  await prisma.$disconnect();
}

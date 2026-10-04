import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const tables = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = current_schema()
    ORDER BY table_name
  `;
  const applicationTables = tables
    .map((row) => row.table_name)
    .filter((name) => name !== "_prisma_migrations");
  console.log(JSON.stringify({ tableCount: tables.length, applicationTables }));
} finally {
  await prisma.$disconnect();
}

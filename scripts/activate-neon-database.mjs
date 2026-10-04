import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const envPath = resolve(process.argv[2] ?? ".env");
const source = await readFile(envPath, "utf8");
const newline = source.includes("\r\n") ? "\r\n" : "\n";
const lines = source.split(/\r?\n/);

function findAssignment(name) {
  const expression = new RegExp(`^\\s*${name}\\s*=`);
  const index = lines.findIndex((line) => expression.test(line));
  if (index < 0) throw new Error(`${name} .env içinde bulunamadı.`);
  const rawValue = lines[index].slice(lines[index].indexOf("=") + 1).trim();
  if (!rawValue || rawValue === '""' || rawValue === "''") throw new Error(`${name} boş.`);
  return { index, rawValue };
}

const runtime = findAssignment("NEON_DATABASE_URL");
const database = findAssignment("DATABASE_URL");
lines[database.index] = `DATABASE_URL=${runtime.rawValue}`;
await writeFile(envPath, lines.join(newline), "utf8");

const verified = (await readFile(envPath, "utf8")).split(/\r?\n/);
const valueOf = (name) => verified.find((line) => new RegExp(`^\\s*${name}\\s*=`).test(line))?.split(/=(.*)/s)[1]?.trim();
if (!valueOf("DATABASE_URL") || valueOf("DATABASE_URL") !== valueOf("NEON_DATABASE_URL")) {
  throw new Error("DATABASE_URL Neon pooled değerine geçirilemedi.");
}
if (!valueOf("NEON_DIRECT_URL")) throw new Error("NEON_DIRECT_URL korunamadı.");

console.log(JSON.stringify({ databaseUrlUsesNeonPooled: true, directUrlPreserved: true }));

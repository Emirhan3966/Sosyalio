import { cp, lstat, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stagingRoot = path.join(projectRoot, ".deployment", "source");

const excludedRootEntries = new Set([
  ".deployment",
  ".git",
  ".netlify",
  ".next",
  "build",
  "node_modules",
  "out",
]);

const excludedPrismaEntries = new Set([
  "backups",
  "migration-data",
  "migrations_sqlite_archive",
]);

function normalized(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function shouldExclude(relativePath) {
  const portablePath = normalized(relativePath);
  const parts = portablePath.split("/");
  const name = parts.at(-1) ?? "";

  if (parts.length === 1 && excludedRootEntries.has(name)) return true;
  if (portablePath === "scripts/rotate-admin-credentials.mjs" || portablePath === "scripts/verify-admin-rotation.mjs") return true;
  if (name === ".env" || name.startsWith(".env.")) return true;
  if (/\.(?:db|db-journal|sqlite|sqlite3)$/i.test(name)) return true;
  if (/^(?:npm|yarn)-debug\.log/i.test(name) || name === ".DS_Store" || name === "tsconfig.tsbuildinfo") return true;
  if (parts[0] === "prisma" && excludedPrismaEntries.has(parts[1] ?? "")) return true;
  return false;
}

async function copyTree(sourceDir, destinationDir, relativeDir = "") {
  await mkdir(destinationDir, { recursive: true });
  for (const entry of await readdir(sourceDir, { withFileTypes: true })) {
    const relativePath = path.join(relativeDir, entry.name);
    if (shouldExclude(relativePath)) continue;

    const sourcePath = path.join(sourceDir, entry.name);
    const destinationPath = path.join(destinationDir, entry.name);
    const stats = await lstat(sourcePath);
    if (stats.isSymbolicLink()) throw new Error(`Deployment paketi sembolik bağlantı içeremez: ${normalized(relativePath)}`);
    if (stats.isDirectory()) await copyTree(sourcePath, destinationPath, relativePath);
    else if (stats.isFile()) await cp(sourcePath, destinationPath);
  }
}

async function verifyTree(directory, relativeDir = "") {
  let fileCount = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relativePath = path.join(relativeDir, entry.name);
    if (shouldExclude(relativePath)) throw new Error(`Deployment paketinde yasaklı dosya bulundu: ${normalized(relativePath)}`);
    if (entry.isDirectory()) fileCount += await verifyTree(path.join(directory, entry.name), relativePath);
    else if (entry.isFile()) fileCount += 1;
  }
  return fileCount;
}

await rm(path.dirname(stagingRoot), { recursive: true, force: true });
await copyTree(projectRoot, stagingRoot);
const fileCount = await verifyTree(stagingRoot);

console.log(`Güvenli deployment staging klasörü hazır: .deployment/source (${fileCount} dosya).`);
console.log("Deploy sırasında proje kökü yerine yalnızca bu klasörün içeriğini kullanın.");

import { cp, lstat, readdir, realpath, rm } from "node:fs/promises";
import path from "node:path";

const standaloneRoot = path.resolve(".next", "standalone");

async function dereferenceLinks(directory) {
  let replacements = 0;

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    const stats = await lstat(entryPath);

    if (stats.isSymbolicLink()) {
      const sourcePath = await realpath(entryPath);
      await rm(entryPath, { force: true });
      await cp(sourcePath, entryPath, { recursive: true, dereference: true, force: true });
      replacements += 1;
      continue;
    }

    if (stats.isDirectory()) replacements += await dereferenceLinks(entryPath);
  }

  return replacements;
}

if (process.platform === "win32") {
  const replacements = await dereferenceLinks(standaloneRoot);
  console.log(`Netlify Windows paketlemesi için ${replacements} bağlantı gerçek dosyalarla değiştirildi.`);
}

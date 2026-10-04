import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const problems = [];

async function page(path) {
  const response = await fetch(new URL(path, baseUrl));
  const html = await response.text();
  if (!response.ok) problems.push(`${path}: HTTP ${response.status}`);
  return html;
}

function trNumber(value) {
  return value.toLocaleString("tr-TR");
}

function trMoney(value) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(value));
}

async function main() {
  const platforms = await prisma.servicePlatform.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    include: {
      services: {
        where: { isActive: true },
        include: { packages: { where: { isActive: true }, orderBy: { quantity: "asc" }, take: 1 } },
      },
    },
  });

  const home = await page("/");
  for (const platform of platforms) {
    if (!home.includes(`href="/${platform.slug}"`)) problems.push(`/: ${platform.slug} bağlantısı bulunamadı`);
    await page(`/${platform.slug}`);
  }

  let checkedServices = 0;
  for (const platform of platforms) {
    for (const service of platform.services) {
      const item = service.packages[0];
      if (!item) {
        problems.push(`${platform.slug}/${service.slug}: aktif paket yok`);
        continue;
      }
      const servicePath = `/${platform.slug}/${service.slug}`;
      const serviceHtml = await page(servicePath);
      if (!serviceHtml.includes(`package=${item.id}`)) problems.push(`${servicePath}: paket seçim bağlantısı bulunamadı`);
      if (!serviceHtml.includes(trNumber(item.quantity))) problems.push(`${servicePath}: miktar görünmüyor`);
      if (!serviceHtml.includes(trMoney(item.price))) problems.push(`${servicePath}: fiyat görünmüyor`);
      checkedServices += 1;
    }
  }

  const flowKeys = ["instagram/turk-takipci", "tiktok/takipci", "youtube/abone", "twitter/takipci"];
  for (const key of flowKeys) {
    const [platformSlug, serviceSlug] = key.split("/");
    const service = platforms.find((item) => item.slug === platformSlug)?.services.find((item) => item.slug === serviceSlug);
    const item = service?.packages[0];
    if (!item) {
      problems.push(`${key}: akış paketi bulunamadı`);
      continue;
    }
    const orderHtml = await page(`/siparis?package=${item.id}`);
    if (!orderHtml.includes(trNumber(item.quantity))) problems.push(`${key}: sipariş ekranına miktar aktarılmadı`);
    if (!orderHtml.includes(trMoney(item.price))) problems.push(`${key}: sipariş ekranına fiyat aktarılmadı`);
  }

  console.log(`${platforms.length} platform, ${checkedServices} hizmet sayfası ve ${flowKeys.length} sipariş başlangıcı kontrol edildi.`);
  if (problems.length) {
    console.error(`${problems.length} vitrin smoke-test sorunu bulundu:`);
    for (const problem of problems) console.error(`- ${problem}`);
    process.exitCode = 1;
  } else {
    console.log("Ana sayfa, platform, hizmet ve seçili paket aktarımı kontrolleri başarılı.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());

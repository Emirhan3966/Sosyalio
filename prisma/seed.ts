import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { bayigramCatalog } from "./bayigram-catalog.ts";

const prisma = new PrismaClient();
type PackageSeed = { quantity: number; price: string; referencePrice?: string; delivery: string; popular?: boolean };
type ServiceSeed = { name: string; slug: string; description: string; packages: PackageSeed[] };

function decimalPrice(value: string | number) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new Error(`Geçersiz seed fiyatı: ${value}`);
  return number.toFixed(2);
}

function packs(quantities: number[], prices: string[], references: string[], delivery = "0–6 saat"): PackageSeed[] {
  const popularIndex = Math.floor((quantities.length - 1) / 2);
  return quantities.map((quantity, index) => {
    const price = decimalPrice(prices[index]);
    let referencePrice = decimalPrice(references[index]);
    if (Number(referencePrice) <= Number(price)) referencePrice = decimalPrice(Number(price) * 1.12);
    return { quantity, price, referencePrice, delivery, popular: index === popularIndex };
  });
}

const standardQuantities = [100, 250, 500, 1000, 2500, 5000, 10000];
const seedData: Array<{ name: string; slug: string; description: string; displayOrder: number; services: ServiceSeed[] }> = [
  { name: "Instagram", slug: "instagram", description: "Takipçi, beğeni, izlenme ve etkileşim hizmetleri", displayOrder: 1, services: [
    { name: "Takipçi", slug: "takipci", description: "Profiliniz için ekonomik takipçi paketleri", packages: packs(standardQuantities, ["49.99", "119.99", "234.99", "449.99", "1099.99", "2099.99", "3999.99"], ["57.99", "139.99", "269.99", "509.99", "1249.99", "2349.99", "4499.99"]) },
    { name: "Türk Takipçi", slug: "turk-takipci", description: "Türkiye odaklı profillerden takipçi desteği", packages: packs(standardQuantities, ["49.90", "119.90", "229.90", "439.90", "1049.90", "1999.90", "3899.90"], ["54.99", "132.90", "254.90", "489.90", "1169.90", "2219.90", "4329.90"], "0–12 saat") },
    { name: "Düşmeyen Takipçi", slug: "dusmeyen-takipci", description: "Daha stabil teslimat yaklaşımına sahip takipçi paketleri", packages: packs(standardQuantities, ["59.99", "144.99", "279.99", "529.99", "1249.99", "2399.99", "4599.99"], ["69.99", "164.99", "319.99", "599.99", "1399.99", "2699.99", "5199.99"], "0–12 saat") },
    { name: "Yabancı Takipçi", slug: "yabanci-takipci", description: "Global profiller için takipçi destek paketleri", packages: packs(standardQuantities, ["19.99", "44.99", "79.99", "149.99", "349.99", "659.99", "1249.99"], ["24.99", "54.99", "94.99", "174.99", "409.99", "769.99", "1449.99"], "0–12 saat") },
    { name: "Beğeni", slug: "begeni", description: "Gönderileriniz için beğeni desteği", packages: packs(standardQuantities, ["1.59", "3.90", "6.90", "12.90", "29.90", "54.90", "99.90"], ["1.75", "4.50", "7.90", "14.50", "33.50", "61.00", "111.00"], "0–2 saat") },
    { name: "Türk Beğeni", slug: "turk-begeni", description: "Türkiye odaklı profillerden gönderi beğenisi", packages: packs(standardQuantities, ["7.99", "16.99", "29.99", "54.99", "129.99", "239.99", "449.99"], ["9.99", "19.99", "34.99", "64.99", "149.99", "279.99", "519.99"], "0–4 saat") },
    { name: "Reels Beğeni", slug: "reels-begeni", description: "Reels içerikleriniz için beğeni paketleri", packages: packs(standardQuantities, ["2.90", "5.90", "9.90", "18.90", "44.90", "84.90", "159.90"], ["3.50", "6.90", "11.00", "21.00", "49.90", "94.90", "179.90"], "0–2 saat") },
    { name: "İzlenme", slug: "izlenme", description: "Video içerikleriniz için izlenme desteği", packages: packs([1000, 2500, 5000, 10000, 25000, 50000, 100000], ["2.49", "5.90", "9.90", "18.99", "44.90", "84.90", "159.90"], ["2.75", "6.50", "11.00", "22.00", "49.90", "94.90", "179.90"], "0–1 saat") },
    { name: "Reels İzlenme", slug: "reels-izlenme", description: "Reels videoları için izlenme paketleri", packages: packs([1000, 2500, 5000, 10000, 25000, 50000, 100000], ["3.90", "8.90", "14.90", "27.90", "64.90", "119.90", "229.90"], ["4.50", "9.90", "16.50", "31.00", "72.00", "134.00", "255.00"], "0–1 saat") },
    { name: "Yorum", slug: "yorum", description: "Gönderileriniz için gerçekçi yorum paketleri", packages: packs([10, 25, 50, 100, 250], ["13.49", "29.90", "54.90", "99.90", "229.90"], ["14.99", "33.50", "61.00", "111.00", "255.00"], "0–6 saat") },
    { name: "Türk Yorum", slug: "turk-yorum", description: "Türkçe içerikler için yorum destek paketleri", packages: packs([10, 25, 50, 100, 250], ["29.99", "64.99", "119.99", "219.99", "519.99"], ["34.99", "74.99", "139.99", "259.99", "599.99"], "0–12 saat") },
    { name: "Otomatik Yorum", slug: "otomatik-yorum", description: "Yeni gönderiler için tanımlanabilen yorum paketleri", packages: packs([10, 25, 50, 100], ["34.99", "79.99", "149.99", "279.99"], ["39.99", "94.99", "174.99", "329.99"], "0–12 saat") },
    { name: "Kaydetme", slug: "kaydetme", description: "Gönderilerinizin kaydedilme etkileşimini destekleyin", packages: packs(standardQuantities, ["5.90", "11.90", "19.90", "34.90", "79.90", "149.90", "279.90"], ["6.90", "13.50", "22.00", "39.00", "89.00", "167.00", "311.00"], "0–3 saat") },
    { name: "Gönderi Paylaşma", slug: "gonderi-paylasma", description: "Gönderileriniz için paylaşım etkileşimi", packages: packs(standardQuantities, ["6.90", "14.90", "24.90", "44.90", "99.90", "189.90", "359.90"], ["7.90", "16.50", "28.00", "49.90", "111.00", "211.00", "399.90"], "0–3 saat") },
    { name: "Profil Ziyareti", slug: "profil-ziyareti", description: "Profil görünürlüğünü destekleyen ziyaret paketleri", packages: packs(standardQuantities, ["7.89", "17.90", "29.90", "54.90", "129.90", "239.90", "449.90"], ["8.75", "19.90", "33.50", "61.00", "144.00", "267.00", "499.90"], "0–2 saat") },
    { name: "Hikaye İzlenme", slug: "hikaye-izlenme", description: "Hikayeleriniz için izlenme desteği", packages: packs(standardQuantities, ["4.90", "9.90", "17.90", "29.90", "69.90", "129.90", "239.90"], ["5.50", "11.00", "19.90", "33.50", "78.00", "144.00", "267.00"], "0–2 saat") },
    { name: "Hikaye Anket Oyu", slug: "hikaye-anket-oyu", description: "Hikaye anketleri için oy etkileşimi paketleri", packages: packs([100, 250, 500, 1000, 2500], ["12.99", "27.99", "49.99", "89.99", "209.99"], ["14.99", "32.99", "59.99", "104.99", "244.99"], "0–4 saat") },
  ] },
  { name: "TikTok", slug: "tiktok", description: "Takipçi, beğeni ve video izlenme hizmetleri", displayOrder: 2, services: [
    { name: "Takipçi", slug: "takipci", description: "TikTok hesabınız için takipçi desteği", packages: packs(standardQuantities, ["14.99", "34.99", "64.99", "119.99", "279.99", "529.99", "999.99"], ["17.99", "39.99", "74.99", "139.99", "319.99", "599.99", "1149.99"]) },
    { name: "Türk Takipçi", slug: "turk-takipci", description: "Türkiye odaklı TikTok takipçi paketleri", packages: packs(standardQuantities, ["59.99", "139.99", "259.99", "489.99", "1149.99", "2199.99", "4199.99"], ["69.99", "159.99", "299.99", "559.99", "1329.99", "2529.99", "4829.99"], "0–12 saat") },
    { name: "Beğeni", slug: "begeni", description: "TikTok videolarınız için beğeni paketleri", packages: packs(standardQuantities, ["4.90", "9.90", "17.90", "29.90", "69.90", "129.90", "239.90"], ["5.90", "11.00", "19.90", "34.90", "79.90", "149.90", "269.90"]) },
    { name: "İzlenme", slug: "izlenme", description: "Videolarınız için izlenme desteği", packages: packs([1000, 2500, 5000, 10000, 25000, 50000, 100000], ["3.90", "7.90", "14.90", "24.90", "59.90", "109.90", "199.90"], ["4.50", "8.90", "16.90", "28.00", "67.00", "123.00", "223.00"], "0–2 saat") },
    { name: "Video İzlenme", slug: "video-izlenme", description: "Tekil TikTok videoları için izlenme paketleri", packages: packs([1000, 2500, 5000, 10000, 25000], ["4.99", "9.99", "17.99", "29.99", "69.99"], ["5.99", "11.99", "20.99", "34.99", "79.99"], "0–2 saat") },
    { name: "Yorum", slug: "yorum", description: "TikTok videoları için yorum desteği", packages: packs([10, 25, 50, 100, 250], ["19.99", "44.99", "79.99", "149.99", "349.99"], ["24.99", "54.99", "94.99", "174.99", "409.99"], "0–6 saat") },
    { name: "Paylaşım", slug: "paylasim", description: "Videolar için paylaşım etkileşimi paketleri", packages: packs(standardQuantities, ["6.99", "14.99", "24.99", "44.99", "99.99", "189.99", "359.99"], ["7.99", "17.99", "29.99", "52.99", "119.99", "219.99", "419.99"], "0–3 saat") },
    { name: "Kaydetme", slug: "kaydetme", description: "Videolar için kaydetme etkileşimi paketleri", packages: packs(standardQuantities, ["5.99", "12.99", "21.99", "39.99", "89.99", "169.99", "319.99"], ["6.99", "14.99", "25.99", "46.99", "104.99", "199.99", "369.99"], "0–3 saat") },
    { name: "Profil Görüntülenme", slug: "profil-goruntulenme", description: "Profil görünürlüğünü destekleyen görüntülenme paketleri", packages: packs(standardQuantities, ["7.99", "17.99", "29.99", "54.99", "129.99", "239.99", "449.99"], ["9.99", "21.99", "34.99", "64.99", "149.99", "279.99", "519.99"], "0–4 saat") },
  ] },
  { name: "YouTube", slug: "youtube", description: "Abone, beğeni ve video izlenme hizmetleri", displayOrder: 3, services: [
    { name: "Abone", slug: "abone", description: "YouTube kanalınız için abone paketleri", packages: packs([100, 250, 500, 1000, 2500, 5000], ["79.90", "179.90", "329.90", "599.90", "1399.90", "2699.90"], ["89.90", "199.90", "369.90", "669.90", "1549.90", "2999.90"], "0–24 saat") },
    { name: "Türk Abone", slug: "turk-abone", description: "Türkiye odaklı kanal abone paketleri", packages: packs([100, 250, 500, 1000, 2500], ["129.99", "299.99", "559.99", "1049.99", "2499.99"], ["149.99", "349.99", "649.99", "1199.99", "2899.99"], "0–24 saat") },
    { name: "Beğeni", slug: "begeni", description: "Videolarınız için beğeni desteği", packages: packs(standardQuantities, ["14.90", "29.90", "54.90", "99.90", "229.90", "429.90", "799.90"], ["16.90", "34.90", "61.00", "111.00", "255.00", "479.90", "889.90"], "0–6 saat") },
    { name: "İzlenme", slug: "izlenme", description: "Videolarınız için izlenme paketleri", packages: packs([1000, 2500, 5000, 10000, 25000], ["99.90", "229.90", "429.90", "799.90", "1899.90"], ["111.00", "255.00", "479.90", "889.90", "2119.90"], "0–24 saat") },
    { name: "Shorts İzlenme", slug: "shorts-izlenme", description: "YouTube Shorts içerikleri için izlenme paketleri", packages: packs([1000, 2500, 5000, 10000, 25000], ["39.99", "89.99", "169.99", "319.99", "749.99"], ["46.99", "104.99", "199.99", "369.99", "869.99"], "0–12 saat") },
    { name: "Yorum", slug: "yorum", description: "Videolar için yorum desteği", packages: packs([10, 25, 50, 100, 250], ["34.99", "79.99", "149.99", "279.99", "649.99"], ["39.99", "94.99", "174.99", "329.99", "749.99"], "0–12 saat") },
    { name: "Paylaşım", slug: "paylasim", description: "Videolar için paylaşım etkileşimi", packages: packs([100, 250, 500, 1000, 2500], ["19.99", "44.99", "79.99", "149.99", "349.99"], ["24.99", "54.99", "94.99", "174.99", "409.99"], "0–6 saat") },
    { name: "Kanal Görüntülenme", slug: "kanal-goruntulenme", description: "Kanal sayfası görünürlüğünü destekleyen paketler", packages: packs([1000, 2500, 5000, 10000, 25000], ["49.99", "109.99", "199.99", "379.99", "899.99"], ["59.99", "129.99", "239.99", "449.99", "1049.99"], "0–12 saat") },
  ] },
  { name: "X / Twitter", slug: "twitter", description: "Takipçi, beğeni ve görüntülenme hizmetleri", displayOrder: 4, services: [
    { name: "Takipçi", slug: "takipci", description: "X hesabınız için takipçi desteği", packages: packs([100, 250, 500, 1000, 2500], ["19.99", "44.99", "84.99", "159.99", "374.99"], ["24.99", "54.99", "99.99", "184.99", "429.99"], "0–12 saat") },
    { name: "Türk Takipçi", slug: "turk-takipci", description: "Türkiye odaklı X takipçi paketleri", packages: packs([100, 250, 500, 1000, 2500], ["89.99", "209.99", "389.99", "729.99", "1699.99"], ["104.99", "244.99", "449.99", "839.99", "1949.99"], "0–12 saat") },
    { name: "Beğeni", slug: "begeni", description: "Gönderileriniz için beğeni paketleri", packages: packs(standardQuantities, ["10.99", "24.99", "44.99", "79.99", "184.99", "349.99", "649.99"], ["12.99", "29.99", "52.99", "94.99", "214.99", "399.99", "749.99"], "0–3 saat") },
    { name: "Görüntülenme", slug: "goruntulenme", description: "Gönderileriniz için görüntülenme desteği", packages: packs([1000, 2500, 5000, 10000, 25000, 50000], ["0.99", "1.99", "2.99", "4.99", "11.99", "21.99"], ["1.99", "2.99", "4.99", "7.99", "17.99", "32.99"], "0–2 saat") },
    { name: "Retweet", slug: "retweet", description: "Gönderiler için retweet etkileşimi paketleri", packages: packs([100, 250, 500, 1000, 2500], ["14.99", "34.99", "64.99", "119.99", "279.99"], ["17.99", "39.99", "74.99", "139.99", "329.99"], "0–4 saat") },
    { name: "Yorum", slug: "yorum", description: "X gönderileri için yorum desteği", packages: packs([10, 25, 50, 100, 250], ["9.99", "22.99", "44.99", "84.99", "199.99"], ["10.99", "29.99", "52.99", "99.99", "229.99"], "0–12 saat") },
  ] },
  ...[
    ["Facebook", "facebook", "Sayfa takipçi, beğeni ve video izlenme hizmetleri", ["Sayfa Takipçisi", "Gönderi Beğenisi", "Video İzlenme", "Yorum"]],
    ["Spotify", "spotify", "Takipçi, dinlenme ve çalma listesi hizmetleri", ["Takipçi", "Parça Dinlenme", "Çalma Listesi Takipçisi"]],
    ["Telegram", "telegram", "Kanal üyesi ve gönderi görüntülenme hizmetleri", ["Kanal Üyesi", "Gönderi Görüntülenme", "Reaksiyon"]],
    ["Discord", "discord", "Sunucu üyesi ve topluluk destek hizmetleri", ["Sunucu Üyesi", "Çevrimiçi Üye"]],
    ["Twitch", "twitch", "Takipçi ve yayın izleyici hizmetleri", ["Takipçi", "Canlı İzleyici", "Video Görüntülenme"]],
    ["LinkedIn", "linkedin", "Takipçi ve gönderi etkileşim hizmetleri", ["Takipçi", "Gönderi Beğenisi", "Gösterim"]],
    ["Threads", "threads", "Takipçi ve gönderi beğeni hizmetleri", ["Takipçi", "Beğeni", "Gönderi Etkileşimi"]],
    ["Pinterest", "pinterest", "Takipçi, kaydetme ve pin etkileşim hizmetleri", ["Takipçi", "Pin Kaydetme", "Pin Etkileşimi"]],
    ["Snapchat", "snapchat", "Hikaye görüntülenme ve içerik etkileşim hizmetleri", ["Hikaye İzlenme", "İçerik Etkileşimi"]],
  ].map(([name, slug, description, names], index) => ({ name: name as string, slug: slug as string, description: description as string, displayOrder: index + 5, services: (names as string[]).map((serviceName, serviceIndex) => ({ name: serviceName, slug: serviceName.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), description: `${name} ${serviceName.toLocaleLowerCase("tr-TR")} hizmeti`, packages: packs(standardQuantities.slice(0, 5), ["19.90", "44.90", "79.90", "149.90", "349.90"].map((price) => (Number(price) + serviceIndex * 10).toFixed(2)), ["22.00", "49.90", "89.90", "169.90", "389.90"].map((price) => (Number(price) + serviceIndex * 11).toFixed(2)), "0–12 saat") })) })),
];

async function main() {
  const legacyX = await prisma.servicePlatform.findUnique({ where: { slug: "x" } });
  const twitter = await prisma.servicePlatform.findUnique({ where: { slug: "twitter" } });
  if (legacyX && !twitter) await prisma.servicePlatform.update({ where: { id: legacyX.id }, data: { slug: "twitter", name: "X / Twitter" } });

  for (const platformData of seedData) {
    const platform = await prisma.servicePlatform.upsert({ where: { slug: platformData.slug }, update: { name: platformData.name, description: platformData.description, displayOrder: platformData.displayOrder, isActive: true }, create: { name: platformData.name, slug: platformData.slug, description: platformData.description, displayOrder: platformData.displayOrder } });
    for (const serviceData of platformData.services) {
      const service = await prisma.service.upsert({ where: { platformId_slug: { platformId: platform.id, slug: serviceData.slug } }, update: { name: serviceData.name, description: serviceData.description, isActive: true }, create: { platformId: platform.id, name: serviceData.name, slug: serviceData.slug, description: serviceData.description } });
      await prisma.package.updateMany({ where: { serviceId: service.id }, data: { isPopular: false } });
      for (const packageData of serviceData.packages) {
        await prisma.package.upsert({ where: { serviceId_quantity: { serviceId: service.id, quantity: packageData.quantity } }, update: { name: `${packageData.quantity.toLocaleString("tr-TR")} ${serviceData.name}`, deliveryLabel: packageData.delivery, isPopular: packageData.popular === true, isActive: true }, create: { serviceId: service.id, name: `${packageData.quantity.toLocaleString("tr-TR")} ${serviceData.name}`, quantity: packageData.quantity, price: packageData.price, referencePrice: packageData.referencePrice, deliveryLabel: packageData.delivery, isPopular: packageData.popular === true } });
      }
    }
  }

  for (const [catalogKey, catalogService] of Object.entries(bayigramCatalog)) {
    const [platformSlug, serviceSlug] = catalogKey.split("/");
    const service = await prisma.service.findFirst({
      where: { slug: serviceSlug, platform: { slug: platformSlug } },
      include: { packages: { orderBy: { quantity: "asc" } } },
    });
    if (!service) throw new Error(`Bayigram kataloğu için hizmet bulunamadı: ${catalogKey}`);

    const existingByQuantity = new Map(service.packages.map((item) => [item.quantity, item]));
    const previousPopular = service.packages.find((item) => item.isPopular)?.quantity;
    const sourceQuantities = new Set<number>(catalogService.packages.map((item) => item.quantity));
    const popularQuantity = previousPopular && sourceQuantities.has(previousPopular) ? previousPopular : undefined;
    const fallbackDelivery = service.packages[0]?.deliveryLabel ?? "0–12 saat";

    // Paketleri silmeyerek geçmiş sipariş ilişkilerini koru; kaynakta olmayanları pasifleştir.
    await prisma.package.updateMany({
      where: { serviceId: service.id },
      data: { isActive: false, isPopular: false },
    });

    for (const packageData of catalogService.packages) {
      const existing = existingByQuantity.get(packageData.quantity);
      const data = {
        name: `${packageData.quantity.toLocaleString("tr-TR")} ${service.name}`,
        price: packageData.price,
        referencePrice: packageData.referencePrice,
        deliveryLabel: existing?.deliveryLabel ?? fallbackDelivery,
        isPopular: packageData.quantity === popularQuantity,
        isActive: true,
      };
      await prisma.package.upsert({
        where: { serviceId_quantity: { serviceId: service.id, quantity: packageData.quantity } },
        update: data,
        create: { serviceId: service.id, quantity: packageData.quantity, ...data },
      });
    }
  }

  await prisma.service.updateMany({
    where: { platform: { slug: "snapchat" }, slug: "takipci" },
    data: { isActive: false },
  });

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase(); const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) throw new Error("ADMIN_EMAIL geçerli bir e-posta adresi olmalı.");
    if (adminPassword.length < 12) throw new Error("ADMIN_PASSWORD en az 12 karakter olmalı.");
    const existingAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail }, select: { id: true } });
    if (!existingAdmin) await prisma.adminUser.create({ data: { email: adminEmail, passwordHash: await hash(adminPassword, 12) } });
  }
  console.log(`Seed tamamlandı: ${seedData.length} platform ve düzenlenebilir hizmet paketleri hazır.`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });

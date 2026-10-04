import "dotenv/config";

const baseUrl = "https://bayigram.com";

const matchedServices = {
  "instagram/takipci": "/instagram-ucuz-takipci-satin-al/",
  "instagram/turk-takipci": "/instagram-turk-takipci-satin-al/",
  "instagram/dusmeyen-takipci": "/instagram-dusmeyen-takipci-satin-al/",
  "instagram/yabanci-takipci": "/instagram-yabanci-takipci-satin-al/",
  "instagram/begeni": "/instagram-begeni-satin-al/",
  "instagram/reels-begeni": "/instagram-reels-begeni-satin-al/",
  "instagram/izlenme": "/instagram-video-izlenme-satin-al/",
  "instagram/reels-izlenme": "/instagram-reels-izlenme-satin-al/",
  "instagram/hikaye-izlenme": "/instagram-hikaye-izlenme-satin-al/",
  "instagram/yorum": "/instagram-yorum-satin-al/",
  "instagram/otomatik-yorum": "/instagram-otomatik-yorum-satin-al/",
  "instagram/kaydetme": "/instagram-kaydetme-satin-al/",
  "instagram/gonderi-paylasma": "/instagram-gonderi-paylasma-satin-al/",
  "instagram/profil-ziyareti": "/instagram-profil-ziyareti-satin-al/",
  "instagram/hikaye-anket-oyu": "/instagram-anket-oyu-satin-al/",
  "tiktok/takipci": "/tiktok-takipci-satin-al/",
  "tiktok/begeni": "/tiktok-begeni-satin-al/",
  "tiktok/izlenme": "/tiktok-izlenme-satin-al/",
  "tiktok/yorum": "/tiktok-yorum-satin-al/",
  "tiktok/paylasim": "/tiktok-paylasim-satin-al/",
  "tiktok/kaydetme": "/tiktok-kaydetme-satin-al/",
  "youtube/abone": "/youtube-abone-satin-al/",
  "youtube/izlenme": "/youtube-izlenme-satin-al/",
  "youtube/shorts-izlenme": "/youtube-shorts-izlenme-satin-al/",
  "youtube/begeni": "/youtube-begeni-satin-al/",
  "youtube/yorum": "/youtube-yorum-satin-al/",
  "youtube/paylasim": "/youtube-paylasim-satin-al/",
  "twitter/takipci": "/twitter-takipci-satin-al/",
  "twitter/begeni": "/twitter-begeni-satin-al/",
  "twitter/retweet": "/twitter-retweet-satin-al/",
  "twitter/goruntulenme": "/twitter-tweet-goruntulenme-satin-al/",
  "twitter/yorum": "/twitter-yorum-satin-al/",
  "facebook/gonderi-begenisi": "/facebook-begeni-satin-al/",
  "facebook/video-izlenme": "/facebook-video-izlenme-satin-al/",
  "facebook/yorum": "/facebook-yorum-satin-al/",
  "spotify/takipci": "/spotify-takipci-satin-al/",
  "spotify/parca-dinlenme": "/spotify-dinlenme-satin-al/",
  "spotify/calma-listesi-takipcisi": "/spotify-calma-listesi-takipci-satin-al/",
  "telegram/kanal-uyesi": "/telegram-kanal-uyesi-satin-al/",
  "telegram/gonderi-goruntulenme": "/telegram-goruntulenme-satin-al/",
  "telegram/reaksiyon": "/telegram-reaksiyon-satin-al/",
  "discord/sunucu-uyesi": "/discord-sunucu-uyesi-satin-al/",
  "twitch/takipci": "/twitch-takipci-satin-al/",
  "twitch/canli-izleyici": "/twitch-canli-yayin-izleyici-satin-al/",
  "twitch/video-goruntulenme": "/twitch-video-izlenme-satin-al/",
  "linkedin/takipci": "/linkedin-takipci-satin-al/",
  "linkedin/gonderi-begenisi": "/linkedin-begeni-satin-al/",
  "threads/takipci": "/threads-takipci-satin-al/",
  "threads/begeni": "/threads-begeni-satin-al/",
  "pinterest/takipci": "/pinterest-takipci-satin-al/",
  "pinterest/pin-kaydetme": "/pinterest-repin-satin-al/",
  "snapchat/hikaye-izlenme": "/snapchat-hikaye-goruntulenme-satin-al/",
};

const unmatchedServices = {
  "instagram/turk-begeni": "Kaynakta Türk beğeni paketi bulunmuyor.",
  "instagram/turk-yorum": "Kaynakta Türk yorum paketi bulunmuyor.",
  "tiktok/turk-takipci": "Kaynakta Türk takipçi paketi bulunmuyor.",
  "tiktok/video-izlenme": "Genel izlenme var; ayrı video izlenme hizmeti yok.",
  "tiktok/profil-goruntulenme": "Kaynakta profil görüntülenme hizmeti yok.",
  "youtube/turk-abone": "Kaynakta Türk abone paketi bulunmuyor.",
  "youtube/kanal-goruntulenme": "Kaynakta kanal görüntülenme hizmeti yok.",
  "twitter/turk-takipci": "Kaynakta Türk takipçi paketi bulunmuyor.",
  "facebook/sayfa-takipcisi": "Kaynak hizmet adı sayfa takipçisiyle birebir eşleşmiyor.",
  "discord/cevrimici-uye": "Kaynakta çevrimiçi üye hizmeti yok.",
  "linkedin/gosterim": "Kaynakta gönderi gösterimi hizmeti yok.",
  "threads/gonderi-etkilesimi": "Kaynakta birleşik gönderi etkileşimi hizmeti yok.",
  "pinterest/pin-etkilesimi": "Kaynakta birleşik pin etkileşimi hizmeti yok.",
  "snapchat/icerik-etkilesimi": "Kaynakta birleşik içerik etkileşimi hizmeti yok.",
};

function asTypes(value) {
  return Array.isArray(value)
    ? value.includes("Product")
    : String(value || "").toLowerCase() === "product";
}

function visit(value, products) {
  if (!value || typeof value !== "object") return;
  if (asTypes(value["@type"]) && value.offers) products.push(value);
  for (const child of Object.values(value)) visit(child, products);
}

function priceToCents(value) {
  const normalized = String(value).trim().replace(",", ".");
  const [whole, fraction = ""] = normalized.split(".");
  return BigInt(whole) * 100n + BigInt(`${fraction}00`.slice(0, 2));
}

function centsToDecimal(cents) {
  const whole = cents / 100n;
  const fraction = String(cents % 100n).padStart(2, "0");
  return `${whole}.${fraction}`;
}

function salePrice(referencePrice) {
  return centsToDecimal((priceToCents(referencePrice) * 95n + 50n) / 100n);
}

function extractPackages(html, sourceUrl) {
  const products = [];
  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      visit(JSON.parse(match[1].trim()), products);
    } catch {
      // Other, unrelated JSON-LD blocks may be malformed.
    }
  }

  const offerLists = products
    .map((product) => product.offers?.offers)
    .filter(Array.isArray);
  const offers = offerLists.sort((a, b) => b.length - a.length)[0] || [];
  const byQuantity = new Map();

  for (const offer of offers) {
    const quantityText = String(offer.name || "").match(/(?:^|\s)([\d.]+)(?:\s|$)/)?.[1];
    if (!quantityText || offer.price == null) continue;
    const quantity = Number(quantityText.replaceAll(".", ""));
    const referencePrice = centsToDecimal(priceToCents(offer.price));
    if (Number.isSafeInteger(quantity) && quantity > 0) {
      byQuantity.set(quantity, {
        quantity,
        referencePrice,
        price: salePrice(referencePrice),
      });
    }
  }

  const packages = [...byQuantity.values()].sort((a, b) => a.quantity - b.quantity);
  if (!packages.length) throw new Error(`Paket bulunamadı: ${sourceUrl}`);
  return packages;
}

async function fetchCatalog() {
  const entries = Object.entries(matchedServices);
  const results = new Array(entries.length);
  let cursor = 0;

  async function worker() {
    while (cursor < entries.length) {
      const index = cursor++;
      const [key, path] = entries[index];
      const sourceUrl = new URL(path, baseUrl).href;
      const response = await fetch(sourceUrl, {
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; BayigramCatalogAudit/1.0)",
          accept: "text/html,application/xhtml+xml",
        },
      });
      if (!response.ok) throw new Error(`${response.status} ${sourceUrl}`);
      results[index] = [key, { sourceUrl, packages: extractPackages(await response.text(), sourceUrl) }];
    }
  }

  await Promise.all(Array.from({ length: 6 }, () => worker()));
  return Object.fromEntries(results);
}

function emitTypescript(catalog) {
  const generatedAt = new Date().toISOString();
  const indent = process.argv.includes("--compact") ? undefined : 2;
  process.stdout.write(
    `// Bayigram'ın herkese açık ürün sayfalarından ${generatedAt} tarihinde üretildi.\n` +
      `// Fiyatlar kaynakla birebir; satış fiyatları kuruş hassasiyetinde %5 indirimlidir.\n\n` +
      `export type BayigramPackage = {\n  quantity: number;\n  referencePrice: string;\n  price: string;\n};\n\n` +
      `export type BayigramServiceCatalog = {\n  sourceUrl: string;\n  packages: readonly BayigramPackage[];\n};\n\n` +
      `export const bayigramCatalog = ${JSON.stringify(catalog, null, indent)} as const satisfies Record<string, BayigramServiceCatalog>;\n\n` +
      `export const unmatchedBayigramServices = ${JSON.stringify(unmatchedServices, null, indent)} as const;\n`,
  );
}

function money(value) {
  return centsToDecimal(priceToCents(value));
}

async function auditDatabase(catalog) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const problems = [];
  const sourcePackages = Object.values(catalog).flatMap((service) => service.packages);
  const averageDiscount = sourcePackages.reduce(
    (total, item) => total + ((Number(item.referencePrice) - Number(item.price)) / Number(item.referencePrice)) * 100,
    0,
  ) / sourcePackages.length;

  try {
    for (const [key, source] of Object.entries(catalog)) {
      const [platformSlug, serviceSlug] = key.split("/");
      const service = await prisma.service.findFirst({
        where: { slug: serviceSlug, platform: { slug: platformSlug } },
        include: { packages: { where: { isActive: true }, orderBy: { quantity: "asc" } } },
      });

      if (!service) {
        problems.push(`${key}: veritabanında hizmet bulunamadı`);
        continue;
      }

      const expected = new Map(source.packages.map((item) => [item.quantity, item]));
      const actual = new Map(service.packages.map((item) => [item.quantity, item]));

      for (const [quantity, item] of expected) {
        const found = actual.get(quantity);
        if (!found) {
          problems.push(`${key}: ${quantity} adet paket eksik`);
          continue;
        }
        if (money(found.referencePrice) !== item.referencePrice || money(found.price) !== item.price) {
          problems.push(
            `${key}: ${quantity} adet fiyatı beklenen ${item.referencePrice}/${item.price}, mevcut ${money(found.referencePrice)}/${money(found.price)}`,
          );
        }
      }

      for (const quantity of actual.keys()) {
        if (!expected.has(quantity)) problems.push(`${key}: kaynakta olmayan ${quantity} adet aktif paket var`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log(`Eşleşen hizmet: ${Object.keys(catalog).length}`);
  console.log(`Eşleşen aktif paket: ${sourcePackages.length}`);
  console.log(`Ortalama indirim: %${averageDiscount.toFixed(4)}`);
  console.log(`Eşleşmeyen ve değiştirilmemesi gereken hizmet: ${Object.keys(unmatchedServices).length}`);
  for (const [key, reason] of Object.entries(unmatchedServices)) console.log(`- ${key}: ${reason}`);
  if (problems.length) {
    console.error(`\n${problems.length} fiyat/paket farkı bulundu:`);
    for (const problem of problems) console.error(`- ${problem}`);
    process.exitCode = 1;
  } else {
    console.log("\nTüm eşleşen aktif paketler canlı Bayigram verisiyle uyumlu.");
  }
}

const catalog = await fetchCatalog();
if (process.argv.includes("--emit-typescript")) emitTypescript(catalog);
else await auditDatabase(catalog);

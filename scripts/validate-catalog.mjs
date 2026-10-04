import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function money(value) {
  return Number(String(value));
}

async function main() {
  const services = await prisma.service.findMany({
    where: { isActive: true, platform: { isActive: true } },
    include: {
      platform: true,
      packages: { where: { isActive: true }, orderBy: { quantity: "asc" } },
    },
    orderBy: [{ platform: { displayOrder: "asc" } }, { id: "asc" }],
  });
  const orders = await prisma.order.findMany({
    select: { id: true, orderNumber: true, price: true, quantity: true, packageId: true },
  });
  const problems = [];
  const packages = [];

  for (const service of services) {
    const key = `${service.platform.slug}/${service.slug}`;
    if (!service.packages.length) problems.push(`${key}: aktif paket yok`);
    const seen = new Set();
    let previousQuantity = -1;

    for (const item of service.packages) {
      if (seen.has(item.quantity)) problems.push(`${key}: ${item.quantity} miktarı tekrarlanıyor`);
      if (item.quantity <= previousQuantity) problems.push(`${key}: paket sıralaması hatalı`);
      if (money(item.price) <= 0) problems.push(`${key}/${item.quantity}: satış fiyatı pozitif değil`);
      if (item.referencePrice == null) problems.push(`${key}/${item.quantity}: referans fiyat eksik`);
      else if (money(item.price) >= money(item.referencePrice)) problems.push(`${key}/${item.quantity}: satış fiyatı referans fiyattan düşük değil`);
      seen.add(item.quantity);
      previousQuantity = item.quantity;
      packages.push({
        id: item.id,
        key,
        quantity: item.quantity,
        price: String(item.price),
        referencePrice: item.referencePrice == null ? null : String(item.referencePrice),
        isActive: item.isActive,
      });
    }
  }

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({
      services: services.length,
      packages,
      orders: orders.map((order) => ({ ...order, price: String(order.price) })),
      problems,
    }));
    return;
  }

  console.log(`${services.length} aktif hizmet ve ${packages.length} aktif paket kontrol edildi.`);
  if (problems.length) {
    console.error(`${problems.length} katalog sorunu bulundu:`);
    for (const problem of problems) console.error(`- ${problem}`);
    process.exitCode = 1;
  } else {
    console.log("Duplicate, fiyat, referans fiyat, sıralama ve paketsiz hizmet kontrolleri başarılı.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());

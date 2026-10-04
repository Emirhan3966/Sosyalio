import { PackageManager, type AdminCatalog } from "@/components/admin/PackageManager";
import { prisma } from "@/lib/prisma";

export default async function ServicesPage() {
  const platforms = await prisma.servicePlatform.findMany({ orderBy: { displayOrder: "asc" }, include: { services: { orderBy: { id: "asc" }, include: { packages: { orderBy: { quantity: "asc" } } } } } });
  const catalog: AdminCatalog = platforms.map((platform) => ({ id: platform.id, name: platform.name, slug: platform.slug, description: platform.description, displayOrder: platform.displayOrder, isActive: platform.isActive, services: platform.services.map((service) => ({ id: service.id, name: service.name, slug: service.slug, description: service.description, isActive: service.isActive, packages: service.packages.map((item) => ({ id: item.id, quantity: item.quantity, price: item.price.toString(), referencePrice: item.referencePrice?.toString() ?? null, deliveryLabel: item.deliveryLabel, isActive: item.isActive, isPopular: item.isPopular })) })) }));

  return <div><div><p className="text-xs font-extrabold uppercase tracking-[.15em] text-violet-600">Katalog Yönetimi</p><h1 className="mt-2 text-3xl font-black tracking-tight">Hizmetler ve paketler</h1><p className="mt-2 text-sm text-muted">Platform ve hizmet bilgilerini düzenle; paket ekle, fiyat ve satış durumlarını yönet.</p></div><div className="mt-8"><PackageManager catalog={catalog} /></div></div>;
}

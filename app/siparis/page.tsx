import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { OrderForm, type OrderCatalog } from "@/components/OrderForm";
import { Sparkles } from "@/components/Icons";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Sipariş Oluştur",
  description: "Sosyalio kataloğundan platform, hizmet ve aktif paket seçerek siparişinizi oluşturun.",
  alternates: { canonical: "/siparis" },
};
export const dynamic = "force-dynamic";

export default async function OrderPage({ searchParams }: { searchParams: Promise<{ package?: string }> }) {
  const { package: packageQuery } = await searchParams;
  const initialPackageId = packageQuery && /^\d+$/.test(packageQuery) ? Number(packageQuery) : undefined;
  const platforms = await prisma.servicePlatform.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    include: { services: { where: { isActive: true }, orderBy: { id: "asc" }, include: { packages: { where: { isActive: true }, orderBy: { quantity: "asc" } } } } },
  });

  const catalog: OrderCatalog = platforms.map((platform) => ({
    id: platform.id,
    name: platform.name,
    slug: platform.slug,
    services: platform.services.map((service) => ({
      id: service.id,
      name: service.name,
      packages: service.packages.map((item) => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price.toString(), deliveryLabel: item.deliveryLabel })),
    })),
  }));

  return (
    <main className="min-h-screen bg-[#faf9ff]">
      <Header />
      <section className="relative overflow-hidden pb-20 pt-14 sm:pt-20">
        <div className="hero-grid absolute inset-0" />
        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-200/35 blur-3xl" />
        <div className="container-shell relative">
          <div className="mx-auto mb-10 max-w-2xl text-center"><span className="eyebrow"><Sparkles className="h-4 w-4" />Hemen Başla</span><h1 className="mt-5 text-4xl font-black tracking-[-.045em] sm:text-5xl">Siparişini <span className="gradient-text">oluştur</span></h1><p className="mt-4 text-base leading-7 text-muted">Platformunu ve aktif paketini seç, teslimat bilgilerini gir ve güvenli ödeme adımına geç.</p></div>
          {catalog.length > 0 ? <OrderForm catalog={catalog} initialPackageId={initialPackageId} /> : <div className="rounded-3xl bg-white p-10 text-center shadow-card">Şu anda aktif paket bulunmuyor.</div>}
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Bolt, Check, ChevronDown, Lock, Shield } from "@/components/Icons";
import { PackageCards } from "@/components/storefront/PackageCards";
import { getPlatformPresentation } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ platformSlug: string; serviceSlug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { platformSlug, serviceSlug } = await params;
  const service = await prisma.service.findFirst({ where: { slug: serviceSlug, isActive: true, platform: { slug: platformSlug, isActive: true } }, select: { name: true, description: true, platform: { select: { name: true } } } });
  if (!service) return { title: "Hizmet Bulunamadı", robots: { index: false, follow: false } };
  const title = `${service.platform.name} ${service.name} Paketleri`;
  const url = `/${platformSlug}/${serviceSlug}`;
  return {
    title,
    description: service.description,
    alternates: { canonical: url },
    openGraph: { title: `${title} — Sosyalio`, description: service.description, url, siteName: "Sosyalio", locale: "tr_TR", type: "website" },
    twitter: { card: "summary_large_image", title: `${title} — Sosyalio`, description: service.description },
  };
}

export default async function ServicePage({ params }: Props) {
  const { platformSlug, serviceSlug } = await params;
  const service = await prisma.service.findFirst({ where: { slug: serviceSlug, isActive: true, platform: { slug: platformSlug, isActive: true } }, include: { platform: true, packages: { where: { isActive: true }, orderBy: { quantity: "asc" } } } });
  if (!service) notFound();
  const style = getPlatformPresentation(service.platform.slug); const Icon = style.icon;
  const packages = service.packages.map((item) => ({ id: item.id, quantity: item.quantity, price: item.price.toString(), referencePrice: item.referencePrice?.toString() ?? null, deliveryLabel: item.deliveryLabel, isPopular: item.isPopular }));
  const faqs = [[`${service.name} siparişi için şifre gerekiyor mu?`, "Hayır. Hesap şifrenizi istemeyiz; yalnızca herkese açık kullanıcı adı veya içerik bağlantısı kullanılır."], ["Teslimat ne zaman başlar?", "Seçtiğiniz paketin tahmini teslimat bilgisi paket kartında gösterilir. Sipariş durumu sorgulama ekranından takip edilebilir."], ["Paket fiyatı nasıl belirleniyor?", "Sipariş tutarı tarayıcıdan alınmaz. Seçtiğiniz aktif paketin güncel fiyatı sunucuda veritabanından okunur."], ["Ödemeyi nasıl takip ederim?", "Ödeme durumu, ödeme sağlayıcısının doğrulanmış sunucu bildirimi sonrasında sipariş sorgulama ekranında güncellenir."]];
  return <main className="min-h-screen bg-white"><Header /><section className="relative overflow-hidden bg-[#fbfaff] py-14 sm:py-20"><div className="hero-grid absolute inset-0" /><div className="container-shell relative"><nav className="text-xs font-bold text-slate-400"><Link href="/" className="hover:text-violet-600">Ana Sayfa</Link><span className="mx-2">/</span><Link href={`/${service.platform.slug}`} className="hover:text-violet-600">{service.platform.name}</Link><span className="mx-2">/</span>{service.name}</nav><div className="mt-8 grid items-center gap-8 lg:grid-cols-[1fr_380px]"><div><div className={`grid h-16 w-16 place-items-center rounded-[22px] bg-gradient-to-br ${style.gradient} text-white shadow-lg`}><Icon className="h-8 w-8" /></div><p className={`mt-5 text-xs font-extrabold uppercase tracking-[.15em] ${style.text}`}>{service.platform.name}</p><h1 className="mt-2 text-4xl font-black tracking-[-.045em] sm:text-5xl">{service.name} <span className="gradient-text">Paketleri</span></h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted">{service.description}</p></div><div className="rounded-[28px] border border-violet-100 bg-white p-6 shadow-soft"><div className="space-y-4">{[[Lock, "Şifre Gerekmez", "Hesap giriş bilgisi istemeyiz."], [Bolt, "Teslimat Bilgisi", "Her pakette tahmini süre görünür."], [Shield, "Güvenli Ödeme", "Ödeme sunucu tarafında doğrulanır."], [Check, "Sipariş Takibi", "Sipariş ve ödeme durumunu sorgulayabilirsin."]].map(([icon, title, text]) => { const I = icon as typeof Lock; return <div key={String(title)} className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600"><I className="h-5 w-5" /></span><div><p className="text-sm font-extrabold">{String(title)}</p><p className="mt-0.5 text-xs text-muted">{String(text)}</p></div></div>; })}</div></div></div></div></section><section className="py-16 sm:py-20"><div className="container-shell"><div className="mb-10"><p className="text-xs font-extrabold uppercase tracking-[.14em] text-violet-600">Aktif Paketler</p><h2 className="mt-2 text-3xl font-black">Miktarını seç, hemen başla</h2><p className="mt-3 text-sm text-muted">Yalnızca şu anda satışta olan veritabanı paketleri gösterilir.</p></div>{packages.length ? <PackageCards packages={packages} serviceName={service.name} /> : <div className="rounded-3xl border border-dashed border-violet-200 bg-[#fbfaff] p-12 text-center text-muted">Bu hizmet için şu anda aktif paket bulunmuyor.</div>}</div></section><section className="bg-[#fbfaff] py-16 sm:py-20"><div className="container-shell grid gap-10 lg:grid-cols-[.7fr_1fr]"><div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-violet-600">Merak Ettiklerin</p><h2 className="mt-3 text-3xl font-black">Sıkça sorulan sorular</h2><p className="mt-3 text-sm leading-6 text-muted">{service.platform.name} {service.name} siparişinden önce bilmen gerekenler.</p></div><div className="space-y-3">{faqs.map(([question, answer], index) => <details key={question} open={index === 0} className="group rounded-2xl border border-[#ebe7f4] bg-white px-5 shadow-sm"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-extrabold">{question}<span className="grid h-8 w-8 place-items-center rounded-full bg-violet-50 text-violet-600 transition group-open:rotate-180"><ChevronDown className="h-4 w-4" /></span></summary><p className="pb-5 pr-8 text-sm leading-6 text-muted">{answer}</p></details>)}</div></div></section></main>;
}

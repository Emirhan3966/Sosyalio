import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { ArrowRight, Check, Lock, Shield } from "@/components/Icons";
import { ServiceCatalog } from "@/components/storefront/ServiceCatalog";
import { getPlatformPresentation } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ platformSlug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { platformSlug } = await params;
  const platform = await prisma.servicePlatform.findFirst({ where: { slug: platformSlug, isActive: true }, select: { name: true, description: true } });
  if (!platform) return { title: "Platform Bulunamadı", robots: { index: false, follow: false } };
  const title = `${platform.name} Hizmetleri`;
  const url = `/${platformSlug}`;
  return {
    title,
    description: platform.description,
    alternates: { canonical: url },
    openGraph: { title: `${title} — Sosyalio`, description: platform.description, url, siteName: "Sosyalio", locale: "tr_TR", type: "website" },
    twitter: { card: "summary_large_image", title: `${title} — Sosyalio`, description: platform.description },
  };
}

export default async function PlatformPage({ params }: Props) {
  const { platformSlug } = await params;
  const platform = await prisma.servicePlatform.findFirst({ where: { slug: platformSlug, isActive: true }, include: { services: { where: { isActive: true }, orderBy: { id: "asc" }, include: { packages: { where: { isActive: true }, orderBy: { price: "asc" }, select: { price: true } } } } } });
  if (!platform) notFound();
  const style = getPlatformPresentation(platform.slug); const Icon = style.icon;
  const services = platform.services.map((service) => ({ id: service.id, name: service.name, slug: service.slug, description: service.description, packageCount: service.packages.length, startingPrice: service.packages[0]?.price.toString() ?? null }));
  return <main className="min-h-screen bg-[#fbfaff]"><Header /><section className="relative overflow-hidden border-b border-violet-100 bg-white py-16 sm:py-20"><div className="hero-grid absolute inset-0" /><div className="container-shell relative"><nav className="text-xs font-bold text-slate-400"><Link href="/" className="hover:text-violet-600">Ana Sayfa</Link><span className="mx-2">/</span>{platform.name}</nav><div className="mt-8 flex flex-col justify-between gap-8 lg:flex-row lg:items-center"><div className="max-w-2xl"><div className={`grid h-16 w-16 place-items-center rounded-[22px] bg-gradient-to-br ${style.gradient} text-white shadow-lg`}><Icon className="h-8 w-8" /></div><h1 className="mt-6 text-4xl font-black tracking-[-.045em] sm:text-5xl">{platform.name} <span className="gradient-text">Hizmetleri</span></h1><p className="mt-4 text-base leading-7 text-muted">{platform.description}. İhtiyacına uygun kategoriyi seçerek aktif paketleri ve güncel fiyatları incele.</p></div><div className="grid grid-cols-3 gap-3"><div className="rounded-2xl border border-violet-100 bg-white p-4 text-center shadow-card"><strong className="text-2xl font-black text-violet-600">{services.length}</strong><p className="mt-1 text-[10px] font-bold text-slate-400">HİZMET</p></div><div className="rounded-2xl border border-violet-100 bg-white p-4 text-center shadow-card"><Lock className="mx-auto h-6 w-6 text-violet-600" /><p className="mt-2 text-[10px] font-bold text-slate-400">ŞİFRESİZ</p></div><div className="rounded-2xl border border-violet-100 bg-white p-4 text-center shadow-card"><Shield className="mx-auto h-6 w-6 text-violet-600" /><p className="mt-2 text-[10px] font-bold text-slate-400">GÜVENLİ</p></div></div></div></div></section><section className="py-16 sm:py-20"><div className="container-shell"><div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-violet-600">Hizmet Kategorileri</p><h2 className="mt-2 text-3xl font-black">Ne almak istiyorsun?</h2></div><Link href="/siparis" className="inline-flex items-center gap-2 text-sm font-extrabold text-violet-600">Tüm katalogdan sipariş ver <ArrowRight className="h-4 w-4" /></Link></div>{services.length ? <ServiceCatalog platformSlug={platform.slug} services={services} /> : <div className="rounded-3xl bg-white p-12 text-center shadow-card"><Check className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-4 text-muted">Bu platform için henüz aktif hizmet bulunmuyor.</p></div>}</div></section></main>;
}

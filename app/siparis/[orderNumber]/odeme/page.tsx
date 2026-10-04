import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Bolt, Lock, Shield } from "@/components/Icons";
import { PaymentButton } from "@/components/payments/PaymentButton";
import { formatPrice } from "@/lib/order";
import { getShopierMode, paymentStatusLabels } from "@/lib/payments/shopier";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Güvenli Ödeme", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PaymentPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({ where: { orderNumber: orderNumber.toUpperCase() }, include: { package: true } });
  if (!order) notFound();
  const mode = getShopierMode();

  return <main className="min-h-screen bg-[#faf9ff]"><Header /><section className="relative overflow-hidden py-14 sm:py-20"><div className="hero-grid absolute inset-0" /><div className="container-shell relative"><div className="mx-auto max-w-3xl"><div className="text-center"><span className="eyebrow"><Lock className="h-4 w-4" />Güvenli Ödeme</span><h1 className="mt-5 text-4xl font-black tracking-[-.045em]">Siparişini <span className="gradient-text">tamamla</span></h1><p className="mt-4 text-sm leading-6 text-muted">Bilgilerini kontrol et ve Shopier güvenli ödeme ekranına geç.</p></div>{mode === "mock" && <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-center text-sm font-bold text-amber-800">Geliştirme mock modu aktif. Gerçek ödeme alınmayacak.</div>}{mode === "disabled" && <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center text-sm font-bold text-red-700">Shopier ödeme sistemi bu ortamda henüz yapılandırılmamış.</div>}<div className="mt-8 grid gap-6 lg:grid-cols-[1fr_310px]"><section className="rounded-[30px] border border-[#e9e4f4] bg-white p-6 shadow-card sm:p-8"><div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5"><div><p className="text-xs font-bold text-slate-400">SİPARİŞ NUMARASI</p><p className="mt-1 font-black text-violet-700">{order.orderNumber}</p></div><span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-extrabold text-violet-700">{paymentStatusLabels[order.paymentStatus]}</span></div><dl className="mt-2 divide-y divide-slate-100">{[["Platform", order.platform], ["Hizmet", order.service], ["Miktar", `${order.quantity.toLocaleString("tr-TR")} adet`], ["Hedef", order.targetUrlOrUsername], ["Teslimat", order.package.deliveryLabel]].map(([label, value]) => <div key={label} className="grid gap-1 py-4 sm:grid-cols-[130px_1fr]"><dt className="text-xs font-bold text-slate-400">{label}</dt><dd className="break-all text-sm font-extrabold text-slate-700">{value}</dd></div>)}</dl></section><aside className="rounded-[30px] border border-violet-200 bg-white p-6 shadow-[0_20px_55px_rgba(88,65,190,.12)]"><p className="text-xs font-bold text-slate-400">ÖDENECEK TOPLAM</p><p className="mt-2 text-3xl font-black text-violet-600">{formatPrice(order.price.toString())}</p><div className="my-6 h-px bg-slate-100" /><PaymentButton orderNumber={order.orderNumber} isMock={mode === "mock"} paymentStatus={order.paymentStatus} /><div className="mt-5 space-y-3 text-xs text-slate-500"><p className="flex items-center gap-2"><Shield className="h-4 w-4 text-violet-500" />Fiyat sunucuda doğrulanır</p><p className="flex items-center gap-2"><Bolt className="h-4 w-4 text-violet-500" />Durum webhook ile güncellenir</p></div></aside></div><p className="mt-7 text-center text-xs text-slate-400">Ödeme yapmak istemiyor musun? <Link href="/" className="font-bold text-violet-600 hover:underline">Ana sayfaya dön</Link></p></div></div></section></main>;
}

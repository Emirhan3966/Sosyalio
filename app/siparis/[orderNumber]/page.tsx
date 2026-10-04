import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { ArrowRight, Check, Headphones, Search, Shield } from "@/components/Icons";
import { formatPrice, orderStatusLabels } from "@/lib/order";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Sipariş Onayı", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const statusStyles = { PENDING: "bg-amber-50 text-amber-700", PROCESSING: "bg-blue-50 text-blue-700", COMPLETED: "bg-emerald-50 text-emerald-700", CANCELLED: "bg-red-50 text-red-700" };

export default async function OrderConfirmationPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({ where: { orderNumber: orderNumber.toUpperCase() } });
  if (!order) notFound();

  return (
    <main className="min-h-screen bg-[#faf9ff]">
      <Header />
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="hero-grid absolute inset-0" />
        <div className="container-shell relative">
          <div className="mx-auto max-w-2xl rounded-[36px] border border-[#e9e4f5] bg-white p-7 text-center shadow-soft sm:p-12">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-[26px] bg-emerald-50 text-emerald-600"><Check className="h-9 w-9" /></div>
            <p className="mt-6 text-xs font-extrabold uppercase tracking-[.16em] text-emerald-600">Sipariş başarıyla oluşturuldu</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Teşekkürler!</h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted">Siparişini aldık. Aşağıdaki sipariş numarasını durum sorgulamak için saklamanı öneririz.</p>
            <div className="mt-7 rounded-2xl border border-dashed border-violet-300 bg-violet-50/70 px-5 py-4"><p className="text-xs font-bold text-violet-500">SİPARİŞ NUMARASI</p><p className="mt-1 text-xl font-black tracking-wide text-violet-700 sm:text-2xl">{order.orderNumber}</p></div>
            <div className="mt-7 grid gap-4 rounded-[24px] bg-slate-50 p-5 text-left sm:grid-cols-2 sm:p-6">
              <div><p className="text-xs text-slate-400">Hizmet</p><p className="mt-1 font-extrabold">{order.platform} {order.service}</p></div>
              <div><p className="text-xs text-slate-400">Miktar</p><p className="mt-1 font-extrabold">{order.quantity.toLocaleString("tr-TR")} adet</p></div>
              <div><p className="text-xs text-slate-400">Toplam</p><p className="mt-1 font-extrabold text-violet-600">{formatPrice(order.price.toString())}</p></div>
              <div><p className="text-xs text-slate-400">Durum</p><span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${statusStyles[order.status]}`}>{orderStatusLabels[order.status]}</span></div>
              <div className="sm:col-span-2"><p className="text-xs text-slate-400">Teslimat bilgisi</p><p className="mt-1 break-all font-extrabold">{order.targetUrlOrUsername}</p></div>
            </div>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/#sorgula" className="btn-primary"><Search className="h-4 w-4" />Siparişi Sorgula</Link><Link href="/" className="btn-secondary">Ana Sayfaya Dön <ArrowRight className="h-4 w-4" /></Link></div>
            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-slate-100 pt-6 text-xs text-slate-400"><span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-violet-500" />Güvenli kayıt</span><span className="flex items-center gap-1.5"><Headphones className="h-4 w-4 text-violet-500" />Destek yanında</span></div>
          </div>
        </div>
      </section>
    </main>
  );
}

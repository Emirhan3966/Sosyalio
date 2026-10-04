import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { PaymentStatusPoller } from "@/components/payments/PaymentStatusPoller";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Ödeme Durumu", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PaymentResultPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({ where: { orderNumber: orderNumber.toUpperCase() }, select: { orderNumber: true, paymentStatus: true } });
  if (!order) notFound();
  return <main className="min-h-screen bg-[#faf9ff]"><Header /><section className="relative grid min-h-[calc(100vh-76px)] place-items-center overflow-hidden px-5 py-16"><div className="hero-grid absolute inset-0" /><div className="relative w-full max-w-2xl rounded-[36px] border border-[#e9e4f5] bg-white p-7 text-center shadow-soft sm:p-12"><PaymentStatusPoller orderNumber={order.orderNumber} initialStatus={order.paymentStatus} /><div className="mt-8 rounded-2xl bg-slate-50 px-5 py-4"><p className="text-xs text-slate-400">Sipariş numarası</p><p className="mt-1 font-black text-violet-700">{order.orderNumber}</p></div></div></section></main>;
}

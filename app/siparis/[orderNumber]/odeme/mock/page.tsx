import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Lock } from "@/components/Icons";
import { MockPaymentButton } from "@/components/payments/MockPaymentButton";
import { formatPrice } from "@/lib/order";
import { getShopierMode } from "@/lib/payments/shopier";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MockPaymentPage({ params, searchParams }: { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ token?: string }> }) {
  if (getShopierMode() !== "mock") notFound();
  const [{ orderNumber }, { token }] = await Promise.all([params, searchParams]);
  if (!token) notFound();
  const order = await prisma.order.findUnique({ where: { orderNumber: orderNumber.toUpperCase() }, select: { orderNumber: true, platform: true, service: true, price: true } });
  if (!order) notFound();
  return <main className="min-h-screen bg-[#faf9ff]"><Header /><section className="grid min-h-[calc(100vh-76px)] place-items-center px-5 py-14"><div className="w-full max-w-md rounded-[32px] border border-amber-200 bg-white p-7 text-center shadow-soft sm:p-9"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-600"><Lock className="h-7 w-7" /></span><p className="mt-5 text-xs font-extrabold uppercase tracking-[.15em] text-amber-600">Yalnızca geliştirme ortamı</p><h1 className="mt-3 text-2xl font-black">Mock Shopier Ödemesi</h1><p className="mt-3 text-sm leading-6 text-muted">Bu ekran gerçek kart işlemi yapmaz. Üretim ortamında tamamen devre dışıdır.</p><div className="my-6 rounded-2xl bg-slate-50 p-5"><p className="font-extrabold">{order.platform} {order.service}</p><p className="mt-2 text-2xl font-black text-violet-600">{formatPrice(order.price.toString())}</p></div><MockPaymentButton orderNumber={order.orderNumber} token={token} /></div></section></main>;
}

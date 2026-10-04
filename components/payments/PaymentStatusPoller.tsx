"use client";

import type { PaymentStatus } from "@prisma/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Headphones, XIcon } from "@/components/Icons";

export function PaymentStatusPoller({ orderNumber, initialStatus }: { orderNumber: string; initialStatus: PaymentStatus }) {
  const [status, setStatus] = useState(initialStatus);
  useEffect(() => {
    if (["PAID", "REFUNDED", "FAILED"].includes(status)) return;
    const timer = window.setInterval(async () => {
      try { const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/payment-status`, { cache: "no-store" }); if (response.ok) setStatus(((await response.json()) as { paymentStatus: PaymentStatus }).paymentStatus); } catch { /* Bir sonraki sorgulamada tekrar dene. */ }
    }, 2500);
    return () => window.clearInterval(timer);
  }, [orderNumber, status]);

  if (status === "PAID") return <div><div className="mx-auto grid h-20 w-20 place-items-center rounded-[26px] bg-emerald-50 text-emerald-600"><Check className="h-10 w-10" /></div><p className="mt-6 text-xs font-extrabold uppercase tracking-[.16em] text-emerald-600">Doğrulama tamamlandı</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Ödeme başarılı</h1><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted">Ödemeniz Shopier bildirimi ve sunucu doğrulamasıyla onaylandı. Siparişiniz işleme alınmaya hazır.</p><Link href="/#sorgula" className="btn-primary mt-7">Siparişimi Sorgula</Link></div>;
  if (status === "FAILED" || status === "REFUNDED") return <div><div className="mx-auto grid h-20 w-20 place-items-center rounded-[26px] bg-red-50 text-red-600"><XIcon className="h-9 w-9" /></div><p className="mt-6 text-xs font-extrabold uppercase tracking-[.16em] text-red-600">Ödeme durumu</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{status === "REFUNDED" ? "Ödeme iade edildi" : "Ödeme doğrulanamadı"}</h1><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted">Ayrıntılı bilgi ve destek için ekibimizle iletişime geçebilirsin.</p><Link href="/#destek" className="btn-secondary mt-7"><Headphones className="h-4 w-4" />Destek Al</Link></div>;
  return <div><div className="relative mx-auto h-20 w-20"><span className="absolute inset-0 animate-ping rounded-full bg-violet-200 opacity-40" /><span className="relative grid h-20 w-20 place-items-center rounded-[26px] bg-violet-50"><span className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" /></span></div><p className="mt-6 text-xs font-extrabold uppercase tracking-[.16em] text-violet-600">Sunucu doğrulaması bekleniyor</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{status === "UNPAID" ? "Ödemeniz kontrol ediliyor." : "Ödeme doğrulanıyor"}</h1><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted">Shopier dönüş sayfasına ulaşmanız ödeme kanıtı değildir. Durum yalnızca imzalı webhook ve Shopier API doğrulaması sonrasında güncellenir.</p><p className="mt-5 text-xs text-slate-400">Bu sayfa ödeme durumunu otomatik olarak kontrol ediyor.</p><Link href="/#destek" className="btn-secondary mt-7"><Headphones className="h-4 w-4" />Destek Al</Link></div>;
}

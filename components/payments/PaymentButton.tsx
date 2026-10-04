"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Lock } from "@/components/Icons";

export function PaymentButton({ orderNumber, isMock, paymentStatus }: { orderNumber: string; isMock: boolean; paymentStatus: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startPayment() {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/payments/${encodeURIComponent(orderNumber)}/checkout`, { method: "POST" });
      const data = await response.json() as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error || "Ödeme bağlantısı oluşturulamadı.");
      window.location.assign(data.url);
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : "Ödeme bağlantısı oluşturulamadı.");
      setLoading(false);
    }
  }

  if (paymentStatus === "PAID") return <Link href={`/siparis/${orderNumber}/odeme/sonuc`} className="btn-primary w-full">Ödeme Sonucunu Gör <ArrowRight className="h-4 w-4" /></Link>;

  return <div><button type="button" onClick={startPayment} disabled={loading} className="btn-primary w-full !py-4 disabled:cursor-not-allowed disabled:opacity-60"><Lock className="h-4 w-4" />{loading ? "Güvenli ödeme hazırlanıyor..." : isMock ? "Geliştirme Ödemesini Başlat" : "Shopier ile Güvenli Öde"}</button>{error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}{paymentStatus === "PENDING" && <Link href={`/siparis/${orderNumber}/odeme/sonuc`} className="mt-3 block text-center text-xs font-bold text-violet-600 hover:underline">Ödeme durumunu kontrol et</Link>}</div>;
}

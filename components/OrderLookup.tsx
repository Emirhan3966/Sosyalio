"use client";

import { FormEvent, useState } from "react";
import { Check, Search } from "./Icons";

type LookupResult = {
  orderNumber: string;
  platform: string;
  service: string;
  quantity: number;
  price: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";
  paymentStatus: "UNPAID" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  createdAt: string;
};

const statusLabels = { PENDING: "Bekliyor", PROCESSING: "İşleniyor", COMPLETED: "Tamamlandı", CANCELLED: "İptal edildi" };
const statusStyles = { PENDING: "bg-amber-50 text-amber-700", PROCESSING: "bg-blue-50 text-blue-700", COMPLETED: "bg-emerald-50 text-emerald-700", CANCELLED: "bg-red-50 text-red-700" };
const paymentLabels = { UNPAID: "Ödenmedi", PENDING: "Ödeme Bekleniyor", PAID: "Ödendi", FAILED: "Başarısız", REFUNDED: "İade Edildi" };
const paymentStyles = { UNPAID: "bg-slate-100 text-slate-600", PENDING: "bg-amber-50 text-amber-700", PAID: "bg-emerald-50 text-emerald-700", FAILED: "bg-red-50 text-red-700", REFUNDED: "bg-purple-50 text-purple-700" };

export function OrderLookup() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });
      const data = await response.json() as LookupResult & { error?: string };
      if (!response.ok) throw new Error(data.error || "Sipariş sorgulanamadı.");
      setResult(data);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : "Sipariş sorgulanamadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form className="rounded-[24px] bg-white p-3 shadow-card" onSubmit={handleSubmit}>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="sr-only" htmlFor="order-number">Sipariş numarası</label>
          <input id="order-number" value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} className="min-w-0 rounded-xl bg-slate-50 px-4 py-3.5 text-sm uppercase outline-none ring-violet-200 transition focus:ring-2" placeholder="Örn. SYL-260921-A1B2C3" required />
          <label className="sr-only" htmlFor="lookup-email">E-posta adresi</label>
          <input id="lookup-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-w-0 rounded-xl bg-slate-50 px-4 py-3.5 text-sm outline-none ring-violet-200 transition focus:ring-2" placeholder="E-posta adresiniz" required />
        </div>
        <button className="btn-primary mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={loading}>{loading ? "Sorgulanıyor..." : "Siparişi Sorgula"} <Search className="h-4 w-4" /></button>
      </form>

      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
      {result && (
        <div className="mt-4 rounded-[24px] border border-emerald-100 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm font-extrabold"><Check className="h-5 w-5 text-emerald-600" />Sipariş bulundu</span><span className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${statusStyles[result.status]}`}>{statusLabels[result.status]}</span></div>
          <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-xs text-slate-400">Hizmet</p><p className="mt-1 font-bold">{result.platform} {result.service}</p></div>
            <div><p className="text-xs text-slate-400">Miktar</p><p className="mt-1 font-bold">{result.quantity.toLocaleString("tr-TR")}</p></div>
            <div><p className="text-xs text-slate-400">Toplam</p><p className="mt-1 font-bold text-violet-600">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(result.price))}</p></div>
            <div><p className="text-xs text-slate-400">Sipariş tarihi</p><p className="mt-1 font-bold">{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(result.createdAt))}</p></div>
            <div className="col-span-2 border-t border-slate-100 pt-4"><p className="text-xs text-slate-400">Ödeme</p><span className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-xs font-extrabold ${paymentStyles[result.paymentStatus]}`}>{paymentLabels[result.paymentStatus]}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

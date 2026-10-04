"use client";

import type { OrderStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Save } from "@/components/Icons";

export function StatusUpdateForm({ orderNumber, initialStatus }: { orderNumber: string; initialStatus: OrderStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderNumber)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const data = await response.json() as { error?: string };
    setLoading(false);
    if (!response.ok) { setMessage(data.error || "Durum güncellenemedi."); return; }
    setMessage("Sipariş durumu güncellendi."); router.refresh();
  }

  return <form onSubmit={submit} className="rounded-[24px] border border-violet-100 bg-violet-50/50 p-5"><label className="block text-sm font-extrabold">Sipariş durumunu değiştir<select value={status} onChange={(event) => setStatus(event.target.value as OrderStatus)} className="mt-3 w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-violet-200"><option value="PENDING">Bekliyor</option><option value="PROCESSING">İşleniyor</option><option value="COMPLETED">Tamamlandı</option><option value="CANCELLED">İptal edildi</option></select></label><button type="submit" disabled={loading || status === initialStatus} className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-4 w-4" />{loading ? "Kaydediliyor..." : "Durumu Kaydet"}</button>{message && <p className={`mt-3 text-center text-xs font-bold ${message.includes("güncellendi") ? "text-emerald-600" : "text-red-600"}`}>{message}</p>}</form>;
}

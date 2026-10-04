"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "@/components/Icons";

export function MockPaymentButton({ orderNumber, token }: { orderNumber: string; token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setLoading(true); setError("");
    const response = await fetch("/api/payments/mock/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber, token }) });
    const data = await response.json() as { error?: string };
    if (!response.ok) { setError(data.error || "Mock ödeme tamamlanamadı."); setLoading(false); return; }
    router.replace(`/siparis/${orderNumber}/odeme/sonuc`); router.refresh();
  }

  return <div><button type="button" onClick={confirm} disabled={loading} className="btn-primary w-full !py-4 disabled:opacity-60"><Check className="h-5 w-5" />{loading ? "Doğrulanıyor..." : "Mock Ödemeyi Onayla"}</button>{error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}</div>;
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, Bolt, Check, Lock, Shield } from "./Icons";

export type OrderCatalog = Array<{
  id: number;
  name: string;
  slug: string;
  services: Array<{
    id: number;
    name: string;
    packages: Array<{ id: number; name: string; quantity: number; price: string; deliveryLabel: string }>;
  }>;
}>;

function findInitialSelection(catalog: OrderCatalog, initialPackageId?: number) {
  for (const platform of catalog) {
    for (const service of platform.services) {
      const selectedPackage = service.packages.find((item) => item.id === initialPackageId);
      if (selectedPackage) return { platformId: platform.id, serviceId: service.id, packageId: selectedPackage.id };
    }
  }
  return { platformId: catalog[0]?.id ?? 0, serviceId: 0, packageId: 0 };
}

export function OrderForm({ catalog, initialPackageId }: { catalog: OrderCatalog; initialPackageId?: number }) {
  const router = useRouter();
  const initialSelection = findInitialSelection(catalog, initialPackageId);

  const [platformId, setPlatformId] = useState(initialSelection.platformId);
  const [serviceId, setServiceId] = useState(initialSelection.serviceId);
  const [packageId, setPackageId] = useState(initialSelection.packageId);
  const [target, setTarget] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const platform = catalog.find((item) => item.id === platformId);
  const service = platform?.services.find((item) => item.id === serviceId);
  const selectedPackage = service?.packages.find((item) => item.id === packageId);

  function changePlatform(value: number) {
    setPlatformId(value);
    setServiceId(0);
    setPackageId(0);
  }

  function changeService(value: number) {
    setServiceId(value);
    setPackageId(0);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!selectedPackage) {
      setError("Lütfen platform, hizmet ve paket seçimini tamamlayın.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: selectedPackage.id, customerEmail: email, targetUrlOrUsername: target }),
      });
      const data = await response.json() as { orderNumber?: string; error?: string };
      if (!response.ok || !data.orderNumber) throw new Error(data.error || "Sipariş oluşturulamadı.");
      router.push(`/siparis/${data.orderNumber}/odeme`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Sipariş oluşturulamadı.");
      setLoading(false);
    }
  }

  const selectClass = "w-full appearance-none rounded-2xl border border-[#e8e3f2] bg-white px-4 py-3.5 text-sm font-semibold text-ink outline-none ring-violet-200 transition focus:border-violet-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";
  const inputClass = "w-full rounded-2xl border border-[#e8e3f2] bg-white px-4 py-3.5 text-sm text-ink outline-none ring-violet-200 transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4";

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="rounded-[30px] border border-[#ece8f5] bg-white p-6 shadow-card sm:p-8">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-sm font-black text-violet-600">1</span><div><h2 className="text-lg font-extrabold">Hizmet bilgileri</h2><p className="mt-1 text-xs text-muted">İhtiyacına uygun paketi belirle.</p></div></div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block"><span className="mb-2 block text-sm font-bold">Platform</span><select className={selectClass} value={platformId || ""} onChange={(event) => changePlatform(Number(event.target.value))} required><option value="" disabled>Platform seçin</option>{catalog.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="block"><span className="mb-2 block text-sm font-bold">Hizmet</span><select className={selectClass} value={serviceId || ""} onChange={(event) => changeService(Number(event.target.value))} disabled={!platform} required><option value="" disabled>Hizmet seçin</option>{platform?.services.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-bold">Miktar / Paket</span><select className={selectClass} value={packageId || ""} onChange={(event) => setPackageId(Number(event.target.value))} disabled={!service} required><option value="" disabled>Paket seçin</option>{service?.packages.map((item) => <option key={item.id} value={item.id}>{item.quantity.toLocaleString("tr-TR")} {service.name} — {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(item.price))}</option>)}</select></label>
        </div>

        <div className="mt-9 flex items-center gap-3 border-b border-slate-100 pb-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-sm font-black text-blue-600">2</span><div><h2 className="text-lg font-extrabold">Teslimat bilgileri</h2><p className="mt-1 text-xs text-muted">Siparişin için gerekli bilgileri gir.</p></div></div>
        <div className="mt-6 space-y-5">
          <label className="block"><span className="mb-2 block text-sm font-bold">Kullanıcı adı veya profil/içerik bağlantısı</span><input className={inputClass} value={target} onChange={(event) => setTarget(event.target.value)} minLength={3} maxLength={500} placeholder="@kullaniciadi veya https://..." required /><span className="mt-2 block text-xs text-slate-400">Şifreni asla istemeyiz. Profilin teslimat sırasında herkese açık olmalı.</span></label>
          <label className="block"><span className="mb-2 block text-sm font-bold">E-posta adresi</span><input className={inputClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} placeholder="ornek@email.com" required /><span className="mt-2 block text-xs text-slate-400">Siparişini sorgulamak için bu adresi kullanacaksın.</span></label>
        </div>
      </div>

      <aside className="rounded-[30px] border border-violet-200 bg-white p-6 shadow-[0_20px_55px_rgba(88,65,190,.12)] lg:sticky lg:top-24">
        <p className="text-xs font-extrabold uppercase tracking-[.14em] text-violet-600">Sipariş özeti</p>
        {selectedPackage && platform && service ? <div className="mt-5"><h3 className="text-xl font-black">{platform.name} {service.name}</h3><div className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><span className="text-muted">Miktar</span><strong>{selectedPackage.quantity.toLocaleString("tr-TR")} adet</strong></div><div className="flex justify-between"><span className="text-muted">Tahmini teslimat</span><strong className="flex items-center gap-1 text-emerald-600"><Bolt className="h-4 w-4" />{selectedPackage.deliveryLabel}</strong></div></div><div className="my-6 h-px bg-slate-100" /><div className="flex items-end justify-between"><span className="font-bold">Toplam</span><strong className="text-3xl font-black text-violet-600">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(selectedPackage.price))}</strong></div></div> : <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-muted">Fiyatı görmek için hizmet ve paket seçimini tamamla.</div>}
        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        <button type="submit" disabled={loading || !selectedPackage} className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Sipariş oluşturuluyor..." : "Siparişi Oluştur"}<ArrowRight className="h-4 w-4" /></button>
        <div className="mt-5 space-y-3 text-xs text-slate-500"><p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" />Sonraki adım güvenli ödeme sayfasıdır</p><p className="flex items-center gap-2"><Shield className="h-4 w-4 text-violet-500" />Fiyat sunucuda veritabanından doğrulanır</p><p className="flex items-center gap-2"><Lock className="h-4 w-4 text-violet-500" />Hesap şifresi gerekmez</p></div>
        <p className="mt-5 text-center text-xs text-slate-400">Devam ederek <Link href="/" className="underline hover:text-violet-600">kullanım koşullarını</Link> kabul etmiş olursun.</p>
      </aside>
    </form>
  );
}

"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BoxesIcon, Plus, Save, Search } from "@/components/Icons";

type AdminPackage = { id: number; quantity: number; price: string; referencePrice: string | null; deliveryLabel: string; isActive: boolean; isPopular: boolean };
type AdminService = { id: number; name: string; slug: string; description: string; isActive: boolean; packages: AdminPackage[] };
type AdminPlatform = { id: number; name: string; slug: string; description: string; displayOrder: number; isActive: boolean; services: AdminService[] };
export type AdminCatalog = AdminPlatform[];

const inputClass = "w-full rounded-xl border border-[#e6e1f0] bg-white px-3 py-2.5 text-sm outline-none ring-violet-200 transition focus:border-violet-400 focus:ring-2";

function formatTry(value: string | null) {
  if (value === null) return "—";
  const amount = Number(value);
  return Number.isFinite(amount) ? `${new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} TL` : "—";
}

function StatusBadge({ active }: { active: boolean }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{active ? "Aktif" : "Pasif"}</span>;
}

function CatalogEditor({ kind, item, platformOptions }: { kind: "platforms"; item: AdminPlatform; platformOptions?: never } | { kind: "services"; item: AdminService & { platformId: number }; platformOptions: Array<{ id: number; name: string }> }) {
  const router = useRouter();
  const [name, setName] = useState(item.name);
  const [slug, setSlug] = useState(item.slug);
  const [description, setDescription] = useState(item.description);
  const [isActive, setIsActive] = useState(item.isActive);
  const [displayOrder, setDisplayOrder] = useState(kind === "platforms" ? String(item.displayOrder) : "0");
  const [platformId, setPlatformId] = useState(kind === "services" ? item.platformId : 0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/${kind}/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, slug, description, isActive, ...(kind === "platforms" ? { displayOrder: Number(displayOrder) } : { platformId }) }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Kayıt güncellenemedi.");
      setMessage("Kaydedildi"); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Kayıt güncellenemedi."); }
    finally { setLoading(false); }
  }

  return <form onSubmit={save} className="mt-3 grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 sm:grid-cols-2">
    <label className="text-xs font-bold text-slate-500">Ad<input className={`${inputClass} mt-1.5`} value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required /></label>
    <label className="text-xs font-bold text-slate-500">Slug / ikon anahtarı<input className={`${inputClass} mt-1.5`} value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase())} maxLength={80} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label>
    {kind === "platforms" ? <label className="text-xs font-bold text-slate-500">Sıralama<input className={`${inputClass} mt-1.5`} type="number" min="0" max="999" value={displayOrder} onChange={(event) => setDisplayOrder(event.target.value)} required /></label> : <label className="text-xs font-bold text-slate-500">Platform<select className={`${inputClass} mt-1.5`} value={platformId} onChange={(event) => setPlatformId(Number(event.target.value))}>{platformOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>}
    <label className={`text-xs font-bold text-slate-500 ${kind === "services" ? "sm:col-span-2" : ""}`}>Açıklama<input className={`${inputClass} mt-1.5`} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={240} required /></label>
    <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2"><label className="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="h-4 w-4 accent-violet-600" />Vitrinde aktif</label><div className="flex items-center gap-3">{message && <span className={`text-xs font-bold ${message === "Kaydedildi" ? "text-emerald-600" : "text-red-600"}`}>{message}</span>}<button disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50"><Save className="h-4 w-4" />{loading ? "Kaydediliyor" : "Kaydet"}</button></div></div>
  </form>;
}

function PackageRow({ item, onSaved }: { item: AdminPackage; onSaved: (item: AdminPackage) => void }) {
  const [editing, setEditing] = useState(false);
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [price, setPrice] = useState(item.price);
  const [referencePrice, setReferencePrice] = useState(item.referencePrice ?? "");
  const [isActive, setIsActive] = useState(item.isActive);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function cancel() { setQuantity(String(item.quantity)); setPrice(item.price); setReferencePrice(item.referencePrice ?? ""); setIsActive(item.isActive); setMessage(""); setEditing(false); }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/packages/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity: Number(quantity), price, referencePrice, isActive, deliveryLabel: item.deliveryLabel, isPopular: item.isPopular }) });
      const data = await response.json() as { error?: string; package?: AdminPackage };
      if (!response.ok || !data.package) throw new Error(data.error || "Paket güncellenemedi.");
      onSaved(data.package); setEditing(false);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Paket güncellenemedi."); }
    finally { setLoading(false); }
  }

  if (editing) return <form onSubmit={save} className="grid gap-3 rounded-2xl border border-violet-200 bg-violet-50/50 p-4 md:grid-cols-[1fr_1fr_1fr_0.8fr_1.3fr] md:items-end">
    <label className="text-xs font-bold text-slate-500">Paket miktarı<input className={`${inputClass} mt-1.5`} type="number" min="1" max="100000000" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label>
    <label className="text-xs font-bold text-slate-500">Satış fiyatı<input className={`${inputClass} mt-1.5`} inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} required /></label>
    <label className="text-xs font-bold text-slate-500">Referans fiyat<input className={`${inputClass} mt-1.5`} inputMode="decimal" value={referencePrice} onChange={(event) => setReferencePrice(event.target.value)} placeholder="Opsiyonel" /></label>
    <label className="flex h-10 items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="h-4 w-4 accent-violet-600" />Satışta</label>
    <div><div className="flex gap-2"><button type="submit" disabled={loading} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2.5 text-xs font-extrabold text-white disabled:opacity-50"><Save className="h-4 w-4" />{loading ? "Kaydediliyor" : "Kaydet"}</button><button type="button" onClick={cancel} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-extrabold text-slate-600 disabled:opacity-50">İptal</button></div>{message && <p className="mt-2 text-xs font-bold text-red-600">{message}</p>}</div>
  </form>;

  return <div className={`grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_1fr_1fr_0.8fr_1.3fr] md:items-center ${item.isActive ? "border-slate-100 bg-white" : "border-slate-200 bg-slate-50"}`}>
    <div><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 md:hidden">Paket miktarı</span><p className="font-extrabold text-slate-800">{item.quantity.toLocaleString("tr-TR")}</p></div>
    <div><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 md:hidden">Satış fiyatı</span><p className="font-extrabold text-violet-700">{formatTry(item.price)}</p></div>
    <div><span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 md:hidden">Referans fiyat</span><p className="text-sm font-bold text-slate-500">{formatTry(item.referencePrice)}</p></div>
    <div><StatusBadge active={item.isActive} /></div>
    <button type="button" onClick={() => setEditing(true)} className="rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-xs font-extrabold text-violet-700 transition hover:bg-violet-50">Düzenle</button>
  </div>;
}

function NewPackageForm({ service, onCreated }: { service: AdminService; onCreated: (item: AdminPackage) => void }) {
  const [quantity, setQuantity] = useState(""); const [price, setPrice] = useState(""); const [referencePrice, setReferencePrice] = useState(""); const [deliveryLabel, setDeliveryLabel] = useState(""); const [isPopular, setIsPopular] = useState(false); const [loading, setLoading] = useState(false); const [message, setMessage] = useState("");
  async function addPackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/admin/packages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceId: service.id, quantity: Number(quantity), price, referencePrice, deliveryLabel, isPopular }) });
      const data = await response.json() as { error?: string; package?: AdminPackage };
      if (!response.ok) throw new Error(data.error || "Paket eklenemedi.");
      setQuantity(""); setPrice(""); setReferencePrice(""); setDeliveryLabel(""); setIsPopular(false); setMessage("Paket eklendi."); if (data.package) onCreated(data.package);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Paket eklenemedi."); }
    finally { setLoading(false); }
  }
  return <details className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/30 p-4"><summary className="cursor-pointer text-sm font-extrabold text-violet-700"><span className="inline-flex items-center gap-2"><Plus className="h-4 w-4" />Bu hizmete yeni paket ekle</span></summary><form onSubmit={addPackage} className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><label className="text-xs font-bold text-slate-500">Miktar<input className={`${inputClass} mt-1.5`} type="number" min="1" max="100000000" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label><label className="text-xs font-bold text-slate-500">Satış fiyatı<input className={`${inputClass} mt-1.5`} inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="199,90" required /></label><label className="text-xs font-bold text-slate-500">Referans fiyat<input className={`${inputClass} mt-1.5`} inputMode="decimal" value={referencePrice} onChange={(event) => setReferencePrice(event.target.value)} placeholder="Opsiyonel" /></label><label className="text-xs font-bold text-slate-500">Teslimat<input className={`${inputClass} mt-1.5`} value={deliveryLabel} onChange={(event) => setDeliveryLabel(event.target.value)} placeholder="0–2 saat" maxLength={100} required /></label><button type="submit" disabled={loading} className="self-end rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-50">{loading ? "Ekleniyor" : "Paket ekle"}</button><div className="flex items-center gap-4 sm:col-span-2 xl:col-span-5"><label className="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={isPopular} onChange={(event) => setIsPopular(event.target.checked)} className="h-4 w-4 accent-violet-600" />Popüler paket</label>{message && <p className={`text-xs font-bold ${message === "Paket eklendi." ? "text-emerald-600" : "text-red-600"}`}>{message}</p>}</div></form></details>;
}

export function PackageManager({ catalog }: { catalog: AdminCatalog }) {
  const [catalogState, setCatalogState] = useState(catalog);
  const [platformId, setPlatformId] = useState(catalog[0]?.id ?? 0);
  const [serviceId, setServiceId] = useState(catalog[0]?.services[0]?.id ?? 0);
  const [search, setSearch] = useState("");
  const platform = catalogState.find((item) => item.id === platformId) ?? catalogState[0];
  const filteredServices = useMemo(() => platform?.services.filter((item) => item.name.toLocaleLowerCase("tr-TR").includes(search.trim().toLocaleLowerCase("tr-TR"))) ?? [], [platform, search]);
  const service = platform?.services.find((item) => item.id === serviceId) ?? platform?.services[0];

  function updatePackage(updated: AdminPackage) { setCatalogState((current) => current.map((platformItem) => ({ ...platformItem, services: platformItem.services.map((serviceItem) => serviceItem.id === serviceId ? { ...serviceItem, packages: serviceItem.packages.map((item) => item.id === updated.id ? updated : item) } : serviceItem) }))); }
  function addPackage(created: AdminPackage) { setCatalogState((current) => current.map((platformItem) => ({ ...platformItem, services: platformItem.services.map((serviceItem) => serviceItem.id === serviceId ? { ...serviceItem, packages: [...serviceItem.packages, created].sort((a, b) => a.quantity - b.quantity) } : serviceItem) }))); }

  if (!platform) return <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">Henüz platform bulunmuyor.</p>;
  return <div className="space-y-6">
    <section className="rounded-[28px] border border-violet-100 bg-white p-5 shadow-card sm:p-7"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-600 text-white"><BoxesIcon className="h-5 w-5" /></span><div><h2 className="text-lg font-black">Platform seç</h2><p className="mt-1 text-xs text-muted">Katalogdaki platform, hizmet ve paketleri yönetin.</p></div></div><div className="mt-5 flex gap-2 overflow-x-auto pb-1">{catalogState.map((item) => <button key={item.id} type="button" onClick={() => { setPlatformId(item.id); setServiceId(item.services[0]?.id ?? 0); setSearch(""); }} className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-extrabold transition ${item.id === platform.id ? "border-violet-600 bg-violet-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-violet-200"}`}>{item.name}<span className={`ml-2 inline-block h-2 w-2 rounded-full ${item.isActive ? "bg-emerald-400" : "bg-slate-300"}`} /></button>)}</div><details className="mt-4"><summary className="cursor-pointer text-xs font-extrabold text-violet-600">{platform.name} platform ayarları</summary><CatalogEditor key={platform.id} kind="platforms" item={platform} /></details></section>
    <section className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]"><aside className="h-fit rounded-[28px] border border-[#e8e4f1] bg-white p-4 shadow-card"><label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className={`${inputClass} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Hizmet ara" /></label><div className="mt-3 space-y-1.5">{filteredServices.map((item) => <button key={item.id} type="button" onClick={() => setServiceId(item.id)} className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${item.id === service?.id ? "bg-violet-50 text-violet-700" : "text-slate-600 hover:bg-slate-50"}`}><span className="truncate">{item.name}</span><span className="shrink-0 text-[10px] text-slate-400">{item.packages.length}</span></button>)}{filteredServices.length === 0 && <p className="px-2 py-5 text-center text-xs text-slate-400">Hizmet bulunamadı.</p>}</div></aside>
      <div className="min-w-0 overflow-hidden rounded-[28px] border border-[#e8e4f1] bg-white shadow-card">{service ? <><div className="border-b border-slate-100 px-5 py-5 sm:px-7"><div className="flex items-center gap-2"><h2 className="font-black">{service.name}</h2><StatusBadge active={service.isActive} /></div><p className="mt-1 text-xs text-slate-400">{platform.name} · {service.packages.length} paket</p><details className="mt-3"><summary className="cursor-pointer text-xs font-extrabold text-violet-600">Hizmet ayarlarını düzenle</summary><CatalogEditor key={service.id} kind="services" item={{ ...service, platformId: platform.id }} platformOptions={catalogState.map((item) => ({ id: item.id, name: item.name }))} /></details></div><div className="space-y-3 p-4 sm:p-6"><div className="hidden grid-cols-[1fr_1fr_1fr_0.8fr_1.3fr] gap-3 px-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 md:grid"><span>Paket miktarı</span><span>Satış fiyatı</span><span>Referans fiyat</span><span>Durum</span><span>İşlem</span></div>{service.packages.map((item) => <PackageRow key={item.id} item={item} onSaved={updatePackage} />)}{service.packages.length === 0 && <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-400">Bu hizmet için henüz paket yok.</p>}<NewPackageForm key={service.id} service={service} onCreated={addPackage} /></div></> : <p className="p-8 text-center text-sm text-slate-400">Bu platformda hizmet bulunmuyor.</p>}</div>
    </section>
  </div>;
}

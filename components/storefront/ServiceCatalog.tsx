"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "@/components/Icons";
import { formatCurrency, getPlatformPresentation } from "@/lib/catalog";

export type ServiceSummary = { id: number; name: string; slug: string; description: string; packageCount: number; startingPrice: string | null };

export function ServiceCatalog({ platformSlug, services }: { platformSlug: string; services: ServiceSummary[] }) {
  const [query, setQuery] = useState("");
  const platformStyle = getPlatformPresentation(platformSlug);
  const PlatformIcon = platformStyle.icon;
  const visible = useMemo(() => {
    const value = query.trim().toLocaleLowerCase("tr-TR");
    return value ? services.filter((item) => `${item.name} ${item.description}`.toLocaleLowerCase("tr-TR").includes(value)) : services;
  }, [query, services]);

  return (
    <div>
      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-100">
        <Search className="h-4 w-4 shrink-0 text-violet-600" />
        <span className="sr-only">Hizmet ara</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Takipçi, beğeni, izlenme..." />
      </label>
      <div className="mt-6 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((service) => (
          <article key={service.id} className="group flex min-h-[224px] min-w-0 flex-col rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_6px_22px_rgba(30,36,70,.04)] transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_10px_28px_rgba(30,36,70,.07)]">
            <div className="flex min-w-0 items-start justify-between gap-3"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${platformStyle.gradient} text-white`}><PlatformIcon className="h-5 w-5" /></span>{service.startingPrice && <span className="max-w-[68%] rounded-full bg-emerald-50 px-3 py-1.5 text-right text-xs font-extrabold text-emerald-700">{formatCurrency(service.startingPrice)}&apos;den başlayan</span>}</div>
            <h2 className="mt-4 text-lg font-extrabold tracking-[-.02em]">{service.name}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{service.description}</p>
            <div className="mt-auto flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><span className="text-xs font-bold text-slate-400">{service.packageCount} aktif paket</span><Link href={`/${platformSlug}/${service.slug}`} className="inline-flex items-center gap-1 text-xs font-extrabold text-violet-600">Paketleri İncele <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" /></Link></div>
          </article>
        ))}
      </div>
      {visible.length === 0 && <div className="mt-8 rounded-[20px] border border-dashed border-violet-200 bg-white p-8 text-center text-sm text-muted">Aramanla eşleşen bir hizmet bulunamadı.</div>}
    </div>
  );
}

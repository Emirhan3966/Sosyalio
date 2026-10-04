"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Star } from "@/components/Icons";
import { formatCurrency } from "@/lib/catalog";

export type StorePackage = {
  id: number;
  quantity: number;
  price: string;
  referencePrice: string | null;
  deliveryLabel: string;
  isPopular: boolean;
};

const initialPackageCount = 10;

export function PackageCards({ packages, serviceName }: { packages: StorePackage[]; serviceName: string }) {
  const [expanded, setExpanded] = useState(false);
  const visiblePackages = expanded ? packages : packages.slice(0, initialPackageCount);
  const hasMore = packages.length > initialPackageCount;

  return (
    <div>
      <div className="grid auto-rows-fr grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visiblePackages.map((item) => {
          const hasDiscount = item.referencePrice != null && Number(item.referencePrice) > Number(item.price);
          return (
            <article
              key={item.id}
              className={`group relative flex min-w-0 flex-col overflow-hidden rounded-[18px] border bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-[0_10px_28px_rgba(30,36,70,.07)] sm:p-5 ${item.isPopular ? "border-violet-300 ring-1 ring-violet-100" : "border-slate-200"}`}
            >
              <div className="flex min-h-6 items-start justify-between gap-2">
                <span className="truncate text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">{serviceName}</span>
                {item.isPopular && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-100 px-2 py-1 text-[9px] font-extrabold text-violet-700"><Star className="h-3 w-3" /> Popüler</span>}
              </div>
              <div className="mt-3">
                <h3 className="break-words text-[clamp(1.5rem,4vw,2rem)] font-black leading-none tracking-[-.045em] text-slate-900">{item.quantity.toLocaleString("tr-TR")}</h3>
                <p className="mt-1.5 truncate text-xs font-bold text-slate-500">{serviceName}</p>
              </div>
              <div className="my-4 h-px bg-slate-100" />
              <div className="min-h-[58px]">
                <strong className="block break-all text-[clamp(1rem,2vw,1.25rem)] font-black leading-tight tracking-[-.025em] text-violet-700">{formatCurrency(item.price)}</strong>
                <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1.5">
                  {hasDiscount && <del className="break-all text-[11px] font-semibold text-slate-400">{formatCurrency(item.referencePrice!)}</del>}
                  {hasDiscount && <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700">%5 Daha Uygun</span>}
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-[10px] font-semibold leading-4 text-slate-500 sm:text-[11px]">
                <p className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /><span>Teslimat: {item.deliveryLabel}</span></p>
                <p className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />Şifre gerekmez</p>
              </div>
              <div className="mt-auto pt-4">
                <Link href={`/siparis?package=${item.id}`} className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-2 py-2 text-center text-[11px] font-extrabold text-white transition hover:bg-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-100 sm:text-xs">
                  Paketi Seç <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      {hasMore && (
        <div className="mt-7 flex justify-center">
          <button type="button" onClick={() => setExpanded((value) => !value)} className="btn-secondary min-w-[220px]">
            {expanded ? "Daha Az Paket Göster" : `Diğer Paketleri Göster (${packages.length - initialPackageCount})`}
          </button>
        </div>
      )}
    </div>
  );
}

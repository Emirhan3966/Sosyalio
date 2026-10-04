"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "@/components/Icons";
import { getPlatformPresentation } from "@/lib/catalog";

export type PlatformSummary = { id: number; name: string; slug: string; description: string; serviceCount: number };

const conciseDescriptions: Record<string, string> = {
  instagram: "Takipçi, beğeni ve izlenme hizmetleri", tiktok: "Takipçi, beğeni ve video izlenme hizmetleri", youtube: "Abone, beğeni ve video izlenme hizmetleri", x: "Takipçi, beğeni ve etkileşim hizmetleri", twitter: "Takipçi, beğeni ve etkileşim hizmetleri", facebook: "Sayfa, gönderi ve video hizmetleri", spotify: "Dinlenme, takipçi ve kayıt hizmetleri", telegram: "Kanal, grup ve görüntülenme hizmetleri", discord: "Sunucu üyesi ve topluluk hizmetleri", twitch: "Takipçi ve yayın izlenme hizmetleri", linkedin: "Bağlantı, takipçi ve etkileşim hizmetleri", threads: "Takipçi ve gönderi etkileşim hizmetleri", pinterest: "Takipçi, pin ve etkileşim hizmetleri", snapchat: "Takipçi ve içerik görüntülenme hizmetleri",
};
const popularPlatforms = new Set(["instagram", "tiktok", "youtube", "x", "twitter"]);

export function PlatformCatalog({ platforms }: { platforms: PlatformSummary[] }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    return normalized ? platforms.filter((item) => `${item.name} ${item.description}`.toLocaleLowerCase("tr-TR").includes(normalized)) : platforms;
  }, [platforms, query]);

  return (
    <div>
      <label className="mx-auto mt-8 flex max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-100">
        <Search className="h-4 w-4 shrink-0 text-violet-600" />
        <span className="sr-only">Platform ara</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-slate-400" placeholder="Platform ara..." />
      </label>
      <div className="mt-8 grid auto-rows-fr gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {results.map((item) => {
          const style = getPlatformPresentation(item.slug);
          const Icon = style.icon;
          return (
            <article key={item.id} className="group relative flex min-h-[218px] min-w-0 flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_6px_22px_rgba(30,36,70,.04)] transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_10px_28px_rgba(30,36,70,.07)]">
              <span className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${style.gradient}`} />
              {popularPlatforms.has(item.slug) && <span className="absolute right-4 top-4 rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-violet-600">Popüler</span>}
              <div className={`relative grid h-14 w-14 place-items-center rounded-2xl border border-white/80 ${style.soft} ${style.text} shadow-[0_6px_18px_rgba(30,41,59,.08)]`}><Icon className="h-7 w-7" /></div>
              <h3 className="relative mt-4 text-lg font-extrabold tracking-[-.02em]">{item.name}</h3>
              <p className="relative mt-2 text-sm leading-6 text-muted">{conciseDescriptions[item.slug] ?? item.description}</p>
              <div className="relative mt-auto flex min-w-0 items-end justify-between gap-3 pt-5">
                <span className="whitespace-nowrap text-xs font-bold text-slate-400">{item.serviceCount} Hizmet</span>
                <Link href={`/${item.slug}`} className={`inline-flex min-w-0 items-center justify-end gap-1 text-right text-xs font-extrabold ${style.text}`}>Hizmetleri İncele <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" /></Link>
              </div>
            </article>
          );
        })}
      </div>
      {results.length === 0 && <div className="mt-8 rounded-[20px] border border-dashed border-violet-200 bg-white p-8 text-center text-sm text-muted">Aramanla eşleşen aktif bir platform bulunamadı.</div>}
    </div>
  );
}

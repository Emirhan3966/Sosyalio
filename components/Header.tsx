import Link from "next/link";
import { ArrowRight, ChevronDown, Menu } from "./Icons";
import { getPlatformPresentation } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/#anasayfa" className="inline-flex shrink-0 items-center gap-2.5" aria-label="Sosyalio ana sayfa">
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-[0_5px_14px_rgba(108,76,246,.2)]">
        <span className="h-3.5 w-3.5 rounded-full border-[3px] border-white" />
        <span className="absolute right-[7px] top-[7px] h-1.5 w-1.5 rounded-full bg-white" />
      </span>
      <span className={`text-xl font-extrabold tracking-[-0.04em] ${light ? "text-white" : "text-ink"}`}>sosyal<span className="text-violet-500">io</span></span>
    </Link>
  );
}

export async function Header() {
  const platforms = await prisma.servicePlatform.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" }, take: 13, select: { name: true, slug: true, description: true } });
  const links = [["Ana Sayfa", "/#anasayfa"], ["Sipariş Sorgula", "/#sorgula"], ["Destek", "/#destek"]] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-[0_2px_16px_rgba(15,23,42,.035)] backdrop-blur-xl">
      <div className="container-shell flex h-[72px] items-center justify-between gap-5">
        <Logo />
        <nav className="hidden items-center gap-5 lg:flex xl:gap-6" aria-label="Ana navigasyon">
          <Link href="/#anasayfa" className="nav-link">Ana Sayfa</Link>
          <div className="group relative">
            <Link href="/#hizmetler" className="nav-link flex items-center gap-1.5 py-6">Sosyal Medya Hizmetleri <ChevronDown className="h-4 w-4 transition group-hover:rotate-180" /></Link>
            <div className="invisible absolute left-1/2 top-[58px] w-[min(680px,calc(100vw-48px))] -translate-x-1/2 translate-y-2 rounded-[20px] border border-slate-200 bg-white p-4 opacity-0 shadow-[0_20px_55px_rgba(30,41,59,.12)] transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              <div className="grid grid-cols-3 gap-1.5">
                {platforms.map((platform) => {
                  const style = getPlatformPresentation(platform.slug);
                  const Icon = style.icon;
                  return <Link key={platform.slug} href={`/${platform.slug}`} className="flex min-w-0 items-center gap-3 rounded-xl p-2.5 transition hover:bg-slate-50"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${style.gradient} text-white`}><Icon className="h-4 w-4" /></span><span className="min-w-0"><strong className="block truncate text-sm">{platform.name}</strong><span className="block truncate text-[11px] text-slate-400">{platform.description}</span></span></Link>;
                })}
              </div>
            </div>
          </div>
          {links.slice(1).map(([label, href]) => <Link key={label} href={href} className="nav-link">{label}</Link>)}
        </nav>
        <Link href="/#hizmetler" className="btn-primary hidden shrink-0 !min-h-11 !px-4 !py-2.5 sm:inline-flex xl:!px-5">Hizmetleri İncele <ArrowRight className="h-4 w-4" /></Link>
        <details className="group relative lg:hidden">
          <summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700"><Menu /></summary>
          <div className="absolute right-0 top-14 max-h-[75vh] w-[min(320px,calc(100vw-40px))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-soft">
            <Link href="/#anasayfa" className="mobile-nav-link">Ana Sayfa</Link>
            <p className="px-4 pb-2 pt-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Sosyal Medya Hizmetleri</p>
            {platforms.map((platform) => <Link key={platform.slug} href={`/${platform.slug}`} className="mobile-nav-link">{platform.name}</Link>)}
            {links.slice(1).map(([label, href]) => <Link key={label} href={href} className="mobile-nav-link">{label}</Link>)}
            <Link href="/#hizmetler" className="btn-primary mt-2 w-full">Hizmetleri İncele</Link>
          </div>
        </details>
      </div>
    </header>
  );
}

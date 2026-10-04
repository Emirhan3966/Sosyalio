import Link from "next/link";
import { Logo } from "./Header";

const legalLinks = [
  ["Gizlilik Politikası", "/gizlilik"],
  ["KVKK Aydınlatma Metni", "/kvkk"],
  ["Kullanım Şartları", "/kullanim-sartlari"],
  ["İptal ve İade Politikası", "/iptal-iade"],
] as const;

export function SiteFooter() {
  return (
    <footer id="destek" className="bg-[#111827] pb-8 pt-14 text-white">
      <div className="container-shell">
        <div className="grid gap-10 border-b border-white/10 pb-11 sm:grid-cols-2 lg:grid-cols-[1.35fr_.8fr_1.15fr]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-md text-sm leading-6 text-slate-400">
              Sosyal medya hizmetlerini açık fiyatlar ve takip edilebilir bir sipariş akışıyla sunan düzenli hizmet kataloğu.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-extrabold">Yardım</h2>
            <nav aria-label="Yardım bağlantıları" className="mt-4 space-y-3 text-sm text-slate-400">
              <Link className="block transition hover:text-white" href="/iletisim">İletişim</Link>
              <Link className="block transition hover:text-white" href="/#sorgula">Sipariş Sorgula</Link>
              <Link className="block transition hover:text-white" href="/#sss">Sık Sorulan Sorular</Link>
            </nav>
          </div>
          <div>
            <h2 className="text-sm font-extrabold">Yasal ve bilgilendirme</h2>
            <nav aria-label="Yasal bağlantılar" className="mt-4 grid gap-3 text-sm text-slate-400 sm:grid-cols-2 lg:grid-cols-1">
              {legalLinks.map(([label, href]) => <Link key={href} className="block transition hover:text-white" href={href}>{label}</Link>)}
            </nav>
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-7 text-xs leading-5 text-slate-500 lg:flex-row lg:items-end lg:justify-between">
          <p>© {new Date().getFullYear()} Sosyalio. Tüm hakları saklıdır.</p>
          <p className="max-w-2xl lg:pr-20 lg:text-right">
            Instagram, TikTok, YouTube, X ve Facebook adları ilgili marka sahiplerine aittir. Sosyalio bu platformların resmi temsilcisi veya ortağı değildir.
          </p>
        </div>
      </div>
    </footer>
  );
}

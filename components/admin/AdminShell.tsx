"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { Logo } from "@/components/Header";
import { BoxesIcon, ExternalLink, HomeIcon, LogOut, MessageCircle, OrdersIcon } from "@/components/Icons";
import { safeSupportJson, type SupportApiPayload } from "@/lib/support-client";

type SupportSummaryPayload = SupportApiPayload & { unreadTotal: number };

const navigation = [
  { href: "/admin", label: "Genel Bakış", icon: HomeIcon },
  { href: "/admin/siparisler", label: "Siparişler", icon: OrdersIcon },
  { href: "/admin/hizmetler", label: "Hizmetler", icon: BoxesIcon },
  { href: "/admin/destek", label: "Canlı Destek", icon: MessageCircle },
];

export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [supportUnread, setSupportUnread] = useState(0);

  useEffect(() => {
    let active = true;
    const loadUnread = async () => {
      try {
        const response = await fetch("/api/admin/support/conversations?summary=1", { cache: "no-store" });
        if (!response.ok) return;
        const data = await safeSupportJson<SupportSummaryPayload>(response, "Destek bildirimleri alınamadı.");
        if (active) setSupportUnread(data.unreadTotal ?? 0);
      } catch { /* Keep navigation usable during a temporary request failure. */ }
    };
    void loadUnread();
    const timer = window.setInterval(loadUnread, 4000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f8f7fc] lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-[#eae6f3] bg-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-[72px] items-center justify-between px-5 lg:h-24 lg:px-7"><Logo /><span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-violet-600">Admin</span></div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:block lg:space-y-2 lg:px-5 lg:pb-0" aria-label="Admin navigasyonu">
          {navigation.map((item) => { const Icon = item.icon; const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href); const unread = item.href === "/admin/destek" ? supportUnread : 0; return <Link key={item.href} href={item.href} className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${active ? "bg-violet-600 text-white shadow-[0_10px_24px_rgba(108,76,246,.24)]" : "text-slate-500 hover:bg-violet-50 hover:text-violet-700"}`}><Icon className="h-5 w-5" /><span>{item.label}</span>{unread > 0 && <span className={`ml-auto min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-black ${active ? "bg-white text-violet-700" : "bg-violet-600 text-white"}`}>{unread > 99 ? "99+" : unread}</span>}</Link>; })}
        </nav>
        <div className="hidden lg:absolute lg:bottom-6 lg:left-5 lg:right-5 lg:block">
          <div className="rounded-2xl bg-slate-50 p-4"><p className="truncate text-xs font-bold text-slate-600">{email}</p><div className="mt-3 grid grid-cols-2 gap-2"><Link href="/" target="_blank" className="grid h-10 place-items-center rounded-xl bg-white text-slate-500 shadow-sm transition hover:text-violet-600" title="Siteyi aç"><ExternalLink className="h-4 w-4" /></Link><button type="button" onClick={logout} disabled={loggingOut} className="grid h-10 place-items-center rounded-xl bg-white text-slate-500 shadow-sm transition hover:text-red-600 disabled:opacity-50" title="Çıkış yap"><LogOut className="h-4 w-4" /></button></div></div>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex h-[72px] items-center justify-between border-b border-[#eae6f3] bg-white px-5 sm:px-8 lg:h-20"><div><p className="text-xs font-bold uppercase tracking-[.13em] text-violet-500">Sosyalio Yönetim</p><p className="mt-1 hidden text-sm text-slate-400 sm:block">Mağazanızın güncel durumu</p></div><div className="flex items-center gap-2 lg:hidden"><Link href="/" className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-500"><ExternalLink className="h-4 w-4" /></Link><button type="button" onClick={logout} disabled={loggingOut} className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-600"><LogOut className="h-4 w-4" /></button></div></header>
        <div className="p-5 sm:p-8 lg:p-10">{children}</div>
      </div>
    </div>
  );
}

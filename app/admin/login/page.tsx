import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { Logo } from "@/components/Header";
import { Lock, Shield } from "@/components/Icons";
import { getAdminSession } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Yönetici Girişi", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin");

  return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#faf9ff] px-5 py-12"><div className="hero-grid absolute inset-0" /><div className="absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-200/50 blur-3xl" /><div className="relative w-full max-w-md rounded-[34px] border border-white bg-white/95 p-7 shadow-[0_30px_90px_rgba(55,42,120,.16)] backdrop-blur sm:p-10"><div className="flex justify-center"><Logo /></div><div className="mt-8 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-600"><Lock className="h-6 w-6" /></span><h1 className="mt-5 text-2xl font-black tracking-tight">Yönetim paneline giriş</h1><p className="mt-2 text-sm leading-6 text-muted">Mağaza yönetimine devam etmek için hesabınızla giriş yapın.</p></div><LoginForm /><p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-400"><Shield className="h-4 w-4 text-violet-500" />Güvenli, süreli yönetici oturumu</p></div></main>;
}

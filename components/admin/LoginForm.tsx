"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail } from "@/components/Icons";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Giriş yapılamadı.");
      router.replace("/admin");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Giriş yapılamadı.");
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-2xl border border-[#e7e2f1] bg-white py-3.5 pl-12 pr-4 text-sm outline-none ring-violet-200 transition focus:border-violet-400 focus:ring-4";

  return <form onSubmit={handleSubmit} className="mt-8 space-y-5"><label className="block"><span className="mb-2 block text-sm font-bold">E-posta adresi</span><span className="relative block"><Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input className={inputClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" placeholder="admin@example.com" required /></span></label><label className="block"><span className="mb-2 block text-sm font-bold">Parola</span><span className="relative block"><Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input className={inputClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" minLength={12} maxLength={200} placeholder="••••••••••••" required /></span></label>{error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}<button type="submit" disabled={loading} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Giriş yapılıyor..." : "Güvenli Giriş"}<ArrowRight className="h-4 w-4" /></button></form>;
}

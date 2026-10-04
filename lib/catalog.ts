import type { ComponentType, SVGProps } from "react";
import { Discord, Facebook, Instagram, Linkedin, Pinterest, Snapchat, Spotify, Telegram, Threads, TikTok, Twitch, XIcon, Youtube } from "@/components/Icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export const platformPresentation: Record<string, { icon: Icon; gradient: string; soft: string; text: string }> = {
  instagram: { icon: Instagram, gradient: "from-fuchsia-500 via-pink-500 to-orange-400", soft: "bg-fuchsia-50", text: "text-fuchsia-600" },
  tiktok: { icon: TikTok, gradient: "from-slate-950 to-cyan-500", soft: "bg-cyan-50", text: "text-cyan-700" },
  youtube: { icon: Youtube, gradient: "from-red-500 to-rose-600", soft: "bg-red-50", text: "text-red-600" },
  twitter: { icon: XIcon, gradient: "from-slate-700 to-slate-950", soft: "bg-slate-100", text: "text-slate-800" },
  x: { icon: XIcon, gradient: "from-slate-700 to-slate-950", soft: "bg-slate-100", text: "text-slate-800" },
  facebook: { icon: Facebook, gradient: "from-blue-500 to-blue-700", soft: "bg-blue-50", text: "text-blue-700" },
  spotify: { icon: Spotify, gradient: "from-emerald-400 to-green-600", soft: "bg-emerald-50", text: "text-emerald-700" },
  telegram: { icon: Telegram, gradient: "from-sky-400 to-blue-600", soft: "bg-sky-50", text: "text-sky-700" },
  discord: { icon: Discord, gradient: "from-indigo-500 to-violet-600", soft: "bg-indigo-50", text: "text-indigo-700" },
  twitch: { icon: Twitch, gradient: "from-purple-500 to-violet-700", soft: "bg-purple-50", text: "text-purple-700" },
  linkedin: { icon: Linkedin, gradient: "from-sky-600 to-blue-800", soft: "bg-sky-50", text: "text-sky-800" },
  threads: { icon: Threads, gradient: "from-neutral-700 to-black", soft: "bg-neutral-100", text: "text-neutral-800" },
  pinterest: { icon: Pinterest, gradient: "from-red-500 to-red-700", soft: "bg-red-50", text: "text-red-700" },
  snapchat: { icon: Snapchat, gradient: "from-yellow-300 to-yellow-500", soft: "bg-yellow-50", text: "text-yellow-700" },
};

export function getPlatformPresentation(slug: string) {
  return platformPresentation[slug] ?? platformPresentation.instagram;
}

export function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(value));
}

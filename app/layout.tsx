import type { Metadata } from "next";
import { SupportWidget } from "@/components/support/SupportWidget";
import { FooterVisibility } from "@/components/FooterVisibility";
import { SiteFooter } from "@/components/SiteFooter";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Sosyalio — Sosyal Medya Hizmetleri Pazaryeri",
    template: "%s — Sosyalio",
  },
  description: "Instagram, TikTok, YouTube, X ve diğer platformlar için düzenli, takip edilebilir sosyal medya hizmetleri kataloğu.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}<FooterVisibility><SiteFooter /></FooterVisibility><SupportWidget /></body>
    </html>
  );
}

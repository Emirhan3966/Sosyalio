import type { Metadata } from "next";
import { getSiteUrl } from "./site-url";

export function createPublicMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  const canonical = new URL(path, getSiteUrl()).toString();
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title: `${title} — Sosyalio`, description, url: canonical, siteName: "Sosyalio", locale: "tr_TR", type: "website" },
  };
}

import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const platforms = await prisma.servicePlatform.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    select: {
      slug: true,
      updatedAt: true,
      services: { where: { isActive: true }, select: { slug: true, updatedAt: true } },
    },
  });
  const updatedDates = platforms.flatMap((platform) => [platform.updatedAt, ...platform.services.map((service) => service.updatedAt)]);
  const catalogUpdatedAt = updatedDates.reduce((latest, value) => value > latest ? value : latest, new Date(0));
  const informationUpdatedAt = new Date("2026-09-28T00:00:00.000Z");

  return [
    { url: siteUrl, lastModified: catalogUpdatedAt, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/siparis`, lastModified: catalogUpdatedAt, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/iletisim`, lastModified: informationUpdatedAt, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/gizlilik`, lastModified: informationUpdatedAt, changeFrequency: "yearly", priority: 0.4 },
    { url: `${siteUrl}/kvkk`, lastModified: informationUpdatedAt, changeFrequency: "yearly", priority: 0.4 },
    { url: `${siteUrl}/kullanim-sartlari`, lastModified: informationUpdatedAt, changeFrequency: "yearly", priority: 0.4 },
    { url: `${siteUrl}/iptal-iade`, lastModified: informationUpdatedAt, changeFrequency: "yearly", priority: 0.5 },
    ...platforms.flatMap((platform) => [
      { url: `${siteUrl}/${platform.slug}`, lastModified: platform.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 },
      ...platform.services.map((service) => ({ url: `${siteUrl}/${platform.slug}/${service.slug}`, lastModified: service.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ]),
  ];
}

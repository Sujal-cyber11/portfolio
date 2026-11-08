import type { MetadataRoute } from "next";
import { getFestivals } from "@/lib/content";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return [
    {
      url: siteUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/projects`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/achievements`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...getFestivals().map((festival) => ({
      url: `${siteUrl}/festival/${festival.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}

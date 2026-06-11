import type { MetadataRoute } from "next";

const SITE = "https://annapurnaoakland.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/menu`, changeFrequency: "weekly", priority: 0.9 },
  ];
}

import type { MetadataRoute } from "next";

const SITE = "https://annapurnaoakland.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep the admin panel, checkout, and order-tracking pages out of search.
        disallow: ["/admin", "/admin/", "/checkout", "/order/", "/api/"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}

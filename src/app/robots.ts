import type { MetadataRoute } from "next";

const SITE = "https://annapurnaoakland.com";

export default function robots(): MetadataRoute.Robots {
  // Non-production deployments (dev.annapurnaoakland.com, *.vercel.app previews)
  // serve the same content as prod — block all crawling so they're never indexed
  // as duplicates of the live site.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep non-public + duplicate-content pages out of search: admin,
        // checkout, order tracking, API, the design previews (/preview/*), and
        // the print flyer. Preview pages are alternate designs of the same
        // content — indexing them risks duplicate-content penalties.
        disallow: ["/admin", "/admin/", "/checkout", "/order/", "/api/", "/preview", "/preview/", "/flyer"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}

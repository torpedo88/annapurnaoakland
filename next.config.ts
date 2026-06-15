import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "www.themealdb.com", pathname: "/images/**" },
      // Admin-uploaded dish photos in Supabase Storage (public bucket).
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  async redirects() {
    return [
      // /order has no index page (only /order/[id] tracking). Google indexed the
      // bare /order URL, which 404s. Permanently (308) route it to the menu.
      { source: "/order", destination: "/menu", permanent: true },
    ];
  },
};

export default nextConfig;

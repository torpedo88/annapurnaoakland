import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const CARD_BG = "#1C1712";
const GOLD = "#C9A24B";
const CREAM = "#F3E9D6";
const MUTED = "#8A8276";
const BORDER = "1px solid rgba(201,162,75,0.18)";

type Tool = {
  name: string;
  envVar: string;
  configured: boolean;
  dashboard: string;
  gives: string[];
  note: string;
};

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "manager")) redirect("/admin");

  const tools: Tool[] = [
    {
      name: "Google Analytics 4",
      envVar: "NEXT_PUBLIC_GA_ID",
      configured: Boolean(process.env.NEXT_PUBLIC_GA_ID),
      dashboard: "https://analytics.google.com/",
      gives: ["Traffic & realtime visitors", "Acquisition sources (Google, social, direct)", "Conversions & funnels", "Audience demographics"],
      note: "Pair with Google Search Console for SEO keyword data.",
    },
    {
      name: "Microsoft Clarity",
      envVar: "NEXT_PUBLIC_CLARITY_ID",
      configured: Boolean(process.env.NEXT_PUBLIC_CLARITY_ID),
      dashboard: "https://clarity.microsoft.com/",
      gives: ["Click & scroll heatmaps", "Session recordings", "Rage / dead clicks", "Where customers drop off"],
      note: "Free. Best for seeing exactly where users click and get stuck.",
    },
    {
      name: "PostHog",
      envVar: "NEXT_PUBLIC_POSTHOG_KEY",
      configured: Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY),
      dashboard: "https://us.posthog.com/",
      gives: ["Product funnels & retention", "Session replay + heatmaps", "Feature flags & A/B tests", "Custom event analytics"],
      note: "Open-source, all-in-one. Generous free tier.",
    },
    {
      name: "Umami",
      envVar: "NEXT_PUBLIC_UMAMI_WEBSITE_ID",
      configured: Boolean(process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID),
      dashboard: "https://cloud.umami.is/",
      gives: ["Cookieless pageviews", "Top pages & referrers", "Privacy-first (no cookie banner)", "Lightweight, fast"],
      note: "Open-source. Good privacy-friendly alternative to GA.",
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1 className="text-3xl mb-2" style={{ color: CREAM, fontFamily: "var(--font-display)", fontWeight: 200 }}>
        Analytics & Insights
      </h1>
      <p style={{ color: MUTED, fontSize: 14, marginBottom: 24, maxWidth: 640 }}>
        Built-in order analytics live on the{" "}
        <Link href="/admin/dashboard" style={{ color: GOLD }}>Dashboard</Link>{" "}
        (revenue trends, busiest-times heatmap, top items, channel mix). The tools below add
        website-visitor analytics. Each turns on automatically once its key is set in Vercel — green = live.
      </p>

      <div className="grid lg:grid-cols-2 gap-4">
        {tools.map((t) => (
          <div key={t.name} style={{ background: CARD_BG, border: BORDER, borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h2 style={{ color: CREAM, fontFamily: "var(--font-display)", fontWeight: 200, fontSize: 20 }}>{t.name}</h2>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "4px 10px",
                  borderRadius: 999,
                  color: t.configured ? "#14100D" : MUTED,
                  background: t.configured ? "#5FAE6A" : "transparent",
                  border: t.configured ? "none" : "1px solid rgba(201,162,75,0.3)",
                }}
              >
                {t.configured ? "Live" : "Not set up"}
              </span>
            </div>
            <ul style={{ margin: "0 0 12px", padding: 0, listStyle: "none" }}>
              {t.gives.map((g) => (
                <li key={g} style={{ color: CREAM, fontSize: 13, padding: "3px 0", display: "flex", gap: 8 }}>
                  <span style={{ color: GOLD }}>›</span>
                  {g}
                </li>
              ))}
            </ul>
            <p style={{ color: MUTED, fontSize: 12, marginBottom: 14 }}>{t.note}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <a
                href={t.dashboard}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "8px 16px",
                  borderRadius: 999,
                  background: GOLD,
                  color: "#14100D",
                  textDecoration: "none",
                }}
              >
                Open dashboard ↗
              </a>
              {!t.configured && (
                <code style={{ color: MUTED, fontSize: 12 }}>
                  set <span style={{ color: GOLD }}>{t.envVar}</span>
                </code>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: CARD_BG, border: BORDER, borderRadius: 16, padding: 20, marginTop: 16 }}>
        <h2 style={{ color: CREAM, fontFamily: "var(--font-display)", fontWeight: 200, fontSize: 20, marginBottom: 8 }}>
          SEO — Google Search Console
        </h2>
        <p style={{ color: MUTED, fontSize: 13, marginBottom: 12 }}>
          The site ships sitemap.xml, robots.txt, and Restaurant structured data. Verify the domain in
          Search Console to track search rankings, clicks, and indexing, and submit the sitemap.
        </p>
        <a
          href="https://search.google.com/search-console"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 13, fontWeight: 700, padding: "8px 16px", borderRadius: 999, background: GOLD, color: "#14100D", textDecoration: "none" }}
        >
          Open Search Console ↗
        </a>
      </div>
    </div>
  );
}

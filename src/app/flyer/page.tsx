import QRCode from "qrcode";
import { PrintButton } from "./print-button";

export const metadata = {
  title: "Reorder flyer — Annapurna",
  robots: { index: false, follow: false },
};

const ORDER_URL = "https://annapurnaoakland.com/menu?utm_source=flyer";

// Brand tokens
const BG = "#14100D", GOLD = "#C9A24B", CREAM = "#F3E9D6", MUTED = "#8A8276";

export default async function FlyerPage() {
  // High-contrast QR (dark on cream) so it scans reliably off a printed page.
  const qr = await QRCode.toDataURL(ORDER_URL, {
    margin: 1,
    width: 640,
    errorCorrectionLevel: "M",
    color: { dark: "#14100Dff", light: "#F3E9D6ff" },
  });

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#0d0a08",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        padding: "40px 16px",
        fontFamily: "var(--font-body), system-ui, sans-serif",
      }}
    >
      {/* Print rules: hide everything but the flyer, set the page to the card size. */}
      <style>{`
        @media print {
          @page { size: 4in 6in; margin: 0; }
          html, body { background: #14100D !important; }
          .no-print { display: none !important; }
          .flyer-card { box-shadow: none !important; }
        }
      `}</style>

      <div className="no-print" style={{ display: "flex", gap: 12, alignItems: "center", color: MUTED, fontSize: 14 }}>
        <PrintButton />
        <span>4×6 card · QR → {ORDER_URL.replace("https://", "")}</span>
      </div>

      {/* ── The flyer (4 × 6 in) ───────────────────────────────────────────── */}
      <div
        className="flyer-card"
        style={{
          width: "4in",
          height: "6in",
          boxSizing: "border-box",
          background: `radial-gradient(120% 80% at 50% 0%, #2a1c12 0%, ${BG} 55%)`,
          border: `1px solid rgba(201,162,75,0.35)`,
          borderRadius: 14,
          padding: "0.42in 0.4in",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          color: CREAM,
          boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        {/* Brand */}
        <p style={{ fontSize: 9, letterSpacing: "0.34em", textTransform: "uppercase", color: GOLD, margin: 0 }}>
          A Himalayan Kitchen · Oakland
        </p>
        <h1
          style={{
            fontFamily: "var(--font-serif-display), Georgia, serif",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 34,
            margin: "6px 0 0",
            color: CREAM,
          }}
        >
          Annapurna
        </h1>
        <div style={{ width: 36, height: 1, background: GOLD, margin: "10px 0 0" }} />

        {/* Hook */}
        <h2
          style={{
            fontFamily: "var(--font-serif-display), Georgia, serif",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 23,
            lineHeight: 1.15,
            margin: "16px 0 4px",
            color: CREAM,
          }}
        >
          Loved it? Order again.
        </h2>
        <p style={{ fontSize: 12, color: MUTED, margin: 0, maxWidth: "2.8in" }}>
          Scan to reorder pickup or delivery in seconds.
        </p>

        {/* QR */}
        <div
          style={{
            marginTop: 14,
            background: CREAM,
            borderRadius: 12,
            padding: 10,
            lineHeight: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Scan to order from Annapurna" width={150} height={150} style={{ display: "block" }} />
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: GOLD, margin: "10px 0 0", letterSpacing: "0.02em" }}>
          annapurnaoakland.com
        </p>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer details */}
        <div style={{ width: "100%", borderTop: "1px solid rgba(201,162,75,0.2)", paddingTop: 10 }}>
          <p style={{ fontSize: 11, color: CREAM, margin: 0, fontWeight: 600 }}>
            948 Clay Street, Oakland · (510) 250-9696
          </p>
          <p style={{ fontSize: 10.5, color: MUTED, margin: "3px 0 0" }}>
            2 minutes from 12th St Oakland BART
          </p>
          <p style={{ fontSize: 10.5, color: MUTED, margin: "2px 0 0" }}>
            Mon–Sat 11:00–21:30 · Closed Sundays · Pickup &amp; Delivery
          </p>
        </div>
      </div>

      <p className="no-print" style={{ color: MUTED, fontSize: 12, maxWidth: 360, textAlign: "center" }}>
        Tip: in the print dialog set paper to 4×6 (or “Fit to page” on letter), margins None, and enable
        “Background graphics”.
      </p>
    </main>
  );
}

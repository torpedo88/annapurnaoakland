"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print"
      style={{
        backgroundColor: "#C9A24B",
        color: "#14100D",
        border: "none",
        borderRadius: 999,
        padding: "12px 28px",
        fontWeight: 700,
        fontSize: 15,
        cursor: "pointer",
      }}
    >
      Print / Save as PDF
    </button>
  );
}

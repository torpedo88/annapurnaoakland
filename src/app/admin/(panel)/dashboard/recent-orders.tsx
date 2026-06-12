"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const GOLD = "#C9A24B", CREAM = "#F3E9D6", MUTED = "#8A8276";
const PER_PAGE = 10;

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending payment", received: "Received", preparing: "Preparing",
  ready: "Ready", courier_picked_up: "Picked up", en_route: "En route",
  out_for_delivery: "Out for delivery", completed: "Completed", delivered: "Delivered",
  cancelled: "Cancelled",
};
const PAYMENT_LABELS: Record<string, string> = { refunded: "Refunded", partially_refunded: "Partially refunded" };

function label(status: string | null, pay: string | null): string {
  if (pay && PAYMENT_LABELS[pay]) return PAYMENT_LABELS[pay];
  return STATUS_LABELS[status ?? ""] ?? status ?? "—";
}

export interface RecentOrderRow {
  id: string;
  orderNumber: number | null;
  customerName: string | null;
  total: string | null;
  status: string | null;
  paymentStatus: string | null;
  createdAt: Date | string | null;
}

const money = (v: string | null) => `$${Number(v ?? 0).toFixed(2)}`;
const fmtDate = (d: Date | string | null) =>
  d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

export function RecentOrders({ rows }: { rows: RecentOrderRow[] }) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const slice = rows.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  if (rows.length === 0) {
    return <p style={{ color: MUTED, padding: "12px 0" }}>No orders yet</p>;
  }

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: CREAM }}>
          <thead>
            <tr style={{ textAlign: "left", color: MUTED, fontSize: 13 }}>
              <th style={{ padding: "8px 12px 8px 0", fontWeight: 500 }}>#</th>
              <th style={{ padding: "8px 12px", fontWeight: 500 }}>Customer</th>
              <th style={{ padding: "8px 12px", fontWeight: 500 }}>Total</th>
              <th style={{ padding: "8px 12px", fontWeight: 500 }}>Status</th>
              <th style={{ padding: "8px 0 8px 12px", fontWeight: 500 }}>Placed</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((o) => (
              <tr
                key={o.id}
                onClick={() => router.push(`/admin/orders/${o.id}`)}
                style={{ borderTop: "1px solid rgba(201,162,75,0.10)", cursor: "pointer" }}
              >
                <td style={{ padding: "10px 12px 10px 0", color: GOLD }}>{o.orderNumber ?? "—"}</td>
                <td style={{ padding: "10px 12px" }}>{o.customerName || "—"}</td>
                <td style={{ padding: "10px 12px" }}>{money(o.total)}</td>
                <td style={{ padding: "10px 12px", color: MUTED }}>{label(o.status, o.paymentStatus)}</td>
                <td style={{ padding: "10px 0 10px 12px", color: MUTED }}>{fmtDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
          <span style={{ color: MUTED, fontSize: 13 }}>
            {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, rows.length)} of {rows.length}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <PgBtn disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</PgBtn>
            <span style={{ color: CREAM, fontSize: 13, alignSelf: "center" }}>{page + 1} / {pages}</span>
            <PgBtn disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next</PgBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function PgBtn({ children, disabled, onClick }: { children: React.ReactNode; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: "transparent", color: disabled ? MUTED : CREAM,
        border: "1px solid rgba(201,162,75,0.2)", borderRadius: 999,
        padding: "5px 14px", fontSize: 13, cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

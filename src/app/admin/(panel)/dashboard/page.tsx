import { redirect } from "next/navigation";
import { sql, and, gte, eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";

export const dynamic = "force-dynamic";

// ─── Styling tokens (match existing admin pages) ────────────────────────────
const PAGE_BG = "#14100D";
const CARD_BG = "#1C1712";
const GOLD = "#C9A24B";
const CREAM = "#F3E9D6";
const MUTED = "#8A8276";
const CARD_BORDER = "1px solid rgba(201,162,75,0.18)";

function money(x: number | string | null | undefined): string {
  return `$${(Number(x) || 0).toFixed(2)}`;
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Statuses considered "completed" / cancelled — everything else is in-flight.
const STATUS_LABELS: Record<string, string> = {
  received: "Received",
  preparing: "Preparing",
  ready: "Ready",
  courier_picked_up: "Picked up",
  en_route: "En route",
  completed: "Completed",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "manager")) {
    redirect("/admin");
  }

  // Day boundary in America/Los_Angeles, expressed for the timestamptz column.
  const startOfTodayLA = sql<string>`(date_trunc('day', now() AT TIME ZONE 'America/Los_Angeles') AT TIME ZONE 'America/Los_Angeles')`;
  const sevenDaysAgo = sql<string>`(now() - interval '7 days')`;
  const thirtyDaysAgo = sql<string>`(now() - interval '30 days')`;

  const paid = eq(orders.paymentStatus, "paid");

  const [
    todayAgg,
    todayByStatus,
    weekAgg,
    allTimeAgg,
    topItems,
    recent,
  ] = await Promise.all([
    // 1. Today: count + paid revenue
    db
      .select({
        count: sql<number>`count(*)::int`,
        revenue: sql<string>`coalesce(sum(${orders.total}) filter (where ${orders.paymentStatus} = 'paid'), 0)`,
      })
      .from(orders)
      .where(gte(orders.createdAt, startOfTodayLA)),

    // 1b. Today: count by status
    db
      .select({
        status: orders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(gte(orders.createdAt, startOfTodayLA))
      .groupBy(orders.status),

    // 2. Last 7 days: count + paid revenue
    db
      .select({
        count: sql<number>`count(*)::int`,
        revenue: sql<string>`coalesce(sum(${orders.total}) filter (where ${orders.paymentStatus} = 'paid'), 0)`,
      })
      .from(orders)
      .where(gte(orders.createdAt, sevenDaysAgo)),

    // 3. All-time: total orders + total paid revenue
    db
      .select({
        count: sql<number>`count(*)::int`,
        revenue: sql<string>`coalesce(sum(${orders.total}) filter (where ${orders.paymentStatus} = 'paid'), 0)`,
      })
      .from(orders),

    // 4. Top 5 items (last 30 days), paid orders only, by quantity sold
    db
      .select({
        itemName: orderItems.itemName,
        qty: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(paid, gte(orders.createdAt, thirtyDaysAgo)))
      .groupBy(orderItems.itemName)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(5),

    // 5. Recent orders (latest 8)
    db
      .select({
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        total: orders.total,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(8),
  ]);

  const today = todayAgg[0] ?? { count: 0, revenue: "0" };
  const week = weekAgg[0] ?? { count: 0, revenue: "0" };
  const allTime = allTimeAgg[0] ?? { count: 0, revenue: "0" };

  const statusRows = todayByStatus.filter((r) => (r.count ?? 0) > 0);

  return (
    <div style={{ background: PAGE_BG, minHeight: "100%", padding: "24px" }}>
      <h1
        className="text-3xl mb-6"
        style={{ color: CREAM, fontFamily: "var(--font-display)", fontWeight: 200 }}
      >
        Dashboard
      </h1>

      {/* ─── Summary cards ─────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Orders" value={String(today.count)} hint="created today (PT)" />
        <StatCard label="Today's Revenue" value={money(today.revenue)} hint="paid orders" accent />
        <StatCard label="Last 7 Days Orders" value={String(week.count)} hint="rolling 7 days" />
        <StatCard label="Last 7 Days Revenue" value={money(week.revenue)} hint="paid orders" accent />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginTop: 16 }}>
        <StatCard label="All-Time Orders" value={String(allTime.count)} hint="every order" />
        <StatCard label="All-Time Revenue" value={money(allTime.revenue)} hint="paid orders" accent />
      </div>

      {/* ─── Today by status + Top items ───────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4" style={{ marginTop: 16 }}>
        <Card title="Today by Status">
          {statusRows.length === 0 ? (
            <Empty>No orders yet today</Empty>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {statusRows.map((r) => (
                <li
                  key={r.status ?? "unknown"}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(201,162,75,0.10)",
                    color: CREAM,
                  }}
                >
                  <span style={{ color: MUTED }}>
                    {STATUS_LABELS[r.status ?? ""] ?? r.status ?? "Unknown"}
                  </span>
                  <span style={{ fontWeight: 600 }}>{r.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Top Items — Last 30 Days">
          {topItems.length === 0 ? (
            <Empty>No items sold yet</Empty>
          ) : (
            <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {topItems.map((it, i) => (
                <li
                  key={(it.itemName ?? "item") + i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(201,162,75,0.10)",
                    color: CREAM,
                  }}
                >
                  <span>
                    <span style={{ color: GOLD, marginRight: 8 }}>{i + 1}.</span>
                    {it.itemName ?? "—"}
                  </span>
                  <span style={{ color: MUTED }}>{it.qty} sold</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      {/* ─── Recent orders ─────────────────────────────────────────────── */}
      <div style={{ marginTop: 16 }}>
        <Card title="Recent Orders">
          {recent.length === 0 ? (
            <Empty>No orders yet</Empty>
          ) : (
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
                  {recent.map((o) => (
                    <tr
                      key={o.orderNumber ?? Math.random()}
                      style={{ borderTop: "1px solid rgba(201,162,75,0.10)" }}
                    >
                      <td style={{ padding: "10px 12px 10px 0", color: GOLD }}>
                        {o.orderNumber ?? "—"}
                      </td>
                      <td style={{ padding: "10px 12px" }}>{o.customerName || "—"}</td>
                      <td style={{ padding: "10px 12px" }}>{money(o.total)}</td>
                      <td style={{ padding: "10px 12px", color: MUTED }}>
                        {STATUS_LABELS[o.status ?? ""] ?? o.status ?? "—"}
                      </td>
                      <td style={{ padding: "10px 0 10px 12px", color: MUTED }}>
                        {fmtDate(o.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Presentational helpers ─────────────────────────────────────────────────
function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: CARD_BG,
        border: CARD_BORDER,
        borderRadius: 16,
        padding: "18px 20px",
      }}
    >
      <div style={{ color: MUTED, fontSize: 13, marginBottom: 8 }}>{label}</div>
      <div
        style={{
          color: accent ? GOLD : CREAM,
          fontFamily: "var(--font-display)",
          fontWeight: 200,
          fontSize: 30,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {hint ? (
        <div style={{ color: MUTED, fontSize: 12, marginTop: 6 }}>{hint}</div>
      ) : null}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: CARD_BG,
        border: CARD_BORDER,
        borderRadius: 16,
        padding: "18px 20px",
      }}
    >
      <h2
        style={{
          color: CREAM,
          fontFamily: "var(--font-display)",
          fontWeight: 200,
          fontSize: 18,
          marginBottom: 12,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ color: MUTED, fontSize: 14, padding: "8px 0" }}>{children}</div>;
}

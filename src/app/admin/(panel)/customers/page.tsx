import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db } from "@/db";
import { orders } from "@/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ─── Styles ─────────────────────────────────────────────────────────────────

const card = {
  backgroundColor: "#1C1712",
  border: "1px solid rgba(201,162,75,0.18)",
  borderRadius: 16,
  overflow: "hidden" as const,
};

// ─── Derived-customer shape (one row per phone) ──────────────────────────────

interface CustomerRow {
  phone: string | null;
  name: string | null;
  email: string | null;
  orderCount: number;
  totalSpend: number;
  lastOrder: Date | null;
}

function formatMoney(n: number) {
  return `$${n.toFixed(2)}`;
}

function formatDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function CustomersPage() {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "manager")) redirect("/admin");

  // Customers don't reliably link via orders.customerId, so derive the list from
  // the orders table grouped by customerPhone — the accurate source of truth.
  // For name/email we take the value from each phone's most recent order via a
  // correlated subquery ordered by created_at desc.
  const rows = await db.execute<{
    phone: string | null;
    name: string | null;
    email: string | null;
    order_count: number | string;
    total_spend: string | null;
    last_order: string | null;
  }>(sql`
    select
      ${orders.customerPhone} as phone,
      (
        select o2.customer_name
        from ${orders} o2
        where o2.customer_phone = ${orders.customerPhone}
          and o2.customer_name is not null
        order by o2.created_at desc
        limit 1
      ) as name,
      (
        select o3.customer_email
        from ${orders} o3
        where o3.customer_phone = ${orders.customerPhone}
          and o3.customer_email is not null
        order by o3.created_at desc
        limit 1
      ) as email,
      count(*) as order_count,
      coalesce(sum(case when ${orders.paymentStatus} = 'paid' then ${orders.total}::numeric else 0 end), 0) as total_spend,
      max(${orders.createdAt}) as last_order
    from ${orders}
    where ${orders.customerPhone} is not null
    group by ${orders.customerPhone}
    order by total_spend desc
    limit 200
  `);

  const customers: CustomerRow[] = rows.map((r) => ({
    phone: r.phone,
    name: r.name,
    email: r.email,
    orderCount: Number(r.order_count),
    totalSpend: Number(r.total_spend ?? 0),
    lastOrder: r.last_order ? new Date(r.last_order) : null,
  }));

  return (
    <div className="max-w-5xl">
      {/* Page heading */}
      <div className="mb-6">
        <h1
          className="text-3xl"
          style={{ color: "#F3E9D6", fontFamily: "var(--font-display)", fontWeight: 200 }}
        >
          Customers
        </h1>
        <p className="text-sm mt-1" style={{ color: "#8A8276" }}>
          Derived from order history
        </p>
      </div>

      {customers.length === 0 ? (
        <div style={{ ...card, padding: 24, textAlign: "center" }}>
          <p style={{ color: "#8A8276" }}>No customers yet.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block" style={card}>
            <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(201,162,75,0.18)" }}>
                  {["Name", "Phone", "Email", "Orders", "Spend", "Last order"].map((h, i) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-widest"
                      style={{
                        color: "#8A8276",
                        textAlign: i >= 3 && i <= 4 ? "right" : "left",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((c, idx) => (
                  <tr
                    key={c.phone ?? idx}
                    style={{
                      borderBottom:
                        idx === customers.length - 1
                          ? "none"
                          : "1px solid rgba(201,162,75,0.08)",
                    }}
                  >
                    <td className="px-4 py-3" style={{ color: "#F3E9D6" }}>
                      {c.name ?? "—"}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#8A8276" }}>
                      {c.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#8A8276" }}>
                      {c.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right" style={{ color: "#F3E9D6" }}>
                      {c.orderCount}
                    </td>
                    <td
                      className="px-4 py-3 text-right font-semibold"
                      style={{ color: "#C9A24B" }}
                    >
                      {formatMoney(c.totalSpend)}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#8A8276" }}>
                      {formatDate(c.lastOrder)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {customers.map((c, idx) => (
              <div key={c.phone ?? idx} style={{ ...card, padding: 16 }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-base font-semibold" style={{ color: "#F3E9D6" }}>
                    {c.name ?? "—"}
                  </span>
                  <span className="font-semibold" style={{ color: "#C9A24B" }}>
                    {formatMoney(c.totalSpend)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: "#8A8276" }}>
                  {c.phone && <span>{c.phone}</span>}
                  {c.email && <span>{c.email}</span>}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-2" style={{ color: "#8A8276" }}>
                  <span>
                    {c.orderCount} order{c.orderCount !== 1 ? "s" : ""}
                  </span>
                  <span>Last: {formatDate(c.lastOrder)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

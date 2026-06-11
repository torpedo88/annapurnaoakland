"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  BarChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const GOLD = "#C9A24B";
const CREAM = "#F3E9D6";
const MUTED = "#8A8276";
const CARD_BG = "#1C1712";
const GRID = "rgba(201,162,75,0.12)";
const TERRACOTTA = "#B9603F";

export type DailyPoint = { day: string; orders: number; revenue: number };
export type TypeSlice = { type: string; count: number };
export type TopItem = { name: string; qty: number };
export type HeatCell = { dow: number; hour: number; count: number };

function dayLabel(day: string): string {
  const parts = day.split("-");
  if (parts.length !== 3) return day;
  return `${Number(parts[1])}/${Number(parts[2])}`;
}

const tooltipStyle = {
  backgroundColor: CARD_BG,
  border: "1px solid rgba(201,162,75,0.3)",
  borderRadius: 10,
  color: CREAM,
  fontSize: 13,
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: CARD_BG, border: "1px solid rgba(201,162,75,0.18)", borderRadius: 16, padding: "18px 20px" }}>
      <h2 style={{ color: CREAM, fontFamily: "var(--font-display)", fontWeight: 200, fontSize: 18, marginBottom: 14 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

export function DashboardCharts({
  daily,
  typeSplit,
  topItems,
  heat,
}: {
  daily: DailyPoint[];
  typeSplit: TypeSlice[];
  topItems: TopItem[];
  heat: HeatCell[];
}) {
  const data = daily.map((d) => ({ ...d, label: dayLabel(d.day) }));
  const pieColors = [GOLD, TERRACOTTA, "#6FA8A0", "#8A8276"];
  const items = topItems.map((t) => ({ ...t, name: t.name.length > 22 ? t.name.slice(0, 21) + "…" : t.name }));

  return (
    <div style={{ marginTop: 16 }} className="grid gap-4">
      {/* Revenue + orders trend, 30 days */}
      <ChartCard title="Revenue & Orders — Last 30 Days">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD} stopOpacity={0.35} />
                <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 11 }} interval="preserveStartEnd" minTickGap={20} stroke={GRID} />
            <YAxis yAxisId="rev" tick={{ fill: MUTED, fontSize: 11 }} stroke={GRID} tickFormatter={(v) => `$${v}`} width={56} />
            <YAxis yAxisId="ord" orientation="right" tick={{ fill: MUTED, fontSize: 11 }} stroke={GRID} width={32} allowDecimals={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: MUTED }}
              formatter={(value, name) =>
                name === "revenue"
                  ? [`$${Number(value).toFixed(2)}`, "Revenue"]
                  : [Number(value), "Orders"]
              }
            />
            <Area yAxisId="rev" type="monotone" dataKey="revenue" stroke={GOLD} strokeWidth={2} fill="url(#revFill)" />
            <Line yAxisId="ord" type="monotone" dataKey="orders" stroke={CREAM} strokeWidth={1.5} dot={false} />
            <Legend wrapperStyle={{ fontSize: 12, color: MUTED }} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Order type split */}
        <ChartCard title="Pickup vs Delivery — Last 30 Days">
          {typeSplit.length === 0 ? (
            <div style={{ color: MUTED, fontSize: 14 }}>No orders yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={typeSplit}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={(p: any) => {
                    const t = typeSplit[p?.index ?? -1];
                    return t ? `${t.type}: ${t.count}` : "";
                  }}
                  labelLine={false}
                  stroke="none"
                >
                  {typeSplit.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Top items bar */}
        <ChartCard title="Top Items — Last 30 Days">
          {items.length === 0 ? (
            <div style={{ color: MUTED, fontSize: 14 }}>No items sold yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={items} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid stroke={GRID} horizontal={false} />
                <XAxis type="number" tick={{ fill: MUTED, fontSize: 11 }} stroke={GRID} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: CREAM, fontSize: 11 }} stroke={GRID} width={120} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(201,162,75,0.08)" }} formatter={(v) => [Number(v), "sold"]} />
                <Bar dataKey="qty" fill={GOLD} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Order-time heatmap */}
      <ChartCard title="Busiest Times — Last 90 Days (PT)">
        <OrderHeatmap data={heat} />
      </ChartCard>
    </div>
  );
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 10); // 10:00 → 22:00

function OrderHeatmap({ data }: { data: HeatCell[] }) {
  const map = new Map<string, number>();
  let max = 0;
  for (const d of data) {
    map.set(`${d.dow}-${d.hour}`, d.count);
    if (d.count > max) max = d.count;
  }
  const cellColor = (n: number) => {
    if (!n) return "rgba(201,162,75,0.05)";
    const a = max > 0 ? 0.15 + 0.8 * (n / max) : 0.15;
    return `rgba(201,162,75,${a.toFixed(3)})`;
  };
  const hourLabel = (h: number) => (h === 12 ? "12p" : h < 12 ? `${h}a` : `${h - 12}p`);

  if (data.length === 0) {
    return <div style={{ color: MUTED, fontSize: 14 }}>No orders yet</div>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `40px repeat(${HOURS.length}, 1fr)`,
          gap: 3,
          minWidth: 520,
        }}
      >
        <div />
        {HOURS.map((h) => (
          <div key={h} style={{ color: MUTED, fontSize: 10, textAlign: "center" }}>
            {hourLabel(h)}
          </div>
        ))}
        {DAYS.map((day, dow) => (
          <Row key={day} day={day} dow={dow} map={map} cellColor={cellColor} hourLabel={hourLabel} />
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, color: MUTED, fontSize: 11 }}>
        <span>Fewer</span>
        <span style={{ display: "inline-flex", gap: 2 }}>
          {[0.1, 0.3, 0.5, 0.7, 0.95].map((a) => (
            <span key={a} style={{ width: 16, height: 10, borderRadius: 2, background: `rgba(201,162,75,${a})` }} />
          ))}
        </span>
        <span>More</span>
      </div>
    </div>
  );
}

function Row({
  day, dow, map, cellColor, hourLabel,
}: {
  day: string;
  dow: number;
  map: Map<string, number>;
  cellColor: (n: number) => string;
  hourLabel: (h: number) => string;
}) {
  return (
    <>
      <div style={{ color: MUTED, fontSize: 11, display: "flex", alignItems: "center" }}>{day}</div>
      {HOURS.map((h) => {
        const n = map.get(`${dow}-${h}`) ?? 0;
        return (
          <div
            key={h}
            title={`${day} ${hourLabel(h)} — ${n} order${n === 1 ? "" : "s"}`}
            style={{ height: 26, borderRadius: 3, background: cellColor(n) }}
          />
        );
      })}
    </>
  );
}

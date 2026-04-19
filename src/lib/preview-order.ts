"use client";

export type OrderStatus = "received" | "preparing" | "ready" | "completed" | "cancelled";

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  spiceLevel?: "mild" | "medium" | "hot" | "extra-hot";
  notes?: string;
};

export type Order = {
  id: string;
  code: string;
  items: OrderItem[];
  customer: { name: string; phone: string; email: string };
  fulfillment: "pickup" | "delivery";
  address?: string;
  notes?: string;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  status: OrderStatus;
  createdAt: number;
  estimatedReady: number;
};

const ORDERS_KEY = "annapurna:orders";

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function loadOrders(): Order[] {
  if (typeof window === "undefined") return [];
  return safeParse<Order[]>(localStorage.getItem(ORDERS_KEY), []);
}

export function saveOrders(orders: Order[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  // Dispatch a synthetic storage event for same-tab listeners
  window.dispatchEvent(new StorageEvent("storage", { key: ORDERS_KEY }));
}

export function appendOrder(order: Order) {
  const orders = loadOrders();
  orders.unshift(order);
  saveOrders(orders);
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  const orders = loadOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return;
  orders[idx] = { ...orders[idx], status };
  saveOrders(orders);
}

export function getOrder(id: string): Order | undefined {
  return loadOrders().find((o) => o.id === id);
}

export function onOrdersChange(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (e: StorageEvent) => {
    if (!e.key || e.key === ORDERS_KEY) cb();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

const STATUS_META: Record<
  OrderStatus,
  { label: string; color: string; bg: string; ring: string }
> = {
  received: {
    label: "Received",
    color: "#8B5A0F",
    bg: "#FEF3C7",
    ring: "#F59E0B",
  },
  preparing: {
    label: "Preparing",
    color: "#C85A3C",
    bg: "#FEE9E1",
    ring: "#C85A3C",
  },
  ready: {
    label: "Ready for pickup",
    color: "#065F46",
    bg: "#D1FAE5",
    ring: "#10B981",
  },
  completed: {
    label: "Completed",
    color: "#4B5563",
    bg: "#F3F4F6",
    ring: "#9CA3AF",
  },
  cancelled: {
    label: "Cancelled",
    color: "#991B1B",
    bg: "#FEE2E2",
    ring: "#DC2626",
  },
};

export function statusMeta(s: OrderStatus) {
  return STATUS_META[s];
}

export function generateOrderCode() {
  const d = new Date();
  const y = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0");
  return `ANP-${y}${m}${day}-${rand}`;
}

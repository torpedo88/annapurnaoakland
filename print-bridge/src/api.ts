import type { PrintOrder } from "./types";

const trim = (url: string) => url.replace(/\/+$/, "");

export async function fetchPending(serverUrl: string, token: string): Promise<PrintOrder[]> {
  const res = await fetch(`${trim(serverUrl)}/api/print/pending`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`pending HTTP ${res.status}`);
  const data = (await res.json()) as { orders?: PrintOrder[] };
  return data.orders ?? [];
}

export async function ackOrder(
  serverUrl: string,
  token: string,
  orderId: string,
  error?: string,
): Promise<void> {
  const res = await fetch(`${trim(serverUrl)}/api/print/ack`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(error ? { orderId, error } : { orderId }),
  });
  if (!res.ok) throw new Error(`ack HTTP ${res.status}`);
}

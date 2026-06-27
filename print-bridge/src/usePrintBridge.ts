import { useEffect, useRef, useState } from "react";
import { fetchPending, ackOrder } from "./api";
import { printOrder } from "./printer";
import type { Settings } from "./types";

export type BridgeStatus = {
  polling: boolean;
  lastPollAt: number | null;
  lastError: string | null;
  printedCount: number;
};

const POLL_MS = 5000;

// Polls the server for pending tickets and prints each new one over Bluetooth,
// then acks it. Local `printed` set guards against double-printing within a
// session (the server's kitchen_printed_at is the durable guard). A failed
// print is acked with the error so it stays queued + visible server-side, and
// is retried on the next poll.
export function usePrintBridge(settings: Settings): BridgeStatus {
  const [status, setStatus] = useState<BridgeStatus>({
    polling: false,
    lastPollAt: null,
    lastError: null,
    printedCount: 0,
  });
  const printed = useRef<Set<string>>(new Set());
  const busy = useRef(false);

  const ready = settings.enabled && !!settings.serverUrl && !!settings.token && !!settings.printerId;

  useEffect(() => {
    if (!ready) {
      setStatus((s) => ({ ...s, polling: false }));
      return;
    }
    let cancelled = false;

    async function tick() {
      if (busy.current) return;
      busy.current = true;
      try {
        const orders = await fetchPending(settings.serverUrl, settings.token);
        setStatus((s) => ({ ...s, lastPollAt: Date.now(), lastError: null }));
        for (const order of orders) {
          if (cancelled) break;
          if (printed.current.has(order.id)) continue;
          try {
            await printOrder(settings.printerId as string, order);
            await ackOrder(settings.serverUrl, settings.token, order.id);
            printed.current.add(order.id);
            setStatus((s) => ({ ...s, printedCount: s.printedCount + 1 }));
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            await ackOrder(settings.serverUrl, settings.token, order.id, msg).catch(() => {});
            setStatus((s) => ({ ...s, lastError: `print: ${msg}` }));
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setStatus((s) => ({ ...s, lastError: `poll: ${msg}` }));
      } finally {
        busy.current = false;
      }
    }

    setStatus((s) => ({ ...s, polling: true }));
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [ready, settings.serverUrl, settings.token, settings.printerId]);

  return status;
}

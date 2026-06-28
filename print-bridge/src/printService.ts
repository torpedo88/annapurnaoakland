// Android foreground service that polls + prints in the BACKGROUND, so the app
// does not need to stay open/foreground (the Uber Eats app can be in front, the
// screen can be off). Uses @supersami/rn-foreground-service to run a recurring
// task behind a persistent notification.
//
// NOTE: like the Star SDK, this library's API is version-sensitive — verify
// register/add_task/start/stop against the installed version's README if the
// build complains.
import ReactNativeForegroundService from "@supersami/rn-foreground-service";
import { loadSettings } from "./storage";
import { fetchPending, ackOrder } from "./api";
import { printOrder } from "./printer";
import { patchStatus, readStatus } from "./status";

const TASK_ID = "annapurna-print-poll";
const SERVICE_ID = 1144;
const POLL_MS = 5000;

// Session-local guard against double-printing; the server's kitchen_printed_at
// is the durable guard across restarts.
const printedThisRun = new Set<string>();
let registered = false;

async function pollOnce(): Promise<void> {
  const s = await loadSettings();
  if (!s.enabled || !s.serverUrl || !s.token || !s.printerId) return;

  try {
    const orders = await fetchPending(s.serverUrl, s.token);
    await patchStatus({ lastPollAt: Date.now(), lastError: null });
    for (const order of orders) {
      if (printedThisRun.has(order.id)) continue;
      try {
        await printOrder(s.printerId, order);
        await ackOrder(s.serverUrl, s.token, order.id);
        printedThisRun.add(order.id);
        const cur = await readStatus();
        await patchStatus({ printedCount: cur.printedCount + 1 });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await ackOrder(s.serverUrl, s.token, order.id, msg).catch(() => {});
        await patchStatus({ lastError: `print: ${msg}` });
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await patchStatus({ lastError: `poll: ${msg}` });
  }
}

function ensureRegistered(): void {
  if (registered) return;
  ReactNativeForegroundService.register();
  registered = true;
}

export function startPrintService(): void {
  ensureRegistered();
  ReactNativeForegroundService.add_task(() => void pollOnce(), {
    delay: POLL_MS,
    onLoop: true,
    taskId: TASK_ID,
    onError: (e: unknown) => console.error("[print-service] task error", e),
  });
  ReactNativeForegroundService.start({
    id: SERVICE_ID,
    title: "Annapurna printing",
    message: "Watching for new orders",
    ServiceType: "dataSync",
  });
  void patchStatus({ running: true });
}

export function stopPrintService(): void {
  ReactNativeForegroundService.remove_task(TASK_ID);
  ReactNativeForegroundService.stop();
  void patchStatus({ running: false });
}

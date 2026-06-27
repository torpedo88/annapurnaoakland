import AsyncStorage from "@react-native-async-storage/async-storage";

// The poll/print loop runs inside the foreground service (a different context
// from the React UI), so it publishes its status here and the UI reads it.
const KEY = "annapurna.print-bridge.status";

export type ServiceStatus = {
  running: boolean;
  lastPollAt: number | null;
  lastError: string | null;
  printedCount: number;
};

export const EMPTY_STATUS: ServiceStatus = {
  running: false,
  lastPollAt: null,
  lastError: null,
  printedCount: 0,
};

export async function readStatus(): Promise<ServiceStatus> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return EMPTY_STATUS;
  try {
    return { ...EMPTY_STATUS, ...(JSON.parse(raw) as Partial<ServiceStatus>) };
  } catch {
    return EMPTY_STATUS;
  }
}

export async function patchStatus(patch: Partial<ServiceStatus>): Promise<void> {
  const current = await readStatus();
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...current, ...patch }));
}

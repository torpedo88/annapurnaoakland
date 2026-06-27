import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Settings } from "./types";

const KEY = "annapurna.print-bridge.settings";

export const DEFAULT_SETTINGS: Settings = {
  serverUrl: "",
  token: "",
  printerId: null,
  enabled: false,
};

export async function loadSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}

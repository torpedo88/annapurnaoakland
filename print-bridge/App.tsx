import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from "./src/storage";
import { discoverBluetoothPrinters, printOrder, type FoundPrinter } from "./src/printer";
import { requestBluetoothPermissions } from "./src/permissions";
import { startPrintService, stopPrintService } from "./src/printService";
import { readStatus, EMPTY_STATUS, type ServiceStatus } from "./src/status";
import type { PrintOrder, Settings } from "./src/types";

const TEST_ORDER: PrintOrder = {
  id: "test", orderNumber: 0, orderType: "pickup", createdAt: new Date().toISOString(),
  customerName: "TEST PRINT", customerPhone: "510-555-0000", deliveryAddress: null,
  items: [{ name: "Chicken Momo", qty: 2, spiceLevel: "medium", riceChoice: null, specialInstructions: null, traySize: null }],
  subtotal: 13.99, tax: 1.2, tip: 0, deliveryFee: 0, discount: 0, total: 15.19, paymentStatus: "paid", source: "test",
};

export default function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [printers, setPrinters] = useState<FoundPrinter[]>([]);
  const [scanning, setScanning] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<ServiceStatus>(EMPTY_STATUS);

  // Load settings; if already configured + enabled, (re)start the background
  // service on launch (e.g. after a reboot the app is opened once).
  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
      if (s.enabled && s.serverUrl && s.token && s.printerId) startPrintService();
    });
  }, []);

  // The print loop runs in the foreground service; mirror its status for display.
  useEffect(() => {
    const id = setInterval(() => { readStatus().then(setStatus); }, 2000);
    return () => clearInterval(id);
  }, []);

  function update(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next).catch(() => {});
  }

  function toggleEnabled(v: boolean) {
    if (v && (!settings.serverUrl || !settings.token || !settings.printerId)) {
      setMsg("Set server URL, token, and printer first");
      return;
    }
    update({ enabled: v });
    if (v) startPrintService();
    else stopPrintService();
  }

  async function scan() {
    setScanning(true); setMsg(null);
    try {
      const ok = await requestBluetoothPermissions();
      if (!ok) { setMsg("Bluetooth permission denied"); return; }
      setPrinters(await discoverBluetoothPrinters());
    }
    catch (e) { setMsg(`Scan failed: ${e instanceof Error ? e.message : String(e)}`); }
    finally { setScanning(false); }
  }

  async function testPrint() {
    if (!settings.printerId) { setMsg("Pick a printer first"); return; }
    setMsg("Printing test…");
    try { await printOrder(settings.printerId, TEST_ORDER); setMsg("Test sent ✓"); }
    catch (e) { setMsg(`Print failed: ${e instanceof Error ? e.message : String(e)}`); }
  }

  if (!loaded) return <SafeAreaView style={s.center}><ActivityIndicator /></SafeAreaView>;

  return (
    <SafeAreaView style={s.bg}>
      <ScrollView contentContainerStyle={s.pad}>
        <Text style={s.h1}>Annapurna Print Bridge</Text>

        <Text style={s.label}>Server URL</Text>
        <TextInput style={s.input} autoCapitalize="none" autoCorrect={false}
          placeholder="https://annapurnaoakland.com" value={settings.serverUrl}
          onChangeText={(t) => update({ serverUrl: t })} />

        <Text style={s.label}>Device token</Text>
        <TextInput style={s.input} autoCapitalize="none" autoCorrect={false} secureTextEntry
          placeholder="PRINT_BRIDGE_TOKEN" value={settings.token}
          onChangeText={(t) => update({ token: t })} />

        <View style={s.rowBetween}>
          <Text style={s.label}>Printer</Text>
          <TouchableOpacity style={s.btn} onPress={scan} disabled={scanning}>
            <Text style={s.btnText}>{scanning ? "Scanning…" : "Scan Bluetooth"}</Text>
          </TouchableOpacity>
        </View>
        {printers.map((p) => (
          <TouchableOpacity key={p.identifier} onPress={() => update({ printerId: p.identifier })}
            style={[s.printer, settings.printerId === p.identifier && s.printerOn]}>
            <Text style={s.printerText}>{p.model} — {p.identifier}{settings.printerId === p.identifier ? "  ✓" : ""}</Text>
          </TouchableOpacity>
        ))}

        <View style={s.rowBetween}>
          <Text style={s.h2}>Auto-print (background)</Text>
          <Switch value={settings.enabled} onValueChange={toggleEnabled} />
        </View>

        <TouchableOpacity style={s.btnWide} onPress={testPrint}>
          <Text style={s.btnText}>Test print</Text>
        </TouchableOpacity>

        <View style={s.card}>
          <Text style={s.stat}>Service: {status.running ? "running (works in background)" : "stopped"}</Text>
          <Text style={s.stat}>Printed this run: {status.printedCount}</Text>
          <Text style={s.stat}>Last poll: {status.lastPollAt ? new Date(status.lastPollAt).toLocaleTimeString() : "—"}</Text>
          {status.lastError ? <Text style={[s.stat, s.err]}>Error: {status.lastError}</Text> : null}
          {msg ? <Text style={s.stat}>{msg}</Text> : null}
        </View>

        <Text style={s.hint}>
          Auto-print runs in the background — you can leave this app and use the Uber Eats app.
          Keep the tablet plugged in, Wi-Fi + Bluetooth on, and battery optimization OFF for this app.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "#14100D" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#14100D" },
  pad: { padding: 20, gap: 10 },
  h1: { color: "#C9A24B", fontSize: 24, fontWeight: "800", marginBottom: 8 },
  h2: { color: "#F3E9D6", fontSize: 16, fontWeight: "700" },
  label: { color: "#8A8276", fontSize: 13, marginTop: 8 },
  input: { backgroundColor: "#1C1712", color: "#F3E9D6", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(201,162,75,0.3)" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  btn: { backgroundColor: "#C9A24B", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  btnWide: { backgroundColor: "#C9A24B", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 14 },
  btnText: { color: "#14100D", fontWeight: "700" },
  printer: { backgroundColor: "#1C1712", borderRadius: 8, padding: 12, marginTop: 6, borderWidth: 1, borderColor: "rgba(201,162,75,0.2)" },
  printerOn: { borderColor: "#C9A24B" },
  printerText: { color: "#F3E9D6" },
  card: { backgroundColor: "#1C1712", borderRadius: 10, padding: 14, marginTop: 18, gap: 4 },
  stat: { color: "#F3E9D6", fontSize: 14 },
  err: { color: "#E08A7A" },
  hint: { color: "#8A8276", fontSize: 12, marginTop: 14, lineHeight: 17 },
});

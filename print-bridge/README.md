# Annapurna Print Bridge (Android)

A small React Native Android app that prints new kitchen orders to a **Star
TSP100IIIBI over Bluetooth**. It polls the website's print API
(`/api/print/pending`), prints each new order via the Star SDK, then acks it
(`/api/print/ack`). Runs on a dedicated, **purchased unlocked Android tablet**
(the company DoorDash/Grubhub tablets are leased/locked — see the design spec).

Design: `../docs/superpowers/specs/2026-06-27-kitchen-print-bridge-design.md`.

> **Status:** source scaffold. It has **not** been compiled or tested against a
> device/printer (no Android toolchain in the authoring environment). Build,
> sideload, and the real print test happen on your machine. Treat the
> `react-native-star-io10` calls in `src/printer.ts` as version-sensitive — match
> them to the installed SDK's sample app if anything differs.

## Files in this folder
- `App.tsx` — UI: server URL + token, Bluetooth printer scan/pick, auto-print
  toggle, status, test print.
- `src/storage.ts` — settings persisted via AsyncStorage.
- `src/api.ts` — `fetchPending` / `ackOrder`.
- `src/printer.ts` — Star SDK connect + receipt builder + print.
- `src/usePrintBridge.ts` — the poll → print → ack loop (idempotent + retry).
- `src/types.ts` — `PrintOrder` (mirrors the server payload).

## Build it (one-time)

1. **Create the native project** (gets the `android/` toolchain this folder
   omits), then drop these files in:
   ```bash
   npx @react-native-community/cli init PrintBridge
   cd PrintBridge
   # copy App.tsx and src/ from this folder over the generated ones
   npm i react-native-star-io10 @react-native-async-storage/async-storage
   ```
2. **Android permissions** — add to `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
   <uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
   <uses-permission android:name="android.permission.BLUETOOTH" />
   <uses-permission android:name="android.permission.INTERNET" />
   ```
   On Android 12+, request `BLUETOOTH_CONNECT` / `BLUETOOTH_SCAN` at runtime
   before scanning (see the Star SDK sample).
3. **Build a release APK**:
   ```bash
   cd android && ./gradlew assembleRelease
   # APK: android/app/build/outputs/apk/release/app-release.apk
   ```

## Install on the tablet
See the design spec **§3.1** for the full tablet-prep + sideload steps. Short
version: enable **Install unknown apps** → copy the APK over (link / USB / `adb
install`) → open it.

## Configure (first run)
1. **Pair the printer** once in Android **Settings → Bluetooth** (Star PIN is
   usually `0000` / `1234`).
2. In the app: enter the **Server URL** (e.g. `https://annapurnaoakland.com`) and
   the **device token** (the web app's `PRINT_BRIDGE_TOKEN`).
3. Tap **Scan Bluetooth**, pick the TSP100, tap **Test print** to confirm.
4. Turn **Auto-print** on. New paid orders now print within ~5s.

## Keep it running (kiosk)
- Screen timeout off / keep plugged in; keep Wi-Fi + Bluetooth on.
- Disable battery optimization for the app.
- Optional: screen-pinning / a kiosk launcher so staff can't navigate away.

## Hardening (next, not in this scaffold)
- A **foreground service** so printing survives the app being backgrounded
  (e.g. `@supersami/rn-foreground-service`), and a `BOOT_COMPLETED` receiver to
  relaunch after reboot. v1 prints while the app is open/foreground.

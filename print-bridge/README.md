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

Both build options start the same — create the native project and add this app's
source:
```bash
npx @react-native-community/cli init PrintBridge
cd PrintBridge
# copy App.tsx + src/ + eas.json from this folder over the generated files
npm i react-native-star-io10 @react-native-async-storage/async-storage
```

Add the Bluetooth permissions to `android/app/src/main/AndroidManifest.xml`
(just above `<application>`):
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
```
The app already requests the runtime grants (Android 12+) when you tap **Scan** —
see `src/permissions.ts`. No extra code needed.

### Option A — local build (Android Studio)
Needs Node 20+, JDK 17, Android Studio (+ SDK & platform-tools).
```bash
cd android
./gradlew assembleDebug    # debug APK — no signing setup, fine for sideloading
# → android/app/build/outputs/apk/debug/app-debug.apk
```

### Option B — cloud build with EAS (no Android Studio)
Builds the APK on Expo's servers; you only need Node + a free Expo account.
`eas.json` (in this folder) is preconfigured for an internal APK.
```bash
npm i -g eas-cli
eas login
eas build:configure         # one-time; sets up Android credentials
eas build -p android --profile preview
# download the APK from the link EAS prints when it finishes
```
EAS builds bare React Native projects too — the Star native module autolinks.

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

# Kitchen Print Bridge (Android + Bluetooth) — Design Spec

- **Date:** 2026-06-27
- **Status:** Approved for planning (brainstorming complete)
- **Author:** Abhishek Maharjan
- **Topic:** Auto-print paid online orders to the Star TSP100IIIBI over Bluetooth using a repurposed Android tablet as a print bridge.

> Supersedes, as the **active** plan, the parked alternative
> `2026-06-27-spoton-order-routing-design.md` (SpotOn POS injection). SpotOn was
> shelved because its direct API requires partner certification we may not be
> granted. That spec is retained on branch `feat/spoton-order-routing` in case we
> revisit.

---

## 1. Context & problem

Online orders must print on the kitchen's **Star TSP100IIIBI** (Bluetooth). The
restaurant's dedicated order device is an **iPad**, and there is no computer.

Constraints that shaped this design:
- iOS has **no Web Bluetooth**, and the TSP100IIIBI speaks **Bluetooth Classic
  (MFi)** — so a web app on the iPad cannot drive it. iPad + Bluetooth would
  require a brittle native iOS app (Apple Developer account, 7-day provisioning
  expiry on free profiles, MFi).
- The existing `window.print()` kiosk auto-print
  (`src/components/admin/orders-board.tsx`) needs a computer running Chrome
  `--kiosk-printing` — not available.

**Decision:** use a **repurposed Android tablet** (the restaurant already has spare
DoorDash/Grubhub tablets, which are Android) as a dedicated **print bridge**. A
small Android app connects to the printer over Bluetooth and prints new orders it
pulls from a thin print API added to our existing web app. The iPad is unchanged
(still shows orders).

This avoids: new printer hardware, Apple's provisioning friction, and SpotOn's
certification gamble.

## 2. Goals / non-goals

**Goals**
- Each **paid** online order (pickup/delivery) prints automatically on the
  TSP100IIIBI via the bridge, with correct items, quantities, modifiers
  (spice/rice), notes, customer, and totals.
- Server-side idempotency so a ticket prints exactly once.
- Never lose an order: existing email/SMS/dashboard alerts remain the backup if
  the bridge or printer is down.

**Non-goals**
- Phone orders (rung up in SpotOn directly).
- Replacing the `window.print()` kiosk path (left in place, unused).
- Two-way order-status sync from the bridge.
- Printing to multiple printers / load balancing (single printer for v1).

## 3. Architecture

Two parts:

### Part A — Print API (in this Next.js repo; fully buildable + testable here)
- **`GET /api/print/pending`** — returns paid orders not yet printed
  (`status` received/paid AND `kitchen_printed_at IS NULL`), as a compact print
  JSON (§5). Authenticated by a **device token** (Bearer), over HTTPS.
- **`POST /api/print/ack`** — body `{ orderId, deviceId }`; sets
  `kitchen_printed_at` (idempotent — second ack is a no-op). Optional
  `{ error }` to record a failed attempt.
- **`POST /api/print/heartbeat`** (optional) — bridge reports it's alive +
  printer-connected, surfaced in admin so staff know the bridge is up.
- Order shape mirrors `src/components/admin/kitchen-receipt.tsx` content so the
  ticket matches today's format.

### Part B — Android print-bridge app (separate project; authored here, built + sideloaded by you)
- **Tech (recommended): React Native + `react-native-star-io10`** (the official
  Star binding) — TypeScript, close to the team's stack. Pure Kotlin +
  `com.starmicronics:stario10` (StarXpand SDK) is the fallback.
- Connects to the TSP100IIIBI over **Bluetooth Classic** (StarXpand handles
  rasterization for the TSP100III; requests `BLUETOOTH_CONNECT` permission).
- **Polls** `GET /api/print/pending` every ~5s (mirrors the existing 10s board
  poll). For each order: build the ticket via the Star SDK document builder →
  print → `POST /api/print/ack`.
- **Foreground service** to stay alive on the kiosk; **auto-reconnect** to the
  printer; **retry with backoff** on print/network failure.
- **Local idempotency** set (printed order IDs) as a second guard against
  duplicates, in addition to the server `kitchen_printed_at`.
- **Minimal UI:** printer connection status, server reachability, paired-printer
  picker (first run), manual "reprint last", and an on/off switch.

## 3.1 Installing & running the bridge on the tablet

Distribution is **sideloading a signed release APK** — no Play Store, no Apple,
no account fees.

**Step 0 — Confirm the tablet is usable (before building anything).**
- **Owned, not leased.** If DoorDash/Grubhub owns the tablet (you'd return it),
  don't use it.
- **Not locked.** Can you exit the DoorDash/Grubhub app and open Android
  **Settings**? If it's pinned in kiosk mode with no Settings access, it's
  MDM-locked and can't sideload — and some MDM/Samsung Knox enrollments survive a
  factory reset.
- Locked or leased → fall back to a cheap **unlocked Android tablet**.
  Everything below is identical on that device.

> **Decision (2026-06-27):** the restaurant's spare tablets came **from the
> delivery companies** (DoorDash/Grubhub) — i.e. leased + MDM/kiosk-locked and
> must be returned. They are **not usable** as the bridge. The plan uses a
> **purchased, unlocked Android tablet** instead. Buy any **Android 11+** (12+
> preferred) tablet with Wi-Fi + Bluetooth — e.g. Samsung Galaxy Tab A9 or a
> Lenovo Tab M-series (~$70–130); a cheap Android phone works too. **Avoid Amazon
> Fire** tablets (Fire OS lacks Google services). Steps 1–4 are unchanged on it.

**Step 1 — Prepare the device (one-time).**
- If repurposing, **factory reset** to clear the delivery app + its kiosk lock;
  finish setup; join the restaurant **Wi-Fi**.
- Settings → **Apps → Special access → Install unknown apps** → allow it for the
  app you'll install from (Files or Chrome).

**Step 2 — Get the APK onto the device + install (pick one).**
- **Link/Drive:** we host the signed APK; open the link in the tablet browser →
  download → tap → Install.
- **USB + computer:** `adb install kitchen-bridge.apk` (Developer options → USB
  debugging on).
- **USB file copy:** copy the APK to the tablet, open with Files → Install.

**Step 3 — First run.**
- Grant prompts: **Bluetooth** (Connect/Scan), **Notifications** (for the
  foreground service), and **disable battery optimization** for the app so Android
  won't kill it.
- Pair the printer once in Android **Settings → Bluetooth** (Star PIN is usually
  `0000` / `1234`), then select it in the app.
- Enter the **server URL + device token** we provide → toggle **On**.

**Step 4 — Lock it in as a kiosk.**
- Screen timeout off (or keep it plugged in); keep Wi-Fi + Bluetooth on.
- **Auto-start on boot** (the app relaunches its print service after a reboot via
  a `BOOT_COMPLETED` receiver).
- Optional: Android **screen pinning** or a kiosk launcher so staff can't navigate
  away from it.

**Deliverable:** a one-page printed setup card with these exact steps and the
server URL / device token pre-filled, shipped with the build.

## 4. Data flow
Order paid (Stripe confirms) → saved with `status` received, `kitchen_printed_at`
null → bridge polls `/api/print/pending` → receives order → prints over Bluetooth
→ `POST /api/print/ack` → server stamps `kitchen_printed_at`. Subsequent polls no
longer return it.

## 5. Data model & API payload
- New `orders` columns: `kitchen_printed_at` (timestamp, nullable),
  `kitchen_print_attempts` (int, default 0), `kitchen_print_error` (text,
  nullable).
- **Print JSON** (per order): `orderNumber`, `orderType` (pickup/delivery),
  `createdAt`, `customerName`, `customerPhone`, `deliveryAddress?`, `items[]`
  (`name`, `qty`, `spiceLevel?`, `riceChoice?`, `specialInstructions?`,
  `traySize?`), `subtotal`, `tax`, `tip`, `deliveryFee`, `discount`, `total`,
  `paymentStatus`, `source`.
- New secret: **device token** for bridge auth (rotatable). Optional `deviceId`
  registry if more than one bridge.

## 6. Security
- Bridge authenticates with a bearer **device token** (env/secret), HTTPS only.
- Token scopes only the `/api/print/*` endpoints (read pending + ack), not the
  full admin API.
- No customer PII beyond what the ticket needs; nothing logged in plaintext
  beyond order id + status. Token never committed or logged.

## 7. Resilience & idempotency
- `kitchen_printed_at` makes acks idempotent (exactly-once tickets).
- Bridge retries on printer/network failure with bounded backoff; records
  `kitchen_print_attempts` / `kitchen_print_error` via ack-with-error.
- If the bridge or printer is down, the existing **email/SMS/dashboard** alerts
  still fire — orders are never lost; staff can read the dashboard and reprint.
- Admin surfaces bridge heartbeat + per-order print status so failures are
  visible, not silent.

## 8. Dependencies & risks
1. **Bridge device — RESOLVED (2026-06-27).** The company delivery tablets are
   leased + MDM-locked → not usable. Plan uses a **purchased unlocked Android
   tablet** (~$70–130). Low risk; small one-time cost, owned outright.
2. **Star SDK / printer support.** StarXpand SDK explicitly supports TSP100III
   over Bluetooth — low risk.
3. **Build/test boundary.** The print API (Part A) is normal web code I can
   implement and test in this repo. The Android app (Part B) I can author, but I
   **cannot compile it or test against the physical printer here** — building,
   sideloading, and the real print test happen on your side.
4. **Always-on kiosk.** The tablet must stay powered, awake, and on Wi-Fi with
   Bluetooth on; foreground service + keep-awake settings cover this.

## 9. Testing strategy
- **Part A (in-repo):** unit/integration tests for `/api/print/pending` (filtering
  + auth), `/api/print/ack` (idempotency), and the print-JSON serializer. Fully
  runnable here.
- **Part B (Android):** unit-test the ticket formatter; manual end-to-end print
  test against the TSP100IIIBI once built and sideloaded.
- **Joint smoke test:** one real paid test order → confirm it prints once and is
  marked printed.

## 10. Work split
- **In this repo (I build + verify):** Part A — print endpoints, device-token
  auth, schema migration, print-JSON serializer, admin bridge-status surface.
- **Separate app (I write the code + a README/build steps; you build + sideload):**
  Part B — the React Native (or Kotlin) bridge.

## 11. Scope / YAGNI
In: auto-print paid pickup/delivery web orders to one Bluetooth printer; manual
reprint; bridge/printer status in admin. Out: phone orders, multi-printer, status
sync-back, scheduled-order handling (until base flow ships).

## 12. Open questions
- ~~Are the spare delivery tablets sideload-capable?~~ **Resolved:** no — company
  leased/locked. Use a purchased unlocked Android tablet.
- React Native vs native Kotlin for the bridge (lean RN for stack fit; confirm
  `react-native-star-io10` covers TSP100III Bluetooth Classic on the target
  Android version).
- Push vs poll for new orders (poll chosen for v1 simplicity/robustness).

## 13. References
- StarXpand SDK for Android: https://github.com/star-micronics/StarXpand-SDK-Android
- react-native-star-io10: https://github.com/star-micronics/react-native-star-io10
- StarXpand SDK manual (native): https://star-m.jp/products/s_print/sdk/starxpand/manual/en/index.html
- TSP100III support: https://starmicronics.com/support/products/tsp100iii-support-page/
- Parked alternative: `docs/superpowers/specs/2026-06-27-spoton-order-routing-design.md`

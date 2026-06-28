# Kitchen ticket printing

Three ways to get kitchen tickets onto a Star printer:

- **C — CloudPRNT (PRIMARY, recommended):** a Star **network** printer (e.g.
  TSP650II LAN) polls `/api/cloudprnt` over the internet and prints accepted
  orders itself. **No computer, tablet, Bluetooth, or local app.** This is the
  production setup — see the CloudPRNT section directly below.
- **A — Browser board auto-print:** the admin Orders board prints via
  `window.print()`. Needs a **computer** running Chrome `--kiosk-printing` with
  the printer as the OS default.
- **B — Android print bridge** (fallback, unused): a dedicated Android tablet
  polls `/api/print/pending` and prints over Bluetooth via the Star SDK. Built
  but superseded by CloudPRNT; kept as a fallback. Design spec:
  `docs/superpowers/specs/2026-06-27-kitchen-print-bridge-design.md`.

> Run only **one** of these against a given printer, or tickets double-print.

---

## C — CloudPRNT (primary)

A Star network printer on the restaurant LAN polls the server itself. Because the
printer reaches **out** to the server (outbound through the router/NAT), this
works with the app hosted on Vercel — no inbound access to the LAN is needed, and
there is no on-site computer/tablet to babysit.

### Flow

`/api/cloudprnt` implements the Star CloudPRNT protocol (`src/app/api/cloudprnt/route.ts`):

- **POST** (poll, every few seconds): replies `{ jobReady, mediaTypes, jobToken }`
  when a ticket is waiting, else `{ jobReady: false }`.
- **GET** (pull): returns the ticket as `application/vnd.star.line` (Star Line
  Mode bytes built by `src/lib/print/star-line.ts`).
- **DELETE** (confirm): stamps `orders.kitchen_printed_at` so each ticket prints
  **once**.

**Tickets print on ACCEPT.** An order becomes printable only when staff advance
it from `received` to `preparing` (the board's accept action) and it has not yet
been printed (`kitchen_printed_at IS NULL`). New orders chime on the board
(sound, see `orders-board.tsx`) so staff notice them; accepting prints the
ticket. A manual reprint clears `kitchen_printed_at` (`/api/admin/print-requeue`),
so the printer pulls it again on its next poll.

Auth is HTTP **Basic** — the printer config has username/password fields. The
username is ignored; the password must equal `CLOUDPRNT_TOKEN`.

### Printer setup (one time)

1. Plug the Star printer into the router by **Ethernet**; note its IP (self-test:
   hold **FEED** while powering on prints a config page with the IP).
2. Browse to `http://<printer-ip>/` → **CloudPRNT** section.
3. Set:
   - **Server URL:** `https://annapurnaoakland.com/api/cloudprnt` (apex, not
     www — the printer won't follow the www→apex redirect)
   - **Username:** anything (e.g. `annapurna`)
   - **Password:** the `CLOUDPRNT_TOKEN` value (set in Vercel prod)
   - Enable CloudPRNT; poll interval ~5–10s.
4. Save. Accept an order on the board → a ticket prints.

### Quick local test (on the LAN)

Run the dev server with `CLOUDPRNT_TOKEN=… PORT=3001 npm run dev`, point the
printer's CloudPRNT URL at `http://<your-LAN-IP>:3001/api/cloudprnt`, and accept
an order — or exercise the protocol with curl:

```bash
B=http://localhost:3001/api/cloudprnt
curl -s -X POST -u "anna:TOKEN" -d '{}' "$B"           # poll → jobReady/jobToken
curl -s -u "anna:TOKEN" "$B?token=<jobToken>"          # pull → ticket bytes
curl -s -X DELETE -u "anna:TOKEN" "$B?token=<jobToken>" # confirm → marks printed
```

Raw network sanity check (bypasses CloudPRNT): pipe text to the printer's
port 9100 — `printf 'hi\n\n\n' | nc <printer-ip> 9100`.

---

The admin **Orders** board auto-prints an 80mm kitchen ticket the moment a new
order arrives. No server or cloud-printer setup is required — printing happens
from the browser on the on-site machine that has the Star TSP100 attached
(USB / Bluetooth / LAN — anything the OS sees as a printer).

## How it works

- `OrdersBoard` already polls `/api/admin/orders` every 10s and detects new
  `received` orders. When auto-print is on, each new order is queued and
  rendered into a hidden `#kitchen-receipt` element (`kitchen-receipt.tsx`).
- `globals.css` `@media print` hides everything except that element and sizes
  the page to `80mm`.
- A persistent set (`localStorage: annapurna:admin:printed`) guarantees a ticket
  prints **once** — reloading the page or opening a second tab never reprints.
- On the very first poll after load, existing orders are seeded as "already
  printed" so the historical backlog is never dumped to the printer.

Toggles live in the board toolbar: **🖨 Auto-print on/off** and a **🖨 Print**
reprint button on every order card. Auto-print is **off by default** and is
enabled per device — tap it once on the kiosk machine and it stays on (stored in
that browser). This keeps staff phones from popping print dialogs.

## One-time machine setup (silent printing)

By default the browser shows a print dialog for every `window.print()`. To make
tickets print silently, launch Chrome in kiosk-printing mode on the restaurant
machine:

**macOS**
```bash
open -a "Google Chrome" --args --kiosk-printing https://www.annapurnaoakland.com/admin
```

**Windows** (shortcut target)
```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing https://www.annapurnaoakland.com/admin
```

Then:
1. Pair / connect the Star TSP100 and **set it as the system default printer**.
2. In the Star driver, set paper width to **80mm (or 72mm printable)** and
   disable any "print preview".
3. Open the admin Orders page in that Chrome instance and log in. Tap
   **🖨 Auto-print on** once (it stays on for this device) and tap
   **🔔 Sound on** (a user gesture unlocks the new-order chime + voice).
4. Place a test order and confirm a ticket prints with no dialog.

> Tip: leave that Chrome window open and the screen awake. The board polls and
> prints on its own; staff only need it visible for the chime + voice alerts.

## Troubleshooting

- **Dialog still appears** → Chrome wasn't started with `--kiosk-printing`, or a
  different Chrome instance is already running. Quit Chrome fully and relaunch
  with the flag.
- **Prints to the wrong printer** → the TSP100 isn't the system default.
- **Ticket too wide / cut off** → set the driver paper size to 80mm and margins
  to none; `@page { size: 80mm auto; margin: 0 }` handles the rest.
- **Nothing prints** → confirm **🖨 Auto-print on** is lit, and that the order
  reached status `received` (auto-print fires on new received orders only).

---

## B — Android print bridge (no-PC / Bluetooth)

For setups with no computer (e.g. an iPad shows orders) the kitchen prints via a
dedicated **Android tablet** running a small bridge app that talks to the Star
printer over Bluetooth. The app pulls orders from a server-side print API in this
repo; the native app lives in a separate project (see the spec).

### Print API (this repo)
- `GET /api/print/pending` — returns `received` orders not yet printed
  (`kitchen_printed_at IS NULL`), oldest first, capped at 50. Auth: bearer
  `PRINT_BRIDGE_TOKEN`.
- `POST /api/print/ack` — body `{ "orderId": "…", "error"?: "…" }`. Success (no
  `error`) stamps `kitchen_printed_at` once (idempotent — a re-ack is a no-op).
  With `error`, it records the message + bumps `kitchen_print_attempts` and leaves
  the order in the queue for retry.
- `POST /api/admin/print-requeue` — **staff-authed**. Tapping **Print** on an
  order in the admin board (e.g. on the iPad) clears its `kitchen_printed_at`, so
  the bridge reprints it on the next poll. `pending` covers active orders
  (`received` / `preparing` / `ready`), so an in-progress order can be reprinted.
- Order JSON shape: `src/lib/print/serialize.ts` (mirrors the receipt fields).

### Setup
1. Set `PRINT_BRIDGE_TOKEN` to a long random string (env + the bridge app).
2. Apply the new columns: `npm run db:push` (adds `kitchen_printed_at`,
   `kitchen_print_attempts`, `kitchen_print_error` to `orders`).
3. **Backfill** so the bridge doesn't print the existing backlog on first
   connect: `UPDATE orders SET kitchen_printed_at = now() WHERE kitchen_printed_at IS NULL;`
4. Build + sideload the bridge app onto the tablet and pair the printer — see the
   design spec `docs/superpowers/specs/2026-06-27-kitchen-print-bridge-design.md`
   (§3.1 covers tablet install).

> Don't run this **and** the browser board auto-print (A) against the same
> printer — pick one.

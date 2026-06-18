# Kitchen ticket printing (Star TSP100)

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

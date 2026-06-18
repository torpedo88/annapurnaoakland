<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Keep the docs current

Whenever you add or change a feature, update the docs in the **same change** —
this is required, not optional:

- `README.md` — feature bullets, commands, doc links.
- `docs/ARCHITECTURE.md` — the maintainer guide: repo layout (§3), the relevant
  feature section, roadmap (§15), gotchas (§16), and redirects/SEO (§17).
- Feature-specific docs under `docs/` (e.g. `KITCHEN-PRINTING.md`, `DOORDASH.md`).
- `DEV.md` if the dev/staging or deploy flow changes.

Treat stale docs as a bug. If a change makes any doc statement false, fix it.

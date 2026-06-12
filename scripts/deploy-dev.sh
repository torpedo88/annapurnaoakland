#!/usr/bin/env bash
# Deploy the current branch as a preview and point dev.annapurnaoakland.com at it.
# Usage: npm run deploy:dev   (run from the `dev` branch)
set -euo pipefail

echo "Deploying preview…"
URL=$(npx vercel --yes 2>/dev/null | grep -Eo 'https://[a-z0-9-]+\.vercel\.app' | tail -1)
if [ -z "${URL:-}" ]; then
  echo "Could not capture deployment URL — run 'npx vercel --yes' manually." >&2
  exit 1
fi
echo "Deployed: $URL"
npx vercel alias set "$URL" dev.annapurnaoakland.com
echo "dev.annapurnaoakland.com -> $URL"

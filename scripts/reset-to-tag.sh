#!/usr/bin/env bash
set -euo pipefail
TAG="${1:-canon-console-l1_2025-08-16_12-01}"

echo "→ Fetching & resetting to: $TAG"
git fetch -p
git reset --hard "$TAG"
git clean -xfd

echo "→ Reinstalling deps (root + canon-console)"
rm -rf node_modules && npm ci
( cd canon-console && rm -rf node_modules && npm ci )

# make sure no old Vite is lingering
pkill -f vite || true

echo "✅ Reset complete. Run: npm run dev"

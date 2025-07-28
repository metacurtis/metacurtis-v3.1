#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$ROOT"

STAMP="$(date +%Y%m%d_%H%M%S)"
ARCHIVE_DIR="archive_sstv2_${STAMP}"

echo "🔍 Scanning for SST v2 references..."
rg -n "sstV2" -g '!:archive*' -g '!:node_modules/*' || true

V2_PATHS=(
  "src/config/canonical/sstV2Quality.js"
  "src/config/canonical/sstV2Stages.jsx"
  "src/config/canonical/sstV2Validation.js"
)

echo "📦 Archiving v2 files to $ARCHIVE_DIR"
mkdir -p "$ARCHIVE_DIR"
for p in "${V2_PATHS[@]}"; do
  if [[ -e "$p" ]]; then
    echo "  ↪︎ $p"
    mv "$p" "$ARCHIVE_DIR"/
  fi
done

echo "🧼 Re-scan for any leftover 'sstV2' references..."
LEFT=$(rg -n "sstV2" -g '!:archive*' -g '!:node_modules/*' || true)
if [[ -n "$LEFT" ]]; then
  echo "⚠️ Still found references:"
  echo "$LEFT"
  echo "Fix those manually (update imports to v3 paths) then re-run."
  exit 1
fi

echo "✅ No remaining refs. You can commit and remove the archive later."

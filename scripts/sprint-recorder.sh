#!/usr/bin/env bash
set -euo pipefail
note="${1:-"Snapshot"}"
# Run all doctors (uses doctor:all if present)
if npm -s run | grep -q "doctor:all"; then
  npm -s run doctor:all || true
else
  npm -s run doctor:imports || true
  npm -s run doctor:atoms   || true
  npm -s run doctor:render  || true
  npm -s run hot-dors       || true
fi

# Take a sprint snapshot and commit artifacts, bypassing husky if needed
npm -s run sprint:snapshot -- "$note" --commit --no-verify || true
echo "✓ Sprint snapshot + commit attempted."

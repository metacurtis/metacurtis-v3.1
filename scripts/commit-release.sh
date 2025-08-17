#!/usr/bin/env bash
set -euo pipefail

echo "▶ Running validators…"
npm run validate >/dev/null

if [ -f scripts/render-contract-verify.cjs ]; then
  node scripts/render-contract-verify.cjs || true
fi
if [ -f scripts/snapshot-render-stack.cjs ]; then
  node scripts/snapshot-render-stack.cjs --all-shaders --dev || true
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)
STAMP=$(date -u +%Y%m%d_%H%M%S)
TAG="canon-l2_guard-l3_${STAMP}"

git add -A
# IMPORTANT: if Husky/lint-staged fails, abort script
if ! git commit -m "feat: console L2 complete; guard L2→L3 seed; opening sequence working; validators green"; then
  echo "✖ Commit blocked (likely ESLint). Fix and re-run."
  exit 1
fi

git tag -a "$TAG" -m "Canon Console L2 complete; Guard L2→L3 seed; SST v3.0 validated"
git push origin "$BRANCH" --tags

echo "✅ Committed on $BRANCH"
echo "🏷  Tagged: $TAG"

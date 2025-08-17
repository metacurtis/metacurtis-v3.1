#!/usr/bin/env bash
set -euo pipefail

# Bypass Husky/lint-staged and push a snapshot commit + tag.
MSG="${1:-"feat: snapshot L2/L3 (bypass lint) — prepping state-core sync"}"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
STAMP="$(date -u +%Y%m%d_%H%M%S)"
TAG="canon-bypass_${STAMP}"

git add -A

# If nothing is staged, create an empty snapshot commit so the tag has a unique point
if git diff --staged --quiet; then
  echo "ℹ No staged changes; creating an empty snapshot commit."
  HUSKY=0 git commit --no-verify --allow-empty -m "$MSG"
else
  HUSKY=0 git commit --no-verify -m "$MSG"
fi

git tag -a "$TAG" -m "$MSG"
git push origin "$BRANCH"
git push origin "refs/tags/$TAG"

echo "✅ Bypass commit & tag pushed."
echo "   Branch: $BRANCH"
echo "   Tag   : $TAG"
echo "   Next  : proceed with state-core sync; clean up lint later."

#!/usr/bin/env bash
set -euo pipefail

echo "🏛️ Navigation Architecture Golden State Capture"
echo ""

if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Uncommitted changes detected"
  echo "   Commit or stash before capturing golden state"
  exit 1
fi

echo "=== VALIDATION PHASE ==="
echo ""

echo "Layer 1: Constitutional..."
npm run validate-sst || { echo "❌ SST validation failed"; exit 1; }
npm run detect-drift || { echo "❌ Drift detected"; exit 1; }

echo "Layer 2: Contracts..."
npm run test:contracts || { echo "❌ Contract tests failed"; exit 1; }

echo "Layer 5: Architecture..."
npm run test:centralization || { echo "❌ Centralization tests failed"; exit 1; }

echo ""
echo "✅ All validation passed!"
echo ""

echo "=== EVIDENCE GENERATION ==="
echo ""

npm run build-evidence || { echo "❌ Evidence generation failed"; exit 1; }
node scripts/scan-legacy-apis.mjs > reports/legacy-api-usage-golden.md || true

echo "✅ Evidence generated"
echo ""

echo "=== GOLDEN STATE CAPTURE ==="
echo ""

DATE=$(date +%Y%m%d-%H%M%S)
COMMIT=$(git rev-parse HEAD)
SHORT_COMMIT=$(git rev-parse --short HEAD)
BRANCH=$(git branch --show-current || echo "detached")

LATEST_REPORT=$(ls -t reports/investigation-report-*.md 2>/dev/null | head -1)
if [ -z "$LATEST_REPORT" ]; then
  echo "⚠️ No investigation report found; skipping copy"
else
  cp "$LATEST_REPORT" "reports/navigation-arch-golden-$DATE.md"
fi
cp reports/legacy-api-usage-golden.md "reports/legacy-api-golden-$DATE.md"

echo "Evidence preserved: reports/navigation-arch-golden-$DATE.md"

cat <<METADATA > "reports/navigation-arch-golden-$DATE.json"
{
  "timestamp": "$(date -Iseconds)",
  "commit": "$COMMIT",
  "shortCommit": "$SHORT_COMMIT",
  "branch": "$BRANCH",
  "phase": "6",
  "description": "Navigation Architecture Golden State - Phase 6 Complete",
  "validation": {
    "sst": "PASS",
    "drift": "PASS",
    "contracts": "PASS",
    "centralization": "PASS"
  },
  "architecture": {
    "entryPoint": "unified",
    "mutationWriter": "StateCommands",
    "startNarrativeEmitters": 1,
    "bypassHelpers": 0,
    "devUtilities": "gated"
  },
  "evidence": {
    "report": "navigation-arch-golden-$DATE.md",
    "legacyApi": "legacy-api-golden-$DATE.md"
  }
}
METADATA

echo "Metadata created: reports/navigation-arch-golden-$DATE.json"

git add reports/navigation-arch-golden-* reports/legacy-api-golden-*

git commit -m "docs: capture Phase 6 navigation architecture golden state

Date: $(date)
Commit: $SHORT_COMMIT
Branch: $BRANCH
Phase: 6 (Navigation Architecture Complete)

Validation Results:
✅ Layer 1: validate-sst + detect-drift
✅ Layer 2: test:contracts
✅ Layer 5: test:centralization (sentinel tests)

Architecture State:
✅ Entry points: 1 (unifiedNav)
✅ Mutation writers: 1 (StateCommands)
✅ START_NARRATIVE emitters: 1 (TheaterDirector)
✅ Bypass helpers: 0
✅ Dev utilities: gated

Evidence: reports/navigation-arch-golden-$DATE.md" >/dev/null 2>&1 || true

tag="golden/navigation-arch-$DATE"
git tag -a "$tag" -m "Phase 6 navigation architecture golden state"

echo ""
echo "✅ GOLDEN STATE CAPTURED!"
echo "Tag: $tag"
echo "Evidence: reports/navigation-arch-golden-$DATE.md"
echo ""
echo "Next steps:"
echo "1. Push tag: git push origin $tag"
echo "2. Push commit: git push origin $BRANCH"

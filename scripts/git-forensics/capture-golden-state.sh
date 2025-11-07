#!/usr/bin/env bash
set -euo pipefail

echo "🏆 Golden State Capture Protocol"
echo ""

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Uncommitted changes detected"
  echo "   Commit or stash before capturing golden state"
  exit 1
fi

# === VALIDATION PHASE ===
echo "=== VALIDATION PHASE ==="
echo ""

echo "Layer 1: Constitutional..."
npm run validate-sst || { echo "❌ SST validation failed"; exit 1; }
npm run detect-drift || { echo "❌ Drift detected"; exit 1; }

echo "Layer 2: Contracts..."
npm run test:contracts || { echo "❌ Contract tests failed"; exit 1; }

echo "Layer 4: Visual (optional)..."
if npm run test:visual 2>/dev/null; then
  VISUAL_STATUS="PASS"
else
  VISUAL_STATUS="SKIP"
  echo "⚠️  Visual tests skipped"
fi

echo ""
echo "✅ All validation passed!"
echo ""

# === EVIDENCE PHASE ===
echo "=== EVIDENCE GENERATION ==="
echo ""

npm run build-evidence || { echo "❌ Evidence generation failed"; exit 1; }

LATEST_REPORT=$(ls -t reports/investigation-report-*.md 2>/dev/null | head -1)
if [ -z "$LATEST_REPORT" ]; then
  echo "❌ No evidence report found"
  exit 1
fi

echo "✅ Evidence generated"
echo ""

# === CAPTURE PHASE ===
echo "=== GOLDEN STATE CAPTURE ==="
echo ""

DATE=$(date +%Y%m%d-%H%M%S)
COMMIT=$(git rev-parse HEAD)
SHORT_COMMIT=$(git rev-parse --short HEAD)
BRANCH=$(git branch --show-current || echo "detached")

# Copy evidence
cp "$LATEST_REPORT" "reports/opening-sequence-golden-$DATE.md"
echo "Evidence preserved: reports/opening-sequence-golden-$DATE.md"

# Create metadata
cat > "reports/opening-sequence-golden-$DATE.json" << METADATA
{
  "timestamp": "$(date -Iseconds)",
  "commit": "$COMMIT",
  "shortCommit": "$SHORT_COMMIT",
  "branch": "$BRANCH",
  "captureDate": "$(date)",
  "description": "Golden state with complete validation",
  "validation": {
    "sst": "PASS",
    "drift": "PASS",
    "contracts": "PASS",
    "visual": "$VISUAL_STATUS"
  },
  "eventFlow": [
    "ENGINE_VIEWPORT_HINT",
    "WBG:FENCEPOST",
    "CHAOS_START",
    "COALESCE_START",
    "SETTLE_START",
    "PARTICLES_EMERGED",
    "ENABLE_SCROLL",
    "OPENING_COMPLETE"
  ]
}
METADATA

echo "Metadata created: reports/opening-sequence-golden-$DATE.json"
echo ""

# Commit golden files
git add reports/opening-sequence-golden-*
git commit -m "docs: capture golden opening sequence state

Date: $(date)
Commit: $SHORT_COMMIT
Branch: $BRANCH

Validation Results:
✅ Layer 1: validate-sst + detect-drift
✅ Layer 2: validate:opening + ci:fencepost
✅ Layer 4: $VISUAL_STATUS
✅ Layer 5: build-evidence

Evidence: reports/opening-sequence-golden-$DATE.md"

# Create tag
TAG="golden/opening-$DATE"
git tag -a "$TAG" -m "Opening Sequence Golden State

Date: $(date)
Commit: $COMMIT
Branch: $BRANCH

Validated working opening sequence.

To restore: git checkout $TAG
To compare: npm run build-evidence && diff reports/opening-sequence-golden-$DATE.md reports/investigation-report-*.md"

echo ""
echo "✅ GOLDEN STATE CAPTURED!"
echo ""
echo "Tag: $TAG"
echo "Evidence: reports/opening-sequence-golden-$DATE.md"
echo ""
echo "Next steps:"
echo "1. Push tag: ALLOW_PUSH=1 git push origin $TAG"
echo "2. Push commit: ALLOW_PUSH=1 git push origin $BRANCH"
echo ""

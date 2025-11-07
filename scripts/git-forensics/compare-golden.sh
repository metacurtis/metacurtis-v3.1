#!/usr/bin/env bash
set -euo pipefail

GOLDEN_TAG=${1:-$(git tag -l "golden/*" --sort=-creatordate | head -1)}

if [ -z "$GOLDEN_TAG" ]; then
  echo "❌ No golden state found"
  echo "Usage: $0 [golden-tag]"
  exit 1
fi

echo "🔍 Comparing current vs $GOLDEN_TAG"
echo ""

# Generate current evidence
echo "Generating current evidence..."
npm run build-evidence >/dev/null 2>&1
CURRENT_REPORT=$(ls -t reports/investigation-report-*.md | head -1)

# Find golden evidence
GOLDEN_DATE=$(echo "$GOLDEN_TAG" | sed 's/golden\/opening-//')
GOLDEN_REPORT="reports/opening-sequence-golden-$GOLDEN_DATE.md"

if [ ! -f "$GOLDEN_REPORT" ]; then
  echo "❌ Golden evidence not found: $GOLDEN_REPORT"
  echo "Generate it by checking out golden state and running build-evidence"
  exit 1
fi

echo "Comparing evidence..."
echo ""
echo "=== FILE CHANGES ==="
git diff --name-status "$GOLDEN_TAG..HEAD" | head -20

echo ""
echo "=== EVIDENCE DELTA ==="
diff "$GOLDEN_REPORT" "$CURRENT_REPORT" || true

echo ""
echo "=== COMMIT RANGE ==="
git log --oneline "$GOLDEN_TAG..HEAD" | head -10

echo ""
echo "Full diff: git diff $GOLDEN_TAG..HEAD"

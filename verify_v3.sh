#!/usr/bin/env bash
set -euo pipefail

echo "📋 Checking for v2 imports..."
if grep -R "sstV2Stages" -n src --include="*.js" --include="*.jsx" | grep -v canonicalAuthority.js; then
  echo "❌ Still found v2 references above."
else
  echo "✅ No stray v2 imports found."
fi

echo "📋 Checking console log strings..."
if grep -R "SST v2" -n src --include="*.js" --include="*.jsx"; then
  echo "⚠️  v2 strings still present (just cosmetic?)."
else
  echo "✅ No 'SST v2.x' console strings left."
fi

echo "Done."

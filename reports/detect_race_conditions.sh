#!/bin/bash
set -euo pipefail

output_file="reports/race_conditions.md"

{
  echo "# Race Condition Analysis"
  echo "Generated: $(date)"
  echo ""
  echo "## Potential Race Conditions"
  echo ""
  echo "### Pattern 1: Multiple Writers Without Coordination"
  echo ""
  echo "Looking for state variables written from multiple locations..."
  echo ""
} > "$output_file"

for var in currentStage phase morph running cancelled; do
  {
    echo "#### Variable: $var"
  } >> "$output_file"

  writers_count=$(rg --glob '*.js' --glob '*.jsx' -l "(this\\.${var}\\s*=)|(set[A-Za-z0-9_]*${var})" src | wc -l)

  if [ "$writers_count" -gt 2 ]; then
    {
      echo "⚠️  **$writers_count writers found** - Potential race condition!"
      rg --glob '*.js' --glob '*.jsx' -n "(this\\.${var}\\s*=)|(set[A-Za-z0-9_]*${var})" src | head -10 | sed 's/^/- /'
    } >> "$output_file"
  else
    echo "✅ $writers_count writers (low risk)" >> "$output_file"
  fi

  echo "" >> "$output_file"
done

{
  echo "### Pattern 2: Read-Before-Write Without Lock"
  echo ""
  echo "Looking for if(state.x) state.x = y patterns..."
  echo ""
} >> "$output_file"

rg --glob '*.js' --glob '*.jsx' -n "if.*this\.(currentStage|phase|morph|running)" src -A 3 | \
  rg "this\.(currentStage|phase|morph|running)\s*=" -B 1 | head -20 >> "$output_file" || true

echo "" >> "$output_file"

{
  echo "### Pattern 3: Async State Updates"
  echo ""
  echo "Looking for setTimeout/Promise with state mutations..."
  echo ""
} >> "$output_file"

rg --glob '*.js' --glob '*.jsx' -n "(setTimeout|Promise)" src -A 5 | \
  rg "this\.(currentStage|phase|morph|running)\s*=" -B 2 | head -20 >> "$output_file" || true

echo "" >> "$output_file"

echo "✅ Race condition analysis complete" >> "$output_file"

#!/bin/bash
set -euo pipefail

output_file="reports/drift_risks.md"

{
  echo "# State Drift Risk Analysis"
  echo "Generated: $(date)"
  echo ""
  echo "## Drift Risk Patterns"
  echo ""
  echo "### Risk 1: Parallel State Storage"
  echo ""
  echo "Same logical state stored in multiple places:"
  echo ""
} > "$output_file"

for var in currentStage phase morph; do
  class_props=$( (rg --glob '*.js' -n "this\\.${var}" src/theater || true) | wc -l )
  atom_refs=$( (rg --glob '*.js' -n "${var}" src/state/atoms || true) | wc -l )
  local_vars=$( (rg --glob '*.js' --glob '*.jsx' -n "(let|const|var) ${var}" src || true) | wc -l )
  total=$((class_props + atom_refs + local_vars))

  {
    echo "#### $var"
    echo "- Class properties (theater): $class_props"
    echo "- Atom references: $atom_refs"
    echo "- Local variables: $local_vars"
    if [ "$total" -gt 10 ]; then
      echo "⚠️  **HIGH DRIFT RISK** - $total storage locations!"
    fi
    echo ""
  } >> "$output_file"
done

{
  echo "### Risk 2: Update Without Broadcast"
  echo ""
  echo "State mutations not followed by BeatBus emission:"
  echo ""
} >> "$output_file"

rg --glob '*.js' -n "this\.(currentStage|phase|morph)\s*=" src/theater -A 5 | \
  rg -v "BeatBus\.emit" | \
  rg "this\.(currentStage|phase|morph)\s*=" | head -20 >> "$output_file" || true

echo "" >> "$output_file"

{
  echo "### Risk 3: Conditional Updates"
  echo ""
  echo "State updated only in certain conditions (may miss updates):"
  echo ""
} >> "$output_file"

rg --glob '*.js' --glob '*.jsx' -n "if.*(BeatBus\.emit|this\.(currentStage|phase|morph)\s*=)" src | head -20 >> "$output_file" || true

echo "" >> "$output_file"

echo "✅ Drift risk analysis complete" >> "$output_file"

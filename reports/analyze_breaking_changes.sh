#!/bin/bash
set -euo pipefail

output_file="reports/breaking_changes.md"

{
  echo "# Breaking Change Assessment"
  echo "Generated: $(date)"
  echo ""
  echo "## Public API Impact"
  echo ""
  echo "### Window Globals (Dev Tools)"
  echo ""
  echo "Globals that might break:"
} > "$output_file"

(rg --glob '*.js' -n "window\.(stageControls|qualityControls|stageAtom)" src || true) | \
  awk -F: '{print "- "$1":"$2}' | sort -u >> "$output_file"

echo "" >> "$output_file"

{
  echo "### Component Props"
  echo ""
  echo "Components expecting state props:"
} >> "$output_file"

(rg --glob '*.jsx' -n "props\.(currentStage|phase|morph)" src/components || true) | head -20 >> "$output_file"

echo "" >> "$output_file"

{
  echo "### BeatBus Event Contracts"
  echo ""
  echo "Events that might change payload:"
} >> "$output_file"

(rg --glob '*.js' -n "BeatBus\.emit.*(STAGE|MORPH|QUALITY)" src || true) | head -20 >> "$output_file"

echo "" >> "$output_file"

echo "✅ Breaking change assessment complete" >> "$output_file"

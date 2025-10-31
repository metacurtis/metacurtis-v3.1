#!/bin/bash
set -euo pipefail

output_file="reports/stale_reads.md"

{
  echo "# Stale Read Analysis"
  echo "Generated: $(date)"
  echo ""
  echo "## Potential Stale Reads"
  echo ""
  echo "### Pattern 1: Local Variable Caching"
  echo ""
  echo "Looking for const x = this.state patterns that might go stale..."
  echo ""
} > "$output_file"

rg --glob '*.js' --glob '*.jsx' -n "const.*=.*this\.(currentStage|phase|morph)" src | head -20 >> "$output_file" || true

echo "" >> "$output_file"

{
  echo "### Pattern 2: Callback Closures"
  echo ""
  echo "Looking for callbacks that close over state..."
  echo ""
} >> "$output_file"

rg --glob '*.js' --glob '*.jsx' -n "=>.*this\.(currentStage|phase|morph)|function.*this\.(currentStage|phase|morph)" src | head -20 >> "$output_file" || true

echo "" >> "$output_file"

{
  echo "### Pattern 3: Event Handler Closures"
  echo ""
  echo "Looking for event handlers with potentially stale state..."
  echo ""
} >> "$output_file"

rg --glob '*.js' --glob '*.jsx' -n "BeatBus\.on.*=>" src -A 10 | \
  rg "this\.(currentStage|phase|morph)" -B 3 | head -30 >> "$output_file" || true

echo "" >> "$output_file"

echo "✅ Stale read analysis complete" >> "$output_file"

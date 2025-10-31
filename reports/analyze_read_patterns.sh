#!/bin/bash
set -euo pipefail

output_file="reports/read_patterns.md"

{
  echo "# State Read Access Patterns"
  echo "Generated: $(date)"
  echo ""
} > "$output_file"

analyze_reads() {
  local var="$1"

  {
    echo "## Variable: $var"
    echo ""
    echo "### Direct Reads (this.$var, state.$var):"
  } >> "$output_file"

  local direct_reads
  direct_reads=$(rg --glob '*.js' --glob '*.jsx' -n "this\\.${var}" src | grep -E -v "this\\.${var}\\s*=" | head -20 || true)
  local state_reads
  state_reads=$(rg --glob '*.js' --glob '*.jsx' -n "state\\.${var}" src | grep -E -v "state\\.${var}\\s*=" | head -20 || true)

  if [[ -n "$direct_reads" ]] || [[ -n "$state_reads" ]]; then
    [[ -n "$direct_reads" ]] && printf '%s\n' "$direct_reads" >> "$output_file"
    [[ -n "$state_reads" ]] && printf '%s\n' "$state_reads" >> "$output_file"
  else
    echo "(none)" >> "$output_file"
  fi

  {
    echo ""
    echo "### Atom Reads:"
  } >> "$output_file"

  local atom_reads
  atom_reads=$(rg --glob '*.js' --glob '*.jsx' -n "getState\(\).*${var}|useAtomValue.*${var}" src | head -20 || true)
  if [[ -n "$atom_reads" ]]; then
    printf '%s\n' "$atom_reads" >> "$output_file"
  else
    echo "(none)" >> "$output_file"
  fi

  {
    echo ""
    echo "### Conditional Checks (if/while):"
  } >> "$output_file"

  local conditional_reads
  conditional_reads=$(rg --glob '*.js' --glob '*.jsx' -n "if[^(]*\(${var}|if .*${var}|while[^(]*\(${var}|${var} &&|&& .*${var}|\? .*${var}" src | head -20 || true)
  if [[ -n "$conditional_reads" ]]; then
    printf '%s\n' "$conditional_reads" >> "$output_file"
  else
    echo "(none)" >> "$output_file"
  fi

  {
    echo ""
    echo "---"
    echo ""
  } >> "$output_file"
}

for var in currentStage phase morph running cancelled skipRequested isTransitioning; do
  analyze_reads "$var"
done

echo "✅ Read patterns: $output_file"

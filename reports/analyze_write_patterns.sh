#!/bin/bash
set -euo pipefail

output_file="reports/write_patterns.md"

{
  echo "# State Write Access Patterns"
  echo "Generated: $(date)"
  echo ""
} > "$output_file"

analyze_writes() {
  local var="$1"

  {
    echo "## Variable: $var"
    echo ""
    echo "### Direct Writes (this.$var =, state.$var =):"
  } >> "$output_file"

  local direct_this
  direct_this=$(rg --glob '*.js' --glob '*.jsx' -n "this\.${var}\s*=" src | head -20 || true)
  local direct_state
  direct_state=$(rg --glob '*.js' --glob '*.jsx' -n "state\.${var}\s*=" src | head -20 || true)

  if [[ -n "$direct_this" ]] || [[ -n "$direct_state" ]]; then
    [[ -n "$direct_this" ]] && printf '%s\n' "$direct_this" >> "$output_file"
    [[ -n "$direct_state" ]] && printf '%s\n' "$direct_state" >> "$output_file"
  else
    echo "(none)" >> "$output_file"
  fi

  {
    echo ""
    echo "### React setState:"
  } >> "$output_file"

  local react_set
  react_set=$(rg --glob '*.js' --glob '*.jsx' -n "setState.*${var}|set[A-Z][A-Za-z0-9_]*.*${var}" src | head -20 || true)
  if [[ -n "$react_set" ]]; then
    printf '%s\n' "$react_set" >> "$output_file"
  else
    echo "(none)" >> "$output_file"
  fi

  {
    echo ""
    echo "### Atom Writes (atom.setX, atom.X()):"
  } >> "$output_file"

  local atom_writes
  atom_writes=$(rg --glob '*.js' --glob '*.jsx' -n "Atom\\.set[A-Za-z0-9_]*${var}|Atom\\.${var}\\(" src | head -20 || true)
  if [[ -n "$atom_writes" ]]; then
    printf '%s\n' "$atom_writes" >> "$output_file"
  else
    echo "(none)" >> "$output_file"
  fi

  {
    echo ""
    echo "### Method Calls (may modify state):"
  } >> "$output_file"

  local method_calls
  method_calls=$(rg --glob '*.js' --glob '*.jsx' -n "(update|change|set)[A-Za-z0-9_]*${var}" src | head -20 || true)
  if [[ -n "$method_calls" ]]; then
    printf '%s\n' "$method_calls" >> "$output_file"
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
  analyze_writes "$var"
done

echo "✅ Write patterns: $output_file"

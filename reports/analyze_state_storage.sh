#!/bin/bash
set -euo pipefail

output_file="reports/state_storage_analysis.md"

{
  echo "# State Storage Location Analysis"
  echo "Generated: $(date)"
  echo ""
} > "$output_file"

analyze_storage() {
  local pattern="$1"
  local source_file="reports/state_vars_${pattern}.txt"

  if [[ ! -f "$source_file" ]]; then
    return
  fi

  {
    echo "## Pattern: $pattern"
    echo ""
    echo "### Class Properties (this.$pattern):"
  } >> "$output_file"

  local class_hits
  class_hits=$(grep -n "this\\.${pattern}" "$source_file" | head -5 || true)
  if [[ -n "$class_hits" ]]; then
    printf '%s\n' "$class_hits" >> "$output_file"
  else
    echo "(none)" >> "$output_file"
  fi

  {
    echo ""
    echo "### React State (useState):"
  } >> "$output_file"

  local react_hits
  react_hits=$(grep -n "useState.*${pattern}\|${pattern}.*useState" "$source_file" | head -5 || true)
  if [[ -n "$react_hits" ]]; then
    printf '%s\n' "$react_hits" >> "$output_file"
  else
    echo "(none)" >> "$output_file"
  fi

  {
    echo ""
    echo "### Atom Storage:";
  } >> "$output_file"

  local atom_hits
  atom_hits=$(grep -n "${pattern}.*Atom\|Atom.*${pattern}" "$source_file" | head -5 || true)
  if [[ -n "$atom_hits" ]]; then
    printf '%s\n' "$atom_hits" >> "$output_file"
  else
    echo "(none)" >> "$output_file"
  fi

  {
    echo ""
    echo "---"
    echo ""
  } >> "$output_file"
}

for pattern in currentStage stageIndex phase morph running cancelled skipRequested; do
  analyze_storage "$pattern"
done

echo "✅ Analysis complete: $output_file"

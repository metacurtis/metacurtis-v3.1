#!/bin/bash
set -euo pipefail

output_file="reports/state_flow.md"

{
  echo "# State Flow Tracing"
  echo "Generated: $(date)"
  echo ""
} > "$output_file"

trace_flow() {
  local state_var="$1"

  {
    echo "## Flow: $state_var"
    echo ""
    echo "### Writers (who sets $state_var):"
  } >> "$output_file"

  writers=$(rg --glob '*.js' --glob '*.jsx' -l "(this\\.${state_var}\\s*=)|(set[A-Z][A-Za-z0-9_]*.*${state_var})|(Atom\\.(set|update).*\b${state_var})" src || true)
  if [[ -n "$writers" ]]; then
    while IFS= read -r file; do
      module="${file#src/}"
      parent_dir="$(basename "$(dirname "$file")")"
      echo "- $module ($parent_dir)" >> "$output_file"
    done <<< "$writers"
  else
    echo "- (none)" >> "$output_file"
  fi

  {
    echo ""
    echo "### Readers (who reads $state_var):"
  } >> "$output_file"

  readers=$(rg --glob '*.js' --glob '*.jsx' -l "(this\\.${state_var})|(get[A-Za-z0-9_]*${state_var})|(useAtomValue)" src || true)
  if [[ -n "$readers" ]]; then
    while IFS= read -r file; do
      module="${file#src/}"
      parent_dir="$(basename "$(dirname "$file")")"
      echo "- $module ($parent_dir)" >> "$output_file"
    done <<< "$readers"
  else
    echo "- (none)" >> "$output_file"
  fi

  {
    echo ""
    echo "### BeatBus Events (involving $state_var):"
  } >> "$output_file"

  beatbus=$(rg --glob '*.js' --glob '*.jsx' -n "(BeatBus\\.(emit|on).*(?:${state_var}|STAGE|MORPH))|(STAGE_CHANGE)|(MORPH)" src | head -10 || true)
  if [[ -n "$beatbus" ]]; then
    printf '%s\n' "$beatbus" >> "$output_file"
  else
    echo "(none)" >> "$output_file"
  fi

  {
    echo ""
    echo "---"
    echo ""
  } >> "$output_file"
}

for var in currentStage phase morph running; do
  trace_flow "$var"
done

echo "✅ State flow: $output_file"

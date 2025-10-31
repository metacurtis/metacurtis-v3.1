#!/bin/bash
set -euo pipefail
shopt -s nullglob

output_file="reports/dependency_graph.md"

{
  echo "# State Dependency Graph"
  echo "Generated: $(date)"
  echo ""
  echo "## Module Dependencies"
  echo ""
  echo "Format: MODULE → depends on → STATE_SOURCE"
  echo ""
  echo "### Theater Modules"
  echo ""
} > "$output_file"

theater_files=(src/theater/*.js src/theater/controllers/*.js)

for file in "${theater_files[@]}"; do
  [[ -f "$file" ]] || continue
  module="${file#src/}"

  {
    echo "#### $module"

    if rg -q "stageAtom" "$file"; then
      echo "- ✅ Imports stageAtom"
      rg -n "stageAtom" "$file" | head -3
    fi

    if rg -q "qualityAtom" "$file"; then
      echo "- ✅ Imports qualityAtom"
      rg -n "qualityAtom" "$file" | head -3
    fi

    if rg -q "BeatBus" "$file"; then
      echo "- ✅ Uses BeatBus"
      rg -n "BeatBus\.(on|emit)" "$file" | head -5
    fi

    if rg -q "StateCommands" "$file"; then
      echo "- ✅ Uses StateCommands"
      rg -n "StateCommands" "$file" | head -3
    fi

    local_state=$(rg -n "this\.(currentStage|phase|morph|running|cancelled|skipRequested|isRunning|hasRun)" "$file" | head -5 || true)
    if [[ -n "$local_state" ]]; then
      echo "- Local State Variables:"
      printf '%s\n' "$local_state"
    else
      echo "- Local State Variables: (none)"
    fi

    echo ""
  } >> "$output_file"
done

{
  echo "### Component Modules"
  echo ""
} >> "$output_file"

while IFS= read -r file; do
  [[ -f "$file" ]] || continue
  if rg -q "(useAtomValue|stageAtom|qualityAtom)" "$file"; then
    module="${file#src/}"
    uses=$(rg -o "(useAtomValue|stageAtom|qualityAtom)" "$file" | sort -u | tr '\n' ' ' | sed 's/ $//')
    {
      echo "#### $module"
      if [[ -n "$uses" ]]; then
        echo "- Uses: $uses"
      else
        echo "- Uses: (detected but could not parse symbols)"
      fi
      echo ""
    } >> "$output_file"
  fi
done < <(find src/components -type f \( -name '*.jsx' -o -name '*.js' \) | sort)

echo "✅ Dependency graph complete" >> "$output_file"

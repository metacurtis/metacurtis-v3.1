#!/bin/bash
set -euo pipefail

output_file="reports/event_sequences.md"

{
  echo "# Event Sequence Analysis"
  echo "Generated: $(date)"
  echo ""
} > "$output_file"

compose_event_chain() {
  local file="$1"
  local start_line="$2"

  awk -v start="$start_line" '
    NR>=start && NR<start+50 && /BeatBus\.emit/ {
      token=$0
      sub(/^.*BeatBus\.emit[[:space:]]*\(([[:space:]]*)?/, "", token)
      sub(/[,)].*$/, "", token)
      gsub(/[`" ]/, "", token)
      gsub(/\047/, "", token)
      printf("%d:%s\n", NR, token)
    }
  ' "$file"
}

analyze_sequence() {
  local operation="$1"
  local start_event="$2"

  {
    echo "## Operation: $operation"
    echo "Starting with: $start_event"
    echo ""
    echo "### Event Chain:"
  } >> "$output_file"

  mapfile -t matches < <(rg --glob '*.js' --glob '*.jsx' -n "BeatBus\\.emit[^(]*\([^)]*${start_event}" src || true)

  if [[ ${#matches[@]} -eq 0 ]]; then
    echo "(no emitters found for ${start_event})" >> "$output_file"
  else
    local count=0
    for match in "${matches[@]}"; do
      IFS=: read -r file line _rest <<< "$match"
      ((++count))
      local display_file="${file#src/}"
      echo "${count}. **${start_event}** emitted in ${display_file}:${line}" >> "$output_file"

      while IFS=: read -r chained_line token; do
        [[ -z "${token:-}" ]] && continue
        echo "   → ${token} (line ${chained_line})" >> "$output_file"
      done < <(compose_event_chain "$file" "$line" | tail -n +2 | head -5 || printf '')

      if (( count >= 5 )); then
        break
      fi
    done
  fi

  {
    echo ""
    echo "---"
    echo ""
  } >> "$output_file"
}

analyze_sequence "Stage Change" "STAGE_CHANGE"
analyze_sequence "Opening Sequence Start" "OPENING_START"
analyze_sequence "Morph Update" "MORPH_PROGRESS"
analyze_sequence "Quality Change" "QUALITY_CHANGE"

echo "✅ Event sequences: $output_file"

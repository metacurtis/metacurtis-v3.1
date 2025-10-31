#!/bin/bash
set -euo pipefail

output_file="reports/migration_impact.md"

{
  echo "# Migration Impact Analysis"
  echo "Generated: $(date)"
  echo ""
  echo "## Impact Scenarios"
  echo ""
  echo "### Scenario 1: Remove Duplicate Stage Storage"
  echo "Change: TheaterDirector, ScrollOrchestrator no longer store currentStage"
  echo ""
} > "$output_file"

stage_files=$(rg --glob '*.js' -l "this\\.(currentStage|stageIndex)" src/theater || true)
stage_refs=$(printf "%s" "$stage_files" | xargs -r rg -n "this\\.(currentStage|stageIndex)" | wc -l)
stage_file_count=$(printf "%s" "$stage_files" | sed '/^$/d' | wc -l)

{
  echo "- Files with stage references: $stage_file_count"
  echo "- Total references to update: $stage_refs"
  echo ""
  echo "### Scenario 2: Remove Duplicate Morph Storage"
  echo "Change: ScrollOrchestrator no longer stores morph"
  echo ""
} >> "$output_file"

morph_files=$(rg --glob '*.js' -l "this\\.(morph|morphTarget)" src/theater || true)
morph_refs=$(printf "%s" "$morph_files" | xargs -r rg -n "this\\.(morph|morphTarget)" | wc -l)
morph_file_count=$(printf "%s" "$morph_files" | sed '/^$/d' | wc -l)

{
  echo "- Files with morph references: $morph_file_count"
  echo "- Total references to update: $morph_refs"
  echo ""
  echo "### Scenario 3: Create StateBridge Facade"
  echo "Change: Add StateBridge that wraps atoms + theater state"
  echo ""
} >> "$output_file"

state_commands_imports=$(rg --glob '*.js' --glob '*.jsx' -l "StateCommands" src | wc -l)
stage_atom_imports=$(rg --glob '*.js' --glob '*.jsx' -l "stageAtom" src | wc -l)

{
  echo "- New file: src/state/StateBridge.js (~200 lines)"
  echo "- Files importing StateCommands: $state_commands_imports"
  echo "- Files importing stageAtom directly: $stage_atom_imports"
  echo ""
  echo "## Impact Summary"
  echo ""
} >> "$output_file"

theater_state_refs=$(rg --glob '*.js' -n "this\\.(currentStage|phase|morph|running)" src/theater | wc -l)
atom_imports_total=$(rg --glob '*.js' --glob '*.jsx' -n "import .*Atom" src | wc -l)
files_with_state=$(rg --glob '*.js' --glob '*.jsx' -l "this\\.(currentStage|phase|morph)" src | wc -l)

estimated_loc=$((theater_state_refs / 2))

{
  echo "- Total theater state references: $theater_state_refs"
  echo "- Total atom imports: $atom_imports_total"
  echo "- Estimated LOC to modify: $estimated_loc"
  echo "- Files requiring changes: $files_with_state"
  echo ""
  echo "✅ Impact analysis complete"
} >> "$output_file"

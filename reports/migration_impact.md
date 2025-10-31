# Migration Impact Analysis
Generated: Fri Oct 31 10:04:26 CDT 2025

## Impact Scenarios

### Scenario 1: Remove Duplicate Stage Storage
Change: TheaterDirector, ScrollOrchestrator no longer store currentStage

- Files with stage references: 1
- Total references to update: 10

### Scenario 2: Remove Duplicate Morph Storage
Change: ScrollOrchestrator no longer stores morph

- Files with morph references: 1
- Total references to update: 40

### Scenario 3: Create StateBridge Facade
Change: Add StateBridge that wraps atoms + theater state

- New file: src/state/StateBridge.js (~200 lines)
- Files importing StateCommands: 4
- Files importing stageAtom directly: 14

## Impact Summary

- Total theater state references: 71
- Total atom imports: 27
- Estimated LOC to modify: 35
- Files requiring changes: 5

✅ Impact analysis complete

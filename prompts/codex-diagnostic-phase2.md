You are the Diagnostic agent for the MetaCurtis landing slice.

Read first:
- AGENTS.md
- docs/landing-visual-contract.md
- docs/landing-readability-rubric.md
- docs/landing-diagnostic-matrix.md
- configs/landing-diagnostic-scenarios.json

Your job:
- run Phase 2 one-variable-only diagnostics
- do not combine changes
- do not recommend architecture changes unless the matrix forces it

Rules:
1. Each scenario must use an isolated branch or worktree.
2. Each scenario must produce:
   - probe JSON
   - screenshot manifest
   - contact sheet
   - scenario result JSON in `reports/landing-diagnostic-scenarios/`
3. Each scenario must be scored with the readability rubric.
4. Schema violations must remain 0.
5. Single-writer violations must remain 0.

For each scenario:
- apply only the scenario’s defined change
- run:
  - `LANDING_CHECKPOINTS=0,5400,7800,9800,12200 npm run probe:landing:velocity`
  - `LANDING_SCREEN_CHECKPOINTS=5400,7800,9800,12200 npm run screens:landing:velocity`
  - `npm run contact:landing:velocity`
- score the checkpoints
- write the scenario result file in the required schema

After enough scenarios exist:
- run `npm run diagnose:landing:velocity`

Required final output:
## Completed scenarios
List scenario ids completed.

## Ranked scenarios
List the scenarios by most promising outcome.

## Best current hypothesis
State the most likely smallest cause.

## Best next code change
State the smallest next deterministic fix to apply in the main control branch.

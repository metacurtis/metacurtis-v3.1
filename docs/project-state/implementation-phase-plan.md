# Implementation Phase Plan

## Phase 1 - Declare the Truth
Files:
- `docs/project-state/live-capabilities.md`
- `docs/project-state/current-entrypoints.md`

Outcome:
- The repo explicitly distinguishes live, partial, and legacy capability.

## Phase 2 - Standardize the Live Workflow
Files:
- `scripts/new-worktree.sh`
- `scripts/start-flow.sh`

Outcome:
- New work starts in an external worktree.
- The external worktree becomes the artifact-producing surface.
- The trusted landing flow has a single entry surface.

## Phase 3 - Keep Shipping on the Proven Lane
Use:
- `./scripts/start-flow.sh landing`
- `./scripts/start-flow.sh landing-verify`

Rules:
- Stay on the landing pipeline, ownership validation, and single-writer checks.
- Do not block landing work on orchestration repair.

## Phase 4 - Freeze v3.7 as a Repair Track
Current status:
- Documented
- Useful as design intent
- Not a current shipping path

Action:
- Leave `docs/orchestration/*` in place.
- Do not treat it as current authority until `scripts/run-flow-v3.7.mjs` is repaired and verified.

## Phase 5 - Decide After Landing Ships
Choose one:
- Repair v3.7 properly
- Replace it with a leaner system
- Fold the useful parts into the smaller live development OS

Decision gate:
- Landing slice workflow is stable
- Current command surface is explicit
- Artifact discipline is repeatable

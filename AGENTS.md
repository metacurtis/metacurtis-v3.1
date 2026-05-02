# AGENTS.md

## MetaCurtis Labs — Behavior Constitution
Version: 2026-05-v3 | Operator: Curtis Whorton

---

## Transition Status
This constitution is additive.
The landing-specific operating rules already in this file remain active and authoritative for landing work until the override split is complete.

If a rule in this constitution conflicts with the landing-specific section below, stop and ask the operator before proceeding.

## Scope
This constitution defines repo-wide agent behavior for infrastructure, documentation, workflow, and future context splits.
It does not retire the active landing workflow.

## Authority Order
1. Operator prompt for the current task
2. This constitution header
3. Nearest `AGENTS.override.md` to the current working directory, if present
4. Active skill protocol, if invoked
5. Context-specific operating rules already present in this file

The operator prompt may narrow scope, define the active task, or provide exact implementation instructions.

The operator prompt may not bypass:
- single-writer rules
- schema / contract gates
- quality gates
- generated artifact policy
- explicit operator-only decisions

## Core Session Rules
- Do not execute silently. Report what you will do before doing it.
- Do not fix adjacent issues unless explicitly instructed.
- Do not introduce new subsystems, dependencies, or architecture without operator approval.
- Do not modify `AGENTS.md`, `AGENTS.override.md`, or any `SKILL.md` unless the operator explicitly asks for it.
- Scope creep is a violation. Keep to one logical unit unless the operator explicitly expands scope.
- Every change must be committable or discardable cleanly.

## Commit / Push Policy
- Codex may propose a commit message.
- Codex may stage or commit only when the operator explicitly instructs it.
- Codex must not push unless the operator explicitly instructs it in the current session.
- Commit message format, when requested: `[scope] description`

## Single-Writer Rules
- Renderer is the single writer for geometry and uniforms.
- Engine is the single writer for blueprint generation.
- Director never writes geometry or uniforms directly.
- Do not bypass single-writer rules to "make it work."

## Dirty State Protocol
Before editing:
1. Run `git status --short --branch`.
2. Classify dirty files as Source / Evidence / Noise / Unknown.
3. Proceed only if target files are unambiguous.
4. Stop and report if target files are already modified unexpectedly.

## Generated Artifact Policy
Generated artifacts are not committed by default unless the operator explicitly promotes them as source-controlled evidence.

Never commit by default:
- `dist/`
- `build/`
- `coverage/`
- `exports/`
- screenshot manifests, probe outputs, logs, contact sheets
- temporary manifests, cache files, machine-local files

Classify untracked files as:
1. Source
2. Evidence
3. Noise
4. Unknown

Unknown files require operator review before staging.

## Worktree Policy
- Default to one worktree per session.
- Multi-worktree work is allowed only for explicit sync, audit, or triage tasks.
- Confirm the active worktree before editing.
- Follow the repo's current external-worktree workflow for artifact-producing landing work.

## Existing Landing Governance
The landing-specific operating rules below remain the active domain authority until the override split is complete.

# AGENTS.md

## Project
MetaCurtis Consciousness Theater  
Landing Slice Factory / velocity landing slice

## Current priority
Perfect one premium landing slice using stage-mode landing only.

### Authoritative URLs
Animated / live:
`/?slice=landing_stage&preset=velocity_stage&landingWord=FORM&landingQuality=ULTRA&quality=ULTRA`

Deterministic / frozen audit:
`/?slice=landing_stage&preset=velocity_stage&landingWord=FORM&landingQuality=ULTRA&quality=ULTRA&deterministic=1&seed=123`

## Core non-negotiables
- Velocity landing must use **stage-mode only**.
- Do **not** call `runVisualDemo()` for velocity landing.
- Renderer is the **single writer** for geometry and uniforms.
- Engine is the **single writer** for blueprint generation.
- Director never writes geometry/uniforms directly.
- Deterministic mode must freeze motion by design.
- Do not refactor blueprint generation unless explicitly asked.
- Do not introduce a new rendering subsystem unless explicitly asked.
- Do not bypass schema or single-writer rules to "make it work."

## Current landing slice goal
The word **FORM** must:
- be legible during and after settle
- be visually dominant over surrounding particles
- remain spatially coherent
- be large enough to become a later UI anchor
- stay readable during transition beats, not only in the final state

## Current known visual failure modes
- FORM becomes FRM / pixel mush
- FORM disappears behind the particle field
- FORM becomes an overexposed glowing slab
- transition beat makes FORM less legible instead of more legible
- beat timings are interpreted against page load instead of stage-mode start

## Authority order
1. `AGENTS.md`
2. `docs/landing-visual-contract.md`
3. `sst/canon/v3.5.runtime.json`
4. latest probe artifacts in `reports/velocity-stage-probes/`
5. latest screenshots in `reports/velocity-stage-screens/`

## Landing-specific edit zones
Allowed for landing slice work:
- `sst/canon/v3.5.runtime.json`
- `src/components/consciousness/ConsciousnessTheater.jsx`
- `src/components/webgl/WebGLBackground.jsx`
- `tests/visual/*`
- `scripts/probe-landing-velocity.js`
- `scripts/capture-landing-velocity-screens.js`
- `docs/landing-visual-contract.md`
- `prompts/*`

## Forbidden edit zones unless explicitly requested
- blueprint generation internals
- unrelated stage system architecture
- demo-mode architecture
- unrelated docs / ownership maps / unrelated UI
- global renderer ownership rules

## Required validation after any landing change
1. Run the runtime probe.
2. Run the screenshot capture.
3. Check for schema violations.
4. Check for single-writer violations.
5. Record what improved, what regressed, and what remains unclear.

## Required reporting format
Every implementation/verifier report must include:
- files changed
- commands run
- runtime values at checkpoints
- screenshot paths
- schema violations: yes/no
- single-writer violations: yes/no
- visual conclusion
- next smallest recommended fix

## Landing timing rule
All landing beat timings are interpreted **relative to**
`[ConsciousnessTheater] Landing stage mode started`
and **not** relative to page navigation.

## Visual contract rule
A landing tweak is not considered valid unless it produces:
- a probe artifact
- screenshot artifacts
- a pass/fail note against `docs/landing-visual-contract.md`

## Working style for agents
### Architect
- reads config, runtime contract, current artifacts
- proposes the smallest change that can prove or improve something
- does not over-edit

### Implementer
- edits only approved files
- applies the smallest diff
- runs required commands
- reports exact changes

### Verifier
- does not edit code
- runs probes/screens
- compares runtime truth to visual contract
- reports pass/fail and mismatch reasons

## Current workflow objective
Build a deterministic, inspectable, repeatable workflow for landing slice iteration so future visual tuning is:
- scoped
- testable
- reversible
- attributable

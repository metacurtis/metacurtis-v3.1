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

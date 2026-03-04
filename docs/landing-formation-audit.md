# Landing Formation Audit — Phase 4

## Purpose
Phase 4 audits formation/target integrity for the velocity landing slice after beat-sheet tuning plateaued.

This phase answers whether lock failure is caused by:
- target integrity problems (word target itself)
- renderer obscuration (target is good but presentation buries it)
- unresolved evidence needing deeper inspection

## Scope
This audit is inspection-first.

Do not tune the landing beat sheet during this phase.

## Authoritative URLs
Animated / live:
`/?slice=landing_stage&preset=velocity_stage&landingWord=FORM&landingQuality=ULTRA&quality=ULTRA`

Deterministic / frozen audit:
`/?slice=landing_stage&preset=velocity_stage&landingWord=FORM&landingQuality=ULTRA&quality=ULTRA&deterministic=1&seed=123`

## Questions the audit must answer
1. What word source actually generates the landing target?
2. What does the raw FORM target cloud look like?
3. Are letter counters preserved in the target cloud?
4. Is target density/packing too high?
5. Is target normalization/scaling compressing the glyph?
6. Are these aligned: resolved landing word, stage word, visual letterGeometry word, blueprint source text?
7. Is runtime landing actually using the intended target geometry?

## Runtime evidence used
- `window.Canonical` authority fields
- `BLUEPRINT_READY` tap summaries (stage/word/metadata/array lengths)
- `window.__rendererDiagnostics` attribute arrays:
  - `text3DPosition`
  - `atmosphericPosition`
  - `position`
- `window.__dumpRendererState()` at checkpoints
- lock-window checkpoints relative to:
  `[ConsciousnessTheater] Landing stage mode started`

## Artifact outputs
The script writes a run directory under:
`reports/landing-formation-audit/`

Per run:
- `landing-formation-audit-<timestamp>.json`
- `text3d-scatter-<lock-ms>.csv`
- `text3d-scatter-<lock-ms>.svg`

## JSON report highlights
- `authority`: resolved and configured word sources
- `timeline`: runtime snapshots at checkpoints
- `blueprintTap`: observed blueprint payload summaries
- `geometry.text3D`: AABB, density, nearest-neighbor, occupancy/hole proxy
- `compression`: text coverage vs viewport
- `alignment`: authority and geometry consistency checks
- `verdict`: one of:
  - `target_integrity_problem`
  - `target_integrity_remediated`
  - `renderer_obscuration_problem`
  - `unresolved_needs_deeper_inspection`

## Default checkpoints
- timeline: `0,5400,7800,9800,12200`
- lock-window: `7700,7800,7900,8300`

Override with env:
- `LANDING_CHECKPOINTS`
- `LOCK_WINDOW_CHECKPOINTS`
- `LOCK_INSPECTION_MS`

## Command
```bash
npm run audit:landing:formation
```

## Interpretation rule
A Phase 4 conclusion must be evidence-based.

If authority mismatch or target-cloud integrity defects are found, do not continue beat-sheet tuning until addressed.

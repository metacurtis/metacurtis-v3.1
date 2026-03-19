# Pre-Mist R&D Baseline

MetaCurtis Consciousness Theater  
velocity landing slice

## Purpose

This document defines the pre-mist landing restore point that should be used as the base for new landing R&D branches.

It exists to separate:

- the earlier legibility-first landing path
- the later `FORM + mist` baseline frozen in `94e8766`
- the non-visual startup integrity fixes worth preserving regardless of visual doctrine

## Baseline identity

- Named anchor commit: `d81d59b`
- Exact code-equivalent commit: `3105cce`
- Current restore branch: `baseline/pre-mist-r-and-d`

Why `d81d59b` is used as the named anchor:

- it is the last named checkpoint before `94e8766`, which explicitly freezes the `FORM + mist baseline`
- it preserves the stage-mode velocity landing path without adopting mist as the premium feature doctrine

Why `3105cce` is equally important:

- `d81d59b` is a docs-only commit
- the landing code state at `d81d59b` is identical to `3105cce`

## What this baseline is

This restore point is:

- pre-mist
- stage-mode landing
- explicit `velocity_stage` beat-sheet driven
- legibility-first
- suitable as a stable R&D source branch

This restore point is not:

- the mist baseline frozen in `94e8766`
- an HRV branch
- a premium hero-body solution
- a synchronized historical artifact pack that already existed before this restore

## What was carried forward

Only the non-visual startup survivability fixes from `a8bdded` were ported into this branch.

### 1. `src/components/consciousness/ConsciousnessTheater.jsx`

Carried behavior:

- immediate application of beat `0`
- one-time beat `0` reapply at `+64ms`

Why it is kept:

- it reduces the startup/bind race at landing boot
- it improves sequencing integrity
- it is an app-health fix, not a mist doctrine change

### 2. `src/components/webgl/WebGLBackground.jsx`

Carried behavior:

- bind-time seed of the first `velocity_stage` landing beat

Why it is kept:

- it reduces the chance that the renderer bind/reset wipes the intended opening state
- it is initialization integrity, not visual ideology

## What was intentionally not carried forward

Not carried into this branch:

- mist-phase fragment-law changes from `94e8766`
- mist-phase atmospheric-current vertex-law changes from `94e8766`
- mist baseline summary/decision framing
- mist-centered interpretation of the landing

In practice, this means this branch does not use:

- `94e8766` version of `src/shaders/templates/consciousness-fragment.glsl`
- `94e8766` version of `src/shaders/templates/consciousness-vertex.glsl`
- `docs/landing-baseline-summary.md` as the baseline doctrine for new R&D
- `docs/landing-decision-log.md` as the baseline doctrine for new R&D

Those documents describe the mist baseline that is being retired as the starting point.

## Route and baseline URLs

Use this live route for the restored pre-mist baseline:

`/?slice=landing_stage&preset=velocity_stage&landingWord=FORM&landingQuality=ULTRA&quality=ULTRA`

Use this deterministic route for frozen audit:

`/?slice=landing_stage&preset=velocity_stage&landingWord=FORM&landingQuality=ULTRA&quality=ULTRA&deterministic=1&seed=123`

Important note:

- at `3105cce` / `d81d59b`, the `velocity_stage` preset default word is still `VELOCITY`
- use the `landingWord=FORM` query param to keep the landing on `FORM`

## Opening identity at this baseline

At this restore point, the `velocity_stage` beat sheet is still the earlier baseline:

- `0–5000ms`: `coalesce`
- `5000ms+`: `velocity_rest`

This branch is therefore the clean pre-mist opening source for future R&D.

## Frozen artifact packs created for this restore

No synchronized pre-mist artifact pack existed before this restore.

This branch now establishes one.

### Live pack

- Probe:
  - `reports/velocity-stage-probes/landing-velocity-probe-2026-03-19T19-43-12-735Z.json`
- Screens:
  - `reports/velocity-stage-screens/run-2026-03-19T19-43-05-462Z/manifest.json`
  - `reports/velocity-stage-screens/run-2026-03-19T19-43-05-462Z/landing-00000ms.png`
  - `reports/velocity-stage-screens/run-2026-03-19T19-43-05-462Z/landing-00800ms.png`
  - `reports/velocity-stage-screens/run-2026-03-19T19-43-05-462Z/landing-01800ms.png`
  - `reports/velocity-stage-screens/run-2026-03-19T19-43-05-462Z/landing-03000ms.png`

### Deterministic pack

- Probe:
  - `reports/velocity-stage-probes/landing-velocity-probe-2026-03-19T19-44-10-250Z.json`
- Screens:
  - `reports/velocity-stage-screens/run-2026-03-19T19-44-04-050Z/manifest.json`
  - `reports/velocity-stage-screens/run-2026-03-19T19-44-04-050Z/landing-00000ms.png`
  - `reports/velocity-stage-screens/run-2026-03-19T19-44-04-050Z/landing-00800ms.png`
  - `reports/velocity-stage-screens/run-2026-03-19T19-44-04-050Z/landing-01800ms.png`
  - `reports/velocity-stage-screens/run-2026-03-19T19-44-04-050Z/landing-03000ms.png`

## Runtime checkpoint summary

The new restore pack uses early-window checkpoints:

- `0ms`
- `800ms`
- `1800ms`
- `3000ms`

### Live probe summary

- `0ms`
  - `drawCount = 15000`
  - `fov = 100`
  - tracked numeric uniforms unavailable at exact capture
- `800ms`
  - `uMorphProgress = 0`
  - `uPointSize = 3`
  - `uGaussianSigma = 2.5`
  - `uDepthFalloffPower = 1`
  - `uCenterWeighting = 1`
  - `uFlowTurbulence = 0`
  - `uSpreadFactor = 1`
  - `uOpacityMin = 0.5`
  - `uOpacityMax = 1`
- `1800ms`
  - `uMorphProgress = 0.7895830607614729`
  - `uPointSize = 3`
  - `uGaussianSigma = 2.5`
  - `uDepthFalloffPower = 1`
  - `uCenterWeighting = 1`
  - `uFlowTurbulence = 0`
  - `uSpreadFactor = 1`
  - `uOpacityMin = 0.5`
  - `uOpacityMax = 1`
- `3000ms`
  - `uMorphProgress = 1`
  - `uPointSize = 3`
  - `uGaussianSigma = 2.5`
  - `uDepthFalloffPower = 1`
  - `uCenterWeighting = 1`
  - `uFlowTurbulence = 0`
  - `uSpreadFactor = 1`
  - `uOpacityMin = 0.5`
  - `uOpacityMax = 1`

### Deterministic probe summary

- `0ms`
  - `drawCount = 15000`
  - `fov = 100`
  - tracked numeric uniforms unavailable at exact capture
- `800ms`
  - `uMorphProgress = 1`
  - `uPointSize = 3`
  - `uGaussianSigma = 2.5`
  - `uDepthFalloffPower = 1`
  - `uCenterWeighting = 1`
  - `uFlowTurbulence = 0`
  - `uSpreadFactor = 1`
  - `uOpacityMin = 0.5`
  - `uOpacityMax = 1`
- `1800ms`
  - `uMorphProgress = 1`
  - `uPointSize = 3`
  - `uGaussianSigma = 2.5`
  - `uDepthFalloffPower = 1`
  - `uCenterWeighting = 1`
  - `uFlowTurbulence = 0`
  - `uSpreadFactor = 1`
  - `uOpacityMin = 0.5`
  - `uOpacityMax = 1`
- `3000ms`
  - `uMorphProgress = 1`
  - `uPointSize = 3`
  - `uGaussianSigma = 2.5`
  - `uDepthFalloffPower = 1`
  - `uCenterWeighting = 1`
  - `uFlowTurbulence = 0`
  - `uSpreadFactor = 1`
  - `uOpacityMin = 0.5`
  - `uOpacityMax = 1`

## Validation status

- `npm run test:contract:renderDirective`: passed
- `npm run validate:canon`: passed
- live probe: `0` schema violations
- live probe: `0` single-writer violations
- deterministic probe: `0` schema violations
- deterministic probe: `0` single-writer violations

## Operational doctrine for future experiments

Branch future landing R&D from this restore point, not from the mist baseline.

Recommended rule:

- baseline source = `d81d59b`
- code identity = `3105cce`
- keep only the startup survivability fixes ported here
- treat this branch as the clean source for new landing hero experiments

## What later experiments must not assume

Do not assume:

- this branch includes the `94e8766` mist-phase hierarchy work
- this branch includes the mist-phase atmospheric current work
- this branch represents the mist baseline

Do assume:

- this branch preserves stage-mode landing
- this branch preserves the explicit `velocity_stage` route
- this branch includes the startup race mitigation needed for stable iteration

## Use case

This branch should be used when the question is:

> what can the landing become if we branch from the pre-mist legibility-first path instead of continuing from the mist baseline?

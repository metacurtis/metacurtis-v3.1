# Landing Diagnostic Matrix — Velocity Stage

## Purpose
Phase 2 exists to stop guesswork.

We use one-variable-only scenarios to identify the real cause of landing slice readability failure and rank the smallest winning fixes.

This phase is diagnostic, not aesthetic exploration.

## Current control state
The current control is the **point-size-only pass** already validated in the repo:
- lock beat point size reduced by 1
- drift beat point size reduced by 1
- schema clean
- single-writer clean
- opacity uniforms now landing correctly

All new scenarios must be compared against this control.

## Core rules
1. Change **one variable only** per scenario.
2. Use an isolated branch or worktree per scenario.
3. Produce the full artifact set for every scenario:
   - probe JSON
   - screenshot manifest
   - contact sheet
   - scenario result JSON
4. Score every scenario using:
   - `docs/landing-readability-rubric.md`
5. Do not combine variables unless a prior scenario proves the first variable is a keeper.

## Authoritative URLs
Animated / live:
`/?slice=landing_stage&preset=velocity_stage&landingWord=FORM&landingQuality=ULTRA&quality=ULTRA`

Deterministic / frozen audit:
`/?slice=landing_stage&preset=velocity_stage&landingWord=FORM&landingQuality=ULTRA&quality=ULTRA&deterministic=1&seed=123`

## Required checkpoints
Use inside-beat checkpoints for all diagnostics:
- `5400`
- `7800`
- `9800`
- `12200`

All timings are relative to:
`[ConsciousnessTheater] Landing stage mode started`

## Required scenario artifact schema
Each scenario must write a result file to:

`reports/landing-diagnostic-scenarios/<scenario-id>.json`

Required shape:

```json
{
  "scenarioId": "sigma_only_minus_0_1",
  "label": "Sigma-only reduction",
  "baseScenarioId": "control_current",
  "branch": "landing-diagnostic-sigma-only",
  "probeFile": "reports/velocity-stage-probes/....json",
  "manifestFile": "reports/velocity-stage-screens/run-.../manifest.json",
  "contactSheet": "reports/velocity-stage-screens/run-.../contact-sheet.html",
  "schemaViolationCount": 0,
  "singleWriterViolationCount": 0,
  "scores": {
    "5400": {
      "WordRecognition": 0,
      "CounterClarity": 0,
      "EdgeClarity": 0,
      "ForegroundDominance": 0,
      "TransitionStability": 0,
      "UIAnchorSuitability": 0,
      "visualSummary": "",
      "pass": false
    },
    "7800": {},
    "9800": {},
    "12200": {}
  },
  "visualConclusion": "",
  "rootCauseSignal": "",
  "recommendedDecision": "keep|discard|follow-up"
}
```

## Decision rules

A scenario is a likely keeper if:

- `7800ms` improves in Word Recognition and Edge Clarity
- `9800ms` does not regress in Word Recognition
- schema violations remain 0
- single-writer violations remain 0

A scenario is a likely discard if:

- it improves one checkpoint but materially harms another
- it introduces instability or regressions
- it confuses the silhouette more than the control

## Current diagnostic priority

Based on current evidence, the next likely causes are ranked:

1. target density (`visual.letterGeometry.velocity.particlesPerLetter`)
2. kernel softness (`uGaussianSigma`)
3. transition-beat behavior (`5000ms transition verb`)
4. word-authority mismatch (`FORM` vs `VELOCITY`) if authority fields diverge from control
5. depth exaggeration (`uDepthFalloffPower`)
6. camera placement

## Scenario list

### Scenario 0 — control_current

No code changes. Current validated control.

### Scenario 1 — sigma_only_minus_0_1

Change only:

- lock sigma: `-0.1`
- drift sigma: `-0.1`

Purpose:

- test whether kernel softness is the primary cause of blur

### Scenario 2 — transition_verb_replace

Change only:

- replace the current `5000ms` transition verb (`velocity_rest` in control) with `coalesce`
- keep the same camera / point size / uniform intent as much as possible

Purpose:

- test whether transition verb choice is the main source of silhouette collapse

### Scenario 3 — word_authority_form

Change only:

- temporary diagnostic override:

  - `stages.velocity.word = "FORM"`
  - `visual.letterGeometry.velocity.word = "FORM"`

Purpose:

- test whether multiple word authorities are degrading target geometry

Observed outcome in current baseline:

- this scenario is a no-op when both fields are already `FORM`
- if no value change occurs, record and discard rather than treating as a visual experiment

### Scenario 4 — depth_falloff_minus_0_2

Change only:

- reduce lock/depth falloff slightly

Purpose:

- test whether foreground fill is collapsing the letter edges

### Scenario 5 — camera_pullback_plus_2

Change only:

- move camera slightly farther back during lock/drift

Purpose:

- test whether current proximity is overfilling the glyph

### Scenario 6 — lock_point_minus_1

Change only:

- reduce lock beat point size by `1`
- do not change drift point size

Purpose:

- test whether lock readability improves from a thinner lock kernel without affecting drift behavior

### Scenario 7 — lock_sigma_minus_0_15

Change only:

- reduce lock beat `uGaussianSigma` by `0.15`
- do not change drift sigma

Purpose:

- test whether lock-only sharpening improves 7800ms readability/dominance without drift regressions

### Scenario 8 — lock_opacity_tighten

Change only:

- tighten lock beat `uOpacityMax`
- tighten lock beat `uOpacityMin`
- do not change drift opacity

Purpose:

- test whether lock readability/dominance improves by reducing lock overpaint while leaving drift untouched

### Scenario 9 — lock_spread_tighten

Change only:

- reduce lock beat `uSpreadFactor` from control to `0.82`
- do not change drift spread

Purpose:

- test whether lock-local spread tightening improves lock coherence/readability without altering drift behavior

### Scenario 10 — lock_isolate_pulse

Change only:

- recompose the lock moment into a short isolate pulse around the 7800ms checkpoint
- keep 9400ms drift behavior unchanged

Purpose:

- test whether a structural lock-local composition change improves lock subject dominance beyond scalar tuning

### Scenario 11 — sigma_plus_lock_isolate_refined

Change only:

- start from the `sigma_only_minus_0_1` keeper baseline
- apply a refined lock isolate window around the lock checkpoint
- keep the drift beat behavior aligned to the sigma baseline

Purpose:

- test the first evidence-based compound candidate after single-variable lock tuning plateau

### Scenario 12 — target_density_particles_per_letter_800

Change only:

- `visual.letterGeometry.velocity.particlesPerLetter: 200 -> 800`
- do not change beat sheet, camera, point size, sigma, opacity, depth, spread, or architecture

Purpose:

- test whether lock readability failure is upstream target-density starvation rather than beat orchestration

Observed outcome:

- assigned text particles increased from `800` to `3200`
- text assignment ratio increased from `5.3%` to `21.3%`
- release gate passed on scenario artifacts
- recommended decision: `keep`

## Reporting rule

Every scenario conclusion must answer:

1. Did 7800ms improve?
2. Did 9800ms improve?
3. What got better?
4. What got worse?
5. Should this scenario be kept, discarded, or followed up?

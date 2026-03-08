# Handoff Runbook — Velocity Landing RC1

## Goal
Operate and validate RC1 without regressing readability, ownership invariants, or release-gate status.

## Baseline assumptions
- Branch: `landing-diagnostics-control`
- RC1 keeper present: `visual.letterGeometry.velocity.particlesPerLetter = 800`
- Stage-mode landing only

## Canonical URLs
Animated:
`/?slice=landing_stage&preset=velocity_stage&landingWord=FORM&landingQuality=ULTRA&quality=ULTRA`

Deterministic:
`/?slice=landing_stage&preset=velocity_stage&landingWord=FORM&landingQuality=ULTRA&quality=ULTRA&deterministic=1&seed=123`

## Validation commands

### Formation audit
`npm run audit:landing:formation`

### Runtime probe
`LANDING_CHECKPOINTS=0,5400,7800,9800,12200 npm run probe:landing:velocity`

### Screenshots
`LANDING_SCREEN_CHECKPOINTS=5400,7800,9800,12200 npm run screens:landing:velocity`

### Contact sheet
`npm run contact:landing:velocity`

### Probe compare
`npm run compare:landing:velocity`

### Scenario summary
`npm run diagnose:landing:velocity`

### Release gate
`npm run gate:landing:velocity`

### UI anchor audit
`npm run audit:landing:ui-anchor`

## PASS criteria
- `npm run gate:landing:velocity` returns `PASS`
- schema violations = 0
- single-writer violations = 0
- lock/drift checkpoints satisfy rubric thresholds

## Safe change policy (word/palette)
Allowed quick changes:
- `landingWord` URL param for previews
- palette/color values in approved landing preset scope

Do not change during quick customization:
- blueprint-generation internals
- writer ownership model
- renderer single-writer contract

## Word change procedure
1. Apply word change in approved config authority locations.
2. Run full validation command set above.
3. Confirm gate PASS before handoff.
4. Capture fresh artifact pack.

## Palette change procedure
1. Apply only approved color/palette fields.
2. Re-run screens + gate.
3. Reject change if lock readability regresses.

## Artifact locations
- probes: `reports/velocity-stage-probes/`
- screens: `reports/velocity-stage-screens/`
- formation audits: `reports/landing-formation-audit/`
- ui-anchor audits: `reports/landing-ui-anchor-audit/`
- scenario summaries: `reports/landing-diagnostic-scenarios/`

## Escalation rules
- If gate fails: stop and remediate before release.
- If lock readability regresses: revert to last PASS baseline.
- If authority mismatch appears: run formation audit before any beat tuning.

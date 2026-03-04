# Landing UI Anchor Contract — Velocity RC1

## Purpose
Define how Velocity Landing RC1 exposes a stable FORM anchor for UI attachment without regressing readability or release-gate behavior.

## Baseline
This contract assumes RC1 control state:
- stage-mode landing only
- velocity letter target density remediated (`particlesPerLetter = 800`)
- release gate passing

## Anchor checkpoints
All times are relative to:
`[ConsciousnessTheater] Landing stage mode started`

Primary UI-anchor checkpoints:
- `7800ms` (lock)
- `9800ms` (early drift)
- `12200ms` (late drift)

## Anchor models to evaluate
1. Whole-word anchor
- single AABB for FORM
- best when UI attaches to the word as one subject

2. Per-letter anchor
- one region per letter (F O R M)
- best when letter-level interaction is needed

3. Zone-based anchor
- left/center/right interaction zones across FORM
- best compromise when per-letter separation is weak

## Stability requirements
For an anchor model to be considered ready:
- morphology is formed (`uMorphProgress = 1`) at lock/drift
- anchor bounds exist at all required checkpoints
- anchor center drift and area drift are within stable limits
- overlap/ambiguity is low enough for unambiguous hit regions

## Recommended readiness thresholds
Whole-word ready when all are true:
- min consecutive XY IoU >= 0.72
- max center drift (normalized by lock diagonal) <= 0.10

Zone-based ready when all are true:
- whole-word ready
- min consecutive zone IoU >= 0.55

Per-letter ready when all are true:
- whole-word ready
- 4 stable letter clusters detected at each checkpoint
- min consecutive letter IoU >= 0.45
- adjacent letter overlap ratio <= 0.35

## Required Phase 5A artifact
`reports/landing-ui-anchor-audit/run-*/landing-ui-anchor-audit-*.json`

The audit report must include:
- whole-word bounds per checkpoint
- per-letter or per-zone bounds when detectable
- checkpoint stability metrics
- readiness verdict for whole-word, per-letter, and zone-based models
- recommended runtime fields for UI integration

## Non-negotiables
- no beat-sheet tuning in Phase 5A
- no reduction of text target density
- no architecture drift
- preserve release-gate pass conditions

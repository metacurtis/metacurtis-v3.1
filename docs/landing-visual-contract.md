# Landing Visual Contract — Velocity Stage

## Authoritative URLs
Animated / live:
`/?slice=landing_stage&preset=velocity_stage&landingWord=FORM&landingQuality=ULTRA&quality=ULTRA`

Deterministic / frozen audit:
`/?slice=landing_stage&preset=velocity_stage&landingWord=FORM&landingQuality=ULTRA&quality=ULTRA&deterministic=1&seed=123`

## Purpose
This document defines what the landing slice is supposed to do visually and how we judge whether a change is an improvement or a regression.

## Design intent
The landing slice should:
- begin from a dark field with atmospheric particles
- form the word **FORM**
- keep FORM legible during expansion and transition
- create a prominent lock moment where FORM is clearly readable
- reintroduce subtle motion without burying the word again

## Current narrative intent
### Early
Particles gather and resolve into FORM.

### Transition
FORM grows and becomes more present without collapsing into blur or a glowing slab.

### Lock
FORM is the visual subject, not just part of the environment.

### Drift
The environment regains subtle motion while FORM remains readable and dominant.

## Runtime checkpoints
All times are relative to:
`[ConsciousnessTheater] Landing stage mode started`

### Checkpoint A — formation start
Expected:
- FORM appears as a readable word
- surrounding particles support the reveal
- no severe blur or streaking

### Checkpoint B — transition
Expected:
- FORM remains legible while growing
- no collapse into FRM / glowing bar / slab
- no disappearance behind the field

### Checkpoint C — lock
Expected:
- `uMorphProgress = 1`
- camera and particle presentation favor FORM as subject
- readability is stronger than at transition
- the word is big enough to serve as a later UI anchor

### Checkpoint D — premium drift
Expected:
- FORM remains readable
- subtle motion returns
- particles restore depth without burying the word

## Known failure modes
- FORM becomes FRM
- counters and edges disappear
- negative space inside letters is lost
- field dominates the word
- the word becomes too blurred to anchor UI
- runtime values say “formed” but screenshots still show a slab

## Acceptance criteria
A landing change is acceptable only if all are true:
- runtime values match expected beat intent
- screenshots show FORM more clearly than the prior baseline
- no `RENDER_DIRECTIVE` schema violations
- no single-writer violations
- no architectural drift

## Required artifacts for any landing iteration
- latest runtime probe JSON
- latest checkpoint screenshots
- a short code-says / screen-says note

## Code-says / screen-says rule
Every verifier output must answer:
1. What the code says should happen at each checkpoint
2. What the screenshots actually show
3. Where they diverge
4. The smallest next fix

## Current baseline checkpoints to sample
These are the default checkpoints for probe/screenshot automation:
- `0`
- `5000`
- `7600`
- `9400`
- `12000`

These may change when the beat sheet changes, but probe scripts should stay beat-relative.

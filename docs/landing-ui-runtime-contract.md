# Landing UI Runtime Contract (Phase 5B)

## Purpose
Define the read-only runtime payload consumed by UI layers for Velocity Landing RC1.1+ without violating single-writer rules.

## Scope
- Stage: `velocity`
- Baseline: `target_scale_up_1_6`
- This contract is consumer-facing and complements:
  - `docs/landing-ui-anchor-contract.md`
  - `docs/landing-visual-contract.md`

## Ownership invariants
1. Renderer is single writer for geometry/uniform state.
2. UI consumers must only read `window.__landingUiAnchor`.
3. UI must never mutate renderer state through this contract.
4. Payload-shape changes require a `version` bump.

## Payload (v1.0)

```js
window.__landingUiAnchor = {
  version: "1.0",
  sourceScenarioId: "target_scale_up_1_6",
  updatedAtMs: 0,
  ready: false,
  stage: "velocity",
  word: "FORM",
  checkpoint: "unknown", // "lock" | "drift" | "unknown"
  recommendedModel: "per-letter",
  whole: {
    min: null,
    max: null,
    size: null,
    center: null
  },
  letters: [
    // { id: "F" | "O" | "R" | "M", aabb: {min,max,size}, center: {x,y,z} }
  ],
  zones: [
    // { id: "left" | "center" | "right", aabb: {min,max,size}, center: {x,y,z} }
  ],
  stability: {
    wholeReady: false,
    perLetterReady: false,
    zoneReady: false
  }
}
```

## Null-safe contract behavior
If stage is not active, morphology is not formed, or geometry cannot be resolved:
- keep payload present
- set `ready: false`
- set `checkpoint: "unknown"`
- set geometric fields to `null` or empty arrays

Consumers should treat `ready: false` as a hard no-op state.

## Required validation

```bash
npm run audit:landing:ui-anchor
npm run gate:landing:velocity
```

Recommended for runtime export changes:

```bash
npm run audit:landing:ui-runtime
```

## Acceptance criteria
- Payload shape matches `version: "1.0"`.
- RC1.1 baseline remains gate PASS.
- UI-anchor audit remains ready for whole/per-letter/zone.
- No schema or single-writer violations.

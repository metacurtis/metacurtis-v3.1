# Landing UI Runtime Contract (Phase 5B/5C)

## Purpose
Define the renderer-owned, read-only runtime payload consumed by UI layers for Velocity Landing RC1.1+ without violating single-writer rules.

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
4. Payload-shape changes require a `version` bump and audit update.

## Payload (v1.1)

```js
window.__landingUiAnchor = {
  version: "1.1",
  sourceScenarioId: "target_scale_up_1_6",
  updatedAtMs: 0,
  ready: false,
  stage: "velocity",
  word: "FORM",
  checkpoint: "unknown", // "lock" | "drift" | "unknown"
  recommendedModel: "per-letter",

  whole: {
    min: { x: null, y: null, z: null },
    max: { x: null, y: null, z: null },
    size: { x: null, y: null, z: null },
    center: { x: null, y: null, z: null },
    screenRect: {
      min: { x: null, y: null },
      max: { x: null, y: null },
      size: { w: null, h: null },
      center: { x: null, y: null },
    },
  },

  letters: [
    // {
    //   id: "F" | "O" | "R" | "M",
    //   aabb: { min, max, size, center, screenRect },
    //   center: { x, y, z },
    //   screenRect: { min, max, size, center }
    // }
  ],

  zones: [
    // {
    //   id: "left" | "center" | "right",
    //   aabb: { min, max, size, center, screenRect },
    //   center: { x, y, z },
    //   screenRect: { min, max, size, center }
    // }
  ],

  stability: {
    wholeReady: false,
    perLetterReady: false,
    zoneReady: false,
  },
};
```

## Screen-space rules (Option B)
- `screenRect` values are viewport pixel coordinates (top-left origin).
- `screenRect` is produced by renderer-owned world-to-screen projection.
- UI overlays must use `screenRect` for placement, not inferred NDC math.

## Null-safe behavior
If stage is inactive, morphology is not formed, or projection is unavailable:
- keep payload present
- set `ready: false`
- set `checkpoint: "unknown"`
- keep `whole` present with null-shaped vectors and null-shaped `screenRect`
- keep `letters` and `zones` as empty arrays

Consumers must treat `ready: false` as a hard no-op state.

## Required validation

```bash
npm run audit:landing:ui-anchor
npm run audit:landing:ui-runtime
npm run audit:landing:ui-consumer
npm run gate:landing:velocity
```

## Acceptance criteria
- Payload shape matches `version: "1.1"`.
- `whole`, `letters[*]`, and `zones[*]` include valid `screenRect` when ready.
- Payload remains null-safe when not ready.
- RC1.1 baseline remains gate PASS.
- UI-anchor and UI-runtime audits both pass.
- No schema or single-writer violations.

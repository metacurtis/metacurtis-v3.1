# Landing UI Consumer Contract (Phase 5C.3)

## Purpose
Define the integrated UI consumer for Velocity Landing RC1.1 using the renderer-owned runtime payload.

## Scope
- Stage: `velocity`
- Baseline scenario: `target_scale_up_1_6`
- Runtime source: `window.__landingUiAnchor` (`v1.1`)
- Consumer surfaces:
  - `LetterDockInterface`
  - `GlassRailCTA`
  - `console drawer` (single-surface panel)
  - lock-only letter hit-zones (DOM overlay mapped to `letters[i].screenRect`)

## Ownership invariants
1. Renderer remains single writer for geometry and uniforms.
2. UI consumers only read `window.__landingUiAnchor`.
3. UI consumers never write renderer internals or BeatBus render directives.
4. Phase 5C cannot change beat-sheet, density, camera, scale, or visual tuning.

## Option B anchoring
- Placement is screen-space (`screenRect`) from runtime payload.
- Console is **magnetic** during lock and **persistent bottom** during drift.
- Lock behavior: UI attaches relative to `whole.screenRect` (word-first composition).
- Drift behavior: UI settles to bottom safe-area with center-x alignment preserved.
- Hit-zones are active only when checkpoint is lock and model is per-letter.

## Deterministic fallback
Resolve model in this order:
1. `per-letter` when `stability.perLetterReady` and all letter `screenRect` centers are finite.
2. `zone` when per-letter fails and `stability.zoneReady` with valid zone `screenRect` centers.
3. `whole` when above fail and `stability.wholeReady` with valid whole `screenRect` center.
4. `none` otherwise.

## Consumer behavior
- `LetterDockInterface`:
  - bottom-safe glass dock inside the shared console
  - 4 letter capsules (`F/O/R/M`)
  - fixed capsule layout (no per-letter capsule drift)
  - local active-state only (no renderer writes)
- `GlassRailCTA`:
  - minimal single-line rail above dock
  - status chip reacts to checkpoint (`lock` => `LOCKED`, `drift` => `LIVE`)
- `Console drawer`:
  - expands from the same console surface (no separate floating card)
  - dock click selects letter; drawer CTA performs scroll actions
- `Section navigation`:
  - `F -> #foundation`, `O -> #offer`, `R -> #results`, `M -> #motion`
  - rail primary CTA scrolls to `#contact`
- `Word attachment affordances`:
  - active-letter glass bracket on the projected letter region
  - dock-to-letter connector line in per-letter mode
- Before-ready state may be hidden/ghosted but must remain null-safe.

## Validation requirements
Run all of:

```bash
npm run audit:landing:ui-anchor
npm run audit:landing:ui-runtime
npm run audit:landing:ui-consumer
npm run gate:landing:velocity
```

## Done criteria
Phase 5C is complete only when:
- dock + rail are visible and anchor-aligned when ready
- lock exposes four letter hit-zones and drift suppresses hit-zones
- dock buttons do not overlap and rail controls do not overlap
- panel CTA and rail secondary CTA scroll to valid target sections
- fallback resolution is deterministic (`per-letter -> zone -> whole`)
- runtime remains read-only
- UI-anchor/UI-runtime/UI-consumer audits pass
- `gate:landing:velocity` remains PASS
- schema violations remain 0
- single-writer violations remain 0

# Deterministic Platform Hardening Playbook

## Purpose
Operational SOP for removing drift paths and enforcing deterministic authority for narrative progress, stage control, and morph publication.

## Core Invariants
1. One production scroll binder publishes narrative progress.
2. `stageAtom` is the only stage/progress authority.
3. Renderer is a sink and emits intent only.
4. Navigation uses one canonical authority API.
5. `MORPH_PROGRESS` has one canonical publisher.

## Patch Order
1. Patch 1: Rename Director morph helper for clarity.
2. Patch 2: Remove global navigation bypass dependencies.
3. Patch 3: Remove deprecated narrative stage/progress writers.
4. Patch 4: Remove secondary form scroll binder and consume canonical stream.

## Patch 1: Director Morph Naming Clarification
### What to change
- Rename `TheaterDirector._emitMorphProgress` to `_emitMorphSnapshot`.

### Files
- `src/theater/TheaterDirector.js`

### Impact
- Low runtime risk; symbol rename and callsite updates only.

### Advantage
- Prevents confusion between diagnostic snapshot emission and canonical `MORPH_PROGRESS` bus publishing.

### Safe rollout
- Update all internal references in same patch.
- Run morph grep gate.

### Gates
```bash
rg -n "_emitMorphProgress|_emitMorphSnapshot" src/theater/TheaterDirector.js
rg -n "\\bemitMorphProgress\\(" src
```

## Patch 2: Remove Navigation Global Bypass Dependency
### What to change
- Remove production reliance on `window.StateCommands`.
- Use imported canonical navigation authority (`StateCommands` or `UnifiedNavigationAPI`) directly.

### Files
- `src/state/commands/NavigationCommands.js`
- `src/theater/TheaterDirector.js`
- Optional bootstrap wiring files if currently required for globals.

### Impact
- Startup wiring must be explicit.

### Advantage
- Eliminates hidden global coupling and “works-only-in-dev-console” behavior.

### Safe rollout
- Release A: keep global exposure for dev diagnostics only.
- Release A: add dev startup assertion when canonical nav authority is missing.
- Release B: remove or restrict global exposure to dev bridge.

### Gates
```bash
rg -n "window\\.StateCommands" src
rg -n "jumpToStage\\(" src/state/commands src/theater
```

## Patch 3: Remove Deprecated Narrative Stage/Progress Writers
### What to change
- Remove or hard-block deprecated pass-through methods:
  - `jumpToStage`
  - `setStage`
  - `setGlobalProgress`
  - `setScrollProgress`
  - `setNarrativeProgress`

### Files
- `src/state/atoms/narrativeAtom.js`

### Impact
- Legacy hidden callers break in dev, which surfaces drift immediately.

### Advantage
- Hard single authority: only `stageAtom` derives and writes stage/progress.

### Safe rollout
- Release A:
  - DEV: throw error with stack and replacement API guidance.
  - PROD: no-op + one-time warning.
- Release B:
  - Delete methods after callsite cleanup.

### Gates
```bash
rg -n "narrativeAtom\\.(jumpToStage|setStage|setGlobalProgress|setScrollProgress|setNarrativeProgress)" src
rg -n "setGlobalProgress|setScrollProgress|setStage\\(" src/state src/theater src/components
```

## Patch 4: Remove Secondary Scroll Binder (Form Camera Listener)
### What to change
- Remove local `window.addEventListener('scroll', ...)` listener used by form camera.
- Subscribe form camera state to canonical `SCROLL_PROGRESS` stream or `stageAtom.globalProgress`.

### Files
- `src/components/consciousness/ConsciousnessTheater.jsx`
- Canonical producer remains:
  - `src/theater/ScrollOrchestrator.js`

### Impact
- Form camera input source changes from raw window scroll to canonical stream.

### Advantage
- Exactly one scroll binder in the app.
- Removes duplicate handler risk and authority drift risk.

### Safe rollout
- Add A/B dev flag for one release if parity check is needed.
- Validate parity at deterministic scroll checkpoints (0%, 50%, 95%).
- Remove legacy listener after parity confirmation.

### Gates
```bash
rg -n "addEventListener\\('scroll'" src
rg -n "EVENTS\\.SCROLL_PROGRESS" src/components/consciousness src/theater src/state
```

## Universal Verification Gates (Run After Every Patch)
```bash
PLAYWRIGHT_HTML_OPEN=never npm run test:visual
npx vite build
```

## Definition of Done Per Patch
1. Required grep gates pass.
2. Visual suite passes.
3. Build passes.
4. `audit_landing_slice_determinism_postfix.html` updated with:
   - raw grep outputs
   - what changed
   - invariant pass/fail
   - residual drift items

## Recommended Dev Bridge Policy
- Keep a single dev bridge namespace only: `window.__MC_DEV__`.
- Allow writes only in dev.
- Keep production bridge read-only or absent.

# Agent, Sentinel & Vision — Reference

## Opening Sentinel (fast rule gate)
**Path:** `scripts/verify-opening.mjs`  
**Run:** `npm run validate:opening`  
**Purpose:** Quick, deterministic checks for the opening “fencepost” invariants.

**Checks**
- **OpeningSequence**: single bus import, overlay-only (no Three.js), **no CTF**.
- **Engine**: opening **gate** in `buildAndEmitBlueprint`; emergence `BLUEPRINT_READY` has `mode:"emergence"`; **random→random** cloud (no spiral).
- **Renderer**: emits `PARTICLES_EMERGED` **once**; advisory Stage-0 green lock; advisory **FOV tweak** warning.
- **Theater**: waits for `ENGINE_VIEWPORT_HINT` before starting Director.

## Agent — goal: `opening:fencepost`
**Entry:** `scripts/agent/runner.mjs`  
**Goal:** `scripts/agent/goals/fencepost.mjs`  
**Detectors:** `scripts/agent/detectors/opening.mjs`  
**Patchers:** `scripts/agent/patchers/opening.mjs`  
**Run:**  
- Report: `npm run agent:run -- --goal=opening:fencepost`  
- Auto-apply: `npm run agent:run -- --goal=opening:fencepost --apply`

**Does**
- Detects same invariants as Sentinel.  
- On `--apply`: injects Engine opening gate, adds `mode:"emergence"`, swaps spiral for **random→random** (adds tiny `pickDisc()` if needed).

## Renderer behavioral fix
**File:** `src/components/webgl/WebGLBackground.jsx`  
- Viewport hint from **projection matrix** (no `camera.fov`).  
- `uPointSize` set **once** on mount (DPR-aware).

## Vision Contract v1 (visual taste → checks)
**Path:** `vision/vision-contract.v1.json`  
Defines terminal mono style, timeline ranges (chaos/coalesce/settle/min fill), emergence radii/`zRange`, chaos spin ranges, and UX flags (`noInitialFillFlash`, `deferFadeUntilMinFill`).

## Vision Sentinel
**Path:** `scripts/verify-vision.mjs`  
**Run:** `npm run validate:vision`  
Validates latest telemetry in `.vision/telemetry/` against Vision v1.

## Agent — vision goals
- **`agent:record`** → prints DevTools snippet to collect telemetry; can ingest a JSON with `--from`.  
- **`agent:visuals`** → reads telemetry + Vision v1 and prints **knob suggestions**:
  - Director: `CHAOS_MS / COALESCE_MS / SETTLE_MS`
  - Engine: `gasRadiusFactor / expandedRadiusFactor / zRange`
  - Renderer chaos: `zPerSec / yPerSec`

## Commands
```bash
npm run validate
npm run validate:opening
npm run agent:run -- --goal=opening:fencepost
npm run agent:run -- --goal=opening:fencepost --apply

npm run agent:record
npm run validate:vision
npm run agent:visuals
```

## Fencepost order (expected)
```
ENGINE_VIEWPORT_HINT → PARTICLES_START_EMERGING
→ BLUEPRINT_READY {mode:'emergence', stage:'genesis'}
→ BLUEPRINT_READY {stage:'genesis'} full
→ PARTICLES_EMERGED → STAGE_CHANGE 'genesis'
→ settle morph 0→1 → ENABLE_SCROLL
```

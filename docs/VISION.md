# Vision Contract v1 — Guide

## Purpose
Encode your opening **feel** as a machine-checkable contract, then measure it with telemetry so the tools can nudge your **three knobs** without code churn.

## Files
- Contract: `vision/vision-contract.v1.json`
- Telemetry (latest): `.vision/telemetry/*.json`
- Sentinel: `scripts/verify-vision.mjs`
- Agent goals:  
  - `scripts/agent/goals/record.mjs` (collect/ingest telemetry)  
  - `scripts/agent/goals/visuals.mjs` (print suggestions)

## Contract keys (opening)
- **terminal**: `fontStack`, `colorHex`, `allowGlow:false`
- **timeline**: `chaosMs`, `coalesceMs`, `settleMs`, `minFillVisibleMs`
- **emergenceCloud**: `gasRadiusFactor`, `expandedRadiusFactor`, `zRange`
- **chaosSpin**: `zPerSec`, `yPerSec`
- **UX**: `noInitialFillFlash`, `deferFadeUntilMinFill`

## Telemetry (what to capture)
- Times: `tFillStart`, `tFadeOutStart`, optional `tTypingStart/End`, chaos/coalesce/settle.  
- `fillLinesAtStart` (proves “no flash”).  
- Optional `spin.{zPerSec,yPerSec}` during chaos, `cloud` radii/`zRange`.

## Workflow
1. **Record telemetry**
   ```bash
   npm run agent:record
   ```
   Paste the DevTools snippet, play the opening, run `__visionDump()`, then:
   ```bash
   npm run agent:record -- --from=/path/to/download.json
   ```

2. **Validate against contract**
   ```bash
   npm run validate:vision
   ```

3. **Get knob suggestions**
   ```bash
   npm run agent:visuals
   ```
   You’ll see exact values to set for:
   - Director: `CHAOS_MS / COALESCE_MS / SETTLE_MS`
   - Engine: `gasRadiusFactor / expandedRadiusFactor / zRange`
   - Renderer chaos: `zPerSec / yPerSec`

## Three knobs (where to edit)
- **Director:** `src/theater/TheaterDirector.js` → `CHAOS_MS/COALESCE_MS/SETTLE_MS`
- **Engine:** `src/engine/ConsciousnessEngine.js` → emergence radii + `zRange`
- **Renderer:** `src/components/webgl/WebGLBackground.jsx` → chaos rotation multipliers

## Tips
- Keep renderer off `camera.fov`; emit viewport via projection matrix; set `uPointSize` **once**.
- TEXT_FIRST warnings about `brainRegion` are benign.

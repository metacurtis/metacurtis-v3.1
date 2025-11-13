# MetaCurtis Single-Writer Ownership Map v2.0
_Pattern S – Phase 2 snapshot_

This file is machine-readable. Scanners treat it as the source of truth.

---

## GPU Uniforms
[uniforms]
uActiveCount = src/components/webgl/WebGLBackground.jsx
uAtlasTexture = src/components/webgl/WebGLBackground.jsx
uBandFade = src/components/webgl/WebGLBackground.jsx
uBandHeight = src/components/webgl/WebGLBackground.jsx
uBrainRegion = src/components/webgl/WebGLBackground.jsx
uColorAccent1 = src/components/webgl/WebGLBackground.jsx
uColorAccent2 = src/components/webgl/WebGLBackground.jsx
uColorCurrent = src/components/webgl/WebGLBackground.jsx
uColorNext = src/components/webgl/WebGLBackground.jsx
uDevicePixelRatio = src/components/webgl/WebGLBackground.jsx
uMorph = src/components/webgl/WebGLBackground.jsx
uMorphProgress = src/components/webgl/WebGLBackground.jsx
uPalette0 = src/components/webgl/WebGLBackground.jsx
uPalette1 = src/components/webgl/WebGLBackground.jsx
uPalette2 = src/components/webgl/WebGLBackground.jsx
uPalette3 = src/components/webgl/WebGLBackground.jsx
uPointSize = ⚠️ multiple: src/components/webgl/WebGLBackground.jsx, src/runtime/materialFactory.js
uPostMorphFreeze = src/components/webgl/WebGLBackground.jsx
uScrollProgress = src/components/webgl/WebGLBackground.jsx
uStageBlend = src/components/webgl/WebGLBackground.jsx
uStageIndex = src/components/webgl/WebGLBackground.jsx
uStageProgress = src/components/webgl/WebGLBackground.jsx
uTierCutoff = src/components/webgl/WebGLBackground.jsx
uTierHighlight = src/components/webgl/WebGLBackground.jsx
uTierMode = src/components/webgl/WebGLBackground.jsx
uTierParams0 = src/components/webgl/WebGLBackground.jsx
uTierParams1 = src/components/webgl/WebGLBackground.jsx
uTierParams2 = src/components/webgl/WebGLBackground.jsx
uTierParams3 = src/components/webgl/WebGLBackground.jsx
uTime = src/components/webgl/WebGLBackground.jsx

### Rules
- Owners are the only files allowed to assign `.value` on these uniforms.
- Non-owners must emit `RENDER_DIRECTIVE` and let the renderer apply values.
- Use `// OWNERSHIP_OVERRIDE: reason` on the violating line only for emergency bypasses.

### Escape hatches
- Tests are auto-excluded (`*.test.*`, `*.spec.*`, `__tests__/**`).
- Inline override: `// OWNERSHIP_OVERRIDE: reason`.

---

## Geometry & Buffer Operations
[geometry]
bind = src/components/webgl/WebGLBackground.jsx

### Includes
- `setDrawRange`, `setAttribute`, `bindBuffer`, `new THREE.BufferGeometry`, `new THREE.InstancedBufferGeometry`.

---

## Event Emitters
[events]
AUDIO_COMPUTER_HUM.emitter = src/theater/TheaterDirector.js
BLUEPRINT_INVALIDATED.emitter = canon-console/runtime/blueprint-guard-v2.js
BLUEPRINT_READY.emitter = src/engine/utils/blueprintUtils.js
BUILD_EMERGENCE_BLUEPRINT.emitter = ⚠️ multiple: src/state/commands/StateCommands.js, src/theater/TheaterDirector.js
CANON_VIOLATION.emitter = ⚠️ multiple: canon-console/browser/inject.js, canon-console/runtime/blueprint-guard-v2.js
CLIMAX_STEP.emitter = src/engine/ConsciousnessEngine.js
CURSOR_BLINK.emitter = src/theater/TheaterDirector.js
CURSOR_SHOW.emitter = src/theater/TheaterDirector.js
DIRECTOR_CANCEL.emitter = src/theater/TheaterDirector.js
DIRECTOR_ERROR.emitter = src/theater/TheaterDirector.js
DIRECTOR_OPENING_MODE.emitter = src/theater/TheaterDirector.js
DIRECTOR:MORPH_STATE.emitter = src/theater/TheaterDirector.js
ENABLE_SCROLL.emitter = src/theater/TheaterDirector.js
ENGINE_VIEWPORT_HINT.emitter = ⚠️ multiple: src/components/consciousness/ConsciousnessTheater.jsx, src/components/webgl/WebGLBackground.jsx, src/theater/TheaterDirector.js
ENGINE:MORPH_STATE.emitter = src/engine/ConsciousnessEngine.js
FENCEPOST_LISTENERS_READY.emitter = ⚠️ multiple: src/components/webgl/WebGLBackground.jsx, src/theater/TheaterDirector.js
FENCEPOST_REPORT.emitter = canon-console/runtime/playbooks-extra.js
MORPH_PROGRESS.emitter = ⚠️ multiple: src/components/webgl/WebGLBackground.jsx, src/theater/controllers/MorphAnimationController.js
NARRATION_CLEANUP.emitter = src/components/narrative/NarrationController.jsx
NARRATION_STOPPED.emitter = src/components/narrative/NarrationController.jsx
NARRATIVE_LINE.emitter = src/components/narrative/NarrationController.jsx
OPENING_COMPLETE.emitter = src/theater/TheaterDirector.js
PARTICLE_CLICK_HIT.emitter = src/components/webgl/WebGLBackground.jsx
PARTICLE_CLICK_REQUEST.emitter = src/components/webgl/WebGLCanvas.jsx
PARTICLE_PHASE.emitter = src/theater/TheaterDirector.js
PARTICLES_EMERGED.emitter = ⚠️ multiple: src/components/webgl/WebGLBackground.jsx, src/theater/TheaterDirector.js
PARTICLES_START_EMERGING.emitter = src/theater/TheaterDirector.js
PREWARM_COMPLETE.emitter = src/engine/ConsciousnessEngine.js
PREWARM_GENESIS_BLUEPRINT.emitter = src/theater/TheaterDirector.js
QUALITY_CHANGE.emitter = ⚠️ multiple: src/state/atoms/qualityAtom.js, src/state/commands/StateCommands.js
RENDER_DIRECTIVE.emitter = ⚠️ multiple: canon-console/runtime/hud.js, src/components/narrative/NarrationController.jsx, src/theater/ScrollOrchestrator.js, src/theater/TheaterDirector.js
RENDERER_TUNE.emitter = src/theater/TheaterDirector.js
SCREEN_FILL.emitter = src/theater/TheaterDirector.js
SCROLL_PROGRESS.emitter = src/theater/ScrollOrchestrator.js
STAGE_CHANGE.emitter = ⚠️ multiple: src/state/commands/StateCommands.js, src/theater/ScrollOrchestrator.js, src/theater/TheaterDirector.js
START_CLIMAX.emitter = src/components/fragments/ClimaxSequenceController.jsx
START_NARRATIVE.emitter = ⚠️ multiple: src/components/narrative/NarrationController.jsx, src/orchestration/navigation/narrativeNavigation.js, src/theater/TheaterDirector.js
TERMINAL_TYPE.emitter = src/theater/TheaterDirector.js

### Rules
- Events listed here must be emitted by the owner only.
- Other modules should listen/react, not emit duplicates.

---

## Escape Hatches
- Inline override: `// OWNERSHIP_OVERRIDE: <reason>` (document follow-up task).
- Environment bypass: `SKIP_OWNERSHIP_CHECK=1` for emergency commits (document and fix within 48h).

---

## Known Violations
None. (Auto-generated)

---

Last updated: 2025-11-13 via `tools/generate-ownership.mjs`

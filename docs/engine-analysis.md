# ConsciousnessEngine.js Analysis

## File Stats
- Lines: 1500
- Size: 56KB
- Class: `ConsciousnessEngine` (line 182)

## Public API (methods called from outside)
Methods that MUST stay in core:

1. `constructor()` – line 187; registers the browser singleton, exposes `window.engineDebug`, and instantiates the blueprint, morph, and climax controllers.
2. `init()` – line 308; idempotent bootstrap that schedules font loading and hooks BeatBus listeners.
3. `buildEmergenceBlueprint(options)` – line 722; async emergence builder triggered by the `BUILD_EMERGENCE_BLUEPRINT` listener.
4. `buildAndEmitBlueprint(stage, quality)` – line 860; central stage/quality dispatcher that emits `BLUEPRINT_READY` payloads.
5. `buildBlueprint(stageName, options)` – line 995; caching-aware builder that delegates stage construction to `BlueprintGenerator`.
6. `generateViewportSpread(N, hint)` – line 1044; exposes deterministic viewport scatter (used by diagnostics and emergence fallbacks).
7. `generateConstellationFormation(N, tierRatios, hint, opts)` – line 1089; preserved API that now delegates to `BlueprintGenerator`.
8. `getParticleCountForQuality(baseCount, quality)` – line 1121; shared with `BlueprintGenerator` to derive particle counts.
9. `loadFont(url)` – line 1126; public font loader consumed through `window.__consciousnessEngine`.
10. `isEmergenceActive()` – line 1384; convenience helper that proxies `MorphController.isActive()`.
11. `getEmergencePhase()` – line 1391; exposes the current morph phase (`implosion`, `coalesce`, `settle`).
12. `generate3DTextFormation(word, opts)` – line 1398; cached 3D text generator used by blueprint code and dev tooling.
13. `getStats()` – line 1453; exposed via `window.engineDebug.getStats()`.
14. `clearCache()` – line 1462; clears blueprint/text caches, surfaced on `window.engineDebug`.
15. `destroy()` – line 1470; HMR teardown that now stops both Morph and Climax controllers.

## Internal Methods (can be extracted)
Methods only called within this file:

1. `_preloadNextStage(stage, quality)` – line 254; opportunistic cache warmer for the next canonical stage.
2. `_installListeners()` – line 326; BeatBus subscription manager with optional guard and HMR cleanup.
3. `_onBuildEmergence(payload)` – line 512; validates emergence requests and drives `buildEmergenceBlueprint`.
4. `_startEmergenceTimeline(bp)` – line 575; thin delegate that forwards to `MorphController.startEmergenceTimeline`.
5. `_handleStartClimax()` – line 749; lightweight delegate that forwards `START_CLIMAX` events to `ClimaxController`.
6. `_createEmptyBlueprint(count, options)` – line 599; shared allocator for emergence blueprints.
7. `_generateRandomAtmosphericScatter(count, viewportHint, opts)` – line 651; synthesizes atmospheric fields per emergence.
8. `_assignTiersShuffled(count, ratios)` – line 691; wrapper around the shared tier shuffler used by emergence builds.
9. `_buildBlueprintForStage(stageName, requestedQuality, options)` – line 980; thin delegation wrapper around `modules/BlueprintGenerator.buildStage`.
10. `_generateViewportSpread(N, hint)` – line 1044; deterministic viewport scatter helper for diagnostics and emergence fallbacks.

## Heavy Sections (extraction candidates)
1. Emergence builder (`buildEmergenceBlueprint`): lines 722–980 handle blueprint allocation, targets, and metadata logging.
2. Morph timeline orchestration now lives in `src/engine/modules/MorphController.js` (lines 30–288); the engine simply delegates via `_startEmergenceTimeline`.
3. Stage transitions & cache coordination (`_onStageChange`, `_onQualityChange`, `buildAndEmitBlueprint`): lines 421–1089 manage stage swap logic and cache invalidation.
4. Climax sequencing remains isolated in `src/engine/modules/ClimaxController.js` (lines 1–600); the engine delegates via `_handleStartClimax`.
5. Stage blueprint generation continues to reside in `src/engine/modules/BlueprintGenerator.js` (lines 27–294); the engine orchestrates cache usage and event emission around it.

## Imports Used
- `FontLoader` from `three/examples/jsm/loaders/FontLoader`.
- `Mesh`, `Vector3` from `three`.
- `TextGeometry` from `three/examples/jsm/geometries/TextGeometry`.
- `MeshSurfaceSampler` from `three/examples/jsm/math/MeshSurfaceSampler.js`.
- `VC` from `@/config/visual-controls.js`.
- `Canonical` from `@/config/canonical/canonicalAuthority.js`.
- `SST` from `@/config/sst-loader.js`.
- `createSeededRandom` from `../utils/random.js`.
- `ClimaxController` from `./modules/ClimaxController.js`.
- `MorphController` from `./modules/MorphController.js`.
- `BlueprintGenerator` from `./modules/BlueprintGenerator.js`.
- `BeatBus` from `@/theater/bus`.
- `EVENTS` from `@/theater/events.js`.
- `trace` from `@/dev/trace.js`.
- `calculateBounds`, `gaussianRandom`, `createBlueprintStructure`, `assignTiersShuffled`, `emitBlueprintReady`, `makeBandFrame` from `./utils/blueprintUtils.js`.

## Events Emitted (API contract)
- `EVENTS.PREWARM_COMPLETE` – line 472 (`_onPrewarmGenesis` completion notice).
- `EVENTS.BLUEPRINT_READY` – lines 537 / 919 / 945 / 969 (emergence responses and stage rebuild payloads) via `emitBlueprintReady`.
- `EVENTS.MORPH_PROGRESS` (emergence) – `src/engine/modules/MorphController.js:273`.
- `EVENTS.CLIMAX_STEP` – `src/engine/modules/ClimaxController.js:205` (step start) and `:587` (sequence completion).
- `EVENTS.MORPH_PROGRESS` (climax) – `src/engine/modules/ClimaxController.js:249`.
- `EVENTS.BLUEPRINT_READY` (climax) – `src/engine/modules/ClimaxController.js:452`.

## Events Listened To (API dependencies)
- `ENGINE_VIEWPORT_HINT` → `_onViewportHint` (line 387).
- `ENABLE_SCROLL` → `_onEnableScroll` (line 415).
- `STAGE_CHANGE` → `_onStageChange` (line 421).
- `QUALITY_CHANGE` → `_onQualityChange` (line 447).
- `PREWARM_GENESIS_BLUEPRINT` → `_onPrewarmGenesis` (line 457).
- `BUILD_EMERGENCE_BLUEPRINT` → `_onBuildEmergence` (line 508).
- `START_CLIMAX` → `_handleStartClimax` (line 749).
- `PARTICLES_EMERGED` → inline fencepost reset (line 353 listener lambda).
- `BLUEPRINT_INVALIDATED` → `_onBlueprintInvalidated` (line 472, optional).

## Duplication Highlights
- Stage blueprint and constellation logic are now single-sourced inside `modules/BlueprintGenerator.js`; the engine simply delegates.
- Repeated `emitBlueprintReady` payload construction (`src/engine/ConsciousnessEngine.js:537`, `src/engine/ConsciousnessEngine.js:919`, `src/engine/ConsciousnessEngine.js:945`, `src/engine/ConsciousnessEngine.js:969`) varies only slightly; consider a dedicated helper to avoid mismatched metadata.
- Climax scatter/text fallback code in `src/engine/modules/ClimaxController.js:334`–`452` mirrors emergence scatter utilities; centralising palette/random helpers could keep behaviour aligned across controllers.

## External Callers (Who Uses ConsciousnessEngine?)
1. `src/theater/TheaterDirector.js:909` – emits `BUILD_EMERGENCE_BLUEPRINT` for chaos prebind; `src/theater/TheaterDirector.js:1535` pushes `ENGINE_VIEWPORT_HINT` during director startup.
2. `src/state/commands/StateCommands.js:253` – programmatic emergence trigger that enforces BeatBus contracts.
3. `src/theater/ScrollOrchestrator.js:324` – emits `SCROLL_PROGRESS` and `STAGE_CHANGE` events that the engine listens for stage transitions.
4. `src/components/webgl/WebGLBackground.jsx:671` – calculates camera-derived viewport hints and emits `ENGINE_VIEWPORT_HINT`.
5. `src/components/consciousness/ConsciousnessTheater.jsx:230` – synthesizes a viewport hint if none arrive, ensuring engine bootstrap.
6. `src/components/fragments/ClimaxSequenceController.jsx:49` – arms climax mode and emits `START_CLIMAX`.
7. `src/App.jsx:16` – imports the engine module for singleton instantiation on app boot.

## Critical API (Must Preserve)
- `BUILD_EMERGENCE_BLUEPRINT` must yield a `BLUEPRINT_READY` payload with compatible metadata and respect `skipMorphAnimation` / `fastForward`.
- `STAGE_CHANGE` / `QUALITY_CHANGE` must continue to call `buildAndEmitBlueprint` so renderers receive `BLUEPRINT_READY` updates.
- `ENGINE_VIEWPORT_HINT` updates must keep `_onViewportHint` semantics to ensure viewport fit math remains stable.
- `START_CLIMAX` needs to continue driving `_handleStartClimax` so downstream listeners receive `CLIMAX_STEP` and associated `MORPH_PROGRESS`.
- `window.engineDebug` surface (`getStats`, `clearCache`, `loadFont`) is relied on by playbooks and diagnostic tooling; signatures should remain intact.

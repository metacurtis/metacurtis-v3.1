# ConsciousnessEngine.js Analysis

## File Stats
- Lines: 1643
- Size: 56KB
- Class: `ConsciousnessEngine` (line 185)

## Public API (methods called from outside)
Methods that MUST stay in core:

1. `constructor()` – line 185; registers the browser singleton, exposes `window.engineDebug`, primes caches, and instantiates the blueprint/climax modules.
2. `init()` – line 305; idempotent bootstrap that schedules font loading and hooks BeatBus listeners.
3. `buildEmergenceBlueprint(options)` – line 883; async emergence builder triggered by the `BUILD_EMERGENCE_BLUEPRINT` listener.
4. `buildAndEmitBlueprint(stage, quality)` – line 1021; central stage/quality dispatcher that emits `BLUEPRINT_READY` payloads.
5. `buildBlueprint(stageName, options)` – line 1156; caching-aware builder that delegates stage construction to `BlueprintGenerator`.
6. `generateViewportSpread(N, hint)` – line 1205; exposes deterministic viewport scatter (used by diagnostics and emergence fallbacks).
7. `generateConstellationFormation(N, tierRatios, hint, opts)` – line 1250; preserved API that now delegates to `BlueprintGenerator`.
8. `getParticleCountForQuality(baseCount, quality)` – line 1282; shared with `BlueprintGenerator` to derive particle counts.
9. `loadFont(url)` – line 1287; public font loader consumed through `window.__consciousnessEngine`.
10. `generate3DTextFormation(word, opts)` – line 1545; cached 3D text generator used by blueprint code and dev tooling.
11. `getStats()` – line 1600; exposed via `window.engineDebug.getStats()`.
12. `clearCache()` – line 1609; clears blueprint/text caches, surfaced on `window.engineDebug`.
13. `destroy()` – line 1617; HMR teardown that now also stops the `ClimaxController`.

## Internal Methods (can be extracted)
Methods only called within this file:

1. `_preloadNextStage(stage, quality)` – line 254; opportunistic cache warmer for the next canonical stage.
2. `_installListeners()` – line 326; BeatBus subscription manager with optional guard and HMR cleanup.
3. `_onBuildEmergence(payload)` – line 508; validates emergence requests and drives `buildEmergenceBlueprint`.
4. `_startEmergenceTimeline(bp)` – line 571; morph timeline orchestrator for implosion → settle phases.
5. `_handleStartClimax()` – line 749; lightweight delegate that forwards `START_CLIMAX` events to `ClimaxController`.
6. `_createEmptyBlueprint(count, options)` – line 760; shared allocator for emergence blueprints.
7. `_generateRandomAtmosphericScatter(count, viewportHint, opts)` – line 812; synthesizes atmospheric fields per emergence.
8. `_assignTiersShuffled(count, ratios)` – line 852; wrapper around the shared tier shuffler used by emergence builds.
9. `_buildBlueprintForStage(stageName, requestedQuality, options)` – line 1141; thin delegation wrapper around `modules/BlueprintGenerator.buildStage`.
10. `_generateViewportSpread(N, hint)` – line 1205; deterministic viewport scatter helper for diagnostics and emergence fallbacks.

## Heavy Sections (extraction candidates)
1. Emergence builder (`buildEmergenceBlueprint`): lines 883–1140 handle blueprint allocation, targets, and metadata logging.
2. Morph controller (`_onBuildEmergence` + `_startEmergenceTimeline`): lines 508–676 run the implosion/settle RAF loop and BeatBus progress emits.
3. Stage transitions & cache coordination (`_onStageChange`, `_onQualityChange`, `buildAndEmitBlueprint`): lines 421–1140 manage stage swap logic and cache invalidation.
4. Climax sequencing is now handled entirely in `src/engine/modules/ClimaxController.js` (lines 1–599); the engine simply delegates.
5. Stage blueprint generation remains in `src/engine/modules/BlueprintGenerator.js` (lines 27–294); the engine orchestrates cache usage and event emission around it.

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
- `BlueprintGenerator` from `./modules/BlueprintGenerator.js`.
- `BeatBus` from `@/theater/bus`.
- `EVENTS` from `@/theater/events.js`.
- `trace` from `@/dev/trace.js`.
- `calculateBounds`, `gaussianRandom`, `createBlueprintStructure`, `assignTiersShuffled`, `emitBlueprintReady`, `makeBandFrame` from `./utils/blueprintUtils.js`.

## Events Emitted (API contract)
- `EVENTS.PREWARM_COMPLETE` – line 468 (`_onPrewarmGenesis` completion notice).
- `EVENTS.MORPH_PROGRESS` – line 661 (emergence timeline heartbeat).
- `EVENTS.BLUEPRINT_READY` – lines 533 / 1080 / 1106 / 1130 (emergence responses and stage rebuild payloads) via `emitBlueprintReady`.
- `EVENTS.CLIMAX_STEP` – emitted inside `src/engine/modules/ClimaxController.js:205` (step start) and `:587` (sequence completion).
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
- Repeated `emitBlueprintReady` payload construction (lines 533, 1080, 1106, 1130) varies only slightly; consider a dedicated helper to avoid mismatched metadata.
- Climax scatter/text fallback code in `modules/ClimaxController.js` (lines 334–470) mirrors emergence scatter utilities; centralising palette/random helpers could keep behaviour aligned.

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

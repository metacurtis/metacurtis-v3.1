# ConsciousnessEngine.js Analysis

## File Stats
- Lines: 2221
- Size: 76KB
- Class: `ConsciousnessEngine` (line 204)

## Public API (methods called from outside)
Methods that MUST stay in core:

1. `constructor()` – line 207; registers the browser singleton, exposes `window.engineDebug`, primes caches, and instantiates `BlueprintGenerator`.
2. `init()` – line 346; idempotent bootstrap that schedules font loading and hooks BeatBus listeners.
3. `buildEmergenceBlueprint(options)` – line 1447; async emergence builder triggered by the `BUILD_EMERGENCE_BLUEPRINT` listener.
4. `buildAndEmitBlueprint(stage, quality)` – line 1585; central stage/quality dispatcher that emits `BLUEPRINT_READY` payloads.
5. `buildBlueprint(stageName, options)` – line 1720; caching-aware builder that now delegates stage construction to `BlueprintGenerator`.
6. `generateViewportSpread(N, hint)` – line 1769; exposes deterministic viewport scatter (used by diagnostics and emergence fallbacks).
7. `generateConstellationFormation(N, tierRatios, hint, opts)` – line 1814; preserved API that now delegates to `BlueprintGenerator`.
8. `getParticleCountForQuality(baseCount, quality)` – line 2006; shared with `BlueprintGenerator` to derive particle counts.
9. `loadFont(url)` – line 2011; public font loader consumed through `window.__consciousnessEngine`.
10. `generate3DTextFormation(word, opts)` – line 2109; cached 3D text generator used by blueprint code and dev tooling.
11. `getStats()` – line 2164; exposed via `window.engineDebug.getStats()`.
12. `clearCache()` – line 2173; clears blueprint/text caches, surfaced on `window.engineDebug`.
13. `destroy()` – line 2181; HMR teardown that stops RAFs, removes listeners, and resets caches.

## Internal Methods (can be extracted)
Methods only called within this file:

1. `_preloadNextStage(stage, quality)` – line 295; opportunistic cache warmer for the next canonical stage.
2. `_installListeners()` – line 367; BeatBus subscription manager with optional guard and HMR cleanup.
3. `_onBuildEmergence(payload)` – line 549; validates emergence requests and drives `buildEmergenceBlueprint`.
4. `_startEmergenceTimeline(bp)` – line 612; morph timeline orchestrator for implosion → settle phases.
5. `_handleStartClimax()` – line 790; primes climax sequencing state machine and begins RAF loop.
6. `_buildClimaxBlueprint(step)` – line 1034; constructs climax step payloads, including hotspot metadata.
7. `_buildClimaxBlueprintFromPositions(step, positions, count)` – line 1163; rehydrates curated climax assets.
8. `_generateClimaxTextPositions(text, particleCount)` – line 1309; fallback text particle generator for climax steps.
9. `_generateRandomAtmosphericScatter(count, viewportHint, opts)` – line 1376; synthesizes atmospheric fields per emergence.
10. `_buildBlueprintForStage(stageName, requestedQuality, options)` – line 1705; now a thin delegation wrapper around `modules/BlueprintGenerator.buildStage`.

## Heavy Sections (extraction candidates)
1. Emergence builder (`buildEmergenceBlueprint`): lines 1447–1703 handle blueprint allocation, targets, and metadata logging.
2. Morph controller (`_onBuildEmergence` + `_startEmergenceTimeline`): lines 549–773 run the implosion/settle RAF loop and BeatBus progress emits.
3. Stage transitions & cache coordination (`_onStageChange`, `_onQualityChange`, `buildAndEmitBlueprint`): lines 476–1703 manage stage swap logic.
4. Portrait/QR assets & climax sequencing (`_handleStartClimax` → `_finalizeClimaxSequence`): lines 790–1356 load curated data and drive climax steps.
5. Delegated stage construction now lives in `src/engine/modules/BlueprintGenerator.js` (lines 27–294); `ConsciousnessEngine` orchestrates cache, font readiness, and event emission around it.

## Imports Used
- `FontLoader` from `three/examples/jsm/loaders/FontLoader`.
- `Mesh`, `Vector3` from `three`.
- `TextGeometry` from `three/examples/jsm/geometries/TextGeometry`.
- `MeshSurfaceSampler` from `three/examples/jsm/math/MeshSurfaceSampler.js`.
- `Canonical` from `@/config/canonical/canonicalAuthority.js`.
- `SST` from `@/config/sst-loader.js`.
- `createSeededRandom` from `../utils/random.js`.
- `generatePortraitPositions`, `generateQRPositions`, `generateScatterPositions` from `@/utils/portraitPositions.js`.
- `BlueprintGenerator` from `./modules/BlueprintGenerator.js`.
- `BeatBus` from `@/theater/bus`.
- `EVENTS` from `@/theater/events.js`.
- `trace` from `@/dev/trace.js`.
- `qrCurtis` from `@/assets/climax/qr-curtis.json`.
- `calculateBounds`, `gaussianRandom`, `createBlueprintStructure`, `assignTiersShuffled`, `emitBlueprintReady`, `makeBandFrame` from `./utils/blueprintUtils.js`.

## Events Emitted (API contract)
- `EVENTS.PREWARM_COMPLETE` – line 509 (`_onPrewarmGenesis` completion notice).
- `EVENTS.MORPH_PROGRESS` – line 702 (emergence timeline) and line 960 (climax RAF updates).
- `EVENTS.CLIMAX_STEP` – line 917 (step start) and line 1288 (sequence completion signal).
- `EVENTS.BLUEPRINT_READY` – lines 574 (emergence), 1159 (climax step payload), 1644 / 1670 / 1694 (stage rebuild paths) via `emitBlueprintReady`.

## Events Listened To (API dependencies)
- `ENGINE_VIEWPORT_HINT` → `_onViewportHint` (line 428).
- `ENABLE_SCROLL` → `_onEnableScroll` (line 456).
- `STAGE_CHANGE` → `_onStageChange` (line 462).
- `QUALITY_CHANGE` → `_onQualityChange` (line 488).
- `PREWARM_GENESIS_BLUEPRINT` → `_onPrewarmGenesis` (line 498).
- `BUILD_EMERGENCE_BLUEPRINT` → `_onBuildEmergence` (line 549).
- `START_CLIMAX` → `_handleStartClimax` (line 790).
- `PARTICLES_EMERGED` → inline fencepost reset (line 394 listener lambda).
- `BLUEPRINT_INVALIDATED` → `_onBlueprintInvalidated` (line 513, optional).

## Duplication Highlights
- Stage blueprint and constellation logic now live solely in `BlueprintGenerator`; `ConsciousnessEngine` delegates instead of duplicating implementation.
- Repeated `emitBlueprintReady` payload construction (lines 574, 1159, 1644, 1670, 1694) varies only slightly; consider a dedicated helper to avoid mismatched metadata.
- Scatter/QR fallbacks repeatedly call `generateScatterPositions` (lines 1061, 1105, 1113, 1118, 1213), suggesting a shared factory for deterministic fallbacks.
- Atmospheric scatter still shares gaussian helpers with `BlueprintGenerator` (lines 1376–1422); could be centralized in `blueprintUtils` to guarantee identical tuning.

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

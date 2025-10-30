# ConsciousnessEngine.js Analysis

## File Stats
- Lines: 2838
- Size: 96KB
- Class: `ConsciousnessEngine` (line 352)

## Public API (methods called from outside)
Methods that MUST stay in core:

1. `constructor()` – line 353; instantiates caches, exposes `window.engineDebug`, registers singleton.
2. `init()` – line 491; idempotent boot path used on first load and HMR re-entry (no separate `initialize()` exists).
3. `buildEmergenceBlueprint(options)` – line 1634; async handler behind `BUILD_EMERGENCE_BLUEPRINT`, drives emergence payloads.
4. `buildAndEmitBlueprint(stage, quality)` – line 1776; main stage/quality switcher that emits renderer-ready blueprints.
5. `buildBlueprint(stageName, options)` – line 2162; core builder used by caching/prewarm paths.
6. `loadFont(url)` – line 2468; public promise used by dev flows (`window.__consciousnessEngine.loadFont()`).
7. `generate3DTextFormation(word, opts)` – line 2726; exposed (non-underscored) generator consumed by multiple build pathways.
8. `getStats()` – line 2781; surfaced via `window.engineDebug.getStats()`.
9. `clearCache()` – line 2790; surfaced via `window.engineDebug.clearCache()` and used in docs/playbooks.
10. `destroy()` – line 2798; teardown invoked during HMR to stop RAFs, listeners, and caches.

## Internal Methods (can be extracted)
Methods only called within this file:

1. `_preloadNextStage(stage, quality)` – line 440; anticipatory cache fill for upcoming stages.
2. `_startEmergenceTimeline(blueprint)` – line 758; orchestrates implosion → settle morph RAF loop.
3. `_handleStartClimax()` – line 936; wires climax sequencing and begins step progression.
4. `_buildClimaxBlueprint(step)` – line 1180; assembles climax-specific point clouds and metadata.
5. `_generateClimaxTextPositions(text, particleCount)` – line 1456; fallback text particle generator for climax.
6. `_createEmptyBlueprint(count, options)` – line 1471; shared allocator for emergence blueprints.
7. `_generateRandomAtmosphericScatter(count, viewportHint, opts)` – line 1538; atmospheric field synthesis.
8. `_assignTiersShuffled(count, ratios)` – line 1585; tier distribution helper for emergence.
9. `_buildBlueprintForStage(stageName, requestedQuality, options)` – line 1899; stage-heavy builder feeding caches.
10. `generateViewportSpread(N, hint)` – line 2211; viewport scatter helper (currently only used internally).

## Heavy Sections (extraction candidates)
1. Blueprint generation (`buildAndEmitBlueprint` ➜ `_buildBlueprintForStage`): lines 1776–2182.
2. Morph/emergence controller (`_startEmergenceTimeline`, `buildEmergenceBlueprint`): lines 758–1760.
3. Climax sequencing (`_handleStartClimax` through `_finalizeClimaxSequence`): lines 936–1435.
4. Portrait & QR handling (climax step actions, curated assets): lines 963–1256.
5. Tier behaviors & constellation math (`generateConstellationFormation`): lines 2256–2407.

## Imports Used
- `FontLoader`, `TextGeometry`, `MeshSurfaceSampler`, `Mesh`, `Vector3` from `three` packages.
- `VC` from `@/config/visual-controls.js`.
- `Canonical` from `@/config/canonical/canonicalAuthority.js`.
- `SST` from `@/config/sst-loader.js`.
- `createSeededRandom` from `../utils/random.js`.
- Formation helpers from `@/utils/portraitPositions.js` (`generatePortraitPositions`, `generateQRPositions`, `generateScatterPositions`).
- `buildHotspotLookup` from `@/utils/hotspotMapping.js`.
- `BeatBus` from `@/theater/bus`.
- `EVENTS` from `@/theater/events.js`.
- `trace` from `@/dev/trace.js`.
- `qrCurtis` asset (`@/assets/climax/qr-curtis.json`).

## Events Emitted (API contract)
- `EVENTS.PREWARM_COMPLETE` – line 654 (`_onPrewarmGenesis`).
- `EVENTS.BLUEPRINT_READY` – lines 719 (emergence payload), 1306 (climax steps), 1835 / 1862 / 1887 (stage rebuild paths).
- `EVENTS.MORPH_PROGRESS` – lines 848 (emergence morph timeline) and 1106 (climax progress updates).
- `EVENTS.CLIMAX_STEP` – lines 1063 (step start) and 1435 (sequence completion).

## Events Listened To (API dependencies)
- `ENGINE_VIEWPORT_HINT` → `_onViewportHint` (line 532).
- `ENABLE_SCROLL` → `_onEnableScroll` (line 533).
- `STAGE_CHANGE` → `_onStageChange` (line 534).
- `QUALITY_CHANGE` → `_onQualityChange` (line 535).
- `PREWARM_GENESIS_BLUEPRINT` → `_onPrewarmGenesis` (line 536).
- `BUILD_EMERGENCE_BLUEPRINT` → `_onBuildEmergence` (line 537).
- `START_CLIMAX` → `_handleStartClimax` (line 538).
- `PARTICLES_EMERGED` → inline fencepost reset (lines 539–547).
- `BLUEPRINT_INVALIDATED` → `_onBlueprintInvalidated` (line 549, optional listener).

## Duplication Highlights
- Repeated AABB/min–max loops (lines 66–77, 146–155, 1713–1721, 2098–2108, 2364–2374) – candidate for shared `calcBounds()` helper.
- Gaussian random helpers defined multiple times (lines 1546–1553 and 2273–2320) – can consolidate into one utility.
- Blueprint emission payloads duplicated for each path (`BeatBus.emit(EVENTS.BLUEPRINT_READY)` at lines 719, 1835, 1862, 1887, 1306) – shared emitter would reduce drift.
- Float32Array allocation patterns repeated in `_createEmptyBlueprint` (lines 1471–1489) and `_buildBlueprintForStage` (1959–1976) – can centralize blueprint buffer factory.

## External Callers (Who Uses ConsciousnessEngine?)
1. `src/theater/TheaterDirector.js` – emits `BUILD_EMERGENCE_BLUEPRINT`, `ENGINE_VIEWPORT_HINT`, `STAGE_CHANGE`, `QUALITY_CHANGE`, `START_CLIMAX`, and waits on `BLUEPRINT_READY` / `PARTICLES_EMERGED`.
2. `src/state/commands/StateCommands.js` – enforces opening-phase contracts before emitting `BUILD_EMERGENCE_BLUEPRINT`, listens for `STAGE_CHANGE`/`QUALITY_CHANGE`.
3. `src/components/webgl/WebGLBackground.jsx` – emits `ENGINE_VIEWPORT_HINT`, `PARTICLES_EMERGED`, and consumes `BLUEPRINT_READY` payloads from the engine.
4. `src/components/consciousness/ConsciousnessTheater.jsx` – drives initial viewport hints and waits for `ENABLE_SCROLL`.
5. `src/components/fragments/ClimaxSequenceController.jsx` – triggers `START_CLIMAX` when UI enters climax mode.
6. `src/App.jsx` – imports `./engine/ConsciousnessEngine` for side-effect instantiation (HMR-safe singleton).

## Critical API (Must Preserve)
- BeatBus contract: `BUILD_EMERGENCE_BLUEPRINT` → engine must emit `EVENTS.BLUEPRINT_READY` (mode `emergence`) and respect `skipMorphAnimation` / `fastForward`.
- BeatBus contract: `STAGE_CHANGE` & `QUALITY_CHANGE` → engine rebuild via `buildAndEmitBlueprint`, emit `EVENTS.BLUEPRINT_READY` with cache metadata.
- Climax trigger: `START_CLIMAX` → engine drives `_handleStartClimax`, emitting `EVENTS.CLIMAX_STEP` and `EVENTS.MORPH_PROGRESS`.
- Dev tooling: `window.engineDebug.getStats()` / `clearCache()` signatures and payload shape.
- Font readiness: `loadFont(url)` promise resolves to Three.js font and triggers emergence rebuild when fallback was used.

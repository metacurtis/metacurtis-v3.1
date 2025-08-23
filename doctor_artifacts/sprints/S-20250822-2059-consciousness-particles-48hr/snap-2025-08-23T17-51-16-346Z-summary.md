# HOT-DORS Report
Generated: 2025-08-23T17:51:16.342Z

## Invariants
- Single BeatBus: FAIL 
  - src/canon/boundary.js
  - src/canon-guard/L2.js
  - src/components/consciousness/ConsciousnessTheater.jsx
  - src/components/theater/OpeningSequence.jsx
  - src/components/webgl/WebGLBackground.jsx
  - src/core/CentralEventClock.js
  - src/engine/ConsciousnessEngine.js
  - src/modules/orchestration/core/BeatBus.js
  - src/theater/TheaterDirector.js
  - modules/orchestration/core/BeatBus.js
  - modules/orchestration/core/EventCatalog.js
  - modules/orchestration/core/EventValidator.js
  - modules/state/bridges/AtomicToBeatBus.js
- StateCore-only: FAIL 
  - src/components/common/ErrorBoundary.jsx
  - src/components/ui/CanvasErrorBoundary.jsx
  - src/hooks/useAdaptiveQuality.js
- Single Morph Driver: FAIL 
  - src/canon/contracts/index.js
  - src/canon-guard/L1.js
  - src/components/consciousness/ConsciousnessTheater.jsx
  - src/components/webgl/WebGLBackground.jsx
  - src/hooks/atoms/useNarrativeStore.js
  - src/stores/atoms/narrativeAtom.js

## Performance
- Badge: GREEN
- FPS: 60.0
- Hotspots:
  - src/modules/orchestration/core/BeatBus.js (imported by 13)
  - src/stores/atoms/createAtom.js (imported by 10)
  - src/theater/events.js (imported by 9)

## True Orphans (48)
- src/__tests__/smoke.test.js
- src/bootstrap/wireSSTv3.js
- src/canon/console/L2.js
- src/canon/console/banner.js
- src/canon/doctor/base.js
- src/canon/guard/L1.js
- src/canon/guard/L2.js
- src/canon/init-amplified.js
- src/canon/init.js
- src/canon-guard/blueprintGuard.js
- src/canon-guard/runtime/GuardRuntimeInject.js
- src/components/common/ErrorBoundary.jsx
- src/components/ui/AdvancedContactPortal.jsx
- src/components/ui/CanvasErrorBoundary.jsx
- src/components/ui/Footer.jsx
- src/components/ui/Layout.jsx
- src/components/ui/NarrativeUIControls.jsx
- src/components/ui/ResourceMonitor.jsx
- src/components/ui/narrative/MemoryFragments.jsx
- src/components/ui/narrative/StageNavigation.jsx

## Drift (vs last report)
- Orphans: +0
- Duplicates: +0

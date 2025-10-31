  # Phase A2.3 State Audit Report

  ## Executive Summary
  - **Recommendation:** GO WITH CHANGES – proceed with StateCoordinator only if it layers on top of existing atoms instead of replacing them.
  - **Key Findings:**
    - `stageAtom` already operates as a comprehensive stage coordinator (batching, smoothing, auto-advance) and is tightly coupled to BeatBus via `StateCommands`.
    - Theater systems (`TheaterDirector`, `ScrollOrchestrator`, `OpeningSequenceController`) maintain parallel state (phase, running, stage, morph) creating six distinct sources of truth.
    - Quality and narrative atoms also track stage / quality independently, resulting in at least 12 duplicated fields across the stack.
    - BeatBus event flow currently depends on atoms → `StateCommands` for canonical emission; moving emission into a new coordinator would leave UI atoms stale unless re-wired.
  - **Risk Level:** HIGH. Replacing atomic state with a new coordinator would break existing component subscriptions, BeatBus contracts, and advanced batching logic.
  - **Effort Adjustment:** Plan for integration work (~2 extra days) to bridge StateCoordinator with atoms & BeatBus rather than a direct extraction.

  ## State Management Landscape

  ### Existing Systems
  - **Atomic State (React external stores):**
    - `src/state/atoms/stageAtom.js` – Stage orchestration, batching, smoothing, auto-advance.
    - `src/state/atoms/qualityAtom.js` – Quality tiers, particle budgets, DPR, BeatBus <-> atom sync.
    - `src/state/atoms/clockAtom.js` – Lightweight FPS clock store.
    - `src/state/atoms/narrativeAtom.js` – Narrative progression, fragments, morph.
    - `src/state/atoms/performanceAtom.js` – Perf metrics & quality feedback loop.
    - `src/state/atoms/interactionAtom.js` – UI interaction tracking.
    - `src/state/atoms/resourceAtom.js` – WebGL resource registry.
  - **Command Layer:** `src/state/commands/StateCommands.js` bridges atoms and BeatBus, throttles morph, and enforces emission contracts.
  - **Legacy Stores / Hooks:** `src/hooks/atoms/useNarrativeStore.js` exposes atom state via Zustand-like API.
  - **Misc:** Duplicate legacy atom at `src/stores/atoms/qualityAtom.js` (not referenced) – should be archived to avoid confusion.

  ### Current State Variables (duplicates highlighted)

  | Module | Key State Fields | Notes |
  |--------|------------------|-------|
  | `TheaterDirector` | `phase`, `isRunning`, `hasRun`, `startTime`, `currentStage`, `skipRequested`, `_openingInProgress`, `_openingPrebound`, `_preChaosReady`, `_fencepostReadyEmitted`, `_sleepWaiters`, `_rendererFencepostSeen` | Internal control flags. `currentStage` duplicates atom & narrative state. |
  | `ScrollOrchestrator` | `running`, `lastStageIndex`, `morph`, `morphTarget`, `scrollLocked`, `_lastEmitVal`, `_lastEmitTs`, `_lastScrollLogBucket` | Tracks morph & stage index separately from atoms. |
  | `OpeningSequenceController` | `running`, `cancelled`, `skipRequested`, `_skipOrigin` | Minimal but overlaps with director skip flags. |
  | `stageAtom` initial state | `currentStage`, `stageIndex`, `stageProgress`, `globalProgress`, `isTransitioning`, `memoryFragmentsUnlocked`, `metacurtisActive`, `metacurtisVoiceLevel`, `autoAdvanceEnabled`, `smoothedProgress`, `transitionHistory`, `performanceMetrics`, batching timers | Acts as primary stage store for UI + exposes dev controls. |
  | `qualityAtom` | `currentQualityTier`, `targetDpr`, `particleCount`, `currentStage`, `frameloopMode`, perf metrics | Emits/consumes BeatBus events. `currentStage` duplicates stage atom. |
  | `narrativeAtom` | `currentStage`, `globalProgress`, `morphProgress`, `stageStartTime`, `stageFeatures`, `narrativeEvents`, etc. | Dispatches custom DOM events; heavy duplication of stage & morph data. |
  | `performanceAtom` | `fps`, `frameTime`, `particleCount`, `currentTier`, nested `narrative.currentStage` | Another copy of stage info. |
  | `interactionAtom` | UI states only (no overlap). |
  | `resourceAtom` | Resource maps (no overlap). |

  **Duplication Summary:**
  - `currentStage` tracked in **6 places** (stageAtom, narrativeAtom, qualityAtom, performanceAtom, TheaterDirector, ScrollOrchestrator).
  - `isTransitioning` in stageAtom & narrativeAtom plus TheaterDirector/OpeningSequence flags.
  - `morph`/`morphProgress` in ScrollOrchestrator, narrativeAtom, StateCommands throttle, TheaterDirector/OpeningSequence skip logic.
  - Auto-advance state split between stageAtom (`autoAdvanceEnabled`) and TheaterDirector (handleOpeningComplete + skip flags).

  ## Data Flow Analysis

  ### Event Flow
  1. **Director / Orchestrator → BeatBus:** `TheaterDirector`, `ScrollOrchestrator`, `OpeningSequenceController` emit `STAGE_CHANGE`, morph, and renderer directives.
  2. **BeatBus → StateCommands → Atoms:** `StateCommands` listens for `STAGE_CHANGE` / `QUALITY_CHANGE`, updates cached values, and prevents duplicate emission loops by tracking last payload.
  3. **Atoms → BeatBus (when atom-driven):** `stageAtom.subscribe` & `qualityAtom.subscribe` re-emit events when atom state changes locally (e.g., via dev controls).
  4. **Components → Atoms:** UI reads via `useAtomValue` (NarrationController, StageNavigation, Dev monitors, etc.).

  **Key Observation:** BeatBus is already positioned as the bridge between theater internals and atoms. Removing the atom layer without re-implementing this bridge will break component reactivity.

  ### State Synchronization
  - `stageAtom` does **not** import BeatBus directly; synchronization is mediated by `StateCommands`. This file tracks last seen stage/quality from the bus and handles throttled morph emission.
  - `ScrollOrchestrator` emits `STAGE_CHANGE` whenever scroll moves into a new bucket, but doesn’t notify atoms directly; atoms rely on `StateCommands` hearing the BeatBus event.
  - `TheaterDirector` maintains `currentStage` for internal safeguards (e.g., avoiding duplicate transitions) but also reads from `stageAtom` inside `handleOpeningComplete` for auto-advance decisions.
  - Narrative and quality atoms piggyback on stage changes to update their own state (particle budgets, narrative progress).

  **Race Conditions:**
  - Stage changes can originate from ScrollOrchestrator (scroll-driven) or TheaterDirector (opening flow). `StateCommands` ensures BeatBus payloads propagate before atoms emit duplicates. Introducing a new coordinator must preserve this anti-loop logic.

  ## StateCoordinator Validation

  ### Compatibility Assessment
  - **Atoms vs Coordinator:** `stageAtom` already encapsulates batching & smoothing – replacing it with StateCoordinator would regress these features or require re-implementation inside the coordinator.
  - **Canonical Authority:** Atoms initialize from `Canonical` data; coordinator would need identical bootstrapping to stay canonical-compliant.
  - **BeatBus:** Current emission contract (atoms ↔ BeatBus) is centered in `StateCommands`. Moving state ownership without rewriting this file risks double emissions or missed updates.

  ### Integration Strategy Recommendation
  - **Decision Tree Outcome:** **Scenario D – Needs integration.** Coordinator must act as a facade over existing atoms + theater internals, not a replacement.
  - **Required Adjustments:**
    1. Treat `stageAtom` as the primary observable store. Coordinator should read/write through provided APIs instead of duplicating state.
    2. Export read-only selectors for Theater subsystems while keeping atoms responsible for UI reactivity.
    3. Extend `StateCommands` (or move its logic) into the coordinator so BeatBus contracts remain intact.
    4. Expose coordinator hooks for theater internals (director/orchestrator/controllers) without removing atom subscriptions.

  ## Risk Assessment

  ### Critical Risks (High)
  1. **Source-of-Truth Conflict:** Replacing `stageAtom` would orphan all component subscribers (`NarrationController`, `StageNavigation`, diagnostic overlays). Needs bridging layer.
  2. **BeatBus Contract Breakage:** `StateCommands` throttling and duplicate suppression rely on atom callbacks. Removing them requires rewriting the contract logic.
  3. **Auto-Advance Logic Split:** Opening completion toggles stageAtom and autoAdvance diagnostics. Coordinator must synchronize these or regress skip behavior.

  ### Medium Risks
  1. **HMR Persistence:** Atoms retain state across hot reload; Coordinator would need similar behaviour or dev UX degrades.
  2. **Touch Points (~18)** referencing `director.phase` & `orchestrator.morph`. Migration demands a systematic refactor to avoid missed updates.

  ### Low Risks
  1. **ClockAtom / ResourceAtom:** Largely independent – low risk to coordinator plan.
  2. **Legacy Store Directory:** Just needs cleanup (remove `src/stores/atoms/qualityAtom.js`).

  ## Dependencies & Impact

  ### Files Requiring Changes
  - `src/theater/TheaterDirector.js`
  - `src/theater/ScrollOrchestrator.js`
  - `src/theater/controllers/OpeningSequenceController.js`
  - `src/state/commands/StateCommands.js`
  - `src/state/atoms/stageAtom.js`
  - `src/state/atoms/qualityAtom.js`
  - `src/state/atoms/narrativeAtom.js`
  - Downstream consumers (`NarrationController`, `StageNavigation`, diagnostics, WebGLBackground`).

  ### Touchpoint Estimate
  - 18 direct references to `director.*` or `orchestrator.*` state; additional 12+ imports of `stageAtom` / `qualityAtom` across components.
  - Expect 150–200 LOC touched for refactor due to API changes.

  ### Breaking Changes
  - Any removal of atom APIs (e.g., `stageAtom.getStageInfo()`) is breaking for dev tooling/console access.
  - BeatBus payload schemas must remain intact (`STAGE_CHANGE`, `QUALITY_CHANGE`).

  ## Implementation Plan (Revised Phase A2.3)
  1. **Define Coordinator API** that wraps existing atoms (`stageAtom`, `qualityAtom`, `narrativeAtom`) and exposes read-only selectors plus imperative helpers.
  2. **Co-locate `StateCommands` logic** inside the coordinator or keep it as a collaborator to avoid duplicate BeatBus wiring.
  3. **Refactor Theater internals** (`TheaterDirector`, `ScrollOrchestrator`, `OpeningSequenceController`) to call coordinator methods rather than storing their own redundant flags, while still respecting atom outputs.
  4. **Add integration tests** covering opening sequence, scroll-driven stage changes, quality tier changes.
  5. **Deprecate direct atom access** gradually by providing coordinator-based helpers (but keep atoms for React consumers until migration complete).

  ### Alternative Approach
  - If coordinator proves heavy, consider enhancing `stageAtom` + `StateCommands` and exposing a thin facade (`StageService`) instead of extracting a new module.

  ## Recommendation
  - **Decision:** **GO WITH CHANGES.** Proceed only if StateCoordinator is designed as an integration layer over existing atoms and BeatBus flow, not a hard replacement.
  - **Required Design Updates:**
    1. Coordinator must delegate to `stageAtom`/`qualityAtom` for canonical state.
    2. Include `StateCommands` responsibilities (BeatBus sync, morph throttling).
    3. Provide migration plan for Theater state fields (phase, running, etc.) ensuring no duplication with atom state.
  - **Confidence Level:** **Medium (≈80%)** – Audit covers all major state systems, but coordinator implementation details remain to be finalized.

  ## Appendices
  - **A. Complete State Inventory:** See `state_audit_20251031_090351.md` (contains full source for stage/quality/clock atoms and directory listing).
  - **B. Key Evidence:**
    - Stage Atom consumers (`grep stageAtom`): multiple components & theater modules.
    - BeatBus integration in `StateCommands.js` (`BeatBus.on` / `BeatBus.emit`).
    - Duplicate `currentStage` fields documented across atoms & theater classes.
  - **C. Usage Patterns:** Command outputs captured during audit (see conversation log).


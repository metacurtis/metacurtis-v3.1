# Particle Architecture Evidence Report

**Generated:** 2025-11-07T21:37:50.343Z
**Commit:** 8f4a36df38f0ec9633941082c1ba9b9c1dd7d162

## BLUEPRINT_EMIT: 24 occurrences

### src/theater/TheaterDirector.js (1)

- Line 615: `BeatBus.emit(EVENTS.PREWARM_GENESIS_BLUEPRINT);`

### src/theater/controllers/OpeningSequenceController.js (2)

- Line 380: `BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {`
- Line 540: `BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {`

### src/state/commands/StateCommands.js (2)

- Line 258: `if (!this.canEmit('BUILD_EMERGENCE_BLUEPRINT')) {`
- Line 264: `BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {`

### src/engine/ConsciousnessEngine.js (14)

- Line 23: `emitBlueprintReady,`
- Line 322: `this.buildAndEmitBlueprint(stage, this.currentQuality);`
- Line 332: `this.buildAndEmitBlueprint(this.currentStage, tier);`
- Line 413: `// Emit emergence blueprint with mode flag (canonical event)`
- Line 433: `BeatBus.emit(EVENTS.BLUEPRINT_READY, { blueprint, ...emergencePayload });`
- Line 436: `console.log('🧠 Engine: Opening chaos blueprint emitted', { count: blueprint.particleCount, mode: variantMode });`
- Line 440: `console.log('🧠 Engine: Emergence blueprint emitted', { count: blueprint.particleCount, mode: 'emergence' });`
- Line 564: `_emitBlueprint(blueprint) {`
- Line 575: `* Build + emit the Emergence blueprint for the opening sequence.`
- Line 737: `this._emitBlueprint(blueprint);`
- Line 743: `buildAndEmitBlueprint(stage, quality) {`
- Line 814: `emitBlueprintReady(BeatBus, EVENTS, blueprint, {`
- Line 842: `emitBlueprintReady(BeatBus, EVENTS, blueprint, {`
- Line 866: `emitBlueprintReady(BeatBus, EVENTS, blueprint, {`

### src/engine/utils/blueprintUtils.js (3)

- Line 156: `* Emit the canonical BLUEPRINT_READY payload through BeatBus.`
- Line 164: `export function emitBlueprintReady(BeatBus, EVENTS, blueprint, metadata = {}) {`
- Line 166: `BeatBus.emit(EVENTS.BLUEPRINT_READY, payload);`

### src/engine/modules/ClimaxController.js (2)

- Line 10: `import { emitBlueprintReady } from '../utils/blueprintUtils.js';`
- Line 452: `emitBlueprintReady(BeatBus, EVENTS, blueprint, emitPayload);`

## BLUEPRINT_CONSUME: 31 occurrences

### src/theater/controllers/OpeningSequenceController.js (5)

- Line 418: `const blueprint = payload?.blueprint ?? payload;`
- Line 420: `const mode = payload?.mode || blueprint?.mode;`
- Line 606: `const blueprintOff = BeatBus.on(EVENTS.BLUEPRINT_READY, (payload = {}) => {`
- Line 607: `const blueprint = payload?.blueprint ?? payload;`
- Line 609: `const mode = payload?.mode || blueprint?.mode;`

### src/theater/bus/index.js (1)

- Line 303: `const blueprint = p.blueprint;`

### src/engine/ConsciousnessEngine.js (8)

- Line 399: `const blueprint = await this.buildEmergenceBlueprint({`
- Line 487: `const blueprint = createBlueprintStructure(count, {`
- Line 596: `const blueprint = this._createEmptyBlueprint(count, { mode: requestedMode, quality });`
- Line 599: `const blueprintCount = blueprint.particleCount;`
- Line 693: `const { counts, tiers } = this._assignTiersShuffled(blueprintCount, sanitizedRatios);`
- Line 726: `if (targetState) blueprint.targetState = targetState;`
- Line 756: `let blueprint = this.blueprintCache.get(cacheKey);`
- Line 799: `if (blueprint.positions.length === targets.length) {`

### src/engine/utils/blueprintUtils.js (1)

- Line 165: `const payload = { blueprint, ...metadata };`

### src/engine/modules/MorphController.js (1)

- Line 55: `const count = blueprint?.activeCount || blueprint?.particleCount || 0;`

### src/engine/modules/ClimaxController.js (2)

- Line 406: `const blueprint = this.#buildBlueprintFromPositions(step, positions, effectiveCount);`
- Line 540: `const blueprint = {`

### src/engine/modules/BlueprintGenerator.js (2)

- Line 99: `const blueprint = createBlueprintStructure(particleCount, {`
- Line 283: `const hotspotIds = Object.keys(blueprint.hotspotMap || {});`

### src/contracts/OptimizedContracts.js (2)

- Line 57: `constructor(blueprint) {`
- Line 60: `this.blueprint = blueprint;`

### src/components/webgl/WebGLCanvas.jsx (1)

- Line 260: `const metadata = payload?.blueprint?.metadata ?? payload?.metadata ?? {};`

### src/components/webgl/WebGLBackground.jsx (8)

- Line 66: `const bp = payload?.blueprint ?? payload;`
- Line 228: `const [blueprint, setBlueprint] = useState(null);`
- Line 236: `const blueprintRef = useRef(blueprint);`
- Line 1353: `const blueprintForDiag = raw;`
- Line 1358: `const text3DPositions = blueprintForDiag?.text3DPositions;`
- Line 1360: `const stepName = blueprintForDiag?.climaxStep || blueprintForDiag?.mode?.split?.(':')?.[1] || null;`
- Line 1516: `const isEmergenceMode = payload?.mode === 'emergence' || payload?.blueprint?.mode === 'emergence';`
- Line 1689: `const blueprintCount = blueprint?.activeCount || blueprint?.particleCount || blueprint?.maxParticles || 0;`

## BLUEPRINT_WRITE: 1 occurrences

### src/engine/modules/ClimaxController.js (1)

- Line 540: `const blueprint = {`

## MORPH_EMIT: 7 occurrences

### src/theater/ScrollOrchestrator.js (1)

- Line 116: `BeatBus.emit?.(EVENTS.MORPH_PROGRESS, {`

### src/theater/controllers/MorphAnimationController.js (1)

- Line 332: `BeatBus.emit(EVENTS.MORPH_PROGRESS, payload);`

### src/state/commands/StateCommands.js (1)

- Line 44: `BeatBus.emit(EVENTS.MORPH_PROGRESS || 'MORPH_PROGRESS', payload);`

### src/engine/modules/MorphController.js (1)

- Line 273: `BeatBus.emit(EVENTS.MORPH_PROGRESS, payload);`

### src/engine/modules/ClimaxController.js (1)

- Line 249: `BeatBus.emit(EVENTS.MORPH_PROGRESS, morphPayload);`

### src/components/webgl/WebGLBackground.jsx (2)

- Line 412: `BeatBus.emit?.(EVENTS.MORPH_PROGRESS, { value: 1, source });`
- Line 1333: `BeatBus.emit?.(EVENTS.MORPH_PROGRESS, { value: 0 });`

## MORPH_LISTEN: 2 occurrences

### src/theater/bus/index.js (1)

- Line 6: `const BATCH_EVENTS = new Set(['MORPH_PROGRESS', 'SCROLL_PROGRESS']);`

### src/components/webgl/WebGLBackground.jsx (1)

- Line 1668: `const unsubMorph = BeatBus.on(EVENTS.MORPH_PROGRESS, handleMorphProgress);`

## MORPH_WRITE: 16 occurrences

### src/theater/ScrollOrchestrator.js (1)

- Line 113: `const morphProgress = clamp01(value);`

### src/state/commands/StateCommands.js (4)

- Line 208: `setMorphProgress(value, options = {}) {`
- Line 210: `narrativeAtom.setMorphProgress?.(morph);`
- Line 223: `return this.setMorphProgress(current + delta, options);`
- Line 285: `this.setMorphProgress(progress, { origin: 'climax' });`

### src/state/atoms/narrativeAtom.js (1)

- Line 84: `setMorphProgress: progress => {`

### src/hooks/atoms/useNarrativeStore.js (1)

- Line 23: `setMorphProgress: narrativeAtom.setMorphProgress,`

### src/components/webgl/WebGLCanvas.jsx (2)

- Line 134: `morphProgress = 0,`
- Line 522: `morphProgress={morphProgress}`

### src/components/webgl/WebGLBackground.jsx (1)

- Line 188: `function WebGLBackground({ morphProgress = 0, scrollProgress = 0 }) {`

### src/components/consciousness/ConsciousnessTheater.jsx (6)

- Line 137: `const morphProgress = useAtomValue(narrativeAtom, (state) => state.morphProgress);`
- Line 360: `const updated = stateCommands.setMorphProgress(next, { origin: 'keyboard' });`
- Line 443: `morphProgressRef.current = stateCommands.setMorphProgress(target, {`
- Line 451: `morphProgressRef.current = stateCommands.setMorphProgress(0, { origin: 'reset' });`
- Line 477: `stateCommands.setMorphProgress(Math.min(progress * 2, 1), { origin: 'scroll' });`
- Line 505: `morphProgress={morphProgress}`

## RENDERER_DIRECTIVE: 0 occurrences

## DRAW_CALL: 1 occurrences

### src/main.jsx (1)

- Line 78: `root.render(<App />);`

## ENGINE_BLUEPRINT: 3 occurrences

### src/engine/ConsciousnessEngine.js (2)

- Line 880: `console.error('[ConsciousnessEngine] BlueprintGenerator unavailable');`
- Line 953: `console.error('[ConsciousnessEngine] BlueprintGenerator unavailable');`

### src/engine/utils/blueprintUtils.js (1)

- Line 83: `* Mirrors the structure produced inside ConsciousnessEngine._createEmptyBlueprint`

## ENGINE_MORPH: 1 occurrences

### src/engine/ConsciousnessEngine.js (1)

- Line 465: `console.error('[ConsciousnessEngine] MorphController not initialized');`

## MULTIPLE_SOURCES: 99 occurrences

### src/main.jsx (11)

- Line 19: `// Trace system for dev event monitoring`
- Line 20: `if (typeof window !== 'undefined' && !window.__trace) {`
- Line 22: `const maxTraceLength = 500;`
- Line 24: `window.__trace = traceBuffer;`
- Line 25: `window.dumpTrace = () => [...traceBuffer];`
- Line 27: `traceBuffer.length = 0;`
- Line 28: `console.log('[TRACE] Cleared');`
- Line 30: `window.pushTrace = (event = {}) => {`
- Line 35: `if (traceBuffer.length > maxTraceLength) traceBuffer.shift();`
- Line 38: `console.log('✅ Trace system initialized');`
- Line 62: `import('./dev/trace.js'),`

### src/utils/featureFlags.js (14)

- Line 17: `const CONCURRENT_FEATURES_ENABLED =`
- Line 18: `process.env.VITE_CONCURRENT_FEATURES === 'true' ||`
- Line 20: `(typeof window !== 'undefined' && window.location.search.includes('concurrent=true'));`
- Line 33: `concurrentFeatures: CONCURRENT_FEATURES_ENABLED,`
- Line 50: `isConcurrentFeaturesEnabled: () => runtimeFlags.concurrentFeatures,`
- Line 71: `enableConcurrentFeatures: () => {`
- Line 73: `console.log('🔄 Concurrent features enabled');`
- Line 76: `disableConcurrentFeatures: () => {`
- Line 78: `console.log('⏸️ Concurrent features disabled');`
- Line 99: `console.log('✅ Phase 2 Complete: React 19 Concurrent Features');`
- Line 115: `concurrentFeatures: runtimeFlags.concurrentFeatures,`
- Line 127: `VITE_CONCURRENT_FEATURES: process.env.VITE_CONCURRENT_FEATURES,`
- Line 141: `if (runtimeFlags.concurrentFeatures && !runtimeFlags.atomicStores) {`
- Line 191: `console.log('Concurrent Features:', status.concurrentFeatures);`

### src/theater/TheaterDirector.js (2)

- Line 596: `console.trace('Cancel call stack');`
- Line 789: `console.trace('Cancel caller stack trace');`

### src/theater/ScrollOrchestrator.js (1)

- Line 108: `if (shouldEmit) {`

### src/theater/controllers/OpeningSequenceController.js (2)

- Line 404: `const readinessResult = await Promise.race([`
- Line 571: `if (!this.director._fencepostReadyEmitted) {`

### src/theater/controllers/MorphAnimationController.js (1)

- Line 19: `this.animations = new Map(); // Support multiple concurrent animations`

### src/state/commands/StateCommands.js (2)

- Line 26: `if (now - __lastMorphEmit < MIN) return; // too soon`
- Line 258: `if (!this.canEmit('BUILD_EMERGENCE_BLUEPRINT')) {`

### src/state/atoms/stageAtom.js (1)

- Line 785: `- ✅ Graceful cleanup and disposal of all systems`

### src/state/atoms/createAtom.js (1)

- Line 478: `- ✅ Graceful degradation for cache failures`

### src/orchestration/navigation/narrativeNavigation.js (1)

- Line 46: `if (emitNarration) emitStartNarrative(stageName);`

### src/engine/ConsciousnessEngine.js (3)

- Line 18: `import { trace } from '@/dev/trace.js';`
- Line 728: `trace('CE:EMIT', {`
- Line 1065: `await Promise.race([`

### src/engine/modules/MorphController.js (3)

- Line 5: `import { trace } from '@/dev/trace.js';`
- Line 123: `trace('[MorphController] Emergence timeline started', { count });`
- Line 237: `trace('[MorphController] Emergence timeline complete');`

### src/engine/modules/ClimaxController.js (2)

- Line 570: `if (!state.active && !emitComplete) {`
- Line 586: `if (emitComplete) {`

### src/dev/trace.js (11)

- Line 1: `export function trace(ev, data = {}) {`
- Line 3: `const t = window.__trace || (window.__trace = []);`
- Line 7: `console.warn('[trace] failed', err);`
- Line 12: `export function dumpTrace() {`
- Line 14: `return (window.__trace || []).slice();`
- Line 20: `export function clearTrace() {`
- Line 22: `window.__trace = [];`
- Line 24: `window.__trace = [];`
- Line 29: `const api = { trace, dumpTrace, clearTrace };`
- Line 30: `window.__traceAPI = { ...(window.__traceAPI || {}), ...api };`
- Line 31: `window.clearTrace = window.clearTrace || clearTrace;`

### src/core/CentralEventClock.js (1)

- Line 862: `- ✅ Graceful degradation under performance pressure`

### src/config/overlay-config.js (1)

- Line 5: `graceWindowMs: 800,`

### src/components/webgl/WebGLCanvas.jsx (1)

- Line 35: `maxConcurrent: 0,`

### src/components/webgl/WebGLBackground.jsx (14)

- Line 18: `import { trace } from '@/dev/trace.js';`
- Line 291: `trace('WBG:BIND', payload);`
- Line 299: `trace(label, {`
- Line 309: `trace('WBG:FENCEPOST', payload);`
- Line 368: `trace('FENCEPOST_LISTENERS_READY', {`
- Line 390: `if (!emergencePendingRef.current || emittedEmergedRef.current) {`
- Line 432: `trace('WBG:FAST_FORWARD', payload);`
- Line 443: `trace('FENCEPOST_LISTENERS_READY', payload);`
- Line 1074: `if (isEmergence && emittedEmergedRef.current) return;`
- Line 1452: `if ((raw.stageName || st) === 'genesis' && emergencePendingRef.current && !emittedEmergedRef.current) {`
- Line 1458: `trace('WBG:FREEZE', { value: 1, source: 'blueprint' });`
- Line 1489: `trace('WBG:FREEZE', { value: 0, source: 'stage' });`
- Line 1638: `if (emergencePendingRef.current && !emittedEmergedRef.current && value >= 0.995) {`
- Line 1647: `trace('WBG:FREEZE', { value: 1, source: 'morph' });`

### src/components/ui/CanvasErrorBoundary.jsx (2)

- Line 14: `console.error('🛠 React component trace:\n', info.componentStack);`
- Line 41: `<summary>React component trace</summary>`

### src/components/narrative/NarrationOverlayBus.jsx (13)

- Line 41: `const clearGraceTimer = useCallback(() => {`
- Line 42: `timers.clear('grace');`
- Line 50: `clearGraceTimer();`
- Line 60: `}, [clearGraceTimer, clearTypeTimer]);`
- Line 62: `const scheduleGraceHide = useCallback(() => {`
- Line 64: `stateMachine.transitionTo(STATES.GRACE_PERIOD, { reason: 'narration_stopped' });`
- Line 66: `stateMachine.transitionTo(STATES.HIDING, { reason: 'grace_expired' });`
- Line 69: `}, config.graceWindowMs);`
- Line 145: `clearGraceTimer();`
- Line 184: `clearGraceTimer();`
- Line 195: `scheduleGraceHide();`
- Line 200: `scheduleGraceHide();`
- Line 219: `}, [clearGraceTimer, clearTypeTimer, resetOverlay, scheduleGraceHide, visible]);`

### src/components/narrative/overlay/OverlayTimers.js (2)

- Line 3: `* Prevents race conditions and timer leaks by naming timers.`
- Line 9: `grace: null,`

### src/components/narrative/overlay/OverlayStateMachine.js (8)

- Line 11: `GRACE_PERIOD: 'grace',`
- Line 20: `STATES.GRACE_PERIOD, // Grace period if stopped before started`
- Line 27: `STATES.GRACE_PERIOD, // Can stop before typing starts`
- Line 34: `STATES.GRACE_PERIOD, // Can stop mid-typing`
- Line 38: `STATES.GRACE_PERIOD,`
- Line 43: `[STATES.GRACE_PERIOD]: [`
- Line 45: `STATES.TYPING, // New text during grace period`
- Line 47: `STATES.STARTING, // Restart during grace`

### src/components/consciousness/ConsciousnessTheater.jsx (2)

- Line 2: `// Director-integrated Theater — start AFTER viewport hint; race-free opening (DEV-safe cancel guard)`
- Line 22: `console.log('🧬 LOADED: ConsciousnessTheater — race-free opening (DEV-safe cancel)');`

## STATE_MUTATION: 55 occurrences

### src/utils/runtimeGuards.js (1)

- Line 142: `console.warn(`[runtime-guard] Attempt to mutate read-only control "${name}.${key}" ignored.`);`

### src/state/commands/StateCommands.js (6)

- Line 279: `narrativeAtom.setState?.(prev => ({ ...prev, paused: true }));`
- Line 290: `narrativeAtom.setState?.(prev => ({ ...prev, paused: false }));`
- Line 301: `narrativeAtom.setState?.(prev => ({ ...prev, paused: true }));`
- Line 316: `stageAtom.setState?.({ currentStage: to, transitioning: true });`
- Line 384: `stageAtom.setState?.(snapshot.state.stage);`
- Line 386: `qualityAtom.setState?.(snapshot.state.quality);`

### src/state/atoms/stageAtom.js (17)

- Line 318: `export const stageAtom = createAtom(initialState, (get, setState) => {`
- Line 326: `const batchedSetState = (updates, transitionType = 'direct') => {`
- Line 361: `setState(newState, 'batched');`
- Line 395: `batchedSetState(updates, 'setStage');`
- Line 399: `batchedSetState({ isTransitioning: false }, 'clearTransition');`
- Line 427: `batchedSetState(updates, 'jumpToStage');`
- Line 472: `batchedSetState(updates, 'setProgress');`
- Line 500: `batchedSetState(updates, 'setGlobalProgress');`
- Line 505: `batchedSetState({ isTransitioning }, 'setTransitioning');`
- Line 511: `batchedSetState({ autoAdvanceEnabled: value }, 'setAutoAdvance');`
- Line 535: `batchedSetState({`
- Line 542: `batchedSetState({ metacurtisActive: active }, 'setMetacurtisActive');`
- Line 547: `batchedSetState({ metacurtisVoiceLevel: clampedLevel }, 'setVoiceLevel');`
- Line 558: `setState(createInitialState(), 'reset');`
- Line 645: `const originalSetState = stageAtom.setState?.bind(stageAtom);`
- Line 647: `stageAtom.setState = function (value, updateType) {`
- Line 658: `return originalSetState(nextState, updateType);`

### src/state/atoms/qualityAtom.js (8)

- Line 145: `export const qualityAtom = createAtom(initialState, (get, setState) => {`
- Line 161: `setState({`
- Line 189: `setState({`
- Line 209: `setState({ ...get(), targetDpr: dpr });`
- Line 213: `setState({ ...get(), frameloopMode: mode });`
- Line 228: `setState({`
- Line 261: `setState({`
- Line 288: `setState({`

### src/state/atoms/createAtom.js (6)

- Line 199: `// ✅ ENHANCED: Batched setState for performance`
- Line 200: `const setState = (newState, updateType = 'setState') => {`
- Line 227: `setState,`
- Line 275: `...actionsFactory(get, setState)`
- Line 342: `atom.forceUpdate?.() || atom.setState(atom.getState());`
- Line 346: `atom.setState(initialState);`

### src/state/atoms/clockAtom.js (1)

- Line 14: `setState: (newState) => {`

### src/hooks/useAtom.js (2)

- Line 5: `const [state, setState] = useState(atom.getState());`
- Line 9: `const unsubscribe = atom.subscribe(setState);`

### src/components/ui/CanvasErrorBoundary.jsx (1)

- Line 15: `this.setState({ info });`

### src/components/narrative/NarrationController.jsx (12)

- Line 132: `const resetState = useCallback(`
- Line 146: `console.log('🎙️ [NarrationController] resetState called', {`
- Line 662: `resetState({ preserveStage: true });`
- Line 688: `[currentStage, defaultCharsPerSecond, lockScroll, resetState, scheduleSegment]`
- Line 702: `resetState({ unlock: true });`
- Line 707: `[resetState]`
- Line 864: `resetStateId: resetState,`
- Line 956: `resetState();`
- Line 986: `resetState();`
- Line 988: `}, [currentStage, resetState, skipNarration, startNarration]);`
- Line 1064: `resetState();`
- Line 1066: `}, [resetState]);`

### src/components/common/ErrorBoundary.jsx (1)

- Line 16: `this.setState({ info });`


**Total patterns found:** 240

## 🚨 Critical Issues

⚠️ **Multiple Blueprint Emitters:** 24 sources
   Expected: 1 (ConsciousnessEngine only)

⚠️ **Multiple Morph Emitters:** 7 sources
   Expected: 1 (ConsciousnessEngine only)


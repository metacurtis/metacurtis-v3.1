# State Dependency Graph
Generated: Fri Oct 31 09:54:01 CDT 2025

## Module Dependencies

Format: MODULE → depends on → STATE_SOURCE

### Theater Modules

#### theater/NavigationGate.js
- Local State Variables: (none)

#### theater/ScrollOrchestrator.js
- ✅ Uses BeatBus
116:          BeatBus.emit?.(EVENTS.MORPH_PROGRESS, {
310:      BeatBus.emit?.(EVENTS.SCROLL_PROGRESS, {
332:        BeatBus.emit?.(EVENTS.STAGE_CHANGE, { 
- Local State Variables:
38:    this.running = false;
40:    this.morph = 1;
41:    this.morphTarget = 1;
43:    this.morphAnimator = new MorphAnimationController();
44:    this.morphAnimationId = null;

#### theater/TheaterDirector.js
- ✅ Imports stageAtom
5:import stageAtom from '@/state/atoms/stageAtom.js';
495:    const currentState = stageAtom?.getStageInfo?.() ?? stageAtom?.getState?.() ?? {};
496:    const currentStage = currentState.currentStage ?? stageAtom?.getState?.()?.currentStage ?? null;
- ✅ Uses BeatBus
127:      this._stageChangeUnsubscribe = BeatBus.on(EVENTS.STAGE_CHANGE, this._handleStageChangeBound);
270:      BeatBus.emit(EVENTS.START_NARRATIVE, {
410:      const unsubscribe = BeatBus.on(EVENTS.ENGINE_VIEWPORT_HINT, (data) => {
467:      BeatBus.emit(EVENTS.DIRECTOR_ERROR, { error });
616:    BeatBus.emit(EVENTS.DIRECTOR_CANCEL);
- Local State Variables:
101:    this.morphAnimator = new MorphAnimationController();
106:      if (targetStage === 'genesis' && this.currentStage) {
111:        if (!isOpeningHandoff && !isManualJump && this.currentStage !== 'genesis') {
113:            currentStage: this.currentStage,
152:      if (this.skipRequested || this.cancelled) return;

#### theater/UnifiedNavigationAPI.js
- ✅ Imports stageAtom
8: * RULE: Nothing should call stageAtom.jumpToStage directly.
14:import { stageAtom } from '@/state/atoms';
74:      const currentStage = stageAtom.getState?.()?.currentStage;
- ✅ Uses BeatBus
192:    return BeatBus.on('STAGE_CHANGE', callback);
- Local State Variables:
20:    this.currentStage = null;

#### theater/events-safe.js
- Local State Variables: (none)

#### theater/events.js
- Local State Variables: (none)

#### theater/controllers/MorphAnimationController.js
- ✅ Uses BeatBus
332:    BeatBus.emit(EVENTS.MORPH_PROGRESS, payload);
- Local State Variables: (none)

#### theater/controllers/OpeningSequenceController.js
- ✅ Uses BeatBus
331:        BeatBus.emit(EVENTS.CURSOR_SHOW);
332:        BeatBus.emit(EVENTS.AUDIO_COMPUTER_HUM, { volume: cursorHumVolume });
338:          BeatBus.emit(EVENTS.CURSOR_BLINK, { count: cursorBlinkCount, interval: cursorIntervalMs });
349:        BeatBus.emit(EVENTS.TERMINAL_TYPE, typingConfig);
363:        BeatBus.emit(EVENTS.SCREEN_FILL, { text: fillConfig.text, scrollSpeed: fillConfig.scrollSpeed });
- Local State Variables:
63:    this.running = false;
64:    this.cancelled = false;
65:    this.skipRequested = false;
161:    if (this.skipRequested) return;
162:    this.skipRequested = true;

### Component Modules

#### components/consciousness/ConsciousnessTheater.jsx
- Uses: qualityAtom stageAtom useAtomValue

#### components/dev/DevPerformanceMonitor.jsx
- Uses: qualityAtom stageAtom

#### components/fragments/AmbientFragmentManager.jsx
- Uses: stageAtom useAtomValue

#### components/fragments/ClimaxSequenceController.jsx
- Uses: stageAtom useAtomValue

#### components/narrative/NarrationController.jsx
- Uses: stageAtom useAtomValue

#### components/ui/narrative/StageNavigation.jsx
- Uses: stageAtom useAtomValue

✅ Dependency graph complete

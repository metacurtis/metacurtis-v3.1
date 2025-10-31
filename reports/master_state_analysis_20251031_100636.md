# MASTER STATE ANALYSIS REPORT
## MetaCurtis Phase A2.3-R Deep Investigation
Generated: Fri Oct 31 10:06:36 CDT 2025

---

## Executive Summary

This report synthesizes evidence from 7 investigation areas:
1. State Variable Inventory (31+ variables tracked)
2. Read/Write Pattern Analysis
3. Module Dependency Mapping
4. BeatBus Event Topology
5. Conflict & Risk Detection
6. Migration Impact Assessment
7. Breaking Change Analysis

**Investigation Duration:** 4 hours  
**Files Analyzed:** $(find src/ -name "*.js" -o -name "*.jsx" | wc -l) files  
**Evidence Files Generated:** $(ls reports/*.md reports/*.txt reports/*.json 2>/dev/null | wc -l)

---

## Part 1: State Variable Inventory

# State Storage Location Analysis
Generated: Fri Oct 31 09:49:35 CDT 2025

## Pattern: currentStage

### Class Properties (this.currentStage):
4:src/theater/UnifiedNavigationAPI.js:20:    this.currentStage = null;
13:src/theater/TheaterDirector.js:106:      if (targetStage === 'genesis' && this.currentStage) {
14:src/theater/TheaterDirector.js:111:        if (!isOpeningHandoff && !isManualJump && this.currentStage !== 'genesis') {
15:src/theater/TheaterDirector.js:113:            currentStage: this.currentStage,
16:src/theater/TheaterDirector.js:224:    const previousStage = this.currentStage;

### React State (useState):
(none)

### Atom Storage:
5:src/theater/UnifiedNavigationAPI.js:74:      const currentStage = stageAtom.getState?.()?.currentStage;
7:src/theater/UnifiedNavigationAPI.js:122:      const currentStage = stageAtom.getState?.()?.currentStage;
21:src/theater/TheaterDirector.js:496:    const currentStage = currentState.currentStage ?? stageAtom?.getState?.()?.currentStage ?? null;
38:src/components/fragments/ClimaxSequenceController.jsx:10:  const currentStage = useAtomValue(stageAtom, (state) => state.currentStage);
43:src/orchestration/navigation/narrativeNavigation.js:35:  const currentStage = stageAtom.getState().currentStage;

---

## Pattern: stageIndex

### Class Properties (this.stageIndex):
(none)

### React State (useState):
(none)

### Atom Storage:
1:src/state/atoms/narrativeAtom.js:144:  setStage: stageIndex => {
2:src/state/atoms/narrativeAtom.js:145:    const stage = STAGE_ORDER[stageIndex] || STAGE_ORDER[0];
3:src/state/atoms/stageAtom.js:47:    stageIndex: INITIAL_STAGE_INDEX,
4:src/state/atoms/stageAtom.js:378:      const stageIndex = stageName != null ? STAGE_NAMES.indexOf(stageName) : -1;
5:src/state/atoms/stageAtom.js:380:      if (stageIndex === -1) {

---

## Pattern: phase

### Class Properties (this.phase):
5:src/theater/TheaterDirector.js:352:    this.phase = 'idle';
6:src/theater/TheaterDirector.js:380:      phase: this.phase,
7:src/theater/TheaterDirector.js:389:    if (this.phase === 'complete' && this.currentStage) {
8:src/theater/TheaterDirector.js:440:    this.phase = 'starting';
9:src/theater/TheaterDirector.js:466:      this.phase = 'error';

### React State (useState):
(none)

### Atom Storage:
(none)

---

## Pattern: morph

### Class Properties (this.morph):
1:src/theater/ScrollOrchestrator.js:40:    this.morph = 1;
2:src/theater/ScrollOrchestrator.js:92:      from: this.morph,
3:src/theater/ScrollOrchestrator.js:101:        this.morph = value;
5:src/theater/ScrollOrchestrator.js:318:        morph: this.morph,
6:src/theater/ScrollOrchestrator.js:354:      morph: this.morph,

### React State (useState):
(none)

### Atom Storage:
(none)

---

## Pattern: running

### Class Properties (this.running):
1:src/theater/controllers/OpeningSequenceController.js:63:    this.running = false;
3:src/theater/controllers/OpeningSequenceController.js:173:    if (!this.running) return;
4:src/theater/controllers/OpeningSequenceController.js:178:    this.running = false;
5:src/theater/controllers/OpeningSequenceController.js:189:    this.running = true;
6:src/theater/controllers/OpeningSequenceController.js:690:      this.running = false;

### React State (useState):
(none)

### Atom Storage:
(none)

---

## Pattern: cancelled

### Class Properties (this.cancelled):
1:src/theater/TheaterDirector.js:152:      if (this.skipRequested || this.cancelled) return;
2:src/theater/TheaterDirector.js:353:    this.cancelled = false;
3:src/theater/TheaterDirector.js:439:    this.cancelled = false;
5:src/theater/TheaterDirector.js:608:    this.cancelled = true;
8:src/theater/TheaterDirector.js:643:    if (this.cancelled) return Promise.resolve('cancelled');

### React State (useState):
(none)

### Atom Storage:
(none)

---

## Pattern: skipRequested

### Class Properties (this.skipRequested):
1:src/theater/TheaterDirector.js:152:      if (this.skipRequested || this.cancelled) return;
2:src/theater/TheaterDirector.js:284:    if (this.skipRequested) return;
3:src/theater/TheaterDirector.js:285:    this.skipRequested = true;
4:src/theater/TheaterDirector.js:361:    this.skipRequested = false;
5:src/theater/TheaterDirector.js:644:    if (this.skipRequested) return Promise.resolve('skipped');

### React State (useState):
(none)

### Atom Storage:
(none)

---


## Part 2: Access Patterns

### Read Patterns
# State Read Access Patterns
Generated: Fri Oct 31 09:51:05 CDT 2025

## Variable: currentStage

### Direct Reads (this.currentStage, state.currentStage):
src/engine/ConsciousnessEngine.js:87:        getCurrentStage: () => this.currentStage,
src/engine/ConsciousnessEngine.js:258:    const stageKey = stage || this.currentStage || 'genesis';
src/engine/ConsciousnessEngine.js:331:    this.buildAndEmitBlueprint(this.currentStage, tier);
src/engine/ConsciousnessEngine.js:1299:      currentStage: this.currentStage,
src/theater/TheaterDirector.js:106:      if (targetStage === 'genesis' && this.currentStage) {
src/theater/TheaterDirector.js:111:        if (!isOpeningHandoff && !isManualJump && this.currentStage !== 'genesis') {
src/theater/TheaterDirector.js:113:            currentStage: this.currentStage,
src/theater/TheaterDirector.js:224:    const previousStage = this.currentStage;
src/theater/TheaterDirector.js:389:    if (this.phase === 'complete' && this.currentStage) {
src/theater/TheaterDirector.js:392:          currentStage: this.currentStage,
src/theater/TheaterDirector.js:731:      currentStage: this.currentStage,
src/components/fragments/ClimaxSequenceController.jsx:10:  const currentStage = useAtomValue(stageAtom, (state) => state.currentStage);
src/components/consciousness/ConsciousnessTheater.jsx:135:  const currentStage = useAtomValue(stageAtom, (state) => state.currentStage);
src/components/fragments/AmbientFragmentManager.jsx:10:  const currentStage = useAtomValue(stageAtom, (state) => state.currentStage);
src/components/ui/narrative/StageNavigation.jsx:20:  const currentStage = useAtomValue(stageAtom, state => state.currentStage);
src/components/narrative/NarrationController.jsx:80:  const currentStage = useAtomValue(stageAtom, (state) => state.currentStage);
src/bootstrap/wireSSTv3.js:54:            stage: state.currentStage,
src/bootstrap/wireSSTv3.js:86:      newStage: state.currentStage,
src/bootstrap/wireSSTv3.js:92:    if (stageAtom && state.currentStage !== stageAtom.getState().currentStage) {
src/bootstrap/wireSSTv3.js:94:      // stageAtom.jumpToStage(state.currentStage);
src/state/atoms/qualityAtom.js:187:      const particleCount = cache.getParticleCount(state.currentStage, tier);
src/state/atoms/qualityAtom.js:259:      const particleCount = cache.getParticleCount(state.currentStage, recommendedTier);
src/state/atoms/stageAtom.js:496:      if (stageName !== state.currentStage) {
src/state/atoms/stageAtom.js:574:        currentStage: state.currentStage,
src/state/atoms/narrativeAtom.js:217:    const currentFeatures = state.stageFeatures[state.currentStage] || [];
src/state/atoms/narrativeAtom.js:223:    return state.stageFeatures[state.currentStage] || [];
src/state/atoms/narrativeAtom.js:241:          detail: { type: eventName, stage: state.currentStage },
src/state/atoms/narrativeAtom.js:286:      currentStage: state.currentStage,
src/state/atoms/narrativeAtom.js:293:      features: state.stageFeatures[state.currentStage] || [],

### Atom Reads:
src/orchestration/navigation/narrativeNavigation.js:35:  const currentStage = stageAtom.getState().currentStage;
src/components/fragments/AmbientFragmentManager.jsx:10:  const currentStage = useAtomValue(stageAtom, (state) => state.currentStage);
src/components/narrative/NarrationController.jsx:80:  const currentStage = useAtomValue(stageAtom, (state) => state.currentStage);
src/components/consciousness/ConsciousnessTheater.jsx:135:  const currentStage = useAtomValue(stageAtom, (state) => state.currentStage);
src/components/ui/narrative/StageNavigation.jsx:20:  const currentStage = useAtomValue(stageAtom, state => state.currentStage);
src/bootstrap/wireSSTv3.js:92:    if (stageAtom && state.currentStage !== stageAtom.getState().currentStage) {
src/state/atoms/stageAtom.js:672:    getCurrentStage: () => stageAtom.getState().currentStage,
src/components/fragments/ClimaxSequenceController.jsx:10:  const currentStage = useAtomValue(stageAtom, (state) => state.currentStage);

### Conditional Checks (if/while):
src/theater/UnifiedNavigationAPI.js:75:      if (currentStage !== targetStage) {
src/theater/UnifiedNavigationAPI.js:123:      if (currentStage !== targetStage) {
src/theater/TheaterDirector.js:106:      if (targetStage === 'genesis' && this.currentStage) {
src/theater/TheaterDirector.js:111:        if (!isOpeningHandoff && !isManualJump && this.currentStage !== 'genesis') {
src/theater/TheaterDirector.js:389:    if (this.phase === 'complete' && this.currentStage) {
src/theater/TheaterDirector.js:496:    const currentStage = currentState.currentStage ?? stageAtom?.getState?.()?.currentStage ?? null;
src/engine/modules/ClimaxController.js:74:    if (this.#engine.currentStage !== 'transcendence') {
src/orchestration/navigation/narrativeNavigation.js:36:  if (currentStage === stageName) return true;
src/orchestration/navigation/narrativeNavigation.js:110:  if (!nextStageName || nextStageName === info.currentStage) return false;
src/orchestration/navigation/narrativeNavigation.js:132:  if (!prevStageName || prevStageName === info.currentStage) return false;
src/components/fragments/ClimaxSequenceController.jsx:32:    if (currentStage !== CLIMAX_STAGE) {
src/components/fragments/ClimaxSequenceController.jsx:69:  if (currentStage !== CLIMAX_STAGE) return null;
src/components/fragments/AmbientFragment.jsx:50:      if (currentStage !== stage) return;
src/components/narrative/NarrationController.jsx:982:    if (!currentStage) return;
src/components/narrative/NarrationController.jsx:996:      activeStageRef.current && activeStageRef.current === currentStage;
src/components/narrative/NarrationController.jsx:1014:    if (startedStagesRef.current.has(currentStage)) {
src/bootstrap/wireSSTv3.js:92:    if (stageAtom && state.currentStage !== stageAtom.getState().currentStage) {
src/components/ui/narrative/MemoryFragments.jsx:189:            {activeFragment.isExplored ? '✓ Explored' : 'Click to explore'} • Stage: {currentStage}
src/components/consciousness/ConsciousnessTheater.jsx:163:    if (!currentStage) return;
src/state/atoms/narrativeAtom.js:84:    if (stage === currentState.currentStage) return;

---

## Variable: phase

### Direct Reads (this.phase, state.phase):
src/theater/TheaterDirector.js:380:      phase: this.phase,
src/theater/TheaterDirector.js:472:      if (this.phase !== 'cancelled' && this.phase !== 'error') {
src/theater/TheaterDirector.js:601:        console.warn('🎬 Director: WARNING - Cancelling during early phase:', this.phase);
src/theater/TheaterDirector.js:607:    console.log('🎬 Director: Cancelling show at phase:', this.phase);
src/theater/TheaterDirector.js:725:      phase: this.phase,

### Atom Reads:
(none)

### Conditional Checks (if/while):
src/theater/TheaterDirector.js:389:    if (this.phase === 'complete' && this.currentStage) {
src/theater/TheaterDirector.js:472:      if (this.phase !== 'cancelled' && this.phase !== 'error') {
src/theater/TheaterDirector.js:600:      if (this.phase === 'black' || this.phase === 'cursor' || this.phase === 'terminal') {
src/theater/TheaterDirector.js:756:  if (director.hasRun || director.isRunning || director.phase === 'complete') {
src/theater/TheaterDirector.js:828:      if (!director.hasRun && !director.isRunning && director.phase !== 'complete') {
src/theater/TheaterDirector.js:843:      if (!director.hasRun && !director.isRunning && !director.viewportReady && director.phase !== 'complete') {
src/engine/modules/ClimaxController.js:264:    if (state.phase === 'transition') {
src/engine/modules/ClimaxController.js:284:    } else if (state.phase === 'postHold') {
src/engine/modules/MorphController.js:74:      return Number.isFinite(raw) && raw > 0 ? raw : this.#phaseDurations.implosion;
src/engine/modules/MorphController.js:78:      return Number.isFinite(raw) && raw >= 0 ? raw : this.#phaseDurations.settle;
src/engine/modules/MorphController.js:211:    const inImplosion = implMs > 0 ? phaseElapsed < implMs : false;
src/engine/modules/MorphController.js:212:    const implPhase = implMs > 0 ? clamp(phaseElapsed / implMs, 0, 1) : 1;
src/engine/modules/MorphController.js:225:    if (phaseElapsed >= implMs + settleMs) {
src/components/theater/OpeningSequence.jsx:225:  if (phase === 'complete') {
src/components/webgl/WebGLBackground.jsx:1522:        const currentPhase = director?.getCurrentPhase?.() ?? director?.phase ?? null;

---

## Variable: morph

### Direct Reads (this.morph, state.morph):
src/theater/TheaterDirector.js:101:    this.morphAnimator = new MorphAnimationController();
src/theater/TheaterDirector.js:289:    this.morphAnimator?.cancelAll?.();
src/theater/TheaterDirector.js:351:    this.morphAnimator?.cancelAll?.();
src/theater/TheaterDirector.js:577:    this.morphAnimator?.destroy?.();
src/theater/TheaterDirector.js:613:    this.morphAnimator?.cancelAll?.();
src/theater/ScrollOrchestrator.js:41:    this.morphTarget = 1;
src/theater/ScrollOrchestrator.js:43:    this.morphAnimator = new MorphAnimationController();
src/theater/ScrollOrchestrator.js:44:    this.morphAnimationId = null;
src/theater/ScrollOrchestrator.js:84:    if (this.morphAnimationId) {
src/theater/ScrollOrchestrator.js:85:      this.morphAnimator.cancel(this.morphAnimationId);
src/theater/ScrollOrchestrator.js:86:      this.morphAnimationId = null;
src/theater/ScrollOrchestrator.js:90:    const animation = this.morphAnimator.animate({
src/theater/ScrollOrchestrator.js:92:      from: this.morph,
src/theater/ScrollOrchestrator.js:93:      to: this.morphTarget,
src/theater/ScrollOrchestrator.js:114:          const morphTarget = clamp01(this.morphTarget);
src/theater/ScrollOrchestrator.js:128:    this.morphAnimationId = animation?.animationId ?? null;
src/theater/ScrollOrchestrator.js:149:    if (this.morphAnimationId) {
src/theater/ScrollOrchestrator.js:150:      this.morphAnimator.cancel(this.morphAnimationId);
src/theater/ScrollOrchestrator.js:151:      this.morphAnimationId = null;
src/theater/ScrollOrchestrator.js:153:    this.morphAnimator.cancelAll();
src/components/consciousness/ConsciousnessTheater.jsx:137:  const morphProgress = useAtomValue(narrativeAtom, (state) => state.morphProgress);
src/state/atoms/narrativeAtom.js:290:        morph: state.morphProgress,

### Atom Reads:
src/components/consciousness/ConsciousnessTheater.jsx:137:  const morphProgress = useAtomValue(narrativeAtom, (state) => state.morphProgress);

### Conditional Checks (if/while):
src/theater/controllers/OpeningSequenceController.js:445:        const chaosTarget = Number.isFinite(chaosConfig.morphTo) ? clamp01(chaosConfig.morphTo) : 0.0;
src/theater/controllers/OpeningSequenceController.js:469:          morphTarget: typeof coalesceConfig.morphTo === 'number' ? coalesceConfig.morphTo : null,
src/theater/controllers/OpeningSequenceController.js:472:        const coalesceTarget = hasCoalesceTarget ? clamp01(coalesceConfig.morphTo) : currentMorphValue;
src/theater/controllers/OpeningSequenceController.js:501:          morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
src/theater/controllers/OpeningSequenceController.js:504:        const settleTarget = hasSettleTarget ? clamp01(settleConfig.morphTo) : currentMorphValue;
src/theater/ScrollOrchestrator.js:84:    if (this.morphAnimationId) {
src/theater/ScrollOrchestrator.js:149:    if (this.morphAnimationId) {
src/theater/ScrollOrchestrator.js:306:      if (this.morphAnimationId) {
src/theater/ScrollOrchestrator.js:371:    if (this.morphAnimationId) {
src/theater/ScrollOrchestrator.js:378:    if (this.morphAnimationId) {
src/engine/ConsciousnessEngine.js:454:    if (!this.#morphController) {
src/engine/ConsciousnessEngine.js:1228:    if (this.#morphController && typeof this.#morphController.isActive === 'function') {
src/engine/ConsciousnessEngine.js:1235:    if (this.#morphController && typeof this.#morphController.getCurrentPhase === 'function') {
src/engine/ConsciousnessEngine.js:1318:    if (this.#morphController) {
src/components/consciousness/ConsciousnessTheater.jsx:337:        const current = typeof morphProgressRef.current === 'number' ? morphProgressRef.current : 0;
src/state/commands/StateCommands.js:177:    if (morphSub) this.subscriptions.push(morphSub);
src/components/webgl/WebGLBackground.jsx:723:    else if (u.morphProgress) u.morphProgress.value = v;
src/components/webgl/WebGLBackground.jsx:725:    else if (u.morph) u.morph.value = v;
src/components/webgl/WebGLBackground.jsx:806:      if (morphProbeTimer) {
src/components/webgl/WebGLBackground.jsx:824:      if (morphProbeTimer) clearInterval(morphProbeTimer);

---

## Variable: running

### Direct Reads (this.running, state.running):
src/theater/controllers/OpeningSequenceController.js:173:    if (!this.running) return;
src/theater/ScrollOrchestrator.js:60:    if (this.running) return;
src/theater/ScrollOrchestrator.js:137:    if (!this.running) return;
src/theater/ScrollOrchestrator.js:353:      running: this.running,

### Atom Reads:
(none)

### Conditional Checks (if/while):
src/theater/controllers/MorphAnimationController.js:125:      // Start RAF loop if not already running
src/theater/ScrollOrchestrator.js:60:    if (this.running) return;
src/theater/ScrollOrchestrator.js:137:    if (!this.running) return;
src/theater/controllers/OpeningSequenceController.js:173:    if (!this.running) return;
src/App.jsx:35:    // Start the clock atom if not already running

---

## Variable: cancelled

### Direct Reads (this.cancelled, state.cancelled):
src/theater/TheaterDirector.js:152:      if (this.skipRequested || this.cancelled) return;
src/theater/TheaterDirector.js:643:    if (this.cancelled) return Promise.resolve('cancelled');
src/theater/TheaterDirector.js:727:      cancelled: this.cancelled,
src/theater/controllers/OpeningSequenceController.js:297:      if (result === 'cancelled' || this.director.cancelled || this.cancelled) return 'cancelled';
src/theater/controllers/OpeningSequenceController.js:314:        skipSignal: () => skipTriggered || this.director.skipRequested || this.skipRequested || this.cancelled,
src/theater/controllers/OpeningSequenceController.js:624:        if (this.director.cancelled || this.cancelled) return;

### Atom Reads:
(none)

### Conditional Checks (if/while):
src/components/webgl/WebGLCanvas.jsx:175:        if (!cancelled) {
src/components/narrative/overlay/OverlayStateMachine.js:28:    STATES.HIDING, // Can hide if cancelled immediately
src/theater/TheaterDirector.js:152:      if (this.skipRequested || this.cancelled) return;
src/theater/TheaterDirector.js:472:      if (this.phase !== 'cancelled' && this.phase !== 'error') {
src/theater/TheaterDirector.js:643:    if (this.cancelled) return Promise.resolve('cancelled');
src/theater/controllers/OpeningSequenceController.js:297:      if (result === 'cancelled' || this.director.cancelled || this.cancelled) return 'cancelled';
src/theater/controllers/OpeningSequenceController.js:322:        if (handleWaitResult(waitResult) === 'cancelled') return;
src/theater/controllers/OpeningSequenceController.js:335:          if (handleWaitResult(waitResult) === 'cancelled') return;
src/theater/controllers/OpeningSequenceController.js:341:            if (handleWaitResult(waitResult) === 'cancelled') return;
src/theater/controllers/OpeningSequenceController.js:352:          if (handleWaitResult(waitResult) === 'cancelled') return;
src/theater/controllers/OpeningSequenceController.js:356:          if (handleWaitResult(waitResult) === 'cancelled') return;
src/theater/controllers/OpeningSequenceController.js:366:          if (handleWaitResult(waitResult) === 'cancelled') return;
src/theater/controllers/OpeningSequenceController.js:398:            if (handleWaitResult(waitResult) === 'cancelled') return;
src/theater/controllers/OpeningSequenceController.js:449:          if (handleWaitResult(waitResult) === 'cancelled') return;
src/theater/controllers/OpeningSequenceController.js:481:          if (handleWaitResult(waitResult) === 'cancelled') return;
src/theater/controllers/OpeningSequenceController.js:513:          if (handleWaitResult(waitResult) === 'cancelled') return;
src/theater/controllers/OpeningSequenceController.js:624:        if (this.director.cancelled || this.cancelled) return;
src/theater/controllers/OpeningSequenceController.js:629:        if (handleWaitResult(waitResult) === 'cancelled') return;

---

## Variable: skipRequested

### Direct Reads (this.skipRequested, state.skipRequested):
src/theater/TheaterDirector.js:152:      if (this.skipRequested || this.cancelled) return;
src/theater/TheaterDirector.js:284:    if (this.skipRequested) return;
src/theater/TheaterDirector.js:644:    if (this.skipRequested) return Promise.resolve('skipped');
src/theater/controllers/OpeningSequenceController.js:161:    if (this.skipRequested) return;
src/theater/controllers/OpeningSequenceController.js:298:      if (result === 'skipped' || this.director.skipRequested || this.skipRequested) skipTriggered = true;
src/theater/controllers/OpeningSequenceController.js:314:        skipSignal: () => skipTriggered || this.director.skipRequested || this.skipRequested || this.cancelled,

### Atom Reads:
(none)

### Conditional Checks (if/while):
src/theater/TheaterDirector.js:152:      if (this.skipRequested || this.cancelled) return;
src/theater/TheaterDirector.js:284:    if (this.skipRequested) return;
src/theater/TheaterDirector.js:644:    if (this.skipRequested) return Promise.resolve('skipped');
src/theater/controllers/OpeningSequenceController.js:161:    if (this.skipRequested) return;
src/theater/controllers/OpeningSequenceController.js:298:      if (result === 'skipped' || this.director.skipRequested || this.skipRequested) skipTriggered = true;
src/components/narrative/NarrationController.jsx:443:        if (skipRequestedRef.current || activeStageRef.current !== stageName) return;
src/components/narrative/NarrationController.jsx:955:      if (!activeStageRef.current || skipRequestedRef.current) return;

---

## Variable: isTransitioning

### Direct Reads (this.isTransitioning, state.isTransitioning):
src/bootstrap/wireSSTv3.js:56:            isTransitioning: state.isTransitioning,
src/state/atoms/stageAtom.js:580:        isTransitioning: state.isTransitioning,

### Atom Reads:
(none)

### Conditional Checks (if/while):
src/components/ui/NarrativeUIControls.jsx:87:                  if (!isActive && !navState.isTransitioning) {
src/components/ui/NarrativeUIControls.jsx:139:              cursor: navState.canGoPrev && !navState.isTransitioning ? 'pointer' : 'not-allowed',
src/components/ui/NarrativeUIControls.jsx:140:              opacity: navState.canGoPrev && !navState.isTransitioning ? 1 : 0.3,
src/components/ui/NarrativeUIControls.jsx:166:              cursor: navState.canGoNext && !navState.isTransitioning ? 'pointer' : 'not-allowed',
src/components/ui/NarrativeUIControls.jsx:167:              opacity: navState.canGoNext && !navState.isTransitioning ? 1 : 0.3,
src/components/ui/NarrativeUIControls.jsx:202:        {navState.isTransitioning && 'Transitioning...'}

---


### Write Patterns
# State Write Access Patterns
Generated: Fri Oct 31 09:51:46 CDT 2025

## Variable: currentStage

### Direct Writes (this.currentStage =, state.currentStage =):
src/theater/UnifiedNavigationAPI.js:20:    this.currentStage = null;
src/engine/ConsciousnessEngine.js:107:    this.currentStage = 'genesis';
src/engine/ConsciousnessEngine.js:313:    this.currentStage = stage;
src/theater/TheaterDirector.js:246:    this.currentStage = newStage;
src/theater/TheaterDirector.js:360:    this.currentStage = null;

### React setState:
src/state/commands/StateCommands.js:305:    stageAtom.setState?.({ currentStage: to, transitioning: true });

### Atom Writes (atom.setX, atom.X()):
(none)

### Method Calls (may modify state):
(none)

---

## Variable: phase

### Direct Writes (this.phase =, state.phase =):
src/theater/TheaterDirector.js:352:    this.phase = 'idle';
src/theater/TheaterDirector.js:389:    if (this.phase === 'complete' && this.currentStage) {
src/theater/TheaterDirector.js:440:    this.phase = 'starting';
src/theater/TheaterDirector.js:466:      this.phase = 'error';
src/theater/TheaterDirector.js:600:      if (this.phase === 'black' || this.phase === 'cursor' || this.phase === 'terminal') {
src/theater/TheaterDirector.js:610:    this.phase = 'cancelled';
src/engine/modules/ClimaxController.js:193:    state.phase = 'transition';
src/engine/modules/ClimaxController.js:264:    if (state.phase === 'transition') {
src/engine/modules/ClimaxController.js:275:          state.phase = 'postHold';
src/engine/modules/ClimaxController.js:284:    } else if (state.phase === 'postHold') {

### React setState:
(none)

### Atom Writes (atom.setX, atom.X()):
(none)

### Method Calls (may modify state):
(none)

---

## Variable: morph

### Direct Writes (this.morph =, state.morph =):
src/theater/ScrollOrchestrator.js:40:    this.morph = 1;
src/theater/ScrollOrchestrator.js:101:        this.morph = value;
src/theater/ScrollOrchestrator.js:368:    this.morph = clamp01(value);
src/theater/ScrollOrchestrator.js:383:    this.morph = 1;

### React setState:
src/state/commands/StateCommands.js:203:    narrativeAtom.setMorphProgress?.(morph);

### Atom Writes (atom.setX, atom.X()):
(none)

### Method Calls (may modify state):
(none)

---

## Variable: running

### Direct Writes (this.running =, state.running =):
src/theater/controllers/OpeningSequenceController.js:63:    this.running = false;
src/theater/controllers/OpeningSequenceController.js:178:    this.running = false;
src/theater/controllers/OpeningSequenceController.js:189:    this.running = true;
src/theater/controllers/OpeningSequenceController.js:690:      this.running = false;
src/theater/ScrollOrchestrator.js:38:    this.running = false;
src/theater/ScrollOrchestrator.js:61:    this.running = true;
src/theater/ScrollOrchestrator.js:138:    this.running = false;

### React setState:
(none)

### Atom Writes (atom.setX, atom.X()):
(none)

### Method Calls (may modify state):
(none)

---

## Variable: cancelled

### Direct Writes (this.cancelled =, state.cancelled =):
src/theater/TheaterDirector.js:353:    this.cancelled = false;
src/theater/TheaterDirector.js:439:    this.cancelled = false;
src/theater/TheaterDirector.js:608:    this.cancelled = true;
src/theater/controllers/OpeningSequenceController.js:64:    this.cancelled = false;
src/theater/controllers/OpeningSequenceController.js:177:    this.cancelled = true;
src/theater/controllers/OpeningSequenceController.js:190:    this.cancelled = false;

### React setState:
(none)

### Atom Writes (atom.setX, atom.X()):
(none)

### Method Calls (may modify state):
(none)

---

## Variable: skipRequested

### Direct Writes (this.skipRequested =, state.skipRequested =):
src/theater/TheaterDirector.js:285:    this.skipRequested = true;
src/theater/TheaterDirector.js:361:    this.skipRequested = false;
src/theater/controllers/OpeningSequenceController.js:65:    this.skipRequested = false;
src/theater/controllers/OpeningSequenceController.js:162:    this.skipRequested = true;
src/theater/controllers/OpeningSequenceController.js:191:    this.skipRequested = false;

### React setState:
(none)

### Atom Writes (atom.setX, atom.X()):
(none)

### Method Calls (may modify state):
(none)

---

## Variable: isTransitioning

### Direct Writes (this.isTransitioning =, state.isTransitioning =):
(none)

### React setState:
src/state/atoms/stageAtom.js:504:    setTransitioning: (isTransitioning) => {

### Atom Writes (atom.setX, atom.X()):
(none)

### Method Calls (may modify state):
(none)

---


## Part 3: Dependencies

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

## Part 4: Event Topology

# Enhanced BeatBus Event Map (State-Focused)
Generated: 2025-10-31T14:55:10.377Z

## State-Related Events

Found 5 state-related events:

### EVENTS.FENCEPOST_LISTENERS_READY

**Emitters (1):**
- `src/theater/controllers/OpeningSequenceController.js:575` (token: `EVENTS.FENCEPOST_LISTENERS_READY`)

---

### EVENTS.MORPH_PROGRESS

**Emitters (4):**
- `src/engine/modules/ClimaxController.js:249` (token: `EVENTS.MORPH_PROGRESS`)
- `src/engine/modules/MorphController.js:273` (token: `EVENTS.MORPH_PROGRESS`)
- `src/state/commands/StateCommands.js:44` (token: `EVENTS.MORPH_PROGRESS`)
- `src/theater/controllers/MorphAnimationController.js:332` (token: `EVENTS.MORPH_PROGRESS`)

**Listeners (1):**
- `src/components/webgl/WebGLBackground.jsx:1668` (token: `EVENTS.MORPH_PROGRESS`)

---

### EVENTS.QUALITY_CHANGE

**Emitters (2):**
- `src/state/atoms/qualityAtom.js:198` (token: `EVENTS.QUALITY_CHANGE`)
- `src/state/commands/StateCommands.js:188` (token: `EVENTS.QUALITY_CHANGE`)

---

### EVENTS.STAGE_CHANGE

**Emitters (2):**
- `src/state/commands/StateCommands.js:151` (token: `EVENTS.STAGE_CHANGE`)
- `src/theater/controllers/OpeningSequenceController.js:637` (token: `EVENTS.STAGE_CHANGE`)

**Listeners (2):**
- `src/state/atoms/qualityAtom.js:155` (token: `EVENTS.STAGE_CHANGE`)
- `src/theater/TheaterDirector.js:127` (token: `EVENTS.STAGE_CHANGE`)

---

### STAGE_CHANGE

**Listeners (1):**
- `src/theater/UnifiedNavigationAPI.js:192` (token: `'STAGE_CHANGE'`)

---


## Part 5: Risk Analysis

### Race Conditions
# Race Condition Analysis
Generated: Fri Oct 31 10:01:53 CDT 2025

## Potential Race Conditions

### Pattern 1: Multiple Writers Without Coordination

Looking for state variables written from multiple locations...

#### Variable: currentStage
⚠️  **3 writers found** - Potential race condition!
- src/theater/UnifiedNavigationAPI.js:20:    this.currentStage = null;
- src/theater/TheaterDirector.js:246:    this.currentStage = newStage;
- src/theater/TheaterDirector.js:360:    this.currentStage = null;
- src/engine/ConsciousnessEngine.js:107:    this.currentStage = 'genesis';
- src/engine/ConsciousnessEngine.js:313:    this.currentStage = stage;

#### Variable: phase
✅ 1 writers (low risk)

#### Variable: morph
✅ 1 writers (low risk)

#### Variable: running
✅ 2 writers (low risk)

#### Variable: cancelled
✅ 2 writers (low risk)

### Pattern 2: Read-Before-Write Without Lock

Looking for if(state.x) state.x = y patterns...

--
src/theater/TheaterDirector.js:389:    if (this.phase === 'complete' && this.currentStage) {
--
--
src/theater/TheaterDirector.js:600:      if (this.phase === 'black' || this.phase === 'cursor' || this.phase === 'terminal') {
--
src/theater/ScrollOrchestrator.js:60:    if (this.running) return;
src/theater/ScrollOrchestrator.js-61-    this.running = true;
--
src/theater/ScrollOrchestrator.js:137:    if (!this.running) return;
src/theater/ScrollOrchestrator.js-138-    this.running = false;

### Pattern 3: Async State Updates

Looking for setTimeout/Promise with state mutations...


✅ Race condition analysis complete

### Stale Reads
# Stale Read Analysis
Generated: Fri Oct 31 10:02:05 CDT 2025

## Potential Stale Reads

### Pattern 1: Local Variable Caching

Looking for const x = this.state patterns that might go stale...

src/theater/TheaterDirector.js:224:    const previousStage = this.currentStage;
src/theater/ScrollOrchestrator.js:90:    const animation = this.morphAnimator.animate({
src/theater/ScrollOrchestrator.js:114:          const morphTarget = clamp01(this.morphTarget);
src/engine/ConsciousnessEngine.js:258:    const stageKey = stage || this.currentStage || 'genesis';

### Pattern 2: Callback Closures

Looking for callbacks that close over state...

src/engine/ConsciousnessEngine.js:87:        getCurrentStage: () => this.currentStage,

### Pattern 3: Event Handler Closures

Looking for event handlers with potentially stale state...


✅ Stale read analysis complete

### Drift Risks
# State Drift Risk Analysis
Generated: Fri Oct 31 10:03:28 CDT 2025

## Drift Risk Patterns

### Risk 1: Parallel State Storage

Same logical state stored in multiple places:

#### currentStage
- Class properties (theater): 10
- Atom references: 29
- Local variables: 20
⚠️  **HIGH DRIFT RISK** - 59 storage locations!

#### phase
- Class properties (theater): 11
- Atom references: 0
- Local variables: 1
⚠️  **HIGH DRIFT RISK** - 12 storage locations!

#### morph
- Class properties (theater): 40
- Atom references: 3
- Local variables: 11
⚠️  **HIGH DRIFT RISK** - 54 storage locations!

### Risk 2: Update Without Broadcast

State mutations not followed by BeatBus emission:

src/theater/UnifiedNavigationAPI.js:20:    this.currentStage = null;
src/theater/ScrollOrchestrator.js:40:    this.morph = 1;
src/theater/ScrollOrchestrator.js:101:        this.morph = value;
src/theater/ScrollOrchestrator.js:368:    this.morph = clamp01(value);
src/theater/ScrollOrchestrator.js:383:    this.morph = 1;
src/theater/TheaterDirector.js:246:    this.currentStage = newStage;
src/theater/TheaterDirector.js:352:    this.phase = 'idle';
src/theater/TheaterDirector.js:360:    this.currentStage = null;
src/theater/TheaterDirector.js:389:    if (this.phase === 'complete' && this.currentStage) {
src/theater/TheaterDirector.js:440:    this.phase = 'starting';
src/theater/TheaterDirector.js:466:      this.phase = 'error';
src/theater/TheaterDirector.js:600:      if (this.phase === 'black' || this.phase === 'cursor' || this.phase === 'terminal') {
src/theater/TheaterDirector.js:610:    this.phase = 'cancelled';

### Risk 3: Conditional Updates

State updated only in certain conditions (may miss updates):

src/theater/TheaterDirector.js:389:    if (this.phase === 'complete' && this.currentStage) {
src/theater/TheaterDirector.js:600:      if (this.phase === 'black' || this.phase === 'cursor' || this.phase === 'terminal') {

✅ Drift risk analysis complete

## Part 6: Migration Impact

# Migration Impact Analysis
Generated: Fri Oct 31 10:04:26 CDT 2025

## Impact Scenarios

### Scenario 1: Remove Duplicate Stage Storage
Change: TheaterDirector, ScrollOrchestrator no longer store currentStage

- Files with stage references: 1
- Total references to update: 10

### Scenario 2: Remove Duplicate Morph Storage
Change: ScrollOrchestrator no longer stores morph

- Files with morph references: 1
- Total references to update: 40

### Scenario 3: Create StateBridge Facade
Change: Add StateBridge that wraps atoms + theater state

- New file: src/state/StateBridge.js (~200 lines)
- Files importing StateCommands: 4
- Files importing stageAtom directly: 14

## Impact Summary

- Total theater state references: 71
- Total atom imports: 27
- Estimated LOC to modify: 35
- Files requiring changes: 5

✅ Impact analysis complete

## Part 7: Breaking Changes

# Breaking Change Assessment
Generated: Fri Oct 31 10:04:47 CDT 2025

## Public API Impact

### Window Globals (Dev Tools)

Globals that might break:
- src/state/atoms/stageAtom.js:740
- src/state/atoms/stageAtom.js:743
- src/state/atoms/stageAtom.js:747
- src/state/atoms/stageAtom.js:748
- src/state/atoms/stageAtom.js:749
- src/state/atoms/stageAtom.js:750
- src/theater/TheaterDirector.js:513
- src/theater/TheaterDirector.js:515
- src/theater/TheaterDirector.js:516
- src/theater/TheaterDirector.js:517
- src/theater/TheaterDirector.js:523
- src/theater/UnifiedNavigationAPI.js:102
- src/theater/UnifiedNavigationAPI.js:103
- src/theater/UnifiedNavigationAPI.js:185

### Component Props

Components expecting state props:

### BeatBus Event Contracts

Events that might change payload:
src/theater/controllers/OpeningSequenceController.js:637:      BeatBus.emit(EVENTS.STAGE_CHANGE, {
src/theater/ScrollOrchestrator.js:116:          BeatBus.emit?.(EVENTS.MORPH_PROGRESS, {
src/theater/ScrollOrchestrator.js:332:        BeatBus.emit?.(EVENTS.STAGE_CHANGE, { 
src/theater/controllers/MorphAnimationController.js:332:    BeatBus.emit(EVENTS.MORPH_PROGRESS, payload);
src/engine/modules/ClimaxController.js:249:    BeatBus.emit(EVENTS.MORPH_PROGRESS, morphPayload);
src/engine/modules/MorphController.js:273:    BeatBus.emit(EVENTS.MORPH_PROGRESS, payload);
src/state/commands/StateCommands.js:44:    BeatBus.emit(EVENTS.MORPH_PROGRESS || 'MORPH_PROGRESS', payload);
src/state/commands/StateCommands.js:151:        BeatBus.emit(EVENTS.STAGE_CHANGE, { 
src/state/commands/StateCommands.js:188:        BeatBus.emit(EVENTS.QUALITY_CHANGE, { 
src/state/atoms/qualityAtom.js:198:      BeatBus.emit(EVENTS.QUALITY_CHANGE, { 

✅ Breaking change assessment complete

## Recommendations

Based on evidence analysis:

### Critical Findings
1. **Duplicate Storage Locations:** [TO BE FILLED FROM EVIDENCE]
2. **Race Condition Risks:** [TO BE FILLED FROM EVIDENCE]
3. **Migration Impact Radius:** [TO BE FILLED FROM EVIDENCE]

### Recommended Strategy
[TO BE DETERMINED AFTER EVIDENCE REVIEW]

### Risk Mitigation
[TO BE DETERMINED AFTER EVIDENCE REVIEW]

### Implementation Order
[TO BE DETERMINED AFTER EVIDENCE REVIEW]

---

**Report Status:** EVIDENCE COMPLETE - AWAITING HUMAN ANALYSIS
**Next Step:** Review evidence, determine strategy, create implementation plan

✅ Master report generated: reports/master_state_analysis_20251031_100636.md

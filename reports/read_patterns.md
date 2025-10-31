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


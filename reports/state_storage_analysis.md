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


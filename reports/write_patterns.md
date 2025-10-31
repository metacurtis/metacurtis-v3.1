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


# State Flow Tracing
Generated: Fri Oct 31 09:54:11 CDT 2025

## Flow: currentStage

### Writers (who sets currentStage):
- theater/UnifiedNavigationAPI.js (theater)
- theater/TheaterDirector.js (theater)
- engine/ConsciousnessEngine.js (engine)
- components/consciousness/ConsciousnessTheater.jsx (consciousness)
- state/commands/StateCommands.js (commands)

### Readers (who reads currentStage):
- hooks/atoms/useNarrativeStore.js (atoms)
- hooks/useAtom.js (hooks)
- theater/UnifiedNavigationAPI.js (theater)
- engine/ConsciousnessEngine.js (engine)
- theater/TheaterDirector.js (theater)
- components/fragments/ClimaxSequenceController.jsx (fragments)
- components/consciousness/ConsciousnessTheater.jsx (consciousness)
- components/fragments/AmbientFragmentManager.jsx (fragments)
- components/ui/narrative/StageNavigation.jsx (narrative)
- components/narrative/NarrationController.jsx (narrative)
- state/atoms/createAtom.js (atoms)
- state/atoms/index.js (atoms)

### BeatBus Events (involving currentStage):
src/theater/UnifiedNavigationAPI.js:192:    return BeatBus.on('STAGE_CHANGE', callback);
src/theater/events.js:26:  MORPH_PROGRESS: 'MORPH_PROGRESS',              // { value: 0..1 }
src/theater/events.js:33:  STAGE_CHANGE: 'STAGE_CHANGE',                  // { from, to } (canonical)
src/theater/TheaterDirector.js:127:      this._stageChangeUnsubscribe = BeatBus.on(EVENTS.STAGE_CHANGE, this._handleStageChangeBound);
src/theater/TheaterDirector.js:870:    STAGE_CHANGE: {
src/theater/TheaterDirector.js:890:    STAGE_CHANGE: { stage: 'deprecated' },
src/theater/bus/schemas.js:15:  ['STAGE_CHANGE', {
src/theater/bus/schemas.js:35:  ['MORPH_PROGRESS', {
src/theater/controllers/OpeningSequenceController.js:637:      BeatBus.emit(EVENTS.STAGE_CHANGE, {
src/theater/events-safe.js:6:  STAGE_CHANGE: 'STAGE_CHANGE',

---

## Flow: phase

### Writers (who sets phase):
- theater/TheaterDirector.js (theater)

### Readers (who reads phase):
- hooks/atoms/useNarrativeStore.js (atoms)
- hooks/useAtom.js (hooks)
- theater/TheaterDirector.js (theater)
- components/narrative/NarrationController.jsx (narrative)
- components/consciousness/ConsciousnessTheater.jsx (consciousness)
- components/fragments/ClimaxSequenceController.jsx (fragments)
- components/fragments/AmbientFragmentManager.jsx (fragments)
- components/ui/narrative/StageNavigation.jsx (narrative)
- state/atoms/index.js (atoms)
- state/atoms/createAtom.js (atoms)

### BeatBus Events (involving phase):
src/theater/UnifiedNavigationAPI.js:192:    return BeatBus.on('STAGE_CHANGE', callback);
src/theater/events.js:26:  MORPH_PROGRESS: 'MORPH_PROGRESS',              // { value: 0..1 }
src/theater/events.js:33:  STAGE_CHANGE: 'STAGE_CHANGE',                  // { from, to } (canonical)
src/theater/TheaterDirector.js:127:      this._stageChangeUnsubscribe = BeatBus.on(EVENTS.STAGE_CHANGE, this._handleStageChangeBound);
src/theater/TheaterDirector.js:870:    STAGE_CHANGE: {
src/theater/TheaterDirector.js:890:    STAGE_CHANGE: { stage: 'deprecated' },
src/theater/events-safe.js:6:  STAGE_CHANGE: 'STAGE_CHANGE',
src/theater/events-safe.js:25:  MORPH_PROGRESS: 'MORPH_PROGRESS',
src/theater/controllers/OpeningSequenceController.js:637:      BeatBus.emit(EVENTS.STAGE_CHANGE, {
src/theater/controllers/MorphAnimationController.js:332:    BeatBus.emit(EVENTS.MORPH_PROGRESS, payload);

---

## Flow: morph

### Writers (who sets morph):
- theater/ScrollOrchestrator.js (theater)
- state/commands/StateCommands.js (commands)

### Readers (who reads morph):
- hooks/atoms/useNarrativeStore.js (atoms)
- hooks/useAtom.js (hooks)
- theater/TheaterDirector.js (theater)
- theater/ScrollOrchestrator.js (theater)
- components/consciousness/ConsciousnessTheater.jsx (consciousness)
- components/fragments/ClimaxSequenceController.jsx (fragments)
- components/fragments/AmbientFragmentManager.jsx (fragments)
- components/ui/narrative/StageNavigation.jsx (narrative)
- components/narrative/NarrationController.jsx (narrative)
- state/commands/StateCommands.js (commands)
- state/atoms/index.js (atoms)
- state/atoms/createAtom.js (atoms)

### BeatBus Events (involving morph):
src/theater/controllers/MorphAnimationController.js:332:    BeatBus.emit(EVENTS.MORPH_PROGRESS, payload);
src/theater/UnifiedNavigationAPI.js:192:    return BeatBus.on('STAGE_CHANGE', callback);
src/theater/events.js:26:  MORPH_PROGRESS: 'MORPH_PROGRESS',              // { value: 0..1 }
src/theater/events.js:33:  STAGE_CHANGE: 'STAGE_CHANGE',                  // { from, to } (canonical)
src/theater/controllers/OpeningSequenceController.js:637:      BeatBus.emit(EVENTS.STAGE_CHANGE, {
src/theater/bus/index.js:6:const BATCH_EVENTS = new Set(['MORPH_PROGRESS', 'SCROLL_PROGRESS']);
src/theater/bus/index.js:208:          STAGE_CHANGE: { required: ['from', 'to'] },
src/theater/bus/index.js:274:    if (evt==='STAGE_CHANGE'){
src/theater/bus/index.js:364:    if (evt==='STAGE_CHANGE' && canonPayloadWithBase?.to) this._last.stage = canonPayloadWithBase.to;
src/theater/ScrollOrchestrator.js:3:// Purpose: map window scroll -> stage-local progress; publish MORPH_PROGRESS and STAGE_CHANGE.

---

## Flow: running

### Writers (who sets running):
- theater/ScrollOrchestrator.js (theater)
- theater/controllers/OpeningSequenceController.js (controllers)

### Readers (who reads running):
- hooks/atoms/useNarrativeStore.js (atoms)
- hooks/useAtom.js (hooks)
- theater/ScrollOrchestrator.js (theater)
- theater/controllers/OpeningSequenceController.js (controllers)
- components/narrative/NarrationController.jsx (narrative)
- components/fragments/ClimaxSequenceController.jsx (fragments)
- components/consciousness/ConsciousnessTheater.jsx (consciousness)
- components/fragments/AmbientFragmentManager.jsx (fragments)
- components/ui/narrative/StageNavigation.jsx (narrative)
- state/atoms/createAtom.js (atoms)
- state/atoms/index.js (atoms)

### BeatBus Events (involving running):
src/theater/ScrollOrchestrator.js:3:// Purpose: map window scroll -> stage-local progress; publish MORPH_PROGRESS and STAGE_CHANGE.
src/theater/ScrollOrchestrator.js:116:          BeatBus.emit?.(EVENTS.MORPH_PROGRESS, {
src/theater/ScrollOrchestrator.js:332:        BeatBus.emit?.(EVENTS.STAGE_CHANGE, { 
src/theater/TheaterDirector.js:127:      this._stageChangeUnsubscribe = BeatBus.on(EVENTS.STAGE_CHANGE, this._handleStageChangeBound);
src/theater/TheaterDirector.js:870:    STAGE_CHANGE: {
src/theater/TheaterDirector.js:890:    STAGE_CHANGE: { stage: 'deprecated' },
src/theater/bus/schemas.js:15:  ['STAGE_CHANGE', {
src/theater/bus/schemas.js:35:  ['MORPH_PROGRESS', {
src/theater/events.js:26:  MORPH_PROGRESS: 'MORPH_PROGRESS',              // { value: 0..1 }
src/theater/events.js:33:  STAGE_CHANGE: 'STAGE_CHANGE',                  // { from, to } (canonical)

---


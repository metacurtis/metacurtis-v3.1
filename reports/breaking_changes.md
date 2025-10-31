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

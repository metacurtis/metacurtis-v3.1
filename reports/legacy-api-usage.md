# Legacy API Usage Report

## window.stageControls (mutations) (6 occurrences)

- src/components/narrative/NarrationController.jsx:213
  `const controls = window.stageControls;`

- src/components/narrative/NarrationController.jsx:235
  `const liveControls = window.stageControls;`

- src/state/atoms/stageAtom.js:743
  `window.stageControls = Object.assign({}, window.stageControls, baseControls);`

- src/state/atoms/stageAtom.js:747
  `console.log('🎮 Available: window.stageControls');`

- src/state/atoms/stageAtom.js:749
  `console.log('🧪 Test batching: window.stageControls.testBatching?.()');`

- src/theater/UnifiedNavigationAPI.js:189
  `return window.stageControls?.getCurrentStage?.() || 'genesis';`

## window.stageControls (read) (2 occurrences)

- src/state/atoms/stageAtom.js:748
  `console.log('📊 Stage info:', window.stageControls.getStageInfo?.());`

- src/state/atoms/stageAtom.js:751
  `console.log('📊 Performance: window.stageControls.getPerformanceMetrics?.()');`

## narrativeAtom bypasses (0 occurrences)

## START_NARRATIVE emits (1 occurrences)

- src/theater/TheaterDirector.js:271
  `BeatBus.emit(EVENTS.START_NARRATIVE, {`

## AUTO_ADVANCE refs (19 occurrences)

- src/components/narrative/NarrationController.jsx:215
  `controls?.isAutoAdvanceEnabled?.() ??`

- src/components/narrative/NarrationController.jsx:238
  `liveControls.isAutoAdvanceEnabled?.() ??`

- src/orchestration/navigation/narrativeNavigation.js:55
  `const current = stateCommands.isAutoAdvanceEnabled();`

- src/orchestration/navigation/narrativeNavigation.js:58
  `stateCommands.setAutoAdvanceEnabled(nextValue, { origin: 'narrative_navigation' });`

- src/state/atoms/stageAtom.js:509
  `setAutoAdvanceEnabled: (enabled) => {`

- src/state/atoms/stageAtom.js:518
  `isAutoAdvanceEnabled: () => {`

- src/state/atoms/stageAtom.js:684
  `setAutoAdvanceEnabled: (enabled) => stageAtom.setAutoAdvanceEnabled(Boolean(enabled)),`

- src/state/atoms/stageAtom.js:685
  `toggleAutoAdvance: () => stageAtom.setAutoAdvanceEnabled(!stageAtom.getState().autoAdvanceEnabled),`

- src/state/atoms/stageAtom.js:687
  `isAutoAdvanceEnabled: () => stageAtom.isAutoAdvanceEnabled(),`

- src/state/commands/StateCommands.js:330
  `setAutoAdvanceEnabled(enabled, { origin = 'stateCommands' } = {}) {`

- src/state/commands/StateCommands.js:331
  `if (typeof stageAtom?.setAutoAdvanceEnabled !== 'function') {`

- src/state/commands/StateCommands.js:335
  `stageAtom.setAutoAdvanceEnabled(Boolean(enabled));`

- src/state/commands/StateCommands.js:361
  `isAutoAdvanceEnabled() {`

- src/state/commands/StateCommands.js:363
  `stageAtom?.isAutoAdvanceEnabled?.() ??`

- src/theater/TheaterDirector.js:499
  `stageAtom?.isAutoAdvanceEnabled?.() ??`

- src/theater/TheaterDirector.js:512
  `stageAtom?.isAutoAdvanceEnabled?.() ??`

- src/theater/TheaterDirector.js:522
  `autoEnabled = stateCommands.setAutoAdvanceEnabled(true, {`

- src/theater/TheaterDirector.js:528
  `failureReason = 'stateCommands.setAutoAdvanceEnabled failed';`

- src/theater/TheaterDirector.js:534
  `stageAtom?.isAutoAdvanceEnabled?.() ??`

## stressTest calls (1 occurrences)

- src/state/atoms/stageAtom.js:750
  `console.log('🧪 Stress test: window.stageControls.stressTest?.(100)');`


**Total patterns found:** 29

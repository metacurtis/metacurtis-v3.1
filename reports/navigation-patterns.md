# Navigation Pattern Analysis

**Generated:** 2025-11-07T06:07:16.260Z
**Total Hits:** 336

## Summary by Category

| Category | Count |
|----------|-------|
| Entry Points | 38 |
| Narration Controls | 135 |
| Manual Controls | 6 |
| Orchestration | 2 |
| **Race Indicators** | **15** |

## Pattern Distribution

| Pattern | Count | Files |
|---------|-------|-------|
| JUMP_TO_STAGE | 10 | 5 |
| STAGE_ATOM_SET | 19 | 6 |
| FALLBACK_JUMP | 4 | 2 |
| NAVIGATE_TO_STAGE | 9 | 5 |
| NARRATION_START | 26 | 10 |
| ARROW_NAV | 6 | 1 |
| RAPID_FIRE | 5 | 3 |
| MORPH_PROGRESS | 45 | 15 |
| DEBOUNCE | 18 | 4 |
| AUTO_ADVANCE | 109 | 6 |
| DUPLICATE_EVENT | 6 | 4 |
| UNIFIED_NAV | 1 | 1 |
| SETTLE_TIME | 77 | 8 |
| SCROLL_ORCHESTRATOR | 1 | 1 |

## Detailed Hits by Pattern

### JUMP_TO_STAGE (10 hits)

**src/bootstrap/wireSSTv3.js:94**
```javascript
91:     // If stageAtom exists, sync with it
92:     if (stageAtom && state.currentStage !== stageAtom.getState().currentStage) {
93:       // DISABLED: This bypasses orchestration
94:       // stageAtom.jumpToStage(state.currentStage);
95:     }
96:   });
97:   unsubscribers.push(unsubscribeNarrative);
```

**src/orchestration/navigation/narrativeNavigation.js:97**
```javascript
94:       id: name,
95:       label,
96:       isActive: activeStage === name,
97:       onClick: () => jumpToStage(name, { smooth: true, emitNarration: true }),
98:       index,
99:     };
100:   });
```

**src/state/atoms/narrativeAtom.js:124**
```javascript
121:     const current = get().currentStage;
122:     const currentIndex = STAGE_ORDER.indexOf(current);
123:     if (currentIndex < STAGE_ORDER.length - 1) {
124:       narrativeAtom.jumpToStage(STAGE_ORDER[currentIndex + 1]);
125:     }
126:   },
127: 
```

**src/state/atoms/narrativeAtom.js:140**
```javascript
137:     const current = get().currentStage;
138:     const currentIndex = STAGE_ORDER.indexOf(current);
139:     if (currentIndex > 0) {
140:       narrativeAtom.jumpToStage(STAGE_ORDER[currentIndex - 1]);
141:     }
142:   },
143: 
```

**src/state/atoms/narrativeAtom.js:146**
```javascript
143: 
144:   setStage: stageIndex => {
145:     const stage = STAGE_ORDER[stageIndex] || STAGE_ORDER[0];
146:     narrativeAtom.jumpToStage(stage);
147:   },
148: 
149:   // ===== PROGRESS MANAGEMENT =====
```

**src/state/atoms/stageAtom.js:623**
```javascript
620:       if (import.meta.env.DEV) {
621:         const clampedIndex = Math.max(0, Math.min(index, STAGE_COUNT - 1));
622:         const stageName = STAGE_NAMES[clampedIndex];
623:         actions.jumpToStage(stageName);
624:       }
625:     },
626:     
```

**src/state/atoms/stageAtom.js:676**
```javascript
673:     getCurrentStageIndex: () => stageAtom.getState().stageIndex,
674: 
675:     // Navigation helpers
676:     jumpToStage: (stage) => stageAtom.jumpToStage(stage),
677:     jumpTo: (stage) => stageAtom.jumpToStage(stage), // legacy alias
678:     next: () => stageAtom.nextStage(),
679:     prev: () => stageAtom.prevStage(),
```

**src/state/atoms/stageAtom.js:677**
```javascript
674: 
675:     // Navigation helpers
676:     jumpToStage: (stage) => stageAtom.jumpToStage(stage),
677:     jumpTo: (stage) => stageAtom.jumpToStage(stage), // legacy alias
678:     next: () => stageAtom.nextStage(),
679:     prev: () => stageAtom.prevStage(),
680:     setProgress: (progress) => stageAtom.setStageProgress(progress),
```

**src/state/atoms/stageAtom.js:706**
```javascript
703: 
704:       for (let i = 0; i < iterations; i++) {
705:         const randomStage = STAGE_NAMES[Math.floor(Math.random() * STAGE_NAMES.length)];
706:         stageAtom.jumpToStage(randomStage);
707:         stageAtom.setStageProgress(Math.random());
708:       }
709: 
```

**src/state/commands/StateCommands.js:237**
```javascript
234:       const gateTarget = typeof NavigationGate?.target === 'function' ? NavigationGate.target() : null;
235:       if (!gateActive || gateTarget === targetStage) {
236:         if (currentStage !== targetStage) {
237:           stageAtom.jumpToStage(targetStage);
238:         }
239:       }
240:     }
```

### STAGE_ATOM_SET (19 hits)

**src/bootstrap/wireSSTv3.js:94**
```javascript
91:     // If stageAtom exists, sync with it
92:     if (stageAtom && state.currentStage !== stageAtom.getState().currentStage) {
93:       // DISABLED: This bypasses orchestration
94:       // stageAtom.jumpToStage(state.currentStage);
95:     }
96:   });
97:   unsubscribers.push(unsubscribeNarrative);
```

**src/orchestration/navigation/narrativeNavigation.js:57**
```javascript
54:   const current = stageAtom.getState().autoAdvanceEnabled;
55:   const nextValue =
56:     typeof forcedValue === 'boolean' ? forcedValue : !current;
57:   stageAtom.setAutoAdvanceEnabled(nextValue);
58:   return nextValue;
59: };
60: 
```

**src/state/atoms/stageAtom.js:645**
```javascript
642: 
643: // 🔬 DIAGNOSTIC: Stage atom state tracking
644: if (typeof stageAtom !== 'undefined' && !stageAtom.__autoAdvanceDiagnosticWrapped) {
645:   const originalSetState = stageAtom.setState?.bind(stageAtom);
646:   if (originalSetState) {
647:     stageAtom.setState = function (value, updateType) {
648:       const previousState = stageAtom.getState?.();
```

**src/state/atoms/stageAtom.js:647**
```javascript
644: if (typeof stageAtom !== 'undefined' && !stageAtom.__autoAdvanceDiagnosticWrapped) {
645:   const originalSetState = stageAtom.setState?.bind(stageAtom);
646:   if (originalSetState) {
647:     stageAtom.setState = function (value, updateType) {
648:       const previousState = stageAtom.getState?.();
649:       const nextState = typeof value === 'function' ? value(previousState) : value;
650:       console.log('🔬 [STAGE_ATOM] State change:', { from: previousState, to: nextState, updateType });
```

**src/state/atoms/stageAtom.js:676**
```javascript
673:     getCurrentStageIndex: () => stageAtom.getState().stageIndex,
674: 
675:     // Navigation helpers
676:     jumpToStage: (stage) => stageAtom.jumpToStage(stage),
677:     jumpTo: (stage) => stageAtom.jumpToStage(stage), // legacy alias
678:     next: () => stageAtom.nextStage(),
679:     prev: () => stageAtom.prevStage(),
```

**src/state/atoms/stageAtom.js:677**
```javascript
674: 
675:     // Navigation helpers
676:     jumpToStage: (stage) => stageAtom.jumpToStage(stage),
677:     jumpTo: (stage) => stageAtom.jumpToStage(stage), // legacy alias
678:     next: () => stageAtom.nextStage(),
679:     prev: () => stageAtom.prevStage(),
680:     setProgress: (progress) => stageAtom.setStageProgress(progress),
```

**src/state/atoms/stageAtom.js:680**
```javascript
677:     jumpTo: (stage) => stageAtom.jumpToStage(stage), // legacy alias
678:     next: () => stageAtom.nextStage(),
679:     prev: () => stageAtom.prevStage(),
680:     setProgress: (progress) => stageAtom.setStageProgress(progress),
681:     reset: () => stageAtom.resetStage(),
682: 
683:     // Auto-advance
```

**src/state/atoms/stageAtom.js:684**
```javascript
681:     reset: () => stageAtom.resetStage(),
682: 
683:     // Auto-advance
684:     setAutoAdvanceEnabled: (enabled) => stageAtom.setAutoAdvanceEnabled(Boolean(enabled)),
685:     toggleAutoAdvance: () => stageAtom.setAutoAdvanceEnabled(!stageAtom.getState().autoAdvanceEnabled),
686:     toggleAuto: () => stageAtom.setAutoAdvanceEnabled(!stageAtom.getState().autoAdvanceEnabled), // legacy alias
687:     isAutoAdvanceEnabled: () => stageAtom.isAutoAdvanceEnabled(),
```

**src/state/atoms/stageAtom.js:685**
```javascript
682: 
683:     // Auto-advance
684:     setAutoAdvanceEnabled: (enabled) => stageAtom.setAutoAdvanceEnabled(Boolean(enabled)),
685:     toggleAutoAdvance: () => stageAtom.setAutoAdvanceEnabled(!stageAtom.getState().autoAdvanceEnabled),
686:     toggleAuto: () => stageAtom.setAutoAdvanceEnabled(!stageAtom.getState().autoAdvanceEnabled), // legacy alias
687:     isAutoAdvanceEnabled: () => stageAtom.isAutoAdvanceEnabled(),
688:     pauseAutoAdvance: () => stageAtom.pauseAutoAdvance(),
```

**src/state/atoms/stageAtom.js:686**
```javascript
683:     // Auto-advance
684:     setAutoAdvanceEnabled: (enabled) => stageAtom.setAutoAdvanceEnabled(Boolean(enabled)),
685:     toggleAutoAdvance: () => stageAtom.setAutoAdvanceEnabled(!stageAtom.getState().autoAdvanceEnabled),
686:     toggleAuto: () => stageAtom.setAutoAdvanceEnabled(!stageAtom.getState().autoAdvanceEnabled), // legacy alias
687:     isAutoAdvanceEnabled: () => stageAtom.isAutoAdvanceEnabled(),
688:     pauseAutoAdvance: () => stageAtom.pauseAutoAdvance(),
689:     resumeAutoAdvance: () => stageAtom.resumeAutoAdvance(),
```

**src/state/atoms/stageAtom.js:706**
```javascript
703: 
704:       for (let i = 0; i < iterations; i++) {
705:         const randomStage = STAGE_NAMES[Math.floor(Math.random() * STAGE_NAMES.length)];
706:         stageAtom.jumpToStage(randomStage);
707:         stageAtom.setStageProgress(Math.random());
708:       }
709: 
```

**src/state/atoms/stageAtom.js:707**
```javascript
704:       for (let i = 0; i < iterations; i++) {
705:         const randomStage = STAGE_NAMES[Math.floor(Math.random() * STAGE_NAMES.length)];
706:         stageAtom.jumpToStage(randomStage);
707:         stageAtom.setStageProgress(Math.random());
708:       }
709: 
710:       const endTime = performance.now();
```

**src/state/atoms/stageAtom.js:728**
```javascript
725: 
726:       for (let i = 0; i < 10; i++) {
727:         setTimeout(() => {
728:           stageAtom.setStageProgress(i / 10);
729:         }, i * 5);
730:       }
731: 
```

**src/state/commands/StateCommands.js:237**
```javascript
234:       const gateTarget = typeof NavigationGate?.target === 'function' ? NavigationGate.target() : null;
235:       if (!gateActive || gateTarget === targetStage) {
236:         if (currentStage !== targetStage) {
237:           stageAtom.jumpToStage(targetStage);
238:         }
239:       }
240:     }
```

**src/state/commands/StateCommands.js:305**
```javascript
302:   }
303: 
304:   transitionStage(from, to) {
305:     stageAtom.setState?.({ currentStage: to, transitioning: true });
306:     narrativeAtom.setState?.(prev => ({ ...prev, paused: true }));
307:   }
308: 
```

**src/state/commands/StateCommands.js:324**
```javascript
321: 
322:   restoreSnapshot(snapshot) {
323:     if (snapshot?.state) {
324:       stageAtom.setState?.(snapshot.state.stage);
325:       narrativeAtom.setState?.(snapshot.state.narrative);
326:       qualityAtom.setState?.(snapshot.state.quality);
327:       interactionAtom.setState?.(snapshot.state.interaction);
```

**src/theater/TheaterDirector.js:533**
```javascript
530:     }
531: 
532:     if (!autoEnabled && typeof stageAtom?.setAutoAdvanceEnabled === 'function') {
533:       stageAtom.setAutoAdvanceEnabled(true);
534:       console.log('✅ Auto-advance enabled via stageAtom fallback');
535:       autoEnabled = true;
536:     } else if (!autoEnabled) {
```

**src/theater/TheaterDirector.js:537**
```javascript
534:       console.log('✅ Auto-advance enabled via stageAtom fallback');
535:       autoEnabled = true;
536:     } else if (!autoEnabled) {
537:       failureReason = failureReason ?? 'stageAtom.setAutoAdvanceEnabled not available';
538:     }
539: 
540:     const autoAdvanceAfter =
```

**src/theater/UnifiedNavigationAPI.js:8**
```javascript
5:  * Guarantees full orchestration (fragments, scroll sync, narration).
6:  *
7:  * RULE: Nothing should call narrativeAtom.jumpToStage directly.
8:  * RULE: Nothing should call stageAtom.jumpToStage directly.
9:  * RULE: All navigation goes through this API.
10:  */
11: 
```

### FALLBACK_JUMP (4 hits)

**src/bootstrap/wireSSTv3.js:93**
```javascript
90: 
91:     // If stageAtom exists, sync with it
92:     if (stageAtom && state.currentStage !== stageAtom.getState().currentStage) {
93:       // DISABLED: This bypasses orchestration
94:       // stageAtom.jumpToStage(state.currentStage);
95:     }
96:   });
```

**src/state/atoms/narrativeAtom.js:74**
```javascript
71:       function: 'jumpToStage',
72:       targetStage: stage,
73:       caller: new Error().stack.split('\n')[2].trim(),
74:       bypassesOrchestration: true,
75:       timestamp: performance.now(),
76:     });
77: 
```

**src/state/atoms/narrativeAtom.js:117**
```javascript
114:       function: 'nextStage',
115:       currentStage: get().currentStage,
116:       caller: new Error().stack.split('\n')[2].trim(),
117:       bypassesOrchestration: true,
118:       timestamp: performance.now(),
119:     });
120: 
```

**src/state/atoms/narrativeAtom.js:133**
```javascript
130:       function: 'prevStage',
131:       currentStage: get().currentStage,
132:       caller: new Error().stack.split('\n')[2].trim(),
133:       bypassesOrchestration: true,
134:       timestamp: performance.now(),
135:     });
136: 
```

### NAVIGATE_TO_STAGE (9 hits)

**src/components/consciousness/ConsciousnessTheater.jsx:263**
```javascript
260:       if (!targetStage) return false;
261:       const nav = window.unifiedNav;
262:       if (nav?.navigateToStage) {
263:         nav.navigateToStage(targetStage, {
264:           smooth: true,
265:           skipNarration: false,
266:           source,
```

**src/components/narrative/NarrationController.jsx:332**
```javascript
329: 
330:               let success = false;
331:               if (nextStageName && typeof nav.navigateToStage === 'function') {
332:                 success = await nav.navigateToStage(nextStageName, {
333:                   smooth: true,
334:                   source: 'narration_auto_advance',
335:                 });
```

**src/components/ui/narrative/StageNavigation.jsx:45**
```javascript
42:                 method: 'UNIFIED_ORCHESTRATED',
43:                 timestamp: performance.now(),
44:               });
45:               unifiedNav.navigateToStage(id, {
46:                 smooth: true,
47:                 skipNarration: false,
48:                 source: 'sidebar',
```

**src/orchestration/navigation/narrativeNavigation.js:39**
```javascript
36:   if (currentStage === stageName) return true;
37: 
38:   unifiedNav
39:     .navigateToStage(stageName, {
40:       smooth,
41:       skipNarration: !emitNarration,
42:       source: 'narrative_navigation',
```

**src/orchestration/navigation/narrativeNavigation.js:113**
```javascript
110:   if (!nextStageName || nextStageName === info.currentStage) return false;
111: 
112:   unifiedNav
113:     .navigateToStage(nextStageName, {
114:       smooth: true,
115:       skipNarration: false,
116:       source: 'narrative_navigation_next',
```

**src/orchestration/navigation/narrativeNavigation.js:135**
```javascript
132:   if (!prevStageName || prevStageName === info.currentStage) return false;
133: 
134:   unifiedNav
135:     .navigateToStage(prevStageName, {
136:       smooth: true,
137:       skipNarration: false,
138:       source: 'narrative_navigation_prev',
```

**src/theater/UnifiedNavigationAPI.js:30**
```javascript
27:    * Navigate to specific stage by slug
28:    * Triggers full orchestration via scroll
29:    */
30:   async navigateToStage(targetStage, options = {}) {
31:     const {
32:       smooth = true,
33:       skipNarration = false,
```

**src/theater/UnifiedNavigationAPI.js:159**
```javascript
156:       return false;
157:     }
158: 
159:     return this.navigateToStage(stages[nextIndex], {
160:       ...options,
161:       source: 'nextStage',
162:     });
```

**src/theater/UnifiedNavigationAPI.js:179**
```javascript
176:       return false;
177:     }
178: 
179:     return this.navigateToStage(stages[prevIndex], {
180:       ...options,
181:       source: 'prevStage',
182:     });
```

### NARRATION_START (26 hits)

**src/components/consciousness/ConsciousnessTheater.jsx:194**
```javascript
191:         setScrollEnabled(true);
192:         try { document.body.style.overflow = ''; } catch {}
193:       }),
194:       BeatBus.on(EVENTS.START_NARRATIVE, ({ stage }) => {
195:         console.log(`   Theater: Starting ${stage} narrative`);
196:         setIsInitialized(true);
197:       }),
```

**src/components/narrative/NarrationController.jsx:601**
```javascript
598:     [defaultCharsPerSecond, triggerAutoAdvance]
599:   );
600: 
601:   const startNarration = useCallback(
602:     (stageName, origin = 'internal') => {
603:       console.log('🔬 [NARRATION] START_NARRATION_CALLED:', {
604:         requestedStage: stageName,
```

**src/components/narrative/NarrationController.jsx:797**
```javascript
794:       const surface = {};
795:       Object.defineProperties(surface, {
796:         playNarration: {
797:           value: (stage) => startNarration(stage, 'external'),
798:           enumerable: true,
799:         },
800:         skipNarration: {
```

**src/components/narrative/NarrationController.jsx:855**
```javascript
852:     return () => {
853:       revokeControlSurface('narrationController');
854:     };
855:   }, [skipNarration, startNarration]);
856: 
857:   useEffect(() => {
858:     if (typeof window === 'undefined') return undefined;
```

**src/components/narrative/NarrationController.jsx:865**
```javascript
862:       autoAdvanceEnabled,
863:       resetStateId: resetState,
864:       skipNarrationId: skipNarration,
865:       startNarrationId: startNarration,
866:     };
867:     const prevDeps = prevDepsRef.current;
868:     const changedKeys = Object.keys(deps).filter((key) => prevDeps[key] !== deps[key]);
```

**src/components/narrative/NarrationController.jsx:928**
```javascript
925:       });
926: 
927:       const origin = source || 'event';
928:       startNarration(stageName, origin);
929:       startedStagesRef.current.add(stageName);
930:       console.log('🎙️ [NarrationController] Added to startedStagesRef', {
931:         stage: stageName,
```

**src/components/narrative/NarrationController.jsx:959**
```javascript
956:       }
957:     };
958: 
959:     const offStart = BeatBus.on?.(EVENTS.START_NARRATIVE, handleStart);
960:     const offStageChange = BeatBus.on?.(EVENTS.STAGE_CHANGE, handleStageChange);
961: 
962:     const keyHandler = (event) => {
```

**src/components/narrative/NarrationController.jsx:987**
```javascript
984:       window.removeEventListener('keydown', keyHandler);
985:       resetState();
986:     };
987:   }, [currentStage, resetState, skipNarration, startNarration]);
988: 
989:   useEffect(() => {
990:     if (!currentStage) return;
```

**src/components/narrative/NarrationController.jsx:1034**
```javascript
1031:       segmentCount,
1032:     });
1033: 
1034:     startNarration(currentStage, 'auto');
1035:     startedStagesRef.current.add(currentStage);
1036:   }, [currentStage, startNarration]);
1037: 
```

**src/components/narrative/NarrationController.jsx:1036**
```javascript
1033: 
1034:     startNarration(currentStage, 'auto');
1035:     startedStagesRef.current.add(currentStage);
1036:   }, [currentStage, startNarration]);
1037: 
1038:   useEffect(() => {
1039:     if (typeof window === 'undefined') return () => {};
```

**src/components/narrative/NarrationController.jsx:1054**
```javascript
1051:         stage: pendingStage,
1052:       });
1053:       pendingStartRef.current = null;
1054:       startNarration(pendingStage, 'pending');
1055:       startedStagesRef.current.add(pendingStage);
1056:     }, 150);
1057: 
```

**src/components/narrative/NarrationController.jsx:1059**
```javascript
1056:     }, 150);
1057: 
1058:     return () => clearInterval(intervalId);
1059:   }, [startNarration]);
1060: 
1061:   useEffect(() => {
1062:     return () => {
```

**src/components/narrative/NarrationOverlayBus.jsx:124**
```javascript
121:       window.theaterDirector?.isOpeningInProgress?.() === true;
122: 
123:     const handleStart = (payload = {}) => {
124:       const validation = validateEvent('START_NARRATIVE', payload);
125:       diagnostics.recordEvent('START_NARRATIVE', payload, validation.valid);
126: 
127:       if (!validation.valid) {
```

**src/components/narrative/NarrationOverlayBus.jsx:125**
```javascript
122: 
123:     const handleStart = (payload = {}) => {
124:       const validation = validateEvent('START_NARRATIVE', payload);
125:       diagnostics.recordEvent('START_NARRATIVE', payload, validation.valid);
126: 
127:       if (!validation.valid) {
128:         console.error('❌ [NarrationOverlay] Invalid START_NARRATIVE:', validation.reason);
```

**src/components/narrative/NarrationOverlayBus.jsx:128**
```javascript
125:       diagnostics.recordEvent('START_NARRATIVE', payload, validation.valid);
126: 
127:       if (!validation.valid) {
128:         console.error('❌ [NarrationOverlay] Invalid START_NARRATIVE:', validation.reason);
129:         diagnostics.recordError('INVALID_EVENT', { event: 'START_NARRATIVE', ...validation });
130:         return;
131:       }
```

**src/components/narrative/NarrationOverlayBus.jsx:129**
```javascript
126: 
127:       if (!validation.valid) {
128:         console.error('❌ [NarrationOverlay] Invalid START_NARRATIVE:', validation.reason);
129:         diagnostics.recordError('INVALID_EVENT', { event: 'START_NARRATIVE', ...validation });
130:         return;
131:       }
132: 
```

**src/components/narrative/NarrationOverlayBus.jsx:138**
```javascript
135:         return;
136:       }
137: 
138:       const dupCheck = deduplicator.check('START_NARRATIVE', payload);
139:       if (dupCheck.isDuplicate) {
140:         diagnostics.recordDuplicateIgnored();
141:         diagnostics.recordError('DUPLICATE_EVENT', { event: 'START_NARRATIVE', reason: dupCheck.reason });
```

**src/components/narrative/NarrationOverlayBus.jsx:141**
```javascript
138:       const dupCheck = deduplicator.check('START_NARRATIVE', payload);
139:       if (dupCheck.isDuplicate) {
140:         diagnostics.recordDuplicateIgnored();
141:         diagnostics.recordError('DUPLICATE_EVENT', { event: 'START_NARRATIVE', reason: dupCheck.reason });
142:         return;
143:       }
144: 
```

**src/components/narrative/NarrationOverlayBus.jsx:203**
```javascript
200:       scheduleGraceHide();
201:     };
202: 
203:     const offStart = BeatBus.on?.(EVENTS.START_NARRATIVE, handleStart);
204:     const offLine = BeatBus.on?.(EVENTS.NARRATIVE_LINE, handleLine);
205:     const offStop = BeatBus.on?.(EVENTS.NARRATION_STOPPED, handleStop);
206:     const offCleanup = BeatBus.on?.(EVENTS.NARRATION_CLEANUP, handleCleanup);
```

**src/components/narrative/overlay/OverlayContracts.js:14**
```javascript
11: ]);
12: 
13: export const EVENT_CONTRACTS = {
14:   START_NARRATIVE: {
15:     validate(payload) {
16:       if (!payload) return { valid: true };
17: 
```

**src/components/narrative/overlay/OverlayDeduplication.js:24**
```javascript
21:       return `LINE:${payload.text ?? ''}:${payload.stage ?? ''}`;
22:     }
23: 
24:     if (eventName === 'START_NARRATIVE') {
25:       return `START:${payload.stage ?? ''}:${payload.source ?? ''}`;
26:     }
27: 
```

**src/orchestration/navigation/narrativeNavigation.js:20**
```javascript
17: 
18: const emitStartNarrative = (stageName) => {
19:   if (!stageName) return;
20:   BeatBus.emit?.(EVENTS.START_NARRATIVE, {
21:     stage: stageName,
22:     source: 'user_action',
23:   });
```

**src/theater/TheaterDirector.js:270**
```javascript
267:         return;
268:       }
269: 
270:       BeatBus.emit(EVENTS.START_NARRATIVE, {
271:         stage: newStage,
272:         source: 'director_stage_change',
273:         timestamp:
```

**src/theater/bus/schemas.js:67**
```javascript
64:       morph: 'number',
65:     },
66:   }],
67:   ['START_NARRATIVE', {
68:     required: { stage: 'string' },
69:     optional: { source: 'string' },
70:   }],
```

**src/theater/controllers/OpeningSequenceController.js:651**
```javascript
648: 
649:       await this.director._runVisualSchedule?.();
650: 
651:       BeatBus.emit(EVENTS.START_NARRATIVE, {
652:         stage: toStage,
653:         source: 'opening_complete',
654:       });
```

**src/theater/events.js:29**
```javascript
26:   MORPH_PROGRESS: 'MORPH_PROGRESS',              // { value: 0..1 }
27: 
28:   // Stage / narrative control
29:   START_NARRATIVE: 'START_NARRATIVE',            // { id?, stage? }
30:   NARRATIVE_LINE: 'NARRATIVE_LINE',
31:   NARRATION_STOPPED: 'NARRATION_STOPPED',
32:   NARRATION_CLEANUP: 'NARRATION_CLEANUP',
```

### ARROW_NAV (6 hits)

**src/components/consciousness/ConsciousnessTheater.jsx:282**
```javascript
279:       if (tagName && ['INPUT', 'TEXTAREA'].includes(tagName)) return;
280: 
281:       const key = e.key;
282:       if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
283:         console.log('🔍 [KEY DEBUG]', {
284:           key,
285:           target: tagName || 'unknown',
```

**src/components/consciousness/ConsciousnessTheater.jsx:292**
```javascript
289:       }
290: 
291:       // Stage navigation keys
292:       if (key === 'ArrowRight' || key === 'ArrowLeft') {
293:         e.preventDefault();
294:         e.stopPropagation();
295: 
```

**src/components/consciousness/ConsciousnessTheater.jsx:351**
```javascript
348:       }
349: 
350:       // Morph controls (retain existing behaviour)
351:       if (key === 'ArrowUp' || key === 'ArrowDown') {
352:         e.preventDefault();
353:         e.stopPropagation();
354: 
```

**src/components/consciousness/ConsciousnessTheater.jsx:356**
```javascript
353:         e.stopPropagation();
354: 
355:         const current = typeof morphProgressRef.current === 'number' ? morphProgressRef.current : 0;
356:         const delta = key === 'ArrowUp' ? 0.1 : -0.1;
357:         const next = Math.max(0, Math.min(1, Number((current + delta).toFixed(3))));
358: 
359:         if (next !== current) {
```

**src/components/consciousness/ConsciousnessTheater.jsx:364**
```javascript
361:           morphProgressRef.current = updated;
362:           console.log('🎬 [KEY NAV]', {
363:             key,
364:             action: key === 'ArrowUp' ? 'increase' : 'decrease',
365:             from: current.toFixed(2),
366:             to: updated.toFixed(2),
367:           });
```

**src/components/consciousness/ConsciousnessTheater.jsx:371**
```javascript
368:         } else {
369:           console.log('🎬 [KEY NAV]', {
370:             key,
371:             action: key === 'ArrowUp' ? 'increase' : 'decrease',
372:             ignored: 'clamped',
373:             value: current.toFixed(2),
374:           });
```

### RAPID_FIRE (5 hits)

**src/components/consciousness/ConsciousnessTheater.jsx:26**
```javascript
23: 
24: const GENESIS_STAGE_WORD = Canonical?.visual?.letterGeometry?.genesis?.word || 'GENESIS';
25: 
26: // Debounce helper to prevent rapid-fire navigation (default 150ms)
27: function createDebouncer(minInterval = 150) {
28:   let lastCall = 0;
29:   let timeoutId = null;
```

**src/components/narrative/NarrationOverlayBus.jsx:56**
```javascript
53:     setIncomingText('');
54:     setDisplayText('');
55: 
56:     // Force state to idle (may already be idle during rapid resets)
57:     if (stateMachine.getState() !== STATES.IDLE) {
58:       stateMachine.forceState(STATES.IDLE, 'reset');
59:     }
```

**src/state/atoms/stageAtom.js:734**
```javascript
731: 
732:       setTimeout(() => {
733:         const stats = stageAtom.getBatchingStats();
734:         console.log('📊 Batching stats after rapid updates:', stats);
735:       }, 100);
736: 
737:       return 'Batching test initiated - check console in 100ms';
```

**src/state/atoms/stageAtom.js:773**
```javascript
770: 
771: 🧠 INTELLIGENT AUTO-ADVANCE:
772: - ✅ Advanced auto-advance controller with pause/resume
773: - ✅ Intelligent timing prevents rapid-fire transitions
774: - ✅ Configurable intervals and smooth progression
775: - ✅ Integration with batching system for optimal performance
776: 
```

**src/state/atoms/stageAtom.js:786**
```javascript
783: 🛡️ RELIABILITY FEATURES:
784: - ✅ Graceful cleanup and disposal of all systems
785: - ✅ Error isolation in batch processing
786: - ✅ Consistent state management during rapid updates
787: - ✅ Memory leak prevention with proper cleanup
788: 
789: Ready for qualityAtom.js DPR cache extension!
```

### MORPH_PROGRESS (45 hits)

**src/components/consciousness/ConsciousnessTheater.jsx:360**
```javascript
357:         const next = Math.max(0, Math.min(1, Number((current + delta).toFixed(3))));
358: 
359:         if (next !== current) {
360:           const updated = stateCommands.setMorphProgress(next, { origin: 'keyboard' });
361:           morphProgressRef.current = updated;
362:           console.log('🎬 [KEY NAV]', {
363:             key,
```

**src/components/consciousness/ConsciousnessTheater.jsx:443**
```javascript
440:         case 'M': {
441:           const current = morphProgressRef.current ?? 0;
442:           const target = current > 0.5 ? 0 : 1;
443:           morphProgressRef.current = stateCommands.setMorphProgress(target, {
444:             origin: 'developer-toggle',
445:           });
446:           break;
```

**src/components/consciousness/ConsciousnessTheater.jsx:451**
```javascript
448:         case 'r':
449:         case 'R': {
450:           requestUnifiedNavigation('genesis', 'keyboard_reset');
451:           morphProgressRef.current = stateCommands.setMorphProgress(0, { origin: 'reset' });
452:           break;
453:         }
454:         default:
```

**src/components/consciousness/ConsciousnessTheater.jsx:477**
```javascript
474: 
475:       stateCommands.setScrollProgress(progress, { origin: 'scroll' });
476:       if (!NavigationGate.isInFlight()) {
477:         stateCommands.setMorphProgress(Math.min(progress * 2, 1), { origin: 'scroll' });
478:       }
479:     };
480: 
```

**src/components/webgl/WebGLBackground.jsx:412**
```javascript
409:         mat.uniformsNeedUpdate = true;
410:       }
411: 
412:       BeatBus.emit?.(EVENTS.MORPH_PROGRESS, { value: 1, source });
413: 
414:       const now =
415:         typeof performance !== 'undefined' && typeof performance.now === 'function'
```

**src/components/webgl/WebGLBackground.jsx:1333**
```javascript
1330:           };
1331:           console.debug('[WBG] AABB bind', { pos: extent('position') }, { atm: extent('atmosphericPosition') }, { tgt: extent('text3DPosition') });
1332:         }
1333:         BeatBus.emit?.(EVENTS.MORPH_PROGRESS, { value: 0 });
1334:         if (shouldFastForward) {
1335:           const source = fastForwardRequested ? 'renderer-fastforward' : 'renderer-skip-morph';
1336:           if (finalizeEmergence(source)) {
```

**src/components/webgl/WebGLBackground.jsx:1602**
```javascript
1599:     return () => off && off();
1600:   }, [updateBandHeight, logBind, scheduleRuntimeSampling, clearPendingFencepost, queueFencepost, finalizeEmergence]);
1601: 
1602:   // MORPH_PROGRESS → lightweight timeline updates
1603:   useEffect(() => {
1604:     if (!blueprint || !materialRef.current?.uniforms) {
1605:       return;
```

**src/components/webgl/WebGLBackground.jsx:1668**
```javascript
1665:       }
1666:     };
1667: 
1668:     const unsubMorph = BeatBus.on(EVENTS.MORPH_PROGRESS, handleMorphProgress);
1669: 
1670:     if (DEV) {
1671:       console.log('✅ Renderer subscribed:', {
```

**src/components/webgl/WebGLBackground.jsx:1672**
```javascript
1669: 
1670:     if (DEV) {
1671:       console.log('✅ Renderer subscribed:', {
1672:         MORPH_PROGRESS: 'active',
1673:         BLUEPRINT_READY: 'active (separate hook)',
1674:       });
1675:     }
```

**src/config/canonical/sst-v3.3.json:58**
```javascript
55:         "role": "progress_publisher",
56:         "writes": ["eventsOnly"],
57:         "forbidden": ["geometry", "uniforms"],
58:         "notes": "Maps window scroll→stage-local progress; publishes MORPH_PROGRESS; emits STAGE_CHANGE at breakpoints and MEMORY_FRAGMENT_TRIGGER from per-stage triggerPercent. Renderer remains a dumb sink."
59:       }
60:     },
61:     "singleWriterRules": [
```

**src/config/canonical/sst-v3.3.json:289**
```javascript
286:       }
287:     },
288:     {
289:       "name": "MORPH_PROGRESS",
290:       "emitter": "Director",
291:       "payload": {
292:         "value": "float[0..1]"
```

**src/engine/modules/ClimaxController.js:249**
```javascript
246:       morphPayload.stageIndex = stageIndex;
247:     }
248: 
249:     BeatBus.emit(EVENTS.MORPH_PROGRESS, morphPayload);
250:   }
251: 
252:   #runFrame() {
```

**src/engine/modules/MorphController.js:273**
```javascript
270:     };
271:     if (stageIndex >= 0) payload.stageIndex = stageIndex;
272: 
273:     BeatBus.emit(EVENTS.MORPH_PROGRESS, payload);
274:   }
275: }
276: 
```

**src/hooks/atoms/useNarrativeStore.js:27**
```javascript
24:     setStage: narrativeAtom.setStage,
25:     setGlobalProgress: narrativeAtom.setGlobalProgress,
26:     setScrollProgress: narrativeAtom.setScrollProgress,
27:     setMorphProgress: narrativeAtom.setMorphProgress,
28:     setNarrativeProgress: narrativeAtom.setNarrativeProgress,
29:     activateMemoryFragment: narrativeAtom.activateMemoryFragment,
30:     dismissMemoryFragment: narrativeAtom.dismissMemoryFragment,
```

**src/state/atoms/narrativeAtom.js:164**
```javascript
161:     }));
162:   },
163: 
164:   setMorphProgress: progress => {
165:     set(state => ({
166:       ...state,
167:       morphProgress: Math.max(0, Math.min(1, progress)),
```

**src/state/commands/StateCommands.js:44**
```javascript
41:     if (Number.isFinite(stageIndex) && stageIndex >= 0) {
42:       payload.stageIndex = stageIndex;
43:     }
44:     BeatBus.emit(EVENTS.MORPH_PROGRESS || 'MORPH_PROGRESS', payload);
45:   } catch {}
46: }
47: 
```

**src/state/commands/StateCommands.js:201**
```javascript
198:     if (qualitySub) this.subscriptions.push(qualitySub);
199:   }
200: 
201:   setMorphProgress(value, options = {}) {
202:     const morph = clamp01(value);
203:     narrativeAtom.setMorphProgress?.(morph);
204: 
```

**src/state/commands/StateCommands.js:203**
```javascript
200: 
201:   setMorphProgress(value, options = {}) {
202:     const morph = clamp01(value);
203:     narrativeAtom.setMorphProgress?.(morph);
204: 
205:     this.morphState = {
206:       value: morph,
```

**src/state/commands/StateCommands.js:216**
```javascript
213: 
214:   adjustMorph(delta, options = {}) {
215:     const current = narrativeAtom.getState?.()?.morphProgress ?? 0;
216:     return this.setMorphProgress(current + delta, options);
217:   }
218: 
219:   setScrollProgress(progress, options = {}) {
```

**src/state/commands/StateCommands.js:274**
```javascript
271:     const startTime = performance.now();
272:     const animate = () => {
273:       const progress = Math.min((performance.now() - startTime) / duration, 1);
274:       this.setMorphProgress(progress, { origin: 'climax' });
275: 
276:       if (progress < 1) {
277:         requestAnimationFrame(animate);
```

**src/theater/ScrollOrchestrator.js:3**
```javascript
1: // src/theater/ScrollOrchestrator.js
2: // BeatGlyph v3.3 — ScrollOrchestrator
3: // Purpose: map window scroll -> stage-local progress; publish MORPH_PROGRESS and STAGE_CHANGE.
4: // Kinetics: speedMultiplier=2.0, smoothing=0.15, overshoot=0.05 (v3.3 canon)
5: 
6: import { Canonical } from '@/config/canonical/canonicalAuthority.js';
```

**src/theater/ScrollOrchestrator.js:72**
```javascript
69:       revokeControlSurface('__scrollOrchestrator');
70:       revokeControlSurface('scrollOrchestrator');
71:       exposeControlSurface('__scrollOrchestrator', () => this._createControlSurface(), {
72:         setMorph: 'scroll:setMorph',
73:       });
74:       exposeControlSurface('scrollOrchestrator', () => this._createControlSurface(), {
75:         setMorph: 'scroll:setMorph',
```

**src/theater/ScrollOrchestrator.js:75**
```javascript
72:         setMorph: 'scroll:setMorph',
73:       });
74:       exposeControlSurface('scrollOrchestrator', () => this._createControlSurface(), {
75:         setMorph: 'scroll:setMorph',
76:       });
77:       exposeDiagnostics('scrollOrchestrator', () => this.getState());
78:       this._ensureScrollableArea('start');
```

**src/theater/ScrollOrchestrator.js:116**
```javascript
113:           const morphProgress = clamp01(value);
114:           const morphTarget = clamp01(this.morphTarget);
115: 
116:           BeatBus.emit?.(EVENTS.MORPH_PROGRESS, {
117:             morphProgress,
118:             value: morphProgress,
119:             morphTarget,
```

**src/theater/ScrollOrchestrator.js:183**
```javascript
180:         get: () => self.morphTarget,
181:         enumerable: true,
182:       },
183:       setMorph: {
184:         value: (value) => self.setMorph(value, { origin: 'external' }),
185:         enumerable: true,
186:       },
```

**src/theater/ScrollOrchestrator.js:184**
```javascript
181:         enumerable: true,
182:       },
183:       setMorph: {
184:         value: (value) => self.setMorph(value, { origin: 'external' }),
185:         enumerable: true,
186:       },
187:     });
```

**src/theater/ScrollOrchestrator.js:362**
```javascript
359:   }
360: 
361:   // Force a specific morph value (for testing)
362:   setMorph(value, options = {}) {
363:     const origin = options.origin || 'internal';
364:     if (origin !== 'internal' && !isControlAllowed('scroll:setMorph')) {
365:       console.warn('[ScrollOrchestrator] Unauthorized setMorph attempt blocked');
```

**src/theater/ScrollOrchestrator.js:364**
```javascript
361:   // Force a specific morph value (for testing)
362:   setMorph(value, options = {}) {
363:     const origin = options.origin || 'internal';
364:     if (origin !== 'internal' && !isControlAllowed('scroll:setMorph')) {
365:       console.warn('[ScrollOrchestrator] Unauthorized setMorph attempt blocked');
366:       return;
367:     }
```

**src/theater/ScrollOrchestrator.js:365**
```javascript
362:   setMorph(value, options = {}) {
363:     const origin = options.origin || 'internal';
364:     if (origin !== 'internal' && !isControlAllowed('scroll:setMorph')) {
365:       console.warn('[ScrollOrchestrator] Unauthorized setMorph attempt blocked');
366:       return;
367:     }
368:     this.morph = clamp01(value);
```

**src/theater/bus/index.js:6**
```javascript
3: // BeatBus with Canon Dev-OS contract integration
4: // Uses canon-console contract registry for validation
5: 
6: const BATCH_EVENTS = new Set(['MORPH_PROGRESS', 'SCROLL_PROGRESS']);
7: const SYNC_EVENTS = new Set(['PARTICLES_EMERGED', 'FENCEPOST_LISTENERS_READY', 'ENABLE_SCROLL']);
8: 
9: class EventProfiler {
```

**src/theater/bus/schemas.js:35**
```javascript
32:       quality: 'string',
33:     },
34:   }],
35:   ['MORPH_PROGRESS', {
36:     required: { morphProgress: 'number' },
37:     optional: {
38:       stage: 'string',
```

**src/theater/controllers/MorphAnimationController.js:332**
```javascript
329:       source: source || 'animator',
330:     };
331: 
332:     BeatBus.emit(EVENTS.MORPH_PROGRESS, payload);
333:   }
334: 
335:   /**
```

**src/theater/controllers/OpeningSequenceController.js:34**
```javascript
31:   typing: { lines: DEFAULT_TYPING_LINES, typeSpeed: 50, lineDelay: 500, completionDelayMs: 800 },
32:   fill: { text: null, scrollSpeed: 100, durationMs: 2000 },
33:   chaos: { enabled: true, durationMs: 2000, rendererSpin: { z: 0.5, y: 0.2 } },
34:   coalesce: { enabled: true, durationMs: 2000, morphTo: 0.6 },
35:   settle: { enabled: true, durationMs: 1500, morphTo: 1.0 },
36:   emergence: {
37:     durationMs: 2000,
```

**src/theater/controllers/OpeningSequenceController.js:35**
```javascript
32:   fill: { text: null, scrollSpeed: 100, durationMs: 2000 },
33:   chaos: { enabled: true, durationMs: 2000, rendererSpin: { z: 0.5, y: 0.2 } },
34:   coalesce: { enabled: true, durationMs: 2000, morphTo: 0.6 },
35:   settle: { enabled: true, durationMs: 1500, morphTo: 1.0 },
36:   emergence: {
37:     durationMs: 2000,
38:     waitForFencepost: true,
```

**src/theater/controllers/OpeningSequenceController.js:445**
```javascript
442:           duration: chaosDuration,
443:           rendererSpin: chaosConfig.rendererSpin || null,
444:         });
445:         const chaosTarget = Number.isFinite(chaosConfig.morphTo) ? clamp01(chaosConfig.morphTo) : 0.0;
446:         const chaosAnimation = animateMorph(currentMorphValue, chaosTarget, chaosDuration, 'chaos');
447:         if (chaosDuration > 0) {
448:           const waitResult = await this.director.sleep(chaosDuration);
```

**src/theater/controllers/OpeningSequenceController.js:465**
```javascript
462:         });
463:         const coalesceDuration = Math.max(0, Number(coalesceConfig.durationMs) || 0);
464:         this.director.phase = 'coalesce';
465:         console.log(`   Phase: Coalesce (${coalesceDuration}ms → morph ${coalesceConfig.morphTo ?? '—'})`);
466:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
467:           name: 'coalesce',
468:           duration: coalesceDuration,
```

**src/theater/controllers/OpeningSequenceController.js:469**
```javascript
466:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
467:           name: 'coalesce',
468:           duration: coalesceDuration,
469:           morphTarget: typeof coalesceConfig.morphTo === 'number' ? coalesceConfig.morphTo : null,
470:         });
471:         const hasCoalesceTarget = typeof coalesceConfig.morphTo === 'number';
472:         const coalesceTarget = hasCoalesceTarget ? clamp01(coalesceConfig.morphTo) : currentMorphValue;
```

**src/theater/controllers/OpeningSequenceController.js:471**
```javascript
468:           duration: coalesceDuration,
469:           morphTarget: typeof coalesceConfig.morphTo === 'number' ? coalesceConfig.morphTo : null,
470:         });
471:         const hasCoalesceTarget = typeof coalesceConfig.morphTo === 'number';
472:         const coalesceTarget = hasCoalesceTarget ? clamp01(coalesceConfig.morphTo) : currentMorphValue;
473:         let coalesceAnimation = null;
474:         if (hasCoalesceTarget) {
```

**src/theater/controllers/OpeningSequenceController.js:472**
```javascript
469:           morphTarget: typeof coalesceConfig.morphTo === 'number' ? coalesceConfig.morphTo : null,
470:         });
471:         const hasCoalesceTarget = typeof coalesceConfig.morphTo === 'number';
472:         const coalesceTarget = hasCoalesceTarget ? clamp01(coalesceConfig.morphTo) : currentMorphValue;
473:         let coalesceAnimation = null;
474:         if (hasCoalesceTarget) {
475:           coalesceAnimation = animateMorph(currentMorphValue, coalesceTarget, coalesceDuration, 'coalesce');
```

**src/theater/controllers/OpeningSequenceController.js:497**
```javascript
494:         });
495:         const settleDuration = Math.max(0, Number(settleConfig.durationMs) || 0);
496:         this.director.phase = 'settle';
497:         console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
498:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
499:           name: 'settle',
500:           duration: settleDuration,
```

**src/theater/controllers/OpeningSequenceController.js:501**
```javascript
498:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
499:           name: 'settle',
500:           duration: settleDuration,
501:           morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
502:         });
503:         const hasSettleTarget = typeof settleConfig.morphTo === 'number';
504:         const settleTarget = hasSettleTarget ? clamp01(settleConfig.morphTo) : currentMorphValue;
```

**src/theater/controllers/OpeningSequenceController.js:503**
```javascript
500:           duration: settleDuration,
501:           morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
502:         });
503:         const hasSettleTarget = typeof settleConfig.morphTo === 'number';
504:         const settleTarget = hasSettleTarget ? clamp01(settleConfig.morphTo) : currentMorphValue;
505:         let settleAnimation = null;
506:         if (hasSettleTarget) {
```

**src/theater/controllers/OpeningSequenceController.js:504**
```javascript
501:           morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
502:         });
503:         const hasSettleTarget = typeof settleConfig.morphTo === 'number';
504:         const settleTarget = hasSettleTarget ? clamp01(settleConfig.morphTo) : currentMorphValue;
505:         let settleAnimation = null;
506:         if (hasSettleTarget) {
507:           settleAnimation = animateMorph(currentMorphValue, settleTarget, settleDuration, 'settle');
```

**src/theater/events-safe.js:25**
```javascript
22: export const EVENTS_RUNTIME = {
23:   // Runtime events
24:   RENDER_DIRECTIVE: 'RENDER_DIRECTIVE',
25:   MORPH_PROGRESS: 'MORPH_PROGRESS',
26:   RENDERER_TUNE: 'RENDERER_TUNE',
27:   SCROLL_PROGRESS: 'SCROLL_PROGRESS',
28:   CLIMAX_STEP: 'CLIMAX_STEP',
```

**src/theater/events.js:26**
```javascript
23:   RENDER_DIRECTIVE: 'RENDER_DIRECTIVE',          // renderer draw/morph directives
24:   RENDERER_TUNE: 'RENDERER_TUNE',                // { rotZdegPerSec, swirl, vibAmp, flutter, trails, ... }
25:   PARTICLE_PHASE: 'PARTICLE_PHASE',              // { name }
26:   MORPH_PROGRESS: 'MORPH_PROGRESS',              // { value: 0..1 }
27: 
28:   // Stage / narrative control
29:   START_NARRATIVE: 'START_NARRATIVE',            // { id?, stage? }
```

### DEBOUNCE (18 hits)

**src/components/consciousness/ConsciousnessTheater.jsx:26**
```javascript
23: 
24: const GENESIS_STAGE_WORD = Canonical?.visual?.letterGeometry?.genesis?.word || 'GENESIS';
25: 
26: // Debounce helper to prevent rapid-fire navigation (default 150ms)
27: function createDebouncer(minInterval = 150) {
28:   let lastCall = 0;
29:   let timeoutId = null;
```

**src/components/consciousness/ConsciousnessTheater.jsx:27**
```javascript
24: const GENESIS_STAGE_WORD = Canonical?.visual?.letterGeometry?.genesis?.word || 'GENESIS';
25: 
26: // Debounce helper to prevent rapid-fire navigation (default 150ms)
27: function createDebouncer(minInterval = 150) {
28:   let lastCall = 0;
29:   let timeoutId = null;
30: 
```

**src/components/consciousness/ConsciousnessTheater.jsx:31**
```javascript
28:   let lastCall = 0;
29:   let timeoutId = null;
30: 
31:   return function debounce(fn) {
32:     const now = performance.now();
33:     const timeSinceLastCall = now - lastCall;
34: 
```

**src/components/consciousness/ConsciousnessTheater.jsx:44**
```javascript
41:         fn();
42:       }, remainingTime);
43: 
44:       console.log('⏱️ [DEBOUNCE]', {
45:         action: 'delayed',
46:         timeSinceLastCall: Math.round(timeSinceLastCall),
47:         remainingTime: Math.round(remainingTime),
```

**src/components/consciousness/ConsciousnessTheater.jsx:146**
```javascript
143:   const morphProgressRef = useRef(0);
144:   const directorStartedRef = useRef(false);
145:   const viewportReadyRef = useRef(false);
146:   const arrowKeyDebounce = useRef(createDebouncer(150)).current;
147: 
148:   const _stageConfig = Canonical.stages[currentStage];
149:   const {
```

**src/components/consciousness/ConsciousnessTheater.jsx:296**
```javascript
293:         e.preventDefault();
294:         e.stopPropagation();
295: 
296:         arrowKeyDebounce(() => {
297:           const state = stageAtom.getState?.();
298:           const activeStage = state?.currentStage || currentStageRef.current || stageNames[0];
299:           const currentIndex = Math.max(0, stageNames.indexOf(activeStage));
```

**src/components/consciousness/ConsciousnessTheater.jsx:344**
```javascript
341:             to: targetStage,
342:             targetScrollPercent: `${targetScrollPercent.toFixed(1)}%`,
343:             narrationSkipped,
344:             debounced: true,
345:           });
346:         });
347:         return;
```

**src/components/webgl/WebGLBackground.jsx:701**
```javascript
698:     }
699:   }, [camera, gl, size.width, size.height, updateBandHeight, logBind, scheduleRuntimeSampling, applyRendererFits]);
700: 
701:   // single emit on mount; microtask-debounced resize (no RAF / no polling timers)
702:   useEffect(() => {
703:     emitViewportHint();
704:     let inDebounce = false;
```

**src/components/webgl/WebGLBackground.jsx:704**
```javascript
701:   // single emit on mount; microtask-debounced resize (no RAF / no polling timers)
702:   useEffect(() => {
703:     emitViewportHint();
704:     let inDebounce = false;
705:     const onResize = () => {
706:       if (inDebounce) return;
707:       inDebounce = true;
```

**src/components/webgl/WebGLBackground.jsx:706**
```javascript
703:     emitViewportHint();
704:     let inDebounce = false;
705:     const onResize = () => {
706:       if (inDebounce) return;
707:       inDebounce = true;
708:       queueMicrotask(() => {
709:         try { emitViewportHint(); }
```

**src/components/webgl/WebGLBackground.jsx:707**
```javascript
704:     let inDebounce = false;
705:     const onResize = () => {
706:       if (inDebounce) return;
707:       inDebounce = true;
708:       queueMicrotask(() => {
709:         try { emitViewportHint(); }
710:         finally { inDebounce = false; }
```

**src/components/webgl/WebGLBackground.jsx:710**
```javascript
707:       inDebounce = true;
708:       queueMicrotask(() => {
709:         try { emitViewportHint(); }
710:         finally { inDebounce = false; }
711:       });
712:     };
713:     window.addEventListener('resize', onResize);
```

**src/state/atoms/stageAtom.js:31**
```javascript
28:   maxBatchSize: 5,
29:   smoothingFactor: 0.8,
30:   autoAdvanceInterval: 3000,
31:   debounceTimeout: 100,
32: };
33: 
34: function createEmptyPerformanceMetrics() {
```

**src/utils/performance/AdaptiveQualitySystem.js:16**
```javascript
13: const ENHANCED_STABILITY_CONFIG = {
14:   // Tier change requirements
15:   consecutiveChecks: 6,        // Require 6 consecutive stable readings
16:   debounceMs: 2000,           // 2 second minimum between tier changes
17:   fpsVarianceThreshold: 8,    // FPS must be within 8 of target for stability
18:   emergencyDropThreshold: 15, // Emergency drop to LOW if FPS < 15
19:   
```

**src/utils/performance/AdaptiveQualitySystem.js:58**
```javascript
55:     // Calculate what tier FPS suggests
56:     const suggestedTier = this.calculateTierFromFPS(fps);
57:     
58:     // Check if we're in debounce period
59:     if (timeSinceLastChange < ENHANCED_STABILITY_CONFIG.debounceMs) {
60:       console.log(`🛡️ AQS: Debounce active (${Math.round(timeSinceLastChange)}ms), staying at ${this.currentTier}`);
61:       return this.currentTier;
```

**src/utils/performance/AdaptiveQualitySystem.js:59**
```javascript
56:     const suggestedTier = this.calculateTierFromFPS(fps);
57:     
58:     // Check if we're in debounce period
59:     if (timeSinceLastChange < ENHANCED_STABILITY_CONFIG.debounceMs) {
60:       console.log(`🛡️ AQS: Debounce active (${Math.round(timeSinceLastChange)}ms), staying at ${this.currentTier}`);
61:       return this.currentTier;
62:     }
```

**src/utils/performance/AdaptiveQualitySystem.js:60**
```javascript
57:     
58:     // Check if we're in debounce period
59:     if (timeSinceLastChange < ENHANCED_STABILITY_CONFIG.debounceMs) {
60:       console.log(`🛡️ AQS: Debounce active (${Math.round(timeSinceLastChange)}ms), staying at ${this.currentTier}`);
61:       return this.currentTier;
62:     }
63: 
```

**src/utils/performance/AdaptiveQualitySystem.js:259**
```javascript
256:       console.log(`FPS History:`, manager.fpsHistory);
257:       console.log(`FPS Variance: ${manager.getFPSVariance().toFixed(1)}`);
258:       console.log(`Time Since Last Change: ${Date.now() - manager.lastTierChange}ms`);
259:       console.log(`Debounce Period: ${ENHANCED_STABILITY_CONFIG.debounceMs}ms`);
260:       
261:       return {
262:         stable: manager.stabilityChecks === 0,
```

### AUTO_ADVANCE (109 hits)

**src/components/narrative/NarrationController.jsx:36**
```javascript
33:   completionEvents: [],
34:   log(event, data) {
35:     console.log(`🔬 [NARRATION] ${event}:`, data);
36:     if (typeof window !== 'undefined' && window.__autoAdvanceDiagnostic) {
37:       window.__autoAdvanceDiagnostic.log(`NARRATION_${event}`, data);
38:     }
39:   },
```

**src/components/narrative/NarrationController.jsx:37**
```javascript
34:   log(event, data) {
35:     console.log(`🔬 [NARRATION] ${event}:`, data);
36:     if (typeof window !== 'undefined' && window.__autoAdvanceDiagnostic) {
37:       window.__autoAdvanceDiagnostic.log(`NARRATION_${event}`, data);
38:     }
39:   },
40: };
```

**src/components/narrative/NarrationController.jsx:81**
```javascript
78: 
79: export default function NarrationController({ defaultCharsPerSecond = DEFAULT_CHARS_PER_SECOND }) {
80:   const currentStage = useAtomValue(stageAtom, (state) => state.currentStage);
81:   const autoAdvanceEnabled = useAtomValue(stageAtom, (state) => state.autoAdvanceEnabled);
82:   const [activeNarration, setActiveNarration] = useState(null);
83: 
84:   const componentMountIdRef = useRef(null);
```

**src/components/narrative/NarrationController.jsx:94**
```javascript
91:   const completedSegmentsRef = useRef(0);
92:   const skipRequestedRef = useRef(false);
93:   const previousOverflowRef = useRef(null);
94:   const autoAdvanceEnabledRef = useRef(autoAdvanceEnabled);
95:   const prevDepsRef = useRef({});
96:   const segmentTokenRef = useRef(0);
97:   const hasTriggeredAutoAdvanceRef = useRef(false);
```

**src/components/narrative/NarrationController.jsx:97**
```javascript
94:   const autoAdvanceEnabledRef = useRef(autoAdvanceEnabled);
95:   const prevDepsRef = useRef({});
96:   const segmentTokenRef = useRef(0);
97:   const hasTriggeredAutoAdvanceRef = useRef(false);
98:   const startedStagesRef = useRef(new Set());
99:   const pendingStartRef = useRef(null);
100: 
```

**src/components/narrative/NarrationController.jsx:142**
```javascript
139:       completedSegmentsRef.current = 0;
140:       skipRequestedRef.current = false;
141:       segmentTokenRef.current = 0;
142:       hasTriggeredAutoAdvanceRef.current = false;
143:       startedStagesRef.current.clear();
144:       if (DEBUG_NARRATION) {
145:         console.log('🎙️ [NarrationController] resetState called', {
```

**src/components/narrative/NarrationController.jsx:190**
```javascript
187:     [clearTimers, unlockScroll]
188:   );
189: 
190:   const triggerAutoAdvance = useCallback(
191:     (completedStageName, origin = 'narration_complete') => {
192:       if (!completedStageName) return;
193:       if (hasTriggeredAutoAdvanceRef.current) {
```

**src/components/narrative/NarrationController.jsx:193**
```javascript
190:   const triggerAutoAdvance = useCallback(
191:     (completedStageName, origin = 'narration_complete') => {
192:       if (!completedStageName) return;
193:       if (hasTriggeredAutoAdvanceRef.current) {
194:         narrationDiagnostic.log('AUTO_ADVANCE_SKIPPED_DUPLICATE', {
195:           stage: completedStageName,
196:           origin,
```

**src/components/narrative/NarrationController.jsx:201**
```javascript
198:         return;
199:       }
200: 
201:       hasTriggeredAutoAdvanceRef.current = true;
202:       narrationDiagnostic.log('AUTO_ADVANCE_TRIGGER_REQUEST', {
203:         stage: completedStageName,
204:         origin,
```

**src/components/narrative/NarrationController.jsx:214**
```javascript
211: 
212:       const controls = window.stageControls;
213:       const isAutoEnabled =
214:         controls?.isAutoAdvanceEnabled?.() ??
215:         controls?.getState?.()?.autoAdvanceEnabled ??
216:         stageAtom.getState?.()?.autoAdvanceEnabled ??
217:         false;
```

**src/components/narrative/NarrationController.jsx:215**
```javascript
212:       const controls = window.stageControls;
213:       const isAutoEnabled =
214:         controls?.isAutoAdvanceEnabled?.() ??
215:         controls?.getState?.()?.autoAdvanceEnabled ??
216:         stageAtom.getState?.()?.autoAdvanceEnabled ??
217:         false;
218: 
```

**src/components/narrative/NarrationController.jsx:216**
```javascript
213:       const isAutoEnabled =
214:         controls?.isAutoAdvanceEnabled?.() ??
215:         controls?.getState?.()?.autoAdvanceEnabled ??
216:         stageAtom.getState?.()?.autoAdvanceEnabled ??
217:         false;
218: 
219:       if (!isAutoEnabled) {
```

**src/components/narrative/NarrationController.jsx:230**
```javascript
227:         return;
228:       }
229: 
230:       const scheduleAutoAdvance = (timeoutMs) => {
231:         const timeoutId = setTimeout(() => {
232:           timersRef.current.delete(timeoutId);
233: 
```

**src/components/narrative/NarrationController.jsx:237**
```javascript
234:           const liveControls = window.stageControls;
235:           if (!liveControls?.next) return;
236:           const autoStillEnabled =
237:             liveControls.isAutoAdvanceEnabled?.() ??
238:             liveControls.getState?.()?.autoAdvanceEnabled ??
239:             stageAtom.getState?.()?.autoAdvanceEnabled ??
240:             false;
```

**src/components/narrative/NarrationController.jsx:238**
```javascript
235:           if (!liveControls?.next) return;
236:           const autoStillEnabled =
237:             liveControls.isAutoAdvanceEnabled?.() ??
238:             liveControls.getState?.()?.autoAdvanceEnabled ??
239:             stageAtom.getState?.()?.autoAdvanceEnabled ??
240:             false;
241:           if (!autoStillEnabled) return;
```

**src/components/narrative/NarrationController.jsx:239**
```javascript
236:           const autoStillEnabled =
237:             liveControls.isAutoAdvanceEnabled?.() ??
238:             liveControls.getState?.()?.autoAdvanceEnabled ??
239:             stageAtom.getState?.()?.autoAdvanceEnabled ??
240:             false;
241:           if (!autoStillEnabled) return;
242: 
```

**src/components/narrative/NarrationController.jsx:253**
```javascript
250:             return;
251:           }
252: 
253:           if (liveControls.canAutoAdvance && !liveControls.canAutoAdvance()) {
254:             narrationDiagnostic.log('AUTO_ADVANCE_WAIT', {
255:               stage: completedStageName,
256:               retryIn: AUTO_ADVANCE_RETRY_MS,
```

**src/components/narrative/NarrationController.jsx:266**
```javascript
263:                 retryIn: AUTO_ADVANCE_RETRY_MS,
264:               });
265:             }
266:             scheduleAutoAdvance(AUTO_ADVANCE_RETRY_MS);
267:             return;
268:           }
269: 
```

**src/components/narrative/NarrationController.jsx:315**
```javascript
312:           }
313: 
314:           const advanceVia = async () => {
315:             liveControls.markAutoAdvance?.();
316:             try {
317:               const nav =
318:                 window.unifiedNav ||
```

**src/components/narrative/NarrationController.jsx:369**
```javascript
366:         timersRef.current.add(timeoutId);
367:       };
368: 
369:       scheduleAutoAdvance(AUTO_ADVANCE_DELAY_MS);
370:     },
371:     [unlockScroll]
372:   );
```

**src/components/narrative/NarrationController.jsx:439**
```javascript
436:           reason: 'complete',
437:           timestamp,
438:         });
439:         triggerAutoAdvance(stageName, 'narration_complete');
440:         activeStageRef.current = null;
441:       }
442:     },
```

**src/components/narrative/NarrationController.jsx:443**
```javascript
440:         activeStageRef.current = null;
441:       }
442:     },
443:     [triggerAutoAdvance]
444:   );
445: 
446:   const scheduleSegment = useCallback(
```

**src/components/narrative/NarrationController.jsx:583**
```javascript
580:           const fallbackDelay = durationMs + AUTO_ADVANCE_DELAY_MS + 200;
581:           const fallbackId = setTimeout(() => {
582:             timersRef.current.delete(fallbackId);
583:             if (hasTriggeredAutoAdvanceRef.current) return;
584:             narrationDiagnostic.log('AUTO_ADVANCE_FALLBACK', {
585:               stage: stageName,
586:               origin: 'last_beat_timeout',
```

**src/components/narrative/NarrationController.jsx:590**
```javascript
587:               fallbackDelay,
588:               timestamp: Date.now(),
589:             });
590:             triggerAutoAdvance(stageName, 'last_beat_timeout');
591:           }, fallbackDelay);
592:           timersRef.current.add(fallbackId);
593:         }
```

**src/components/narrative/NarrationController.jsx:598**
```javascript
595: 
596:       timersRef.current.add(timerId);
597:     },
598:     [defaultCharsPerSecond, triggerAutoAdvance]
599:   );
600: 
601:   const startNarration = useCallback(
```

**src/components/narrative/NarrationController.jsx:609**
```javascript
606:         currentStage,
607:         origin,
608:         isPlaying: activeStageRef.current !== null,
609:         autoAdvanceEnabled: autoAdvanceEnabledRef.current,
610:       });
611:       const trustedOrigins = new Set([
612:         'internal',
```

**src/components/narrative/NarrationController.jsx:753**
```javascript
750:       componentId,
751:       effectId,
752:       stage: currentStage,
753:       autoAdvance: autoAdvanceEnabled,
754:     });
755: 
756:     narrationDiagnostic.mountHistory.push({
```

**src/components/narrative/NarrationController.jsx:761**
```javascript
758:       componentId,
759:       effectId,
760:       stage: currentStage,
761:       autoAdvance: autoAdvanceEnabled,
762:       time: subscribedAt,
763:     });
764: 
```

**src/components/narrative/NarrationController.jsx:771**
```javascript
768:         componentId,
769:         effectId,
770:         stage: currentStage,
771:         autoAdvance: autoAdvanceEnabled,
772:         lifespan,
773:       });
774:       narrationDiagnostic.unmountHistory.push({
```

**src/components/narrative/NarrationController.jsx:779**
```javascript
776:         componentId,
777:         effectId,
778:         stage: currentStage,
779:         autoAdvance: autoAdvanceEnabled,
780:         time: Date.now(),
781:         lifespan,
782:       });
```

**src/components/narrative/NarrationController.jsx:784**
```javascript
781:         lifespan,
782:       });
783:     };
784:   }, [currentStage, autoAdvanceEnabled]);
785: 
786:   useEffect(() => {
787:     autoAdvanceEnabledRef.current = autoAdvanceEnabled;
```

**src/components/narrative/NarrationController.jsx:787**
```javascript
784:   }, [currentStage, autoAdvanceEnabled]);
785: 
786:   useEffect(() => {
787:     autoAdvanceEnabledRef.current = autoAdvanceEnabled;
788:   }, [autoAdvanceEnabled]);
789: 
790:   useEffect(() => {
```

**src/components/narrative/NarrationController.jsx:788**
```javascript
785: 
786:   useEffect(() => {
787:     autoAdvanceEnabledRef.current = autoAdvanceEnabled;
788:   }, [autoAdvanceEnabled]);
789: 
790:   useEffect(() => {
791:     if (typeof window === 'undefined') return () => {};
```

**src/components/narrative/NarrationController.jsx:862**
```javascript
859: 
860:     const deps = {
861:       currentStage,
862:       autoAdvanceEnabled,
863:       resetStateId: resetState,
864:       skipNarrationId: skipNarration,
865:       startNarrationId: startNarration,
```

**src/components/narrative/NarrationController.jsx:942**
```javascript
939:       narrationDiagnostic.log('STAGE_CHANGE_EVENT', {
940:         from: payload?.from ?? payload?.previousStage ?? null,
941:         to: nextStage,
942:         autoAdvance: autoAdvanceEnabledRef.current,
943:         isPlaying: activeStageRef.current !== null,
944:       });
945:       narrationDiagnostic.stageChangeEvents.push({
```

**src/components/narrative/NarrationController.jsx:979**
```javascript
976:       console.log('🔬 [NARRATION] CLEANUP_REASON', {
977:         stage: currentStage,
978:         wasPlaying: activeStageRef.current !== null,
979:         autoAdvance: autoAdvanceEnabledRef.current,
980:         caller: new Error().stack.split('\n')[2] ?? null,
981:       });
982:       offStart?.();
```

**src/components/ui/NarrativeUIControls.jsx:176**
```javascript
173: 
174:         <button
175:           onClick={() =>
176:             window.narrativeNavigation?.toggleAutoAdvance(!navState.autoAdvanceEnabled)
177:           }
178:           style={{
179:             background: navState.autoAdvanceEnabled ? '#0D9488' : 'transparent',
```

**src/components/ui/NarrativeUIControls.jsx:179**
```javascript
176:             window.narrativeNavigation?.toggleAutoAdvance(!navState.autoAdvanceEnabled)
177:           }
178:           style={{
179:             background: navState.autoAdvanceEnabled ? '#0D9488' : 'transparent',
180:             border: '1px solid #0D9488',
181:             color: navState.autoAdvanceEnabled ? 'white' : '#0D9488',
182:             padding: '0.25rem 0.5rem',
```

**src/components/ui/NarrativeUIControls.jsx:181**
```javascript
178:           style={{
179:             background: navState.autoAdvanceEnabled ? '#0D9488' : 'transparent',
180:             border: '1px solid #0D9488',
181:             color: navState.autoAdvanceEnabled ? 'white' : '#0D9488',
182:             padding: '0.25rem 0.5rem',
183:             fontSize: '0.75rem',
184:             cursor: 'pointer',
```

**src/components/ui/NarrativeUIControls.jsx:188**
```javascript
185:             transition: 'all 0.2s',
186:           }}
187:         >
188:           {navState.autoAdvanceEnabled ? '⏸️ Auto' : '▶️ Auto'}
189:         </button>
190:       </div>
191: 
```

**src/components/ui/NarrativeUIControls.jsx:245**
```javascript
242:   - window.narrativeNavigation.getStageButtonData()
243:   - window.narrativeNavigation.nextStage()
244:   - window.narrativeNavigation.prevStage()
245:   - window.narrativeNavigation.toggleAutoAdvance()
246: 
247: This completely replaces StageNavigation with a richer UI that uses
248: the consolidated navigation system underneath.
```

**src/orchestration/navigation/narrativeNavigation.js:53**
```javascript
50:   return true;
51: };
52: 
53: const toggleAutoAdvance = (forcedValue) => {
54:   const current = stageAtom.getState().autoAdvanceEnabled;
55:   const nextValue =
56:     typeof forcedValue === 'boolean' ? forcedValue : !current;
```

**src/orchestration/navigation/narrativeNavigation.js:54**
```javascript
51: };
52: 
53: const toggleAutoAdvance = (forcedValue) => {
54:   const current = stageAtom.getState().autoAdvanceEnabled;
55:   const nextValue =
56:     typeof forcedValue === 'boolean' ? forcedValue : !current;
57:   stageAtom.setAutoAdvanceEnabled(nextValue);
```

**src/orchestration/navigation/narrativeNavigation.js:57**
```javascript
54:   const current = stageAtom.getState().autoAdvanceEnabled;
55:   const nextValue =
56:     typeof forcedValue === 'boolean' ? forcedValue : !current;
57:   stageAtom.setAutoAdvanceEnabled(nextValue);
58:   return nextValue;
59: };
60: 
```

**src/orchestration/navigation/narrativeNavigation.js:73**
```javascript
70:     currentIndex,
71:     allStages: stageNames,
72:     isTransitioning: !!info.isTransitioning,
73:     autoAdvanceEnabled: !!info.autoAdvanceEnabled,
74:     canGoPrev: currentIndex > 0,
75:     canGoNext: currentIndex < totalStages - 1,
76:   };
```

**src/orchestration/navigation/narrativeNavigation.js:153**
```javascript
150:   nextStage,
151:   prevStage,
152:   jumpToStage,
153:   toggleAutoAdvance,
154: };
155: 
156: if (typeof window !== 'undefined') {
```

**src/state/atoms/stageAtom.js:30**
```javascript
27:   batchDelay: 16,
28:   maxBatchSize: 5,
29:   smoothingFactor: 0.8,
30:   autoAdvanceInterval: 3000,
31:   debounceTimeout: 100,
32: };
33: 
```

**src/state/atoms/stageAtom.js:56**
```javascript
53:     metacurtisVoiceLevel: 0.5,
54:     lastTransition: 0,
55:     lastStageChangeTs: 0,
56:     autoAdvanceEnabled: false,
57:     transitionBatch: [],
58:     batchTimeout: null,
59:     lastProgressUpdate: 0,
```

**src/state/atoms/stageAtom.js:222**
```javascript
219: }
220: 
221: // ✅ ENHANCED: Auto-advance system with intelligent timing
222: class AutoAdvanceController {
223:   constructor(stageAtom) {
224:     this.stageAtom = stageAtom;
225:     this.isPaused = false;
```

**src/state/atoms/stageAtom.js:267**
```javascript
264:     const now = (typeof performance !== 'undefined' && performance.now)
265:       ? performance.now()
266:       : Date.now();
267:     if (now - this.lastAdvance < TRANSITION_CONFIG.autoAdvanceInterval) return false;
268:     return true;
269:   }
270: 
```

**src/state/atoms/stageAtom.js:323**
```javascript
320:   const transitionBatcher = new TransitionBatcher();
321:   const progressSmoother = new ProgressSmoother();
322:   const performanceMonitor = new TransitionPerformanceMonitor();
323:   const autoAdvanceController = new AutoAdvanceController({ getState: get, nextStage: null }); // Will be set later
324:   
325:   // ✅ ENHANCED: Batched state updates
326:   const batchedSetState = (updates, transitionType = 'direct') => {
```

**src/state/atoms/stageAtom.js:509**
```javascript
506:     },
507:     
508:     // ✅ ENHANCED: Auto advance with intelligent controller
509:     setAutoAdvanceEnabled: (enabled) => {
510:       const value = Boolean(enabled);
511:       batchedSetState({ autoAdvanceEnabled: value }, 'setAutoAdvance');
512:       autoAdvanceController.enable(value);
```

**src/state/atoms/stageAtom.js:511**
```javascript
508:     // ✅ ENHANCED: Auto advance with intelligent controller
509:     setAutoAdvanceEnabled: (enabled) => {
510:       const value = Boolean(enabled);
511:       batchedSetState({ autoAdvanceEnabled: value }, 'setAutoAdvance');
512:       autoAdvanceController.enable(value);
513:       
514:       if (import.meta.env.DEV) {
```

**src/state/atoms/stageAtom.js:512**
```javascript
509:     setAutoAdvanceEnabled: (enabled) => {
510:       const value = Boolean(enabled);
511:       batchedSetState({ autoAdvanceEnabled: value }, 'setAutoAdvance');
512:       autoAdvanceController.enable(value);
513:       
514:       if (import.meta.env.DEV) {
515:         console.log(`🎭 stageAtom: Auto advance ${value ? 'enabled' : 'disabled'}`);
```

**src/state/atoms/stageAtom.js:518**
```javascript
515:         console.log(`🎭 stageAtom: Auto advance ${value ? 'enabled' : 'disabled'}`);
516:       }
517:     },
518:     isAutoAdvanceEnabled: () => {
519:       return autoAdvanceController.isEnabled();
520:     },
521:     canAutoAdvance: () => {
```

**src/state/atoms/stageAtom.js:519**
```javascript
516:       }
517:     },
518:     isAutoAdvanceEnabled: () => {
519:       return autoAdvanceController.isEnabled();
520:     },
521:     canAutoAdvance: () => {
522:       return autoAdvanceController.canAdvance();
```

**src/state/atoms/stageAtom.js:521**
```javascript
518:     isAutoAdvanceEnabled: () => {
519:       return autoAdvanceController.isEnabled();
520:     },
521:     canAutoAdvance: () => {
522:       return autoAdvanceController.canAdvance();
523:     },
524:     markAutoAdvance: () => {
```

**src/state/atoms/stageAtom.js:522**
```javascript
519:       return autoAdvanceController.isEnabled();
520:     },
521:     canAutoAdvance: () => {
522:       return autoAdvanceController.canAdvance();
523:     },
524:     markAutoAdvance: () => {
525:       autoAdvanceController.markAdvance();
```

**src/state/atoms/stageAtom.js:524**
```javascript
521:     canAutoAdvance: () => {
522:       return autoAdvanceController.canAdvance();
523:     },
524:     markAutoAdvance: () => {
525:       autoAdvanceController.markAdvance();
526:     },
527:     
```

**src/state/atoms/stageAtom.js:525**
```javascript
522:       return autoAdvanceController.canAdvance();
523:     },
524:     markAutoAdvance: () => {
525:       autoAdvanceController.markAdvance();
526:     },
527:     
528:     // ✅ ENHANCED: Memory fragments with batching
```

**src/state/atoms/stageAtom.js:555**
```javascript
552:       // Clean up systems
553:       transitionBatcher.clear();
554:       progressSmoother.dispose();
555:       autoAdvanceController.stop();
556:       performanceMonitor.reset();
557:       
558:       setState(createInitialState(), 'reset');
```

**src/state/atoms/stageAtom.js:581**
```javascript
578:         globalProgress: state.globalProgress,
579:         totalStages: STAGE_COUNT,
580:         isTransitioning: state.isTransitioning,
581:         autoAdvanceEnabled: state.autoAdvanceEnabled,
582:         lastStageChangeTs: state.lastStageChangeTs,
583:         performanceMetrics: state.performanceMetrics,
584:         transitionHistory: state.transitionHistory
```

**src/state/atoms/stageAtom.js:600**
```javascript
597:           currentProgress: progressSmoother.getCurrentProgress(),
598:           targetProgress: progressSmoother.targetProgress
599:         },
600:         autoAdvance: {
601:           isActive: autoAdvanceController.interval !== null,
602:           isPaused: autoAdvanceController.isPaused,
603:           lastAdvance: autoAdvanceController.lastAdvance
```

**src/state/atoms/stageAtom.js:601**
```javascript
598:           targetProgress: progressSmoother.targetProgress
599:         },
600:         autoAdvance: {
601:           isActive: autoAdvanceController.interval !== null,
602:           isPaused: autoAdvanceController.isPaused,
603:           lastAdvance: autoAdvanceController.lastAdvance
604:         }
```

**src/state/atoms/stageAtom.js:602**
```javascript
599:         },
600:         autoAdvance: {
601:           isActive: autoAdvanceController.interval !== null,
602:           isPaused: autoAdvanceController.isPaused,
603:           lastAdvance: autoAdvanceController.lastAdvance
604:         }
605:       };
```

**src/state/atoms/stageAtom.js:603**
```javascript
600:         autoAdvance: {
601:           isActive: autoAdvanceController.interval !== null,
602:           isPaused: autoAdvanceController.isPaused,
603:           lastAdvance: autoAdvanceController.lastAdvance
604:         }
605:       };
606:     },
```

**src/state/atoms/stageAtom.js:628**
```javascript
625:     },
626:     
627:     // ✅ ENHANCED: Pause/resume auto-advance
628:     pauseAutoAdvance: () => {
629:       autoAdvanceController.pause();
630:     },
631:     
```

**src/state/atoms/stageAtom.js:629**
```javascript
626:     
627:     // ✅ ENHANCED: Pause/resume auto-advance
628:     pauseAutoAdvance: () => {
629:       autoAdvanceController.pause();
630:     },
631:     
632:     resumeAutoAdvance: () => {
```

**src/state/atoms/stageAtom.js:632**
```javascript
629:       autoAdvanceController.pause();
630:     },
631:     
632:     resumeAutoAdvance: () => {
633:       autoAdvanceController.resume();
634:     }
635:   };
```

**src/state/atoms/stageAtom.js:633**
```javascript
630:     },
631:     
632:     resumeAutoAdvance: () => {
633:       autoAdvanceController.resume();
634:     }
635:   };
636:   
```

**src/state/atoms/stageAtom.js:638**
```javascript
635:   };
636:   
637:   // Set reference for auto-advance controller
638:   autoAdvanceController.stageAtom = { getState: get, nextStage: actions.nextStage };
639:   
640:   return actions;
641: });
```

**src/state/atoms/stageAtom.js:644**
```javascript
641: });
642: 
643: // 🔬 DIAGNOSTIC: Stage atom state tracking
644: if (typeof stageAtom !== 'undefined' && !stageAtom.__autoAdvanceDiagnosticWrapped) {
645:   const originalSetState = stageAtom.setState?.bind(stageAtom);
646:   if (originalSetState) {
647:     stageAtom.setState = function (value, updateType) {
```

**src/state/atoms/stageAtom.js:652**
```javascript
649:       const nextState = typeof value === 'function' ? value(previousState) : value;
650:       console.log('🔬 [STAGE_ATOM] State change:', { from: previousState, to: nextState, updateType });
651:       if (typeof window !== 'undefined') {
652:         window.__autoAdvanceDiagnostic?.log?.('STAGE_ATOM_CHANGE', {
653:           from: previousState,
654:           to: nextState,
655:           updateType,
```

**src/state/atoms/stageAtom.js:660**
```javascript
657:       }
658:       return originalSetState(nextState, updateType);
659:     };
660:     stageAtom.__autoAdvanceDiagnosticWrapped = true;
661:   }
662: }
663: 
```

**src/state/atoms/stageAtom.js:684**
```javascript
681:     reset: () => stageAtom.resetStage(),
682: 
683:     // Auto-advance
684:     setAutoAdvanceEnabled: (enabled) => stageAtom.setAutoAdvanceEnabled(Boolean(enabled)),
685:     toggleAutoAdvance: () => stageAtom.setAutoAdvanceEnabled(!stageAtom.getState().autoAdvanceEnabled),
686:     toggleAuto: () => stageAtom.setAutoAdvanceEnabled(!stageAtom.getState().autoAdvanceEnabled), // legacy alias
687:     isAutoAdvanceEnabled: () => stageAtom.isAutoAdvanceEnabled(),
```

**src/state/atoms/stageAtom.js:685**
```javascript
682: 
683:     // Auto-advance
684:     setAutoAdvanceEnabled: (enabled) => stageAtom.setAutoAdvanceEnabled(Boolean(enabled)),
685:     toggleAutoAdvance: () => stageAtom.setAutoAdvanceEnabled(!stageAtom.getState().autoAdvanceEnabled),
686:     toggleAuto: () => stageAtom.setAutoAdvanceEnabled(!stageAtom.getState().autoAdvanceEnabled), // legacy alias
687:     isAutoAdvanceEnabled: () => stageAtom.isAutoAdvanceEnabled(),
688:     pauseAutoAdvance: () => stageAtom.pauseAutoAdvance(),
```

**src/state/atoms/stageAtom.js:686**
```javascript
683:     // Auto-advance
684:     setAutoAdvanceEnabled: (enabled) => stageAtom.setAutoAdvanceEnabled(Boolean(enabled)),
685:     toggleAutoAdvance: () => stageAtom.setAutoAdvanceEnabled(!stageAtom.getState().autoAdvanceEnabled),
686:     toggleAuto: () => stageAtom.setAutoAdvanceEnabled(!stageAtom.getState().autoAdvanceEnabled), // legacy alias
687:     isAutoAdvanceEnabled: () => stageAtom.isAutoAdvanceEnabled(),
688:     pauseAutoAdvance: () => stageAtom.pauseAutoAdvance(),
689:     resumeAutoAdvance: () => stageAtom.resumeAutoAdvance(),
```

**src/state/atoms/stageAtom.js:687**
```javascript
684:     setAutoAdvanceEnabled: (enabled) => stageAtom.setAutoAdvanceEnabled(Boolean(enabled)),
685:     toggleAutoAdvance: () => stageAtom.setAutoAdvanceEnabled(!stageAtom.getState().autoAdvanceEnabled),
686:     toggleAuto: () => stageAtom.setAutoAdvanceEnabled(!stageAtom.getState().autoAdvanceEnabled), // legacy alias
687:     isAutoAdvanceEnabled: () => stageAtom.isAutoAdvanceEnabled(),
688:     pauseAutoAdvance: () => stageAtom.pauseAutoAdvance(),
689:     resumeAutoAdvance: () => stageAtom.resumeAutoAdvance(),
690:     pauseAuto: () => stageAtom.pauseAutoAdvance(), // legacy alias
```

**src/state/atoms/stageAtom.js:688**
```javascript
685:     toggleAutoAdvance: () => stageAtom.setAutoAdvanceEnabled(!stageAtom.getState().autoAdvanceEnabled),
686:     toggleAuto: () => stageAtom.setAutoAdvanceEnabled(!stageAtom.getState().autoAdvanceEnabled), // legacy alias
687:     isAutoAdvanceEnabled: () => stageAtom.isAutoAdvanceEnabled(),
688:     pauseAutoAdvance: () => stageAtom.pauseAutoAdvance(),
689:     resumeAutoAdvance: () => stageAtom.resumeAutoAdvance(),
690:     pauseAuto: () => stageAtom.pauseAutoAdvance(), // legacy alias
691:     resumeAuto: () => stageAtom.resumeAutoAdvance(), // legacy alias
```

**src/state/atoms/stageAtom.js:689**
```javascript
686:     toggleAuto: () => stageAtom.setAutoAdvanceEnabled(!stageAtom.getState().autoAdvanceEnabled), // legacy alias
687:     isAutoAdvanceEnabled: () => stageAtom.isAutoAdvanceEnabled(),
688:     pauseAutoAdvance: () => stageAtom.pauseAutoAdvance(),
689:     resumeAutoAdvance: () => stageAtom.resumeAutoAdvance(),
690:     pauseAuto: () => stageAtom.pauseAutoAdvance(), // legacy alias
691:     resumeAuto: () => stageAtom.resumeAutoAdvance(), // legacy alias
692:     canAutoAdvance: () => stageAtom.canAutoAdvance(),
```

**src/state/atoms/stageAtom.js:690**
```javascript
687:     isAutoAdvanceEnabled: () => stageAtom.isAutoAdvanceEnabled(),
688:     pauseAutoAdvance: () => stageAtom.pauseAutoAdvance(),
689:     resumeAutoAdvance: () => stageAtom.resumeAutoAdvance(),
690:     pauseAuto: () => stageAtom.pauseAutoAdvance(), // legacy alias
691:     resumeAuto: () => stageAtom.resumeAutoAdvance(), // legacy alias
692:     canAutoAdvance: () => stageAtom.canAutoAdvance(),
693:     markAutoAdvance: () => stageAtom.markAutoAdvance()
```

**src/state/atoms/stageAtom.js:691**
```javascript
688:     pauseAutoAdvance: () => stageAtom.pauseAutoAdvance(),
689:     resumeAutoAdvance: () => stageAtom.resumeAutoAdvance(),
690:     pauseAuto: () => stageAtom.pauseAutoAdvance(), // legacy alias
691:     resumeAuto: () => stageAtom.resumeAutoAdvance(), // legacy alias
692:     canAutoAdvance: () => stageAtom.canAutoAdvance(),
693:     markAutoAdvance: () => stageAtom.markAutoAdvance()
694:   };
```

**src/state/atoms/stageAtom.js:692**
```javascript
689:     resumeAutoAdvance: () => stageAtom.resumeAutoAdvance(),
690:     pauseAuto: () => stageAtom.pauseAutoAdvance(), // legacy alias
691:     resumeAuto: () => stageAtom.resumeAutoAdvance(), // legacy alias
692:     canAutoAdvance: () => stageAtom.canAutoAdvance(),
693:     markAutoAdvance: () => stageAtom.markAutoAdvance()
694:   };
695: 
```

**src/state/atoms/stageAtom.js:693**
```javascript
690:     pauseAuto: () => stageAtom.pauseAutoAdvance(), // legacy alias
691:     resumeAuto: () => stageAtom.resumeAutoAdvance(), // legacy alias
692:     canAutoAdvance: () => stageAtom.canAutoAdvance(),
693:     markAutoAdvance: () => stageAtom.markAutoAdvance()
694:   };
695: 
696:   if (import.meta.env.DEV) {
```

**src/theater/TheaterDirector.js:17**
```javascript
14: 
15: // 🔬 DIAGNOSTIC: Auto-advance initialization tracking
16: if (typeof window !== 'undefined') {
17:   window.__autoAdvanceDiagnostic = {
18:     initialized: false,
19:     openingComplete: false,
20:     autoAdvanceEnabled: false,
```

**src/theater/TheaterDirector.js:20**
```javascript
17:   window.__autoAdvanceDiagnostic = {
18:     initialized: false,
19:     openingComplete: false,
20:     autoAdvanceEnabled: false,
21:     events: [],
22:     log: function (event, data) {
23:       const entry = {
```

**src/theater/TheaterDirector.js:71**
```javascript
68:     this.scrollOrchestrator = null;
69:     this.openingController = null;
70:     this.narrationController = null;
71:     const autoDiag = typeof window !== 'undefined' ? window.__autoAdvanceDiagnostic : null;
72:     if (autoDiag) {
73:       autoDiag.initialized = true;
74:       autoDiag.log?.('DIRECTOR_INITIALIZED', {
```

**src/theater/TheaterDirector.js:494**
```javascript
491:   }
492: 
493:   handleOpeningComplete({ skipTriggered, opening, elapsed }) {
494:     const autoDiag = typeof window !== 'undefined' ? window.__autoAdvanceDiagnostic : null;
495:     const currentState = stageAtom?.getStageInfo?.() ?? stageAtom?.getState?.() ?? {};
496:     const currentStage = currentState.currentStage ?? stageAtom?.getState?.()?.currentStage ?? null;
497:     const autoAdvanceBefore =
```

**src/theater/TheaterDirector.js:497**
```javascript
494:     const autoDiag = typeof window !== 'undefined' ? window.__autoAdvanceDiagnostic : null;
495:     const currentState = stageAtom?.getStageInfo?.() ?? stageAtom?.getState?.() ?? {};
496:     const currentStage = currentState.currentStage ?? stageAtom?.getState?.()?.currentStage ?? null;
497:     const autoAdvanceBefore =
498:       stageAtom?.isAutoAdvanceEnabled?.() ??
499:       currentState.autoAdvanceEnabled ??
500:       false;
```

**src/theater/TheaterDirector.js:498**
```javascript
495:     const currentState = stageAtom?.getStageInfo?.() ?? stageAtom?.getState?.() ?? {};
496:     const currentStage = currentState.currentStage ?? stageAtom?.getState?.()?.currentStage ?? null;
497:     const autoAdvanceBefore =
498:       stageAtom?.isAutoAdvanceEnabled?.() ??
499:       currentState.autoAdvanceEnabled ??
500:       false;
501: 
```

**src/theater/TheaterDirector.js:499**
```javascript
496:     const currentStage = currentState.currentStage ?? stageAtom?.getState?.()?.currentStage ?? null;
497:     const autoAdvanceBefore =
498:       stageAtom?.isAutoAdvanceEnabled?.() ??
499:       currentState.autoAdvanceEnabled ??
500:       false;
501: 
502:     if (autoDiag) {
```

**src/theater/TheaterDirector.js:506**
```javascript
503:       autoDiag.openingComplete = true;
504:       autoDiag.log('OPENING_COMPLETE', {
505:         stage: currentStage,
506:         autoAdvanceBefore,
507:       });
508:     }
509: 
```

**src/theater/TheaterDirector.js:513**
```javascript
510:     let autoEnabled = false;
511:     let failureReason = null;
512: 
513:     if (typeof window !== 'undefined' && window.stageControls?.setAutoAdvanceEnabled) {
514:       const alreadyEnabled =
515:         typeof window.stageControls.isAutoAdvanceEnabled === 'function'
516:           ? window.stageControls.isAutoAdvanceEnabled()
```

**src/theater/TheaterDirector.js:515**
```javascript
512: 
513:     if (typeof window !== 'undefined' && window.stageControls?.setAutoAdvanceEnabled) {
514:       const alreadyEnabled =
515:         typeof window.stageControls.isAutoAdvanceEnabled === 'function'
516:           ? window.stageControls.isAutoAdvanceEnabled()
517:           : window.stageControls.getState?.()?.autoAdvanceEnabled;
518: 
```

**src/theater/TheaterDirector.js:516**
```javascript
513:     if (typeof window !== 'undefined' && window.stageControls?.setAutoAdvanceEnabled) {
514:       const alreadyEnabled =
515:         typeof window.stageControls.isAutoAdvanceEnabled === 'function'
516:           ? window.stageControls.isAutoAdvanceEnabled()
517:           : window.stageControls.getState?.()?.autoAdvanceEnabled;
518: 
519:       if (alreadyEnabled) {
```

**src/theater/TheaterDirector.js:517**
```javascript
514:       const alreadyEnabled =
515:         typeof window.stageControls.isAutoAdvanceEnabled === 'function'
516:           ? window.stageControls.isAutoAdvanceEnabled()
517:           : window.stageControls.getState?.()?.autoAdvanceEnabled;
518: 
519:       if (alreadyEnabled) {
520:         console.log('   Auto-advance already active');
```

**src/theater/TheaterDirector.js:523**
```javascript
520:         console.log('   Auto-advance already active');
521:         autoEnabled = true;
522:       } else {
523:         window.stageControls.setAutoAdvanceEnabled(true);
524:         console.log('✅ Auto-advance enabled for narration-driven progression');
525:         autoEnabled = true;
526:       }
```

**src/theater/TheaterDirector.js:528**
```javascript
525:         autoEnabled = true;
526:       }
527:     } else {
528:       failureReason = 'setAutoAdvanceEnabled not found';
529:       console.warn('⚠️ stageControls.setAutoAdvanceEnabled unavailable; attempting direct stageAtom enable');
530:     }
531: 
```

**src/theater/TheaterDirector.js:529**
```javascript
526:       }
527:     } else {
528:       failureReason = 'setAutoAdvanceEnabled not found';
529:       console.warn('⚠️ stageControls.setAutoAdvanceEnabled unavailable; attempting direct stageAtom enable');
530:     }
531: 
532:     if (!autoEnabled && typeof stageAtom?.setAutoAdvanceEnabled === 'function') {
```

**src/theater/TheaterDirector.js:532**
```javascript
529:       console.warn('⚠️ stageControls.setAutoAdvanceEnabled unavailable; attempting direct stageAtom enable');
530:     }
531: 
532:     if (!autoEnabled && typeof stageAtom?.setAutoAdvanceEnabled === 'function') {
533:       stageAtom.setAutoAdvanceEnabled(true);
534:       console.log('✅ Auto-advance enabled via stageAtom fallback');
535:       autoEnabled = true;
```

**src/theater/TheaterDirector.js:533**
```javascript
530:     }
531: 
532:     if (!autoEnabled && typeof stageAtom?.setAutoAdvanceEnabled === 'function') {
533:       stageAtom.setAutoAdvanceEnabled(true);
534:       console.log('✅ Auto-advance enabled via stageAtom fallback');
535:       autoEnabled = true;
536:     } else if (!autoEnabled) {
```

**src/theater/TheaterDirector.js:537**
```javascript
534:       console.log('✅ Auto-advance enabled via stageAtom fallback');
535:       autoEnabled = true;
536:     } else if (!autoEnabled) {
537:       failureReason = failureReason ?? 'stageAtom.setAutoAdvanceEnabled not available';
538:     }
539: 
540:     const autoAdvanceAfter =
```

**src/theater/TheaterDirector.js:540**
```javascript
537:       failureReason = failureReason ?? 'stageAtom.setAutoAdvanceEnabled not available';
538:     }
539: 
540:     const autoAdvanceAfter =
541:       stageAtom?.isAutoAdvanceEnabled?.() ??
542:       stageAtom?.getState?.()?.autoAdvanceEnabled ??
543:       false;
```

**src/theater/TheaterDirector.js:541**
```javascript
538:     }
539: 
540:     const autoAdvanceAfter =
541:       stageAtom?.isAutoAdvanceEnabled?.() ??
542:       stageAtom?.getState?.()?.autoAdvanceEnabled ??
543:       false;
544: 
```

**src/theater/TheaterDirector.js:542**
```javascript
539: 
540:     const autoAdvanceAfter =
541:       stageAtom?.isAutoAdvanceEnabled?.() ??
542:       stageAtom?.getState?.()?.autoAdvanceEnabled ??
543:       false;
544: 
545:     if (autoDiag) {
```

**src/theater/TheaterDirector.js:546**
```javascript
543:       false;
544: 
545:     if (autoDiag) {
546:       autoDiag.autoAdvanceEnabled = autoAdvanceAfter;
547:       if (autoEnabled) {
548:         autoDiag.log('AUTO_ADVANCE_ENABLED', {
549:           success: true,
```

**src/theater/TheaterDirector.js:550**
```javascript
547:       if (autoEnabled) {
548:         autoDiag.log('AUTO_ADVANCE_ENABLED', {
549:           success: true,
550:           autoAdvanceAfter,
551:         });
552:       } else {
553:         autoDiag.log('AUTO_ADVANCE_FAILED', {
```

**src/theater/TheaterDirector.js:555**
```javascript
552:       } else {
553:         autoDiag.log('AUTO_ADVANCE_FAILED', {
554:           reason: failureReason ?? 'Unable to enable auto-advance',
555:           autoAdvanceAfter,
556:         });
557:       }
558:     }
```

**src/theater/controllers/OpeningSequenceController.js:680**
```javascript
677:         const timestamp = performance.now();
678:         console.log('✅ [OPENING COMPLETE]', {
679:           nextStage: 'discipline',
680:           shouldAutoAdvance: true,
681:           timestamp,
682:         });
683:       }
```

### DUPLICATE_EVENT (6 hits)

**src/components/narrative/NarrationController.jsx:1003**
```javascript
1000:       return;
1001:     }
1002: 
1003:     const isAlreadyPlayingCurrentStage =
1004:       activeStageRef.current && activeStageRef.current === currentStage;
1005: 
1006:     if (isAlreadyPlayingCurrentStage) {
```

**src/components/narrative/NarrationController.jsx:1006**
```javascript
1003:     const isAlreadyPlayingCurrentStage =
1004:       activeStageRef.current && activeStageRef.current === currentStage;
1005: 
1006:     if (isAlreadyPlayingCurrentStage) {
1007:       narrationDiagnostic.log('AUTO_START_SKIPPED_ALREADY_PLAYING', {
1008:         stage: currentStage,
1009:       });
```

**src/engine/ConsciousnessEngine.js:146**
```javascript
143:     const nextCacheKey = this._cacheKey(nextStageName, resolvedQuality);
144: 
145:     if (this.blueprintCache.has(nextCacheKey)) {
146:       console.log('🔮 Preload: Next stage already cached', nextStageName);
147:       return;
148:     }
149: 
```

**src/theater/TheaterDirector.js:227**
```javascript
224:     const previousStage = this.currentStage;
225:     if (previousStage === newStage) {
226:       if (DEBUG_NARRATION) {
227:         console.log('🎬 [STAGE CHANGE IGNORED] Duplicate stage event', {
228:           stage: newStage,
229:           payload,
230:         });
```

**src/theater/UnifiedNavigationAPI.js:155**
```javascript
152:     const nextIndex = Math.min(currentIndex + 1, stages.length - 1);
153: 
154:     if (nextIndex === currentIndex) {
155:       console.log('🎯 [UNIFIED NAV] Already at last stage');
156:       return false;
157:     }
158: 
```

**src/theater/UnifiedNavigationAPI.js:175**
```javascript
172:     const prevIndex = Math.max(currentIndex - 1, 0);
173: 
174:     if (prevIndex === currentIndex) {
175:       console.log('🎯 [UNIFIED NAV] Already at first stage');
176:       return false;
177:     }
178: 
```

### UNIFIED_NAV (1 hits)

**src/components/ui/narrative/StageNavigation.jsx:45**
```javascript
42:                 method: 'UNIFIED_ORCHESTRATED',
43:                 timestamp: performance.now(),
44:               });
45:               unifiedNav.navigateToStage(id, {
46:                 smooth: true,
47:                 skipNarration: false,
48:                 source: 'sidebar',
```

### SETTLE_TIME (77 hits)

**src/config/visual-controls.js:11**
```javascript
8: export const VC = {
9:   // Emergence pacing
10:   IMPLODE_MS: 2000,      /* VC.IMPLODE_MS */   // extended implosion pacing
11:   SETTLE_MS:  1500,      /* VC.SETTLE_MS  */   // extended settle pacing
12:   MID_MORPH:  0.88,      /* VC.MID_MORPH  */   // morph target at end of implosion
13: 
14:   // Spawn behind camera
```

**src/config/visual-controls.js:40**
```javascript
37: 
38:   // Tier-4 highlight curve
39:   T4_HI_PEAK:   1.0,     /* VC.T4_HI_PEAK */
40:   T4_HI_SETTLE: 0.25,    /* VC.T4_HI_SETTLE */
41: 
42:   // Starfield distribution controls (tiers)
43:   // Percentages still controlled by engine tierRatios; these tune spatial look.
```

**src/engine/ConsciousnessEngine.js:445**
```javascript
442:         this._log('emergence_built', { count: blueprint.particleCount, mode: 'emergence' });
443:       }
444: 
445:       // Drive implosion → settle via directives; renderer remains passive
446:       const shouldRunTimeline = !openingChaosMode && !payload.skipMorphAnimation;
447:       if (shouldRunTimeline && !this._startEmergenceTimeline(blueprint)) {
448:         this._emergenceActive = false;
```

**src/engine/ConsciousnessEngine.js:758**
```javascript
755:     const cacheKey = this._cacheKey(stage, quality);
756:     let blueprint = this.blueprintCache.get(cacheKey);
757: 
758:     // Post-emergence genesis: optionally preserve settled emergence
759:     if (stage === 'genesis' && this._lastEmergenceTargets) {
760:       if (this._lastText3DFallbackUsed) {
761:         console.warn('🧠 Engine: Emergence fallback detected; skipping preserve');
```

**src/engine/modules/MorphController.js:10**
```javascript
7: const DEFAULT_PHASE_DURATIONS = Object.freeze({
8:   implosion: 1100,
9:   coalesce: 250,
10:   settle: 900,
11: });
12: 
13: const nowMs = () =>
```

**src/engine/modules/MorphController.js:49**
```javascript
46:   }
47: 
48:   /**
49:    * Begin the emergence timeline (implosion → coalesce → settle).
50:    * Mirrors the legacy behaviour from ConsciousnessEngine._startEmergenceTimeline.
51:    * @returns {boolean} true when the timeline starts, false otherwise.
52:    */
```

**src/engine/modules/MorphController.js:76**
```javascript
73:       const raw = Number(VC?.IMPLODE_MS);
74:       return Number.isFinite(raw) && raw > 0 ? raw : this.#phaseDurations.implosion;
75:     })();
76:     const settleDefault = (() => {
77:       const raw = Number(VC?.SETTLE_MS);
78:       return Number.isFinite(raw) && raw >= 0 ? raw : this.#phaseDurations.settle;
79:     })();
```

**src/engine/modules/MorphController.js:77**
```javascript
74:       return Number.isFinite(raw) && raw > 0 ? raw : this.#phaseDurations.implosion;
75:     })();
76:     const settleDefault = (() => {
77:       const raw = Number(VC?.SETTLE_MS);
78:       return Number.isFinite(raw) && raw >= 0 ? raw : this.#phaseDurations.settle;
79:     })();
80: 
```

**src/engine/modules/MorphController.js:78**
```javascript
75:     })();
76:     const settleDefault = (() => {
77:       const raw = Number(VC?.SETTLE_MS);
78:       return Number.isFinite(raw) && raw >= 0 ? raw : this.#phaseDurations.settle;
79:     })();
80: 
81:     const fastImpl = (() => {
```

**src/engine/modules/MorphController.js:86**
```javascript
83:       const target = Number.isFinite(raw) && raw > 0 ? raw : 320;
84:       return Math.max(120, Math.min(target, implDefault));
85:     })();
86:     const fastSettle = (() => {
87:       const raw = Number(VC?.SKIP_SETTLE_MS);
88:       const target = Number.isFinite(raw) && raw >= 0 ? raw : 260;
89:       return Math.max(90, Math.min(target, settleDefault));
```

**src/engine/modules/MorphController.js:87**
```javascript
84:       return Math.max(120, Math.min(target, implDefault));
85:     })();
86:     const fastSettle = (() => {
87:       const raw = Number(VC?.SKIP_SETTLE_MS);
88:       const target = Number.isFinite(raw) && raw >= 0 ? raw : 260;
89:       return Math.max(90, Math.min(target, settleDefault));
90:     })();
```

**src/engine/modules/MorphController.js:89**
```javascript
86:     const fastSettle = (() => {
87:       const raw = Number(VC?.SKIP_SETTLE_MS);
88:       const target = Number.isFinite(raw) && raw >= 0 ? raw : 260;
89:       return Math.max(90, Math.min(target, settleDefault));
90:     })();
91: 
92:     const implMs = this.#fastForward ? fastImpl : implDefault;
```

**src/engine/modules/MorphController.js:93**
```javascript
90:     })();
91: 
92:     const implMs = this.#fastForward ? fastImpl : implDefault;
93:     const settleMs = this.#fastForward ? fastSettle : settleDefault;
94:     const midDefault = clamp(Number.isFinite(VC?.MID_MORPH) ? VC.MID_MORPH : 0.85, 0.05, 0.95);
95:     this.#midValue = this.#fastForward ? clamp(Math.min(midDefault, 0.35), 0.05, 0.5) : midDefault;
96: 
```

**src/engine/modules/MorphController.js:102**
```javascript
99:       midDefault,
100:       midForTimeline: this.#midValue,
101:       implMs,
102:       settleMs,
103:       holdMs: this.#holdMs,
104:     });
105:     if (implMs > 6000 || settleMs > 6000) {
```

**src/engine/modules/MorphController.js:105**
```javascript
102:       settleMs,
103:       holdMs: this.#holdMs,
104:     });
105:     if (implMs > 6000 || settleMs > 6000) {
106:       console.warn('[Emergence] unusually long timings detected', { implMs, settleMs, mid: this.#midValue });
107:     }
108: 
```

**src/engine/modules/MorphController.js:106**
```javascript
103:       holdMs: this.#holdMs,
104:     });
105:     if (implMs > 6000 || settleMs > 6000) {
106:       console.warn('[Emergence] unusually long timings detected', { implMs, settleMs, mid: this.#midValue });
107:     }
108: 
109:     if (engine._emergenceRaf) {
```

**src/engine/modules/MorphController.js:125**
```javascript
122:     this.#emitMorphProgress(0, this.#midValue);
123:     trace('[MorphController] Emergence timeline started', { count });
124: 
125:     this.#rafId = scheduleFrame(() => this.#runFrame(implMs, settleMs));
126:     engine._emergenceRaf = this.#rafId;
127:     return true;
128:   }
```

**src/engine/modules/MorphController.js:162**
```javascript
159:   }
160: 
161:   /**
162:    * Returns the current emergence phase (`implosion`, `coalesce`, `settle`, or null).
163:    */
164:   getCurrentPhase() {
165:     return this.#phase;
```

**src/engine/modules/MorphController.js:195**
```javascript
192:     };
193:   }
194: 
195:   #runFrame(implMs, settleMs) {
196:     const engine = this.#engine;
197:     if (!engine._emergenceActive || engine._rendererFencepostSeen) {
198:       this.#rafId = null;
```

**src/engine/modules/MorphController.js:205**
```javascript
202: 
203:     const elapsed = nowMs() - this.#startTime;
204:     if (elapsed < this.#holdMs) {
205:       this.#rafId = scheduleFrame(() => this.#runFrame(implMs, settleMs));
206:       engine._emergenceRaf = this.#rafId;
207:       return;
208:     }
```

**src/engine/modules/MorphController.js:213**
```javascript
210:     const phaseElapsed = elapsed - this.#holdMs;
211:     const inImplosion = implMs > 0 ? phaseElapsed < implMs : false;
212:     const implPhase = implMs > 0 ? clamp(phaseElapsed / implMs, 0, 1) : 1;
213:     const settleElapsed = phaseElapsed - implMs;
214:     const settlePhaseRaw =
215:       settleElapsed <= 0 ? 0 : settleMs > 0 ? clamp(settleElapsed / settleMs, 0, 1) : 1;
216:     const easeImpl = implMs > 0 ? smoothstep(implPhase) : 1;
```

**src/engine/modules/MorphController.js:214**
```javascript
211:     const inImplosion = implMs > 0 ? phaseElapsed < implMs : false;
212:     const implPhase = implMs > 0 ? clamp(phaseElapsed / implMs, 0, 1) : 1;
213:     const settleElapsed = phaseElapsed - implMs;
214:     const settlePhaseRaw =
215:       settleElapsed <= 0 ? 0 : settleMs > 0 ? clamp(settleElapsed / settleMs, 0, 1) : 1;
216:     const easeImpl = implMs > 0 ? smoothstep(implPhase) : 1;
217:     const easeSettle = settlePhaseRaw <= 0 ? 0 : smoothstep(settlePhaseRaw);
```

**src/engine/modules/MorphController.js:215**
```javascript
212:     const implPhase = implMs > 0 ? clamp(phaseElapsed / implMs, 0, 1) : 1;
213:     const settleElapsed = phaseElapsed - implMs;
214:     const settlePhaseRaw =
215:       settleElapsed <= 0 ? 0 : settleMs > 0 ? clamp(settleElapsed / settleMs, 0, 1) : 1;
216:     const easeImpl = implMs > 0 ? smoothstep(implPhase) : 1;
217:     const easeSettle = settlePhaseRaw <= 0 ? 0 : smoothstep(settlePhaseRaw);
218: 
```

**src/engine/modules/MorphController.js:217**
```javascript
214:     const settlePhaseRaw =
215:       settleElapsed <= 0 ? 0 : settleMs > 0 ? clamp(settleElapsed / settleMs, 0, 1) : 1;
216:     const easeImpl = implMs > 0 ? smoothstep(implPhase) : 1;
217:     const easeSettle = settlePhaseRaw <= 0 ? 0 : smoothstep(settlePhaseRaw);
218: 
219:     const morph = inImplosion
220:       ? this.#midValue * easeImpl
```

**src/engine/modules/MorphController.js:221**
```javascript
218: 
219:     const morph = inImplosion
220:       ? this.#midValue * easeImpl
221:       : this.#midValue + (1 - this.#midValue) * easeSettle;
222: 
223:     this.#emitMorphProgress(+morph.toFixed(3), inImplosion ? this.#midValue : 1);
224: 
```

**src/engine/modules/MorphController.js:225**
```javascript
222: 
223:     this.#emitMorphProgress(+morph.toFixed(3), inImplosion ? this.#midValue : 1);
224: 
225:     if (phaseElapsed >= implMs + settleMs) {
226:       if (!engine._emergenceActive || engine._rendererFencepostSeen) {
227:         this.#rafId = null;
228:         engine._emergenceRaf = null;
```

**src/engine/modules/MorphController.js:245**
```javascript
242:     if (inImplosion) {
243:       this.#phase = 'implosion';
244:       this.#phaseDuration = implMs;
245:     } else if (settlePhaseRaw <= 0) {
246:       this.#phase = 'coalesce';
247:       this.#phaseDuration = this.#phaseDurations.coalesce;
248:     } else {
```

**src/engine/modules/MorphController.js:249**
```javascript
246:       this.#phase = 'coalesce';
247:       this.#phaseDuration = this.#phaseDurations.coalesce;
248:     } else {
249:       this.#phase = 'settle';
250:       this.#phaseDuration = settleMs;
251:     }
252: 
```

**src/engine/modules/MorphController.js:250**
```javascript
247:       this.#phaseDuration = this.#phaseDurations.coalesce;
248:     } else {
249:       this.#phase = 'settle';
250:       this.#phaseDuration = settleMs;
251:     }
252: 
253:     this.#rafId = scheduleFrame(() => this.#runFrame(implMs, settleMs));
```

**src/engine/modules/MorphController.js:253**
```javascript
250:       this.#phaseDuration = settleMs;
251:     }
252: 
253:     this.#rafId = scheduleFrame(() => this.#runFrame(implMs, settleMs));
254:     engine._emergenceRaf = this.#rafId;
255:   }
256: 
```

**src/theater/NavigationGate.js:23**
```javascript
20:     }
21:   },
22: 
23:   end(reason = 'settled') {
24:     this._inFlight = false;
25:     this._target = null;
26:     this._reason = reason;
```

**src/theater/TheaterDirector.js:91**
```javascript
88:         hasTimeline: !!openingProbe?.timeline,
89:         chaos: openingProbe?.timeline?.chaos,
90:         coalesce: openingProbe?.timeline?.coalesce,
91:         settle: openingProbe?.timeline?.settle,
92:         hasChaosConfig: !!openingProbe?.timeline?.chaos,
93:       });
94:     } catch (timelineError) {
```

**src/theater/TheaterDirector.js:649**
```javascript
646:     if (!this._sleepWaiters) this._sleepWaiters = new Set();
647: 
648:     return new Promise((resolve) => {
649:       let settled = false;
650:       let timeoutId;
651: 
652:       const complete = (reason = 'elapsed') => {
```

**src/theater/TheaterDirector.js:653**
```javascript
650:       let timeoutId;
651: 
652:       const complete = (reason = 'elapsed') => {
653:         if (settled) return;
654:         settled = true;
655:         this._clearTimer(timeoutId);
656:         this._sleepWaiters.delete(complete);
```

**src/theater/TheaterDirector.js:654**
```javascript
651: 
652:       const complete = (reason = 'elapsed') => {
653:         if (settled) return;
654:         settled = true;
655:         this._clearTimer(timeoutId);
656:         this._sleepWaiters.delete(complete);
657:         resolve(reason);
```

**src/theater/TheaterDirector.js:689**
```javascript
686:   _waitForEvent(event, { timeout = 5000, predicate } = {}) {
687:     if (!event) return Promise.resolve(null);
688:     return new Promise((resolve) => {
689:       let settled = false;
690:       let timeoutId = null;
691: 
692:       const finish = (result) => {
```

**src/theater/TheaterDirector.js:693**
```javascript
690:       let timeoutId = null;
691: 
692:       const finish = (result) => {
693:         if (settled) return;
694:         settled = true;
695:         this._clearTimer(timeoutId);
696:         off?.();
```

**src/theater/TheaterDirector.js:694**
```javascript
691: 
692:       const finish = (result) => {
693:         if (settled) return;
694:         settled = true;
695:         this._clearTimer(timeoutId);
696:         off?.();
697:         resolve(result);
```

**src/theater/UnifiedNavigationAPI.js:35**
```javascript
32:       smooth = true,
33:       skipNarration = false,
34:       source = 'unknown',
35:       settleMs = 450,
36:       releaseDelayMs = 150,
37:     } = options;
38: 
```

**src/theater/UnifiedNavigationAPI.js:122**
```javascript
119:         window.scrollTo(0, scrollTarget);
120:       }
121: 
122:       await new Promise((resolve) => setTimeout(resolve, Math.max(0, settleMs)));
123: 
124:       const currentStage = stageAtom.getState?.()?.currentStage;
125:       if (currentStage !== targetStage) {
```

**src/theater/controllers/MorphAnimationController.js:119**
```javascript
116:         onProgress,
117:         onComplete,
118:         rafId: null,
119:         settled: false,
120:         resolve,
121:       };
122: 
```

**src/theater/controllers/MorphAnimationController.js:288**
```javascript
285:    * Finalize animation and clean up
286:    */
287:   _finalizeAnimation(animation) {
288:     if (animation.settled) return;
289:     animation.settled = true;
290:     animation.currentValue = animation.targetValue;
291: 
```

**src/theater/controllers/MorphAnimationController.js:289**
```javascript
286:    */
287:   _finalizeAnimation(animation) {
288:     if (animation.settled) return;
289:     animation.settled = true;
290:     animation.currentValue = animation.targetValue;
291: 
292:     // Emit final value
```

**src/theater/controllers/OpeningSequenceController.js:5**
```javascript
2:  * OpeningSequenceController
3:  *
4:  * Manages the complete opening timeline:
5:  * Black → Cursor → Terminal → Fill → Chaos → Coalesce → Settle → Emergence
6:  *
7:  * Extracted from TheaterDirector for code splitting.
8:  * Controller relies on TheaterDirector infrastructure (sleep, waiters, emitters).
```

**src/theater/controllers/OpeningSequenceController.js:30**
```javascript
27: 
28: const DEFAULT_OPENING_TIMELINE = {
29:   blackout: { durationMs: 2000 },
30:   cursor: { blinkCount: 2, intervalMs: 500, leadInMs: 500, settleMs: 1000 },
31:   typing: { lines: DEFAULT_TYPING_LINES, typeSpeed: 50, lineDelay: 500, completionDelayMs: 800 },
32:   fill: { text: null, scrollSpeed: 100, durationMs: 2000 },
33:   chaos: { enabled: true, durationMs: 2000, rendererSpin: { z: 0.5, y: 0.2 } },
```

**src/theater/controllers/OpeningSequenceController.js:35**
```javascript
32:   fill: { text: null, scrollSpeed: 100, durationMs: 2000 },
33:   chaos: { enabled: true, durationMs: 2000, rendererSpin: { z: 0.5, y: 0.2 } },
34:   coalesce: { enabled: true, durationMs: 2000, morphTo: 0.6 },
35:   settle: { enabled: true, durationMs: 1500, morphTo: 1.0 },
36:   emergence: {
37:     durationMs: 2000,
38:     waitForFencepost: true,
```

**src/theater/controllers/OpeningSequenceController.js:112**
```javascript
109:         ...(openingTimeline.coalesce ?? {}),
110:         ...(stageTimeline.coalesce ?? {}),
111:       },
112:       settle: {
113:         ...DEFAULT_OPENING_TIMELINE.settle,
114:         ...(openingTimeline.settle ?? {}),
115:         ...(stageTimeline.settle ?? {}),
```

**src/theater/controllers/OpeningSequenceController.js:113**
```javascript
110:         ...(stageTimeline.coalesce ?? {}),
111:       },
112:       settle: {
113:         ...DEFAULT_OPENING_TIMELINE.settle,
114:         ...(openingTimeline.settle ?? {}),
115:         ...(stageTimeline.settle ?? {}),
116:       },
```

**src/theater/controllers/OpeningSequenceController.js:114**
```javascript
111:       },
112:       settle: {
113:         ...DEFAULT_OPENING_TIMELINE.settle,
114:         ...(openingTimeline.settle ?? {}),
115:         ...(stageTimeline.settle ?? {}),
116:       },
117:       profile: stageTimeline.profile ?? openingTimeline.profile ?? null,
```

**src/theater/controllers/OpeningSequenceController.js:115**
```javascript
112:       settle: {
113:         ...DEFAULT_OPENING_TIMELINE.settle,
114:         ...(openingTimeline.settle ?? {}),
115:         ...(stageTimeline.settle ?? {}),
116:       },
117:       profile: stageTimeline.profile ?? openingTimeline.profile ?? null,
118:       narration: stageTimeline.narration ?? openingTimeline.narration ?? null,
```

**src/theater/controllers/OpeningSequenceController.js:207**
```javascript
204:       ...(timeline?.cursor ?? {}),
205:     };
206:     const cursorLeadInMs = Math.max(0, Number(cursorConfig.leadInMs ?? 0));
207:     const cursorSettleMs = Math.max(0, Number(cursorConfig.settleMs ?? 0));
208:     const cursorBlinkCount = Math.max(
209:       0,
210:       Number(cursorConfig.blinkCount ?? DEFAULT_OPENING_TIMELINE.cursor.blinkCount),
```

**src/theater/controllers/OpeningSequenceController.js:264**
```javascript
261: 
262:     const chaosConfig = timeline?.chaos || {};
263:     const coalesceConfig = timeline?.coalesce || {};
264:     const settleConfig = timeline?.settle || {};
265: 
266:     const emergenceTimeline = {
267:       ...DEFAULT_OPENING_TIMELINE.emergence,
```

**src/theater/controllers/OpeningSequenceController.js:339**
```javascript
336:         }
337:         if (!skipTriggered) {
338:           BeatBus.emit(EVENTS.CURSOR_BLINK, { count: cursorBlinkCount, interval: cursorIntervalMs });
339:           if (cursorSettleMs > 0) {
340:             const waitResult = await this.director.sleep(cursorSettleMs);
341:             if (handleWaitResult(waitResult) === 'cancelled') return;
342:           }
```

**src/theater/controllers/OpeningSequenceController.js:340**
```javascript
337:         if (!skipTriggered) {
338:           BeatBus.emit(EVENTS.CURSOR_BLINK, { count: cursorBlinkCount, interval: cursorIntervalMs });
339:           if (cursorSettleMs > 0) {
340:             const waitResult = await this.director.sleep(cursorSettleMs);
341:             if (handleWaitResult(waitResult) === 'cancelled') return;
342:           }
343:         }
```

**src/theater/controllers/OpeningSequenceController.js:395**
```javascript
392:           } catch (bindError) {
393:             console.warn('🎬 Director: Pre-chaos blueprint bind failed', bindError);
394:           }
395:           const bindSettleMs = Math.max(0, Number(chaosConfig?.bindLeadInMs ?? 120));
396:           if (bindSettleMs > 0) {
397:             const waitResult = await this.director.sleep(bindSettleMs);
398:             if (handleWaitResult(waitResult) === 'cancelled') return;
```

**src/theater/controllers/OpeningSequenceController.js:396**
```javascript
393:             console.warn('🎬 Director: Pre-chaos blueprint bind failed', bindError);
394:           }
395:           const bindSettleMs = Math.max(0, Number(chaosConfig?.bindLeadInMs ?? 120));
396:           if (bindSettleMs > 0) {
397:             const waitResult = await this.director.sleep(bindSettleMs);
398:             if (handleWaitResult(waitResult) === 'cancelled') return;
399:           }
```

**src/theater/controllers/OpeningSequenceController.js:397**
```javascript
394:           }
395:           const bindSettleMs = Math.max(0, Number(chaosConfig?.bindLeadInMs ?? 120));
396:           if (bindSettleMs > 0) {
397:             const waitResult = await this.director.sleep(bindSettleMs);
398:             if (handleWaitResult(waitResult) === 'cancelled') return;
399:           }
400:         }
```

**src/theater/controllers/OpeningSequenceController.js:489**
```javascript
486:         currentMorphValue = coalesceTarget;
487:       }
488: 
489:       if (!skipTriggered && settleConfig?.enabled !== false) {
490:         console.log('🔍 [ABOUT TO START SETTLE]', {
491:           settleConfig,
492:           currentMorph: currentMorphValue,
```

**src/theater/controllers/OpeningSequenceController.js:490**
```javascript
487:       }
488: 
489:       if (!skipTriggered && settleConfig?.enabled !== false) {
490:         console.log('🔍 [ABOUT TO START SETTLE]', {
491:           settleConfig,
492:           currentMorph: currentMorphValue,
493:           timestamp: Date.now(),
```

**src/theater/controllers/OpeningSequenceController.js:491**
```javascript
488: 
489:       if (!skipTriggered && settleConfig?.enabled !== false) {
490:         console.log('🔍 [ABOUT TO START SETTLE]', {
491:           settleConfig,
492:           currentMorph: currentMorphValue,
493:           timestamp: Date.now(),
494:         });
```

**src/theater/controllers/OpeningSequenceController.js:495**
```javascript
492:           currentMorph: currentMorphValue,
493:           timestamp: Date.now(),
494:         });
495:         const settleDuration = Math.max(0, Number(settleConfig.durationMs) || 0);
496:         this.director.phase = 'settle';
497:         console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
498:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
```

**src/theater/controllers/OpeningSequenceController.js:496**
```javascript
493:           timestamp: Date.now(),
494:         });
495:         const settleDuration = Math.max(0, Number(settleConfig.durationMs) || 0);
496:         this.director.phase = 'settle';
497:         console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
498:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
499:           name: 'settle',
```

**src/theater/controllers/OpeningSequenceController.js:497**
```javascript
494:         });
495:         const settleDuration = Math.max(0, Number(settleConfig.durationMs) || 0);
496:         this.director.phase = 'settle';
497:         console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
498:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
499:           name: 'settle',
500:           duration: settleDuration,
```

**src/theater/controllers/OpeningSequenceController.js:499**
```javascript
496:         this.director.phase = 'settle';
497:         console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
498:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
499:           name: 'settle',
500:           duration: settleDuration,
501:           morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
502:         });
```

**src/theater/controllers/OpeningSequenceController.js:500**
```javascript
497:         console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
498:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
499:           name: 'settle',
500:           duration: settleDuration,
501:           morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
502:         });
503:         const hasSettleTarget = typeof settleConfig.morphTo === 'number';
```

**src/theater/controllers/OpeningSequenceController.js:501**
```javascript
498:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
499:           name: 'settle',
500:           duration: settleDuration,
501:           morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
502:         });
503:         const hasSettleTarget = typeof settleConfig.morphTo === 'number';
504:         const settleTarget = hasSettleTarget ? clamp01(settleConfig.morphTo) : currentMorphValue;
```

**src/theater/controllers/OpeningSequenceController.js:503**
```javascript
500:           duration: settleDuration,
501:           morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
502:         });
503:         const hasSettleTarget = typeof settleConfig.morphTo === 'number';
504:         const settleTarget = hasSettleTarget ? clamp01(settleConfig.morphTo) : currentMorphValue;
505:         let settleAnimation = null;
506:         if (hasSettleTarget) {
```

**src/theater/controllers/OpeningSequenceController.js:504**
```javascript
501:           morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
502:         });
503:         const hasSettleTarget = typeof settleConfig.morphTo === 'number';
504:         const settleTarget = hasSettleTarget ? clamp01(settleConfig.morphTo) : currentMorphValue;
505:         let settleAnimation = null;
506:         if (hasSettleTarget) {
507:           settleAnimation = animateMorph(currentMorphValue, settleTarget, settleDuration, 'settle');
```

**src/theater/controllers/OpeningSequenceController.js:505**
```javascript
502:         });
503:         const hasSettleTarget = typeof settleConfig.morphTo === 'number';
504:         const settleTarget = hasSettleTarget ? clamp01(settleConfig.morphTo) : currentMorphValue;
505:         let settleAnimation = null;
506:         if (hasSettleTarget) {
507:           settleAnimation = animateMorph(currentMorphValue, settleTarget, settleDuration, 'settle');
508:         } else {
```

**src/theater/controllers/OpeningSequenceController.js:506**
```javascript
503:         const hasSettleTarget = typeof settleConfig.morphTo === 'number';
504:         const settleTarget = hasSettleTarget ? clamp01(settleConfig.morphTo) : currentMorphValue;
505:         let settleAnimation = null;
506:         if (hasSettleTarget) {
507:           settleAnimation = animateMorph(currentMorphValue, settleTarget, settleDuration, 'settle');
508:         } else {
509:           emitMorphSnapshot(currentMorphValue, 'settle', settleTarget, settleDuration);
```

**src/theater/controllers/OpeningSequenceController.js:507**
```javascript
504:         const settleTarget = hasSettleTarget ? clamp01(settleConfig.morphTo) : currentMorphValue;
505:         let settleAnimation = null;
506:         if (hasSettleTarget) {
507:           settleAnimation = animateMorph(currentMorphValue, settleTarget, settleDuration, 'settle');
508:         } else {
509:           emitMorphSnapshot(currentMorphValue, 'settle', settleTarget, settleDuration);
510:         }
```

**src/theater/controllers/OpeningSequenceController.js:509**
```javascript
506:         if (hasSettleTarget) {
507:           settleAnimation = animateMorph(currentMorphValue, settleTarget, settleDuration, 'settle');
508:         } else {
509:           emitMorphSnapshot(currentMorphValue, 'settle', settleTarget, settleDuration);
510:         }
511:         if (settleDuration > 0) {
512:           const waitResult = await this.director.sleep(settleDuration);
```

**src/theater/controllers/OpeningSequenceController.js:511**
```javascript
508:         } else {
509:           emitMorphSnapshot(currentMorphValue, 'settle', settleTarget, settleDuration);
510:         }
511:         if (settleDuration > 0) {
512:           const waitResult = await this.director.sleep(settleDuration);
513:           if (handleWaitResult(waitResult) === 'cancelled') return;
514:         }
```

**src/theater/controllers/OpeningSequenceController.js:512**
```javascript
509:           emitMorphSnapshot(currentMorphValue, 'settle', settleTarget, settleDuration);
510:         }
511:         if (settleDuration > 0) {
512:           const waitResult = await this.director.sleep(settleDuration);
513:           if (handleWaitResult(waitResult) === 'cancelled') return;
514:         }
515:         if (settleAnimation) {
```

**src/theater/controllers/OpeningSequenceController.js:515**
```javascript
512:           const waitResult = await this.director.sleep(settleDuration);
513:           if (handleWaitResult(waitResult) === 'cancelled') return;
514:         }
515:         if (settleAnimation) {
516:           await settleAnimation;
517:         }
518:         currentMorphValue = settleTarget;
```

**src/theater/controllers/OpeningSequenceController.js:516**
```javascript
513:           if (handleWaitResult(waitResult) === 'cancelled') return;
514:         }
515:         if (settleAnimation) {
516:           await settleAnimation;
517:         }
518:         currentMorphValue = settleTarget;
519:       }
```

**src/theater/controllers/OpeningSequenceController.js:518**
```javascript
515:         if (settleAnimation) {
516:           await settleAnimation;
517:         }
518:         currentMorphValue = settleTarget;
519:       }
520: 
521:       if (skipTriggered) {
```

### SCROLL_ORCHESTRATOR (1 hits)

**src/theater/controllers/OpeningSequenceController.js:671**
```javascript
668:       if (!this.director.scrollOrchestrator) {
669:         this.director.scrollOrchestrator = new ScrollOrchestrator();
670:       }
671:       this.director.scrollOrchestrator.start?.();
672:       this.director.monitorFragments?.();
673: 
674:       this.director.phase = 'complete';
```

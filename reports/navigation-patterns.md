# Navigation Pattern Analysis

**Generated:** 2025-11-07T14:09:17.411Z
**Total Hits:** 339

## Summary by Category

| Category | Count |
|----------|-------|
| Entry Points | 34 |
| Narration Controls | 143 |
| Manual Controls | 6 |
| Orchestration | 2 |
| **Race Indicators** | **14** |

## Pattern Distribution

| Pattern | Count | Files |
|---------|-------|-------|
| NAVIGATE_TO_STAGE | 9 | 5 |
| NARRATION_START | 26 | 10 |
| ARROW_NAV | 6 | 1 |
| RAPID_FIRE | 5 | 3 |
| MORPH_PROGRESS | 45 | 15 |
| DEBOUNCE | 18 | 4 |
| AUTO_ADVANCE | 117 | 7 |
| DUPLICATE_EVENT | 6 | 4 |
| UNIFIED_NAV | 1 | 1 |
| SETTLE_TIME | 77 | 8 |
| JUMP_TO_STAGE | 9 | 4 |
| FALLBACK_JUMP | 3 | 1 |
| STAGE_ATOM_SET | 16 | 3 |
| SCROLL_ORCHESTRATOR | 1 | 1 |

## Detailed Hits by Pattern

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

**src/components/narrative/NarrationController.jsx:333**
```javascript
330: 
331:               let success = false;
332:               if (nextStageName && typeof nav.navigateToStage === 'function') {
333:                 success = await nav.navigateToStage(nextStageName, {
334:                   smooth: true,
335:                   source: 'narration_auto_advance',
336:                 });
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

**src/orchestration/navigation/narrativeNavigation.js:40**
```javascript
37:   if (currentStage === stageName) return true;
38: 
39:   unifiedNav
40:     .navigateToStage(stageName, {
41:       smooth,
42:       skipNarration: !emitNarration,
43:       source: 'narrative_navigation',
```

**src/orchestration/navigation/narrativeNavigation.js:114**
```javascript
111:   if (!nextStageName || nextStageName === info.currentStage) return false;
112: 
113:   unifiedNav
114:     .navigateToStage(nextStageName, {
115:       smooth: true,
116:       skipNarration: false,
117:       source: 'narrative_navigation_next',
```

**src/orchestration/navigation/narrativeNavigation.js:136**
```javascript
133:   if (!prevStageName || prevStageName === info.currentStage) return false;
134: 
135:   unifiedNav
136:     .navigateToStage(prevStageName, {
137:       smooth: true,
138:       skipNarration: false,
139:       source: 'narrative_navigation_prev',
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

**src/components/narrative/NarrationController.jsx:602**
```javascript
599:     [defaultCharsPerSecond, triggerAutoAdvance]
600:   );
601: 
602:   const startNarration = useCallback(
603:     (stageName, origin = 'internal') => {
604:       console.log('🔬 [NARRATION] START_NARRATION_CALLED:', {
605:         requestedStage: stageName,
```

**src/components/narrative/NarrationController.jsx:798**
```javascript
795:       const surface = {};
796:       Object.defineProperties(surface, {
797:         playNarration: {
798:           value: (stage) => startNarration(stage, 'external'),
799:           enumerable: true,
800:         },
801:         skipNarration: {
```

**src/components/narrative/NarrationController.jsx:856**
```javascript
853:     return () => {
854:       revokeControlSurface('narrationController');
855:     };
856:   }, [skipNarration, startNarration]);
857: 
858:   useEffect(() => {
859:     if (typeof window === 'undefined') return undefined;
```

**src/components/narrative/NarrationController.jsx:866**
```javascript
863:       autoAdvanceEnabled,
864:       resetStateId: resetState,
865:       skipNarrationId: skipNarration,
866:       startNarrationId: startNarration,
867:     };
868:     const prevDeps = prevDepsRef.current;
869:     const changedKeys = Object.keys(deps).filter((key) => prevDeps[key] !== deps[key]);
```

**src/components/narrative/NarrationController.jsx:929**
```javascript
926:       });
927: 
928:       const origin = source || 'event';
929:       startNarration(stageName, origin);
930:       startedStagesRef.current.add(stageName);
931:       console.log('🎙️ [NarrationController] Added to startedStagesRef', {
932:         stage: stageName,
```

**src/components/narrative/NarrationController.jsx:960**
```javascript
957:       }
958:     };
959: 
960:     const offStart = BeatBus.on?.(EVENTS.START_NARRATIVE, handleStart);
961:     const offStageChange = BeatBus.on?.(EVENTS.STAGE_CHANGE, handleStageChange);
962: 
963:     const keyHandler = (event) => {
```

**src/components/narrative/NarrationController.jsx:988**
```javascript
985:       window.removeEventListener('keydown', keyHandler);
986:       resetState();
987:     };
988:   }, [currentStage, resetState, skipNarration, startNarration]);
989: 
990:   useEffect(() => {
991:     if (!currentStage) return;
```

**src/components/narrative/NarrationController.jsx:1035**
```javascript
1032:       segmentCount,
1033:     });
1034: 
1035:     startNarration(currentStage, 'auto');
1036:     startedStagesRef.current.add(currentStage);
1037:   }, [currentStage, startNarration]);
1038: 
```

**src/components/narrative/NarrationController.jsx:1037**
```javascript
1034: 
1035:     startNarration(currentStage, 'auto');
1036:     startedStagesRef.current.add(currentStage);
1037:   }, [currentStage, startNarration]);
1038: 
1039:   useEffect(() => {
1040:     if (typeof window === 'undefined') return () => {};
```

**src/components/narrative/NarrationController.jsx:1055**
```javascript
1052:         stage: pendingStage,
1053:       });
1054:       pendingStartRef.current = null;
1055:       startNarration(pendingStage, 'pending');
1056:       startedStagesRef.current.add(pendingStage);
1057:     }, 150);
1058: 
```

**src/components/narrative/NarrationController.jsx:1060**
```javascript
1057:     }, 150);
1058: 
1059:     return () => clearInterval(intervalId);
1060:   }, [startNarration]);
1061: 
1062:   useEffect(() => {
1063:     return () => {
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

**src/orchestration/navigation/narrativeNavigation.js:21**
```javascript
18: 
19: const emitStartNarrative = (stageName) => {
20:   if (!stageName) return;
21:   BeatBus.emit?.(EVENTS.START_NARRATIVE, {
22:     stage: stageName,
23:     source: 'user_action',
24:   });
```

**src/theater/TheaterDirector.js:271**
```javascript
268:         return;
269:       }
270: 
271:       BeatBus.emit(EVENTS.START_NARRATIVE, {
272:         stage: newStage,
273:         source: 'director_stage_change',
274:         timestamp:
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

**src/theater/controllers/OpeningSequenceController.js:652**
```javascript
649: 
650:       await this.director._runVisualSchedule?.();
651: 
652:       BeatBus.emit(EVENTS.START_NARRATIVE, {
653:         stage: toStage,
654:         source: 'opening_complete',
655:       });
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

**src/state/commands/StateCommands.js:208**
```javascript
205:     if (qualitySub) this.subscriptions.push(qualitySub);
206:   }
207: 
208:   setMorphProgress(value, options = {}) {
209:     const morph = clamp01(value);
210:     narrativeAtom.setMorphProgress?.(morph);
211: 
```

**src/state/commands/StateCommands.js:210**
```javascript
207: 
208:   setMorphProgress(value, options = {}) {
209:     const morph = clamp01(value);
210:     narrativeAtom.setMorphProgress?.(morph);
211: 
212:     this.morphState = {
213:       value: morph,
```

**src/state/commands/StateCommands.js:223**
```javascript
220: 
221:   adjustMorph(delta, options = {}) {
222:     const current = narrativeAtom.getState?.()?.morphProgress ?? 0;
223:     return this.setMorphProgress(current + delta, options);
224:   }
225: 
226:   setScrollProgress(progress, options = {}) {
```

**src/state/commands/StateCommands.js:285**
```javascript
282:     const startTime = performance.now();
283:     const animate = () => {
284:       const progress = Math.min((performance.now() - startTime) / duration, 1);
285:       this.setMorphProgress(progress, { origin: 'climax' });
286: 
287:       if (progress < 1) {
288:         requestAnimationFrame(animate);
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

**src/theater/controllers/OpeningSequenceController.js:35**
```javascript
32:   typing: { lines: DEFAULT_TYPING_LINES, typeSpeed: 50, lineDelay: 500, completionDelayMs: 800 },
33:   fill: { text: null, scrollSpeed: 100, durationMs: 2000 },
34:   chaos: { enabled: true, durationMs: 2000, rendererSpin: { z: 0.5, y: 0.2 } },
35:   coalesce: { enabled: true, durationMs: 2000, morphTo: 0.6 },
36:   settle: { enabled: true, durationMs: 1500, morphTo: 1.0 },
37:   emergence: {
38:     durationMs: 2000,
```

**src/theater/controllers/OpeningSequenceController.js:36**
```javascript
33:   fill: { text: null, scrollSpeed: 100, durationMs: 2000 },
34:   chaos: { enabled: true, durationMs: 2000, rendererSpin: { z: 0.5, y: 0.2 } },
35:   coalesce: { enabled: true, durationMs: 2000, morphTo: 0.6 },
36:   settle: { enabled: true, durationMs: 1500, morphTo: 1.0 },
37:   emergence: {
38:     durationMs: 2000,
39:     waitForFencepost: true,
```

**src/theater/controllers/OpeningSequenceController.js:446**
```javascript
443:           duration: chaosDuration,
444:           rendererSpin: chaosConfig.rendererSpin || null,
445:         });
446:         const chaosTarget = Number.isFinite(chaosConfig.morphTo) ? clamp01(chaosConfig.morphTo) : 0.0;
447:         const chaosAnimation = animateMorph(currentMorphValue, chaosTarget, chaosDuration, 'chaos');
448:         if (chaosDuration > 0) {
449:           const waitResult = await this.director.sleep(chaosDuration);
```

**src/theater/controllers/OpeningSequenceController.js:466**
```javascript
463:         });
464:         const coalesceDuration = Math.max(0, Number(coalesceConfig.durationMs) || 0);
465:         this.director.phase = 'coalesce';
466:         console.log(`   Phase: Coalesce (${coalesceDuration}ms → morph ${coalesceConfig.morphTo ?? '—'})`);
467:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
468:           name: 'coalesce',
469:           duration: coalesceDuration,
```

**src/theater/controllers/OpeningSequenceController.js:470**
```javascript
467:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
468:           name: 'coalesce',
469:           duration: coalesceDuration,
470:           morphTarget: typeof coalesceConfig.morphTo === 'number' ? coalesceConfig.morphTo : null,
471:         });
472:         const hasCoalesceTarget = typeof coalesceConfig.morphTo === 'number';
473:         const coalesceTarget = hasCoalesceTarget ? clamp01(coalesceConfig.morphTo) : currentMorphValue;
```

**src/theater/controllers/OpeningSequenceController.js:472**
```javascript
469:           duration: coalesceDuration,
470:           morphTarget: typeof coalesceConfig.morphTo === 'number' ? coalesceConfig.morphTo : null,
471:         });
472:         const hasCoalesceTarget = typeof coalesceConfig.morphTo === 'number';
473:         const coalesceTarget = hasCoalesceTarget ? clamp01(coalesceConfig.morphTo) : currentMorphValue;
474:         let coalesceAnimation = null;
475:         if (hasCoalesceTarget) {
```

**src/theater/controllers/OpeningSequenceController.js:473**
```javascript
470:           morphTarget: typeof coalesceConfig.morphTo === 'number' ? coalesceConfig.morphTo : null,
471:         });
472:         const hasCoalesceTarget = typeof coalesceConfig.morphTo === 'number';
473:         const coalesceTarget = hasCoalesceTarget ? clamp01(coalesceConfig.morphTo) : currentMorphValue;
474:         let coalesceAnimation = null;
475:         if (hasCoalesceTarget) {
476:           coalesceAnimation = animateMorph(currentMorphValue, coalesceTarget, coalesceDuration, 'coalesce');
```

**src/theater/controllers/OpeningSequenceController.js:498**
```javascript
495:         });
496:         const settleDuration = Math.max(0, Number(settleConfig.durationMs) || 0);
497:         this.director.phase = 'settle';
498:         console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
499:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
500:           name: 'settle',
501:           duration: settleDuration,
```

**src/theater/controllers/OpeningSequenceController.js:502**
```javascript
499:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
500:           name: 'settle',
501:           duration: settleDuration,
502:           morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
503:         });
504:         const hasSettleTarget = typeof settleConfig.morphTo === 'number';
505:         const settleTarget = hasSettleTarget ? clamp01(settleConfig.morphTo) : currentMorphValue;
```

**src/theater/controllers/OpeningSequenceController.js:504**
```javascript
501:           duration: settleDuration,
502:           morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
503:         });
504:         const hasSettleTarget = typeof settleConfig.morphTo === 'number';
505:         const settleTarget = hasSettleTarget ? clamp01(settleConfig.morphTo) : currentMorphValue;
506:         let settleAnimation = null;
507:         if (hasSettleTarget) {
```

**src/theater/controllers/OpeningSequenceController.js:505**
```javascript
502:           morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
503:         });
504:         const hasSettleTarget = typeof settleConfig.morphTo === 'number';
505:         const settleTarget = hasSettleTarget ? clamp01(settleConfig.morphTo) : currentMorphValue;
506:         let settleAnimation = null;
507:         if (hasSettleTarget) {
508:           settleAnimation = animateMorph(currentMorphValue, settleTarget, settleDuration, 'settle');
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

### AUTO_ADVANCE (117 hits)

**src/components/narrative/NarrationController.jsx:37**
```javascript
34:   completionEvents: [],
35:   log(event, data) {
36:     console.log(`🔬 [NARRATION] ${event}:`, data);
37:     if (typeof window !== 'undefined' && window.__autoAdvanceDiagnostic) {
38:       window.__autoAdvanceDiagnostic.log(`NARRATION_${event}`, data);
39:     }
40:   },
```

**src/components/narrative/NarrationController.jsx:38**
```javascript
35:   log(event, data) {
36:     console.log(`🔬 [NARRATION] ${event}:`, data);
37:     if (typeof window !== 'undefined' && window.__autoAdvanceDiagnostic) {
38:       window.__autoAdvanceDiagnostic.log(`NARRATION_${event}`, data);
39:     }
40:   },
41: };
```

**src/components/narrative/NarrationController.jsx:82**
```javascript
79: 
80: export default function NarrationController({ defaultCharsPerSecond = DEFAULT_CHARS_PER_SECOND }) {
81:   const currentStage = useAtomValue(stageAtom, (state) => state.currentStage);
82:   const autoAdvanceEnabled = useAtomValue(stageAtom, (state) => state.autoAdvanceEnabled);
83:   const [activeNarration, setActiveNarration] = useState(null);
84: 
85:   const componentMountIdRef = useRef(null);
```

**src/components/narrative/NarrationController.jsx:95**
```javascript
92:   const completedSegmentsRef = useRef(0);
93:   const skipRequestedRef = useRef(false);
94:   const previousOverflowRef = useRef(null);
95:   const autoAdvanceEnabledRef = useRef(autoAdvanceEnabled);
96:   const prevDepsRef = useRef({});
97:   const segmentTokenRef = useRef(0);
98:   const hasTriggeredAutoAdvanceRef = useRef(false);
```

**src/components/narrative/NarrationController.jsx:98**
```javascript
95:   const autoAdvanceEnabledRef = useRef(autoAdvanceEnabled);
96:   const prevDepsRef = useRef({});
97:   const segmentTokenRef = useRef(0);
98:   const hasTriggeredAutoAdvanceRef = useRef(false);
99:   const startedStagesRef = useRef(new Set());
100:   const pendingStartRef = useRef(null);
101: 
```

**src/components/narrative/NarrationController.jsx:143**
```javascript
140:       completedSegmentsRef.current = 0;
141:       skipRequestedRef.current = false;
142:       segmentTokenRef.current = 0;
143:       hasTriggeredAutoAdvanceRef.current = false;
144:       startedStagesRef.current.clear();
145:       if (DEBUG_NARRATION) {
146:         console.log('🎙️ [NarrationController] resetState called', {
```

**src/components/narrative/NarrationController.jsx:191**
```javascript
188:     [clearTimers, unlockScroll]
189:   );
190: 
191:   const triggerAutoAdvance = useCallback(
192:     (completedStageName, origin = 'narration_complete') => {
193:       if (!completedStageName) return;
194:       if (hasTriggeredAutoAdvanceRef.current) {
```

**src/components/narrative/NarrationController.jsx:194**
```javascript
191:   const triggerAutoAdvance = useCallback(
192:     (completedStageName, origin = 'narration_complete') => {
193:       if (!completedStageName) return;
194:       if (hasTriggeredAutoAdvanceRef.current) {
195:         narrationDiagnostic.log('AUTO_ADVANCE_SKIPPED_DUPLICATE', {
196:           stage: completedStageName,
197:           origin,
```

**src/components/narrative/NarrationController.jsx:202**
```javascript
199:         return;
200:       }
201: 
202:       hasTriggeredAutoAdvanceRef.current = true;
203:       narrationDiagnostic.log('AUTO_ADVANCE_TRIGGER_REQUEST', {
204:         stage: completedStageName,
205:         origin,
```

**src/components/narrative/NarrationController.jsx:215**
```javascript
212: 
213:       const controls = window.stageControls;
214:       const isAutoEnabled =
215:         controls?.isAutoAdvanceEnabled?.() ??
216:         controls?.getState?.()?.autoAdvanceEnabled ??
217:         stageAtom.getState?.()?.autoAdvanceEnabled ??
218:         false;
```

**src/components/narrative/NarrationController.jsx:216**
```javascript
213:       const controls = window.stageControls;
214:       const isAutoEnabled =
215:         controls?.isAutoAdvanceEnabled?.() ??
216:         controls?.getState?.()?.autoAdvanceEnabled ??
217:         stageAtom.getState?.()?.autoAdvanceEnabled ??
218:         false;
219: 
```

**src/components/narrative/NarrationController.jsx:217**
```javascript
214:       const isAutoEnabled =
215:         controls?.isAutoAdvanceEnabled?.() ??
216:         controls?.getState?.()?.autoAdvanceEnabled ??
217:         stageAtom.getState?.()?.autoAdvanceEnabled ??
218:         false;
219: 
220:       if (!isAutoEnabled) {
```

**src/components/narrative/NarrationController.jsx:231**
```javascript
228:         return;
229:       }
230: 
231:       const scheduleAutoAdvance = (timeoutMs) => {
232:         const timeoutId = setTimeout(() => {
233:           timersRef.current.delete(timeoutId);
234: 
```

**src/components/narrative/NarrationController.jsx:238**
```javascript
235:           const liveControls = window.stageControls;
236:           if (!liveControls?.next) return;
237:           const autoStillEnabled =
238:             liveControls.isAutoAdvanceEnabled?.() ??
239:             liveControls.getState?.()?.autoAdvanceEnabled ??
240:             stageAtom.getState?.()?.autoAdvanceEnabled ??
241:             false;
```

**src/components/narrative/NarrationController.jsx:239**
```javascript
236:           if (!liveControls?.next) return;
237:           const autoStillEnabled =
238:             liveControls.isAutoAdvanceEnabled?.() ??
239:             liveControls.getState?.()?.autoAdvanceEnabled ??
240:             stageAtom.getState?.()?.autoAdvanceEnabled ??
241:             false;
242:           if (!autoStillEnabled) return;
```

**src/components/narrative/NarrationController.jsx:240**
```javascript
237:           const autoStillEnabled =
238:             liveControls.isAutoAdvanceEnabled?.() ??
239:             liveControls.getState?.()?.autoAdvanceEnabled ??
240:             stageAtom.getState?.()?.autoAdvanceEnabled ??
241:             false;
242:           if (!autoStillEnabled) return;
243: 
```

**src/components/narrative/NarrationController.jsx:254**
```javascript
251:             return;
252:           }
253: 
254:           if (liveControls.canAutoAdvance && !liveControls.canAutoAdvance()) {
255:             narrationDiagnostic.log('AUTO_ADVANCE_WAIT', {
256:               stage: completedStageName,
257:               retryIn: AUTO_ADVANCE_RETRY_MS,
```

**src/components/narrative/NarrationController.jsx:267**
```javascript
264:                 retryIn: AUTO_ADVANCE_RETRY_MS,
265:               });
266:             }
267:             scheduleAutoAdvance(AUTO_ADVANCE_RETRY_MS);
268:             return;
269:           }
270: 
```

**src/components/narrative/NarrationController.jsx:316**
```javascript
313:           }
314: 
315:           const advanceVia = async () => {
316:             stateCommands.markAutoAdvance({ origin: 'narration_auto_advance' });
317:             try {
318:               const nav =
319:                 window.unifiedNav ||
```

**src/components/narrative/NarrationController.jsx:370**
```javascript
367:         timersRef.current.add(timeoutId);
368:       };
369: 
370:       scheduleAutoAdvance(AUTO_ADVANCE_DELAY_MS);
371:     },
372:     [unlockScroll]
373:   );
```

**src/components/narrative/NarrationController.jsx:440**
```javascript
437:           reason: 'complete',
438:           timestamp,
439:         });
440:         triggerAutoAdvance(stageName, 'narration_complete');
441:         activeStageRef.current = null;
442:       }
443:     },
```

**src/components/narrative/NarrationController.jsx:444**
```javascript
441:         activeStageRef.current = null;
442:       }
443:     },
444:     [triggerAutoAdvance]
445:   );
446: 
447:   const scheduleSegment = useCallback(
```

**src/components/narrative/NarrationController.jsx:584**
```javascript
581:           const fallbackDelay = durationMs + AUTO_ADVANCE_DELAY_MS + 200;
582:           const fallbackId = setTimeout(() => {
583:             timersRef.current.delete(fallbackId);
584:             if (hasTriggeredAutoAdvanceRef.current) return;
585:             narrationDiagnostic.log('AUTO_ADVANCE_FALLBACK', {
586:               stage: stageName,
587:               origin: 'last_beat_timeout',
```

**src/components/narrative/NarrationController.jsx:591**
```javascript
588:               fallbackDelay,
589:               timestamp: Date.now(),
590:             });
591:             triggerAutoAdvance(stageName, 'last_beat_timeout');
592:           }, fallbackDelay);
593:           timersRef.current.add(fallbackId);
594:         }
```

**src/components/narrative/NarrationController.jsx:599**
```javascript
596: 
597:       timersRef.current.add(timerId);
598:     },
599:     [defaultCharsPerSecond, triggerAutoAdvance]
600:   );
601: 
602:   const startNarration = useCallback(
```

**src/components/narrative/NarrationController.jsx:610**
```javascript
607:         currentStage,
608:         origin,
609:         isPlaying: activeStageRef.current !== null,
610:         autoAdvanceEnabled: autoAdvanceEnabledRef.current,
611:       });
612:       const trustedOrigins = new Set([
613:         'internal',
```

**src/components/narrative/NarrationController.jsx:754**
```javascript
751:       componentId,
752:       effectId,
753:       stage: currentStage,
754:       autoAdvance: autoAdvanceEnabled,
755:     });
756: 
757:     narrationDiagnostic.mountHistory.push({
```

**src/components/narrative/NarrationController.jsx:762**
```javascript
759:       componentId,
760:       effectId,
761:       stage: currentStage,
762:       autoAdvance: autoAdvanceEnabled,
763:       time: subscribedAt,
764:     });
765: 
```

**src/components/narrative/NarrationController.jsx:772**
```javascript
769:         componentId,
770:         effectId,
771:         stage: currentStage,
772:         autoAdvance: autoAdvanceEnabled,
773:         lifespan,
774:       });
775:       narrationDiagnostic.unmountHistory.push({
```

**src/components/narrative/NarrationController.jsx:780**
```javascript
777:         componentId,
778:         effectId,
779:         stage: currentStage,
780:         autoAdvance: autoAdvanceEnabled,
781:         time: Date.now(),
782:         lifespan,
783:       });
```

**src/components/narrative/NarrationController.jsx:785**
```javascript
782:         lifespan,
783:       });
784:     };
785:   }, [currentStage, autoAdvanceEnabled]);
786: 
787:   useEffect(() => {
788:     autoAdvanceEnabledRef.current = autoAdvanceEnabled;
```

**src/components/narrative/NarrationController.jsx:788**
```javascript
785:   }, [currentStage, autoAdvanceEnabled]);
786: 
787:   useEffect(() => {
788:     autoAdvanceEnabledRef.current = autoAdvanceEnabled;
789:   }, [autoAdvanceEnabled]);
790: 
791:   useEffect(() => {
```

**src/components/narrative/NarrationController.jsx:789**
```javascript
786: 
787:   useEffect(() => {
788:     autoAdvanceEnabledRef.current = autoAdvanceEnabled;
789:   }, [autoAdvanceEnabled]);
790: 
791:   useEffect(() => {
792:     if (typeof window === 'undefined') return () => {};
```

**src/components/narrative/NarrationController.jsx:863**
```javascript
860: 
861:     const deps = {
862:       currentStage,
863:       autoAdvanceEnabled,
864:       resetStateId: resetState,
865:       skipNarrationId: skipNarration,
866:       startNarrationId: startNarration,
```

**src/components/narrative/NarrationController.jsx:943**
```javascript
940:       narrationDiagnostic.log('STAGE_CHANGE_EVENT', {
941:         from: payload?.from ?? payload?.previousStage ?? null,
942:         to: nextStage,
943:         autoAdvance: autoAdvanceEnabledRef.current,
944:         isPlaying: activeStageRef.current !== null,
945:       });
946:       narrationDiagnostic.stageChangeEvents.push({
```

**src/components/narrative/NarrationController.jsx:980**
```javascript
977:       console.log('🔬 [NARRATION] CLEANUP_REASON', {
978:         stage: currentStage,
979:         wasPlaying: activeStageRef.current !== null,
980:         autoAdvance: autoAdvanceEnabledRef.current,
981:         caller: new Error().stack.split('\n')[2] ?? null,
982:       });
983:       offStart?.();
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

**src/orchestration/navigation/narrativeNavigation.js:54**
```javascript
51:   return true;
52: };
53: 
54: const toggleAutoAdvance = (forcedValue) => {
55:   const current = stateCommands.isAutoAdvanceEnabled();
56:   const nextValue =
57:     typeof forcedValue === 'boolean' ? forcedValue : !current;
```

**src/orchestration/navigation/narrativeNavigation.js:55**
```javascript
52: };
53: 
54: const toggleAutoAdvance = (forcedValue) => {
55:   const current = stateCommands.isAutoAdvanceEnabled();
56:   const nextValue =
57:     typeof forcedValue === 'boolean' ? forcedValue : !current;
58:   stateCommands.setAutoAdvanceEnabled(nextValue, { origin: 'narrative_navigation' });
```

**src/orchestration/navigation/narrativeNavigation.js:58**
```javascript
55:   const current = stateCommands.isAutoAdvanceEnabled();
56:   const nextValue =
57:     typeof forcedValue === 'boolean' ? forcedValue : !current;
58:   stateCommands.setAutoAdvanceEnabled(nextValue, { origin: 'narrative_navigation' });
59:   return nextValue;
60: };
61: 
```

**src/orchestration/navigation/narrativeNavigation.js:74**
```javascript
71:     currentIndex,
72:     allStages: stageNames,
73:     isTransitioning: !!info.isTransitioning,
74:     autoAdvanceEnabled: !!info.autoAdvanceEnabled,
75:     canGoPrev: currentIndex > 0,
76:     canGoNext: currentIndex < totalStages - 1,
77:   };
```

**src/orchestration/navigation/narrativeNavigation.js:154**
```javascript
151:   nextStage,
152:   prevStage,
153:   jumpToStage,
154:   toggleAutoAdvance,
155: };
156: 
157: if (typeof window !== 'undefined') {
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

**src/state/commands/StateCommands.js:330**
```javascript
327:     return true;
328:   }
329: 
330:   setAutoAdvanceEnabled(enabled, { origin = 'stateCommands' } = {}) {
331:     if (typeof stageAtom?.setAutoAdvanceEnabled !== 'function') {
332:       console.warn('[StateCommands] setAutoAdvanceEnabled unavailable');
333:       return false;
```

**src/state/commands/StateCommands.js:331**
```javascript
328:   }
329: 
330:   setAutoAdvanceEnabled(enabled, { origin = 'stateCommands' } = {}) {
331:     if (typeof stageAtom?.setAutoAdvanceEnabled !== 'function') {
332:       console.warn('[StateCommands] setAutoAdvanceEnabled unavailable');
333:       return false;
334:     }
```

**src/state/commands/StateCommands.js:332**
```javascript
329: 
330:   setAutoAdvanceEnabled(enabled, { origin = 'stateCommands' } = {}) {
331:     if (typeof stageAtom?.setAutoAdvanceEnabled !== 'function') {
332:       console.warn('[StateCommands] setAutoAdvanceEnabled unavailable');
333:       return false;
334:     }
335:     stageAtom.setAutoAdvanceEnabled(Boolean(enabled));
```

**src/state/commands/StateCommands.js:335**
```javascript
332:       console.warn('[StateCommands] setAutoAdvanceEnabled unavailable');
333:       return false;
334:     }
335:     stageAtom.setAutoAdvanceEnabled(Boolean(enabled));
336:     if (import.meta.env?.DEV) {
337:       console.log('🎚️ [StateCommands] Auto-advance toggled', {
338:         enabled: Boolean(enabled),
```

**src/state/commands/StateCommands.js:345**
```javascript
342:     return true;
343:   }
344: 
345:   markAutoAdvance({ origin = 'stateCommands' } = {}) {
346:     if (typeof stageAtom?.markAutoAdvance !== 'function') {
347:       console.warn('[StateCommands] markAutoAdvance unavailable');
348:       return false;
```

**src/state/commands/StateCommands.js:346**
```javascript
343:   }
344: 
345:   markAutoAdvance({ origin = 'stateCommands' } = {}) {
346:     if (typeof stageAtom?.markAutoAdvance !== 'function') {
347:       console.warn('[StateCommands] markAutoAdvance unavailable');
348:       return false;
349:     }
```

**src/state/commands/StateCommands.js:347**
```javascript
344: 
345:   markAutoAdvance({ origin = 'stateCommands' } = {}) {
346:     if (typeof stageAtom?.markAutoAdvance !== 'function') {
347:       console.warn('[StateCommands] markAutoAdvance unavailable');
348:       return false;
349:     }
350:     stageAtom.markAutoAdvance();
```

**src/state/commands/StateCommands.js:350**
```javascript
347:       console.warn('[StateCommands] markAutoAdvance unavailable');
348:       return false;
349:     }
350:     stageAtom.markAutoAdvance();
351:     if (import.meta.env?.DEV) {
352:       console.log('🕒 [StateCommands] markAutoAdvance invoked', { origin });
353:     }
```

**src/state/commands/StateCommands.js:352**
```javascript
349:     }
350:     stageAtom.markAutoAdvance();
351:     if (import.meta.env?.DEV) {
352:       console.log('🕒 [StateCommands] markAutoAdvance invoked', { origin });
353:     }
354:     return true;
355:   }
```

**src/state/commands/StateCommands.js:357**
```javascript
354:     return true;
355:   }
356: 
357:   canAutoAdvance() {
358:     return stageAtom?.canAutoAdvance?.() ?? true;
359:   }
360: 
```

**src/state/commands/StateCommands.js:358**
```javascript
355:   }
356: 
357:   canAutoAdvance() {
358:     return stageAtom?.canAutoAdvance?.() ?? true;
359:   }
360: 
361:   isAutoAdvanceEnabled() {
```

**src/state/commands/StateCommands.js:361**
```javascript
358:     return stageAtom?.canAutoAdvance?.() ?? true;
359:   }
360: 
361:   isAutoAdvanceEnabled() {
362:     return (
363:       stageAtom?.isAutoAdvanceEnabled?.() ??
364:       stageAtom?.getState?.()?.autoAdvanceEnabled ??
```

**src/state/commands/StateCommands.js:363**
```javascript
360: 
361:   isAutoAdvanceEnabled() {
362:     return (
363:       stageAtom?.isAutoAdvanceEnabled?.() ??
364:       stageAtom?.getState?.()?.autoAdvanceEnabled ??
365:       false
366:     );
```

**src/state/commands/StateCommands.js:364**
```javascript
361:   isAutoAdvanceEnabled() {
362:     return (
363:       stageAtom?.isAutoAdvanceEnabled?.() ??
364:       stageAtom?.getState?.()?.autoAdvanceEnabled ??
365:       false
366:     );
367:   }
```

**src/theater/TheaterDirector.js:18**
```javascript
15: 
16: // 🔬 DIAGNOSTIC: Auto-advance initialization tracking
17: if (typeof window !== 'undefined') {
18:   window.__autoAdvanceDiagnostic = {
19:     initialized: false,
20:     openingComplete: false,
21:     autoAdvanceEnabled: false,
```

**src/theater/TheaterDirector.js:21**
```javascript
18:   window.__autoAdvanceDiagnostic = {
19:     initialized: false,
20:     openingComplete: false,
21:     autoAdvanceEnabled: false,
22:     events: [],
23:     log: function (event, data) {
24:       const entry = {
```

**src/theater/TheaterDirector.js:72**
```javascript
69:     this.scrollOrchestrator = null;
70:     this.openingController = null;
71:     this.narrationController = null;
72:     const autoDiag = typeof window !== 'undefined' ? window.__autoAdvanceDiagnostic : null;
73:     if (autoDiag) {
74:       autoDiag.initialized = true;
75:       autoDiag.log?.('DIRECTOR_INITIALIZED', {
```

**src/theater/TheaterDirector.js:495**
```javascript
492:   }
493: 
494:   handleOpeningComplete({ skipTriggered, opening, elapsed }) {
495:     const autoDiag = typeof window !== 'undefined' ? window.__autoAdvanceDiagnostic : null;
496:     const currentState = stageAtom?.getStageInfo?.() ?? stageAtom?.getState?.() ?? {};
497:     const currentStage = currentState.currentStage ?? stageAtom?.getState?.()?.currentStage ?? null;
498:     const autoAdvanceBefore =
```

**src/theater/TheaterDirector.js:498**
```javascript
495:     const autoDiag = typeof window !== 'undefined' ? window.__autoAdvanceDiagnostic : null;
496:     const currentState = stageAtom?.getStageInfo?.() ?? stageAtom?.getState?.() ?? {};
497:     const currentStage = currentState.currentStage ?? stageAtom?.getState?.()?.currentStage ?? null;
498:     const autoAdvanceBefore =
499:       stageAtom?.isAutoAdvanceEnabled?.() ??
500:       currentState.autoAdvanceEnabled ??
501:       false;
```

**src/theater/TheaterDirector.js:499**
```javascript
496:     const currentState = stageAtom?.getStageInfo?.() ?? stageAtom?.getState?.() ?? {};
497:     const currentStage = currentState.currentStage ?? stageAtom?.getState?.()?.currentStage ?? null;
498:     const autoAdvanceBefore =
499:       stageAtom?.isAutoAdvanceEnabled?.() ??
500:       currentState.autoAdvanceEnabled ??
501:       false;
502: 
```

**src/theater/TheaterDirector.js:500**
```javascript
497:     const currentStage = currentState.currentStage ?? stageAtom?.getState?.()?.currentStage ?? null;
498:     const autoAdvanceBefore =
499:       stageAtom?.isAutoAdvanceEnabled?.() ??
500:       currentState.autoAdvanceEnabled ??
501:       false;
502: 
503:     if (autoDiag) {
```

**src/theater/TheaterDirector.js:507**
```javascript
504:       autoDiag.openingComplete = true;
505:       autoDiag.log('OPENING_COMPLETE', {
506:         stage: currentStage,
507:         autoAdvanceBefore,
508:       });
509:     }
510: 
```

**src/theater/TheaterDirector.js:512**
```javascript
509:     }
510: 
511:     const alreadyEnabled =
512:       stageAtom?.isAutoAdvanceEnabled?.() ??
513:       stageAtom?.getState?.()?.autoAdvanceEnabled ??
514:       false;
515: 
```

**src/theater/TheaterDirector.js:513**
```javascript
510: 
511:     const alreadyEnabled =
512:       stageAtom?.isAutoAdvanceEnabled?.() ??
513:       stageAtom?.getState?.()?.autoAdvanceEnabled ??
514:       false;
515: 
516:     let autoEnabled = alreadyEnabled;
```

**src/theater/TheaterDirector.js:522**
```javascript
519:     if (alreadyEnabled) {
520:       console.log('   Auto-advance already active');
521:     } else {
522:       autoEnabled = stateCommands.setAutoAdvanceEnabled(true, {
523:         origin: 'director_opening_complete',
524:       });
525:       if (autoEnabled) {
```

**src/theater/TheaterDirector.js:528**
```javascript
525:       if (autoEnabled) {
526:         console.log('✅ Auto-advance enabled for narration-driven progression');
527:       } else {
528:         failureReason = 'stateCommands.setAutoAdvanceEnabled failed';
529:         console.warn('⚠️ Unable to enable auto-advance via StateCommands');
530:       }
531:     }
```

**src/theater/TheaterDirector.js:533**
```javascript
530:       }
531:     }
532: 
533:     const autoAdvanceAfter =
534:       stageAtom?.isAutoAdvanceEnabled?.() ??
535:       stageAtom?.getState?.()?.autoAdvanceEnabled ??
536:       false;
```

**src/theater/TheaterDirector.js:534**
```javascript
531:     }
532: 
533:     const autoAdvanceAfter =
534:       stageAtom?.isAutoAdvanceEnabled?.() ??
535:       stageAtom?.getState?.()?.autoAdvanceEnabled ??
536:       false;
537: 
```

**src/theater/TheaterDirector.js:535**
```javascript
532: 
533:     const autoAdvanceAfter =
534:       stageAtom?.isAutoAdvanceEnabled?.() ??
535:       stageAtom?.getState?.()?.autoAdvanceEnabled ??
536:       false;
537: 
538:     if (autoDiag) {
```

**src/theater/TheaterDirector.js:539**
```javascript
536:       false;
537: 
538:     if (autoDiag) {
539:       autoDiag.autoAdvanceEnabled = autoAdvanceAfter;
540:       if (autoEnabled) {
541:         autoDiag.log('AUTO_ADVANCE_ENABLED', {
542:           success: true,
```

**src/theater/TheaterDirector.js:543**
```javascript
540:       if (autoEnabled) {
541:         autoDiag.log('AUTO_ADVANCE_ENABLED', {
542:           success: true,
543:           autoAdvanceAfter,
544:         });
545:       } else {
546:         autoDiag.log('AUTO_ADVANCE_FAILED', {
```

**src/theater/TheaterDirector.js:548**
```javascript
545:       } else {
546:         autoDiag.log('AUTO_ADVANCE_FAILED', {
547:           reason: failureReason ?? 'Unable to enable auto-advance',
548:           autoAdvanceAfter,
549:         });
550:       }
551:     }
```

**src/theater/controllers/OpeningSequenceController.js:681**
```javascript
678:         const timestamp = performance.now();
679:         console.log('✅ [OPENING COMPLETE]', {
680:           nextStage: 'discipline',
681:           shouldAutoAdvance: true,
682:           timestamp,
683:         });
684:       }
```

### DUPLICATE_EVENT (6 hits)

**src/components/narrative/NarrationController.jsx:1004**
```javascript
1001:       return;
1002:     }
1003: 
1004:     const isAlreadyPlayingCurrentStage =
1005:       activeStageRef.current && activeStageRef.current === currentStage;
1006: 
1007:     if (isAlreadyPlayingCurrentStage) {
```

**src/components/narrative/NarrationController.jsx:1007**
```javascript
1004:     const isAlreadyPlayingCurrentStage =
1005:       activeStageRef.current && activeStageRef.current === currentStage;
1006: 
1007:     if (isAlreadyPlayingCurrentStage) {
1008:       narrationDiagnostic.log('AUTO_START_SKIPPED_ALREADY_PLAYING', {
1009:         stage: currentStage,
1010:       });
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

**src/theater/TheaterDirector.js:228**
```javascript
225:     const previousStage = this.currentStage;
226:     if (previousStage === newStage) {
227:       if (DEBUG_NARRATION) {
228:         console.log('🎬 [STAGE CHANGE IGNORED] Duplicate stage event', {
229:           stage: newStage,
230:           payload,
231:         });
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

**src/theater/TheaterDirector.js:92**
```javascript
89:         hasTimeline: !!openingProbe?.timeline,
90:         chaos: openingProbe?.timeline?.chaos,
91:         coalesce: openingProbe?.timeline?.coalesce,
92:         settle: openingProbe?.timeline?.settle,
93:         hasChaosConfig: !!openingProbe?.timeline?.chaos,
94:       });
95:     } catch (timelineError) {
```

**src/theater/TheaterDirector.js:642**
```javascript
639:     if (!this._sleepWaiters) this._sleepWaiters = new Set();
640: 
641:     return new Promise((resolve) => {
642:       let settled = false;
643:       let timeoutId;
644: 
645:       const complete = (reason = 'elapsed') => {
```

**src/theater/TheaterDirector.js:646**
```javascript
643:       let timeoutId;
644: 
645:       const complete = (reason = 'elapsed') => {
646:         if (settled) return;
647:         settled = true;
648:         this._clearTimer(timeoutId);
649:         this._sleepWaiters.delete(complete);
```

**src/theater/TheaterDirector.js:647**
```javascript
644: 
645:       const complete = (reason = 'elapsed') => {
646:         if (settled) return;
647:         settled = true;
648:         this._clearTimer(timeoutId);
649:         this._sleepWaiters.delete(complete);
650:         resolve(reason);
```

**src/theater/TheaterDirector.js:682**
```javascript
679:   _waitForEvent(event, { timeout = 5000, predicate } = {}) {
680:     if (!event) return Promise.resolve(null);
681:     return new Promise((resolve) => {
682:       let settled = false;
683:       let timeoutId = null;
684: 
685:       const finish = (result) => {
```

**src/theater/TheaterDirector.js:686**
```javascript
683:       let timeoutId = null;
684: 
685:       const finish = (result) => {
686:         if (settled) return;
687:         settled = true;
688:         this._clearTimer(timeoutId);
689:         off?.();
```

**src/theater/TheaterDirector.js:687**
```javascript
684: 
685:       const finish = (result) => {
686:         if (settled) return;
687:         settled = true;
688:         this._clearTimer(timeoutId);
689:         off?.();
690:         resolve(result);
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

**src/theater/controllers/OpeningSequenceController.js:31**
```javascript
28: 
29: const DEFAULT_OPENING_TIMELINE = {
30:   blackout: { durationMs: 2000 },
31:   cursor: { blinkCount: 2, intervalMs: 500, leadInMs: 500, settleMs: 1000 },
32:   typing: { lines: DEFAULT_TYPING_LINES, typeSpeed: 50, lineDelay: 500, completionDelayMs: 800 },
33:   fill: { text: null, scrollSpeed: 100, durationMs: 2000 },
34:   chaos: { enabled: true, durationMs: 2000, rendererSpin: { z: 0.5, y: 0.2 } },
```

**src/theater/controllers/OpeningSequenceController.js:36**
```javascript
33:   fill: { text: null, scrollSpeed: 100, durationMs: 2000 },
34:   chaos: { enabled: true, durationMs: 2000, rendererSpin: { z: 0.5, y: 0.2 } },
35:   coalesce: { enabled: true, durationMs: 2000, morphTo: 0.6 },
36:   settle: { enabled: true, durationMs: 1500, morphTo: 1.0 },
37:   emergence: {
38:     durationMs: 2000,
39:     waitForFencepost: true,
```

**src/theater/controllers/OpeningSequenceController.js:113**
```javascript
110:         ...(openingTimeline.coalesce ?? {}),
111:         ...(stageTimeline.coalesce ?? {}),
112:       },
113:       settle: {
114:         ...DEFAULT_OPENING_TIMELINE.settle,
115:         ...(openingTimeline.settle ?? {}),
116:         ...(stageTimeline.settle ?? {}),
```

**src/theater/controllers/OpeningSequenceController.js:114**
```javascript
111:         ...(stageTimeline.coalesce ?? {}),
112:       },
113:       settle: {
114:         ...DEFAULT_OPENING_TIMELINE.settle,
115:         ...(openingTimeline.settle ?? {}),
116:         ...(stageTimeline.settle ?? {}),
117:       },
```

**src/theater/controllers/OpeningSequenceController.js:115**
```javascript
112:       },
113:       settle: {
114:         ...DEFAULT_OPENING_TIMELINE.settle,
115:         ...(openingTimeline.settle ?? {}),
116:         ...(stageTimeline.settle ?? {}),
117:       },
118:       profile: stageTimeline.profile ?? openingTimeline.profile ?? null,
```

**src/theater/controllers/OpeningSequenceController.js:116**
```javascript
113:       settle: {
114:         ...DEFAULT_OPENING_TIMELINE.settle,
115:         ...(openingTimeline.settle ?? {}),
116:         ...(stageTimeline.settle ?? {}),
117:       },
118:       profile: stageTimeline.profile ?? openingTimeline.profile ?? null,
119:       narration: stageTimeline.narration ?? openingTimeline.narration ?? null,
```

**src/theater/controllers/OpeningSequenceController.js:208**
```javascript
205:       ...(timeline?.cursor ?? {}),
206:     };
207:     const cursorLeadInMs = Math.max(0, Number(cursorConfig.leadInMs ?? 0));
208:     const cursorSettleMs = Math.max(0, Number(cursorConfig.settleMs ?? 0));
209:     const cursorBlinkCount = Math.max(
210:       0,
211:       Number(cursorConfig.blinkCount ?? DEFAULT_OPENING_TIMELINE.cursor.blinkCount),
```

**src/theater/controllers/OpeningSequenceController.js:265**
```javascript
262: 
263:     const chaosConfig = timeline?.chaos || {};
264:     const coalesceConfig = timeline?.coalesce || {};
265:     const settleConfig = timeline?.settle || {};
266: 
267:     const emergenceTimeline = {
268:       ...DEFAULT_OPENING_TIMELINE.emergence,
```

**src/theater/controllers/OpeningSequenceController.js:340**
```javascript
337:         }
338:         if (!skipTriggered) {
339:           BeatBus.emit(EVENTS.CURSOR_BLINK, { count: cursorBlinkCount, interval: cursorIntervalMs });
340:           if (cursorSettleMs > 0) {
341:             const waitResult = await this.director.sleep(cursorSettleMs);
342:             if (handleWaitResult(waitResult) === 'cancelled') return;
343:           }
```

**src/theater/controllers/OpeningSequenceController.js:341**
```javascript
338:         if (!skipTriggered) {
339:           BeatBus.emit(EVENTS.CURSOR_BLINK, { count: cursorBlinkCount, interval: cursorIntervalMs });
340:           if (cursorSettleMs > 0) {
341:             const waitResult = await this.director.sleep(cursorSettleMs);
342:             if (handleWaitResult(waitResult) === 'cancelled') return;
343:           }
344:         }
```

**src/theater/controllers/OpeningSequenceController.js:396**
```javascript
393:           } catch (bindError) {
394:             console.warn('🎬 Director: Pre-chaos blueprint bind failed', bindError);
395:           }
396:           const bindSettleMs = Math.max(0, Number(chaosConfig?.bindLeadInMs ?? 120));
397:           if (bindSettleMs > 0) {
398:             const waitResult = await this.director.sleep(bindSettleMs);
399:             if (handleWaitResult(waitResult) === 'cancelled') return;
```

**src/theater/controllers/OpeningSequenceController.js:397**
```javascript
394:             console.warn('🎬 Director: Pre-chaos blueprint bind failed', bindError);
395:           }
396:           const bindSettleMs = Math.max(0, Number(chaosConfig?.bindLeadInMs ?? 120));
397:           if (bindSettleMs > 0) {
398:             const waitResult = await this.director.sleep(bindSettleMs);
399:             if (handleWaitResult(waitResult) === 'cancelled') return;
400:           }
```

**src/theater/controllers/OpeningSequenceController.js:398**
```javascript
395:           }
396:           const bindSettleMs = Math.max(0, Number(chaosConfig?.bindLeadInMs ?? 120));
397:           if (bindSettleMs > 0) {
398:             const waitResult = await this.director.sleep(bindSettleMs);
399:             if (handleWaitResult(waitResult) === 'cancelled') return;
400:           }
401:         }
```

**src/theater/controllers/OpeningSequenceController.js:490**
```javascript
487:         currentMorphValue = coalesceTarget;
488:       }
489: 
490:       if (!skipTriggered && settleConfig?.enabled !== false) {
491:         console.log('🔍 [ABOUT TO START SETTLE]', {
492:           settleConfig,
493:           currentMorph: currentMorphValue,
```

**src/theater/controllers/OpeningSequenceController.js:491**
```javascript
488:       }
489: 
490:       if (!skipTriggered && settleConfig?.enabled !== false) {
491:         console.log('🔍 [ABOUT TO START SETTLE]', {
492:           settleConfig,
493:           currentMorph: currentMorphValue,
494:           timestamp: Date.now(),
```

**src/theater/controllers/OpeningSequenceController.js:492**
```javascript
489: 
490:       if (!skipTriggered && settleConfig?.enabled !== false) {
491:         console.log('🔍 [ABOUT TO START SETTLE]', {
492:           settleConfig,
493:           currentMorph: currentMorphValue,
494:           timestamp: Date.now(),
495:         });
```

**src/theater/controllers/OpeningSequenceController.js:496**
```javascript
493:           currentMorph: currentMorphValue,
494:           timestamp: Date.now(),
495:         });
496:         const settleDuration = Math.max(0, Number(settleConfig.durationMs) || 0);
497:         this.director.phase = 'settle';
498:         console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
499:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
```

**src/theater/controllers/OpeningSequenceController.js:497**
```javascript
494:           timestamp: Date.now(),
495:         });
496:         const settleDuration = Math.max(0, Number(settleConfig.durationMs) || 0);
497:         this.director.phase = 'settle';
498:         console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
499:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
500:           name: 'settle',
```

**src/theater/controllers/OpeningSequenceController.js:498**
```javascript
495:         });
496:         const settleDuration = Math.max(0, Number(settleConfig.durationMs) || 0);
497:         this.director.phase = 'settle';
498:         console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
499:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
500:           name: 'settle',
501:           duration: settleDuration,
```

**src/theater/controllers/OpeningSequenceController.js:500**
```javascript
497:         this.director.phase = 'settle';
498:         console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
499:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
500:           name: 'settle',
501:           duration: settleDuration,
502:           morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
503:         });
```

**src/theater/controllers/OpeningSequenceController.js:501**
```javascript
498:         console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
499:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
500:           name: 'settle',
501:           duration: settleDuration,
502:           morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
503:         });
504:         const hasSettleTarget = typeof settleConfig.morphTo === 'number';
```

**src/theater/controllers/OpeningSequenceController.js:502**
```javascript
499:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
500:           name: 'settle',
501:           duration: settleDuration,
502:           morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
503:         });
504:         const hasSettleTarget = typeof settleConfig.morphTo === 'number';
505:         const settleTarget = hasSettleTarget ? clamp01(settleConfig.morphTo) : currentMorphValue;
```

**src/theater/controllers/OpeningSequenceController.js:504**
```javascript
501:           duration: settleDuration,
502:           morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
503:         });
504:         const hasSettleTarget = typeof settleConfig.morphTo === 'number';
505:         const settleTarget = hasSettleTarget ? clamp01(settleConfig.morphTo) : currentMorphValue;
506:         let settleAnimation = null;
507:         if (hasSettleTarget) {
```

**src/theater/controllers/OpeningSequenceController.js:505**
```javascript
502:           morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
503:         });
504:         const hasSettleTarget = typeof settleConfig.morphTo === 'number';
505:         const settleTarget = hasSettleTarget ? clamp01(settleConfig.morphTo) : currentMorphValue;
506:         let settleAnimation = null;
507:         if (hasSettleTarget) {
508:           settleAnimation = animateMorph(currentMorphValue, settleTarget, settleDuration, 'settle');
```

**src/theater/controllers/OpeningSequenceController.js:506**
```javascript
503:         });
504:         const hasSettleTarget = typeof settleConfig.morphTo === 'number';
505:         const settleTarget = hasSettleTarget ? clamp01(settleConfig.morphTo) : currentMorphValue;
506:         let settleAnimation = null;
507:         if (hasSettleTarget) {
508:           settleAnimation = animateMorph(currentMorphValue, settleTarget, settleDuration, 'settle');
509:         } else {
```

**src/theater/controllers/OpeningSequenceController.js:507**
```javascript
504:         const hasSettleTarget = typeof settleConfig.morphTo === 'number';
505:         const settleTarget = hasSettleTarget ? clamp01(settleConfig.morphTo) : currentMorphValue;
506:         let settleAnimation = null;
507:         if (hasSettleTarget) {
508:           settleAnimation = animateMorph(currentMorphValue, settleTarget, settleDuration, 'settle');
509:         } else {
510:           emitMorphSnapshot(currentMorphValue, 'settle', settleTarget, settleDuration);
```

**src/theater/controllers/OpeningSequenceController.js:508**
```javascript
505:         const settleTarget = hasSettleTarget ? clamp01(settleConfig.morphTo) : currentMorphValue;
506:         let settleAnimation = null;
507:         if (hasSettleTarget) {
508:           settleAnimation = animateMorph(currentMorphValue, settleTarget, settleDuration, 'settle');
509:         } else {
510:           emitMorphSnapshot(currentMorphValue, 'settle', settleTarget, settleDuration);
511:         }
```

**src/theater/controllers/OpeningSequenceController.js:510**
```javascript
507:         if (hasSettleTarget) {
508:           settleAnimation = animateMorph(currentMorphValue, settleTarget, settleDuration, 'settle');
509:         } else {
510:           emitMorphSnapshot(currentMorphValue, 'settle', settleTarget, settleDuration);
511:         }
512:         if (settleDuration > 0) {
513:           const waitResult = await this.director.sleep(settleDuration);
```

**src/theater/controllers/OpeningSequenceController.js:512**
```javascript
509:         } else {
510:           emitMorphSnapshot(currentMorphValue, 'settle', settleTarget, settleDuration);
511:         }
512:         if (settleDuration > 0) {
513:           const waitResult = await this.director.sleep(settleDuration);
514:           if (handleWaitResult(waitResult) === 'cancelled') return;
515:         }
```

**src/theater/controllers/OpeningSequenceController.js:513**
```javascript
510:           emitMorphSnapshot(currentMorphValue, 'settle', settleTarget, settleDuration);
511:         }
512:         if (settleDuration > 0) {
513:           const waitResult = await this.director.sleep(settleDuration);
514:           if (handleWaitResult(waitResult) === 'cancelled') return;
515:         }
516:         if (settleAnimation) {
```

**src/theater/controllers/OpeningSequenceController.js:516**
```javascript
513:           const waitResult = await this.director.sleep(settleDuration);
514:           if (handleWaitResult(waitResult) === 'cancelled') return;
515:         }
516:         if (settleAnimation) {
517:           await settleAnimation;
518:         }
519:         currentMorphValue = settleTarget;
```

**src/theater/controllers/OpeningSequenceController.js:517**
```javascript
514:           if (handleWaitResult(waitResult) === 'cancelled') return;
515:         }
516:         if (settleAnimation) {
517:           await settleAnimation;
518:         }
519:         currentMorphValue = settleTarget;
520:       }
```

**src/theater/controllers/OpeningSequenceController.js:519**
```javascript
516:         if (settleAnimation) {
517:           await settleAnimation;
518:         }
519:         currentMorphValue = settleTarget;
520:       }
521: 
522:       if (skipTriggered) {
```

### JUMP_TO_STAGE (9 hits)

**src/orchestration/navigation/narrativeNavigation.js:98**
```javascript
95:       id: name,
96:       label,
97:       isActive: activeStage === name,
98:       onClick: () => jumpToStage(name, { smooth: true, emitNarration: true }),
99:       index,
100:     };
101:   });
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

**src/state/commands/StateCommands.js:326**
```javascript
323:       return false;
324:     }
325:     this.pendingStageMeta = { ...meta };
326:     stageAtom.jumpToStage(targetStage);
327:     return true;
328:   }
329: 
```

### FALLBACK_JUMP (3 hits)

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

### STAGE_ATOM_SET (16 hits)

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

**src/state/commands/StateCommands.js:316**
```javascript
313:   }
314: 
315:   transitionStage(from, to) {
316:     stageAtom.setState?.({ currentStage: to, transitioning: true });
317:     narrativeAtom.setState?.(prev => ({ ...prev, paused: true }));
318:   }
319: 
```

**src/state/commands/StateCommands.js:326**
```javascript
323:       return false;
324:     }
325:     this.pendingStageMeta = { ...meta };
326:     stageAtom.jumpToStage(targetStage);
327:     return true;
328:   }
329: 
```

**src/state/commands/StateCommands.js:335**
```javascript
332:       console.warn('[StateCommands] setAutoAdvanceEnabled unavailable');
333:       return false;
334:     }
335:     stageAtom.setAutoAdvanceEnabled(Boolean(enabled));
336:     if (import.meta.env?.DEV) {
337:       console.log('🎚️ [StateCommands] Auto-advance toggled', {
338:         enabled: Boolean(enabled),
```

**src/state/commands/StateCommands.js:384**
```javascript
381: 
382:   restoreSnapshot(snapshot) {
383:     if (snapshot?.state) {
384:       stageAtom.setState?.(snapshot.state.stage);
385:       narrativeAtom.setState?.(snapshot.state.narrative);
386:       qualityAtom.setState?.(snapshot.state.quality);
387:       interactionAtom.setState?.(snapshot.state.interaction);
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

### SCROLL_ORCHESTRATOR (1 hits)

**src/theater/controllers/OpeningSequenceController.js:672**
```javascript
669:       if (!this.director.scrollOrchestrator) {
670:         this.director.scrollOrchestrator = new ScrollOrchestrator();
671:       }
672:       this.director.scrollOrchestrator.start?.();
673:       this.director.monitorFragments?.();
674: 
675:       this.director.phase = 'complete';
```

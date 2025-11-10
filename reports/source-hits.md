# Source Evidence Scan

## STAGE_CHANGE

- `src/bootstrap/wireSSTv3.js:94`

```text
92:     if (stageAtom && state.currentStage !== stageAtom.getState().currentStage) {
93:       // DISABLED: This bypasses orchestration
94:       // stageAtom.jumpToStage(state.currentStage);
95:     }
96:   });
```

- `src/components/consciousness/ConsciousnessTheater.jsx:388`

```text
386:             });
387:           } else {
388:             stageAtom.jumpToStage(targetStage);
389:           }
390:         }
```

- `src/components/consciousness/ConsciousnessTheater.jsx:445`

```text
443:         case 'r':
444:         case 'R':
445:           stageAtom.jumpToStage('genesis');
446:           morphProgressRef.current = stateCommands.setMorphProgress(0, { origin: 'reset' });
447:           break;
```

- `src/components/narrative/NarrationController.jsx:952`

```text
950: 
951:     const offStart = BeatBus.on?.(EVENTS.START_NARRATIVE, handleStart);
952:     const offStageChange = BeatBus.on?.(EVENTS.STAGE_CHANGE, handleStageChange);
953: 
954:     const keyHandler = (event) => {
```

- `src/components/webgl/WebGLBackground.jsx:800`

```text
798:   // Passive fallbacks (OK to keep)
799:   useEffect(() => {
800:     const off = BeatBus?.on?.(EVENTS.STAGE_CHANGE, (p) => {
801:       const st = p?.stage ?? p?.to ?? p?.name ?? String(p);
802:       setStageName(st);
```

- `src/components/webgl/WebGLBackground.jsx:826`

```text
824:   useEffect(() => {
825:     let morphProbeTimer = null;
826:     const off = BeatBus?.on?.(EVENTS.STAGE_CHANGE, () => {
827:       if (morphProbeTimer) {
828:         clearInterval(morphProbeTimer);
```

- `src/config/canonical/sst-v3.3.json:58`

```text
56:         "writes": ["eventsOnly"],
57:         "forbidden": ["geometry", "uniforms"],
58:         "notes": "Maps window scroll→stage-local progress; publishes MORPH_PROGRESS; emits STAGE_CHANGE at breakpoints and MEMORY_FRAGMENT_TRIGGER from per-stage triggerPercent. Renderer remains a dumb sink."
59:       }
60:     },
```

- `src/config/canonical/sst-v3.3.json:271`

```text
269:     },
270:     {
271:       "name": "STAGE_CHANGE",
272:       "emitter": "Director",
273:       "payload": {
```

- `src/contracts/OptimizedContracts.js:8`

```text
6:   static enforceShape(event, payload) {
7:     const contracts = {
8:       STAGE_CHANGE: ['stage'],
9:       QUALITY_CHANGE: ['quality'],
10:       BLUEPRINT_READY: ['blueprint', 'stage', 'quality'],
```

- `src/engine/ConsciousnessEngine.js:389`

```text
387:     subscribe('ENGINE_VIEWPORT_HINT', this._onViewportHint.bind(this));
388:     subscribe('ENABLE_SCROLL', this._onEnableScroll.bind(this));
389:     subscribe('STAGE_CHANGE', this._onStageChange.bind(this));
390:     subscribe('QUALITY_CHANGE', this._onQualityChange.bind(this));
391:     subscribe('PREWARM_GENESIS_BLUEPRINT', this._onPrewarmGenesis.bind(this));
```

- `src/engine/ConsciousnessEngine.js:478`

```text
476:     this.currentStage = stage;
477:     if (skipBlueprint) {
478:       this._log('stage_change', { stage, skippedBlueprint: true });
479:       if (preserveEmergence && stage === 'genesis') {
480:         this._log('stage_preserve_emergence', { preserved: !!this._lastEmergenceTargets });
```

- `src/engine/ConsciousnessEngine.js:485`

```text
483:     }
484:     this.buildAndEmitBlueprint(stage, this.currentQuality);
485:     this._log('stage_change', { stage });
486:   }
487: 
```

- `src/hooks/atoms/useNarrativeStore.js:21`

```text
19: 
20:     // Actions (bound to atom)
21:     jumpToStage: narrativeAtom.jumpToStage,
22:     nextStage: narrativeAtom.nextStage,
23:     prevStage: narrativeAtom.prevStage,
```

- `src/orchestration/navigation/narrativeNavigation.js:26`

```text
24: };
25: 
26: const jumpToStage = (stageName, options = {}) => {
27:   const stageNames = getStageNames();
28:   const targetIndex = stageNames.indexOf(stageName);
```

- `src/orchestration/navigation/narrativeNavigation.js:97`

```text
95:       label,
96:       isActive: activeStage === name,
97:       onClick: () => jumpToStage(name, { smooth: true, emitNarration: true }),
98:       index,
99:     };
```

- `src/orchestration/navigation/narrativeNavigation.js:152`

```text
150:   nextStage,
151:   prevStage,
152:   jumpToStage,
153:   toggleAutoAdvance,
154: };
```

- `src/state/atoms/narrativeAtom.js:69`

```text
67: export const narrativeAtom = createAtom(initialState, (get, set) => ({
68:   // ===== STAGE NAVIGATION =====
69:   jumpToStage: stage => {
70:     console.log('🚨 [NARRATIVEATOM BYPASS]', {
71:       function: 'jumpToStage',
```

- `src/state/atoms/narrativeAtom.js:71`

```text
69:   jumpToStage: stage => {
70:     console.log('🚨 [NARRATIVEATOM BYPASS]', {
71:       function: 'jumpToStage',
72:       targetStage: stage,
73:       caller: new Error().stack.split('\n')[2].trim(),
```

- `src/state/atoms/narrativeAtom.js:124`

```text
122:     const currentIndex = STAGE_ORDER.indexOf(current);
123:     if (currentIndex < STAGE_ORDER.length - 1) {
124:       narrativeAtom.jumpToStage(STAGE_ORDER[currentIndex + 1]);
125:     }
126:   },
```

- `src/state/atoms/narrativeAtom.js:140`

```text
138:     const currentIndex = STAGE_ORDER.indexOf(current);
139:     if (currentIndex > 0) {
140:       narrativeAtom.jumpToStage(STAGE_ORDER[currentIndex - 1]);
141:     }
142:   },
```

- `src/state/atoms/narrativeAtom.js:146`

```text
144:   setStage: stageIndex => {
145:     const stage = STAGE_ORDER[stageIndex] || STAGE_ORDER[0];
146:     narrativeAtom.jumpToStage(stage);
147:   },
148: 
```

- `src/state/atoms/qualityAtom.js:155`

```text
153:     if (unsubscribe) return; // Already initialized
154:     
155:     unsubscribe = BeatBus.on(EVENTS.STAGE_CHANGE, (payload) => {
156:       const stage = payload?.to || payload?.stage;
157:       if (stage && stage !== get().currentStage) {
```

- `src/state/atoms/stageAtom.js:407`

```text
405:     },
406:     
407:     jumpToStage: (stageInput) => {
408:       const stageName = resolveStageName(stageInput);
409:       const stageIndex = stageName != null ? STAGE_NAMES.indexOf(stageName) : -1;
```

- `src/state/atoms/stageAtom.js:427`

```text
425:       };
426: 
427:       batchedSetState(updates, 'jumpToStage');
428: 
429:       if (import.meta.env.DEV) {
```

- `src/state/atoms/stageAtom.js:623`

```text
621:         const clampedIndex = Math.max(0, Math.min(index, STAGE_COUNT - 1));
622:         const stageName = STAGE_NAMES[clampedIndex];
623:         actions.jumpToStage(stageName);
624:       }
625:     },
```

- `src/state/atoms/stageAtom.js:676`

```text
674: 
675:     // Navigation helpers
676:     jumpToStage: (stage) => stageAtom.jumpToStage(stage),
677:     jumpTo: (stage) => stageAtom.jumpToStage(stage), // legacy alias
678:     next: () => stageAtom.nextStage(),
```

- `src/state/atoms/stageAtom.js:677`

```text
675:     // Navigation helpers
676:     jumpToStage: (stage) => stageAtom.jumpToStage(stage),
677:     jumpTo: (stage) => stageAtom.jumpToStage(stage), // legacy alias
678:     next: () => stageAtom.nextStage(),
679:     prev: () => stageAtom.prevStage(),
```

- `src/state/atoms/stageAtom.js:706`

```text
704:       for (let i = 0; i < iterations; i++) {
705:         const randomStage = STAGE_NAMES[Math.floor(Math.random() * STAGE_NAMES.length)];
706:         stageAtom.jumpToStage(randomStage);
707:         stageAtom.setStageProgress(Math.random());
708:       }
```

- `src/state/commands/StateCommands.js:81`

```text
79:     let lastQualityFromBus = qualityAtom.getState?.()?.currentQualityTier ?? null;
80: 
81:     const stageBusSub = BeatBus.on?.(EVENTS.STAGE_CHANGE, (payload = {}) => {
82:       const stage = payload.to ?? payload.stage ?? payload.name ?? null;
83:       if (stage) {
```

- `src/state/commands/StateCommands.js:107`

```text
105:         }
106:         // Emit stage change events
107:         BeatBus.emit(EVENTS.STAGE_CHANGE, { 
108:           from: prevStage, 
109:           to: next, 
```

- `src/state/commands/StateCommands.js:194`

```text
192:       if (!gateActive || gateTarget === targetStage) {
193:         if (currentStage !== targetStage) {
194:           stageAtom.jumpToStage(targetStage);
195:         }
196:       }
```

- `src/theater/ScrollOrchestrator.js:3`

```text
1: // src/theater/ScrollOrchestrator.js
2: // BeatGlyph v3.3 — ScrollOrchestrator
3: // Purpose: map window scroll -> stage-local progress; publish MORPH_PROGRESS and STAGE_CHANGE.
4: // Kinetics: speedMultiplier=2.0, smoothing=0.15, overshoot=0.05 (v3.3 canon)
5: 
```

- `src/theater/ScrollOrchestrator.js:346`

```text
344:           timestamp: performance.now(),
345:         });
346:         BeatBus.emit?.(EVENTS.STAGE_CHANGE, { 
347:           stage: stageName, 
348:           index: stageIdx,
```

- `src/theater/TheaterDirector.js:165`

```text
163: 
164:     if (typeof BeatBus?.on === 'function') {
165:       this._stageChangeUnsubscribe = BeatBus.on(EVENTS.STAGE_CHANGE, this._handleStageChangeBound);
166:     }
167:   }
```

- `src/theater/TheaterDirector.js:1302`

```text
1300:       console.log('🧬 Phase: Genesis stage handoff');
1301: 
1302:       BeatBus.emit(EVENTS.STAGE_CHANGE, {
1303:         from: previousStage,
1304:         to: toStage,
```

- `src/theater/TheaterDirector.js:1734`

```text
1732:   version: '1.0.1',
1733:   events: {
1734:     STAGE_CHANGE: {
1735:       required: ['from', 'to'],
1736:       notes: 'Canonical shape. Old `{stage}` payload is deprecated.',
```

- `src/theater/TheaterDirector.js:1754`

```text
1752:   },
1753:   deprecations: {
1754:     STAGE_CHANGE: { stage: 'deprecated' },
1755:     QUALITY_CHANGE: { quality: 'deprecated' },
1756:   },
```

- `src/theater/UnifiedNavigationAPI.js:7`

```text
5:  * Guarantees full orchestration (fragments, scroll sync, narration).
6:  *
7:  * RULE: Nothing should call narrativeAtom.jumpToStage directly.
8:  * RULE: Nothing should call stageAtom.jumpToStage directly.
9:  * RULE: All navigation goes through this API.
```

- `src/theater/UnifiedNavigationAPI.js:8`

```text
6:  *
7:  * RULE: Nothing should call narrativeAtom.jumpToStage directly.
8:  * RULE: Nothing should call stageAtom.jumpToStage directly.
9:  * RULE: All navigation goes through this API.
10:  */
```

- `src/theater/UnifiedNavigationAPI.js:76`

```text
74:       const currentStage = stageAtom.getState?.()?.currentStage;
75:       if (currentStage !== targetStage) {
76:         stageAtom.jumpToStage(targetStage);
77:       }
78:       return true;
```

- `src/theater/UnifiedNavigationAPI.js:102`

```text
100:       if (maxScroll <= 0 || Number.isNaN(scrollTarget)) {
101:         console.warn('🚨 [UNIFIED NAV] Document not scrollable - using direct stage jump as fallback');
102:         if (window.stageControls?.jumpToStage) {
103:           window.stageControls.jumpToStage(targetStage);
104:         } else {
```

- `src/theater/UnifiedNavigationAPI.js:103`

```text
101:         console.warn('🚨 [UNIFIED NAV] Document not scrollable - using direct stage jump as fallback');
102:         if (window.stageControls?.jumpToStage) {
103:           window.stageControls.jumpToStage(targetStage);
104:         } else {
105:           stageAtom.jumpToStage(targetStage);
```

- `src/theater/UnifiedNavigationAPI.js:105`

```text
103:           window.stageControls.jumpToStage(targetStage);
104:         } else {
105:           stageAtom.jumpToStage(targetStage);
106:         }
107:         finalReason = 'fallback';
```

- `src/theater/UnifiedNavigationAPI.js:124`

```text
122:       const currentStage = stageAtom.getState?.()?.currentStage;
123:       if (currentStage !== targetStage) {
124:         stageAtom.jumpToStage(targetStage);
125:       }
126: 
```

- `src/theater/UnifiedNavigationAPI.js:192`

```text
190:    */
191:   onStageChange(callback) {
192:     return BeatBus.on('STAGE_CHANGE', callback);
193:   }
194: }
```

- `src/theater/bus/index.js:237`

```text
235:       this._contracts = {
236:         events: {
237:           STAGE_CHANGE: { required: ['from', 'to'] },
238:           QUALITY_CHANGE: { required: ['tier'] },
239:           BLUEPRINT_READY: { required: ['stage', 'quality', 'blueprint'] }
```

- `src/theater/bus/index.js:303`

```text
301:     
302:     // Fallback canonicalization
303:     if (evt==='STAGE_CHANGE'){
304:       if (p.stage && !p.to) p.to = p.stage;
305:       if (!p.from) p.from = this._last.stage || 'unknown';
```

- `src/theater/bus/index.js:402`

```text
400: 
401:     // maintain last state hints for better "from"
402:     if (evt==='STAGE_CHANGE' && canonPayloadWithBase?.to) this._last.stage = canonPayloadWithBase.to;
403:     if (evt==='QUALITY_CHANGE' && canonPayloadWithBase?.tier) this._last.quality = canonPayloadWithBase.tier;
404: 
```

- `src/theater/bus/schemas.js:15`

```text
13: 
14: const EVENT_SCHEMAS = new Map([
15:   ['STAGE_CHANGE', {
16:     required: { from: 'string', to: 'string' },
17:     extended: {
```

- `src/theater/events-safe.js:6`

```text
4: export const EVENTS_CORE = {
5:   // Critical opening sequence events
6:   STAGE_CHANGE: 'STAGE_CHANGE',
7:   QUALITY_CHANGE: 'QUALITY_CHANGE',
8:   BLUEPRINT_READY: 'BLUEPRINT_READY',
```

- `src/theater/events.js:34`

```text
32:   NARRATION_STOPPED: 'NARRATION_STOPPED',
33:   NARRATION_CLEANUP: 'NARRATION_CLEANUP',
34:   STAGE_CHANGE: 'STAGE_CHANGE',                  // { from, to } (canonical)
35:   START_CLIMAX: 'START_CLIMAX',                  // Trigger climax sequence
36: 
```

## OPENING_PHASE

- `src/components/consciousness/ConsciousnessTheater.jsx:123`

```text
121:           border: 'none',
122:           borderRadius: '5px',
123:           cursor: 'pointer',
124:           fontFamily: 'Courier New, monospace',
125:           fontWeight: 'bold',
```

- `src/components/fragments/NarrationFragment.jsx:134`

```text
132:         >
133:           {displayedText}
134:           {!isComplete && <span className="cursor">|</span>}
135:         </p>
136:       </div>
```

- `src/components/fragments/NarrationFragment.jsx:154`

```text
152: 
153:       <style>{`
154:         .cursor {
155:           animation: blink 1s step-end infinite;
156:         }
```

- `src/components/theater/OpeningSequence.jsx:14`

```text
12: export default function OpeningSequence() {
13:   const [visible, setVisible] = useState(false);
14:   const [phase, setPhase] = useState('black');
15:   const [cursorVisible, setCursorVisible] = useState(false);
16:   const [lines, setLines] = useState([]);
```

- `src/components/theater/OpeningSequence.jsx:79`

```text
77: 
78:     const eventHandlers = [
79:       // CURSOR SHOW
80:       BeatBus.on(EVENTS.CURSOR_SHOW, () => {
81:         console.log('   OpeningSequence: CURSOR_SHOW received');
```

- `src/components/theater/OpeningSequence.jsx:82`

```text
80:       BeatBus.on(EVENTS.CURSOR_SHOW, () => {
81:         console.log('   OpeningSequence: CURSOR_SHOW received');
82:         setPhase('cursor');
83:         setCursorVisible(true);
84:       }),
```

- `src/components/theater/OpeningSequence.jsx:86`

```text
84:       }),
85: 
86:       // CURSOR BLINK
87:       BeatBus.on(EVENTS.CURSOR_BLINK, async ({ count = 2, interval = 500 } = {}) => {
88:         console.log(`   OpeningSequence: CURSOR_BLINK received (${count} times)`);
```

- `src/components/theater/OpeningSequence.jsx:102`

```text
100: 
101:       // TERMINAL TYPE
102:       BeatBus.on(EVENTS.TERMINAL_TYPE, async ({ lines: toType = [], typeSpeed = 50, lineDelay = 300 } = {}) => {
103:         console.log('   OpeningSequence: TERMINAL_TYPE received');
104:         setPhase('typing');
```

- `src/components/theater/OpeningSequence.jsx:103`

```text
101:       // TERMINAL TYPE
102:       BeatBus.on(EVENTS.TERMINAL_TYPE, async ({ lines: toType = [], typeSpeed = 50, lineDelay = 300 } = {}) => {
103:         console.log('   OpeningSequence: TERMINAL_TYPE received');
104:         setPhase('typing');
105:         setCursorVisible(false);
```

- `src/components/theater/OpeningSequence.jsx:143`

```text
141: 
142:       // SCREEN FILL
143:       BeatBus.on(EVENTS.SCREEN_FILL, ({ text = `${GENESIS_STAGE_WORD} `, scrollSpeed = 50 } = {}) => {
144:         console.log('   OpeningSequence: SCREEN_FILL received');
145:         setPhase('fill');
```

- `src/components/theater/OpeningSequence.jsx:144`

```text
142:       // SCREEN FILL
143:       BeatBus.on(EVENTS.SCREEN_FILL, ({ text = `${GENESIS_STAGE_WORD} `, scrollSpeed = 50 } = {}) => {
144:         console.log('   OpeningSequence: SCREEN_FILL received');
145:         setPhase('fill');
146: 
```

- `src/components/theater/OpeningSequence.jsx:249`

```text
247:       }}
248:     >
249:       {/* BLACK SCREEN PHASE */}
250:       {phase === 'black' && (
251:         <div style={{ width: '100%', height: '100%', backgroundColor: '#000000' }} />
```

- `src/components/theater/OpeningSequence.jsx:250`

```text
248:     >
249:       {/* BLACK SCREEN PHASE */}
250:       {phase === 'black' && (
251:         <div style={{ width: '100%', height: '100%', backgroundColor: '#000000' }} />
252:       )}
```

- `src/components/theater/OpeningSequence.jsx:254`

```text
252:       )}
253: 
254:       {/* CURSOR PHASE */}
255:       {phase === 'cursor' && (
256:         <div
```

- `src/components/theater/OpeningSequence.jsx:255`

```text
253: 
254:       {/* CURSOR PHASE */}
255:       {phase === 'cursor' && (
256:         <div
257:           style={{
```

- `src/components/ui/NarrativeUIControls.jsx:80`

```text
78:                   padding: '0.25rem 0.5rem',
79:                   fontSize: '0.75rem',
80:                   cursor: navState.isTransitioning ? 'not-allowed' : 'pointer',
81:                   transition: 'all 0.2s',
82:                   opacity: navState.isTransitioning ? 0.5 : 1,
```

- `src/components/ui/NarrativeUIControls.jsx:139`

```text
137:               padding: '0.25rem 0.5rem',
138:               fontSize: '0.75rem',
139:               cursor: navState.canGoPrev && !navState.isTransitioning ? 'pointer' : 'not-allowed',
140:               opacity: navState.canGoPrev && !navState.isTransitioning ? 1 : 0.3,
141:             }}
```

- `src/components/ui/NarrativeUIControls.jsx:166`

```text
164:               padding: '0.25rem 0.5rem',
165:               fontSize: '0.75rem',
166:               cursor: navState.canGoNext && !navState.isTransitioning ? 'pointer' : 'not-allowed',
167:               opacity: navState.canGoNext && !navState.isTransitioning ? 1 : 0.3,
168:             }}
```

- `src/components/ui/NarrativeUIControls.jsx:184`

```text
182:             padding: '0.25rem 0.5rem',
183:             fontSize: '0.75rem',
184:             cursor: 'pointer',
185:             transition: 'all 0.2s',
186:           }}
```

- `src/components/ui/narrative/MemoryFragments.jsx:136`

```text
134:               borderRadius: '50%',
135:               zIndex: 15,
136:               cursor: 'pointer',
137:               left: position.left,
138:               top: position.top,
```

- `src/components/ui/narrative/StageNavigation.jsx:57`

```text
55:               padding: '.25rem .5rem',
56:               fontSize: '.75rem',
57:               cursor: 'pointer',
58:               transition: 'all .2s',
59:             }}
```

- `src/components/webgl/WebGLBackground.jsx:738`

```text
736:   }, [emitViewportHint]);
737: 
738:   // Fallback morph sink (outside emergence directives)
739:   const __applyMorph = (v) => {
740:     const mat = materialRef.current;
```

- `src/components/webgl/WebGLBackground.jsx:815`

```text
813:   }, []);
814: 
815:   // Emergence flag (no local tween; engine drives via directives)
816:   useEffect(() => {
817:     const off = BeatBus?.on?.(EVENTS.PARTICLES_START_EMERGING, () => {
```

- `src/components/webgl/WebGLBackground.jsx:1067`

```text
1065:       if (id === lastBlueprintIdRef.current) return;
1066:       lastBlueprintIdRef.current = id;
1067:       const isEmergence = mode === 'emergence' || raw?.mode === 'emergence';
1068:       const isOpeningChaos = mode === 'opening_chaos' || raw?.mode === 'opening_chaos';
1069:       const shouldFastForward = isEmergence && (fastForwardRequested || skipMorph);
```

- `src/components/webgl/WebGLBackground.jsx:1094`

```text
1092:         }
1093:       }
1094:       // ignore late emergence after handoff
1095:       if (isEmergence && emittedEmergedRef.current) return;
1096: 
```

- `src/components/webgl/WebGLBackground.jsx:1254`

```text
1252:       if (mat) {
1253:         applyRendererFits(geo, viewportHintRef.current || viewport);
1254:         logBind(isEmergence ? 'emergence' : 'stage', {
1255:           stage: raw.stageName || st || 'genesis',
1256:           mode: mode || raw?.mode || (isEmergence ? 'emergence' : 'full'),
```

- `src/components/webgl/WebGLBackground.jsx:1256`

```text
1254:         logBind(isEmergence ? 'emergence' : 'stage', {
1255:           stage: raw.stageName || st || 'genesis',
1256:           mode: mode || raw?.mode || (isEmergence ? 'emergence' : 'full'),
1257:           cached: !!cached,
1258:         });
```

- `src/components/webgl/WebGLBackground.jsx:1333`

```text
1331: 
1332:       if (isEmergence) {
1333:         console.log('✅ Renderer: BR(emergence) bound', `count=${raw.particleCount || raw.activeCount}`, `quality=${quality}`);
1334:         emergencePendingRef.current = true;
1335:         emittedEmergedRef.current = false;
```

- `src/components/webgl/WebGLBackground.jsx:1358`

```text
1356:           const source = fastForwardRequested ? 'renderer-fastforward' : 'renderer-skip-morph';
1357:           if (finalizeEmergence(source)) {
1358:             console.log('⚡ Renderer: Emergence fast-forward applied', {
1359:               source,
1360:               cacheKey,
```

- `src/components/webgl/WebGLBackground.jsx:1537`

```text
1535: 
1536:       // ---------- MORPH: start at 0 for FULL binds so we actually see the transition ----------
1537:       const isEmergenceMode = payload?.mode === 'emergence' || payload?.blueprint?.mode === 'emergence';
1538:       const matCurrent = materialRef.current;
1539:       const currentUniforms = matCurrent?.uniforms;
```

- `src/components/webgl/WebGLBackground.jsx:1544`

```text
1542:         const currentStage = director?.getCurrentStage?.() ?? director?.currentStage ?? null;
1543:         const currentPhase = director?.getCurrentPhase?.() ?? director?.phase ?? null;
1544:         const isOpeningPhase = currentStage === 'genesis' && currentPhase !== 'emergence';
1545:         const startMorph = 0.0;
1546: 
```

- `src/components/webgl/WebGLCanvas.jsx:414`

```text
412:           <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_50%)]" />
413:         </div>
414:         <div className="absolute bottom-4 right-4 bg-black/80 border border-red-600 rounded-lg p-3 text-red-400 font-mono text-sm">
415:           <div className="font-bold mb-2">⚛️ WebGL Not Supported</div>
416:           <div>Stage: {stage}</div>
```

- `src/components/webgl/WebGLCanvas.jsx:613`

```text
611:                 padding: '4px 8px',
612:                 borderRadius: '4px',
613:                 cursor: 'pointer',
614:                 fontSize: '11px',
615:                 marginRight: '8px',
```

- `src/components/webgl/WebGLCanvas.jsx:633`

```text
631:                 padding: '4px 8px',
632:                 borderRadius: '4px',
633:                 cursor: 'pointer',
634:                 fontSize: '11px',
635:               }}
```

- `src/config/canonical/sst-v3.3.json:23`

```text
21:         "writes": ["eventsOnly"],
22:         "forbidden": ["geometry", "uniforms"],
23:         "notes": "Prewarm → terminal → screen fill → emergence → stage change → enable scroll"
24:       },
25:       "engine": {
```

- `src/config/canonical/sst-v3.3.json:234`

```text
232:     },
233:     {
234:       "name": "TERMINAL_TYPE",
235:       "emitter": "Director",
236:       "payload": {
```

- `src/config/canonical/sst-v3.3.json:243`

```text
241:     },
242:     {
243:       "name": "SCREEN_FILL",
244:       "emitter": "Director",
245:       "payload": {
```

- `src/config/canonical/sst-v3.3.json:708`

```text
706:         "Opening beats timing",
707:         "Memory fragments",
708:         "Audio sync to emergence threshold"
709:       ]
710:     },
```

- `src/config/visual-controls.js:9`

```text
7: 
8: export const VC = {
9:   // Emergence pacing
10:   IMPLODE_MS: 2000,      /* VC.IMPLODE_MS */   // extended implosion pacing
11:   SETTLE_MS:  1500,      /* VC.SETTLE_MS  */   // extended settle pacing
```

- `src/config/visual-controls.js:11`

```text
9:   // Emergence pacing
10:   IMPLODE_MS: 2000,      /* VC.IMPLODE_MS */   // extended implosion pacing
11:   SETTLE_MS:  1500,      /* VC.SETTLE_MS  */   // extended settle pacing
12:   MID_MORPH:  0.88,      /* VC.MID_MORPH  */   // morph target at end of implosion
13: 
```

- `src/config/visual-controls.js:26`

```text
24:   FIT_FRAC:        0.92, /* VC.FIT_FRAC */
25:   TIER_RATIOS:     [0.70, 0.12, 0.13, 0.05], /* VC.TIER_RATIOS */ // Heavier Tier-0 scatter; extra Tier-2 density
26:   // Optional: force a final fit in Genesis even if emergence already fitted.
27:   // Default false to preserve the emergence band's exact layout.
28:   FINAL_FIT_GENESIS: false,
```

- `src/config/visual-controls.js:27`

```text
25:   TIER_RATIOS:     [0.70, 0.12, 0.13, 0.05], /* VC.TIER_RATIOS */ // Heavier Tier-0 scatter; extra Tier-2 density
26:   // Optional: force a final fit in Genesis even if emergence already fitted.
27:   // Default false to preserve the emergence band's exact layout.
28:   FINAL_FIT_GENESIS: false,
29:   ATMO_SCALE:      1.00, /* VC.ATMO_SCALE     */ // atmospheric XY spread vs target (>1 → implosion feel)
```

- `src/engine/ConsciousnessEngine.js:65`

```text
63:   'JetBrains Mono': () => '/fonts/CourierPrime_Regular.typeface.json',
64:   Inter: () => import('three/examples/fonts/helvetiker_regular.typeface.json?url').then((m) => m.default),
65:   'Archivo Black': () => '/fonts/helvetiker_bold.typeface.json',
66:   Montserrat: () => '/fonts/helvetiker_bold.typeface.json',
67:   'Playfair Display': () => import('three/examples/fonts/helvetiker_regular.typeface.json?url').then((m) => m.default),
```

- `src/engine/ConsciousnessEngine.js:263`

```text
261:     this._viewportHint = { width: 120, height: 90, aspect: 4 / 3 };
262: 
263:     // Emergence memory - store only targets, not full blueprint
264:     this._lastEmergenceTargets = null;
265:     this._emergenceRaf = null;
```

- `src/engine/ConsciousnessEngine.js:499`

```text
497: 
498:   _onPrewarmGenesis() {
499:     // Clear stale emergence targets so prewarm rebuilds with current VC tuning
500:     this._lastEmergenceTargets = null;
501:     console.log('🧠 Engine: Prewarming genesis blueprint');
```

- `src/engine/ConsciousnessEngine.js:558`

```text
556:       this._rendererFencepostSeen = false;
557: 
558:       // Build the emergence blueprint
559:       const blueprint = await this.buildEmergenceBlueprint(payload);
560:       
```

- `src/engine/ConsciousnessEngine.js:563`

```text
561:       // Validate before proceeding
562:       if (!this._validateBlueprint(blueprint)) {
563:         console.error('🧠 Engine: Invalid emergence blueprint, not emitting');
564:         this._log('emergence_validation_failed');
565:         this._emergenceActive = false;
```

- `src/engine/ConsciousnessEngine.js:573`

```text
571:       this._lastEmergenceTargets = blueprint.text3DPositions;
572: 
573:       // Emit emergence blueprint with mode flag (canonical event)
574:       emitBlueprintReady(BeatBus, EVENTS, blueprint, {
575:         stage: 'genesis',
```

- `src/engine/ConsciousnessEngine.js:577`

```text
575:         stage: 'genesis',
576:         quality: this.currentQuality,
577:         mode: payload.mode || 'emergence',
578:         cached: false,
579:         skipMorphAnimation: !!payload.skipMorphAnimation,
```

- `src/engine/ConsciousnessEngine.js:586`

```text
584:       
585:       if (openingChaosMode) {
586:         console.log('🧠 Engine: Opening chaos blueprint emitted', { count: blueprint.particleCount });
587:         this._openingPreboundBlueprint = blueprint;
588:         this._log('emergence_built', { count: blueprint.particleCount, mode: 'opening_chaos' });
```

- `src/engine/ConsciousnessEngine.js:590`

```text
588:         this._log('emergence_built', { count: blueprint.particleCount, mode: 'opening_chaos' });
589:       } else {
590:         console.log('🧠 Engine: Emergence blueprint emitted', { count: blueprint.particleCount, mode: 'emergence' });
591:         this._openingPreboundBlueprint = null;
592:         this._log('emergence_built', { count: blueprint.particleCount });
```

- `src/engine/ConsciousnessEngine.js:595`

```text
593:       }
594: 
595:       // Drive implosion → settle via directives; renderer remains passive
596:       const shouldRunTimeline = !openingChaosMode && !payload.skipMorphAnimation;
597:       if (shouldRunTimeline && !this._startEmergenceTimeline(blueprint)) {
```

- `src/engine/ConsciousnessEngine.js:770`

```text
768:       : midDefault;
769: 
770:     console.log('🎨 [EMERGENCE TIMELINE]', {
771:       fastForward,
772:       midDefault,
```

- `src/engine/ConsciousnessEngine.js:780`

```text
778: 
779:     if (implMs > 6000 || settleMs > 6000) {
780:       console.warn('[Emergence] unusually long timings detected', { implMs, settleMs, mid: midForTimeline });
781:     }
782: 
```

- `src/engine/ConsciousnessEngine.js:1332`

```text
1330: 
1331:     if (blueprint.particleCount > 0) {
1332:       const rnd = createSeededRandom(`emergence-${mode || 'default'}-${quality || 'HIGH'}`);
1333:       for (let i = 0; i < blueprint.particleCount; i++) {
1334:         const j = i * 3;
```

- `src/engine/ConsciousnessEngine.js:1445`

```text
1443: 
1444:   /**
1445:    * Build + emit the Emergence blueprint for the opening sequence.
1446:    */
1447:   async buildEmergenceBlueprint(options = {}) {
```

- `src/engine/ConsciousnessEngine.js:1449`

```text
1447:   async buildEmergenceBlueprint(options = {}) {
1448:     const {
1449:       mode = 'emergence',
1450:       source = 'viewportSpread',
1451:       target = 'constellation',
```

- `src/engine/ConsciousnessEngine.js:1496`

```text
1494:         usedFallback = this._lastText3DFallbackUsed;
1495:         if (usedFallback) {
1496:           console.warn('⚠️ Emergence used text3D FALLBACK (band). FontReady:', this._fontReady);
1497:         }
1498:       } else {
```

- `src/engine/ConsciousnessEngine.js:1562`

```text
1560:       targetState: targetState || null,
1561:       note: usedFallback
1562:         ? 'Emergence used fallback band (font not ready); cache will be cleared on font load.'
1563:         : 'Emergence endpoints separated: random atmospheric → 3D text target',
1564:     };
```

- `src/engine/ConsciousnessEngine.js:1563`

```text
1561:       note: usedFallback
1562:         ? 'Emergence used fallback band (font not ready); cache will be cleared on font load.'
1563:         : 'Emergence endpoints separated: random atmospheric → 3D text target',
1564:     };
1565: 
```

- `src/engine/ConsciousnessEngine.js:1592`

```text
1590: 
1591:     if (this._emergenceActive && stage !== 'genesis') {
1592:       console.warn('🧠 Engine: rebuild blocked during emergence timeline', { stage, quality });
1593:       this._log('rebuild_blocked_emergence', { stage, quality });
1594:       return;
```

- `src/engine/ConsciousnessEngine.js:1600`

```text
1598:     let blueprint = this.blueprintCache.get(cacheKey);
1599: 
1600:     // Post-emergence genesis: optionally preserve settled emergence
1601:     if (stage === 'genesis' && this._lastEmergenceTargets) {
1602:       if (this._lastText3DFallbackUsed) {
```

- `src/engine/ConsciousnessEngine.js:1603`

```text
1601:     if (stage === 'genesis' && this._lastEmergenceTargets) {
1602:       if (this._lastText3DFallbackUsed) {
1603:         console.warn('🧠 Engine: Emergence fallback detected; skipping preserve');
1604:         this._lastEmergenceTargets = null;
1605:         this._emergenceDone = false;
```

- `src/engine/ConsciousnessEngine.js:1608`

```text
1606:         this._rendererFencepostSeen = false;
1607:       } else if (!this._emergenceDone) {
1608:         console.warn('🧠 Engine: Emergence incomplete; rebuilding genesis cleanly');
1609:         this._lastEmergenceTargets = null;
1610:         this._emergenceDone = false;
```

- `src/engine/ConsciousnessEngine.js:1618`

```text
1616:         this._rendererFencepostSeen = false;
1617:       } else {
1618:         console.log('🧠 Engine: Building post-emergence genesis (preserving emergence result)');
1619: 
1620:         const emergenceCount = Math.max(0, Math.floor(this._lastEmergenceTargets.length / 3));
```

- `src/engine/ConsciousnessEngine.js:1647`

```text
1645:               stage,
1646:               quality,
1647:               mode: 'post-emergence-guarded',
1648:               cacheKey,
1649:               preservedEmergence: true,
```

- `src/engine/ConsciousnessEngine.js:1652`

```text
1650:             });
1651:             this._preloadNextStage(stage, quality);
1652:             this._log('blueprint_emitted', { stage, quality, cacheKey, mode: 'post-emergence-guarded' });
1653:           }
1654:           this._rendererFencepostSeen = false;
```

- `src/engine/ConsciousnessEngine.js:1883`

```text
1881:           console.log(`✅ 3D font loaded from ${usedUrl}; cleared text3D cache (was ${oldSize} entries)`);
1882:           try {
1883:             if (this._lastText3DFallbackUsed && this._lastBlueprint?.metadata?.mode === 'emergence') {
1884:               console.log('🔁 Rebuilding emergence with real text3D now that font is ready…');
1885:               this.buildEmergenceBlueprint({ mode: 'emergence' });
```

- `src/engine/ConsciousnessEngine.js:1884`

```text
1882:           try {
1883:             if (this._lastText3DFallbackUsed && this._lastBlueprint?.metadata?.mode === 'emergence') {
1884:               console.log('🔁 Rebuilding emergence with real text3D now that font is ready…');
1885:               this.buildEmergenceBlueprint({ mode: 'emergence' });
1886:             }
```

- `src/engine/ConsciousnessEngine.js:1885`

```text
1883:             if (this._lastText3DFallbackUsed && this._lastBlueprint?.metadata?.mode === 'emergence') {
1884:               console.log('🔁 Rebuilding emergence with real text3D now that font is ready…');
1885:               this.buildEmergenceBlueprint({ mode: 'emergence' });
1886:             }
1887:           } catch {}
```

- `src/engine/utils/blueprintUtils.js:136`

```text
134: 
135:   const tiers = new Uint8Array(count);
136:   let cursor = 0;
137:   for (let tier = 0; tier < counts.length; tier++) {
138:     const n = counts[tier];
```

- `src/engine/utils/blueprintUtils.js:139`

```text
137:   for (let tier = 0; tier < counts.length; tier++) {
138:     const n = counts[tier];
139:     for (let i = 0; i < n; i += 1) tiers[cursor++] = tier;
140:   }
141: 
```

- `src/state/commands/StateCommands.js:115`

```text
113:         
114:         // REMOVED: BUILD_EMERGENCE_BLUEPRINT emission
115:         // This was causing emergence to build on every stage change
116:         // Emergence should only be triggered by TheaterDirector during opening
117:         
```

- `src/state/commands/StateCommands.js:116`

```text
114:         // REMOVED: BUILD_EMERGENCE_BLUEPRINT emission
115:         // This was causing emergence to build on every stage change
116:         // Emergence should only be triggered by TheaterDirector during opening
117:         
118:         prevStage = next;
```

- `src/state/commands/StateCommands.js:202`

```text
200:   }
201: 
202:   // Programmatic emergence trigger (only for opening sequence)
203:   triggerEmergence(payload = {}) {
204:     if (!this.canEmit('BUILD_EMERGENCE_BLUEPRINT')) {
```

- `src/state/commands/StateCommands.js:205`

```text
203:   triggerEmergence(payload = {}) {
204:     if (!this.canEmit('BUILD_EMERGENCE_BLUEPRINT')) {
205:       console.error('[StateCommands] Cannot trigger emergence - contract violation');
206:       return false;
207:     }
```

- `src/state/commands/StateCommands.js:211`

```text
209:     this.recordEmission('BUILD_EMERGENCE_BLUEPRINT');
210:     BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {
211:       mode: 'emergence',
212:       source: 'viewportSpread',
213:       target: 'constellation',
```

- `src/theater/ScrollOrchestrator.js:313`

```text
311:       const local = clamp01((easedPct - start) / Math.max(1, end - start));
312: 
313:       // v3.5 adjustment: keep genesis fully formed (no post-emergence un-morph)
314:       if (stageIdx === 0) {
315:         this.morphTarget = 1;
```

- `src/theater/TheaterDirector.js:45`

```text
43: const DEFAULT_OPENING_TIMELINE = {
44:   blackout: { durationMs: 2000 },
45:   cursor: { blinkCount: 2, intervalMs: 500, leadInMs: 500, settleMs: 1000 },
46:   typing: { lines: DEFAULT_TYPING_LINES, typeSpeed: 50, lineDelay: 500, completionDelayMs: 800 },
47:   fill: { text: null, scrollSpeed: 100, durationMs: 2000 },
```

- `src/theater/TheaterDirector.js:48`

```text
46:   typing: { lines: DEFAULT_TYPING_LINES, typeSpeed: 50, lineDelay: 500, completionDelayMs: 800 },
47:   fill: { text: null, scrollSpeed: 100, durationMs: 2000 },
48:   chaos: { enabled: true, durationMs: 2000, rendererSpin: { z: 0.5, y: 0.2 } },
49:   coalesce: { enabled: true, durationMs: 2000, morphTo: 0.6 },
50:   settle: { enabled: true, durationMs: 1500, morphTo: 1.0 },
```

- `src/theater/TheaterDirector.js:49`

```text
47:   fill: { text: null, scrollSpeed: 100, durationMs: 2000 },
48:   chaos: { enabled: true, durationMs: 2000, rendererSpin: { z: 0.5, y: 0.2 } },
49:   coalesce: { enabled: true, durationMs: 2000, morphTo: 0.6 },
50:   settle: { enabled: true, durationMs: 1500, morphTo: 1.0 },
51:   emergence: {
```

- `src/theater/TheaterDirector.js:50`

```text
48:   chaos: { enabled: true, durationMs: 2000, rendererSpin: { z: 0.5, y: 0.2 } },
49:   coalesce: { enabled: true, durationMs: 2000, morphTo: 0.6 },
50:   settle: { enabled: true, durationMs: 1500, morphTo: 1.0 },
51:   emergence: {
52:     durationMs: 2000,
```

- `src/theater/TheaterDirector.js:51`

```text
49:   coalesce: { enabled: true, durationMs: 2000, morphTo: 0.6 },
50:   settle: { enabled: true, durationMs: 1500, morphTo: 1.0 },
51:   emergence: {
52:     durationMs: 2000,
53:     waitForFencepost: true,
```

- `src/theater/TheaterDirector.js:82`

```text
80: const DEFAULT_OPENING_EMERGENCE = {
81:   target: 'constellation',
82:   mode: 'emergence',
83:   source: 'viewportSpread',
84: };
```

- `src/theater/TheaterDirector.js:132`

```text
130:       console.log('📋 [OPENING TIMELINE]', {
131:         hasTimeline: !!openingProbe?.timeline,
132:         chaos: openingProbe?.timeline?.chaos,
133:         coalesce: openingProbe?.timeline?.coalesce,
134:         settle: openingProbe?.timeline?.settle,
```

- `src/theater/TheaterDirector.js:133`

```text
131:         hasTimeline: !!openingProbe?.timeline,
132:         chaos: openingProbe?.timeline?.chaos,
133:         coalesce: openingProbe?.timeline?.coalesce,
134:         settle: openingProbe?.timeline?.settle,
135:         hasChaosConfig: !!openingProbe?.timeline?.chaos,
```

- `src/theater/TheaterDirector.js:134`

```text
132:         chaos: openingProbe?.timeline?.chaos,
133:         coalesce: openingProbe?.timeline?.coalesce,
134:         settle: openingProbe?.timeline?.settle,
135:         hasChaosConfig: !!openingProbe?.timeline?.chaos,
136:       });
```

- `src/theater/TheaterDirector.js:135`

```text
133:         coalesce: openingProbe?.timeline?.coalesce,
134:         settle: openingProbe?.timeline?.settle,
135:         hasChaosConfig: !!openingProbe?.timeline?.chaos,
136:       });
137:     } catch (timelineError) {
```

- `src/theater/TheaterDirector.js:180`

```text
178:         ...(stageTimeline.blackout ?? {}),
179:       },
180:       cursor: {
181:         ...DEFAULT_OPENING_TIMELINE.cursor,
182:         ...(openingTimeline.cursor ?? {}),
```

- `src/theater/TheaterDirector.js:181`

```text
179:       },
180:       cursor: {
181:         ...DEFAULT_OPENING_TIMELINE.cursor,
182:         ...(openingTimeline.cursor ?? {}),
183:         ...(stageTimeline.cursor ?? {}),
```

- `src/theater/TheaterDirector.js:182`

```text
180:       cursor: {
181:         ...DEFAULT_OPENING_TIMELINE.cursor,
182:         ...(openingTimeline.cursor ?? {}),
183:         ...(stageTimeline.cursor ?? {}),
184:       },
```

- `src/theater/TheaterDirector.js:183`

```text
181:         ...DEFAULT_OPENING_TIMELINE.cursor,
182:         ...(openingTimeline.cursor ?? {}),
183:         ...(stageTimeline.cursor ?? {}),
184:       },
185:       typing: {
```

- `src/theater/TheaterDirector.js:195`

```text
193:         ...(stageTimeline.fill ?? {}),
194:       },
195:       chaos: {
196:         ...DEFAULT_OPENING_TIMELINE.chaos,
197:         ...(openingTimeline.chaos ?? {}),
```

- `src/theater/TheaterDirector.js:196`

```text
194:       },
195:       chaos: {
196:         ...DEFAULT_OPENING_TIMELINE.chaos,
197:         ...(openingTimeline.chaos ?? {}),
198:         ...(stageTimeline.chaos ?? {}),
```

- `src/theater/TheaterDirector.js:197`

```text
195:       chaos: {
196:         ...DEFAULT_OPENING_TIMELINE.chaos,
197:         ...(openingTimeline.chaos ?? {}),
198:         ...(stageTimeline.chaos ?? {}),
199:       },
```

- `src/theater/TheaterDirector.js:198`

```text
196:         ...DEFAULT_OPENING_TIMELINE.chaos,
197:         ...(openingTimeline.chaos ?? {}),
198:         ...(stageTimeline.chaos ?? {}),
199:       },
200:       coalesce: {
```

- `src/theater/TheaterDirector.js:200`

```text
198:         ...(stageTimeline.chaos ?? {}),
199:       },
200:       coalesce: {
201:         ...DEFAULT_OPENING_TIMELINE.coalesce,
202:         ...(openingTimeline.coalesce ?? {}),
```

- `src/theater/TheaterDirector.js:201`

```text
199:       },
200:       coalesce: {
201:         ...DEFAULT_OPENING_TIMELINE.coalesce,
202:         ...(openingTimeline.coalesce ?? {}),
203:         ...(stageTimeline.coalesce ?? {}),
```

- `src/theater/TheaterDirector.js:202`

```text
200:       coalesce: {
201:         ...DEFAULT_OPENING_TIMELINE.coalesce,
202:         ...(openingTimeline.coalesce ?? {}),
203:         ...(stageTimeline.coalesce ?? {}),
204:       },
```

- `src/theater/TheaterDirector.js:203`

```text
201:         ...DEFAULT_OPENING_TIMELINE.coalesce,
202:         ...(openingTimeline.coalesce ?? {}),
203:         ...(stageTimeline.coalesce ?? {}),
204:       },
205:       settle: {
```

- `src/theater/TheaterDirector.js:205`

```text
203:         ...(stageTimeline.coalesce ?? {}),
204:       },
205:       settle: {
206:         ...DEFAULT_OPENING_TIMELINE.settle,
207:         ...(openingTimeline.settle ?? {}),
```

- `src/theater/TheaterDirector.js:206`

```text
204:       },
205:       settle: {
206:         ...DEFAULT_OPENING_TIMELINE.settle,
207:         ...(openingTimeline.settle ?? {}),
208:         ...(stageTimeline.settle ?? {}),
```

- `src/theater/TheaterDirector.js:207`

```text
205:       settle: {
206:         ...DEFAULT_OPENING_TIMELINE.settle,
207:         ...(openingTimeline.settle ?? {}),
208:         ...(stageTimeline.settle ?? {}),
209:       },
```

- `src/theater/TheaterDirector.js:208`

```text
206:         ...DEFAULT_OPENING_TIMELINE.settle,
207:         ...(openingTimeline.settle ?? {}),
208:         ...(stageTimeline.settle ?? {}),
209:       },
210:       profile: stageTimeline.profile ?? openingTimeline.profile ?? null,
```

- `src/theater/TheaterDirector.js:215`

```text
213:     };
214: 
215:     const emergenceTimeline = stageTimeline.emergence ?? openingTimeline.emergence ?? {};
216: 
217:     const fallbackSkipKey = 'SPACE';
```

- `src/theater/TheaterDirector.js:227`

```text
225:       totalDurationMs: stageTimeline.totalDurationMs ?? opening.totalDurationMs ?? null,
226:       timeline,
227:       emergence: { ...DEFAULT_OPENING_EMERGENCE, ...emergenceTimeline },
228:     };
229:   }
```

- `src/theater/TheaterDirector.js:799`

```text
797: 
798:     const segments = [
799:       `black ${snapshotTimeline?.blackout?.durationMs ?? DEFAULT_OPENING_TIMELINE.blackout.durationMs}ms`,
800:       `cursor blink x${snapshotTimeline?.cursor?.blinkCount ?? DEFAULT_OPENING_TIMELINE.cursor.blinkCount}` +
801:         ` @ ${(snapshotTimeline?.cursor?.intervalMs ?? DEFAULT_OPENING_TIMELINE.cursor.intervalMs)}ms`,
```

- `src/theater/TheaterDirector.js:800`

```text
798:     const segments = [
799:       `black ${snapshotTimeline?.blackout?.durationMs ?? DEFAULT_OPENING_TIMELINE.blackout.durationMs}ms`,
800:       `cursor blink x${snapshotTimeline?.cursor?.blinkCount ?? DEFAULT_OPENING_TIMELINE.cursor.blinkCount}` +
801:         ` @ ${(snapshotTimeline?.cursor?.intervalMs ?? DEFAULT_OPENING_TIMELINE.cursor.intervalMs)}ms`,
802:       `typing ~${snapshotTypingDuration}ms`,
```

- `src/theater/TheaterDirector.js:801`

```text
799:       `black ${snapshotTimeline?.blackout?.durationMs ?? DEFAULT_OPENING_TIMELINE.blackout.durationMs}ms`,
800:       `cursor blink x${snapshotTimeline?.cursor?.blinkCount ?? DEFAULT_OPENING_TIMELINE.cursor.blinkCount}` +
801:         ` @ ${(snapshotTimeline?.cursor?.intervalMs ?? DEFAULT_OPENING_TIMELINE.cursor.intervalMs)}ms`,
802:       `typing ~${snapshotTypingDuration}ms`,
803:       `fill ${snapshotTimeline?.fill?.durationMs ?? DEFAULT_OPENING_TIMELINE.fill.durationMs}ms`,
```

- `src/theater/TheaterDirector.js:804`

```text
802:       `typing ~${snapshotTypingDuration}ms`,
803:       `fill ${snapshotTimeline?.fill?.durationMs ?? DEFAULT_OPENING_TIMELINE.fill.durationMs}ms`,
804:       `emergence ${snapshotTimeline?.emergence?.durationMs ?? DEFAULT_OPENING_TIMELINE.emergence.durationMs}ms`,
805:     ];
806: 
```

- `src/theater/TheaterDirector.js:841`

```text
839: 
840:     const opening = this._getOpeningConfig();
841:     const { timeline, skipKey, emergence: openingEmergence } = opening ?? {};
842: 
843:     const blackoutDuration = Math.max(
```

- `src/theater/TheaterDirector.js:849`

```text
847: 
848:     const cursorConfig = {
849:       ...DEFAULT_OPENING_TIMELINE.cursor,
850:       ...(timeline?.cursor ?? {}),
851:     };
```

- `src/theater/TheaterDirector.js:850`

```text
848:     const cursorConfig = {
849:       ...DEFAULT_OPENING_TIMELINE.cursor,
850:       ...(timeline?.cursor ?? {}),
851:     };
852:     const cursorLeadInMs = Math.max(0, Number(cursorConfig.leadInMs ?? 0));
```

- `src/theater/TheaterDirector.js:854`

```text
852:     const cursorLeadInMs = Math.max(0, Number(cursorConfig.leadInMs ?? 0));
853:     const cursorSettleMs = Math.max(0, Number(cursorConfig.settleMs ?? 0));
854:     const cursorBlinkCount = Math.max(0, Number(cursorConfig.blinkCount ?? DEFAULT_OPENING_TIMELINE.cursor.blinkCount));
855:     const cursorIntervalMs = Math.max(0, Number(cursorConfig.intervalMs ?? DEFAULT_OPENING_TIMELINE.cursor.intervalMs));
856:     const cursorHumVolume = Number.isFinite(cursorConfig.humVolume) ? cursorConfig.humVolume : 0.25;
```

- `src/theater/TheaterDirector.js:855`

```text
853:     const cursorSettleMs = Math.max(0, Number(cursorConfig.settleMs ?? 0));
854:     const cursorBlinkCount = Math.max(0, Number(cursorConfig.blinkCount ?? DEFAULT_OPENING_TIMELINE.cursor.blinkCount));
855:     const cursorIntervalMs = Math.max(0, Number(cursorConfig.intervalMs ?? DEFAULT_OPENING_TIMELINE.cursor.intervalMs));
856:     const cursorHumVolume = Number.isFinite(cursorConfig.humVolume) ? cursorConfig.humVolume : 0.25;
857: 
```

- `src/theater/TheaterDirector.js:890`

```text
888:     }
889: 
890:     const chaosConfig = timeline?.chaos || {};
891:     const coalesceConfig = timeline?.coalesce || {};
892:     const settleConfig = timeline?.settle || {};
```

- `src/theater/TheaterDirector.js:891`

```text
889: 
890:     const chaosConfig = timeline?.chaos || {};
891:     const coalesceConfig = timeline?.coalesce || {};
892:     const settleConfig = timeline?.settle || {};
893: 
```

- `src/theater/TheaterDirector.js:892`

```text
890:     const chaosConfig = timeline?.chaos || {};
891:     const coalesceConfig = timeline?.coalesce || {};
892:     const settleConfig = timeline?.settle || {};
893: 
894:     const emergenceTimeline = {
```

- `src/theater/TheaterDirector.js:895`

```text
893: 
894:     const emergenceTimeline = {
895:       ...DEFAULT_OPENING_TIMELINE.emergence,
896:       ...(timeline?.emergence ?? {}),
897:     };
```

- `src/theater/TheaterDirector.js:896`

```text
894:     const emergenceTimeline = {
895:       ...DEFAULT_OPENING_TIMELINE.emergence,
896:       ...(timeline?.emergence ?? {}),
897:     };
898:     emergenceTimeline.durationMs = Math.max(
```

- `src/theater/TheaterDirector.js:900`

```text
898:     emergenceTimeline.durationMs = Math.max(
899:       0,
900:       Number(emergenceTimeline.durationMs ?? DEFAULT_OPENING_TIMELINE.emergence.durationMs),
901:     );
902:     emergenceTimeline.maxWaitMs = Math.max(
```

- `src/theater/TheaterDirector.js:904`

```text
902:     emergenceTimeline.maxWaitMs = Math.max(
903:       0,
904:       Number(emergenceTimeline.maxWaitMs ?? DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs),
905:     );
906:     const fencepostWaitMs = emergenceTimeline.maxWaitMs || DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs;
```

- `src/theater/TheaterDirector.js:906`

```text
904:       Number(emergenceTimeline.maxWaitMs ?? DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs),
905:     );
906:     const fencepostWaitMs = emergenceTimeline.maxWaitMs || DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs;
907:     const waitForFencepost = emergenceTimeline.waitForFencepost !== false;
908:     const shouldWaitForFencepost = waitForFencepost && !this._openingPrebound;
```

- `src/theater/TheaterDirector.js:911`

```text
909:     const stabilizeMs = Math.max(
910:       0,
911:       Number(emergenceTimeline.stabilizeMs ?? DEFAULT_OPENING_TIMELINE.emergence.stabilizeMs ?? 0),
912:     );
913:     const skipMorphAnimation = emergenceTimeline.skipMorphAnimation === true;
```

- `src/theater/TheaterDirector.js:915`

```text
913:     const skipMorphAnimation = emergenceTimeline.skipMorphAnimation === true;
914:     const skipGenesisBlueprint = emergenceTimeline.skipGenesisBlueprint !== false;
915:     const targetState = emergenceTimeline.targetState || DEFAULT_OPENING_TIMELINE.emergence.targetState;
916: 
917:     const emergenceConfig = { ...DEFAULT_OPENING_EMERGENCE, ...(openingEmergence ?? {}) };
```

- `src/theater/TheaterDirector.js:957`

```text
955: 
956:     try {
957:       // ───────────────── Phase 1: Black
958:       this.phase = 'black';
959:       console.log(`   Phase: Black screen (${blackoutDuration}ms)`);
```

- `src/theater/TheaterDirector.js:958`

```text
956:     try {
957:       // ───────────────── Phase 1: Black
958:       this.phase = 'black';
959:       console.log(`   Phase: Black screen (${blackoutDuration}ms)`);
960:       if (blackoutDuration > 0) {
```

- `src/theater/TheaterDirector.js:959`

```text
957:       // ───────────────── Phase 1: Black
958:       this.phase = 'black';
959:       console.log(`   Phase: Black screen (${blackoutDuration}ms)`);
960:       if (blackoutDuration > 0) {
961:         const waitResult = await this.sleep(blackoutDuration);
```

- `src/theater/TheaterDirector.js:965`

```text
963:       }
964:       if (skipTriggered) {
965:         console.log(`   Skip triggered before cursor phase (key: ${skipLabel})`);
966:       }
967: 
```

- `src/theater/TheaterDirector.js:968`

```text
966:       }
967: 
968:       // ───────────────── Phase 2: Cursor
969:       if (!skipTriggered) {
970:         this.phase = 'cursor';
```

- `src/theater/TheaterDirector.js:970`

```text
968:       // ───────────────── Phase 2: Cursor
969:       if (!skipTriggered) {
970:         this.phase = 'cursor';
971:         console.log(`   Phase: Cursor (blink x${cursorBlinkCount} @ ${cursorIntervalMs}ms)`);
972:         BeatBus.emit(EVENTS.CURSOR_SHOW);
```

- `src/theater/TheaterDirector.js:971`

```text
969:       if (!skipTriggered) {
970:         this.phase = 'cursor';
971:         console.log(`   Phase: Cursor (blink x${cursorBlinkCount} @ ${cursorIntervalMs}ms)`);
972:         BeatBus.emit(EVENTS.CURSOR_SHOW);
973:         BeatBus.emit(EVENTS.AUDIO_COMPUTER_HUM, { volume: cursorHumVolume });
```

- `src/theater/TheaterDirector.js:991`

```text
989:         this.phase = 'terminal';
990:         console.log(`   Phase: Terminal typing (~${typingDuration}ms)`);
991:         BeatBus.emit(EVENTS.TERMINAL_TYPE, typingConfig);
992:         if (typingDuration > 0) {
993:           const waitResult = await this.sleep(typingDuration);
```

- `src/theater/TheaterDirector.js:1006`

```text
1004:       this.phase = 'fill';
1005:       console.log(`   Phase: Screen fill (${fillConfig.durationMs}ms)`);
1006:       BeatBus.emit(EVENTS.SCREEN_FILL, { text: fillConfig.text, scrollSpeed: fillConfig.scrollSpeed });
1007:       if (fillConfig.durationMs > 0) {
1008:         const waitResult = await this.sleep(fillConfig.durationMs);
```

- `src/theater/TheaterDirector.js:1014`

```text
1012: 
1013:     if (!skipTriggered && chaosConfig?.enabled !== false) {
1014:       console.log('🔍 [ABOUT TO START CHAOS]', {
1015:         chaosConfig,
1016:         currentMorph: currentMorphValue,
```

- `src/theater/TheaterDirector.js:1021`

```text
1019:       if (!this._openingPrebound) {
1020:         try {
1021:           console.log('   Phase: Pre-chaos blueprint bind');
1022:           if (!this._openingModeAnnounced) {
1023:             BeatBus.emit(EVENTS.DIRECTOR_OPENING_MODE, {
```

- `src/theater/TheaterDirector.js:1045`

```text
1043:           this._openingPrebound = true;
1044:         } catch (bindError) {
1045:           console.warn('🎬 Director: Pre-chaos blueprint bind failed', bindError);
1046:         }
1047:         const bindSettleMs = Math.max(0, Number(chaosConfig?.bindLeadInMs ?? 120));
```

- `src/theater/TheaterDirector.js:1069`

```text
1067:               const stageName = payload?.stage || blueprint?.stage || blueprint?.stageName;
1068:               const mode = payload?.mode || blueprint?.mode;
1069:               return stageName === 'genesis' && mode !== 'emergence';
1070:             },
1071:           }).then((payload) => ({ type: 'blueprint', payload })),
```

- `src/theater/TheaterDirector.js:1075`

```text
1073: 
1074:         if (!readinessResult) {
1075:           console.warn('⚠️ Director: Pre-chaos renderer readiness timed out');
1076:         } else {
1077:           console.log('✅ Blueprint bound and particles ready', {
```

- `src/theater/TheaterDirector.js:1086`

```text
1084: 
1085:       const chaosDuration = Math.max(0, Number(chaosConfig.durationMs) || 0);
1086:       this.phase = 'chaos';
1087:       console.log(`   Phase: Chaos (${chaosDuration}ms)`);
1088:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
```

- `src/theater/TheaterDirector.js:1087`

```text
1085:       const chaosDuration = Math.max(0, Number(chaosConfig.durationMs) || 0);
1086:       this.phase = 'chaos';
1087:       console.log(`   Phase: Chaos (${chaosDuration}ms)`);
1088:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
1089:         name: 'chaos',
```

- `src/theater/TheaterDirector.js:1089`

```text
1087:       console.log(`   Phase: Chaos (${chaosDuration}ms)`);
1088:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
1089:         name: 'chaos',
1090:         duration: chaosDuration,
1091:         rendererSpin: chaosConfig.rendererSpin || null,
```

- `src/theater/TheaterDirector.js:1096`

```text
1094:         ? clamp01(chaosConfig.morphTo)
1095:         : 0.0;
1096:       const chaosAnimation = animateMorph(currentMorphValue, chaosTarget, chaosDuration, 'chaos');
1097:       if (chaosDuration > 0) {
1098:         const waitResult = await this.sleep(chaosDuration);
```

- `src/theater/TheaterDirector.js:1108`

```text
1106: 
1107:     if (!skipTriggered && coalesceConfig?.enabled !== false) {
1108:       console.log('🔍 [ABOUT TO START COALESCE]', {
1109:         coalesceConfig,
1110:         currentMorph: currentMorphValue,
```

- `src/theater/TheaterDirector.js:1114`

```text
1112:       });
1113:       const coalesceDuration = Math.max(0, Number(coalesceConfig.durationMs) || 0);
1114:       this.phase = 'coalesce';
1115:       console.log(`   Phase: Coalesce (${coalesceDuration}ms → morph ${coalesceConfig.morphTo ?? '—'})`);
1116:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
```

- `src/theater/TheaterDirector.js:1115`

```text
1113:       const coalesceDuration = Math.max(0, Number(coalesceConfig.durationMs) || 0);
1114:       this.phase = 'coalesce';
1115:       console.log(`   Phase: Coalesce (${coalesceDuration}ms → morph ${coalesceConfig.morphTo ?? '—'})`);
1116:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
1117:         name: 'coalesce',
```

- `src/theater/TheaterDirector.js:1117`

```text
1115:       console.log(`   Phase: Coalesce (${coalesceDuration}ms → morph ${coalesceConfig.morphTo ?? '—'})`);
1116:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
1117:         name: 'coalesce',
1118:         duration: coalesceDuration,
1119:         morphTarget: typeof coalesceConfig.morphTo === 'number' ? coalesceConfig.morphTo : null,
```

- `src/theater/TheaterDirector.js:1125`

```text
1123:       let coalesceAnimation = null;
1124:       if (hasCoalesceTarget) {
1125:         coalesceAnimation = animateMorph(currentMorphValue, coalesceTarget, coalesceDuration, 'coalesce');
1126:       } else {
1127:         emitMorphSnapshot(currentMorphValue, 'coalesce', coalesceTarget, coalesceDuration);
```

- `src/theater/TheaterDirector.js:1127`

```text
1125:         coalesceAnimation = animateMorph(currentMorphValue, coalesceTarget, coalesceDuration, 'coalesce');
1126:       } else {
1127:         emitMorphSnapshot(currentMorphValue, 'coalesce', coalesceTarget, coalesceDuration);
1128:       }
1129:       if (coalesceDuration > 0) {
```

- `src/theater/TheaterDirector.js:1140`

```text
1138: 
1139:     if (!skipTriggered && settleConfig?.enabled !== false) {
1140:       console.log('🔍 [ABOUT TO START SETTLE]', {
1141:         settleConfig,
1142:         currentMorph: currentMorphValue,
```

- `src/theater/TheaterDirector.js:1146`

```text
1144:       });
1145:       const settleDuration = Math.max(0, Number(settleConfig.durationMs) || 0);
1146:       this.phase = 'settle';
1147:       console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
1148:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
```

- `src/theater/TheaterDirector.js:1147`

```text
1145:       const settleDuration = Math.max(0, Number(settleConfig.durationMs) || 0);
1146:       this.phase = 'settle';
1147:       console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
1148:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
1149:         name: 'settle',
```

- `src/theater/TheaterDirector.js:1149`

```text
1147:       console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
1148:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
1149:         name: 'settle',
1150:         duration: settleDuration,
1151:         morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
```

- `src/theater/TheaterDirector.js:1157`

```text
1155:       let settleAnimation = null;
1156:       if (hasSettleTarget) {
1157:         settleAnimation = animateMorph(currentMorphValue, settleTarget, settleDuration, 'settle');
1158:       } else {
1159:         emitMorphSnapshot(currentMorphValue, 'settle', settleTarget, settleDuration);
```

- `src/theater/TheaterDirector.js:1159`

```text
1157:         settleAnimation = animateMorph(currentMorphValue, settleTarget, settleDuration, 'settle');
1158:       } else {
1159:         emitMorphSnapshot(currentMorphValue, 'settle', settleTarget, settleDuration);
1160:       }
1161:       if (settleDuration > 0) {
```

- `src/theater/TheaterDirector.js:1177`

```text
1175: 
1176:     if (skipTriggered) {
1177:       console.log(`   Opening skip engaged (${this._skipOrigin ?? 'user'}) → fast-forwarding to emergence.`);
1178:       if (currentMorphValue < 1) {
1179:         emitMorphSnapshot(1, 'skip-fast-forward', 1, 0);
```

- `src/theater/TheaterDirector.js:1185`

```text
1183:     }
1184: 
1185:     // ───────────────── Phase 5: Emergence (viewport → constellation)
1186:     this.phase = 'emergence';
1187:     const reusePreboundBlueprint = this._openingPrebound === true;
```

- `src/theater/TheaterDirector.js:1186`

```text
1184: 
1185:     // ───────────────── Phase 5: Emergence (viewport → constellation)
1186:     this.phase = 'emergence';
1187:     const reusePreboundBlueprint = this._openingPrebound === true;
1188:     console.log(`   Phase: Particle emergence (${reusePreboundBlueprint ? 'reusing pre-bound blueprint' : 'SST governed'})`);
```

- `src/theater/TheaterDirector.js:1188`

```text
1186:     this.phase = 'emergence';
1187:     const reusePreboundBlueprint = this._openingPrebound === true;
1188:     console.log(`   Phase: Particle emergence (${reusePreboundBlueprint ? 'reusing pre-bound blueprint' : 'SST governed'})`);
1189: 
1190:     const viewportHint = await this._ensureViewportHint();
```

- `src/theater/TheaterDirector.js:1207`

```text
1205:       });
1206:     } else {
1207:       emitMorphSnapshot(currentMorphValue, 'emergence', 1, emergenceTimeline.durationMs);
1208:     }
1209: 
```

- `src/theater/TheaterDirector.js:1264`

```text
1262:             const mode = payload?.mode || blueprint?.mode;
1263:             const isGenesis = stage === 'genesis';
1264:             const isEmergenceMode = mode === 'emergence';
1265:             if (!isGenesis || isEmergenceMode) return;
1266:             console.log('   Fallback: BLUEPRINT_READY (genesis full) before fencepost');
```

- `src/theater/TheaterDirector.js:1299`

```text
1297:       
1298:       this.phase = 'genesis';
1299:       const previousStage = this.currentStage ?? 'emergence';
1300:       console.log('🧬 Phase: Genesis stage handoff');
1301: 
```

- `src/theater/TheaterDirector.js:1465`

```text
1463:     // Warn about early cancellation in development
1464:     if (import.meta?.env?.DEV) {
1465:       if (this.phase === 'black' || this.phase === 'cursor' || this.phase === 'terminal') {
1466:         console.warn('🎬 Director: WARNING - Cancelling during early phase:', this.phase);
1467:         console.warn('   This may be caused by HMR or effect cleanup');
```

- `src/theater/TheaterDirector.js:1745`

```text
1743:       required: ['stage', 'quality', 'blueprint'],
1744:       optional: ['cached', 'mode'],
1745:       notes: 'Renderer consumes stage/quality/blueprint; mode=emergence for special handling.',
1746:     },
1747:     BUILD_EMERGENCE_BLUEPRINT: {
```

- `src/theater/TheaterDirector.js:1750`

```text
1748:       required: ['mode', 'source', 'target', 'count'],
1749:       optional: ['tierRatios', 'viewportHint'],
1750:       notes: 'Corrected contract for viewport spread → constellation emergence.',
1751:     },
1752:   },
```

- `src/theater/events-safe.js:16`

```text
14:   CURSOR_SHOW: 'CURSOR_SHOW',
15:   CURSOR_BLINK: 'CURSOR_BLINK',
16:   TERMINAL_TYPE: 'TERMINAL_TYPE',
17:   SCREEN_FILL: 'SCREEN_FILL',
18:   ENGINE_VIEWPORT_HINT: 'ENGINE_VIEWPORT_HINT',
```

- `src/theater/events-safe.js:17`

```text
15:   CURSOR_BLINK: 'CURSOR_BLINK',
16:   TERMINAL_TYPE: 'TERMINAL_TYPE',
17:   SCREEN_FILL: 'SCREEN_FILL',
18:   ENGINE_VIEWPORT_HINT: 'ENGINE_VIEWPORT_HINT',
19:   ENABLE_SCROLL: 'ENABLE_SCROLL',
```

- `src/theater/events.js:8`

```text
6:   CURSOR_SHOW: 'CURSOR_SHOW',
7:   CURSOR_BLINK: 'CURSOR_BLINK',
8:   TERMINAL_TYPE: 'TERMINAL_TYPE',                // { lines[], typeSpeed, lineDelay }
9:   SCREEN_FILL: 'SCREEN_FILL',                    // { text, scrollSpeed }
10:   DIRECTOR_OPENING_MODE: 'DIRECTOR_OPENING_MODE',// { mode, stage }
```

- `src/theater/events.js:9`

```text
7:   CURSOR_BLINK: 'CURSOR_BLINK',
8:   TERMINAL_TYPE: 'TERMINAL_TYPE',                // { lines[], typeSpeed, lineDelay }
9:   SCREEN_FILL: 'SCREEN_FILL',                    // { text, scrollSpeed }
10:   DIRECTOR_OPENING_MODE: 'DIRECTOR_OPENING_MODE',// { mode, stage }
11: 
```

- `src/theater/events.js:15`

```text
13:   ENGINE_VIEWPORT_HINT: 'ENGINE_VIEWPORT_HINT',  // { width, height, aspect }
14: 
15:   // Emergence / blueprint handoff
16:   BUILD_EMERGENCE_BLUEPRINT: 'BUILD_EMERGENCE_BLUEPRINT',
17:   BLUEPRINT_READY: 'BLUEPRINT_READY',            // { blueprint, stage?, quality?, mode? }
```

- `src/utils/portraitPositions.js:40`

```text
38: 
39:   const step = baseCount / safeCount;
40:   let cursor = 0;
41:   for (let i = 0; i < safeCount; i++) {
42:     const index = Math.min(baseCount - 1, Math.floor(cursor));
```

- `src/utils/portraitPositions.js:42`

```text
40:   let cursor = 0;
41:   for (let i = 0; i < safeCount; i++) {
42:     const index = Math.min(baseCount - 1, Math.floor(cursor));
43:     const src = index * 3;
44:     const dst = i * 3;
```

- `src/utils/portraitPositions.js:48`

```text
46:     out[dst + 1] = points[src + 1];
47:     out[dst + 2] = points[src + 2];
48:     cursor += step;
49:   }
50:   return out;
```

## NARRATION_API

- `src/components/consciousness/ConsciousnessTheater.jsx:252`

```text
250:     const skipNarrationIfActive = () => {
251:       const controller = typeof window !== 'undefined' ? window.narrationController : null;
252:       if (controller?.isPlaying && typeof controller.skipNarration === 'function') {
253:         controller.skipNarration();
254:         return true;
```

- `src/components/consciousness/ConsciousnessTheater.jsx:253`

```text
251:       const controller = typeof window !== 'undefined' ? window.narrationController : null;
252:       if (controller?.isPlaying && typeof controller.skipNarration === 'function') {
253:         controller.skipNarration();
254:         return true;
255:       }
```

- `src/components/consciousness/ConsciousnessTheater.jsx:384`

```text
382:             window.unifiedNav.navigateToStage(targetStage, {
383:               smooth: true,
384:               skipNarration: false,
385:               source: 'number_key',
386:             });
```

- `src/components/narrative/NarrationController.jsx:452`

```text
450:         if (DEBUG_NARRATION) {
451:           const preview = text.length > 50 ? `${text.slice(0, 50)}…` : text;
452:           console.log('🎙️ [BEAT FIRED]', {
453:             stage: stageName,
454:             segmentIndex,
```

- `src/components/narrative/NarrationController.jsx:540`

```text
538:             : Date.now();
539: 
540:         BeatBus.emit?.(EVENTS.NARRATIVE_LINE, {
541:           stage: stageName,
542:           segmentId: segment?.id ?? null,
```

- `src/components/narrative/NarrationController.jsx:682`

```text
680:   );
681: 
682:   const skipNarration = useCallback(
683:     (origin = 'skip') => {
684:       if (origin === 'external' && !isControlAllowed('narration:control')) {
```

- `src/components/narrative/NarrationController.jsx:792`

```text
790:           enumerable: true,
791:         },
792:         skipNarration: {
793:           value: () => skipNarration('external'),
794:           enumerable: true,
```

- `src/components/narrative/NarrationController.jsx:793`

```text
791:         },
792:         skipNarration: {
793:           value: () => skipNarration('external'),
794:           enumerable: true,
795:         },
```

- `src/components/narrative/NarrationController.jsx:826`

```text
824:     exposeControlSurface('narrationController', controllerFactory, {
825:       playNarration: 'narration:control',
826:       skipNarration: 'narration:control',
827:     });
828: 
```

- `src/components/narrative/NarrationController.jsx:847`

```text
845:       revokeControlSurface('narrationController');
846:     };
847:   }, [skipNarration, startNarration]);
848: 
849:   useEffect(() => {
```

- `src/components/narrative/NarrationController.jsx:856`

```text
854:       autoAdvanceEnabled,
855:       resetStateId: resetState,
856:       skipNarrationId: skipNarration,
857:       startNarrationId: startNarration,
858:     };
```

- `src/components/narrative/NarrationController.jsx:962`

```text
960:       event.preventDefault?.();
961:       event.stopPropagation?.();
962:       skipNarration('space');
963:     };
964: 
```

- `src/components/narrative/NarrationController.jsx:979`

```text
977:       resetState();
978:     };
979:   }, [currentStage, resetState, skipNarration, startNarration]);
980: 
981:   useEffect(() => {
```

- `src/components/narrative/NarrationOverlayBus.jsx:156`

```text
154: 
155:     const handleLine = (payload = {}) => {
156:       const validation = validateEvent('NARRATIVE_LINE', payload);
157:       diagnostics.recordEvent('NARRATIVE_LINE', payload, validation.valid);
158: 
```

- `src/components/narrative/NarrationOverlayBus.jsx:157`

```text
155:     const handleLine = (payload = {}) => {
156:       const validation = validateEvent('NARRATIVE_LINE', payload);
157:       diagnostics.recordEvent('NARRATIVE_LINE', payload, validation.valid);
158: 
159:       if (!validation.valid) {
```

- `src/components/narrative/NarrationOverlayBus.jsx:160`

```text
158: 
159:       if (!validation.valid) {
160:         console.error('❌ [NarrationOverlay] Invalid NARRATIVE_LINE:', validation.reason);
161:         diagnostics.recordError('INVALID_EVENT', { event: 'NARRATIVE_LINE', ...validation });
162:         return;
```

- `src/components/narrative/NarrationOverlayBus.jsx:161`

```text
159:       if (!validation.valid) {
160:         console.error('❌ [NarrationOverlay] Invalid NARRATIVE_LINE:', validation.reason);
161:         diagnostics.recordError('INVALID_EVENT', { event: 'NARRATIVE_LINE', ...validation });
162:         return;
163:       }
```

- `src/components/narrative/NarrationOverlayBus.jsx:170`

```text
168:       }
169: 
170:       const dupCheck = deduplicator.check('NARRATIVE_LINE', payload);
171:       if (dupCheck.isDuplicate) {
172:         diagnostics.recordDuplicateIgnored();
```

- `src/components/narrative/NarrationOverlayBus.jsx:173`

```text
171:       if (dupCheck.isDuplicate) {
172:         diagnostics.recordDuplicateIgnored();
173:         diagnostics.recordError('DUPLICATE_EVENT', { event: 'NARRATIVE_LINE', reason: dupCheck.reason });
174:         return;
175:       }
```

- `src/components/narrative/NarrationOverlayBus.jsx:204`

```text
202: 
203:     const offStart = BeatBus.on?.(EVENTS.START_NARRATIVE, handleStart);
204:     const offLine = BeatBus.on?.(EVENTS.NARRATIVE_LINE, handleLine);
205:     const offStop = BeatBus.on?.(EVENTS.NARRATION_STOPPED, handleStop);
206:     const offCleanup = BeatBus.on?.(EVENTS.NARRATION_CLEANUP, handleCleanup);
```

- `src/components/narrative/overlay/OverlayContracts.js:29`

```text
27:   },
28: 
29:   NARRATIVE_LINE: {
30:     validate(payload) {
31:       if (!payload) {
```

- `src/components/narrative/overlay/OverlayDeduplication.js:20`

```text
18:    */
19:   generateId(eventName, payload = {}) {
20:     if (eventName === 'NARRATIVE_LINE') {
21:       return `LINE:${payload.text ?? ''}:${payload.stage ?? ''}`;
22:     }
```

- `src/components/ui/narrative/StageNavigation.jsx:47`

```text
45:               unifiedNav.navigateToStage(id, {
46:                 smooth: true,
47:                 skipNarration: false,
48:                 source: 'sidebar',
49:               });
```

- `src/orchestration/navigation/narrativeNavigation.js:41`

```text
39:     .navigateToStage(stageName, {
40:       smooth,
41:       skipNarration: !emitNarration,
42:       source: 'narrative_navigation',
43:     })
```

- `src/orchestration/navigation/narrativeNavigation.js:115`

```text
113:     .navigateToStage(nextStageName, {
114:       smooth: true,
115:       skipNarration: false,
116:       source: 'narrative_navigation_next',
117:     })
```

- `src/orchestration/navigation/narrativeNavigation.js:137`

```text
135:     .navigateToStage(prevStageName, {
136:       smooth: true,
137:       skipNarration: false,
138:       source: 'narrative_navigation_prev',
139:     })
```

- `src/theater/UnifiedNavigationAPI.js:32`

```text
30:     const {
31:       smooth = true,
32:       skipNarration = false,
33:       source = 'unknown',
34:       settleMs = 450,
```

- `src/theater/UnifiedNavigationAPI.js:42`

```text
40:       source,
41:       smooth,
42:       skipNarration,
43:       method: 'ORCHESTRATED',
44:     });
```

- `src/theater/UnifiedNavigationAPI.js:67`

```text
65: 
66:     // Skip narration if requested
67:     if (skipNarration && window.narrationController?.skipNarration) {
68:       window.narrationController.skipNarration();
69:     }
```

- `src/theater/UnifiedNavigationAPI.js:68`

```text
66:     // Skip narration if requested
67:     if (skipNarration && window.narrationController?.skipNarration) {
68:       window.narrationController.skipNarration();
69:     }
70: 
```

- `src/theater/bus/schemas.js:71`

```text
69:     optional: { source: 'string' },
70:   }],
71:   ['NARRATIVE_LINE', {
72:     required: { stage: 'string', text: 'string' },
73:     optional: {
```

- `src/theater/events.js:31`

```text
29:   // Stage / narrative control
30:   START_NARRATIVE: 'START_NARRATIVE',            // { id?, stage? }
31:   NARRATIVE_LINE: 'NARRATIVE_LINE',
32:   NARRATION_STOPPED: 'NARRATION_STOPPED',
33:   NARRATION_CLEANUP: 'NARRATION_CLEANUP',
```

## RENDERER

- `src/components/narrative/NarrationController.jsx:555`

```text
553:             effect: particleEffectPayload,
554:           });
555:           BeatBus.emit?.(EVENTS.RENDER_DIRECTIVE, {
556:             kind: 'particle-effect',
557:             ...particleEffectPayload,
```

- `src/components/ui/LCPHero.jsx:8`

```text
6:  * LCPHero — static poster that satisfies Lighthouse LCP immediately.
7:  *
8:  * Shows a pre-rendered hero until the renderer fires PARTICLES_EMERGED,
9:  * then removes itself (or times out after 5s as a fallback).
10:  */
```

- `src/components/ui/LCPHero.jsx:32`

```text
30: 
31:     const off = (typeof BeatBus?.on === 'function')
32:       ? BeatBus.on(EVENTS.PARTICLES_EMERGED, () => hideHero('particles-emerged'))
33:       : () => {};
34: 
```

- `src/components/webgl/WebGLBackground.jsx:3`

```text
1: // src/components/webgl/WebGLBackground.jsx
2: // HOT-DORS passive renderer: projection-matrix viewport hint + single directive sink
3: // Single writer: binds geometry/material, emits PARTICLES_EMERGED exactly once (on first FULL bind)
4: 
5: import React, { useRef, useEffect, useState, useCallback } from 'react';
```

- `src/components/webgl/WebGLBackground.jsx:52`

```text
50:   'uMotionMode',
51:   'uFlowTurbulence',
52:   'uMorphProgress',
53:   'uStageProgress',
54:   'uPointSize',
```

- `src/components/webgl/WebGLBackground.jsx:331`

```text
329:     if (!payload) return;
330:     trace('WBG:FENCEPOST', payload);
331:     BeatBus.emit(EVENTS.PARTICLES_EMERGED, payload);
332:     if (import.meta?.env?.DEV) {
333:       console.log('✅ [RENDERER] PARTICLES_EMERGED emitted', payload);
```

- `src/components/webgl/WebGLBackground.jsx:333`

```text
331:     BeatBus.emit(EVENTS.PARTICLES_EMERGED, payload);
332:     if (import.meta?.env?.DEV) {
333:       console.log('✅ [RENDERER] PARTICLES_EMERGED emitted', payload);
334:     }
335: 
```

- `src/components/webgl/WebGLBackground.jsx:418`

```text
416:       const uniforms = mat?.uniforms;
417: 
418:       if (uniforms?.uMorphProgress) {
419:         uniforms.uMorphProgress.value = 1.0;
420:         if (uniforms.uStageProgress) {
```

- `src/components/webgl/WebGLBackground.jsx:419`

```text
417: 
418:       if (uniforms?.uMorphProgress) {
419:         uniforms.uMorphProgress.value = 1.0;
420:         if (uniforms.uStageProgress) {
421:           uniforms.uStageProgress.value = 1.0;
```

- `src/components/webgl/WebGLBackground.jsx:483`

```text
481:           attrs: geo ? Object.keys(geo.attributes || {}) : [],
482:           drawCount: geo?.drawRange?.count ?? null,
483:           morph: uniforms.uMorphProgress?.value ?? null,
484:           pointSize: uniforms.uPointSize?.value ?? null,
485:           freeze: uniforms.uPostMorphFreeze?.value ?? null,
```

- `src/components/webgl/WebGLBackground.jsx:743`

```text
741:     if (!mat?.uniforms) return;
742:     const u = mat.uniforms;
743:     if (u.uMorphProgress) u.uMorphProgress.value = v;
744:     else if (u.morphProgress) u.morphProgress.value = v;
745:     else if (u.uMorph) u.uMorph.value = v;
```

- `src/components/webgl/WebGLBackground.jsx:834`

```text
832:       const start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
833:       morphProbeTimer = setInterval(() => {
834:         if (!uniforms?.uMorphProgress) return;
835:         const val = Number(uniforms.uMorphProgress.value) || 0;
836:         const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
```

- `src/components/webgl/WebGLBackground.jsx:835`

```text
833:       morphProbeTimer = setInterval(() => {
834:         if (!uniforms?.uMorphProgress) return;
835:         const val = Number(uniforms.uMorphProgress.value) || 0;
836:         const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
837:         console.log('[PROBE] uMorphProgress', { t: Math.round(now - start), val });
```

- `src/components/webgl/WebGLBackground.jsx:837`

```text
835:         const val = Number(uniforms.uMorphProgress.value) || 0;
836:         const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
837:         console.log('[PROBE] uMorphProgress', { t: Math.round(now - start), val });
838:         if (now - start > 2000) {
839:           clearInterval(morphProbeTimer);
```

- `src/components/webgl/WebGLBackground.jsx:1260`

```text
1258:         });
1259:         scheduleRuntimeSampling();
1260:         if (mat?.uniforms?.uMorphProgress) {
1261:           if (isQrBlueprint) {
1262:             mat.uniforms.uMorphProgress.value = 1;
```

- `src/components/webgl/WebGLBackground.jsx:1262`

```text
1260:         if (mat?.uniforms?.uMorphProgress) {
1261:           if (isQrBlueprint) {
1262:             mat.uniforms.uMorphProgress.value = 1;
1263:             if (mat.uniforms.uStageProgress) mat.uniforms.uStageProgress.value = 1;
1264:             if (mat.uniforms.uPostMorphFreeze) mat.uniforms.uPostMorphFreeze.value = 1;
```

- `src/components/webgl/WebGLBackground.jsx:1266`

```text
1264:             if (mat.uniforms.uPostMorphFreeze) mat.uniforms.uPostMorphFreeze.value = 1;
1265:           } else {
1266:             mat.uniforms.uMorphProgress.value = 0;
1267:             if (mat.uniforms.uStageProgress) mat.uniforms.uStageProgress.value = 0;
1268:           }
```

- `src/components/webgl/WebGLBackground.jsx:1293`

```text
1291:           );
1292:           const seededMorph = maybeSeedNumber(
1293:             uniforms.uMorphProgress,
1294:             fallbackMorphRef.current ?? 0
1295:           );
```

- `src/components/webgl/WebGLBackground.jsx:1499`

```text
1497:           emittedEmergedRef.current = true;
1498:           emergencePendingRef.current = false;
1499:           console.log('EMERGED once — emitting PARTICLES_EMERGED fencepost');
1500:         }
1501:       }
```

- `src/components/webgl/WebGLBackground.jsx:1540`

```text
1538:       const matCurrent = materialRef.current;
1539:       const currentUniforms = matCurrent?.uniforms;
1540:       if (!isEmergenceMode && currentUniforms?.uMorphProgress) {
1541:         const director = typeof window !== 'undefined' ? window.theaterDirector : null;
1542:         const currentStage = director?.getCurrentStage?.() ?? director?.currentStage ?? null;
```

- `src/components/webgl/WebGLBackground.jsx:1547`

```text
1545:         const startMorph = 0.0;
1546: 
1547:         currentUniforms.uMorphProgress.value = startMorph;
1548:         if (currentUniforms.uStageProgress) {
1549:           currentUniforms.uStageProgress.value = startMorph;
```

- `src/components/webgl/WebGLBackground.jsx:1574`

```text
1572:             const progress = Math.min(1, elapsed / duration);
1573:             const liveUniforms = matCurrent.uniforms;
1574:             if (liveUniforms?.uMorphProgress) {
1575:               liveUniforms.uMorphProgress.value = startMorph + (1 - startMorph) * progress;
1576:             }
```

- `src/components/webgl/WebGLBackground.jsx:1575`

```text
1573:             const liveUniforms = matCurrent.uniforms;
1574:             if (liveUniforms?.uMorphProgress) {
1575:               liveUniforms.uMorphProgress.value = startMorph + (1 - startMorph) * progress;
1576:             }
1577:             if (liveUniforms?.uStageProgress) {
```

- `src/components/webgl/WebGLBackground.jsx:1693`

```text
1691:       mat.uniformsNeedUpdate = true;
1692:     };
1693:     const off = BeatBus.on(EVENTS.RENDER_DIRECTIVE, handleDirective);
1694:     return () => off && off();
1695:   }, []);
```

- `src/components/webgl/WebGLBackground.jsx:1795`

```text
1793:         uniforms: {
1794:           uTime:            { value: 0 },
1795:           uMorphProgress:   { value: clamp01(fallbackMorphRef.current) },
1796:           uScrollProgress:  { value: 0 },
1797:           uStageProgress:   { value: clamp01(fallbackMorphRef.current) },
```

- `src/components/webgl/WebGLBackground.jsx:1907`

```text
1905:         uniforms: mat ? Object.keys(mat.uniforms || {}) : [],
1906:         hasGeometry: !!geometryRef.current,
1907:         morph: mat?.uniforms?.uMorphProgress?.value ?? null,
1908:       }));
1909: 
```

- `src/config/canonical/sst-v3.3.json:48`

```text
46:         "forbidden": ["fabricateTargets", "readScroll", "scaleByFov"],
47:         "singleWriter": true,
48:         "emits": ["PARTICLES_EMERGED"]
49:       },
50:       "beatBus": {
```

- `src/config/canonical/sst-v3.3.json:122`

```text
120:       },
121:       {
122:         "name": "uMorphProgress",
123:         "type": "float",
124:         "range": [0, 1],
```

- `src/config/canonical/sst-v3.3.json:200`

```text
198:         "name": "uStageProgress",
199:         "type": "float",
200:         "aliasOf": "uMorphProgress"
201:       },
202:       {
```

- `src/config/canonical/sst-v3.3.json:267`

```text
265:     },
266:     {
267:       "name": "PARTICLES_EMERGED",
268:       "emitter": "Renderer"
269:     },
```

- `src/config/canonical/sst-v3.3.json:688`

```text
686:         "v3.3 config loader",
687:         "Engine text-first blueprints",
688:         "Renderer binding + PARTICLES_EMERGED single-source"
689:       ]
690:     },
```

- `src/config/canonical/sst-v3.3.json:740`

```text
738:     "Swap: anatomy → stage words (text3DPositions)",
739:     "Preserved: tiers, stage order, palettes, fragments, performance",
740:     "Clarified: event single-source (Renderer emits PARTICLES_EMERGED)",
741:     "Renderer: no synthesis, no scroll, no FOV scaling",
742:     "Transcendence: word arrival → galaxy dissolve"
```

- `src/engine/ConsciousnessEngine.js:394`

```text
392:     subscribe('BUILD_EMERGENCE_BLUEPRINT', this._onBuildEmergence.bind(this));
393:     subscribe('START_CLIMAX', this._handleStartClimax.bind(this));
394:     subscribe('PARTICLES_EMERGED', () => {
395:       this._rendererFencepostSeen = true;
396:       this._emergenceActive = false;
```

- `src/engine/ConsciousnessEngine.js:602`

```text
600:       }
601: 
602:       // DO NOT emit PARTICLES_EMERGED - renderer owns this fencepost
603: 
604:     } catch (e) {
```

- `src/shaders/templates/consciousness-vertex.glsl:15`

```text
13: // Uniforms
14: uniform float uTime;
15: uniform float uMorphProgress;
16: uniform float uScrollProgress;
17: uniform float uPointSize;
```

- `src/shaders/templates/consciousness-vertex.glsl:66`

```text
64:   float mode = getTierMode(tierIndex);
65:   vec4 params = getTierParams(tierIndex);
66:   float taper = clamp(1.0 - uMorphProgress, 0.0, 1.0);
67:   vec3 offset = vec3(0.0);
68: 
```

- `src/shaders/templates/consciousness-vertex.glsl:123`

```text
121:   textPos.y *= uTextFit.y;
122: 
123:   float morph = clamp(uMorphProgress, 0.0, 1.0);
124:   float spread = max(uSpreadFactor, 0.0);
125:   float morphType = uMorphType;
```

- `src/shaders/templates/consciousness-vertex.glsl:187`

```text
185:   
186:   // Calculate alpha
187:   vAlpha = opacityData * (0.5 + 0.5 * uMorphProgress);
188:   vTier = tierData;
189: }
```

- `src/theater/TheaterDirector.js:441`

```text
439:     }
440: 
441:     BeatBus.emit(EVENTS.RENDER_DIRECTIVE, directive);
442: 
443:     if (morph >= 0.995) {
```

- `src/theater/TheaterDirector.js:1056`

```text
1054:       if (!this._preChaosReady) {
1055:         const readinessResult = await Promise.race([
1056:           this._waitForEvent(EVENTS.PARTICLES_EMERGED, {
1057:             timeout: 2200,
1058:             predicate: (payload = {}) => {
```

- `src/theater/TheaterDirector.js:1249`

```text
1247:           };
1248: 
1249:           const fenceOff = BeatBus.on(EVENTS.PARTICLES_EMERGED, (payload) => {
1250:             console.log('   Received: PARTICLES_EMERGED');
1251:             finish({ type: 'fencepost', payload });
```

- `src/theater/TheaterDirector.js:1250`

```text
1248: 
1249:           const fenceOff = BeatBus.on(EVENTS.PARTICLES_EMERGED, (payload) => {
1250:             console.log('   Received: PARTICLES_EMERGED');
1251:             finish({ type: 'fencepost', payload });
1252:           });
```

- `src/theater/TheaterDirector.js:1255`

```text
1253: 
1254:           fenceTimeoutId = this._trackTimer(() => {
1255:             console.warn(`⚠️ Director: ${EVENTS.PARTICLES_EMERGED} timed out after ${fencepostWaitMs}ms`);
1256:             finish(null);
1257:           }, fencepostWaitMs);
```

- `src/theater/TheaterDirector.js:1274`

```text
1272:             this._pendingDirectorFencepost = null;
1273:             queueMicrotask(() => {
1274:               BeatBus.emit(EVENTS.PARTICLES_EMERGED, pendingPayload);
1275:               this._directorFencepostSent = true;
1276:             });
```

- `src/theater/bus/index.js:6`

```text
4: // Uses canon-console contract registry for validation
5: 
6: const BATCH_EVENTS = new Set(['MORPH_PROGRESS', 'SCROLL_PROGRESS', 'RENDER_DIRECTIVE']);
7: const SYNC_EVENTS = new Set(['PARTICLES_EMERGED', 'FENCEPOST_LISTENERS_READY', 'ENABLE_SCROLL']);
8: const DEV_MODE = (typeof import.meta !== 'undefined' && import.meta.env)
```

- `src/theater/bus/index.js:7`

```text
5: 
6: const BATCH_EVENTS = new Set(['MORPH_PROGRESS', 'SCROLL_PROGRESS', 'RENDER_DIRECTIVE']);
7: const SYNC_EVENTS = new Set(['PARTICLES_EMERGED', 'FENCEPOST_LISTENERS_READY', 'ENABLE_SCROLL']);
8: const DEV_MODE = (typeof import.meta !== 'undefined' && import.meta.env)
9:   ? !!import.meta.env.DEV
```

- `src/theater/bus/index.js:433`

```text
431:     if (SYNC_EVENTS.has(evt)) return false;
432:     if (!BATCH_EVENTS.has(evt)) return false;
433:     if (evt === 'RENDER_DIRECTIVE') {
434:       if (!payload) return false;
435:       if (payload.enterQrMode || payload.exitQrMode) return false;
```

- `src/theater/bus/index.js:471`

```text
469:     const listenerCount = listenerSet ? listenerSet.size : 0;
470: 
471:     if (evt === 'RENDER_DIRECTIVE') {
472:       console.log('🚌 BeatBus.emit called:', {
473:         eventName: evt,
```

- `src/theater/bus/schemas.js:43`

```text
41:     },
42:   }],
43:   ['RENDER_DIRECTIVE', {
44:     optional: {
45:       kind: 'string',
```

- `src/theater/events-safe.js:9`

```text
7:   QUALITY_CHANGE: 'QUALITY_CHANGE',
8:   BLUEPRINT_READY: 'BLUEPRINT_READY',
9:   PARTICLES_EMERGED: 'PARTICLES_EMERGED',
10: };
11: 
```

- `src/theater/events-safe.js:24`

```text
22: export const EVENTS_RUNTIME = {
23:   // Runtime events
24:   RENDER_DIRECTIVE: 'RENDER_DIRECTIVE',
25:   MORPH_PROGRESS: 'MORPH_PROGRESS',
26:   RENDERER_TUNE: 'RENDERER_TUNE',
```

- `src/theater/events.js:20`

```text
18:   BLUEPRINT_INVALIDATED: 'BLUEPRINT_INVALIDATED',// guard fallback notification
19:   PARTICLES_START_EMERGING: 'PARTICLES_START_EMERGING',
20:   PARTICLES_EMERGED: 'PARTICLES_EMERGED',        // fencepost (emit once)
21:   FENCEPOST_LISTENERS_READY: 'FENCEPOST_LISTENERS_READY',
22: 
```

- `src/theater/events.js:24`

```text
22: 
23:   // Renderer tuning & morph
24:   RENDER_DIRECTIVE: 'RENDER_DIRECTIVE',          // renderer draw/morph directives
25:   RENDERER_TUNE: 'RENDERER_TUNE',                // { rotZdegPerSec, swirl, vibAmp, flutter, trails, ... }
26:   PARTICLE_PHASE: 'PARTICLE_PHASE',              // { name }
```


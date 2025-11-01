# Narration & Opening Evidence Report

Generated: 10/31/2025, 3:16:43 PM

---
## 1) SST Extract

```json
{
  "source": "sst/canon/v3.5.json",
  "version": null,
  "mode": null,
  "openingPhases": {
    "rules": {
      "startAfterViewportHint": true,
      "stage0ColorLock": true,
      "scrollLockedUntil": "ENABLE_SCROLL",
      "emergenceModeRequired": true
    },
    "skipKey": "SPACE",
    "totalDurationMs": 12500,
    "timeline": {
      "blackout": {
        "durationMs": 2000
      },
      "cursor": {
        "blinkCount": 2,
        "intervalMs": 500
      },
      "typing": {
        "lines": [
          "READY.",
          "10 PRINT \"HELLO CURTIS\"",
          "20 GOTO 10",
          "RUN"
        ],
        "typeSpeed": 50,
        "lineDelay": 500,
        "completionDelayMs": 800
      },
      "fill": {
        "text": "HELLO CURTIS ",
        "scrollSpeed": 100,
        "durationMs": 2000
      },
      "emergence": {
        "durationMs": 2000,
        "waitForFencepost": true,
        "maxWaitMs": 5000,
        "stabilizeMs": 500,
        "skipMorphAnimation": false,
        "skipGenesisBlueprint": true,
        "targetState": "genesis_initial"
      },
      "profile": "chaos_coalesce_settle_v1",
      "prologue": {
        "terminalOverlay": true,
        "fadeOutAtMs": 0
      },
      "chaos": {
        "enabled": true,
        "durationMs": 2000,
        "rendererSpin": {
          "z": 0.55,
          "y": 0.25
        }
      },
      "coalesce": {
        "enabled": true,
        "durationMs": 2000,
        "morphTo": 0.6
      },
      "settle": {
        "enabled": true,
        "durationMs": 1500,
        "morphTo": 1,
        "constellationCoverage": [
          0.95,
          0.8,
          0.6,
          0.45
        ]
      },
      "narration": {
        "startAtMs": 13000,
        "events": [
          "START_NARRATIVE",
          "AUDIO_START_STAGE"
        ]
      },
      "beatGlyph": {
        "revealMs": 9500,
        "text": "HELLO CURTIS"
      }
    },
    "emergence": {
      "target": "random_to_random_gas_cloud",
      "mode": "emergence",
      "source": "viewportSpread"
    }
  },
  "stages": [
    "genesis",
    "discipline",
    "neural",
    "velocity",
    "architecture",
    "harmony",
    "transcendence"
  ],
  "morphProfiles": {},
  "cameraByStage": {
    "genesis": {
      "initial": {
        "position": {
          "x": 0,
          "y": 0,
          "z": 5
        },
        "lookAt": {
          "x": 0,
          "y": 0,
          "z": 0
        }
      },
      "movement": {
        "type": "static",
        "description": "Fixed camera during emergence"
      },
      "reveal": {
        "timing": 8000,
        "duration": 2000,
        "target": {
          "x": 0.8,
          "y": 0.5,
          "z": 4.5
        },
        "easing": "easeInOutQuad",
        "description": "Subtle 15° rotation to show depth"
      },
      "keyframes": []
    },
    "discipline": {
      "initial": {
        "position": {
          "x": 0,
          "y": -1,
          "z": 5
        },
        "lookAt": {
          "x": 0,
          "y": 0,
          "z": 0
        }
      },
      "movement": {
        "type": "orbit",
        "axis": "y",
        "degrees": 10,
        "duration": 35000,
        "speed": 0.1,
        "easing": "linear",
        "description": "Slow orbit to reveal structure"
      },
      "keyframes": [
        {
          "time": 0,
          "position": {
            "x": 0,
            "y": -1,
            "z": 5
          }
        },
        {
          "time": 35000,
          "position": {
            "x": 1.5,
            "y": -1,
            "z": 4.5
          }
        }
      ]
    },
    "neural": {
      "initial": {
        "position": {
          "x": 0,
          "y": 0,
          "z": 5
        },
        "lookAt": {
          "x": 0,
          "y": 0,
          "z": 0
        }
      },
      "movement": {
        "type": "orbit_discovery",
        "axis": "xy",
        "degrees": 15,
        "duration": 30000,
        "speed": 0.3,
        "wobble": 0.1,
        "easing": "easeInOutSine",
        "description": "Curious orbital movement revealing connections"
      },
      "keyframes": [
        {
          "time": 0,
          "position": {
            "x": 0,
            "y": 0,
            "z": 5
          }
        },
        {
          "time": 10000,
          "position": {
            "x": 1,
            "y": 0.5,
            "z": 4.8
          }
        },
        {
          "time": 20000,
          "position": {
            "x": -0.5,
            "y": -0.3,
            "z": 5.2
          }
        },
        {
          "time": 30000,
          "position": {
            "x": 0,
            "y": 0,
            "z": 5
          }
        }
      ]
    },
    "velocity": {
      "initial": {
        "position": {
          "x": 0,
          "y": 0,
          "z": 6
        },
        "lookAt": {
          "x": 0,
          "y": 0,
          "z": 0
        }
      },
      "movement": {
        "type": "dolly_push",
        "startZ": 6,
        "endZ": 4,
        "duration": 40000,
        "easing": "easeInQuad",
        "shake": {
          "enabled": true,
          "amplitude": 0.1,
          "frequency": 5
        },
        "description": "Dramatic push-in with energy shake"
      },
      "keyframes": [
        {
          "time": 0,
          "position": {
            "x": 0,
            "y": 0,
            "z": 6
          }
        },
        {
          "time": 20000,
          "position": {
            "x": 0,
            "y": 0,
            "z": 5
          }
        },
        {
          "time": 40000,
          "position": {
            "x": 0,
            "y": 0,
            "z": 4
          }
        }
      ]
    },
    "architecture": {
      "initial": {
        "position": {
          "x": 3,
          "y": 3,
          "z": 5
        },
        "lookAt": {
          "x": 0,
          "y": 0,
          "z": 0
        }
      },
      "movement": {
        "type": "isometric_track",
        "pattern": "blueprint",
        "degrees": 12,
        "duration": 35000,
        "easing": "linear",
        "description": "Isometric view revealing system structure"
      },
      "keyframes": [
        {
          "time": 0,
          "position": {
            "x": 3,
            "y": 3,
            "z": 5
          }
        },
        {
          "time": 17500,
          "position": {
            "x": -3,
            "y": 3,
            "z": 5
          }
        },
        {
          "time": 35000,
          "position": {
            "x": 3,
            "y": 3,
            "z": 5
          }
        }
      ]
    },
    "harmony": {
      "initial": {
        "position": {
          "x": 0,
          "y": 0,
          "z": 5
        },
        "lookAt": {
          "x": 0,
          "y": 0,
          "z": 0
        }
      },
      "movement": {
        "type": "balletic_orbit",
        "axis": "xyz",
        "degrees": 25,
        "duration": 40000,
        "speed": 0.2,
        "smooth": 0.98,
        "easing": "easeInOutCubic",
        "description": "Graceful 3-axis ballet revealing golden ratio"
      },
      "keyframes": [
        {
          "time": 0,
          "position": {
            "x": 0,
            "y": 0,
            "z": 5
          }
        },
        {
          "time": 10000,
          "position": {
            "x": 2,
            "y": 1,
            "z": 4.5
          }
        },
        {
          "time": 20000,
          "position": {
            "x": 0,
            "y": 2,
            "z": 5.5
          }
        },
        {
          "time": 30000,
          "position": {
            "x": -2,
            "y": 1,
            "z": 4.5
          }
        },
        {
          "time": 40000,
          "position": {
            "x": 0,
            "y": 0,
            "z": 5
          }
        }
      ]
    },
    "transcendence": {
      "initial": {
        "position": {
          "x": 0,
          "y": 0,
          "z": 5
        },
        "lookAt": {
          "x": 0,
          "y": 0,
          "z": 0
        }
      },
      "movement": {
        "type": "reverent_orbit",
        "axis": "y",
        "degrees": 30,
        "duration": 50000,
        "speed": 0.15,
        "pullback": {
          "enabled": true,
          "from": 5,
          "to": 7,
          "startTime": 35000,
          "duration": 10000,
          "easing": "easeOutQuad"
        },
        "description": "Slow orbit with reverent pullback for full view"
      },
      "keyframes": [
        {
          "time": 0,
          "position": {
            "x": 0,
            "y": 0,
            "z": 5
          }
        },
        {
          "time": 25000,
          "position": {
            "x": 2.5,
            "y": 0,
            "z": 5
          }
        },
        {
          "time": 35000,
          "position": {
            "x": 0,
            "y": 0,
            "z": 5
          }
        },
        {
          "time": 45000,
          "position": {
            "x": 0,
            "y": 0,
            "z": 7
          }
        }
      ]
    }
  },
  "beatsByStage": {},
  "generatedAt": "2025-10-31T20:16:42.498Z"
}
```

---
## 2) BeatBus Emitters/Listeners Map

# BeatBus Event Map
Total events: 23
## AUDIO_COMPUTER_HUM

**Emitters**:
- `src/theater/controllers/OpeningSequenceController.js:332`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:164`

## BLUEPRINT_READY

**Emitters**:
- `src/engine/utils/blueprintUtils.js:166`

**Listeners**:
- `src/components/webgl/WebGLBackground.jsx:860`
- `src/components/webgl/WebGLCanvas.jsx:264`
- `src/theater/controllers/OpeningSequenceController.js:605`

## BUILD_EMERGENCE_BLUEPRINT

**Emitters**:
- `src/state/commands/StateCommands.js:253`
- `src/theater/controllers/OpeningSequenceController.js:379`
- `src/theater/controllers/OpeningSequenceController.js:539`

**Listeners**:
- (none)

## CLIMAX_STEP

**Emitters**:
- `src/engine/modules/ClimaxController.js:205`
- `src/engine/modules/ClimaxController.js:587`

**Listeners**:
- (none)

## CURSOR_BLINK

**Emitters**:
- `src/theater/controllers/OpeningSequenceController.js:338`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:87`

## CURSOR_SHOW

**Emitters**:
- `src/theater/controllers/OpeningSequenceController.js:331`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:80`

## DIRECTOR_CANCEL

**Emitters**:
- `src/theater/TheaterDirector.js:646`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:199`

## DIRECTOR_ERROR

**Emitters**:
- `src/theater/TheaterDirector.js:497`

**Listeners**:
- (none)

## ENABLE_SCROLL

**Emitters**:
- `src/theater/controllers/OpeningSequenceController.js:665`

**Listeners**:
- `src/components/consciousness/ConsciousnessTheater.jsx:189`
- `src/state/commands/StateCommands.js:84`

## ENGINE_VIEWPORT_HINT

**Emitters**:
- `src/components/consciousness/ConsciousnessTheater.jsx:230`
- `src/theater/TheaterDirector.js:837`

**Listeners**:
- `src/components/consciousness/ConsciousnessTheater.jsx:173`
- `src/components/consciousness/ConsciousnessTheater.jsx:217`
- `src/components/consciousness/ConsciousnessTheater.jsx:237`
- `src/theater/TheaterDirector.js:440`
- `src/theater/TheaterDirector.js:857`

## FENCEPOST_LISTENERS_READY

**Emitters**:
- `src/theater/controllers/OpeningSequenceController.js:575`

**Listeners**:
- (none)

## MORPH_PROGRESS

**Emitters**:
- `src/engine/modules/ClimaxController.js:249`
- `src/engine/modules/MorphController.js:273`
- `src/state/commands/StateCommands.js:44`
- `src/theater/controllers/MorphAnimationController.js:332`

**Listeners**:
- `src/components/webgl/WebGLBackground.jsx:930`

## PARTICLES_EMERGED

**Emitters**:
- `src/components/webgl/WebGLBackground.jsx:228`

**Listeners**:
- `src/components/ui/LCPHero.jsx:32`
- `src/theater/controllers/OpeningSequenceController.js:595`

## PARTICLES_START_EMERGING

**Emitters**:
- `src/theater/controllers/OpeningSequenceController.js:556`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:180`

## PARTICLE_PHASE

**Emitters**:
- `src/theater/controllers/OpeningSequenceController.js:440`
- `src/theater/controllers/OpeningSequenceController.js:466`
- `src/theater/controllers/OpeningSequenceController.js:498`

**Listeners**:
- `src/components/webgl/WebGLBackground.jsx:1172`

## PREWARM_COMPLETE

**Emitters**:
- `src/engine/ConsciousnessEngine.js:346`

**Listeners**:
- (none)

## PREWARM_GENESIS_BLUEPRINT

**Emitters**:
- `src/theater/TheaterDirector.js:652`

**Listeners**:
- (none)

## QUALITY_CHANGE

**Emitters**:
- `src/state/atoms/qualityAtom.js:198`
- `src/state/commands/StateCommands.js:188`

**Listeners**:
- (none)

## RENDERER_TUNE

**Emitters**:
- `src/theater/TheaterDirector.js:667`

**Listeners**:
- (none)

## SCREEN_FILL

**Emitters**:
- `src/theater/controllers/OpeningSequenceController.js:363`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:143`

## STAGE_CHANGE

**Emitters**:
- `src/state/commands/StateCommands.js:151`
- `src/theater/controllers/OpeningSequenceController.js:637`

**Listeners**:
- `src/state/atoms/qualityAtom.js:155`
- `src/theater/TheaterDirector.js:151`
- `src/theater/UnifiedNavigationAPI.js:192`

## START_NARRATIVE

**Emitters**:
- `src/theater/TheaterDirector.js:300`
- `src/theater/controllers/OpeningSequenceController.js:651`

**Listeners**:
- `src/components/consciousness/ConsciousnessTheater.jsx:194`

## TERMINAL_TYPE

**Emitters**:
- `src/theater/controllers/OpeningSequenceController.js:349`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:102`



---
## 3) Source Evidence

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

- `src/components/webgl/WebGLBackground.jsx:607`

```text
605:   // Passive fallbacks (OK to keep)
606:   useEffect(() => {
607:     const off = BeatBus?.on?.(EVENTS.STAGE_CHANGE, (p) => {
608:       const st = p?.stage ?? p?.to ?? p?.name ?? String(p);
609:       setStageName(st);
```

- `src/components/webgl/WebGLBackground.jsx:633`

```text
631:   useEffect(() => {
632:     let morphProbeTimer = null;
633:     const off = BeatBus?.on?.(EVENTS.STAGE_CHANGE, () => {
634:       if (morphProbeTimer) {
635:         clearInterval(morphProbeTimer);
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

- `src/engine/ConsciousnessEngine.js:225`

```text
223:     subscribe('ENGINE_VIEWPORT_HINT', this._onViewportHint.bind(this));
224:     subscribe('ENABLE_SCROLL', this._onEnableScroll.bind(this));
225:     subscribe('STAGE_CHANGE', this._onStageChange.bind(this));
226:     subscribe('QUALITY_CHANGE', this._onQualityChange.bind(this));
227:     subscribe('PREWARM_GENESIS_BLUEPRINT', this._onPrewarmGenesis.bind(this));
```

- `src/engine/ConsciousnessEngine.js:315`

```text
313:     this.currentStage = stage;
314:     if (skipBlueprint) {
315:       this._log('stage_change', { stage, skippedBlueprint: true });
316:       if (preserveEmergence && stage === 'genesis') {
317:         this._log('stage_preserve_emergence', { preserved: !!this._lastEmergenceTargets });
```

- `src/engine/ConsciousnessEngine.js:322`

```text
320:     }
321:     this.buildAndEmitBlueprint(stage, this.currentQuality);
322:     this._log('stage_change', { stage });
323:   }
324: 
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

- `src/state/commands/StateCommands.js:125`

```text
123:     let lastQualityFromBus = qualityAtom.getState?.()?.currentQualityTier ?? null;
124: 
125:     const stageBusSub = BeatBus.on?.(EVENTS.STAGE_CHANGE, (payload = {}) => {
126:       const stage = payload.to ?? payload.stage ?? payload.name ?? null;
127:       if (stage) {
```

- `src/state/commands/StateCommands.js:151`

```text
149:         }
150:         // Emit stage change events
151:         BeatBus.emit(EVENTS.STAGE_CHANGE, { 
152:           from: prevStage, 
153:           to: next, 
```

- `src/state/commands/StateCommands.js:237`

```text
235:       if (!gateActive || gateTarget === targetStage) {
236:         if (currentStage !== targetStage) {
237:           stageAtom.jumpToStage(targetStage);
238:         }
239:       }
```

- `src/theater/ScrollOrchestrator.js:3`

```text
1: // src/theater/ScrollOrchestrator.js
2: // BeatGlyph v3.3 — ScrollOrchestrator
3: // Purpose: map window scroll -> stage-local progress; publish MORPH_PROGRESS and STAGE_CHANGE.
4: // Kinetics: speedMultiplier=2.0, smoothing=0.15, overshoot=0.05 (v3.3 canon)
5: 
```

- `src/theater/ScrollOrchestrator.js:338`

```text
336:           timestamp: performance.now(),
337:         });
338:         BeatBus.emit?.(EVENTS.STAGE_CHANGE, { 
339:           stage: stageName, 
340:           index: stageIdx,
```

- `src/theater/TheaterDirector.js:151`

```text
149: 
150:     if (typeof BeatBus?.on === 'function') {
151:       this._stageChangeUnsubscribe = BeatBus.on(EVENTS.STAGE_CHANGE, this._handleStageChangeBound);
152:     }
153:   }
```

- `src/theater/TheaterDirector.js:900`

```text
898:   version: '1.0.1',
899:   events: {
900:     STAGE_CHANGE: {
901:       required: ['from', 'to'],
902:       notes: 'Canonical shape. Old `{stage}` payload is deprecated.',
```

- `src/theater/TheaterDirector.js:920`

```text
918:   },
919:   deprecations: {
920:     STAGE_CHANGE: { stage: 'deprecated' },
921:     QUALITY_CHANGE: { quality: 'deprecated' },
922:   },
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

- `src/theater/bus/index.js:208`

```text
206:       this._contracts = {
207:         events: {
208:           STAGE_CHANGE: { required: ['from', 'to'] },
209:           QUALITY_CHANGE: { required: ['tier'] },
210:           BLUEPRINT_READY: { required: ['stage', 'quality', 'blueprint'] }
```

- `src/theater/bus/index.js:274`

```text
272:     
273:     // Fallback canonicalization
274:     if (evt==='STAGE_CHANGE'){
275:       if (p.stage && !p.to) p.to = p.stage;
276:       if (!p.from) p.from = this._last.stage || 'unknown';
```

- `src/theater/bus/index.js:364`

```text
362: 
363:     // maintain last state hints for better "from"
364:     if (evt==='STAGE_CHANGE' && canonPayloadWithBase?.to) this._last.stage = canonPayloadWithBase.to;
365:     if (evt==='QUALITY_CHANGE' && canonPayloadWithBase?.tier) this._last.quality = canonPayloadWithBase.tier;
366: 
```

- `src/theater/bus/schemas.js:15`

```text
13: 
14: const EVENT_SCHEMAS = new Map([
15:   ['STAGE_CHANGE', {
16:     required: { from: 'string', to: 'string' },
17:     extended: {
```

- `src/theater/controllers/OpeningSequenceController.js:637`

```text
635:       console.log('🧬 Phase: Genesis stage handoff');
636: 
637:       BeatBus.emit(EVENTS.STAGE_CHANGE, {
638:         from: previousStage,
639:         to: toStage,
```

- `src/theater/events-safe.js:6`

```text
4: export const EVENTS_CORE = {
5:   // Critical opening sequence events
6:   STAGE_CHANGE: 'STAGE_CHANGE',
7:   QUALITY_CHANGE: 'QUALITY_CHANGE',
8:   BLUEPRINT_READY: 'BLUEPRINT_READY',
```

- `src/theater/events.js:33`

```text
31:   NARRATION_STOPPED: 'NARRATION_STOPPED',
32:   NARRATION_CLEANUP: 'NARRATION_CLEANUP',
33:   STAGE_CHANGE: 'STAGE_CHANGE',                  // { from, to } (canonical)
34:   START_CLIMAX: 'START_CLIMAX',                  // Trigger climax sequence
35: 
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

- `src/components/webgl/WebGLBackground.jsx:576`

```text
574:   }, [emitViewportHint]);
575: 
576:   // Fallback morph sink (outside emergence directives)
577:   const __applyMorph = (v) => {
578:     const mat = materialRef.current;
```

- `src/components/webgl/WebGLBackground.jsx:622`

```text
620:   }, []);
621: 
622:   // Emergence flag (no local tween; engine drives via directives)
623:   useEffect(() => {
624:     const off = BeatBus?.on?.(EVENTS.PARTICLES_START_EMERGING, () => {
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

- `src/components/webgl/managers/BlueprintBinder.js:121`

```text
119:     if (lastBlueprintIdRef) lastBlueprintIdRef.current = id;
120: 
121:     const isEmergence = mode === 'emergence' || raw?.mode === 'emergence';
122:     const isOpeningChaos = mode === 'opening_chaos' || raw?.mode === 'opening_chaos';
123:     const shouldFastForward = isEmergence && (fastForwardRequested || skipMorph);
```

- `src/components/webgl/managers/BlueprintBinder.js:358`

```text
356:     if (mat) {
357:       applyRendererFitsToViewport?.(geo, viewportHintRef?.current || viewport);
358:       logBind?.(isEmergence ? 'emergence' : 'stage', {
359:         stage: raw.stageName || st || 'genesis',
360:         mode: mode || raw?.mode || (isEmergence ? 'emergence' : 'full'),
```

- `src/components/webgl/managers/BlueprintBinder.js:360`

```text
358:       logBind?.(isEmergence ? 'emergence' : 'stage', {
359:         stage: raw.stageName || st || 'genesis',
360:         mode: mode || raw?.mode || (isEmergence ? 'emergence' : 'full'),
361:         cached: !!cached,
362:       });
```

- `src/components/webgl/managers/BlueprintBinder.js:440`

```text
438:     if (isEmergence) {
439:       console.log(
440:         '✅ Renderer: BR(emergence) bound',
441:         `count=${raw.particleCount || raw.activeCount}`,
442:         `quality=${quality}`,
```

- `src/components/webgl/managers/BlueprintBinder.js:476`

```text
474:         const source = fastForwardRequested ? 'renderer-fastforward' : 'renderer-skip-morph';
475:         if (finalizeEmergence(source)) {
476:           console.log('⚡ Renderer: Emergence fast-forward applied', {
477:             source,
478:             cacheKey,
```

- `src/components/webgl/managers/BlueprintBinder.js:680`

```text
678: 
679:     const isEmergenceMode =
680:       payload?.mode === 'emergence' || payload?.blueprint?.mode === 'emergence';
681:     const matCurrent = materialRef?.current;
682:     const currentUniforms = matCurrent?.uniforms;
```

- `src/components/webgl/managers/BlueprintBinder.js:689`

```text
687:       const currentPhase = director?.getCurrentPhase?.() ?? director?.phase ?? null;
688:       const isOpeningPhase =
689:         currentStage === 'genesis' && currentPhase !== 'emergence';
690:       const startMorph = 0.0;
691: 
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

- `src/engine/ConsciousnessEngine.js:45`

```text
43:   'JetBrains Mono': () => '/fonts/CourierPrime_Regular.typeface.json',
44:   Inter: () => import('three/examples/fonts/helvetiker_regular.typeface.json?url').then((m) => m.default),
45:   'Archivo Black': () => '/fonts/helvetiker_bold.typeface.json',
46:   Montserrat: () => '/fonts/helvetiker_bold.typeface.json',
47:   'Playfair Display': () => import('three/examples/fonts/helvetiker_regular.typeface.json?url').then((m) => m.default),
```

- `src/engine/ConsciousnessEngine.js:118`

```text
116:     this._viewportHint = { width: 120, height: 90, aspect: 4 / 3 };
117: 
118:     // Emergence memory - store only targets, not full blueprint
119:     this._lastEmergenceTargets = null;
120:     this._emergenceRaf = null;
```

- `src/engine/ConsciousnessEngine.js:336`

```text
334: 
335:   _onPrewarmGenesis() {
336:     // Clear stale emergence targets so prewarm rebuilds with current VC tuning
337:     this._lastEmergenceTargets = null;
338:     console.log('🧠 Engine: Prewarming genesis blueprint');
```

- `src/engine/ConsciousnessEngine.js:395`

```text
393:       this._rendererFencepostSeen = false;
394: 
395:       // Build the emergence blueprint
396:       const blueprint = await this.buildEmergenceBlueprint(payload);
397:       
```

- `src/engine/ConsciousnessEngine.js:400`

```text
398:       // Validate before proceeding
399:       if (!this._validateBlueprint(blueprint)) {
400:         console.error('🧠 Engine: Invalid emergence blueprint, not emitting');
401:         this._log('emergence_validation_failed');
402:         this._emergenceActive = false;
```

- `src/engine/ConsciousnessEngine.js:410`

```text
408:       this._lastEmergenceTargets = blueprint.text3DPositions;
409: 
410:       // Emit emergence blueprint with mode flag (canonical event)
411:       const variantMode = openingChaosMode ? 'opening_chaos' : 'emergence';
412:       const emissionMode = 'emergence';
```

- `src/engine/ConsciousnessEngine.js:411`

```text
409: 
410:       // Emit emergence blueprint with mode flag (canonical event)
411:       const variantMode = openingChaosMode ? 'opening_chaos' : 'emergence';
412:       const emissionMode = 'emergence';
413:       emitBlueprintReady(BeatBus, EVENTS, blueprint, {
```

- `src/engine/ConsciousnessEngine.js:412`

```text
410:       // Emit emergence blueprint with mode flag (canonical event)
411:       const variantMode = openingChaosMode ? 'opening_chaos' : 'emergence';
412:       const emissionMode = 'emergence';
413:       emitBlueprintReady(BeatBus, EVENTS, blueprint, {
414:         stage: 'genesis',
```

- `src/engine/ConsciousnessEngine.js:426`

```text
424:       
425:       if (openingChaosMode) {
426:         console.log('🧠 Engine: Opening chaos blueprint emitted', { count: blueprint.particleCount, mode: variantMode });
427:         this._openingPreboundBlueprint = blueprint;
428:         this._log('emergence_built', { count: blueprint.particleCount, mode: variantMode });
```

- `src/engine/ConsciousnessEngine.js:430`

```text
428:         this._log('emergence_built', { count: blueprint.particleCount, mode: variantMode });
429:       } else {
430:         console.log('🧠 Engine: Emergence blueprint emitted', { count: blueprint.particleCount, mode: emissionMode });
431:         this._openingPreboundBlueprint = null;
432:         this._log('emergence_built', { count: blueprint.particleCount, mode: emissionMode });
```

- `src/engine/ConsciousnessEngine.js:435`

```text
433:       }
434: 
435:       // Drive implosion → settle via directives; renderer remains passive
436:       const shouldRunTimeline = !openingChaosMode && !payload.skipMorphAnimation;
437:       if (shouldRunTimeline && !this._startEmergenceTimeline(blueprint)) {
```

- `src/engine/ConsciousnessEngine.js:453`

```text
451: 
452:   _startEmergenceTimeline(bp) {
453:     console.log('🌀 [Engine] Starting emergence timeline, delegating to MorphController');
454:     if (!this.#morphController) {
455:       console.error('[ConsciousnessEngine] MorphController not initialized');
```

- `src/engine/ConsciousnessEngine.js:484`

```text
482: 
483:     if (blueprint.particleCount > 0) {
484:       const rnd = createSeededRandom(`emergence-${mode || 'default'}-${quality || 'HIGH'}`);
485:       for (let i = 0; i < blueprint.particleCount; i++) {
486:         const j = i * 3;
```

- `src/engine/ConsciousnessEngine.js:565`

```text
563: 
564:   /**
565:    * Build + emit the Emergence blueprint for the opening sequence.
566:    */
567:   async buildEmergenceBlueprint(options = {}) {
```

- `src/engine/ConsciousnessEngine.js:569`

```text
567:   async buildEmergenceBlueprint(options = {}) {
568:     const {
569:       mode: requestedMode = 'emergence',
570:       source = 'viewportSpread',
571:       target = 'constellation',
```

- `src/engine/ConsciousnessEngine.js:616`

```text
614:         usedFallback = this._lastText3DFallbackUsed;
615:         if (usedFallback) {
616:           console.warn('⚠️ Emergence used text3D FALLBACK (band). FontReady:', this._fontReady);
617:         }
618:       } else {
```

- `src/engine/ConsciousnessEngine.js:687`

```text
685: 
686:     const variantMode = requestedMode;
687:     const emissionMode = 'emergence';
688: 
689:     blueprint.metadata = {
```

- `src/engine/ConsciousnessEngine.js:702`

```text
700:       targetState: targetState || null,
701:       note: usedFallback
702:         ? 'Emergence used fallback band (font not ready); cache will be cleared on font load.'
703:         : 'Emergence endpoints separated: random atmospheric → 3D text target',
704:     };
```

- `src/engine/ConsciousnessEngine.js:703`

```text
701:       note: usedFallback
702:         ? 'Emergence used fallback band (font not ready); cache will be cleared on font load.'
703:         : 'Emergence endpoints separated: random atmospheric → 3D text target',
704:     };
705: 
```

- `src/engine/ConsciousnessEngine.js:733`

```text
731: 
732:     if (this._emergenceActive && stage !== 'genesis') {
733:       console.warn('🧠 Engine: rebuild blocked during emergence timeline', { stage, quality });
734:       this._log('rebuild_blocked_emergence', { stage, quality });
735:       return;
```

- `src/engine/ConsciousnessEngine.js:741`

```text
739:     let blueprint = this.blueprintCache.get(cacheKey);
740: 
741:     // Post-emergence genesis: optionally preserve settled emergence
742:     if (stage === 'genesis' && this._lastEmergenceTargets) {
743:       if (this._lastText3DFallbackUsed) {
```

- `src/engine/ConsciousnessEngine.js:744`

```text
742:     if (stage === 'genesis' && this._lastEmergenceTargets) {
743:       if (this._lastText3DFallbackUsed) {
744:         console.warn('🧠 Engine: Emergence fallback detected; skipping preserve');
745:         this._lastEmergenceTargets = null;
746:         this._emergenceDone = false;
```

- `src/engine/ConsciousnessEngine.js:749`

```text
747:         this._rendererFencepostSeen = false;
748:       } else if (!this._emergenceDone) {
749:         console.warn('🧠 Engine: Emergence incomplete; rebuilding genesis cleanly');
750:         this._lastEmergenceTargets = null;
751:         this._emergenceDone = false;
```

- `src/engine/ConsciousnessEngine.js:759`

```text
757:         this._rendererFencepostSeen = false;
758:       } else {
759:         console.log('🧠 Engine: Building post-emergence genesis (preserving emergence result)');
760: 
761:         const emergenceCount = Math.max(0, Math.floor(this._lastEmergenceTargets.length / 3));
```

- `src/engine/ConsciousnessEngine.js:803`

```text
801:               stage,
802:               quality,
803:               mode: 'post-emergence-guarded',
804:               cacheKey,
805:               preservedEmergence: true,
```

- `src/engine/ConsciousnessEngine.js:808`

```text
806:             });
807:             this._preloadNextStage(stage, quality);
808:             this._log('blueprint_emitted', { stage, quality, cacheKey, mode: 'post-emergence-guarded' });
809:             this._rendererFencepostSeen = false;
810:             return;
```

- `src/engine/ConsciousnessEngine.js:1001`

```text
999:           console.log(`✅ 3D font loaded from ${usedUrl}; cleared text3D cache (was ${oldSize} entries)`);
1000:           try {
1001:             if (this._lastText3DFallbackUsed && this._lastBlueprint?.metadata?.mode === 'emergence') {
1002:               console.log('🔁 Rebuilding emergence with real text3D now that font is ready…');
1003:               this.buildEmergenceBlueprint({ mode: 'emergence' });
```

- `src/engine/ConsciousnessEngine.js:1002`

```text
1000:           try {
1001:             if (this._lastText3DFallbackUsed && this._lastBlueprint?.metadata?.mode === 'emergence') {
1002:               console.log('🔁 Rebuilding emergence with real text3D now that font is ready…');
1003:               this.buildEmergenceBlueprint({ mode: 'emergence' });
1004:             }
```

- `src/engine/ConsciousnessEngine.js:1003`

```text
1001:             if (this._lastText3DFallbackUsed && this._lastBlueprint?.metadata?.mode === 'emergence') {
1002:               console.log('🔁 Rebuilding emergence with real text3D now that font is ready…');
1003:               this.buildEmergenceBlueprint({ mode: 'emergence' });
1004:             }
1005:           } catch {}
```

- `src/engine/modules/MorphController.js:9`

```text
7: const DEFAULT_PHASE_DURATIONS = Object.freeze({
8:   implosion: 1100,
9:   coalesce: 250,
10:   settle: 900,
11: });
```

- `src/engine/modules/MorphController.js:10`

```text
8:   implosion: 1100,
9:   coalesce: 250,
10:   settle: 900,
11: });
12: 
```

- `src/engine/modules/MorphController.js:49`

```text
47: 
48:   /**
49:    * Begin the emergence timeline (implosion → coalesce → settle).
50:    * Mirrors the legacy behaviour from ConsciousnessEngine._startEmergenceTimeline.
51:    * @returns {boolean} true when the timeline starts, false otherwise.
```

- `src/engine/modules/MorphController.js:78`

```text
76:     const settleDefault = (() => {
77:       const raw = Number(VC?.SETTLE_MS);
78:       return Number.isFinite(raw) && raw >= 0 ? raw : this.#phaseDurations.settle;
79:     })();
80: 
```

- `src/engine/modules/MorphController.js:97`

```text
95:     this.#midValue = this.#fastForward ? clamp(Math.min(midDefault, 0.35), 0.05, 0.5) : midDefault;
96: 
97:     console.log('🎨 [EMERGENCE TIMELINE]', {
98:       fastForward: this.#fastForward,
99:       midDefault,
```

- `src/engine/modules/MorphController.js:106`

```text
104:     });
105:     if (implMs > 6000 || settleMs > 6000) {
106:       console.warn('[Emergence] unusually long timings detected', { implMs, settleMs, mid: this.#midValue });
107:     }
108: 
```

- `src/engine/modules/MorphController.js:123`

```text
121: 
122:     this.#emitMorphProgress(0, this.#midValue);
123:     trace('[MorphController] Emergence timeline started', { count });
124: 
125:     this.#rafId = scheduleFrame(() => this.#runFrame(implMs, settleMs));
```

- `src/engine/modules/MorphController.js:131`

```text
129: 
130:   /**
131:    * Cancel the current emergence timeline (if any).
132:    */
133:   stopEmergenceTimeline({ markDone = false } = {}) {
```

- `src/engine/modules/MorphController.js:155`

```text
153: 
154:   /**
155:    * Returns whether an emergence timeline is currently active.
156:    */
157:   isActive() {
```

- `src/engine/modules/MorphController.js:162`

```text
160: 
161:   /**
162:    * Returns the current emergence phase (`implosion`, `coalesce`, `settle`, or null).
163:    */
164:   getCurrentPhase() {
```

- `src/engine/modules/MorphController.js:237`

```text
235:       engine._emergenceDone = true;
236:       this.#phase = 'complete';
237:       trace('[MorphController] Emergence timeline complete');
238:       return;
239:     }
```

- `src/engine/modules/MorphController.js:246`

```text
244:       this.#phaseDuration = implMs;
245:     } else if (settlePhaseRaw <= 0) {
246:       this.#phase = 'coalesce';
247:       this.#phaseDuration = this.#phaseDurations.coalesce;
248:     } else {
```

- `src/engine/modules/MorphController.js:247`

```text
245:     } else if (settlePhaseRaw <= 0) {
246:       this.#phase = 'coalesce';
247:       this.#phaseDuration = this.#phaseDurations.coalesce;
248:     } else {
249:       this.#phase = 'settle';
```

- `src/engine/modules/MorphController.js:249`

```text
247:       this.#phaseDuration = this.#phaseDurations.coalesce;
248:     } else {
249:       this.#phase = 'settle';
250:       this.#phaseDuration = settleMs;
251:     }
```

- `src/engine/utils/blueprintUtils.js:139`

```text
137: 
138:   const tiers = new Uint8Array(count);
139:   let cursor = 0;
140:   for (let tier = 0; tier < counts.length; tier++) {
141:     const n = counts[tier];
```

- `src/engine/utils/blueprintUtils.js:142`

```text
140:   for (let tier = 0; tier < counts.length; tier++) {
141:     const n = counts[tier];
142:     for (let i = 0; i < n; i += 1) tiers[cursor++] = tier;
143:   }
144: 
```

- `src/engine/utils/blueprintUtils.js:432`

```text
430: 
431: /**
432:  * Generate viewport scatter used by diagnostics and emergence fallbacks.
433:  *
434:  * @param {number} N
```

- `src/engine/utils/blueprintUtils.js:479`

```text
477: 
478: /**
479:  * Generate atmospheric scatter used by emergence blueprints.
480:  *
481:  * @param {number} count
```

- `src/state/commands/StateCommands.js:159`

```text
157:         
158:         // REMOVED: BUILD_EMERGENCE_BLUEPRINT emission
159:         // This was causing emergence to build on every stage change
160:         // Emergence should only be triggered by TheaterDirector during opening
161:         
```

- `src/state/commands/StateCommands.js:160`

```text
158:         // REMOVED: BUILD_EMERGENCE_BLUEPRINT emission
159:         // This was causing emergence to build on every stage change
160:         // Emergence should only be triggered by TheaterDirector during opening
161:         
162:         prevStage = next;
```

- `src/state/commands/StateCommands.js:245`

```text
243:   }
244: 
245:   // Programmatic emergence trigger (only for opening sequence)
246:   triggerEmergence(payload = {}) {
247:     if (!this.canEmit('BUILD_EMERGENCE_BLUEPRINT')) {
```

- `src/state/commands/StateCommands.js:248`

```text
246:   triggerEmergence(payload = {}) {
247:     if (!this.canEmit('BUILD_EMERGENCE_BLUEPRINT')) {
248:       console.error('[StateCommands] Cannot trigger emergence - contract violation');
249:       return false;
250:     }
```

- `src/state/commands/StateCommands.js:254`

```text
252:     this.recordEmission('BUILD_EMERGENCE_BLUEPRINT');
253:     BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {
254:       mode: 'emergence',
255:       source: 'viewportSpread',
256:       target: 'constellation',
```

- `src/theater/ScrollOrchestrator.js:303`

```text
301:       const local = clamp01((easedPct - start) / Math.max(1, end - start));
302: 
303:       // v3.5 adjustment: keep genesis fully formed (no post-emergence un-morph)
304:       if (stageIdx === 0) {
305:         this.morphTarget = 1;
```

- `src/theater/TheaterDirector.js:112`

```text
110:       console.log('📋 [OPENING TIMELINE]', {
111:         hasTimeline: !!openingProbe?.timeline,
112:         chaos: openingProbe?.timeline?.chaos,
113:         coalesce: openingProbe?.timeline?.coalesce,
114:         settle: openingProbe?.timeline?.settle,
```

- `src/theater/TheaterDirector.js:113`

```text
111:         hasTimeline: !!openingProbe?.timeline,
112:         chaos: openingProbe?.timeline?.chaos,
113:         coalesce: openingProbe?.timeline?.coalesce,
114:         settle: openingProbe?.timeline?.settle,
115:         hasChaosConfig: !!openingProbe?.timeline?.chaos,
```

- `src/theater/TheaterDirector.js:114`

```text
112:         chaos: openingProbe?.timeline?.chaos,
113:         coalesce: openingProbe?.timeline?.coalesce,
114:         settle: openingProbe?.timeline?.settle,
115:         hasChaosConfig: !!openingProbe?.timeline?.chaos,
116:       });
```

- `src/theater/TheaterDirector.js:115`

```text
113:         coalesce: openingProbe?.timeline?.coalesce,
114:         settle: openingProbe?.timeline?.settle,
115:         hasChaosConfig: !!openingProbe?.timeline?.chaos,
116:       });
117:     } catch (timelineError) {
```

- `src/theater/TheaterDirector.js:481`

```text
479: 
480:     const segments = [
481:       `black ${snapshotTimeline.blackout?.durationMs ?? 0}ms`,
482:       `cursor blink x${snapshotTimeline.cursor?.blinkCount ?? 0} @ ${snapshotTimeline.cursor?.intervalMs ?? 0}ms`,
483:       `typing ~${snapshotTypingDuration}ms`,
```

- `src/theater/TheaterDirector.js:482`

```text
480:     const segments = [
481:       `black ${snapshotTimeline.blackout?.durationMs ?? 0}ms`,
482:       `cursor blink x${snapshotTimeline.cursor?.blinkCount ?? 0} @ ${snapshotTimeline.cursor?.intervalMs ?? 0}ms`,
483:       `typing ~${snapshotTypingDuration}ms`,
484:       `fill ${snapshotTimeline.fill?.durationMs ?? 0}ms`,
```

- `src/theater/TheaterDirector.js:485`

```text
483:       `typing ~${snapshotTypingDuration}ms`,
484:       `fill ${snapshotTimeline.fill?.durationMs ?? 0}ms`,
485:       `emergence ${openingSnapshot?.emergence?.durationMs ?? 0}ms`,
486:     ];
487: 
```

- `src/theater/TheaterDirector.js:630`

```text
628:     // Warn about early cancellation in development
629:     if (import.meta?.env?.DEV) {
630:       if (this.phase === 'black' || this.phase === 'cursor' || this.phase === 'terminal') {
631:         console.warn('🎬 Director: WARNING - Cancelling during early phase:', this.phase);
632:         console.warn('   This may be caused by HMR or effect cleanup');
```

- `src/theater/TheaterDirector.js:911`

```text
909:       required: ['stage', 'quality', 'blueprint'],
910:       optional: ['cached', 'mode'],
911:       notes: 'Renderer consumes stage/quality/blueprint; mode=emergence for special handling.',
912:     },
913:     BUILD_EMERGENCE_BLUEPRINT: {
```

- `src/theater/TheaterDirector.js:916`

```text
914:       required: ['mode', 'source', 'target', 'count'],
915:       optional: ['tierRatios', 'viewportHint'],
916:       notes: 'Corrected contract for viewport spread → constellation emergence.',
917:     },
918:   },
```

- `src/theater/controllers/OpeningSequenceController.js:5`

```text
3:  *
4:  * Manages the complete opening timeline:
5:  * Black → Cursor → Terminal → Fill → Chaos → Coalesce → Settle → Emergence
6:  *
7:  * Extracted from TheaterDirector for code splitting.
```

- `src/theater/controllers/OpeningSequenceController.js:30`

```text
28: const DEFAULT_OPENING_TIMELINE = {
29:   blackout: { durationMs: 2000 },
30:   cursor: { blinkCount: 2, intervalMs: 500, leadInMs: 500, settleMs: 1000 },
31:   typing: { lines: DEFAULT_TYPING_LINES, typeSpeed: 50, lineDelay: 500, completionDelayMs: 800 },
32:   fill: { text: null, scrollSpeed: 100, durationMs: 2000 },
```

- `src/theater/controllers/OpeningSequenceController.js:33`

```text
31:   typing: { lines: DEFAULT_TYPING_LINES, typeSpeed: 50, lineDelay: 500, completionDelayMs: 800 },
32:   fill: { text: null, scrollSpeed: 100, durationMs: 2000 },
33:   chaos: { enabled: true, durationMs: 2000, rendererSpin: { z: 0.5, y: 0.2 } },
34:   coalesce: { enabled: true, durationMs: 2000, morphTo: 0.6 },
35:   settle: { enabled: true, durationMs: 1500, morphTo: 1.0 },
```

- `src/theater/controllers/OpeningSequenceController.js:34`

```text
32:   fill: { text: null, scrollSpeed: 100, durationMs: 2000 },
33:   chaos: { enabled: true, durationMs: 2000, rendererSpin: { z: 0.5, y: 0.2 } },
34:   coalesce: { enabled: true, durationMs: 2000, morphTo: 0.6 },
35:   settle: { enabled: true, durationMs: 1500, morphTo: 1.0 },
36:   emergence: {
```

- `src/theater/controllers/OpeningSequenceController.js:35`

```text
33:   chaos: { enabled: true, durationMs: 2000, rendererSpin: { z: 0.5, y: 0.2 } },
34:   coalesce: { enabled: true, durationMs: 2000, morphTo: 0.6 },
35:   settle: { enabled: true, durationMs: 1500, morphTo: 1.0 },
36:   emergence: {
37:     durationMs: 2000,
```

- `src/theater/controllers/OpeningSequenceController.js:36`

```text
34:   coalesce: { enabled: true, durationMs: 2000, morphTo: 0.6 },
35:   settle: { enabled: true, durationMs: 1500, morphTo: 1.0 },
36:   emergence: {
37:     durationMs: 2000,
38:     waitForFencepost: true,
```

- `src/theater/controllers/OpeningSequenceController.js:49`

```text
47: const DEFAULT_OPENING_EMERGENCE = {
48:   target: 'constellation',
49:   mode: 'emergence',
50:   source: 'viewportSpread',
51: };
```

- `src/theater/controllers/OpeningSequenceController.js:87`

```text
85:         ...(stageTimeline.blackout ?? {}),
86:       },
87:       cursor: {
88:         ...DEFAULT_OPENING_TIMELINE.cursor,
89:         ...(openingTimeline.cursor ?? {}),
```

- `src/theater/controllers/OpeningSequenceController.js:88`

```text
86:       },
87:       cursor: {
88:         ...DEFAULT_OPENING_TIMELINE.cursor,
89:         ...(openingTimeline.cursor ?? {}),
90:         ...(stageTimeline.cursor ?? {}),
```

- `src/theater/controllers/OpeningSequenceController.js:89`

```text
87:       cursor: {
88:         ...DEFAULT_OPENING_TIMELINE.cursor,
89:         ...(openingTimeline.cursor ?? {}),
90:         ...(stageTimeline.cursor ?? {}),
91:       },
```

- `src/theater/controllers/OpeningSequenceController.js:90`

```text
88:         ...DEFAULT_OPENING_TIMELINE.cursor,
89:         ...(openingTimeline.cursor ?? {}),
90:         ...(stageTimeline.cursor ?? {}),
91:       },
92:       typing: {
```

- `src/theater/controllers/OpeningSequenceController.js:102`

```text
100:         ...(stageTimeline.fill ?? {}),
101:       },
102:       chaos: {
103:         ...DEFAULT_OPENING_TIMELINE.chaos,
104:         ...(openingTimeline.chaos ?? {}),
```

- `src/theater/controllers/OpeningSequenceController.js:103`

```text
101:       },
102:       chaos: {
103:         ...DEFAULT_OPENING_TIMELINE.chaos,
104:         ...(openingTimeline.chaos ?? {}),
105:         ...(stageTimeline.chaos ?? {}),
```

- `src/theater/controllers/OpeningSequenceController.js:104`

```text
102:       chaos: {
103:         ...DEFAULT_OPENING_TIMELINE.chaos,
104:         ...(openingTimeline.chaos ?? {}),
105:         ...(stageTimeline.chaos ?? {}),
106:       },
```

- `src/theater/controllers/OpeningSequenceController.js:105`

```text
103:         ...DEFAULT_OPENING_TIMELINE.chaos,
104:         ...(openingTimeline.chaos ?? {}),
105:         ...(stageTimeline.chaos ?? {}),
106:       },
107:       coalesce: {
```

- `src/theater/controllers/OpeningSequenceController.js:107`

```text
105:         ...(stageTimeline.chaos ?? {}),
106:       },
107:       coalesce: {
108:         ...DEFAULT_OPENING_TIMELINE.coalesce,
109:         ...(openingTimeline.coalesce ?? {}),
```

- `src/theater/controllers/OpeningSequenceController.js:108`

```text
106:       },
107:       coalesce: {
108:         ...DEFAULT_OPENING_TIMELINE.coalesce,
109:         ...(openingTimeline.coalesce ?? {}),
110:         ...(stageTimeline.coalesce ?? {}),
```

- `src/theater/controllers/OpeningSequenceController.js:109`

```text
107:       coalesce: {
108:         ...DEFAULT_OPENING_TIMELINE.coalesce,
109:         ...(openingTimeline.coalesce ?? {}),
110:         ...(stageTimeline.coalesce ?? {}),
111:       },
```

- `src/theater/controllers/OpeningSequenceController.js:110`

```text
108:         ...DEFAULT_OPENING_TIMELINE.coalesce,
109:         ...(openingTimeline.coalesce ?? {}),
110:         ...(stageTimeline.coalesce ?? {}),
111:       },
112:       settle: {
```

- `src/theater/controllers/OpeningSequenceController.js:112`

```text
110:         ...(stageTimeline.coalesce ?? {}),
111:       },
112:       settle: {
113:         ...DEFAULT_OPENING_TIMELINE.settle,
114:         ...(openingTimeline.settle ?? {}),
```

- `src/theater/controllers/OpeningSequenceController.js:113`

```text
111:       },
112:       settle: {
113:         ...DEFAULT_OPENING_TIMELINE.settle,
114:         ...(openingTimeline.settle ?? {}),
115:         ...(stageTimeline.settle ?? {}),
```

- `src/theater/controllers/OpeningSequenceController.js:114`

```text
112:       settle: {
113:         ...DEFAULT_OPENING_TIMELINE.settle,
114:         ...(openingTimeline.settle ?? {}),
115:         ...(stageTimeline.settle ?? {}),
116:       },
```

- `src/theater/controllers/OpeningSequenceController.js:115`

```text
113:         ...DEFAULT_OPENING_TIMELINE.settle,
114:         ...(openingTimeline.settle ?? {}),
115:         ...(stageTimeline.settle ?? {}),
116:       },
117:       profile: stageTimeline.profile ?? openingTimeline.profile ?? null,
```

- `src/theater/controllers/OpeningSequenceController.js:122`

```text
120:     };
121: 
122:     const emergenceTimeline = stageTimeline.emergence ?? openingTimeline.emergence ?? {};
123:     const fallbackSkipKey = 'SPACE';
124: 
```

- `src/theater/controllers/OpeningSequenceController.js:133`

```text
131:       totalDurationMs: stageTimeline.totalDurationMs ?? opening.totalDurationMs ?? null,
132:       timeline,
133:       emergence: { ...DEFAULT_OPENING_EMERGENCE, ...emergenceTimeline },
134:     };
135:   }
```

- `src/theater/controllers/OpeningSequenceController.js:194`

```text
192: 
193:     const opening = this.getOpeningConfig();
194:     const { timeline, skipKey, emergence: openingEmergence } = opening ?? {};
195: 
196:     // Phase configuration
```

- `src/theater/controllers/OpeningSequenceController.js:203`

```text
201: 
202:     const cursorConfig = {
203:       ...DEFAULT_OPENING_TIMELINE.cursor,
204:       ...(timeline?.cursor ?? {}),
205:     };
```

- `src/theater/controllers/OpeningSequenceController.js:204`

```text
202:     const cursorConfig = {
203:       ...DEFAULT_OPENING_TIMELINE.cursor,
204:       ...(timeline?.cursor ?? {}),
205:     };
206:     const cursorLeadInMs = Math.max(0, Number(cursorConfig.leadInMs ?? 0));
```

- `src/theater/controllers/OpeningSequenceController.js:210`

```text
208:     const cursorBlinkCount = Math.max(
209:       0,
210:       Number(cursorConfig.blinkCount ?? DEFAULT_OPENING_TIMELINE.cursor.blinkCount),
211:     );
212:     const cursorIntervalMs = Math.max(
```

- `src/theater/controllers/OpeningSequenceController.js:214`

```text
212:     const cursorIntervalMs = Math.max(
213:       0,
214:       Number(cursorConfig.intervalMs ?? DEFAULT_OPENING_TIMELINE.cursor.intervalMs),
215:     );
216:     const cursorHumVolume = Number.isFinite(cursorConfig.humVolume) ? cursorConfig.humVolume : 0.25;
```

- `src/theater/controllers/OpeningSequenceController.js:262`

```text
260:     }
261: 
262:     const chaosConfig = timeline?.chaos || {};
263:     const coalesceConfig = timeline?.coalesce || {};
264:     const settleConfig = timeline?.settle || {};
```

- `src/theater/controllers/OpeningSequenceController.js:263`

```text
261: 
262:     const chaosConfig = timeline?.chaos || {};
263:     const coalesceConfig = timeline?.coalesce || {};
264:     const settleConfig = timeline?.settle || {};
265: 
```

- `src/theater/controllers/OpeningSequenceController.js:264`

```text
262:     const chaosConfig = timeline?.chaos || {};
263:     const coalesceConfig = timeline?.coalesce || {};
264:     const settleConfig = timeline?.settle || {};
265: 
266:     const emergenceTimeline = {
```

- `src/theater/controllers/OpeningSequenceController.js:267`

```text
265: 
266:     const emergenceTimeline = {
267:       ...DEFAULT_OPENING_TIMELINE.emergence,
268:       ...(timeline?.emergence ?? {}),
269:     };
```

- `src/theater/controllers/OpeningSequenceController.js:268`

```text
266:     const emergenceTimeline = {
267:       ...DEFAULT_OPENING_TIMELINE.emergence,
268:       ...(timeline?.emergence ?? {}),
269:     };
270:     emergenceTimeline.durationMs = Math.max(
```

- `src/theater/controllers/OpeningSequenceController.js:272`

```text
270:     emergenceTimeline.durationMs = Math.max(
271:       0,
272:       Number(emergenceTimeline.durationMs ?? DEFAULT_OPENING_TIMELINE.emergence.durationMs),
273:     );
274:     emergenceTimeline.maxWaitMs = Math.max(
```

- `src/theater/controllers/OpeningSequenceController.js:276`

```text
274:     emergenceTimeline.maxWaitMs = Math.max(
275:       0,
276:       Number(emergenceTimeline.maxWaitMs ?? DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs),
277:     );
278:     const fencepostWaitMs = emergenceTimeline.maxWaitMs || DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs;
```

- `src/theater/controllers/OpeningSequenceController.js:278`

```text
276:       Number(emergenceTimeline.maxWaitMs ?? DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs),
277:     );
278:     const fencepostWaitMs = emergenceTimeline.maxWaitMs || DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs;
279:     const waitForFencepost = emergenceTimeline.waitForFencepost !== false;
280:     const shouldWaitForFencepost = waitForFencepost && !this.director._openingPrebound;
```

- `src/theater/controllers/OpeningSequenceController.js:283`

```text
281:     const stabilizeMs = Math.max(
282:       0,
283:       Number(emergenceTimeline.stabilizeMs ?? DEFAULT_OPENING_TIMELINE.emergence.stabilizeMs ?? 0),
284:     );
285:     const skipMorphAnimation = emergenceTimeline.skipMorphAnimation === true;
```

- `src/theater/controllers/OpeningSequenceController.js:287`

```text
285:     const skipMorphAnimation = emergenceTimeline.skipMorphAnimation === true;
286:     const skipGenesisBlueprint = emergenceTimeline.skipGenesisBlueprint !== false;
287:     const targetState = emergenceTimeline.targetState || DEFAULT_OPENING_TIMELINE.emergence.targetState;
288: 
289:     const emergenceConfig = { ...DEFAULT_OPENING_EMERGENCE, ...(openingEmergence ?? {}) };
```

- `src/theater/controllers/OpeningSequenceController.js:318`

```text
316: 
317:     try {
318:       this.director.phase = 'black';
319:       console.log(`   Phase: Black screen (${blackoutDuration}ms)`);
320:       if (blackoutDuration > 0) {
```

- `src/theater/controllers/OpeningSequenceController.js:319`

```text
317:     try {
318:       this.director.phase = 'black';
319:       console.log(`   Phase: Black screen (${blackoutDuration}ms)`);
320:       if (blackoutDuration > 0) {
321:         const waitResult = await this.director.sleep(blackoutDuration);
```

- `src/theater/controllers/OpeningSequenceController.js:325`

```text
323:       }
324:       if (skipTriggered) {
325:         console.log(`   Skip triggered before cursor phase (key: ${skipLabel})`);
326:       }
327: 
```

- `src/theater/controllers/OpeningSequenceController.js:329`

```text
327: 
328:       if (!skipTriggered) {
329:         this.director.phase = 'cursor';
330:         console.log(`   Phase: Cursor (blink x${cursorBlinkCount} @ ${cursorIntervalMs}ms)`);
331:         BeatBus.emit(EVENTS.CURSOR_SHOW);
```

- `src/theater/controllers/OpeningSequenceController.js:330`

```text
328:       if (!skipTriggered) {
329:         this.director.phase = 'cursor';
330:         console.log(`   Phase: Cursor (blink x${cursorBlinkCount} @ ${cursorIntervalMs}ms)`);
331:         BeatBus.emit(EVENTS.CURSOR_SHOW);
332:         BeatBus.emit(EVENTS.AUDIO_COMPUTER_HUM, { volume: cursorHumVolume });
```

- `src/theater/controllers/OpeningSequenceController.js:349`

```text
347:         this.director.phase = 'terminal';
348:         console.log(`   Phase: Terminal typing (~${typingDuration}ms)`);
349:         BeatBus.emit(EVENTS.TERMINAL_TYPE, typingConfig);
350:         if (typingDuration > 0) {
351:           const waitResult = await this.director.sleep(typingDuration);
```

- `src/theater/controllers/OpeningSequenceController.js:363`

```text
361:         this.director.phase = 'fill';
362:         console.log(`   Phase: Screen fill (${fillConfig.durationMs}ms)`);
363:         BeatBus.emit(EVENTS.SCREEN_FILL, { text: fillConfig.text, scrollSpeed: fillConfig.scrollSpeed });
364:         if (fillConfig.durationMs > 0) {
365:           const waitResult = await this.director.sleep(fillConfig.durationMs);
```

- `src/theater/controllers/OpeningSequenceController.js:371`

```text
369: 
370:       if (!skipTriggered && chaosConfig?.enabled !== false) {
371:         console.log('🔍 [ABOUT TO START CHAOS]', {
372:           chaosConfig,
373:           currentMorph: currentMorphValue,
```

- `src/theater/controllers/OpeningSequenceController.js:378`

```text
376:         if (!this.director._openingPrebound) {
377:           try {
378:             console.log('   Phase: Pre-chaos blueprint bind');
379:             BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {
380:               mode: 'opening_chaos',
```

- `src/theater/controllers/OpeningSequenceController.js:393`

```text
391:             this.director._openingPrebound = true;
392:           } catch (bindError) {
393:             console.warn('🎬 Director: Pre-chaos blueprint bind failed', bindError);
394:           }
395:           const bindSettleMs = Math.max(0, Number(chaosConfig?.bindLeadInMs ?? 120));
```

- `src/theater/controllers/OpeningSequenceController.js:420`

```text
418:                   const stageName = payload?.stage || blueprint?.stage || blueprint?.stageName;
419:                   const mode = payload?.mode || blueprint?.mode;
420:                   return stageName === 'genesis' && mode !== 'emergence';
421:                 },
422:               })
```

- `src/theater/controllers/OpeningSequenceController.js:427`

```text
425: 
426:           if (!readinessResult) {
427:             console.warn('⚠️ Director: Pre-chaos renderer readiness timed out');
428:           } else {
429:             console.log('✅ Blueprint bound and particles ready', {
```

- `src/theater/controllers/OpeningSequenceController.js:438`

```text
436: 
437:         const chaosDuration = Math.max(0, Number(chaosConfig.durationMs) || 0);
438:         this.director.phase = 'chaos';
439:         console.log(`   Phase: Chaos (${chaosDuration}ms)`);
440:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
```

- `src/theater/controllers/OpeningSequenceController.js:439`

```text
437:         const chaosDuration = Math.max(0, Number(chaosConfig.durationMs) || 0);
438:         this.director.phase = 'chaos';
439:         console.log(`   Phase: Chaos (${chaosDuration}ms)`);
440:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
441:           name: 'chaos',
```

- `src/theater/controllers/OpeningSequenceController.js:441`

```text
439:         console.log(`   Phase: Chaos (${chaosDuration}ms)`);
440:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
441:           name: 'chaos',
442:           duration: chaosDuration,
443:           rendererSpin: chaosConfig.rendererSpin || null,
```

- `src/theater/controllers/OpeningSequenceController.js:446`

```text
444:         });
445:         const chaosTarget = Number.isFinite(chaosConfig.morphTo) ? clamp01(chaosConfig.morphTo) : 0.0;
446:         const chaosAnimation = animateMorph(currentMorphValue, chaosTarget, chaosDuration, 'chaos');
447:         if (chaosDuration > 0) {
448:           const waitResult = await this.director.sleep(chaosDuration);
```

- `src/theater/controllers/OpeningSequenceController.js:458`

```text
456: 
457:       if (!skipTriggered && coalesceConfig?.enabled !== false) {
458:         console.log('🔍 [ABOUT TO START COALESCE]', {
459:           coalesceConfig,
460:           currentMorph: currentMorphValue,
```

- `src/theater/controllers/OpeningSequenceController.js:464`

```text
462:         });
463:         const coalesceDuration = Math.max(0, Number(coalesceConfig.durationMs) || 0);
464:         this.director.phase = 'coalesce';
465:         console.log(`   Phase: Coalesce (${coalesceDuration}ms → morph ${coalesceConfig.morphTo ?? '—'})`);
466:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
```

- `src/theater/controllers/OpeningSequenceController.js:465`

```text
463:         const coalesceDuration = Math.max(0, Number(coalesceConfig.durationMs) || 0);
464:         this.director.phase = 'coalesce';
465:         console.log(`   Phase: Coalesce (${coalesceDuration}ms → morph ${coalesceConfig.morphTo ?? '—'})`);
466:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
467:           name: 'coalesce',
```

- `src/theater/controllers/OpeningSequenceController.js:467`

```text
465:         console.log(`   Phase: Coalesce (${coalesceDuration}ms → morph ${coalesceConfig.morphTo ?? '—'})`);
466:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
467:           name: 'coalesce',
468:           duration: coalesceDuration,
469:           morphTarget: typeof coalesceConfig.morphTo === 'number' ? coalesceConfig.morphTo : null,
```

- `src/theater/controllers/OpeningSequenceController.js:475`

```text
473:         let coalesceAnimation = null;
474:         if (hasCoalesceTarget) {
475:           coalesceAnimation = animateMorph(currentMorphValue, coalesceTarget, coalesceDuration, 'coalesce');
476:         } else {
477:           emitMorphSnapshot(currentMorphValue, 'coalesce', coalesceTarget, coalesceDuration);
```

- `src/theater/controllers/OpeningSequenceController.js:477`

```text
475:           coalesceAnimation = animateMorph(currentMorphValue, coalesceTarget, coalesceDuration, 'coalesce');
476:         } else {
477:           emitMorphSnapshot(currentMorphValue, 'coalesce', coalesceTarget, coalesceDuration);
478:         }
479:         if (coalesceDuration > 0) {
```

- `src/theater/controllers/OpeningSequenceController.js:490`

```text
488: 
489:       if (!skipTriggered && settleConfig?.enabled !== false) {
490:         console.log('🔍 [ABOUT TO START SETTLE]', {
491:           settleConfig,
492:           currentMorph: currentMorphValue,
```

- `src/theater/controllers/OpeningSequenceController.js:496`

```text
494:         });
495:         const settleDuration = Math.max(0, Number(settleConfig.durationMs) || 0);
496:         this.director.phase = 'settle';
497:         console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
498:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
```

- `src/theater/controllers/OpeningSequenceController.js:497`

```text
495:         const settleDuration = Math.max(0, Number(settleConfig.durationMs) || 0);
496:         this.director.phase = 'settle';
497:         console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
498:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
499:           name: 'settle',
```

- `src/theater/controllers/OpeningSequenceController.js:499`

```text
497:         console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
498:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
499:           name: 'settle',
500:           duration: settleDuration,
501:           morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
```

- `src/theater/controllers/OpeningSequenceController.js:507`

```text
505:         let settleAnimation = null;
506:         if (hasSettleTarget) {
507:           settleAnimation = animateMorph(currentMorphValue, settleTarget, settleDuration, 'settle');
508:         } else {
509:           emitMorphSnapshot(currentMorphValue, 'settle', settleTarget, settleDuration);
```

- `src/theater/controllers/OpeningSequenceController.js:509`

```text
507:           settleAnimation = animateMorph(currentMorphValue, settleTarget, settleDuration, 'settle');
508:         } else {
509:           emitMorphSnapshot(currentMorphValue, 'settle', settleTarget, settleDuration);
510:         }
511:         if (settleDuration > 0) {
```

- `src/theater/controllers/OpeningSequenceController.js:522`

```text
520: 
521:       if (skipTriggered) {
522:         console.log(`   Opening skip engaged (${this._skipOrigin ?? 'user'}) → fast-forwarding to emergence.`);
523:         if (currentMorphValue < 1) {
524:           emitMorphSnapshot(1, 'skip-fast-forward', 1, 0);
```

- `src/theater/controllers/OpeningSequenceController.js:530`

```text
528:       }
529: 
530:       this.director.phase = 'emergence';
531:       const reusePreboundBlueprint = this.director._openingPrebound === true;
532:       console.log(
```

- `src/theater/controllers/OpeningSequenceController.js:533`

```text
531:       const reusePreboundBlueprint = this.director._openingPrebound === true;
532:       console.log(
533:         `   Phase: Particle emergence (${reusePreboundBlueprint ? 'reusing pre-bound blueprint' : 'SST governed'})`,
534:       );
535: 
```

- `src/theater/controllers/OpeningSequenceController.js:553`

```text
551:         });
552:       } else {
553:         emitMorphSnapshot(currentMorphValue, 'emergence', 1, emergenceTimeline.durationMs);
554:       }
555: 
```

- `src/theater/controllers/OpeningSequenceController.js:610`

```text
608:             const mode = payload?.mode || blueprint?.mode;
609:             const isGenesis = stage === 'genesis';
610:             const isEmergenceMode = mode === 'emergence';
611:             if (!isGenesis || isEmergenceMode) return;
612:             console.log('   Fallback: BLUEPRINT_READY (genesis full) before fencepost');
```

- `src/theater/controllers/OpeningSequenceController.js:634`

```text
632:       const toStage = 'genesis';
633:       this.director.phase = 'genesis';
634:       const previousStage = this.director.currentStage ?? 'emergence';
635:       console.log('🧬 Phase: Genesis stage handoff');
636: 
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
10: 
```

- `src/theater/events.js:9`

```text
7:   CURSOR_BLINK: 'CURSOR_BLINK',
8:   TERMINAL_TYPE: 'TERMINAL_TYPE',                // { lines[], typeSpeed, lineDelay }
9:   SCREEN_FILL: 'SCREEN_FILL',                    // { text, scrollSpeed }
10: 
11:   // Renderer/Theater gates
```

- `src/theater/events.js:14`

```text
12:   ENGINE_VIEWPORT_HINT: 'ENGINE_VIEWPORT_HINT',  // { width, height, aspect }
13: 
14:   // Emergence / blueprint handoff
15:   BUILD_EMERGENCE_BLUEPRINT: 'BUILD_EMERGENCE_BLUEPRINT',
16:   BLUEPRINT_READY: 'BLUEPRINT_READY',            // { blueprint, stage?, quality?, mode? }
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

- `src/theater/events.js:30`

```text
28:   // Stage / narrative control
29:   START_NARRATIVE: 'START_NARRATIVE',            // { id?, stage? }
30:   NARRATIVE_LINE: 'NARRATIVE_LINE',
31:   NARRATION_STOPPED: 'NARRATION_STOPPED',
32:   NARRATION_CLEANUP: 'NARRATION_CLEANUP',
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
5: import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
```

- `src/components/webgl/WebGLBackground.jsx:228`

```text
226:     if (!payload) return;
227:     trace('WBG:FENCEPOST', payload);
228:     BeatBus.emit(EVENTS.PARTICLES_EMERGED, payload);
229:     if (import.meta?.env?.DEV) {
230:       console.log('✅ [RENDERER] PARTICLES_EMERGED emitted', payload);
```

- `src/components/webgl/WebGLBackground.jsx:230`

```text
228:     BeatBus.emit(EVENTS.PARTICLES_EMERGED, payload);
229:     if (import.meta?.env?.DEV) {
230:       console.log('✅ [RENDERER] PARTICLES_EMERGED emitted', payload);
231:     }
232: 
```

- `src/components/webgl/WebGLBackground.jsx:315`

```text
313:       const uniforms = mat?.uniforms;
314: 
315:       if (uniforms?.uMorphProgress) {
316:         uniforms.uMorphProgress.value = 1.0;
317:         if (uniforms.uStageProgress) {
```

- `src/components/webgl/WebGLBackground.jsx:316`

```text
314: 
315:       if (uniforms?.uMorphProgress) {
316:         uniforms.uMorphProgress.value = 1.0;
317:         if (uniforms.uStageProgress) {
318:           uniforms.uStageProgress.value = 1.0;
```

- `src/components/webgl/WebGLBackground.jsx:380`

```text
378:           attrs: geo ? Object.keys(geo.attributes || {}) : [],
379:           drawCount: geo?.drawRange?.count ?? null,
380:           morph: uniforms.uMorphProgress?.value ?? null,
381:           pointSize: uniforms.uPointSize?.value ?? null,
382:           freeze: uniforms.uPostMorphFreeze?.value ?? null,
```

- `src/components/webgl/WebGLBackground.jsx:581`

```text
579:     if (!mat?.uniforms) return;
580:     const u = mat.uniforms;
581:     if (u.uMorphProgress) u.uMorphProgress.value = v;
582:     else if (u.morphProgress) u.morphProgress.value = v;
583:     else if (u.uMorph) u.uMorph.value = v;
```

- `src/components/webgl/WebGLBackground.jsx:641`

```text
639:       const start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
640:       morphProbeTimer = setInterval(() => {
641:         if (!uniforms?.uMorphProgress) return;
642:         const val = Number(uniforms.uMorphProgress.value) || 0;
643:         const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
```

- `src/components/webgl/WebGLBackground.jsx:642`

```text
640:       morphProbeTimer = setInterval(() => {
641:         if (!uniforms?.uMorphProgress) return;
642:         const val = Number(uniforms.uMorphProgress.value) || 0;
643:         const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
644:         console.log('[PROBE] uMorphProgress', { t: Math.round(now - start), val });
```

- `src/components/webgl/WebGLBackground.jsx:644`

```text
642:         const val = Number(uniforms.uMorphProgress.value) || 0;
643:         const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
644:         console.log('[PROBE] uMorphProgress', { t: Math.round(now - start), val });
645:         if (now - start > 2000) {
646:           clearInterval(morphProbeTimer);
```

- `src/components/webgl/WebGLBackground.jsx:1045`

```text
1043:         uniforms: mat ? Object.keys(mat.uniforms || {}) : [],
1044:         hasGeometry: !!geometryRef.current,
1045:         morph: mat?.uniforms?.uMorphProgress?.value ?? null,
1046:       }));
1047: 
```

- `src/components/webgl/managers/BlueprintBinder.js:365`

```text
363:       scheduleRuntimeSampling?.();
364: 
365:       if (mat.uniforms?.uMorphProgress) {
366:         if (isQrBlueprint) {
367:           mat.uniforms.uMorphProgress.value = 1;
```

- `src/components/webgl/managers/BlueprintBinder.js:367`

```text
365:       if (mat.uniforms?.uMorphProgress) {
366:         if (isQrBlueprint) {
367:           mat.uniforms.uMorphProgress.value = 1;
368:           if (mat.uniforms.uStageProgress) mat.uniforms.uStageProgress.value = 1;
369:           if (mat.uniforms.uPostMorphFreeze) mat.uniforms.uPostMorphFreeze.value = 1;
```

- `src/components/webgl/managers/BlueprintBinder.js:371`

```text
369:           if (mat.uniforms.uPostMorphFreeze) mat.uniforms.uPostMorphFreeze.value = 1;
370:         } else {
371:           mat.uniforms.uMorphProgress.value = 0;
372:           if (mat.uniforms.uStageProgress) mat.uniforms.uStageProgress.value = 0;
373:         }
```

- `src/components/webgl/managers/BlueprintBinder.js:398`

```text
396:         );
397:         const seededMorph = maybeSeedNumber(
398:           matUniforms.uMorphProgress,
399:           fallbackMorphRef?.current ?? 0,
400:         );
```

- `src/components/webgl/managers/BlueprintBinder.js:647`

```text
645:       if (emittedEmergedRef) emittedEmergedRef.current = true;
646:       if (emergencePendingRef) emergencePendingRef.current = false;
647:       console.log('EMERGED once — emitting PARTICLES_EMERGED fencepost');
648:     }
649: 
```

- `src/components/webgl/managers/BlueprintBinder.js:683`

```text
681:     const matCurrent = materialRef?.current;
682:     const currentUniforms = matCurrent?.uniforms;
683:     if (!isEmergenceMode && currentUniforms?.uMorphProgress) {
684:       const director =
685:         typeof window !== 'undefined' ? window.theaterDirector : null;
```

- `src/components/webgl/managers/BlueprintBinder.js:692`

```text
690:       const startMorph = 0.0;
691: 
692:       currentUniforms.uMorphProgress.value = startMorph;
693:       if (currentUniforms.uStageProgress) {
694:         currentUniforms.uStageProgress.value = startMorph;
```

- `src/components/webgl/managers/BlueprintBinder.js:724`

```text
722:         const progress = Math.min(1, elapsed / duration);
723:         const liveUniforms = matCurrent.uniforms;
724:         if (liveUniforms?.uMorphProgress) {
725:           liveUniforms.uMorphProgress.value = startMorph + (1 - startMorph) * progress;
726:         }
```

- `src/components/webgl/managers/BlueprintBinder.js:725`

```text
723:         const liveUniforms = matCurrent.uniforms;
724:         if (liveUniforms?.uMorphProgress) {
725:           liveUniforms.uMorphProgress.value = startMorph + (1 - startMorph) * progress;
726:         }
727:         if (liveUniforms?.uStageProgress) {
```

- `src/components/webgl/setup/createRendererMaterial.js:82`

```text
80:   const uniforms = {
81:     uTime: { value: 0 },
82:     uMorphProgress: { value: morphProgress },
83:     uScrollProgress: { value: 0 },
84:     uStageProgress: { value: stageProgress },
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

- `src/engine/ConsciousnessEngine.js:230`

```text
228:     subscribe('BUILD_EMERGENCE_BLUEPRINT', this._onBuildEmergence.bind(this));
229:     subscribe('START_CLIMAX', this._handleStartClimax.bind(this));
230:     subscribe('PARTICLES_EMERGED', () => {
231:       this._rendererFencepostSeen = true;
232:       this._emergenceActive = false;
```

- `src/engine/ConsciousnessEngine.js:442`

```text
440:       }
441: 
442:       // DO NOT emit PARTICLES_EMERGED - renderer owns this fencepost
443: 
444:     } catch (e) {
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

- `src/theater/bus/index.js:7`

```text
5: 
6: const BATCH_EVENTS = new Set(['MORPH_PROGRESS', 'SCROLL_PROGRESS']);
7: const SYNC_EVENTS = new Set(['PARTICLES_EMERGED', 'FENCEPOST_LISTENERS_READY', 'ENABLE_SCROLL']);
8: 
9: class EventProfiler {
```

- `src/theater/bus/index.js:427`

```text
425:     const listenerCount = listenerSet ? listenerSet.size : 0;
426: 
427:     if (evt === 'RENDER_DIRECTIVE') {
428:       console.log('🚌 BeatBus.emit called:', {
429:         eventName: evt,
```

- `src/theater/bus/schemas.js:43`

```text
41:     },
42:   }],
43:   ['RENDER_DIRECTIVE', {
44:     optional: {
45:       kind: 'string',
```

- `src/theater/controllers/OpeningSequenceController.js:405`

```text
403:           const readinessResult = await Promise.race([
404:             this.director
405:               ._waitForEvent(EVENTS.PARTICLES_EMERGED, {
406:                 timeout: 1200,
407:                 predicate: (payload = {}) => {
```

- `src/theater/controllers/OpeningSequenceController.js:595`

```text
593:           };
594: 
595:           const fenceOff = BeatBus.on(EVENTS.PARTICLES_EMERGED, (payload) => {
596:             console.log('   Received: PARTICLES_EMERGED');
597:             finish({ type: 'fencepost', payload });
```

- `src/theater/controllers/OpeningSequenceController.js:596`

```text
594: 
595:           const fenceOff = BeatBus.on(EVENTS.PARTICLES_EMERGED, (payload) => {
596:             console.log('   Received: PARTICLES_EMERGED');
597:             finish({ type: 'fencepost', payload });
598:           });
```

- `src/theater/controllers/OpeningSequenceController.js:601`

```text
599: 
600:           fenceTimeoutId = this.director._trackTimer?.(() => {
601:             console.warn(`⚠️ Director: ${EVENTS.PARTICLES_EMERGED} timed out after ${fencepostWaitMs}ms`);
602:             finish(null);
603:           }, fencepostWaitMs);
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

- `src/theater/events.js:19`

```text
17:   BLUEPRINT_INVALIDATED: 'BLUEPRINT_INVALIDATED',// guard fallback notification
18:   PARTICLES_START_EMERGING: 'PARTICLES_START_EMERGING',
19:   PARTICLES_EMERGED: 'PARTICLES_EMERGED',        // fencepost (emit once)
20:   FENCEPOST_LISTENERS_READY: 'FENCEPOST_LISTENERS_READY',
21: 
```

- `src/theater/events.js:23`

```text
21: 
22:   // Renderer tuning & morph
23:   RENDER_DIRECTIVE: 'RENDER_DIRECTIVE',          // renderer draw/morph directives
24:   RENDERER_TUNE: 'RENDERER_TUNE',                // { rotZdegPerSec, swirl, vibAmp, flutter, trails, ... }
25:   PARTICLE_PHASE: 'PARTICLE_PHASE',              // { name }
```



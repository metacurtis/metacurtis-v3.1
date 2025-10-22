# Narration & Opening Evidence Report

Generated: 10/22/2025, 8:15:36 AM

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
  "generatedAt": "2025-10-22T13:15:34.888Z"
}
```

---
## 2) BeatBus Emitters/Listeners Map

# BeatBus Event Map
Total events: 30
## AUDIO_COMPUTER_HUM

**Emitters**:
- `src/theater/TheaterDirector.js:656`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:170`

## AUDIO_KEY_CLICK

**Emitters**:
- (none)

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:186`

## AUDIO_START_STAGE

**Emitters**:
- `src/theater/TheaterDirector.js:827`

**Listeners**:
- (none)

## BLUEPRINT_READY

**Emitters**:
- `src/engine/ConsciousnessEngine.js:682`
- `src/engine/ConsciousnessEngine.js:1120`
- `src/engine/ConsciousnessEngine.js:1740`
- `src/engine/ConsciousnessEngine.js:1761`
- `src/engine/ConsciousnessEngine.js:1780`

**Listeners**:
- `src/dev/BlueprintTap.js:14`

## BUILD_EMERGENCE_BLUEPRINT

**Emitters**:
- `src/state/commands/StateCommands.js:210`
- `src/theater/TheaterDirector.js:765`

**Listeners**:
- (none)

## CLIMAX_STEP

**Emitters**:
- `src/engine/ConsciousnessEngine.js:1027`
- `src/engine/ConsciousnessEngine.js:1353`

**Listeners**:
- (none)

## CURSOR_BLINK

**Emitters**:
- `src/theater/TheaterDirector.js:662`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:88`

## CURSOR_SHOW

**Emitters**:
- `src/theater/TheaterDirector.js:655`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:81`

## DIRECTOR_CANCEL

**Emitters**:
- `src/theater/TheaterDirector.js:997`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:218`

## DIRECTOR_ERROR

**Emitters**:
- `src/theater/TheaterDirector.js:533`

**Listeners**:
- (none)

## ENABLE_SCROLL

**Emitters**:
- `src/theater/TheaterDirector.js:848`

**Listeners**:
- `src/components/consciousness/ConsciousnessTheater.jsx:226`
- `src/state/commands/StateCommands.js:66`

## ENGINE_VIEWPORT_HINT

**Emitters**:
- `src/components/consciousness/ConsciousnessTheater.jsx:268`
- `src/components/webgl/WebGLBackground.jsx:588`
- `src/theater/TheaterDirector.js:1113`

**Listeners**:
- `src/components/consciousness/ConsciousnessTheater.jsx:210`
- `src/components/consciousness/ConsciousnessTheater.jsx:255`
- `src/components/consciousness/ConsciousnessTheater.jsx:275`
- `src/theater/TheaterDirector.js:468`
- `src/theater/TheaterDirector.js:1133`

## FENCEPOST_LISTENERS_READY

**Emitters**:
- `src/theater/TheaterDirector.js:798`

**Listeners**:
- (none)

## MEMORY_FRAGMENT_END

**Emitters**:
- `src/state/commands/StateCommands.js:260`

**Listeners**:
- (none)

## MEMORY_FRAGMENT_START

**Emitters**:
- `src/state/commands/StateCommands.js:254`

**Listeners**:
- (none)

## MORPH_PROGRESS

**Emitters**:
- `src/engine/ConsciousnessEngine.js:832`
- `src/engine/ConsciousnessEngine.js:857`
- `src/engine/ConsciousnessEngine.js:865`
- `src/state/commands/StateCommands.js:27`

**Listeners**:
- (none)

## PARTICLES_EMERGED

**Emitters**:
- `src/components/webgl/WebGLBackground.jsx:263`

**Listeners**:
- (none)

## PARTICLES_START_EMERGING

**Emitters**:
- `src/theater/TheaterDirector.js:779`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:199`

## PARTICLE_PHASE

**Emitters**:
- `src/theater/TheaterDirector.js:700`
- `src/theater/TheaterDirector.js:715`
- `src/theater/TheaterDirector.js:737`

**Listeners**:
- `src/components/webgl/WebGLBackground.jsx:1467`

## PREWARM_COMPLETE

**Emitters**:
- `src/engine/ConsciousnessEngine.js:618`

**Listeners**:
- (none)

## PREWARM_GENESIS_BLUEPRINT

**Emitters**:
- `src/theater/TheaterDirector.js:1003`

**Listeners**:
- (none)

## QUALITY_CHANGE

**Emitters**:
- `src/state/atoms/qualityAtom.js:198`
- `src/state/commands/StateCommands.js:150`

**Listeners**:
- (none)

## RENDERER_TUNE

**Emitters**:
- `src/theater/TheaterDirector.js:1018`

**Listeners**:
- (none)

## RENDER_DIRECTIVE

**Emitters**:
- `src/engine/ConsciousnessEngine.js:817`
- `src/engine/ConsciousnessEngine.js:841`
- `src/engine/ConsciousnessEngine.js:866`
- `src/engine/ConsciousnessEngine.js:1243`
- `src/engine/ConsciousnessEngine.js:1252`
- `src/engine/ConsciousnessEngine.js:1284`
- `src/theater/TheaterDirector.js:721`
- `src/theater/TheaterDirector.js:743`

**Listeners**:
- `src/components/webgl/WebGLBackground.jsx:112`

## SCREEN_FILL

**Emitters**:
- `src/theater/TheaterDirector.js:689`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:149`

## STAGE_CHANGE

**Emitters**:
- `src/state/commands/StateCommands.js:109`
- `src/theater/TheaterDirector.js:820`

**Listeners**:
- `src/state/atoms/qualityAtom.js:155`
- `src/theater/TheaterDirector.js:128`
- `src/theater/UnifiedNavigationAPI.js:174`

## STAGE_CHANGED

**Emitters**:
- `src/state/commands/StateCommands.js:118`

**Listeners**:
- (none)

## STAGE_TRANSITION

**Emitters**:
- `src/state/commands/StateCommands.js:266`

**Listeners**:
- (none)

## START_NARRATIVE

**Emitters**:
- `src/theater/TheaterDirector.js:342`
- `src/theater/TheaterDirector.js:835`

**Listeners**:
- `src/components/consciousness/ConsciousnessTheater.jsx:231`

## TERMINAL_TYPE

**Emitters**:
- `src/theater/TheaterDirector.js:674`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:103`



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

- `src/components/consciousness/ConsciousnessTheater.jsx:426`

```text
424:             });
425:           } else {
426:             stageAtom.jumpToStage(targetStage);
427:           }
428:         }
```

- `src/components/consciousness/ConsciousnessTheater.jsx:467`

```text
465:         case 'r':
466:         case 'R':
467:           stageAtom.jumpToStage('genesis');
468:           morphProgressRef.current = stateCommands.setMorphProgress(0, { origin: 'reset' });
469:           break;
```

- `src/components/narrative/NarrationController.jsx:822`

```text
820: 
821:     const offStart = BeatBus.on?.(EVENTS.START_NARRATIVE, handleStart);
822:     const offStageChange = BeatBus.on?.(EVENTS.STAGE_CHANGE, handleStageChange);
823: 
824:     const keyHandler = (event) => {
```

- `src/components/webgl/WebGLBackground.jsx:696`

```text
694:   }, []);
695:   useEffect(() => {
696:     const off = BeatBus?.on?.(EVENTS.STAGE_CHANGE, (p) => {
697:       const st = p?.stage ?? p?.to ?? p?.name ?? String(p);
698:       setStageName(st);
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

- `src/engine/ConsciousnessEngine.js:485`

```text
483:     );
484:     this._listeners.push(
485:       BeatBus.on(this._ev('STAGE_CHANGE'), this._onStageChange.bind(this))
486:     );
487:     this._listeners.push(
```

- `src/engine/ConsciousnessEngine.js:587`

```text
585:     this.currentStage = stage;
586:     if (skipBlueprint) {
587:       this._log('stage_change', { stage, skippedBlueprint: true });
588:       if (preserveEmergence && stage === 'genesis') {
589:         this._log('stage_preserve_emergence', { preserved: !!this._lastEmergenceTargets });
```

- `src/engine/ConsciousnessEngine.js:594`

```text
592:     }
593:     this.buildAndEmitBlueprint(stage, this.currentQuality);
594:     this._log('stage_change', { stage });
595:   }
596: 
```

- `src/hooks/atoms/useNarrativeStore.js:21`

```text
19: 
20:     // Actions (bound to atom)
21:     jumpToStage: narrativeAtom.jumpToStage,
22:     nextStage: narrativeAtom.nextStage,
23:     prevStage: narrativeAtom.prevStage,
```

- `src/orchestration/navigation/narrativeNavigation.js:42`

```text
40: };
41: 
42: const jumpToStage = (stageName, options = {}) => {
43:   const stageNames = getStageNames();
44:   const targetIndex = stageNames.indexOf(stageName);
```

- `src/orchestration/navigation/narrativeNavigation.js:54`

```text
52:   if (currentStage === stageName) return true;
53: 
54:   stageAtom.jumpToStage(stageName);
55:   syncScrollToStage(targetIndex, { smooth });
56:   if (emitNarration) emitStartNarrative(stageName);
```

- `src/orchestration/navigation/narrativeNavigation.js:104`

```text
102:       label,
103:       isActive: activeStage === name,
104:       onClick: () => jumpToStage(name, { smooth: true, emitNarration: true }),
105:       index,
106:     };
```

- `src/orchestration/navigation/narrativeNavigation.js:145`

```text
143:   nextStage,
144:   prevStage,
145:   jumpToStage,
146:   toggleAutoAdvance,
147: };
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

- `src/state/commands/StateCommands.js:109`

```text
107:       if (next !== prevStage) {
108:         // Emit stage change events
109:         BeatBus.emit(EVENTS.STAGE_CHANGE, { 
110:           from: prevStage, 
111:           to: next, 
```

- `src/state/commands/StateCommands.js:117`

```text
115:         
116:         // Compatibility event if different
117:         if (EVENTS.STAGE_CHANGED !== EVENTS.STAGE_CHANGE) {
118:           BeatBus.emit(EVENTS.STAGE_CHANGED, { 
119:             from: prevStage, 
```

- `src/state/commands/StateCommands.js:118`

```text
116:         // Compatibility event if different
117:         if (EVENTS.STAGE_CHANGED !== EVENTS.STAGE_CHANGE) {
118:           BeatBus.emit(EVENTS.STAGE_CHANGED, { 
119:             from: prevStage, 
120:             to: next, 
```

- `src/state/commands/StateCommands.js:195`

```text
193:       const currentStage = stageAtom.getState?.()?.currentStage;
194:       if (currentStage !== targetStage) {
195:         stageAtom.jumpToStage(targetStage);
196:       }
197:     }
```

- `src/theater/ScrollOrchestrator.js:3`

```text
1: // src/theater/ScrollOrchestrator.js
2: // BeatGlyph v3.3 — ScrollOrchestrator
3: // Purpose: map window scroll -> stage-local progress; publish MORPH_PROGRESS, STAGE_CHANGE, and MEMORY_FRAGMENT_TRIGGER.
4: // Kinetics: speedMultiplier=2.0, smoothing=0.15, overshoot=0.05 (v3.3 canon)
5: 
```

- `src/theater/ScrollOrchestrator.js:343`

```text
341:           timestamp: performance.now(),
342:         });
343:         BeatBus.emit?.(EVENTS.STAGE_CHANGE, { 
344:           stage: stageName, 
345:           index: stageIdx,
```

- `src/theater/TheaterDirector.js:128`

```text
126: 
127:     if (typeof BeatBus?.on === 'function') {
128:       this._stageChangeUnsubscribe = BeatBus.on(EVENTS.STAGE_CHANGE, this._handleStageChangeBound);
129:     }
130:   }
```

- `src/theater/TheaterDirector.js:820`

```text
818:       console.log('🧬 Phase: Genesis stage handoff');
819: 
820:       BeatBus.emit(EVENTS.STAGE_CHANGE, {
821:         from: previousStage,
822:         to: toStage,
```

- `src/theater/TheaterDirector.js:1177`

```text
1175:   version: '1.0.1',
1176:   events: {
1177:     STAGE_CHANGE: {
1178:       required: ['from', 'to'],
1179:       notes: 'Canonical shape. Old `{stage}` payload is deprecated.',
```

- `src/theater/TheaterDirector.js:1197`

```text
1195:   },
1196:   deprecations: {
1197:     STAGE_CHANGE: { stage: 'deprecated' },
1198:     QUALITY_CHANGE: { quality: 'deprecated' },
1199:   },
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

- `src/theater/UnifiedNavigationAPI.js:90`

```text
88:       console.warn('🚨 [UNIFIED NAV] Document not scrollable - using direct stage jump as fallback');
89: 
90:       if (window.stageControls?.jumpToStage) {
91:         window.stageControls.jumpToStage(targetStage);
92:         console.log('🎯 [UNIFIED NAV] Used fallback stage jump');
```

- `src/theater/UnifiedNavigationAPI.js:91`

```text
89: 
90:       if (window.stageControls?.jumpToStage) {
91:         window.stageControls.jumpToStage(targetStage);
92:         console.log('🎯 [UNIFIED NAV] Used fallback stage jump');
93:       } else {
```

- `src/theater/UnifiedNavigationAPI.js:94`

```text
92:         console.log('🎯 [UNIFIED NAV] Used fallback stage jump');
93:       } else {
94:         console.warn('🚨 [UNIFIED NAV] Fallback stageControls.jumpToStage unavailable');
95:       }
96: 
```

- `src/theater/UnifiedNavigationAPI.js:174`

```text
172:    */
173:   onStageChange(callback) {
174:     return BeatBus.on('STAGE_CHANGE', callback);
175:   }
176: }
```

- `src/theater/bus/index.js:26`

```text
24:       this._contracts = {
25:         events: {
26:           STAGE_CHANGE: { required: ['from', 'to'] },
27:           QUALITY_CHANGE: { required: ['tier'] },
28:           BLUEPRINT_READY: { required: ['stage', 'quality', 'blueprint'] }
```

- `src/theater/bus/index.js:81`

```text
79:     
80:     // Fallback canonicalization
81:     if (evt==='STAGE_CHANGE'){
82:       if (p.stage && !p.to) p.to = p.stage;
83:       if (!p.from) p.from = this._last.stage || 'unknown';
```

- `src/theater/bus/index.js:157`

```text
155: 
156:     // maintain last state hints for better "from"
157:     if (evt==='STAGE_CHANGE' && canonPayload?.to) this._last.stage = canonPayload.to;
158:     if (evt==='QUALITY_CHANGE' && canonPayload?.tier) this._last.quality = canonPayload.tier;
159: 
```

- `src/theater/events-safe.js:6`

```text
4: export const EVENTS_CORE = {
5:   // Critical opening sequence events
6:   STAGE_CHANGE: 'STAGE_CHANGE',
7:   QUALITY_CHANGE: 'QUALITY_CHANGE',
8:   BLUEPRINT_READY: 'BLUEPRINT_READY',
```

- `src/theater/events.js:32`

```text
30:   NARRATIVE_STAGE_CHANGE: 'NARRATIVE_STAGE_CHANGE',
31:   NARRATIVE_LINE: 'NARRATIVE_LINE',
32:   STAGE_CHANGE: 'STAGE_CHANGE',                  // { from, to } (canonical)
33:   STAGE_CHANGED: 'STAGE_CHANGED',                // (legacy/compat)
34:   STAGE_TRANSITION: 'STAGE_TRANSITION',
```

- `src/theater/events.js:33`

```text
31:   NARRATIVE_LINE: 'NARRATIVE_LINE',
32:   STAGE_CHANGE: 'STAGE_CHANGE',                  // { from, to } (canonical)
33:   STAGE_CHANGED: 'STAGE_CHANGED',                // (legacy/compat)
34:   STAGE_TRANSITION: 'STAGE_TRANSITION',
35:   START_CLIMAX: 'START_CLIMAX',                  // Trigger climax sequence
```

## OPENING_PHASE

- `src/components/consciousness/ConsciousnessTheater.jsx:155`

```text
153:           border: 'none',
154:           borderRadius: '5px',
155:           cursor: 'pointer',
156:           fontFamily: 'Courier New, monospace',
157:           fontWeight: 'bold',
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

- `src/components/theater/OpeningSequence.jsx:80`

```text
78: 
79:     const eventHandlers = [
80:       // CURSOR SHOW
81:       BeatBus.on(EVENTS.CURSOR_SHOW, () => {
82:         console.log('   OpeningSequence: CURSOR_SHOW received');
```

- `src/components/theater/OpeningSequence.jsx:83`

```text
81:       BeatBus.on(EVENTS.CURSOR_SHOW, () => {
82:         console.log('   OpeningSequence: CURSOR_SHOW received');
83:         setPhase('cursor');
84:         setCursorVisible(true);
85:       }),
```

- `src/components/theater/OpeningSequence.jsx:87`

```text
85:       }),
86: 
87:       // CURSOR BLINK
88:       BeatBus.on(EVENTS.CURSOR_BLINK, async ({ count = 2, interval = 500 } = {}) => {
89:         console.log(`   OpeningSequence: CURSOR_BLINK received (${count} times)`);
```

- `src/components/theater/OpeningSequence.jsx:103`

```text
101: 
102:       // TERMINAL TYPE
103:       BeatBus.on(EVENTS.TERMINAL_TYPE, async ({ lines: toType = [], typeSpeed = 50, lineDelay = 300 } = {}) => {
104:         console.log('   OpeningSequence: TERMINAL_TYPE received');
105:         setPhase('typing');
```

- `src/components/theater/OpeningSequence.jsx:104`

```text
102:       // TERMINAL TYPE
103:       BeatBus.on(EVENTS.TERMINAL_TYPE, async ({ lines: toType = [], typeSpeed = 50, lineDelay = 300 } = {}) => {
104:         console.log('   OpeningSequence: TERMINAL_TYPE received');
105:         setPhase('typing');
106:         setCursorVisible(false);
```

- `src/components/theater/OpeningSequence.jsx:149`

```text
147: 
148:       // SCREEN FILL
149:       BeatBus.on(EVENTS.SCREEN_FILL, ({ text = `${GENESIS_STAGE_WORD} `, scrollSpeed = 50 } = {}) => {
150:         console.log('   OpeningSequence: SCREEN_FILL received');
151:         setPhase('fill');
```

- `src/components/theater/OpeningSequence.jsx:150`

```text
148:       // SCREEN FILL
149:       BeatBus.on(EVENTS.SCREEN_FILL, ({ text = `${GENESIS_STAGE_WORD} `, scrollSpeed = 50 } = {}) => {
150:         console.log('   OpeningSequence: SCREEN_FILL received');
151:         setPhase('fill');
152: 
```

- `src/components/theater/OpeningSequence.jsx:275`

```text
273:       }}
274:     >
275:       {/* BLACK SCREEN PHASE */}
276:       {phase === 'black' && (
277:         <div style={{ width: '100%', height: '100%', backgroundColor: '#000000' }} />
```

- `src/components/theater/OpeningSequence.jsx:276`

```text
274:     >
275:       {/* BLACK SCREEN PHASE */}
276:       {phase === 'black' && (
277:         <div style={{ width: '100%', height: '100%', backgroundColor: '#000000' }} />
278:       )}
```

- `src/components/theater/OpeningSequence.jsx:280`

```text
278:       )}
279: 
280:       {/* CURSOR PHASE */}
281:       {phase === 'cursor' && (
282:         <div
```

- `src/components/theater/OpeningSequence.jsx:281`

```text
279: 
280:       {/* CURSOR PHASE */}
281:       {phase === 'cursor' && (
282:         <div
283:           style={{
```

- `src/components/ui/AdvancedContactPortal.jsx:505`

```text
503:               fontSize: '1rem',
504:               fontWeight: '600',
505:               cursor: submitStatus === 'submitting' ? 'not-allowed' : 'pointer',
506:               transition: 'all 0.2s ease',
507:               opacity: submitStatus === 'submitting' ? 0.7 : 1,
```

- `src/components/ui/AdvancedContactPortal.jsx:537`

```text
535:             height: '40px',
536:             borderRadius: '50%',
537:             cursor: 'pointer',
538:             display: 'flex',
539:             alignItems: 'center',
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

- `src/components/webgl/WebGLBackground.jsx:634`

```text
632:   }, [emitViewportHint]);
633: 
634:   // Fallback morph sink (outside emergence directives)
635:   const __applyMorph = (v) => {
636:     const mat = materialRef.current;
```

- `src/components/webgl/WebGLBackground.jsx:711`

```text
709:   }, []);
710: 
711:   // Emergence flag (no local tween; engine drives via directives)
712:   useEffect(() => {
713:     const off = BeatBus?.on?.(EVENTS.PARTICLES_START_EMERGING, () => {
```

- `src/components/webgl/WebGLBackground.jsx:921`

```text
919:       if (id === lastBlueprintIdRef.current) return;
920:       lastBlueprintIdRef.current = id;
921:       const isEmergence = mode === 'emergence' || raw?.mode === 'emergence';
922:       const shouldFastForward = isEmergence && (fastForwardRequested || skipMorph);
923: 
```

- `src/components/webgl/WebGLBackground.jsx:947`

```text
945:         }
946:       }
947:       // ignore late emergence after handoff
948:       if (isEmergence && emittedEmergedRef.current) return;
949: 
```

- `src/components/webgl/WebGLBackground.jsx:1030`

```text
1028:       if (mat) {
1029:         applyRendererFits(geo, viewportHintRef.current || viewport);
1030:         logBind(isEmergence ? 'emergence' : 'stage', {
1031:           stage: raw.stageName || st || 'genesis',
1032:           mode: mode || raw?.mode || (isEmergence ? 'emergence' : 'full'),
```

- `src/components/webgl/WebGLBackground.jsx:1032`

```text
1030:         logBind(isEmergence ? 'emergence' : 'stage', {
1031:           stage: raw.stageName || st || 'genesis',
1032:           mode: mode || raw?.mode || (isEmergence ? 'emergence' : 'full'),
1033:           cached: !!cached,
1034:         });
```

- `src/components/webgl/WebGLBackground.jsx:1063`

```text
1061: 
1062:       if (isEmergence) {
1063:         console.log('✅ Renderer: BR(emergence) bound', `count=${raw.particleCount || raw.activeCount}`, `quality=${quality}`);
1064:         emergencePendingRef.current = true;
1065:         emittedEmergedRef.current = false;
```

- `src/components/webgl/WebGLBackground.jsx:1088`

```text
1086:           const source = fastForwardRequested ? 'renderer-fastforward' : 'renderer-skip-morph';
1087:           if (finalizeEmergence(source)) {
1088:             console.log('⚡ Renderer: Emergence fast-forward applied', {
1089:               source,
1090:               cacheKey,
```

- `src/components/webgl/WebGLCanvas.jsx:317`

```text
315:           <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_50%)]" />
316:         </div>
317:         <div className="absolute bottom-4 right-4 bg-black/80 border border-red-600 rounded-lg p-3 text-red-400 font-mono text-sm">
318:           <div className="font-bold mb-2">⚛️ WebGL Not Supported</div>
319:           <div>Stage: {stage}</div>
```

- `src/components/webgl/WebGLCanvas.jsx:490`

```text
488:                 padding: '4px 8px',
489:                 borderRadius: '4px',
490:                 cursor: 'pointer',
491:                 fontSize: '11px',
492:                 marginRight: '8px',
```

- `src/components/webgl/WebGLCanvas.jsx:510`

```text
508:                 padding: '4px 8px',
509:                 borderRadius: '4px',
510:                 cursor: 'pointer',
511:                 fontSize: '11px',
512:               }}
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

- `src/engine/ConsciousnessEngine.js:189`

```text
187:   'JetBrains Mono': () => '/fonts/CourierPrime_Regular.typeface.json',
188:   Inter: () => import('three/examples/fonts/helvetiker_regular.typeface.json?url').then((m) => m.default),
189:   'Archivo Black': () => '/fonts/helvetiker_bold.typeface.json',
190:   Montserrat: () => '/fonts/helvetiker_bold.typeface.json',
191:   'Playfair Display': () => import('three/examples/fonts/helvetiker_regular.typeface.json?url').then((m) => m.default),
```

- `src/engine/ConsciousnessEngine.js:382`

```text
380:     this._viewportHint = { width: 120, height: 90, aspect: 4 / 3 };
381: 
382:     // Emergence memory - store only targets, not full blueprint
383:     this._lastEmergenceTargets = null;
384:     this._emergenceRaf = null;
```

- `src/engine/ConsciousnessEngine.js:608`

```text
606: 
607:   _onPrewarmGenesis() {
608:     // Clear stale emergence targets so prewarm rebuilds with current VC tuning
609:     this._lastEmergenceTargets = null;
610:     console.log('🧠 Engine: Prewarming genesis blueprint');
```

- `src/engine/ConsciousnessEngine.js:666`

```text
664:       this._rendererFencepostSeen = false;
665: 
666:       // Build the emergence blueprint
667:       const blueprint = await this.buildEmergenceBlueprint(payload);
668:       
```

- `src/engine/ConsciousnessEngine.js:671`

```text
669:       // Validate before proceeding
670:       if (!this._validateBlueprint(blueprint)) {
671:         console.error('🧠 Engine: Invalid emergence blueprint, not emitting');
672:         this._log('emergence_validation_failed');
673:         this._emergenceActive = false;
```

- `src/engine/ConsciousnessEngine.js:681`

```text
679:       this._lastEmergenceTargets = blueprint.text3DPositions;
680: 
681:       // Emit emergence blueprint with mode flag (canonical event)
682:       BeatBus.emit(EVENTS.BLUEPRINT_READY, {
683:         blueprint,
```

- `src/engine/ConsciousnessEngine.js:686`

```text
684:         stage: 'genesis',
685:         quality: this.currentQuality,
686:         mode: 'emergence',
687:         cached: false,
688:         skipMorphAnimation: !!payload.skipMorphAnimation,
```

- `src/engine/ConsciousnessEngine.js:694`

```text
692:       });
693:       
694:       console.log('🧠 Engine: Emergence blueprint emitted', { count: blueprint.particleCount, mode: 'emergence' });
695:       this._log('emergence_built', { count: blueprint.particleCount });
696: 
```

- `src/engine/ConsciousnessEngine.js:697`

```text
695:       this._log('emergence_built', { count: blueprint.particleCount });
696: 
697:       // Drive implosion → settle via directives; renderer remains passive
698:       if (!this._startEmergenceTimeline(blueprint)) {
699:         this._emergenceActive = false;
```

- `src/engine/ConsciousnessEngine.js:893`

```text
891:       : midDefault;
892: 
893:     console.log('🎨 [EMERGENCE TIMELINE]', {
894:       fastForward,
895:       midDefault,
```

- `src/engine/ConsciousnessEngine.js:903`

```text
901: 
902:     if (implMs > 6000 || settleMs > 6000) {
903:       console.warn('[Emergence] unusually long timings detected', { implMs, settleMs, mid: midForTimeline });
904:     }
905: 
```

- `src/engine/ConsciousnessEngine.js:1411`

```text
1409: 
1410:     if (safeCount > 0) {
1411:       const rnd = createSeededRandom(`emergence-${mode || 'default'}-${quality || 'HIGH'}`);
1412:       for (let i = 0; i < safeCount; i++) {
1413:         const j = i * 3;
```

- `src/engine/ConsciousnessEngine.js:1549`

```text
1547: 
1548:   /**
1549:    * Build + emit the Emergence blueprint for the opening sequence.
1550:    */
1551:   async buildEmergenceBlueprint(options = {}) {
```

- `src/engine/ConsciousnessEngine.js:1553`

```text
1551:   async buildEmergenceBlueprint(options = {}) {
1552:     const {
1553:       mode = 'emergence',
1554:       source = 'viewportSpread',
1555:       target = 'constellation',
```

- `src/engine/ConsciousnessEngine.js:1600`

```text
1598:         usedFallback = this._lastText3DFallbackUsed;
1599:         if (usedFallback) {
1600:           console.warn('⚠️ Emergence used text3D FALLBACK (band). FontReady:', this._fontReady);
1601:         }
1602:       } else {
```

- `src/engine/ConsciousnessEngine.js:1667`

```text
1665:       targetState: targetState || null,
1666:       note: usedFallback
1667:         ? 'Emergence used fallback band (font not ready); cache will be cleared on font load.'
1668:         : 'Emergence endpoints separated: random atmospheric → 3D text target',
1669:     };
```

- `src/engine/ConsciousnessEngine.js:1668`

```text
1666:       note: usedFallback
1667:         ? 'Emergence used fallback band (font not ready); cache will be cleared on font load.'
1668:         : 'Emergence endpoints separated: random atmospheric → 3D text target',
1669:     };
1670: 
```

- `src/engine/ConsciousnessEngine.js:1697`

```text
1695: 
1696:     if (this._emergenceActive && stage !== 'genesis') {
1697:       console.warn('🧠 Engine: rebuild blocked during emergence timeline', { stage, quality });
1698:       this._log('rebuild_blocked_emergence', { stage, quality });
1699:       return;
```

- `src/engine/ConsciousnessEngine.js:1705`

```text
1703:     let blueprint = this.blueprintCache.get(cacheKey);
1704: 
1705:     // Post-emergence genesis: optionally preserve settled emergence
1706:     if (stage === 'genesis' && this._lastEmergenceTargets) {
1707:       if (this._lastText3DFallbackUsed) {
```

- `src/engine/ConsciousnessEngine.js:1708`

```text
1706:     if (stage === 'genesis' && this._lastEmergenceTargets) {
1707:       if (this._lastText3DFallbackUsed) {
1708:         console.warn('🧠 Engine: Emergence fallback detected; skipping preserve');
1709:         this._lastEmergenceTargets = null;
1710:         this._emergenceDone = false;
```

- `src/engine/ConsciousnessEngine.js:1713`

```text
1711:         this._rendererFencepostSeen = false;
1712:       } else if (!this._emergenceDone) {
1713:         console.warn('🧠 Engine: Emergence incomplete; rebuilding genesis cleanly');
1714:         this._lastEmergenceTargets = null;
1715:         this._emergenceDone = false;
```

- `src/engine/ConsciousnessEngine.js:1723`

```text
1721:         this._rendererFencepostSeen = false;
1722:       } else {
1723:         console.log('🧠 Engine: Building post-emergence genesis (preserving emergence result)');
1724: 
1725:         const emergenceCount = Math.max(0, Math.floor(this._lastEmergenceTargets.length / 3));
```

- `src/engine/ConsciousnessEngine.js:1744`

```text
1742:               stage,
1743:               quality,
1744:               mode: 'post-emergence-guarded',
1745:               cacheKey,
1746:               preservedEmergence: true,
```

- `src/engine/ConsciousnessEngine.js:1749`

```text
1747:             });
1748:             this._preloadNextStage(stage, quality);
1749:             this._log('blueprint_emitted', { stage, quality, cacheKey, mode: 'post-emergence-guarded' });
1750:           }
1751:           this._rendererFencepostSeen = false;
```

- `src/engine/ConsciousnessEngine.js:2364`

```text
2362:           console.log(`✅ 3D font loaded from ${usedUrl}; cleared text3D cache (was ${oldSize} entries)`);
2363:           try {
2364:             if (this._lastText3DFallbackUsed && this._lastBlueprint?.metadata?.mode === 'emergence') {
2365:               console.log('🔁 Rebuilding emergence with real text3D now that font is ready…');
2366:               this.buildEmergenceBlueprint({ mode: 'emergence' });
```

- `src/engine/ConsciousnessEngine.js:2365`

```text
2363:           try {
2364:             if (this._lastText3DFallbackUsed && this._lastBlueprint?.metadata?.mode === 'emergence') {
2365:               console.log('🔁 Rebuilding emergence with real text3D now that font is ready…');
2366:               this.buildEmergenceBlueprint({ mode: 'emergence' });
2367:             }
```

- `src/engine/ConsciousnessEngine.js:2366`

```text
2364:             if (this._lastText3DFallbackUsed && this._lastBlueprint?.metadata?.mode === 'emergence') {
2365:               console.log('🔁 Rebuilding emergence with real text3D now that font is ready…');
2366:               this.buildEmergenceBlueprint({ mode: 'emergence' });
2367:             }
2368:           } catch {}
```

- `src/state/commands/StateCommands.js:103`

```text
101: 
102:   wireAtomsToBeatBus() {
103:     // Stage changes → BeatBus (without emergence blueprint emission)
104:     let prevStage = stageAtom.getState?.()?.currentStage;
105:     const stageSub = stageAtom.subscribe?.(s => {
```

- `src/state/commands/StateCommands.js:126`

```text
124:         
125:         // REMOVED: BUILD_EMERGENCE_BLUEPRINT emission
126:         // This was causing emergence to build on every stage change
127:         // Emergence should only be triggered by TheaterDirector during opening
128:         
```

- `src/state/commands/StateCommands.js:127`

```text
125:         // REMOVED: BUILD_EMERGENCE_BLUEPRINT emission
126:         // This was causing emergence to build on every stage change
127:         // Emergence should only be triggered by TheaterDirector during opening
128:         
129:         prevStage = next;
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

- `src/theater/ScrollOrchestrator.js:310`

```text
308:       const local = clamp01((easedPct - start) / Math.max(1, end - start));
309: 
310:       // v3.5 adjustment: keep genesis fully formed (no post-emergence un-morph)
311:       if (stageIdx === 0) {
312:         this.morphTarget = 1;
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

- `src/theater/TheaterDirector.js:64`

```text
62: const DEFAULT_OPENING_EMERGENCE = {
63:   target: 'constellation',
64:   mode: 'emergence',
65:   source: 'viewportSpread',
66: };
```

- `src/theater/TheaterDirector.js:143`

```text
141:         ...(stageTimeline.blackout ?? {}),
142:       },
143:       cursor: {
144:         ...DEFAULT_OPENING_TIMELINE.cursor,
145:         ...(openingTimeline.cursor ?? {}),
```

- `src/theater/TheaterDirector.js:144`

```text
142:       },
143:       cursor: {
144:         ...DEFAULT_OPENING_TIMELINE.cursor,
145:         ...(openingTimeline.cursor ?? {}),
146:         ...(stageTimeline.cursor ?? {}),
```

- `src/theater/TheaterDirector.js:145`

```text
143:       cursor: {
144:         ...DEFAULT_OPENING_TIMELINE.cursor,
145:         ...(openingTimeline.cursor ?? {}),
146:         ...(stageTimeline.cursor ?? {}),
147:       },
```

- `src/theater/TheaterDirector.js:146`

```text
144:         ...DEFAULT_OPENING_TIMELINE.cursor,
145:         ...(openingTimeline.cursor ?? {}),
146:         ...(stageTimeline.cursor ?? {}),
147:       },
148:       typing: {
```

- `src/theater/TheaterDirector.js:158`

```text
156:         ...(stageTimeline.fill ?? {}),
157:       },
158:       chaos: {
159:         ...DEFAULT_OPENING_TIMELINE.chaos,
160:         ...(openingTimeline.chaos ?? {}),
```

- `src/theater/TheaterDirector.js:159`

```text
157:       },
158:       chaos: {
159:         ...DEFAULT_OPENING_TIMELINE.chaos,
160:         ...(openingTimeline.chaos ?? {}),
161:         ...(stageTimeline.chaos ?? {}),
```

- `src/theater/TheaterDirector.js:160`

```text
158:       chaos: {
159:         ...DEFAULT_OPENING_TIMELINE.chaos,
160:         ...(openingTimeline.chaos ?? {}),
161:         ...(stageTimeline.chaos ?? {}),
162:       },
```

- `src/theater/TheaterDirector.js:161`

```text
159:         ...DEFAULT_OPENING_TIMELINE.chaos,
160:         ...(openingTimeline.chaos ?? {}),
161:         ...(stageTimeline.chaos ?? {}),
162:       },
163:       coalesce: {
```

- `src/theater/TheaterDirector.js:163`

```text
161:         ...(stageTimeline.chaos ?? {}),
162:       },
163:       coalesce: {
164:         ...DEFAULT_OPENING_TIMELINE.coalesce,
165:         ...(openingTimeline.coalesce ?? {}),
```

- `src/theater/TheaterDirector.js:164`

```text
162:       },
163:       coalesce: {
164:         ...DEFAULT_OPENING_TIMELINE.coalesce,
165:         ...(openingTimeline.coalesce ?? {}),
166:         ...(stageTimeline.coalesce ?? {}),
```

- `src/theater/TheaterDirector.js:165`

```text
163:       coalesce: {
164:         ...DEFAULT_OPENING_TIMELINE.coalesce,
165:         ...(openingTimeline.coalesce ?? {}),
166:         ...(stageTimeline.coalesce ?? {}),
167:       },
```

- `src/theater/TheaterDirector.js:166`

```text
164:         ...DEFAULT_OPENING_TIMELINE.coalesce,
165:         ...(openingTimeline.coalesce ?? {}),
166:         ...(stageTimeline.coalesce ?? {}),
167:       },
168:       settle: {
```

- `src/theater/TheaterDirector.js:168`

```text
166:         ...(stageTimeline.coalesce ?? {}),
167:       },
168:       settle: {
169:         ...DEFAULT_OPENING_TIMELINE.settle,
170:         ...(openingTimeline.settle ?? {}),
```

- `src/theater/TheaterDirector.js:169`

```text
167:       },
168:       settle: {
169:         ...DEFAULT_OPENING_TIMELINE.settle,
170:         ...(openingTimeline.settle ?? {}),
171:         ...(stageTimeline.settle ?? {}),
```

- `src/theater/TheaterDirector.js:170`

```text
168:       settle: {
169:         ...DEFAULT_OPENING_TIMELINE.settle,
170:         ...(openingTimeline.settle ?? {}),
171:         ...(stageTimeline.settle ?? {}),
172:       },
```

- `src/theater/TheaterDirector.js:171`

```text
169:         ...DEFAULT_OPENING_TIMELINE.settle,
170:         ...(openingTimeline.settle ?? {}),
171:         ...(stageTimeline.settle ?? {}),
172:       },
173:       profile: stageTimeline.profile ?? openingTimeline.profile ?? null,
```

- `src/theater/TheaterDirector.js:178`

```text
176:     };
177: 
178:     const emergenceTimeline = stageTimeline.emergence ?? openingTimeline.emergence ?? {};
179: 
180:     const fallbackSkipKey = 'SPACE';
```

- `src/theater/TheaterDirector.js:190`

```text
188:       totalDurationMs: stageTimeline.totalDurationMs ?? opening.totalDurationMs ?? null,
189:       timeline,
190:       emergence: { ...DEFAULT_OPENING_EMERGENCE, ...emergenceTimeline },
191:     };
192:   }
```

- `src/theater/TheaterDirector.js:516`

```text
514: 
515:     const segments = [
516:       `black ${snapshotTimeline?.blackout?.durationMs ?? DEFAULT_OPENING_TIMELINE.blackout.durationMs}ms`,
517:       `cursor blink x${snapshotTimeline?.cursor?.blinkCount ?? DEFAULT_OPENING_TIMELINE.cursor.blinkCount}` +
518:         ` @ ${(snapshotTimeline?.cursor?.intervalMs ?? DEFAULT_OPENING_TIMELINE.cursor.intervalMs)}ms`,
```

- `src/theater/TheaterDirector.js:517`

```text
515:     const segments = [
516:       `black ${snapshotTimeline?.blackout?.durationMs ?? DEFAULT_OPENING_TIMELINE.blackout.durationMs}ms`,
517:       `cursor blink x${snapshotTimeline?.cursor?.blinkCount ?? DEFAULT_OPENING_TIMELINE.cursor.blinkCount}` +
518:         ` @ ${(snapshotTimeline?.cursor?.intervalMs ?? DEFAULT_OPENING_TIMELINE.cursor.intervalMs)}ms`,
519:       `typing ~${snapshotTypingDuration}ms`,
```

- `src/theater/TheaterDirector.js:518`

```text
516:       `black ${snapshotTimeline?.blackout?.durationMs ?? DEFAULT_OPENING_TIMELINE.blackout.durationMs}ms`,
517:       `cursor blink x${snapshotTimeline?.cursor?.blinkCount ?? DEFAULT_OPENING_TIMELINE.cursor.blinkCount}` +
518:         ` @ ${(snapshotTimeline?.cursor?.intervalMs ?? DEFAULT_OPENING_TIMELINE.cursor.intervalMs)}ms`,
519:       `typing ~${snapshotTypingDuration}ms`,
520:       `fill ${snapshotTimeline?.fill?.durationMs ?? DEFAULT_OPENING_TIMELINE.fill.durationMs}ms`,
```

- `src/theater/TheaterDirector.js:521`

```text
519:       `typing ~${snapshotTypingDuration}ms`,
520:       `fill ${snapshotTimeline?.fill?.durationMs ?? DEFAULT_OPENING_TIMELINE.fill.durationMs}ms`,
521:       `emergence ${snapshotTimeline?.emergence?.durationMs ?? DEFAULT_OPENING_TIMELINE.emergence.durationMs}ms`,
522:     ];
523: 
```

- `src/theater/TheaterDirector.js:550`

```text
548: 
549:     const opening = this._getOpeningConfig();
550:     const { timeline, skipKey, emergence: openingEmergence } = opening ?? {};
551: 
552:     const blackoutDuration = Math.max(
```

- `src/theater/TheaterDirector.js:558`

```text
556: 
557:     const cursorConfig = {
558:       ...DEFAULT_OPENING_TIMELINE.cursor,
559:       ...(timeline?.cursor ?? {}),
560:     };
```

- `src/theater/TheaterDirector.js:559`

```text
557:     const cursorConfig = {
558:       ...DEFAULT_OPENING_TIMELINE.cursor,
559:       ...(timeline?.cursor ?? {}),
560:     };
561:     const cursorLeadInMs = Math.max(0, Number(cursorConfig.leadInMs ?? 0));
```

- `src/theater/TheaterDirector.js:563`

```text
561:     const cursorLeadInMs = Math.max(0, Number(cursorConfig.leadInMs ?? 0));
562:     const cursorSettleMs = Math.max(0, Number(cursorConfig.settleMs ?? 0));
563:     const cursorBlinkCount = Math.max(0, Number(cursorConfig.blinkCount ?? DEFAULT_OPENING_TIMELINE.cursor.blinkCount));
564:     const cursorIntervalMs = Math.max(0, Number(cursorConfig.intervalMs ?? DEFAULT_OPENING_TIMELINE.cursor.intervalMs));
565:     const cursorHumVolume = Number.isFinite(cursorConfig.humVolume) ? cursorConfig.humVolume : 0.25;
```

- `src/theater/TheaterDirector.js:564`

```text
562:     const cursorSettleMs = Math.max(0, Number(cursorConfig.settleMs ?? 0));
563:     const cursorBlinkCount = Math.max(0, Number(cursorConfig.blinkCount ?? DEFAULT_OPENING_TIMELINE.cursor.blinkCount));
564:     const cursorIntervalMs = Math.max(0, Number(cursorConfig.intervalMs ?? DEFAULT_OPENING_TIMELINE.cursor.intervalMs));
565:     const cursorHumVolume = Number.isFinite(cursorConfig.humVolume) ? cursorConfig.humVolume : 0.25;
566: 
```

- `src/theater/TheaterDirector.js:599`

```text
597:     }
598: 
599:     const chaosConfig = timeline?.chaos || {};
600:     const coalesceConfig = timeline?.coalesce || {};
601:     const settleConfig = timeline?.settle || {};
```

- `src/theater/TheaterDirector.js:600`

```text
598: 
599:     const chaosConfig = timeline?.chaos || {};
600:     const coalesceConfig = timeline?.coalesce || {};
601:     const settleConfig = timeline?.settle || {};
602: 
```

- `src/theater/TheaterDirector.js:601`

```text
599:     const chaosConfig = timeline?.chaos || {};
600:     const coalesceConfig = timeline?.coalesce || {};
601:     const settleConfig = timeline?.settle || {};
602: 
603:     const emergenceTimeline = {
```

- `src/theater/TheaterDirector.js:604`

```text
602: 
603:     const emergenceTimeline = {
604:       ...DEFAULT_OPENING_TIMELINE.emergence,
605:       ...(timeline?.emergence ?? {}),
606:     };
```

- `src/theater/TheaterDirector.js:605`

```text
603:     const emergenceTimeline = {
604:       ...DEFAULT_OPENING_TIMELINE.emergence,
605:       ...(timeline?.emergence ?? {}),
606:     };
607:     emergenceTimeline.durationMs = Math.max(
```

- `src/theater/TheaterDirector.js:609`

```text
607:     emergenceTimeline.durationMs = Math.max(
608:       0,
609:       Number(emergenceTimeline.durationMs ?? DEFAULT_OPENING_TIMELINE.emergence.durationMs),
610:     );
611:     emergenceTimeline.maxWaitMs = Math.max(
```

- `src/theater/TheaterDirector.js:613`

```text
611:     emergenceTimeline.maxWaitMs = Math.max(
612:       0,
613:       Number(emergenceTimeline.maxWaitMs ?? DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs),
614:     );
615:     const fencepostWaitMs = emergenceTimeline.maxWaitMs || DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs;
```

- `src/theater/TheaterDirector.js:615`

```text
613:       Number(emergenceTimeline.maxWaitMs ?? DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs),
614:     );
615:     const fencepostWaitMs = emergenceTimeline.maxWaitMs || DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs;
616:     const waitForFencepost = emergenceTimeline.waitForFencepost !== false;
617:     const stabilizeMs = Math.max(
```

- `src/theater/TheaterDirector.js:619`

```text
617:     const stabilizeMs = Math.max(
618:       0,
619:       Number(emergenceTimeline.stabilizeMs ?? DEFAULT_OPENING_TIMELINE.emergence.stabilizeMs ?? 0),
620:     );
621:     const skipMorphAnimation = emergenceTimeline.skipMorphAnimation === true;
```

- `src/theater/TheaterDirector.js:623`

```text
621:     const skipMorphAnimation = emergenceTimeline.skipMorphAnimation === true;
622:     const skipGenesisBlueprint = emergenceTimeline.skipGenesisBlueprint !== false;
623:     const targetState = emergenceTimeline.targetState || DEFAULT_OPENING_TIMELINE.emergence.targetState;
624: 
625:     const emergenceConfig = { ...DEFAULT_OPENING_EMERGENCE, ...(openingEmergence ?? {}) };
```

- `src/theater/TheaterDirector.js:640`

```text
638: 
639:     try {
640:       // ───────────────── Phase 1: Black
641:       this.phase = 'black';
642:       console.log(`   Phase: Black screen (${blackoutDuration}ms)`);
```

- `src/theater/TheaterDirector.js:641`

```text
639:     try {
640:       // ───────────────── Phase 1: Black
641:       this.phase = 'black';
642:       console.log(`   Phase: Black screen (${blackoutDuration}ms)`);
643:       if (blackoutDuration > 0) {
```

- `src/theater/TheaterDirector.js:642`

```text
640:       // ───────────────── Phase 1: Black
641:       this.phase = 'black';
642:       console.log(`   Phase: Black screen (${blackoutDuration}ms)`);
643:       if (blackoutDuration > 0) {
644:         const waitResult = await this.sleep(blackoutDuration);
```

- `src/theater/TheaterDirector.js:648`

```text
646:       }
647:       if (skipTriggered) {
648:         console.log(`   Skip triggered before cursor phase (key: ${skipLabel})`);
649:       }
650: 
```

- `src/theater/TheaterDirector.js:651`

```text
649:       }
650: 
651:       // ───────────────── Phase 2: Cursor
652:       if (!skipTriggered) {
653:         this.phase = 'cursor';
```

- `src/theater/TheaterDirector.js:653`

```text
651:       // ───────────────── Phase 2: Cursor
652:       if (!skipTriggered) {
653:         this.phase = 'cursor';
654:         console.log(`   Phase: Cursor (blink x${cursorBlinkCount} @ ${cursorIntervalMs}ms)`);
655:         BeatBus.emit(EVENTS.CURSOR_SHOW);
```

- `src/theater/TheaterDirector.js:654`

```text
652:       if (!skipTriggered) {
653:         this.phase = 'cursor';
654:         console.log(`   Phase: Cursor (blink x${cursorBlinkCount} @ ${cursorIntervalMs}ms)`);
655:         BeatBus.emit(EVENTS.CURSOR_SHOW);
656:         BeatBus.emit(EVENTS.AUDIO_COMPUTER_HUM, { volume: cursorHumVolume });
```

- `src/theater/TheaterDirector.js:674`

```text
672:         this.phase = 'terminal';
673:         console.log(`   Phase: Terminal typing (~${typingDuration}ms)`);
674:         BeatBus.emit(EVENTS.TERMINAL_TYPE, typingConfig);
675:         if (typingDuration > 0) {
676:           const waitResult = await this.sleep(typingDuration);
```

- `src/theater/TheaterDirector.js:689`

```text
687:       this.phase = 'fill';
688:       console.log(`   Phase: Screen fill (${fillConfig.durationMs}ms)`);
689:       BeatBus.emit(EVENTS.SCREEN_FILL, { text: fillConfig.text, scrollSpeed: fillConfig.scrollSpeed });
690:       if (fillConfig.durationMs > 0) {
691:         const waitResult = await this.sleep(fillConfig.durationMs);
```

- `src/theater/TheaterDirector.js:698`

```text
696:     if (!skipTriggered && chaosConfig?.enabled !== false) {
697:       const chaosDuration = Math.max(0, Number(chaosConfig.durationMs) || 0);
698:       this.phase = 'chaos';
699:       console.log(`   Phase: Chaos (${chaosDuration}ms)`);
700:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
```

- `src/theater/TheaterDirector.js:699`

```text
697:       const chaosDuration = Math.max(0, Number(chaosConfig.durationMs) || 0);
698:       this.phase = 'chaos';
699:       console.log(`   Phase: Chaos (${chaosDuration}ms)`);
700:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
701:         name: 'chaos',
```

- `src/theater/TheaterDirector.js:701`

```text
699:       console.log(`   Phase: Chaos (${chaosDuration}ms)`);
700:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
701:         name: 'chaos',
702:         duration: chaosDuration,
703:         rendererSpin: chaosConfig.rendererSpin || null,
```

- `src/theater/TheaterDirector.js:713`

```text
711:     if (!skipTriggered && coalesceConfig?.enabled !== false) {
712:       const coalesceDuration = Math.max(0, Number(coalesceConfig.durationMs) || 0);
713:       this.phase = 'coalesce';
714:       console.log(`   Phase: Coalesce (${coalesceDuration}ms → morph ${coalesceConfig.morphTo ?? '—'})`);
715:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
```

- `src/theater/TheaterDirector.js:714`

```text
712:       const coalesceDuration = Math.max(0, Number(coalesceConfig.durationMs) || 0);
713:       this.phase = 'coalesce';
714:       console.log(`   Phase: Coalesce (${coalesceDuration}ms → morph ${coalesceConfig.morphTo ?? '—'})`);
715:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
716:         name: 'coalesce',
```

- `src/theater/TheaterDirector.js:716`

```text
714:       console.log(`   Phase: Coalesce (${coalesceDuration}ms → morph ${coalesceConfig.morphTo ?? '—'})`);
715:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
716:         name: 'coalesce',
717:         duration: coalesceDuration,
718:         morphTarget: typeof coalesceConfig.morphTo === 'number' ? coalesceConfig.morphTo : null,
```

- `src/theater/TheaterDirector.js:722`

```text
720:       if (typeof coalesceConfig.morphTo === 'number') {
721:         BeatBus.emit(EVENTS.RENDER_DIRECTIVE, {
722:           source: 'director:coalesce',
723:           morphProgress: coalesceConfig.morphTo,
724:           durationMs: coalesceDuration,
```

- `src/theater/TheaterDirector.js:735`

```text
733:     if (!skipTriggered && settleConfig?.enabled !== false) {
734:       const settleDuration = Math.max(0, Number(settleConfig.durationMs) || 0);
735:       this.phase = 'settle';
736:       console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
737:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
```

- `src/theater/TheaterDirector.js:736`

```text
734:       const settleDuration = Math.max(0, Number(settleConfig.durationMs) || 0);
735:       this.phase = 'settle';
736:       console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
737:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
738:         name: 'settle',
```

- `src/theater/TheaterDirector.js:738`

```text
736:       console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
737:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
738:         name: 'settle',
739:         duration: settleDuration,
740:         morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
```

- `src/theater/TheaterDirector.js:744`

```text
742:       if (typeof settleConfig.morphTo === 'number') {
743:         BeatBus.emit(EVENTS.RENDER_DIRECTIVE, {
744:           source: 'director:settle',
745:           morphProgress: settleConfig.morphTo,
746:           durationMs: settleDuration,
```

- `src/theater/TheaterDirector.js:756`

```text
754: 
755:     if (skipTriggered) {
756:       console.log(`   Opening skip engaged (${this._skipOrigin ?? 'user'}) → fast-forwarding to emergence.`);
757:     }
758: 
```

- `src/theater/TheaterDirector.js:759`

```text
757:     }
758: 
759:       // ───────────────── Phase 5: Emergence (viewport → constellation)
760:       this.phase = 'emergence';
761:       console.log('   Phase: Particle emergence (SST governed)');
```

- `src/theater/TheaterDirector.js:760`

```text
758: 
759:       // ───────────────── Phase 5: Emergence (viewport → constellation)
760:       this.phase = 'emergence';
761:       console.log('   Phase: Particle emergence (SST governed)');
762: 
```

- `src/theater/TheaterDirector.js:761`

```text
759:       // ───────────────── Phase 5: Emergence (viewport → constellation)
760:       this.phase = 'emergence';
761:       console.log('   Phase: Particle emergence (SST governed)');
762: 
763:       const viewportHint = await this._ensureViewportHint();
```

- `src/theater/TheaterDirector.js:817`

```text
815:       
816:       this.phase = 'genesis';
817:       const previousStage = this.currentStage ?? 'emergence';
818:       console.log('🧬 Phase: Genesis stage handoff');
819: 
```

- `src/theater/TheaterDirector.js:983`

```text
981:     // Warn about early cancellation in development
982:     if (import.meta?.env?.DEV) {
983:       if (this.phase === 'black' || this.phase === 'cursor' || this.phase === 'terminal') {
984:         console.warn('🎬 Director: WARNING - Cancelling during early phase:', this.phase);
985:         console.warn('   This may be caused by HMR or effect cleanup');
```

- `src/theater/TheaterDirector.js:1188`

```text
1186:       required: ['stage', 'quality', 'blueprint'],
1187:       optional: ['cached', 'mode'],
1188:       notes: 'Renderer consumes stage/quality/blueprint; mode=emergence for special handling.',
1189:     },
1190:     BUILD_EMERGENCE_BLUEPRINT: {
```

- `src/theater/TheaterDirector.js:1193`

```text
1191:       required: ['mode', 'source', 'target', 'count'],
1192:       optional: ['tierRatios', 'viewportHint'],
1193:       notes: 'Corrected contract for viewport spread → constellation emergence.',
1194:     },
1195:   },
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

- `src/components/consciousness/ConsciousnessTheater.jsx:290`

```text
288:     const skipNarrationIfActive = () => {
289:       const controller = typeof window !== 'undefined' ? window.narrationController : null;
290:       if (controller?.isPlaying && typeof controller.skipNarration === 'function') {
291:         controller.skipNarration();
292:         return true;
```

- `src/components/consciousness/ConsciousnessTheater.jsx:291`

```text
289:       const controller = typeof window !== 'undefined' ? window.narrationController : null;
290:       if (controller?.isPlaying && typeof controller.skipNarration === 'function') {
291:         controller.skipNarration();
292:         return true;
293:       }
```

- `src/components/consciousness/ConsciousnessTheater.jsx:422`

```text
420:             window.unifiedNav.navigateToStage(targetStage, {
421:               smooth: true,
422:               skipNarration: false,
423:               source: 'number_key',
424:             });
```

- `src/components/narrative/NarrationController.jsx:396`

```text
394:         if (DEBUG_NARRATION) {
395:           const preview = text.length > 50 ? `${text.slice(0, 50)}…` : text;
396:           console.log('🎙️ [BEAT FIRED]', {
397:             stage: stageName,
398:             segmentIndex,
```

- `src/components/narrative/NarrationController.jsx:432`

```text
430:         }
431: 
432:         BeatBus.emit?.(EVENTS.NARRATIVE_LINE, {
433:           stage: stageName,
434:           segmentId: segment?.id ?? null,
```

- `src/components/narrative/NarrationController.jsx:552`

```text
550:   );
551: 
552:   const skipNarration = useCallback(
553:     (origin = 'skip') => {
554:       if (origin === 'external' && !isControlAllowed('narration:control')) {
```

- `src/components/narrative/NarrationController.jsx:662`

```text
660:           enumerable: true,
661:         },
662:         skipNarration: {
663:           value: () => skipNarration('external'),
664:           enumerable: true,
```

- `src/components/narrative/NarrationController.jsx:663`

```text
661:         },
662:         skipNarration: {
663:           value: () => skipNarration('external'),
664:           enumerable: true,
665:         },
```

- `src/components/narrative/NarrationController.jsx:696`

```text
694:     exposeControlSurface('narrationController', controllerFactory, {
695:       playNarration: 'narration:control',
696:       skipNarration: 'narration:control',
697:     });
698: 
```

- `src/components/narrative/NarrationController.jsx:717`

```text
715:       revokeControlSurface('narrationController');
716:     };
717:   }, [skipNarration, startNarration]);
718: 
719:   useEffect(() => {
```

- `src/components/narrative/NarrationController.jsx:726`

```text
724:       autoAdvanceEnabled,
725:       resetStateId: resetState,
726:       skipNarrationId: skipNarration,
727:       startNarrationId: startNarration,
728:     };
```

- `src/components/narrative/NarrationController.jsx:832`

```text
830:       event.preventDefault?.();
831:       event.stopPropagation?.();
832:       skipNarration('space');
833:     };
834: 
```

- `src/components/narrative/NarrationController.jsx:849`

```text
847:       resetState();
848:     };
849:   }, [currentStage, resetState, skipNarration, startNarration]);
850: 
851:   useEffect(() => {
```

- `src/components/ui/AdvancedContactPortal.jsx:65`

```text
63:     unifiedNav.navigateToStage(triggerStage, {
64:       smooth: true,
65:       skipNarration: false,
66:       source: 'portal',
67:     });
```

- `src/components/ui/narrative/StageNavigation.jsx:47`

```text
45:               unifiedNav.navigateToStage(id, {
46:                 smooth: true,
47:                 skipNarration: false,
48:                 source: 'sidebar',
49:               });
```

- `src/theater/UnifiedNavigationAPI.js:29`

```text
27:     const {
28:       smooth = true,
29:       skipNarration = false,
30:       source = 'unknown',
31:     } = options;
```

- `src/theater/UnifiedNavigationAPI.js:37`

```text
35:       source,
36:       smooth,
37:       skipNarration,
38:       method: 'ORCHESTRATED',
39:     });
```

- `src/theater/UnifiedNavigationAPI.js:62`

```text
60: 
61:     // Skip narration if requested
62:     if (skipNarration && window.narrationController?.skipNarration) {
63:       window.narrationController.skipNarration();
64:     }
```

- `src/theater/UnifiedNavigationAPI.js:63`

```text
61:     // Skip narration if requested
62:     if (skipNarration && window.narrationController?.skipNarration) {
63:       window.narrationController.skipNarration();
64:     }
65: 
```

- `src/theater/events.js:31`

```text
29:   START_NARRATIVE: 'START_NARRATIVE',            // { id?, stage? }
30:   NARRATIVE_STAGE_CHANGE: 'NARRATIVE_STAGE_CHANGE',
31:   NARRATIVE_LINE: 'NARRATIVE_LINE',
32:   STAGE_CHANGE: 'STAGE_CHANGE',                  // { from, to } (canonical)
33:   STAGE_CHANGED: 'STAGE_CHANGED',                // (legacy/compat)
```

## RENDERER

- `src/components/webgl/WebGLBackground.jsx:3`

```text
1: // src/components/webgl/WebGLBackground.jsx
2: // HOT-DORS passive renderer: projection-matrix viewport hint + single directive sink
3: // Single writer: binds geometry/material, emits PARTICLES_EMERGED exactly once (on first FULL bind)
4: 
5: import React, { useRef, useEffect, useState, useCallback } from 'react';
```

- `src/components/webgl/WebGLBackground.jsx:112`

```text
110:     }
111:     if (typeof BeatBus?.on === 'function') {
112:       BeatBus.on(EVENTS.RENDER_DIRECTIVE, (payload) => {
113:         try {
114:           directiveBridgeState.handler?.(payload);
```

- `src/components/webgl/WebGLBackground.jsx:119`

```text
117:         }
118:       });
119:       console.log('🪢 RENDER_DIRECTIVE bridge subscribed (module scope)');
120:     } else {
121:       console.warn('🪢 BeatBus.on not available at module scope');
```

- `src/components/webgl/WebGLBackground.jsx:263`

```text
261:     if (!payload) return;
262:     trace('WBG:FENCEPOST', payload);
263:     BeatBus.emit(EVENTS.PARTICLES_EMERGED, payload);
264:   }, []);
265: 
```

- `src/components/webgl/WebGLBackground.jsx:331`

```text
329:       const uniforms = mat?.uniforms;
330: 
331:       if (uniforms?.uMorphProgress) {
332:         uniforms.uMorphProgress.value = 1.0;
333:         if (uniforms.uStageProgress) {
```

- `src/components/webgl/WebGLBackground.jsx:332`

```text
330: 
331:       if (uniforms?.uMorphProgress) {
332:         uniforms.uMorphProgress.value = 1.0;
333:         if (uniforms.uStageProgress) {
334:           uniforms.uStageProgress.value = 1.0;
```

- `src/components/webgl/WebGLBackground.jsx:639`

```text
637:     if (!mat?.uniforms) return;
638:     const u = mat.uniforms;
639:     if (u.uMorphProgress) u.uMorphProgress.value = v;
640:     else if (u.morphProgress) u.morphProgress.value = v;
641:     else if (u.uMorph) u.uMorph.value = v;
```

- `src/components/webgl/WebGLBackground.jsx:1036`

```text
1034:         });
1035:         scheduleRuntimeSampling();
1036:         if (mat?.uniforms?.uMorphProgress) {
1037:           mat.uniforms.uMorphProgress.value = 0;
1038:           if (mat.uniforms.uStageProgress) mat.uniforms.uStageProgress.value = 0;
```

- `src/components/webgl/WebGLBackground.jsx:1037`

```text
1035:         scheduleRuntimeSampling();
1036:         if (mat?.uniforms?.uMorphProgress) {
1037:           mat.uniforms.uMorphProgress.value = 0;
1038:           if (mat.uniforms.uStageProgress) mat.uniforms.uStageProgress.value = 0;
1039:           mat.uniformsNeedUpdate = true;
```

- `src/components/webgl/WebGLBackground.jsx:1254`

```text
1252:         uniforms: {
1253:           uTime: { value: 0 },
1254:           uMorphProgress:  { value: clamp01(fallbackMorphRef.current) },
1255:           uScrollProgress: { value: 0 },
1256:           uStageProgress:  { value: clamp01(fallbackMorphRef.current) },
```

- `src/components/webgl/WebGLBackground.jsx:1350`

```text
1348:         uniforms: mat ? Object.keys(mat.uniforms || {}) : [],
1349:         hasGeometry: !!geometryRef.current,
1350:         morph: mat?.uniforms?.uMorphProgress?.value ?? null,
1351:       }));
1352: 
```

- `src/components/webgl/WebGLBackground.jsx:1471`

```text
1469:   }, []);
1470: 
1471:   // RENDER_DIRECTIVE sink (apply data-only; renderer owns all GPU writes)
1472:   useEffect(() => {
1473:     frameCountRef.current = 0;
```

- `src/components/webgl/WebGLBackground.jsx:1542`

```text
1540: 
1541:         // Morph progress + fencepost emission
1542:         if (Number.isFinite(directive?.morphProgress) && uniforms.uMorphProgress) {
1543:           const oldValue = Number(uniforms.uMorphProgress.value) || 0;
1544:           const newValue = clamp01(directive.morphProgress);
```

- `src/components/webgl/WebGLBackground.jsx:1543`

```text
1541:         // Morph progress + fencepost emission
1542:         if (Number.isFinite(directive?.morphProgress) && uniforms.uMorphProgress) {
1543:           const oldValue = Number(uniforms.uMorphProgress.value) || 0;
1544:           const newValue = clamp01(directive.morphProgress);
1545:           uniforms.uMorphProgress.value = newValue;
```

- `src/components/webgl/WebGLBackground.jsx:1545`

```text
1543:           const oldValue = Number(uniforms.uMorphProgress.value) || 0;
1544:           const newValue = clamp01(directive.morphProgress);
1545:           uniforms.uMorphProgress.value = newValue;
1546:           if (uniforms.uStageProgress) uniforms.uStageProgress.value = newValue;
1547:           if (Math.abs(newValue - oldValue) > 0.001) {
```

- `src/components/webgl/WebGLBackground.jsx:1549`

```text
1547:           if (Math.abs(newValue - oldValue) > 0.001) {
1548:             console.log(
1549:               `✅ uMorphProgress updated: ${(oldValue * 100).toFixed(1)}% → ${(newValue * 100).toFixed(1)}%`
1550:             );
1551:           }
```

- `src/components/webgl/WebGLBackground.jsx:1570`

```text
1568:             queueFencepost(payload);
1569:           }
1570:         } else if (Number.isFinite(directive?.morphProgress) && !uniforms.uMorphProgress) {
1571:           console.warn('⚠️ uMorphProgress uniform not found on material!');
1572:         }
```

- `src/components/webgl/WebGLBackground.jsx:1571`

```text
1569:           }
1570:         } else if (Number.isFinite(directive?.morphProgress) && !uniforms.uMorphProgress) {
1571:           console.warn('⚠️ uMorphProgress uniform not found on material!');
1572:         }
1573: 
```

- `src/components/webgl/WebGLBackground.jsx:1610`

```text
1608:     };
1609: 
1610:     const unsubscribe = BeatBus?.on?.(EVENTS.RENDER_DIRECTIVE, handler);
1611:     console.log('🔌 Renderer subscribed to:', EVENTS.RENDER_DIRECTIVE);
1612:     console.log('🔌 Event string value:', String(EVENTS.RENDER_DIRECTIVE));
```

- `src/components/webgl/WebGLBackground.jsx:1611`

```text
1609: 
1610:     const unsubscribe = BeatBus?.on?.(EVENTS.RENDER_DIRECTIVE, handler);
1611:     console.log('🔌 Renderer subscribed to:', EVENTS.RENDER_DIRECTIVE);
1612:     console.log('🔌 Event string value:', String(EVENTS.RENDER_DIRECTIVE));
1613:     console.log('🔌 Unsubscribe function exists:', typeof unsubscribe === 'function');    console.log('✅ RENDER_DIRECTIVE subscription established (persistent)');
```

- `src/components/webgl/WebGLBackground.jsx:1612`

```text
1610:     const unsubscribe = BeatBus?.on?.(EVENTS.RENDER_DIRECTIVE, handler);
1611:     console.log('🔌 Renderer subscribed to:', EVENTS.RENDER_DIRECTIVE);
1612:     console.log('🔌 Event string value:', String(EVENTS.RENDER_DIRECTIVE));
1613:     console.log('🔌 Unsubscribe function exists:', typeof unsubscribe === 'function');    console.log('✅ RENDER_DIRECTIVE subscription established (persistent)');
1614:     if (typeof window !== 'undefined') {
```

- `src/components/webgl/WebGLBackground.jsx:1613`

```text
1611:     console.log('🔌 Renderer subscribed to:', EVENTS.RENDER_DIRECTIVE);
1612:     console.log('🔌 Event string value:', String(EVENTS.RENDER_DIRECTIVE));
1613:     console.log('🔌 Unsubscribe function exists:', typeof unsubscribe === 'function');    console.log('✅ RENDER_DIRECTIVE subscription established (persistent)');
1614:     if (typeof window !== 'undefined') {
1615:       window._rendererSubscriptionCheck = () => {
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

- `src/dev/RenderDiagnostic.js:54`

```text
52:         if (!mat.uniforms) return;
53:         
54:         ['uMorphProgress', 'morphProgress', 'uMorph', 'morph'].forEach(key => {
55:           if (mat.uniforms[key]) {
56:             mat.uniforms[key].value = value;
```

- `src/engine/ConsciousnessEngine.js:500`

```text
498:     );
499:     this._listeners.push(
500:       BeatBus.on(this._ev('PARTICLES_EMERGED'), () => {
501:         this._rendererFencepostSeen = true;
502:         this._emergenceActive = false;
```

- `src/engine/ConsciousnessEngine.js:703`

```text
701:       }
702: 
703:       // DO NOT emit PARTICLES_EMERGED - renderer owns this fencepost
704: 
705:     } catch (e) {
```

- `src/engine/ConsciousnessEngine.js:817`

```text
815:         const morphRounded = +morph.toFixed(3);
816: 
817:         BeatBus.emit(EVENTS.RENDER_DIRECTIVE, {
818:           morphProgress: morphRounded,
819:           drawCount: draw,
```

- `src/engine/ConsciousnessEngine.js:841`

```text
839:             return;
840:           }
841:           BeatBus.emit(EVENTS.RENDER_DIRECTIVE, {
842:             morphProgress: 1,
843:             drawCount: count,
```

- `src/engine/ConsciousnessEngine.js:866`

```text
864:       // Prime listeners with baseline state before the first frame
865:       BeatBus.emit(EVENTS.MORPH_PROGRESS, { value: 0 });
866:       BeatBus.emit(EVENTS.RENDER_DIRECTIVE, {
867:         morphProgress: 0,
868:         drawCount: Math.max(1, Math.round(count * 0.05)),
```

- `src/engine/ConsciousnessEngine.js:1243`

```text
1241: 
1242:     console.log('🧪 TEST: Emitting test directive before animation loop');
1243:     BeatBus.emit(EVENTS.RENDER_DIRECTIVE, {
1244:       morphProgress: -0.01,
1245:       morphType: 0,
```

- `src/engine/ConsciousnessEngine.js:1252`

```text
1250:     const runAnimation = () => {
1251:       console.log('🧪 TEST: Starting actual animation loop after 100ms delay');
1252:       BeatBus.emit(EVENTS.RENDER_DIRECTIVE, {
1253:         morphProgress: 0,
1254:         morphType: 0,
```

- `src/engine/ConsciousnessEngine.js:1284`

```text
1282:         }
1283: 
1284:         BeatBus.emit(EVENTS.RENDER_DIRECTIVE, directive);
1285:         console.log(
1286:           `📤 Emitted to event:`,
```

- `src/engine/ConsciousnessEngine.js:1287`

```text
1285:         console.log(
1286:           `📤 Emitted to event:`,
1287:           EVENTS.RENDER_DIRECTIVE,
1288:           '| Value:',
1289:           String(EVENTS.RENDER_DIRECTIVE)
```

- `src/engine/ConsciousnessEngine.js:1289`

```text
1287:           EVENTS.RENDER_DIRECTIVE,
1288:           '| Value:',
1289:           String(EVENTS.RENDER_DIRECTIVE)
1290:         );
1291: 
```

- `src/shaders/templates/consciousness-vertex.glsl:15`

```text
13: // Uniforms
14: uniform float uTime;
15: uniform float uMorphProgress;
16: uniform float uScrollProgress;
17: uniform float uPointSize;
```

- `src/shaders/templates/consciousness-vertex.glsl:101`

```text
99:   textPos.y *= uTextFit.y;
100: 
101:   float morph = clamp(uMorphProgress, 0.0, 1.0);
102:   float spread = max(uSpreadFactor, 0.0);
103:   float morphType = uMorphType;
```

- `src/shaders/templates/consciousness-vertex.glsl:163`

```text
161:   
162:   // Calculate alpha
163:   vAlpha = opacityData * (0.5 + 0.5 * uMorphProgress);
164: }
165: 
```

- `src/theater/TheaterDirector.js:721`

```text
719:       });
720:       if (typeof coalesceConfig.morphTo === 'number') {
721:         BeatBus.emit(EVENTS.RENDER_DIRECTIVE, {
722:           source: 'director:coalesce',
723:           morphProgress: coalesceConfig.morphTo,
```

- `src/theater/TheaterDirector.js:743`

```text
741:       });
742:       if (typeof settleConfig.morphTo === 'number') {
743:         BeatBus.emit(EVENTS.RENDER_DIRECTIVE, {
744:           source: 'director:settle',
745:           morphProgress: settleConfig.morphTo,
```

- `src/theater/TheaterDirector.js:801`

```text
799:           this._fencepostReadyEmitted = true;
800:         }
801:         const fencepostReceived = await this.once(EVENTS.PARTICLES_EMERGED, fencepostWaitMs);
802:         if (!fencepostReceived) {
803:           console.warn('   Renderer fencepost timeout, continuing anyway');
```

- `src/theater/bus/index.js:128`

```text
126: 
127:   emit(evt, payload = {}){
128:     if (evt === 'RENDER_DIRECTIVE') {
129:       const set = this.listeners.get(evt);
130:       console.log('🚌 BeatBus.emit called:', {
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



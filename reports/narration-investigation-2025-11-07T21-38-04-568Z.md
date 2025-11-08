# Narration & Opening Evidence Report

Generated: 11/7/2025, 3:38:04 PM

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
  "generatedAt": "2025-11-07T21:38:02.716Z"
}
```

---
## 2) BeatBus Emitters/Listeners Map

# BeatBus Event Map
Total events: 23
## AUDIO_COMPUTER_HUM

**Emitters**:
- `src/theater/controllers/OpeningSequenceController.js:333`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:164`

## BLUEPRINT_READY

**Emitters**:
- `src/engine/ConsciousnessEngine.js:433`
- `src/engine/utils/blueprintUtils.js:166`

**Listeners**:
- `src/components/webgl/WebGLCanvas.jsx:264`
- `src/theater/controllers/OpeningSequenceController.js:606`

## BUILD_EMERGENCE_BLUEPRINT

**Emitters**:
- `src/state/commands/StateCommands.js:264`
- `src/theater/controllers/OpeningSequenceController.js:380`
- `src/theater/controllers/OpeningSequenceController.js:540`

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
- `src/theater/controllers/OpeningSequenceController.js:339`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:87`

## CURSOR_SHOW

**Emitters**:
- `src/theater/controllers/OpeningSequenceController.js:332`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:80`

## DIRECTOR_CANCEL

**Emitters**:
- `src/theater/TheaterDirector.js:609`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:199`

## DIRECTOR_ERROR

**Emitters**:
- `src/theater/TheaterDirector.js:468`

**Listeners**:
- (none)

## ENABLE_SCROLL

**Emitters**:
- `src/theater/controllers/OpeningSequenceController.js:661`

**Listeners**:
- `src/components/consciousness/ConsciousnessTheater.jsx:189`
- `src/state/commands/StateCommands.js:85`

## ENGINE_VIEWPORT_HINT

**Emitters**:
- `src/components/consciousness/ConsciousnessTheater.jsx:230`
- `src/components/webgl/WebGLBackground.jsx:671`
- `src/theater/TheaterDirector.js:800`

**Listeners**:
- `src/components/consciousness/ConsciousnessTheater.jsx:173`
- `src/components/consciousness/ConsciousnessTheater.jsx:217`
- `src/components/consciousness/ConsciousnessTheater.jsx:237`
- `src/theater/TheaterDirector.js:411`
- `src/theater/TheaterDirector.js:820`

## FENCEPOST_LISTENERS_READY

**Emitters**:
- `src/theater/controllers/OpeningSequenceController.js:576`

**Listeners**:
- (none)

## MORPH_PROGRESS

**Emitters**:
- `src/engine/modules/ClimaxController.js:249`
- `src/engine/modules/MorphController.js:273`
- `src/state/commands/StateCommands.js:44`
- `src/theater/controllers/MorphAnimationController.js:332`

**Listeners**:
- `src/components/webgl/WebGLBackground.jsx:1668`

## PARTICLES_EMERGED

**Emitters**:
- `src/components/webgl/WebGLBackground.jsx:310`

**Listeners**:
- `src/components/ui/LCPHero.jsx:32`
- `src/theater/controllers/OpeningSequenceController.js:596`

## PARTICLES_START_EMERGING

**Emitters**:
- `src/theater/controllers/OpeningSequenceController.js:557`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:180`

## PARTICLE_PHASE

**Emitters**:
- `src/theater/controllers/OpeningSequenceController.js:441`
- `src/theater/controllers/OpeningSequenceController.js:467`
- `src/theater/controllers/OpeningSequenceController.js:499`

**Listeners**:
- `src/components/webgl/WebGLBackground.jsx:1939`

## PREWARM_COMPLETE

**Emitters**:
- `src/engine/ConsciousnessEngine.js:348`

**Listeners**:
- (none)

## PREWARM_GENESIS_BLUEPRINT

**Emitters**:
- `src/theater/TheaterDirector.js:615`

**Listeners**:
- (none)

## QUALITY_CHANGE

**Emitters**:
- `src/state/atoms/qualityAtom.js:198`
- `src/state/commands/StateCommands.js:195`

**Listeners**:
- (none)

## RENDERER_TUNE

**Emitters**:
- `src/theater/TheaterDirector.js:630`

**Listeners**:
- (none)

## SCREEN_FILL

**Emitters**:
- `src/theater/controllers/OpeningSequenceController.js:364`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:143`

## STAGE_CHANGE

**Emitters**:
- `src/state/commands/StateCommands.js:167`

**Listeners**:
- `src/state/atoms/qualityAtom.js:155`
- `src/theater/TheaterDirector.js:128`
- `src/theater/UnifiedNavigationAPI.js:196`

## START_NARRATIVE

**Emitters**:
- `src/theater/TheaterDirector.js:271`

**Listeners**:
- `src/components/consciousness/ConsciousnessTheater.jsx:194`

## TERMINAL_TYPE

**Emitters**:
- `src/theater/controllers/OpeningSequenceController.js:350`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:102`



---
## 3) Source Evidence

# Source Evidence Scan

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

- `src/components/webgl/WebGLBackground.jsx:717`

```text
715:   }, [emitViewportHint]);
716: 
717:   // Fallback morph sink (outside emergence directives)
718:   const __applyMorph = (v) => {
719:     const mat = materialRef.current;
```

- `src/components/webgl/WebGLBackground.jsx:794`

```text
792:   }, []);
793: 
794:   // Emergence flag (no local tween; engine drives via directives)
795:   useEffect(() => {
796:     const off = BeatBus?.on?.(EVENTS.PARTICLES_START_EMERGING, () => {
```

- `src/components/webgl/WebGLBackground.jsx:1046`

```text
1044:       if (id === lastBlueprintIdRef.current) return;
1045:       lastBlueprintIdRef.current = id;
1046:       const isEmergence = mode === 'emergence' || raw?.mode === 'emergence';
1047:       const isOpeningChaos = mode === 'opening_chaos' || raw?.mode === 'opening_chaos';
1048:       const shouldFastForward = isEmergence && (fastForwardRequested || skipMorph);
```

- `src/components/webgl/WebGLBackground.jsx:1073`

```text
1071:         }
1072:       }
1073:       // ignore late emergence after handoff
1074:       if (isEmergence && emittedEmergedRef.current) return;
1075: 
```

- `src/components/webgl/WebGLBackground.jsx:1233`

```text
1231:       if (mat) {
1232:         applyRendererFits(geo, viewportHintRef.current || viewport);
1233:         logBind(isEmergence ? 'emergence' : 'stage', {
1234:           stage: raw.stageName || st || 'genesis',
1235:           mode: mode || raw?.mode || (isEmergence ? 'emergence' : 'full'),
```

- `src/components/webgl/WebGLBackground.jsx:1235`

```text
1233:         logBind(isEmergence ? 'emergence' : 'stage', {
1234:           stage: raw.stageName || st || 'genesis',
1235:           mode: mode || raw?.mode || (isEmergence ? 'emergence' : 'full'),
1236:           cached: !!cached,
1237:         });
```

- `src/components/webgl/WebGLBackground.jsx:1312`

```text
1310: 
1311:       if (isEmergence) {
1312:         console.log('✅ Renderer: BR(emergence) bound', `count=${raw.particleCount || raw.activeCount}`, `quality=${quality}`);
1313:         emergencePendingRef.current = true;
1314:         emittedEmergedRef.current = false;
```

- `src/components/webgl/WebGLBackground.jsx:1337`

```text
1335:           const source = fastForwardRequested ? 'renderer-fastforward' : 'renderer-skip-morph';
1336:           if (finalizeEmergence(source)) {
1337:             console.log('⚡ Renderer: Emergence fast-forward applied', {
1338:               source,
1339:               cacheKey,
```

- `src/components/webgl/WebGLBackground.jsx:1516`

```text
1514: 
1515:       // ---------- MORPH: start at 0 for FULL binds so we actually see the transition ----------
1516:       const isEmergenceMode = payload?.mode === 'emergence' || payload?.blueprint?.mode === 'emergence';
1517:       const matCurrent = materialRef.current;
1518:       const currentUniforms = matCurrent?.uniforms;
```

- `src/components/webgl/WebGLBackground.jsx:1523`

```text
1521:         const currentStage = director?.getCurrentStage?.() ?? director?.currentStage ?? null;
1522:         const currentPhase = director?.getCurrentPhase?.() ?? director?.phase ?? null;
1523:         const isOpeningPhase = currentStage === 'genesis' && currentPhase !== 'emergence';
1524:         const startMorph = 0.0;
1525: 
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
118:     // Emergence memory
119:     this._lastEmergenceTargets = null;        // live reference used for post-emergence genesis guard
120:     this._lastEmergenceTargetsCache = null;   // stable copy for deterministic re-use
```

- `src/engine/ConsciousnessEngine.js:119`

```text
117: 
118:     // Emergence memory
119:     this._lastEmergenceTargets = null;        // live reference used for post-emergence genesis guard
120:     this._lastEmergenceTargetsCache = null;   // stable copy for deterministic re-use
121:     this._emergenceRaf = null;
```

- `src/engine/ConsciousnessEngine.js:337`

```text
335: 
336:   _onPrewarmGenesis() {
337:     // Clear stale emergence targets so prewarm rebuilds with current VC tuning
338:     this._lastEmergenceTargets = null;
339:     this._lastEmergenceTargetsCache = null;
```

- `src/engine/ConsciousnessEngine.js:398`

```text
396:       this._rendererFencepostSeen = false;
397: 
398:       // Build the emergence blueprint (optionally reusing the last landing targets)
399:       const blueprint = await this.buildEmergenceBlueprint({
400:         ...payload,
```

- `src/engine/ConsciousnessEngine.js:406`

```text
404:       // Validate before proceeding
405:       if (!this._validateBlueprint(blueprint)) {
406:         console.error('🧠 Engine: Invalid emergence blueprint, not emitting');
407:         this._log('emergence_validation_failed');
408:         this._emergenceActive = false;
```

- `src/engine/ConsciousnessEngine.js:413`

```text
411:       }
412: 
413:       // Emit emergence blueprint with mode flag (canonical event)
414:       const variantMode = openingChaosMode ? 'opening_chaos' : 'emergence';
415:       blueprint.mode = 'emergence';
```

- `src/engine/ConsciousnessEngine.js:414`

```text
412: 
413:       // Emit emergence blueprint with mode flag (canonical event)
414:       const variantMode = openingChaosMode ? 'opening_chaos' : 'emergence';
415:       blueprint.mode = 'emergence';
416:       blueprint.metadata = {
```

- `src/engine/ConsciousnessEngine.js:415`

```text
413:       // Emit emergence blueprint with mode flag (canonical event)
414:       const variantMode = openingChaosMode ? 'opening_chaos' : 'emergence';
415:       blueprint.mode = 'emergence';
416:       blueprint.metadata = {
417:         ...(blueprint.metadata || {}),
```

- `src/engine/ConsciousnessEngine.js:418`

```text
416:       blueprint.metadata = {
417:         ...(blueprint.metadata || {}),
418:         mode: 'emergence',
419:         variantMode,
420:       };
```

- `src/engine/ConsciousnessEngine.js:424`

```text
422:         stage: 'genesis',
423:         quality: this.currentQuality,
424:         mode: 'emergence',
425:         variantMode,
426:         cached: false,
```

- `src/engine/ConsciousnessEngine.js:436`

```text
434:       
435:       if (openingChaosMode) {
436:         console.log('🧠 Engine: Opening chaos blueprint emitted', { count: blueprint.particleCount, mode: variantMode });
437:         this._openingPreboundBlueprint = blueprint;
438:         this._log('emergence_built', { count: blueprint.particleCount, mode: variantMode });
```

- `src/engine/ConsciousnessEngine.js:440`

```text
438:         this._log('emergence_built', { count: blueprint.particleCount, mode: variantMode });
439:       } else {
440:         console.log('🧠 Engine: Emergence blueprint emitted', { count: blueprint.particleCount, mode: 'emergence' });
441:         this._openingPreboundBlueprint = null;
442:         this._log('emergence_built', { count: blueprint.particleCount, mode: 'emergence' });
```

- `src/engine/ConsciousnessEngine.js:442`

```text
440:         console.log('🧠 Engine: Emergence blueprint emitted', { count: blueprint.particleCount, mode: 'emergence' });
441:         this._openingPreboundBlueprint = null;
442:         this._log('emergence_built', { count: blueprint.particleCount, mode: 'emergence' });
443:       }
444: 
```

- `src/engine/ConsciousnessEngine.js:445`

```text
443:       }
444: 
445:       // Drive implosion → settle via directives; renderer remains passive
446:       const shouldRunTimeline = !openingChaosMode && !payload.skipMorphAnimation;
447:       if (shouldRunTimeline && !this._startEmergenceTimeline(blueprint)) {
```

- `src/engine/ConsciousnessEngine.js:463`

```text
461: 
462:   _startEmergenceTimeline(bp) {
463:     console.log('🌀 [Engine] Starting emergence timeline, delegating to MorphController');
464:     if (!this.#morphController) {
465:       console.error('[ConsciousnessEngine] MorphController not initialized');
```

- `src/engine/ConsciousnessEngine.js:494`

```text
492: 
493:     if (blueprint.particleCount > 0) {
494:       const rnd = createSeededRandom(`emergence-${mode || 'default'}-${quality || 'HIGH'}`);
495:       for (let i = 0; i < blueprint.particleCount; i++) {
496:         const j = i * 3;
```

- `src/engine/ConsciousnessEngine.js:575`

```text
573: 
574:   /**
575:    * Build + emit the Emergence blueprint for the opening sequence.
576:    */
577:   async buildEmergenceBlueprint(options = {}) {
```

- `src/engine/ConsciousnessEngine.js:579`

```text
577:   async buildEmergenceBlueprint(options = {}) {
578:     const {
579:       mode: requestedMode = 'emergence',
580:       source = 'viewportSpread',
581:       target = 'constellation',
```

- `src/engine/ConsciousnessEngine.js:625`

```text
623:       targetPositions = reuseLastTargets.slice(0, blueprintCount * 3);
624:       this._lastText3DFallbackUsed = false;
625:       console.log('🧠 Engine: Reusing cached emergence targets for deterministic landing');
626:     } else {
627:       try {
```

- `src/engine/ConsciousnessEngine.js:636`

```text
634:           usedFallback = this._lastText3DFallbackUsed;
635:           if (usedFallback) {
636:             console.warn('⚠️ Emergence used text3D FALLBACK (band). FontReady:', this._fontReady);
637:           }
638:         } else {
```

- `src/engine/ConsciousnessEngine.js:704`

```text
702: 
703:     const variantMode = requestedMode;
704:     const emissionMode = 'emergence';
705: 
706:     blueprint.metadata = {
```

- `src/engine/ConsciousnessEngine.js:719`

```text
717:       targetState: targetState || null,
718:       note: usedFallback
719:         ? 'Emergence used fallback band (font not ready); cache will be cleared on font load.'
720:         : 'Emergence endpoints separated: random atmospheric → 3D text target',
721:     };
```

- `src/engine/ConsciousnessEngine.js:720`

```text
718:       note: usedFallback
719:         ? 'Emergence used fallback band (font not ready); cache will be cleared on font load.'
720:         : 'Emergence endpoints separated: random atmospheric → 3D text target',
721:     };
722: 
```

- `src/engine/ConsciousnessEngine.js:750`

```text
748: 
749:     if (this._emergenceActive && stage !== 'genesis') {
750:       console.warn('🧠 Engine: rebuild blocked during emergence timeline', { stage, quality });
751:       this._log('rebuild_blocked_emergence', { stage, quality });
752:       return;
```

- `src/engine/ConsciousnessEngine.js:758`

```text
756:     let blueprint = this.blueprintCache.get(cacheKey);
757: 
758:     // Post-emergence genesis: optionally preserve settled emergence
759:     if (stage === 'genesis' && this._lastEmergenceTargets) {
760:       if (this._lastText3DFallbackUsed) {
```

- `src/engine/ConsciousnessEngine.js:761`

```text
759:     if (stage === 'genesis' && this._lastEmergenceTargets) {
760:       if (this._lastText3DFallbackUsed) {
761:         console.warn('🧠 Engine: Emergence fallback detected; skipping preserve');
762:         this._lastEmergenceTargets = null;
763:         this._emergenceDone = false;
```

- `src/engine/ConsciousnessEngine.js:766`

```text
764:         this._rendererFencepostSeen = false;
765:       } else if (!this._emergenceDone) {
766:         console.warn('🧠 Engine: Emergence incomplete; rebuilding genesis cleanly');
767:         this._lastEmergenceTargets = null;
768:         this._emergenceDone = false;
```

- `src/engine/ConsciousnessEngine.js:776`

```text
774:         this._rendererFencepostSeen = false;
775:       } else {
776:         console.log('🧠 Engine: Building post-emergence genesis (preserving emergence result)');
777: 
778:         const emergenceCount = Math.max(0, Math.floor(this._lastEmergenceTargets.length / 3));
```

- `src/engine/ConsciousnessEngine.js:817`

```text
815:               stage,
816:               quality,
817:               mode: 'post-emergence-guarded',
818:               cacheKey,
819:               preservedEmergence: true,
```

- `src/engine/ConsciousnessEngine.js:822`

```text
820:             });
821:             this._preloadNextStage(stage, quality);
822:             this._log('blueprint_emitted', { stage, quality, cacheKey, mode: 'post-emergence-guarded' });
823:             this._rendererFencepostSeen = false;
824:             return;
```

- `src/engine/ConsciousnessEngine.js:1015`

```text
1013:           console.log(`✅ 3D font loaded from ${usedUrl}; cleared text3D cache (was ${oldSize} entries)`);
1014:           try {
1015:             if (this._lastText3DFallbackUsed && this._lastBlueprint?.metadata?.mode === 'emergence') {
1016:               console.log('🔁 Rebuilding emergence with real text3D now that font is ready…');
1017:               this.buildEmergenceBlueprint({ mode: 'emergence' });
```

- `src/engine/ConsciousnessEngine.js:1016`

```text
1014:           try {
1015:             if (this._lastText3DFallbackUsed && this._lastBlueprint?.metadata?.mode === 'emergence') {
1016:               console.log('🔁 Rebuilding emergence with real text3D now that font is ready…');
1017:               this.buildEmergenceBlueprint({ mode: 'emergence' });
1018:             }
```

- `src/engine/ConsciousnessEngine.js:1017`

```text
1015:             if (this._lastText3DFallbackUsed && this._lastBlueprint?.metadata?.mode === 'emergence') {
1016:               console.log('🔁 Rebuilding emergence with real text3D now that font is ready…');
1017:               this.buildEmergenceBlueprint({ mode: 'emergence' });
1018:             }
1019:           } catch {}
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

- `src/state/commands/StateCommands.js:256`

```text
254:   }
255: 
256:   // Programmatic emergence trigger (only for opening sequence)
257:   triggerEmergence(payload = {}) {
258:     if (!this.canEmit('BUILD_EMERGENCE_BLUEPRINT')) {
```

- `src/state/commands/StateCommands.js:259`

```text
257:   triggerEmergence(payload = {}) {
258:     if (!this.canEmit('BUILD_EMERGENCE_BLUEPRINT')) {
259:       console.error('[StateCommands] Cannot trigger emergence - contract violation');
260:       return false;
261:     }
```

- `src/state/commands/StateCommands.js:265`

```text
263:     this.recordEmission('BUILD_EMERGENCE_BLUEPRINT');
264:     BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {
265:       mode: 'emergence',
266:       source: 'viewportSpread',
267:       target: 'constellation',
```

- `src/theater/ScrollOrchestrator.js:297`

```text
295:       const local = clamp01((easedPct - start) / Math.max(1, end - start));
296: 
297:       // v3.5 adjustment: keep genesis fully formed (no post-emergence un-morph)
298:       if (stageIdx === 0) {
299:         this.morphTarget = 1;
```

- `src/theater/TheaterDirector.js:90`

```text
88:       console.log('📋 [OPENING TIMELINE]', {
89:         hasTimeline: !!openingProbe?.timeline,
90:         chaos: openingProbe?.timeline?.chaos,
91:         coalesce: openingProbe?.timeline?.coalesce,
92:         settle: openingProbe?.timeline?.settle,
```

- `src/theater/TheaterDirector.js:91`

```text
89:         hasTimeline: !!openingProbe?.timeline,
90:         chaos: openingProbe?.timeline?.chaos,
91:         coalesce: openingProbe?.timeline?.coalesce,
92:         settle: openingProbe?.timeline?.settle,
93:         hasChaosConfig: !!openingProbe?.timeline?.chaos,
```

- `src/theater/TheaterDirector.js:92`

```text
90:         chaos: openingProbe?.timeline?.chaos,
91:         coalesce: openingProbe?.timeline?.coalesce,
92:         settle: openingProbe?.timeline?.settle,
93:         hasChaosConfig: !!openingProbe?.timeline?.chaos,
94:       });
```

- `src/theater/TheaterDirector.js:93`

```text
91:         coalesce: openingProbe?.timeline?.coalesce,
92:         settle: openingProbe?.timeline?.settle,
93:         hasChaosConfig: !!openingProbe?.timeline?.chaos,
94:       });
95:     } catch (timelineError) {
```

- `src/theater/TheaterDirector.js:452`

```text
450: 
451:     const segments = [
452:       `black ${snapshotTimeline.blackout?.durationMs ?? 0}ms`,
453:       `cursor blink x${snapshotTimeline.cursor?.blinkCount ?? 0} @ ${snapshotTimeline.cursor?.intervalMs ?? 0}ms`,
454:       `typing ~${snapshotTypingDuration}ms`,
```

- `src/theater/TheaterDirector.js:453`

```text
451:     const segments = [
452:       `black ${snapshotTimeline.blackout?.durationMs ?? 0}ms`,
453:       `cursor blink x${snapshotTimeline.cursor?.blinkCount ?? 0} @ ${snapshotTimeline.cursor?.intervalMs ?? 0}ms`,
454:       `typing ~${snapshotTypingDuration}ms`,
455:       `fill ${snapshotTimeline.fill?.durationMs ?? 0}ms`,
```

- `src/theater/TheaterDirector.js:456`

```text
454:       `typing ~${snapshotTypingDuration}ms`,
455:       `fill ${snapshotTimeline.fill?.durationMs ?? 0}ms`,
456:       `emergence ${openingSnapshot?.emergence?.durationMs ?? 0}ms`,
457:     ];
458: 
```

- `src/theater/TheaterDirector.js:593`

```text
591:     // Warn about early cancellation in development
592:     if (import.meta?.env?.DEV) {
593:       if (this.phase === 'black' || this.phase === 'cursor' || this.phase === 'terminal') {
594:         console.warn('🎬 Director: WARNING - Cancelling during early phase:', this.phase);
595:         console.warn('   This may be caused by HMR or effect cleanup');
```

- `src/theater/TheaterDirector.js:874`

```text
872:       required: ['stage', 'quality', 'blueprint'],
873:       optional: ['cached', 'mode'],
874:       notes: 'Renderer consumes stage/quality/blueprint; mode=emergence for special handling.',
875:     },
876:     BUILD_EMERGENCE_BLUEPRINT: {
```

- `src/theater/TheaterDirector.js:879`

```text
877:       required: ['mode', 'source', 'target', 'count'],
878:       optional: ['tierRatios', 'viewportHint'],
879:       notes: 'Corrected contract for viewport spread → constellation emergence.',
880:     },
881:   },
```

- `src/theater/controllers/OpeningSequenceController.js:5`

```text
3:  *
4:  * Manages the complete opening timeline:
5:  * Black → Cursor → Terminal → Fill → Chaos → Coalesce → Settle → Emergence
6:  *
7:  * Extracted from TheaterDirector for code splitting.
```

- `src/theater/controllers/OpeningSequenceController.js:31`

```text
29: const DEFAULT_OPENING_TIMELINE = {
30:   blackout: { durationMs: 2000 },
31:   cursor: { blinkCount: 2, intervalMs: 500, leadInMs: 500, settleMs: 1000 },
32:   typing: { lines: DEFAULT_TYPING_LINES, typeSpeed: 50, lineDelay: 500, completionDelayMs: 800 },
33:   fill: { text: null, scrollSpeed: 100, durationMs: 2000 },
```

- `src/theater/controllers/OpeningSequenceController.js:34`

```text
32:   typing: { lines: DEFAULT_TYPING_LINES, typeSpeed: 50, lineDelay: 500, completionDelayMs: 800 },
33:   fill: { text: null, scrollSpeed: 100, durationMs: 2000 },
34:   chaos: { enabled: true, durationMs: 2000, rendererSpin: { z: 0.5, y: 0.2 } },
35:   coalesce: { enabled: true, durationMs: 2000, morphTo: 0.6 },
36:   settle: { enabled: true, durationMs: 1500, morphTo: 1.0 },
```

- `src/theater/controllers/OpeningSequenceController.js:35`

```text
33:   fill: { text: null, scrollSpeed: 100, durationMs: 2000 },
34:   chaos: { enabled: true, durationMs: 2000, rendererSpin: { z: 0.5, y: 0.2 } },
35:   coalesce: { enabled: true, durationMs: 2000, morphTo: 0.6 },
36:   settle: { enabled: true, durationMs: 1500, morphTo: 1.0 },
37:   emergence: {
```

- `src/theater/controllers/OpeningSequenceController.js:36`

```text
34:   chaos: { enabled: true, durationMs: 2000, rendererSpin: { z: 0.5, y: 0.2 } },
35:   coalesce: { enabled: true, durationMs: 2000, morphTo: 0.6 },
36:   settle: { enabled: true, durationMs: 1500, morphTo: 1.0 },
37:   emergence: {
38:     durationMs: 2000,
```

- `src/theater/controllers/OpeningSequenceController.js:37`

```text
35:   coalesce: { enabled: true, durationMs: 2000, morphTo: 0.6 },
36:   settle: { enabled: true, durationMs: 1500, morphTo: 1.0 },
37:   emergence: {
38:     durationMs: 2000,
39:     waitForFencepost: true,
```

- `src/theater/controllers/OpeningSequenceController.js:50`

```text
48: const DEFAULT_OPENING_EMERGENCE = {
49:   target: 'constellation',
50:   mode: 'emergence',
51:   source: 'viewportSpread',
52: };
```

- `src/theater/controllers/OpeningSequenceController.js:88`

```text
86:         ...(stageTimeline.blackout ?? {}),
87:       },
88:       cursor: {
89:         ...DEFAULT_OPENING_TIMELINE.cursor,
90:         ...(openingTimeline.cursor ?? {}),
```

- `src/theater/controllers/OpeningSequenceController.js:89`

```text
87:       },
88:       cursor: {
89:         ...DEFAULT_OPENING_TIMELINE.cursor,
90:         ...(openingTimeline.cursor ?? {}),
91:         ...(stageTimeline.cursor ?? {}),
```

- `src/theater/controllers/OpeningSequenceController.js:90`

```text
88:       cursor: {
89:         ...DEFAULT_OPENING_TIMELINE.cursor,
90:         ...(openingTimeline.cursor ?? {}),
91:         ...(stageTimeline.cursor ?? {}),
92:       },
```

- `src/theater/controllers/OpeningSequenceController.js:91`

```text
89:         ...DEFAULT_OPENING_TIMELINE.cursor,
90:         ...(openingTimeline.cursor ?? {}),
91:         ...(stageTimeline.cursor ?? {}),
92:       },
93:       typing: {
```

- `src/theater/controllers/OpeningSequenceController.js:103`

```text
101:         ...(stageTimeline.fill ?? {}),
102:       },
103:       chaos: {
104:         ...DEFAULT_OPENING_TIMELINE.chaos,
105:         ...(openingTimeline.chaos ?? {}),
```

- `src/theater/controllers/OpeningSequenceController.js:104`

```text
102:       },
103:       chaos: {
104:         ...DEFAULT_OPENING_TIMELINE.chaos,
105:         ...(openingTimeline.chaos ?? {}),
106:         ...(stageTimeline.chaos ?? {}),
```

- `src/theater/controllers/OpeningSequenceController.js:105`

```text
103:       chaos: {
104:         ...DEFAULT_OPENING_TIMELINE.chaos,
105:         ...(openingTimeline.chaos ?? {}),
106:         ...(stageTimeline.chaos ?? {}),
107:       },
```

- `src/theater/controllers/OpeningSequenceController.js:106`

```text
104:         ...DEFAULT_OPENING_TIMELINE.chaos,
105:         ...(openingTimeline.chaos ?? {}),
106:         ...(stageTimeline.chaos ?? {}),
107:       },
108:       coalesce: {
```

- `src/theater/controllers/OpeningSequenceController.js:108`

```text
106:         ...(stageTimeline.chaos ?? {}),
107:       },
108:       coalesce: {
109:         ...DEFAULT_OPENING_TIMELINE.coalesce,
110:         ...(openingTimeline.coalesce ?? {}),
```

- `src/theater/controllers/OpeningSequenceController.js:109`

```text
107:       },
108:       coalesce: {
109:         ...DEFAULT_OPENING_TIMELINE.coalesce,
110:         ...(openingTimeline.coalesce ?? {}),
111:         ...(stageTimeline.coalesce ?? {}),
```

- `src/theater/controllers/OpeningSequenceController.js:110`

```text
108:       coalesce: {
109:         ...DEFAULT_OPENING_TIMELINE.coalesce,
110:         ...(openingTimeline.coalesce ?? {}),
111:         ...(stageTimeline.coalesce ?? {}),
112:       },
```

- `src/theater/controllers/OpeningSequenceController.js:111`

```text
109:         ...DEFAULT_OPENING_TIMELINE.coalesce,
110:         ...(openingTimeline.coalesce ?? {}),
111:         ...(stageTimeline.coalesce ?? {}),
112:       },
113:       settle: {
```

- `src/theater/controllers/OpeningSequenceController.js:113`

```text
111:         ...(stageTimeline.coalesce ?? {}),
112:       },
113:       settle: {
114:         ...DEFAULT_OPENING_TIMELINE.settle,
115:         ...(openingTimeline.settle ?? {}),
```

- `src/theater/controllers/OpeningSequenceController.js:114`

```text
112:       },
113:       settle: {
114:         ...DEFAULT_OPENING_TIMELINE.settle,
115:         ...(openingTimeline.settle ?? {}),
116:         ...(stageTimeline.settle ?? {}),
```

- `src/theater/controllers/OpeningSequenceController.js:115`

```text
113:       settle: {
114:         ...DEFAULT_OPENING_TIMELINE.settle,
115:         ...(openingTimeline.settle ?? {}),
116:         ...(stageTimeline.settle ?? {}),
117:       },
```

- `src/theater/controllers/OpeningSequenceController.js:116`

```text
114:         ...DEFAULT_OPENING_TIMELINE.settle,
115:         ...(openingTimeline.settle ?? {}),
116:         ...(stageTimeline.settle ?? {}),
117:       },
118:       profile: stageTimeline.profile ?? openingTimeline.profile ?? null,
```

- `src/theater/controllers/OpeningSequenceController.js:123`

```text
121:     };
122: 
123:     const emergenceTimeline = stageTimeline.emergence ?? openingTimeline.emergence ?? {};
124:     const fallbackSkipKey = 'SPACE';
125: 
```

- `src/theater/controllers/OpeningSequenceController.js:134`

```text
132:       totalDurationMs: stageTimeline.totalDurationMs ?? opening.totalDurationMs ?? null,
133:       timeline,
134:       emergence: { ...DEFAULT_OPENING_EMERGENCE, ...emergenceTimeline },
135:     };
136:   }
```

- `src/theater/controllers/OpeningSequenceController.js:195`

```text
193: 
194:     const opening = this.getOpeningConfig();
195:     const { timeline, skipKey, emergence: openingEmergence } = opening ?? {};
196: 
197:     // Phase configuration
```

- `src/theater/controllers/OpeningSequenceController.js:204`

```text
202: 
203:     const cursorConfig = {
204:       ...DEFAULT_OPENING_TIMELINE.cursor,
205:       ...(timeline?.cursor ?? {}),
206:     };
```

- `src/theater/controllers/OpeningSequenceController.js:205`

```text
203:     const cursorConfig = {
204:       ...DEFAULT_OPENING_TIMELINE.cursor,
205:       ...(timeline?.cursor ?? {}),
206:     };
207:     const cursorLeadInMs = Math.max(0, Number(cursorConfig.leadInMs ?? 0));
```

- `src/theater/controllers/OpeningSequenceController.js:211`

```text
209:     const cursorBlinkCount = Math.max(
210:       0,
211:       Number(cursorConfig.blinkCount ?? DEFAULT_OPENING_TIMELINE.cursor.blinkCount),
212:     );
213:     const cursorIntervalMs = Math.max(
```

- `src/theater/controllers/OpeningSequenceController.js:215`

```text
213:     const cursorIntervalMs = Math.max(
214:       0,
215:       Number(cursorConfig.intervalMs ?? DEFAULT_OPENING_TIMELINE.cursor.intervalMs),
216:     );
217:     const cursorHumVolume = Number.isFinite(cursorConfig.humVolume) ? cursorConfig.humVolume : 0.25;
```

- `src/theater/controllers/OpeningSequenceController.js:263`

```text
261:     }
262: 
263:     const chaosConfig = timeline?.chaos || {};
264:     const coalesceConfig = timeline?.coalesce || {};
265:     const settleConfig = timeline?.settle || {};
```

- `src/theater/controllers/OpeningSequenceController.js:264`

```text
262: 
263:     const chaosConfig = timeline?.chaos || {};
264:     const coalesceConfig = timeline?.coalesce || {};
265:     const settleConfig = timeline?.settle || {};
266: 
```

- `src/theater/controllers/OpeningSequenceController.js:265`

```text
263:     const chaosConfig = timeline?.chaos || {};
264:     const coalesceConfig = timeline?.coalesce || {};
265:     const settleConfig = timeline?.settle || {};
266: 
267:     const emergenceTimeline = {
```

- `src/theater/controllers/OpeningSequenceController.js:268`

```text
266: 
267:     const emergenceTimeline = {
268:       ...DEFAULT_OPENING_TIMELINE.emergence,
269:       ...(timeline?.emergence ?? {}),
270:     };
```

- `src/theater/controllers/OpeningSequenceController.js:269`

```text
267:     const emergenceTimeline = {
268:       ...DEFAULT_OPENING_TIMELINE.emergence,
269:       ...(timeline?.emergence ?? {}),
270:     };
271:     emergenceTimeline.durationMs = Math.max(
```

- `src/theater/controllers/OpeningSequenceController.js:273`

```text
271:     emergenceTimeline.durationMs = Math.max(
272:       0,
273:       Number(emergenceTimeline.durationMs ?? DEFAULT_OPENING_TIMELINE.emergence.durationMs),
274:     );
275:     emergenceTimeline.maxWaitMs = Math.max(
```

- `src/theater/controllers/OpeningSequenceController.js:277`

```text
275:     emergenceTimeline.maxWaitMs = Math.max(
276:       0,
277:       Number(emergenceTimeline.maxWaitMs ?? DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs),
278:     );
279:     const fencepostWaitMs = emergenceTimeline.maxWaitMs || DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs;
```

- `src/theater/controllers/OpeningSequenceController.js:279`

```text
277:       Number(emergenceTimeline.maxWaitMs ?? DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs),
278:     );
279:     const fencepostWaitMs = emergenceTimeline.maxWaitMs || DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs;
280:     const waitForFencepost = emergenceTimeline.waitForFencepost !== false;
281:     const shouldWaitForFencepost = waitForFencepost && !this.director._openingPrebound;
```

- `src/theater/controllers/OpeningSequenceController.js:284`

```text
282:     const stabilizeMs = Math.max(
283:       0,
284:       Number(emergenceTimeline.stabilizeMs ?? DEFAULT_OPENING_TIMELINE.emergence.stabilizeMs ?? 0),
285:     );
286:     const skipMorphAnimation = emergenceTimeline.skipMorphAnimation === true;
```

- `src/theater/controllers/OpeningSequenceController.js:288`

```text
286:     const skipMorphAnimation = emergenceTimeline.skipMorphAnimation === true;
287:     const skipGenesisBlueprint = emergenceTimeline.skipGenesisBlueprint !== false;
288:     const targetState = emergenceTimeline.targetState || DEFAULT_OPENING_TIMELINE.emergence.targetState;
289: 
290:     const emergenceConfig = { ...DEFAULT_OPENING_EMERGENCE, ...(openingEmergence ?? {}) };
```

- `src/theater/controllers/OpeningSequenceController.js:319`

```text
317: 
318:     try {
319:       this.director.phase = 'black';
320:       console.log(`   Phase: Black screen (${blackoutDuration}ms)`);
321:       if (blackoutDuration > 0) {
```

- `src/theater/controllers/OpeningSequenceController.js:320`

```text
318:     try {
319:       this.director.phase = 'black';
320:       console.log(`   Phase: Black screen (${blackoutDuration}ms)`);
321:       if (blackoutDuration > 0) {
322:         const waitResult = await this.director.sleep(blackoutDuration);
```

- `src/theater/controllers/OpeningSequenceController.js:326`

```text
324:       }
325:       if (skipTriggered) {
326:         console.log(`   Skip triggered before cursor phase (key: ${skipLabel})`);
327:       }
328: 
```

- `src/theater/controllers/OpeningSequenceController.js:330`

```text
328: 
329:       if (!skipTriggered) {
330:         this.director.phase = 'cursor';
331:         console.log(`   Phase: Cursor (blink x${cursorBlinkCount} @ ${cursorIntervalMs}ms)`);
332:         BeatBus.emit(EVENTS.CURSOR_SHOW);
```

- `src/theater/controllers/OpeningSequenceController.js:331`

```text
329:       if (!skipTriggered) {
330:         this.director.phase = 'cursor';
331:         console.log(`   Phase: Cursor (blink x${cursorBlinkCount} @ ${cursorIntervalMs}ms)`);
332:         BeatBus.emit(EVENTS.CURSOR_SHOW);
333:         BeatBus.emit(EVENTS.AUDIO_COMPUTER_HUM, { volume: cursorHumVolume });
```

- `src/theater/controllers/OpeningSequenceController.js:350`

```text
348:         this.director.phase = 'terminal';
349:         console.log(`   Phase: Terminal typing (~${typingDuration}ms)`);
350:         BeatBus.emit(EVENTS.TERMINAL_TYPE, typingConfig);
351:         if (typingDuration > 0) {
352:           const waitResult = await this.director.sleep(typingDuration);
```

- `src/theater/controllers/OpeningSequenceController.js:364`

```text
362:         this.director.phase = 'fill';
363:         console.log(`   Phase: Screen fill (${fillConfig.durationMs}ms)`);
364:         BeatBus.emit(EVENTS.SCREEN_FILL, { text: fillConfig.text, scrollSpeed: fillConfig.scrollSpeed });
365:         if (fillConfig.durationMs > 0) {
366:           const waitResult = await this.director.sleep(fillConfig.durationMs);
```

- `src/theater/controllers/OpeningSequenceController.js:372`

```text
370: 
371:       if (!skipTriggered && chaosConfig?.enabled !== false) {
372:         console.log('🔍 [ABOUT TO START CHAOS]', {
373:           chaosConfig,
374:           currentMorph: currentMorphValue,
```

- `src/theater/controllers/OpeningSequenceController.js:379`

```text
377:         if (!this.director._openingPrebound) {
378:           try {
379:             console.log('   Phase: Pre-chaos blueprint bind');
380:             BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {
381:               mode: 'opening_chaos',
```

- `src/theater/controllers/OpeningSequenceController.js:394`

```text
392:             this.director._openingPrebound = true;
393:           } catch (bindError) {
394:             console.warn('🎬 Director: Pre-chaos blueprint bind failed', bindError);
395:           }
396:           const bindSettleMs = Math.max(0, Number(chaosConfig?.bindLeadInMs ?? 120));
```

- `src/theater/controllers/OpeningSequenceController.js:421`

```text
419:                   const stageName = payload?.stage || blueprint?.stage || blueprint?.stageName;
420:                   const mode = payload?.mode || blueprint?.mode;
421:                   return stageName === 'genesis' && mode !== 'emergence';
422:                 },
423:               })
```

- `src/theater/controllers/OpeningSequenceController.js:428`

```text
426: 
427:           if (!readinessResult) {
428:             console.warn('⚠️ Director: Pre-chaos renderer readiness timed out');
429:           } else {
430:             console.log('✅ Blueprint bound and particles ready', {
```

- `src/theater/controllers/OpeningSequenceController.js:439`

```text
437: 
438:         const chaosDuration = Math.max(0, Number(chaosConfig.durationMs) || 0);
439:         this.director.phase = 'chaos';
440:         console.log(`   Phase: Chaos (${chaosDuration}ms)`);
441:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
```

- `src/theater/controllers/OpeningSequenceController.js:440`

```text
438:         const chaosDuration = Math.max(0, Number(chaosConfig.durationMs) || 0);
439:         this.director.phase = 'chaos';
440:         console.log(`   Phase: Chaos (${chaosDuration}ms)`);
441:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
442:           name: 'chaos',
```

- `src/theater/controllers/OpeningSequenceController.js:442`

```text
440:         console.log(`   Phase: Chaos (${chaosDuration}ms)`);
441:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
442:           name: 'chaos',
443:           duration: chaosDuration,
444:           rendererSpin: chaosConfig.rendererSpin || null,
```

- `src/theater/controllers/OpeningSequenceController.js:447`

```text
445:         });
446:         const chaosTarget = Number.isFinite(chaosConfig.morphTo) ? clamp01(chaosConfig.morphTo) : 0.0;
447:         const chaosAnimation = animateMorph(currentMorphValue, chaosTarget, chaosDuration, 'chaos');
448:         if (chaosDuration > 0) {
449:           const waitResult = await this.director.sleep(chaosDuration);
```

- `src/theater/controllers/OpeningSequenceController.js:459`

```text
457: 
458:       if (!skipTriggered && coalesceConfig?.enabled !== false) {
459:         console.log('🔍 [ABOUT TO START COALESCE]', {
460:           coalesceConfig,
461:           currentMorph: currentMorphValue,
```

- `src/theater/controllers/OpeningSequenceController.js:465`

```text
463:         });
464:         const coalesceDuration = Math.max(0, Number(coalesceConfig.durationMs) || 0);
465:         this.director.phase = 'coalesce';
466:         console.log(`   Phase: Coalesce (${coalesceDuration}ms → morph ${coalesceConfig.morphTo ?? '—'})`);
467:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
```

- `src/theater/controllers/OpeningSequenceController.js:466`

```text
464:         const coalesceDuration = Math.max(0, Number(coalesceConfig.durationMs) || 0);
465:         this.director.phase = 'coalesce';
466:         console.log(`   Phase: Coalesce (${coalesceDuration}ms → morph ${coalesceConfig.morphTo ?? '—'})`);
467:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
468:           name: 'coalesce',
```

- `src/theater/controllers/OpeningSequenceController.js:468`

```text
466:         console.log(`   Phase: Coalesce (${coalesceDuration}ms → morph ${coalesceConfig.morphTo ?? '—'})`);
467:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
468:           name: 'coalesce',
469:           duration: coalesceDuration,
470:           morphTarget: typeof coalesceConfig.morphTo === 'number' ? coalesceConfig.morphTo : null,
```

- `src/theater/controllers/OpeningSequenceController.js:476`

```text
474:         let coalesceAnimation = null;
475:         if (hasCoalesceTarget) {
476:           coalesceAnimation = animateMorph(currentMorphValue, coalesceTarget, coalesceDuration, 'coalesce');
477:         } else {
478:           emitMorphSnapshot(currentMorphValue, 'coalesce', coalesceTarget, coalesceDuration);
```

- `src/theater/controllers/OpeningSequenceController.js:478`

```text
476:           coalesceAnimation = animateMorph(currentMorphValue, coalesceTarget, coalesceDuration, 'coalesce');
477:         } else {
478:           emitMorphSnapshot(currentMorphValue, 'coalesce', coalesceTarget, coalesceDuration);
479:         }
480:         if (coalesceDuration > 0) {
```

- `src/theater/controllers/OpeningSequenceController.js:491`

```text
489: 
490:       if (!skipTriggered && settleConfig?.enabled !== false) {
491:         console.log('🔍 [ABOUT TO START SETTLE]', {
492:           settleConfig,
493:           currentMorph: currentMorphValue,
```

- `src/theater/controllers/OpeningSequenceController.js:497`

```text
495:         });
496:         const settleDuration = Math.max(0, Number(settleConfig.durationMs) || 0);
497:         this.director.phase = 'settle';
498:         console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
499:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
```

- `src/theater/controllers/OpeningSequenceController.js:498`

```text
496:         const settleDuration = Math.max(0, Number(settleConfig.durationMs) || 0);
497:         this.director.phase = 'settle';
498:         console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
499:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
500:           name: 'settle',
```

- `src/theater/controllers/OpeningSequenceController.js:500`

```text
498:         console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
499:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
500:           name: 'settle',
501:           duration: settleDuration,
502:           morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
```

- `src/theater/controllers/OpeningSequenceController.js:508`

```text
506:         let settleAnimation = null;
507:         if (hasSettleTarget) {
508:           settleAnimation = animateMorph(currentMorphValue, settleTarget, settleDuration, 'settle');
509:         } else {
510:           emitMorphSnapshot(currentMorphValue, 'settle', settleTarget, settleDuration);
```

- `src/theater/controllers/OpeningSequenceController.js:510`

```text
508:           settleAnimation = animateMorph(currentMorphValue, settleTarget, settleDuration, 'settle');
509:         } else {
510:           emitMorphSnapshot(currentMorphValue, 'settle', settleTarget, settleDuration);
511:         }
512:         if (settleDuration > 0) {
```

- `src/theater/controllers/OpeningSequenceController.js:523`

```text
521: 
522:       if (skipTriggered) {
523:         console.log(`   Opening skip engaged (${this._skipOrigin ?? 'user'}) → fast-forwarding to emergence.`);
524:         if (currentMorphValue < 1) {
525:           emitMorphSnapshot(1, 'skip-fast-forward', 1, 0);
```

- `src/theater/controllers/OpeningSequenceController.js:531`

```text
529:       }
530: 
531:       this.director.phase = 'emergence';
532:       const reusePreboundBlueprint = this.director._openingPrebound === true;
533:       console.log(
```

- `src/theater/controllers/OpeningSequenceController.js:534`

```text
532:       const reusePreboundBlueprint = this.director._openingPrebound === true;
533:       console.log(
534:         `   Phase: Particle emergence (${reusePreboundBlueprint ? 'reusing pre-bound blueprint' : 'SST governed'})`,
535:       );
536: 
```

- `src/theater/controllers/OpeningSequenceController.js:554`

```text
552:         });
553:       } else {
554:         emitMorphSnapshot(currentMorphValue, 'emergence', 1, emergenceTimeline.durationMs);
555:       }
556: 
```

- `src/theater/controllers/OpeningSequenceController.js:611`

```text
609:             const mode = payload?.mode || blueprint?.mode;
610:             const isGenesis = stage === 'genesis';
611:             const isEmergenceMode = mode === 'emergence';
612:             if (!isGenesis || isEmergenceMode) return;
613:             console.log('   Fallback: BLUEPRINT_READY (genesis full) before fencepost');
```

- `src/theater/controllers/OpeningSequenceController.js:635`

```text
633:       const toStage = 'genesis';
634:       this.director.phase = 'genesis';
635:       const previousStage = this.director.currentStage ?? 'emergence';
636:       console.log('🧬 Phase: Genesis stage handoff');
637: 
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

- `src/components/consciousness/ConsciousnessTheater.jsx:265`

```text
263:         nav.navigateToStage(targetStage, {
264:           smooth: true,
265:           skipNarration: false,
266:           source,
267:         });
```

- `src/components/narrative/NarrationController.jsx:461`

```text
459:         if (DEBUG_NARRATION) {
460:           const preview = text.length > 50 ? `${text.slice(0, 50)}…` : text;
461:           console.log('🎙️ [BEAT FIRED]', {
462:             stage: stageName,
463:             segmentIndex,
```

- `src/components/narrative/NarrationController.jsx:549`

```text
547:             : Date.now();
548: 
549:         BeatBus.emit?.(EVENTS.NARRATIVE_LINE, {
550:           stage: stageName,
551:           segmentId: segment?.id ?? null,
```

- `src/components/narrative/NarrationController.jsx:691`

```text
689:   );
690: 
691:   const skipNarration = useCallback(
692:     (origin = 'skip') => {
693:       if (origin === 'external' && !isControlAllowed('narration:control')) {
```

- `src/components/narrative/NarrationController.jsx:801`

```text
799:           enumerable: true,
800:         },
801:         skipNarration: {
802:           value: () => skipNarration('external'),
803:           enumerable: true,
```

- `src/components/narrative/NarrationController.jsx:802`

```text
800:         },
801:         skipNarration: {
802:           value: () => skipNarration('external'),
803:           enumerable: true,
804:         },
```

- `src/components/narrative/NarrationController.jsx:835`

```text
833:     exposeControlSurface('narrationController', controllerFactory, {
834:       playNarration: 'narration:control',
835:       skipNarration: 'narration:control',
836:     });
837: 
```

- `src/components/narrative/NarrationController.jsx:856`

```text
854:       revokeControlSurface('narrationController');
855:     };
856:   }, [skipNarration, startNarration]);
857: 
858:   useEffect(() => {
```

- `src/components/narrative/NarrationController.jsx:865`

```text
863:       autoAdvanceEnabled,
864:       resetStateId: resetState,
865:       skipNarrationId: skipNarration,
866:       startNarrationId: startNarration,
867:     };
```

- `src/components/narrative/NarrationController.jsx:971`

```text
969:       event.preventDefault?.();
970:       event.stopPropagation?.();
971:       skipNarration('space');
972:     };
973: 
```

- `src/components/narrative/NarrationController.jsx:988`

```text
986:       resetState();
987:     };
988:   }, [currentStage, resetState, skipNarration, startNarration]);
989: 
990:   useEffect(() => {
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

- `src/orchestration/navigation/narrativeNavigation.js:42`

```text
40:     .navigateToStage(stageName, {
41:       smooth,
42:       skipNarration: !emitNarration,
43:       source: 'narrative_navigation',
44:     })
```

- `src/orchestration/navigation/narrativeNavigation.js:116`

```text
114:     .navigateToStage(nextStageName, {
115:       smooth: true,
116:       skipNarration: false,
117:       source: 'narrative_navigation_next',
118:     })
```

- `src/orchestration/navigation/narrativeNavigation.js:138`

```text
136:     .navigateToStage(prevStageName, {
137:       smooth: true,
138:       skipNarration: false,
139:       source: 'narrative_navigation_prev',
140:     })
```

- `src/theater/UnifiedNavigationAPI.js:33`

```text
31:     const {
32:       smooth = true,
33:       skipNarration = false,
34:       source = 'unknown',
35:       settleMs = 450,
```

- `src/theater/UnifiedNavigationAPI.js:43`

```text
41:       source,
42:       smooth,
43:       skipNarration,
44:       method: 'ORCHESTRATED',
45:     });
```

- `src/theater/UnifiedNavigationAPI.js:69`

```text
67: 
68:     // Skip narration if requested
69:     if (skipNarration && window.narrationController?.skipNarration) {
70:       window.narrationController.skipNarration();
71:     }
```

- `src/theater/UnifiedNavigationAPI.js:70`

```text
68:     // Skip narration if requested
69:     if (skipNarration && window.narrationController?.skipNarration) {
70:       window.narrationController.skipNarration();
71:     }
72: 
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

- `src/components/narrative/NarrationController.jsx:564`

```text
562:             effect: particleEffectPayload,
563:           });
564:           BeatBus.emit?.(EVENTS.RENDER_DIRECTIVE, {
565:             kind: 'particle-effect',
566:             ...particleEffectPayload,
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

- `src/components/webgl/WebGLBackground.jsx:310`

```text
308:     if (!payload) return;
309:     trace('WBG:FENCEPOST', payload);
310:     BeatBus.emit(EVENTS.PARTICLES_EMERGED, payload);
311:     if (import.meta?.env?.DEV) {
312:       console.log('✅ [RENDERER] PARTICLES_EMERGED emitted', payload);
```

- `src/components/webgl/WebGLBackground.jsx:312`

```text
310:     BeatBus.emit(EVENTS.PARTICLES_EMERGED, payload);
311:     if (import.meta?.env?.DEV) {
312:       console.log('✅ [RENDERER] PARTICLES_EMERGED emitted', payload);
313:     }
314: 
```

- `src/components/webgl/WebGLBackground.jsx:397`

```text
395:       const uniforms = mat?.uniforms;
396: 
397:       if (uniforms?.uMorphProgress) {
398:         uniforms.uMorphProgress.value = 1.0;
399:         if (uniforms.uStageProgress) {
```

- `src/components/webgl/WebGLBackground.jsx:398`

```text
396: 
397:       if (uniforms?.uMorphProgress) {
398:         uniforms.uMorphProgress.value = 1.0;
399:         if (uniforms.uStageProgress) {
400:           uniforms.uStageProgress.value = 1.0;
```

- `src/components/webgl/WebGLBackground.jsx:462`

```text
460:           attrs: geo ? Object.keys(geo.attributes || {}) : [],
461:           drawCount: geo?.drawRange?.count ?? null,
462:           morph: uniforms.uMorphProgress?.value ?? null,
463:           pointSize: uniforms.uPointSize?.value ?? null,
464:           freeze: uniforms.uPostMorphFreeze?.value ?? null,
```

- `src/components/webgl/WebGLBackground.jsx:722`

```text
720:     if (!mat?.uniforms) return;
721:     const u = mat.uniforms;
722:     if (u.uMorphProgress) u.uMorphProgress.value = v;
723:     else if (u.morphProgress) u.morphProgress.value = v;
724:     else if (u.uMorph) u.uMorph.value = v;
```

- `src/components/webgl/WebGLBackground.jsx:813`

```text
811:       const start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
812:       morphProbeTimer = setInterval(() => {
813:         if (!uniforms?.uMorphProgress) return;
814:         const val = Number(uniforms.uMorphProgress.value) || 0;
815:         const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
```

- `src/components/webgl/WebGLBackground.jsx:814`

```text
812:       morphProbeTimer = setInterval(() => {
813:         if (!uniforms?.uMorphProgress) return;
814:         const val = Number(uniforms.uMorphProgress.value) || 0;
815:         const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
816:         console.log('[PROBE] uMorphProgress', { t: Math.round(now - start), val });
```

- `src/components/webgl/WebGLBackground.jsx:816`

```text
814:         const val = Number(uniforms.uMorphProgress.value) || 0;
815:         const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
816:         console.log('[PROBE] uMorphProgress', { t: Math.round(now - start), val });
817:         if (now - start > 2000) {
818:           clearInterval(morphProbeTimer);
```

- `src/components/webgl/WebGLBackground.jsx:1239`

```text
1237:         });
1238:         scheduleRuntimeSampling();
1239:         if (mat?.uniforms?.uMorphProgress) {
1240:           if (isQrBlueprint) {
1241:             mat.uniforms.uMorphProgress.value = 1;
```

- `src/components/webgl/WebGLBackground.jsx:1241`

```text
1239:         if (mat?.uniforms?.uMorphProgress) {
1240:           if (isQrBlueprint) {
1241:             mat.uniforms.uMorphProgress.value = 1;
1242:             if (mat.uniforms.uStageProgress) mat.uniforms.uStageProgress.value = 1;
1243:             if (mat.uniforms.uPostMorphFreeze) mat.uniforms.uPostMorphFreeze.value = 1;
```

- `src/components/webgl/WebGLBackground.jsx:1245`

```text
1243:             if (mat.uniforms.uPostMorphFreeze) mat.uniforms.uPostMorphFreeze.value = 1;
1244:           } else {
1245:             mat.uniforms.uMorphProgress.value = 0;
1246:             if (mat.uniforms.uStageProgress) mat.uniforms.uStageProgress.value = 0;
1247:           }
```

- `src/components/webgl/WebGLBackground.jsx:1272`

```text
1270:           );
1271:           const seededMorph = maybeSeedNumber(
1272:             uniforms.uMorphProgress,
1273:             fallbackMorphRef.current ?? 0
1274:           );
```

- `src/components/webgl/WebGLBackground.jsx:1478`

```text
1476:           emittedEmergedRef.current = true;
1477:           emergencePendingRef.current = false;
1478:           console.log('EMERGED once — emitting PARTICLES_EMERGED fencepost');
1479:         }
1480:       }
```

- `src/components/webgl/WebGLBackground.jsx:1519`

```text
1517:       const matCurrent = materialRef.current;
1518:       const currentUniforms = matCurrent?.uniforms;
1519:       if (!isEmergenceMode && currentUniforms?.uMorphProgress) {
1520:         const director = typeof window !== 'undefined' ? window.theaterDirector : null;
1521:         const currentStage = director?.getCurrentStage?.() ?? director?.currentStage ?? null;
```

- `src/components/webgl/WebGLBackground.jsx:1526`

```text
1524:         const startMorph = 0.0;
1525: 
1526:         currentUniforms.uMorphProgress.value = startMorph;
1527:         if (currentUniforms.uStageProgress) {
1528:           currentUniforms.uStageProgress.value = startMorph;
```

- `src/components/webgl/WebGLBackground.jsx:1553`

```text
1551:             const progress = Math.min(1, elapsed / duration);
1552:             const liveUniforms = matCurrent.uniforms;
1553:             if (liveUniforms?.uMorphProgress) {
1554:               liveUniforms.uMorphProgress.value = startMorph + (1 - startMorph) * progress;
1555:             }
```

- `src/components/webgl/WebGLBackground.jsx:1554`

```text
1552:             const liveUniforms = matCurrent.uniforms;
1553:             if (liveUniforms?.uMorphProgress) {
1554:               liveUniforms.uMorphProgress.value = startMorph + (1 - startMorph) * progress;
1555:             }
1556:             if (liveUniforms?.uStageProgress) {
```

- `src/components/webgl/WebGLBackground.jsx:1700`

```text
1698:         uniforms: {
1699:           uTime:            { value: 0 },
1700:           uMorphProgress:   { value: clamp01(fallbackMorphRef.current) },
1701:           uScrollProgress:  { value: 0 },
1702:           uStageProgress:   { value: clamp01(fallbackMorphRef.current) },
```

- `src/components/webgl/WebGLBackground.jsx:1812`

```text
1810:         uniforms: mat ? Object.keys(mat.uniforms || {}) : [],
1811:         hasGeometry: !!geometryRef.current,
1812:         morph: mat?.uniforms?.uMorphProgress?.value ?? null,
1813:       }));
1814: 
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

- `src/engine/ConsciousnessEngine.js:231`

```text
229:     subscribe('BUILD_EMERGENCE_BLUEPRINT', this._onBuildEmergence.bind(this));
230:     subscribe('START_CLIMAX', this._handleStartClimax.bind(this));
231:     subscribe('PARTICLES_EMERGED', () => {
232:       this._rendererFencepostSeen = true;
233:       this._emergenceActive = false;
```

- `src/engine/ConsciousnessEngine.js:452`

```text
450:       }
451: 
452:       // DO NOT emit PARTICLES_EMERGED - renderer owns this fencepost
453: 
454:     } catch (e) {
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

- `src/theater/controllers/OpeningSequenceController.js:406`

```text
404:           const readinessResult = await Promise.race([
405:             this.director
406:               ._waitForEvent(EVENTS.PARTICLES_EMERGED, {
407:                 timeout: 1200,
408:                 predicate: (payload = {}) => {
```

- `src/theater/controllers/OpeningSequenceController.js:596`

```text
594:           };
595: 
596:           const fenceOff = BeatBus.on(EVENTS.PARTICLES_EMERGED, (payload) => {
597:             console.log('   Received: PARTICLES_EMERGED');
598:             finish({ type: 'fencepost', payload });
```

- `src/theater/controllers/OpeningSequenceController.js:597`

```text
595: 
596:           const fenceOff = BeatBus.on(EVENTS.PARTICLES_EMERGED, (payload) => {
597:             console.log('   Received: PARTICLES_EMERGED');
598:             finish({ type: 'fencepost', payload });
599:           });
```

- `src/theater/controllers/OpeningSequenceController.js:602`

```text
600: 
601:           fenceTimeoutId = this.director._trackTimer?.(() => {
602:             console.warn(`⚠️ Director: ${EVENTS.PARTICLES_EMERGED} timed out after ${fencepostWaitMs}ms`);
603:             finish(null);
604:           }, fencepostWaitMs);
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

## STAGE_CHANGE

- `src/components/narrative/NarrationController.jsx:961`

```text
959: 
960:     const offStart = BeatBus.on?.(EVENTS.START_NARRATIVE, handleStart);
961:     const offStageChange = BeatBus.on?.(EVENTS.STAGE_CHANGE, handleStageChange);
962: 
963:     const keyHandler = (event) => {
```

- `src/components/webgl/WebGLBackground.jsx:779`

```text
777:   // Passive fallbacks (OK to keep)
778:   useEffect(() => {
779:     const off = BeatBus?.on?.(EVENTS.STAGE_CHANGE, (p) => {
780:       const st = p?.stage ?? p?.to ?? p?.name ?? String(p);
781:       setStageName(st);
```

- `src/components/webgl/WebGLBackground.jsx:805`

```text
803:   useEffect(() => {
804:     let morphProbeTimer = null;
805:     const off = BeatBus?.on?.(EVENTS.STAGE_CHANGE, () => {
806:       if (morphProbeTimer) {
807:         clearInterval(morphProbeTimer);
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

- `src/engine/ConsciousnessEngine.js:226`

```text
224:     subscribe('ENGINE_VIEWPORT_HINT', this._onViewportHint.bind(this));
225:     subscribe('ENABLE_SCROLL', this._onEnableScroll.bind(this));
226:     subscribe('STAGE_CHANGE', this._onStageChange.bind(this));
227:     subscribe('QUALITY_CHANGE', this._onQualityChange.bind(this));
228:     subscribe('PREWARM_GENESIS_BLUEPRINT', this._onPrewarmGenesis.bind(this));
```

- `src/engine/ConsciousnessEngine.js:316`

```text
314:     this.currentStage = stage;
315:     if (skipBlueprint) {
316:       this._log('stage_change', { stage, skippedBlueprint: true });
317:       if (preserveEmergence && stage === 'genesis') {
318:         this._log('stage_preserve_emergence', { preserved: !!this._lastEmergenceTargets });
```

- `src/engine/ConsciousnessEngine.js:323`

```text
321:     }
322:     this.buildAndEmitBlueprint(stage, this.currentQuality);
323:     this._log('stage_change', { stage });
324:   }
325: 
```

- `src/orchestration/navigation/narrativeNavigation.js:27`

```text
25: };
26: 
27: const jumpToStage = (stageName, options = {}) => {
28:   const stageNames = getStageNames();
29:   const targetIndex = stageNames.indexOf(stageName);
```

- `src/orchestration/navigation/narrativeNavigation.js:98`

```text
96:       label,
97:       isActive: activeStage === name,
98:       onClick: () => jumpToStage(name, { smooth: true, emitNarration: true }),
99:       index,
100:     };
```

- `src/orchestration/navigation/narrativeNavigation.js:153`

```text
151:   nextStage,
152:   prevStage,
153:   jumpToStage,
154:   toggleAutoAdvance,
155: };
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

- `src/state/commands/StateCommands.js:126`

```text
124:     let lastQualityFromBus = qualityAtom.getState?.()?.currentQualityTier ?? null;
125: 
126:     const stageBusSub = BeatBus.on?.(EVENTS.STAGE_CHANGE, (payload = {}) => {
127:       const stage = payload.to ?? payload.stage ?? payload.name ?? null;
128:       if (stage) {
```

- `src/state/commands/StateCommands.js:167`

```text
165:         delete payload.toStage;
166: 
167:         BeatBus.emit(EVENTS.STAGE_CHANGE, payload);
168: 
169:         prevStage = next;
```

- `src/state/commands/StateCommands.js:321`

```text
319: 
320:   requestStageChange(targetStage, meta = {}) {
321:     if (!targetStage || typeof stageAtom?.jumpToStage !== 'function') {
322:       console.warn('[StateCommands] requestStageChange unavailable', { targetStage });
323:       return false;
```

- `src/state/commands/StateCommands.js:326`

```text
324:     }
325:     this.pendingStageMeta = { ...meta };
326:     stageAtom.jumpToStage(targetStage);
327:     return true;
328:   }
```

- `src/theater/ScrollOrchestrator.js:3`

```text
1: // src/theater/ScrollOrchestrator.js
2: // BeatGlyph v3.3 — ScrollOrchestrator
3: // Purpose: map window scroll -> stage-local progress; publish MORPH_PROGRESS and STAGE_CHANGE.
4: // Kinetics: speedMultiplier=2.0, smoothing=0.15, overshoot=0.05 (v3.3 canon)
5: 
```

- `src/theater/ScrollOrchestrator.js:332`

```text
330:           timestamp: performance.now(),
331:         });
332:         BeatBus.emit?.(EVENTS.STAGE_CHANGE, { 
333:           stage: stageName, 
334:           index: stageIdx,
```

- `src/theater/TheaterDirector.js:128`

```text
126: 
127:     if (typeof BeatBus?.on === 'function') {
128:       this._stageChangeUnsubscribe = BeatBus.on(EVENTS.STAGE_CHANGE, this._handleStageChangeBound);
129:     }
130:   }
```

- `src/theater/TheaterDirector.js:863`

```text
861:   version: '1.0.1',
862:   events: {
863:     STAGE_CHANGE: {
864:       required: ['from', 'to'],
865:       notes: 'Canonical shape. Old `{stage}` payload is deprecated.',
```

- `src/theater/TheaterDirector.js:883`

```text
881:   },
882:   deprecations: {
883:     STAGE_CHANGE: { stage: 'deprecated' },
884:     QUALITY_CHANGE: { quality: 'deprecated' },
885:   },
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

- `src/theater/UnifiedNavigationAPI.js:196`

```text
194:    */
195:   onStageChange(callback) {
196:     return BeatBus.on('STAGE_CHANGE', callback);
197:   }
198: }
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



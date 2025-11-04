# Narration & Opening Evidence Report

Generated: 11/4/2025, 1:24:41 PM

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
  "generatedAt": "2025-11-04T19:24:39.053Z"
}
```

---
## 2) Trace Bus Map

# Trace Bus Report

- Files scanned: 118
- Unique events: 10
- Literal trace sites: 14
- Dynamic trace sites: 1
- Parse failures: 0

## [MorphController] Emergence timeline complete
- `src/engine/modules/MorphController.js:237`

## [MorphController] Emergence timeline started
- `src/engine/modules/MorphController.js:123`

## CE:EMIT
- `src/engine/ConsciousnessEngine.js:712`

## DIR
- `src/components/webgl/managers/BlueprintBinder.js:688`

## FENCEPOST_LISTENERS_READY
- `src/components/webgl/WebGLBackground.jsx:326`
- `src/components/webgl/WebGLBackground.jsx:401`

## WBG:BIND
- `src/components/webgl/WebGLBackground.jsx:249`

## WBG:FAST_FORWARD
- `src/components/webgl/WebGLBackground.jsx:390`

## WBG:FENCEPOST
- `src/components/webgl/WebGLBackground.jsx:267`

## WBG:FREEZE
- `src/components/webgl/WebGLBackground.jsx:1214`
- `src/components/webgl/managers/BlueprintBinder.js:492`
- `src/components/webgl/managers/BlueprintBinder.js:1277`
- `src/components/webgl/managers/BlueprintBinder.js:1310`

## WBG:MORPH_TYPE
- `src/components/webgl/managers/BlueprintBinder.js:533`

## Dynamic trace calls
- `src/components/webgl/WebGLBackground.jsx:257` → `label`


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

- `src/components/narrative/NarrationController.jsx:930`

```text
928: 
929:     const offStart = BeatBus.on?.(EVENTS.START_NARRATIVE, handleStart);
930:     const offStageChange = BeatBus.on?.(EVENTS.STAGE_CHANGE, handleStageChange);
931: 
932:     const keyHandler = (event) => {
```

- `src/components/webgl/WebGLBackground.jsx:912`

```text
910:   // Passive fallbacks (OK to keep)
911:   useEffect(() => {
912:     const off = BeatBus?.on?.(EVENTS.STAGE_CHANGE, (p) => {
913:       const st = p?.stage ?? p?.to ?? p?.name ?? String(p);
914:       setStageName(st);
```

- `src/components/webgl/WebGLBackground.jsx:938`

```text
936:   useEffect(() => {
937:     let morphProbeTimer = null;
938:     const off = BeatBus?.on?.(EVENTS.STAGE_CHANGE, () => {
939:       if (morphProbeTimer) {
940:         clearInterval(morphProbeTimer);
```

- `src/config/canonical/canonicalAuthority.js:576`

```text
574:     recordEmission(eventName, source) {
575:       const key = source || 'unknown';
576:       if (eventName === 'STAGE_CHANGE') {
577:         this.stageChangeEmitters.set(key, (this.stageChangeEmitters.get(key) || 0) + 1);
578:       } else if (eventName === 'MORPH_PROGRESS') {
```

- `src/config/canonical/canonicalAuthority.js:628`

```text
626: 
627:     console.log('📊 EVENT EMISSION COMPLIANCE:');
628:     console.log(`   STAGE_CHANGE Emitters: ${eventStats.stageChange?.emitters.length || 0}`);
629:     console.log('   - Expected: 1 (StateCommands only)');
630:     console.log(
```

- `src/config/canonical/canonicalAuthority.js:729`

```text
727:       const results = { pass: true, tests: [] };
728: 
729:       const stageChanges = trace.filter((e) => e?.ev === 'STAGE_CHANGE');
730:       const stageChangeSources = [...new Set(stageChanges.map((e) => e?.source || 'unknown'))];
731:       const stageChangeTest = {
```

- `src/config/canonical/canonicalAuthority.js:732`

```text
730:       const stageChangeSources = [...new Set(stageChanges.map((e) => e?.source || 'unknown'))];
731:       const stageChangeTest = {
732:         name: 'STAGE_CHANGE has single emitter',
733:         expected: 1,
734:         actual: stageChangeSources.length,
```

- `src/config/canonical/canonicalAuthority.js:1001`

```text
999: 
1000:         const trace = normalizeTrace();
1001:         const stageChanges = trace.filter((e) => e?.ev === 'STAGE_CHANGE');
1002:         const morphEvents = trace.filter((e) => e?.ev === 'MORPH_PROGRESS');
1003: 
```

- `src/config/canonical/canonicalAuthority.js:1011`

```text
1009:         };
1010:         console.log(scenario1.pass ? '   ✅ PASS' : '   ❌ FAIL');
1011:         console.log('   STAGE_CHANGE events:', stageChanges.length);
1012:         console.log('   MORPH_PROGRESS events:', morphEvents.length);
1013:       } catch (error) {
```

- `src/config/canonical/canonicalAuthority.js:1160`

```text
1158:       const violations = ensureArray(window.__stageAtomViolations).length;
1159:       const trace = normalizeTrace();
1160:       const stageEmitters = [...new Set(trace.filter((e) => e?.ev === 'STAGE_CHANGE').map((e) => e?.source || 'unknown'))];
1161:       const fps = typeof window.probe?.fps === 'function' ? window.probe.fps() : 0;
1162: 
```

- `src/config/canonical/canonicalAuthority.js:1164`

```text
1162: 
1163:       console.log('   Navigation violations:', violations === 0 ? '✅ 0' : `❌ ${violations}`);
1164:       console.log('   STAGE_CHANGE emitters:', stageEmitters.length === 1 ? '✅ 1' : `❌ ${stageEmitters.length}`);
1165:       console.log('   FPS:', fps >= minimumFrameRate ? `✅ ${fps.toFixed?.(1) ?? fps}` : `❌ ${fps.toFixed?.(1) ?? fps}`);
1166: 
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

- `src/modules/state/core/StateController.js:86`

```text
84:     const from = this.state.stage;
85:     this.write('transition', { stage: to }, meta);
86:     if (this.bus?.emit) this.bus.emit('STAGE_CHANGE', { from, to });
87:   }
88: 
```

- `src/orchestration/navigation/narrativeNavigation.js:27`

```text
25: };
26: 
27: const jumpToStage = (stageName, options = {}) => {
28:   const stageNames = getStageNames();
29:   const targetIndex = stageNames.indexOf(stageName);
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

- `src/state/atoms/narrativeAtom.js:6`

```text
4:  *
5:  * Navigation methods removed from narrativeAtom:
6:  * - jumpToStage() → Use window.unifiedNav.navigateToStage()
7:  * - nextStage()   → Use window.unifiedNav.nextStage()
8:  * - prevStage()   → Use window.unifiedNav.prevStage()
```

- `src/state/atoms/narrativeAtom.js:83`

```text
81:   // ===== STAGE NAVIGATION =====
82:   // PHASE 2: Removed - use UnifiedNavigationAPI instead
83:   jumpToStage: () => {
84:     throw new Error(
85:       '❌ narrativeAtom.jumpToStage removed in Phase 2\n' +
```

- `src/state/atoms/narrativeAtom.js:85`

```text
83:   jumpToStage: () => {
84:     throw new Error(
85:       '❌ narrativeAtom.jumpToStage removed in Phase 2\n' +
86:         '   Use: window.unifiedNav.navigateToStage(stage) instead\n' +
87:         '   Reason: Single-writer pattern enforcement\n' +
```

- `src/state/atoms/qualityAtom.js:155`

```text
153:     if (unsubscribe) return; // Already initialized
154:     
155:     unsubscribe = BeatBus.on(EVENTS.STAGE_CHANGE, (payload) => {
156:       const stage = payload?.to || payload?.stage;
157:       if (stage && stage !== get().currentStage) {
```

- `src/state/atoms/stageAtom.js:623`

```text
621:     
622:     // PHASE 2: Wrapped with single-writer authorization
623:     jumpToStage: withAuthorization(
624:       function (stageInput) {
625:         const stageName = resolveStageName(stageInput);
```

- `src/state/atoms/stageAtom.js:644`

```text
642:         };
643: 
644:         batchedSetState(updates, 'jumpToStage');
645: 
646:         if (import.meta.env.DEV) {
```

- `src/state/atoms/stageAtom.js:650`

```text
648:         }
649:       },
650:       'jumpToStage',
651:       true
652:     ),
```

- `src/state/atoms/stageAtom.js:848`

```text
846:         const clampedIndex = Math.max(0, Math.min(index, STAGE_COUNT - 1));
847:         const stageName = STAGE_NAMES[clampedIndex];
848:         actions.jumpToStage(stageName);
849:       }
850:     },
```

- `src/state/atoms/stageAtom.js:901`

```text
899: 
900:     // Navigation helpers
901:     jumpToStage: (stage) => stageAtom.jumpToStage(stage),
902:     jumpTo: (stage) => stageAtom.jumpToStage(stage), // legacy alias
903:     next: () => stageAtom.nextStage(),
```

- `src/state/atoms/stageAtom.js:902`

```text
900:     // Navigation helpers
901:     jumpToStage: (stage) => stageAtom.jumpToStage(stage),
902:     jumpTo: (stage) => stageAtom.jumpToStage(stage), // legacy alias
903:     next: () => stageAtom.nextStage(),
904:     prev: () => stageAtom.prevStage(),
```

- `src/state/atoms/stageAtom.js:969`

```text
967:       for (let i = 0; i < iterations; i++) {
968:         const randomStage = STAGE_NAMES[Math.floor(Math.random() * STAGE_NAMES.length)];
969:         stageAtom.jumpToStage(randomStage);
970:         stageAtom.setStageProgress(Math.random());
971:       }
```

- `src/state/commands/StateCommands.js:138`

```text
136:     let lastQualityFromBus = qualityAtom.getState?.()?.currentQualityTier ?? null;
137: 
138:     const stageBusSub = BeatBus.on?.(EVENTS.STAGE_CHANGE, (payload = {}) => {
139:       const stage = payload.to ?? payload.stage ?? payload.name ?? null;
140:       if (stage) {
```

- `src/state/commands/StateCommands.js:164`

```text
162:         }
163:         // Emit stage change events
164:         BeatBus.emit(EVENTS.STAGE_CHANGE, { 
165:           from: prevStage, 
166:           to: next, 
```

- `src/state/commands/StateCommands.js:171`

```text
169:         });
170:         if (typeof window !== 'undefined') {
171:           window.eventEmissionMonitor?.recordEmission?.('STAGE_CHANGE', 'StateCommands');
172:         }
173:         
```

- `src/state/commands/StateCommands.js:480`

```text
478:             }
479:           }
480:           stageAtom.jumpToStage(targetStage);
481:         }
482:       }
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

- `src/theater/TheaterDirector.js:152`

```text
150: 
151:     if (typeof BeatBus?.on === 'function') {
152:       this._stageChangeUnsubscribe = BeatBus.on(EVENTS.STAGE_CHANGE, this._handleStageChangeBound);
153:     }
154:   }
```

- `src/theater/TheaterDirector.js:889`

```text
887:   version: '1.0.1',
888:   events: {
889:     STAGE_CHANGE: {
890:       required: ['from', 'to'],
891:       notes: 'Canonical shape. Old `{stage}` payload is deprecated.',
```

- `src/theater/TheaterDirector.js:909`

```text
907:   },
908:   deprecations: {
909:     STAGE_CHANGE: { stage: 'deprecated' },
910:     QUALITY_CHANGE: { quality: 'deprecated' },
911:   },
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

- `src/theater/UnifiedNavigationAPI.js:329`

```text
327:    */
328:   onStageChange(callback) {
329:     return BeatBus.on('STAGE_CHANGE', callback);
330:   }
331: }
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

- `src/theater/controllers/OpeningSequenceController.js:688`

```text
686:         });
687: 
688:         // Constitutional Compliance (SST v3.5): only StateCommands may emit STAGE_CHANGE events.
689:         // Delegate to StateCommands.setStage so stageAtom updates and BeatBus emissions stay unified.
690:         try {
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

- `src/components/webgl/WebGLBackground.jsx:881`

```text
879:   }, [emitViewportHint]);
880: 
881:   // Fallback morph sink (outside emergence directives)
882:   const __applyMorph = (v) => {
883:     const mat = materialRef.current;
```

- `src/components/webgl/WebGLBackground.jsx:927`

```text
925:   }, []);
926: 
927:   // Emergence flag (no local tween; engine drives via directives)
928:   useEffect(() => {
929:     const off = BeatBus?.on?.(EVENTS.PARTICLES_START_EMERGING, () => {
```

- `src/components/webgl/WebGLBackground.jsx:1286`

```text
1284: 
1285:       switch (phaseName) {
1286:         case 'emergence': {
1287:           console.log('🫧 [EMERGENCE] Dissolving into gas cloud');
1288:           if (uniforms.uTurbulence) {
```

- `src/components/webgl/WebGLBackground.jsx:1287`

```text
1285:       switch (phaseName) {
1286:         case 'emergence': {
1287:           console.log('🫧 [EMERGENCE] Dissolving into gas cloud');
1288:           if (uniforms.uTurbulence) {
1289:             uniforms.uTurbulence.value = 0.5;
```

- `src/components/webgl/WebGLBackground.jsx:1298`

```text
1296:           if (uniforms.uMotionMode) {
1297:             uniforms.uMotionMode.value = 0;
1298:             console.log('   Set uMotionMode = 0 (emergence)');
1299:           }
1300:           if (uniforms.uParticlePhase) {
```

- `src/components/webgl/WebGLBackground.jsx:1302`

```text
1300:           if (uniforms.uParticlePhase) {
1301:             uniforms.uParticlePhase.value = 1;
1302:             console.log('   Set uParticlePhase = 1 (emergence)');
1303:           }
1304:           if (uniforms.uDriftAmp) {
```

- `src/components/webgl/WebGLBackground.jsx:1322`

```text
1320:           break;
1321:         }
1322:         case 'chaos': {
1323:           console.log('🌪️ [CHAOS] Starting random motion');
1324:           if (uniforms.uTurbulence) {
```

- `src/components/webgl/WebGLBackground.jsx:1323`

```text
1321:         }
1322:         case 'chaos': {
1323:           console.log('🌪️ [CHAOS] Starting random motion');
1324:           if (uniforms.uTurbulence) {
1325:             uniforms.uTurbulence.value = 0.8;
```

- `src/components/webgl/WebGLBackground.jsx:1334`

```text
1332:           if (uniforms.uMotionMode) {
1333:             uniforms.uMotionMode.value = 1;
1334:             console.log('   Set uMotionMode = 1 (chaos)');
1335:           }
1336:           if (uniforms.uParticlePhase) {
```

- `src/components/webgl/WebGLBackground.jsx:1338`

```text
1336:           if (uniforms.uParticlePhase) {
1337:             uniforms.uParticlePhase.value = 2;
1338:             console.log('   Set uParticlePhase = 2 (chaos)');
1339:           }
1340:           if (uniforms.uDriftAmp) {
```

- `src/components/webgl/WebGLBackground.jsx:1363`

```text
1361:           break;
1362:         }
1363:         case 'coalesce': {
1364:           console.log('🌀 [COALESCE] Forming word');
1365:           if (uniforms.uTurbulence) {
```

- `src/components/webgl/WebGLBackground.jsx:1364`

```text
1362:         }
1363:         case 'coalesce': {
1364:           console.log('🌀 [COALESCE] Forming word');
1365:           if (uniforms.uTurbulence) {
1366:             uniforms.uTurbulence.value = 0.3;
```

- `src/components/webgl/WebGLBackground.jsx:1375`

```text
1373:           if (uniforms.uMotionMode) {
1374:             uniforms.uMotionMode.value = 2;
1375:             console.log('   Set uMotionMode = 2 (coalesce)');
1376:           }
1377:           if (uniforms.uParticlePhase) {
```

- `src/components/webgl/WebGLBackground.jsx:1379`

```text
1377:           if (uniforms.uParticlePhase) {
1378:             uniforms.uParticlePhase.value = 3;
1379:             console.log('   Set uParticlePhase = 3 (coalesce)');
1380:           }
1381:           if (uniforms.uDriftAmp) {
```

- `src/components/webgl/WebGLBackground.jsx:1388`

```text
1386:           break;
1387:         }
1388:         case 'settle': {
1389:           console.log('🎯 [SETTLE] Locking into form');
1390:           if (uniforms.uTurbulence) {
```

- `src/components/webgl/WebGLBackground.jsx:1389`

```text
1387:         }
1388:         case 'settle': {
1389:           console.log('🎯 [SETTLE] Locking into form');
1390:           if (uniforms.uTurbulence) {
1391:             uniforms.uTurbulence.value = 0.0;
```

- `src/components/webgl/WebGLBackground.jsx:1400`

```text
1398:           if (uniforms.uMotionMode) {
1399:             uniforms.uMotionMode.value = 3;
1400:             console.log('   Set uMotionMode = 3 (settle)');
1401:           }
1402:           if (uniforms.uParticlePhase) {
```

- `src/components/webgl/WebGLBackground.jsx:1404`

```text
1402:           if (uniforms.uParticlePhase) {
1403:             uniforms.uParticlePhase.value = 4;
1404:             console.log('   Set uParticlePhase = 4 (settle)');
1405:           }
1406:           if (uniforms.uDriftAmp) {
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

- `src/components/webgl/consciousness/StageDefinitions.js:82`

```text
80:     
81:     cognitiveState: {
82:       reactiveScatter: 1.0,    // Reduced chaos
83:       processingDepth: 1.0,    // Beginning to deepen
84:       strategicFlow: 0.5,      // Emerging organization
```

- `src/components/webgl/consciousness/StageDefinitions.js:132`

```text
130:     
131:     cognitiveState: {
132:       reactiveScatter: 0.6,    // Dramatic reduction in chaos
133:       processingDepth: 1.5,    // Deep transformation
134:       strategicFlow: 1.2,      // Rapid strategic emergence
```

- `src/components/webgl/consciousness/StageDefinitions.js:134`

```text
132:       reactiveScatter: 0.6,    // Dramatic reduction in chaos
133:       processingDepth: 1.5,    // Deep transformation
134:       strategicFlow: 1.2,      // Rapid strategic emergence
135:     },
136:     
```

- `src/components/webgl/consciousness/StageDefinitions.js:172`

```text
170:   
171:   3: {
172:     // ✅ VELOCITY: Strategic mastery emergence
173:     name: 'acceleration',
174:     title: 'Velocity Explosion',
```

- `src/components/webgl/consciousness/StageDefinitions.js:260`

```text
258:       id: 'architecture_mastery',
259:       title: 'Architecture Problem Solving',
260:       content: 'Crisis becomes breakthrough - Order emerges from chaos',
261:       position: 'parietal_integration',
262:       unlocked: true,
```

- `src/components/webgl/managers/BlueprintBinder.js:729`

```text
727:     if (lastBlueprintIdRef) lastBlueprintIdRef.current = id;
728: 
729:     const isEmergence = mode === 'emergence' || raw?.mode === 'emergence';
730:     const isOpeningChaos = mode === 'opening_chaos' || raw?.mode === 'opening_chaos';
731:     const shouldFastForward = isEmergence && (fastForwardRequested || skipMorph);
```

- `src/components/webgl/managers/BlueprintBinder.js:995`

```text
993:       }
994:       applyRendererFitsToViewport?.(geo, viewportHintRef?.current || viewport);
995:       logBind?.(isEmergence ? 'emergence' : 'stage', {
996:         stage: raw.stageName || st || 'genesis',
997:         mode: mode || raw?.mode || (isEmergence ? 'emergence' : 'full'),
```

- `src/components/webgl/managers/BlueprintBinder.js:997`

```text
995:       logBind?.(isEmergence ? 'emergence' : 'stage', {
996:         stage: raw.stageName || st || 'genesis',
997:         mode: mode || raw?.mode || (isEmergence ? 'emergence' : 'full'),
998:         cached: !!cached,
999:       });
```

- `src/components/webgl/managers/BlueprintBinder.js:1077`

```text
1075:     if (isEmergence) {
1076:       console.log(
1077:         '✅ Renderer: BR(emergence) bound',
1078:         `count=${raw.particleCount || raw.activeCount}`,
1079:         `quality=${quality}`,
```

- `src/components/webgl/managers/BlueprintBinder.js:1113`

```text
1111:         const globalSST = (typeof window !== 'undefined' && window.SST) || null;
1112:         const openConfig = globalSST?.opening ?? null;
1113:         const skipAnimation = openConfig?.emergence?.skipMorphAnimation ?? false;
1114:         const timelineDuration = openConfig?.timeline?.emergence?.durationMs ?? null;
1115: 
```

- `src/components/webgl/managers/BlueprintBinder.js:1114`

```text
1112:         const openConfig = globalSST?.opening ?? null;
1113:         const skipAnimation = openConfig?.emergence?.skipMorphAnimation ?? false;
1114:         const timelineDuration = openConfig?.timeline?.emergence?.durationMs ?? null;
1115: 
1116:         if (skipAnimation === true || shouldFastForward || fastForwardRequested === true) {
```

- `src/components/webgl/managers/BlueprintBinder.js:1119`

```text
1117:           const source = skipAnimation ? 'sst-config' : (fastForwardRequested ? 'payload-fastforward' : 'renderer-fastforward');
1118:           if (finalizeEmergence(source)) {
1119:             console.log('⚡ Renderer: Emergence fast-forward applied', {
1120:               source,
1121:               skipAnimation,
```

- `src/components/webgl/managers/BlueprintBinder.js:1128`

```text
1126:           }
1127:         } else {
1128:           console.log('🎬 Renderer: Playing emergence animation (no fast-forward)', {
1129:             skipAnimation,
1130:             fastForwardFlag: fastForwardRequested,
```

- `src/components/webgl/managers/BlueprintBinder.js:1333`

```text
1331: 
1332:     const isEmergenceMode =
1333:       payload?.mode === 'emergence' || payload?.blueprint?.mode === 'emergence';
1334:     const matCurrent = materialRef?.current;
1335:     const currentUniforms = matCurrent?.uniforms;
```

- `src/components/webgl/managers/BlueprintBinder.js:1342`

```text
1340:       const currentPhase = director?.getCurrentPhase?.() ?? director?.phase ?? null;
1341:       const isOpeningPhase =
1342:         currentStage === 'genesis' && currentPhase !== 'emergence';
1343:       const startMorph = 0.0;
1344: 
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
335:   async _onPrewarmGenesis() {
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

- `src/engine/ConsciousnessEngine.js:412`

```text
410:         : null;
411: 
412:       // Emit emergence blueprint with mode flag (canonical event)
413:       // BLUEPRINT_READY payload must advertise canonical emergence mode
414:       emitBlueprintReady(BeatBus, EVENTS, blueprint, {
```

- `src/engine/ConsciousnessEngine.js:413`

```text
411: 
412:       // Emit emergence blueprint with mode flag (canonical event)
413:       // BLUEPRINT_READY payload must advertise canonical emergence mode
414:       emitBlueprintReady(BeatBus, EVENTS, blueprint, {
415:         stage: 'genesis',
```

- `src/engine/ConsciousnessEngine.js:417`

```text
415:         stage: 'genesis',
416:         quality: this.currentQuality,
417:         mode: 'emergence',
418:         variantMode: openingChaosMode ? 'opening_chaos' : 'emergence',
419:         cached: false,
```

- `src/engine/ConsciousnessEngine.js:418`

```text
416:         quality: this.currentQuality,
417:         mode: 'emergence',
418:         variantMode: openingChaosMode ? 'opening_chaos' : 'emergence',
419:         cached: false,
420:         skipMorphAnimation: !!payload.skipMorphAnimation,
```

- `src/engine/ConsciousnessEngine.js:427`

```text
425:       
426:       if (openingChaosMode) {
427:         console.log('🧠 Engine: Opening chaos blueprint emitted', { count: blueprint.particleCount, mode: 'opening_chaos' });
428:         this._openingPreboundBlueprint = blueprint;
429:         this._log('emergence_built', { count: blueprint.particleCount, mode: 'opening_chaos' });
```

- `src/engine/ConsciousnessEngine.js:431`

```text
429:         this._log('emergence_built', { count: blueprint.particleCount, mode: 'opening_chaos' });
430:       } else {
431:         console.log('🧠 Engine: Emergence blueprint emitted', { count: blueprint.particleCount, mode: 'emergence' });
432:         this._openingPreboundBlueprint = null;
433:         this._log('emergence_built', { count: blueprint.particleCount, mode: 'emergence' });
```

- `src/engine/ConsciousnessEngine.js:433`

```text
431:         console.log('🧠 Engine: Emergence blueprint emitted', { count: blueprint.particleCount, mode: 'emergence' });
432:         this._openingPreboundBlueprint = null;
433:         this._log('emergence_built', { count: blueprint.particleCount, mode: 'emergence' });
434:       }
435: 
```

- `src/engine/ConsciousnessEngine.js:436`

```text
434:       }
435: 
436:       // Drive implosion → settle via directives; renderer remains passive
437:       const shouldRunTimeline = !openingChaosMode && !payload.skipMorphAnimation;
438:       if (shouldRunTimeline && !this._startEmergenceTimeline(blueprint)) {
```

- `src/engine/ConsciousnessEngine.js:454`

```text
452: 
453:   _startEmergenceTimeline(bp) {
454:     console.log('🌀 [Engine] Starting emergence timeline, delegating to MorphController');
455:     if (!this.#morphController) {
456:       console.error('[ConsciousnessEngine] MorphController not initialized');
```

- `src/engine/ConsciousnessEngine.js:485`

```text
483: 
484:     if (blueprint.particleCount > 0) {
485:       const rnd = createSeededRandom(`emergence-${mode || 'default'}-${quality || 'HIGH'}`);
486:       for (let i = 0; i < blueprint.particleCount; i++) {
487:         const j = i * 3;
```

- `src/engine/ConsciousnessEngine.js:566`

```text
564: 
565:   /**
566:    * Build + emit the Emergence blueprint for the opening sequence.
567:    */
568:   async buildEmergenceBlueprint(options = {}) {
```

- `src/engine/ConsciousnessEngine.js:570`

```text
568:   async buildEmergenceBlueprint(options = {}) {
569:     const {
570:       mode: requestedMode = 'emergence',
571:       source = 'viewportSpread',
572:       target = 'constellation',
```

- `src/engine/ConsciousnessEngine.js:617`

```text
615:         usedFallback = this._lastText3DFallbackUsed;
616:         if (usedFallback) {
617:           console.warn('⚠️ Emergence used text3D FALLBACK (band). FontReady:', this._fontReady);
618:         }
619:       } else {
```

- `src/engine/ConsciousnessEngine.js:688`

```text
686: 
687:     const variantMode = requestedMode;
688:     const emissionMode = 'emergence';
689: 
690:     blueprint.metadata = {
```

- `src/engine/ConsciousnessEngine.js:703`

```text
701:       targetState: targetState || null,
702:       note: usedFallback
703:         ? 'Emergence used fallback band (font not ready); cache will be cleared on font load.'
704:         : 'Emergence endpoints separated: random atmospheric → 3D text target',
705:     };
```

- `src/engine/ConsciousnessEngine.js:704`

```text
702:       note: usedFallback
703:         ? 'Emergence used fallback band (font not ready); cache will be cleared on font load.'
704:         : 'Emergence endpoints separated: random atmospheric → 3D text target',
705:     };
706: 
```

- `src/engine/ConsciousnessEngine.js:735`

```text
733: 
734:       if (this._emergenceActive && stage !== 'genesis') {
735:         console.warn('🧠 Engine: rebuild blocked during emergence timeline', { stage, quality });
736:         this._log('rebuild_blocked_emergence', { stage, quality });
737:         return;
```

- `src/engine/ConsciousnessEngine.js:751`

```text
749:       }
750: 
751:     // Post-emergence genesis: optionally preserve settled emergence
752:     if (stage === 'genesis' && this._lastEmergenceTargets) {
753:       if (this._lastText3DFallbackUsed) {
```

- `src/engine/ConsciousnessEngine.js:754`

```text
752:     if (stage === 'genesis' && this._lastEmergenceTargets) {
753:       if (this._lastText3DFallbackUsed) {
754:         console.warn('🧠 Engine: Emergence fallback detected; skipping preserve');
755:         this._lastEmergenceTargets = null;
756:         this._emergenceDone = false;
```

- `src/engine/ConsciousnessEngine.js:759`

```text
757:         this._rendererFencepostSeen = false;
758:       } else if (!this._emergenceDone) {
759:         console.warn('🧠 Engine: Emergence incomplete; rebuilding genesis cleanly');
760:         this._lastEmergenceTargets = null;
761:         this._emergenceDone = false;
```

- `src/engine/ConsciousnessEngine.js:769`

```text
767:         this._rendererFencepostSeen = false;
768:       } else {
769:         console.log('🧠 Engine: Building post-emergence genesis (preserving emergence result)');
770: 
771:         const emergenceCount = Math.max(0, Math.floor(this._lastEmergenceTargets.length / 3));
```

- `src/engine/ConsciousnessEngine.js:791`

```text
789:               console.error('[CE] ⚠️ Missing text3DPositions in blueprint (line ~831)');
790:             }
791:             console.warn('[CE] Post-emergence reuse invalid; falling back to fresh genesis build');
792:             this._lastEmergenceTargets = null;
793:             this._emergenceDone = false;
```

- `src/engine/ConsciousnessEngine.js:815`

```text
813:                 stage,
814:                 quality,
815:                 mode: 'post-emergence-guarded',
816:                 cacheKey,
817:                 preservedEmergence: true,
```

- `src/engine/ConsciousnessEngine.js:820`

```text
818:               });
819:               this._preloadNextStage(stage, quality);
820:               this._log('blueprint_emitted', { stage, quality, cacheKey, mode: 'post-emergence-guarded' });
821:               this._rendererFencepostSeen = false;
822:               return;
```

- `src/engine/ConsciousnessEngine.js:825`

```text
823:             }
824: 
825:             console.warn('[CE] Post-emergence blueprint failed validation; rebuilding clean genesis blueprint');
826:             blueprint = null;
827:           }
```

- `src/engine/ConsciousnessEngine.js:1051`

```text
1049:           console.log(`✅ 3D font loaded from ${usedUrl}; cleared text3D cache (was ${oldSize} entries)`);
1050:           try {
1051:             if (this._lastText3DFallbackUsed && this._lastBlueprint?.metadata?.mode === 'emergence') {
1052:               console.log('🔁 Rebuilding emergence with real text3D now that font is ready…');
1053:               this.buildEmergenceBlueprint({ mode: 'emergence' });
```

- `src/engine/ConsciousnessEngine.js:1052`

```text
1050:           try {
1051:             if (this._lastText3DFallbackUsed && this._lastBlueprint?.metadata?.mode === 'emergence') {
1052:               console.log('🔁 Rebuilding emergence with real text3D now that font is ready…');
1053:               this.buildEmergenceBlueprint({ mode: 'emergence' });
1054:             }
```

- `src/engine/ConsciousnessEngine.js:1053`

```text
1051:             if (this._lastText3DFallbackUsed && this._lastBlueprint?.metadata?.mode === 'emergence') {
1052:               console.log('🔁 Rebuilding emergence with real text3D now that font is ready…');
1053:               this.buildEmergenceBlueprint({ mode: 'emergence' });
1054:             }
1055:           } catch {}
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

- `src/state/commands/StateCommands.js:175`

```text
173:         
174:         // REMOVED: BUILD_EMERGENCE_BLUEPRINT emission
175:         // This was causing emergence to build on every stage change
176:         // Emergence should only be triggered by TheaterDirector during opening
177:         
```

- `src/state/commands/StateCommands.js:176`

```text
174:         // REMOVED: BUILD_EMERGENCE_BLUEPRINT emission
175:         // This was causing emergence to build on every stage change
176:         // Emergence should only be triggered by TheaterDirector during opening
177:         
178:         prevStage = next;
```

- `src/state/commands/StateCommands.js:488`

```text
486:   }
487: 
488:   // Programmatic emergence trigger (only for opening sequence)
489:   triggerEmergence(payload = {}) {
490:     if (!this.canEmit('BUILD_EMERGENCE_BLUEPRINT')) {
```

- `src/state/commands/StateCommands.js:491`

```text
489:   triggerEmergence(payload = {}) {
490:     if (!this.canEmit('BUILD_EMERGENCE_BLUEPRINT')) {
491:       console.error('[StateCommands] Cannot trigger emergence - contract violation');
492:       return false;
493:     }
```

- `src/state/commands/StateCommands.js:497`

```text
495:     this.recordEmission('BUILD_EMERGENCE_BLUEPRINT');
496:     BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {
497:       mode: 'emergence',
498:       source: 'viewportSpread',
499:       target: 'constellation',
```

- `src/theater/ScrollOrchestrator.js:303`

```text
301:       const local = clamp01((easedPct - start) / Math.max(1, end - start));
302: 
303:       // v3.5 adjustment: keep genesis fully formed (no post-emergence un-morph)
304:       if (stageIdx === 0) {
305:         this.morphTarget = 1;
```

- `src/theater/TheaterDirector.js:113`

```text
111:       console.log('📋 [OPENING TIMELINE]', {
112:         hasTimeline: !!openingProbe?.timeline,
113:         chaos: openingProbe?.timeline?.chaos,
114:         coalesce: openingProbe?.timeline?.coalesce,
115:         settle: openingProbe?.timeline?.settle,
```

- `src/theater/TheaterDirector.js:114`

```text
112:         hasTimeline: !!openingProbe?.timeline,
113:         chaos: openingProbe?.timeline?.chaos,
114:         coalesce: openingProbe?.timeline?.coalesce,
115:         settle: openingProbe?.timeline?.settle,
116:         hasChaosConfig: !!openingProbe?.timeline?.chaos,
```

- `src/theater/TheaterDirector.js:115`

```text
113:         chaos: openingProbe?.timeline?.chaos,
114:         coalesce: openingProbe?.timeline?.coalesce,
115:         settle: openingProbe?.timeline?.settle,
116:         hasChaosConfig: !!openingProbe?.timeline?.chaos,
117:       });
```

- `src/theater/TheaterDirector.js:116`

```text
114:         coalesce: openingProbe?.timeline?.coalesce,
115:         settle: openingProbe?.timeline?.settle,
116:         hasChaosConfig: !!openingProbe?.timeline?.chaos,
117:       });
118:     } catch (timelineError) {
```

- `src/theater/TheaterDirector.js:482`

```text
480: 
481:     const segments = [
482:       `black ${snapshotTimeline.blackout?.durationMs ?? 0}ms`,
483:       `cursor blink x${snapshotTimeline.cursor?.blinkCount ?? 0} @ ${snapshotTimeline.cursor?.intervalMs ?? 0}ms`,
484:       `typing ~${snapshotTypingDuration}ms`,
```

- `src/theater/TheaterDirector.js:483`

```text
481:     const segments = [
482:       `black ${snapshotTimeline.blackout?.durationMs ?? 0}ms`,
483:       `cursor blink x${snapshotTimeline.cursor?.blinkCount ?? 0} @ ${snapshotTimeline.cursor?.intervalMs ?? 0}ms`,
484:       `typing ~${snapshotTypingDuration}ms`,
485:       `fill ${snapshotTimeline.fill?.durationMs ?? 0}ms`,
```

- `src/theater/TheaterDirector.js:486`

```text
484:       `typing ~${snapshotTypingDuration}ms`,
485:       `fill ${snapshotTimeline.fill?.durationMs ?? 0}ms`,
486:       `emergence ${openingSnapshot?.emergence?.durationMs ?? 0}ms`,
487:     ];
488: 
```

- `src/theater/TheaterDirector.js:619`

```text
617:     // Warn about early cancellation in development
618:     if (import.meta?.env?.DEV) {
619:       if (this.phase === 'black' || this.phase === 'cursor' || this.phase === 'terminal') {
620:         console.warn('🎬 Director: WARNING - Cancelling during early phase:', this.phase);
621:         console.warn('   This may be caused by HMR or effect cleanup');
```

- `src/theater/TheaterDirector.js:900`

```text
898:       required: ['stage', 'quality', 'blueprint'],
899:       optional: ['cached', 'mode'],
900:       notes: 'Renderer consumes stage/quality/blueprint; mode=emergence for special handling.',
901:     },
902:     BUILD_EMERGENCE_BLUEPRINT: {
```

- `src/theater/TheaterDirector.js:905`

```text
903:       required: ['mode', 'source', 'target', 'count'],
904:       optional: ['tierRatios', 'viewportHint'],
905:       notes: 'Corrected contract for viewport spread → constellation emergence.',
906:     },
907:   },
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

- `src/theater/controllers/OpeningSequenceController.js:264`

```text
262: 
263:     const emergenceTiming = {
264:       ...DEFAULT_OPENING_TIMELINE.emergence,
265:       ...(timeline?.emergence ?? {}),
266:     };
```

- `src/theater/controllers/OpeningSequenceController.js:265`

```text
263:     const emergenceTiming = {
264:       ...DEFAULT_OPENING_TIMELINE.emergence,
265:       ...(timeline?.emergence ?? {}),
266:     };
267:     const emergenceProfile = {
```

- `src/theater/controllers/OpeningSequenceController.js:272`

```text
270:     };
271: 
272:     const chaosConfig = timeline?.chaos || {};
273:     const coalesceConfig = timeline?.coalesce || {};
274:     const settleConfig = timeline?.settle || {};
```

- `src/theater/controllers/OpeningSequenceController.js:273`

```text
271: 
272:     const chaosConfig = timeline?.chaos || {};
273:     const coalesceConfig = timeline?.coalesce || {};
274:     const settleConfig = timeline?.settle || {};
275: 
```

- `src/theater/controllers/OpeningSequenceController.js:274`

```text
272:     const chaosConfig = timeline?.chaos || {};
273:     const coalesceConfig = timeline?.coalesce || {};
274:     const settleConfig = timeline?.settle || {};
275: 
276:     const emergenceTimeline = {
```

- `src/theater/controllers/OpeningSequenceController.js:277`

```text
275: 
276:     const emergenceTimeline = {
277:       ...DEFAULT_OPENING_TIMELINE.emergence,
278:       ...(timeline?.emergence ?? {}),
279:     };
```

- `src/theater/controllers/OpeningSequenceController.js:278`

```text
276:     const emergenceTimeline = {
277:       ...DEFAULT_OPENING_TIMELINE.emergence,
278:       ...(timeline?.emergence ?? {}),
279:     };
280:     emergenceTimeline.durationMs = Math.max(
```

- `src/theater/controllers/OpeningSequenceController.js:282`

```text
280:     emergenceTimeline.durationMs = Math.max(
281:       0,
282:       Number(emergenceTimeline.durationMs ?? DEFAULT_OPENING_TIMELINE.emergence.durationMs),
283:     );
284:     emergenceTimeline.maxWaitMs = Math.max(
```

- `src/theater/controllers/OpeningSequenceController.js:286`

```text
284:     emergenceTimeline.maxWaitMs = Math.max(
285:       0,
286:       Number(emergenceTimeline.maxWaitMs ?? DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs),
287:     );
288:     const fencepostWaitMs = emergenceTimeline.maxWaitMs || DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs;
```

- `src/theater/controllers/OpeningSequenceController.js:288`

```text
286:       Number(emergenceTimeline.maxWaitMs ?? DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs),
287:     );
288:     const fencepostWaitMs = emergenceTimeline.maxWaitMs || DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs;
289:     const waitForFencepost = emergenceTimeline.waitForFencepost !== false;
290:     const shouldWaitForFencepost = waitForFencepost && !this.director._openingPrebound;
```

- `src/theater/controllers/OpeningSequenceController.js:293`

```text
291:     const stabilizeMs = Math.max(
292:       0,
293:       Number(emergenceTimeline.stabilizeMs ?? DEFAULT_OPENING_TIMELINE.emergence.stabilizeMs ?? 0),
294:     );
295:     const skipMorphAnimation = emergenceTimeline.skipMorphAnimation === true;
```

- `src/theater/controllers/OpeningSequenceController.js:297`

```text
295:     const skipMorphAnimation = emergenceTimeline.skipMorphAnimation === true;
296:     const skipGenesisBlueprint = emergenceTimeline.skipGenesisBlueprint !== false;
297:     const targetState = emergenceTimeline.targetState || DEFAULT_OPENING_TIMELINE.emergence.targetState;
298: 
299:     const emergenceConfig = { ...DEFAULT_OPENING_EMERGENCE, ...(openingEmergence ?? {}) };
```

- `src/theater/controllers/OpeningSequenceController.js:328`

```text
326: 
327:     try {
328:       this.director.phase = 'black';
329:       console.log(`   Phase: Black screen (${blackoutDuration}ms)`);
330:       if (blackoutDuration > 0) {
```

- `src/theater/controllers/OpeningSequenceController.js:329`

```text
327:     try {
328:       this.director.phase = 'black';
329:       console.log(`   Phase: Black screen (${blackoutDuration}ms)`);
330:       if (blackoutDuration > 0) {
331:         const waitResult = await this.director.sleep(blackoutDuration);
```

- `src/theater/controllers/OpeningSequenceController.js:335`

```text
333:       }
334:       if (skipTriggered) {
335:         console.log(`   Skip triggered before cursor phase (key: ${skipLabel})`);
336:       }
337: 
```

- `src/theater/controllers/OpeningSequenceController.js:339`

```text
337: 
338:       if (!skipTriggered) {
339:         this.director.phase = 'cursor';
340:         console.log(`   Phase: Cursor (blink x${cursorBlinkCount} @ ${cursorIntervalMs}ms)`);
341:         BeatBus.emit(EVENTS.CURSOR_SHOW);
```

- `src/theater/controllers/OpeningSequenceController.js:340`

```text
338:       if (!skipTriggered) {
339:         this.director.phase = 'cursor';
340:         console.log(`   Phase: Cursor (blink x${cursorBlinkCount} @ ${cursorIntervalMs}ms)`);
341:         BeatBus.emit(EVENTS.CURSOR_SHOW);
342:         BeatBus.emit(EVENTS.AUDIO_COMPUTER_HUM, { volume: cursorHumVolume });
```

- `src/theater/controllers/OpeningSequenceController.js:359`

```text
357:         this.director.phase = 'terminal';
358:         console.log(`   Phase: Terminal typing (~${typingDuration}ms)`);
359:         BeatBus.emit(EVENTS.TERMINAL_TYPE, typingConfig);
360:         if (typingDuration > 0) {
361:           const waitResult = await this.director.sleep(typingDuration);
```

- `src/theater/controllers/OpeningSequenceController.js:373`

```text
371:         this.director.phase = 'fill';
372:         console.log(`   Phase: Screen fill (${fillConfig.durationMs}ms)`);
373:         BeatBus.emit(EVENTS.SCREEN_FILL, { text: fillConfig.text, scrollSpeed: fillConfig.scrollSpeed });
374:         if (fillConfig.durationMs > 0) {
375:           const waitResult = await this.director.sleep(fillConfig.durationMs);
```

- `src/theater/controllers/OpeningSequenceController.js:381`

```text
379: 
380:       if (!skipTriggered && chaosConfig?.enabled !== false) {
381:         console.log('🔍 [ABOUT TO START CHAOS]', {
382:           chaosConfig,
383:           currentMorph: currentMorphValue,
```

- `src/theater/controllers/OpeningSequenceController.js:388`

```text
386:         if (!this.director._openingPrebound) {
387:           try {
388:             console.log('   Phase: Pre-chaos blueprint bind');
389:             BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {
390:               mode: 'opening_chaos',
```

- `src/theater/controllers/OpeningSequenceController.js:403`

```text
401:             this.director._openingPrebound = true;
402:           } catch (bindError) {
403:             console.warn('🎬 Director: Pre-chaos blueprint bind failed', bindError);
404:           }
405:           const bindSettleMs = Math.max(0, Number(chaosConfig?.bindLeadInMs ?? 120));
```

- `src/theater/controllers/OpeningSequenceController.js:430`

```text
428:                   const stageName = payload?.stage || blueprint?.stage || blueprint?.stageName;
429:                   const mode = payload?.mode || blueprint?.mode;
430:                   return stageName === 'genesis' && mode !== 'emergence';
431:                 },
432:               })
```

- `src/theater/controllers/OpeningSequenceController.js:437`

```text
435: 
436:           if (!readinessResult) {
437:             console.warn('⚠️ Director: Pre-chaos renderer readiness timed out');
438:           } else {
439:             console.log('✅ Blueprint bound and particles ready', {
```

- `src/theater/controllers/OpeningSequenceController.js:449`

```text
447:         const emergenceDuration = Math.max(0, Number(emergenceTiming.durationMs) || 0);
448:         if (emergenceDuration > 0) {
449:           this.director.phase = 'emergence';
450:           console.log(`   Phase: Emergence (${emergenceDuration}ms)`);
451:           console.log('      Particles breaking into gas cloud...');
```

- `src/theater/controllers/OpeningSequenceController.js:450`

```text
448:         if (emergenceDuration > 0) {
449:           this.director.phase = 'emergence';
450:           console.log(`   Phase: Emergence (${emergenceDuration}ms)`);
451:           console.log('      Particles breaking into gas cloud...');
452: 
```

- `src/theater/controllers/OpeningSequenceController.js:454`

```text
452: 
453:           BeatBus.emit(EVENTS.PARTICLE_PHASE, {
454:             phase: 'emergence',
455:             duration: emergenceDuration,
456:             target: emergenceProfile.target,
```

- `src/theater/controllers/OpeningSequenceController.js:472`

```text
470:           }
471: 
472:           console.log('✅ Emergence phase complete', {
473:             duration: emergenceDuration,
474:             timestamp: Date.now(),
```

- `src/theater/controllers/OpeningSequenceController.js:479`

```text
477: 
478:         const chaosDuration = Math.max(0, Number(chaosConfig.durationMs) || 0);
479:         this.director.phase = 'chaos';
480:         console.log(`   Phase: Chaos (${chaosDuration}ms)`);
481:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
```

- `src/theater/controllers/OpeningSequenceController.js:480`

```text
478:         const chaosDuration = Math.max(0, Number(chaosConfig.durationMs) || 0);
479:         this.director.phase = 'chaos';
480:         console.log(`   Phase: Chaos (${chaosDuration}ms)`);
481:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
482:           phase: 'chaos',
```

- `src/theater/controllers/OpeningSequenceController.js:482`

```text
480:         console.log(`   Phase: Chaos (${chaosDuration}ms)`);
481:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
482:           phase: 'chaos',
483:           duration: chaosDuration,
484:           rendererSpin: chaosConfig.rendererSpin || null,
```

- `src/theater/controllers/OpeningSequenceController.js:487`

```text
485:         });
486:         const chaosTarget = Number.isFinite(chaosConfig.morphTo) ? clamp01(chaosConfig.morphTo) : 0.0;
487:         const chaosAnimation = animateMorph(currentMorphValue, chaosTarget, chaosDuration, 'chaos');
488:         if (chaosDuration > 0) {
489:           const waitResult = await this.director.sleep(chaosDuration);
```

- `src/theater/controllers/OpeningSequenceController.js:499`

```text
497: 
498:       if (!skipTriggered && coalesceConfig?.enabled !== false) {
499:         console.log('🔍 [ABOUT TO START COALESCE]', {
500:           coalesceConfig,
501:           currentMorph: currentMorphValue,
```

- `src/theater/controllers/OpeningSequenceController.js:505`

```text
503:         });
504:         const coalesceDuration = Math.max(0, Number(coalesceConfig.durationMs) || 0);
505:         this.director.phase = 'coalesce';
506:         console.log(`   Phase: Coalesce (${coalesceDuration}ms → morph ${coalesceConfig.morphTo ?? '—'})`);
507:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
```

- `src/theater/controllers/OpeningSequenceController.js:506`

```text
504:         const coalesceDuration = Math.max(0, Number(coalesceConfig.durationMs) || 0);
505:         this.director.phase = 'coalesce';
506:         console.log(`   Phase: Coalesce (${coalesceDuration}ms → morph ${coalesceConfig.morphTo ?? '—'})`);
507:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
508:           phase: 'coalesce',
```

- `src/theater/controllers/OpeningSequenceController.js:508`

```text
506:         console.log(`   Phase: Coalesce (${coalesceDuration}ms → morph ${coalesceConfig.morphTo ?? '—'})`);
507:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
508:           phase: 'coalesce',
509:           duration: coalesceDuration,
510:           morphTarget: typeof coalesceConfig.morphTo === 'number' ? coalesceConfig.morphTo : null,
```

- `src/theater/controllers/OpeningSequenceController.js:516`

```text
514:         let coalesceAnimation = null;
515:         if (hasCoalesceTarget) {
516:           coalesceAnimation = animateMorph(currentMorphValue, coalesceTarget, coalesceDuration, 'coalesce');
517:         } else {
518:           emitMorphSnapshot(currentMorphValue, 'coalesce', coalesceTarget, coalesceDuration);
```

- `src/theater/controllers/OpeningSequenceController.js:518`

```text
516:           coalesceAnimation = animateMorph(currentMorphValue, coalesceTarget, coalesceDuration, 'coalesce');
517:         } else {
518:           emitMorphSnapshot(currentMorphValue, 'coalesce', coalesceTarget, coalesceDuration);
519:         }
520:         if (coalesceDuration > 0) {
```

- `src/theater/controllers/OpeningSequenceController.js:531`

```text
529: 
530:       if (!skipTriggered && settleConfig?.enabled !== false) {
531:         console.log('🔍 [ABOUT TO START SETTLE]', {
532:           settleConfig,
533:           currentMorph: currentMorphValue,
```

- `src/theater/controllers/OpeningSequenceController.js:537`

```text
535:         });
536:         const settleDuration = Math.max(0, Number(settleConfig.durationMs) || 0);
537:         this.director.phase = 'settle';
538:         console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
539:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
```

- `src/theater/controllers/OpeningSequenceController.js:538`

```text
536:         const settleDuration = Math.max(0, Number(settleConfig.durationMs) || 0);
537:         this.director.phase = 'settle';
538:         console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
539:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
540:           phase: 'settle',
```

- `src/theater/controllers/OpeningSequenceController.js:540`

```text
538:         console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
539:         BeatBus.emit(EVENTS.PARTICLE_PHASE, {
540:           phase: 'settle',
541:           duration: settleDuration,
542:           morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
```

- `src/theater/controllers/OpeningSequenceController.js:548`

```text
546:         let settleAnimation = null;
547:         if (hasSettleTarget) {
548:           settleAnimation = animateMorph(currentMorphValue, settleTarget, settleDuration, 'settle');
549:         } else {
550:           emitMorphSnapshot(currentMorphValue, 'settle', settleTarget, settleDuration);
```

- `src/theater/controllers/OpeningSequenceController.js:550`

```text
548:           settleAnimation = animateMorph(currentMorphValue, settleTarget, settleDuration, 'settle');
549:         } else {
550:           emitMorphSnapshot(currentMorphValue, 'settle', settleTarget, settleDuration);
551:         }
552:         if (settleDuration > 0) {
```

- `src/theater/controllers/OpeningSequenceController.js:563`

```text
561: 
562:       if (skipTriggered) {
563:         console.log(`   Opening skip engaged (${this._skipOrigin ?? 'user'}) → fast-forwarding to emergence.`);
564:         if (currentMorphValue < 1) {
565:           emitMorphSnapshot(1, 'skip-fast-forward', 1, 0);
```

- `src/theater/controllers/OpeningSequenceController.js:571`

```text
569:       }
570: 
571:       this.director.phase = 'emergence';
572:       const reusePreboundBlueprint = this.director._openingPrebound === true;
573:       console.log(
```

- `src/theater/controllers/OpeningSequenceController.js:574`

```text
572:       const reusePreboundBlueprint = this.director._openingPrebound === true;
573:       console.log(
574:         `   Phase: Particle emergence (${reusePreboundBlueprint ? 'reusing pre-bound blueprint' : 'SST governed'})`,
575:       );
576: 
```

- `src/theater/controllers/OpeningSequenceController.js:594`

```text
592:         });
593:       } else {
594:         emitMorphSnapshot(currentMorphValue, 'emergence', 1, emergenceTimeline.durationMs);
595:       }
596: 
```

- `src/theater/controllers/OpeningSequenceController.js:651`

```text
649:             const mode = payload?.mode || blueprint?.mode;
650:             const isGenesis = stage === 'genesis';
651:             const isEmergenceMode = mode === 'emergence';
652:             if (!isGenesis || isEmergenceMode) return;
653:             console.log('   Fallback: BLUEPRINT_READY (genesis full) before fencepost');
```

- `src/theater/controllers/OpeningSequenceController.js:675`

```text
673:       const toStage = 'genesis';
674:       this.director.phase = 'genesis';
675:       const previousStage = this.director.currentStage ?? 'emergence';
676:       console.log('🧬 Phase: Genesis stage handoff');
677: 
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

- `src/components/consciousness/ConsciousnessTheater.jsx:389`

```text
387:           window.unifiedNav.navigateToStage(targetStage, {
388:             smooth: true,
389:             skipNarration: false,
390:             source: 'keyboard_number',
391:           });
```

- `src/components/consciousness/ConsciousnessTheater.jsx:464`

```text
462:           window.unifiedNav.navigateToStage('genesis', {
463:             smooth: true,
464:             skipNarration: false,
465:             source: 'keyboard_reset',
466:           });
```

- `src/components/narrative/NarrationController.jsx:418`

```text
416:         if (DEBUG_NARRATION) {
417:           const preview = text.length > 50 ? `${text.slice(0, 50)}…` : text;
418:           console.log('🎙️ [BEAT FIRED]', {
419:             stage: stageName,
420:             segmentIndex,
```

- `src/components/narrative/NarrationController.jsx:506`

```text
504:             : Date.now();
505: 
506:         BeatBus.emit?.(EVENTS.NARRATIVE_LINE, {
507:           stage: stageName,
508:           segmentId: segment?.id ?? null,
```

- `src/components/narrative/NarrationController.jsx:660`

```text
658:   );
659: 
660:   const skipNarration = useCallback(
661:     (origin = 'skip') => {
662:       if (origin === 'external' && !isControlAllowed('narration:control')) {
```

- `src/components/narrative/NarrationController.jsx:770`

```text
768:           enumerable: true,
769:         },
770:         skipNarration: {
771:           value: () => skipNarration('external'),
772:           enumerable: true,
```

- `src/components/narrative/NarrationController.jsx:771`

```text
769:         },
770:         skipNarration: {
771:           value: () => skipNarration('external'),
772:           enumerable: true,
773:         },
```

- `src/components/narrative/NarrationController.jsx:804`

```text
802:     exposeControlSurface('narrationController', controllerFactory, {
803:       playNarration: 'narration:control',
804:       skipNarration: 'narration:control',
805:     });
806: 
```

- `src/components/narrative/NarrationController.jsx:825`

```text
823:       revokeControlSurface('narrationController');
824:     };
825:   }, [skipNarration, startNarration]);
826: 
827:   useEffect(() => {
```

- `src/components/narrative/NarrationController.jsx:834`

```text
832:       autoAdvanceEnabled,
833:       resetStateId: resetState,
834:       skipNarrationId: skipNarration,
835:       startNarrationId: startNarration,
836:     };
```

- `src/components/narrative/NarrationController.jsx:940`

```text
938:       event.preventDefault?.();
939:       event.stopPropagation?.();
940:       skipNarration('space');
941:     };
942: 
```

- `src/components/narrative/NarrationController.jsx:957`

```text
955:       resetState();
956:     };
957:   }, [currentStage, resetState, skipNarration, startNarration]);
958: 
959:   useEffect(() => {
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

- `src/config/canonical/canonicalAuthority.js:824`

```text
822:           source: 'phase3_auto_test',
823:           smooth: false,
824:           skipNarration: true,
825:         });
826:       } catch (error) {
```

- `src/config/canonical/canonicalAuthority.js:836`

```text
834:           source: 'phase3_auto_test_repeat',
835:           smooth: false,
836:           skipNarration: true,
837:         });
838:       } catch (error) {
```

- `src/config/canonical/canonicalAuthority.js:866`

```text
864:             source: 'phase3_auto_restore',
865:             smooth: false,
866:             skipNarration: true,
867:           });
868:         } catch {}
```

- `src/config/canonical/canonicalAuthority.js:995`

```text
993:           source: 'phase3_manual_forward',
994:           smooth: true,
995:           skipNarration: true,
996:         });
997: 
```

- `src/config/canonical/canonicalAuthority.js:1051`

```text
1049:           source: 'phase3_dedup_check',
1050:           smooth: true,
1051:           skipNarration: true,
1052:         });
1053:         await new Promise((resolve) => setTimeout(resolve, 600));
```

- `src/orchestration/navigation/narrativeNavigation.js:42`

```text
40:     .navigateToStage(stageName, {
41:       smooth,
42:       skipNarration: !emitNarration,
43:       source: 'narrative_navigation',
44:     })
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

- `src/state/commands/StateCommands.js:257`

```text
255:       smooth = true,
256:       force = false,
257:       skipNarration = false,
258:     } = options;
259: 
```

- `src/state/commands/StateCommands.js:278`

```text
276:         source,
277:         smooth,
278:         skipNarration,
279:       });
280: 
```

- `src/state/commands/StateCommands.js:325`

```text
323:       const navOptions = {
324:         smooth,
325:         skipNarration,
326:         source: `auto_advance_${source}`,
327:       };
```

- `src/theater/UnifiedNavigationAPI.js:91`

```text
89:     const {
90:       smooth = true,
91:       skipNarration = false,
92:       source = 'unknown',
93:       settleMs = 450,
```

- `src/theater/UnifiedNavigationAPI.js:101`

```text
99:       source,
100:       smooth,
101:       skipNarration,
102:       method: 'ORCHESTRATED',
103:     });
```

- `src/theater/UnifiedNavigationAPI.js:109`

```text
107:       validationResult = contractValidator.validateOrchestrated(targetStage, {
108:         smooth,
109:         skipNarration,
110:         source,
111:       });
```

- `src/theater/UnifiedNavigationAPI.js:173`

```text
171: 
172:     // Skip narration if requested
173:     if (skipNarration && window.narrationController?.skipNarration) {
174:       window.narrationController.skipNarration();
175:     }
```

- `src/theater/UnifiedNavigationAPI.js:174`

```text
172:     // Skip narration if requested
173:     if (skipNarration && window.narrationController?.skipNarration) {
174:       window.narrationController.skipNarration();
175:     }
176: 
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

- `src/components/narrative/NarrationController.jsx:530`

```text
528:           };
529: 
530:           console.groupCollapsed?.('📤 [NarrationController] Emitting RENDER_DIRECTIVE');
531:           console.log('Verb:', segment.visual);
532:           console.log('Stage:', stageName);
```

- `src/components/narrative/NarrationController.jsx:536`

```text
534:           console.groupEnd?.();
535: 
536:           BeatBus.emit?.(EVENTS.RENDER_DIRECTIVE, directive);
537: 
538:           if (typeof window !== 'undefined') {
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

- `src/components/webgl/WebGLBackground.jsx:268`

```text
266:     if (!payload) return;
267:     trace('WBG:FENCEPOST', payload);
268:     BeatBus.emit(EVENTS.PARTICLES_EMERGED, payload);
269:     if (import.meta?.env?.DEV) {
270:       console.log('✅ [RENDERER] PARTICLES_EMERGED emitted', payload);
```

- `src/components/webgl/WebGLBackground.jsx:270`

```text
268:     BeatBus.emit(EVENTS.PARTICLES_EMERGED, payload);
269:     if (import.meta?.env?.DEV) {
270:       console.log('✅ [RENDERER] PARTICLES_EMERGED emitted', payload);
271:     }
272: 
```

- `src/components/webgl/WebGLBackground.jsx:355`

```text
353:       const uniforms = mat?.uniforms;
354: 
355:       if (uniforms?.uMorphProgress) {
356:         uniforms.uMorphProgress.value = 1.0;
357:         if (uniforms.uStageProgress) {
```

- `src/components/webgl/WebGLBackground.jsx:356`

```text
354: 
355:       if (uniforms?.uMorphProgress) {
356:         uniforms.uMorphProgress.value = 1.0;
357:         if (uniforms.uStageProgress) {
358:           uniforms.uStageProgress.value = 1.0;
```

- `src/components/webgl/WebGLBackground.jsx:420`

```text
418:           attrs: geo ? Object.keys(geo.attributes || {}) : [],
419:           drawCount: geo?.drawRange?.count ?? null,
420:           morph: uniforms.uMorphProgress?.value ?? null,
421:           pointSize: uniforms.uPointSize?.value ?? null,
422:           freeze: uniforms.uPostMorphFreeze?.value ?? null,
```

- `src/components/webgl/WebGLBackground.jsx:576`

```text
574: 
575:   useEffect(() => {
576:     if (!BeatBus?.on || !EVENTS?.RENDER_DIRECTIVE) {
577:       return () => {};
578:     }
```

- `src/components/webgl/WebGLBackground.jsx:582`

```text
580:     const handleRenderDirective = (event = {}) => {
581:       if (DEV) {
582:         console.log('🎨 [WebGLBackground] RENDER_DIRECTIVE (renderer)', event);
583:       }
584: 
```

- `src/components/webgl/WebGLBackground.jsx:684`

```text
682:     };
683: 
684:     const off = BeatBus.on(EVENTS.RENDER_DIRECTIVE, handleRenderDirective);
685:     if (DEV) {
686:       console.log('🔌 [WebGLBackground] Subscribing to RENDER_DIRECTIVE (renderer layer)');
```

- `src/components/webgl/WebGLBackground.jsx:686`

```text
684:     const off = BeatBus.on(EVENTS.RENDER_DIRECTIVE, handleRenderDirective);
685:     if (DEV) {
686:       console.log('🔌 [WebGLBackground] Subscribing to RENDER_DIRECTIVE (renderer layer)');
687:     }
688: 
```

- `src/components/webgl/WebGLBackground.jsx:692`

```text
690:       off?.();
691:       if (DEV) {
692:         console.log('🔌 [WebGLBackground] Unsubscribing from RENDER_DIRECTIVE (renderer layer)');
693:       }
694:     };
```

- `src/components/webgl/WebGLBackground.jsx:701`

```text
699: 
700:     const testEventFlow = () => {
701:       console.group('🧪 Testing RENDER_DIRECTIVE Event Flow');
702:       const listeners =
703:         BeatBus?.getListeners?.(EVENTS.RENDER_DIRECTIVE) ??
```

- `src/components/webgl/WebGLBackground.jsx:703`

```text
701:       console.group('🧪 Testing RENDER_DIRECTIVE Event Flow');
702:       const listeners =
703:         BeatBus?.getListeners?.(EVENTS.RENDER_DIRECTIVE) ??
704:         BeatBus?._listeners?.[EVENTS.RENDER_DIRECTIVE] ??
705:         [];
```

- `src/components/webgl/WebGLBackground.jsx:704`

```text
702:       const listeners =
703:         BeatBus?.getListeners?.(EVENTS.RENDER_DIRECTIVE) ??
704:         BeatBus?._listeners?.[EVENTS.RENDER_DIRECTIVE] ??
705:         [];
706:       if (Array.isArray(listeners)) {
```

- `src/components/webgl/WebGLBackground.jsx:714`

```text
712: 
713:       console.log('📤 Emitting test directive...');
714:       BeatBus?.emit?.(EVENTS.RENDER_DIRECTIVE, {
715:         verb: 'test_flow',
716:         effect: {
```

- `src/components/webgl/WebGLBackground.jsx:764`

```text
762: 
763:       console.log('\n📊 Core animation uniforms:');
764:       ['uTime', 'uMorphProgress', 'uScrollProgress'].forEach((key) => {
765:         if (material.uniforms[key]) {
766:           console.log(`  ${key}:`, material.uniforms[key].value);
```

- `src/components/webgl/WebGLBackground.jsx:886`

```text
884:     if (!mat?.uniforms) return;
885:     const u = mat.uniforms;
886:     if (u.uMorphProgress) u.uMorphProgress.value = v;
887:     else if (u.morphProgress) u.morphProgress.value = v;
888:     else if (u.uMorph) u.uMorph.value = v;
```

- `src/components/webgl/WebGLBackground.jsx:946`

```text
944:       const start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
945:       morphProbeTimer = setInterval(() => {
946:         if (!uniforms?.uMorphProgress) return;
947:         const val = Number(uniforms.uMorphProgress.value) || 0;
948:         const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
```

- `src/components/webgl/WebGLBackground.jsx:947`

```text
945:       morphProbeTimer = setInterval(() => {
946:         if (!uniforms?.uMorphProgress) return;
947:         const val = Number(uniforms.uMorphProgress.value) || 0;
948:         const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
949:         console.log('[PROBE] uMorphProgress', { t: Math.round(now - start), val });
```

- `src/components/webgl/WebGLBackground.jsx:949`

```text
947:         const val = Number(uniforms.uMorphProgress.value) || 0;
948:         const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
949:         console.log('[PROBE] uMorphProgress', { t: Math.round(now - start), val });
950:         if (now - start > 2000) {
951:           clearInterval(morphProbeTimer);
```

- `src/components/webgl/WebGLBackground.jsx:1308`

```text
1306:             console.log('   Set uDriftAmp = 1.6');
1307:           }
1308:           if (uniforms.uMorphProgress) {
1309:             uniforms.uMorphProgress.value = 0;
1310:             console.log('   Reset uMorphProgress = 0');
```

- `src/components/webgl/WebGLBackground.jsx:1309`

```text
1307:           }
1308:           if (uniforms.uMorphProgress) {
1309:             uniforms.uMorphProgress.value = 0;
1310:             console.log('   Reset uMorphProgress = 0');
1311:           }
```

- `src/components/webgl/WebGLBackground.jsx:1310`

```text
1308:           if (uniforms.uMorphProgress) {
1309:             uniforms.uMorphProgress.value = 0;
1310:             console.log('   Reset uMorphProgress = 0');
1311:           }
1312:           if (uniforms.uStageProgress) {
```

- `src/components/webgl/WebGLBackground.jsx:1410`

```text
1408:             console.log('   Set uDriftAmp = 0.2');
1409:           }
1410:           if (uniforms.uMorphProgress && uniforms.uMorphProgress.value < 1.0) {
1411:             uniforms.uMorphProgress.value = 1.0;
1412:             console.log('   Set uMorphProgress = 1.0');
```

- `src/components/webgl/WebGLBackground.jsx:1411`

```text
1409:           }
1410:           if (uniforms.uMorphProgress && uniforms.uMorphProgress.value < 1.0) {
1411:             uniforms.uMorphProgress.value = 1.0;
1412:             console.log('   Set uMorphProgress = 1.0');
1413:           }
```

- `src/components/webgl/WebGLBackground.jsx:1412`

```text
1410:           if (uniforms.uMorphProgress && uniforms.uMorphProgress.value < 1.0) {
1411:             uniforms.uMorphProgress.value = 1.0;
1412:             console.log('   Set uMorphProgress = 1.0');
1413:           }
1414:           mat.uniformsNeedUpdate = true;
```

- `src/components/webgl/WebGLBackground.jsx:1541`

```text
1539:         uniforms: mat ? Object.keys(mat.uniforms || {}) : [],
1540:         hasGeometry: !!geometryRef.current,
1541:         morph: mat?.uniforms?.uMorphProgress?.value ?? null,
1542:       }));
1543: 
```

- `src/components/webgl/managers/BlueprintBinder.js:472`

```text
470:       const morphValueRaw = get('morphProgress') ?? get('value');
471:       const morphValueNum = toNumber(morphValueRaw);
472:       if (morphValueNum !== null && uniforms.uMorphProgress) {
473:         const clamped = clamp01(morphValueNum);
474:         const previous = Number(uniforms.uMorphProgress.value) || 0;
```

- `src/components/webgl/managers/BlueprintBinder.js:474`

```text
472:       if (morphValueNum !== null && uniforms.uMorphProgress) {
473:         const clamped = clamp01(morphValueNum);
474:         const previous = Number(uniforms.uMorphProgress.value) || 0;
475:         if (Math.abs(previous - clamped) > 1e-4) {
476:           uniforms.uMorphProgress.value = clamped;
```

- `src/components/webgl/managers/BlueprintBinder.js:476`

```text
474:         const previous = Number(uniforms.uMorphProgress.value) || 0;
475:         if (Math.abs(previous - clamped) > 1e-4) {
476:           uniforms.uMorphProgress.value = clamped;
477:           markDirty(uniforms.uMorphProgress);
478:         }
```

- `src/components/webgl/managers/BlueprintBinder.js:477`

```text
475:         if (Math.abs(previous - clamped) > 1e-4) {
476:           uniforms.uMorphProgress.value = clamped;
477:           markDirty(uniforms.uMorphProgress);
478:         }
479:         if (uniforms.uStageProgress) {
```

- `src/components/webgl/managers/BlueprintBinder.js:1002`

```text
1000:       scheduleRuntimeSampling?.();
1001: 
1002:       if (mat.uniforms?.uMorphProgress) {
1003:         if (isQrBlueprint) {
1004:           mat.uniforms.uMorphProgress.value = 1;
```

- `src/components/webgl/managers/BlueprintBinder.js:1004`

```text
1002:       if (mat.uniforms?.uMorphProgress) {
1003:         if (isQrBlueprint) {
1004:           mat.uniforms.uMorphProgress.value = 1;
1005:           if (mat.uniforms.uStageProgress) mat.uniforms.uStageProgress.value = 1;
1006:           if (mat.uniforms.uPostMorphFreeze) mat.uniforms.uPostMorphFreeze.value = 1;
```

- `src/components/webgl/managers/BlueprintBinder.js:1008`

```text
1006:           if (mat.uniforms.uPostMorphFreeze) mat.uniforms.uPostMorphFreeze.value = 1;
1007:         } else {
1008:           mat.uniforms.uMorphProgress.value = 0;
1009:           if (mat.uniforms.uStageProgress) mat.uniforms.uStageProgress.value = 0;
1010:         }
```

- `src/components/webgl/managers/BlueprintBinder.js:1035`

```text
1033:         );
1034:         const seededMorph = maybeSeedNumber(
1035:           matUniforms.uMorphProgress,
1036:           fallbackMorphRef?.current ?? 0,
1037:         );
```

- `src/components/webgl/managers/BlueprintBinder.js:1300`

```text
1298:       if (emittedEmergedRef) emittedEmergedRef.current = true;
1299:       if (emergencePendingRef) emergencePendingRef.current = false;
1300:       console.log('EMERGED once — emitting PARTICLES_EMERGED fencepost');
1301:     }
1302: 
```

- `src/components/webgl/managers/BlueprintBinder.js:1336`

```text
1334:     const matCurrent = materialRef?.current;
1335:     const currentUniforms = matCurrent?.uniforms;
1336:     if (!isEmergenceMode && currentUniforms?.uMorphProgress) {
1337:       const director =
1338:         typeof window !== 'undefined' ? window.theaterDirector : null;
```

- `src/components/webgl/managers/BlueprintBinder.js:1345`

```text
1343:       const startMorph = 0.0;
1344: 
1345:       currentUniforms.uMorphProgress.value = startMorph;
1346:       if (currentUniforms.uStageProgress) {
1347:         currentUniforms.uStageProgress.value = startMorph;
```

- `src/components/webgl/managers/BlueprintBinder.js:1377`

```text
1375:         const progress = Math.min(1, elapsed / duration);
1376:         const liveUniforms = matCurrent.uniforms;
1377:         if (liveUniforms?.uMorphProgress) {
1378:           liveUniforms.uMorphProgress.value = startMorph + (1 - startMorph) * progress;
1379:         }
```

- `src/components/webgl/managers/BlueprintBinder.js:1378`

```text
1376:         const liveUniforms = matCurrent.uniforms;
1377:         if (liveUniforms?.uMorphProgress) {
1378:           liveUniforms.uMorphProgress.value = startMorph + (1 - startMorph) * progress;
1379:         }
1380:         if (liveUniforms?.uStageProgress) {
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

- `src/dev/renderDiagnostics.js:230`

```text
228:       materials.forEach((mat, name) => {
229:         if (!mat?.uniforms) return;
230:         ['uMorphProgress', 'morphProgress', 'uMorph', 'morph'].forEach((key) => {
231:           const uniform = mat.uniforms[key];
232:           if (!uniform || uniform.value === value) return;
```

- `src/dev/renderDiagnostics.js:356`

```text
354: }
355: 
356: const DIAG_EVENT_DIRECTIVE = EVENTS?.RENDER_DIRECTIVE ?? 'RENDER_DIRECTIVE';
357: const DIAG_EVENT_BLUEPRINT = EVENTS?.BLUEPRINT_READY ?? 'BLUEPRINT_READY';
358: 
```

- `src/dev/renderDiagnostics.js:418`

```text
416: 
417:     mapEventFlow() {
418:       console.group('🔍 RENDER_DIRECTIVE Event Flow Mapping');
419:       const bus = getBeatBus();
420:       if (!bus) {
```

- `src/dev/renderDiagnostics.js:573`

```text
571:       const dual = binderHasHandler && bgHasHandler;
572:       if (dual) {
573:         console.warn('⚠️ Dual RENDER_DIRECTIVE handlers detected');
574:       }
575:       console.groupEnd();
```

- `src/dev/renderDiagnostics.js:686`

```text
684:         }
685:         if ((flow?.listenerCount ?? 0) > 1) {
686:           console.warn('🟡 Multiple RENDER_DIRECTIVE listeners registered');
687:         }
688:         console.log('Next steps:');
```

- `src/engine/ConsciousnessEngine.js:230`

```text
228:     subscribe('BUILD_EMERGENCE_BLUEPRINT', this._onBuildEmergence.bind(this));
229:     subscribe('START_CLIMAX', this._handleStartClimax.bind(this));
230:     subscribe('PARTICLES_EMERGED', () => {
231:       this._rendererFencepostSeen = true;
232:       this._emergenceActive = false;
```

- `src/engine/ConsciousnessEngine.js:443`

```text
441:       }
442: 
443:       // DO NOT emit PARTICLES_EMERGED - renderer owns this fencepost
444: 
445:     } catch (e) {
```

- `src/shaders/templates/consciousness-vertex.glsl:15`

```text
13: // Uniforms
14: uniform float uTime;
15: uniform float uMorphProgress;
16: uniform float uScrollProgress;
17: uniform float uPointSize;
```

- `src/shaders/templates/consciousness-vertex.glsl:68`

```text
66:   float mode = getTierMode(tierIndex);
67:   vec4 params = getTierParams(tierIndex);
68:   float taper = clamp(1.0 - uMorphProgress, 0.0, 1.0);
69:   vec3 offset = vec3(0.0);
70: 
```

- `src/shaders/templates/consciousness-vertex.glsl:195`

```text
193:   textPos.y *= uTextFit.y;
194: 
195:   float morph = clamp(uMorphProgress, 0.0, 1.0);
196:   float spread = max(uSpreadFactor, 0.0);
197:   float morphType = uMorphType;
```

- `src/shaders/templates/consciousness-vertex.glsl:261`

```text
259:   
260:   // Calculate alpha
261:   vAlpha = opacityData * (0.5 + 0.5 * uMorphProgress);
262:   vTier = tierData;
263: }
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

- `src/theater/controllers/OpeningSequenceController.js:415`

```text
413:           const readinessResult = await Promise.race([
414:             this.director
415:               ._waitForEvent(EVENTS.PARTICLES_EMERGED, {
416:                 timeout: 1200,
417:                 predicate: (payload = {}) => {
```

- `src/theater/controllers/OpeningSequenceController.js:636`

```text
634:           };
635: 
636:           const fenceOff = BeatBus.on(EVENTS.PARTICLES_EMERGED, (payload) => {
637:             console.log('   Received: PARTICLES_EMERGED');
638:             finish({ type: 'fencepost', payload });
```

- `src/theater/controllers/OpeningSequenceController.js:637`

```text
635: 
636:           const fenceOff = BeatBus.on(EVENTS.PARTICLES_EMERGED, (payload) => {
637:             console.log('   Received: PARTICLES_EMERGED');
638:             finish({ type: 'fencepost', payload });
639:           });
```

- `src/theater/controllers/OpeningSequenceController.js:642`

```text
640: 
641:           fenceTimeoutId = this.director._trackTimer?.(() => {
642:             console.warn(`⚠️ Director: ${EVENTS.PARTICLES_EMERGED} timed out after ${fencepostWaitMs}ms`);
643:             finish(null);
644:           }, fencepostWaitMs);
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



# Narration & Opening Evidence Report

Generated: 11/16/2025, 10:16:21 AM

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
  "generatedAt": "2025-11-16T16:16:20.476Z"
}
```

---
## 2) BeatBus Emitters/Listeners Map

# BeatBus Event Map
Total events: 38
## AUDIO_COMPUTER_HUM

**Emitters**:
- `src/theater/TheaterDirector.js:1101`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:190`

## BLUEPRINT_INVALIDATED

**Emitters**:
- `canon-console/runtime/blueprint-guard-v2.js:62`

**Listeners**:
- `src/dev/patternSMonitors.js:58`
- `src/engine/ConsciousnessEngine.js:404`

## BLUEPRINT_READY

**Emitters**:
- `src/engine/utils/blueprintUtils.js:167`

**Listeners**:
- `src/components/webgl/WebGLBackground.jsx:1665`
- `src/components/webgl/WebGLCanvas.jsx:264`
- `src/theater/TheaterDirector.js:241`
- `src/theater/TheaterDirector.js:1418`
- `canon-console/runtime/blueprint-guard-v2.js:14`
- `canon-console/runtime/blueprint-guard-v2.js:238`

## BUILD_EMERGENCE_BLUEPRINT

**Emitters**:
- `src/state/commands/StateCommands.js:212`
- `src/theater/TheaterDirector.js:1159`
- `src/theater/TheaterDirector.js:1352`

**Listeners**:
- `src/engine/ConsciousnessEngine.js:392`

## CANON_VIOLATION

**Emitters**:
- `canon-console/browser/inject.js:444`
- `canon-console/runtime/blueprint-guard-v2.js:252`

**Listeners**:
- `src/dev/patternSMonitors.js:67`

## CLIMAX_STEP

**Emitters**:
- `src/engine/ConsciousnessEngine.js:917`
- `src/engine/ConsciousnessEngine.js:1288`

**Listeners**:
- `src/components/fragments/ClimaxSequenceController.jsx:18`

## CURSOR_BLINK

**Emitters**:
- `src/theater/TheaterDirector.js:1107`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:111`

## CURSOR_SHOW

**Emitters**:
- `src/theater/TheaterDirector.js:1100`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:104`
- `canon-console/runtime/lifecycle-guards.js:67`

## DIRECTOR:MORPH_STATE

**Emitters**:
- `src/theater/TheaterDirector.js:432`

**Listeners**:
- `src/dev/patternSMonitors.js:38`

## DIRECTOR_CANCEL

**Emitters**:
- `src/theater/TheaterDirector.js:1646`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:235`

## DIRECTOR_ERROR

**Emitters**:
- `src/theater/TheaterDirector.js:943`

**Listeners**:
- `src/dev/patternSMonitors.js:63`

## DIRECTOR_OPENING_MODE

**Emitters**:
- `src/theater/TheaterDirector.js:1151`

**Listeners**:
- `src/dev/patternSMonitors.js:43`

## ENABLE_SCROLL

**Emitters**:
- `src/theater/TheaterDirector.js:1488`

**Listeners**:
- `src/components/consciousness/ConsciousnessTheater.jsx:190`
- `src/engine/ConsciousnessEngine.js:388`
- `src/state/commands/StateCommands.js:40`

## ENGINE:MORPH_STATE

**Emitters**:
- `src/engine/ConsciousnessEngine.js:702`
- `src/engine/ConsciousnessEngine.js:960`

**Listeners**:
- `src/dev/patternSMonitors.js:33`

## ENGINE_VIEWPORT_HINT

**Emitters**:
- `src/components/consciousness/ConsciousnessTheater.jsx:224`
- `src/components/webgl/WebGLBackground.jsx:728`
- `src/theater/TheaterDirector.js:1837`

**Listeners**:
- `src/components/consciousness/ConsciousnessTheater.jsx:174`
- `src/components/consciousness/ConsciousnessTheater.jsx:218`
- `src/engine/ConsciousnessEngine.js:387`
- `src/theater/TheaterDirector.js:877`
- `src/theater/TheaterDirector.js:1858`

## FENCEPOST_LISTENERS_READY

**Emitters**:
- `src/components/webgl/WebGLBackground.jsx:382`
- `src/theater/TheaterDirector.js:1388`

**Listeners**:
- `src/components/webgl/WebGLBackground.jsx:498`
- `src/theater/TheaterDirector.js:233`

## FENCEPOST_REPORT

**Emitters**:
- `canon-console/runtime/playbooks-extra.js:16`

**Listeners**:
- `src/dev/patternSMonitors.js:71`

## MORPH_PROGRESS

**Emitters**:
- `src/components/webgl/WebGLBackground.jsx:464`
- `src/components/webgl/WebGLBackground.jsx:1395`
- `src/theater/controllers/MorphAnimationController.js:36`

**Listeners**:
- `src/components/webgl/WebGLBackground.jsx:1893`
- `src/state/commands/StateCommands.js:125`

## NARRATION_CLEANUP

**Emitters**:
- `src/components/narrative/NarrationController.jsx:195`

**Listeners**:
- `src/components/narrative/NarrationOverlayBus.jsx:206`

## NARRATION_STOPPED

**Emitters**:
- `src/components/narrative/NarrationController.jsx:187`
- `src/components/narrative/NarrationController.jsx:466`

**Listeners**:
- `src/components/narrative/NarrationOverlayBus.jsx:205`

## NARRATIVE_LINE

**Emitters**:
- `src/components/narrative/NarrationController.jsx:607`

**Listeners**:
- `src/components/narrative/NarrationOverlayBus.jsx:204`
- `src/components/narrative/NarrativeChoreography.jsx:377`

## OPENING_COMPLETE

**Emitters**:
- `src/theater/TheaterDirector.js:1490`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:223`

## PARTICLES_EMERGED

**Emitters**:
- `src/components/webgl/WebGLBackground.jsx:349`
- `src/theater/TheaterDirector.js:1433`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:212`
- `src/components/ui/LCPHero.jsx:32`
- `src/engine/ConsciousnessEngine.js:394`
- `src/theater/TheaterDirector.js:237`
- `src/theater/TheaterDirector.js:1408`
- `canon-console/runtime/lifecycle-guards.js:68`

## PARTICLES_START_EMERGING

**Emitters**:
- `src/theater/TheaterDirector.js:1369`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:208`
- `src/components/webgl/WebGLBackground.jsx:853`

## PARTICLE_CLICK_HIT

**Emitters**:
- `src/components/webgl/WebGLBackground.jsx:1062`

**Listeners**:
- `src/dev/patternSMonitors.js:53`

## PARTICLE_CLICK_REQUEST

**Emitters**:
- `src/components/webgl/WebGLCanvas.jsx:337`

**Listeners**:
- `src/components/webgl/WebGLBackground.jsx:1073`

## PARTICLE_PHASE

**Emitters**:
- `src/theater/TheaterDirector.js:1229`
- `src/theater/TheaterDirector.js:1262`
- `src/theater/TheaterDirector.js:1304`

**Listeners**:
- `src/components/webgl/WebGLBackground.jsx:2172`

## PREWARM_COMPLETE

**Emitters**:
- `src/engine/ConsciousnessEngine.js:509`

**Listeners**:
- `src/theater/TheaterDirector.js:1653`

## PREWARM_GENESIS_BLUEPRINT

**Emitters**:
- `src/theater/TheaterDirector.js:1652`

**Listeners**:
- `src/engine/ConsciousnessEngine.js:391`

## QUALITY_CHANGE

**Emitters**:
- `src/state/atoms/qualityAtom.js:198`
- `src/state/commands/StateCommands.js:147`

**Listeners**:
- `src/engine/ConsciousnessEngine.js:390`
- `src/state/commands/StateCommands.js:89`

## RENDERER_TUNE

**Emitters**:
- `src/theater/TheaterDirector.js:1667`

**Listeners**:
- `src/dev/patternSMonitors.js:48`

## RENDER_DIRECTIVE

**Emitters**:
- `src/components/narrative/NarrationController.jsx:665`
- `src/theater/ScrollOrchestrator.js:409`
- `src/theater/TheaterDirector.js:545`
- `canon-console/runtime/hud.js:408`

**Listeners**:
- `src/components/webgl/WebGLBackground.jsx:1811`

## SCREEN_FILL

**Emitters**:
- `src/theater/TheaterDirector.js:1134`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:167`

## SCROLL_PROGRESS

**Emitters**:
- `src/theater/ScrollOrchestrator.js:317`

**Listeners**:
- `src/components/fragments/AmbientFragment.jsx:80`

## STAGE_CHANGE

**Emitters**:
- `src/state/commands/StateCommands.js:107`
- `src/theater/ScrollOrchestrator.js:339`
- `src/theater/TheaterDirector.js:1461`

**Listeners**:
- `src/components/narrative/NarrationController.jsx:1053`
- `src/components/narrative/NarrativeChoreography.jsx:382`
- `src/components/webgl/WebGLBackground.jsx:836`
- `src/components/webgl/WebGLBackground.jsx:862`
- `src/engine/ConsciousnessEngine.js:389`
- `src/state/atoms/qualityAtom.js:155`
- `src/state/commands/StateCommands.js:81`
- `src/theater/TheaterDirector.js:232`
- `src/theater/UnifiedNavigationAPI.js:192`

## START_CLIMAX

**Emitters**:
- `src/components/fragments/ClimaxSequenceController.jsx:49`

**Listeners**:
- `src/engine/ConsciousnessEngine.js:393`

## START_NARRATIVE

**Emitters**:
- `src/components/narrative/NarrationController.jsx:378`
- `src/orchestration/navigation/narrativeNavigation.js:20`
- `src/theater/TheaterDirector.js:732`
- `src/theater/TheaterDirector.js:1475`

**Listeners**:
- `src/components/consciousness/ConsciousnessTheater.jsx:195`
- `src/components/narrative/NarrationController.jsx:1052`
- `src/components/narrative/NarrationOverlayBus.jsx:203`

## TERMINAL_TYPE

**Emitters**:
- `src/theater/TheaterDirector.js:1119`

**Listeners**:
- `src/components/theater/OpeningSequence.jsx:126`



---
## 3) Pattern S — Single-Writer Violations

```json
[]
```

---
## 4) Pattern S — Ownership Compliance

```json
[]
```

---
## 5) Pattern S — Event Orphans

```json
[]
```

---
## 6) Pattern S — BeatBus Map (JSON)

```json
{
  "emitters": {
    "ENGINE_VIEWPORT_HINT": [
      {
        "file": "src/components/consciousness/ConsciousnessTheater.jsx",
        "line": 224
      },
      {
        "file": "src/components/webgl/WebGLBackground.jsx",
        "line": 728
      },
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1837
      }
    ],
    "START_CLIMAX": [
      {
        "file": "src/components/fragments/ClimaxSequenceController.jsx",
        "line": 49
      }
    ],
    "NARRATION_STOPPED": [
      {
        "file": "src/components/narrative/NarrationController.jsx",
        "line": 187
      },
      {
        "file": "src/components/narrative/NarrationController.jsx",
        "line": 466
      }
    ],
    "NARRATION_CLEANUP": [
      {
        "file": "src/components/narrative/NarrationController.jsx",
        "line": 195
      }
    ],
    "START_NARRATIVE": [
      {
        "file": "src/components/narrative/NarrationController.jsx",
        "line": 378
      },
      {
        "file": "src/orchestration/navigation/narrativeNavigation.js",
        "line": 20
      },
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 732
      },
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1475
      }
    ],
    "NARRATIVE_LINE": [
      {
        "file": "src/components/narrative/NarrationController.jsx",
        "line": 607
      }
    ],
    "RENDER_DIRECTIVE": [
      {
        "file": "src/components/narrative/NarrationController.jsx",
        "line": 665
      },
      {
        "file": "src/theater/ScrollOrchestrator.js",
        "line": 409
      },
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 545
      },
      {
        "file": "canon-console/runtime/hud.js",
        "line": 408
      }
    ],
    "PARTICLES_EMERGED": [
      {
        "file": "src/components/webgl/WebGLBackground.jsx",
        "line": 349
      },
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1433
      }
    ],
    "FENCEPOST_LISTENERS_READY": [
      {
        "file": "src/components/webgl/WebGLBackground.jsx",
        "line": 382
      },
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1388
      }
    ],
    "MORPH_PROGRESS": [
      {
        "file": "src/components/webgl/WebGLBackground.jsx",
        "line": 464
      },
      {
        "file": "src/components/webgl/WebGLBackground.jsx",
        "line": 1395
      },
      {
        "file": "src/theater/controllers/MorphAnimationController.js",
        "line": 36
      }
    ],
    "PARTICLE_CLICK_HIT": [
      {
        "file": "src/components/webgl/WebGLBackground.jsx",
        "line": 1062
      }
    ],
    "PARTICLE_CLICK_REQUEST": [
      {
        "file": "src/components/webgl/WebGLCanvas.jsx",
        "line": 337
      }
    ],
    "PREWARM_COMPLETE": [
      {
        "file": "src/engine/ConsciousnessEngine.js",
        "line": 509
      }
    ],
    "ENGINE:MORPH_STATE": [
      {
        "file": "src/engine/ConsciousnessEngine.js",
        "line": 702
      },
      {
        "file": "src/engine/ConsciousnessEngine.js",
        "line": 960
      }
    ],
    "CLIMAX_STEP": [
      {
        "file": "src/engine/ConsciousnessEngine.js",
        "line": 917
      },
      {
        "file": "src/engine/ConsciousnessEngine.js",
        "line": 1288
      }
    ],
    "BLUEPRINT_READY": [
      {
        "file": "src/engine/utils/blueprintUtils.js",
        "line": 167
      }
    ],
    "QUALITY_CHANGE": [
      {
        "file": "src/state/atoms/qualityAtom.js",
        "line": 198
      },
      {
        "file": "src/state/commands/StateCommands.js",
        "line": 147
      }
    ],
    "STAGE_CHANGE": [
      {
        "file": "src/state/commands/StateCommands.js",
        "line": 107
      },
      {
        "file": "src/theater/ScrollOrchestrator.js",
        "line": 339
      },
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1461
      }
    ],
    "BUILD_EMERGENCE_BLUEPRINT": [
      {
        "file": "src/state/commands/StateCommands.js",
        "line": 212
      },
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1159
      },
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1352
      }
    ],
    "SCROLL_PROGRESS": [
      {
        "file": "src/theater/ScrollOrchestrator.js",
        "line": 317
      }
    ],
    "DIRECTOR:MORPH_STATE": [
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 432
      }
    ],
    "DIRECTOR_ERROR": [
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 943
      }
    ],
    "CURSOR_SHOW": [
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1100
      }
    ],
    "AUDIO_COMPUTER_HUM": [
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1101
      }
    ],
    "CURSOR_BLINK": [
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1107
      }
    ],
    "TERMINAL_TYPE": [
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1119
      }
    ],
    "SCREEN_FILL": [
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1134
      }
    ],
    "DIRECTOR_OPENING_MODE": [
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1151
      }
    ],
    "PARTICLE_PHASE": [
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1229
      },
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1262
      },
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1304
      }
    ],
    "PARTICLES_START_EMERGING": [
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1369
      }
    ],
    "ENABLE_SCROLL": [
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1488
      }
    ],
    "OPENING_COMPLETE": [
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1490
      }
    ],
    "DIRECTOR_CANCEL": [
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1646
      }
    ],
    "PREWARM_GENESIS_BLUEPRINT": [
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1652
      }
    ],
    "RENDERER_TUNE": [
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1667
      }
    ],
    "CANON_VIOLATION": [
      {
        "file": "canon-console/browser/inject.js",
        "line": 444
      },
      {
        "file": "canon-console/runtime/blueprint-guard-v2.js",
        "line": 252
      }
    ],
    "BLUEPRINT_INVALIDATED": [
      {
        "file": "canon-console/runtime/blueprint-guard-v2.js",
        "line": 62
      }
    ],
    "FENCEPOST_REPORT": [
      {
        "file": "canon-console/runtime/playbooks-extra.js",
        "line": 16
      }
    ]
  },
  "listeners": {
    "ENGINE_VIEWPORT_HINT": [
      {
        "file": "src/components/consciousness/ConsciousnessTheater.jsx",
        "line": 174
      },
      {
        "file": "src/components/consciousness/ConsciousnessTheater.jsx",
        "line": 218
      },
      {
        "file": "src/engine/ConsciousnessEngine.js",
        "line": 387
      },
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 877
      },
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1858
      }
    ],
    "ENABLE_SCROLL": [
      {
        "file": "src/components/consciousness/ConsciousnessTheater.jsx",
        "line": 190
      },
      {
        "file": "src/engine/ConsciousnessEngine.js",
        "line": 388
      },
      {
        "file": "src/state/commands/StateCommands.js",
        "line": 40
      }
    ],
    "START_NARRATIVE": [
      {
        "file": "src/components/consciousness/ConsciousnessTheater.jsx",
        "line": 195
      },
      {
        "file": "src/components/narrative/NarrationController.jsx",
        "line": 1052
      },
      {
        "file": "src/components/narrative/NarrationOverlayBus.jsx",
        "line": 203
      }
    ],
    "SCROLL_PROGRESS": [
      {
        "file": "src/components/fragments/AmbientFragment.jsx",
        "line": 80
      }
    ],
    "CLIMAX_STEP": [
      {
        "file": "src/components/fragments/ClimaxSequenceController.jsx",
        "line": 18
      }
    ],
    "STAGE_CHANGE": [
      {
        "file": "src/components/narrative/NarrationController.jsx",
        "line": 1053
      },
      {
        "file": "src/components/narrative/NarrativeChoreography.jsx",
        "line": 382
      },
      {
        "file": "src/components/webgl/WebGLBackground.jsx",
        "line": 836
      },
      {
        "file": "src/components/webgl/WebGLBackground.jsx",
        "line": 862
      },
      {
        "file": "src/engine/ConsciousnessEngine.js",
        "line": 389
      },
      {
        "file": "src/state/atoms/qualityAtom.js",
        "line": 155
      },
      {
        "file": "src/state/commands/StateCommands.js",
        "line": 81
      },
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 232
      },
      {
        "file": "src/theater/UnifiedNavigationAPI.js",
        "line": 192
      }
    ],
    "NARRATIVE_LINE": [
      {
        "file": "src/components/narrative/NarrationOverlayBus.jsx",
        "line": 204
      },
      {
        "file": "src/components/narrative/NarrativeChoreography.jsx",
        "line": 377
      }
    ],
    "NARRATION_STOPPED": [
      {
        "file": "src/components/narrative/NarrationOverlayBus.jsx",
        "line": 205
      }
    ],
    "NARRATION_CLEANUP": [
      {
        "file": "src/components/narrative/NarrationOverlayBus.jsx",
        "line": 206
      }
    ],
    "CURSOR_SHOW": [
      {
        "file": "src/components/theater/OpeningSequence.jsx",
        "line": 104
      },
      {
        "file": "canon-console/runtime/lifecycle-guards.js",
        "line": 67
      }
    ],
    "CURSOR_BLINK": [
      {
        "file": "src/components/theater/OpeningSequence.jsx",
        "line": 111
      }
    ],
    "TERMINAL_TYPE": [
      {
        "file": "src/components/theater/OpeningSequence.jsx",
        "line": 126
      }
    ],
    "SCREEN_FILL": [
      {
        "file": "src/components/theater/OpeningSequence.jsx",
        "line": 167
      }
    ],
    "AUDIO_COMPUTER_HUM": [
      {
        "file": "src/components/theater/OpeningSequence.jsx",
        "line": 190
      }
    ],
    "PARTICLES_START_EMERGING": [
      {
        "file": "src/components/theater/OpeningSequence.jsx",
        "line": 208
      },
      {
        "file": "src/components/webgl/WebGLBackground.jsx",
        "line": 853
      }
    ],
    "PARTICLES_EMERGED": [
      {
        "file": "src/components/theater/OpeningSequence.jsx",
        "line": 212
      },
      {
        "file": "src/components/ui/LCPHero.jsx",
        "line": 32
      },
      {
        "file": "src/engine/ConsciousnessEngine.js",
        "line": 394
      },
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 237
      },
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1408
      },
      {
        "file": "canon-console/runtime/lifecycle-guards.js",
        "line": 68
      }
    ],
    "OPENING_COMPLETE": [
      {
        "file": "src/components/theater/OpeningSequence.jsx",
        "line": 223
      }
    ],
    "DIRECTOR_CANCEL": [
      {
        "file": "src/components/theater/OpeningSequence.jsx",
        "line": 235
      }
    ],
    "FENCEPOST_LISTENERS_READY": [
      {
        "file": "src/components/webgl/WebGLBackground.jsx",
        "line": 498
      },
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 233
      }
    ],
    "PARTICLE_CLICK_REQUEST": [
      {
        "file": "src/components/webgl/WebGLBackground.jsx",
        "line": 1073
      }
    ],
    "BLUEPRINT_READY": [
      {
        "file": "src/components/webgl/WebGLBackground.jsx",
        "line": 1665
      },
      {
        "file": "src/components/webgl/WebGLCanvas.jsx",
        "line": 264
      },
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 241
      },
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1418
      },
      {
        "file": "canon-console/runtime/blueprint-guard-v2.js",
        "line": 14
      },
      {
        "file": "canon-console/runtime/blueprint-guard-v2.js",
        "line": 238
      }
    ],
    "RENDER_DIRECTIVE": [
      {
        "file": "src/components/webgl/WebGLBackground.jsx",
        "line": 1811
      }
    ],
    "MORPH_PROGRESS": [
      {
        "file": "src/components/webgl/WebGLBackground.jsx",
        "line": 1893
      },
      {
        "file": "src/state/commands/StateCommands.js",
        "line": 125
      }
    ],
    "PARTICLE_PHASE": [
      {
        "file": "src/components/webgl/WebGLBackground.jsx",
        "line": 2172
      }
    ],
    "ENGINE:MORPH_STATE": [
      {
        "file": "src/dev/patternSMonitors.js",
        "line": 33
      }
    ],
    "DIRECTOR:MORPH_STATE": [
      {
        "file": "src/dev/patternSMonitors.js",
        "line": 38
      }
    ],
    "DIRECTOR_OPENING_MODE": [
      {
        "file": "src/dev/patternSMonitors.js",
        "line": 43
      }
    ],
    "RENDERER_TUNE": [
      {
        "file": "src/dev/patternSMonitors.js",
        "line": 48
      }
    ],
    "PARTICLE_CLICK_HIT": [
      {
        "file": "src/dev/patternSMonitors.js",
        "line": 53
      }
    ],
    "BLUEPRINT_INVALIDATED": [
      {
        "file": "src/dev/patternSMonitors.js",
        "line": 58
      },
      {
        "file": "src/engine/ConsciousnessEngine.js",
        "line": 404
      }
    ],
    "DIRECTOR_ERROR": [
      {
        "file": "src/dev/patternSMonitors.js",
        "line": 63
      }
    ],
    "CANON_VIOLATION": [
      {
        "file": "src/dev/patternSMonitors.js",
        "line": 67
      }
    ],
    "FENCEPOST_REPORT": [
      {
        "file": "src/dev/patternSMonitors.js",
        "line": 71
      }
    ],
    "QUALITY_CHANGE": [
      {
        "file": "src/engine/ConsciousnessEngine.js",
        "line": 390
      },
      {
        "file": "src/state/commands/StateCommands.js",
        "line": 89
      }
    ],
    "PREWARM_GENESIS_BLUEPRINT": [
      {
        "file": "src/engine/ConsciousnessEngine.js",
        "line": 391
      }
    ],
    "BUILD_EMERGENCE_BLUEPRINT": [
      {
        "file": "src/engine/ConsciousnessEngine.js",
        "line": 392
      }
    ],
    "START_CLIMAX": [
      {
        "file": "src/engine/ConsciousnessEngine.js",
        "line": 393
      }
    ],
    "PREWARM_COMPLETE": [
      {
        "file": "src/theater/TheaterDirector.js",
        "line": 1653
      }
    ]
  }
}
```

---
## 7) Source Evidence

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

- `src/components/consciousness/ConsciousnessTheater.jsx:386`

```text
384:             });
385:           } else {
386:             stageAtom.jumpToStage(targetStage);
387:           }
388:         }
```

- `src/components/consciousness/ConsciousnessTheater.jsx:443`

```text
441:         case 'r':
442:         case 'R':
443:           stageAtom.jumpToStage('genesis');
444:           morphProgressRef.current = stateCommands.setMorphProgress(0, { origin: 'reset' });
445:           break;
```

- `src/components/narrative/NarrationController.jsx:1053`

```text
1051: 
1052:     const offStart = BeatBus.on?.(EVENTS.START_NARRATIVE, handleStart);
1053:     const offStageChange = BeatBus.on?.(EVENTS.STAGE_CHANGE, handleStageChange);
1054: 
1055:     const keyHandler = (event) => {
```

- `src/components/narrative/NarrativeChoreography.jsx:382`

```text
380: 
381:   useEffect(() => {
382:     const offStage = BeatBus.on?.(EVENTS.STAGE_CHANGE, (payload = {}) => {
383:       stageSequenceRef.current = {
384:         stage: payload?.to || payload?.stage || currentStage,
```

- `src/components/webgl/WebGLBackground.jsx:836`

```text
834:   // Passive fallbacks (OK to keep)
835:   useEffect(() => {
836:     const off = BeatBus?.on?.(EVENTS.STAGE_CHANGE, (p) => {
837:       const st = p?.stage ?? p?.to ?? p?.name ?? String(p);
838:       setStageName(st);
```

- `src/components/webgl/WebGLBackground.jsx:862`

```text
860:   useEffect(() => {
861:     let morphProbeTimer = null;
862:     const off = BeatBus?.on?.(EVENTS.STAGE_CHANGE, () => {
863:       if (morphProbeTimer) {
864:         clearInterval(morphProbeTimer);
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

- `src/state/commands/StateCommands.js:196`

```text
194:       if (!gateActive || gateTarget === targetStage) {
195:         if (currentStage !== targetStage) {
196:           stageAtom.jumpToStage(targetStage);
197:         }
198:       }
```

- `src/theater/ScrollOrchestrator.js:3`

```text
1: // src/theater/ScrollOrchestrator.js
2: // BeatGlyph v3.3 — ScrollOrchestrator
3: // Purpose: map window scroll -> stage-local progress; publish MORPH_PROGRESS and STAGE_CHANGE.
4: // Kinetics: speedMultiplier=2.0, smoothing=0.15, overshoot=0.05 (v3.3 canon)
5: 
```

- `src/theater/ScrollOrchestrator.js:339`

```text
337:           timestamp: performance.now(),
338:         });
339:         BeatBus.emit?.(EVENTS.STAGE_CHANGE, { 
340:           stage: stageName, 
341:           index: stageIdx,
```

- `src/theater/TheaterDirector.js:232`

```text
230: 
231:     if (typeof BeatBus?.on === 'function') {
232:       this._stageChangeUnsubscribe = BeatBus.on(EVENTS.STAGE_CHANGE, this._handleStageChangeBound);
233:       this._rendererFenceUnsubscribe = BeatBus.on(
234:         EVENTS.FENCEPOST_LISTENERS_READY,
```

- `src/theater/TheaterDirector.js:1461`

```text
1459:       console.log('🧬 Phase: Genesis stage handoff');
1460: 
1461:       BeatBus.emit(EVENTS.STAGE_CHANGE, {
1462:         from: previousStage,
1463:         to: toStage,
```

- `src/theater/TheaterDirector.js:1904`

```text
1902:   version: '1.0.1',
1903:   events: {
1904:     STAGE_CHANGE: {
1905:       required: ['from', 'to'],
1906:       notes: 'Canonical shape. Old `{stage}` payload is deprecated.',
```

- `src/theater/TheaterDirector.js:1924`

```text
1922:   },
1923:   deprecations: {
1924:     STAGE_CHANGE: { stage: 'deprecated' },
1925:     QUALITY_CHANGE: { quality: 'deprecated' },
1926:   },
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

- `src/theater/events.js:35`

```text
33:   NARRATION_STOPPED: 'NARRATION_STOPPED',
34:   NARRATION_CLEANUP: 'NARRATION_CLEANUP',
35:   STAGE_CHANGE: 'STAGE_CHANGE',                  // { from, to } (canonical)
36:   START_CLIMAX: 'START_CLIMAX',                  // Trigger climax sequence
37: 
```

## OPENING_PHASE

- `src/components/consciousness/ConsciousnessTheater.jsx:124`

```text
122:           border: 'none',
123:           borderRadius: '5px',
124:           cursor: 'pointer',
125:           fontFamily: 'Courier New, monospace',
126:           fontWeight: 'bold',
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

- `src/components/theater/OpeningSequence.jsx:18`

```text
16: export default function OpeningSequence() {
17:   const [visible, setVisible] = useState(false);
18:   const [phase, setPhase] = useState('black');
19:   const [cursorVisible, setCursorVisible] = useState(false);
20:   const [lines, setLines] = useState([]);
```

- `src/components/theater/OpeningSequence.jsx:103`

```text
101: 
102:     const eventHandlers = [
103:       // CURSOR SHOW
104:       BeatBus.on(EVENTS.CURSOR_SHOW, () => {
105:         console.log('   OpeningSequence: CURSOR_SHOW received');
```

- `src/components/theater/OpeningSequence.jsx:106`

```text
104:       BeatBus.on(EVENTS.CURSOR_SHOW, () => {
105:         console.log('   OpeningSequence: CURSOR_SHOW received');
106:         setPhase('cursor');
107:         setCursorVisible(true);
108:       }),
```

- `src/components/theater/OpeningSequence.jsx:110`

```text
108:       }),
109: 
110:       // CURSOR BLINK
111:       BeatBus.on(EVENTS.CURSOR_BLINK, async ({ count = 2, interval = 500 } = {}) => {
112:         console.log(`   OpeningSequence: CURSOR_BLINK received (${count} times)`);
```

- `src/components/theater/OpeningSequence.jsx:126`

```text
124: 
125:       // TERMINAL TYPE
126:       BeatBus.on(EVENTS.TERMINAL_TYPE, async ({ lines: toType = [], typeSpeed = 50, lineDelay = 300 } = {}) => {
127:         console.log('   OpeningSequence: TERMINAL_TYPE received');
128:         setPhase('typing');
```

- `src/components/theater/OpeningSequence.jsx:127`

```text
125:       // TERMINAL TYPE
126:       BeatBus.on(EVENTS.TERMINAL_TYPE, async ({ lines: toType = [], typeSpeed = 50, lineDelay = 300 } = {}) => {
127:         console.log('   OpeningSequence: TERMINAL_TYPE received');
128:         setPhase('typing');
129:         setCursorVisible(false);
```

- `src/components/theater/OpeningSequence.jsx:167`

```text
165: 
166:       // SCREEN FILL
167:       BeatBus.on(EVENTS.SCREEN_FILL, ({ text = `${GENESIS_STAGE_WORD} `, scrollSpeed = 50 } = {}) => {
168:         console.log('   OpeningSequence: SCREEN_FILL received');
169:         setPhase('fill');
```

- `src/components/theater/OpeningSequence.jsx:168`

```text
166:       // SCREEN FILL
167:       BeatBus.on(EVENTS.SCREEN_FILL, ({ text = `${GENESIS_STAGE_WORD} `, scrollSpeed = 50 } = {}) => {
168:         console.log('   OpeningSequence: SCREEN_FILL received');
169:         setPhase('fill');
170:         fillStartRef.current =
```

- `src/components/theater/OpeningSequence.jsx:289`

```text
287:       }}
288:     >
289:       {/* BLACK SCREEN PHASE */}
290:       {phase === 'black' && (
291:         <div style={{ width: '100%', height: '100%', backgroundColor: '#000000' }} />
```

- `src/components/theater/OpeningSequence.jsx:290`

```text
288:     >
289:       {/* BLACK SCREEN PHASE */}
290:       {phase === 'black' && (
291:         <div style={{ width: '100%', height: '100%', backgroundColor: '#000000' }} />
292:       )}
```

- `src/components/theater/OpeningSequence.jsx:294`

```text
292:       )}
293: 
294:       {/* CURSOR PHASE */}
295:       {phase === 'cursor' && (
296:         <div
```

- `src/components/theater/OpeningSequence.jsx:295`

```text
293: 
294:       {/* CURSOR PHASE */}
295:       {phase === 'cursor' && (
296:         <div
297:           style={{
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

- `src/components/webgl/WebGLBackground.jsx:774`

```text
772:   }, [emitViewportHint]);
773: 
774:   // Fallback morph sink (outside emergence directives)
775:   const __applyMorph = (v) => {
776:     const mat = materialRef.current;
```

- `src/components/webgl/WebGLBackground.jsx:851`

```text
849:   }, []);
850: 
851:   // Emergence flag (no local tween; engine drives via directives)
852:   useEffect(() => {
853:     const off = BeatBus?.on?.(EVENTS.PARTICLES_START_EMERGING, () => {
```

- `src/components/webgl/WebGLBackground.jsx:1103`

```text
1101:       if (id === lastBlueprintIdRef.current) return;
1102:       lastBlueprintIdRef.current = id;
1103:       const isEmergence = mode === 'emergence' || raw?.mode === 'emergence';
1104:       const isOpeningChaos = mode === 'opening_chaos' || raw?.mode === 'opening_chaos';
1105:       const shouldFastForward = isEmergence && (fastForwardRequested || skipMorph);
```

- `src/components/webgl/WebGLBackground.jsx:1130`

```text
1128:         }
1129:       }
1130:       // ignore late emergence after handoff
1131:       if (isEmergence && emittedEmergedRef.current) return;
1132: 
```

- `src/components/webgl/WebGLBackground.jsx:1290`

```text
1288:       if (mat) {
1289:         applyRendererFits(geo, viewportHintRef.current || viewport);
1290:         logBind(isEmergence ? 'emergence' : 'stage', {
1291:           stage: raw.stageName || st || 'genesis',
1292:           mode: mode || raw?.mode || (isEmergence ? 'emergence' : 'full'),
```

- `src/components/webgl/WebGLBackground.jsx:1292`

```text
1290:         logBind(isEmergence ? 'emergence' : 'stage', {
1291:           stage: raw.stageName || st || 'genesis',
1292:           mode: mode || raw?.mode || (isEmergence ? 'emergence' : 'full'),
1293:           cached: !!cached,
1294:         });
```

- `src/components/webgl/WebGLBackground.jsx:1299`

```text
1297:           fenceReadyRef.current = true;
1298:           flushPendingFencepost();
1299:           emitRendererFencepostReady(isEmergence ? 'emergence-bind' : 'opening-bind');
1300:         }
1301:         if (mat?.uniforms?.uMorphProgress) {
```

- `src/components/webgl/WebGLBackground.jsx:1374`

```text
1372: 
1373:       if (isEmergence) {
1374:         console.log('✅ Renderer: BR(emergence) bound', `count=${raw.particleCount || raw.activeCount}`, `quality=${quality}`);
1375:         emergencePendingRef.current = true;
1376:         emittedEmergedRef.current = false;
```

- `src/components/webgl/WebGLBackground.jsx:1404`

```text
1402:           const source = fastForwardRequested ? 'renderer-fastforward' : 'renderer-skip-morph';
1403:           if (finalizeEmergence(source)) {
1404:             console.log('⚡ Renderer: Emergence fast-forward applied', {
1405:               source,
1406:               cacheKey,
```

- `src/components/webgl/WebGLBackground.jsx:1583`

```text
1581: 
1582:       // ---------- MORPH: start at 0 for FULL binds so we actually see the transition ----------
1583:       const isEmergenceMode = payload?.mode === 'emergence' || payload?.blueprint?.mode === 'emergence';
1584:       const matCurrent = materialRef.current;
1585:       const currentUniforms = matCurrent?.uniforms;
```

- `src/components/webgl/WebGLBackground.jsx:1590`

```text
1588:         const currentStage = director?.getCurrentStage?.() ?? director?.currentStage ?? null;
1589:         const currentPhase = director?.getCurrentPhase?.() ?? director?.phase ?? null;
1590:         const isOpeningPhase = currentStage === 'genesis' && currentPhase !== 'emergence';
1591:         const startMorph = 0.0;
1592: 
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
498:   async _onPrewarmGenesis() {
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

- `src/engine/ConsciousnessEngine.js:1593`

```text
1591: 
1592:       if (this._emergenceActive && stage !== 'genesis') {
1593:         console.warn('🧠 Engine: rebuild blocked during emergence timeline', { stage, quality });
1594:         this._log('rebuild_blocked_emergence', { stage, quality });
1595:         return;
```

- `src/engine/ConsciousnessEngine.js:1601`

```text
1599:       let blueprint = this.blueprintCache.get(cacheKey);
1600: 
1601:     // Post-emergence genesis: optionally preserve settled emergence
1602:     if (stage === 'genesis' && this._lastEmergenceTargets) {
1603:       if (this._lastText3DFallbackUsed) {
```

- `src/engine/ConsciousnessEngine.js:1604`

```text
1602:     if (stage === 'genesis' && this._lastEmergenceTargets) {
1603:       if (this._lastText3DFallbackUsed) {
1604:         console.warn('🧠 Engine: Emergence fallback detected; skipping preserve');
1605:         this._lastEmergenceTargets = null;
1606:         this._emergenceDone = false;
```

- `src/engine/ConsciousnessEngine.js:1609`

```text
1607:         this._rendererFencepostSeen = false;
1608:       } else if (!this._emergenceDone) {
1609:         console.warn('🧠 Engine: Emergence incomplete; rebuilding genesis cleanly');
1610:         this._lastEmergenceTargets = null;
1611:         this._emergenceDone = false;
```

- `src/engine/ConsciousnessEngine.js:1619`

```text
1617:         this._rendererFencepostSeen = false;
1618:       } else {
1619:         console.log('🧠 Engine: Building post-emergence genesis (preserving emergence result)');
1620: 
1621:         const emergenceCount = Math.max(0, Math.floor(this._lastEmergenceTargets.length / 3));
```

- `src/engine/ConsciousnessEngine.js:1626`

```text
1624:         const preservedBlueprint = createBlueprintStructure(emergenceCount, {
1625:           stageName: 'genesis',
1626:           mode: 'post-emergence-guarded',
1627:           quality,
1628:           metadata: {
```

- `src/engine/ConsciousnessEngine.js:1629`

```text
1627:           quality,
1628:           metadata: {
1629:             mode: 'post-emergence-guarded',
1630:             preservedEmergence: true,
1631:             buildTime: typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(),
```

- `src/engine/ConsciousnessEngine.js:1664`

```text
1662:             preservedBlueprint.metadata = {
1663:               ...lastBp.metadata,
1664:               mode: 'post-emergence-guarded',
1665:               preservedEmergence: true,
1666:               buildTime: typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(),
```

- `src/engine/ConsciousnessEngine.js:1694`

```text
1692:             stage,
1693:             quality,
1694:             mode: 'post-emergence-guarded',
1695:             cacheKey,
1696:             preservedEmergence: true,
```

- `src/engine/ConsciousnessEngine.js:1703`

```text
1701:             quality,
1702:             cacheKey,
1703:             mode: 'post-emergence-guarded',
1704:             particleCount: preservedBlueprint.particleCount,
1705:           });
```

- `src/engine/ConsciousnessEngine.js:1945`

```text
1943:           console.log(`✅ 3D font loaded from ${usedUrl}; cleared text3D cache (was ${oldSize} entries)`);
1944:           try {
1945:             if (this._lastText3DFallbackUsed && this._lastBlueprint?.metadata?.mode === 'emergence') {
1946:               console.log('🔁 Rebuilding emergence with real text3D now that font is ready…');
1947:               this.buildEmergenceBlueprint({ mode: 'emergence' });
```

- `src/engine/ConsciousnessEngine.js:1946`

```text
1944:           try {
1945:             if (this._lastText3DFallbackUsed && this._lastBlueprint?.metadata?.mode === 'emergence') {
1946:               console.log('🔁 Rebuilding emergence with real text3D now that font is ready…');
1947:               this.buildEmergenceBlueprint({ mode: 'emergence' });
1948:             }
```

- `src/engine/ConsciousnessEngine.js:1947`

```text
1945:             if (this._lastText3DFallbackUsed && this._lastBlueprint?.metadata?.mode === 'emergence') {
1946:               console.log('🔁 Rebuilding emergence with real text3D now that font is ready…');
1947:               this.buildEmergenceBlueprint({ mode: 'emergence' });
1948:             }
1949:           } catch {}
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

- `src/state/commands/StateCommands.js:204`

```text
202:   }
203: 
204:   // Programmatic emergence trigger (only for opening sequence)
205:   triggerEmergence(payload = {}) {
206:     if (!this.canEmit('BUILD_EMERGENCE_BLUEPRINT')) {
```

- `src/state/commands/StateCommands.js:207`

```text
205:   triggerEmergence(payload = {}) {
206:     if (!this.canEmit('BUILD_EMERGENCE_BLUEPRINT')) {
207:       console.error('[StateCommands] Cannot trigger emergence - contract violation');
208:       return false;
209:     }
```

- `src/state/commands/StateCommands.js:213`

```text
211:     this.recordEmission('BUILD_EMERGENCE_BLUEPRINT');
212:     BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {
213:       mode: 'emergence',
214:       source: 'viewportSpread',
215:       target: 'constellation',
```

- `src/theater/ScrollOrchestrator.js:306`

```text
304:       const local = clamp01((easedPct - start) / Math.max(1, end - start));
305: 
306:       // v3.5 adjustment: keep genesis fully formed (no post-emergence un-morph)
307:       if (stageIdx === 0) {
308:         this.morphTarget = 1;
```

- `src/theater/TheaterDirector.js:49`

```text
47: const DEFAULT_OPENING_TIMELINE = {
48:   blackout: { durationMs: 2000 },
49:   cursor: { blinkCount: 2, intervalMs: 500, leadInMs: 500, settleMs: 1000 },
50:   typing: { lines: DEFAULT_TYPING_LINES, typeSpeed: 50, lineDelay: 500, completionDelayMs: 800 },
51:   fill: { text: null, scrollSpeed: 100, durationMs: 2000 },
```

- `src/theater/TheaterDirector.js:52`

```text
50:   typing: { lines: DEFAULT_TYPING_LINES, typeSpeed: 50, lineDelay: 500, completionDelayMs: 800 },
51:   fill: { text: null, scrollSpeed: 100, durationMs: 2000 },
52:   chaos: { enabled: true, durationMs: 2000, rendererSpin: { z: 0.5, y: 0.2 } },
53:   coalesce: { enabled: true, durationMs: 2000, morphTo: 0.6 },
54:   settle: { enabled: true, durationMs: 1200, morphTo: 1.0 },
```

- `src/theater/TheaterDirector.js:53`

```text
51:   fill: { text: null, scrollSpeed: 100, durationMs: 2000 },
52:   chaos: { enabled: true, durationMs: 2000, rendererSpin: { z: 0.5, y: 0.2 } },
53:   coalesce: { enabled: true, durationMs: 2000, morphTo: 0.6 },
54:   settle: { enabled: true, durationMs: 1200, morphTo: 1.0 },
55:   emergence: {
```

- `src/theater/TheaterDirector.js:54`

```text
52:   chaos: { enabled: true, durationMs: 2000, rendererSpin: { z: 0.5, y: 0.2 } },
53:   coalesce: { enabled: true, durationMs: 2000, morphTo: 0.6 },
54:   settle: { enabled: true, durationMs: 1200, morphTo: 1.0 },
55:   emergence: {
56:     durationMs: 2000,
```

- `src/theater/TheaterDirector.js:55`

```text
53:   coalesce: { enabled: true, durationMs: 2000, morphTo: 0.6 },
54:   settle: { enabled: true, durationMs: 1200, morphTo: 1.0 },
55:   emergence: {
56:     durationMs: 2000,
57:     waitForFencepost: true,
```

- `src/theater/TheaterDirector.js:86`

```text
84: const DEFAULT_OPENING_EMERGENCE = {
85:   target: 'constellation',
86:   mode: 'emergence',
87:   source: 'viewportSpread',
88: };
```

- `src/theater/TheaterDirector.js:91`

```text
89: 
90: const PHASE_DIRECTIVE_ENVELOPE = {
91:   chaos: {
92:     motionMode: 3,
93:     particlePhase: 2,
```

- `src/theater/TheaterDirector.js:98`

```text
96:     opacity: [0.45, 0.95],
97:   },
98:   coalesce: {
99:     motionMode: 2,
100:     particlePhase: 3,
```

- `src/theater/TheaterDirector.js:105`

```text
103:     opacity: [0.35, 0.85],
104:   },
105:   settle: {
106:     motionMode: 1,
107:     particlePhase: 1,
```

- `src/theater/TheaterDirector.js:112`

```text
110:     opacity: [0.25, 0.75],
111:   },
112:   emergence: {
113:     motionMode: 3,
114:     particlePhase: 2,
```

- `src/theater/TheaterDirector.js:174`

```text
172:       console.log('📋 [OPENING TIMELINE]', {
173:         hasTimeline: !!openingProbe?.timeline,
174:         chaos: openingProbe?.timeline?.chaos,
175:         coalesce: openingProbe?.timeline?.coalesce,
176:         settle: openingProbe?.timeline?.settle,
```

- `src/theater/TheaterDirector.js:175`

```text
173:         hasTimeline: !!openingProbe?.timeline,
174:         chaos: openingProbe?.timeline?.chaos,
175:         coalesce: openingProbe?.timeline?.coalesce,
176:         settle: openingProbe?.timeline?.settle,
177:         hasChaosConfig: !!openingProbe?.timeline?.chaos,
```

- `src/theater/TheaterDirector.js:176`

```text
174:         chaos: openingProbe?.timeline?.chaos,
175:         coalesce: openingProbe?.timeline?.coalesce,
176:         settle: openingProbe?.timeline?.settle,
177:         hasChaosConfig: !!openingProbe?.timeline?.chaos,
178:       });
```

- `src/theater/TheaterDirector.js:177`

```text
175:         coalesce: openingProbe?.timeline?.coalesce,
176:         settle: openingProbe?.timeline?.settle,
177:         hasChaosConfig: !!openingProbe?.timeline?.chaos,
178:       });
179:     } catch (timelineError) {
```

- `src/theater/TheaterDirector.js:259`

```text
257:         ...(stageTimeline.blackout ?? {}),
258:       },
259:       cursor: {
260:         ...DEFAULT_OPENING_TIMELINE.cursor,
261:         ...(openingTimeline.cursor ?? {}),
```

- `src/theater/TheaterDirector.js:260`

```text
258:       },
259:       cursor: {
260:         ...DEFAULT_OPENING_TIMELINE.cursor,
261:         ...(openingTimeline.cursor ?? {}),
262:         ...(stageTimeline.cursor ?? {}),
```

- `src/theater/TheaterDirector.js:261`

```text
259:       cursor: {
260:         ...DEFAULT_OPENING_TIMELINE.cursor,
261:         ...(openingTimeline.cursor ?? {}),
262:         ...(stageTimeline.cursor ?? {}),
263:       },
```

- `src/theater/TheaterDirector.js:262`

```text
260:         ...DEFAULT_OPENING_TIMELINE.cursor,
261:         ...(openingTimeline.cursor ?? {}),
262:         ...(stageTimeline.cursor ?? {}),
263:       },
264:       typing: {
```

- `src/theater/TheaterDirector.js:274`

```text
272:         ...(stageTimeline.fill ?? {}),
273:       },
274:       chaos: {
275:         ...DEFAULT_OPENING_TIMELINE.chaos,
276:         ...(openingTimeline.chaos ?? {}),
```

- `src/theater/TheaterDirector.js:275`

```text
273:       },
274:       chaos: {
275:         ...DEFAULT_OPENING_TIMELINE.chaos,
276:         ...(openingTimeline.chaos ?? {}),
277:         ...(stageTimeline.chaos ?? {}),
```

- `src/theater/TheaterDirector.js:276`

```text
274:       chaos: {
275:         ...DEFAULT_OPENING_TIMELINE.chaos,
276:         ...(openingTimeline.chaos ?? {}),
277:         ...(stageTimeline.chaos ?? {}),
278:       },
```

- `src/theater/TheaterDirector.js:277`

```text
275:         ...DEFAULT_OPENING_TIMELINE.chaos,
276:         ...(openingTimeline.chaos ?? {}),
277:         ...(stageTimeline.chaos ?? {}),
278:       },
279:       coalesce: {
```

- `src/theater/TheaterDirector.js:279`

```text
277:         ...(stageTimeline.chaos ?? {}),
278:       },
279:       coalesce: {
280:         ...DEFAULT_OPENING_TIMELINE.coalesce,
281:         ...(openingTimeline.coalesce ?? {}),
```

- `src/theater/TheaterDirector.js:280`

```text
278:       },
279:       coalesce: {
280:         ...DEFAULT_OPENING_TIMELINE.coalesce,
281:         ...(openingTimeline.coalesce ?? {}),
282:         ...(stageTimeline.coalesce ?? {}),
```

- `src/theater/TheaterDirector.js:281`

```text
279:       coalesce: {
280:         ...DEFAULT_OPENING_TIMELINE.coalesce,
281:         ...(openingTimeline.coalesce ?? {}),
282:         ...(stageTimeline.coalesce ?? {}),
283:       },
```

- `src/theater/TheaterDirector.js:282`

```text
280:         ...DEFAULT_OPENING_TIMELINE.coalesce,
281:         ...(openingTimeline.coalesce ?? {}),
282:         ...(stageTimeline.coalesce ?? {}),
283:       },
284:       settle: {
```

- `src/theater/TheaterDirector.js:284`

```text
282:         ...(stageTimeline.coalesce ?? {}),
283:       },
284:       settle: {
285:         ...DEFAULT_OPENING_TIMELINE.settle,
286:         ...(openingTimeline.settle ?? {}),
```

- `src/theater/TheaterDirector.js:285`

```text
283:       },
284:       settle: {
285:         ...DEFAULT_OPENING_TIMELINE.settle,
286:         ...(openingTimeline.settle ?? {}),
287:         ...(stageTimeline.settle ?? {}),
```

- `src/theater/TheaterDirector.js:286`

```text
284:       settle: {
285:         ...DEFAULT_OPENING_TIMELINE.settle,
286:         ...(openingTimeline.settle ?? {}),
287:         ...(stageTimeline.settle ?? {}),
288:       },
```

- `src/theater/TheaterDirector.js:287`

```text
285:         ...DEFAULT_OPENING_TIMELINE.settle,
286:         ...(openingTimeline.settle ?? {}),
287:         ...(stageTimeline.settle ?? {}),
288:       },
289:       profile: stageTimeline.profile ?? openingTimeline.profile ?? null,
```

- `src/theater/TheaterDirector.js:294`

```text
292:     };
293: 
294:     const emergenceTimeline = stageTimeline.emergence ?? openingTimeline.emergence ?? {};
295: 
296:     const fallbackSkipKey = 'SPACE';
```

- `src/theater/TheaterDirector.js:306`

```text
304:       totalDurationMs: stageTimeline.totalDurationMs ?? opening.totalDurationMs ?? null,
305:       timeline,
306:       emergence: { ...DEFAULT_OPENING_EMERGENCE, ...emergenceTimeline },
307:     };
308:   }
```

- `src/theater/TheaterDirector.js:925`

```text
923: 
924:     const segments = [
925:       `black ${snapshotTimeline?.blackout?.durationMs ?? DEFAULT_OPENING_TIMELINE.blackout.durationMs}ms`,
926:       `cursor blink x${snapshotTimeline?.cursor?.blinkCount ?? DEFAULT_OPENING_TIMELINE.cursor.blinkCount}` +
927:         ` @ ${(snapshotTimeline?.cursor?.intervalMs ?? DEFAULT_OPENING_TIMELINE.cursor.intervalMs)}ms`,
```

- `src/theater/TheaterDirector.js:926`

```text
924:     const segments = [
925:       `black ${snapshotTimeline?.blackout?.durationMs ?? DEFAULT_OPENING_TIMELINE.blackout.durationMs}ms`,
926:       `cursor blink x${snapshotTimeline?.cursor?.blinkCount ?? DEFAULT_OPENING_TIMELINE.cursor.blinkCount}` +
927:         ` @ ${(snapshotTimeline?.cursor?.intervalMs ?? DEFAULT_OPENING_TIMELINE.cursor.intervalMs)}ms`,
928:       `typing ~${snapshotTypingDuration}ms`,
```

- `src/theater/TheaterDirector.js:927`

```text
925:       `black ${snapshotTimeline?.blackout?.durationMs ?? DEFAULT_OPENING_TIMELINE.blackout.durationMs}ms`,
926:       `cursor blink x${snapshotTimeline?.cursor?.blinkCount ?? DEFAULT_OPENING_TIMELINE.cursor.blinkCount}` +
927:         ` @ ${(snapshotTimeline?.cursor?.intervalMs ?? DEFAULT_OPENING_TIMELINE.cursor.intervalMs)}ms`,
928:       `typing ~${snapshotTypingDuration}ms`,
929:       `fill ${snapshotTimeline?.fill?.durationMs ?? DEFAULT_OPENING_TIMELINE.fill.durationMs}ms`,
```

- `src/theater/TheaterDirector.js:930`

```text
928:       `typing ~${snapshotTypingDuration}ms`,
929:       `fill ${snapshotTimeline?.fill?.durationMs ?? DEFAULT_OPENING_TIMELINE.fill.durationMs}ms`,
930:       `emergence ${snapshotTimeline?.emergence?.durationMs ?? DEFAULT_OPENING_TIMELINE.emergence.durationMs}ms`,
931:     ];
932: 
```

- `src/theater/TheaterDirector.js:969`

```text
967: 
968:     const opening = this._getOpeningConfig();
969:     const { timeline, skipKey, emergence: openingEmergence } = opening ?? {};
970: 
971:     const blackoutDuration = Math.max(
```

- `src/theater/TheaterDirector.js:977`

```text
975: 
976:     const cursorConfig = {
977:       ...DEFAULT_OPENING_TIMELINE.cursor,
978:       ...(timeline?.cursor ?? {}),
979:     };
```

- `src/theater/TheaterDirector.js:978`

```text
976:     const cursorConfig = {
977:       ...DEFAULT_OPENING_TIMELINE.cursor,
978:       ...(timeline?.cursor ?? {}),
979:     };
980:     const cursorLeadInMs = Math.max(0, Number(cursorConfig.leadInMs ?? 0));
```

- `src/theater/TheaterDirector.js:982`

```text
980:     const cursorLeadInMs = Math.max(0, Number(cursorConfig.leadInMs ?? 0));
981:     const cursorSettleMs = Math.max(0, Number(cursorConfig.settleMs ?? 0));
982:     const cursorBlinkCount = Math.max(0, Number(cursorConfig.blinkCount ?? DEFAULT_OPENING_TIMELINE.cursor.blinkCount));
983:     const cursorIntervalMs = Math.max(0, Number(cursorConfig.intervalMs ?? DEFAULT_OPENING_TIMELINE.cursor.intervalMs));
984:     const cursorHumVolume = Number.isFinite(cursorConfig.humVolume) ? cursorConfig.humVolume : 0.25;
```

- `src/theater/TheaterDirector.js:983`

```text
981:     const cursorSettleMs = Math.max(0, Number(cursorConfig.settleMs ?? 0));
982:     const cursorBlinkCount = Math.max(0, Number(cursorConfig.blinkCount ?? DEFAULT_OPENING_TIMELINE.cursor.blinkCount));
983:     const cursorIntervalMs = Math.max(0, Number(cursorConfig.intervalMs ?? DEFAULT_OPENING_TIMELINE.cursor.intervalMs));
984:     const cursorHumVolume = Number.isFinite(cursorConfig.humVolume) ? cursorConfig.humVolume : 0.25;
985: 
```

- `src/theater/TheaterDirector.js:1018`

```text
1016:     }
1017: 
1018:     const chaosConfig = timeline?.chaos || {};
1019:     const coalesceConfig = timeline?.coalesce || {};
1020:     const settleConfig = timeline?.settle || {};
```

- `src/theater/TheaterDirector.js:1019`

```text
1017: 
1018:     const chaosConfig = timeline?.chaos || {};
1019:     const coalesceConfig = timeline?.coalesce || {};
1020:     const settleConfig = timeline?.settle || {};
1021: 
```

- `src/theater/TheaterDirector.js:1020`

```text
1018:     const chaosConfig = timeline?.chaos || {};
1019:     const coalesceConfig = timeline?.coalesce || {};
1020:     const settleConfig = timeline?.settle || {};
1021: 
1022:     const emergenceTimeline = {
```

- `src/theater/TheaterDirector.js:1023`

```text
1021: 
1022:     const emergenceTimeline = {
1023:       ...DEFAULT_OPENING_TIMELINE.emergence,
1024:       ...(timeline?.emergence ?? {}),
1025:     };
```

- `src/theater/TheaterDirector.js:1024`

```text
1022:     const emergenceTimeline = {
1023:       ...DEFAULT_OPENING_TIMELINE.emergence,
1024:       ...(timeline?.emergence ?? {}),
1025:     };
1026:     emergenceTimeline.durationMs = Math.max(
```

- `src/theater/TheaterDirector.js:1028`

```text
1026:     emergenceTimeline.durationMs = Math.max(
1027:       0,
1028:       Number(emergenceTimeline.durationMs ?? DEFAULT_OPENING_TIMELINE.emergence.durationMs),
1029:     );
1030:     emergenceTimeline.maxWaitMs = Math.max(
```

- `src/theater/TheaterDirector.js:1032`

```text
1030:     emergenceTimeline.maxWaitMs = Math.max(
1031:       0,
1032:       Number(emergenceTimeline.maxWaitMs ?? DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs),
1033:     );
1034:     const fencepostWaitMs = emergenceTimeline.maxWaitMs || DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs;
```

- `src/theater/TheaterDirector.js:1034`

```text
1032:       Number(emergenceTimeline.maxWaitMs ?? DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs),
1033:     );
1034:     const fencepostWaitMs = emergenceTimeline.maxWaitMs || DEFAULT_OPENING_TIMELINE.emergence.maxWaitMs;
1035:     const waitForFencepost = emergenceTimeline.waitForFencepost !== false;
1036:     const shouldWaitForFencepost = waitForFencepost && !this._openingPrebound;
```

- `src/theater/TheaterDirector.js:1039`

```text
1037:     const stabilizeMs = Math.max(
1038:       0,
1039:       Number(emergenceTimeline.stabilizeMs ?? DEFAULT_OPENING_TIMELINE.emergence.stabilizeMs ?? 0),
1040:     );
1041:     const skipMorphAnimation = emergenceTimeline.skipMorphAnimation === true;
```

- `src/theater/TheaterDirector.js:1043`

```text
1041:     const skipMorphAnimation = emergenceTimeline.skipMorphAnimation === true;
1042:     const skipGenesisBlueprint = emergenceTimeline.skipGenesisBlueprint !== false;
1043:     const targetState = emergenceTimeline.targetState || DEFAULT_OPENING_TIMELINE.emergence.targetState;
1044: 
1045:     const emergenceConfig = { ...DEFAULT_OPENING_EMERGENCE, ...(openingEmergence ?? {}) };
```

- `src/theater/TheaterDirector.js:1085`

```text
1083: 
1084:     try {
1085:       // ───────────────── Phase 1: Black
1086:       this.phase = 'black';
1087:       console.log(`   Phase: Black screen (${blackoutDuration}ms)`);
```

- `src/theater/TheaterDirector.js:1086`

```text
1084:     try {
1085:       // ───────────────── Phase 1: Black
1086:       this.phase = 'black';
1087:       console.log(`   Phase: Black screen (${blackoutDuration}ms)`);
1088:       if (blackoutDuration > 0) {
```

- `src/theater/TheaterDirector.js:1087`

```text
1085:       // ───────────────── Phase 1: Black
1086:       this.phase = 'black';
1087:       console.log(`   Phase: Black screen (${blackoutDuration}ms)`);
1088:       if (blackoutDuration > 0) {
1089:         const waitResult = await this.sleep(blackoutDuration);
```

- `src/theater/TheaterDirector.js:1093`

```text
1091:       }
1092:       if (skipTriggered) {
1093:         console.log(`   Skip triggered before cursor phase (key: ${skipLabel})`);
1094:       }
1095: 
```

- `src/theater/TheaterDirector.js:1096`

```text
1094:       }
1095: 
1096:       // ───────────────── Phase 2: Cursor
1097:       if (!skipTriggered) {
1098:         this.phase = 'cursor';
```

- `src/theater/TheaterDirector.js:1098`

```text
1096:       // ───────────────── Phase 2: Cursor
1097:       if (!skipTriggered) {
1098:         this.phase = 'cursor';
1099:         console.log(`   Phase: Cursor (blink x${cursorBlinkCount} @ ${cursorIntervalMs}ms)`);
1100:         BeatBus.emit(EVENTS.CURSOR_SHOW);
```

- `src/theater/TheaterDirector.js:1099`

```text
1097:       if (!skipTriggered) {
1098:         this.phase = 'cursor';
1099:         console.log(`   Phase: Cursor (blink x${cursorBlinkCount} @ ${cursorIntervalMs}ms)`);
1100:         BeatBus.emit(EVENTS.CURSOR_SHOW);
1101:         BeatBus.emit(EVENTS.AUDIO_COMPUTER_HUM, { volume: cursorHumVolume });
```

- `src/theater/TheaterDirector.js:1119`

```text
1117:         this.phase = 'terminal';
1118:         console.log(`   Phase: Terminal typing (~${typingDuration}ms)`);
1119:         BeatBus.emit(EVENTS.TERMINAL_TYPE, typingConfig);
1120:         if (typingDuration > 0) {
1121:           const waitResult = await this.sleep(typingDuration);
```

- `src/theater/TheaterDirector.js:1134`

```text
1132:       this.phase = 'fill';
1133:       console.log(`   Phase: Screen fill (${fillConfig.durationMs}ms)`);
1134:       BeatBus.emit(EVENTS.SCREEN_FILL, { text: fillConfig.text, scrollSpeed: fillConfig.scrollSpeed });
1135:       if (fillConfig.durationMs > 0) {
1136:         const waitResult = await this.sleep(fillConfig.durationMs);
```

- `src/theater/TheaterDirector.js:1142`

```text
1140: 
1141:     if (!skipTriggered && chaosConfig?.enabled !== false) {
1142:       console.log('🔍 [ABOUT TO START CHAOS]', {
1143:         chaosConfig,
1144:         currentMorph: currentMorphValue,
```

- `src/theater/TheaterDirector.js:1149`

```text
1147:       if (!this._openingPrebound) {
1148:         try {
1149:           console.log('   Phase: Pre-chaos blueprint bind');
1150:           if (!this._openingModeAnnounced) {
1151:             BeatBus.emit(EVENTS.DIRECTOR_OPENING_MODE, {
```

- `src/theater/TheaterDirector.js:1173`

```text
1171:           this._openingPrebound = true;
1172:         } catch (bindError) {
1173:           console.warn('🎬 Director: Pre-chaos blueprint bind failed', bindError);
1174:         }
1175:         const bindSettleMs = Math.max(0, Number(chaosConfig?.bindLeadInMs ?? 120));
```

- `src/theater/TheaterDirector.js:1216`

```text
1214: 
1215:         if (!readinessResult) {
1216:           console.warn('⚠️ Director: Pre-chaos renderer readiness timed out');
1217:         } else {
1218:           console.log('✅ Blueprint bound and particles ready', {
```

- `src/theater/TheaterDirector.js:1227`

```text
1225: 
1226:       const chaosDuration = Math.max(0, Number(chaosConfig.durationMs) || 0);
1227:       this.phase = 'chaos';
1228:       console.log(`   Phase: Chaos (${chaosDuration}ms)`);
1229:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
```

- `src/theater/TheaterDirector.js:1228`

```text
1226:       const chaosDuration = Math.max(0, Number(chaosConfig.durationMs) || 0);
1227:       this.phase = 'chaos';
1228:       console.log(`   Phase: Chaos (${chaosDuration}ms)`);
1229:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
1230:         name: 'chaos',
```

- `src/theater/TheaterDirector.js:1230`

```text
1228:       console.log(`   Phase: Chaos (${chaosDuration}ms)`);
1229:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
1230:         name: 'chaos',
1231:         duration: chaosDuration,
1232:         rendererSpin: chaosConfig.rendererSpin || null,
```

- `src/theater/TheaterDirector.js:1244`

```text
1242:           source: OPENING_MORPH_SOURCE,
1243:         });
1244:         console.log(`🎯 [Opening Chaos] Animator owns morph (${chaosDuration}ms)`);
1245:       }
1246:       if (chaosDuration > 0) {
```

- `src/theater/TheaterDirector.js:1254`

```text
1252: 
1253:     if (!skipTriggered && coalesceConfig?.enabled !== false) {
1254:       console.log('🔍 [ABOUT TO START COALESCE]', {
1255:         coalesceConfig,
1256:         currentMorph: currentMorphValue,
```

- `src/theater/TheaterDirector.js:1260`

```text
1258:       });
1259:       const coalesceDuration = Math.max(0, Number(coalesceConfig.durationMs) || 0);
1260:       this.phase = 'coalesce';
1261:       console.log(`   Phase: Coalesce (${coalesceDuration}ms → morph ${coalesceConfig.morphTo ?? '—'})`);
1262:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
```

- `src/theater/TheaterDirector.js:1261`

```text
1259:       const coalesceDuration = Math.max(0, Number(coalesceConfig.durationMs) || 0);
1260:       this.phase = 'coalesce';
1261:       console.log(`   Phase: Coalesce (${coalesceDuration}ms → morph ${coalesceConfig.morphTo ?? '—'})`);
1262:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
1263:         name: 'coalesce',
```

- `src/theater/TheaterDirector.js:1263`

```text
1261:       console.log(`   Phase: Coalesce (${coalesceDuration}ms → morph ${coalesceConfig.morphTo ?? '—'})`);
1262:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
1263:         name: 'coalesce',
1264:         duration: coalesceDuration,
1265:         morphTarget: typeof coalesceConfig.morphTo === 'number' ? coalesceConfig.morphTo : null,
```

- `src/theater/TheaterDirector.js:1284`

```text
1282:           source: OPENING_MORPH_SOURCE,
1283:         });
1284:         console.log(`🎯 [Opening Coalesce] Animator owns morph (${coalesceDuration}ms)`);
1285:       } else {
1286:         emitMorphSnapshot(currentMorphValue, 'coalesce', coalesceTarget, coalesceDuration);
```

- `src/theater/TheaterDirector.js:1286`

```text
1284:         console.log(`🎯 [Opening Coalesce] Animator owns morph (${coalesceDuration}ms)`);
1285:       } else {
1286:         emitMorphSnapshot(currentMorphValue, 'coalesce', coalesceTarget, coalesceDuration);
1287:       }
1288:       if (coalesceDuration > 0) {
```

- `src/theater/TheaterDirector.js:1296`

```text
1294: 
1295:     if (!skipTriggered && settleConfig?.enabled !== false) {
1296:       console.log('🔍 [ABOUT TO START SETTLE]', {
1297:         settleConfig,
1298:         currentMorph: currentMorphValue,
```

- `src/theater/TheaterDirector.js:1302`

```text
1300:       });
1301:       const settleDuration = Math.max(0, Number(settleConfig.durationMs) || 0);
1302:       this.phase = 'settle';
1303:       console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
1304:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
```

- `src/theater/TheaterDirector.js:1303`

```text
1301:       const settleDuration = Math.max(0, Number(settleConfig.durationMs) || 0);
1302:       this.phase = 'settle';
1303:       console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
1304:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
1305:         name: 'settle',
```

- `src/theater/TheaterDirector.js:1305`

```text
1303:       console.log(`   Phase: Settle (${settleDuration}ms → morph ${settleConfig.morphTo ?? '—'})`);
1304:       BeatBus.emit(EVENTS.PARTICLE_PHASE, {
1305:         name: 'settle',
1306:         duration: settleDuration,
1307:         morphTarget: typeof settleConfig.morphTo === 'number' ? settleConfig.morphTo : null,
```

- `src/theater/TheaterDirector.js:1318`

```text
1316:           source: OPENING_MORPH_SOURCE,
1317:         });
1318:         console.log(`🎯 [Opening Settle] Animator owns morph (${settleDuration}ms)`);
1319:       } else {
1320:         emitMorphSnapshot(currentMorphValue, 'settle', settleTarget, settleDuration);
```

- `src/theater/TheaterDirector.js:1320`

```text
1318:         console.log(`🎯 [Opening Settle] Animator owns morph (${settleDuration}ms)`);
1319:       } else {
1320:         emitMorphSnapshot(currentMorphValue, 'settle', settleTarget, settleDuration);
1321:       }
1322:       if (settleDuration > 0) {
```

- `src/theater/TheaterDirector.js:1335`

```text
1333: 
1334:     if (skipTriggered) {
1335:       console.log(`   Opening skip engaged (${this._skipOrigin ?? 'user'}) → fast-forwarding to emergence.`);
1336:       this._morphAnimationController?.stop();
1337:       if (currentMorphValue < 1) {
```

- `src/theater/TheaterDirector.js:1344`

```text
1342:     }
1343: 
1344:     // ───────────────── Phase 5: Emergence (viewport → constellation)
1345:     this.phase = 'emergence';
1346:     const reusePreboundBlueprint = this._openingPrebound === true;
```

- `src/theater/TheaterDirector.js:1345`

```text
1343: 
1344:     // ───────────────── Phase 5: Emergence (viewport → constellation)
1345:     this.phase = 'emergence';
1346:     const reusePreboundBlueprint = this._openingPrebound === true;
1347:     console.log(`   Phase: Particle emergence (${reusePreboundBlueprint ? 'reusing pre-bound blueprint' : 'SST governed'})`);
```

- `src/theater/TheaterDirector.js:1347`

```text
1345:     this.phase = 'emergence';
1346:     const reusePreboundBlueprint = this._openingPrebound === true;
1347:     console.log(`   Phase: Particle emergence (${reusePreboundBlueprint ? 'reusing pre-bound blueprint' : 'SST governed'})`);
1348: 
1349:     const viewportHint = await this._ensureViewportHint();
```

- `src/theater/TheaterDirector.js:1366`

```text
1364:       });
1365:     } else {
1366:       emitMorphSnapshot(currentMorphValue, 'emergence', 1, emergenceTimeline.durationMs);
1367:     }
1368: 
```

- `src/theater/TheaterDirector.js:1423`

```text
1421:             const mode = payload?.mode || blueprint?.mode;
1422:             const isGenesis = stage === 'genesis';
1423:             const isEmergenceMode = mode === 'emergence';
1424:             if (!isGenesis || isEmergenceMode) return;
1425:             console.log('   Fallback: BLUEPRINT_READY (genesis full) before fencepost');
```

- `src/theater/TheaterDirector.js:1458`

```text
1456:       
1457:       this.phase = 'genesis';
1458:       const previousStage = this.currentStage ?? 'emergence';
1459:       console.log('🧬 Phase: Genesis stage handoff');
1460: 
```

- `src/theater/TheaterDirector.js:1630`

```text
1628:     // Warn about early cancellation in development
1629:     if (import.meta?.env?.DEV) {
1630:       if (this.phase === 'black' || this.phase === 'cursor' || this.phase === 'terminal') {
1631:         console.warn('🎬 Director: WARNING - Cancelling during early phase:', this.phase);
1632:         console.warn('   This may be caused by HMR or effect cleanup');
```

- `src/theater/TheaterDirector.js:1915`

```text
1913:       required: ['stage', 'quality', 'blueprint'],
1914:       optional: ['cached', 'mode'],
1915:       notes: 'Renderer consumes stage/quality/blueprint; mode=emergence for special handling.',
1916:     },
1917:     BUILD_EMERGENCE_BLUEPRINT: {
```

- `src/theater/TheaterDirector.js:1920`

```text
1918:       required: ['mode', 'source', 'target', 'count'],
1919:       optional: ['tierRatios', 'viewportHint'],
1920:       notes: 'Corrected contract for viewport spread → constellation emergence.',
1921:     },
1922:   },
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
11:   OPENING_COMPLETE: 'OPENING_COMPLETE',          // Overlay fade + scan-bloat contract
```

- `src/theater/events.js:16`

```text
14:   ENGINE_VIEWPORT_HINT: 'ENGINE_VIEWPORT_HINT',  // { width, height, aspect }
15: 
16:   // Emergence / blueprint handoff
17:   BUILD_EMERGENCE_BLUEPRINT: 'BUILD_EMERGENCE_BLUEPRINT',
18:   BLUEPRINT_READY: 'BLUEPRINT_READY',            // { blueprint, stage?, quality?, mode? }
```

- `src/theater/events.js:69`

```text
67: //   source: 'opening_sequence' | 'narration' | 'diagnostic' | ...,
68: //   channel?: 'renderer',              // renderer may add when re-emitting fenceposts
69: //   phase?: 'chaos'|'coalesce'|'settle'|'emergence',
70: //   stage?: string,
71: //   uMotionMode?: number,
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

- `src/components/consciousness/ConsciousnessTheater.jsx:250`

```text
248:     const skipNarrationIfActive = () => {
249:       const controller = typeof window !== 'undefined' ? window.narrationController : null;
250:       if (controller?.isPlaying && typeof controller.skipNarration === 'function') {
251:         controller.skipNarration();
252:         return true;
```

- `src/components/consciousness/ConsciousnessTheater.jsx:251`

```text
249:       const controller = typeof window !== 'undefined' ? window.narrationController : null;
250:       if (controller?.isPlaying && typeof controller.skipNarration === 'function') {
251:         controller.skipNarration();
252:         return true;
253:       }
```

- `src/components/consciousness/ConsciousnessTheater.jsx:382`

```text
380:             window.unifiedNav.navigateToStage(targetStage, {
381:               smooth: true,
382:               skipNarration: false,
383:               source: 'number_key',
384:             });
```

- `src/components/narrative/NarrationController.jsx:492`

```text
490:         if (DEBUG_NARRATION) {
491:           const preview = text.length > 50 ? `${text.slice(0, 50)}…` : text;
492:           console.log('🎙️ [BEAT FIRED]', {
493:             stage: stageName,
494:             segmentIndex,
```

- `src/components/narrative/NarrationController.jsx:607`

```text
605:         const lineType = resolveLineType(stageName, scriptedType);
606: 
607:         BeatBus.emit?.(EVENTS.NARRATIVE_LINE, {
608:           stage: stageName,
609:           segmentId: segment?.id ?? null,
```

- `src/components/narrative/NarrationController.jsx:783`

```text
781:   );
782: 
783:   const skipNarration = useCallback(
784:     (origin = 'skip') => {
785:       if (origin === 'external' && !isControlAllowed('narration:control')) {
```

- `src/components/narrative/NarrationController.jsx:893`

```text
891:           enumerable: true,
892:         },
893:         skipNarration: {
894:           value: () => skipNarration('external'),
895:           enumerable: true,
```

- `src/components/narrative/NarrationController.jsx:894`

```text
892:         },
893:         skipNarration: {
894:           value: () => skipNarration('external'),
895:           enumerable: true,
896:         },
```

- `src/components/narrative/NarrationController.jsx:927`

```text
925:     exposeControlSurface('narrationController', controllerFactory, {
926:       playNarration: 'narration:control',
927:       skipNarration: 'narration:control',
928:     });
929: 
```

- `src/components/narrative/NarrationController.jsx:948`

```text
946:       revokeControlSurface('narrationController');
947:     };
948:   }, [skipNarration, startNarration]);
949: 
950:   useEffect(() => {
```

- `src/components/narrative/NarrationController.jsx:957`

```text
955:       autoAdvanceEnabled,
956:       resetStateId: resetState,
957:       skipNarrationId: skipNarration,
958:       startNarrationId: startNarration,
959:     };
```

- `src/components/narrative/NarrationController.jsx:1063`

```text
1061:       event.preventDefault?.();
1062:       event.stopPropagation?.();
1063:       skipNarration('space');
1064:     };
1065: 
```

- `src/components/narrative/NarrationController.jsx:1080`

```text
1078:       resetState();
1079:     };
1080:   }, [currentStage, resetState, skipNarration, startNarration]);
1081: 
1082:   useEffect(() => {
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

- `src/components/narrative/NarrativeChoreography.jsx:377`

```text
375:     };
376: 
377:     const offLine = BeatBus.on?.(EVENTS.NARRATIVE_LINE, handleLine);
378:     return () => offLine?.();
379:   }, [currentStage, dispatchNext]);
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

- `src/theater/bus/schemas.js:84`

```text
82:     optional: { source: 'string' },
83:   }],
84:   ['NARRATIVE_LINE', {
85:     required: { stage: 'string', text: 'string' },
86:     optional: {
```

- `src/theater/events.js:32`

```text
30:   // Stage / narrative control
31:   START_NARRATIVE: 'START_NARRATIVE',            // { id?, stage? }
32:   NARRATIVE_LINE: 'NARRATIVE_LINE',
33:   NARRATION_STOPPED: 'NARRATION_STOPPED',
34:   NARRATION_CLEANUP: 'NARRATION_CLEANUP',
```

## RENDERER

- `src/components/narrative/NarrationController.jsx:665`

```text
663:             directivePayload.activeCount = particleEffectPayload.activeCount;
664:           }
665:           BeatBus.emit?.(EVENTS.RENDER_DIRECTIVE, directivePayload);
666:         }
667: 
```

- `src/components/theater/OpeningSequence.jsx:212`

```text
210:       }),
211: 
212:       BeatBus.on(EVENTS.PARTICLES_EMERGED, () => {
213:         const now =
214:           typeof performance !== 'undefined' && typeof performance.now === 'function'
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

- `src/components/webgl/ParticleChoreography.jsx:127`

```text
125:     };
126: 
127:     // Single-writer ownership: WebGLBackground handles RENDER_DIRECTIVE → uniforms.
128:     const off = null;
129: 
```

- `src/components/webgl/WebGLBackground.jsx:3`

```text
1: // src/components/webgl/WebGLBackground.jsx
2: // HOT-DORS passive renderer: projection-matrix viewport hint + single directive sink
3: // Single writer: binds geometry/material, emits PARTICLES_EMERGED exactly once (on first FULL bind)
4: 
5: import React, { useRef, useEffect, useState, useCallback } from 'react';
```

- `src/components/webgl/WebGLBackground.jsx:53`

```text
51:   'uMotionMode',
52:   'uFlowTurbulence',
53:   'uMorphProgress',
54:   'uStageProgress',
55:   'uPointSize',
```

- `src/components/webgl/WebGLBackground.jsx:349`

```text
347:     };
348:     trace('WBG:FENCEPOST', finalPayload);
349:     BeatBus.emit(EVENTS.PARTICLES_EMERGED, finalPayload);
350:     if (import.meta?.env?.DEV) {
351:       console.log('✅ [RENDERER] PARTICLES_EMERGED emitted', finalPayload);
```

- `src/components/webgl/WebGLBackground.jsx:351`

```text
349:     BeatBus.emit(EVENTS.PARTICLES_EMERGED, finalPayload);
350:     if (import.meta?.env?.DEV) {
351:       console.log('✅ [RENDERER] PARTICLES_EMERGED emitted', finalPayload);
352:     }
353: 
```

- `src/components/webgl/WebGLBackground.jsx:449`

```text
447:       const uniforms = mat?.uniforms;
448: 
449:       if (uniforms?.uMorphProgress) {
450:         uniforms.uMorphProgress.value = 1.0;
451:         if (uniforms.uStageProgress) {
```

- `src/components/webgl/WebGLBackground.jsx:450`

```text
448: 
449:       if (uniforms?.uMorphProgress) {
450:         uniforms.uMorphProgress.value = 1.0;
451:         if (uniforms.uStageProgress) {
452:           uniforms.uStageProgress.value = 1.0;
```

- `src/components/webgl/WebGLBackground.jsx:519`

```text
517:           attrs: geo ? Object.keys(geo.attributes || {}) : [],
518:           drawCount: geo?.drawRange?.count ?? null,
519:           morph: uniforms.uMorphProgress?.value ?? null,
520:           pointSize: uniforms.uPointSize?.value ?? null,
521:           freeze: uniforms.uPostMorphFreeze?.value ?? null,
```

- `src/components/webgl/WebGLBackground.jsx:779`

```text
777:     if (!mat?.uniforms) return;
778:     const u = mat.uniforms;
779:     if (u.uMorphProgress) u.uMorphProgress.value = v;
780:     else if (u.morphProgress) u.morphProgress.value = v;
781:     else if (u.uMorph) u.uMorph.value = v;
```

- `src/components/webgl/WebGLBackground.jsx:870`

```text
868:       const start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
869:       morphProbeTimer = setInterval(() => {
870:         if (!uniforms?.uMorphProgress) return;
871:         const val = Number(uniforms.uMorphProgress.value) || 0;
872:         const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
```

- `src/components/webgl/WebGLBackground.jsx:871`

```text
869:       morphProbeTimer = setInterval(() => {
870:         if (!uniforms?.uMorphProgress) return;
871:         const val = Number(uniforms.uMorphProgress.value) || 0;
872:         const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
873:         console.log('[PROBE] uMorphProgress', { t: Math.round(now - start), val });
```

- `src/components/webgl/WebGLBackground.jsx:873`

```text
871:         const val = Number(uniforms.uMorphProgress.value) || 0;
872:         const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
873:         console.log('[PROBE] uMorphProgress', { t: Math.round(now - start), val });
874:         if (now - start > 2000) {
875:           clearInterval(morphProbeTimer);
```

- `src/components/webgl/WebGLBackground.jsx:1301`

```text
1299:           emitRendererFencepostReady(isEmergence ? 'emergence-bind' : 'opening-bind');
1300:         }
1301:         if (mat?.uniforms?.uMorphProgress) {
1302:           if (isQrBlueprint) {
1303:             mat.uniforms.uMorphProgress.value = 1;
```

- `src/components/webgl/WebGLBackground.jsx:1303`

```text
1301:         if (mat?.uniforms?.uMorphProgress) {
1302:           if (isQrBlueprint) {
1303:             mat.uniforms.uMorphProgress.value = 1;
1304:             if (mat.uniforms.uStageProgress) mat.uniforms.uStageProgress.value = 1;
1305:             if (mat.uniforms.uPostMorphFreeze) mat.uniforms.uPostMorphFreeze.value = 1;
```

- `src/components/webgl/WebGLBackground.jsx:1307`

```text
1305:             if (mat.uniforms.uPostMorphFreeze) mat.uniforms.uPostMorphFreeze.value = 1;
1306:           } else {
1307:             mat.uniforms.uMorphProgress.value = 0;
1308:             if (mat.uniforms.uStageProgress) mat.uniforms.uStageProgress.value = 0;
1309:           }
```

- `src/components/webgl/WebGLBackground.jsx:1334`

```text
1332:           );
1333:           const seededMorph = maybeSeedNumber(
1334:             uniforms.uMorphProgress,
1335:             fallbackMorphRef.current ?? 0
1336:           );
```

- `src/components/webgl/WebGLBackground.jsx:1545`

```text
1543:           emittedEmergedRef.current = true;
1544:           emergencePendingRef.current = false;
1545:           console.log('EMERGED once — emitting PARTICLES_EMERGED fencepost');
1546:         }
1547:       }
```

- `src/components/webgl/WebGLBackground.jsx:1586`

```text
1584:       const matCurrent = materialRef.current;
1585:       const currentUniforms = matCurrent?.uniforms;
1586:       if (!isEmergenceMode && currentUniforms?.uMorphProgress) {
1587:         const director = typeof window !== 'undefined' ? window.theaterDirector : null;
1588:         const currentStage = director?.getCurrentStage?.() ?? director?.currentStage ?? null;
```

- `src/components/webgl/WebGLBackground.jsx:1593`

```text
1591:         const startMorph = 0.0;
1592: 
1593:         currentUniforms.uMorphProgress.value = startMorph;
1594:         if (currentUniforms.uStageProgress) {
1595:           currentUniforms.uStageProgress.value = startMorph;
```

- `src/components/webgl/WebGLBackground.jsx:1620`

```text
1618:             const progress = Math.min(1, elapsed / duration);
1619:             const liveUniforms = matCurrent.uniforms;
1620:             if (liveUniforms?.uMorphProgress) {
1621:               liveUniforms.uMorphProgress.value = startMorph + (1 - startMorph) * progress;
1622:             }
```

- `src/components/webgl/WebGLBackground.jsx:1621`

```text
1619:             const liveUniforms = matCurrent.uniforms;
1620:             if (liveUniforms?.uMorphProgress) {
1621:               liveUniforms.uMorphProgress.value = startMorph + (1 - startMorph) * progress;
1622:             }
1623:             if (liveUniforms?.uStageProgress) {
```

- `src/components/webgl/WebGLBackground.jsx:1728`

```text
1726:       setUniformNumber('uSpreadFactor', payload.uSpreadFactor);
1727: 
1728:       if (typeof payload.uMorphProgress === 'number') {
1729:         setUniformNumber('uMorphProgress', payload.uMorphProgress);
1730:         if (typeof payload.uStageProgress === 'number') {
```

- `src/components/webgl/WebGLBackground.jsx:1729`

```text
1727: 
1728:       if (typeof payload.uMorphProgress === 'number') {
1729:         setUniformNumber('uMorphProgress', payload.uMorphProgress);
1730:         if (typeof payload.uStageProgress === 'number') {
1731:           setUniformNumber('uStageProgress', payload.uStageProgress);
```

- `src/components/webgl/WebGLBackground.jsx:1733`

```text
1731:           setUniformNumber('uStageProgress', payload.uStageProgress);
1732:         } else if (uniforms.uStageProgress && guardUniformWrite(origin, 'uStageProgress')) {
1733:           uniforms.uStageProgress.value = payload.uMorphProgress;
1734:           uniforms.uStageProgress.needsUpdate = true;
1735:         }
```

- `src/components/webgl/WebGLBackground.jsx:1811`

```text
1809:       mat.uniformsNeedUpdate = true;
1810:     };
1811:     const off = BeatBus.on(EVENTS.RENDER_DIRECTIVE, handleDirective);
1812:     if (!listenersReadyRef.current) {
1813:       listenersReadyRef.current = true;
```

- `src/components/webgl/WebGLBackground.jsx:1925`

```text
1923:         uniforms: {
1924:           uTime:            { value: 0 },
1925:           uMorphProgress:   { value: clamp01(fallbackMorphRef.current) },
1926:           uScrollProgress:  { value: 0 },
1927:           uStageProgress:   { value: clamp01(fallbackMorphRef.current) },
```

- `src/components/webgl/WebGLBackground.jsx:2045`

```text
2043:         uniforms: mat ? Object.keys(mat.uniforms || {}) : [],
2044:         hasGeometry: !!geometryRef.current,
2045:         morph: mat?.uniforms?.uMorphProgress?.value ?? null,
2046:       }));
2047: 
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

- `src/theater/ScrollOrchestrator.js:409`

```text
407:   __lastMorphDirectiveStamp = now;
408: 
409:   BeatBus.emit(EVENTS.RENDER_DIRECTIVE, {
410:     source: 'scroll_orchestrator',
411:     channel: 'renderer',
```

- `src/theater/ScrollOrchestrator.js:414`

```text
412:     phase: 'scroll',
413:     stage: stageName,
414:     uMorphProgress: clamp01(value ?? 0),
415:     morphProgress: clamp01(value ?? 0),
416:   });
```

- `src/theater/TheaterDirector.js:238`

```text
236:       );
237:       this._rendererParticlesUnsubscribe = BeatBus.on(
238:         EVENTS.PARTICLES_EMERGED,
239:         this._handleRendererParticlesReady
240:       );
```

- `src/theater/TheaterDirector.js:508`

```text
506:       phase,
507:       stage: stageName,
508:       uMorphProgress: morph,
509:       morphProgress: morph, // legacy compatibility
510:       drawCount,
```

- `src/theater/TheaterDirector.js:545`

```text
543:     }
544: 
545:     BeatBus.emit(EVENTS.RENDER_DIRECTIVE, directive);
546: 
547:     if (morph >= 0.995) {
```

- `src/theater/TheaterDirector.js:1193`

```text
1191:               timeout: 2200,
1192:             }).then((payload) => (payload ? { type: 'listeners', payload } : null)),
1193:             this._waitForEvent(EVENTS.PARTICLES_EMERGED, {
1194:               timeout: 2200,
1195:               predicate: (payload = {}) => {
```

- `src/theater/TheaterDirector.js:1408`

```text
1406:           };
1407: 
1408:           const fenceOff = BeatBus.on(EVENTS.PARTICLES_EMERGED, (payload) => {
1409:             console.log('   Received: PARTICLES_EMERGED');
1410:             finish({ type: 'fencepost', payload });
```

- `src/theater/TheaterDirector.js:1409`

```text
1407: 
1408:           const fenceOff = BeatBus.on(EVENTS.PARTICLES_EMERGED, (payload) => {
1409:             console.log('   Received: PARTICLES_EMERGED');
1410:             finish({ type: 'fencepost', payload });
1411:           });
```

- `src/theater/TheaterDirector.js:1414`

```text
1412: 
1413:           fenceTimeoutId = this._trackTimer(() => {
1414:             console.warn(`⚠️ Director: ${EVENTS.PARTICLES_EMERGED} timed out after ${fencepostWaitMs}ms`);
1415:             finish(null);
1416:           }, fencepostWaitMs);
```

- `src/theater/TheaterDirector.js:1433`

```text
1431:             this._pendingDirectorFencepost = null;
1432:             queueMicrotask(() => {
1433:               BeatBus.emit(EVENTS.PARTICLES_EMERGED, pendingPayload);
1434:               this._directorFencepostSent = true;
1435:             });
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

- `src/theater/bus/schemas.js:44`

```text
42:     },
43:   }],
44:   ['RENDER_DIRECTIVE', {
45:     optional: {
46:       kind: 'string',
```

- `src/theater/bus/schemas.js:55`

```text
53:       uOpacityMin: 'number',
54:       uOpacityMax: 'number',
55:       uMorphProgress: 'number',
56:       uStageProgress: 'number',
57:       activeCount: 'number',
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

- `src/theater/events.js:21`

```text
19:   BLUEPRINT_INVALIDATED: 'BLUEPRINT_INVALIDATED',// guard fallback notification
20:   PARTICLES_START_EMERGING: 'PARTICLES_START_EMERGING',
21:   PARTICLES_EMERGED: 'PARTICLES_EMERGED',        // fencepost (emit once)
22:   FENCEPOST_LISTENERS_READY: 'FENCEPOST_LISTENERS_READY',
23: 
```

- `src/theater/events.js:25`

```text
23: 
24:   // Renderer tuning & morph
25:   RENDER_DIRECTIVE: 'RENDER_DIRECTIVE',          // renderer directives (intent → GPU writes)
26:   RENDERER_TUNE: 'RENDERER_TUNE',                // { rotZdegPerSec, swirl, vibAmp, flutter, trails, ... }
27:   PARTICLE_PHASE: 'PARTICLE_PHASE',              // { name }
```

- `src/theater/events.js:65`

```text
63: //     so waiters can filter by producer/origin.
64: //
65: // RENDER_DIRECTIVE payload contract (high-level intent that the renderer maps to GPU writes):
66: // {
67: //   source: 'opening_sequence' | 'narration' | 'diagnostic' | ...,
```

- `src/theater/events.js:77`

```text
75: //   uOpacityMin?: number,
76: //   uOpacityMax?: number,
77: //   uMorphProgress?: number,           // renderer maps to the uniform
78: //   uStageProgress?: number,
79: //   pointSize?: number,                // renderer maps to uPointSize
```



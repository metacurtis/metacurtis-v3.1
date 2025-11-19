# Opening Wiring Report

## Executive Summary
The opening pipeline is split between the TheaterDirector (drives the scripted timeline and MorphAnimationController), the renderer (`WebGLBackground.jsx`, which both consumes directives and emits fenceposts), and the ConsciousnessEngine (builds blueprints/timelines but defers the final emergence latch to the renderer). MORPH_PROGRESS is technically owned by MorphAnimationController, but the renderer and legacy bridges can also emit it, and BeatBus enforces a single-writer latch at runtime. Emergence completion hinges on the renderer emitting `PARTICLES_EMERGED`; Director waits on that fencepost before emitting `OPENING_COMPLETE`, while UI overlays (OpeningSequence + LCPHero) subscribe directly. Visual verbs are delivered via `RENDER_DIRECTIVE`; the Director owns the opening phases and ScrollOrchestrator takes over afterward, with WebGLBackground acting as the only sink that translates directives into GPU writes.

## MORPH_PROGRESS signal map
| Event | File | Function / method | Role | Notes |
| --- | --- | --- | --- | --- |
| MORPH_PROGRESS | `src/theater/controllers/MorphAnimationController.js:19-51` | `start` | EMITTER | Canonical owner; RAF loop easing between `from`/`to` and calling `emitMorphProgress({ progress, source })`. Used by TheaterDirector via `_driveOpeningMorph`. |
| MORPH_PROGRESS | `src/components/webgl/WebGLBackground.jsx:483-515` | `finalizeEmergence` | EMITTER | Renderer fast-forward branch: forces uniforms to 1.0, freezes, and emits `progress: 1` when emergence times out or is skipped. |
| MORPH_PROGRESS | `src/components/webgl/WebGLBackground.jsx:1406-1436` | `handleBlueprint` (emergence bind) | EMITTER | When an emergence-mode blueprint binds, resets morph to 0 and optionally re-emits 1 if fast-forwarding. |
| MORPH_PROGRESS | `modules/state/bridges/AtomicToBeatBus.js:33-40` | `stageAtom.subscribe` (legacy) | EMITTER | Deprecated bridge that mirrors `stageProgress` into MORPH_PROGRESS; re-enabling it would add a second continuous writer. |
| MORPH_PROGRESS | `src/components/webgl/WebGLBackground.jsx:1896-1973` | `handleMorphProgress` hook | LISTENER | Primary renderer sink; applies morph to uniforms, freezes post-handoff, and toggles directive ignores when morph hits 1. |
| MORPH_PROGRESS | `src/state/commands/StateCommands.js:126-137` | `wireAtomsToBeatBus` | BRIDGE (listener→state) | Updates `narrativeAtom` + `morphState` whenever a MORPH_PROGRESS payload arrives; exposes latest value to UI/state consumers. |

**Summary**: 3 code paths emit MORPH_PROGRESS (MorphAnimationController, two renderer branches, plus a dormant legacy bridge), and 2 live listeners consume it. BeatBus (`src/theater/bus/index.js:409-417`) latches the first emitter per session and blocks subsequent sources, so renderer fast-forward calls are ignored unless they happen before MorphAnimationController starts. No post-opening scroll module emits MORPH_PROGRESS; ScrollOrchestrator only issues `RENDER_DIRECTIVE`, so state consumers rely on whatever the last morph payload was.

## Emergence completion signals (PARTICLES_EMERGED & OPENING_COMPLETE)
| Event | File | Function / method | Role | Notes |
| --- | --- | --- | --- | --- |
| PARTICLES_EMERGED | `src/components/webgl/WebGLBackground.jsx:373-405` | `emitFencepostNow` | EMITTER | Renderer-only single writer; emits once after the first full genesis bind (or queued fencepost) and marks the document `page-interactive`. |
| PARTICLES_EMERGED | `src/theater/TheaterDirector.js:1398-1439` | Opening timeline wait block | LISTENER | Director waits for the renderer’s fencepost (with fallback to `BLUEPRINT_READY`) before progressing to post-emergence work and eventually emitting `OPENING_COMPLETE`. |
| PARTICLES_EMERGED | `src/engine/ConsciousnessEngine.js:404-437` | `_installListeners` | LISTENER | Marks `_rendererFencepostSeen`, cancels its emergence RAF, and unblocks blueprint timelines once the renderer fencepost arrives. |
| PARTICLES_EMERGED | `src/components/theater/OpeningSequence.jsx:251-260` | Overlay effect | LISTENER | Starts fading out the terminal overlay once particles are reported as emerged. |
| PARTICLES_EMERGED | `src/components/ui/LCPHero.jsx:31-40` | Hero placeholder effect | LISTENER | Hides the static hero poster immediately after the renderer fencepost (fallback timer at 5 s). |
| OPENING_COMPLETE | `src/theater/TheaterDirector.js:1518-1535` | Post-emergence handoff | EMITTER | After receiving the renderer fencepost + enabling scroll, Director emits `OPENING_COMPLETE`, `ENABLE_SCROLL`, and kicks off auto-advance. |
| OPENING_COMPLETE | `src/components/theater/OpeningSequence.jsx:262-270` | Overlay effect | LISTENER | Final safeguard to fade the overlay if `PARTICLES_EMERGED` never arrived but Director decides to proceed. |

**Summary**: `PARTICLES_EMERGED` has 1 emitter and 4 runtime listeners (Director, Engine, OpeningSequence, LCPHero). `OPENING_COMPLETE` has 1 emitter/1 listener. The renderer remains the single source of truth for completion; Director cannot complete opening until the fencepost arrives or times out, and multiple UI surfaces (overlay + hero) react independently of Director’s `OPENING_COMPLETE` signal.

## Opening timeline event map
| Event | File | Function / method | Role | Notes |
| --- | --- | --- | --- | --- |
| CURSOR_SHOW | `src/theater/TheaterDirector.js:1104-1108` | Opening timeline (cursor phase) | EMITTER | Starts the cursor overlay and audio hum. |
| CURSOR_SHOW | `src/components/theater/OpeningSequence.jsx:107-113` | React effect | LISTENER | Switches the overlay into cursor mode. |
| CURSOR_BLINK | `src/theater/TheaterDirector.js:1111-1116` | Opening timeline | EMITTER | Emits blink instructions during the cursor phase. |
| CURSOR_BLINK | `src/components/theater/OpeningSequence.jsx:114-128` | React effect | LISTENER | Runs the blink coroutine. |
| TERMINAL_TYPE | `src/theater/TheaterDirector.js:1123-1134` | Opening timeline | EMITTER | Supplies typing config (lines, speeds). |
| TERMINAL_TYPE | `src/components/theater/OpeningSequence.jsx:129-169` | React effect | LISTENER | Types lines on the overlay terminal. |
| SCREEN_FILL | `src/theater/TheaterDirector.js:1138-1148` | Opening timeline | EMITTER | Drives the green screen flood before chaos. |
| SCREEN_FILL | `src/components/theater/OpeningSequence.jsx:170-219` | React effect | LISTENER | Streams repeated stage text to fill the screen. |
| AUDIO_COMPUTER_HUM | `src/theater/TheaterDirector.js:1105-1108` | Opening timeline | EMITTER | Starts the ambient hum when the cursor appears. |
| AUDIO_COMPUTER_HUM | `src/components/theater/OpeningSequence.jsx:228-244` | React effect | LISTENER | Lazily loads and loops the hum audio once user input unlocks playback. |
| PARTICLES_START_EMERGING | `src/theater/TheaterDirector.js:1373-1375` | Emergence kick-off | EMITTER | Notifies renderer/UI that particle emergence has begun (after blueprint bind). |
| PARTICLES_START_EMERGING | `src/components/theater/OpeningSequence.jsx:247-249` | React effect | LISTENER | Pre-emptively fades the overlay even before the fencepost. |
| PARTICLES_START_EMERGING | `src/components/webgl/WebGLBackground.jsx:892-899` | React effect | LISTENER | Resets renderer emergence refs so subsequent MORPH updates can freeze the scene once complete. |
| DIRECTOR_OPENING_MODE | `src/theater/TheaterDirector.js:1155-1176` | Pre-chaos bind | EMITTER | Announces `opening_chaos` mode before building the pre-chaos blueprint; diagnostic consumers can hook in. |
| DIRECTOR_OPENING_MODE | `src/dev/patternSMonitors.js:43-50` | `patternSMonitors` | LISTENER | Dev-only logger that records director opening mode changes. |
| PARTICLE_PHASE | `src/theater/TheaterDirector.js:1233-1314` | Phase envelopes (chaos/coalesce/settle) | EMITTER | Emits `PARTICLE_PHASE` payloads that carry durations + optional renderer spin metadata. |
| PARTICLE_PHASE | `src/components/webgl/WebGLBackground.jsx:2214-2241` | `useEffect` handler | LISTENER | Maps phase payloads to renderer spin (`spinRef`) so chaos/coalesce/settle feel distinct. |

**Summary**: Opening overlay events are strictly Director→OpeningSequence (plus hum audio), while emergence events (`PARTICLES_START_EMERGING`, `PARTICLE_PHASE`) are consumed by both the overlay and the renderer. There is a single emitter for each signal, but multiple listeners often race to trigger fades, so ordering depends on when BeatBus delivers the payload. No other module (e.g., StateCommands) listens to these, so UI behavior is decoupled from Director’s notion of completion.

## Visual verbs / render directives
| Event | File | Function / method | Role | Notes |
| --- | --- | --- | --- | --- |
| RENDER_DIRECTIVE | `src/theater/TheaterDirector.js:478-548` | `_emitRenderDirectiveFrame` | EMITTER | Active during opening when `_ownsOpeningMorph` is true; converts morph progress into activeCount/point size/tier envelopes plus chaos/coalesce/settle phase hints. |
| RENDER_DIRECTIVE | `src/theater/ScrollOrchestrator.js:413-431` | `__emitMorphDirective` | EMITTER | Post-opening scroll driver; throttles to ~80 ms and only sends `uMorphProgress` + `phase: 'scroll'` based on scroll percent. No MORPH_PROGRESS event accompanies these updates. |
| RENDER_DIRECTIVE | `src/components/webgl/WebGLBackground.jsx:1884-1893` | `handleDirective` hook | LISTENER | Single renderer sink that guards uniform ownership, clamps values, and optionally rejects write attempts based on origin (renderer vs external). |

**Summary**: Two emitters (Director during opening, ScrollOrchestrator afterward) target a single listener (WebGLBackground). BeatBus batches `RENDER_DIRECTIVE` events (`src/theater/bus/index.js:7-63`) so rapid updates coalesce, and renderer-side guards (`guardUniformWrite`) block unowned uniforms. There is no explicit arbitration between Director and ScrollOrchestrator; whichever is currently emitting wins, so the Director must relinquish `_ownsOpeningMorph` before scroll directives take hold.

## Risks & smells
- **Multi-writer MORPH pipeline**: MorphAnimationController is supposed to be the sole emitter, but the renderer emits MORPH_PROGRESS when binding/fast-forwarding (`src/components/webgl/WebGLBackground.jsx:483-515` & `1406-1436`), and the deprecated AtomicToBeatBus bridge (`modules/state/bridges/AtomicToBeatBus.js:33-40`) can reintroduce another writer. BeatBus latches the first source, so renderer fast-forward calls may silently no-op if MorphAnimationController already claimed ownership.
- **State consumers starved after opening**: ScrollOrchestrator never emits MORPH_PROGRESS—only RENDER_DIRECTIVE messages—so `StateCommands` (`src/state/commands/StateCommands.js:126-137`) and any other bus listeners never receive scroll-based morph updates. UI relying on `narrativeAtom.morphProgress` freezes at the last opening payload.
- **Renderer couples to BeatBus in both directions**: WebGLBackground listens to directives, MORPH, STAGE_CHANGE, PARTICLES_START_EMERGING, and simultaneously emits MORPH_PROGRESS + PARTICLES_EMERGED. That makes the renderer a de facto orchestration peer; any timing drift or guard (e.g., `ignoreDirectivesRef`) can block Director updates and still emit completion signals.
- **Fast-forward branches bypass Director/Engine coordination**: Renderer-side `finalizeEmergence` can emit MORPH_PROGRESS=1 and `PARTICLES_EMERGED` even if Director still thinks opening is in progress, which risks the Director skipping phase work or missing `_pendingDirectorFencepost` diagnostics. Similarly, Director’s `_emitMorphProgress` only publishes `DIRECTOR:MORPH_STATE`, so other subsystems cannot observe Director-driven snaps.
- **Overlay fade races**: OpeningSequence listens to `PARTICLES_START_EMERGING`, `PARTICLES_EMERGED`, and `OPENING_COMPLETE` (three separate triggers), so double fades are possible depending on arrival order and minimum visual durations.
- **Visual-verb contention**: During handoff, Director and ScrollOrchestrator both emit `RENDER_DIRECTIVE`. There is no explicit handover event beyond setting `_ownsOpeningMorph = false`, so any regression could leave both emitting conflicting directives.
- **Engine timeline dependency on renderer fencepost**: ConsciousnessEngine keeps running its emergence RAF until `PARTICLES_EMERGED` arrives. If the renderer is prevented from emitting (e.g., guard lock), the engine will never flip `_rendererFencepostSeen`, and Director’s wait loop will eventually time out after logging warnings.

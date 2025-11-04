                                                                     # Architecture Rules (Read First)

                                                                     1) SST is law. All values originate from `sst/canon/vX.json`. Code reads SST; no hardcodes.
                                                                     2) Renderer is the only GPU writer. Only `WebGLBackground.jsx` calls `geometry.setDrawRange` or mutates `material.uniforms`.
                                                                     3) No mid-morph rebuilds. Engine blocks blueprint rebuilds during emergence (except emergence itself).
                                                                     4) Never cache fallbacks. If font/assets aren’t ready, return a temporary layout and do not cache it.
                                                                     5) One path to letters. 3D text is built via `_build3DLetters` only; emergence targets that output when font is ready.

                                                                     ## Developer Checklist
                                                                     - Change vision → Edit SST → `npm run validate-sst`.
                                                                     - Fix visuals → Tiny diffs to allowlisted files. Renderer writes GPU.
                                                                     - Opening QA → Probes: `draw` (full), `morph→1.0 ≤2.2s`, `aabb≥0.82`, `endpointsDifferent:true`.

                                                                     ## Clean Rendering Audit (90‑minute pass)

                                                                     > Scope: BeatBus singleton, lifecycle order, emergence guards, single‑writer GPU discipline, and stage/atom wiring.

                                                                     ### Core invariants
                                                                     - BeatBus: exactly one instance; every subscription attaches to it.
                                                                     - Single writer: only `WebGLBackground.jsx` calls `geometry.setDrawRange` or mutates `material.uniforms`.
                                                                     - Emergence gate: `buildAndEmitBlueprint` refuses rebuilds while emergence is active.
                                                                     - Fencepost truth: Genesis only “preserves emergence” if the renderer emitted `PARTICLES_EMERGED`.
                                                                     - SST first: stage words, counts, timings, and quality thresholds originate from SST; no hardcoded “vision” values.

                                                                     ### File checklist
                                                                     1. **`src/theater/TheaterDirector.js`** — nervous system (phases, timing, skip).
                                                                        - Subscribes once to BeatBus; no re‑installs on HMR.
                                                                        - Emits phase events only; never touches geometry/uniforms.
                                                                        - Handles skip by issuing morph burst or single CE timeline call.
                                                                        - Never imports Three.js or renderer internals.
                                                                     2. **`src/engine/ConsciousnessEngine.js`** — brain (blueprint builder/validator).
                                                                        - Builds from SST; no VC-only ad hoc overrides.
                                                                        - Emergence guard set while timeline runs; rebuilds blocked until renderer fencepost arrives.
                                                                        - Fallback bands are transient; never cached.
                                                                        - Genesis preserve path requires renderer fencepost truth.
                                                                     3. **`src/components/webgl/WebGLBackground.jsx`** — dumb renderer (single GPU writer).
                                                                        - Owns all drawRange/uniform writes; listens for directives and morph progress.
                                                                        - Emits `PARTICLES_EMERGED` exactly once per emergence when morph ≥ 0.995.
                                                                        - Never reads SST or generates blueprints.
                                                                     4. **`src/components/webgl/WebGLCanvas.jsx`** — shell (scene/camera loop).
                                                                        - Creates renderer/camera once; forwards viewport hints only.
                                                                        - No geometry/uniform side effects.
                                                                     5. **`src/theater/ScrollOrchestrator.js`** — input router.
                                                                        - Maps scroll → BeatBus events; zero rendering logic.
                                                                     6. **`src/components/theater/OpeningSequence.jsx`** — overlay + cues.
                                                                        - Sends macros/signals only; no GPU writes.
                                                                     7. **Atoms (`stageAtom`, etc.)** — state containers.
                                                                        - Hold state; never touch GPU or blueprint generation.

                                                                     ## Module Contract Matrix

                                                                     | Module | Role | Allowed inputs | Emits / writes | Forbidden |
                                                                     | --- | --- | --- | --- | --- |
                                                                     | BeatBus | Event spine (singleton) | — | Canon events only | Multiple instances |
                                                                     | TheaterDirector | Nervous system: phases/timing/skip | SST timings, user input | `BUILD_EMERGENCE_BLUEPRINT`, `RENDER_DIRECTIVE` morph burst, stage changes | Geometry/uniform writes, blueprint mutation |
                                                                     | ConsciousnessEngine | Brain: builds/validates blueprints | SST, viewport hints | `BLUEPRINT_READY`, timeline directives | `setDrawRange`, direct uniform mutation |
                                                                     | WebGLBackground | Dumb renderer (single writer) | `RENDER_DIRECTIVE` | Draw range, uniforms, renderer fencepost | Blueprint generation, SST reads |
                                                                     | WebGLCanvas | Shell (scene/camera loop) | Resize/camera hints | Viewport hints | Uniform/drawRange writes |
                                                                     | ScrollOrchestrator | Input → stage cues | Scroll events | Stage transitions | Renderer logic |
                                                                     | OpeningSequence | Overlay + cues | TD signals | Macro invocations | GPU writes |
                                                                     | Atoms | State holders | App state | State only | GPU writes, blueprints |

                                                                     ### Golden rules (repeat in headers/comments)
                                                                     - **Only WebGLBackground writes GPU state.**
                                                                     - **ConsciousnessEngine builds; TheaterDirector orchestrates; WebGLBackground renders; WebGLCanvas shells.**
                                                                     - **SST is law.**
                                                                     - **Emergence rebuilds are gated.**
                                                                     - **Renderer fencepost is the source of truth for completion.**

                                                                     ## Boot Sequence (golden path)
                                                                     1. `WebGLCanvas` mounts → camera + scene ready → viewport hint emitted to TD, CE, and WBG.
                                                                     2. `TheaterDirector` kicks the opening timeline from SST.
                                                                     3. TD requests emergence: CE emits `BUILD_EMERGENCE_BLUEPRINT` → `BLUEPRINT_READY` with `mode: 'emergence'`.
                                                                     4. CE timeline (or skip) emits `RENDER_DIRECTIVE` updates; WBG applies drawRange/uniforms.
                                                                     5. When morph ≥ 0.995, WBG emits `PARTICLES_EMERGED` (renderer fencepost).
                                                                     6. TD transitions to user-controlled genesis → CE builds genesis; preserve only if renderer fencepost fired.

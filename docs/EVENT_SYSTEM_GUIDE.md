# Event System Guide

This guide summarizes the active BeatBus event surface after the 2025-10 clean‑up. The catalog now focuses on runtime-critical signals while dropping unused audio and fragment wiring.

## Active Events (32 types)

| Category | Events |
| --- | --- |
| Opening overlay | `CURSOR_SHOW`, `CURSOR_BLINK`, `TERMINAL_TYPE`, `SCREEN_FILL` |
| Renderer hints | `ENGINE_VIEWPORT_HINT` |
| Emergence lifecycle | `BUILD_EMERGENCE_BLUEPRINT`, `BLUEPRINT_READY`, `BLUEPRINT_INVALIDATED`, `PARTICLES_START_EMERGING`, `PARTICLES_EMERGED`, `FENCEPOST_LISTENERS_READY` |
| Renderer directives | `RENDER_DIRECTIVE`, `RENDERER_TUNE`, `PARTICLE_PHASE`, `MORPH_PROGRESS` |
| Narrative | `START_NARRATIVE`, `NARRATIVE_LINE`, `NARRATION_STOPPED`, `NARRATION_CLEANUP`, `START_CLIMAX` |
| Stage & quality | `STAGE_CHANGE`, `QUALITY_CHANGE` |
| Scroll & interaction | `ENABLE_SCROLL`, `MEMORY_FRAGMENT_CHECK`, `SCROLL_PROGRESS`, `PARTICLE_CLICK_REQUEST`, `PARTICLE_CLICK_HIT`, `CLIMAX_STEP` |
| Audio | `AUDIO_COMPUTER_HUM` |
| Prewarm lifecycle | `PREWARM_GENESIS_BLUEPRINT`, `PREWARM_COMPLETE` |
| Director control | `DIRECTOR_CANCEL`, `DIRECTOR_ERROR` |

> Legacy events such as `AUDIO_KEY_CLICK`, `AUDIO_START_STAGE`, `MEMORY_FRAGMENT_*`, `STAGE_CHANGED`, and `TIER_BEHAVIOR_UPDATE` have been removed from both the catalog and runtime emitters.

## Frequency Bands

### High-Frequency (> 50/second)
- `RENDER_DIRECTIVE` – frame-by-frame renderer uniforms (engine & narration controller).
- `MORPH_PROGRESS` – throttled but continuous morph updates during scroll and transitions.
- `NARRATIVE_LINE` – rapid narration beat feed during active segments (typewriter cadence).

### Medium-Frequency (10–50/second)
- `STAGE_CHANGE` – emitted once per stage transition but can spike during scripted sequences.
- `QUALITY_CHANGE` – quality atom broadcasts (user controls / adaptive adjustments).
- `SCROLL_PROGRESS` – emits per scroll sample while orchestrator is active.

### Low-Frequency (< 10/second)
- `START_NARRATIVE` – stage start commands from the director / navigation helpers.
- `BLUEPRINT_READY` – new particle blueprint bindings from the engine.
- `CLIMAX_STEP` – climax orchestration steps (name, title, QR, etc.).

## Payload Standards

### Core Fields (always present when emitted)
- `timestamp`: `performance.now()` (falls back to `Date.now()` when unavailable).
- `source`: string identifying the emitting subsystem (e.g., `engine`, `scroll-orchestrator`, `climax:qr`).

### Extended Fields (event-specific)
- BeatBus canonicalization preserves extended data under `_extended`. Examples:
  - `STAGE_CHANGE._extended.index`, `.scrollPercent`, `.localProgress`, `.source`.
  - `QUALITY_CHANGE._extended.particleCount`, `.dpr`, `.reason`.
  - `RENDER_DIRECTIVE` keeps directive-specific fields (e.g., `kind`, `activeCount`, `enterQrMode`).

Consumers should use defensive checks (`event._extended?.field`) since extended data is optional.

## Event Flow Patterns

### Pattern 1 – Request / Response
1. Director emits `BUILD_EMERGENCE_BLUEPRINT`.
2. Engine responds with `BLUEPRINT_READY`.
3. Renderer acknowledges via `PARTICLES_EMERGED`.

### Pattern 2 – State Broadcast
- Atoms and orchestrators publish global state (`STAGE_CHANGE`, `QUALITY_CHANGE`, `SCROLL_PROGRESS`) that multiple subscribers (renderer, narration, diagnostics) consume.

### Pattern 3 – Command
- UI or systems emit imperatives (`START_NARRATIVE`, `ENABLE_SCROLL`, `START_CLIMAX`) handled by a single owner (narration controller, scroll orchestrator, climax engine).

## Event Flow Diagrams

Future documentation refresh will add visual swimlane diagrams for:
- **Opening Sequence:** Director → Engine → Renderer handshake.
- **Scroll Loop:** ScrollOrchestrator feedback into renderer & overlay.
- **Climax Sequence:** Climax controller triggering blueprint + render directives.

> Diagrams will live here once exported from the Codex event-visualizer tool.

---

**Last updated:** 2025-10-XX (post event-catalog pruning and bus canonicalization update). Continuous changes to the BeatBus surface should also update this guide. Submit patches alongside any new event additions or removals.

# Canonical Opening Contract (Phase-1)

This doc defines the minimal contract the **opening** must satisfy and how the tooling enforces it.  
Use this to keep the intro crisp without fighting implementation details.

---

## Must-pass (hard guardrails)

| Check | Why it matters | Source of truth | Sentinel action |
|---|---|---|---|
| **Fencepost order**: CURSOR → TYPING → FILL → EMERGENCE → PARTICLES_EMERGED → STAGE_CHANGE → ENABLE_SCROLL | Guarantees the rhythm | **TheaterDirector** (BeatBus events) | Fail if missing or misordered (via Renderer’s emit-once fencepost) |
| **Single writer GPU** (renderer only) | Prevents flicker/races | **WebGLBackground** | Fail if geometry/uniforms written elsewhere |
| **Emergence**: `mode:'emergence'` + **random→random** | Keeps opening cloud non-spiral | **Engine** (BLUEPRINT_READY payload) | Fail if flag missing or spiral detected |
| **Viewport hint before Director** | Sizes emergence correctly | **WebGLBackground** → BeatBus | Fail if Theater starts Director without hint/synth |
| **Progressive fill** (no flash): seed `[]` + set `__opening_fill_start_lines=0` | Avoids “instant full screen” flash | **OpeningSequence** | Fail if not present |
| **Emit-once** `PARTICLES_EMERGED` | Single fencepost; no double handoff | **WebGLBackground** | Fail if emitted outside renderer or >1 |
| **Min fill visible ≥1200ms** before emergence | Readability; avoids cut off | **TheaterDirector** timing | Fail if emergence starts too early |

---

## Advisory (aesthetic / tolerant)

| Check | Why it matters | Typical place | Sentinel action |
|---|---|---|---|
| **Monospace stack present** (e.g. `STRICT_MONO_STACK` or literal including “Courier New”) | Predictable strokes/spacing (terminal feel) | **OpeningSequence** container/<pre> | Warn (or pass if any accepted mono signal exists) |
| **No glow** (`textShadow:'none'`) | Keeps it crisp, not neon | **OpeningSequence** | Warn |
| **Point size / sigma uniforms** | Legibility tuning | **WebGLBackground** | Informational |
| **Typing speed lines** (Vision tolerances) | Feel calibration | **TheaterDirector** → `TERMINAL_TYPE` | Vision-only, not a hard fail |
| **Scoped CSS mono fallback** | Resilient to style refactors | **OpeningSequence** <style> | Pass |

> **Principle**: the sentinel blocks things that break the **flow** or **readability**, not a specific font string.

---

## Tools and who enforces what

| Tool | Scope | Enforces |
|---|---|---|
| **Sentinel** (`tools/sst-guard.mjs`) | Static guards | Single writer GPU, emergence flag + random→random, emit-once fencepost, viewport hint gate, progressive fill |
| **Agent** (`opening:phase1`) | Fixer | Makes OpeningSequence mono/no-glow/progressive; aligns Director’s Phase-1 timings |
| **Vision** (`vision/vision-contract.v1.json`) | Telemetry checks | Cursor @2.0s, Typing @2.25s, Fill @3.0s (± tolerances), min fill visible ≥1200ms |

---

## Change the font safely (keep intent)

- Define once:  
  `const STRICT_MONO_STACK = "'Courier New', Courier, 'Lucida Console', 'DejaVu Sans Mono', monospace";`
- Use in **OpeningSequence** container + `<pre>`: `fontFamily: STRICT_MONO_STACK`.
- (Optional) Add scoped CSS fallback:

```jsx
<style>{`
  .opening-sequence, .opening-sequence * {
    font-family: ${STRICT_MONO_STACK} !important;
    font-variant-ligatures: none;
  }
`}</style>
```

The sentinel accepts: the symbol **or** any inline/css rule that includes **Courier New** or equivalent mono stack.

---

## Quick commands

```bash
# Static opening guard
npm run sentinel:opening

# Detailed debug (shows failing snippet)
npm run sentinel:opening:debug

# Vision timing after you record one run
npm run validate:vision
```

---

*This doc is the canonical intent; keep it short and keep the guardrails strict where it matters.*  

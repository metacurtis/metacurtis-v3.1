**Pattern:** *Demo intent formation control (verb safety, single-writer, scroll modes)*

---

## 1.1 Verb Categories

**Morph-setting verbs (conflict with external morph control):**

| Verb | Default uMorphProgress | Use case |
|------|------------------------|----------|
| pullIn | 0.97 | Text reveal with pull effect |
| morph | 0.96 | Standard text morph |
| sparkDrift | 0.96 | Sparkly drift while showing text |
| bloomPulse | 0.98 | Bloom effect on formed text |

**Safe verbs (do not touch morph, safe for FormationDriver):**

| Verb | Effect | Use case |
|------|--------|----------|
| chaos | Chaotic streaky drift | Pre-formation cloud |
| coalesce | Tighter grid motion | Transitioning toward form |
| settle | Calm grid settle | Post-formation hold |
| gentle_drift | Soft drift/breathe | Ambient background |
| breathing_rhythm | Pulse/breathe | Atmospheric hold |
| endCard | Fade to black + overlay | End sequence |

**Pattern: Know your verbs before using them**

Always check whether a verb modifies `uMorphProgress` before using it in demos where
morph is controlled externally (scroll, audio, etc.).

---

## 1.2 Single-Writer Event Ownership (Pattern S)

### What it is

BeatBus enforces that certain events (like `MORPH_PROGRESS`) can only have one
"owner" - the first system to emit becomes the owner, others are blocked.

### Location

`src/theater/bus/index.js` (around line 461).

### The systems that write `MORPH_PROGRESS`

1. **MorphAnimationController** - Timed morph sequences (opening, stage entry)
2. **ConsciousnessEngine** - TEXT_MORPH dissolve/reform transitions
3. **FormationDriver** - Scroll-driven morph control
4. **Renderer defaults** - Some verbs set morph directly in WebGLBackground

### The conflict we hit

FormationDriver was added as a fourth morph writer. It fought with existing
writers. Depending on initialization order, different systems "won" ownership.

### Pattern: Single-writer enforcement

When adding a new emitter for an owned event:

1. Check who currently owns the event
2. Either: claim ownership explicitly and disable others
3. Or: feed into the existing owner rather than emitting directly

### Anti-pattern: Adding competing writers

Do not add a new event emitter without understanding existing emitters.
"It works in tests but not in browser" often means an ownership race condition.

---

## 1.3 Scroll System Dual Purpose

### What it is

ScrollOrchestrator serves two purposes:

1. **Stage navigation**: Scroll position maps to 7 stages (genesis -> transcendence)
2. **Scroll metrics**: Provides scroll velocity/position for other systems

### The conflict we hit

During a formation demo, scroll was:

- Triggering `STAGE_CHANGE` events (navigating the main app)
- AND being read by FormationDriver (controlling morph)

When the user scrolled past the last stage, the app reset/reloaded.

### Pattern: Scroll mode disambiguation

When implementing scroll-controlled features:

1. Define explicit scroll modes (navigation, formation, zoom, etc.)
2. Block conflicting behaviors when in a specific mode
3. Use flags (`__FORMATION_DEMO_ACTIVE__`) to gate behavior at emission points

### Implementation

```javascript
// In ScrollOrchestrator, before emitting STAGE_CHANGE:
if (window.__FORMATION_DEMO_ACTIVE__) {
  // Do not navigate stages during formation demo
  return;
}
```

---

## 1.4 Browser Gesture Gate

### What it is

Modern browsers block certain events (wheel, audio, fullscreen) until
the user has interacted with the page (click, tap, key press).

### Symptom we saw

Demo loaded, particles visible, but scroll/wheel events did not fire
until the user tapped/clicked the screen first.

### Pattern: First-interaction handling

For demos requiring wheel/touch input:

1. Assume events will not fire until a user gesture
2. Provide a prompt: "TAP TO BEGIN" or "SCROLL TO INTERACT"
3. Use `{ passive: true }` on listeners
4. Consider fallback: keyboard arrows, click-drag

### Implementation

```javascript
// Wait for first interaction
document.addEventListener('click', () => {
  window.__USER_HAS_INTERACTED__ = true;
}, { once: true });
```

---

## 1.5 Demo Sequencing: Two-Phase Design

### What it is

Effective demos have two distinct phases:

1. **Automatic choreography**: Proves the capability without user input
2. **Interactive control**: Lets the user experience real-time response

### Why this matters

- Phase 1 builds trust ("this is impressive")
- Phase 2 creates the "aha" moment ("wait, I am controlling this?")
- Starting with interaction is confusing ("what am I supposed to do?")

### Pattern: Auto-first, interactive-second

Start with a short, deterministic sequence that reaches a clear visual goal,
then hand control to user input and keep the UI in that mode.

# Canon Dev-OS (Blueprint)
(What it is, architecture, roles, non-negotiables, modes, commands, incident model, extension guide)

**One-liner:** A development operating layer that wires a single injector, HUD v2, runtime guardrails, Sentinel (static/structural checks), Vision (timing contracts), and Agent/Pilot (automation) around your BeatBus so you can declare intent, measure it, auto-correct drift, and block regressions.

## Core roles
- Injector: DEV-only, idempotent boot; loads Bridge-Guard → Policy → Pilot → Violation-Tap → mini HUD → HUD v2 → Steps/Playbooks; installs BeatBus counters before HUD.
- HUD v2: incidents, macros (Opening/FPS), Steps/Playbooks, Pilot controls, bus stats. Toggle with Alt+`.
- Bridge-Guard: Guard/Canon warnings → incidents.
- Violation-Tap: console “Canon violation/Guard …” → incidents.
- Pilot/Policy: automation; propose/apply safe remediations (e.g., drawRange scale).
- Steps/Playbooks: small safe fixes (Fix drawRange, Verify FPS).
- Sentinel: static/structural/fencepost checks (Strict/Relaxed).
- Vision: timing contract (cursor/typing/fill/min-fill) + telemetry validator.
- BeatBus: event spine; injector wraps emit/on/off so HUD shows live counters.

## Non-negotiables
- One injector • One GPU writer • One timing contract • One fencepost (PARTICLES_EMERGED once after first full bind).

## Modes & switches
```js
localStorage.setItem('canonBusMode','TELEMETRY'); location.reload(); // tune
localStorage.setItem('canonBusMode','STRICT'); location.reload();    // gate
```

## Commands
- `npm run validate:opening` — structural openings checks (Strict/Relaxed with SST_RELAXED=1)
- `npm run ci:fencepost` — headless fencepost check (0 OK, 2 timeout, 3 playwright missing)
- `npm run canon:verify` — injector/HUD presence, no legacy
- Vision record/validate (if available): `npm run agent:run -- --goal=opening:record`, `npm run validate:vision`

## Extend without drift
- New beat → events.js + Director schedule + Overlay/Renderer handler + Vision tolerance if time-critical.
- New macro → HUD; optionally headless twin for CI.
- New remediation → Step (+ Playbook); wire into Policy for Pilot suggestions.

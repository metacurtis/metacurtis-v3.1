# Canon Console Rendering Playbook

**Purpose:** Give humans + autonomous agents a single source of truth for sight-line, guardrail, and remediation workflows across the Canon Dev-OS stack. Use this flow whenever opening-sequence or consciousness renderer regressions appear.

## 1. Bring the Console Online
- `await window.CANON_INJECTOR?.ready?.()` – wait until injector reports ready; stats now include `incidents: true` when sinks are active.
- Confirm incident pipeline: `window.CANON_CONSOLE.getIncidentStats()` should report non-zero `total` after a console warning.
- Force HUD if needed: `CANON_CONSOLE.showHud();` (F2 / Ctrl+H still works).

## 2. Snapshot The Situation
- HUD → *Renderer* panel → `Fix drawRange` button to sync geometry with `uActiveCount`.
- HUD → *Opening Fencepost* panel → run **Run Opening Macro**; fencepost is green when `FENCEPOST_OK` incident lands.
- In console: `CANON_CONSOLE.getIncidents().slice(0, 5)` – share this payload with automation (see §5).
- `CANON_CONTRACT_TAP.getStats()` to spot contract migrations/violations (high `violationRate` means payload drift).

## 3. Incident Pipeline Hooks
- `window.CANON_CONSOLE.incidents.on('new', handler)` – stream incidents into your debugger or telemetry bus.
- `window.CANON_CONSOLE.incidents.clear()` – resets store (use before new attempt to reduce noise).
- `window.CANON_CONSOLE.__incidentStore.bus` exposes raw emitter if deeper instrumentation is required.

## 4. Guard & Playbook Execution Order
1. **Blueprint Guard V2** (auto-fallback if geometry invalid).
2. **Contract Tap** (payload shape, migrations).
3. **Lifecycle Guards** (frequency/rate limits keep opening stable).
4. **Learning System** (patterns → suggestions; see console `Learning` logs).
5. **Pilot** (auto playbooks for shader validation / drawRange / FPS).

Keep `localStorage.canonBusMode` in `TELEMETRY` while iterating. Switch to `STRICT` before regression verification.

## 5. Sharing With Constitutional AI
Provide the agent with:
```js
{
  hud: CANON_CONSOLE.stats(),
  incidents: CANON_CONSOLE.getIncidents(),
  contracts: CANON_CONTRACT_TAP.getStats(),
  lifecycle: window.CANON_LIFECYCLE?.guards
}
```
Outline the target outcome (e.g. “opening sequence must emit `PARTICLES_EMERGED` < 6s”). The agent can now:
- Trigger macros: `CANON_CONSOLE.runMacro('macroOpening')`.
- Apply pilot playbooks: dispatch custom decision via `window.dispatchEvent(new CustomEvent('canon:pilot:decision', {...}))` or let policy auto-run when incidents arrive.
- Report back with `CANON_PILOT.getState()` plus `CANON_CONSOLE.getIncidentStats()` deltas.

## 6. Rendering Rehab Checklist
1. Record FPS probe: `CANON_CONSOLE.runMacro('macroVerify')` (expect ≥55 FPS on desktop).
2. Validate shader compile/link: watch for `GL_ERROR` / `SHADER_*` incidents; pilot will auto-apply baseline playbook if integrated GPU flagged.
3. Inspect GPU single-writer violations: `CANON_GPU_WATCHDOG.getViolations()`.
4. When geometry fallback applied, fetch blueprint sample from incident context to inspect `activeCount` < `MAX_PARTICLES`.

## 7. Legacy Canon Pruning
- `canon-archive/` and `canon-console.backup/` are frozen snapshots; do **not** import from `@/canon/*` in runtime code.
- Modern sources live under `canon-console/`. The injector now ensures all guardrails load from this tree.
- If tooling recreates legacy stubs, reject the change or funnel through this playbook to keep a single authoritative pipeline.

## 8. Hand-off Template
When handing the case to another engineer/agent include:
```
Context: opening render stalls at stage 2
Mode: TELEMETRY
Stats: CANON_CONSOLE.stats()
Top Incidents: CANON_CONSOLE.getIncidents().slice(0,3)
FpsProbe: CANON_CONSOLE.runMacro('macroVerify') // result
Next Step: request Canon Pilot to run GL_VALIDATE_FAIL_BASELINE if incidents contain GL_VALIDATE_FAIL
```
Use this format to align with the constitutional protocol expectations.

---
**Reminder:** No manual DOM hacks. Let the guardrails surface violations, then remediate through pilot steps or targeted fixes so the system learns from the pattern log.

# canon-console Inventory (read-only)

- Root: `canon-console`
- Files scanned: **31**
- Buckets: `agent:6`, `browser:5`, `lib:11`, `model:1`, `runtime:8`

## Summary Table

| File | Kind | Bytes | LOC | Exports | Flags |
|---|---:|---:|---:|---|---|
| `canon-console/agent/lib/analyzer.js` | agent | 0 | 1 | `-` |         |
| `canon-console/agent/lib/deduper.js` | agent | 0 | 1 | `-` |         |
| `canon-console/agent/lib/fingerprint.js` | agent | 0 | 1 | `-` |         |
| `canon-console/agent/pilot.js` | agent | 6485 | 120 | `startPilot` | DOM WIN BUS  GUARD    |
| `canon-console/agent/policy.js` | agent | 1428 | 32 | `policy` |  WIN   GUARD    |
| `canon-console/agent/server.js` | agent | 2465 | 88 | `-` |         |
| `canon-console/browser/collectors/atomCollector.js` | browser | 0 | 1 | `-` |         |
| `canon-console/browser/collectors/eventCollector.js` | browser | 0 | 1 | `-` |         |
| `canon-console/browser/inject.js` | browser | 6463 | 107 | `-` | DOM WIN BUS HUD GUARD VTAP INJ  |
| `canon-console/browser/rules/importRules.js` | browser | 0 | 1 | `-` |         |
| `canon-console/browser/rules/shaderRules.js` | browser | 0 | 1 | `-` |         |
| `canon-console/index.js` | lib | 376 | 12 | `CanonConsole, Incident, incidentStore` |         |
| `canon-console/model/incident.js` | model | 1818 | 77 | `Incident, default` |         |
| `canon-console/package-lock.json` | lib | 43825 | 1254 | `-` |         |
| `canon-console/package.json` | lib | 395 | 19 | `-` |         |
| `canon-console/runtime/bridge-guard.js` | runtime | 1439 | 23 | `-` | DOM WIN BUS  GUARD    |
| `canon-console/runtime/hud.js` | runtime | 15227 | 314 | `-` | DOM WIN BUS HUD     |
| `canon-console/runtime/pilot-ui-mini.js` | runtime | 4053 | 132 | `-` | DOM WIN BUS HUD     |
| `canon-console/runtime/playbooks-extra.js` | runtime | 396 | 13 | `ExtraPlaybooks` |         |
| `canon-console/runtime/playbooks.js` | runtime | 1071 | 25 | `Playbooks, default` |         |
| `canon-console/runtime/steps-extra.js` | runtime | 812 | 27 | `ExtraSteps` |         |
| `canon-console/runtime/steps.js` | runtime | 1374 | 22 | `Steps` |  WIN       |
| `canon-console/runtime/violation-tap.js` | runtime | 2303 | 61 | `-` |  WIN BUS  GUARD VTAP INJ  |
| `canon-console/sinks/beatbusSink.js` | lib | 0 | 1 | `-` |         |
| `canon-console/sinks/consoleSink.js` | lib | 2116 | 79 | `default` |  WIN       |
| `canon-console/sinks/webglSink.js` | lib | 7416 | 281 | `default` |  WIN       |
| `canon-console/store/emitter.js` | lib | 479 | 25 | `Emitter, default` |         |
| `canon-console/store/incidentStore.js` | lib | 2825 | 111 | `default, incidentStore` |         |
| `canon-console/store/indexedDBStore.js` | lib | 0 | 1 | `-` |         |
| `canon-console/ui/ConsoleOverlay.jsx` | lib | 0 | 1 | `-` |         |
| `canon-console/ui/IncidentList.jsx` | lib | 0 | 1 | `-` |         |

## Import Hotspots (top internal references)

- `../model/incident.js` × 3
- `../agent/policy.js` × 1
- `./emitter.js` × 1

## File Notes (first header/comment block)

### `canon-console/agent/lib/analyzer.js`
_No header comment detected._
### `canon-console/agent/lib/deduper.js`
_No header comment detected._
### `canon-console/agent/lib/fingerprint.js`
_No header comment detected._
### `canon-console/agent/pilot.js`
```text
// canon-console/agent/pilot.js
// Canon Pilot — single agent to guide (L3) and pilot (L4) safely on top of Canon Guard.
```
### `canon-console/agent/policy.js`
```text
// canon-console/agent/policy.js
```
### `canon-console/agent/server.js`
_No header comment detected._
### `canon-console/browser/collectors/atomCollector.js`
_No header comment detected._
### `canon-console/browser/collectors/eventCollector.js`
_No header comment detected._
### `canon-console/browser/inject.js`
_No header comment detected._
### `canon-console/browser/rules/importRules.js`
_No header comment detected._
### `canon-console/browser/rules/shaderRules.js`
_No header comment detected._
### `canon-console/index.js`
```text
// Canon Console Entry Point
```
### `canon-console/model/incident.js`
_No header comment detected._
### `canon-console/package-lock.json`
_No header comment detected._
### `canon-console/package.json`
_No header comment detected._
### `canon-console/runtime/bridge-guard.js`
```text
// canon-console/runtime/bridge-guard.js
```
### `canon-console/runtime/hud.js`
```text
// canon-console/runtime/hud.js
// Canon HUD v2 — full Dev-OS dashboard (idempotent, DEV-only)
//
// Highlights:
// - Auto-hides legacy mini HUDs (#canon-hud, #canon_pilot_ui, #canon-pilot-ui)
// - Toggle HUD with Alt+`
// - Sections: System/Bus, Pilot, Incidents, Opening Fencepost, Theater, Renderer, Stage
// - Controls: bus mode (STRICT/TELEMETRY/TOLERANT), Pilot Auto, Run Playbook, Verify FPS,
//             Theater Start/Cancel/Emit Hint, Renderer Fix drawRange
// - Persists UI state in localStorage (canonHud:*)
```
### `canon-console/runtime/pilot-ui-mini.js`
```text
// canon-console/runtime/pilot-ui-mini.js
// Canon Pilot — Mini HUD (DEV-only, idempotent, auto-hides if HUD v2 is active)
//
// Behavior:
// - If HUD v2 is present (window.__canonHudV2__), this mini HUD does not render.
// - Else it renders a tiny "Auto: ON/OFF" badge + last decision/action.
// - Updates every 1s and on pilot events. Click toggles Auto.
//
```
### `canon-console/runtime/playbooks-extra.js`
```text
// canon-console/runtime/playbooks-extra.js
```
### `canon-console/runtime/playbooks.js`
```text
// canon-console/runtime/playbooks.js
// Canon Console — Base Playbooks (clean, no step definitions here)
// NOTE: Steps are provided by runtime/steps.js (and optionally steps-extra.js)
```
### `canon-console/runtime/steps-extra.js`
```text
// canon-console/runtime/steps-extra.js
```
### `canon-console/runtime/steps.js`
```text
// canon-console/runtime/steps.js
```
### `canon-console/runtime/violation-tap.js`
```text
// canon-console/runtime/violation-tap.js
// Violation Tap — route Guard/Canonicalizer warnings → incidents (DEV-only, idempotent)
//
// Captures:
//  - "Canon violation: ..." lines (BeatBus boundary/canonicalizer)
//  - "Canon Guard ..." warn/error lines
//  - Optional custom events: 'canon:bus:violation'
```
### `canon-console/sinks/beatbusSink.js`
_No header comment detected._
### `canon-console/sinks/consoleSink.js`
_No header comment detected._
### `canon-console/sinks/webglSink.js`
```text
// canon-console/sinks/webglSink.js
```
### `canon-console/store/emitter.js`
```text
// Minimal browser-safe emitter (no Node deps)
```
### `canon-console/store/incidentStore.js`
_No header comment detected._
### `canon-console/store/indexedDBStore.js`
_No header comment detected._
### `canon-console/ui/ConsoleOverlay.jsx`
_No header comment detected._
### `canon-console/ui/IncidentList.jsx`
_No header comment detected._
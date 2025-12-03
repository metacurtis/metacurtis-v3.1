# SST 3.5 Contract – Pass 1 (Discovery Only)

Goal: capture where SST 3.5 “lives” today. No runtime changes; docs only.

## Step 1 – Raw artifact collection (WSL commands)

- `/tmp/schema-files.txt` ✅ — relevant entries: `sst/canon/v3.5.schema.json`, `sst/canon/schema.json`, `archive/canonical-v3.4/sst-v3.4.schema.json`, `src/config/canonical/sst-v3.3.schema.json`, `doctor_artifacts/report.schema.json` (many node_modules refs ignored).
- `/tmp/sst-json.txt` ✅ — **empty** (no `*.sst3.5.json` / `*sst3*.json` scene files found).
- `rg "sst3.5"` / `rg "Sst35"` ✅ — no hits.
- Visual verb searches ✅:
  - `docs/opening-wiring.md` (ownership notes), `sst/canon/v3.5.json` (visualEffects registry), `src/config/canonical/canonicalAuthority.js` (getVisualEffect), `src/components/narrative/NarrationController.jsx` (verb → directive routing), `src/components/webgl/WebGLBackground.jsx` (directive handler).
- Canonical/contract searches ✅ (high-volume; key hits):
  - Canonical stack: `sst/canon/v3.5.json`, `src/config/sst-loader.js`, `src/config/canonical/canonicalAuthority.js`, `src/config/canonical/visualEffects.js`.
  - Contracts: `src/theater/events.js` (RENDER_DIRECTIVE payload comment), `src/theater/bus/schemas.js` (runtime validator), `src/theater/bus/index.js` (batching + guard), `src/theater/VisualOrchestrator.js` (single-writer intent), `src/theater/bus/emitters.js` (raw emitter).
  - Renderer sinks: `src/components/webgl/WebGLBackground.jsx` listener; `docs/opening-wiring.md` risk notes.
- `rg "RENDER_DIRECTIVE"` ✅ — confirms main emitters/validators/listeners: `events.js`, `bus/index.js`, `bus/schemas.js`, `VisualOrchestrator.js`, `WebGLBackground.jsx`, plus docs/reports.

## Step 2 – Wiring map

- Filled out at `docs/sst3.5-wiring-map.md` with artifacts, COMPETING_CONTRACT/POTENTIAL_MULTI_WRITER tags, and narrative summary.

## Notes

- Schema + generated types cover only a subset of the canonical JSON; runtime Canonical + VisualOrchestrator + BeatBus drive behavior.
- No standalone `*.sst3.5.json` scene files were found; all SST data appears to be centralized in `sst/canon/v3.5.json` and the Canonical build path.

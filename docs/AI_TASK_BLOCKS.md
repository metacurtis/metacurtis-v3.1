# Pattern S Task Blocks (AI Partners)

Use these canonical blocks whenever Claude/Kodex scopes work that touches Pattern S resources. Each block assumes:

- Ownership is authoritative in `docs/OWNERSHIP.md`
- `npm run gate:opening` / `npm run gate:topology` run before + after implementation
- Evidence (reports under `reports/`) is attached to the PR

---

## Renderer Uniform Change
- **Ownership:** WebGLBackground.jsx is the sole writer for GPU uniforms (see `[uniforms]` section).
- **Goal:** Describe the change (e.g., expose new directive parameter, tweak interpolation).
- **Implementation Steps:**
  1. Update renderer directive handling in `src/components/webgl/WebGLBackground.jsx`.
  2. If external modules need influence, add fields to the RENDER_DIRECTIVE payload instead of writing uniforms directly.
  3. Update relevant presets/configs to emit the directive.
  4. Run `npm run gate:opening`.
- **Do Not:** Write `u*` uniforms outside WebGLBackground; emit `MORPH_PROGRESS`; bind geometry from other modules.
- **Validation:** `npm run gate:opening`, targeted visual test, attach `reports/single-writer-violations.json` & `reports/ownership-compliance.json`.

---

## MORPH Pipeline Change
- **Ownership:** `src/theater/controllers/MorphAnimationController.js` is the only `MORPH_PROGRESS` emitter. `BeatBus` middleware enforces the latch.
- **Goal:** Describe morph behavior change (e.g., easing, source data, diagnostics).
- **Implementation Steps:**
  1. Modify MorphAnimationController (owner) to incorporate the change.
  2. If Engine/Director need telemetry, emit/update `ENGINE:MORPH_STATE`/`DIRECTOR:MORPH_STATE` diagnostics only—never `MORPH_PROGRESS`.
  3. Keep payload shape stable; update schemas if needed.
  4. Run `npm run gate:opening`.
- **Do Not:** Emit `MORPH_PROGRESS` from Engine/Director or any hooks; write morph uniforms outside the renderer.
- **Validation:** `npm run gate:opening`, scenario playback, attach Pattern S reports.

---

## Add / Modify BeatBus Event
- **Ownership:** Emitters live in the module that owns the behavior (update `[events]` in `docs/OWNERSHIP.md` first).
- **Goal:** Introduce a new contract event or change payload semantics.
- **Implementation Steps:**
  1. Edit `docs/OWNERSHIP.md` ([events]) to declare the owner; re-run `npm run generate-ownership`.
  2. Implement emitter in the owner file and listeners in consumers (never duplicate emitters).
  3. Run `npm run trace-bus && npm run scan-bloat`.
  4. Attach updated `reports/beatbus-map.{md,json}` to the PR.
- **Do Not:** Emit the same event from multiple owners; leave events without listeners.
- **Validation:** `npm run gate:topology`, relevant feature tests, add evidence delta describing new event.

---

## Refactor to Single Writer
- **Ownership:** Determine correct owner via `docs/OWNERSHIP.md`.
- **Goal:** Remove duplicate emitters/writers introduced historically.
- **Implementation Steps:**
  1. Identify offending files via `reports/single-writer-violations.json` or `reports/event-orphans.json`.
  2. Move logic into the owner (e.g., WebGLBackground for uniforms, MorphAnimationController for `MORPH_PROGRESS`).
  3. Delete non-owner writes/emits; add events/props to route data instead.
  4. Run `npm run gate:opening && npm run gate:topology`.
- **Do Not:** Silence scanners without fixing root cause or editing `tools/pattern-s.config.json` to hide issues.
- **Validation:** Attach clean Pattern S reports and describe what removed duplicates.

---

## Pattern S Checklist (for every task block)
- Confirm owner files in `docs/OWNERSHIP.md`.
- Run `npm run build-evidence` before coding (captures baseline beatbus map).
- Implement strictly within owner files.
- Run `npm run gate:opening`, `npm run gate:topology`, `npm run validate-ownership`.
- Attach `reports/single-writer-violations.json`, `reports/event-orphans.json`, `reports/ownership-compliance.json`, `reports/beatbus-map.json` to the PR.
- Document any `SKIP_OWNERSHIP_CHECK=1` usage with a follow-up issue due in 48 hours.

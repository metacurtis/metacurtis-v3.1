# SST 3.5 Wiring Map

> Discovery snapshot of all SST 3.5 artifacts: schemas, canonical JSON, interpreters, emitters, validators, and “contract” objects.

---

## Canonical Contract Invariant (Phase 0)

**Invariant – Canonical Owner (SST 3.5)**

For SST 3.5, the **canonical contract** is the pair:

- `sst/canon/v3.5.json`
- `sst/canon/schema.json`

Runtime code – including (but not limited to) `canonicalAuthority`, `VisualOrchestrator`, `BeatBus`, and the renderer – **MUST conform to this contract**.

Any local types, comments, or per-module assumptions are **descriptive only** and **cannot override** this contract. If they disagree with `sst/canon/schema.json` + `sst/canon/v3.5.json`, they are considered **partial / legacy** until updated.

Status: **Phase 0 – contract owner pinned.** Schema may be partial; future passes will expand it, but the owner will not move.

---

## Invariants (for the contract itself – target state)

- SST 3.5 is **machine-readable** and validated by a single canonical schema/contract.
- There is exactly **one “owner”** of the SST 3.5 shape (schema + tests), and all other consumers conform to it.
- No runtime path should consume SST 3.5 data without going through validation.

*(These are target invariants — this doc is about how reality differs.)*

---

## 1. Artifact Table

| Artifact Path | Type | Role / Responsibility | Reads From | Writes To / Emits | Notes / Suspected Drift |
|-----------------------------------------------|--------------|-------------------------------------------------|---------------------------------------------|--------------------------------------|----------------------------------------------------|
| `sst/canon/v3.5.json` | SST Config | Canonical SST v3.5 payload (visualEffects, beatSheets, features, pipeline, scrollAndMorph) | – | Loaded by runtime via `sst-loader`, Canonical builder, tools | Claims “SINGLE_SOURCE_OF_TRUTH”; contains sections not covered by schema. |
| `sst/canon/schema.json` (alias `sst/canon/v3.5.schema.json`) | JSON Schema | Validates SST payload | `sst/canon/v3.5.json` | – | COMPETING_CONTRACT: only covers meta/visual/orchestration/performance; missing stages/scrollAndMorph/features/visualEffects; `additionalProperties:true` in timelines. |
| `sst/tools/validate-sst.cjs` | Tool | CLI validator | `sst/canon/schema.json`, `sst/canon/v3.5.json` | Console exit code | Uses under-specified schema; no CI linkage seen. |
| `sst/tools/test-schema.cjs` | Tool/Test | Sample Ajv checks for schema | `sst/canon/schema.json` | Console | Exercises small happy/sad cases; same schema gaps apply. |
| `sst/tools/detect-drift.cjs` | Tool | Flags hardcoded particles/fonts/tierMix vs SST | `sst/canon/v3.5.json` | Console errors | Treats SST JSON as authority for counts/fonts; allowlist skips canonical files. |
| `sst/tools/generate-jsdoc.cjs` | Generator | Emits SST JSDoc types | `sst/canon/v3.5.json` | `src/types/sst-types.js` | Types mirror schema subset; omits features/stages/visualEffects. COMPETING_CONTRACT vs runtime. |
| `src/types/sst-types.js` | Types | JSDoc typedefs + loader helper | – | Type hints for IDEs | COMPETING_CONTRACT: only meta/visual/performance; ignores pipeline/visual verbs; not aligned with runtime Canonical. |
| `src/config/sst-loader.js` | Loader | ESM-friendly loader for SST v3.5 JSON | `sst/canon/v3.5.json` | Exports SST object | Feeds Canonical + utils; no validation at load time. |
| `src/config/canonical/canonicalAuthority.js` | Runtime | Builds read-only Canonical object; translates visual verbs to renderer directives | `src/config/sst-loader.js`, `src/config/canonical/visualEffects.js` | Canonical export; `getVisualEffect` → RENDER_DIRECTIVE payloads | COMPETING_CONTRACT: derives fields (stageOrder, scroll breakpoints, visual verb mappings) absent from schema; renderer-specific fields (uMotionMode, tierModes, pointSize). |
| `src/config/canonical/visualEffects.js` | Registry | Renderer-ready overrides for visual verbs | – | Merged into Canonical visualEffects | POTENTIAL_MULTI_WRITER: dual registries (JSON + overrides); uses renderer uniform keys not validated anywhere. |
| `src/theater/events.js` | Event Catalog | Declares EVENTS constants + inline RENDER_DIRECTIVE payload comment | – | Imports by emitters/listeners | Contract comment lists morph/pointSize/tier fields; not tied to JSON schema. |
| `src/theater/bus/schemas.js` | Runtime Schema | BeatBus payload validator | Event payloads | Validation errors/warnings | COMPETING_CONTRACT: RENDER_DIRECTIVE allows many optional fields; only requires `timestamp` + `source`; no tie to SST visual verbs. |
| `src/theater/bus/index.js` | Runtime Bus | Dispatch + batching + contract loading | BeatBus listeners | Emits events incl. `RENDER_DIRECTIVE` | Warns (DEV) if RENDER_DIRECTIVE source ≠ `visual_orchestrator`; batching may coalesce directives. POTENTIAL_MULTI_WRITER. |
| `src/theater/bus/emitters.js` | Runtime API | Thin emit helpers for events incl. `RENDER_DIRECTIVE` | Callers | BeatBus emit | Bypasses VisualOrchestrator guard; allows alternate writers. POTENTIAL_MULTI_WRITER. |
| `src/theater/VisualOrchestrator.js` | Runtime Interpreter | Single-writer wrapper for RENDER_DIRECTIVE; assembles directives from scroll/opening/narration | Canonical, BeatBus, EVENTS | Emits RENDER_DIRECTIVE | Uses stage/verb/effect fields not in JSON Schema; assumes Canonical visualEffects resolve to renderer uniforms. |
| `src/components/narrative/NarrationController.jsx` | Runtime Emitter | Fires narration beats and visual verbs | Canonical beatSheets + `getVisualEffect` | Routes to VisualOrchestrator → RENDER_DIRECTIVE | If verb unresolved, skips directive; schema does not describe `visual` fields. COMPETING_CONTRACT vs schema. |
| `src/theater/ScrollOrchestrator.js` | Runtime Emitter | Maps scroll % to stage + directives | Canonical (stageOrder, breakpoints) | VisualOrchestrator.updateFromScroll → RENDER_DIRECTIVE | Scroll visuals emitted without MORPH_PROGRESS; depends on Canonical structure not validated by schema. |
| `docs/opening-wiring.md`, `docs/ARCHITECTURE.md` | Docs | Prior wiring/ownership notes for visual verbs & RENDER_DIRECTIVE | – | – | Reference only; note multi-writer risks in opening/scroll handoff. |

> 💡 **How to use this table:**  
> Use tags like `COMPETING_CONTRACT`, `POTENTIAL_MULTI_WRITER`, `SEQUENCING_HAZARD` in the Notes column.

---

## 2. Contract vs Runtime Notes

### 2.1 Field-level mismatches

- **Schema coverage vs Canonical/runtime**
  - Schema (`sst/canon/schema.json`) models meta/visual letterGeometry, orchestration, performance counts, and the presence/shape of `visualEffects` + `narrative.beatSheets[*].visual`. Canonical/runtime still expect features, stageOrder/stages, scrollAndMorph breakpoints, quality/tier, pipeline, shaderContract, events, integrityRules, etc., which remain under-validated. (COMPETING_CONTRACT)
- **Visual verbs → renderer directives**
  - Schema now models `visualEffects` and `narrative.beatSheets[*].visual`; cross-reference integrity is enforced by tooling (`audit-visual-canon`, `test:contract:sst`), not by JSON Schema. Runtime translates verbs into renderer uniforms (`uMotionMode`, `uFlowTurbulence`, `tierModes`, `pointSize`, `activeCount`, etc.) and bus schema treats directive fields as optional. Contract defines IDs/intent; renderer semantics still live in code. (COMPETING_CONTRACT)
- **Defaults/heuristics**
  - `getVisualEffect` heuristically derives tierModes/opacity when absent; schema doesn’t require or document these, so missing data silently produces guessed payloads. (COMPETING_CONTRACT)

### 2.2 Competing sources of truth

- **JSON Schema vs Canonical builder vs Types**
  - `sst/canon/schema.json` (minimal) vs `src/config/canonical/canonicalAuthority.js` (derived/expanded) vs `src/types/sst-types.js` (schema-derived subset). They disagree on available sections (no visualEffects/pipeline/stages in types/schema). (COMPETING_CONTRACT)
- **Visual verb registry split**
  - `sst/canon/v3.5.json` visualEffects plus `src/config/canonical/visualEffects.js` overrides; no single registry is validated/tested. (POTENTIAL_MULTI_WRITER, COMPETING_CONTRACT)
- **Event/Directive contract**
  - RENDER_DIRECTIVE shape is described informally (`src/theater/events.js` comment), loosely validated (`bus/schemas.js` optional fields), and produced by Canonical → VisualOrchestrator. No unified contract/test ensures alignment. (COMPETING_CONTRACT)

### 2.3 Multi-writer / sequencing hazards

- **RENDER_DIRECTIVE emitters**
  - VisualOrchestrator is intended single writer, but `src/theater/bus/emitters.js` exposes a raw emitter; BeatBus only warns (DEV) when source ≠ `visual_orchestrator`. (POTENTIAL_MULTI_WRITER)
- **Dual visual verb registries**
  - Canonical JSON vs override module may diverge; translator heuristics hide missing fields. (POTENTIAL_MULTI_WRITER)
- **Schema extensibility**
  - `additionalProperties:true` in opening timeline and minimal required fields allow silent drift/extension without validation, inviting shadow contract fields. (POTENTIAL_MULTI_WRITER)

---

## Visual Canon Audit (Phase 1)

Tool: `npm run audit:canon:visuals`

- Canon visuals live in `sst/canon/v3.5.json`:
  - Registry: `visualEffects.particleEffects` keys (verb IDs)
  - Usage: `narrative.beatSheets[*].visual`

Guardrails:
- `tools/audit-visual-canon.cjs` compares registry vs beats; fails if any beat visual lacks a matching `visualEffects` id; ignores unused if `status: "reserved"`.
- `npm run test:contract:sst` runs verify + visual audit (fails on drift).

Status (Phase 1): **GREEN**
- Unknown beat visuals: none.
- Unused visuals: none (non-reserved).

---

## RENDER_DIRECTIVE Emitters – Phase 1 Reality

Discovery via `tools/check-render-directive-single-writer.cjs`:

- Allowed writers (enforced by the checker):
  - `src/theater/VisualOrchestrator.js` – primary orchestrated path.
  - `src/theater/bus/emitters.js` – legacy/transitional path.
- Additional references (non-emit / supporting): `src/theater/events.js`, `src/theater/bus/index.js`, `src/theater/bus/schemas.js`, `src/components/webgl/WebGLBackground.jsx`, `src/components/webgl/ParticleChoreography.jsx`.

Phase goals:
- Phase 1: no new emitters outside the allowlist (checker fails if added).
- Phase 2: collapse to a single writer (VisualOrchestrator), retire direct emits from `bus/emitters.js`.

---

## RENDER_DIRECTIVE Contract Field Canon (Phase 1)

- Authoritative field list: `src/theater/contracts/renderDirectiveFields.js` (`RENDER_DIRECTIVE_FIELDS`)
- Schema implementation: `src/theater/bus/schemas.js` (exports `RENDER_DIRECTIVE_SCHEMA_FIELDS`)
- Guardrail: `tools/check-render-directive-fieldset.cjs` (run via `npm run test:contract:renderDirective`)
- Doc: `docs/render-directive-contract.md` describes these fields only (no extra names).

---

## 3. Narrative Summary

> **Question:**  
> “Where does SST 3.5 live today? Who thinks they’re in charge of the contract, and how do they talk to each other?”

**3.1 De facto owner**  
- The runtime Canonical stack (`sst/canon/v3.5.json` + `canonicalAuthority.js` + `visualEffects.js`) plus VisualOrchestrator/BeatBus governs actual behavior. Visual verbs are resolved at runtime and emitted as RENDER_DIRECTIVE payloads expected by the renderer.

**3.2 Other would-be owners**  
- JSON Schema (`sst/canon/schema.json`) + validate-sst/test-schema tools claim validation but omit most runtime fields.  
- Generated types (`src/types/sst-types.js`) mirror the minimal schema, not the runtime Canonical.  
- Event contracts live separately in `src/theater/events.js` + `bus/schemas.js`.

**3.3 Biggest drifts**  
- Schema and types ignore major Canonical sections (stages, scrollAndMorph, features, visualEffects, pipeline, shaderContract).  
- Visual verb contract: IDs/beat references enforced via Canon + audit; renderer-uniform semantics still live in code/overrides (no deep schema for uniforms).  
- RENDER_DIRECTIVE contract is fragmented (comment vs bus schema vs Canonical translator) with only optional validation.

**3.4 Recommended future canonical owner**  
- Make `sst/canon/v3.5.json` + a full JSON Schema (covering stages, scroll/morph, visualEffects, events/verbs) the single source, with tests aligning `canonicalAuthority` + `bus/schemas`/RENDER_DIRECTIVE expectations to that schema. Tighten BeatBus to enforce single-writer for directives.

---

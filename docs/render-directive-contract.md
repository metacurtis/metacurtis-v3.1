# RENDER_DIRECTIVE Contract (Phase 0C → 1)

> **Transitional status (Phase 0C/1)**  
> The field set is canonical in code; this doc and the runtime schema consume it.
> - Authoritative field list: `src/theater/contracts/renderDirectiveFields.js` (`RENDER_DIRECTIVE_FIELDS`)
> - Schema consumer: `src/theater/bus/schemas.js`
> - Doc consumer: this file
>
> The doc is descriptive only; it MUST NOT introduce field names that are not present in `RENDER_DIRECTIVE_FIELDS`.

## Goal

Define a single, explicit contract for the `RENDER_DIRECTIVE` event payload used by:

- `VisualOrchestrator`
- `BeatBus` / `src/theater/bus/schemas.js`
- WebGL renderer (`WebGLBackground.jsx`)

This document is the **authoritative description** of the structure; `bus/schemas.js` is the schema implementation.

---

## Invariant – Single Envelope Shape

- `RENDER_DIRECTIVE` MUST use the same envelope shape across producers.
- New fields must be added here **and** to `bus/schemas.js` together. Legacy fields must be marked as such in both places.

---

## Envelope (current fields)

```ts
type RenderDirective = {
  /** Required base (BeatBus adds timestamp if absent). */
  timestamp: number;           // ms
  source: string;              // emitter identifier
  _meta?: { version?: string; sequence?: number };
  _extended?: Record<string, unknown>;

  /** Optional event metadata */
  kind?: string;               // semantic tag for directive kind
  phase?: string;              // e.g. 'opening' | 'scroll' | 'narration'
  stage?: string;              // SST stage identifier
  targetGlyph?: object;        // glyph targeting payload (letter/centroid/indices)
  clearGlyphTarget?: boolean;  // clear glyph targeting state

  /** Renderer/morph uniforms */
  uMotionMode?: number;
  uParticlePhase?: number;
  uFlowTurbulence?: number;
  uParticleFlash?: number;
  uOpacityMin?: number;
  uOpacityMax?: number;
  uMorphProgress?: number;     // preferred field for morph progress
  uStageProgress?: number;
  pointSize?: number;          // maps to uPointSize
  gaussianSigma?: number;
  tierHighlight?: unknown;     // usually number[]
  uniforms?: Record<string, number | number[]>;

  /** Geometry / counts */
  activeCount?: number;
  drawCount?: number;

  /** Flags */
  enterQrMode?: boolean;
  exitQrMode?: boolean;

  /** Legacy */
  morphProgress?: number;      // legacy alias for uMorphProgress
};
```

---

## Authoritative Field List (Phase 1)

The authoritative list of top-level fields for `RENDER_DIRECTIVE` is defined in:

- `src/theater/contracts/renderDirectiveFields.js` (`RENDER_DIRECTIVE_FIELDS`)

This document **describes** those fields; it MUST NOT introduce fields that
do not exist in `RENDER_DIRECTIVE_FIELDS`.

---

## Alignment with `bus/schemas.js`

Implementation rule (Phase 0C):

- `bus/schemas.js` MUST implement the structure described here.
- Any fields present in `bus/schemas.js` but **not** described here are:
  - either explicitly marked as `@deprecated`, or
  - removed / folded into documented fields.

> **Future phase:**  
> The goal is to replace this hand-maintained alignment with a
> **single source of truth** (e.g. a shared JSON Schema or Zod schema)
> that:
> - drives runtime validation in `bus/schemas.js`, and
> - generates / validates this document’s field list.

---

## Status

- Phase: **0C** – contract documented and aligned with `bus/schemas.js`; single-writer enforcement remains a future step.
```

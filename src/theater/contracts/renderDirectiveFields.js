/**
 * ROLE:
 *  - Central field list for RENDER_DIRECTIVE payloads.
 *
 * INVARIANTS:
 *  - This is the single authoritative list of top-level payload fields
 *    for RENDER_DIRECTIVE.
 *  - bus/schemas.js MUST use this list when defining the schema.
 *  - docs/render-directive-contract.md describes these fields, it does
 *    not invent new ones.
 */

export const RENDER_DIRECTIVE_FIELDS = [
  'kind',
  'phase',
  'stage',
  'channel',
  'uMotionMode',
  'uParticlePhase',
  'uFlowTurbulence',
  'uParticleFlash',
  'uOpacityMin',
  'uOpacityMax',
  'uMorphProgress',
  'uStageProgress',
  'activeCount',
  'pointSize',
  'gaussianSigma',
  'tierHighlight',
  'uniforms',
  'morphProgress', // legacy alias
  'drawCount',
  'enterQrMode',
  'exitQrMode',
  // Extended optional fields (schema-authorized)
  'verb',
  'effect',
  'stageIndex',
  'scrollPercent',
  'easing',
  'durationMs',
  'atMs',
  'camera',
  'cueId',
  'targetGlyph',
  'clearGlyphTarget',
];

export default RENDER_DIRECTIVE_FIELDS;

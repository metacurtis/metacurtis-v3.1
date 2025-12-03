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
];

export default RENDER_DIRECTIVE_FIELDS;

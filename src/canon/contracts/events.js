// __CANON_INSTALLED__
// Canon event contracts (versioned)
export const CANON_CONTRACTS = {
  version: '1.0.0',
  events: {
    STAGE_CHANGE: {
      required: ['from','to'],
      notes: 'Single canonical shape. No aliases.'
    },
    QUALITY_CHANGE: {
      required: ['tier'],
      notes: 'Single canonical shape. No aliases.'
    },
    BLUEPRINT_READY: {
      required: ['stage','quality','blueprint'],
      optional: ['cached'],
      notes: 'Renderer consumes stage/quality/blueprint; cached is informative.'
    }
  },
  deprecations: {
    STAGE_CHANGE: { stage: 'deprecated' },
    QUALITY_CHANGE: { quality: 'deprecated' }
  }
};
export default CANON_CONTRACTS;

// Stub for legacy import - actual contracts now in canon-console/runtime/contracts/registry.js
export const CANON_CONTRACTS = {
  version: '1.0.0',
  events: {
    STAGE_CHANGE: {
      required: ['from', 'to'],
    },
    QUALITY_CHANGE: {
      required: ['tier'],
    },
    BLUEPRINT_READY: {
      required: ['stage', 'quality', 'blueprint'],
    }
  }
};

export default CANON_CONTRACTS;

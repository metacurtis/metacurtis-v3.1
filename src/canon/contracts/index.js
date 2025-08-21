// @doctor:4b-disposers
const __doctorDisposers = []; // [CANON:CONTRACTS:L1-L2]
export const CanonContracts = { morphing: {
    inputs: ['scrollProgress', 'morphProgress'],
    outputs: ['uMorphProgress', 'uFadeProgress'],
    validation: { range: [0, 1], updateHz: 60 }
  },
  blueprint: {
    required: ['particleCount', 'atmosphericPositions', 'allenAtlasPositions'],
    constraints: { particleCount: { min: 1, max: 15000 } }
  },
  events: {
    STAGE_CHANGE: { shape: ['from', 'to'] },
    QUALITY_CHANGE: { shape: ['tier'] },
    BLUEPRINT_READY: { shape: ['blueprint', 'stage', 'quality', 'cached'] }
  }
}; // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}
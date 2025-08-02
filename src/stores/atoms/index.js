// src/stores/atoms/index.js
// Central export for all atomic stores

export { createAtom, useAtomValue } from './createAtom';

// Only export atoms that actually exist
import { narrativeAtom } from './narrativeAtom';
import { performanceAtom } from './performanceAtom';
import { interactionAtom } from './interactionAtom';
import { resourceAtom } from './resourceAtom';

// Export individually
export { narrativeAtom } from './narrativeAtom';
export { performanceAtom } from './performanceAtom';
export { interactionAtom } from './interactionAtom';
export { resourceAtom } from './resourceAtom';

// Check if these atoms exist before exporting
let stageAtom, qualityAtom, clockAtom;

try {
  stageAtom = require('./stageAtom').stageAtom;
  exports.stageAtom = stageAtom;
} catch (e) {
  console.warn('stageAtom not found - skipping export');
}

try {
  qualityAtom = require('./qualityAtom').qualityAtom;
  exports.qualityAtom = qualityAtom;
} catch (e) {
  console.warn('qualityAtom not found - skipping export');
}

try {
  clockAtom = require('./clockAtom').clockAtom;
  exports.clockAtom = clockAtom;
} catch (e) {
  console.warn('clockAtom not found - skipping export');
}

// Re-export for backwards compatibility
export const atoms = {
  narrative: narrativeAtom,
  performance: performanceAtom,
  interaction: interactionAtom,
  resource: resourceAtom,
  // Only include if they exist
  ...(stageAtom ? { stage: stageAtom } : {}),
  ...(qualityAtom ? { quality: qualityAtom } : {}),
  ...(clockAtom ? { clock: clockAtom } : {}),
};

// Development access
if (import.meta.env.DEV) {
  window.atoms = atoms;
  console.log('⚛️ Available atoms:', Object.keys(atoms));
}

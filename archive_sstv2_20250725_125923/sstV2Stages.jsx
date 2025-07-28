// src/config/canonical/canonicalAuthority.js";
// ✅ SST v2.0 CANONICAL AUTHORITY - Immutable Stage Definitions
// THE SINGLE SOURCE OF TRUTH - Never modify without SST update

/**
 * ✅ CANONICAL STAGE SYSTEM - SST v2.0
 * Immutable definitions for 7-stage consciousness evolution
 * Any deviation from these definitions is contamination
 */

// ✅ STAGE ORDER: Canonical sequence (IMMUTABLE)
export const SST_V2_STAGE_ORDER = [
  'genesis',       // 0: Genesis Spark
  'discipline',    // 1: Discipline Forge  
  'neural',        // 2: Neural Awakening
  'velocity',      // 3: Velocity Explosion
  'architecture',  // 4: Architecture Consciousness
  'harmony',       // 5: Harmonic Mastery
  'transcendence'  // 6: Consciousness Transcendence
];

// ✅ STAGE MAPPINGS: Bidirectional (IMMUTABLE)
export const SST_V2_NAME_TO_INDEX = Object.freeze({
  genesis: 0,
  discipline: 1,
  neural: 2,
  velocity: 3,
  architecture: 4,
  harmony: 5,
  transcendence: 6
});

export const SST_V2_INDEX_TO_NAME = Object.freeze({
  0: 'genesis',
  1: 'discipline',
  2: 'neural',
  3: 'velocity',
  4: 'architecture',
  5: 'harmony',
  6: 'transcendence'
});

// ✅ STAGE DEFINITIONS: Complete metadata (IMMUTABLE)
export const SST_V2_STAGE_DEFINITIONS = Object.freeze({
  genesis: {
    index: 0,
    name: 'genesis',
    title: 'Genesis Spark',
    description: '1983: Age 8 - The Genesis Code',
    narrative: 'A single spark of curiosity on a Commodore 64',
    brainRegion: 'hippocampus',
    particles: 2000,
    colors: ['#00FF00', '#22c55e', '#15803d'],
    scrollRange: [0, 14]
  },
  discipline: {
    index: 1,
    name: 'discipline',
    title: 'Discipline Forge',
    description: '1983-2022: The Silent Years - Discipline Forged',
    narrative: '39 years in business, logistics, and finance',
    brainRegion: 'brainstem',
    particles: 3000,
    colors: ['#1e40af', '#3b82f6', '#1d4ed8'],
    scrollRange: [14, 28]
  },
  neural: {
    index: 2,
    name: 'neural',
    title: 'Neural Awakening',
    description: '2022-2025: AI Foundation - Mathematical Mastery',
    narrative: 'AI partnership consciousness emerging',
    brainRegion: 'leftTemporal',
    particles: 5000,
    colors: ['#4338ca', '#a855f7', '#7c3aed'],
    scrollRange: [28, 42]
  },
  velocity: {
    index: 3,
    name: 'velocity',
    title: 'Velocity Explosion',
    description: 'February 2025: "Teach me to code" - Velocity Unleashed',
    narrative: 'Global electrical storm constellation',
    brainRegion: 'rightTemporal',
    particles: 12000,
    colors: ['#7c3aed', '#9333ea', '#6b21a8'],
    scrollRange: [42, 56]
  },
  architecture: {
    index: 4,
    name: 'architecture',
    title: 'Architecture Consciousness',
    description: 'March 2025: WebGL Crisis → Architecture Awakening',
    narrative: 'Analytical grid constellations forming order from chaos',
    brainRegion: 'frontalLobe',
    particles: 8000,
    colors: ['#0891b2', '#06b6d4', '#0e7490'],
    scrollRange: [56, 70]
  },
  harmony: {
    index: 5,
    name: 'harmony',
    title: 'Harmonic Mastery',
    description: 'March 2025: Systems Choreography - Code as Dance',
    narrative: 'Golden balletic constellation flows',
    brainRegion: 'leftPrefrontal',
    particles: 12000,
    colors: ['#f59e0b', '#d97706', '#b45309'],
    scrollRange: [70, 84]
  },
  transcendence: {
    index: 6,
    name: 'transcendence',
    title: 'Consciousness Transcendence',
    description: 'Present: Digital Consciousness - Proven Mastery',
    narrative: 'Unified golden galaxy constellation',
    brainRegion: 'consciousnessCore',
    particles: 15000,
    colors: ['#ffffff', '#f59e0b', '#00ffcc'],
    scrollRange: [84, 100]
  }
});

// ✅ SYSTEM CONSTANTS: Performance and scaling (IMMUTABLE)
export const SST_V2_SYSTEM_CONSTANTS = Object.freeze({
  TOTAL_STAGES: 7,
  MIN_STAGE_INDEX: 0,
  MAX_STAGE_INDEX: 6,
  OPERATIONAL_PARTICLES: 15000,
  SHOWCASE_PARTICLES: 17000,
  TARGET_FPS: 60,
  LIGHTHOUSE_TARGET: 90
});

// ✅ VALIDATION FUNCTIONS: Contamination prevention
export function validateStageName(stageName) {
  return SST_V2_STAGE_ORDER.includes(stageName);
}

export function validateStageIndex(stageIndex) {
  return Number.isInteger(stageIndex) && 
         stageIndex >= SST_V2_SYSTEM_CONSTANTS.MIN_STAGE_INDEX && 
         stageIndex <= SST_V2_SYSTEM_CONSTANTS.MAX_STAGE_INDEX;
}

export function getStageByName(stageName) {
  if (!validateStageName(stageName)) {
    throw new Error(`SST v2.0 VIOLATION: Invalid stage name "${stageName}". Valid stages: ${SST_V2_STAGE_ORDER.join(', ')}`);
  }
  return SST_V2_STAGE_DEFINITIONS[stageName];
}

export function getStageByIndex(stageIndex) {
  if (!validateStageIndex(stageIndex)) {
    throw new Error(`SST v2.0 VIOLATION: Invalid stage index "${stageIndex}". Valid range: 0-6`);
  }
  const stageName = SST_V2_INDEX_TO_NAME[stageIndex];
  return SST_V2_STAGE_DEFINITIONS[stageName];
}

// ✅ CONTAMINATION DETECTION: Forbidden patterns
export const CONTAMINATION_PATTERNS = Object.freeze([
  'silent',           // Old stage name
  'awakening',        // Old stage name  
  'acceleration',     // Old stage name
  'digital-awakening', // Old system reference
  '5-stage',          // Old system reference
  'curtisStory',      // Personal contamination
  'brain-metaphor'    // Personal contamination
]);

export function detectContamination(codeString) {
  const violations = [];
  
  CONTAMINATION_PATTERNS.forEach(pattern => {
    if (codeString.toLowerCase().includes(pattern.toLowerCase())) {
      violations.push(pattern);
    }
  });
  
  return {
    contaminated: violations.length > 0,
    violations,
    clean: violations.length === 0
  };
}

// ✅ MIGRATION UTILITIES: Safe transitions
export function migrateStageReference(oldReference) {
  const migrations = {
    'silent': 'discipline',
    'awakening': 'neural', 
    'acceleration': 'velocity'
  };
  
  return migrations[oldReference] || oldReference;
}

// ✅ DEVELOPMENT: Global access and validation
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.Canonical = {
    STAGE_ORDER: SST_V2_STAGE_ORDER,
    STAGE_DEFINITIONS: SST_V2_STAGE_DEFINITIONS,
    NAME_TO_INDEX: SST_V2_NAME_TO_INDEX,
    INDEX_TO_NAME: SST_V2_INDEX_TO_NAME,
    SYSTEM_CONSTANTS: SST_V2_SYSTEM_CONSTANTS,
    
    // Validation functions
    validateStageName,
    validateStageIndex,
    getStageByName,
    getStageByIndex,
    detectContamination,
    migrateStageReference,
    
    // Quick validation
    validateSystem: () => {
      console.log('🧪 SST v2.0 System Validation:');
      console.log(`✅ Total Stages: ${SST_V2_SYSTEM_CONSTANTS.TOTAL_STAGES}`);
      console.log(`✅ Stage Order: ${SST_V2_STAGE_ORDER.join(' → ')}`);
      console.log(`✅ Particle Range: ${SST_V2_STAGE_DEFINITIONS.genesis.particles} → ${SST_V2_STAGE_DEFINITIONS.transcendence.particles}`);
      console.log(`✅ Showcase Capability: ${SST_V2_SYSTEM_CONSTANTS.SHOWCASE_PARTICLES} particles`);
      return true;
    }
  };
  
  console.log('🎭 SST v2.0 Canonical Authority: System definitions loaded');
  console.log('🔧 Available: window.Canonical');
  console.log('🧪 Validate: window.Canonical.validateSystem()');
}

export default {
  STAGE_ORDER: SST_V2_STAGE_ORDER,
  STAGE_DEFINITIONS: SST_V2_STAGE_DEFINITIONS,
  NAME_TO_INDEX: SST_V2_NAME_TO_INDEX,
  INDEX_TO_NAME: SST_V2_INDEX_TO_NAME,
  SYSTEM_CONSTANTS: SST_V2_SYSTEM_CONSTANTS,
  
  validate: {
    stageName: validateStageName,
    stageIndex: validateStageIndex,
    contamination: detectContamination
  },
  
  get: {
    stageByName: getStageByName,
    stageByIndex: getStageByIndex
  },
  
  migrate: {
    stageReference: migrateStageReference
  }
};  
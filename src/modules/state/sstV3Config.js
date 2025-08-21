// @doctor:4b-disposers
const __doctorDisposers = []; // src/modules/state/sstV3Config.js
/**
 * SST v3.0 Complete Stage Configurations
 * Based on Consciousness Theater specification
 *
 * @sst-version 3.0
 */
export const SST_V3_CONFIG = {
  // Stage 0: Genesis Spark
  genesis: {
    name: 'Genesis Spark',
    scrollRange: [0, 14],
    particleCount: 2000,
    duration: 30, // seconds
    narrative: {
      time: '1983, Age 8',
      location: 'Dallas, Texas',
      moment: 'First encounter with programming on Commodore 64'
    },
    tiers: {
      tier1: {
        ratio: 0.6, // 1200 particles
        sprite: 7,
        sizeMultiplier: 0.6,
        opacity: [0.3, 0.6],
        behavior: 'drift',
        config: {
          speed: 0.2,
          pattern: 'perlin',
          frequency: 0.1
        }
      },
      tier2: {
        ratio: 0.2, // 400 particles
        sprites: [0, 1],
        sizeMultiplier: 0.8,
        opacity: [0.4, 0.7],
        behavior: 'orbital',
        config: {
          radius: 5.0,
          speed: 0.05
        }
      },
      tier3: {
        ratio: 0.1, // 200 particles
        sprite: 4,
        sizeMultiplier: 1.2,
        opacity: [0.6, 0.8],
        behavior: 'twinkle',
        config: {
          frequency: 2.0,
          intensity: 0.3
        }
      },
      tier4: {
        ratio: 0.1, // 200 particles
        sprite: 1,
        sizeMultiplier: 1.5,
        opacity: [0.8, 1.0],
        behavior: 'pulse',
        position: 'hippocampus_seeds'
      }
    },
    brainTarget: 'hippocampus',
    colors: ['#00FF00', '#22c55e', '#15803d'], // Commodore 64 green
    camera: {
      type: 'dolly',
      angle: 5,
      duration: 30
    },
    memoryFragment: {
      trigger: 5, // scroll %
      content: 'Commodore 64 Terminal',
      interaction: 'type_enabled',
      duration: 10000
    }
  },

  // Stage 1: Discipline Forge
  discipline: {
    name: 'Discipline Forge',
    scrollRange: [14, 28],
    particleCount: 3000,
    duration: 35,
    narrative: {
      time: '1983-2022',
      theme: 'Structure emerging from chaos',
      transformation: 'Marine Corps discipline'
    },
    tiers: {
      tier1: {
        ratio: 0.55, // 1650 particles
        sprite: 7,
        sizeMultiplier: 0.65,
        opacity: [0.35, 0.65],
        behavior: 'regiment',
        config: {
          pattern: 'grid_drift',
          spacing: 2.0,
          wobble: 0.1
        }
      },
      tier2: {
        ratio: 0.25, // 750 particles
        sprites: [0, 1],
        sizeMultiplier: 0.85,
        opacity: [0.5, 0.75],
        behavior: 'column',
        config: {
          alignment: 'vertical',
          stability: 0.9
        }
      },
      tier3: {
        ratio: 0.1, // 300 particles
        sprite: 5,
        sizeMultiplier: 1.25,
        opacity: [0.7, 0.85],
        behavior: 'anchor',
        config: {
          rhythm: 'military_cadence',
          bpm: 120
        }
      },
      tier4: {
        ratio: 0.1, // 300 particles
        sprite: 11,
        sizeMultiplier: 1.6,
        opacity: [0.85, 1.0],
        behavior: 'authority',
        position: 'brainstem_formation'
      }
    },
    brainTarget: 'brainstem',
    colors: ['#1e40af', '#3b82f6', '#1d4ed8'], // Military blues
    camera: {
      type: 'authority',
      angle: 10,
      orbit: 'structured'
    },
    memoryFragment: {
      trigger: 20,
      content: 'Marine Corps Eagle, Globe, and Anchor',
      interaction: 'hover_motto'
    }
  }

  // Remaining stages continue...
  // [Include all 7 stages as in the artifact]
};

export const getStageConfig = (stageName) => {
  return SST_V3_CONFIG[stageName] || SST_V3_CONFIG.genesis;
};

export const getStageNames = () => {
  return Object.keys(SST_V3_CONFIG);
};

export default SST_V3_CONFIG; // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}
// @doctor:4b-disposers
const __doctorDisposers = []; // Tier behavior definitions - stage-agnostic
export const TIER_BEHAVIORS = { drift: { type: "cpu", params: { speed: 0.2, pattern: "perlin", frequency: 0.1, amplitude: 2.0 }, shaderUniforms: { uDriftSpeed: 0.2, uDriftPattern: 0 } },
  cluster: { type: "generation", params: { noiseScale: 0.1, clusterThreshold: 0.3, densityMultiplier: 0.8 } },
  orbital: { type: "cpu", params: { radius: 5.0, speed: 0.05, axis: [0, 1, 0] }, shaderUniforms: { uOrbitRadius: 5.0, uOrbitSpeed: 0.05 } },
  structural: { type: "generation", params: { gridSize: 2.0, flexibility: 0.3, alignment: "vertical" } },
  twinkle: { type: "shader", params: { frequency: 2.0, intensity: 0.3, randomSeed: true }, shaderUniforms: { uTwinkleFreq: 2.0, uTwinkleIntensity: 0.3 } },
  pulse: { type: "shader", params: { frequency: 0.5, pattern: "sine", phase: 0 }, shaderUniforms: { uPulseFreq: 0.5, uPulsePattern: 0 } },
  prominent: { type: "hybrid", params: { scaleBoost: 1.2, opacityBoost: 1.1, haloEffect: true }, shaderUniforms: { uProminenceScale: 1.2, uProminenceGlow: 1.1 } },
  anatomical: { type: "generation", params: { brainAccuracy: 0.95, centerWeight: 0.7, regionDensity: "variable" } }
};

export const TIER_BEHAVIOR_SETS = {
  0: ["drift", "cluster"],
  1: ["orbital", "structural"],
  2: ["twinkle", "pulse"],
  3: ["prominent", "anatomical"]
};

export const applyBehavior = (particleData, behaviorId, time, params = {}) => {
  const b = TIER_BEHAVIORS[behaviorId];
  if (!b) return particleData;
  switch (b.type) {
    case 'continuous':
      if (b.cpuAnimation) {
        return b.cpuAnimation(particleData, time, { ...b.params, ...params }, particleData.seed);
      }
      break;
    case 'generation':
      if (b.generationFunction) {
        return b.generationFunction(particleData, particleData.rng, { ...b.params, ...params });
      }
      break;
    default:break;
  }
  return particleData;
};

export const getBehaviorUniforms = (ids = []) => {
  const u = {};
  ids.forEach((id) => {
    const b = TIER_BEHAVIORS[id];
    if (b?.shaderUniforms) Object.assign(u, b.shaderUniforms);
  });
  return u;
};

export const STAGE_BEHAVIOR_OVERRIDES = {
  velocity: { 0: ["drift", "fade"], all: { additionalBehavior: "storm", intensity: 1.5 } },
  harmony: { all: { syncGroup: "global", harmonicRatio: 1.618 } },
  transcendence: { all: { prominenceMultiplier: 1.2, unifiedField: true } }
};

export const FUSION_BEHAVIORS = {
  thunderclap: { trigger: "velocity", timing: 8000, behavior: { type: "explosion", effect: "radialBurst", intensity: 2.0, duration: 500, targetTiers: "all" } }
}; // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}
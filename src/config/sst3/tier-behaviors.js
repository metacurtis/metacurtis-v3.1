// Tier behavior definitions - stage-agnostic, reusable
export const TIER_BEHAVIORS = {
  drift:       { type: "cpu",     params: { speed: 0.2, pattern: "perlin", frequency: 0.1, amplitude: 2.0 }, shaderUniforms: { uDriftSpeed: 0.2, uDriftPattern: 0 } },
  cluster:     { type: "generation", params: { noiseScale: 0.1, clusterThreshold: 0.3, densityMultiplier: 0.8 } },
  orbital:     { type: "cpu",     params: { radius: 5.0, speed: 0.05, axis: [0,1,0] }, shaderUniforms: { uOrbitRadius: 5.0, uOrbitSpeed: 0.05 } },
  structural:  { type: "generation", params: { gridSize: 2.0, flexibility: 0.3, alignment: "vertical" } },
  twinkle:     { type: "shader",  params: { frequency: 2.0, intensity: 0.3, randomSeed: true }, shaderUniforms: { uTwinkleFreq: 2.0, uTwinkleIntensity: 0.3 } },
  pulse:       { type: "shader",  params: { frequency: 0.5, pattern: "sine", phase: 0 }, shaderUniforms: { uPulseFreq: 0.5, uPulsePattern: 0 } },
  prominent:   { type: "hybrid",  params: { scaleBoost: 1.2, opacityBoost: 1.1, haloEffect: true }, shaderUniforms: { uProminenceScale: 1.2, uProminenceGlow: 1.1 } },
  anatomical:  { type: "generation", params: { brainAccuracy: 0.95, centerWeight: 0.7, regionDensity: "variable" } }
};

export const TIER_BEHAVIOR_SETS = {
  0: ["drift", "cluster"],
  1: ["orbital", "structural"],
  2: ["twinkle", "pulse"],
  3: ["prominent", "anatomical"]
};

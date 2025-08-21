// CANONICAL AUTHORITY - SST v3.0 Config
export const SST_V3_CONFIG = {
  version: "3.0.0",
  schemaVersion: "2025-07-23",
  features: {
    gaussianFalloff: true,
    noiseClusteringTier1: false,
    centerWeightingTier4: true,
    fusionMoments: true,
    tierLOD: true,
    memoryFragments: true,
    narrativeDialogue: true,
    audioSystem: true
  },
  performance: {
    targetFPS: 60,
    minFPS: 55,
    maxParticles: 17000,
    maxRenderTime: 16.67,
    heapLimit: 250,
    gcPauseMax: 3,
    lodThresholds: { ultra:15000, high:10000, medium:5000, low:2000 }
  },
  tierSystem: {
    count: 4,
    defaultRatios: [0.5, 0.2, 0.15, 0.15],
    sizeMultipliers: [0.6, 0.8, 1.2, 1.5],
    opacityRanges: [
      [0.3, 0.6],
      [0.5, 0.8],
      [0.7, 0.9],
      [0.8, 1.0]
    ],
    names: [
      "Consciousness Substrate",
      "Spatial Awareness",
      "Memory Anchors",
      "Neural Constellations"
    ]
  },
  stages: {
    genesis: {
      id: 0, name: "genesis", title: "Genesis Spark",
      scrollRange: [0,14], duration: 30, particles: 2000,
      tierRatios: [0.60,0.20,0.10,0.10],
      colors: ["#00FF00","#22c55e","#15803d"],
      brainRegion: "hippocampus",
      brainCoordinates: { center: [-5, 0, -10], radius: 15 }, // Added
      camera: { movement:"intimate_dolly", angle:5, duration:30 },
      sprites: { tier1:[7], tier2:[0,1], tier3:[4], tier4:[1] }
    },
    discipline: {
      id:1, name:"discipline", title:"Discipline Forge",
      scrollRange:[14,28], duration:35, particles:3000,
      tierRatios:[0.55,0.25,0.10,0.10],
      colors:["#1e40af","#3b82f6","#1d4ed8"],
      brainRegion:"brainstem",
      brainCoordinates: { center: [0, -20, 0], radius: 10 }, // Added
      camera:{ movement:"authority_orbit", angle:10, duration:35 },
      sprites:{ tier1:[7], tier2:[0,1], tier3:[5], tier4:[11] }
    },
    neural: {
      id:2, name:"neural", title:"Neural Awakening",
      scrollRange:[28,42], duration:35, particles:5000,
      tierRatios:[0.55,0.20,0.15,0.10],
      colors:["#4338ca","#a855f7","#7c3aed"],
      brainRegion:"leftTemporal",
      brainCoordinates: { center: [-15, 0, 0], radius: 18 }, // Added
      camera:{ movement:"discovery_orbit", angle:15, duration:35 },
      sprites:{ tier1:[7], tier2:[0,1,2], tier3:[2], tier4:[10] }
    },
    velocity: {
      id:3, name:"velocity", title:"Velocity Explosion",
      scrollRange:[42,56], duration:40, particles:12000,
      tierRatios:[0.45,0.20,0.15,0.20],
      colors:["#7c3aed","#9333ea","#6b21a8"],
      brainRegion:"multiRegion",
      brainCoordinates: { center: [0, 0, 0], radius: 25 }, // Added
      camera:{ movement:"dramatic_pullback", angle:20, duration:40, shake:true },
      sprites:{ tier1:[7], tier2:[0,1,6], tier3:[6], tier4:[13] }
    },
    architecture: {
      id:4, name:"architecture", title:"Architecture Consciousness",
      scrollRange:[56,70], duration:35, particles:8000,
      tierRatios:[0.50,0.20,0.15,0.15],
      colors:["#0891b2","#06b6d4","#0e7490"],
      brainRegion:"frontalLobe",
      brainCoordinates: { center: [0, 10, 15], radius: 20 }, // Added
      camera:{ movement:"grid_tracking", angle:12, duration:35 },
      sprites:{ tier1:[7], tier2:[0,1], tier3:[11], tier4:[12] }
    },
    harmony: {
      id:5, name:"harmony", title:"Harmonic Mastery",
      scrollRange:[70,84], duration:35, particles:12000,
      tierRatios:[0.50,0.20,0.15,0.15],
      colors:["#f59e0b","#d97706","#b45309"],
      brainRegion:"cerebellum",
      brainCoordinates: { center: [0, -10, -15], radius: 18 }, // Added
      camera:{ movement:"balletic_orbit", angle:25, duration:35 },
      sprites:{ tier1:[7], tier2:[0,1,9], tier3:[9], tier4:[15] }
    },
    transcendence: {
      id:6, name:"transcendence", title:"Consciousness Transcendence",
      scrollRange:[84,100], duration:40, particles:15000,
      tierRatios:[0.50,0.20,0.15,0.15],
      colors:["#ffffff","#f59e0b","#00ffcc"],
      brainRegion:"consciousnessCore",
      brainCoordinates: { center: [0, 0, 0], radius: 30 }, // Added
      camera:{ movement:"reverent_orbit", angle:30, duration:40 },
      sprites:{ tier1:[7], tier2:[0,1,14], tier3:[14], tier4:[15] }
    }
  },
  global: {
    defaultTransitionDuration: 1000,
    scrollSmoothing: 0.15,
    morphAcceleration: 2.0,
    audioMasterVolume: 0.8,
    subtitlePosition: "bottom",
    qualityAutoAdjust: true,
    analyticsEnabled: true
  }
};

// Add brainCoordinates to the freeze list
Object.freeze(SST_V3_CONFIG);
Object.freeze(SST_V3_CONFIG.features);
Object.freeze(SST_V3_CONFIG.performance);
Object.freeze(SST_V3_CONFIG.tierSystem);
Object.keys(SST_V3_CONFIG.stages).forEach(k=>{
  Object.freeze(SST_V3_CONFIG.stages[k]);
  Object.freeze(SST_V3_CONFIG.stages[k].sprites);
  Object.freeze(SST_V3_CONFIG.stages[k].camera);
  Object.freeze(SST_V3_CONFIG.stages[k].brainCoordinates); // Added
});
Object.freeze(SST_V3_CONFIG.global);

export const getStageByName = (name) => SST_V3_CONFIG.stages[name];
export const getStageByScroll = (p) =>
  Object.values(SST_V3_CONFIG.stages).find(s => p >= s.scrollRange[0] && p < s.scrollRange[1]);
export const isFeatureEnabled = (flag) => !!SST_V3_CONFIG.features[flag];
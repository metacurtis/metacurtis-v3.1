#!/usr/bin/env bash
set -euo pipefail

echo "=== SST v3 Migration Script ==="

# 0. Safety checks
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "❌ Not inside a git repo. Aborting."
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "⚠️  You have uncommitted changes. Commit or stash before proceeding."
  exit 1
fi

# 1. Prepare directories
mkdir -p src/config/sst3 src/config/canonical backups

# 2. Backup any v3 attempts you may have right now
for f in src/config/sst3/* src/config/sst3/sst-v3.0-config.js src/config/tier-behaviors.js; do
  if [ -f "$f" ]; then
    ts=$(date +%s)
    mv "$f" "backups/$(basename "$f").$ts.bak"
  fi
done

# 3. Drop in clean v3 modules
# Replace the placeholders BELOW with your final, cleaned versions (no duplicates).
# --- sst-v3.0-config.js ---
cat > src/config/sst3/sst-v3.0-config.js <<'JS'
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
      camera: { movement:"intimate_dolly", angle:5, duration:30 },
      sprites: { tier1:[7], tier2:[0,1], tier3:[4], tier4:[1] }
    },
    discipline: {
      id:1, name:"discipline", title:"Discipline Forge",
      scrollRange:[14,28], duration:35, particles:3000,
      tierRatios:[0.55,0.25,0.10,0.10],
      colors:["#1e40af","#3b82f6","#1d4ed8"],
      brainRegion:"brainstem",
      camera:{ movement:"authority_orbit", angle:10, duration:35 },
      sprites:{ tier1:[7], tier2:[0,1], tier3:[5], tier4:[11] }
    },
    neural: {
      id:2, name:"neural", title:"Neural Awakening",
      scrollRange:[28,42], duration:35, particles:5000,
      tierRatios:[0.55,0.20,0.15,0.10],
      colors:["#4338ca","#a855f7","#7c3aed"],
      brainRegion:"leftTemporal",
      camera:{ movement:"discovery_orbit", angle:15, duration:35 },
      sprites:{ tier1:[7], tier2:[0,1,2], tier3:[2], tier4:[10] }
    },
    velocity: {
      id:3, name:"velocity", title:"Velocity Explosion",
      scrollRange:[42,56], duration:40, particles:12000,
      tierRatios:[0.45,0.20,0.15,0.20],
      colors:["#7c3aed","#9333ea","#6b21a8"],
      brainRegion:"multiRegion",
      camera:{ movement:"dramatic_pullback", angle:20, duration:40, shake:true },
      sprites:{ tier1:[7], tier2:[0,1,6], tier3:[6], tier4:[13] }
    },
    architecture: {
      id:4, name:"architecture", title:"Architecture Consciousness",
      scrollRange:[56,70], duration:35, particles:8000,
      tierRatios:[0.50,0.20,0.15,0.15],
      colors:["#0891b2","#06b6d4","#0e7490"],
      brainRegion:"frontalLobe",
      camera:{ movement:"grid_tracking", angle:12, duration:35 },
      sprites:{ tier1:[7], tier2:[0,1], tier3:[11], tier4:[12] }
    },
    harmony: {
      id:5, name:"harmony", title:"Harmonic Mastery",
      scrollRange:[70,84], duration:35, particles:12000,
      tierRatios:[0.50,0.20,0.15,0.15],
      colors:["#f59e0b","#d97706","#b45309"],
      brainRegion:"cerebellum",
      camera:{ movement:"balletic_orbit", angle:25, duration:35 },
      sprites:{ tier1:[7], tier2:[0,1,9], tier3:[9], tier4:[15] }
    },
    transcendence: {
      id:6, name:"transcendence", title:"Consciousness Transcendence",
      scrollRange:[84,100], duration:40, particles:15000,
      tierRatios:[0.50,0.20,0.15,0.15],
      colors:["#ffffff","#f59e0b","#00ffcc"],
      brainRegion:"consciousnessCore",
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

Object.freeze(SST_V3_CONFIG);
Object.freeze(SST_V3_CONFIG.features);
Object.freeze(SST_V3_CONFIG.performance);
Object.freeze(SST_V3_CONFIG.tierSystem);
Object.keys(SST_V3_CONFIG.stages).forEach(k=>{
  Object.freeze(SST_V3_CONFIG.stages[k]);
  Object.freeze(SST_V3_CONFIG.stages[k].sprites);
  Object.freeze(SST_V3_CONFIG.stages[k].camera);
});
Object.freeze(SST_V3_CONFIG.global);

export const getStageByName = (name) => SST_V3_CONFIG.stages[name];
export const getStageByScroll = (p) =>
  Object.values(SST_V3_CONFIG.stages).find(s => p >= s.scrollRange[0] && p < s.scrollRange[1]);
export const isFeatureEnabled = (flag) => !!SST_V3_CONFIG.features[flag];
JS

# --- tier-behaviors.js ---
cat > src/config/sst3/tier-behaviors.js <<'JS'
// Tier behavior definitions - stage-agnostic
export const TIER_BEHAVIORS = {
  drift: { type:"cpu", params:{ speed:0.2, pattern:"perlin", frequency:0.1, amplitude:2.0 }, shaderUniforms:{ uDriftSpeed:0.2, uDriftPattern:0 } },
  cluster: { type:"generation", params:{ noiseScale:0.1, clusterThreshold:0.3, densityMultiplier:0.8 } },
  orbital: { type:"cpu", params:{ radius:5.0, speed:0.05, axis:[0,1,0] }, shaderUniforms:{ uOrbitRadius:5.0, uOrbitSpeed:0.05 } },
  structural:{ type:"generation", params:{ gridSize:2.0, flexibility:0.3, alignment:"vertical" } },
  twinkle: { type:"shader", params:{ frequency:2.0, intensity:0.3, randomSeed:true }, shaderUniforms:{ uTwinkleFreq:2.0, uTwinkleIntensity:0.3 } },
  pulse: { type:"shader", params:{ frequency:0.5, pattern:"sine", phase:0 }, shaderUniforms:{ uPulseFreq:0.5, uPulsePattern:0 } },
  prominent:{ type:"hybrid", params:{ scaleBoost:1.2, opacityBoost:1.1, haloEffect:true }, shaderUniforms:{ uProminenceScale:1.2, uProminenceGlow:1.1 } },
  anatomical:{ type:"generation", params:{ brainAccuracy:0.95, centerWeight:0.7, regionDensity:"variable" } }
};

export const TIER_BEHAVIOR_SETS = {
  0: ["drift","cluster"],
  1: ["orbital","structural"],
  2: ["twinkle","pulse"],
  3: ["prominent","anatomical"]
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
    default: break;
  }
  return particleData;
};

export const getBehaviorUniforms = (ids = []) => {
  const u = {};
  ids.forEach(id => {
    const b = TIER_BEHAVIORS[id];
    if (b?.shaderUniforms) Object.assign(u, b.shaderUniforms);
  });
  return u;
};

export const STAGE_BEHAVIOR_OVERRIDES = {
  velocity: { 0:["drift","fade"], all:{ additionalBehavior:"storm", intensity:1.5 } },
  harmony: { all:{ syncGroup:"global", harmonicRatio:1.618 } },
  transcendence: { all:{ prominenceMultiplier:1.2, unifiedField:true } }
};

export const FUSION_BEHAVIORS = {
  thunderclap: { trigger:"velocity", timing:8000, behavior:{ type:"explosion", effect:"radialBurst", intensity:2.0, duration:500, targetTiers:"all" } }
};
JS

# --- narrative-dialogue.js ---
cat > src/config/sst3/narrative-dialogue.js <<'JS'
export const NARRATIVE_DIALOGUE = {
  genesis: {
    id:"narr_genesis_001",
    narration:{
      segments:[
        { id:"gen_1", text:"I was eight years old...", timing:{start:3000, duration:8000} },
        { id:"gen_3", text:"I typed those lines exactly...", timing:{start:17000, duration:5000}, memoryFragmentTrigger:"genesis_terminal" }
      ]
    }
  },
  discipline: {
    id:"narr_discipline_001",
    narration:{
      segments:[
        { id:"dis_1", text:"That spark? It got buried.", timing:{start:0, duration:3000} }
      ]
    }
  }
  // ... Add full segments later
};

export const getDialogueSegment = (stage, segmentId) => {
  const s = NARRATIVE_DIALOGUE[stage];
  if (!s) return null;
  return s.narration?.segments?.find(seg=>seg.id===segmentId) || null;
};

export const getParticleCuesForStage = (stage) => {
  const s = NARRATIVE_DIALOGUE[stage];
  if (!s) return [];
  return s.narration?.segments
    ?.filter(seg=>seg.particleCue)
    .map(seg=>({ timing:seg.timing.start, cue:seg.particleCue, segmentId:seg.id })) || [];
};
JS

# --- memory-fragments.js ---
cat > src/config/sst3/memory-fragments.js <<'JS'
export const MEMORY_FRAGMENTS = {
  genesis_terminal: {
    id:"frag_genesis_001",
    stage:"genesis",
    name:"First Code",
    trigger:{ type:"scroll", value:5, unit:"percentage", allowManual:true },
    content:{ type:"interactive", element:"commodore_terminal", size:{width:600, height:400}, position:"center" },
    duration:15000,
    dismissible:true,
    particleEffect:{
      onTrigger:{ targetTiers:[0,1], behavior:"converge", radius:200, intensity:0.7, duration:2000 }
    }
  }
};

export const FRAGMENT_INTERACTIONS = {
  terminal_emulator: {
    handler:"TerminalEmulatorHandler",
    config:{ transition:"fade", duration:500 }
  }
};

export const getFragmentsForStage = (stageName) =>
  Object.values(MEMORY_FRAGMENTS).filter(f=>f.stage===stageName);

export const getActiveFragments = (stageName, scrollPercent, narrativeSegmentId) => {
  return Object.values(MEMORY_FRAGMENTS).filter(frag=>{
    if (frag.stage !== stageName) return false;
    if (frag.trigger.type === 'scroll' &&
        Math.abs(frag.trigger.value - scrollPercent) < 2) return true;
    if (frag.trigger.type === 'narrative' &&
        frag.trigger.segmentId === narrativeSegmentId) return true;
    return false;
  });
};

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.MEMORY_FRAGMENTS = MEMORY_FRAGMENTS;
}
JS

# --- Canonical Authority ---
cat > src/config/canonical/canonicalAuthority.js <<'JS'
// CANONICAL AUTHORITY - SST v3.0 Unified Access Point
import { SST_V3_CONFIG, getStageByName, getStageByScroll, isFeatureEnabled } from '../sst3/sst-v3.0-config.js';
import { TIER_BEHAVIORS, TIER_BEHAVIOR_SETS, applyBehavior, getBehaviorUniforms, STAGE_BEHAVIOR_OVERRIDES, FUSION_BEHAVIORS } from '../sst3/tier-behaviors.js';
import { NARRATIVE_DIALOGUE, getDialogueSegment, getParticleCuesForStage } from '../sst3/narrative-dialogue.js';
import { MEMORY_FRAGMENTS, FRAGMENT_INTERACTIONS, getFragmentsForStage, getActiveFragments } from '../sst3/memory-fragments.js';

export const Canonical = {
  version:'3.0.0',
  authority:'ABSOLUTE',

  stages: SST_V3_CONFIG.stages,
  stageOrder: Object.keys(SST_V3_CONFIG.stages),
  performance: SST_V3_CONFIG.performance,
  features: SST_V3_CONFIG.features,
  tierSystem: SST_V3_CONFIG.tierSystem,

  getStageByName,
  getStageByScroll,
  getStageByIndex:(i)=>SST_V3_CONFIG.stages[Object.keys(SST_V3_CONFIG.stages)[i]],

  behaviors:{
    definitions:TIER_BEHAVIORS,
    sets:TIER_BEHAVIOR_SETS,
    apply:applyBehavior,
    getUniforms:getBehaviorUniforms,
    overrides:STAGE_BEHAVIOR_OVERRIDES,
    fusion:FUSION_BEHAVIORS
  },

  dialogue:NARRATIVE_DIALOGUE,
  getDialogueSegment,
  getParticleCuesForStage,

  fragments:MEMORY_FRAGMENTS,
  fragmentInteractions:FRAGMENT_INTERACTIONS,
  getFragmentsForStage,
  getActiveFragments,

  isFeatureEnabled,

  SYSTEM_CONSTANTS:{
    TOTAL_STAGES:7,
    MIN_STAGE_INDEX:0,
    MAX_STAGE_INDEX:6,
    OPERATIONAL_PARTICLES:15000,
    SHOWCASE_PARTICLES:17000,
    TARGET_FPS:60,
    LIGHTHOUSE_TARGET:90
  }
};

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.CANONICAL = Canonical;
  console.log(`📋 SST v${Canonical.version} Canonical Authority loaded`);
}

export default Canonical;
JS

echo "✅ v3 core files created."

# 4. Replace imports of v2 with Canonical
echo "🔁 Replacing v2 imports..."
files=$(grep -R "sstV2Stages" -l src --include="*.js" --include="*.jsx" || true)
for f in $files; do
  echo "  -> $f"
  sed -i.bak 's#sstV2Stages.*#canonical/canonicalAuthority.js";#' "$f"
  sed -i 's/SST_V2_CANONICAL/Canonical/g' "$f"
done

# fix qualityAtom path if needed
if [ -f src/stores/atoms/qualityAtom.js ]; then
  sed -i.bak 's#sstV2Stages#canonical/canonicalAuthority#g' src/stores/atoms/qualityAtom.js
  sed -i 's/SST_V2_CANONICAL/Canonical/g' src/stores/atoms/qualityAtom.js
fi

# 5. Engine swap (optional: only if you prepared a v3 engine)
if [ -f src/engine/ConsciousnessEngine_v3.js ]; then
  mv src/engine/ConsciousnessEngine.js backups/ConsciousnessEngine_v2_backup.js
  mv src/engine/ConsciousnessEngine_v3.js src/engine/ConsciousnessEngine.js
  echo "✅ Engine swapped to v3 version."
else
  echo "ℹ️  No v3 engine file found. Keep v2 engine but ensure it uses Canonical instead of v2 config."
fi

# 6. Kill duplicate old root-level v3 files (if they exist)
for f in src/config/sst3/sst-v3.0-config.js src/config/tier-behaviors.js; do
  if [ -f "$f" ]; then
    git rm -f "$f" >/dev/null 2>&1 || rm -f "$f"
    echo "🧹 Removed duplicate $f"
  fi
done

# 7. Patch package.json scripts if needed
node - <<'NODE'
import fs from 'fs';
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts["validate:sst3"] = "node ./scripts/validate-sst3.js";
pkg.scripts["predev"] = pkg.scripts["predev"] || "npm run validate:sst3";
pkg.scripts["prebuild"] = pkg.scripts["prebuild"] || "npm run validate:sst3";
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log("✅ package.json patched");
NODE

# 8. Run validator if exists
if [ -f scripts/validate-sst3.js ]; then
  echo "🔍 Running validator..."
  npm run validate:sst3 || true
else
  echo "ℹ️  No validate-sst3.js found. Add one later."
fi

echo "=== Migration complete. Next steps ==="
echo "1) npm run dev"
echo "2) Console should show: 'SST v3.0 Canonical Authority loaded' (no v2.1 strings)"
echo "3) run ./verify_v3.sh (instructions below)"

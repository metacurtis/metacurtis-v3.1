#!/usr/bin/env node
import { SST_V3_CONFIG } from "../src/config/sst3/sst-v3.0-config.js";
import { TIER_BEHAVIORS } from "../src/config/sst3/tier-behaviors.js";
import { NARRATIVE_DIALOGUE } from "../src/config/sst3/narrative-dialogue.js";
import { MEMORY_FRAGMENTS } from "../src/config/sst3/memory-fragments.js";

const errors = [];
const warnings = [];

function validateStages() {
  Object.entries(SST_V3_CONFIG.stages).forEach(([name, stage]) => {
    const sum = stage.tierRatios.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > 0.001) errors.push(`${name}: tier ratios sum to ${sum}, must equal 1.0`);
    if (stage.scrollRange[0] >= stage.scrollRange[1]) errors.push(`${name}: invalid scroll range ${stage.scrollRange}`);
    Object.entries(stage.sprites).forEach(([tier, sprites]) => {
      sprites.forEach(idx => {
        if (idx < 0 || idx > 15) errors.push(`${name}: invalid sprite index ${idx} for ${tier}`);
      });
    });
    if (stage.particles < 1000 || stage.particles > SST_V3_CONFIG.performance.maxParticles) {
      warnings.push(`${name}: particle count ${stage.particles} outside recommended range`);
    }
  });
}

function validateNarrative() {
  Object.entries(NARRATIVE_DIALOGUE).forEach(([stage, dialogue]) => {
    if (!SST_V3_CONFIG.stages[stage]) {
      errors.push(`Narrative for unknown stage: ${stage}`);
      return;
    }
    const segs = dialogue.narration?.segments || [];
    let lastEnd = 0;
    segs.forEach(segment => {
      const { start = 0, duration = 0 } = segment.timing || {};
      if (start < lastEnd) warnings.push(`${stage}: overlapping narration at ${segment.id}`);
      lastEnd = start + duration;
    });
  });
}

function validateFragments() {
  Object.entries(MEMORY_FRAGMENTS).forEach(([id, fragment]) => {
    if (!SST_V3_CONFIG.stages[fragment.stage]) errors.push(`Fragment ${id} references unknown stage: ${fragment.stage}`);
    if (fragment.trigger?.type === "scroll") {
      const range = SST_V3_CONFIG.stages[fragment.stage]?.scrollRange;
      if (range && (fragment.trigger.value < range[0] || fragment.trigger.value > range[1])) {
        warnings.push(`Fragment ${id} triggers outside stage scroll range`);
      }
    }
  });
}

console.log("🔍 Validating SST v3.0 configuration...\n");
validateStages();
validateNarrative();
validateFragments();

if (errors.length) {
  console.error("❌ ERRORS FOUND:");
  errors.forEach(e => console.error("  - " + e));
  process.exit(1);
}
if (warnings.length) {
  console.warn("\n⚠️  WARNINGS:");
  warnings.forEach(w => console.warn("  - " + w));
}

console.log("\n✅ SST v3.0 configuration validated successfully!");
console.log(`  - ${Object.keys(SST_V3_CONFIG.stages).length} stages`);
console.log(`  - ${Object.keys(NARRATIVE_DIALOGUE).length} narratives`);
console.log(`  - ${Object.keys(MEMORY_FRAGMENTS).length} memory fragments`);
console.log(`  - ${Object.keys(TIER_BEHAVIORS).length} tier behaviors`);

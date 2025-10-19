#!/usr/bin/env node

/**
 * SST v3.5 Orchestration Compliance Audit
 * Validates sst/canon/v3.5.json against SST v3.5 specification
 */

const fs = require('fs');
const path = require('path');

const SST_PATH = path.join(__dirname, '../sst/canon/v3.5.json');

// Load SST
let sst;
try {
  sst = JSON.parse(fs.readFileSync(SST_PATH, 'utf8'));
} catch (error) {
  console.error('❌ Failed to load SST:', error.message);
  process.exit(1);
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     SST v3.5 ORCHESTRATION COMPLIANCE AUDIT               ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Expected structure from SST v3.5 spec
const EXPECTED_STAGES = [
  'genesis',
  'discipline',
  'neural',
  'velocity',
  'architecture',
  'harmony',
  'transcendence',
];

const EXPECTED_SECTIONS = {
  narrative: {
    orchestration: {
      required: ['mode', 'scrollLocked', 'skipKey'],
      description: 'Narration orchestration configuration',
    },
    beatSheets: {
      required: EXPECTED_STAGES,
      description: 'Beat sheets for all 7 stages',
    },
  },
  openingSequence: {
    required: ['skippable', 'skipKey', 'timeline'],
    description: 'Opening sequence definition',
  },
  memoryFragments: {
    required: ['ambient', 'interactive', 'climax'],
    description: 'Memory fragment system',
  },
  audioSystem: {
    required: ['layers', 'stageAudio'],
    description: 'Audio layer system',
  },
};

// Results tracking
const results = {
  implemented: [],
  missing: [],
  partial: [],
};

function divider() {
  console.log('─'.repeat(60));
}

// 1. Check Narrative Section
console.log('📖 NARRATIVE SYSTEM');
divider();

const narrative = sst.narrative || {};

// Orchestration
if (narrative.orchestration) {
  const hasMode = !!narrative.orchestration.mode;
  const hasLock = typeof narrative.orchestration.scrollLocked === 'boolean';
  const hasKey = !!narrative.orchestration.skipKey;

  if (hasMode && hasLock && hasKey) {
    console.log('✅ Orchestration configuration: COMPLETE');
    console.log(`   - mode: "${narrative.orchestration.mode}"`);
    console.log(`   - scrollLocked: ${narrative.orchestration.scrollLocked}`);
    console.log(`   - skipKey: "${narrative.orchestration.skipKey}"`);
    results.implemented.push('narrative.orchestration');
  } else {
    console.log('🟡 Orchestration configuration: PARTIAL');
    if (!hasMode) console.log('   ❌ Missing: mode');
    if (!hasLock) console.log('   ❌ Missing: scrollLocked');
    if (!hasKey) console.log('   ❌ Missing: skipKey');
    results.partial.push('narrative.orchestration');
  }
} else {
  console.log('❌ Orchestration configuration: MISSING');
  results.missing.push('narrative.orchestration');
}

// Beat Sheets
if (narrative.beatSheets) {
  const foundStages = Object.keys(narrative.beatSheets);
  const missingStages = EXPECTED_STAGES.filter((s) => !foundStages.includes(s));

  console.log(`\nBeat sheet coverage: ${foundStages.length}/${EXPECTED_STAGES.length}`);
  foundStages.sort().forEach((stage) => {
    const sheet = narrative.beatSheets[stage];
    const beatCount = sheet?.beats?.length ?? 0;
    const duration = sheet?.totalDuration ?? 0;
    console.log(`   ✅ ${stage}: ${beatCount} beats, ${duration}ms`);
    results.implemented.push(`narrative.beatSheets.${stage}`);
  });

  if (missingStages.length > 0) {
    console.log(`\n❌ Missing beat sheets (${missingStages.length}):`);
    missingStages.forEach((stage) => {
      console.log(`   ❌ ${stage}`);
      results.missing.push(`narrative.beatSheets.${stage}`);
    });
  }
} else {
  console.log('\n❌ Beat sheets: MISSING ENTIRELY');
  EXPECTED_STAGES.forEach((stage) => {
    results.missing.push(`narrative.beatSheets.${stage}`);
  });
}

// 2. Check Opening Sequence
console.log('\n');
console.log('🎬 OPENING SEQUENCE');
divider();

if (sst.openingSequence) {
  const hasSkippable = typeof sst.openingSequence.skippable === 'boolean';
  const hasKey = !!sst.openingSequence.skipKey;
  const hasTimeline = Array.isArray(sst.openingSequence.timeline);

  if (hasSkippable && hasKey && hasTimeline) {
    console.log('✅ Opening sequence: COMPLETE');
    console.log(`   - skippable: ${sst.openingSequence.skippable}`);
    console.log(`   - skipKey: "${sst.openingSequence.skipKey}"`);
    console.log(`   - timeline events: ${sst.openingSequence.timeline.length}`);
    results.implemented.push('openingSequence');
  } else {
    console.log('🟡 Opening sequence: PARTIAL');
    if (!hasSkippable) console.log('   ❌ Missing: skippable');
    if (!hasKey) console.log('   ❌ Missing: skipKey');
    if (!hasTimeline) console.log('   ❌ Missing: timeline');
    results.partial.push('openingSequence');
  }
} else {
  console.log('❌ Opening sequence: MISSING');
  console.log('   Expected: skippable, skipKey, timeline');
  results.missing.push('openingSequence');
}

// 3. Check Memory Fragments
console.log('\n');
console.log('🗺️  MEMORY FRAGMENTS');
divider();

if (sst.memoryFragments) {
  const hasAmbient = Array.isArray(sst.memoryFragments.ambient) && sst.memoryFragments.ambient.length > 0;
  const hasInteractive = Array.isArray(sst.memoryFragments.interactive) && sst.memoryFragments.interactive.length > 0;
  const hasClimax = Array.isArray(sst.memoryFragments.climax) && sst.memoryFragments.climax.length > 0;

  if (hasAmbient || hasInteractive || hasClimax) {
    console.log('🟡 Memory fragments: PARTIAL');
    if (hasAmbient) {
      console.log(`   ✅ ambient: ${sst.memoryFragments.ambient.length} fragments`);
      results.implemented.push('memoryFragments.ambient');
    } else {
      console.log('   ❌ ambient: MISSING');
      results.missing.push('memoryFragments.ambient');
    }
    if (hasInteractive) {
      console.log(`   ✅ interactive: ${sst.memoryFragments.interactive.length} fragments`);
      results.implemented.push('memoryFragments.interactive');
    } else {
      console.log('   ❌ interactive: MISSING');
      results.missing.push('memoryFragments.interactive');
    }
    if (hasClimax) {
      console.log(`   ✅ climax: ${sst.memoryFragments.climax.length} fragments`);
      results.implemented.push('memoryFragments.climax');
    } else {
      console.log('   ❌ climax: MISSING');
      results.missing.push('memoryFragments.climax');
    }
  } else {
    console.log('❌ Memory fragments: MISSING ENTIRELY');
    results.missing.push('memoryFragments');
  }
} else {
  console.log('❌ Memory fragments: MISSING ENTIRELY');
  results.missing.push('memoryFragments');
}

// 4. Check Audio System
console.log('\n');
console.log('🔊 AUDIO SYSTEM');
divider();

if (sst.audioSystem) {
  const hasLayers = !!sst.audioSystem.layers;
  const hasStageAudio = !!sst.audioSystem.stageAudio;

  if (hasLayers && hasStageAudio) {
    console.log('✅ Audio system: COMPLETE');
    console.log('   ✅ layers defined');
    console.log('   ✅ stageAudio defined');
    results.implemented.push('audioSystem');
  } else {
    console.log('🟡 Audio system: PARTIAL');
    if (!hasLayers) console.log('   ❌ Missing: layers');
    if (!hasStageAudio) console.log('   ❌ Missing: stageAudio');
    results.partial.push('audioSystem');
  }
} else {
  console.log('❌ Audio system: MISSING');
  console.log('   Expected: layers, stageAudio');
  results.missing.push('audioSystem');
}

// SUMMARY
console.log('\n');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                    SUMMARY REPORT                          ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const total = results.implemented.length + results.missing.length + results.partial.length;
const completePercent = total === 0 ? 0 : Math.round((results.implemented.length / total) * 100);

console.log(`📊 COMPLETION: ${results.implemented.length}/${total} components (${completePercent}%)`);
console.log(`✅ Implemented: ${results.implemented.length}`);
console.log(`🟡 Partial: ${results.partial.length}`);
console.log(`❌ Missing: ${results.missing.length}`);

console.log('\n📋 PRIORITY IMPLEMENTATION ORDER:\n');

function listPriority(title, description, items, priority, timeEstimate) {
  if (!items || items.length === 0) return;
  console.log(`${priority}. ${title}`);
  console.log(`   Priority: ${description}`);
  console.log(`   Items: ${items.join(', ')}`);
  if (timeEstimate) console.log(`   Time: ${timeEstimate}`);
  console.log('');
}

const missingBeatSheets = EXPECTED_STAGES.filter((stage) => results.missing.includes(`narrative.beatSheets.${stage}`));
if (missingBeatSheets.length) {
  listPriority(
    'ADD MISSING BEAT SHEETS',
    'CRITICAL - Blocks narration flow',
    missingBeatSheets,
    '1',
    '2-3 hours'
  );
}

if (results.missing.includes('openingSequence')) {
  listPriority(
    'DEFINE OPENING SEQUENCE IN SST',
    'HIGH - Currently hardcoded in TheaterDirector',
    ['skippable', 'skipKey', 'timeline'],
    '2',
    '30 minutes'
  );
}

const missingFragments = ['ambient', 'interactive', 'climax'].filter((type) =>
  results.missing.includes(`memoryFragments.${type}`)
);
if (missingFragments.length) {
  listPriority(
    'ADD MEMORY FRAGMENTS',
    'MEDIUM - Enhances experience',
    missingFragments,
    '3',
    '3-4 hours'
  );
}

if (results.missing.includes('audioSystem')) {
  listPriority(
    'DEFINE AUDIO SYSTEM',
    'LOW - Can use placeholders',
    ['layers', 'stageAudio'],
    '4',
    '2-3 hours'
  );
}

console.log('🎯 RECOMMENDATION:');
if (missingBeatSheets.length) {
  console.log('   Start with Priority 1 (beat sheets) to complete narration flow.');
}
if (results.missing.includes('openingSequence')) {
  console.log('   Then add opening sequence to SST for consistency.');
}
if (missingFragments.length || results.missing.includes('audioSystem')) {
  console.log('   Save fragments and audio for polish phase.');
}
console.log('');

// Exit with status code
if (results.missing.length > 10) {
  console.log('⚠️  STATUS: MAJOR GAPS - Significant work needed');
  process.exit(1);
} else if (results.missing.length > 0) {
  console.log('⚠️  STATUS: INCOMPLETE - Some work needed');
  process.exit(0);
} else {
  console.log('✅ STATUS: COMPLETE - Ready for production');
  process.exit(0);
}


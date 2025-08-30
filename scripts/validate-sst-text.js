#!/usr/bin/env node
/**
 * SST v3.0 Text Formation Validator
 * Validates the text-based particle system configuration
 */

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Optional chalk for colors
let chalk;
try {
  chalk = (await import('chalk')).default;
} catch {
  chalk = new Proxy({}, { get: () => (s) => s });
}

// Load Canonical
const canonicalPath = path.resolve(__dirname, '../src/config/canonical/canonicalAuthority.js');
const CanonicalMod = await import(pathToFileURL(canonicalPath).href);
const Canonical = CanonicalMod.default || CanonicalMod.Canonical;

if (!Canonical) {
  console.error('❌ Could not load Canonical');
  process.exit(1);
}

const { stages, behaviors, dialogue, fragments, performance, tierSystem } = Canonical;

// Validation state
const errors = [];
const warnings = [];
let checksRun = 0;
let checksPassed = 0;

function check(condition, errorMsg, warningMsg = null) {
  checksRun++;
  if (!condition) {
    warningMsg ? warnings.push(warningMsg) : errors.push(errorMsg);
  } else {
    checksPassed++;
  }
}

// Text formations for each stage
const TEXT_FORMATIONS = {
  genesis: 'HELLO CURTIS',
  discipline: 'STRUCTURE',
  neural: 'AWAKENING',
  velocity: 'VELOCITY',
  architecture: 'SYSTEMS',
  harmony: 'FLOW STATE',
  transcendence: 'CONSCIOUSNESS'
};

// Stage validation with text formations
function validateStages() {
  console.log(chalk.blue('\n📋 Validating Stage Configurations...'));
  const names = Object.keys(stages);
  
  check(names.length === 7, `Expected 7 stages, found ${names.length}`);
  
  names.forEach((name, idx) => {
    const s = stages[name];
    console.log(chalk.gray(`  Checking ${name}...`));
    
    // Basic validations
    check(s.id === idx, `${name}: id mismatch`);
    
    // Tier ratios
    const tr = s.tierRatios || [];
    const sum = tr.reduce((a, b) => a + b, 0);
    check(Math.abs(sum - 1) < 0.001, `${name}: tierRatios sum ${sum.toFixed(2)}, expected 1.0`);
    
    // Particle count for text readability
    const minForText = TEXT_FORMATIONS[name].length * 100; // Min 100 particles per character
    check(
      s.particles >= minForText,
      null,
      `${name}: ${s.particles} particles may be too few for "${TEXT_FORMATIONS[name]}" (${minForText} recommended)`
    );
    
    // Text formation check
    check(
      TEXT_FORMATIONS[name],
      `${name}: missing text formation mapping`
    );
    
    // Scroll range continuity
    if (idx > 0) {
      const prev = stages[names[idx - 1]];
      check(
        Math.abs(s.scrollRange[0] - prev.scrollRange[1]) < 0.001,
        `${name}: scroll gap detected`
      );
    }
    
    // Visual elements for text
    check(Array.isArray(s.colors) && s.colors.length >= 2, `${name}: need at least 2 colors for text depth`);
  });
}

// Tier behavior validation for text rendering
function validateTextBehaviors() {
  console.log(chalk.blue('\n🎯 Validating Text Formation Behaviors...'));
  
  // Ensure tier behaviors support text formation
  const requiredBehaviors = ['drift', 'anchor', 'pulse', 'prominent'];
  
  Object.entries(behaviors.sets || {}).forEach(([tier, ids]) => {
    console.log(chalk.gray(`  Tier ${tier}...`));
    
    if (tier === '3') { // Tier 3 should be prominent for text
      const hasProminent = ids.some(id => requiredBehaviors.includes(id));
      check(hasProminent, null, `Tier 3 should have prominent behavior for text clarity`);
    }
    
    ids.forEach(id => {
      check(behaviors.definitions[id], `Tier ${tier}: unknown behavior '${id}'`);
    });
  });
}

// Memory fragment validation
function validateFragments() {
  console.log(chalk.blue('\n💎 Validating Memory Fragments...'));
  
  Object.entries(fragments || {}).forEach(([id, frag]) => {
    console.log(chalk.gray(`  Fragment ${id}...`));
    
    // Check fragment doesn't interrupt text formation
    if (frag.trigger?.type === 'scroll') {
      const stage = stages[frag.stage];
      const triggerPoint = frag.trigger.value;
      
      // Warn if fragment triggers during likely text formation (80-95% of stage)
      const stageRange = stage.scrollRange;
      const relativePoint = (triggerPoint - stageRange[0]) / (stageRange[1] - stageRange[0]);
      
      if (relativePoint > 0.8 && relativePoint < 0.95) {
        warnings.push(`${id}: triggers during text formation climax (${(relativePoint*100).toFixed(0)}% of stage)`);
      }
    }
    
    check(stages[frag.stage], `Fragment ${id}: unknown stage '${frag.stage}'`);
  });
}

// Performance validation for text rendering
function validateTextPerformance() {
  console.log(chalk.blue('\n⚡ Validating Text Rendering Performance...'));
  
  const maxTextParticles = Math.max(...Object.values(stages).map(s => s.particles));
  
  check(
    performance.maxParticles >= maxTextParticles,
    `maxParticles (${performance.maxParticles}) < needed for text (${maxTextParticles})`
  );
  
  // Text formation needs stable FPS
  check(
    performance.targetFPS >= 60,
    null,
    `Text morphing best at 60+ FPS (currently ${performance.targetFPS})`
  );
  
  // Check LOD doesn't drop too low during text
  const lodLow = performance.lodThresholds?.low;
  if (lodLow && lodLow.particleLimit < 2000) {
    warnings.push(`LOW quality may make text unreadable (${lodLow.particleLimit} particles)`);
  }
}

// Run validations
console.log(chalk.bold.cyan('\n🔍 SST v3.0 Text Formation Validator\n'));
console.log(chalk.gray('='.repeat(50)));

validateStages();
validateTextBehaviors();
validateFragments();
validateTextPerformance();

// Report
console.log(chalk.gray('\n' + '='.repeat(50)));
console.log(chalk.bold('\n📊 Validation Summary:\n'));

if (errors.length === 0) {
  console.log(chalk.green('✅ All validation checks passed!'));
  console.log(chalk.gray(`   ${checksPassed}/${checksRun} checks successful`));
} else {
  console.log(chalk.red(`❌ ${errors.length} ERROR(S):`));
  errors.forEach((e, i) => console.log(chalk.red(`   ${i + 1}. ${e}`)));
}

if (warnings.length) {
  console.log(chalk.yellow(`\n⚠️  ${warnings.length} WARNING(S):`));
  warnings.forEach((w, i) => console.log(chalk.yellow(`   ${i + 1}. ${w}`)));
}

console.log(chalk.cyan('\n📈 Text Formation Stats:'));
console.log(chalk.gray(`   Stages: ${Object.keys(stages).length}`));
console.log(chalk.gray(`   Text formations: ${Object.keys(TEXT_FORMATIONS).length}`));
console.log(chalk.gray(`   Max text length: ${Math.max(...Object.values(TEXT_FORMATIONS).map(t => t.length))} chars`));
console.log(chalk.gray(`   Total particles: ${Object.values(stages).reduce((sum, s) => sum + s.particles, 0)}`));

process.exit(errors.length ? 1 : 0);

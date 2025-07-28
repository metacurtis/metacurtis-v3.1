#!/usr/bin/env node
/**
 * SST v3.0 Validator
 * Run: node scripts/validate-sst.js
 */

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----- Optional colored output (chalk). Fallback if missing -----
let chalk;
try {
  chalk = (await import('chalk')).default;
} catch {
  chalk = new Proxy({}, { get: () => s => s }); // no-op color
}

// ----- Load Canonical -----
const canonicalPath = path.resolve(__dirname, '../src/config/canonical/canonicalAuthority.js');
const CanonicalMod = await import(pathToFileURL(canonicalPath).href);
const Canonical = CanonicalMod.default || CanonicalMod.Canonical;

if (!Canonical) {
  console.error('❌ Could not load Canonical from canonicalAuthority.js');
  process.exit(1);
}

const { stages, behaviors, dialogue, fragments, performance, features, tierSystem } = Canonical;

// --- Collect results ---
const errors = [];
const warnings = [];
let checksRun = 0;
let checksPassed = 0;

function check(condition, errorMsg, warningMsg = null) {
  checksRun++;
  if (!condition) {
    if (warningMsg) warnings.push(warningMsg);
    else errors.push(errorMsg);
  } else {
    checksPassed++;
  }
}

// ===================== VALIDATIONS ======================

// -- Stage config
function validateStages() {
  console.log(chalk.blue('\n📋 Validating Stage Configurations...'));
  const names = Object.keys(stages);

  check(names.length === 7, `Expected 7 stages, found ${names.length}`);

  names.forEach((name, idx) => {
    const s = stages[name];
    console.log(chalk.gray(`  Checking ${name}...`));

    // id / index
    check(s.id === idx, `${name}: id (${s.id}) !== index (${idx})`);

    // tier ratios sum
    const tr = s.tierRatios || [];
    const sum = tr.reduce((a, b) => a + b, 0);
    check(Math.abs(sum - 1) < 0.001, `${name}: tierRatios sum ${sum}, expected 1.0`);

    tr.forEach((r, i) => check(r >= 0 && r <= 1, `${name}: ratio[${i}] ${r} out of [0,1] range`));

    // scroll range
    check(
      s.scrollRange && s.scrollRange.length === 2 && s.scrollRange[0] < s.scrollRange[1],
      `${name}: invalid scrollRange`
    );

    if (idx > 0) {
      const prev = stages[names[idx - 1]];
      check(
        s.scrollRange[0] === prev.scrollRange[1],
        `${name}: scrollRange[0]=${s.scrollRange[0]} does not match prev.scrollRange[1]=${prev.scrollRange[1]}`
      );
    }

    // particle count
    check(
      typeof s.particles === 'number' && s.particles >= 1000 && s.particles <= 17000,
      null,
      `${name}: particles ${s.particles} outside recommended 1000-17000`
    );

    // sprites
    if (s.sprites) {
      Object.entries(s.sprites).forEach(([tierKey, arr]) => {
        arr.forEach(idx => {
          check(idx >= 0 && idx <= 15, `${name}: sprite index ${idx} invalid (0-15)`);
        });
      });
    }

    // colors
    check(Array.isArray(s.colors) && s.colors.length === 3, `${name}: need 3 colors`);
    s.colors?.forEach((c, i) => {
      check(/^#[0-9a-fA-F]{6}$/.test(c), `${name}: invalid hex color '${c}' @ index ${i}`);
    });

    // brain region
    check(!!s.brainRegion, `${name}: missing brainRegion`);

    // camera config
    check(!!(s.camera && s.camera.movement), `${name}: missing camera movement`);
  });
}

// -- Behaviors
function validateBehaviors() {
  console.log(chalk.blue('\n🎯 Validating Tier Behaviors...'));

  // ensure sets map to definitions
  Object.entries(behaviors.sets || {}).forEach(([tier, ids]) => {
    console.log(chalk.gray(`  Tier ${tier}...`));
    ids.forEach(id => {
      check(behaviors.definitions[id], `Tier ${tier}: unknown behavior '${id}'`);
    });
  });

  // optional deeper checks
  Object.entries(behaviors.definitions || {}).forEach(([id, def]) => {
    check(!!def, `Behavior ${id} undefined`);
    if (def?.shaderUniforms) {
      Object.keys(def.shaderUniforms).forEach(u => {
        check(u.startsWith('u'), `Behavior ${id}: uniform '${u}' should start with 'u'`);
      });
    }
  });
}

// -- Narrative
function validateNarrative() {
  console.log(chalk.blue('\n📖 Validating Narrative Dialogue...'));
  Object.entries(dialogue || {}).forEach(([stageName, dlg]) => {
    console.log(chalk.gray(`  ${stageName} dialogue...`));
    check(stages[stageName], `Narrative references unknown stage '${stageName}'`);

    const segs = dlg?.narration?.segments || [];
    let lastEnd = 0;

    segs.forEach((seg, i) => {
      // unique id
      const dupIndex = segs.findIndex((s, j) => j !== i && s.id === seg.id);
      check(dupIndex === -1, `${stageName}: duplicate segment id '${seg.id}'`);

      check(
        seg.timing &&
          typeof seg.timing.start === 'number' &&
          typeof seg.timing.duration === 'number',
        `${stageName}:${seg.id} missing valid timing`
      );

      if (seg.timing.start < lastEnd) {
        warnings.push(`${stageName}:${seg.id} overlaps previous segment`);
      }
      lastEnd = seg.timing.start + seg.timing.duration;

      if (seg.particleCue?.tiers && Array.isArray(seg.particleCue.tiers)) {
        seg.particleCue.tiers.forEach(t => {
          check(t >= 0 && t <= 3, `${stageName}:${seg.id} invalid cue tier ${t}`);
        });
      }
    });
  });
}

// -- Fragments
function validateFragments() {
  console.log(chalk.blue('\n💎 Validating Memory Fragments...'));
  const ids = new Set();
  Object.entries(fragments || {}).forEach(([id, frag]) => {
    console.log(chalk.gray(`  Fragment ${id}...`));
    check(frag.id && !ids.has(frag.id), `Duplicate fragment id '${frag.id}'`);
    ids.add(frag.id);

    check(stages[frag.stage], `Fragment ${id}: unknown stage '${frag.stage}'`);

    check(frag.trigger?.type, `Fragment ${id}: missing trigger type`);

    // scroll trigger sanity
    if (frag.trigger?.type === 'scroll') {
      const s = stages[frag.stage];
      if (s) {
        const val = frag.trigger.value;
        const inRange = val >= s.scrollRange[0] && val <= s.scrollRange[1];
        check(
          inRange,
          null,
          `Fragment ${id}: scroll trigger ${val}% outside stage range [${s.scrollRange}]`
        );
      }
    }

    // narrative trigger sanity
    if (frag.trigger?.type === 'narrative') {
      const dlg = dialogue[frag.stage];
      const segExists = dlg?.narration?.segments?.some(seg => seg.id === frag.trigger.segmentId);
      check(segExists, `Fragment ${id}: narrative segment '${frag.trigger.segmentId}' not found`);
    }

    // tier checks inside effects
    ['onTrigger', 'whileActive', 'onDismiss'].forEach(k => {
      const eff = frag.particleEffect?.[k];
      if (eff && Array.isArray(eff.targetTiers)) {
        eff.targetTiers.forEach(t => {
          check(t >= -1 && t <= 3, `Fragment ${id}:${k} invalid tier ${t}`);
        });
      }
    });
  });
}

// -- Performance
function validatePerformance() {
  console.log(chalk.blue('\n⚡ Validating Performance...'));
  const perf = performance || {};

  check(perf.targetFPS >= 30, `targetFPS (${perf.targetFPS}) too low`);
  check(perf.minFPS < perf.targetFPS, `minFPS (${perf.minFPS}) must be < targetFPS`);
  check(
    perf.maxParticles >= 15000,
    `maxParticles (${perf.maxParticles}) < 15000 (transcendence needs it)`
  );

  const neededLods = ['ultra', 'high', 'medium', 'low'];
  neededLods.forEach(l => {
    check(perf.lodThresholds && l in perf.lodThresholds, `Missing LOD threshold '${l}'`);
  });
}

// ===================== RUN ======================
console.log(chalk.bold.cyan('\n🔍 SST v3.0 Configuration Validator\n'));
console.log(chalk.gray(`Version: ${Canonical.version || '3.0.x'}`));
console.log(chalk.gray(`Date: ${new Date().toLocaleDateString()}`));
console.log(chalk.gray('='.repeat(50)));

validateStages();
validateBehaviors();
validateNarrative();
validateFragments();
validatePerformance();

// ===================== REPORT =====================
console.log(chalk.gray('\n' + '='.repeat(50)));
console.log(chalk.bold('\n📊 Validation Summary:\n'));

if (errors.length === 0 && warnings.length === 0) {
  console.log(chalk.green('✅ All validation checks passed!'));
  console.log(chalk.gray(`   ${checksPassed}/${checksRun} checks successful`));
} else {
  if (errors.length) {
    console.log(chalk.red(`\n❌ ${errors.length} ERROR(S):`));
    errors.forEach((e, i) => console.log(chalk.red(`   ${i + 1}. ${e}`)));
  }
  if (warnings.length) {
    console.log(chalk.yellow(`\n⚠️  ${warnings.length} WARNING(S):`));
    warnings.forEach((w, i) => console.log(chalk.yellow(`   ${i + 1}. ${w}`)));
  }
}

console.log(chalk.cyan('\n📈 Stats:'));
console.log(chalk.gray(`   Stages          : ${Object.keys(stages).length}`));
console.log(chalk.gray(`   Behaviors       : ${Object.keys(behaviors.definitions || {}).length}`));
console.log(
  chalk.gray(
    `   Narrative segs  : ${Object.values(dialogue || {}).reduce(
      (acc, d) => acc + (d?.narration?.segments?.length || 0),
      0
    )}`
  )
);
console.log(chalk.gray(`   Memory fragments: ${Object.keys(fragments || {}).length}`));
console.log(chalk.gray(`   Max particles   : ${stages?.transcendence?.particles ?? 'N/A'}`));

if (errors.length) {
  console.log(chalk.red('\n❌ Validation failed. Fix errors and re-run.'));
  process.exit(1);
} else {
  console.log(chalk.green('\n✅ SST v3.0 canonical config is valid.'));
  process.exit(0);
}

#!/usr/bin/env node
/* eslint-env node */
/**
 * SST Canonical Validator — v3.3 aware (BeatGlyph) / v3.0 compatible
 * Scope: data validation only (stages/ranges/mixes/palettes/optionals).
 * Architecture invariants are enforced separately by tools/sst-guard.mjs.
 */

import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ---- Optional color (no hard dep) ----
let chalk;
try { chalk = (await import('chalk')).default; }
catch { chalk = new Proxy({}, { get: () => (s) => s }); }

// ---- Load Canonical (ESM) ----
const canonicalPath = path.resolve(__dirname, '../src/config/canonical/canonicalAuthority.js');
const CanonicalMod  = await import(pathToFileURL(canonicalPath).href).catch((e) => {
  console.error('❌ Could not import Canonical:', e?.message || e);
  process.exit(1);
});
const Canonical = CanonicalMod?.default || CanonicalMod?.Canonical;
if (!Canonical) { console.error('❌ Canonical export not found'); process.exit(1); }

// ---- Surfaces (optional sections tolerated) ----
const stagesObj   = Canonical.stages || {};
const stageOrder  = Canonical.stageOrder || Object.keys(stagesObj);
const breakpoints = Canonical.scrollAndMorph?.stageBreakpointsPercent || null;
let   behaviors   = Canonical.behaviors || null;  // often absent in v3.3
const dialogue    = Canonical.dialogue  || {};    // legacy (optional)
const fragments   = Canonical.fragments || {};    // legacy (optional)
const perf        = Canonical.performance || {};
const quality     = Canonical.quality     || {};
const version     = String(Canonical.version ?? '');
const mode        = Canonical.meta?.mode;

const isTextFirst = (mode === 'TEXT_FIRST_REVEAL') || (parseFloat(version) >= 3.3);

// ---- Helpers (v3.0 ↔ v3.3 mapping) ----
const E = 1e-3;
const rangeTol = 0.51; // ~0.5% wiggle for authoring

const getRange = (s) => {
  const r = s?.scrollRange ?? s?.scrollRangePercent;  // old/new
  return (Array.isArray(r) && r.length >= 2) ? [Number(r[0]), Number(r[1])] : null;
};
const getTier = (s) => s?.tierRatios ?? s?.tierMix ?? null;
const getParticles = (s) => s?.particles ?? s?.particlesBase ?? s?.particleCount ?? null;
const getColors    = (s) => s?.colors ?? s?.palette ?? null;
const hasSprites   = (s) => s?.sprites && typeof s.sprites === 'object';

// ---- Result buckets ----
const errors   = [];
const warnings = [];
let checksRun = 0, checksPassed = 0;

const check = (ok, errMsg, warnMsg=null) => {
  checksRun++;
  if (!ok) { warnMsg ? warnings.push(warnMsg) : errors.push(errMsg); }
  else checksPassed++;
};

// ================== VALIDATORS ==================
function validateStages() {
  console.log(chalk.blue('\n📋 Validating Stage Configurations...'));
  const names = stageOrder.length ? stageOrder : Object.keys(stagesObj);
  check(names.length === 7, `Expected 7 stages, found ${names.length}`);

  let prevRange = null;
  names.forEach((name, idx) => {
    const s = stagesObj[name] || {};
    console.log(chalk.gray(`  Checking ${name}...`));

    // id/index only if present
    if (typeof s.id !== 'undefined') {
      check(s.id === idx, `${name}: id (${s.id}) !== index (${idx})`);
    }

    // tier mix sum to 1
    const mix = getTier(s);
    if (Array.isArray(mix)) {
      const sum = mix.reduce((a, b) => a + Number(b || 0), 0);
      check(Math.abs(sum - 1) < 0.001, `${name}: tier mix sums to ${sum.toFixed(4)} (must be 1.0)`);
      mix.forEach((r, i) => check(r >= 0 && r <= 1, `${name}: tier[${i}] ${r} out of [0,1]`));
    } else {
      warnings.push(`${name}: missing tierMix/tierRatios`);
    }

    // scroll range
    const range = getRange(s);
    check(!!range && range[0] < range[1], `${name}: invalid scroll range (need [start,end] %)`);
    if (range) {
      if (idx === 0 && Math.abs(range[0] - 0) > rangeTol)
        warnings.push(`${name}: first stage does not start at 0`);
      if (idx === names.length - 1 && Math.abs(range[1] - 100) > rangeTol)
        warnings.push(`${name}: last stage does not end at 100`);
      if (prevRange) {
        check(Math.abs(range[0] - prevRange[1]) < rangeTol,
          `${name}: range start ${range[0]}% does not continue from previous end ${prevRange[1]}%`);
      }
      prevRange = range;
    }

    // particle budgets (informational)
    const p = getParticles(s);
    const maxP = quality.maxParticles ?? perf.maxParticles ?? 15000;
    if (Number.isFinite(p)) {
      check(p >= 500 && p <= Math.max(17000, maxP), null,
        `${name}: particles ${p} outside recommended 500–${Math.max(17000, maxP)}`);
    } else {
      warnings.push(`${name}: missing particle count (particles/particlesBase/particleCount)`);
    }

    // colors/palette
    const cols = getColors(s);
    check(Array.isArray(cols) && cols.length === 3, `${name}: need exactly 3 colors (palette/colors)`);
    (cols || []).forEach((hex, i) => {
      check(/^#[0-9a-fA-F]{6}$/.test(hex), `${name}: invalid hex color '${hex}' @ index ${i}`);
    });

    // sprites (validate only if present)
    if (hasSprites(s)) {
      Object.entries(s.sprites).forEach(([tierKey, arr]) => {
        (arr || []).forEach((idx2) => {
          check(idx2 >= 0 && idx2 <= 15, `${name}: sprite index ${idx2} invalid (0..15)`);
        });
      });
    }

    // brainRegion: warn if missing (deprecated in Text-First)
    if (!s.brainRegion) {
      isTextFirst
        ? warnings.push(`${name}: brainRegion not provided (ok in TEXT_FIRST)`)
        : errors.push(`${name}: missing brainRegion`);
    }

    // camera movement still required
    check(!!(s.camera && s.camera.movement), `${name}: missing camera movement`);
  });
}

function validateBreakpoints() {
  if (!breakpoints || breakpoints.length < 2) {
    console.log(chalk.gray('\n⏱  Skipping Breakpoints (none provided)'));
    return;
  }
  console.log(chalk.blue('\n⏱  Validating Breakpoints vs Ranges...'));
  const bps = breakpoints.slice().sort((a, z) => a - z);

  if (bps[0] > 0 + E || bps[bps.length - 1] < 100 - E) {
    warnings.push(`breakpoints do not span [0,100]: [${bps.join(', ')}]`);
  }

  stageOrder.forEach((name, i) => {
    const r = getRange(stagesObj[name]);
    if (!r) return;
    if (i < bps.length - 1) {
      const expected = [bps[i], bps[i + 1]];
      const offS = Math.abs(r[0] - expected[0]);
      const offE = Math.abs(r[1] - expected[1]);
      if (offS > rangeTol || offE > rangeTol) {
        warnings.push(`${name}: range ${r[0]}–${r[1]} deviates from breakpoints ${expected[0]}–${expected[1]}`);
      }
    }
  });
}

async function validateBehaviors() {
  console.log(chalk.blue('\n🎯 Validating Text Formation Behaviors...'));

  // Canonical v3.3 often omits behaviors. Try legacy fallback, else skip.
  let localBehaviors = behaviors;
  if (!localBehaviors || (!localBehaviors.sets && !localBehaviors.definitions)) {
    try {
      const legacy = await import(
        pathToFileURL(path.resolve(__dirname, '../src/config/sst3/tier-behaviors.js')).href
      );
      localBehaviors = legacy?.TIER_BEHAVIORS || null;
      if (localBehaviors) console.log(chalk.gray('  (Using legacy sst3/tier-behaviors for validation)'));
    } catch {
      console.log(chalk.gray('  (Skipped — no behaviors available in Canonical/legacy)'));
      return;
    }
  }

  const defs = localBehaviors.definitions || {};
  const sets = localBehaviors.sets || {};

  Object.entries(sets).forEach(([tier, ids]) => {
    console.log(chalk.gray(`  Tier ${tier}...`));
    (ids || []).forEach((id) => {
      check(!!defs[id], `Unknown behavior '${id}' in tier ${tier}`);
    });
  });

  Object.entries(defs).forEach(([id, def]) => {
    check(!!def, `Behavior '${id}' undefined`);
    if (def?.shaderUniforms) {
      Object.keys(def.shaderUniforms).forEach((u) => {
        check(u.startsWith('u'), `Behavior '${id}': uniform '${u}' should start with 'u'`);
      });
    }
  });
}

function validateFragments() {
  const legacyCount = Object.keys(fragments || {}).length;
  const v33StageFrags = stageOrder
    .map((n) => ({ name: n, frag: stagesObj[n]?.memoryFragment }))
    .filter(({ frag }) => !!frag);

  if (legacyCount === 0 && v33StageFrags.length === 0) {
    console.log(chalk.gray('\n💎 Skipping Memory Fragments (none provided)'));
    return;
  }

  console.log(chalk.blue('\n💎 Validating Memory Fragments...'));

  // Legacy map
  if (legacyCount > 0) {
    const ids = new Set();
    Object.entries(fragments).forEach(([id, frag]) => {
      console.log(chalk.gray(`  Fragment ${id}...`));
      check(frag.id && !ids.has(frag.id), `Duplicate fragment id '${frag.id}'`);
      ids.add(frag.id);
      check(!!stagesObj[frag.stage], `Fragment ${id}: unknown stage '${frag.stage}'`);
      check(!!frag.trigger?.type, `Fragment ${id}: missing trigger type`);
      if (frag.trigger?.type === 'scroll') {
        const r = getRange(stagesObj[frag.stage]);
        if (r) {
          const v = frag.trigger.value;
          check(v >= r[0] && v <= r[1], null,
            `Fragment ${id}: scroll trigger ${v}% outside stage range [${r}]`);
        }
      }
      if (frag.trigger?.type === 'narrative') {
        const dlg = dialogue[frag.stage];
        const exists = dlg?.narration?.segments?.some((seg) => seg.id === frag.trigger.segmentId);
        check(exists, `Fragment ${id}: narrative segment '${frag.trigger.segmentId}' not found`);
      }
    });
  }

  // v3.3 per-stage
  v33StageFrags.forEach(({ name, frag }) => {
    console.log(chalk.gray(`  Stage ${name} fragment...`));
    if (typeof frag.triggerPercent !== 'number') {
      warnings.push(`${name}: memoryFragment missing triggerPercent`);
      return;
    }
    const r = getRange(stagesObj[name]) || [0, 100];
    const v = frag.triggerPercent;
    if (v < r[0] - E || v > r[1] + E) {
      warnings.push(`${name}: fragment trigger ${v}% outside stage range ${r[0]}–${r[1]}%`);
    }
  });
}

function validatePerformance() {
  console.log(chalk.blue('\n⚡ Validating Performance...'));
  const targetFPS = perf.frameRate?.targetFps ?? perf.targetFPS ?? 60;
  const minFPS    = perf.frameRate?.minimum   ?? perf.minFPS   ?? 55;
  const maxParts  = quality.maxParticles ?? perf.maxParticles ?? 15000;

  check(targetFPS >= 30, `targetFPS (${targetFPS}) too low`);
  check(minFPS < targetFPS, `minFPS (${minFPS}) must be < targetFPS`);
  check(maxParts >= 15000, `maxParticles (${maxParts}) < 15000 (transcendence needs it)`);

  const lod = perf.lodThresholds;
  ['ultra', 'high', 'medium', 'low'].forEach((l) => {
    if (!lod || !(l in lod)) warnings.push(`Missing LOD threshold '${l}'`);
  });

  if (breakpoints && breakpoints.length >= 2) {
    const bps = breakpoints.slice().sort((a, z) => a - z);
    if (bps[0] > 0 + E || bps[bps.length - 1] < 100 - E) {
      warnings.push(`breakpoints do not span [0,100]: [${bps.join(', ')}]`);
    }
  }
}

// ================== RUN ==================
console.log(chalk.bold.cyan('\n🔍 SST Canonical Validator (v3.0 compat / v3.3 aware)\n'));
console.log(chalk.gray(`Version: ${version || 'unknown'}  Mode: ${mode || (isTextFirst ? 'TEXT_FIRST_REVEAL' : 'legacy')}`));
console.log(chalk.gray(`Date: ${new Date().toLocaleDateString()}`));
console.log(chalk.gray('='.repeat(50)));

validateStages();
validateBreakpoints();
await validateBehaviors();
validateFragments();
validatePerformance();

// ================== REPORT ==================
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

// Minimal stats
const behaviorsCount = behaviors?.definitions ? Object.keys(behaviors.definitions).length : 0;
const narrativeSegs  = Object.values(dialogue || {}).reduce((acc, d) => acc + (d?.narration?.segments?.length || 0), 0);

console.log(chalk.cyan('\n📈 Stats:'));
console.log(chalk.gray(`   Stages          : ${stageOrder.length}`));
console.log(chalk.gray(`   Behaviors       : ${behaviorsCount} ${behaviors ? '' : '(skipped or legacy)'}`));
console.log(chalk.gray(`   Narrative segs  : ${narrativeSegs} ${Object.keys(dialogue || {}).length ? '' : '(skipped)'}`));
const trans = stagesObj.transcendence || {};
console.log(chalk.gray(`   Max particles   : ${getParticles(trans) ?? (quality.maxParticles || 'N/A')}`));

if (errors.length) {
  console.log(chalk.red('\n❌ Validation failed. Fix errors and re-run.'));
  process.exit(1);
} else {
  console.log(chalk.green('\n✅ Canonical config is valid.'));
  process.exit(0);
}

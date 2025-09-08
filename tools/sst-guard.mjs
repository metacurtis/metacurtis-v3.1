#!/usr/bin/env node
/* eslint-env node */
// Master Sentinel: --opening (architecture) and --vision (feel)
// Safe, dependency-free, Node 22+ (ESM)

import fs from 'node:fs';
import path from 'node:path';

const args = new Set(process.argv.slice(2));
const checkOpening = args.has('--opening') || !args.size;
const checkVision  = args.has('--vision')  || !args.size;

function readSafe(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }

function latestTelemetry() {
  const dir = '.vision/telemetry';
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    if (!files.length) return null;
    return files
      .map(f => path.join(dir, f))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
  } catch { return null; }
}

let fails = 0;

/* --------------------------- Opening fencepost --------------------------- */
if (checkOpening) {
  const opening  = readSafe('src/components/theater/OpeningSequence.jsx');
  const engine   = readSafe('src/engine/ConsciousnessEngine.js');
  const renderer = readSafe('src/components/webgl/WebGLBackground.jsx');
  const theater  = readSafe('src/components/consciousness/ConsciousnessTheater.jsx');

  const rows = [];
  const row = (ok, label) => { rows.push((ok ? 'OK ' : 'X  ') + label); if (!ok) fails++; };

  // OpeningSequence: overlay-only + single bus + no CTF
  row(/import\s+BeatBus\s+from\s+['"]@\/theater\/bus['"]/.test(opening), 'OpeningSequence uses single bus');
  row(!/CTF_BUILD/.test(opening), 'OpeningSequence has no CTF');
  row(!/(BufferGeometry|useFrame|THREE\.)/.test(opening), 'OpeningSequence overlay-only');

  // Engine: opening gate + mode:'emergence' + no spiral math
  row(
    /buildAndEmitBlueprint[^]*?if\s*\(\s*this\._openingPhase\s*&&\s*stage\s*!==\s*['"]genesis['"]\s*\)/.test(engine),
    'Engine gate at top of buildAndEmitBlueprint'
  );
  row(
    /BLUEPRINT_READY[^]*mode\s*:\s*['"]emergence['"]/.test(engine),
    'Engine emergence emits mode:"emergence"'
  );
  const spiral =
    /(swirl|spiral)/.test(engine) ||
    (/ang\s*=\s*(?:i|t)[^;]*\*/.test(engine) && /\br\s*=\s*(?:i|t)\s*\*/.test(engine));
  row(!spiral, 'Engine emergence random->random (no spiral)');

  // Renderer: emit-once fencepost present (heuristic)
  row(/BeatBus\.emit\(\s*EVENTS\.PARTICLES_EMERGED/.test(renderer), 'Renderer emits PARTICLES_EMERGED fencepost once');

  // Theater: start after viewport hint present
  row(/ENGINE_VIEWPORT_HINT/.test(theater), 'Theater start-after-viewport gate present');

  console.log('\nOpening checks:');
  rows.forEach(l => console.log(l));
  console.log('\nOpening sentinel:', rows.some(l => l.startsWith('X')) ? 'FAIL' : 'OK');
}

/* ------------------------------ Vision check ---------------------------- */
if (checkVision) {
  const vcPath = 'vision/vision-contract.v1.json';
  if (!fs.existsSync(vcPath)) {
    console.log('\nVision: contract not found (vision/vision-contract.v1.json)');
  } else {
    const vc = JSON.parse(fs.readFileSync(vcPath, 'utf8'));
    const telPath = latestTelemetry();

    if (!telPath) {
      console.log('\nVision: no telemetry in .vision/telemetry — run: npm run agent:run -- --goal=opening:record');
    } else {
      const t = JSON.parse(fs.readFileSync(telPath, 'utf8'));
      console.log('\nVision checks (' + path.basename(telPath) + ')');

      const inR = (v, [lo, hi]) => typeof v === 'number' && v >= lo && v <= hi;
      const ok  = (m) => console.log('OK ', m);
      const bad = (m) => { console.log('X  ', m); fails++; };

      // No initial flash
      (t.fillLinesAtStart ?? 0) === 0 ? ok('No initial fill flash') : bad('Initial fill flashed');

      // Min fill visibility
      const minFill = vc.opening.timeline.minFillVisibleMs;
      if (typeof t.tFillStart === 'number' && typeof t.tFadeOutStart === 'number') {
        const vis = t.tFadeOutStart - t.tFillStart;
        vis >= minFill ? ok('Fill visible ≥ min') : bad(`Fill visible ${vis}ms < ${minFill}ms`);
      } else {
        console.log('▲ Missing tFillStart/tFadeOutStart in telemetry');
      }

      // Optional ranges (durations / spin / cloud)
      const D = vc.opening.timeline;
      const S = vc.opening.chaosSpin;
      const C = vc.opening.emergenceCloud;

      if (t.chaosMs    != null) inR(t.chaosMs,    D.chaosMs)    ? ok('CHAOS in range')       : bad('CHAOS out of range');
      if (t.coalesceMs != null) inR(t.coalesceMs, D.coalesceMs) ? ok('COALESCE in range')    : bad('COALESCE out of range');
      if (t.settleMs   != null) inR(t.settleMs,   D.settleMs)   ? ok('SETTLE in range')      : bad('SETTLE out of range');
      if (t.spin?.zPerSec != null) inR(t.spin.zPerSec, S.zPerSec) ? ok('Spin Z in range')    : bad('Spin Z out of range');
      if (t.spin?.yPerSec != null) inR(t.spin.yPerSec, S.yPerSec) ? ok('Spin Y in range')    : bad('Spin Y out of range');
      if (t.cloud?.gasRadiusFactor      != null) inR(t.cloud.gasRadiusFactor,      C.gasRadiusFactor)      ? ok('gasRadiusFactor in range')      : bad('gasRadiusFactor out of range');
      if (t.cloud?.expandedRadiusFactor != null) inR(t.cloud.expandedRadiusFactor, C.expandedRadiusFactor) ? ok('expandedRadiusFactor in range') : bad('expandedRadiusFactor out of range');
      if (t.cloud?.zRange               != null) inR(t.cloud.zRange,               C.zRange)               ? ok('zRange in range')               : bad('zRange out of range');

      console.log('\nVision sentinel:', fails ? 'FAIL' : 'OK');
    }
  }
}

process.exit(fails ? 1 : 0);

#!/usr/bin/env node
/* eslint-env node */
// Master Sentinel: --opening (architecture) and --vision (feel)
// Safe, dependency-free, Node 22+ (ESM)

import fs from 'node:fs';
import path from 'node:path';
import { runOpeningChecks } from './sentinel/openingChecks.mjs';

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
  const opening   = readSafe('src/components/theater/OpeningSequence.jsx');
  const engine    = readSafe('src/engine/ConsciousnessEngine.js');
  const renderer  = readSafe('src/components/webgl/WebGLBackground.jsx');
  const theater   = readSafe('src/components/consciousness/ConsciousnessTheater.jsx');
  const director  = readSafe('src/theater/TheaterDirector.js');
  const blueprint = readSafe('src/engine/utils/blueprintUtils.js');
  const engineEmitSource = `${engine}\n${blueprint}`;
  const traceData = loadOpeningTrace();
  const openingChaosFlag = readOpeningChaosFlag();
  const openingResult = runOpeningChecks({
    opening,
    engine: engineEmitSource,
    renderer,
    theater,
    director,
    trace: traceData,
    flags: { opening_chaos: openingChaosFlag }
  });
  const hardFailures = openingResult.rows.filter((row) => !row.ok && row.severity !== 'advisory');
  fails += hardFailures.length;

  console.log('\nOpening checks:');
  openingResult.rows.forEach((row) => {
    const prefix = row.ok ? 'OK ' : (row.severity === 'advisory' ? '!  ' : 'X  ');
    const note = row.note ? ` — ${row.note}` : '';
    console.log(prefix + row.label + note);
  });
  console.log('\nOpening sentinel:', hardFailures.length ? 'FAIL' : 'OK');
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

function loadOpeningTrace() {
  const candidates = [
    'reports/trace-bus.json',
    'reports/trace-bus.ndjson',
    'reports/trace-bus.jsonl',
    'reports/opening-trace.json',
    'reports/opening-trace.ndjson',
    '.canon_reports/trace-bus.json',
    '.canon_reports/trace-bus.ndjson',
    '.logs/trace-bus.json',
    'logs/trace-bus.json',
  ];

  for (const file of candidates) {
    const data = readSafe(file);
    if (data && data.trim()) return data;
  }
  return '';
}

function readOpeningChaosFlag() {
  const envCandidates = [
    process.env.OPENING_CHAOS,
    process.env.SST_OPENING_CHAOS,
    process.env.SST_OPENING_MODE,
  ];
  for (const value of envCandidates) {
    if (value == null) continue;
    if (value === 'opening_chaos') return true;
    if (value === 'emergence') return false;
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
  }

  const fileCandidates = [
    'reports/opening-mode.json',
    '.canon_reports/opening-mode.json',
    'reports/sentinel-opening-mode.json',
    '.system/opening-mode.json',
  ];
  for (const file of fileCandidates) {
    try {
      const txt = fs.readFileSync(file, 'utf8').trim();
      if (!txt) continue;
      const json = JSON.parse(txt);
      if (typeof json.opening_chaos !== 'undefined') return !!json.opening_chaos;
      if (typeof json.openingChaos !== 'undefined') return !!json.openingChaos;
      if (typeof json.mode === 'string') return json.mode === 'opening_chaos';
    } catch { /* ignore */ }
  }

  return false;
}

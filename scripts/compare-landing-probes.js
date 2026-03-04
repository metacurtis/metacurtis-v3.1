/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';

const PROBE_DIR = path.join(process.cwd(), 'reports', 'velocity-stage-probes');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function listProbeFiles() {
  if (!fs.existsSync(PROBE_DIR)) return [];
  return fs
    .readdirSync(PROBE_DIR)
    .filter((f) => f.endsWith('.json') && f.startsWith('landing-velocity-probe-'))
    .map((f) => path.join(PROBE_DIR, f))
    .sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
}

function latestTwo(files) {
  if (files.length < 2) return files;
  return files.slice(-2);
}

function summarizeSample(sample) {
  const u = sample?.state?.summary?.uniforms || {};
  const c = sample?.state?.summary?.camera || {};
  return {
    offsetMs: sample?.offsetMs ?? null,
    drawCount: sample?.state?.summary?.drawCount ?? null,
    morph: u.uMorphProgress ?? null,
    point: u.uPointSize ?? null,
    sigma: u.uGaussianSigma ?? null,
    depth: u.uDepthFalloffPower ?? null,
    flow: u.uFlowTurbulence ?? null,
    streak: u.uStreakIntensity ?? null,
    spread: u.uSpreadFactor ?? null,
    opacityMin: u.uOpacityMin ?? null,
    opacityMax: u.uOpacityMax ?? null,
    camera: c,
  };
}

function diffValue(a, b) {
  if (a === b) return null;
  return { from: a, to: b };
}

function compareSamples(a, b) {
  const fields = [
    'drawCount',
    'morph',
    'point',
    'sigma',
    'depth',
    'flow',
    'streak',
    'spread',
    'opacityMin',
    'opacityMax',
  ];

  const diff = {};
  for (const key of fields) {
    const d = diffValue(a[key], b[key]);
    if (d) diff[key] = d;
  }

  const cameraFrom = JSON.stringify(a.camera ?? null);
  const cameraTo = JSON.stringify(b.camera ?? null);
  if (cameraFrom !== cameraTo) {
    diff.camera = { from: a.camera ?? null, to: b.camera ?? null };
  }

  return diff;
}

function main() {
  const files = listProbeFiles();
  if (files.length < 2) {
    console.error('[compare] Need at least 2 probe files.');
    process.exit(1);
  }

  const [prevPath, nextPath] = latestTwo(files);
  const prev = readJson(prevPath);
  const next = readJson(nextPath);

  const prevSamples = new Map((prev.samples || []).map((s) => [s.offsetMs, summarizeSample(s)]));
  const nextSamples = new Map((next.samples || []).map((s) => [s.offsetMs, summarizeSample(s)]));

  const offsets = [...new Set([...prevSamples.keys(), ...nextSamples.keys()])].sort((a, b) => a - b);

  const report = {
    previous: prevPath,
    current: nextPath,
    generatedAt: new Date().toISOString(),
    schemaViolationCounts: {
      previous: prev.schemaViolationCount ?? null,
      current: next.schemaViolationCount ?? null,
    },
    singleWriterViolationCounts: {
      previous: prev.singleWriterViolationCount ?? null,
      current: next.singleWriterViolationCount ?? null,
    },
    checkpoints: [],
  };

  console.log('## Probe Comparison');
  console.log(`previous: ${prevPath}`);
  console.log(`current:  ${nextPath}`);

  for (const offset of offsets) {
    const a = prevSamples.get(offset) || { offsetMs: offset };
    const b = nextSamples.get(offset) || { offsetMs: offset };
    const diff = compareSamples(a, b);

    report.checkpoints.push({
      offsetMs: offset,
      previous: a,
      current: b,
      diff,
    });

    console.log(`\n### ${offset}ms`);
    if (Object.keys(diff).length === 0) {
      console.log('No runtime changes.');
    } else {
      console.log(JSON.stringify(diff, null, 2));
    }
  }

  const outPath = path.join(
    PROBE_DIR,
    `compare-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  );
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\n[compare] Saved: ${outPath}`);
}

main();

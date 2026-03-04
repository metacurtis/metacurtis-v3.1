/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';

const PROBE_DIR = path.join(process.cwd(), 'reports', 'velocity-stage-probes');
const SCREEN_DIR = path.join(process.cwd(), 'reports', 'velocity-stage-screens');
const SCENARIO_DIR = path.join(process.cwd(), 'reports', 'landing-diagnostic-scenarios');

const REQUIRED_CHECKPOINTS = [5400, 7800, 9800, 12200];

function latestFile(dir, filterFn = () => true) {
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter(filterFn)
    .map((name) => path.join(dir, name))
    .sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
  return files.at(-1) || null;
}

function latestRunDir() {
  if (!fs.existsSync(SCREEN_DIR)) return null;
  const dirs = fs
    .readdirSync(SCREEN_DIR)
    .filter((name) => name.startsWith('run-'))
    .map((name) => path.join(SCREEN_DIR, name))
    .sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
  return dirs.at(-1) || null;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fail(reason, details = {}) {
  console.error('FAIL');
  console.error(JSON.stringify({ reason, ...details }, null, 2));
  process.exit(1);
}

function requireCheckpointSet(label, offsets) {
  const missing = REQUIRED_CHECKPOINTS.filter((ms) => !offsets.includes(ms));
  if (missing.length > 0) {
    fail(`${label} missing required checkpoints`, { missing });
  }
}

function scoreOk(cp = {}) {
  return {
    wordRecognition: Number(cp.WordRecognition),
    foregroundDominance: Number(cp.ForegroundDominance),
    uiAnchorSuitability: Number(cp.UIAnchorSuitability),
    transitionStability: Number(cp.TransitionStability)
  };
}

function main() {
  const probePath = latestFile(PROBE_DIR, (name) => name.endsWith('.json') && !name.startsWith('compare-'));
  const runDir = latestRunDir();
  const manifestPath = runDir ? path.join(runDir, 'manifest.json') : null;
  const contactSheetPath = runDir ? path.join(runDir, 'contact-sheet.html') : null;

  if (!probePath) fail('missing latest probe');
  if (!manifestPath || !fs.existsSync(manifestPath)) fail('missing latest manifest');
  if (!contactSheetPath || !fs.existsSync(contactSheetPath)) fail('missing latest contact sheet');

  const scenarioPath = latestFile(SCENARIO_DIR, (name) => name.endsWith('.json') && !name.startsWith('summary-'));
  if (!scenarioPath) fail('missing latest scenario result / verifier result');

  const probe = readJson(probePath);
  const manifest = readJson(manifestPath);
  const scenario = readJson(scenarioPath);

  if ((probe.schemaViolationCount ?? 0) !== 0) {
    fail('schema violations present', { schemaViolationCount: probe.schemaViolationCount, probePath });
  }

  if ((probe.singleWriterViolationCount ?? 0) !== 0) {
    fail('single-writer violations present', {
      singleWriterViolationCount: probe.singleWriterViolationCount,
      probePath
    });
  }

  const probeOffsets = (probe.samples || []).map((s) => s.offsetMs);
  const manifestOffsets = (manifest.checkpoints || []).map((cp) => cp.offsetMs);
  const scoreOffsets = Object.keys(scenario.scores || {}).map((k) => Number(k)).filter(Number.isFinite);

  requireCheckpointSet('probe', probeOffsets);
  requireCheckpointSet('manifest', manifestOffsets);
  requireCheckpointSet('scenario scores', scoreOffsets);

  const scores7800 = scoreOk(scenario.scores?.['7800'] || {});
  const scores9800 = scoreOk(scenario.scores?.['9800'] || {});

  if (scores7800.wordRecognition < 4) fail('7800 lock Word Recognition below threshold', scores7800);
  if (scores7800.foregroundDominance < 4) fail('7800 lock Foreground Dominance below threshold', scores7800);
  if (scores7800.uiAnchorSuitability < 4) fail('7800 lock UI Anchor Suitability below threshold', scores7800);

  if (scores9800.wordRecognition < 4) fail('9800 drift Word Recognition below threshold', scores9800);
  if (scores9800.transitionStability < 4) fail('9800 drift Transition Stability below threshold', scores9800);

  for (const key of scoreOffsets) {
    const cp = scenario.scores?.[String(key)] || {};
    const wordRecognition = Number(cp.WordRecognition);
    if (Number.isFinite(wordRecognition) && wordRecognition < 3) {
      fail('general Word Recognition threshold failed', { checkpoint: key, wordRecognition });
    }
  }

  console.log('PASS');
  console.log(
    JSON.stringify(
      {
        probePath,
        manifestPath,
        contactSheetPath,
        scenarioPath,
        schemaViolationCount: probe.schemaViolationCount ?? null,
        singleWriterViolationCount: probe.singleWriterViolationCount ?? null
      },
      null,
      2
    )
  );
}

main();

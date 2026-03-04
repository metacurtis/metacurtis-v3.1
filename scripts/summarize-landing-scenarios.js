/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';

const CONFIG_PATH = path.join(process.cwd(), 'configs', 'landing-diagnostic-scenarios.json');
const RESULT_DIR = path.join(process.cwd(), 'reports', 'landing-diagnostic-scenarios');

const SCORE_FIELDS = [
  'WordRecognition',
  'CounterClarity',
  'EdgeClarity',
  'ForegroundDominance',
  'TransitionStability',
  'UIAnchorSuitability'
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.error(`[diagnose] Missing ${label}: ${filePath}`);
    process.exit(1);
  }
}

function listResultFiles() {
  if (!fs.existsSync(RESULT_DIR)) return [];
  return fs
    .readdirSync(RESULT_DIR)
    .filter((name) => name.endsWith('.json'))
    .map((name) => path.join(RESULT_DIR, name))
    .sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
}

function checkpointAverage(cp = {}) {
  const values = SCORE_FIELDS
    .map((field) => Number(cp[field]))
    .filter((v) => Number.isFinite(v));

  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function scenarioAggregate(result) {
  const scores = result?.scores || {};
  const checkpointKeys = Object.keys(scores);

  const checkpointAverages = checkpointKeys
    .map((key) => checkpointAverage(scores[key]))
    .filter((v) => Number.isFinite(v));

  const overallAverage =
    checkpointAverages.length > 0
      ? checkpointAverages.reduce((sum, value) => sum + value, 0) / checkpointAverages.length
      : null;

  const lockAverage = checkpointAverage(scores['7800'] || {});
  const driftAverage = checkpointAverage(scores['9800'] || {});
  const finalAverage = checkpointAverage(scores['12200'] || {});

  return {
    overallAverage,
    lockAverage,
    driftAverage,
    finalAverage
  };
}

function main() {
  ensureExists(CONFIG_PATH, 'scenario config');
  fs.mkdirSync(RESULT_DIR, { recursive: true });

  const config = readJson(CONFIG_PATH);
  const resultFiles = listResultFiles();
  const results = resultFiles.map(readJson);

  const byScenarioId = new Map(results.map((r) => [r.scenarioId, r]));
  const summary = {
    generatedAt: new Date().toISOString(),
    configPath: CONFIG_PATH,
    resultDirectory: RESULT_DIR,
    scenarios: []
  };

  console.log('## Landing Diagnostic Scenario Summary');

  for (const scenario of config.scenarios || []) {
    const result = byScenarioId.get(scenario.id) || null;
    if (!result) {
      summary.scenarios.push({
        scenarioId: scenario.id,
        label: scenario.label,
        status: 'missing'
      });
      console.log(`- ${scenario.id}: missing result file`);
      continue;
    }

    const aggregates = scenarioAggregate(result);
    const entry = {
      scenarioId: scenario.id,
      label: scenario.label,
      status: 'present',
      recommendedDecision: result.recommendedDecision || null,
      schemaViolationCount: result.schemaViolationCount ?? null,
      singleWriterViolationCount: result.singleWriterViolationCount ?? null,
      aggregates,
      probeFile: result.probeFile || null,
      manifestFile: result.manifestFile || null,
      contactSheet: result.contactSheet || null,
      visualConclusion: result.visualConclusion || ''
    };

    summary.scenarios.push(entry);

    console.log(`\n### ${scenario.id}`);
    console.log(`label: ${scenario.label}`);
    console.log(`decision: ${entry.recommendedDecision || 'n/a'}`);
    console.log(`overallAverage: ${Number.isFinite(aggregates.overallAverage) ? aggregates.overallAverage.toFixed(2) : 'n/a'}`);
    console.log(`lockAverage: ${Number.isFinite(aggregates.lockAverage) ? aggregates.lockAverage.toFixed(2) : 'n/a'}`);
    console.log(`driftAverage: ${Number.isFinite(aggregates.driftAverage) ? aggregates.driftAverage.toFixed(2) : 'n/a'}`);
    console.log(`finalAverage: ${Number.isFinite(aggregates.finalAverage) ? aggregates.finalAverage.toFixed(2) : 'n/a'}`);
    console.log(`schemaViolations: ${entry.schemaViolationCount}`);
    console.log(`singleWriterViolations: ${entry.singleWriterViolationCount}`);
    if (entry.visualConclusion) {
      console.log(`visualConclusion: ${entry.visualConclusion}`);
    }
  }

  const ranked = summary.scenarios
    .filter((s) => s.status === 'present' && Number.isFinite(s.aggregates?.overallAverage))
    .sort((a, b) => (b.aggregates.overallAverage - a.aggregates.overallAverage));

  summary.ranked = ranked;

  if (ranked.length > 0) {
    console.log('\n## Ranked');
    ranked.forEach((entry, index) => {
      console.log(
        `${index + 1}. ${entry.scenarioId} — overall ${entry.aggregates.overallAverage.toFixed(2)}`
      );
    });
  }

  const outPath = path.join(
    RESULT_DIR,
    `summary-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  );
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`\n[diagnose] Saved: ${outPath}`);
}

main();

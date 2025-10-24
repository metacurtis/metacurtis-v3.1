import fs from 'fs';

const IGNORED_EMITTERS = new Set([
  'PARTICLES_EMERGED',
  'PREWARM_COMPLETE',
  'MORPH_PROGRESS',
  'CLIMAX_STEP',
  'QUALITY_CHANGE',
  'BUILD_EMERGENCE_BLUEPRINT',
  'DIRECTOR_ERROR',
  'FENCEPOST_LISTENERS_READY',
  'PREWARM_GENESIS_BLUEPRINT',
  'RENDERER_TUNE'
]);

const IGNORED_LISTENERS = new Set();

if (!fs.existsSync('reports/beatbus-map.json')) {
  console.error('[events:lint] No beatbus-map.json');
  process.exit(1);
}

const { emitters = {}, listeners = {} } = JSON.parse(
  fs.readFileSync('reports/beatbus-map.json', 'utf8')
);

const events = new Set([...Object.keys(emitters), ...Object.keys(listeners)]);
const problems = [];

for (const ev of events) {
  const e = (emitters[ev] || []).length;
  const l = (listeners[ev] || []).length;

  if (e > 0 && l === 0 && !IGNORED_EMITTERS.has(ev)) {
    problems.push(`Emitter has no listeners: ${ev}`);
  }
  if (l > 0 && e === 0 && !IGNORED_LISTENERS.has(ev)) {
    problems.push(`Listener exists without emitter: ${ev}`);
  }
}

if (problems.length) {
  console.error('[events:lint] FAILED\n' + problems.map((p) => ' - ' + p).join('\n'));
  process.exit(1);
}

console.log('[events:lint] OK');

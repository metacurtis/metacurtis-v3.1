#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const REPORTS_DIR = path.join(process.cwd(), 'reports');
const INPUT = path.join(REPORTS_DIR, 'beatbus-map.json');
const OUTPUT = path.join(REPORTS_DIR, 'event-orphans.json');
const IGNORED_EVENTS = new Set([
  'PREWARM_COMPLETE',
  'CLIMAX_STEP',
  'QUALITY_CHANGE',
  'BUILD_EMERGENCE_BLUEPRINT',
  'DIRECTOR_ERROR',
  'PREWARM_GENESIS_BLUEPRINT',
  'RENDERER_TUNE',
  'FENCEPOST_LISTENERS_READY',
  'RENDER_DIRECTIVE',
]);

async function run() {
  if (!fs.existsSync(INPUT)) {
    console.error('[scan-bloat] Missing reports/beatbus-map.json. Run "npm run trace-bus" first.');
    process.exit(1);
  }

  const data = JSON.parse(await fs.promises.readFile(INPUT, 'utf8'));
  const emitters = data.emitters || {};
  const listeners = data.listeners || {};
  const orphans = [];

  Object.keys(emitters).forEach((eventName) => {
    if (IGNORED_EVENTS.has(eventName)) return;
    if (!listeners[eventName] || listeners[eventName].length === 0) {
      orphans.push({ event: eventName, issue: 'no-listeners', emitters: emitters[eventName] });
    }
  });

  Object.keys(listeners).forEach((eventName) => {
    if (IGNORED_EVENTS.has(eventName)) return;
    if (!emitters[eventName] || emitters[eventName].length === 0) {
      orphans.push({ event: eventName, issue: 'no-emitters', listeners: listeners[eventName] });
    }
  });

  await fs.promises.mkdir(REPORTS_DIR, { recursive: true });
  await fs.promises.writeFile(OUTPUT, JSON.stringify(orphans, null, 2));

  if (orphans.length) {
    console.error(`[scan-bloat] Found ${orphans.length} orphaned events`);
    orphans.slice(0, 10).forEach((o) =>
      console.error(`  • ${o.event} (${o.issue})`)
    );
    process.exit(1);
  } else {
    console.log('[scan-bloat] ✅ no orphaned events');
  }
}

run().catch((error) => {
  console.error('[scan-bloat] failed', error);
  process.exit(1);
});

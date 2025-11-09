#!/usr/bin/env node
/* eslint-env node */
import fs from 'node:fs';
import path from 'node:path';

const reportsDir = path.resolve('reports');
const mapPath = path.join(reportsDir, 'beatbus-map.json');
const configPath = path.resolve('tools/pattern-s.config.json');

if (!fs.existsSync(mapPath)) {
  console.error('[scan-bloat] Missing reports/beatbus-map.json — run `npm run trace-bus` first.');
  process.exit(1);
}

const config = fs.existsSync(configPath)
  ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
  : {};
const allowEmitterOnly = new Set(config.eventOrphanAllowlist?.emitterOnly || []);
const allowListenerOnly = new Set(config.eventOrphanAllowlist?.listenerOnly || []);

const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
const emitters = mapData.emitters || {};
const listeners = mapData.listeners || {};
const issues = [];

const emitterEvents = Object.keys(emitters);
const listenerEvents = Object.keys(listeners);

emitterEvents.forEach((ev) => {
  if (!listeners[ev] || listeners[ev].length === 0) {
    issues.push({ event: ev, issue: 'no listeners' });
  }
});

listenerEvents.forEach((ev) => {
  if (!emitters[ev] || emitters[ev].length === 0) {
    issues.push({ event: ev, issue: 'no emitters' });
  }
});

const isAllowlisted = (issue) => {
  if (issue.issue === 'no listeners') {
    return allowEmitterOnly.has(issue.event);
  }
  if (issue.issue === 'no emitters') {
    return allowListenerOnly.has(issue.event);
  }
  return false;
};

const violations = issues.filter((issue) => !isAllowlisted(issue));
const allowlisted = issues.filter((issue) => isAllowlisted(issue));

await fs.promises.mkdir(reportsDir, { recursive: true });
const outputPath = path.join(reportsDir, 'event-orphans.json');
await fs.promises.writeFile(outputPath, JSON.stringify(issues, null, 2));

if (violations.length) {
  console.error('[scan-bloat] Event orphans detected:', outputPath);
  violations.forEach((issue) =>
    console.error(` - ${issue.event}: ${issue.issue}`)
  );
  process.exit(1);
}

if (allowlisted.length) {
  console.log(
    `[scan-bloat] 0 blocking orphans (allowlisted: ${allowlisted
      .map((i) => `${i.event}/${i.issue}`)
      .join(', ')})`
  );
} else {
  console.log('[scan-bloat] 0 orphans');
}

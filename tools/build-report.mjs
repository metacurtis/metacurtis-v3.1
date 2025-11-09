import fs from 'fs';
import path from 'path';
const outDir = 'reports';
await fs.promises.mkdir(outDir, { recursive: true });
const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p,'utf8') : '');
const now = new Date().toISOString().replace(/[:.]/g,'-');

const sst  = read(path.join(outDir,'sst-extract.json'));
const busMd  = read(path.join(outDir,'beatbus-map.md'));
const busJson = read(path.join(outDir,'beatbus-map.json'));
const src  = read(path.join(outDir,'source-hits.md'));
const singleWriter = read(path.join(outDir,'single-writer-violations.json'));
const ownershipCompliance = read(path.join(outDir,'ownership-compliance.json'));
const eventOrphans = read(path.join(outDir,'event-orphans.json'));

const report = [
  '# Narration & Opening Evidence Report',
  '',
  'Generated: ' + new Date().toLocaleString(),
  '',
  '---',
  '## 1) SST Extract',
  '',
  '```json',
  sst || '{}',
  '```',
  '',
  '---',
  '## 2) BeatBus Emitters/Listeners Map',
  '',
  busMd || '_no bus map_',
  '',
  '---',
  '## 3) Pattern S — Single-Writer Violations',
  '',
  '```json',
  singleWriter || '[]',
  '```',
  '',
  '---',
  '## 4) Pattern S — Ownership Compliance',
  '',
  '```json',
  ownershipCompliance || '[]',
  '```',
  '',
  '---',
  '## 5) Pattern S — Event Orphans',
  '',
  '```json',
  eventOrphans || '[]',
  '```',
  '',
  '---',
  '## 6) Pattern S — BeatBus Map (JSON)',
  '',
  '```json',
  busJson || '{}',
  '```',
  '',
  '---',
  '## 7) Source Evidence',
  '',
  src || '_no source hits_',
  ''
].join('\n');

const out = path.join(outDir, `narration-investigation-${now}.md`);
fs.writeFileSync(out, report);
console.log('[build-report] wrote', out);

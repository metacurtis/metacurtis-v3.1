import fs from 'fs';
import path from 'path';
const outDir = 'reports';
await fs.promises.mkdir(outDir, { recursive: true });
const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p,'utf8') : '');
const now = new Date().toISOString().replace(/[:.]/g,'-');

const sst  = read(path.join(outDir,'sst-extract.json'));
const bus  = read(path.join(outDir,'beatbus-map.md'));
const src  = read(path.join(outDir,'source-hits.md'));

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
  bus || '_no bus map_',
  '',
  '---',
  '## 3) Source Evidence',
  '',
  src || '_no source hits_',
  ''
].join('\n');

const out = path.join(outDir, `narration-investigation-${now}.md`);
fs.writeFileSync(out, report);
console.log('[build-report] wrote', out);

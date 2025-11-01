import fs from 'fs';
import path from 'path';
const outDir = 'reports';
await fs.promises.mkdir(outDir, { recursive: true });
const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p,'utf8') : '');
const now = new Date().toISOString().replace(/[:.]/g,'-');

const sst   = read(path.join(outDir,'sst-extract.json'));
const trace = read(path.join(outDir,'trace-bus.md'));
const src   = read(path.join(outDir,'source-hits.md'));

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
  '## 2) Trace Bus Map',
  '',
  trace || '_no trace bus report_',
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

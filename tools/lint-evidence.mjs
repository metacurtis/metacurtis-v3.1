import fs from 'fs';
const req = ['reports/sst-extract.json','reports/beatbus-map.json','reports/source-hits.json'];
const errs = [];
for (const f of req) {
  if (!fs.existsSync(f)) errs.push(`Missing ${f}`);
  else if (fs.statSync(f).size < 10) errs.push(`Empty ${f}`);
}
if (errs.length) { console.error('[evidence:lint] FAILED\n' + errs.map(e=>' - '+e).join('\n')); process.exit(1); }
console.log('[evidence:lint] OK');

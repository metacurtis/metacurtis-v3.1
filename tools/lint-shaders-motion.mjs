import fs from 'fs';
const p='reports/shader-motion-audit.json';
if (!fs.existsSync(p)) {
  console.warn('[lint-shaders-motion] no shader-motion-audit.json; skipping');
  process.exit(0);
}
const data = JSON.parse(fs.readFileSync(p,'utf8'));
const errs = [];
for (const i of (data.issues||[])) {
  if (i.severity === 'ERROR') errs.push(`${i.type}: ${i.detail} (${i.file})`);
}
if (errs.length) {
  console.error('[lint-shaders-motion] FAILED\n' + errs.map(e=>' - '+e).join('\n'));
  process.exit(1);
}
console.log('[lint-shaders-motion] OK');

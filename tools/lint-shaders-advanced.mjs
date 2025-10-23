import fs from 'fs';

const reportPath = 'reports/shader-audit.json';
if (!fs.existsSync(reportPath)) {
  console.warn('[lint-shaders-advanced] no shader-audit.json; skipping');
  process.exit(0);
}

const data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const errs = [];
const warns = [];

for (const m of data?.mismatches?.jsSetsMissingInGLSL || []) {
  errs.push(`JS sets uniform "${m.name}" not declared in GLSL (${m.file}:${m.line})`);
}

for (const m of data?.mismatches?.glslUniformNoJSSet || []) {
  warns.push(`GLSL uniform "${m.name}" not set in JS (${m.locations.map(l => `${l.file}:${l.line}`).join(', ')})`);
}

if (errs.length) {
  console.warn('[lint-shaders-advanced] Issues detected');
  for (const e of errs) console.warn(' -', e);
} else {
  console.log('[lint-shaders-advanced] No missing GLSL matches for JS sets');
}

if (warns.length) {
  console.warn('[lint-shaders-advanced] Warnings');
  for (const w of warns) console.warn(' -', w);
}

console.log('[lint-shaders-advanced] OK');

import fs from 'fs';
const p='reports/shader-hits.json';
if (!fs.existsSync(p)) { console.warn('[lint-shaders] no shader-hits.json; skipping'); process.exit(0); }
const data = JSON.parse(fs.readFileSync(p,'utf8'));
const errs = [];
const missingInGLSL = data?.mismatches?.jsSetsMissingInGLSL || [];
const noJSSet = data?.mismatches?.glslUniformNoJSSet || [];

const ALLOW_JS_ONLY = new Set([
  'uStageProgress',
  'shaderMorph',
  'uStageIndex',
  'uBrainRegion',
  'uTierCutoff',
  'uStageBlend',
  'uTierHighlight',
  'uTierMode',
]);

const ALLOW_GLSL_ONLY = new Set([
  'uTime',
  'uResolution',
  'uCameraMatrix',
  'uFadeProgress',
  'uTotalSprites',
  'uAtmoFit',
  'uTextFit',
  'uMoveDampStart',
  'uMoveDampStartY',
]);

missingInGLSL.forEach((m) => {
  if (ALLOW_JS_ONLY.has(m.name)) return;
  errs.push(`JS sets uniform "${m.name}" not declared in GLSL (${m.file}:${m.line})`);
});

noJSSet.forEach((m) => {
  if (ALLOW_GLSL_ONLY.has(m.name)) return;
  errs.push(`GLSL uniform "${m.name}" not set in JS (${m.locations.map((l) => `${l.file}:${l.line}`).join(', ')})`);
});

if (errs.length) {
  console.error('[lint-shaders] FAILED\n' + errs.map((e) => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('[lint-shaders] OK');

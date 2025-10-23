/**
 * Beat Verb Wiring Scanner
 * Produces reports/beat-verbs-map.{json,md}
 * - Collects verb candidates from:
 *   1) SST source (if available) and sst-extract.json (beats/segments with {visual})
 *   2) Source patterns: `visual:` in narrative configs
 *   3) visualEffects.js keys (resolver)
 * - Parses dispatcher (WebGLBackground.jsx RENDER_DIRECTIVE) to list supported fields
 * - Cross-checks GLSL uniforms (via reports/shader-audit.json)
 * - Outputs gaps: unknown verbs, mapped-but-unhandled fields, field→uniform missing
 */
import fs from 'fs'; import path from 'path';
import { walk } from '../lib/walk.mjs';

const OUT_JSON = 'reports/beat-verbs-map.json';
const OUT_MD   = 'reports/beat-verbs-map.md';
const results = {
  verbs: { sst: new Set(), codeVisuals: new Set(), resolver: new Set() },
  resolverFile: null,
  dispatcher: { file: null, fields: new Set(), uniformWrites: new Set() },
  uniforms: new Set(),
  gaps: { unknownInResolver: [], mappedButUnhandledFields: [], fieldUniformMissing: [] }
};

const add = (set,v)=>set.add(v);
const list = (set)=>Array.from(set).sort();

// 1) Load SST verbs
let sst = null;
try {
  if (fs.existsSync('reports/sst-extract.json')) {
    sst = JSON.parse(fs.readFileSync('reports/sst-extract.json','utf8'));
  }
} catch {}
// Try sst source json for "visual" keys
try {
  const src = sst?.source && fs.existsSync(sst.source) ? fs.readFileSync(sst.source,'utf8') : null;
  if (src) {
    for (const m of src.matchAll(/["']visual["']\s*:\s*["']([\w\-:]+)["']/g)) add(results.verbs.sst, m[1]);
  }
} catch {}

// 2) Scan codebase for `visual:` occurrences
for await (const file of walk('src')) {
  const ext = path.extname(file).toLowerCase();
  if (!['.js','.jsx','.ts','.tsx','.mjs'].includes(ext)) continue;
  const txt = await fs.promises.readFile(file,'utf8');
  for (const m of txt.matchAll(/visual\s*:\s*["']([\w\-:]+)["']/g)) add(results.verbs.codeVisuals, m[1]);
}

// 3) Parse visualEffects.js keys
let resolver = null;
for await (const file of walk('src', new Set(['.js','.mjs','.ts']))) {
  if (file.endsWith('config/canonical/visualEffects.js')) { resolver = file; break; }
}
if (resolver) {
  results.resolverFile = resolver;
  try {
    const mod = await import(path.resolve(resolver));
    const particle = Object.keys(mod.PARTICLE_EFFECTS || {});
    const camera = Object.keys(mod.CAMERA_EFFECTS || {});
    particle.forEach((key) => add(results.verbs.resolver, key));
    camera.forEach((key) => add(results.verbs.resolver, key));
  } catch (error) {
    console.warn('[scan-beat-verbs] failed to import resolver module:', error.message);
  }
}

// 4) Dispatcher supported fields (from RENDER_DIRECTIVE handler)
let dispatcherFile = null;
for await (const file of walk('src', new Set(['.jsx','.tsx','.js','.ts','.mjs']))){
  if (file.endsWith('components/webgl/WebGLBackground.jsx')) { dispatcherFile = file; break; }
}
if (dispatcherFile) {
  results.dispatcher.file = dispatcherFile;
  const txt = await fs.promises.readFile(dispatcherFile,'utf8');
  const handlerIdx = txt.indexOf('RENDER_DIRECTIVE');
  const handlerBlock = handlerIdx >= 0 ? txt.slice(handlerIdx, handlerIdx + 6000) : txt;
  for (const m of handlerBlock.matchAll(/directive\.(\w+)/g)) results.dispatcher.fields.add(m[1]);
  for (const m of handlerBlock.matchAll(/uniforms\.(\w+)/g)) results.dispatcher.uniformWrites.add(m[1]);
}

// 5) GLSL uniforms (from shader-audit)
try {
  const audit = JSON.parse(fs.readFileSync('reports/shader-audit.json','utf8'));
  for (const name of Object.keys(audit?.glsl?.uniforms||{})) results.uniforms.add(name);
} catch {}

const sstVerbs = list(results.verbs.sst.size?results.verbs.sst:results.verbs.codeVisuals);
const resolverVerbs = list(results.verbs.resolver);
const unknown = sstVerbs.filter(v=>!results.verbs.resolver.has(v));
results.gaps.unknownInResolver = unknown;

const resolverFields = new Set();
if (resolver) {
  const txt = fs.readFileSync(resolver,'utf8');
  for (const m of txt.matchAll(/["'][\w\-:]+["']\s*:\s*{([\s\S]*?)}/g)) {
    const body = m[1];
    for (const f of body.matchAll(/(gridX|gridY|u[\w]+)/g)) resolverFields.add(f[1]);
  }
}

const dispFields = list(results.dispatcher.fields);
const missingFields = list(resolverFields).filter(f=>!results.dispatcher.fields.has(f) && !results.dispatcher.uniformWrites.has(f));
results.gaps.mappedButUnhandledFields = missingFields;

const fieldToUniform = {
  gridX: 'uGridSpacing',
  gridY: 'uGridSpacing',
  uTierHighlight: 'uTierHighlight',
  uFlowTurbulence: 'uFlowTurbulence',
  uStreakIntensity: 'uStreakIntensity',
  uSpreadFactor: 'uSpreadFactor',
  uMotionParams: 'uMotionParams',
  uMotionMode: 'uTierMode'
};
for (const f of Object.keys(fieldToUniform)) {
  const u = fieldToUniform[f];
  if (resolverFields.has(f) && !results.uniforms.has(u)) {
    results.gaps.fieldUniformMissing.push({field:f, uniform:u});
  }
}

const out = {
  verbs:{ sst: sstVerbs, resolver: resolverVerbs },
  resolverFile: results.resolverFile,
  dispatcher:{ file: results.dispatcher.file, fields: dispFields, uniformWrites: list(results.dispatcher.uniformWrites) },
  uniforms: list(results.uniforms),
  gaps: results.gaps
};
fs.writeFileSync(OUT_JSON, JSON.stringify(out,null,2));

let md = '# Beat Verb Wiring Map\n\n';
md += `## Verbs (SST/code) → Resolver\n\n- SST/code verbs: ${sstVerbs.length}\n- Resolver verbs: ${resolverVerbs.length}\n\n`;
md += '### Unknown in resolver\n' + (unknown.length?unknown.map(v=>`- ${v}`).join('\n'):'(none)') + '\n\n';
md += '## Dispatcher fields found\n' + (dispFields.length?dispFields.map(f=>`- ${f}`).join('\n'):'(none)') + '\n\n';
md += '## Dispatcher uniform writes\n' + (out.dispatcher.uniformWrites.length?out.dispatcher.uniformWrites.map(f=>`- ${f}`).join('\n'):'(none)') + '\n\n';
md += '## GLSL Uniforms detected\n' + (out.uniforms.length?out.uniforms.map(u=>`- ${u}`).join('\n'):'(none)') + '\n\n';
md += '## Gaps\n';
md += '### Mapped but not handled by dispatcher\n' + (missingFields.length?missingFields.map(f=>`- ${f}`).join('\n'):'(none)') + '\n\n';
md += '### Field → Uniform missing in GLSL\n' + (out.gaps.fieldUniformMissing.length?out.gaps.fieldUniformMissing.map(x=>`- ${x.field} → ${x.uniform}`).join('\n'):'(none)') + '\n';
fs.writeFileSync(OUT_MD, md);
console.log('[scan-beat-verbs] wrote', OUT_JSON, 'and', OUT_MD);

#!/usr/bin/env node
/* eslint-env node */
const fs = require('fs'); const _path = require('path'); const CWD = process.cwd();
const OUT_JSON = path.join(CWD, 'doctor_artifacts', 'render-doctor-report.json');
const OUT_MD   = path.join(CWD, 'doctor_artifacts', 'render-doctor-summary.md');

const exts = ['.js','.jsx','.ts','.tsx'];
const aliasMap = { '@': 'src', '@components': 'src/components' }; // mirror HOT-DORS
const specialEntrypoints = [
  'src/App.jsx','src/main.jsx','src/core/index.js',
  'src/stores/atoms/index.js','src/canon/contracts/index.js',
  'modules/state/index.js'
].filter(f => fs.existsSync(path.join(CWD,f)));

const interest = {
  engine: ['src/engine/ConsciousnessEngine.js','src/engine/NarrativeController.js'],
  bus:    ['src/modules/orchestration/core/BeatBus.js'],
  renderer: ['src/components/webgl/WebGLCanvas.jsx','src/components/webgl/WebGLBackground.jsx']
};

const allFiles = [];
walk('src'); walk('modules');
function walk(rel){
  const dir = path.join(CWD,rel);
  if(!fs.existsSync(dir)) return;
  for(const name of fs.readdirSync(dir)){
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const fp = path.join(dir,name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) walk(path.join(rel,name));
    else if (/\.(m?jsx?|tsx?)$/.test(name)) allFiles.push(norm(fp));
  }
}
function norm(p){ return p.replace(/\\/g,'/'); }
function read(file){ try{ return fs.readFileSync(file,'utf8'); }catch{ return ''; } }

function resolveSpec(fromFile, spec){
  // alias "@/x" => "src/x"
  for(const a in aliasMap){
    const aSlash = a + '/';
    if (spec.startsWith(aSlash)) {
      spec = aliasMap[a] + '/' + spec.slice(aSlash.length);
      break;
    }
  }
  let base;
  if (spec.startsWith('./') || spec.startsWith('../')) {
    base = norm(path.resolve(path.dirname(fromFile), spec));
  } else if (spec.startsWith('src/') || spec.startsWith('modules/')) {
    base = norm(path.join(CWD, spec));
  } else {
    return null; // external (react, three,...)
  }
  // try exact + extension + index
  if (fs.existsSync(base)) return base;
  for(const e of exts){ if (fs.existsSync(base+e)) return base+e; }
  for(const e of exts){ if (fs.existsSync(base+'/index'+e)) return base+'/index'+e; }
  return null;
}

function depsOf(file){
  const s = read(file);
  const deps = new Set();
  // static imports: import ... from '...'
  const re1 = /import[\s\S]*?from\s*['"]([^'"]+)['"]/g;
  let m; while((m=re1.exec(s))){ const r=resolveSpec(file,m[1]); if(r) deps.add(r); }
  // bare imports: import '...'
  const re2 = /import\s*['"]([^'"]+)['"]/g;
  while((m=re2.exec(s))){ const r=resolveSpec(file,m[1]); if(r) deps.add(r); }
  // dynamic import('...')
  const re3 = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while((m=re3.exec(s))){ const r=resolveSpec(file,m[1]); if(r) deps.add(r); }
  // require('...')
  const re4 = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while((m=re4.exec(s))){ const r=resolveSpec(file,m[1]); if(r) deps.add(r); }
  return Array.from(deps);
}

const graph = new Map();
for(const f of allFiles){ graph.set(f, depsOf(f)); }

function reachFrom(starts){
  const seen = new Set();
  const q = [];
  for(const s of starts){
    const abs = resolveSpec(path.join(CWD,'__entry__'), s) || norm(path.join(CWD,s));
    if (fs.existsSync(abs)) { seen.add(abs); q.push(abs); }
  }
  while(q.length){
    const n = q.shift();
    for(const d of (graph.get(n)||[])){
      if (!seen.has(d)){ seen.add(d); q.push(d); }
    }
  }
  return seen;
}

const reachable = reachFrom(specialEntrypoints);

function pickReach(paths){
  return paths.filter(p => reachable.has(norm(path.join(CWD,p))));
}

const engineFound = interest.engine.filter(p => fs.existsSync(path.join(CWD,p)));
const busFound    = interest.bus.filter(p => fs.existsSync(path.join(CWD,p)));
const rendFound   = interest.renderer.filter(p => fs.existsSync(path.join(CWD,p)));

const report = {
  timestamp: new Date().toISOString(),
  engine: { found: engineFound, reachable: pickReach(engineFound) },
  bus:    { found: busFound,    reachable: pickReach(busFound)    },
  renderer:{ found: rendFound,  reachable: pickReach(rendFound)   },
  events: (() => {
    // very light event mapping
    const evDef = 'src/canon/contracts/events.js';
    const defIn = fs.existsSync(path.join(CWD,evDef)) ? [evDef] : [];
    const emits = []; const subs = [];
    for(const f of allFiles){
      const s = read(f);
      if (/emit\s*\(\s*EVENTS\.BLUEPRINT_READY/.test(s)) emits.push(rel(f));
      if (/on\s*\(\s*EVENTS\.BLUEPRINT_READY/.test(s))  subs.push(rel(f));
    }
    return { BLUEPRINT_READY:{ definedIn:defIn, emits:uniq(emits), subscribers:uniq(subs) } };
  })(),
  morph: (() => {
    const wgb = path.join(CWD,'src/components/webgl/WebGLBackground.jsx');
    const s   = read(wgb);
    const hasUniform = /uMorphProgress/.test(s);
    const hasLerp = /mix\(|lerp\(/.test(s) || /uStageProgress/.test(s); // shader-driven
    return { hasUniform, hasLerp, where:{ uniform:[rel(wgb)], lerp:[rel(wgb)] } };
  })(),
};

report.summary = {
  pipelineOK:
    report.engine.reachable.length>0 &&
    report.bus.reachable.length>0 &&
    report.renderer.reachable.length>0,
  morphOK: report.morph.hasUniform && report.morph.hasLerp,
  notes: report.renderer.reachable.length? [] : ['Renderer not reachable from entrypoints.']
};

writeOut(report);

function writeOut(r){
  const md = [
    `# Render Doctor`,
    ``,
    `- Pipeline: **${r.summary.pipelineOK ? 'OK' : 'ISSUES'}**`,
    `- Morph: **${r.summary.morphOK ? 'OK' : 'ISSUES'}**`,
    ``,
    `## Reachability`,
    `- Engine reachable: ${r.engine.reachable.join(', ') || '—'}`,
    `- Bus reachable: ${r.bus.reachable.join(', ') || '—'}`,
    `- Renderer reachable: ${r.renderer.reachable.join(', ') || '—'}`,
    ``,
    r.summary.notes.length ? `> Notes: ${r.summary.notes.join(' | ')}` : ''
  ].join('\n');
  fs.writeFileSync(OUT_JSON, JSON.stringify(r,null,2));
  fs.writeFileSync(OUT_MD, md);
  console.log(r.summary.pipelineOK ? 'Render Pipeline: OK' : 'Render Pipeline: ISSUES');
  console.log('Morph Wiring   :', r.summary.morphOK ? 'OK' : 'ISSUES');
  console.log('Artifacts:'); console.log(' - ' + OUT_JSON); console.log(' - ' + OUT_MD);
}

function rel(p){ return norm(path.relative(CWD,p)); }
function uniq(a){ return Array.from(new Set(a)); }

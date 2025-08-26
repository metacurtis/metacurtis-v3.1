#!/usr/bin/env node
/**
 * HOT-DORS v1.0 — Hermetic One-Touch Doctor + DORS
 * Single-command, read-only governance pass.
 * Exit codes: 0 OK, 2 invariant fail, 3 telemetry missing, 4 internal error.
 * Non-goals: no auto-fixes, no watchers, no external CLIs, no network.
 */

const fs = require('fs');
const _path = require('path');
const crypto = require('crypto');

const NAME = 'hot-dors';
const VERSION = '1.0.0';
const CWD = process.cwd();
const ART = (...p) => path.join(CWD, 'doctor_artifacts', ...p);
const SCRIPTS = path.join(CWD, 'scripts');
const SRC = path.join(CWD, 'src');
const MODULES = path.join(CWD, 'modules');

const EXIT = { OK:0, INVAR:2, TELEMETRY:3, INTERNAL:4 };

// ------------------------ helpers ------------------------
function safeJSONRead(p, fallback=null){
  try{ return JSON.parse(fs.readFileSync(p,'utf8')); }catch{ return fallback; }
}
function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p,{recursive:true}); }
function listJSFiles(root){
  const out=[];
  function walk(dir){
    if(!fs.existsSync(dir)) return;
    for(const e of fs.readdirSync(dir)){
      const fp=path.join(dir,e);
      const st=fs.statSync(fp);
      if(st.isDirectory()){
        if(!/(^|\/)(node_modules|dist|build|\.git)(\/|$)/.test(fp)) walk(fp);
      }else if(/\.(js|jsx|ts|tsx)$/.test(e)){
        const rel=path.relative(CWD,fp);
        const content=fs.readFileSync(fp,'utf8');
        out.push({ path:rel, name:e, size:st.size, lines:content.split('\n').length,
                   hash:crypto.createHash('md5').update(content).digest('hex'),
                   content });
      }
    }
  }
  walk(SRC); walk(MODULES);
  return out;
}
function parseImports(code){
  const out=[];
  const re1=/\bimport\s+[^'"]*?from\s+['"]([^'"]+)['"]/g;
  const re2=/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
  let m; while((m=re1.exec(code))) out.push(m[1]);
  while((m=re2.exec(code))) out.push(m[1]);
  return out;
}

// ------------------------ sentinel #1: alias & entrypoints ------------------------
function readAliases(){
  const map={};
  // tsconfig paths
  const ts = safeJSONRead(path.join(CWD,'tsconfig.json'));
  if(ts?.compilerOptions?.paths){
    for(const [k,v] of Object.entries(ts.compilerOptions.paths)){
      const key = k.replace(/\/\*$/,'');
      const target = Array.isArray(v)&&v[0] ? v[0].replace(/\/\*$/,'') : '';
      if(target) map[key]=target;
    }
  }
  // vite aliases (very light heuristic)
  const viteCandidates = ['vite.config.js','vite.config.ts'].map(f=>path.join(CWD,f));
  for(const vc of viteCandidates){
    if(fs.existsSync(vc)){
      const text=fs.readFileSync(vc,'utf8');
      // alias: [{ find: '@', replacement: 'src' }, ...]
      const reArr=/alias\s*:\s*\[\s*([\s\S]*?)\]/m;
      const m=text.match(reArr);
      if(m){
        const arr=m[1];
        const reItem=/find\s*:\s*['"]([^'"]+)['"]\s*,\s*replacement\s*:\s*['"]([^'"]+)['"]/g;
        let mm; while((mm=reItem.exec(arr))){
          map[mm[1]] = mm[2];
        }
      }
      // alias: { '@': 'src', ... }
      const reObj=/alias\s*:\s*{([\s\S]*?)}/m;
      const mo=text.match(reObj);
      if(mo){
        const obj=mo[1];
        const reKV=/['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g;
        let mk; while((mk=reKV.exec(obj))){
          map[mk[1]] = mk[2];
        }
      }
    }
  }
  // common courtesy default
  if(!map['@'] && fs.existsSync(SRC)) map['@']='src';
  return map;
}

function specialEntrypointPatterns(){
  return [
    /(^|\/)main\.(j|t)sx?$/,
    /(^|\/)index\.(j|t)sx?$/,
    /(^|\/)App\.(j|t)sx?$/,
    /\.worker\.(j|t)sx?$/,
    /\.stories\.(j|t)sx?$/,
    /(^|\/)shaders?(\/|$)/,
    /\.glsl$/,
    /(^|\/)scripts?(\/|$)/
  ];
}

function buildImportGraph(files, aliases){
  const setPaths = new Set(files.map(f=>f.path));
  const graph = new Map();
  for(const f of files){
    graph.set(f.path,{ imports:[], importedBy:[] });
  }
  function resolveSpec(importerPath, spec){
    let s=spec;
    // alias swap
    for(const [a,rep] of Object.entries(aliases)){
      if(s===a || s.startsWith(a+'/')){
        const tail=s.slice(a.length);
        s = (rep.replace(/\/$/,'') + tail);
        if(!s.startsWith('src/') && rep.startsWith('src')) s=''+s; // keep relative-to-root
        break;
      }
    }
    const base = spec.startsWith('.') ? path.dirname(importerPath) : CWD;
    const raw = spec.startsWith('.') ? path.join(base, spec) : s;
    const rel = path.relative(CWD, raw);
    const candidates = [
      rel, rel+'.js', rel+'.jsx', rel+'.ts', rel+'.tsx',
      path.join(rel,'index.js'), path.join(rel,'index.jsx'),
      path.join(rel,'index.ts'), path.join(rel,'index.tsx')
    ];
    for(const c of candidates){
      const norm = c.replace(/\\/g,'/');
      if(setPaths.has(norm)) return norm;
    }
    return null;
  }

  for(const f of files){
    const specs = parseImports(f.content);
    for(const spec of specs){
      const target = resolveSpec(f.path, spec);
      if(target && graph.has(target)){
        graph.get(f.path).imports.push(target);
        graph.get(target).importedBy.push(f.path);
      }
    }
  }
  return graph;
}

function sentinelAliases(files){
  const aliases = readAliases();
  const graph = buildImportGraph(files, aliases);
  const entryRe = specialEntrypointPatterns();
  const special=[];
  for(const f of files){
    if(entryRe.some(r=>r.test(f.path))) special.push(f.path);
  }
  const trueOrphans=[];
  graph.forEach((node,fp)=>{
    if(node.importedBy.length===0 && !special.includes(fp)) trueOrphans.push(fp);
  });
  return { aliases, specialEntrypoints:special, trueOrphans, importGraph:Object.fromEntries(graph) };
}

// ------------------------ sentinel #2: invariants ------------------------
function sentinelInvariants(files, importGraphObj){
  const importGraph = new Map(Object.entries(importGraphObj));
  const r = {
    singleBus:{pass:false, violations:[]},
    stateCoreOnly:{pass:false, violations:[]},
    singleMorphDriver:{pass:false, violations:[]}
  };

  // 1) Single BeatBus used on active graph
  const busCandidates=[];
  for(const f of files){
    if(/\bBeatBus\b/.test(f.content) || /EventEmitter/.test(f.content) || /createBus/.test(f.content)){
      const node = importGraph.get(f.path);
      if(node && node.importedBy && node.importedBy.length>0) busCandidates.push(f.path);
    }
  }
  r.singleBus.pass = busCandidates.length<=1;
  r.singleBus.violations = busCandidates;

  // 2) StateCore is sole writer (heuristic)
// 2) StateCore is sole writer (heuristic, narrowed)
const offenders=[];
for (const f of files){
  if (/StateCore/.test(f.path)) continue;
  const content = f.content;

  const hasGlobalSC =
    /(?:window|globalThis)\.SC\s*=/.test(content);

  // React class setState (global-ish UI mutation we still want to flag)
  const hasReactSetState = /\.setState\(/.test(content);

  // Ignore generic "set(" calls (Maps, vectors, Zustand-style atom setters)
  // and anything under stores/atoms or createAtom files
  const isAtomFile =
    /stores\/atoms\//.test(f.path) || /createAtom|atomStore|zustand/.test(content);

  if ((hasGlobalSC || hasReactSetState) && !isAtomFile){
    offenders.push(f.path);
  }
}
r.stateCoreOnly.pass = offenders.length===0;
r.stateCoreOnly.violations = offenders;

// 3) Single morph driver
  const morphers=[];
  for(const f of files){
    if(/requestAnimationFrame[\s\S]{0,120}morph/i.test(f.content) ||
       /\buMorphProgress\b/.test(f.content) ||
       /\bsetMorphProgress\b/.test(f.content)){
      morphers.push(f.path);
    }
  }
  r.singleMorphDriver.pass = morphers.length<=1;
  r.singleMorphDriver.violations = morphers;

  return r;
}

// ------------------------ sentinel #3: drift ------------------------
function sentinelDrift(curr){
  const prev = safeJSONRead(ART(`${NAME}-report.json`), null);
  if(!prev) return { orphans:0, duplicates:0, layers:{} };
  return {
    orphans: (curr.orphans||0) - (prev.stats?.orphans||0),
    duplicates: (curr.duplicates||0) - (prev.stats?.duplicates||0),
    layers: {}
  };
}

// ------------------------ sentinel #4: performance pulse ------------------------
function sentinelPerformance(importGraphObj){
  let badge='yellow', fps=null;
  const candidates=[
    ART('performance-snapshot.json'),
    ART('canon-hud-snapshot.json')
  ];
  for(const p of candidates){
    if(fs.existsSync(p)){
      const d = safeJSONRead(p,null);
      if(d){
        fps = d.fps ?? (d.frameTime ? (1000/d.frameTime) : null);
        if(fps!=null) badge = fps>=55 ? 'green' : fps>=45 ? 'yellow' : 'red';
      }
      break;
    }
  }
  // hotspots by indegree
  const hotspots=[];
  const g=new Map(Object.entries(importGraphObj));
  g.forEach((node,fp)=>{ if(node.importedBy && node.importedBy.length>5) hotspots.push({path:fp,count:node.importedBy.length}); });
  hotspots.sort((a,b)=>b.count-a.count);
  return { badge, fps, hotspots:hotspots.slice(0,3) };
}

// ------------------------ reports ------------------------
function writeReports(analysis){
  ensureDir(ART());
  const reportPath = ART(`${NAME}-report.json`);
  fs.writeFileSync(reportPath, JSON.stringify(analysis,null,2));

  // tiny schema for future AIs
  const schema = {
    "$schema":"http://json-schema.org/draft-07/schema#",
    "type":"object",
    "properties":{
      "timestamp":{"type":"string"},
      "version":{"type":"string"},
      "stats":{"type":"object"},
      "sentinels":{"type":"object"}
    }
  };
  fs.writeFileSync(ART('report.schema.json'), JSON.stringify(schema,null,2));

  const s = analysis.sentinels;
  const md = `# HOT-DORS Report
Generated: ${analysis.timestamp}

## Invariants
- Single BeatBus: ${s.invariants.singleBus.pass ? 'PASS' : 'FAIL'} ${s.invariants.singleBus.pass?'':`\n  - ${s.invariants.singleBus.violations.join('\n  - ')}`}
- StateCore-only: ${s.invariants.stateCoreOnly.pass ? 'PASS' : 'FAIL'} ${s.invariants.stateCoreOnly.pass?'':`\n  - ${s.invariants.stateCoreOnly.violations.join('\n  - ')}`}
- Single Morph Driver: ${s.invariants.singleMorphDriver.pass ? 'PASS' : 'FAIL'} ${s.invariants.singleMorphDriver.pass?'':`\n  - ${s.invariants.singleMorphDriver.violations.join('\n  - ')}`}

## Performance
- Badge: ${s.performance.badge.toUpperCase()}
- FPS: ${s.performance.fps!=null ? s.performance.fps.toFixed(1) : 'N/A'}
- Hotspots:
${s.performance.hotspots.map(h=>`  - ${h.path} (imported by ${h.count})`).join('\n') || '  - none'}

## True Orphans (${s.aliases.trueOrphans.length})
${s.aliases.trueOrphans.slice(0,20).map(x=>`- ${x}`).join('\n') || '- none'}

## Drift (vs last report)
- Orphans: ${s.drift.orphans>=0?'+':''}${s.drift.orphans}
- Duplicates: ${s.drift.duplicates>=0?'+':''}${s.drift.duplicates}
`;
  fs.writeFileSync(ART(`${NAME}-summary.md`), md);

  // git plan for orphans (not executed)
  if(s.aliases.trueOrphans.length>0){
    const plan = `#!/usr/bin/env bash
# Review carefully before executing:
${s.aliases.trueOrphans.map(f=>`git rm "${f}"`).join('\n')}

# Commit suggestion:
# git commit -m "chore: remove true orphans (HOT-DORS)"
`;
    fs.writeFileSync(ART('delete_orphans.sh'), plan);
    try{ fs.chmodSync(ART('delete_orphans.sh'), 0o755); }catch{}
  }

  return { reportPath, summaryPath: ART(`${NAME}-summary.md`) };
}

// ------------------------ self-install (pure Node) ------------------------
function selfInstall(){
  try{
    ensureDir(SCRIPTS);
    const target = path.join(SCRIPTS, `${NAME}.cjs`);
    if(fs.existsSync(target) && path.resolve(__filename)===path.resolve(target)){
      console.log('Already installed at scripts/hot-dors.cjs'); return true;
    }
    fs.copyFileSync(__filename, target);
    const pkgPath = path.join(CWD,'package.json');
    if(fs.existsSync(pkgPath)){
      const pkg = safeJSONRead(pkgPath,{});
      pkg.scripts = pkg.scripts || {};
      pkg.scripts['hot-dors'] = `node scripts/${NAME}.cjs`;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg,null,2)+'\n');
      console.log('Added npm script: npm run hot-dors');
    }else{
      console.log('package.json not found; skipped npm script addition.');
    }
    console.log(`Installed to ${target}`);
    return true;
  }catch(err){
    console.error('Installation failed:', err.message);
    return false;
  }
}

// ------------------------ main ------------------------
function main(){
  try{
    if(process.argv.includes('--install')){
      process.exit(selfInstall()?EXIT.OK:EXIT.INTERNAL);
    }

    console.log(`HOT-DORS v${VERSION} — Hermetic One-Touch Doctor\n`);

    // 1) discover
    const files = listJSFiles();
    console.log(`Discovered ${files.length} files under src/ and modules/\n`);

    // 2) sentinels
    const aliasRes = sentinelAliases(files);
    const invariants = sentinelInvariants(files, aliasRes.importGraph);
    const drift = sentinelDrift({ orphans: aliasRes.trueOrphans.length, duplicates: 0 });
    const perf = sentinelPerformance(aliasRes.importGraph);

    // 3) analysis object
    const analysis = {
      timestamp: new Date().toISOString(),
      version: VERSION,
      stats: {
        filesAnalyzed: files.length,
        orphans: aliasRes.trueOrphans.length,
        duplicates: 0,
        specialEntrypoints: aliasRes.specialEntrypoints.length
      },
      sentinels: {
        aliases: aliasRes,
        invariants,
        drift,
        performance: perf
      }
    };

    // 4) outputs
    const { reportPath, summaryPath } = writeReports(analysis);

    // 5) console summary + exit code
    const ok = invariants.singleBus.pass && invariants.stateCoreOnly.pass && invariants.singleMorphDriver.pass;
    console.log('\nArtifacts:');
    console.log(' - ' + reportPath);
    console.log(' - ' + summaryPath);
    if(aliasRes.trueOrphans.length>0) console.log(' - ' + ART('delete_orphans.sh') + '  (git plan)');

    if(!ok){
      console.log('\nINVARIANTS FAILED — block merge.');
      process.exit(EXIT.INVAR);
    }
    if(perf.fps==null){
      console.log('\nTelemetry missing (non-blocking). Provide doctor_artifacts/performance-snapshot.json with { "fps": 60 } to get GREEN.');
      process.exit(EXIT.TELEMETRY);
    }

    console.log('\nAll checks passed.');
    process.exit(EXIT.OK);

  }catch(err){
    console.error('Internal error:', err.stack || err.message);
    process.exit(EXIT.INTERNAL);
  }
}

if(require.main===module) main();
module.exports = { main };

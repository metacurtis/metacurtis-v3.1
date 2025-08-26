#!/usr/bin/env node
/**
 * HOT-DORS v2 (standalone runner)
 * - Hermetic, read-only
 * - Reachability-aware invariants
 * - Single Bus: only actual BeatBus impls reachable from src entrypoints
 * - StateCore-only: only real globals or class this.setState outside UI (ignores atoms/hooks)
 * - Single Morph Driver: non-UI rAF morph loop OR global morph writer, reachable
 * Outputs:
 *   doctor_artifacts/hot-dors-report.json
 *   doctor_artifacts/hot-dors-summary.md
 */
const fs = require('fs');
const _path = require('path');

const CWD = process.cwd();
const ART = p => path.join(CWD, 'doctor_artifacts', p);
const SRC_DIRS = ['src','modules'].map(p=>path.join(CWD,p)).filter(fs.existsSync);

function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p, {recursive:true}); }
function readJSON(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }

function discoverFiles(){
  const exts = new Set(['.js','.jsx','.ts','.tsx']);
  const skipDir = /(^|\/)(node_modules|dist|build|\.git|\.husky|\.cache|\.vite|\.svelte-kit|\.next|\.fix-backups)(\/|$)/;
  const skipFile = /\.(bak|backup)(\.|$)|\.bak\./i;
  const files = [];
  function walk(dir){
    for(const e of fs.readdirSync(dir)){
      const fp = path.join(dir,e);
      const st = fs.statSync(fp);
      if(st.isDirectory()){
        if(skipDir.test(fp)) continue;
        walk(fp);
      } else {
        if(!exts.has(path.extname(fp))) continue;
        if(skipFile.test(fp)) continue;
        const rel = path.relative(CWD, fp).replace(/\\/g,'/');
        const content = fs.readFileSync(fp,'utf8');
        files.push({ path: rel, name: e, content });
      }
    }
  }
  SRC_DIRS.forEach(walk);
  return files;
}

function parseAliases(){
  const aliases = {};
  const tsconfig = path.join(CWD, 'tsconfig.json');
  if(fs.existsSync(tsconfig)){
    try{
      const t = readJSON(tsconfig);
      const paths = (t.compilerOptions && t.compilerOptions.paths) || {};
      for(const [alias, targets] of Object.entries(paths)){
        const a = alias.replace(/\/\*$/,'');
        const tgt = (targets && targets[0]) ? targets[0].replace(/\/\*$/,'') : '';
        aliases[a] = tgt.startsWith('.') ? tgt.replace(/^\.\//,'') : tgt;
      }
    }catch{}
  }
  const vite = path.join(CWD,'vite.config.js');
  if(fs.existsSync(vite)){
    try{
      const c = fs.readFileSync(vite,'utf8');
      for(const m of c.matchAll(/['"](@[^'"]+)['"]\s*:\s*path\.resolve\([^,]+,\s*['"]([^'"]+)['"]/g)){
        aliases[m[1]] = m[2];
      }
    }catch{}
  }
  // Common shorthand
  if(!aliases['@'] && fs.existsSync(path.join(CWD,'src'))) aliases['@'] = 'src';
  return aliases;
}

function buildGraph(files, aliases){
  const graph = new Map(); // path -> { imports: [resolved], importedBy: [] }
  const resolveImport = (fromPath, imp) => {
    let s = imp;
    // strip query suffix like ?raw
    s = s.replace(/\?[^'"]*$/,'');
    // alias -> path
    for(const [a, tgt] of Object.entries(aliases)){
      if(s === a || s.startsWith(a + '/')){
        const repl = tgt;
        s = s.replace(a, repl);
      }
    }
    if(s.startsWith('/')) s = s.replace(/^\//,''); // project-root relative
    const variations = ['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.ts', '/index.tsx', '/index.jsx'];
    // Relative or project-root-ish
    const baseDir = path.dirname(fromPath);
    if(s.startsWith('.')){
      for(const ext of variations){
        const candidate = path.posix.normalize(path.posix.join(baseDir, s + ext));
        if(graph.has(candidate)) return candidate;
      }
    } else {
      // try as already project-relative
      for(const ext of variations){
        const candidate = path.posix.normalize(s + ext);
        if(graph.has(candidate)) return candidate;
      }
    }
    return null;
  };

  // initial nodes
  for(const f of files){
    graph.set(f.path, { imports: [], importedBy: [] });
  }

  // extract imports
  const reImports = [
    /import\s+[^'"]*['"]([^'"]+)['"]/g,
    /import\(['"]([^'"]+)['"]\)/g,
    /require\(['"]([^'"]+)['"]\)/g
  ];
  for(const f of files){
    const imports = new Set();
    for(const re of reImports){
      for(const m of f.content.matchAll(re)){
        imports.add(m[1]);
      }
    }
    const node = graph.get(f.path);
    node.rawImports = Array.from(imports);
  }

  // resolve imports to known files
  for(const f of files){
    const node = graph.get(f.path);
    node.imports = node.rawImports
      .map(imp => resolveImport(f.path, imp))
      .filter(Boolean);
  }

  // fill importedBy
  for(const [p, node] of graph.entries()){
    for(const to of node.imports){
      if(graph.has(to)) graph.get(to).importedBy.push(p);
    }
  }

  return graph;
}

function findEntrypoints(files){
  const special = [];
  const pat = /(\/|^)(main|index|App)\.(jsx?|tsx?)$/;
  for(const f of files){
    if(!f.path.startsWith('src/')) continue; // src-only
    if(pat.test(f.path)) special.push(f.path);
  }
  return Array.from(new Set(special));
}

function reachableFrom(graph, roots){
  const seen = new Set();
  const stack = [...roots];
  while(stack.length){
    const p = stack.pop();
    if(seen.has(p)) continue;
    seen.add(p);
    const node = graph.get(p);
    if(!node) continue;
    for(const to of node.imports){
      if(!seen.has(to)) stack.push(to);
    }
  }
  return seen;
}

function computeInvariants(files, graph, entrypoints){
  const reachable = reachableFrom(graph, entrypoints);
  const results = {
    singleBus: { pass:false, violations:[] },
    stateCoreOnly: { pass:false, violations:[] },
    singleMorphDriver: { pass:false, violations:[] }
  };

  // 1) Single BeatBus: only actual BeatBus files reachable from src entrypoints
  const busFiles = files
    .filter(f =>
      /(?:^|\/)BeatBus\.(?:js|jsx|ts|tsx)$/.test(f.path)
    )
    .map(f => f.path)
    .filter(p => reachable.has(p));
  results.singleBus.violations = busFiles;
  results.singleBus.pass = busFiles.length <= 1;

  // 2) StateCore-only: real global writes or non-UI class this.setState; ignore atoms/hooks
  const scOff = [];
  for(const f of files){
    const p = f.path, c = f.content;
    if(/StateCore/.test(p)) continue;
    const isUI = /\/components\/|\/sections\//.test(p) || /\.jsx$/.test(p);
    const isAtom = /stores\/atoms\//.test(p) || /createAtom|atomStore|zustand/.test(c);
    const hasGlobalSC = /(?:window|globalThis)\.SC\s*=/.test(c);
    const hasClassSetState = /(^|[^\w$])this\.setState\(/.test(c);
    if((hasGlobalSC || (hasClassSetState && !isUI)) && !isAtom){
      scOff.push(p);
    }
  }
  results.stateCoreOnly.violations = scOff;
  results.stateCoreOnly.pass = scOff.length === 0;

  // 3) Single Morph Driver: reachable non-UI raf-morph loop or global morph writer (not atoms)
  const drivers = [];
  for(const f of files){
    const p = f.path, c = f.content;
    const isUI = /\/components\/|\/sections\//.test(p) || /\.jsx$/.test(p);
    const isAtom = /stores\/atoms\//.test(p) || /createAtom|atomStore|zustand/.test(c);
    if(isUI) continue;
    const drivesRAF = /requestAnimationFrame\s*\([^)]*morph/i.test(c);
    const writesGlobalMorph = /(narrativeAtom\.)?setMorphProgress\s*\(/.test(c) && !isAtom;
    if((drivesRAF || writesGlobalMorph) && reachable.has(p)) drivers.push(p);
  }
  results.singleMorphDriver.violations = drivers;
  results.singleMorphDriver.pass = drivers.length <= 1;

  return results;
}

function performancePulse(){
  let badge='yellow', fps=null;
  const candidates = [
    ART('performance-snapshot.json'),
    ART('canon-hud-snapshot.json')
  ];
  for(const p of candidates){
    if(fs.existsSync(p)){
      try{
        const j = readJSON(p);
        fps = j.fps || (j.frameTime ? 1000/Number(j.frameTime) : null);
        badge = fps>=55 ? 'green' : fps>=45 ? 'yellow' : 'red';
        break;
      }catch{}
    }
  }
  return { badge, fps, hotspots: [] };
}

function main(){
  console.log('HOT-DORS v2 — Hermetic One-Touch Doctor\n');
  const files = discoverFiles();
  console.log(`Discovered ${files.length} files under src/ and modules/\n`);

  const aliases = parseAliases();
  const graph = buildGraph(files, aliases);
  const entrypoints = findEntrypoints(files);
  const invariants = computeInvariants(files, graph, entrypoints);
  const perf = performancePulse();

  ensureDir(ART(''));
  const report = {
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    stats: {
      filesAnalyzed: files.length,
      orphans: [...graph.keys()].filter(p=>{
        const n = graph.get(p);
        return n && n.importedBy.length===0 && !/(^|\/)(main|index|App)\.(jsx?|tsx?)$/.test(p);
      }).length,
      specialEntrypoints: entrypoints.length
    },
    sentinels: {
      aliases: { aliases, specialEntrypoints: entrypoints, trueOrphans: [], importGraph: Object.fromEntries(graph) },
      invariants,
      drift: { orphans: 0, duplicates: 0, layers: {} },
      performance: perf
    }
  };

  const reportPath = ART('hot-dors-report.json');
  const summaryPath = ART('hot-dors-summary.md');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  const md = `# HOT-DORS Report (v2)
Generated: ${report.timestamp}

## Invariants
- Single BeatBus: ${invariants.singleBus.pass?'PASS':'FAIL'}
  - ${invariants.singleBus.violations.join('\n  - ') || '(none)'}
- StateCore-only: ${invariants.stateCoreOnly.pass?'PASS':'FAIL'}
  - ${invariants.stateCoreOnly.violations.join('\n  - ') || '(none)'}
- Single Morph Driver: ${invariants.singleMorphDriver.pass?'PASS':'FAIL'}
  - ${invariants.singleMorphDriver.violations.join('\n  - ') || '(none)'}

## Performance: ${perf.badge.toUpperCase()}
FPS: ${perf.fps ?? 'N/A'}
`;
  fs.writeFileSync(summaryPath, md);

  console.log('\nArtifacts:');
  console.log(' -', reportPath);
  console.log(' -', summaryPath);

  const pass = invariants.singleBus.pass && invariants.stateCoreOnly.pass && invariants.singleMorphDriver.pass;
  if(!pass){
    console.log('\nINVARIANTS FAILED — block merge.');
    process.exit(2);
  }
  console.log('\nAll checks passed.');
  process.exit(0);
}

if(require.main === module) main();

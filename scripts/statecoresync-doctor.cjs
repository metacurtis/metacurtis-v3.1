#!/usr/bin/env node
/**
 * StateCore Sync Diagnostic Doctor
 * AST-based, idempotent, Canon-aware, HMR-safe
 *
 * Usage:
 *   node scripts/statecoresync-doctor.cjs [--write] [--strict] [--verbose] [--no-install]
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = process.cwd();
const SRC  = path.join(ROOT, 'src');
const OPTS = new Set(process.argv.slice(2));
const WRITE   = OPTS.has('--write');
const STRICT  = OPTS.has('--strict');
const VERBOSE = OPTS.has('--verbose');
const NOINST  = OPTS.has('--no-install');

const colors = { r:'\x1b[31m', g:'\x1b[32m', y:'\x1b[33m', c:'\x1b[36m', d:'\x1b[2m', x:'\x1b[0m' };
const log = (...a)=>VERBOSE && console.log(colors.c, '[doctor]', ...a, colors.x);

function ensureDeps() {
  try { require('@babel/parser'); require('@babel/traverse'); }
  catch {
    if (NOINST) { console.error(colors.r+'Missing deps: @babel/parser @babel/traverse'+colors.x); process.exit(2); }
    console.log(colors.c+'Installing @babel/parser @babel/traverse ...'+colors.x);
    cp.execSync('npm i -D @babel/parser @babel/traverse', { stdio: 'inherit' });
  }
}
ensureDeps();
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

// ---------- utils ----------
function walk(dir, out=[]) {
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir)) {
    if (f === 'node_modules' || f.startsWith('.')) continue;
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(m?jsx?|tsx?)$/.test(f)) out.push(p);
  }
  return out;
}
function read(f) { return fs.existsSync(f) ? fs.readFileSync(f,'utf8') : ''; }
function writeFileSafe(file, content) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content, 'utf8'); }
function insertOnce(src, needleRe, insertion, tag) {
  if (needleRe.test(src)) return src; // already has it
  return src + `\n\n${insertion} // ${tag}`;
}
function parse(code, file) {
  try {
    return parser.parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript', 'classProperties'] });
  } catch (e) {
    findings.issues.push({ severity:'WARN', type:'PARSE_FAIL', file: rel(file), msg: e.message.split('\n')[0] });
    return null;
  }
}
function rel(f) { return path.relative(ROOT, f); }
function memberChain(node) {
  const parts=[]; let n=node;
  while(n && n.type==='MemberExpression'){
    const prop = n.property.type==='Identifier' ? n.property.name : String(n.property.value);
    parts.unshift(prop);
    if (n.object.type==='Identifier'){ parts.unshift(n.object.name); break; }
    n = n.object;
  }
  return parts.join('.');
}

// ---------- analysis ----------
const findings = {
  filesScanned: 0,
  bus: { instances: [], windowExports: [], boundaryCalls: [] },
  hmr: { onCalls: [], offCalls: [], disposeBlocks: [] },
  atoms: { found: [] },
  issues: [],
  artifacts: {}
};

function visit(file, code) {
  const ast = parse(code, file);
  if (!ast) return;

  traverse(ast, {
    NewExpression(p){
      const { callee, loc } = p.node;
      const name = callee.type==='Identifier' ? callee.name
                : (callee.type==='MemberExpression' && callee.property.type==='Identifier' ? callee.property.name : null);
      if (name && /BeatBus|BeatBusAdapter/.test(name)) {
        findings.bus.instances.push({ file: rel(file), name, loc: loc?.start });
      }
    },
    AssignmentExpression(p){
      const { left, right, loc } = p.node;
      if (left.type==='MemberExpression' && left.object.type==='Identifier' && left.object.name==='window') {
        const prop = left.property.type==='Identifier' ? left.property.name : left.property.value;
        if (prop === 'BeatBus') {
          findings.bus.windowExports.push({ file: rel(file), loc: loc?.start });
        }
      }
    },
    CallExpression(p){
      const { callee, arguments: args, loc } = p.node;
      if (callee.type === 'MemberExpression') {
        const chain = memberChain(callee);

        // HMR listener heuristics
        if (/\.on$/.test(chain)) findings.hmr.onCalls.push({ file: rel(file), loc: loc?.start, chain });
        if (/\.off$/.test(chain)) findings.hmr.offCalls.push({ file: rel(file), loc: loc?.start, chain });

        // boundary
        if (/(^|\.)canon\.boundary\.enforce$/.test(chain)) {
          findings.bus.boundaryCalls.push({ file: rel(file), loc: loc?.start });
        }
      }
    },
    MemberExpression(p){
      // catch import.meta.hot.dispose
      const chain = memberChain(p.node);
      if (chain === 'import.meta.hot.dispose') {
        findings.hmr.disposeBlocks.push({ file: rel(file), loc: p.node.loc?.start });
      }
    },
    ImportDeclaration(p){
      const src = p.node.source.value || '';
      if (/atoms?|stores/.test(src)) {
        findings.atoms.found.push({ file: rel(file), from: src });
      }
    }
  });
}

function analyze() {
  const files = walk(SRC);
  findings.filesScanned = files.length;
  for (const f of files) visit(f, read(f));

  // diagnoses
  if (!findings.bus.instances.length) {
    findings.issues.push({ severity:'HIGH', type:'NO_BEATBUS', msg:'No BeatBus instantiation found' });
  }
  if (findings.bus.instances.length > 1) {
    findings.issues.push({ severity:'HIGH', type:'MULTI_BUS', msg:`Multiple BeatBus-like instantiations (${findings.bus.instances.length})` });
  }
  if (findings.bus.instances.length && !findings.bus.windowExports.length) {
    findings.issues.push({ severity:'HIGH', type:'NO_WINDOW_EXPORT', msg:'BeatBus exists but not exported as window.BeatBus' });
  }
  if (!findings.bus.boundaryCalls.length) {
    findings.issues.push({ severity:'HIGH', type:'NO_BOUNDARY', msg:'canon.boundary.enforce(...) not detected' });
  }

  const onCount  = findings.hmr.onCalls.length;
  const offCount = findings.hmr.offCalls.length;
  const disp     = findings.hmr.disposeBlocks.length;

  if (onCount && !disp) {
    findings.issues.push({ severity:'HIGH', type:'HMR_NO_DISPOSE', msg:`Found ${onCount} listener registrations but no hot.dispose blocks` });
  } else if (onCount && offCount < onCount) {
    findings.issues.push({ severity:'MEDIUM', type:'HMR_IMBALANCE', msg:`listeners(on)=${onCount} > off=${offCount}` });
  }

  findings.artifacts.summary = { onCount, offCount, disposeBlocks: disp };
}

// ---------- patching ----------
function ensureDevSentinel() {
  const devPath = path.join(SRC, 'dev', 'statecore_doctor_sentinel.js');
  if (fs.existsSync(devPath)) { log('sentinel exists'); return false; }
  const code =
`// @doctor:statecoresync v1 sentinel (DEV only)
(function(){
  if (typeof window==='undefined') return;
  if (window.__STATECORE_SENTINEL_ACTIVE) return; window.__STATECORE_SENTINEL_ACTIVE = true;

  const log = (...a)=>console.log('%c[Doctor]', 'color:#06b6d4', ...a);
  const warn = (...a)=>console.warn('%c[Doctor]', 'color:#f59e0b', ...a);

  function lateEnforce(){
    try{
      if (window.BeatBus && window.canon?.boundary && !window.BeatBus.__boundaryEnforced){
        window.canon.boundary.enforce(window.BeatBus);
        window.BeatBus.__boundaryEnforced = true;
        log('Boundary enforced (late-binding)');
      }
    }catch(e){ warn('Boundary enforce failed', e); }
  }

  const stormWindowMs = 2000;
  const thresholds = { DEFAULT: 200, 'FRAME_TICK': 120, 'QUALITY_CHANGE': 30 };
  const q = []; // ring buffer of {t,evt}
  let wrapped = false;

  function wrapEmit(){
    const bus = window.BeatBus;
    if (!bus || wrapped || typeof bus.emit!=='function') return;
    const orig = bus.emit.bind(bus);
    bus.emit = function(evt, payload){
      lateEnforce();
      const t = Date.now(); q.push({t,evt});
      while(q.length && t - q[0].t > stormWindowMs) q.shift();
      const perSec = q.filter(x=>x.evt===evt).length * (1000/stormWindowMs);
      const limit = thresholds[evt] || thresholds.DEFAULT;
      if (perSec > limit) warn('Event storm?', evt, '≈', perSec.toFixed(1), '/sec');
      return orig(evt, payload);
    };
    wrapped = true;
    log('emit() telemetry active');
  }

  function tick(){
    lateEnforce();
    wrapEmit();
  }
  const id = setInterval(tick, 250);
  setTimeout(()=>clearInterval(id), 8000);

  // Optional shield (OFF by default) — coalesces high-frequency events
  const shield = {
    enabled:false,
    enable(){ this.enabled=true; log('Shield ON'); },
    disable(){ this.enabled=false; log('Shield OFF'); }
  };

  window.__DOCTOR = Object.assign(window.__DOCTOR||{}, {
    status(){ return { boundary: !!window.BeatBus?.__boundaryEnforced, eventsInWindow: q.length }; },
    shield
  });

  if (import.meta?.hot) {
    import.meta.hot.dispose(()=>{ try{ window.__STATECORE_SENTINEL_ACTIVE=false; }catch{} });
  }
})();`;
  writeFileSafe(devPath, code);
  return true;
}

function patchMainForSentinel() {
  const main = path.join(SRC, 'main.jsx');
  if (!fs.existsSync(main)) return false;
  let s = read(main);
  if (/dev\/statecore_doctor_sentinel\.js/.test(s)) return false;

  if (s.includes('if (import.meta.env.DEV)')) {
    s = s.replace(/if\s*\(import\.meta\.env\.DEV\)\s*{/, m =>
      `${m}\n  import('./dev/statecore_doctor_sentinel.js'); // @doctor:statecoresync`
    );
  } else {
    s += `\n\nif (import.meta.env.DEV) {\n  import('./dev/statecore_doctor_sentinel.js'); // @doctor:statecoresync\n}\n`;
  }
  writeFileSafe(main, s);
  return true;
}

function patchDisposeBlocks() {
  // Known modules & their singletons
  const targets = [
    { file: 'modules/state/BeatBusBridge.js', sym: 'beatBusBridge' },
    { file: 'modules/state/rendererBridge.js', sym: 'rendererBridge' },
    { file: 'modules/state/tierBridge.js', sym: 'tierBridge' },
    { file: 'modules/state/morphNavigation.js', sym: 'morphNavigation' }
  ];
  const changed = [];
  for (const t of targets) {
    const p = path.join(SRC, t.file);
    if (!fs.existsSync(p)) continue;
    let s = read(p);
    if (/@doctor:dispose/.test(s)) continue;

    const block =
`if (import.meta?.hot) {
  import.meta.hot.dispose(() => {
    try { ${t.sym}?.dispose?.(); } catch {}
  });
} // @doctor:dispose`;

    s = insertOnce(s, /import\.meta\.hot\.dispose/, block, '@doctor:dispose');
    writeFileSafe(p, s);
    changed.push(rel(p));
  }
  return changed;
}

// ---------- artifacts ----------
function writeArtifacts() {
  const dir = path.join(ROOT, 'doctor_artifacts');
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g,'-');
  const jsonPath = path.join(dir, `statecore-diagnostic-${stamp}.json`);
  const txtPath  = path.join(dir, `summary-${stamp}.txt`);
  const summary =
`StateCore Sync Diagnostic — ${stamp}
Files scanned: ${findings.filesScanned}
HMR: on=${findings.hmr.onCalls.length}, off=${findings.hmr.offCalls.length}, disposeBlocks=${findings.hmr.disposeBlocks.length}
BeatBus: instances=${findings.bus.instances.length}, windowExport=${!!findings.bus.windowExports.length}, boundaryCalls=${findings.bus.boundaryCalls.length}
Issues:
${findings.issues.map(i=>` - [${i.severity}] ${i.type} — ${i.msg}`).join('\n') || ' (none)' }
`;
  writeFileSafe(jsonPath, JSON.stringify({
    time: new Date().toISOString(),
    filesScanned: findings.filesScanned,
    hmr: {
      listeners: findings.hmr.onCalls.length,
      offs: findings.hmr.offCalls.length,
      disposeBlocks: findings.hmr.disposeBlocks.length
    },
    bus: {
      instances: findings.bus.instances,
      windowExport: !!findings.bus.windowExports.length,
      boundaryCalls: findings.bus.boundaryCalls.length
    },
    atoms: findings.atoms.found,
    issues: findings.issues
  }, null, 2));
  writeFileSafe(txtPath, summary);
  return { jsonPath, txtPath };
}

// ---------- run ----------
analyze();

let actions = [];
if (WRITE) {
  if (ensureDevSentinel()) actions.push('created DEV sentinel');
  if (patchMainForSentinel()) actions.push('patched main.jsx (DEV sentinel import)');
  const disp = patchDisposeBlocks();
  if (disp.length) actions.push('added dispose blocks: ' + disp.join(', '));
}

// Report
console.log(colors.c+'\n════════ StateCore Sync Doctor Report ════════'+colors.x);
console.log(`Files scanned: ${findings.filesScanned}`);
console.log(`HMR: on=${findings.hmr.onCalls.length}, off=${findings.hmr.offCalls.length}, dispose=${findings.hmr.disposeBlocks.length}`);
console.log(`BeatBus: instances=${findings.bus.instances.length}, windowExport=${!!findings.bus.windowExports.length}, boundaryCalls=${findings.bus.boundaryCalls.length}`);
if (actions.length) console.log(colors.g+'Actions: '+actions.join(' | ')+colors.x);
if (findings.issues.length) {
  console.log(colors.r+'Issues:'); findings.issues.forEach(i=>console.log(` - [${i.severity}] ${i.type}: ${i.msg}`)); console.log(colors.x);
} else {
  console.log(colors.g+'No blocking issues detected.'+colors.x);
}
const { jsonPath, txtPath } = writeArtifacts();
console.log(colors.c+`Artifacts written: ${path.relative(ROOT, jsonPath)}, ${path.relative(ROOT, txtPath)}`+colors.x);

// Exit codes
const fatal = findings.issues.some(i => /HIGH/.test(i.severity));
process.exit(STRICT && fatal ? 1 : 0);
s
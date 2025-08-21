#!/usr/bin/env node
/**
 * doctor_self_bootstrap.cjs
 * Self-bootstrapping Canon doctor:
 *  - Creates DEV runtime sentinel (late-enforce boundary + emit wrap)
 *  - Creates BeatBus shim (DEV-only fallback) and a tiny Render Probe
 *  - Safely APPENDS a DEV block to src/main.jsx (no risky replacements)
 *  - Ensures '@' alias in jsconfig.json (idempotent)
 *  - Adds npm scripts: doctor:bootstrap
 *
 * Usage:
 *   node scripts/doctor_self_bootstrap.cjs           # dry run (prints plan)
 *   node scripts/doctor_self_bootstrap.cjs --apply   # write files & patch main.jsx
 */

const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');
const ROOT = process.cwd();
const SRC  = path.join(ROOT, 'src');

const rel = (p) => path.relative(ROOT, p);
const log = (...a) => console.log(...a);
const ok  = (m) => console.log('\x1b[32m%s\x1b[0m', m);
const warn= (m) => console.log('\x1b[33m%s\x1b[0m', m);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    if (APPLY) fs.mkdirSync(dir, { recursive: true });
  }
}
function writeIfChanged(file, content) {
  if (fs.existsSync(file)) {
    const cur = fs.readFileSync(file, 'utf8');
    if (cur === content) return false;
  }
  if (APPLY) fs.writeFileSync(file, content, 'utf8');
  return true;
}
function appendDevBlockToMain(mainPath, blocks) {
  let src = fs.readFileSync(mainPath, 'utf8');
  let changed = false;

  // Ensure amplified init import present
  if (!src.includes(`./canon/init-amplified.js`)) {
    src = `import './canon/init-amplified.js';\n` + src;
    changed = true;
  }

  // DEV block (append-only; idempotent checks)
  const sentinel = `// __CANON_DEV_BLOCK__`;
  if (!src.includes(sentinel)) {
    const devBlock =
`\n\n${sentinel}
if (import.meta.env.DEV) {
  // runtime sentinel (late boundary + emit wrap)
  import('./dev/canonDoctorRuntime.js').then(()=>console.log('CanonMD runtime active')).catch(()=>{});
  // shim (only sets window.BeatBus if undefined)
  import('./dev/beatbusShim.js').catch(()=>{});
  // tiny visual probe
  import('./dev/renderProbe.js').catch(()=>{});
  // optional state index (tries relative first, then @ alias)
  (async () => {
    for (const p of ['./modules/state/index.js','@/modules/state/index.js']) {
      try { await import(/* @vite-ignore */ p); console.log('State loaded from', p); break; } catch {}
    }
  })();
}
`;
    src += devBlock;
    changed = true;
  }

  if (changed && APPLY) fs.writeFileSync(mainPath, src, 'utf8');
  return changed;
}

function upsertJsconfig() {
  const jsconfigPath = path.join(ROOT, 'jsconfig.json');
  let cfg = { compilerOptions: { baseUrl: '.', paths: {} } };
  if (fs.existsSync(jsconfigPath)) {
    try { cfg = JSON.parse(fs.readFileSync(jsconfigPath, 'utf8')); } catch {}
  }
  cfg.compilerOptions = cfg.compilerOptions || {};
  cfg.compilerOptions.baseUrl = cfg.compilerOptions.baseUrl || '.';
  cfg.compilerOptions.paths = cfg.compilerOptions.paths || {};
  // de-dupe and enforce the two core aliases
  cfg.compilerOptions.paths['@/*'] = ['src/*'];
  cfg.compilerOptions.paths['@/modules/*'] = ['src/modules/*'];
  const next = JSON.stringify(cfg, null, 2) + '\n';
  if (APPLY) fs.writeFileSync(jsconfigPath, next, 'utf8');
  return jsconfigPath;
}

function addNpmScripts() {
  const pkgPath = path.join(ROOT, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.scripts = pkg.scripts || {};
  if (!pkg.scripts['doctor:bootstrap']) {
    pkg.scripts['doctor:bootstrap'] = 'node scripts/doctor_self_bootstrap.cjs --apply';
  }
  if (APPLY) fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  return pkgPath;
}

// Files the doctor manages
const files = {
  main: path.join(SRC, 'main.jsx'),
  runtime: path.join(SRC, 'dev', 'canonDoctorRuntime.js'),
  shim: path.join(SRC, 'dev', 'beatbusShim.js'),
  probe: path.join(SRC, 'dev', 'renderProbe.js'),
};

// Contents
const runtimeContent = `// DEV runtime sentinel injected by doctor_self_bootstrap
(function(){
  const log = (...a)=>console.log('[CanonMD]', ...a);
  function enforce(){
    try{
      if (window.BeatBus && window.canon && window.canon.boundary && !window.BeatBus.__boundaryEnforced){
        window.canon.boundary.enforce(window.BeatBus);
        window.BeatBus.__boundaryEnforced = true;
        log('✅ boundary enforced (late-binding)');
      }
    }catch(e){ console.warn('[CanonMD] enforce failed', e); }
  }
  function wrapEmit(){
    const bus = window.BeatBus;
    if (!bus || bus.__emitWrapped) return;
    const orig = bus.emit?.bind(bus);
    if (typeof orig !== 'function') return;
    bus.emit = function(evt, payload){
      if (!bus.__boundaryEnforced) enforce();
      try { return orig(evt, payload); }
      finally {
        if (Array.isArray(window.__CANONMD_EMITS)) window.__CANONMD_EMITS.push({evt, t: Date.now()});
      }
    };
    bus.__emitWrapped = true;
    log('emit() wrapped for telemetry');
  }
  function start(){
    window.__CANONMD_EMITS = window.__CANONMD_EMITS || [];
    enforce();
    wrapEmit();
    const id = setInterval(()=>{ enforce(); wrapEmit(); }, 250);
    setTimeout(()=>clearInterval(id), 5000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();`;

const shimContent = `// BeatBus shim (DEV-only fallback). If window.BeatBus already exists, this does nothing.
(function(){
  if (typeof window === 'undefined') return;
  if (window.BeatBus) return;
  const listeners = new Map();
  const bus = {
    listeners,
    on(evt, fn){ let s=listeners.get(evt); if(!s){s=new Set(); listeners.set(evt,s);} s.add(fn); return ()=>s.delete(fn); },
    off(evt, fn){ const s=listeners.get(evt); if(s) s.delete(fn); },
    emit(evt, payload){ const s=listeners.get(evt); if(s) for (const fn of s) { try{ fn(payload); }catch(e){ console.error('[BeatBusShim] listener error', e);} } return true; },
    getListenerCount(evt){ if (evt) return (listeners.get(evt)?.size)||0; let n=0; listeners.forEach(s=>n+=s.size); return n; },
    getMetrics(){ return { listeners: this.getListenerCount() }; },
    getDebugInfo(){ const map={}; listeners.forEach((s,k)=>map[k]=s.size); return { listeners: map, lastEmit: this.lastEmit }; }
  };
  const _emit = bus.emit.bind(bus);
  bus.emit = (evt, payload)=>{ bus.lastEmit = { evt, payload, timestamp: Date.now() }; return _emit(evt, payload); };
  window.BeatBus = bus;
  console.warn('[BeatBusShim] Using lightweight shim in DEV until real BeatBus is wired.');
})();`;

const probeContent = `// Tiny render probe overlay
(function(){
  if (typeof window==='undefined') return;
  if (window.__CANON_RENDER_PROBE__) return;
  window.__CANON_RENDER_PROBE__ = true;

  const style = document.createElement('style');
  style.textContent = \`
    #canon-probe{position:fixed;top:8px;left:8px;z-index:999999;padding:6px 8px;
      background:rgba(0,0,0,.8);color:#0f0;font:11px/1.2 monospace;border:1px solid #0f0;border-radius:4px}
  \`;
  document.head.appendChild(style);

  const box = document.createElement('div');
  box.id='canon-probe';
  box.textContent='Probe starting…';
  document.body.appendChild(box);

  let last=performance.now(), frames=0, fps=0;
  function loop(t){
    frames++;
    if (t-last>=1000) { fps=frames; frames=0; last=t; }
    const bus = window.BeatBus;
    const listeners = bus?.getListenerCount ? bus.getListenerCount() : 0;
    const mode = window.canon?.boundary?.mode || 'n/a';
    box.textContent = \`FPS \${fps} | listeners \${listeners} | mode \${mode}\`;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();`;

// PLAN
const plan = [];
if (!fs.existsSync(files.main)) plan.push(`- ERROR: ${rel(files.main)} not found`);
plan.push(`- ensure ${rel(files.runtime)}`);
plan.push(`- ensure ${rel(files.shim)}`);
plan.push(`- ensure ${rel(files.probe)}`);
plan.push(`- append DEV block to ${rel(files.main)} (idempotent)`);
plan.push(`- ensure @ alias in jsconfig.json`);
plan.push(`- add npm script "doctor:bootstrap"`);

// PRINT PLAN
console.log('\n🩺 Self-Bootstrap Doctor — PLAN');
plan.forEach((p) => console.log('  ', p));

// EXECUTE
if (!APPLY) { warn('\n(dry run) pass --apply to write files\n'); process.exit(0); }

if (!fs.existsSync(files.main)) {
  console.error(`\n❌ Cannot continue: ${rel(files.main)} not found`);
  process.exit(1);
}

// write dev files
ensureDir(path.dirname(files.runtime));
const w1 = writeIfChanged(files.runtime, runtimeContent);
const w2 = writeIfChanged(files.shim, shimContent);
const w3 = writeIfChanged(files.probe, probeContent);
if (w1) ok(`wrote ${rel(files.runtime)}`); else log(`kept  ${rel(files.runtime)}`);
if (w2) ok(`wrote ${rel(files.shim)}`);    else log(`kept  ${rel(files.shim)}`);
if (w3) ok(`wrote ${rel(files.probe)}`);   else log(`kept  ${rel(files.probe)}`);

// patch main.jsx
const changed = appendDevBlockToMain(files.main);
if (changed) ok(`patched ${rel(files.main)} (DEV block appended)`); else log(`kept  ${rel(files.main)} (DEV block present)`);

// jsconfig alias
const jsconfigPath = upsertJsconfig();
ok(`ensured ${rel(jsconfigPath)} with '@/*' and '@/modules/*' aliases`);

// package.json scripts
const pkgPath = addNpmScripts();
if (pkgPath) ok(`ensured ${rel(pkgPath)} has "doctor:bootstrap"`);

console.log('\n✅ Self-Bootstrap complete.');
console.log('   Next: restart dev server. In console, try:');
console.log("     window.canon?.boundary?.getReport?.()");
console.log("     BUS = window.BeatBus; BUS?.emit?.('STAGE_CHANGE', { from:'boot', to:'genesis' })");
console.log("     BUS?.emit?.('QUALITY_CHANGE', { quality:'ULTRA' })  // migration -> {tier:'ULTRA'}");

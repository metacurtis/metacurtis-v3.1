#!/usr/bin/env node
/* Dev-OS One-Touch v1.1 (CommonJS, idempotent)
 * - Installs Canon Dev-OS injector v3.4 (host-gated, DOM-ready, BeatBus counters, /@fs fallback)
 * - Wires src/App.jsx with absolute DEV import
 * - Adds scripts: canon:verify, ci:fencepost
 * - Writes docs: docs/Canon-Dev-OS.md, docs/Dev-OS-Quick-Ops.md
 * - Retires known stubs; backs up all touched files to .canon_backups/
 * - Prints a clear summary
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const rel = (p) => path.relative(ROOT, p);
const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, s) => fs.writeFileSync(p, s, 'utf8');
const exists = (p) => fs.existsSync(p);
const mkdirp = (p) => fs.mkdirSync(p, { recursive: true });
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');
const BACKUPS = path.join(ROOT, '.canon_backups'); mkdirp(BACKUPS);
const backup = (p) => { const b = path.join(BACKUPS, rel(p).replace(/[\\/]/g, '__') + '.bak.' + stamp()); fs.cpSync(p, b); return b; };
function writeIfChanged(p, s) { if (exists(p) && read(p) === s) return { changed: false }; if (exists(p)) backup(p); mkdirp(path.dirname(p)); write(p, s); return { changed: true }; }
function ensureLine(p, line) { const cur = exists(p) ? read(p) : ''; if (cur.includes(line)) return false; write(p, (cur.trimEnd() + '\n' + line + '\n').replace(/\n{3,}/g, '\n\n')); return true; }

const summary = [];
function note(k, v) { summary.push([k, v]); }

/* 1) Injector v3.4 (drop-in, as a literal string) */
const INJECT = path.join(ROOT, 'canon-console/browser/inject.js');
const injector_v34 = `/* Canon Dev-OS Injector v3.4
 * DEV-only (by host), idempotent, DOM-ready, BeatBus counters, /@fs fallback, early stats()
 */
(()=>{ if(typeof window==='undefined') return; const w=window;
const isDevHost=/^(localhost|127\\.|0\\.0\\.0\\.0)$/i.test(location.hostname);
const forceOn=!!w.__CANON_FORCE_DEV__||localStorage.getItem('canonDevOsEnabled')==='1';
if(!(isDevHost||forceOn)) return;
if(w.__canonInjectorV3__&&w.__canonInjectorV3__.alive===true) return;
if(!w.__canonInjectorV3__) w.__canonInjectorV3__={ts:Date.now(),alive:false};
var CANON_INJECTOR=w.CANON_INJECTOR||{}; w.CANON_INJECTOR=CANON_INJECTOR;
var L=CANON_INJECTOR.loaded||{bridge:false,pilot:false,vtap:false,mini:false,hud:false,steps:false,plays:false};
CANON_INJECTOR.loaded=L;

var CANON_CONSOLE=w.CANON_CONSOLE||{}; w.CANON_CONSOLE=CANON_CONSOLE;
var busCounts=CANON_CONSOLE.busCounts||{emit:0,on:0,off:0}; CANON_CONSOLE.busCounts=busCounts;
var errors=CANON_CONSOLE.errors||[]; CANON_CONSOLE.errors=errors;

CANON_CONSOLE.stats=function(){ return { loaded:Object.assign({},L), bus:Object.assign({},busCounts), mode:(localStorage.getItem('canonBusMode')||'STRICT'), ts:w.__canonInjectorV3__.ts, errors:errors.slice() }; };
CANON_CONSOLE.setMode=function(m){ try{ localStorage.setItem('canonBusMode',m); location.reload(); }catch(e){ errors.push(e); } };
CANON_CONSOLE.showHud=function(){ try{ localStorage.setItem('canonHud:visible','true'); var el=document.getElementById('canon-hud-v2'); if(el) el.classList.add('show'); }catch(e){ errors.push(e);} };
CANON_CONSOLE.hideHud=function(){ try{ localStorage.setItem('canonHud:visible','false'); var el=document.getElementById('canon-hud-v2'); if(el) el.classList.remove('show'); }catch(e){ errors.push(e);} };

var resolveReady=null; var readyP=new Promise(function(r){ resolveReady=r; }); CANON_INJECTOR.ready=function(){ return readyP; };
var CORE=['bridge','pilot','vtap','hud']; function maybeReady(){ for(var i=0;i<CORE.length;i++){ if(!L[CORE[i]]) return; } if(resolveReady) resolveReady(); }

try{ if(localStorage.getItem('canonHud:visible')==null) localStorage.setItem('canonHud:visible','true'); }catch(e){}

function domReady(){ return new Promise(function(r){ if(document.readyState==='complete'||document.readyState==='interactive') r(); else document.addEventListener('DOMContentLoaded', function(){ r(); }, {once:true}); }); }

var FS_ROOT = w.__CANON_FS_BASE__ || '/@fs/home/curtis/projects/metacurtis-v3.1';
function tryImport(spec){ return import(/* @vite-ignore */ spec).catch(function(){ return null; }); }
function imp(rel, flag, onload){
  var p1='/canon-console/'+rel, p2=FS_ROOT+'/canon-console/'+rel;
  return tryImport(p1).then(function(mod){ return mod || tryImport(p2); })
  .then(function(mod){
    if(!mod){ console.warn('[Canon] Failed to load', rel, '(tried', p1, 'and', p2, ')'); return null; }
    if(flag) L[flag]=true;
    if(onload) return Promise.resolve(onload(mod)).then(function(){ maybeReady(); return mod; });
    maybeReady(); return mod;
  });
}

function installBusCounters(){
  try{
    var bus=w.BeatBus; if(!bus||bus.__canon_patched) return !!bus;
    var emit=bus.emit&&bus.emit.bind?bus.emit.bind(bus):null;
    var on=bus.on&&bus.on.bind?bus.on.bind(bus):null;
    var off=bus.off&&bus.off.bind?bus.off.bind(bus):null;
    if(!emit||!on||!off) return false;
    bus.emit=function(){ busCounts.emit++; return emit.apply(bus, arguments); };
    bus.on=function(){ busCounts.on++; return on.apply(bus, arguments); };
    bus.off=function(){ busCounts.off++; return off.apply(bus, arguments); };
    bus.__canon_patched=true; return true;
  }catch(e){ errors.push(e); return false; }
}

function resolveBusAndPatch(){
  if(installBusCounters()) return;
  var cands=['/src/theater/bus','/src/theater/bus.js','/src/theater/bus/index.js', FS_ROOT+'/src/theater/bus', FS_ROOT+'/src/theater/bus.js'];
  (function next(i){
    if(i>=cands.length){
      var t0=performance.now(); var iv=setInterval(function(){
        if(installBusCounters()||performance.now()-t0>2000) clearInterval(iv);
      },100); return;
    }
    tryImport(cands[i]).then(function(mod){
      if(mod){
        var b=mod.default||mod.BeatBus||mod;
        if(b) w.BeatBus=b;
        if(installBusCounters()) return;
      }
      next(i+1);
    });
  })(0);
}
resolveBusAndPatch();

(function(){
  imp('runtime/bridge-guard.js','bridge')
  .then(function(){ return imp('agent/policy.js', null); })
  .then(function(){ return imp('agent/pilot.js','pilot', function(m){ try{ if(typeof m.startPilot==='function'){ return m.startPilot({auto:true}).then(function(st){ w.CANON_PILOT = st || w.CANON_PILOT || {}; }); } }catch(e){ errors.push(e); } }); })
  .then(function(){ return imp('runtime/violation-tap.js','vtap'); })
  .then(function(){ return domReady(); })
  .then(function(){ installBusCounters(); })
  .then(function(){ return imp('runtime/pilot-ui-mini.js','mini'); })
  .then(function(){ return imp('runtime/hud.js','hud', function(){ try{ var el=document.getElementById('canon-hud-v2'); if(!el) return; if(localStorage.getItem('canonHud:visible')!=='false') el.classList.add('show'); requestAnimationFrame(function(){ el.classList.add('show'); }); setTimeout(function(){ var el2=document.getElementById('canon-hud-v2'); if(el2) el2.classList.add('show'); }, 800); }catch(e){ errors.push(e);} }); })
  .then(function(){ return imp('runtime/steps.js','steps'); })
  .then(function(){ return imp('runtime/playbooks.js','plays'); })
  .then(function(){ w.__canonInjectorV3__.alive=true; console.debug('[Canon] injector v3.4 ready:', w.CANON_CONSOLE.stats()); maybeReady(); });
})();
})();`;

const injChange = writeIfChanged(INJECT, injector_v34); note('Injector', injChange.changed ? 'installed/updated' : 'ok');

/* 2) Wire App.jsx DEV import */
const APP = path.join(ROOT, 'src/App.jsx');
if (exists(APP)) {
  let s = read(APP);
  const block =
`// DEV: Canon Dev-OS injector (idempotent, absolute from Vite root)
if (typeof window !== 'undefined') {
  try {
    if (import.meta && import.meta.env && import.meta.env.DEV) {
      void import('/canon-console/browser/inject.js');
    } else if (/^(localhost|127\\.|0\\.0\\.0\\.0)$/.test(location.hostname)) {
      void import('/canon-console/browser/inject.js');
    }
  } catch {
    void import('/canon-console/browser/inject.js');
  }
}`;
  if (s.indexOf("canon-console/browser/inject.js") === -1) {
    backup(APP); write(APP, block + '\n\n' + s); note('App.jsx', 'wired (DEV import added)');
  } else {
    note('App.jsx', 'ok');
  }
} else {
  note('App.jsx', 'missing (skipped)');
}

/* 3) Remove legacy injector if present */
const LEG = path.join(ROOT, 'console/runtime/inject.js');
if (exists(LEG)) { backup(LEG); fs.rmSync(LEG); note('Legacy injector', 'removed'); } else { note('Legacy injector', 'not present'); }

/* 4) Retire known stubs */
const RET_DIR = path.join(ROOT, 'canon-console/_retired'); mkdirp(RET_DIR);
const retire = [
  'canon-console/browser/collectors/atomCollector.js',
  'canon-console/browser/collectors/eventCollector.js',
  'canon-console/browser/rules/importRules.js',
  'canon-console/browser/rules/shaderRules.js',
  'canon-console/agent/lib/analyzer.js',
  'canon-console/agent/lib/deduper.js',
  'canon-console/agent/lib/fingerprint.js',
  'canon-console/store/indexedDBStore.js',
  'canon-console/ui/ConsoleOverlay.jsx',
  'canon-console/ui/IncidentList.jsx',
  'canon-console/sinks/beatbusSink.js'
];
let retired = 0;
for (const r of retire) {
  const p = path.join(ROOT, r);
  if (!exists(p)) continue;
  const sz = fs.statSync(p).size;
  const lines = read(p).split(/\r?\n/).length;
  if (sz <= 10 || lines <= 2) {
    const dst = path.join(RET_DIR, path.basename(p));
    backup(p); fs.renameSync(p, dst); retired++;
  }
}
note('Retired stubs', retired);

/* 5) Install fixed verify script */
const VERIFY = path.join(ROOT, 'scripts/canon-console-verify.mjs');
const verifySrc = `#!/usr/bin/env node
import fs from 'node:fs'; import path from 'node:path';
const ROOT=process.cwd(), rel=p=>path.relative(ROOT,p), read=p=>fs.readFileSync(p,'utf8'), ex=p=>fs.existsSync(p);
const fails=[], warns=[];
const app=path.join(ROOT,'src/App.jsx');
if(!ex(app)) fails.push('Missing src/App.jsx');
else{ const s=read(app);
  if(!/canon-console\\/browser\\/inject\\.js/.test(s)) fails.push('App.jsx missing DEV import of canon-console/browser/inject.js');
  if(/console\\/runtime\\/inject\\.js/.test(s)) fails.push('App.jsx references legacy console/runtime/inject.js');
}
const legacy=path.join(ROOT,'console/runtime/inject.js'); if(ex(legacy)) fails.push('Legacy injector still exists: console/runtime/inject.js');
const inj=path.join(ROOT,'canon-console/browser/inject.js');
if(!ex(inj)) fails.push('Missing modern injector: canon-console/browser/inject.js');
else{ const s=read(inj); if(!/__canonInjectorV3__/.test(s)) warns.push('Injector missing __canonInjectorV3__ marker'); if(!/busCounts/.test(s)||!/__canon_patched/.test(s)) warns.push('Injector may be missing BeatBus counters'); }
const hud=path.join(ROOT,'canon-console/runtime/hud.js'); if(!ex(hud)) fails.push('Missing HUD v2: canon-console/runtime/hud.js');
if(fails.length){ console.error('⛔ Canon Console Verify: FAIL'); for(const f of fails) console.error(' -', f); if(warns.length){console.error('\\nWarnings:'); for(const w of warns) console.error(' -', w);} process.exit(1);}
console.log('✅ Canon Console Verify: PASS'); if(warns.length){ console.log('\\nWarnings:'); for(const w of warns) console.log(' -', w); }`;
writeIfChanged(VERIFY, verifySrc); try{ fs.chmodSync(VERIFY, 0o755); }catch(_){};
note('canon:verify', 'installed/updated');

/* 6) Headless fencepost check */
const CI = path.join(ROOT, 'scripts/ci/opening-fencepost-check.mjs');
const ciSrc = `#!/usr/bin/env node
const TIMEOUT_MS = 15000;
(async()=>{ let pw; try{ pw = await import('playwright'); }catch{ console.log('Playwright not installed. Run: npx playwright install'); process.exit(3); }
  const { chromium } = pw; const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    const url = process.env.CANON_DEV_URL || 'http://localhost:5173';
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.evaluate(()=>{ localStorage.setItem('canonHud:visible','true'); localStorage.setItem('canonBusMode','TELEMETRY'); });
    await page.reload({ waitUntil:'domcontentloaded' });
    await page.waitForFunction(()=>window.CANON_INJECTOR&&window.CANON_INJECTOR.ready, { timeout: 5000 });
    await page.evaluate(()=>window.CANON_INJECTOR.ready());
    const ok = await page.evaluate(({timeout})=>new Promise(res=>{
      let done=false; const to=setTimeout(()=>{ if(!done) res(false); }, timeout);
      const off = window.BeatBus?.on?.('PARTICLES_EMERGED', ()=>{ if(!done){ done=true; clearTimeout(to); res(true);} });
      window.theaterDirector?.forceStart?.();
    }), { timeout: TIMEOUT_MS });
    await browser.close(); if(ok){ console.log('Fencepost OK'); process.exit(0); }
    console.error('Fencepost TIMEOUT'); process.exit(2);
  } catch(e) { await browser.close(); console.error('Fencepost ERROR:', e&&e.message||e); process.exit(2); }
})();`;
writeIfChanged(CI, ciSrc); try{ fs.chmodSync(CI, 0o755); }catch(_){};
note('ci:fencepost', 'installed/updated');

/* 7) package.json scripts */
const PKG = path.join(ROOT, 'package.json');
if (exists(PKG)) {
  const j = JSON.parse(read(PKG));
  j.scripts = j.scripts || {};
  if (!j.scripts['canon:verify']) j.scripts['canon:verify'] = 'node scripts/canon-console-verify.mjs';
  if (!j.scripts['ci:fencepost']) j.scripts['ci:fencepost'] = 'node scripts/ci/opening-fencepost-check.mjs';
  writeIfChanged(PKG, JSON.stringify(j, null, 2));
  note('package.json', 'scripts ensured');
} else {
  note('package.json', 'missing');
}

/* 8) .gitignore hygiene */
const GI = path.join(ROOT, '.gitignore');
ensureLine(GI, '.canon_backups/');
ensureLine(GI, '.hotdors_backups/');
ensureLine(GI, '.vision/telemetry/');
note('.gitignore', 'updated');

/* 9) Docs */
const DOCS = path.join(ROOT, 'docs'); mkdirp(DOCS);
const DOC1 = path.join(DOCS, 'Canon-Dev-OS.md');
const DOC2 = path.join(DOCS, 'Dev-OS-Quick-Ops.md');
const canonDoc = `# Canon Dev-OS (Blueprint)
(What it is, architecture, roles, non-negotiables, modes, commands, incident model, extension guide)

**One-liner:** A development operating layer that wires a single injector, HUD v2, runtime guardrails, Sentinel (static/structural checks), Vision (timing contracts), and Agent/Pilot (automation) around your BeatBus so you can declare intent, measure it, auto-correct drift, and block regressions.

## Core roles
- Injector: DEV-only, idempotent boot; loads Bridge-Guard → Policy → Pilot → Violation-Tap → mini HUD → HUD v2 → Steps/Playbooks; installs BeatBus counters before HUD.
- HUD v2: incidents, macros (Opening/FPS), Steps/Playbooks, Pilot controls, bus stats. Toggle with Alt+\`.
- Bridge-Guard: Guard/Canon warnings → incidents.
- Violation-Tap: console “Canon violation/Guard …” → incidents.
- Pilot/Policy: automation; propose/apply safe remediations (e.g., drawRange scale).
- Steps/Playbooks: small safe fixes (Fix drawRange, Verify FPS).
- Sentinel: static/structural/fencepost checks (Strict/Relaxed).
- Vision: timing contract (cursor/typing/fill/min-fill) + telemetry validator.
- BeatBus: event spine; injector wraps emit/on/off so HUD shows live counters.

## Non-negotiables
- One injector • One GPU writer • One timing contract • One fencepost (PARTICLES_EMERGED once after first full bind).

## Modes & switches
\`\`\`js
localStorage.setItem('canonBusMode','TELEMETRY'); location.reload(); // tune
localStorage.setItem('canonBusMode','STRICT'); location.reload();    // gate
\`\`\`

## Commands
- \`npm run validate:opening\` — structural openings checks (Strict/Relaxed with SST_RELAXED=1)
- \`npm run ci:fencepost\` — headless fencepost check (0 OK, 2 timeout, 3 playwright missing)
- \`npm run canon:verify\` — injector/HUD presence, no legacy
- Vision record/validate (if available): \`npm run agent:run -- --goal=opening:record\`, \`npm run validate:vision\`

## Extend without drift
- New beat → events.js + Director schedule + Overlay/Renderer handler + Vision tolerance if time-critical.
- New macro → HUD; optionally headless twin for CI.
- New remediation → Step (+ Playbook); wire into Policy for Pilot suggestions.
`;
const quickDoc = `# Dev-OS Quick Ops (Minimal Day-to-Day)
**Goal:** Max velocity, low complexity.

## Loop (5 steps)
1) \`npm run dev\` → HUD (Alt+\`) → **Run Opening Macro** → **Verify FPS**
2) Tune **Director** offsets; renderer only **lerps**; overlay stays **dumb**
3) \`npm run validate:opening\` (STRICT)  •  If iterating: \`SST_RELAXED=1 npm run validate:opening\`
4) (Optional) \`npm run ci:fencepost\` for opening changes
5) Commit when green

## Helpers
\`\`\`js
await window.CANON_INJECTOR?.ready?.();
window.CANON_CONSOLE.stats();           // flags + bus counts + mode
window.theaterDirector?.forceStart?.(); // kick opening
window.hotdors?.selfverifyATS?.();      // event order
CANON_CONSOLE?.runStep?.('set_draw_range_from_uniforms');
\`\`\`

## Keep it simple
- One injector • One writer • One contract • One fencepost.
`;
writeIfChanged(DOC1, canonDoc); writeIfChanged(DOC2, quickDoc);
note('Docs', 'Canon-Dev-OS.md & Dev-OS-Quick-Ops.md installed');

/* 10) Final summary */
console.log('—— Dev-OS One-Touch Summary ——');
for (const [k,v] of summary) console.log('•', k+':', v);
console.log('\nNext:');
console.log('  1) npm run canon:verify');
console.log('  2) npm run dev   (Alt+` to open HUD)');
console.log('  3) npm run validate:opening   (STRICT check)');
console.log('  4) npm run ci:fencepost       (headless fencepost)');

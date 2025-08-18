#!/usr/bin/env node
'use strict';
/**
 * doctor-sequence-tap.cjs
 * - Adds debug-sequencer (BeatBus tap + timeline + CANON_SEQ)
 * - Adds EmergenceEventShims (DEV) if missing
 * - Disables Pilot Auto in DEV (pilot-dev-toggle)
 * - Ensures both modules are imported from console injector AND main.jsx
 * Idempotent; use --commit to snapshot + tag.
 */
const fs=require('fs'), path=require('path'), cp=require('child_process');
const R=process.cwd(), P=(...x)=>path.join(R,...x);
const read=p=>fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';
const ensure=d=>{ if(!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true}); };
const backup=p=>{ if(fs.existsSync(p) && !fs.existsSync(p+'.bak')) fs.copyFileSync(p,p+'.bak'); };
const write=(p,s)=>{ ensure(path.dirname(p)); const cur=read(p); if(cur===s) return 'ok'; backup(p); fs.writeFileSync(p,s,'utf8'); return 'wrote'; };

const seqPath = P('canon-console/runtime/debug-sequencer.js');
const seqCode = `// Debug Sequencer + BeatBus Tap (DEV)
import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';
import { EVENTS as E } from '@/theater/events.js';

(function arm(){
  if (globalThis.__CANON_SEQ_ARMED__) { console.log('✓ Sequencer already armed'); return; }
  globalThis.__CANON_SEQ_ARMED__ = true;

  // Tap bus.emit for visibility
  try {
    const orig = BeatBus.emit?.bind(BeatBus);
    if (!BeatBus.__tapped && typeof orig === 'function') {
      BeatBus.emit = (ev, payload) => {
        const t = Math.round(performance.now());
        console.log('📡 BUS EMIT', ev, { t, ...(payload||{}) });
        return orig(ev, payload);
      };
      BeatBus.__tapped = true;
      console.log('✅ BeatBus tap active');
    }
  } catch (e) { console.warn('BeatBus tap failed', e); }

  // Timeline listeners
  const WANT = [
    'PREWARM_GENESIS_BLUEPRINT','PREWARM_COMPLETE','BUILD_EMERGENCE_BLUEPRINT',
    'BLUEPRINT_READY','PARTICLES_START_EMERGING','PARTICLES_EMERGED'
  ];
  const KEYS = WANT.map(k => E[k] || k);
  const log = [];
  const offs = KEYS.map(ev => BeatBus.on(ev, payload => {
    const t = performance.now();
    log.push({ ev, t, payload });
    const dt = log.length>1 ? Math.round(t - log[log.length-2].t) : 0;
    console.log('🧭 seq', ev, { dt });
  }));

  function dump(){
    const rows = log.map((x,i)=>({ i, ev:x.ev, dt: i? Math.round(x.t-log[i-1].t):0 }));
    if (rows.length) { console.groupCollapsed('🧭 Emergence timeline'); console.table(rows); console.groupEnd(); }
    else { console.log('🧭 No events captured yet'); }
  }
  function clear(){ log.length=0; console.log('🧭 seq log cleared'); }
  async function probe(){
    try { BeatBus.emit(E.PREWARM_GENESIS_BLUEPRINT); } catch {}
    try { BeatBus.emit(E.BUILD_EMERGENCE_BLUEPRINT, { sourceText:'HELLO CURTIS', count:2000 }); } catch {}
    console.log('🧪 probe fired (prewarm + build)');
    setTimeout(()=>{
      const seen = log.some(x=>x.ev === (E.PARTICLES_EMERGED || 'PARTICLES_EMERGED'));
      if (!seen) console.warn('⚠️ No PARTICLES_EMERGED within 6s — check renderer mount / DEV shim');
    }, 6000);
  }
  globalThis.CANON_SEQ = { dump, clear, probe, log, offs };
  console.log('✅ Sequencer debug armed (CANON_SEQ)');
})();`;

const shimPath = P('src/theater/EmergenceEventShims.js');
const shimCode = `// EmergenceEventShims (DEV) — synthesize PARTICLES_EMERGED when Points appear
if (!globalThis.__EMERGENCE_EVENT_SHIMS_V3__) {
  globalThis.__EMERGENCE_EVENT_SHIMS_V3__ = true;
  (async () => {
    try {
      const BeatBus = (await import('@/modules/orchestration/core/BeatBusAdapter.js')).default;
      const { EVENTS:E } = await import('@/theater/events.js');

      // Mark prewarm completion if engine forgets to emit it
      BeatBus.on(E.PREWARM_GENESIS_BLUEPRINT, () => {
        setTimeout(()=>BeatBus.emit(E.PREWARM_COMPLETE, { via:'shim' }), 0);
      });

      // After READY, watch for Points and emit EMERGED
      BeatBus.on(E.BLUEPRINT_READY, () => {
        const t0 = performance.now();
        const tryEmit = () => {
          const scene = (window.__r3f || window)?.scene;
          let ok=false;
          scene?.traverse?.(o => { if (o?.isPoints || o?.type === 'Points') ok = true; });
          if (ok) {
            BeatBus.emit(E.PARTICLES_EMERGED, { via:'shim', ms: Math.round(performance.now()-t0) });
            return true;
          }
          return false;
        };
        const iv = setInterval(()=>{ if (tryEmit()) clearInterval(iv); }, 250);
        setTimeout(()=>{ clearInterval(iv); if (!tryEmit()) console.warn('⚠️ Shim: no Points detected; EMERGED not fired'); }, 6500);
      });

      console.log('✅ EmergenceEventShims v3 active (DEV)');
    } catch (e) {
      console.warn('Shim init failed', e);
    }
  })();
}`;

const pilotOffPath = P('canon-console/runtime/pilot-dev-toggle.js');
const pilotOffCode = `// DEV: turn Pilot Auto OFF to avoid interference during sequencing debug
setTimeout(()=>{ try { globalThis.CANON_PILOT?.setAuto?.(false); console.log('⏹ Pilot Auto OFF (DEV)'); } catch {} }, 0);`;

const injectPath = P('canon-console/browser/inject.js');
let inject = read(injectPath);
if (!inject) { console.error('✖ Missing canon-console/browser/inject.js'); process.exit(1); }

function ensureInDevBlock(src, importLine){
  if (src.includes(importLine)) return src;
  const m = src.match(/if\s*\(\s*import\.meta\.env\.DEV\s*\)\s*\{/);
  if (m) {
    return src.replace(m[0], m[0] + `\n  try { await import(${JSON.stringify(importLine)}); } catch(e) { console.warn('dev import failed', ${JSON.stringify(importLine)}, e); }`);
  }
  // append a DEV block
  return src + `\n\nif (import.meta.env.DEV) {\n  try { await import(${JSON.stringify(importLine)}); } catch(e) { console.warn('dev import failed', ${JSON.stringify(importLine)}, e); }\n}\n`;
}

inject = ensureInDevBlock(inject, '../runtime/pilot-dev-toggle.js');
inject = ensureInDevBlock(inject, '../runtime/debug-sequencer.js');
inject = ensureInDevBlock(inject, '@/theater/EmergenceEventShims.js');

const mainPath = P('src/main.jsx');
let main = read(mainPath);
if (main) {
  function addLazy(src, line){
    return src.includes(line) ? src : src.replace(/if\s*\(\s*import\.meta\.env\.DEV\s*\)\s*\{\s*/m,
      m => `${m}  import(${JSON.stringify(line)}).catch(()=>{});\n`);
  }
  if (/if\s*\(\s*import\.meta\.env\.DEV/.test(main)) {
    main = addLazy(main, '/canon-console/runtime/debug-sequencer.js');
    main = addLazy(main, '/src/theater/EmergenceEventShims.js');
  } else {
    main += `\nif (import.meta.env.DEV) {\n  import('/canon-console/runtime/debug-sequencer.js').catch(()=>{});\n  import('/src/theater/EmergenceEventShims.js').catch(()=>{});\n}\n`;
  }
}

const r1 = write(seqPath, seqCode);
const r2 = write(shimPath, shimCode);
const r3 = write(pilotOffPath, pilotOffCode);
const r4 = write(injectPath, inject);
const r5 = main ? write(mainPath, main) : 'ok';

if (process.argv.includes('--commit')) {
  try {
    cp.execSync('git add -A', { stdio:'inherit' });
    cp.execSync('git commit -m "chore(dev): arm Sequencer + Emergence shim; Pilot Auto OFF in DEV" --no-verify', { stdio:'inherit' });
    const tag='doctor_sequence_tap_' + new Date().toISOString().replace(/[:.]/g,'-');
    cp.execSync(`git tag ${tag}`, { stdio:'inherit' });
    console.log('✅ committed & tagged:', tag);
  } catch(e) {
    console.log('⚠ commit/tag skipped:', e.message);
  }
}

console.log('—— Summary ——');
console.log((r1==='wrote'?'✍️ ':'✓ ') + path.relative(R, seqPath));
console.log((r2==='wrote'?'✍️ ':'✓ ') + path.relative(R, shimPath));
console.log((r3==='wrote'?'✍️ ':'✓ ') + path.relative(R, pilotOffPath));
console.log((r4==='wrote'?'✍️ ':'✓ ') + path.relative(R, injectPath));
if (mainPath) console.log((r5==='wrote'?'✍️ ':'✓ ') + path.relative(R, mainPath));

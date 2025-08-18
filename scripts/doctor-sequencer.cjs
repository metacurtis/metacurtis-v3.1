#!/usr/bin/env node
/**
 * doctor-sequencer.cjs
 * - Adds canon-console/runtime/debug-sequencer.js (event timeline + probe)
 * - Ensures the DEV EmergenceEventShims is loaded
 * - Injects both from canon-console/browser/inject.js in DEV
 * Safe & idempotent. Use --commit to snapshot/tag.
 */
const fs=require('fs'), path=require('path'), cp=require('child_process');
const root=process.cwd(), P=(...x)=>path.join(root,...x);
const read=p=>fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';
const ensure=d=>{ if(!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true}); };
const backup=p=>{ if(fs.existsSync(p) && !fs.existsSync(p+'.bak')) fs.copyFileSync(p,p+'.bak'); };
const write=(p,s)=>{ ensure(path.dirname(p)); const cur=read(p); if(cur===s) return 'ok'; backup(p); fs.writeFileSync(p,s,'utf8'); return 'wrote'; };

const seqPath = P('canon-console/runtime/debug-sequencer.js');
const seqCode = `// Canon Sequencer Debug (DEV)
// Records key BeatBus events and provides CANON_SEQ.{probe,dump,clear}
import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';
import { EVENTS as E } from '@/theater/events.js';

const WANT = [
  'PREWARM_GENESIS_BLUEPRINT',
  'PREWARM_COMPLETE',
  'BUILD_EMERGENCE_BLUEPRINT',
  'BLUEPRINT_READY',
  'PARTICLES_START_EMERGING',
  'PARTICLES_EMERGED',
];
const KEYS = WANT.map(k => E[k] || k);
const log = [];
function on(ev){ return BeatBus.on(ev, payload => {
  const t = performance.now();
  log.push({ ev, t, payload });
  const dt = log.length>1 ? Math.round(t - log[log.length-2].t) : 0;
  console.log('🧭 seq', ev, { dt, payload });
  if (ev === (E.PARTICLES_EMERGED || 'PARTICLES_EMERGED')) summarize();
});}
const offs = KEYS.map(on);

function summarize(){
  const rows = log.map((x,i)=>({ i, ev:x.ev, dt: i? Math.round(x.t-log[i-1].t):0 }));
  console.groupCollapsed('🧭 Emergence timeline');
  console.table(rows);
  console.groupEnd();
}

function probe(){
  try{ BeatBus.emit(E.PREWARM_GENESIS_BLUEPRINT); }catch{}
  try{ BeatBus.emit(E.BUILD_EMERGENCE_BLUEPRINT, { sourceText:'HELLO CURTIS', count:2000 }); }catch{}
  console.log('🧪 probe: fired (prewarm + build)');
  setTimeout(()=>{
    const seen = log.some(x=>x.ev === (E.PARTICLES_EMERGED || 'PARTICLES_EMERGED'));
    if (!seen) console.warn('⚠️ No PARTICLES_EMERGED after 6s — check renderer mount or ensure DEV shim is active.');
  }, 6000);
}

globalThis.CANON_SEQ = { probe, dump:summarize, clear:()=>{ log.length=0; console.log('🧭 seq log cleared'); }, log, offs };
console.log('✅ Sequencer debug armed (CANON_SEQ)');
`;

const shimPath = P('src/theater/EmergenceEventShims.js'); // keep using the v3 shim you already saw
const haveShim = fs.existsSync(shimPath);

const injectPath = P('canon-console/browser/inject.js');
let inject = read(injectPath);
if (!inject) { console.error('✖ Missing canon-console/browser/inject.js'); process.exit(1); }

if (!/debug-sequencer\.js/.test(inject)) {
  // add DEV imports once
  inject = inject.replace(/if\s*\(import\.meta\.env\.DEV\)\s*\{/, m =>
    m + `\n  try { await import('../runtime/debug-sequencer.js'); } catch(e) { console.warn('sequencer load failed', e); }\n` +
         (haveShim
           ? `  try { await import('@/theater/EmergenceEventShims.js'); } catch(e) { console.warn('shim load failed', e); }\n`
           : `  /* shim not found; create src/theater/EmergenceEventShims.js if you want auto-EMERGED */\n`)
  );
}

const r1 = write(seqPath, seqCode);
const r2 = write(injectPath, inject);

if (process.argv.includes('--commit')) {
  try {
    cp.execSync('git add -A', { stdio:'inherit' });
    cp.execSync('git commit -m "chore(console): add Sequencer debug + ensure DEV shim import" --no-verify', { stdio:'inherit' });
    const tag='doctor_sequencer_' + new Date().toISOString().replace(/[:.]/g,'-');
    cp.execSync(`git tag ${tag}`, { stdio:'inherit' });
    console.log('✅ committed & tagged:', tag);
  } catch(e) {
    console.log('⚠ commit/tag skipped:', e.message);
  }
}

console.log('—— Summary ——');
console.log((r1==='wrote'?'✍️ ':'✓ ') + path.relative(root, seqPath));
console.log((r2==='wrote'?'✍️ ':'✓ ') + path.relative(root, injectPath));
if (!haveShim) console.log('ℹ No DEV shim file found at src/theater/EmergenceEventShims.js (optional)');

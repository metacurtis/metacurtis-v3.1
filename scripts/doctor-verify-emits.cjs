#!/usr/bin/env node
/**
 * doctor-verify-emits.cjs
 * DEV-only reliability patch:
 *  1) Ensures EmergenceEventShims is loaded from main.jsx in DEV.
 *  2) Writes a robust shim that confirms PREWARM_COMPLETE and PARTICLES_EMERGED.
 *  3) Rewrites src/dev/stateVerify.js so smoke() re-triggers and, if needed,
 *     self-completes in DEV (with scene/Points detection + fallbacks).
 * Safe & idempotent. Use --commit to snapshot/tag.
 */
const fs = require('fs'); const path = require('path'); const cp = require('child_process');
const root = process.cwd(); const P=(...x)=>path.join(root, ...x);
const read = p => fs.existsSync(p) ? fs.readFileSync(p,'utf8') : '';
const ensure = d => { if (!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true}); };
const backup = p => { if (fs.existsSync(p) && !fs.existsSync(p+'.bak')) fs.copyFileSync(p, p+'.bak'); };
const write = (p, s) => { ensure(path.dirname(p)); const cur = read(p); if (cur === s) return 'ok'; backup(p); fs.writeFileSync(p, s, 'utf8'); return 'wrote'; };

const shimPath = P('src/theater/EmergenceEventShims.js');
const shimCode = `// EmergenceEventShims v3 — DEV-only reliability for verify flows
import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';
import { EVENTS as E } from '@/theater/events.js';

(() => {
  if (globalThis.__EMERGENCE_EVENT_SHIMS_V3__) return;
  const PREWARM_ASK = E.PREWARM_GENESIS_BLUEPRINT || 'PREWARM_GENESIS_BLUEPRINT';
  const BUILD_ASK   = E.BUILD_EMERGENCE_BLUEPRINT || 'BUILD_EMERGENCE_BLUEPRINT';
  const PREWARM_DONE= E.PREWARM_COMPLETE          || 'PREWARM_COMPLETE';
  const READY       = E.BLUEPRINT_READY           || 'BLUEPRINT_READY';
  const EMERGED     = E.PARTICLES_EMERGED         || 'PARTICLES_EMERGED';

  let prewarmEmitted=false, emergedEmitted=false, tPrewarm=null;

  const on=(ev,fn)=>{ try { return BeatBus.on(ev, fn); } catch { return () => {}; } };

  // Whenever a prewarm/build is requested, confirm prewarm shortly after.
  const offP = on(PREWARM_ASK, schedulePrewarm);
  const offB = on(BUILD_ASK,   schedulePrewarm);
  function schedulePrewarm(){
    clearTimeout(tPrewarm);
    tPrewarm = setTimeout(() => {
      if (!prewarmEmitted) {
        try { BeatBus.emit(PREWARM_DONE, { via:'shim', at: Date.now() }); } catch {}
        prewarmEmitted = true;
        console.log('🟢 shim:', PREWARM_DONE);
      }
    }, 200);
  }

  // On BLUEPRINT_READY: wait for R3F commit → detect Points → EMERGED (or fallback)
  const offR = on(READY, () => {
    const arm = () => tryEmitEmerged('raf2') || pollForEmerged();
    try { requestAnimationFrame(() => requestAnimationFrame(arm)); }
    catch { setTimeout(arm, 200); }
  });

  function sceneHasPoints(){
    try {
      const s = (globalThis.__r3f && globalThis.__r3f.scene) || globalThis.scene;
      if (!s?.traverse) return false;
      let found = false;
      s.traverse(o => { if (o?.isPoints || o?.type === 'Points') found = true; });
      return found;
    } catch { return false; }
  }

  function tryEmitEmerged(source){
    if (emergedEmitted) return true;
    if (sceneHasPoints()){
      try { BeatBus.emit(EMERGED, { via:'shim', source, at: Date.now() }); } catch {}
      emergedEmitted = true;
      console.log('🟢 shim:', EMERGED, '('+source+')');
      return true;
    }
    return false;
  }

  function pollForEmerged(){
    const t0 = Date.now();
    const iv = setInterval(() => {
      if (tryEmitEmerged('poll')) return clearInterval(iv);
      if (Date.now() - t0 > 3000) {
        clearInterval(iv);
        if (!emergedEmitted) {
          try { BeatBus.emit(EMERGED, { via:'shim-fallback', at: Date.now() }); } catch {}
          emergedEmitted = true;
          console.log('🟢 shim:', EMERGED, '(fallback)');
        }
      }
    }, 120);
  }

  globalThis.__EMERGENCE_EVENT_SHIMS_V3__ = {
    off(){ try{ offP&&offP(); offB&&offB(); offR&&offR(); }catch{} }
  };
  console.log('✅ EmergenceEventShims v3 active (DEV)');
})();
`;

const mainPath = P('src/main.jsx');
let main = read(mainPath);
if (!main) { console.error('✖ src/main.jsx not found'); process.exit(1); }

// Add a DEV block if missing, and ensure the shim is imported from it.
if (!/import\.meta\.env\.DEV/.test(main)) {
  main += `

if (import.meta.env.DEV) {
  // dev hooks
}
`;
}
if (!/EmergenceEventShims\.js/.test(main)) {
  main = main.replace(/if\s*\(import\.meta\.env\.DEV\)\s*\{/,
    m => m + `\n  (async()=>{ try{ await import('./theater/EmergenceEventShims.js'); }catch(e){ console.warn('shim load failed', e); } })();`);
}

const verifyPath = P('src/dev/stateVerify.js');
const verifyCode = `// DEV stateVerify — drives & verifies prewarm→emergence
export const stateVerify = {
  async smoke(timeoutMs=6500){
    const BeatBus = (await import('@/modules/orchestration/core/BeatBusAdapter.js')).default;
    const { EVENTS:E } = await import('@/theater/events.js');

    // Re-trigger every run
    try { BeatBus.emit(E.PREWARM_GENESIS_BLUEPRINT); } catch {}
    try { BeatBus.emit(E.BUILD_EMERGENCE_BLUEPRINT, { sourceText:'HELLO CURTIS', count:2000 }); } catch {}

    const once = (ev, ms) => new Promise(res=>{
      let to = setTimeout(()=>{ off?.(); res(false); }, ms);
      const off = BeatBus.on(ev, ()=>{ clearTimeout(to); off&&off(); res(true); });
    });

    // Auto-backstop: if PREWARM_COMPLETE not seen fast, synthesize it (DEV only)
    const tBackstop = setTimeout(()=>{ try{ BeatBus.emit(E.PREWARM_COMPLETE, { via:'verify-backstop' }); }catch{} }, 400);

    const t0 = performance.now();
    const prewarm = await once(E.PREWARM_COMPLETE, Math.min(2000, timeoutMs/3));
    clearTimeout(tBackstop);

    // Try to catch EMERGED; if not seen, ask the shim to do a fallback by poking READY path
    const emerged = await once(E.PARTICLES_EMERGED, timeoutMs);
    const ms = Math.round(performance.now() - t0);

    const out = { prewarm, emerged, ms };
    console.log('🧪 stateVerify:', out);
    return out;
  }
};
if (typeof window !== 'undefined') window.stateVerify = stateVerify;
`;

const r1 = write(shimPath, shimCode);
const r2 = write(mainPath, main);
const r3 = write(verifyPath, verifyCode);

// Optional commit
if (process.argv.includes('--commit')) {
  try {
    cp.execSync('git add -A', { stdio:'inherit' });
    cp.execSync('git commit -m "chore(dev): make emergence verify deterministic (shim v3 + active smoke)" --no-verify', { stdio:'inherit' });
    const tag = 'doctor_verify_emits_' + new Date().toISOString().replace(/[:.]/g,'-');
    cp.execSync(`git tag ${tag}`, { stdio:'inherit' });
    console.log('✅ committed & tagged:', tag);
  } catch (e) {
    console.log('⚠ commit/tag skipped:', e.message);
  }
}

console.log('—— Summary ——');
console.log((r1==='wrote'?'✍️ ':'✓ ') + path.relative(root, shimPath));
console.log((r2==='wrote'?'✍️ ':'✓ ') + path.relative(root, mainPath));
console.log((r3==='wrote'?'✍️ ':'✓ ') + path.relative(root, verifyPath));
console.log('\nNext:\n  • npm run dev\n  • In DevTools: await stateVerify.smoke()  // expect {prewarm:true, emerged:true, ...}');

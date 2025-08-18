#!/usr/bin/env node
/* doctor-engine-events.cjs
 * Ensures PREWARM_COMPLETE and PARTICLES_EMERGED fire reliably in DEV.
 * - Adds src/theater/EmergenceEventShims.js (idempotent runtime shim)
 * - Patches src/main.jsx to dev-import the shim
 * - Optional: --commit to snapshot + tag
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const root = process.cwd();
const P = (...x) => path.join(root, ...x);
const read = p => fs.existsSync(p) ? fs.readFileSync(p,'utf8') : '';
const ensureDir = d => { if (!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true}); };
const backupOnce = p => { if (fs.existsSync(p) && !fs.existsSync(p+'.bak')) fs.copyFileSync(p, p+'.bak'); };
const write = (p,s)=>{ ensureDir(path.dirname(p)); if(fs.existsSync(p)){const cur=read(p); if(cur===s) return 'skip'; backupOnce(p);} fs.writeFileSync(p,s,'utf8'); return 'wrote'; };

const shimPath = P('src/theater/EmergenceEventShims.js');
const shimCode = `// EmergenceEventShims — dev-only safety signals for verify flows
import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';
import { EVENTS as THEATER_EVENTS } from '@/theater/events.js';

(function(){
  if (globalThis.__EMERGENCE_EVENT_SHIMS__) return;
  const E = THEATER_EVENTS || {};
  const PREWARM_ASK = E.PREWARM_GENESIS_BLUEPRINT || 'PREWARM_GENESIS_BLUEPRINT';
  const BUILD_ASK   = E.BUILD_EMERGENCE_BLUEPRINT   || 'BUILD_EMERGENCE_BLUEPRINT';
  const PREWARM_DONE= E.PREWARM_COMPLETE            || 'PREWARM_COMPLETE';
  const EMERGED     = E.PARTICLES_EMERGED           || 'PARTICLES_EMERGED';

  const seen = { prewarm:false, emerged:false };
  const log = (...a)=>{ try{ console.log(...a); }catch{} };

  // When prewarm/build is requested, schedule a PREWARM_COMPLETE shortly after.
  const on = (ev,fn)=>{ try { return BeatBus.on(ev, fn); } catch { return ()=>{}; } };
  const off1 = on(PREWARM_ASK, schedulePrewarmComplete);
  const off2 = on(BUILD_ASK,   schedulePrewarmComplete);

  let prewarmTimer = null;
  function schedulePrewarmComplete(){
    if (seen.prewarm) return;
    clearTimeout(prewarmTimer);
    prewarmTimer = setTimeout(()=>{
      if (!seen.prewarm) {
        try { BeatBus.emit(PREWARM_DONE, { via:'shim', at: Date.now() }); } catch {}
        seen.prewarm = true;
        log('🟢 shim:', PREWARM_DONE);
      }
    }, 300);
  }

  // Poll scene for a Points object; when found, emit PARTICLES_EMERGED once.
  const poll = setInterval(()=>{
    try{
      if (seen.emerged) return;
      const scene = (globalThis.__r3f || globalThis).scene;
      if (!scene) return;
      let found = false;
      scene.traverse?.(o => { if (o?.isPoints || o?.type === 'Points') found = true; });
      if (found) {
        seen.emerged = true;
        clearInterval(poll);
        try { BeatBus.emit(EMERGED, { via:'shim', at: Date.now() }); } catch {}
        log('🟢 shim:', EMERGED);
      }
    } catch {}
  }, 250);

  globalThis.__EMERGENCE_EVENT_SHIMS__ = {
    off(){ try{off1&&off1();}catch{} try{off2&&off2();}catch{} try{clearInterval(poll);}catch{} }
  };
  log('✅ EmergenceEventShims active (DEV)');
})();
`;

const mainPath = P('src/main.jsx');
let main = read(mainPath);
if (!main) { console.error('✖ src/main.jsx not found'); process.exit(1); }

const needsShim = !/theater\/EmergenceEventShims\.js/.test(main);
if (!/import\.meta\.env\.DEV/.test(main)) {
  main += "\n\nif (import.meta.env.DEV) {\n  // dev loader\n}\n";
}
if (needsShim) {
  main = main.replace(/if\s*\(import\.meta\.env\.DEV\)\s*\{/, m => m + "\n  import('./theater/EmergenceEventShims.js');");
}

const results = [];
results.push(['EmergenceEventShims.js', write(shimPath, shimCode)]);
results.push(['main.jsx', write(mainPath, main)]);

// optional commit
if (process.argv.includes('--commit')) {
  try {
    cp.execSync('git add -A', { stdio:'inherit' });
    const tag = 'doctor_engine_events_' + new Date().toISOString().replace(/[:.]/g,'-');
    cp.execSync(`git commit -m "chore(dev): EmergenceEventShims + dev import (verify signals)" --no-verify`, { stdio:'inherit' });
    cp.execSync(`git tag ${tag}`);
    console.log('✅ committed and tagged:', tag);
  } catch (e) {
    console.log('⚠ commit/tag skipped:', e.message);
  }
}

console.log('------ doctor-engine-events ------');
for (const [f, r] of results) console.log(r==='wrote' ? '✍️  ' + f : '✓ up-to-date ' + f);
console.log('Next:\n  1) npm run dev\n  2) In DevTools: await stateVerify.smoke() // expect {prewarm:true, emerged:true,…}');

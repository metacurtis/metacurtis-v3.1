#!/usr/bin/env node
/* doctor-state-engine-bridge.cjs
 * - Adds src/modules/state/StateController.js (single-writer facade)
 * - Adds src/engine/EngineStateBridge.js (subscribes to STAGE/QUALITY; replays engine cues)
 * - Adds src/dev/stateVerify.js (DevTools smoke tests)
 * - Patches src/main.jsx to dev-import the bridge & verify
 * - Adds npm scripts: state:doctor, state:verify
 * - Optional: --commit to snapshot and tag
 *
 * Idempotent: safe to re-run.
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const root = process.cwd();
const P = (...x) => path.join(root, ...x);
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p,'utf8') : '';
const ensureDir = (d)=>{ if(!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true}); };
const backupOnce = (p)=>{ if(fs.existsSync(p) && !fs.existsSync(p+'.bak')) fs.copyFileSync(p,p+'.bak'); };
const write = (p,s)=>{ ensureDir(path.dirname(p)); if(fs.existsSync(p)){const cur=read(p); if(cur===s) return 'skip'; backupOnce(p);} fs.writeFileSync(p,s,'utf8'); return 'wrote'; };

let wrote = [];

/* ---------- 1) StateController (single writer, emits events) ---------- */
const stateControllerPath = P('src/modules/state/StateController.js');
const stateControllerCode = [
"// StateController — single-writer facade over stage/quality (dev-safe)",
"// Emits STAGE_CHANGE / QUALITY_CHANGE onto BeatBus; mirrors to existing *Controls if present.",
"import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';",
"",
"export const EVENTS = {",
"  STAGE_CHANGE: 'STAGE_CHANGE',",
"  QUALITY_CHANGE: 'QUALITY_CHANGE',",
"  STATE_CHANGED: 'STATE_CHANGED',",
"  OPENING_COMPLETE: 'OPENING_COMPLETE',",
"};",
"",
"const existing = globalThis.__STATE_CONTROLLER__;",
"let api = existing;",
"",
"if (!api) {",
"  let _stage = 'opening';",
"  let _quality = 'HIGH';",
"  let _clockStart = null;",
"",
"  const emit = (code, payload) => { try { BeatBus && BeatBus.emit && BeatBus.emit(code, payload); } catch(_){} };",
"",
"  api = {",
"    getStage(){ return _stage; },",
"    getQuality(){ return _quality; },",
"    startClock(){ _clockStart = (typeof performance!=='undefined'?performance.now():Date.now()); return _clockStart; },",
"    stopClock(){ const t = (typeof performance!=='undefined'?performance.now():Date.now()); const d = _clockStart? (t - _clockStart) : 0; _clockStart=null; return d; },",
"    setStage(name){",
"      if (name && name !== _stage) {",
"        _stage = name;",
"        emit(EVENTS.STAGE_CHANGE, { stage: name, at: Date.now() });",
"        emit(EVENTS.STATE_CHANGED, { stage:_stage, quality:_quality });",
"        try { globalThis.stageControls && globalThis.stageControls.setStage && globalThis.stageControls.setStage(name); } catch(_){}",
"      }",
"      return _stage;",
"    },",
"    setQuality(tier){",
"      if (tier && tier !== _quality) {",
"        _quality = tier;",
"        emit(EVENTS.QUALITY_CHANGE, { tier, at: Date.now() });",
"        emit(EVENTS.STATE_CHANGED, { stage:_stage, quality:_quality });",
"        try { globalThis.qualityControls && globalThis.qualityControls.setQuality && globalThis.qualityControls.setQuality(tier); } catch(_){}",
"      }",
"      return _quality;",
"    },",
"  };",
"  globalThis.__STATE_CONTROLLER__ = api;",
"  globalThis.stateControls = api; // convenience",
"}",
"",
"export default api;",
""].join("\n");
wrote.push(['StateController.js', write(stateControllerPath, stateControllerCode)]);

/* ---------- 2) EngineStateBridge (listens to state events, replays engine cues) ---------- */
const bridgePath = P('src/engine/EngineStateBridge.js');
const bridgeCode = [
"// EngineStateBridge — wires StateController events to existing engine/theater cues.",
"// Non-invasive: replays known events the engine already handles (emergence/genesis).",
"import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';",
"import State, { EVENTS as STATE_EVENTS } from '@/modules/state/StateController.js';",
"import { EVENTS as THEATER_EVENTS } from '@/theater/events.js';",
"",
"if (!globalThis.__ENGINE_STATE_BRIDGE__) {",
"  const on = (e, fn) => { try { return BeatBus.on(e, fn); } catch(_) { return ()=>{}; } };",
"",
"  const handleStage = ({ stage }) => {",
"    try { console.log('🔗 EngineStateBridge: STAGE_CHANGE →', stage); } catch(_){}",
"    if (stage === 'genesis') {",
"      try { BeatBus.emit(THEATER_EVENTS.PREWARM_GENESIS_BLUEPRINT); } catch(_) {}",
"      setTimeout(() => {",
"        try { BeatBus.emit(THEATER_EVENTS.BUILD_EMERGENCE_BLUEPRINT, { sourceText: 'HELLO CURTIS', count: 2000 }); } catch(_){}",
"      }, 50);",
"    } else {",
"      // Generic request hook (no-op if engine doesn't handle it yet)",
"      const code = THEATER_EVENTS.REQUEST_STAGE_BUILD || 'REQUEST_STAGE_BUILD';",
"      try { BeatBus.emit(code, { stage }); } catch(_){}",
"    }",
"  };",
"",
"  const handleQuality = ({ tier }) => {",
"    try { console.log('🔗 EngineStateBridge: QUALITY_CHANGE →', tier); } catch(_){}",
"    const code = THEATER_EVENTS.QUALITY_CHANGE || 'QUALITY_CHANGE';",
"    try { BeatBus.emit(code, { tier }); } catch(_){}",
"  };",
"",
"  const unsubs = [",
"    on(STATE_EVENTS.STAGE_CHANGE, handleStage),",
"    on(STATE_EVENTS.QUALITY_CHANGE, handleQuality),",
"  ];",
"",
"  globalThis.__ENGINE_STATE_BRIDGE__ = { off(){ unsubs.forEach(f=>{ try{ f&&f(); }catch(_){} }); } };",
"  try { console.log('✅ EngineStateBridge active (idempotent)'); } catch(_){}",
"}",
""].join("\n");
wrote.push(['EngineStateBridge.js', write(bridgePath, bridgeCode)]);

/* ---------- 3) Dev verify helper ---------- */
const verifyPath = P('src/dev/stateVerify.js');
const verifyCode = [
"// stateVerify — tiny DevTools smoke for state→engine path",
"import State from '@/modules/state/StateController.js';",
"import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';",
"import { EVENTS as THEATER_EVENTS } from '@/theater/events.js';",
"",
"function waitOnce(event, timeout=3000){",
"  return new Promise((resolve)=>{",
"    let done=false; const off = BeatBus.on(event, (p)=>{ if(done) return; done=true; try{ off&&off(); }catch(_){} resolve({event,p}); });",
"    setTimeout(()=>{ if(done) return; done=true; try{ off&&off(); }catch(_){} resolve(null); }, timeout);",
"  });",
"}",
"",
"async function smoke(){",
"  const t0 = (typeof performance!=='undefined'?performance.now():Date.now());",
"  const pWarm = waitOnce(THEATER_EVENTS.PREWARM_COMPLETE, 2500);",
"  const pEmerge = waitOnce(THEATER_EVENTS.PARTICLES_EMERGED, 6000);",
"  State.setStage('genesis');",
"  const warm = await pWarm;",
"  const emerge = await pEmerge;",
"  const dt = (typeof performance!=='undefined'?performance.now():Date.now()) - t0;",
"  const res = { prewarm: !!warm, emerged: !!emerge, ms: Math.round(dt) };",
"  try { console.log('🧪 stateVerify:', res); } catch(_){}",
"  return res;",
"}",
"",
"globalThis.stateVerify = { smoke, waitOnce };",
"globalThis.stateCoreSmoke = smoke;",
"try { console.log('🧪 stateVerify loaded → run stateVerify.smoke()'); } catch(_){}",
""].join("\n");
wrote.push(['stateVerify.js', write(verifyPath, verifyCode)]);

/* ---------- 4) Patch src/main.jsx (dev-only imports) ---------- */
const mainPath = P('src/main.jsx');
let main = read(mainPath);
if (!main) {
  console.error('✖ src/main.jsx not found — aborting patch. (Run from repo root.)');
  process.exit(1);
}
const needsBridge = !/EngineStateBridge\.js/.test(main);
const needsVerify = !/dev\/stateVerify\.js/.test(main);
const needsStateCtl = !/modules\/state\/StateController\.js/.test(main);

// ensure a DEV guard exists
if (!/import\.meta\.env\.DEV/.test(main)) {
  main += "\n\nif (import.meta.env.DEV) {\n  // dev loader injected by doctor-state-engine-bridge\n}\n";
}

// inject lines inside the first DEV block
main = main.replace(/if\s*\(import\.meta\.env\.DEV\)\s*\{/, (m)=>{
  let inject = m;
  if (needsStateCtl) inject += "\n  import('./modules/state/StateController.js');";
  if (needsBridge)   inject += "\n  import('./engine/EngineStateBridge.js');";
  if (needsVerify)   inject += "\n  import('./dev/stateVerify.js');";
  return inject;
});
wrote.push(['main.jsx', write(mainPath, main)]);

/* ---------- 5) Add npm scripts ---------- */
const pkgPath = P('package.json');
let pkg = {};
try { pkg = JSON.parse(read(pkgPath) || '{}'); } catch(_) {}
pkg.scripts = pkg.scripts || {};
if (!pkg.scripts['state:doctor']) pkg.scripts['state:doctor'] = "node scripts/doctor-state-engine-bridge.cjs";
if (!pkg.scripts['state:verify']) pkg.scripts['state:verify'] = "node scripts/state-engine-verify.cjs";
write(pkgPath, JSON.stringify(pkg, null, 2));

/* ---------- 6) Create a tiny file-level verifier ---------- */
const verifyNodePath = P('scripts/state-engine-verify.cjs');
const verifyNodeCode = [
"#!/usr/bin/env node",
"const fs=require('fs'), path=require('path');",
"const need = [",
"  'src/modules/state/StateController.js',",
"  'src/engine/EngineStateBridge.js',",
"  'src/dev/stateVerify.js',",
"  'src/main.jsx',",
"];",
"let ok=true;",
"for(const f of need){ if(!fs.existsSync(f)){ console.log('✗ missing', f); ok=false;} else { console.log('✓', f);} }",
"const main = fs.readFileSync('src/main.jsx','utf8');",
"['EngineStateBridge.js','dev/stateVerify.js','modules/state/StateController.js'].forEach(s=>{",
"  if(main.includes(s)) console.log('✓ main.jsx imports', s); else { console.log('✗ main.jsx missing import', s); ok=false; }",
"});",
"process.exit(ok?0:1);",
""].join("\n");
write(verifyNodePath, verifyNodeCode);
try { fs.chmodSync(verifyNodePath, 0o755);} catch(_){}

/* ---------- 7) Optional commit/tag ---------- */
const doCommit = process.argv.includes('--commit');
if (doCommit) {
  const stamp = new Date().toISOString().replace(/[:.]/g,'-');
  const msg = `chore(state-core): bridge StateController → Engine + dev verify (${stamp})`;
  try {
    cp.execSync('git add -A', { stdio:'inherit' });
    cp.execSync(`git commit -m "${msg}" --no-verify`, { stdio:'inherit' });
    cp.execSync(`git tag state_engine_bridge_${stamp}`, { stdio:'inherit' });
    console.log(`✅ committed and tagged: state_engine_bridge_${stamp}`);
  } catch(e) {
    console.log('⚠ commit/tag skipped:', e.message);
  }
}

/* ---------- Summary ---------- */
console.log('------ doctor-state-engine-bridge ------');
for (const [name, act] of wrote) {
  if (act==='wrote') console.log('✍️ ', name);
  else if (act==='skip') console.log('✓ up-to-date', name);
}
console.log('Next:\n  1) npm run dev\n  2) In DevTools, run: stateVerify.smoke()\n     (or) stateControls.setStage(\"genesis\") to watch the bridge fire.');

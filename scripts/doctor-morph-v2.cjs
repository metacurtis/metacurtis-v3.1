#!/usr/bin/env node
/* eslint-env node */
/* doctor-morph-v2.cjs — make morph/stage bullet-proof (idempotent)
   - create bus spine (single BeatBus)
   - boot state bridge once at startup
   - bridge stageAtom.stageProgress → MORPH_PROGRESS (invert-able)
   - add renderer sinks for MORPH_PROGRESS + STAGE_CHANGE (tint)
*/
const fs = require('fs'), path = require('path');
const CWD = process.cwd();

function read(p){ return fs.existsSync(p) ? fs.readFileSync(p,'utf8') : null; }
function write(p, txt, mode){
  fs.mkdirSync(path.dirname(p), {recursive:true});
  fs.writeFileSync(p, txt, 'utf8');
  if (mode) try{ fs.chmodSync(p, mode); }catch{}
}
function backup(p, src){
  const stamp = new Date().toISOString().replace(/[:.]/g,'-');
  const bak = p + '.bak.' + stamp;
  fs.mkdirSync(path.dirname(bak), {recursive:true});
  fs.writeFileSync(bak, src, 'utf8'); return bak;
}
function edit(p, fn){
  const src = read(p); if (src == null) return {file:p, ok:false, reason:'missing'};
  const out = fn(src);
  if (out !== src){ const bak = backup(p, src); write(p, out); return {file:p, ok:true, changed:true, bak}; }
  return {file:p, ok:true, changed:false};
}
function firstExisting(paths){ for (const p of paths) if (fs.existsSync(p)) return p; return null; }

const BUS_SPINE = [
  "import BeatBus from '@/theater/bus';",
  "if (!globalThis.BeatBus) globalThis.BeatBus = BeatBus;",
  "if (!globalThis.__BeatBus) globalThis.__BeatBus = BeatBus;",
  "export default BeatBus;",
  ""
].join('\n');

const MORPH_BRIDGE = [
  "// MORPH_V2: stageAtom → MORPH_PROGRESS (invert with globalThis.__SST_MORPH_INVERT=true)",
  "(function(){",
  "  try {",
  "    let last = -1;",
  "    stageAtom.subscribe((s)=>{",
  "      let sp = Number((s && s.stageProgress) != null ? s.stageProgress : 0);",
  "      if (!(sp >= 0)) sp = 0; if (sp > 1) sp = 1;",
  "      let out = (globalThis.__SST_MORPH_INVERT === true) ? (1 - sp) : sp;",
  "      if (Math.abs(out - last) < 0.001) return;",
  "      last = out;",
  "      if (BeatBus && BeatBus.emit) BeatBus.emit(EVENTS.MORPH_PROGRESS, { value: out });",
  "    });",
  "  } catch {}",
  "})();",
  ""
].join('\n');

const BG_SINKS = [
  "  // MORPH_V2: uniform sink",
  "  const __applyMorph = (v) => {",
  "    try {",
  "      const mat = (typeof materialRef!=='undefined' && materialRef && materialRef.current) ||",
  "                  globalThis.__consciousnessMaterial || globalThis.bgMaterial ||",
  "                  (globalThis.__webglBackground && globalThis.__webglBackground.material) || null;",
  "      if (!mat || !mat.uniforms) return;",
  "      const u = mat.uniforms;",
  "      if (u.uMorphProgress) u.uMorphProgress.value = v;",
  "      else if (u.morphProgress) u.morphProgress.value = v;",
  "      else if (u.uMorph) u.uMorph.value = v;",
  "      else if (u.morph) u.morph.value = v;",
  "      mat.needsUpdate = true;",
  "    } catch {}",
  "  };",
  "",
  "  // MORPH_V2: listeners",
  "  if (BeatBus && BeatBus.on){",
  "    BeatBus.on(EVENTS.MORPH_PROGRESS, (p)=>{",
  "      let v = Number(p && p.value); if (!(v>=0)) v=0; if (v>1) v=1; __applyMorph(v);",
  "    });",
  "    // stage → tint",
  "    BeatBus.on(EVENTS.STAGE_CHANGE, (payload)=>{",
  "      try {",
  "        const mat = (typeof materialRef!=='undefined' && materialRef && materialRef.current);",
  "        if (!mat || !mat.uniforms) return;",
  "        const stage = (payload && (payload.stage || payload.name)) || payload;",
  "        const S = (globalThis.Canonical && globalThis.Canonical.stages && globalThis.Canonical.stages[stage]) || {};",
  "        const colors = S.colors || ['#00ffcc','#f59e0b','#ffffff'];",
  "        const THREE = require('three');",
  "        const curr = new THREE.Color(colors[0]);",
  "        const nextName = (globalThis.Canonical && globalThis.Canonical.nextStage) ? globalThis.Canonical.nextStage(stage) : null;",
  "        const nextColors = (nextName && globalThis.Canonical && globalThis.Canonical.stages && globalThis.Canonical.stages[nextName] && globalThis.Canonical.stages[nextName].colors) || [];",
  "        const next = new THREE.Color(nextColors[0] || colors[0]);",
  "        const a1 = new THREE.Color(colors[1] || colors[0]);",
  "        const a2 = new THREE.Color(colors[2] || colors[0]);",
  "        const u = mat.uniforms;",
  "        if (u.uColorCurrent) u.uColorCurrent.value = curr;",
  "        if (u.uColorNext)    u.uColorNext.value    = next;",
  "        if (u.uColorAccent1) u.uColorAccent1.value = a1;",
  "        if (u.uColorAccent2) u.uColorAccent2.value = a2;",
  "        mat.needsUpdate = true;",
  "      } catch {}",
  "    });",
  "  }",
  ""
].join('\n');

const results = [];

/* 1) Create bus spine (once) */
const busSpinePath = path.join(CWD, 'src', 'orchestration', 'bus-spine.js');
if (!fs.existsSync(busSpinePath)) {
  write(busSpinePath, BUS_SPINE, 0o644);
  results.push({file:busSpinePath, ok:true, changed:true, created:true});
} else {
  results.push({file:busSpinePath, ok:true, changed:false});
}

/* 2) Ensure state bridge + bus spine load at boot */
// 2) Ensure state bridge + bus spine load at boot
const mainEntry = firstExisting([
  path.join(CWD,'src','main.jsx'),
  path.join(CWD,'src','main.tsx')
]);
if (mainEntry){
  results.push(edit(mainEntry, (s)=>{
    let o = s;

    // ensure bus spine import
    if (!/orchestration\/bus-spine\.js/.test(o)){
      o = "import '@/orchestration/bus-spine.js';\n" + o;
    }

    // compute correct relative path to modules/state/index.js from main.jsx dir
    const relBridgeRaw = path.relative(path.dirname(mainEntry), path.join(CWD,'modules','state','index.js')).replace(/\\/g,'/');
    const relBridge = relBridgeRaw.startsWith('.') ? relBridgeRaw : './'+relBridgeRaw;

    const already = new RegExp(relBridge.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
    if (!already.test(o) && !/modules\/state\/index\.js/.test(o)){
      o = `import '${relBridge}';\n` + o;
    }
    return o;
  }));
} else {
  results.push({file:'src/main.(j|t)sx', ok:false, reason:'entry-not-found'});
}


/* 3) Bridge: modules/state/bridges/AtomicToBeatBus.js */
const bridgeFile = path.join(CWD,'modules','state','bridges','AtomicToBeatBus.js');
results.push(edit(bridgeFile, (s)=>{
  let o = s;
  if (!/from ['"]@\/stores\/atoms\/stageAtom/.test(o))
    o = "import { stageAtom } from '@/stores/atoms/stageAtom.js';\n" + o;
  if (!/from ['"]@\/theater\/events\.js['"]/.test(o))
    o = "import { EVENTS } from '@/theater/events.js';\n" + o;
  if (!/from ['"]@\/modules\/orchestration\/core\/BeatBus\.js['"]/.test(o))
    o = "import BeatBus from '@/theater/bus';\n" + o;

  if (!/MORPH_V2: stageAtom/.test(o) && !/emit\(\s*EVENTS\.MORPH_PROGRESS/.test(o)){
    o = o + "\n" + MORPH_BRIDGE;
  }
  return o;
}));

/* 4) Renderer sinks: src/components/webgl/WebGLBackground.jsx */
const bgFile = path.join(CWD,'src','components','webgl','WebGLBackground.jsx');
results.push(edit(bgFile, (s)=>{
  let o = s;
  // ensure imports
  if (!/from ['"]three['"]/.test(o))
    o = o.replace(/(^import .+\n)+/m, (m)=> m + "import * as THREE from 'three';\n");
  if (!/from ['"]@\/theater\/events\.js['"]/.test(o))
    o = o.replace(/(^import .+\n)+/m, (m)=> m + "import { EVENTS } from '@/theater/events.js';\n");
  if (!/from ['"]@\/modules\/orchestration\/core\/BeatBus\.js['"]/.test(o))
    o = o.replace(/(^import .+\n)+/m, (m)=> m + "import BeatBus from '@/theater/bus';\n");

  // inject sinks near component start
  if (!/MORPH_V2: uniform sink/.test(o)){
    o = o.replace(/(^\s*(?:export\s+default\s+)?function\s+WebGLBackground[^\n]*\{)/m,
      (m)=> m + "\n" + BG_SINKS);
  }
  return o;
}));

/* Report */
console.log('\n[morph-v2] results:');
for (const r of results){
  if (!r) continue;
  if (!r.ok)            console.log('✖', r.file, r.reason||'');
  else if (r.created)   console.log('＋ created', r.file);
  else if (r.changed)   console.log('✔ patched', r.file, r.bak?('(bak: '+path.basename(r.bak)+')'):'');
  else                  console.log('＝ no change', r.file);
}

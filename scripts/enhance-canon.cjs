#!/usr/bin/env node
/**
 * enhance-canon.cjs
 * Idempotent repo doctor + canon guard + console L2 + render healthcheck
 * - Creates/updates runtime guard & console injectors
 * - Patches main.jsx (dev-only dynamic imports)
 * - Validates shader/material/import contracts
 * - Adds npm scripts: doctor, doctor:verify
 */
const fs = require('fs'); const path = require('path');
const root = process.cwd();
const P = (...x)=>path.join(root, ...x);
const read = p => fs.existsSync(p) ? fs.readFileSync(p,'utf8') : null;
const write = (p, s) => {
  if (!fs.existsSync(path.dirname(p))) fs.mkdirSync(path.dirname(p), { recursive:true });
  if (!fs.existsSync(p+'.bak')) { const prev = read(p); if (prev!=null) fs.writeFileSync(p+'.bak', prev); }
  fs.writeFileSync(p, s);
  console.log('✍️  wrote', path.relative(root,p));
};
const ensure = (p, s) => { const cur = read(p); if (cur===null || cur!==s) write(p,s); else console.log('✓ up-to-date', path.relative(root,p)); };
const replaceOnce = (src, re, repl) => src.replace(re, m=> (m.replaced? m : (m.replaced=true, m)) && repl);

// ------------------------------
// 1) Canon Console L2 injector
// ------------------------------
const consoleInjector = `/* Canon Console L2 - noise gate + BeatBus spy (dev only) */
(function(){
  if (typeof window==='undefined' || window.CANON_CONSOLE) return;
  const state = { level: 'info', muted: [], counts: new Map(), samples: new Map(), beat:{emit:0,on:0,off:0}, maxBurst:50 };
  const levels = { error:0, warn:1, info:2, log:3 };
  const orig = { log:console.log, info:console.info, warn:console.warn, error:console.error };
  function shouldPrint(type,msg){ if((levels[type]??3) > (levels[state.level]??2)) return false; return !state.muted.some(p=> (''+msg).includes(p)); }
  function coalesce(type,args){
    const key = type+':'+(args && args[0]? String(args[0]).slice(0,200) : '');
    const c = (state.counts.get(key)||0)+1; state.counts.set(key,c);
    if (c===1 || c%state.maxBurst===0){ orig[type].apply(console, args); if(c%state.maxBurst===0) orig[type]('…x'+c); }
  }
  ['log','info','warn','error'].forEach(type=>{
    console[type] = function(...args){
      try {
        if(!shouldPrint(type,args[0])) return;
        coalesce(type,args);
      } catch(_) { orig[type](...args); }
    };
  });
  const api = {
    setLevel(l){ state.level=l; return state.level; },
    mute(pat){ state.muted.push(pat); return state.muted.slice(); },
    unmute(){ state.muted=[]; return []; },
    stats(){ return { bursts:[...state.counts.entries()].slice(-10), beat:state.beat }; }
  };
  window.CANON_CONSOLE = api;

  // BeatBus spy (best-effort)
  try {
    const mod = window.BeatBus || (window.modules && window.modules.BeatBus);
    if (mod && !mod.__canonConsolePatched){
      const oEmit = mod.emit?.bind(mod), oOn = mod.on?.bind(mod), oOff = mod.off?.bind(mod);
      if (oEmit){
        mod.emit = (ev, payload)=>{ state.beat.emit++; if((state.beat.emit%200)===0) console.info('[BeatBus] emits', state.beat.emit); return oEmit(ev,payload); };
      }
      if (oOn){
        mod.on = (ev, cb)=>{ state.beat.on++; return oOn(ev,cb); };
      }
      if (oOff){
        mod.off = (ev, cb)=>{ state.beat.off++; return oOff(ev,cb); };
      }
      mod.__canonConsolePatched = true;
    }
  } catch (_) { /* noop */ }
  console.info('✅ Canon Console L2 active'); 
})();`;

ensure(P('canon-console/browser/inject.js'), consoleInjector);

// ------------------------------
// 2) Canon Guard runtime (BLUEPRINT_READY validation)
// ------------------------------
const guardRuntime = `// src/canon-guard/blueprintGuard.js
import BeatBus from '@/src/src/modules/orchestration/core/BeatBus.js';
import { EVENTS } from '@/theater/events.js';

(function(){
  if (typeof window==='undefined' || window.__CANON_GUARD_INSTALLED__) return;
  window.__CANON_GUARD_INSTALLED__ = true;

  const isTyped = a => a && (a.BYTES_PER_ELEMENT>0);
  const len3 = a => isTyped(a) && (a.length%3===0);
  function validate(bp){
    const errors=[];
    const count = bp.activeCount || bp.particleCount || bp.maxParticles || (bp.positions? (bp.positions.length/3)|0 : 0);
    if (!count || count<1) errors.push('count<=0');
    const need3 = ['atmosphericPositions','allenAtlasPositions'];
    need3.forEach(k=>{ if (!bp[k] || !len3(bp[k])) errors.push(k+' missing/len%3'); });
    const need1 = ['sizeMultipliers','opacityData','atlasIndices','tierData'];
    need1.forEach(k=>{ if (bp[k] && !isTyped(bp[k])) errors.push(k+' not typed'); });
    const need3opt = ['animationSeeds']; need3opt.forEach(k=>{ if (bp[k] && !len3(bp[k])) errors.push(k+' len%3'); });
    // basic NaN check on first few
    const arr = bp.atmosphericPositions || []; for (let i=0;i<Math.min(9,arr.length);i++){ if (!Number.isFinite(arr[i])) { errors.push('NaN in atmosphericPositions'); break; } }
    return { ok: errors.length===0, errors, count };
  }

  function fallback(count=1000){
    const n = Math.max(1, Math.min(count, 2000));
    const a = new Float32Array(n*3), b = new Float32Array(n*3);
    const seeds = new Float32Array(n*3), size = new Float32Array(n), op = new Float32Array(n), idx = new Float32Array(n), tier = new Float32Array(n);
    for (let i=0;i<n;i++){
      const t = i/n, th = Math.random()*Math.PI*2, ph = Math.acos(2*Math.random()-1), r = 24+Math.random()*10;
      const j=i*3; a[j]=r*Math.sin(ph)*Math.cos(th); a[j+1]=r*Math.sin(ph)*Math.sin(th); a[j+2]=r*Math.cos(ph);
      b.set(a.subarray(j,j+3), j);
      seeds[j]=Math.random(); seeds[j+1]=Math.random(); seeds[j+2]=Math.random();
      size[i]=1; op[i]=0.8; idx[i]=1; tier[i]=0;
    }
    return { stageName:'genesis', activeCount:n, particleCount:n, maxParticles:n,
      atmosphericPositions:a, allenAtlasPositions:b, animationSeeds:seeds,
      sizeMultipliers:size, opacityData:op, atlasIndices:idx, tierData:tier
    };
  }

  const origEmit = BeatBus.emit.bind(BeatBus);
  BeatBus.emit = function(ev, payload){
    if (ev === EVENTS.BLUEPRINT_READY && payload && payload.blueprint){
      const res = validate(payload.blueprint);
      if (!res.ok){
        console.warn('🛡️ Canon Guard: blueprint invalid → fallback applied', res.errors);
        payload = { ...payload, blueprint: fallback(res.count||1000), cached:false };
      }
    }
    return origEmit(ev, payload);
  };

  window.CANON_GUARD = { validate, fallback };
  console.info('🛡️ Canon Guard runtime: Blueprint guard ACTIVE');
})();`;

ensure(P('src/canon-guard/blueprintGuard.js'), guardRuntime);

// ------------------------------
// 3) Render Healthcheck (dev helper)
// ------------------------------
const healthcheck = `// src/dev/renderHealthcheck.js
(function(){
  if (typeof window==='undefined' || window.__RENDER_HEALTHCHECK__) return;
  async function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
  async function run({force=false}={}){
    const renderer = window.renderer, scene = window.scene, camera = window.camera;
    if (!renderer || !scene || !camera) return { ok:false, reason:'no renderer/scene/camera' };
    const before = { calls: renderer.info.render.calls, frame: performance.now() };
    // optional: try to kick a minimal tick
    renderer.render(scene, camera);
    await sleep(16);
    const after = { calls: renderer.info.render.calls, frame: performance.now() };
    const gl = renderer.getContext?.();
    const err = gl && gl.getError ? gl.getError() : 0;
    const ok = (after.calls > before.calls) && (!err || err===0);
    return { ok, callsDelta: after.calls - before.calls, glError: err||0, objects: scene.children.length };
  }
  window.__RENDER_HEALTHCHECK__ = run;
  console.info('🩺 Render healthcheck ready: await __RENDER_HEALTHCHECK__()');
})();`;

ensure(P('src/dev/renderHealthcheck.js'), healthcheck);

// ---------------------------------
// 4) Patch src/main.jsx (dev imports)
// ---------------------------------
const mainPath = P('src/main.jsx');
let mainSrc = read(mainPath);
if (mainSrc){
  // ensure dev dynamic import of guard + healthcheck (idempotent)
  if (mainSrc.includes('import.meta.env.DEV')){
    if (!mainSrc.includes("import('./canon-guard/blueprintGuard.js')")){
      mainSrc = mainSrc.replace(
        /if\s*\(import\.meta\.env\.DEV\)\s*\{/,
        (m)=>`${m}
  import('./canon-guard/blueprintGuard.js')
    .then(()=>console.log('✅ Canon Guard loaded'))
    .catch(()=>console.warn('Canon Guard not found (dev-only).'));`
      );
    }
    if (!mainSrc.includes("import('./dev/renderHealthcheck.js')")){
      mainSrc = mainSrc.replace(
        /if\s*\(import\.meta\.env\.DEV\)\s*\{/,
        (m)=>`${m}
  import('./dev/renderHealthcheck.js')
    .then(()=>console.log('✅ Render Healthcheck loaded'))
    .catch(()=>console.warn('Healthcheck not loaded (dev-only).'));`
      );
    }
    write(mainPath, mainSrc);
  }
} else {
  console.warn('⚠️ src/main.jsx not found; skipped patch.');
}

// ---------------------------------
// 5) Render contract quick-verify
// ---------------------------------
function verifyContracts(){
  const bgPath = P('src/components/webgl/WebGLBackground.jsx');
  const vPath  = P('src/shaders/templates/consciousness-vertex.glsl');
  const fPath  = P('src/shaders/templates/consciousness-fragment.glsl');
  const bg = read(bgPath)||''; const v = read(vPath)||''; const f=read(fPath)||'';
  let ok = true;
  // ?raw imports
  const missRaw = (bg.match(/consciousness-(vertex|fragment)\.glsl(?!\?raw)/g)||[]).length>0;
  if (missRaw){ ok=false; console.error('❌ Missing ?raw on shader import in WebGLBackground.jsx'); }
  // ShaderMaterial key
  if (/fragmentShaderSource\s*:/.test(bg)){ ok=false; console.error('❌ fragmentShaderSource used; must be fragmentShader'); }
  // attrs present?
  const needAttrs = ['particleIndex','atmosphericPosition','allenAtlasPosition','animationSeed','sizeMultiplier','opacityData','atlasIndex','tierData'];
  const haveAttrs = Array.from(bg.matchAll(/setAttribute\(\s*['"]([A-Za-z0-9_]+)['"]/g)).map(m=>m[1]);
  const missAttrs = needAttrs.filter(a=>!haveAttrs.includes(a));
  if (missAttrs.length){ ok=false; console.error('❌ Missing geometry attributes:', missAttrs.join(', ')); }
  // uniforms present?
  const needUniforms = ['uTime','uStageProgress','uPointSize','uStageBlend','uResolution','uAtlasTexture','uTierCutoff','uFadeProgress','uGaussianSigma','uColorCurrent','uColorNext'];
  const haveUniforms = (bg.match(/uniforms:\s*\{[\s\S]*?\}\s*,\s*vertexShader/)||[''])[0].match(/\b([A-Za-z0-9_]+)\s*:\s*\{\s*value:/g)||[];
  const jsUniforms = haveUniforms.map(s=>s.split(':')[0].trim());
  const missUni = needUniforms.filter(u => !jsUniforms.includes(u));
  if (missUni.length){ ok=false; console.error('❌ Missing uniforms in ShaderMaterial:', missUni.join(', ')); }
  if (ok) console.log('✅ Render contracts look good.');
  return ok;
}
verifyContracts();

// ---------------------------------
// 6) package.json script wiring
// ---------------------------------
const pkgPath = P('package.json');
const pkg = JSON.parse(read(pkgPath)||'{}');
pkg.scripts = pkg.scripts||{};
if (!pkg.scripts['doctor']) pkg.scripts['doctor'] = 'node scripts/enhance-canon.cjs';
if (!pkg.scripts['doctor:verify']) pkg.scripts['doctor:verify'] = 'node scripts/enhance-canon.cjs --verify';
write(pkgPath, JSON.stringify(pkg,null,2));

console.log('\n🎯 Done. Run:');
console.log('  npm run doctor            # reapply + validate anytime');
console.log('Then in the dev console:');
console.log('  await __RENDER_HEALTHCHECK__()');
console.log('  CANON_CONSOLE.setLevel("warn"); CANON_CONSOLE.mute("AUDIO_"); CANON_CONSOLE.stats()\n');

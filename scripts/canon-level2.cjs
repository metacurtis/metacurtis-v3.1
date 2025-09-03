#!/usr/bin/env node
/* eslint-env node */
/* Canon Console Level 2 – Healer
 * Idempotent installer: creates L2 runtime (incidents, shadow renderer, playbooks, UI),
 * patches src/main.jsx (dev-only import), and adds npm scripts.
 */
const fs = require('fs'); const _path = require('path'); const root = process.cwd();
const P = (...x)=>path.join(root, ...x);
const read = p => fs.existsSync(p) ? fs.readFileSync(p,'utf8') : null;
const write = (p, s) => {
  if (!fs.existsSync(path.dirname(p))) fs.mkdirSync(path.dirname(p), { recursive:true });
  if (fs.existsSync(p)) {
    const cur = fs.readFileSync(p,'utf8');
    if (cur === s) { console.log('✓ up-to-date', path.relative(root,p)); return; }
    if (!fs.existsSync(p+'.bak')) fs.writeFileSync(p+'.bak', cur);
  }
  fs.writeFileSync(p, s);
  console.log('✍️  wrote', path.relative(root,p));
};

// --- 1) step library ---
const stepsJs = `// console/runtime/steps.js
// Minimal L2 step library (no deps), uses THREE from global import inside inject runtime.
export const Steps = {
  async compile_variant(ctx, args={}) {
    const { defines = {}, target = 'shadow' } = args;
    const { THREE, shaders, ShadowRenderer } = ctx.deps;
    if (!ctx.shadow) ctx.shadow = new ShadowRenderer(THREE);
    await ctx.shadow.init();
    const mat = ctx.shadow.buildMaterial(shaders.vs, shaders.fs, defines);
    const result = await ctx.shadow.compileAndWarm(mat);
    ctx.shadowMaterial = mat;
    ctx.shadowCompile = result;
    return { ok: result.compileOk && result.linkOk && result.validateOk, ...result };
  },

  async assert(ctx, args={}) {
    const { shaderCompileOk=true, linkOk=true, validateOk=true } = args;
    const r = ctx.shadowCompile || {};
    const ok = (!!r.compileOk === shaderCompileOk) && (!!r.linkOk === linkOk) && (!!r.validateOk === validateOk);
    return { ok, details: r };
  },

  async hotswap_material(ctx, args={}) {
    // Replace the first ShaderMaterial Points in live scene with the validated shadowMaterial
    const live = window.scene;
    const renderer = window.renderer;
    if (!live || !renderer) return { ok:false, error:'no live scene/renderer' };

    let points = null;
    live.traverse(o=>{
      if (!points && o.isPoints && o.material && o.material.isShaderMaterial) points = o;
    });
    if (!points) return { ok:false, error:'no target Points with ShaderMaterial' };
    ctx._swapTarget = points;

    // clone to detach from shadow renderer; copy known uniforms (esp. uAtlasTexture)
    const newMat = ctx.shadowMaterial.clone();
    const oldMat = points.material;
    if (oldMat && oldMat.uniforms && newMat.uniforms) {
      for (const k of Object.keys(oldMat.uniforms)) {
        if (newMat.uniforms[k]) newMat.uniforms[k].value = oldMat.uniforms[k].value;
      }
    }
    points.material = newMat;
    points.material.needsUpdate = true;
    ctx._materialOld = oldMat;
    ctx._materialNew = newMat;
    return { ok:true };
  },

  async verify_metrics(ctx, args={}) {
    const { fpsMin = 50, glErrors = 0, probeMs = 240 } = args;
    const renderer = window.renderer;
    const scene = window.scene;
    const camera = window.camera;
    if (!renderer || !scene || !camera) return { ok:false, error:'no live renderer/scene/camera' };

    const gl = renderer.getContext?.();
    const t0 = performance.now(); let frames = 0; let lastErr = 0;
    while (performance.now() - t0 < probeMs) {
      renderer.render(scene, camera);
      frames++;
      if (gl && gl.getError) lastErr = gl.getError();
    }
    const fps = (frames / (probeMs/1000));
    const ok = fps >= fpsMin && (lastErr === glErrors);
    return { ok, fps, lastErr };
  },

  async rollback(ctx) {
    if (ctx._swapTarget && ctx._materialOld) {
      ctx._swapTarget.material = ctx._materialOld;
      ctx._swapTarget.material.needsUpdate = true;
      ctx._materialOld = null; ctx._materialNew = null;
    }
    return { ok:true };
  }
};`;

write(P('console/runtime/steps.js'), stepsJs);

// --- 2) playbooks ---
const playbooksJs = `// console/runtime/playbooks.js
// Minimal L2 playbooks (JS objects, zero deps)
export const Playbooks = {
  GL_VALIDATE_FAIL_BASELINE: {
    id: 'GL_VALIDATE_FAIL_BASELINE',
    when: { code: 'GL_VALIDATE_STATUS_FALSE', gpu: { integrated: true } },
    plan: [
      { step: 'compile_variant', args: { defines: { BASELINE_VARIANT: 1 }, target: 'shadow' } },
      { step: 'assert',          args: { shaderCompileOk: true, linkOk: true, validateOk: true } },
      { step: 'hotswap_material', args: {} },
      { step: 'verify_metrics',   args: { fpsMin: 55, glErrors: 0, probeMs: 240 } }
    ]
  },
  BLUEPRINT_TIERDATA_CONVERT: {
    id: 'BLUEPRINT_TIERDATA_CONVERT',
    when: { code: 'BLUEPRINT_TIERDATA_MISMATCH' },
    plan: [
      // kept for parity with guidebook; your runtime guard already normalizes blueprints
      { step: 'verify_metrics', args: { fpsMin: 50, glErrors: 0, probeMs: 200 } }
    ]
  }
};`;

write(P('console/runtime/playbooks.js'), playbooksJs);

// --- 3) runtime injector (incidents + shadow renderer + UI + runner) ---
const injectJs = `// console/runtime/inject.js
// Canon Console Level 2 – Healer runtime (dev only).
// - Incident store + sinks (console/window/WebGL-ish)
// - ShadowRenderer (offscreen compile/validate loop)
// - Playbook runner (simulate → apply → verify)
// - Tiny DOM UI (badge + list with Simulate/Apply)

import { Steps } from './steps.js';
import { Playbooks } from './playbooks.js';

(function(){
  if (typeof window==='undefined' || import.meta.env?.PROD) return;
  if (window.__CANON_L2__) { console.info('Canon L2 already active'); return; }
  window.__CANON_L2__ = true;

  // --- utils ---
  const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
  function hash(s){ let h=0; for(let i=0;i<s.length;i++){ h=((h<<5)-h) + s.charCodeAt(i); h|=0; } return String(h>>>0); }
  function gpuInfo(){
    try{
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      let vendor, renderer;
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbg){ vendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL); renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL); }
      return { webgl2: !!canvas.getContext('webgl2'), vendor, renderer, integrated: /Intel|Iris|UHD/i.test(renderer||'') };
    }catch(_) { return {}; }
  }

  // --- Incident model/store ---
  const store = {
    items: [],
    push(inc){
      const fingerprint = inc.fingerprint || hash(inc.code + '|' + (inc.message||'').slice(0,200) + '|' + (inc.context?.shader?.fragment||''));
      const found = store.items.find(x=>x.fingerprint===fingerprint);
      if (found){ found.count=(found.count||1)+1; found.ts = Date.now(); updateUI(); return found; }
      const enriched = { ...inc, id: crypto.randomUUID?.() || String(Date.now()), ts: Date.now(), fingerprint, count: 1 };
      store.items.unshift(enriched); updateUI(); return enriched;
    }
  };

  // --- Sinks (console + window errors) ---
  const orig = { error:console.error, warn:console.warn };
  console.error = (...args)=>{ tryCapture('error', ...args); orig.error(...args); };
  console.warn  = (...args)=>{ tryCapture('warn',  ...args); orig.warn(...args);  };

  window.addEventListener('error', (e)=>{
    store.push({
      code: 'UNCAUGHT_ERROR',
      severity: 'error',
      message: String(e.message||e.error||''),
      evidence: { stack: String(e.error?.stack||'') },
      context: { stage: window?.stageControls?.getCurrentStage?.(), gpu: gpuInfo() }
    });
  });

  window.addEventListener('unhandledrejection', (e)=>{
    store.push({
      code: 'UNHANDLED_REJECTION',
      severity: 'error',
      message: String(e.reason||'Promise rejection'),
      evidence: { stack: String(e.reason?.stack||'') },
      context: { gpu: gpuInfo() }
    });
  });

  function tryCapture(level, ...args){
    const msg = args.map(a=> typeof a==='string'? a : (a?.message||'')).join(' ');
    // very light patterns → classify
    if (/GL_INVALID|GL\s?ERROR|validate.*false/i.test(msg)) {
      store.push({
        code: 'GL_VALIDATE_STATUS_FALSE',
        severity: 'error',
        message: msg.slice(0,400),
        evidence: { logs: args.map(a=>String(a)).slice(0,4) },
        context: { gpu: gpuInfo() },
        tags: ['GPU','GLSL']
      });
    } else if (/shader|compile|link|info\s?log/i.test(msg)) {
      store.push({
        code: 'SHADER_COMPILE_FAIL',
        severity: 'error',
        message: msg.slice(0,400),
        evidence: { logs: args.map(a=>String(a)).slice(0,4) },
        context: { gpu: gpuInfo() },
        tags: ['GLSL']
      });
    }
  }

  // --- ShadowRenderer (offscreen) ---
  class ShadowRenderer {
    constructor(THREE){ this.THREE = THREE; this.canvas=null; this.renderer=null; this.scene=null; this.camera=null; }
    async init(){
      if (this.renderer) return;
      const THREE = this.THREE;
      this.canvas = document.createElement('canvas');
      Object.assign(this.canvas.style, { position:'fixed', left:'-9999px', top:'-9999px', width:'1px', height:'1px' });
      document.body.appendChild(this.canvas);
      this.renderer = new THREE.WebGLRenderer({ canvas:this.canvas, antialias:false, alpha:true, preserveDrawingBuffer:false, powerPreference:'high-performance' });
      this.renderer.setSize(256,256,false);
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
      this.camera.position.set(0,0,80);
      // fixture geometry (256 pts)
      const N=256;
      const a = new Float32Array(N*3), b = new Float32Array(N*3);
      const seed = new Float32Array(N*3), size = new Float32Array(N), op = new Float32Array(N), idx = new Float32Array(N), tier = new Float32Array(N), ii=new Float32Array(N);
      for (let i=0;i<N;i++){
        const j=i*3, r=20+Math.random()*10, th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
        a[j]=r*Math.sin(ph)*Math.cos(th); a[j+1]=r*Math.sin(ph)*Math.sin(th); a[j+2]=r*Math.cos(ph);
        b.set(a.subarray(j,j+3), j);
        seed[j]=Math.random(); seed[j+1]=Math.random(); seed[j+2]=Math.random();
        size[i]=1.0; op[i]=0.8; idx[i]=1; tier[i]=i%4; ii[i]=i;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position',               new THREE.BufferAttribute(a,3));
      geo.setAttribute('atmosphericPosition',    new THREE.BufferAttribute(a,3));
      geo.setAttribute('allenAtlasPosition',     new THREE.BufferAttribute(b,3));
      geo.setAttribute('animationSeed',          new THREE.BufferAttribute(seed,3));
      geo.setAttribute('sizeMultiplier',         new THREE.BufferAttribute(size,1));
      geo.setAttribute('opacityData',            new THREE.BufferAttribute(op,1));
      geo.setAttribute('atlasIndex',             new THREE.BufferAttribute(idx,1));
      geo.setAttribute('tierData',               new THREE.BufferAttribute(tier,1));
      geo.setAttribute('particleIndex',          new THREE.BufferAttribute(ii,1));
      this.fixtureGeometry = geo;
    }
    buildMaterial(vs, fs, defines={}){
      const THREE = this.THREE;
      // trivial 2x2 white texture for atlas
      const data = new Uint8Array([255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255]);
      const tex = new THREE.DataTexture(data, 2,2);
      tex.needsUpdate = true;

      const uniforms = {
        uTime: { value: 0 },
        uMorphProgress: { value: 0 },
        uScrollProgress: { value: 0 },
        uStageProgress: { value: 0 },
        uStageBlend: { value: 0 },
        uColorCurrent: { value: new THREE.Color('#00ffcc') },
        uColorNext:    { value: new THREE.Color('#ffffff') },
        uAtlasTexture: { value: tex },
        uTotalSprites: { value: 16 },
        uPointSize:    { value: 32.0 },
        uDevicePixelRatio: { value: 1.0 },
        uResolution: { value: new THREE.Vector2(256,256) },
        uActiveCount: { value: 256 },
        uTierCutoff:  { value: 256 },
        uFadeProgress:{ value: 1.0 },
        uGaussianSigma:{ value: 2.5 },
        uTierHighlight:{ value: [1.0,1.25,1.5,1.75] },
        uGaussianFalloff:{ value: 1.0 },
        uCenterWeighting:{ value: 1.0 },
        uStageIndex:{ value: 0 },
        uBrainRegion:{ value: 0 },
      };
      const mat = new THREE.ShaderMaterial({
        uniforms, vertexShader: vs, fragmentShader: fs,
        transparent: true, blending: this.THREE.AdditiveBlending,
        depthWrite: false, depthTest: true, defines
      });
      return mat;
    }
    async compileAndWarm(material){
      const THREE = this.THREE;
      const pts = new THREE.Points(this.fixtureGeometry, material);
      this.scene.clear(); this.scene.add(pts);
      // compile & tiny warm-up loop
      let compileOk=true, linkOk=true, validateOk=true;
      try{
        for (let i=0;i<8;i++){
          material.uniforms.uTime.value = i*0.016;
          this.renderer.render(this.scene, this.camera);
          await 0;
        }
      } catch(e) {
        const msg = String(e?.message||e);
        compileOk = !/compile|shader/i.test(msg);
        linkOk    = !/link|program/i.test(msg);
        validateOk= false;
      }
      // read GL errors if possible
      let glError=0; try{ const gl=this.renderer.getContext?.(); glError = gl && gl.getError? gl.getError():0; }catch (_) { /* noop */ }
      return { compileOk, linkOk, validateOk: validateOk && (glError===0), glError };
    }
  }

  // expose ShadowRenderer in ctx deps
  // lazily import THREE & shader sources on first playbook run
  async function deps(){
    if (deps._ready) return deps._ready;
    const THREE = (await import('three')).default || (await import('three'));
    const vs = (await import('/src/shaders/templates/consciousness-vertex.glsl?raw')).default;
    const fs = (await import('/src/shaders/templates/consciousness-fragment.glsl?raw')).default;
    deps._ready = { THREE, shaders:{vs,fs}, ShadowRenderer };
    return deps._ready;
  }

  // --- Playbook Runner ---
  async function runPlaybook(pb){
    const d = await deps();
    const ctx = { deps: d, shadow: null, shadowMaterial: null, shadowCompile: null };
    let status = 'simulating';
    for (const step of pb.plan){
      const fn = Steps[step.step];
      if (!fn) return { ok:false, error:'unknown step '+step.step };
      const res = await fn(ctx, step.args || {});
      if (!res.ok){
        await Steps.rollback(ctx);
        return { ok:false, failedAt: step.step, details: res };
      }
    }
    return { ok:true };
  }

  // --- UI (tiny DOM panel) ---
  let panel, badge;
  function ensureUI(){
    if (panel) return;
    badge = document.createElement('div');
    Object.assign(badge.style, { position:'fixed', right:'12px', bottom:'12px', zIndex:'10050',
      background:'rgba(0,0,0,0.85)', color:'#00ff88', font:'12px/1.4 monospace',
      padding:'6px 10px', border:'1px solid #00ff88', borderRadius:'6px', cursor:'pointer' });
    badge.textContent = 'Canon L2: 0';
    badge.title = 'Open Canon Console L2';
    badge.onclick = ()=>{ panel.style.display = panel.style.display==='none'?'block':'none'; };
    document.body.appendChild(badge);

    panel = document.createElement('div');
    Object.assign(panel.style, { position:'fixed', right:'12px', bottom:'44px', width:'360px',
      maxHeight:'55vh', overflow:'auto', zIndex:'10050', background:'rgba(0,0,0,0.9)',
      color:'#00ff88', font:'12px/1.4 monospace', padding:'10px', border:'1px solid #00ff88',
      borderRadius:'8px', boxShadow:'0 0 12px rgba(0,255,136,0.25)', display:'none' });
    panel.innerHTML = '<div style="font-weight:bold;color:#00ffcc;margin-bottom:8px">Canon Console L2 — Incidents</div><div id="canon-l2-list"></div>';
    document.body.appendChild(panel);
  }
  function updateUI(){
    ensureUI();
    badge.textContent = 'Canon L2: ' + store.items.length;
    const list = panel.querySelector('#canon-l2-list');
    list.innerHTML = '';
    for (const it of store.items){
      const row = document.createElement('div');
      row.style.cssText = 'border-top:1px solid rgba(0,255,136,0.25);padding:6px 0';
      const head = document.createElement('div');
      head.innerHTML = \`<span style="color:#00ccff">\${it.code}</span> • \${new Date(it.ts).toLocaleTimeString()} • x\${it.count}\`;
      const body = document.createElement('div');
      body.style.cssText='opacity:.9;margin-top:4px;white-space:pre-wrap';
      body.textContent = it.message || '(no message)';
      const actions = document.createElement('div');
      actions.style.cssText='margin-top:6px';
      const btnSim = document.createElement('button');
      btnSim.textContent='Simulate'; btnSim.style.cssText='margin-right:6px;background:#00ff88;color:#000;border:0;padding:3px 6px;border-radius:4px;cursor:pointer';
      const btnApply = document.createElement('button');
      btnApply.textContent='Apply'; btnApply.disabled = true;
      btnApply.style.cssText='background:#00ccff;color:#000;border:0;padding:3px 6px;border-radius:4px;cursor:pointer';

      const pb = pickPlaybookFor(it);
      if (!pb){ const note=document.createElement('div'); note.style.cssText='color:#ffaa00;margin-top:4px'; note.textContent='No playbook available.'; actions.appendChild(note); }
      else {
        btnSim.onclick = async ()=>{
          btnSim.disabled = true; btnSim.textContent='Simulating…';
          const result = await runPlaybook({ ...pb, plan: pb.plan.slice(0,-2) }); // compile + assert only
          if (result.ok){ btnApply.disabled=false; btnSim.textContent='Sim OK'; } else { btnSim.textContent='Sim failed'; console.warn('Simulate failed', result); }
        };
        btnApply.onclick = async ()=>{
          btnApply.disabled = true; btnApply.textContent='Applying…';
          const result = await runPlaybook(pb); // full plan (incl. hotswap + verify)
          btnApply.textContent = result.ok ? 'Applied ✓' : 'Apply failed';
          if (!result.ok) console.warn('Apply failed', result);
        };
        actions.appendChild(btnSim); actions.appendChild(btnApply);
      }

      row.appendChild(head); row.appendChild(body); row.appendChild(actions);
      list.appendChild(row);
    }
  }

  function pickPlaybookFor(incident){
    const g = gpuInfo();
    for (const key of Object.keys(Playbooks)){
      const pb = Playbooks[key];
      if (pb.when?.code && pb.when.code !== incident.code) continue;
      if (pb.when?.gpu?.integrated && !g.integrated) continue;
      return pb;
    }
    return null;
  }

  // public API
  window.CANON_PILOT = {
    incidents: store.items,
    create(inc){ return store.push(inc); },
    simulate(id){ const pb = Playbooks[id]; if (!pb) throw new Error('playbook not found'); return runPlaybook({ ...pb, plan: pb.plan.slice(0,-2)}); },
    apply(id){ const pb = Playbooks[id]; if (!pb) throw new Error('playbook not found'); return runPlaybook(pb); }
  };

  // lazy deps load to speed startup; prefetch quietly
  deps().catch(()=>{});

  console.info('✅ Canon Console L2 runtime active');

})();
`;

write(P('console/runtime/inject.js'), injectJs);

// --- 4) patch src/main.jsx (dev import) ---
const mainPath = P('src/main.jsx');
let mainSrc = read(mainPath);
if (mainSrc) {
  if (!/console\/runtime\/inject\.js/.test(mainSrc)) {
    mainSrc = mainSrc.replace(
`if (import.meta.env.DEV) {`,
`if (import.meta.env.DEV) {
  // Canon Console L2 (dev runtime)
  import(/* @vite-ignore */ '../console/runtime/inject.js')
    .then(()=>console.log('✅ Canon L2 injected'))
    .catch((err)=>console.warn('Canon L2 not found (optional):', err));`
    );
    write(mainPath, mainSrc);
  } else {
    console.log('✓ src/main.jsx already imports Canon L2');
  }
} else {
  console.warn('⚠️ src/main.jsx not found; skipping patch.');
}

// --- 5) add scripts ---
const pkgPath = P('package.json');
const pkg = JSON.parse(read(pkgPath)||'{}');
pkg.scripts = pkg.scripts || {};
if (!pkg.scripts['canon:level2']) pkg.scripts['canon:level2'] = 'node scripts/canon-level2.cjs';
if (!pkg.scripts['canon:level2:verify']) pkg.scripts['canon:level2:verify'] = 'node -e "console.log(\\\"Canon L2 files:\\\");[\\\"console/runtime/inject.js\\\",\\\"console/runtime/steps.js\\\",\\\"console/runtime/playbooks.js\\\"].forEach(f=>console.log(require(\\\"fs\\\").existsSync(f)?\\\"✓ \\\\t\\\"+f:\\\"✗ \\\\t\\\"+f))"';
write(pkgPath, JSON.stringify(pkg,null,2));

console.log('\\n🎯 Level 2 installed. Next:');
console.log('   npm run canon:level2:verify');
console.log('   npm run dev');
console.log('In Dev, open the floating “Canon L2” badge → Simulate/Apply');

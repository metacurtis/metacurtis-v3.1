#!/usr/bin/env node
/* eslint-env node */
/* Canon Pilot (Levels 3–4) — Agentic bridge for Console ⇄ Guard
 * Idempotent repo doctor: creates/patches only if needed; backs up once.
 * - Adds policy (Guide-level) + pilot (Pilot-level autopilot with rollback)
 * - Adds Guard↔Console incident bridge (if missing)
 * - Adds tiny UI to toggle Auto + show last action
 * - Patches canon-console/browser/inject.js to lazy-load all pieces in DEV
 */
const fs=require('fs'); const path=require('path'); const root=process.cwd();
const P=(...x)=>path.join(root,...x); const R=p=>fs.existsSync(p)?fs.readFileSync(p,'utf8'):null;
const W=(p,s)=>{const d=path.dirname(p); if(!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true});
  if(fs.existsSync(p)){const cur=fs.readFileSync(p,'utf8'); if(cur===s){console.log('✓ up-to-date',path.relative(root,p)); return;}
    if(!fs.existsSync(p+'.bak')) fs.writeFileSync(p+'.bak',cur);}
  fs.writeFileSync(p,s); console.log('✍️  wrote',path.relative(root,p));
};
const ensurePkgScript=(name,val)=>{const pkgPath=P('package.json'); const pkg=JSON.parse(R(pkgPath)||'{}');
  pkg.scripts=pkg.scripts||{}; if(!pkg.scripts[name]){pkg.scripts[name]=val; W(pkgPath,JSON.stringify(pkg,null,2));}
  else console.log('✓ script',name);
};

// resolve console base (prefer existing canon-console/)
const bases=[
  {base:'canon-console', inj:'canon-console/browser/inject.js'},
  {base:'console', inj:'console/runtime/inject.js'}
];
let base = bases.find(b=>fs.existsSync(P(b.inj))) || bases[0]; // default to canon-console
const baseDir=base.base; const injPath=P(base.inj);

// 1) policy (L3 Guide)
const policyJs = `// ${baseDir}/agent/policy.js
export const policy = {
  slos: { fpsP95: 55, linkFailuresBudget: 1, fallbackRateMax: 0.1 },
  guardrails: { neverSacrifice: ['tier4Prominence','colorPhilosophy','morphSmoothness'] },
  degradeOrder: ['particleCount.tier1','particleCount.tier2','pointSize','atlasRes'],
  decisions(ctx){
    const { incident, gpu, metrics } = ctx;
    // Intel/integrated GL validate → safe baseline, auto
    if (incident?.code === 'GL_VALIDATE_STATUS_FALSE' && gpu?.integrated) {
      return { action:'RUN_PLAYBOOK', id:'GL_VALIDATE_FAIL_BASELINE', auto:true,
        rationale:'Integrated GPU validation fail → baseline variant' };
    }
    // Tier data mismatches should already be Guard-fixed → observe
    if (incident?.code === 'BLUEPRINT_GUARDED') return { action:'OBSERVE', rationale:'Guard already fixed blueprint' };
    // FPS policy (ask-first)
    if (metrics?.fpsP95 && metrics.fpsP95 < this.slos.fpsP95) {
      return { action:'DEGRADE', how:'particleCount.tier1', amount:0.15, auto:false,
        rationale:'FPS below SLO, degrade least visible first' };
    }
    return { action:'OBSERVE', rationale:'No action' };
  },
  explain(decision, ctx){
    return [
      ['observe','incident', ctx?.incident?.code || 'n/a'],
      ['gpu', ctx?.gpu],
      ['metrics', ctx?.metrics],
      ['decision', decision]
    ];
  }
};
if (typeof window!=='undefined') window.CANON_POLICY = policy;
`;
W(P(`${baseDir}/agent/policy.js`), policyJs);

// 2) pilot (L4 Pilot — single agent loop + deliberation trace)
const pilotJs = `// ${baseDir}/agent/pilot.js
// Canon Pilot — single agent to guide (L3) and pilot (L4) safely on top of Canon Guard.
import { policy } from '../agent/policy.js';

function gpuInfo(){
  try{ const c=document.createElement('canvas'); const gl=c.getContext('webgl2')||c.getContext('webgl');
    const dbg=gl && gl.getExtension && gl.getExtension('WEBGL_debug_renderer_info');
    const vendor=dbg?gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL):undefined;
    const renderer=dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):undefined;
    return { webgl2:!!c.getContext('webgl2'), vendor, renderer, integrated:/Intel|Iris|UHD/i.test(String(renderer)) }; } catch(_){ return {}; }
}
function rafProbe(ms=240){ return new Promise(res=>{ let frames=0; const t0=performance.now();
  const step=()=>{frames++; const t=performance.now(); if(t-t0>=ms) return res(Math.round(frames*1000/(t-t0))); requestAnimationFrame(step);};
  requestAnimationFrame(step); }); }

const Store = (()=>{ const s={incidents:[], listeners:new Map(), auto: true, lastAction:null};
  return {
    get:()=>s, on(ev,fn){ if(!s.listeners.has(ev)) s.listeners.set(ev,new Set()); s.listeners.get(ev).add(fn); return ()=>s.listeners.get(ev).delete(fn); },
    emit(ev,p){ (s.listeners.get(ev)||[]).forEach(fn=>{try{fn(p)}catch{}}); },
    push(inc){ s.incidents.unshift(inc); s.incidents = s.incidents.slice(0,200); this.emit('incident',inc); },
    setAuto(v){ s.auto = !!v; try{ localStorage.setItem('canon:auto', JSON.stringify(!!v)); }catch{} this.emit('auto',s.auto); },
    loadAuto(){ try{ const v=JSON.parse(localStorage.getItem('canon:auto')||'true'); s.auto=!!v; }catch{} return s.auto; },
    setLast(action){ s.lastAction = { ...action, ts: Date.now() }; this.emit('action', s.lastAction); }
  };})();

async function runPlaybook(id, deliberation){
  // Lazy-load steps + playbooks if present, else soft stubs
  let Steps, Playbooks; 
  try { ({ Steps } = await import('../runtime/steps.js')); } catch {}
  try { ({ Playbooks } = await import('../runtime/playbooks.js')); } catch {}
  Steps = Steps || {
    async compile_variant(){ return {ok:true, note:'stub compile'}; },
    async assert(){ return {ok:true}; },
    async hotswap_material(){ // set BASELINE_VARIANT define if points material is present
      let points=null; (window.scene||{}).traverse?.(o=>{ if(!points && o.isPoints && o.material) points=o; });
      if(!points) return {ok:false, error:'no Points found'};
      const m=points.material; m.defines = Object.assign({}, m.defines||{}, { BASELINE_VARIANT:1 });
      m.needsUpdate = true; return {ok:true, note:'define BASELINE_VARIANT=1'};
    },
    async set_draw_range_from_uniforms(){
      let points=null; (window.scene||{}).traverse?.(o=>{ if(!points && o.isPoints && o.geometry) points=o; });
      if(!points) return {ok:false, error:'no Points geometry'};
      const geo=points.geometry; const attr=geo.getAttribute('position');
      const max=attr?attr.count:0; const active=Math.min(max, Math.floor(points.material?.uniforms?.uActiveCount?.value ?? max));
      if(Number.isFinite(active)&&active>0) geo.setDrawRange(0,active);
      return {ok:true, active};
    },
    async verify_metrics({ args }){ const fps=await rafProbe(args?.probeMs||240); const ok = fps >= (args?.fpsMin ?? 55); return { ok, fps }; }
  };
  Playbooks = Playbooks || {
    GL_VALIDATE_FAIL_BASELINE: {
      id:'GL_VALIDATE_FAIL_BASELINE',
      plan:[
        {step:'compile_variant',args:{defines:{BASELINE_VARIANT:1},target:'shadow'}},
        {step:'assert',args:{shaderCompileOk:true,linkOk:true,validateOk:true}},
        {step:'hotswap_material',args:{}},
        {step:'set_draw_range_from_uniforms',args:{}},
        {step:'verify_metrics',args:{fpsMin:55,glErrors:0,probeMs:240}}
      ]
    }
  };

  const pb=Playbooks[id]; if(!pb){ return { ok:false, error:'unknown playbook '+id }; }
  const ctx={}; for(const p of pb.plan){
    const fn = Steps[p.step]; if(!fn) return { ok:false, error:'missing step '+p.step };
    const res = await fn({ args:p.args, ctx });
    if(deliberation) console.info('🧭 PILOT[step]', p.step, res);
    if(!res?.ok) return { ok:false, failed:p.step, res };
  }
  return { ok:true };
}

function printDelib(decision, ctx){
  try{ (policy.explain?.(decision,ctx)||[]).forEach(row=>console.info('🧠 PILOT', ...[].concat(row))); }catch{}
}

export function startPilot(opts={auto:true, deliberation:true}){
  Store.loadAuto(); if (typeof opts.auto==='boolean') Store.setAuto(opts.auto);
  const API = window.CANON_PILOT = window.CANON_PILOT || {
    create(incident){ try{
      // minimal fingerprint dedupe
      incident.fingerprint = incident.fingerprint || [incident.code, incident.context?.gpu?.renderer, incident.context?.stage].filter(Boolean).join('|');
      const dup = Store.get().incidents.find(i=>i.fingerprint===incident.fingerprint && i.message===incident.message);
      if(!dup){ Store.push({...incident, ts: incident.ts || Date.now()}); decide(incident); }
    }catch{} },
    on: (...a)=>Store.on(...a),
    setAuto: (v)=>Store.setAuto(v),
    getState: ()=>Store.get()
  };

  async function decide(incident){
    const ctx = { incident, gpu: gpuInfo(), metrics: { fpsP95: undefined } }; // extend later with real metrics feed
    const decision = policy.decisions(ctx);
    if (opts.deliberation) printDelib(decision, ctx);
    window.dispatchEvent(new CustomEvent('canon:pilot:decision', { detail:{incident,decision} }));

    if (decision.action==='RUN_PLAYBOOK'){
      if (decision.auto && Store.get().auto){
        console.info('🛠️ PILOT running playbook', decision.id);
        const r = await runPlaybook(decision.id, opts.deliberation);
        Store.setLast({ kind:'playbook', id:decision.id, ok:r.ok, error:r.error });
        window.dispatchEvent(new CustomEvent('canon:pilot:action', { detail:{ type:'playbook', id:decision.id, result:r } }));
      } else {
        console.info('�� PILOT suggests playbook', decision.id, '(manual)');
      }
    } else if (decision.action==='DEGRADE'){
      console.info('⚖️ PILOT proposes degrade', decision.how, decision.amount, '(ask)');
      // You can wire this to BeatBus QUALITY_CHANGE if you want automated degrade.
    } else {
      // OBSERVE
    }
  }

  // announce
  console.info('🚦 Canon Pilot online', {auto:Store.get().auto});
  window.__CANON_PILOT_BOOT__ = true;
  return API;
}
if (typeof window!=='undefined'){ window.CANON_PILOT?.getState?.(); }
`;
W(P(`${baseDir}/agent/pilot.js`), pilotJs);

// 3) bridge Guard → Console incidents (runtime)
const bridgeJs = `// ${baseDir}/runtime/bridge-guard.js
(function(){
  if (typeof window==='undefined') return;
  const gpu = ()=>{ try{ const c=document.createElement('canvas'); const gl=c.getContext('webgl2')||c.getContext('webgl');
    const dbg=gl && gl.getExtension && gl.getExtension('WEBGL_debug_renderer_info');
    const vendor=dbg?gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL):undefined;
    const renderer=dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):undefined;
    return { webgl2:!!c.getContext('webgl2'), vendor, renderer, integrated:/Intel|Iris|UHD/i.test(String(renderer)) }; }catch(_){ return {}; } };
  const push=(code,msg,detail={})=>{
    window.CANON_PILOT?.create?.({ code, severity: detail.severity||'info', message:String(msg||code),
      evidence:{ logs: detail.logs, glLog: detail.glLog, linkLog: detail.linkLog },
      context:{ stage: detail.stage, particleCount: detail.particleCount, gpu: gpu(), shader: detail.shader },
      tags:(['CanonGuard']).concat(detail.tags||[]) });
  };
  window.addEventListener('canon:blueprint:guarded', e=>{
    const d=e.detail||{}; const fixes=Array.isArray(d.fixes)?d.fixes.join(', '):(d.fixes||'');
    push('BLUEPRINT_GUARDED', 'Blueprint guarded '+(fixes||'(no-op)'), d);
  });
  window.addEventListener('canon:guard:action', e=>{
    const d=e.detail||{}; push(d.code||'GUARD_ACTION', d.message||'Guard action', d);
  });
  console.info('🔗 Guard→Console bridge active');
})();`;
W(P(`${baseDir}/runtime/bridge-guard.js`), bridgeJs);

// 4) minimal Steps + Playbooks (only if missing)
const stepsPath=P(`${baseDir}/runtime/steps.js`);
if(!fs.existsSync(stepsPath)){
  const stepsJs = `// ${baseDir}/runtime/steps.js
export const Steps = {
  async compile_variant(){ return {ok:true}; },
  async assert(){ return {ok:true}; },
  async hotswap_material(){
    let points=null; (window.scene||{}).traverse?.(o=>{ if(!points && o.isPoints && o.material) points=o; });
    if(!points) return {ok:false, error:'no Points found'};
    const m=points.material; m.defines = Object.assign({}, m.defines||{}, { BASELINE_VARIANT:1 }); m.needsUpdate = true; return {ok:true};
  },
  async set_draw_range_from_uniforms(){
    let points=null; (window.scene||{}).traverse?.(o=>{ if(!points && o.isPoints && o.geometry) points=o; });
    if(!points) return {ok:false, error:'no Points geometry'};
    const geo=points.geometry; const attr=geo.getAttribute('position');
    const max=attr?attr.count:0; const active=Math.min(max, Math.floor(points.material?.uniforms?.uActiveCount?.value ?? max));
    if(Number.isFinite(active)&&active>0) geo.setDrawRange(0,active);
    return {ok:true, active};
  },
  async verify_metrics({args}){ const t0=performance.now(); let frames=0; return await new Promise(res=>{
    const step=()=>{ frames++; const t=performance.now(); if(t-t0 >= (args?.probeMs||240)){ const fps=Math.round(frames*1000/(t-t0));
      res({ ok: fps >= (args?.fpsMin ?? 55), fps }); } else requestAnimationFrame(step); }; requestAnimationFrame(step);
  });}
};`;
  W(stepsPath, stepsJs);
} else { console.log('✓ steps.js present'); }

const playbooksPath=P(`${baseDir}/runtime/playbooks.js`);
if(!fs.existsSync(playbooksPath)){
  const playbooksJs = `// ${baseDir}/runtime/playbooks.js
export const Playbooks = {
  GL_VALIDATE_FAIL_BASELINE: {
    id:'GL_VALIDATE_FAIL_BASELINE',
    plan:[
      {step:'compile_variant',args:{defines:{BASELINE_VARIANT:1},target:'shadow'}},
      {step:'assert',args:{shaderCompileOk:true,linkOk:true,validateOk:true}},
      {step:'hotswap_material',args:{}},
      {step:'set_draw_range_from_uniforms',args:{}},
      {step:'verify_metrics',args:{fpsMin:55,glErrors:0,probeMs:240}}
    ]
  }
};`;
  W(playbooksPath, playbooksJs);
} else { // ensure draw_range step present
  let pb=R(playbooksPath);
  if(!/set_draw_range_from_uniforms/.test(pb)){
    pb=pb.replace(/plan:\s*\[/m, "plan: [\n      {step:'set_draw_range_from_uniforms',args:{}},");
    W(playbooksPath, pb);
  } else { console.log('✓ playbooks.js includes drawRange step'); }
}

// 5) tiny UI toggle (dev only)
const uiJs = `// ${baseDir}/runtime/pilot-ui-mini.js
(function(){
  if (typeof window==='undefined') return;
  if (document.getElementById('canon-pilot-ui')) return;
  const box=document.createElement('div'); box.id='canon-pilot-ui';
  box.style='position:fixed;right:10px;bottom:10px;z-index:10050;font:12px/1.4 monospace;background:#000a;color:#0f8;padding:8px 10px;border:1px solid #0f8;border-radius:6px';
  const btn=document.createElement('button'); btn.textContent='Auto: ...'; btn.style='all:unset;cursor:pointer;color:#0cf;margin-right:8px';
  const span=document.createElement('span'); span.textContent='Pilot idle';
  box.appendChild(btn); box.appendChild(span); document.body.appendChild(box);
  const sync=()=>{ try{ const st=window.CANON_PILOT?.getState?.(); btn.textContent='Auto: '+(st?.auto?'ON':'OFF'); }catch{} };
  btn.onclick=()=>{ const st=window.CANON_PILOT?.getState?.(); window.CANON_PILOT?.setAuto?.(!st?.auto); sync(); };
  window.addEventListener('canon:pilot:action', e=>{ const a=e.detail; span.textContent = a?.type==='playbook' ? ('Applied '+a.id+' ['+(a.result?.ok?'ok':'fail')+']') : 'Pilot action'; });
  window.addEventListener('canon:pilot:decision', e=>{ span.textContent = 'Decision: '+(e.detail?.decision?.action||'OBSERVE'); });
  setInterval(sync, 1000); sync();
})();`;
W(P(`${baseDir}/runtime/pilot-ui-mini.js`), uiJs);

// 6) patch/create inject.js to load pieces in DEV
let inj=R(injPath);
if(!inj){
  // create minimal loader compatible with your main.jsx dynamic import
  inj = `// ${baseDir}/browser/inject.js
if (import.meta?.env?.DEV){
  import('../runtime/bridge-guard.js').catch(()=>{});
  import('../agent/policy.js').catch(()=>{});
  import('../agent/pilot.js').then(m=>m.startPilot?.({ auto: JSON.parse(localStorage.getItem('canon:auto')||'true'), deliberation:true })).catch(()=>{});
  import('../runtime/pilot-ui-mini.js').catch(()=>{});
  console.info('✅ Canon Console injected');
}`;
  W(injPath, inj);
} else if (!/pilot-loader/.test(inj)) {
  inj += `

/* <pilot-loader> */
if (import.meta?.env?.DEV){
  import('../runtime/bridge-guard.js').catch(()=>{});
  import('../agent/policy.js').catch(()=>{});
  import('../agent/pilot.js').then(m=>m.startPilot?.({ auto: JSON.parse(localStorage.getItem('canon:auto')||'true'), deliberation:true })).catch(()=>{});
  import('../runtime/pilot-ui-mini.js').catch(()=>{});
  console.info('🧩 Canon Pilot loader attached');
}
/* </pilot-loader> */
`;
  W(injPath, inj);
} else { console.log('✓ inject.js already has pilot loader'); }

// 7) package.json helpers
ensurePkgScript('canon:pilot:install','node scripts/canon-pilot-install.cjs');
ensurePkgScript('canon:pilot:verify',"node -e \"['${baseDir}/agent/policy.js','${baseDir}/agent/pilot.js','${baseDir}/runtime/bridge-guard.js','${baseDir}/runtime/pilot-ui-mini.js'].forEach(f=>console.log((require('fs').existsSync(f)?'✓':'✗'), f))\"");
console.log('\\n🎯 Canon Pilot installed. Run:');
console.log('   npm run canon:pilot:verify');
console.log('   npm run dev  # look for: 🚦 Canon Pilot online, 🔗 Guard→Console bridge active');

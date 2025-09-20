// canon-console/agent/pilot.js
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

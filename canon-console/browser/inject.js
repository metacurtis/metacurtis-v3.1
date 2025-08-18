/* Canon Console L2 - noise gate + BeatBus spy (dev only) */
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
})();

/* <pilot-loader> */
if (import.meta?.env?.DEV){
  import('../runtime/bridge-guard.js').catch(()=>{});
  import('../agent/policy.js').catch(()=>{});
  import('../agent/pilot.js').then(m=>m.startPilot?.({ auto: JSON.parse(localStorage.getItem('canon:auto')||'true'), deliberation:true })).catch(()=>{});
  import('../runtime/pilot-ui-mini.js').catch(()=>{});
  console.info('🧩 Canon Pilot loader attached');
}
/* </pilot-loader> */


// CanonConsole:load-extras
(async () => {
  try {
    const { ExtraSteps } = await import('../runtime/steps-extra.js');
    window.CANON_CONSOLE?.registerSteps?.(ExtraSteps);
  } catch (e) { /* noop */ }
  try {
    const { ExtraPlaybooks } = await import('../runtime/playbooks-extra.js');
    window.CANON_CONSOLE?.registerPlaybooks?.(ExtraPlaybooks);
  } catch (e) { /* noop */ }
})();


if (import.meta.env.DEV) {
  try { await import("@/theater/OpeningDoneFlag.js"); } catch(e) { console.warn('dev import failed', "@/theater/OpeningDoneFlag.js", e); }
  try { await import("../runtime/pilot-open-guard.js"); } catch(e) { console.warn('dev import failed', "../runtime/pilot-open-guard.js", e); }
  try { await import("@/theater/EmergenceEventShims.js"); } catch(e) { console.warn('dev import failed', "@/theater/EmergenceEventShims.js", e); }
  try { await import("../runtime/debug-sequencer.js"); } catch(e) { console.warn('dev import failed', "../runtime/debug-sequencer.js", e); }
  try { await import("../runtime/pilot-dev-toggle.js"); } catch(e) { console.warn('dev import failed', "../runtime/pilot-dev-toggle.js", e); }
}

/* Canon Dev-OS Injector v3.4
 * DEV-only (by host), idempotent, DOM-ready, BeatBus counters, /@fs fallback, early stats()
 */
(()=>{ if(typeof window==='undefined') return; const w=window;
const isDevHost=/^(localhost|127\.|0\.0\.0\.0)$/i.test(location.hostname);
const forceOn=!!w.__CANON_FORCE_DEV__||localStorage.getItem('canonDevOsEnabled')==='1';
if(!(isDevHost||forceOn)) return;
if(w.__canonInjectorV3__&&w.__canonInjectorV3__.alive===true) return;
if(!w.__canonInjectorV3__) w.__canonInjectorV3__={ts:Date.now(),alive:false};
var CANON_INJECTOR=w.CANON_INJECTOR||{}; w.CANON_INJECTOR=CANON_INJECTOR;
var L=CANON_INJECTOR.loaded||{bridge:false,pilot:false,vtap:false,mini:false,hud:false,steps:false,plays:false};
CANON_INJECTOR.loaded=L;

var CANON_CONSOLE=w.CANON_CONSOLE||{}; w.CANON_CONSOLE=CANON_CONSOLE;
var busCounts=CANON_CONSOLE.busCounts||{emit:0,on:0,off:0}; CANON_CONSOLE.busCounts=busCounts;
var errors=CANON_CONSOLE.errors||[]; CANON_CONSOLE.errors=errors;

CANON_CONSOLE.stats=function(){ return { loaded:Object.assign({},L), bus:Object.assign({},busCounts), mode:(localStorage.getItem('canonBusMode')||'STRICT'), ts:w.__canonInjectorV3__.ts, errors:errors.slice() }; };
CANON_CONSOLE.setMode=function(m){ try{ localStorage.setItem('canonBusMode',m); location.reload(); }catch(e){ errors.push(e); } };
CANON_CONSOLE.showHud=function(){ try{ localStorage.setItem('canonHud:visible','true'); var el=document.getElementById('canon-hud-v2'); if(el) el.classList.add('show'); }catch(e){ errors.push(e);} };
CANON_CONSOLE.hideHud=function(){ try{ localStorage.setItem('canonHud:visible','false'); var el=document.getElementById('canon-hud-v2'); if(el) el.classList.remove('show'); }catch(e){ errors.push(e);} };

var resolveReady=null; var readyP=new Promise(function(r){ resolveReady=r; }); CANON_INJECTOR.ready=function(){ return readyP; };
var CORE=['bridge','pilot','vtap','hud']; function maybeReady(){ for(var i=0;i<CORE.length;i++){ if(!L[CORE[i]]) return; } if(resolveReady) resolveReady(); }

try{ if(localStorage.getItem('canonHud:visible')==null) localStorage.setItem('canonHud:visible','true'); }catch(e){}

function domReady(){ return new Promise(function(r){ if(document.readyState==='complete'||document.readyState==='interactive') r(); else document.addEventListener('DOMContentLoaded', function(){ r(); }, {once:true}); }); }

var FS_ROOT = w.__CANON_FS_BASE__ || '/@fs/home/curtis/projects/metacurtis-v3.1';
function tryImport(spec){ return import(/* @vite-ignore */ spec).catch(function(){ return null; }); }
function imp(rel, flag, onload){
  var p1='/canon-console/'+rel, p2=FS_ROOT+'/canon-console/'+rel;
  return tryImport(p1).then(function(mod){ return mod || tryImport(p2); })
  .then(function(mod){
    if(!mod){ console.warn('[Canon] Failed to load', rel, '(tried', p1, 'and', p2, ')'); return null; }
    if(flag) L[flag]=true;
    if(onload) return Promise.resolve(onload(mod)).then(function(){ maybeReady(); return mod; });
    maybeReady(); return mod;
  });
}

function installBusCounters(){
  try{
    var bus=w.BeatBus; if(!bus||bus.__canon_patched) return !!bus;
    var emit=bus.emit&&bus.emit.bind?bus.emit.bind(bus):null;
    var on=bus.on&&bus.on.bind?bus.on.bind(bus):null;
    var off=bus.off&&bus.off.bind?bus.off.bind(bus):null;
    if(!emit||!on||!off) return false;
    bus.emit=function(){ busCounts.emit++; return emit.apply(bus, arguments); };
    bus.on=function(){ busCounts.on++; return on.apply(bus, arguments); };
    bus.off=function(){ busCounts.off++; return off.apply(bus, arguments); };
    bus.__canon_patched=true; return true;
  }catch(e){ errors.push(e); return false; }
}

function resolveBusAndPatch(){
  if(installBusCounters()) return;
  var cands=['/src/theater/bus','/src/theater/bus.js','/src/theater/bus/index.js', FS_ROOT+'/src/theater/bus', FS_ROOT+'/src/theater/bus.js'];
  (function next(i){
    if(i>=cands.length){
      var t0=performance.now(); var iv=setInterval(function(){
        if(installBusCounters()||performance.now()-t0>2000) clearInterval(iv);
      },100); return;
    }
    tryImport(cands[i]).then(function(mod){
      if(mod){
        var b=mod.default||mod.BeatBus||mod;
        if(b) w.BeatBus=b;
        if(installBusCounters()) return;
      }
      next(i+1);
    });
  })(0);
}
resolveBusAndPatch();

(function(){
  imp('runtime/bridge-guard.js','bridge')
  .then(function(){ return imp('agent/policy.js', null); })
  .then(function(){ return imp('agent/pilot.js','pilot', function(m){ try{ if(typeof m.startPilot==='function'){ return m.startPilot({auto:true}).then(function(st){ w.CANON_PILOT = st || w.CANON_PILOT || {}; }); } }catch(e){ errors.push(e); } }); })
  .then(function(){ return imp('runtime/violation-tap.js','vtap'); })
  .then(function(){ return domReady(); })
  .then(function(){ installBusCounters(); })
  .then(function(){ return imp('runtime/pilot-ui-mini.js','mini'); })
  .then(function(){ return imp('runtime/hud.js','hud', function(){ try{ var el=document.getElementById('canon-hud-v2'); if(!el) return; if(localStorage.getItem('canonHud:visible')!=='false') el.classList.add('show'); requestAnimationFrame(function(){ el.classList.add('show'); }); setTimeout(function(){ var el2=document.getElementById('canon-hud-v2'); if(el2) el2.classList.add('show'); }, 800); }catch(e){ errors.push(e);} }); })
  .then(function(){ return imp('runtime/steps.js','steps'); })
  .then(function(){ return imp('runtime/playbooks.js','plays'); })
  .then(function(){ w.__canonInjectorV3__.alive=true; console.debug('[Canon] injector v3.4 ready:', w.CANON_CONSOLE.stats()); maybeReady(); });
})();
})();
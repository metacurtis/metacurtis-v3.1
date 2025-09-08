/* eslint-env node */
import fs from 'node:fs'; import path from 'node:path';

const read=(p)=>{ try{return fs.readFileSync(p,'utf8')}catch{ return ''} };
export async function runGoal({goal, apply=false, cwd=process.cwd()}){
  if(goal==='opening:fencepost') return fencepost({apply,cwd});
  if(goal==='opening:visuals')   return visuals({cwd});
  if(goal==='opening:record')    return record();
  console.error('Unknown goal:', goal); return 2;
}

// ---- fencepost (detect + minimal patch) ----
function detect({cwd}){
  const files={ engine:path.join(cwd,'src/engine/ConsciousnessEngine.js'),
                renderer:path.join(cwd,'src/components/webgl/WebGLBackground.jsx'),
                theater:path.join(cwd,'src/components/consciousness/ConsciousnessTheater.jsx'),
                opening:path.join(cwd,'src/components/theater/OpeningSequence.jsx')};
  const s={}; for(const k in files) s[k]=read(files[k]);
  const issues=[];
  if(!/import\s+BeatBus\s+from\s+['"]@\/theater\/bus['"]/.test(s.opening)) issues.push({code:'OPENING_BUS',file:files.opening,msg:'OpeningSequence should import BeatBus'});
  if(/CTF_BUILD/.test(s.opening)) issues.push({code:'OPENING_CTF',file:files.opening,msg:'CTF fade present while CTF is off'});
  if(/(BufferGeometry|useFrame|THREE\.)/.test(s.opening)) issues.push({code:'OPENING_GEOM',file:files.opening,msg:'OpeningSequence must be overlay-only'});
  if(!/buildAndEmitBlueprint[^]*?if\s*\(\s*this\._openingPhase\s*&&\s*stage\s*!==\s*['"]genesis['"]\s*\)/.test(s.engine)) issues.push({code:'ENGINE_GATE',file:files.engine,msg:'Engine must block non-genesis during opening'});
  if(!/BLUEPRINT_READY[^]*mode\s*:\s*['"]emergence['"]/.test(s.engine)) issues.push({code:'ENGINE_MODE',file:files.engine,msg:'Engine BLUEPRINT_READY (emergence) should include mode:"emergence"'});
  const hasSpiral = /(swirl|spiral)/.test(s.engine) || (/ang\s*=\s*(?:i|t)[^;]*\*/.test(s.engine)&&/\br\s*=\s*(?:i|t)\s*\*/.test(s.engine));
  if(hasSpiral) issues.push({code:'ENGINE_SPIRAL',file:files.engine,msg:'Engine emergence uses spiral math; use random->random cloud'});
  if(!/BeatBus\.emit\(\s*EVENTS\.PARTICLES_EMERGED/.test(s.renderer)) issues.push({code:'RENDERER_FENCEPOST',file:files.renderer,msg:'Renderer should emit PARTICLES_EMERGED (emit-once)'});
  if(!/ENGINE_VIEWPORT_HINT/.test(s.theater)) issues.push({code:'THEATER_VIEWPORT',file:files.theater,msg:'Theater should wait for ENGINE_VIEWPORT_HINT'});
  return {issues, files};
}
function patchEngine(enginePath){
  let s = fs.readFileSync(enginePath,'utf8'); let changed=[];
  if(/BLUEPRINT_READY[^]*modes*:/.test(s)===false){
    s=s.replace(/(BeatBus\.emit\(\s*EVENTS\.BLUEPRINT_READY\s*,\s*\{[^\}]*)(\}\s*\)\s*\);)/m,(m,a,b)=>a.replace(/\}\s*$/, ", mode: 'emergence' }")+b);
    changed.push('ENGINE_MODE');
  }
  if(/buildAndEmitBlueprint[^]*?if\s*\(\s*this\._openingPhase\s*&&\s*stage\s*!==\s*['"]genesis['"]\s*\)/.test(s)===false){
    s=s.replace(/(buildAndEmitBlueprint\s*\(\s*stage\s*,\s*quality\s*\)\s*\{)/,'$1\n    if (this._openingPhase && stage !== "genesis") { console.warn("🧠 Engine: blocked non-genesis during opening:", stage); return; }');
    changed.push('ENGINE_GATE');
  }
  const hasSpiral = /(swirl|spiral)/.test(s) || (/ang\s*=\s*(?:i|t)[^;]*\*/.test(s)&&/\br\s*=\s*(?:i|t)\s*\*/.test(s));
  if(hasSpiral){
    if(/function\s+pickDisc\s*\(/.test(s)===false){
      s=s.replace(/(buildEmergenceBlueprint\s*\([^\)]*\)\s*\{)/,'$1\n    function pickDisc(R){ const u=Math.random(); const r=R*Math.sqrt(u); const t=Math.random()*Math.PI*2; return [r*Math.cos(t), r*Math.sin(t)]; }');
    }
    s=s.replace(/for\s*\(\s*let\s+i\s*=\s*0;\s*i\s*<\s*count;\s*i\+\+\s*\)\s*\{[\s\S]*?\}/,(m)=>{
      const head=m.match(/for\s*\(\s*let\s+i\s*=\s*0;\s*i\s*<\s*count;\s*i\+\+\s*\)\s*\{/)[0];
      return head+'\n      const j=i*3;\n      const [ax,ay]=pickDisc(gasRadius||Math.min(vw,vh)*0.38);\n      atmosphericPositions[j+0]=ax; atmosphericPositions[j+1]=ay; atmosphericPositions[j+2]=(Math.random()-0.5)*30;\n      const [tx,ty]=pickDisc(expandedRadius||Math.min(vw,vh)*0.52);\n      text3DPositions[j+0]=tx; text3DPositions[j+1]=ty; text3DPositions[j+2]=(Math.random()-0.5)*30;\n    }';
    });
    changed.push('ENGINE_SPIRAL->RANDOM');
  }
  if(changed.length) fs.writeFileSync(enginePath,s,'utf8');
  return changed;
}
async function fencepost({apply,cwd}){
  const {issues, files}=detect({cwd});
  const errs=issues.filter(i=>!i.level||i.level!=='warn'); const warns=issues.filter(i=>i.level==='warn');
  if(!errs.length&&!warns.length){ console.log('Fencepost: OK'); return 0; }
  if(errs.length){ console.log('Fencepost issues:'); errs.forEach(e=>console.log(' -',e.msg)); }
  if(warns.length){ warns.forEach(w=>console.log('▲',w.msg,'[',path.relative(cwd,w.file),']')); }
  if(apply&&errs.length){
    const changed=patchEngine(files.engine);
    console.log(changed.length?('patched '+changed.join(', ')):'no changes applied');
    const again=detect({cwd}).issues.filter(i=>!i.level||i.level!=='warn');
    if(again.length){ console.log('Remaining:'); again.forEach(i=>console.log(' -',i.msg)); return 1; }
    console.log('Fencepost: OK');
    return 0;
  }
  return errs.length?1:0;
}

// ---- visuals (read telemetry + suggest three knobs) ----
function visuals({cwd}){
  const VC=path.join(cwd,'vision/vision-contract.v1.json');
  const TD=path.join(cwd,'.vision/telemetry');
  if(!fs.existsSync(VC)){ console.log('✘ vision/vision-contract.v1.json missing'); return 1; }
  let tel=null; try{
    const l=fs.readdirSync(TD).filter(f=>f.endsWith('.json'));
    if(l.length) tel=path.join(TD,l.sort((A,B)=>fs.statSync(path.join(TD,B)).mtimeMs-fs.statSync(path.join(TD,A)).mtimeMs)[0]);
  }catch{}
  if(!tel){ console.log('▲ No telemetry found — run: npm run agent:record'); return 0; }
  const vc=JSON.parse(fs.readFileSync(VC,'utf8')); const t=JSON.parse(fs.readFileSync(tel,'utf8'));
  const inR=(v,[lo,hi])=>typeof v==='number'&&v>=lo&&v<=hi, pick=(lbl,val,range,def)=>({lbl,val,ok:inR(val,range),sug:def??Math.max(range[0],Math.min(range[1],Math.round(val??range[0])))});
  const out=[];
  const D=vc.opening.timeline, S=vc.opening.chaosSpin, C=vc.opening.emergenceCloud;
  const chaos=t.chaosMs ?? (t.tChaosEnd&&t.tChaosStart? t.tChaosEnd-t.tChaosStart:null);
  const coal =t.coalesceMs ?? (t.tCoalesceEnd&&t.tCoalesceStart? t.tCoalesceEnd-t.tCoalesceStart:null);
  const sett =t.settleMs   ?? (t.tSettleEnd&&t.tSettleStart? t.tSettleEnd-t.tSettleStart:null);
  const minF =(t.tFadeOutStart&&t.tFillStart)? (t.tFadeOutStart-t.tFillStart):null;
  out.push(pick('CHAOS_MS',chaos,D.chaosMs,1500), pick('COALESCE_MS',coal,D.coalesceMs,1500), pick('SETTLE_MS',sett,D.settleMs,1000), pick('MIN_FILL_VISIBLE_MS',minF,[D.minFillVisibleMs,999999],D.minFillVisibleMs));
  out.push(pick('SPIN_Z_PER_SEC',t.spin?.zPerSec,S.zPerSec,0.55), pick('SPIN_Y_PER_SEC',t.spin?.yPerSec,S.yPerSec,0.25));
  out.push(pick('GAS_RADIUS_FACTOR',t.cloud?.gasRadiusFactor,C.gasRadiusFactor,0.38), pick('EXPANDED_RADIUS_FACTOR',t.cloud?.expandedRadiusFactor,C.expandedRadiusFactor,0.52), pick('Z_RANGE',t.cloud?.zRange,C.zRange,30));
  console.log('\nVision · Suggestions from', path.basename(tel));
  out.forEach(x=>console.log((x.ok?'✔':'▲'), x.lbl, (x.val??'(missing)'), x.ok?'':('→ '+x.sug)));
  const need=out.filter(x=>!x.ok); if(need.length){
    const m=new Map(need.map(n=>[n.lbl,n.sug]));
    console.log('\nSet these knobs:');
    console.log('- Director (src/theater/TheaterDirector.js): CHAOS_MS='+ (m.get('CHAOS_MS')??'/* no change */') +', COALESCE_MS='+ (m.get('COALESCE_MS')??'/* no change */') +', SETTLE_MS='+ (m.get('SETTLE_MS')??'/* no change */'));
    console.log('- Engine (src/engine/ConsciousnessEngine.js): gasRadius = s * '+(m.get('GAS_RADIUS_FACTOR')??'/* no change */')+', expandedRadius = s * '+(m.get('EXPANDED_RADIUS_FACTOR')??'/* no change */')+', zRange = '+(m.get('Z_RANGE')??'/* no change */'));
    console.log('- Renderer chaos (src/components/webgl/WebGLBackground.jsx): rotation.z += delta * '+(m.get('SPIN_Z_PER_SEC')??'/* no change */')+', rotation.y += delta * '+(m.get('SPIN_Y_PER_SEC')??'/* no change */'));
  } else { console.log('\nEverything within contract ranges. ✅'); }
  return 0;
}

// ---- record (prints DevTools probe) ----
function record(){
  const sn = [
'/* Vision Telemetry Probe — paste in DevTools, run once */',
'(()=>{',
'  const BEAT=(window.MC&&window.MC.BeatBus)||window.BeatBus; const EVENTS=(window.MC&&window.MC.EVENTS)||window.EVENTS||{};',
'  if(!BEAT||!EVENTS){ console.warn("BeatBus not available"); return; }',
'  const t={},now=()=>performance.now(); t.tOpeningMounted=now(); const on=(ev,fn)=>BEAT.on(ev,fn);',
'  on(EVENTS.CURSOR_SHOW,()=>{t.tCursorShow=now();});',
'  on(EVENTS.TERMINAL_TYPE,()=>{t.tTypingStart=now();});',
'  on(EVENTS.SCREEN_FILL,()=>{t.tFillStart=now(); t.fillLinesAtStart=(window.__opening_fill_start_lines??0); });',
'  on(EVENTS.PARTICLES_START_EMERGING,()=>{t.tFadeOutStart=now();});',
'  const root=window.__webglRoot||null; t.spin={zPerSec:null,yPerSec:null};',
'  if(root&&root.rotation){ const z0=root.rotation.z,y0=root.rotation.y,t0=now(); setTimeout(()=>{ const dt=(now()-t0)/1000; t.spin.zPerSec=(root.rotation.z-z0)/dt; t.spin.yPerSec=(root.rotation.y-y0)/dt; },1000); }',
'  t.cloud={ gasRadiusFactor: window.__vc_gasRadiusFactor||null, expandedRadiusFactor: window.__vc_expandedRadiusFactor||null, zRange: window.__vc_zRange||null };',
'  window.__visionDump=()=>{ const blob=new Blob([JSON.stringify(t,null,2)],{type:"application/json"}); const a=document.createElement("a"); a.download="vision-telemetry-"+new Date().toISOString().replace(/[:.]/g,"-")+".json"; a.href=URL.createObjectURL(blob); a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),3000); console.log("Vision telemetry downloaded.",t); };',
'  console.log("%cVision Probe installed. After opening, call __visionDump() to download.","color:#0f0");',
'})();'
].join('\n');
  console.log('\nTo record telemetry:');
  console.log('  1) npm run dev  → open the app');
  console.log('  2) DevTools Console → paste the snippet below, press Enter');
  console.log('  3) Let the opening play, then run: __visionDump()');
  console.log('  4) Move the downloaded JSON into .vision/telemetry/  OR ingest:');
  console.log('     npm run agent:run -- --goal=opening:record --from=/path/to/download.json\n');
  console.log('SNIPPET START\n'+sn+'\nSNIPPET END');
  return 0;
}

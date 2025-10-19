#!/usr/bin/env node
/* eslint-env node */
import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(), TELE=path.join(root,'.vision/telemetry');
fs.mkdirSync(TELE,{recursive:true});
const arg=process.argv.find(a=>a.startsWith('--from='));
if(arg){ const src=path.resolve(arg.split('=')[1]); if(!fs.existsSync(src)){ console.error('✘ --from path not found:',src); process.exit(1); } const dst=path.join(TELE,path.basename(src)); fs.copyFileSync(src,dst); console.log('✓ Telemetry ingested →',dst); process.exit(0); }
const snippet=[
'/* Vision Telemetry Probe (paste in DevTools, run once per session) */',
'(()=>{',
'  const BEAT=(window.MC&&window.MC.BeatBus)||window.BeatBus; const EVENTS=(window.MC&&window.MC.EVENTS)||window.EVENTS||{};',
'  if(!BEAT||!EVENTS){ console.warn("BeatBus not available"); return; }',
'  const t={}; const now=()=>performance.now(); t.tOpeningMounted=now(); const on=(ev,fn)=>BEAT.on(ev,fn);',
'  on(EVENTS.CURSOR_SHOW,()=>{t.tCursorShow=now();});',
'  on(EVENTS.TERMINAL_TYPE,()=>{t.tTypingStart=now();});',
'  on(EVENTS.SCREEN_FILL,()=>{t.tFillStart=now();});',
'  on(EVENTS.PARTICLES_START_EMERGING,()=>{t.tFadeOutStart=now();});',
'  // optional spin sampling (requires exposing window.__webglRoot = groupRef)',
'  const root=window.__webglRoot||null; t.spin={zPerSec:null,yPerSec:null};',
'  if(root&&root.rotation){ const z0=root.rotation.z,y0=root.rotation.y,t0=now(); setTimeout(()=>{ const dt=(now()-t0)/1000; t.spin.zPerSec=(root.rotation.z-z0)/dt; t.spin.yPerSec=(root.rotation.y-y0)/dt; },1000); }',
'  t.cloud={ gasRadiusFactor: window.__vc_gasRadiusFactor||null, expandedRadiusFactor: window.__vc_expandedRadiusFactor||null, zRange: window.__vc_zRange||null };',
'  t.fillLinesAtStart = (window.__opening_fill_start_lines ?? 0);',
'  window.__visionDump=()=>{ const blob=new Blob([JSON.stringify(t,null,2)],{type:"application/json"}); const a=document.createElement("a"); a.download="vision-telemetry-"+new Date().toISOString().replace(/[:.]/g,"-")+".json"; a.href=URL.createObjectURL(blob); a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),3000); console.log("Vision telemetry downloaded.",t); };',
'  console.log("%cVision Probe installed. After opening, call __visionDump() to download.","color:#0f0");',
'})();'
].join('\n');
console.log('\nTo record telemetry:');
console.log('  1) npm run dev  → open the app');
console.log('  2) DevTools Console → paste the snippet below, press Enter');
console.log('  3) Let the opening play, then run: __visionDump()');
console.log('  4) Move the downloaded JSON into .vision/telemetry/  OR  ingest:');
console.log('     npm run agent:record -- --from=/path/to/downloaded.json\n');
console.log('SNIPPET START\n'+snippet+'\nSNIPPET END');

#!/usr/bin/env node
/* eslint-env node */
import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(), VC=path.join(root,'vision/vision-contract.v1.json'), TELE=path.join(root,'.vision/telemetry');
const read=j=>JSON.parse(fs.readFileSync(j,'utf8')), rng=(v,[lo,hi])=>typeof v==='number'&&v>=lo&&v<=hi;
if(!fs.existsSync(VC)){ console.error('✘ Vision contract missing at',VC); process.exit(1); }
const vc=read(VC);
let tel=null; try{ const l=fs.readdirSync(TELE).filter(f=>f.endsWith('.json')); if(l.length){ const a=l.map(f=>path.join(TELE,f)).sort((A,B)=>fs.statSync(B).mtimeMs-fs.statSync(A).mtimeMs); tel=a[0]; } }catch{}
if(!tel){ console.log('▲ Vision: no telemetry in .vision/telemetry — run: npm run agent:record'); process.exit(0); }
const t=read(tel); let errors=0;
const minFill=vc.opening.timeline.minFillVisibleMs;
if((t.fillLinesAtStart??0)===0) console.log('✔ No initial fill flash'); else { console.log('✘ Initial fill flashed'); errors++; }
if(typeof t.tFillStart==='number'&&typeof t.tFadeOutStart==='number'){ const vis=t.tFadeOutStart-t.tFillStart; if(vis>=minFill) console.log('✔ Fill visible ≥ min'); else { console.log('✘ Fill visible '+vis+'ms < '+minFill+'ms'); errors++; } } else console.log('▲ Missing tFillStart/tFadeOutStart');
const d=(lbl,val,range)=>{ if(val==null) return; if(rng(val,range)) console.log('✔',lbl,'in range'); else { console.log('✘',lbl,'out of range'); errors++; } };
d('CHAOS', t.chaosMs, vc.opening.timeline.chaosMs);
d('COALESCE', t.coalesceMs, vc.opening.timeline.coalesceMs);
d('SETTLE', t.settleMs, vc.opening.timeline.settleMs);
if(t.spin){ d('Spin Z', t.spin.zPerSec, vc.opening.chaosSpin.zPerSec); d('Spin Y', t.spin.yPerSec, vc.opening.chaosSpin.yPerSec); }
if(t.cloud){ d('gasRadiusFactor', t.cloud.gasRadiusFactor, vc.opening.emergenceCloud.gasRadiusFactor); d('expandedRadiusFactor', t.cloud.expandedRadiusFactor, vc.opening.emergenceCloud.expandedRadiusFactor); d('zRange', t.cloud.zRange, vc.opening.emergenceCloud.zRange); }
console.log('\nVision Sentinel:', errors? 'FAIL':'OK'); process.exit(errors?1:0);

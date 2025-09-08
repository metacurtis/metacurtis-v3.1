#!/usr/bin/env node
/* eslint-env node */
import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(), VC=path.join(root,'vision/vision-contract.v1.json'), TELE=path.join(root,'.vision/telemetry');
const read=j=>JSON.parse(fs.readFileSync(j,'utf8'));
const latest=()=>{ try{const l=fs.readdirSync(TELE).filter(f=>f.endsWith('.json')); if(!l.length) return null; const a=l.map(f=>path.join(TELE,f)).sort((A,B)=>fs.statSync(B).mtimeMs-fs.statSync(A).mtimeMs); return a[0];}catch{return null;} };
if(!fs.existsSync(VC)){ console.error('✘ Vision Contract missing at vision/vision-contract.v1.json'); process.exit(1); }
const vc=read(VC), tel=latest();
if(!tel){ console.log('▲ No telemetry found in .vision/telemetry — run: npm run agent:record'); process.exit(0); }
const t=read(tel), rng=(v,[lo,hi])=>typeof v==='number'&&v>=lo&&v<=hi, pick=(lbl,val,range,def)=>({lbl,val,ok:rng(val,range),sug: def ?? Math.max(range[0], Math.min(range[1], Math.round((val??range[0]))))});
const out=[];
const tl=vc.opening.timeline, ec=vc.opening.emergenceCloud, sp=vc.opening.chaosSpin;
const chaos=t.chaosMs ?? (t.tChaosEnd&&t.tChaosStart? t.tChaosEnd-t.tChaosStart:null);
const coal =t.coalesceMs ?? (t.tCoalesceEnd&&t.tCoalesceStart? t.tCoalesceEnd-t.tCoalesceStart:null);
const sett =t.settleMs   ?? (t.tSettleEnd&&t.tSettleStart? t.tSettleEnd-t.tSettleStart:null);
const minFill = (t.tFadeOutStart&&t.tFillStart)? (t.tFadeOutStart-t.tFillStart):null;
out.push(pick('CHAOS_MS',chaos,tl.chaosMs,1500));
out.push(pick('COALESCE_MS',coal,tl.coalesceMs,1500));
out.push(pick('SETTLE_MS',sett,tl.settleMs,1000));
out.push(pick('MIN_FILL_VISIBLE_MS',minFill,[tl.minFillVisibleMs, 999999], tl.minFillVisibleMs));
out.push(pick('SPIN_Z_PER_SEC', t.spin?.zPerSec, sp.zPerSec, 0.55));
out.push(pick('SPIN_Y_PER_SEC', t.spin?.yPerSec, sp.yPerSec, 0.25));
out.push(pick('GAS_RADIUS_FACTOR', t.cloud?.gasRadiusFactor, ec.gasRadiusFactor, 0.38));
out.push(pick('EXPANDED_RADIUS_FACTOR', t.cloud?.expandedRadiusFactor, ec.expandedRadiusFactor, 0.52));
out.push(pick('Z_RANGE', t.cloud?.zRange, ec.zRange, 30));
console.log('\nVision · Suggestions from', path.basename(tel));
for(const x of out) console.log((x.ok?'✔':'▲'), x.lbl, (x.val??'(missing)'), x.ok?'':('→ '+x.sug));
const need=out.filter(x=>!x.ok);
if(need.length){
  const m=new Map(need.map(n=>[n.lbl,n.sug]));
  console.log('\nSet these knobs:');
  console.log('- Director (src/theater/TheaterDirector.js): CHAOS_MS='+ (m.get('CHAOS_MS')??'/* no change */') +', COALESCE_MS='+ (m.get('COALESCE_MS')??'/* no change */') +', SETTLE_MS='+ (m.get('SETTLE_MS')??'/* no change */'));
  console.log('- Engine (src/engine/ConsciousnessEngine.js): gasRadius = s * '+(m.get('GAS_RADIUS_FACTOR')??'/* no change */')+', expandedRadius = s * '+(m.get('EXPANDED_RADIUS_FACTOR')??'/* no change */')+', zRange = '+(m.get('Z_RANGE')??'/* no change */'));
  console.log('- Renderer chaos (src/components/webgl/WebGLBackground.jsx): rotation.z += delta * '+(m.get('SPIN_Z_PER_SEC')??'/* no change */')+', rotation.y += delta * '+(m.get('SPIN_Y_PER_SEC')??'/* no change */'));
}else{
  console.log('\nEverything within contract ranges. ✅');
}

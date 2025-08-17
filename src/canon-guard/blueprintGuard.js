// src/canon-guard/blueprintGuard.js
import BeatBus from "@/modules/orchestration/core/BeatBusAdapter.js";
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
})();
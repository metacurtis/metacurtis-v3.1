#!/usr/bin/env node
/* eslint-env node */
import fs from 'node:fs';

const file = 'src/engine/ConsciousnessEngine.js';
if (!fs.existsSync(file)) {
  console.error('❌ Missing:', file);
  process.exit(1);
}
let s = fs.readFileSync(file, 'utf8');
if (s.includes('/* HOTDORS ONE-TOUCH PATCH v1 */')) {
  console.log('• Already patched:', file);
  process.exit(0);
}

const patch = `
/* HOTDORS ONE-TOUCH PATCH v1 */
(()=>{ try {
  const inst = (typeof window!=='undefined' && window.consciousnessEngine) ? window.consciousnessEngine : null;
  if (!inst || inst.__hotdorsPatchedV1) return;
  inst.__hotdorsPatchedV1 = true;

  // Defaults if your Engine didn't have them
  if (inst._viewportHint == null) inst._viewportHint = { width: 120, height: 90, aspect: 4/3 };
  if (inst._openingPhase == null) inst._openingPhase = true;
  if (inst._lastEmergenceCloud == null) inst._lastEmergenceCloud = null;
  if (inst._hasBuiltEmergence == null) inst._hasBuiltEmergence = false;

  // --- Add glyph sampler if missing ---
  if (!inst._sampleTextToPositions) {
    inst._makeCanvas = function(w,h){ if (typeof document==='undefined') return null; const c=document.createElement('canvas'); c.width=Math.max(64,w|0); c.height=Math.max(64,h|0); return c; };
    inst._sampleTextToPositions = function(text, count, { font='bold 96px Courier New, monospace', padding=32, threshold=0.5, worldScale=0.12 } = {}) {
      const W=Math.max(320, text.length*58)+padding*2, H=140+padding*2;
      const c=this._makeCanvas(W,H);
      if (!c) { const pos=new Float32Array(count*3), side=Math.ceil(Math.sqrt(count)); let k=0; for(let y=0;y<side&&k<count;y++)for(let x=0;x<side&&k<count;x++,k++){ pos[k*3+0]=(x-side/2); pos[k*3+1]=(y-side/2); pos[k*3+2]=0; } return pos; }
      const ctx=c.getContext('2d',{willReadFrequently:true});
      ctx.clearRect(0,0,W,H); ctx.fillStyle='#fff'; ctx.font=font; ctx.textBaseline='middle'; ctx.textAlign='center'; ctx.fillText(text, W/2, H/2);
      const img=ctx.getImageData(0,0,W,H).data, hits=[];
      for (let j=0;j<H;j++) for (let i=0;i<W;i++){ const a=img[(j*W+i)*4+3]/255; if (a>=threshold) hits.push([i,j]); }
      const pos=new Float32Array(count*3);
      for (let k=0;k<count;k++){ const r=(Math.random()*hits.length)|0; const [px,py]=hits[r]||[W/2,H/2]; pos[k*3+0]=(px-W/2)*worldScale; pos[k*3+1]=(H/2-py)*worldScale; pos[k*3+2]=0; }
      return pos;
    };
  }

  // --- Emergence builder (glyph → viewport ember cloud) ---
  if (!inst._hotdorsBuildEmergenceBlueprint) {
    inst._hotdorsBuildEmergenceBlueprint = function(text='HELLO CURTIS', count=2000){
      const glyph = this._sampleTextToPositions(text, count, { worldScale: 0.12 });
      const vh = this._viewportHint?.height ?? 90, vw = this._viewportHint?.width ?? 120;
      const jitter = Math.min(vw, vh) * 0.45;
      const zDepth = 15.0;

      const atmosphericPositions = new Float32Array(count*3);
      const text3DPositions      = new Float32Array(count*3);
      const sizeMultipliers=new Float32Array(count);
      const opacityData  = new Float32Array(count);
      const atlasIndices = new Float32Array(count);
      const tierData     = new Float32Array(count);
      const animationSeeds=new Float32Array(count*3);

      for (let i=0;i<count;i++){
        const j=i*3, ang=Math.random()*Math.PI*2, rad=Math.random()*jitter;
        atmosphericPositions[j+0]=glyph[j+0];
        atmosphericPositions[j+1]=glyph[j+1];
        atmosphericPositions[j+2]=glyph[j+2];
        text3DPositions[j+0]=glyph[j+0]+Math.cos(ang)*(Math.random()*jitter);
        text3DPositions[j+1]=glyph[j+1]+Math.sin(ang)*(Math.random()*jitter);
        text3DPositions[j+2]=(Math.random()-0.5)*(2*zDepth);
        const t=(tierData[i]=Math.floor(Math.random()*4))|0;
        sizeMultipliers[i]=0.5+Math.random()*1.5;
        opacityData[i]=0.3+Math.random()*0.7;
        atlasIndices[i]=Math.floor(Math.random()*8);
        animationSeeds[j+0]=Math.random(); animationSeeds[j+1]=Math.random(); animationSeeds[j+2]=Math.random();
      }

      return {
        id:'emergence-genesis', mode:'emergence', stageName:'genesis',
        count, particleCount:count, maxParticles:count, activeCount:count,
        atmosphericPositions, text3DPositions, animationSeeds,
        sizeMultipliers, opacityData, atlasIndices, tierData,
        metadata:{ sourceText:text, createdAt:Date.now() }
      };
    };
  }

  // --- Viewport constellation (4 tiers, viewport-sized) ---
  if (!inst._hotdorsConstellation) {
    inst._hotdorsConstellation = function(count, ratios=[0.50,0.20,0.15,0.15], view={width:120,height:90}){
      const positions = new Float32Array(count*3);
      const rnd = (x=>{let t=0; return ()=>{ t = (1103515245*t + 12345) >>> 0; return (t/0xffffffff); };})()(0);
      const tiers = [ Math.floor(count*ratios[0]), Math.floor(count*ratios[1]), Math.floor(count*ratios[2]) ];
      tiers[3] = count - (tiers[0]+tiers[1]+tiers[2]);
      let k=0;
      const pushRect=(n,w,h,j=1.0,z=12)=>{ for (let i=0;i<n;i++){ positions[k*3+0]=(Math.random()*2-1)*(w/2)+(Math.random()-0.5)*j; positions[k*3+1]=(Math.random()*2-1)*(h/2)+(Math.random()-0.5)*j; positions[k*3+2]=(Math.random()-0.5)*z; k++; } };
      pushRect(tiers[0], view.width*0.95, view.height*0.95, 2.0, 30);
      pushRect(tiers[1], view.width*0.80, view.height*0.80, 1.5, 10);
      pushRect(tiers[2], view.width*0.60, view.height*0.60, 1.0,  6);
      pushRect(tiers[3], view.width*0.45, view.height*0.45, 0.8,  8);
      return positions;
    };
  }

  // --- Wrap buildAndEmitBlueprint to gate opening & rebuild genesis from cloud ---
  if (!inst.__hotdorsWrapped) {
    const orig = inst.buildAndEmitBlueprint?.bind(inst);
    if (orig) {
      inst.buildAndEmitBlueprint = function(stage, quality){
        // gate: block non-genesis during opening
        if (this._openingPhase && stage !== 'genesis') {
          // console.log('🧠 HOTDORS gate: block', stage, 'during opening');
          return;
        }
        // post-emergence: rebuild Stage-0 as cloud → viewport constellation
        if (stage==='genesis' && this._hasBuiltEmergence && this._lastEmergenceCloud && this._lastEmergenceCloud.length){
          const baseCount=2000;
          const particleCount = this.getParticleCountForQuality ? this.getParticleCountForQuality(baseCount, quality) : baseCount;
          const bp = this.buildBlueprint ? this.buildBlueprint(stage, {quality}) : { atmosphericPositions:new Float32Array(particleCount*3), text3DPositions:new Float32Array(particleCount*3), activeCount:particleCount, particleCount, maxParticles:particleCount };
          const n = Math.min(bp.atmosphericPositions.length, this._lastEmergenceCloud.length);
          for (let i=0;i<n;i++){ bp.atmosphericPositions[i] = this._lastEmergenceCloud[i]; }
          const ratios = (typeof Canonical!=='undefined' && Canonical?.tierSystem?.defaultRatio) || [0.50,0.20,0.15,0.15];
          const view = this._viewportHint || { width:120, height:90 };
          bp.text3DPositions = this._hotdorsConstellation ? this._hotdorsConstellation(particleCount, ratios, view) : bp.text3DPositions;
          BeatBus.emit && BeatBus.emit(EVENTS.BLUEPRINT_READY, { blueprint: bp, stage, quality, cached:false });
          this._hasBuiltEmergence = false; // use once
          return;
        }
        return orig(stage, quality);
      };
      inst.__hotdorsWrapped = true;
    }
  }

  // --- Add listeners (hint, enable-scroll, emergence) ---
  BeatBus.on && BeatBus.on(EVENTS.ENGINE_VIEWPORT_HINT, (hint={})=>{
    if (hint.width && hint.height) inst._viewportHint = { width:Number(hint.width), height:Number(hint.height), aspect:Number(hint.aspect || hint.width/hint.height) };
  });
  BeatBus.on && BeatBus.on(EVENTS.ENABLE_SCROLL, ()=>{ inst._openingPhase = false; });
  BeatBus.on && BeatBus.on(EVENTS.BUILD_EMERGENCE_BLUEPRINT, (opts={})=>{
    const text = opts.sourceText || 'HELLO CURTIS';
    const count = opts.count || 2000;
    const bp = inst._hotdorsBuildEmergenceBlueprint?.(text, count);
    if (!bp) return;
    inst._lastEmergenceCloud = bp.text3DPositions.slice(0);
    inst._hasBuiltEmergence  = true;
    BeatBus.emit && BeatBus.emit(EVENTS.BLUEPRINT_READY, { blueprint: bp, stage:'genesis', quality: inst.currentQuality || 'HIGH', cached:false, mode:'emergence' });
  });

} catch(e){ console.warn('[HOTDORS PATCH] failed:', e?.message); } })();
`;

// Backup once and append
const bak = `${file}.bak.hotdors-${Date.now()}`;
fs.writeFileSync(bak, s);
fs.writeFileSync(file, s + '\n' + patch + '\n', 'utf8');
console.log('✅ HOTDORS: appended emergence one-touch patch to', file, '\n  ↳ backup:', bak);

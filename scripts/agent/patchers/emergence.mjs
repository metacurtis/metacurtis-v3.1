/* eslint-env node */
import { patchText, readFile, writeFile, backupOnce } from '../core/ast.mjs';

// Renderer emit once (after first full full bind) + refs
export function patchRendererEmitOnce(rel) {
  return patchText(rel, [
    [/(function\s+WebGLBackground\([^)]+\)\s*\{)/, "$1\n  const emergencePendingRef = React.useRef(false);\n  const emittedEmergedRef   = React.useRef(false);"],
    [/useEffect\(\s*\(\)\s*=>\s*\{\s*const off = BeatBus\?\.\on\?\.\(EVENTS\.PARTICLES_START_EMERGING[\s\S]*?\}\s*,\s*\[\]\s*\);\s*/m,
     (m)=> m + "\nuseEffect(()=>{const off=BeatBus?.on?.(EVENTS.PARTICLES_START_EMERGING,()=>{emergencePendingRef.current=true; emittedEmergedRef.current=false;}); return()=>off&&off();},[]);\n"],
    [/console\.log\(\s*`✅ Renderer:[\s\S]*?quality=\$\{quality\}`\s*\);\s*return;\s*\}\s*\n\s*\/\/\s*Minimal emergence/m,
     (m)=> "console.log(`✅ Renderer: ${cached ? 'cached' : 'new'} BLUEPRINT_READY (full)`, `stage=${raw.stageName || st}, count=${raw.particleCount || raw.activeCount}, quality=${quality}`);\n" +
           "if (emergencePendingRef.current && !emittedEmergedRef.current) { BeatBus.emit?.(EVENTS.PARTICLES_EMERGED); emittedEmergedRef.current=true; emergencePendingRef.current=false; }\nreturn;\n// Minimal emergence"]
  ]);
}

// Renderer Stage-0 tint lock
export function patchRendererStage0TintLock(rel) {
  return patchText(rel, [
    [/const\s+\{\s*current,\s*next,\s*acc1,\s*acc2\s*\}\s*=\s*pickStageColors\(stageName\);/,
     "const isGenesis = stageName === 'genesis';\n    const { current, next, acc1, acc2 } = pickStageColors(stageName);"],
    [/uColorNext:\s*\{\s*value:\s*next\s*\}/, "uColorNext: { value: isGenesis ? current : next }"],
    [/uStageBlend\.value\s*=\s*sp\s*;/, "mat.uniforms.uStageBlend.value = (stageName === 'genesis') ? 0 : sp;"]
  ]);
}

// Engine — ensure sampler exists & wide jitter/z-depth in emergence
export function patchEngineGlyphBurst(rel) {
  let s = readFile(rel) || '';
  if (!/_sampleTextToPositions|HOTDORS_GLYPH_SAMPLER/.test(s)) {
    s = s.replace(/constructor\(\)\s*\{[\s\S]*?\}\s*\n\s*async\s+init\(\)/m, (m)=> m + `
  // HOTDORS_GLYPH_SAMPLER
  _makeCanvas(w,h){ if(typeof document==='undefined') return null; const c=document.createElement('canvas'); c.width=Math.max(64,w|0); c.height=Math.max(64,h|0); return c; }
  _sampleTextToPositions(text,count,{font='bold 96px Courier New, monospace',padding=32,threshold=0.5,worldScale=0.12}={}){
    const W=Math.max(320,text.length*58)+padding*2, H=140+padding*2;
    const c=this._makeCanvas(W,H); if(!c){ const pos=new Float32Array(count*3); for(let i=0;i<count;i++){pos[i*3]=((i%64)-32); pos[i*3+1]=(((i/64)|0)-32); pos[i*3+2]=0;} return pos; }
    const ctx=c.getContext('2d',{willReadFrequently:true}); ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#fff'; ctx.font=font; ctx.textBaseline='middle'; ctx.textAlign='center'; ctx.fillText(text,W/2,H/2);
    const img=ctx.getImageData(0,0,W,H).data, hits=[];
    for(let y=0;y<H;y++){ for(let x=0;x<W;x++){ const a=img[(y*W+x)*4+3]/255; if(a>=threshold) hits.push([x,y]); } }
    const pos=new Float32Array(count*3);
    for(let i=0;i<count;i++){ const r=hits[(Math.random()*hits.length)|0]||[W/2,H/2]; const cx=(r[0]-W/2)*worldScale, cy=(H/2-r[1])*worldScale; pos[i*3]=cx; pos[i*3+1]=cy; pos[i*3+2]=0; }
    return pos;
  }
`); writeFile(rel, s);
  }
  return patchText(rel, [
    [/const\s+jitter\s*=\s*\d+[^;]*;/, "const jitter = 28; // HOTDORS: wide ember scatter"],
    [/text3DPositions\[\s*j\s*\+\s*2\s*\]\s*=\s*\(Math\.random\(\)\s*-\s*0\.5\)\s*\*\s*[\d.]+/,
     "text3DPositions[j+2] = (Math.random() - 0.5) * 8.0"]
  ]);
}

// Director — settle morph before scroll
export function patchDirectorSettle(rel) {
  let s = readFile(rel) || '';
  if (!/_easeMorphTo\s*\(/.test(s)) {
    s = s.replace(/sleep\(ms\)\s*\{[\s\S]*?\}\s*\n\s*once\(/m, (m)=> m.replace('once(', `
_easeMorphTo(target = 1, duration = 1400) {
  return new Promise((resolve) => {
    const start = performance.now();
    const ease = (t)=> t*t*(3-2*t);
    const step = (now) => {
      const k = Math.min(1, (now - start) / duration);
      const v = ease(k) * target;
      BeatBus.emit(EVENTS.MORPH_PROGRESS, { value: v });
      if (k < 1) requestAnimationFrame(step); else resolve();
    };
    requestAnimationFrame(step);
  });
}
once(`));
    writeFile(rel, s);
  }
  return patchText(rel, [
    [/BeatBus\.emit\(EVENTS\.ENABLE_SCROLL\);/,
     `// Auto-settle Stage-0 BEFORE scroll
BeatBus.emit(EVENTS.MORPH_PROGRESS, { value: 0 });
await this._easeMorphTo(1, 1400);
BeatBus.emit(EVENTS.ENABLE_SCROLL);`]
  ]);
}

// Opening — remove CTF and add audio gate
export function patchOpeningNoCTFAndAudioGate(rel) {
  return patchText(rel, [
    [/\/\/\s*=+\s*CTF BUILD[\s\S]*?BeatBus\.on\(EVENTS\.PARTICLES_START_EMERGING/,
     `// ========== PARTICLES EMERGING (Fade out) ==========
      BeatBus.on(EVENTS.PARTICLES_START_EMERGING`],
    [/console\.log\('🎬 OpeningSequence: Ready for Director signals'\);\s*/,
     `console.log('🎬 OpeningSequence: Ready for Director signals');
// one-time user gesture gate for autoplay audio
let __gestureOk=false; const __unlock=()=>{__gestureOk=true; try{humAudioRef.current?.play?.().catch(()=>{})}catch{}; window.removeEventListener('pointerdown',__unlock); window.removeEventListener('touchstart',__unlock); window.removeEventListener('keydown',__unlock);};
window.addEventListener('pointerdown',__unlock,{once:true}); window.addEventListener('touchstart',__unlock,{once:true}); window.addEventListener('keydown',__unlock,{once:true});
`],
    [/humAudioRef\.current\s*\.\s*play\(\)\s*\.catch\([^)]+\);/,
     `if(__gestureOk){ humAudioRef.current.play().catch(()=>{}); }`]
  ]);
}

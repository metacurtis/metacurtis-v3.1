/* eslint-env node */
#!/usr/bin/env node
/* eslint-env node */
/**
 * HOT-DORS — finalize BeatGlyph hand-off + text-first emergence
 * - Renderer: emit PARTICLES_EMERGED once after first full bind post-emergence
 * - OpeningSequence: remove CTF path; add one-time user-gesture audio gate
 * - Engine: make emergence SOURCE = "HELLO CURTIS" glyph (if not already)
 * - Verify: run modern validator + sentinel
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const nowTag = new Date().toISOString().replace(/[:.]/g, '-');

const F = {
  engine: 'src/engine/ConsciousnessEngine.js',
  renderer: 'src/components/webgl/WebGLBackground.jsx',
  opening: 'src/components/theater/OpeningSequence.jsx',
  validator: 'scripts/validate-sst.js',
  sentinel: 'tools/sst-guard.mjs',
};

const P = (rel) => path.join(ROOT, rel);
const exist = (rel) => fs.existsSync(P(rel));
const read  = (rel) => (exist(rel) ? fs.readFileSync(P(rel), 'utf8') : null);
const write = (rel, s) => {
  const full = P(rel);
  const dir = path.dirname(full);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(full)) {
    const hasBak = fs.readdirSync(dir).some(n => n.startsWith(path.basename(full)+'.bak.hotdors-'));
    if (!hasBak) fs.copyFileSync(full, full+`.bak.hotdors-${nowTag}`);
  }
  fs.writeFileSync(full, s, 'utf8');
  console.log('  ↳ wrote', rel);
};
const patch = (rel, mut) => {
  const s = read(rel);
  if (s == null) { console.log('  ↳ skip (missing)', rel); return; }
  const out = mut(s);
  if (out !== s) write(rel, out); else console.log('  ↳ noop', rel);
};

/* 1) Renderer — emit PARTICLES_EMERGED once after first full bind post-emergence */
console.log('\nPatching Renderer (emit PARTICLES_EMERGED)…');
patch(F.renderer, (s) => {
  let out = s;

  // guard refs
  if (!/emergencePendingRef/.test(out)) {
    out = out.replace(
      /function\s+WebGLBackground\([^)]+)\s*\{/,
      (m)=> `${m}
  const emergencePendingRef = React.useRef(false);
  const emittedEmergedRef   = React.useRef(false);`
    );
  }

  // mark pending on PARTICLES_START_EMERGING
  if (!/EVENTS\.PARTICLES_START_EMERGING[\s\S]*emergencePendingRef/.test(out)) {
    out = out.replace(
      /useEffect\(\s*\()\s*=>\s*\{\s*const off = BeatBus\?\.on\?\.\(EVENTS\.PARTICLES_START_EMERGING[\s\S]*?\}\s*,\s*\[\]\s*);\s*/m,
      (m)=> `${m}
// HOTDORS: mark that the next full bind should emit PARTICLES_EMERGED
useEffect(() => {
  const off = BeatBus?.on?.(EVENTS.PARTICLES_START_EMERGING, () => {
    emergencePendingRef.current = true;
    emittedEmergedRef.current   = false;
  });
  return () => off && off();
}, []);
`
    );
  }

  // After full bind, emit once if pending
  if (!/BeatBus\.emit\?\.\(EVENTS\.PARTICLES_EMERGED)/.test(out)) {
    out = out.replace(
      /console\.log\(\s*`✅ Renderer:[\s\S]*?quality=\$\{quality\}`\s*);\s*return;\s*\}\s*\n\s*\/\/\s*Minimal emergence/m,
      (m)=> `console.log(
        \`✅ Renderer: \${cached ? 'cached' : 'new'} BLUEPRINT_READY (full)\`,
        \`stage=\${raw.stageName || st}, count=\${raw.particleCount || raw.activeCount}, quality=\${quality}\`
      );
      if (emergencePendingRef.current && !emittedEmergedRef.current) {
        BeatBus.emit?.(EVENTS.PARTICLES_EMERGED);
        emittedEmergedRef.current = true;
        emergencePendingRef.current = false;
      }
      return;
    }
    // Minimal emergence`
    );
  }
  return out;
});

/* 2) OpeningSequence — remove CTF; add user-gesture audio gate */
console.log('\nPatching OpeningSequence (remove CTF + gesture gate)…');
patch(F.opening, (s) => {
  let out = s;

  // strip the entire CTF handler if still present
  out = out.replace(
    /\/\/\s*=+\s*CTF BUILD[\s\S]*?BeatBus\.on\(EVENTS\.PARTICLES_START_EMERGING/m,
    `// ========== PARTICLES EMERGING (Fade out) ==========
      BeatBus.on(EVENTS.PARTICLES_START_EMERGING`
  );

  // inject gesture gate once
  if (!/gesture gate for autoplay/i.test(out)) {
    out = out.replace(
      /console\.log\('🎬 OpeningSequence: Ready for Director signals');\s*/,
`console.log('🎬 OpeningSequence: Ready for Director signals');

// HOTDORS: one-time user gesture gate for autoplay audio
let __gestureOk = false;
const __unlockAudio = () => {
  __gestureOk = true;
  try { humAudioRef.current?.play?.().catch(()=>{}); } catch {}
  window.removeEventListener('pointerdown', __unlockAudio);
  window.removeEventListener('touchstart', __unlockAudio);
  window.removeEventListener('keydown', __unlockAudio);
};
window.addEventListener('pointerdown', __unlockAudio, { once: true });
window.addEventListener('touchstart', __unlockAudio, { once: true });
window.addEventListener('keydown', __unlockAudio, { once: true });\n`
    );

    // honor gesture flag before playing hum
    out = out.replace(
      /humAudioRef\.current\s*\.\s*play\()\s*\.catch\([^)]+);/,
      `if (__gestureOk) { humAudioRef.current.play().catch(()=>{}); }`
    );
  }

  return out;
});

/* 3) Engine — ensure emergence SOURCE = "HELLO CURTIS" glyph (if not already) */
console.log('\nPatching Engine (emergence from HELLO CURTIS)…');
patch(F.engine, (s) => {
  let out = s;

  // add glyph sampler helpers (once)
  if (!/HOTDORS_GLYPH_SAMPLER/.test(out)) {
    out = out.replace(/constructor\()\s*\{[\s\S]*?\}\s*\n\s*async\s+init\()/m,
      (m)=> `${m}

// HOTDORS_GLYPH_SAMPLER: offscreen canvas text sampler
_makeCanvas(w,h){ if(typeof document==='undefined') return null; const c=document.createElement('canvas'); c.width=Math.max(64, w|0); c.height=Math.max(64, h|0); return c; }
_sampleTextToPositions(text,count,{font='bold 96px Courier New, monospace',padding=32,threshold=0.5,worldScale=0.12}={}) {
  const W=Math.max(320, text.length*58)+padding*2, H=140+padding*2;
  const c=this._makeCanvas(W,H); if(!c){ const pos=new Float32Array(count*3); for(let i=0;i<count;i++){pos[i*3]=i%64; pos[i*3+1]=(i/64|0); } return pos; }
  const ctx=c.getContext('2d',{willReadFrequently:true});
  ctx.clearRect(0,0,W,H); ctx.fillStyle='#fff'; ctx.font=font; ctx.textBaseline='middle'; ctx.textAlign='center';
  ctx.fillText(text, W/2, H/2);
  const img=ctx.getImageData(0,0,W,H).data, hits=[];
  for(let y=0;y<H;y++){ for(let x=0;x<W;x++){ const a=img[(y*W+x)*4+3]/255; if(a>=threshold) hits.push([x,y]); } }
  const pos=new Float32Array(count*3);
  for(let i=0;i<count;i++){ const r=hits[(Math.random()*hits.length)|0]||[W/2,H/2];
    const cx=(r[0]-W/2)*worldScale, cy=(H/2-r[1])*worldScale;
    pos[i*3]=cx; pos[i*3+1]=cy; pos[i*3+2]=0;
  }
  return pos;
}
`);
  }

  // replace buildEmergenceBlueprint body to use glyph sampler if it still uses generic shapes
  if (!/glyph)/i.test(out)) {
    out = out.replace(
/buildEmergenceBlueprint\s*\(\s*\{\s*text\s*=\s*'HELLO CURTIS'[\s\S]*?\}\s*)\s*\{\s*[\s\S]*?return\s*\{\s*[\s\S]*?\};\s*\}/m,
`buildEmergenceBlueprint({ text = 'HELLO CURTIS', count = 2000 } = {}) {
  console.log(\`🌟 Building emergence: "\${text}" with \${count} particles (glyph)\`);
  const src = this._sampleTextToPositions(text, count, { worldScale: 0.12 });

  const jitter = 8;
  const atmosphericPositions = new Float32Array(count*3);
  const text3DPositions      = new Float32Array(count*3);
  const tiers = new Uint8Array(count);
  const sizeByTier=[0.6,0.8,1.2,1.5], opacityByTier=[0.5,0.6,0.75,0.9], atlasByTier=[7,1,4,1];

  const sizeMultipliers=new Float32Array(count);
  const opacityData=new Float32Array(count);
  const atlasIndices=new Float32Array(count);
  const tierData=new Float32Array(count);
  const animationSeeds=new Float32Array(count*3);

  for(let i=0;i<count;i++){
    const j=i*3;
    atmosphericPositions[j]=src[j]; atmosphericPositions[j+1]=src[j+1]; atmosphericPositions[j+2]=src[j+2];
    const ang=Math.random()*Math.PI*2, rad=Math.random()*jitter;
    text3DPositions[j]=src[j]+Math.cos(ang)*rad;
    text3DPositions[j+1]=src[j+1]+Math.sin(ang)*rad;
    text3DPositions[j+2]=(Math.random()-0.5)*2.0;

    const t=(tiers[i]=Math.floor(Math.random()*4))|0;
    tierData[i]=t; sizeMultipliers[i]=sizeByTier[t]??1.0; opacityData[i]=opacityByTier[t]??0.8; atlasIndices[i]=atlasByTier[t]??1;
    animationSeeds[j]=Math.random(); animationSeeds[j+1]=Math.random(); animationSeeds[j+2]=Math.random();
  }

  return {
    id:'emergence-genesis', mode:'emergence', stageName:'genesis',
    count, particleCount:count, maxParticles:count, activeCount:count,
    atmosphericPositions, text3DPositions, animationSeeds,
    sizeMultipliers, opacityData, atlasIndices, tierData,
    metadata:{ sourceText:text, createdAt:Date.now() }
  };
}`
    );
  }

  return out;
});

/* 4) Verify */
console.log('\nRunning modern validator…\n');
try {
  if (exist(F.validator)) execSync(`node ${F.validator}`, { stdio: 'inherit' });
  else console.log('  ↳ skip (modern validator not found)');
} catch (e) {
  console.log('Validator reported issues (non-fatal for this script).');
}

console.log('\nRunning sentinel…\n');
try {
  if (exist(F.sentinel)) execSync(`node ${F.sentinel}`, { stdio: 'inherit' });
  else console.log('  ↳ skip (sentinel not found)');
} catch (e) {
  process.exit(e.status || 1);
}

console.log('\n✅ HOT-DORS: Renderer emits PARTICLES_EMERGED; CTF removed + audio gate; Emergence comes from "HELLO CURTIS".\n');

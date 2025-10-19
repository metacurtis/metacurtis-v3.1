/* eslint-env node */
#!/usr/bin/env node
/* eslint-env node */
/**
 * Goal-driven repo doctor (interactive, human-in-the-loop)
 * Flow:
 * 1) Clarify goal (prompt if missing) + confirm file scope from user
 * 2) Read Canonical → derive invariants for the goal
 * 3) Detect → Propose Fix Plan → Ask approval
 * 4) Apply → Validate (modern validator + sentinel) → Re-detect
 * 5) Loop until green or explain blockers
 */

import fs from 'fs';
import path from 'path';
import readline from 'node:readline';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const args = Object.fromEntries(process.argv.slice(2).map(a=>{
  const m=a.match(/^--([^=]+)(?:=(.*))?$/); return m?[m[1],m[2]??true]:null;
}).filter(Boolean));

const F = {
  canonical: 'src/config/canonical/sst-v3.3.json',
  engine: 'src/engine/ConsciousnessEngine.js',
  renderer: 'src/components/webgl/WebGLBackground.jsx',
  opening: 'src/components/theater/OpeningSequence.jsx',
  director: 'src/theater/TheaterDirector.js',
  orchestrator: 'src/theater/ScrollOrchestrator.js',
  validator: 'scripts/validate-sst.js',
  sentinel: 'tools/sst-guard.mjs',
};

const P = (rel)=>path.join(ROOT, rel);
const exists = (rel)=>fs.existsSync(P(rel));
const read = (rel)=>exists(rel)? fs.readFileSync(P(rel),'utf8') : null;
const write = (rel, s)=>fs.writeFileSync(P(rel), s, 'utf8');
const sh = (cmd)=>execSync(cmd, { stdio: 'inherit' });

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q)=>new Promise(res=>rl.question(q, a=>res(a.trim())));

function log(...a){ console.log(...a); }

// ---------- canon ----------
function loadCanon() {
  try { return JSON.parse(read(F.canonical)||'{}'); } catch { return {}; }
}
const CLAMP01 = (v)=>Math.max(0, Math.min(1, Number(v)||0));

// ---------- detect helpers (emergence goal) ----------
function detectEngineGlyph(engine) {
  return /_sampleTextToPositions|HOTDORS_GLYPH_SAMPLER/.test(engine||'');
}
function detectRendererEmergedEmit(rsrc) {
  return /BeatBus\.emit\?\.\(EVENTS\.PARTICLES_EMERGED)/.test(rsrc||'');
}
function detectOpeningCTF(osrc) { return /CTF_BUILD/.test(osrc||''); }
function detectOpeningAudioGate(osrc) { return /__gestureOk|__unlockAudio|gesture gate for autoplay/.test(osrc||''); }
function detectDirectorHandoff(dsrc) {
  return /once\(\s*EVENTS\.PARTICLES_EMERGED[^]*STAGE_CHANGE[^]*['"]genesis['"][^]*ENABLE_SCROLL/.test(dsrc||'');
}
function detectOrchestrator() { return exists(F.orchestrator); }

// ---------- propose plan ----------
function proposePlan(goal, canon, scope) {
  const engine = scope.includes(F.engine) ? read(F.engine) : null;
  const renderer = scope.includes(F.renderer) ? read(F.renderer) : null;
  const opening = scope.includes(F.opening) ? read(F.opening) : null;
  const director = scope.includes(F.director) ? read(F.director) : null;

  const plan = [];
  if (goal === 'emergence') {
    if (engine && !detectEngineGlyph(engine)) {
      plan.push({ id:'engine.glyph', why:'Emergence SOURCE must be the stage word (Canon). Engine not sampling glyph.', file:F.engine });
    }
    if (renderer && !detectRendererEmergedEmit(renderer)) {
      plan.push({ id:'renderer.emit', why:'Director waits for PARTICLES_EMERGED; renderer must emit once post-first full bind.', file:F.renderer });
    }
    if (opening && detectOpeningCTF(opening)) {
      plan.push({ id:'opening.ctf', why:'CTF path is deprecated; fade must be tied to PARTICLES_START_EMERGING only.', file:F.opening });
    }
    if (opening && !detectOpeningAudioGate(opening)) {
      plan.push({ id:'opening.audio', why:'Browser blocks autoplay; add one-time user-gesture gate for hum.', file:F.opening });
    }
    if (director && !detectDirectorHandoff(director)) {
      plan.push({ id:'director.handoff', why:'Hand-off must be once(PARTICLES_EMERGED) → STAGE_CHANGE(genesis) → ENABLE_SCROLL.', file:F.director });
    }
    if (!detectOrchestrator()) {
      plan.push({ id:'orchestrator.missing', why:'ScrollOrchestrator not found; add / start to map scroll→morph/stage.', file:F.orchestrator });
    }
  }
  return plan;
}

// ---------- patchers (goal: emergence) ----------
function applyEngineGlyph() {
  let s=read(F.engine)||''; if(!s) return false;
  let changed=false;
  if (!/_sampleTextToPositions/.test(s)) {
    s = s.replace(/constructor\()\s*\{[\s\S]*?\}\s*\n\s*async\s+init\()/m,
      (m)=>`${m}
  // HOTDORS_GLYPH_SAMPLER
  _makeCanvas(w,h){ if(typeof document==='undefined') return null; const c=document.createElement('canvas'); c.width=Math.max(64,w|0); c.height=Math.max(64,h|0); return c; }
  _sampleTextToPositions(text,count,{font='bold 96px Courier New, monospace',padding=32,threshold=0.5,worldScale=0.12}={}){
    const W=Math.max(320,text.length*58)+padding*2, H=140+padding*2;
    const c=this._makeCanvas(W,H); if(!c){ const pos=new Float32Array(count*3); for(let i=0;i<count;i++){pos[i*3]=i%64; pos[i*3+1]=(i/64|0);} return pos; }
    const ctx=c.getContext('2d',{willReadFrequently:true}); ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#fff'; ctx.font=font; ctx.textBaseline='middle'; ctx.textAlign='center';
    ctx.fillText(text,W/2,H/2);
    const img=ctx.getImageData(0,0,W,H).data, hits=[];
    for(let y=0;y<H;y++){ for(let x=0;x<W;x++){ const a=img[(y*W+x)*4+3]/255; if(a>=threshold) hits.push([x,y]); } }
    const pos=new Float32Array(count*3);
    for(let i=0;i<count;i++){ const r=hits[(Math.random()*hits.length)|0]||[W/2,H/2];
      const cx=(r[0]-W/2)*worldScale, cy=(H/2-r[1])*worldScale; pos[i*3]=cx; pos[i*3+1]=cy; pos[i*3+2]=0; }
    return pos;
  }
`); changed=true;
  }
  if (!/with \\\${count} particles \(glyph)/.test(s)) {
    const genesisWord = (loadCanon()?.stages?.genesis?.word) || 'HELLO CURTIS';
    s = s.replace(
/buildEmergenceBlueprint\s*\(\s*\{\s*text\s*=\s*['"][^'"]+['"][\s\S]*?\}\s*)\s*\{\s*[\s\S]*?return\s*\{\s*[\s\S]*?\};\s*\}/m,
`buildEmergenceBlueprint({ text = '${genesisWord}', count = 2000 } = {}) {
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
    const j=i*3, ang=Math.random()*Math.PI*2, rad=Math.random()*jitter;
    atmosphericPositions[j]=src[j]; atmosphericPositions[j+1]=src[j+1]; atmosphericPositions[j+2]=src[j+2];
    text3DPositions[j]=src[j]+Math.cos(ang)*rad; text3DPositions[j+1]=src[j+1]+Math.sin(ang)*rad; text3DPositions[j+2]=(Math.random()-0.5)*2.0;

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
    ); changed=true;
  }
  if (changed) write(F.engine, s);
  return changed;
}
function applyRendererEmit() {
  let s=read(F.renderer)||''; if(!s) return false;
  if (detectRendererEmergedEmit(s)) return false;
  if (!/emergencePendingRef/.test(s)) {
    s = s.replace(/function\s+WebGLBackground\([^)]+)\s*\{/,
      (m)=>`${m}\n  const emergencePendingRef = React.useRef(false);\n  const emittedEmergedRef   = React.useRef(false);`);
  }
  if (!/EVENTS\.PARTICLES_START_EMERGING[\s\S]*emergencePendingRef/.test(s)) {
    s = s.replace(/useEffect\(\s*\()\s*=>\s*\{\s*const off = BeatBus\?\.on\?\.\(EVENTS\.PARTICLES_START_EMERGING[\s\S]*?\}\s*,\s*\[\]\s*);\s*/m,
      (m)=>`${m}\nuseEffect(()=>{const off=BeatBus?.on?.(EVENTS.PARTICLES_START_EMERGING,()=>{emergencePendingRef.current=true; emittedEmergedRef.current=false;}); return()=>off&&off();},[]);\n`);
  }
  s = s.replace(
    /console\.log\(\s*`✅ Renderer:[\s\S]*?quality=\$\{quality\}`\s*);\s*return;\s*\}\s*\n\s*\/\/\s*Minimal emergence/m,
    (m)=>`console.log(\`✅ Renderer: \${cached ? 'cached' : 'new'} BLUEPRINT_READY (full)\`, \`stage=\${raw.stageName || st}, count=\${raw.particleCount || raw.activeCount}, quality=\${quality}\`);
      if (emergencePendingRef.current && !emittedEmergedRef.current) { BeatBus.emit?.(EVENTS.PARTICLES_EMERGED); emittedEmergedRef.current=true; emergencePendingRef.current=false; }
      return;\n    // Minimal emergence`
  );
  write(F.renderer, s); return true;
}
function applyOpeningFixes() {
  let s=read(F.opening)||''; if(!s) return false;
  let changed=false;
  if (detectOpeningCTF(s)) {
    s = s.replace(/\/\/\s*=+\s*CTF BUILD[\s\S]*?BeatBus\.on\(EVENTS\.PARTICLES_START_EMERGING/m,
      `// ========== PARTICLES EMERGING (Fade out) ==========\n      BeatBus.on(EVENTS.PARTICLES_START_EMERGING`);
    changed=true;
  }
  if (!detectOpeningAudioGate(s)) {
    s = s.replace(/console\.log\('🎬 OpeningSequence: Ready for Director signals');\s*/,
`console.log('🎬 OpeningSequence: Ready for Director signals');
// one-time user gesture gate for autoplay audio
let __gestureOk=false; const __unlock=()=>{__gestureOk=true; try{humAudioRef.current?.play?.().catch(()=>{})}catch{}; window.removeEventListener('pointerdown',__unlock); window.removeEventListener('touchstart',__unlock); window.removeEventListener('keydown',__unlock);};
window.addEventListener('pointerdown',__unlock,{once:true}); window.addEventListener('touchstart',__unlock,{once:true}); window.addEventListener('keydown',__unlock,{once:true});
`);
    s = s.replace(/humAudioRef\.current\s*\.\s*play\()\s*\.catch\([^)]+);/, `if(__gestureOk){humAudioRef.current.play().catch(()=>{})}`);
    changed=true;
  }
  if (changed) write(F.opening, s);
  return changed;
}

// ---------- run one pass ----------
function runValidate() {
  let ok=true;
  try { if (exists(F.validator)) sh(`node ${F.validator}`); } catch { ok=false; }
  try { if (exists(F.sentinel)) sh(`node ${F.sentinel}`); } catch { ok=false; }
  return ok;
}

async function main() {
  // 1) Clarify goal & scope
  let goal = String(args.goal||'').trim();
  if (!goal) {
    goal = await ask('Goal (e.g., emergence): ');
  }
  if (!['emergence'].includes(goal)) {
    console.log(`Unsupported goal "${goal}". Supported: emergence`);
    rl.close(); process.exit(1);
  }

  let scopeInput = (args.files||'').trim();
  if (!scopeInput) {
    scopeInput = await ask('Files in scope (comma-separated, or leave empty to auto-add): ');
  }
  const scope = new Set(
    scopeInput ? scopeInput.split(',').map(s=>s.trim()).filter(Boolean) : []
  );
  // Auto-add critical role files for emergence
  [F.engine, F.renderer, F.opening, F.director, F.orchestrator].forEach(f=>{ if (exists(f)) scope.add(f) });

  console.log('\n📦 Scope:', Array.from(scope).join(', ') || '(auto)');

  // 2) Load Canonical & derive invariants
  const canon = loadCanon();
  console.log('🧭 Canonical word(genesis):', canon?.stages?.genesis?.word || 'HELLO CURTIS');

  // 3) Detect & propose plan
  const engine = scope.has(F.engine)? read(F.engine): null;
  const renderer = scope.has(F.renderer)? read(F.renderer): null;
  const opening = scope.has(F.opening)? read(F.opening): null;
  const director = scope.has(F.director)? read(F.director): null;

  const todo = [];
  if (goal==='emergence') {
    if (engine && !detectEngineGlyph(engine)) todo.push({id:'engine.glyph', file:F.engine, why:'Emergence SOURCE must be stage word (glyph sampler).'});
    if (renderer && !detectRendererEmergedEmit(renderer)) todo.push({id:'renderer.emit', file:F.renderer, why:'Renderer must emit PARTICLES_EMERGED once post-first full bind.'});
    if (opening && detectOpeningCTF(opening)) todo.push({id:'opening.ctf', file:F.opening, why:'Remove legacy CTF fade path.'});
    if (opening && !detectOpeningAudioGate(opening)) todo.push({id:'opening.audio', file:F.opening, why:'Add one-time user-gesture gate for autoplay audio.'});
    if (director && !detectDirectorHandoff(director)) todo.push({id:'director.handoff', file:F.director, why:'Ensure once(PARTICLES_EMERGED) → STAGE_CHANGE(genesis) → ENABLE_SCROLL.'});
  }

  console.log('\n📝 Proposed plan:');
  if (!todo.length) console.log('  (No immediate changes proposed for the selected scope.)');
  else todo.forEach((t,i)=>console.log(`  ${i+1}. ${t.id} — ${t.why} [${t.file}]`));

  const ok = await ask('\nApply these change(s)? (y/N): ');
  if (ok.toLowerCase() !== 'y') { rl.close(); process.exit(0); }

  // 4) Apply patches (only those in scope)
  let changed=false;
  if (todo.find(t=>t.id==='engine.glyph')) { changed = applyEngineGlyph() || changed; }
  if (todo.find(t=>t.id==='renderer.emit')) { changed = applyRendererEmit() || changed; }
  if (todo.some(t=>t.id.startsWith('opening.'))) { changed = applyOpeningFixes() || changed; }

  // 5) Re-validate
  console.log('\n🔁 Validating (modern) + sentinel…\n');
  let green = runValidate();

  // 6) Retry loop (one extra pass) if not green
  if (!green) {
    console.log('\n⚠️ Still failing. Re-detecting…');
    // you could expand to add more nuanced retries here
    green = runValidate();
  }

  // 7) Report
  if (green) {
    console.log('\n✅ Goal appears satisfied: validator + sentinel green.');
    if ((await ask('Commit changes? (y/N): ')).toLowerCase()==='y') {
      try { execSync('git add -A', {stdio:'inherit'}); execSync(`git commit -m "agent(goal:${goal}): align with Canonical v3.3"`, {stdio:'inherit'}); } catch {}
    }
  } else {
    console.log('\n❌ Not fully green. Suggested checks:');
    console.log('  1) Verify renderer emits PARTICLES_EMERGED once (DevTools BeatBus tap).');
    console.log('  2) Confirm Director hand-off + ENABLE_SCROLL + orchestrator start.');
    console.log('  3) Confirm Engine emergence SOURCE equals Canonical.stages.genesis.word.');
  }

  rl.close();
  process.exit(green?0:1);
}

main().catch(err=>{
  console.error(err);
  try { rl.close(); } catch {}
  process.exit(1);
});

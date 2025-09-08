#!/usr/bin/env node
/* eslint-env node */
/**
 * HOT-DORS — Agent Upgrade (generic, canon-driven, goal registry)
 * Creates:
 *   goals/emergence.json                              (goal invariants)
 *   scripts/agent/core/{canon.mjs,ast.mjs,verify.mjs}
 *   scripts/agent/detectors/{emergence.mjs}
 *   scripts/agent/patchers/{emergence.mjs}
 *   scripts/agent/runner.mjs                          (interactive goal runner)
 * Also adds npm script: "agent:run"
 * Finally runs a self-check (validator + sentinel) to ensure upgrade installed.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const T = (rel) => path.join(ROOT, rel);
const exists = (rel) => fs.existsSync(T(rel));
const write = (rel, s) => {
  const p = T(rel), d = path.dirname(p);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(p, s, 'utf8');
  console.log('  ↳ wrote', rel);
};
const addScriptIfMissing = (script, cmd) => {
  const pkgPath = T('package.json');
  if (!exists('package.json')) return;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.scripts = pkg.scripts || {};
  if (!pkg.scripts[script]) {
    pkg.scripts[script] = cmd;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    console.log(`  ↳ package.json scripts.${script} = "${cmd}"`);
  }
};

// ----- 1) Goal Registry (emergence) -----
write('goals/emergence.json', `{
  "name": "emergence",
  "description": "Particles must emerge from stage word glyph as a wide ember burst, remain Stage-0 green, auto-settle to constellation, then enable scroll.",
  "invariants": [
    { "id": "engine.glyphSource",          "role": "engine",    "desc": "Emergence SOURCE = Canon.stages.genesis.word glyph pixels" },
    { "id": "engine.burstParams",          "role": "engine",    "desc": "Wide ember burst jitter >= 25, zDepth >= 6" },
    { "id": "renderer.emitOnce",           "role": "renderer",  "desc": "Emit PARTICLES_EMERGED once after first full bind post-emergence" },
    { "id": "renderer.stage0TintLock",     "role": "renderer",  "desc": "Stage-0: uColorNext=uColorCurrent, uStageBlend=0 (all green)" },
    { "id": "director.settleBeforeScroll", "role": "director",  "desc": "After PARTICLES_EMERGED → STAGE_CHANGE('genesis'), auto-morph 0→1, then ENABLE_SCROLL" },
    { "id": "opening.noCTF",               "role": "opening",   "desc": "CTF path removed; fade only on PARTICLES_START_EMERGING" },
    { "id": "opening.audioGate",           "role": "opening",   "desc": "User gesture gate for autoplay audio" }
  ]
}
`);

// ----- 2) Core: Canon Reasoner -----
write('scripts/agent/core/canon.mjs', `/* eslint-env node */
import fs from 'fs';
import path from 'path';

export function loadCanonical() {
  const p = path.join(process.cwd(), 'src/config/canonical/sst-v3.3.json');
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}
export function loadGoal(goalName) {
  const p = path.join(process.cwd(), 'goals', goalName + '.json');
  if (!fs.existsSync(p)) throw new Error('Goal not found: ' + goalName);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
export function getInvariants(goalName) {
  const goal = loadGoal(goalName);
  return goal.invariants || [];
}
export function explainInvariant(inv, canon) {
  if (inv.id === 'engine.glyphSource') return 'Emergence SOURCE must sample glyph pixels of ' + (canon?.stages?.genesis?.word || 'HELLO CURTIS');
  if (inv.id === 'engine.burstParams') return 'Ember burst jitter >= 25 and zDepth >= 6 for firefly look';
  if (inv.id === 'renderer.emitOnce') return 'Renderer must emit PARTICLES_EMERGED once after first full bind';
  if (inv.id === 'renderer.stage0TintLock') return 'Stage-0 tint locked to C64 green (no crossfade)';
  if (inv.id === 'director.settleBeforeScroll') return 'Settle morph (0→1) before enabling scroll';
  if (inv.id === 'opening.noCTF') return 'Remove deprecated CTF fade path';
  if (inv.id === 'opening.audioGate') return 'Add one-time user-gesture gate to satisfy autoplay policy';
  return inv.desc || inv.id;
}
`);

// ----- 3) Core: AST helpers (Babel) + safe text patch fallback -----
write('scripts/agent/core/ast.mjs', `/* eslint-env node */
import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';

export function readFile(rel) {
  const p = path.join(process.cwd(), rel);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}
export function writeFile(rel, content) {
  const p = path.join(process.cwd(), rel);
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
}
export function backupOnce(rel) {
  const p = path.join(process.cwd(), rel);
  if (!fs.existsSync(p)) return;
  const dir = path.dirname(p), base = path.basename(p);
  const has = fs.readdirSync(dir).some(n => n.startsWith(base + '.bak.agent-'));
  if (!has) fs.copyFileSync(p, path.join(dir, base + '.bak.agent-' + Date.now()));
}
export function parseModule(src) {
  return parse(src, { sourceType: 'module', plugins: ['jsx', 'classProperties', 'typescript'] });
}
export function transform(rel, fn) {
  const src = readFile(rel); if (!src) return false;
  const ast = parseModule(src);
  const ctx = { mutated: false, src };
  fn(ast, ctx, src);
  if (ctx.mutated) {
    const out = generate(ast, { retainLines: true }).code;
    backupOnce(rel);
    writeFile(rel, out);
    return true;
  }
  return false;
}
// Simple fallback replace (safe, idempotent-ish)
export function patchText(rel, replacers = []) {
  const src = readFile(rel); if (!src) return false;
  let out = src, changed = false;
  for (const [pattern, replacement] of replacers) {
    const before = out;
    out = out.replace(pattern, replacement);
    if (out !== before) changed = true;
  }
  if (changed) { backupOnce(rel); writeFile(rel, out); }
  return changed;
}
`);

// ----- 4) Core: verify (validator + sentinel) -----
write('scripts/agent/core/verify.mjs', `/* eslint-env node */
import { execSync } from 'node:child_process';

export function runValidator() {
  try { execSync('node scripts/validate-sst.js', { stdio: 'inherit' }); return true; }
  catch { return false; }
}
export function runSentinel() {
  try { execSync('node tools/sst-guard.mjs', { stdio: 'inherit' }); return true; }
  catch (e) { return false; }
}
export function verifyAll() {
  const v = runValidator();
  const s = runSentinel();
  return v && s;
}
`);

// ----- 5) Detectors (emergence) -----
write('scripts/agent/detectors/emergence.mjs', `/* eslint-env node */
import { readFile } from '../core/ast.mjs';

export function detectEngineGlyphSource(rel) {
  const s = readFile(rel) || '';
  return /_sampleTextToPositions|HOTDORS_GLYPH_SAMPLER/.test(s);
}
export function detectEngineBurstParams(rel) {
  const s = readFile(rel) || '';
  const hasJitter = /jitter\s*=\s*(\d+)/.exec(s);
  const hasZ = /text3DPositions\\\[j\\+2\\]\s*=\s*\(Math\.random\(\)\s*-\s*0\.5\)\s*\*\s*(\d+(\.\d+)*)/.exec(s);
  const okJitter = hasJitter && Number(hasJitter[1]) >= 25;
  const okZ = hasZ && Number(hasZ[1]) >= 6;
  return !!(okJitter && okZ);
}
export function detectRendererEmitOnce(rel) {
  const s = readFile(rel) || '';
  return /BeatBus\.emit\?\.\(EVENTS\.PARTICLES_EMERGED\)/.test(s);
}
export function detectRendererStage0TintLock(rel) {
  const s = readFile(rel) || '';
  const hasIsGenesis = /const\s+isGenesis\s*=\s*stageName\s*===\s*['"]genesis['"]/.test(s);
  const lockNext = /uColorNext:\s*\{\s*value:\s*isGenesis\s*\?\s*current\s*:\s*next\s*\}/.test(s);
  const lockBlend = /uStageBlend\.value\s*=\s*\(stageName\s*===\s*['"]genesis['"]\)\s*\?\s*0\s*:\s*sp/.test(s);
  return hasIsGenesis && lockNext && lockBlend;
}
export function detectDirectorSettle(rel) {
  const s = readFile(rel) || '';
  const hasHelper = /_easeMorphTo\s*\(/.test(s);
  const sequence = /once\(\s*EVENTS\.PARTICLES_EMERGED[\s\S]*STAGE_CHANGE\(['"]genesis['"]\)[\s\S]*_easeMorphTo\(\s*1/.test(s);
  return hasHelper && sequence;
}
export function detectOpeningNoCTF(rel) {
  const s = readFile(rel) || '';
  return !/CTF_BUILD/.test(s);
}
export function detectOpeningAudioGate(rel) {
  const s = readFile(rel) || '';
  return /__gestureOk|__unlockAudio|gesture gate for autoplay/.test(s);
}
`);

// ----- 6) Patchers (emergence) — AST + safe text fallback -----
write('scripts/agent/patchers/emergence.mjs', `/* eslint-env node */
import { transform, patchText, readFile, writeFile, backupOnce } from '../core/ast.mjs';
import path from 'path';

export function patchRendererEmitOnce(rel) {
  // fallback text: add emit in BLUEPRINT_READY full bind block and refs
  return patchText(rel, [
    [/(function\s+WebGLBackground\([^)]+\)\s*\{)/, "$1\\n  const emergencePendingRef = React.useRef(false);\\n  const emittedEmergedRef   = React.useRef(false);"],
    [/useEffect\(\s*\(\)\s*=>\s*\{\s*const off = BeatBus\?\.\on\?\.\(EVENTS\.PARTICLES_START_EMERGING[\s\S]*?\}\s*,\s*\[\]\s*\);\s*/m,
     (m)=> m + "\\nuseEffect(()=>{const off=BeatBus?.on?.(EVENTS.PARTICLES_START_EMERGING,()=>{emergencePendingRef.current=true; emittedEmergedRef.current=false;}); return()=>off&&off();},[]);\\n"],
    [/console\.log\(\s*`✅ Renderer:[\s\S]*?quality=\$\{quality\}`\s*\);\s*return;\s*\}\s*\n\s*\/\/\s*Minimal emergence/m,
     (m)=> "console.log(\\`✅ Renderer: \\${cached ? 'cached' : 'new'} BLUEPRINT_READY (full)\\`, \\`stage=\\${raw.stageName || st}, count=\\${raw.particleCount || raw.activeCount}, quality=\\${quality}\\`);\\n" +
           "if (emergencePendingRef.current && !emittedEmergedRef.current) { BeatBus.emit?.(EVENTS.PARTICLES_EMERGED); emittedEmergedRef.current=true; emergencePendingRef.current=false; }\\nreturn;\\n// Minimal emergence"]
  ]);
}

export function patchRendererStage0TintLock(rel) {
  return patchText(rel, [
    [/const\s+\{\s*current,\s*next,\s*acc1,\s*acc2\s*\}\s*=\s*pickStageColors\(stageName\);/,
     "const isGenesis = stageName === 'genesis';\\n    const { current, next, acc1, acc2 } = pickStageColors(stageName);"],
    [/uColorNext:\s*\{\s*value:\s*next\s*\}/, "uColorNext: { value: isGenesis ? current : next }"],
    [/uStageBlend\.value\s*=\s*sp\s*;/, "mat.uniforms.uStageBlend.value = (stageName === 'genesis') ? 0 : sp;"]
  ]);
}

export function patchEngineGlyphBurst(rel) {
  // Ensure sampler + jitter/Z defaults
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
  // bump jitter & z depth in buildEmergenceBlueprint
  return patchText(rel, [
    [/const\s+jitter\s*=\s*\d+[^;]*;/, "const jitter = 28; // HOTDORS: wide ember scatter"],
    [/text3DPositions\[\s*j\s*\+\s*2\s*\]\s*=\s*\(Math\.random\(\)\s*-\s*0\.5\)\s*\*\s*[\d.]+/,
     "text3DPositions[j+2] = (Math.random() - 0.5) * 8.0"]
  ]);
}

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
`);

// ----- 7) Runner (interactive, goal-driven, canon-aware) -----
write('scripts/agent/runner.mjs', `#!/usr/bin/env node
/* eslint-env node */
import readline from 'node:readline';
import path from 'path';
import { loadCanonical, getInvariants, explainInvariant } from './core/canon.mjs';
import { runValidator, runSentinel } from './core/verify.mjs';
import {
  detectEngineGlyphSource, detectEngineBurstParams,
  detectRendererEmitOnce, detectRendererStage0TintLock,
  detectDirectorSettle, detectOpeningNoCTF, detectOpeningAudioGate
} from './detectors/emergence.mjs';
import {
  patchEngineGlyphBurst, patchRendererEmitOnce, patchRendererStage0TintLock,
  patchDirectorSettle, patchOpeningNoCTFAndAudioGate
} from './patchers/emergence.mjs';

const F = {
  engine: 'src/engine/ConsciousnessEngine.js',
  renderer: 'src/components/webgl/WebGLBackground.jsx',
  director: 'src/theater/TheaterDirector.js',
  opening: 'src/components/theater/OpeningSequence.jsx',
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q)=> new Promise(res => rl.question(q, a => res(a.trim())));

function detect(goal, scope, canon) {
  const want = getInvariants(goal);
  const checks = [];
  for (const inv of want) {
    let pass = false, file = null;
    if (inv.id === 'engine.glyphSource')         { file = F.engine;   pass = detectEngineGlyphSource(file); }
    if (inv.id === 'engine.burstParams')         { file = F.engine;   pass = detectEngineBurstParams(file); }
    if (inv.id === 'renderer.emitOnce')          { file = F.renderer; pass = detectRendererEmitOnce(file); }
    if (inv.id === 'renderer.stage0TintLock')    { file = F.renderer; pass = detectRendererStage0TintLock(file); }
    if (inv.id === 'director.settleBeforeScroll'){ file = F.director; pass = detectDirectorSettle(file); }
    if (inv.id === 'opening.noCTF')              { file = F.opening;  pass = detectOpeningNoCTF(file); }
    if (inv.id === 'opening.audioGate')          { file = F.opening;  pass = detectOpeningAudioGate(file); }
    if (!file) continue;
    if (scope.length && !scope.includes(file)) continue;
    checks.push({ inv, file, pass, why: explainInvariant(inv, canon) });
  }
  return checks;
}

function applyPatch(id, file) {
  if (id === 'engine.glyphSource' || id === 'engine.burstParams') return patchEngineGlyphBurst(file);
  if (id === 'renderer.emitOnce')          return patchRendererEmitOnce(file);
  if (id === 'renderer.stage0TintLock')    return patchRendererStage0TintLock(file);
  if (id === 'director.settleBeforeScroll')return patchDirectorSettle(file);
  if (id === 'opening.noCTF' || id === 'opening.audioGate') return patchOpeningNoCTFAndAudioGate(file);
  return false;
}

async function main() {
  const canon = loadCanonical();
  let goal = process.argv.find(a => a.startsWith('--goal='))?.split('=')[1] || '';
  if (!goal) goal = await ask('Goal (e.g., emergence): ');
  const scopeArg = process.argv.find(a => a.startsWith('--files='))?.split('=')[1] || '';
  const scope = scopeArg ? scopeArg.split(',').map(s=>s.trim()) : [];

  if (goal !== 'emergence') {
    console.log('Supported goals: emergence');
    rl.close(); process.exit(1);
  }

  // Detect
  const checks = detect(goal, scope, canon);
  const failures = checks.filter(c => !c.pass);

  console.log('\\n🧭 Canon word(genesis):', canon?.stages?.genesis?.word || 'HELLO CURTIS');
  console.log('\\nFindings:');
  if (!failures.length) console.log('  All invariants satisfied for selected scope.');
  else failures.forEach((c, i) => {
    console.log(`  ${i+1}. ${c.inv.id} — ${c.why} [${c.file}]`);
  });

  if (failures.length) {
    const ok = (await ask('\\nApply these changes? (y/N): ')).toLowerCase()==='y';
    if (!ok) { rl.close(); process.exit(0); }

    let changed = false;
    for (const f of failures) {
      const did = applyPatch(f.inv.id, f.file);
      if (did) console.log('  ✔ patched', f.inv.id, '→', f.file);
      else console.log('  • no change', f.inv.id, '→', f.file);
      changed = changed || did;
    }

    console.log('\\n🔁 Validator + Sentinel...');
    const vOk = runValidator();
    const sOk = runSentinel();
    if (!vOk || !sOk) console.log('  ⚠️  still red after patch; re-run to view new findings.');
    else console.log('  ✅ green.');
  }

  rl.close();
}
main().catch(e => { console.error(e); process.exit(1); });
`);

// ----- 8) Add npm script -----
addScriptIfMissing('agent:run', 'node scripts/agent/runner.mjs');

// ----- 9) Self-check (install complete) -----
try {
  console.log('\nRunning validator (install check)…\n');
  execSync('node scripts/validate-sst.js', { stdio: 'inherit' });
} catch {}
try {
  console.log('\nRunning sentinel (install check)…\n');
  execSync('node tools/sst-guard.mjs', { stdio: 'inherit' });
} catch (e) {
  // Non-fatal for installation
}

console.log('\n✅ Agent upgrade installed. Use:  npm run agent:run  (then follow prompts)\n');

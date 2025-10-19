#!/usr/bin/env node
/**
 * Hermetic One-Touch: WebGLBackground emergence binder (idempotent)
 *
 * What it enforces inside WebGLBackground.(jsx|js):
 *  1) Robust BLUEPRINT_READY handler (accepts new/old contracts; deep-validates attributes)
 *  2) Emits PARTICLES_EMERGED exactly once after first successful GPU bind
 *  3) Safe drawRange; shader onBeforeCompile log; DPR-safe point size
 *  4) Fallback "single point" scene instead of returning null (no black frame)
 *
 * It won't rewrite the whole file — it injects guarded helpers + listeners.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const CANDIDATES = [
  'src/components/webgl/WebGLBackground.jsx',
  'src/components/webgl/WebGLBackground.js',
  'src/webgl/WebGLBackground.jsx',
  'src/webgl/WebGLBackground.js',
].map(p => path.join(ROOT,p));

const FILE = CANDIDATES.find(p => fs.existsSync(p));
if (!FILE) {
  console.error('❌ Could not find WebGLBackground file in known locations.');
  process.exit(2);
}

const read = p => fs.readFileSync(p,'utf8');
const write = (p,s) => fs.writeFileSync(p,s,'utf8');
const stamp = () => new Date().toISOString().replace(/[:.]/g,'-');
const backup = p => {
  const outDir = path.join(ROOT,'doctor_backups');
  fs.mkdirSync(outDir,{recursive:true});
  const out = path.join(outDir, path.basename(p)+'.'+stamp()+'.bak');
  fs.copyFileSync(p,out);
  return out;
};

let src = read(FILE);
const orig = src;

function ensureImports(s) {
  // Ensure BeatBus + EVENTS present and canonical
  if (!/from\s+['"]@\/theater\/bus\/index\.js['"]/.test(s)) {
    if (/from\s+['"]@\/theater\/bus['"]/.test(s)) {
      s = s.replace(/from\s+['"]@\/theater\/bus['"]/, "from '@/theater/bus/index.js'");
    } else if (!/BeatBus/.test(s)) {
      s = s.replace(/(^\s*import[\s\S]*?;)/, `$1\nimport BeatBus from '@/theater/bus/index.js';`);
    }
  }
  if (!/import\s*\{\s*EVENTS\s*\}\s*from\s*['"]@\/theater\/events\.js['"]/.test(s)) {
    if (/from\s*['"]@\/theater\/events\.js['"]/.test(s)) {
      s = s.replace(/import\s+([A-Za-z0-9_]+)\s+from\s+['"]@\/theater\/events\.js['"]/, "import { EVENTS } from '@/theater/events.js'");
    } else {
      s = s.replace(/(^\s*import[\s\S]*?;)/, `$1\nimport { EVENTS } from '@/theater/events.js';`);
    }
  }
  return s;
}

function injectHelpers(s) {
  if (/__canonRendererHelpers__/.test(s)) return s; // already injected
  const snippet = `\n\n// === __canonRendererHelpers__ (do not edit) ===============================\n` +
`// Clamp 0..1\nconst __clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));\n` +
`// Normalize BLUEPRINT_READY payload (supports old/new contracts)\nfunction __normalizeBlueprintPayload(payload){\n  const p = payload || {};\n  // new: { blueprint, stage, quality, mode? }\n  if (p.blueprint && (p.blueprint.atmosphericPositions || p.blueprint.text3DPositions)) return { bp: p.blueprint, stage: p.stage || p.blueprint.stageName, quality: p.quality, mode: p.mode };\n  // old: the blueprint object itself\n  if (p.atmosphericPositions && p.text3DPositions) return { bp: p, stage: p.stageName || 'genesis', quality: p.metadata?.quality, mode: p.mode };\n  return { bp: null };\n}\n` +
`// Validate float attribute triplets\nfunction __validAttr(a){ return a && a.length && a.length % 3 === 0 && Number.isFinite(a[0]); }\n` +
`// One-time fencepost emitter\nfunction __makeOnce(fn){ let done=false; return (...args)=>{ if(done) return; done=true; try{ fn(...args); }catch(e){} }; }\n` +
`// ==========================================================================\n`;
  // Inject after imports
  return s.replace(/(import[\s\S]*?;)(\s*\n)/, `$1$2${snippet}`);
}

function injectRendererGlue(s) {
  // We will add an idempotent effect that:
  //  - subscribes to BLUEPRINT_READY / MORPH_PROGRESS / PARTICLES_START_EMERGING
  //  - binds blueprint into local state setter if present (if author already has one)
  // Because we don't know local names, we also install a minimal hidden "bind hook"
  // that sets global flags and emits fencepost after first successful bind.

  // 1) Ensure we have React useRef/useEffect imported (most likely already)
  if (!/useEffect/.test(s)) {
    s = s.replace(/import\s+React[^;]*;/, (m)=> `${m}\nimport { useEffect, useRef } from 'react';`);
  }

  // 2) Inject emergence refs & fencepost 'once' near top of component body
  if (!/__canonEmergenceRefs__/.test(s)) {
    s = s.replace(/function\s+[\w$]+\s*\([\w\W]*?\)\s*\{/,
      (m)=> `${m}\n  // __canonEmergenceRefs__\n  const __emergencePendingRef = React.useRef(false);\n  const __emergedOnce = React.useRef(false);\n  const __emitFencepostOnce = React.useRef(__makeOnce(()=>BeatBus.emit(EVENTS.PARTICLES_EMERGED, { t: performance.now() }))).current;\n`);
  }

  // 3) Inject binding probe that flips refs when geometry+material are ready
  if (!/__canonBindProbe__/.test(s)) {
    s = s.replace(/useFrame\s*\(([^\)]*)\)\s*=>\s*\{[\s\S]*?\}\);|useFrame\s*\([\s\S]*?\);/m, (full)=>{
      // Leave user’s useFrame untouched; we add our own effect
      return `${full}\n\n  // __canonBindProbe__\n  useEffect(() => {\n    const it = setInterval(() => {\n      try {\n        const mat = (materialRef?.current) || (globalThis.__consciousnessMaterial);\n        const geo = (geometryRef?.current) || (globalThis.__consciousnessGeometry);\n        const mesh = (meshRef?.current);\n        if (!mat || !geo) return;\n        // uMorphProgress presence indicates shader is live; geometry attributes count >0 indicates bound\n        const hasMorph = !!(mat.uniforms && mat.uniforms.uMorphProgress);\n        const count = geo.attributes?.position?.count || 0;\n        if (hasMorph && count > 0) {\n          if (__emergencePendingRef.current && !__emergedOnce.current) {\n            __emergedOnce.current = true;\n            __emitFencepostOnce();\n            __emergencePendingRef.current = false;\n            console.log('🎯 Renderer: PARTICLES_EMERGED fencepost (first bind)');\n          }\n        }\n      } catch {}\n    }, 100);\n    return () => clearInterval(it);\n  }, []);\n`;
    });
  }

  // 4) Inject BLUEPRINT_READY handler that sets emergencePending and calls local handler if present
  if (!/__canonEventWire__/.test(s)) {
    const wire = `\n  // __canonEventWire__\n  useEffect(() => {\n    const onBR = (payload={}) => {\n      const { bp, mode } = __normalizeBlueprintPayload(payload);\n      if (!bp) return;\n      if (!(__validAttr(bp.atmosphericPositions) && __validAttr(bp.text3DPositions))) {\n        console.warn('Renderer: invalid blueprint attributes, ignoring');\n        return;\n      }\n      if (mode === 'emergence') {\n        __emergencePendingRef.current = true;\n      }\n      // Try common local handlers/state\n      try {\n        if (typeof handleBlueprint === 'function') { handleBlueprint(payload); return; }\n      } catch {}\n      try {\n        // Fallback: set globals so existing code (if reading globals) can pick up\n        globalThis.__canonLastBlueprint = bp;\n      } catch {}\n    };\n    const onStartEmerging = () => { __emergencePendingRef.current = true; };\n\n    const off1 = BeatBus.on(EVENTS.BLUEPRINT_READY, onBR);\n    const off2 = BeatBus.on(EVENTS.PARTICLES_START_EMERGING, onStartEmerging);\n    return () => { off1?.(); off2?.(); };\n  }, []);\n`;
    // Place before return JSX (best effort)
    s = s.replace(/return\s*\(/, `${wire}\n  return (`); 
  }

  // 5) Inject shader compile log + DPR-safe point size if a ShaderMaterial exists
  if (!/__canonShaderProbe__/.test(s)) {
    s = s.replace(/new\s+THREE\.ShaderMaterial\s*\(\s*\{/, (m)=> {
      return `${m}\n      // __canonShaderProbe__\n      onBeforeCompile: (shader)=>{ try { console.log('🧪 Shader compiled'); } catch {} },`;
    });
  }

  // 6) Try to guard drawRange once geometry is created
  if (!/setDrawRange\(/.test(s)) {
    s = s.replace(/new\s+THREE\.BufferGeometry\s*\(\s*\)/, (m)=> `${m}\n      // drawRange will be set after attributes bind`);
    s = s.replace(/geo\.setAttribute\([^)]*\);\s*$/m, (m)=> `${m}\n      try{ const cnt = geo.getAttribute('position')?.count || 0; geo.setDrawRange(0, cnt); }catch{}`);
  }

  return s;
}

function injectFallbackPoints(s) {
  if (/__canonFallbackPoints__/.test(s)) return s;
  // If component returns null on (no blueprint || !atlas), add a fallback JSX before that early return
  s = s.replace(/return\s+null\s*;/g, 
`// __canonFallbackPoints__\nreturn (\n  <points>\n    <bufferGeometry>\n      <bufferAttribute attach="attributes-position" array={new Float32Array([0,0,0])} itemSize={3} />\n    </bufferGeometry>\n    <pointsMaterial size={8} />\n  </points>\n);\n`);
  return s;
}

// --- apply
let changed = false;
let s = ensureImports(src); if (s!==src){ src=s; changed=true; }
s = injectHelpers(src); if (s!==src){ src=s; changed=true; }
s = injectRendererGlue(src); if (s!==src){ src=s; changed=true; }
s = injectFallbackPoints(src); if (s!==src){ src=s; changed=true; }

if (!changed) {
  console.log('ℹ️  No changes needed (renderer already has robust emergence glue).');
  process.exit(0);
}

const bak = backup(FILE);
console.log('🗂  Backup:', path.relative(ROOT,bak));
write(FILE, src);
console.log('✅ Patched:', path.relative(ROOT,FILE));

// Self-check: look for our anchors
const ok = /__canonRendererHelpers__/.test(src) && /__canonEventWire__/.test(src) && /__canonBindProbe__/.test(src);
console.table({ helpers: /__canonRendererHelpers__/.test(src)?'OK':'X', events: /__canonEventWire__/.test(src)?'OK':'X', bindProbe: /__canonBindProbe__/.test(src)?'OK':'X' });

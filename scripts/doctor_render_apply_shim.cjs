#!/usr/bin/env node
/**
 * Apply Shim One-Touch Doctor
 * - Adds DEV RenderApplyShim that exposes window.__doctor_apply_blueprint__
 * - Ensures entry imports it in the @doctor:4r-entry DEV block
 * - Idempotent; non-destructive (.bak backups)
 */

const fs = require('fs');
const _path = require('path');

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const ART = path.join(ROOT, 'doctor_artifacts');
const VERBOSE = process.argv.includes('--verbose') || process.argv.includes('-v');

function log(...a){ if(VERBOSE) console.log('[4r-apply]', ...a); }
function info(...a){ console.log('ℹ️ ', ...a); }
function ok(...a){ console.log('✅', ...a); }
function warn(...a){ console.log('⚠️ ', ...a); }
function err(...a){ console.error('❌', ...a); }

function ensureDir(p){ fs.mkdirSync(path.dirname(p), { recursive: true }); }
function read(file){ return fs.existsSync(file) ? fs.readFileSync(file,'utf8') : ''; }
function backup(file){ if (fs.existsSync(file)) { fs.copyFileSync(file, file + '.bak'); warn('Backed up →', path.relative(ROOT, file)+'.bak'); } }

const ENTRY_CANDIDATES = ['src/main.jsx','src/main.tsx','src/index.jsx','src/index.tsx'];
function findEntry(){ for (const c of ENTRY_CANDIDATES){ const p = path.join(ROOT,c); if (fs.existsSync(p)) return p; } return null; }

const ENTRY_TAG = '@doctor:4r-entry';
const SHIM_TAG  = '@doctor:4r-apply-shim';
const SHIM_PATH = path.join(SRC, 'dev', 'RenderApplyShim.js');

const SHIM_CODE = `// ${SHIM_TAG}
(() => {
  if (globalThis.__doctor_apply_shim_loaded__) return;
  globalThis.__doctor_apply_shim_loaded__ = true;

  const ID = '__doctor_canvas__';

  function ensureCanvas(){
    let c = document.getElementById(ID);
    if (!c){
      c = document.createElement('canvas');
      c.id = ID;
      Object.assign(c.style, {
        position:'fixed', inset:'0', zIndex: '2147483000', pointerEvents:'none'
      });
      document.body.appendChild(c);
      const resize = () => {
        const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
        c.width = Math.floor(innerWidth * dpr);
        c.height = Math.floor(innerHeight * dpr);
        c.style.width = innerWidth+'px';
        c.style.height = innerHeight+'px';
      };
      resize();
      window.addEventListener('resize', resize);
      c.__dispose = () => window.removeEventListener('resize', resize);
    }
    return c;
  }

  function seededRandom(seed) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h += 0x6D2B79F5;
      let t = Math.imul(h ^ (h >>> 15), 1 | h);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function render(bp, payload){
    try{
      const canvas = ensureCanvas();
      const ctx = canvas.getContext('2d');
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0,0,w,h);

      // info bar
      const stage = payload?.stage ?? bp?.stage ?? 'unknown';
      const quality = payload?.quality ?? bp?.quality ?? 'unknown';
      const count = bp?.particleCount ?? bp?.particles?.length ?? 800;

      // Background faint
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0,0,w,h);

      // Draw points (deterministic layout per stage/quality)
      const rnd = seededRandom(String(stage)+'|'+String(quality)+'|'+String(count));
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = 'white';
      const r = Math.max(1, Math.min(3, Math.round((w*h)/ (count*90000))));
      for (let i=0;i<count;i++){
        const x = Math.floor(rnd()*w);
        const y = Math.floor(rnd()*h);
        ctx.fillRect(x, y, r, r);
      }

      // HUD
      ctx.fillStyle = 'white';
      ctx.globalAlpha = 0.95;
      ctx.font = '16px system-ui,ui-sans-serif,Segoe UI,Roboto';
      ctx.fillText(\`Blueprint ▶ \${stage} | \${quality} | \${count}\`, 16, 28);
    } catch(e){
      console.error('[@doctor:apply-shim] render error', e);
    }
  }

  // Public hook for the forwarder
  globalThis.__doctor_apply_blueprint__ = function(blueprintOrPayload, payload){
    const bp = blueprintOrPayload?.blueprint ? blueprintOrPayload.blueprint : blueprintOrPayload;
    render(bp, payload ?? blueprintOrPayload);
  };

  // If a last blueprint exists (probe may have it), render it immediately
  if (globalThis.__doctor_last_blueprint__) {
    globalThis.__doctor_apply_blueprint__(globalThis.__doctor_last_blueprint__);
  }

  if (import.meta?.hot) {
    import.meta.hot.dispose(() => {
      try {
        const c = document.getElementById(ID);
        c?.__dispose?.();
        c?.remove();
      } catch {}
      globalThis.__doctor_apply_shim_loaded__ = false;
      if (globalThis.__doctor_apply_blueprint__) delete globalThis.__doctor_apply_blueprint__;
    });
  }
})();`;

function addShimFile(){
  ensureDir(SHIM_PATH);
  const existing = read(SHIM_PATH);
  if (existing.includes(SHIM_TAG)) {
    // refresh if changed
    if (existing !== SHIM_CODE) {
      backup(SHIM_PATH);
      fs.writeFileSync(SHIM_PATH, SHIM_CODE, 'utf8');
      ok('Refreshed', path.relative(ROOT, SHIM_PATH));
    } else {
      log('Shim up-to-date');
    }
  } else {
    if (fs.existsSync(SHIM_PATH)) backup(SHIM_PATH);
    fs.writeFileSync(SHIM_PATH, SHIM_CODE, 'utf8');
    ok('Wrote', path.relative(ROOT, SHIM_PATH));
  }
}

function patchEntryForShim(entryPath){
  const rel = path.relative(ROOT, entryPath);
  let code = read(entryPath);
  const original = code;

  // Find @doctor:4r-entry block
  const blockRe = new RegExp(`\\/\\/ ${ENTRY_TAG}[\\s\\S]*?\\/\\/ ${ENTRY_TAG}:end`, 'm');
  const hasBlock = blockRe.test(code);

  const line = `  import('@/dev/RenderApplyShim.js');\n`;
  if (hasBlock) {
    const block = code.match(blockRe)[0];
    if (!block.includes(line)) {
      const insert = block.replace(/\}\s*\/\/\s*@doctor:4r-entry:end/, line + '}\n// @doctor:4r-entry:end');
      code = code.replace(blockRe, insert);
    }
  } else {
    // If no block, add a fresh one near top (after import group if possible)
    const header = `// ${ENTRY_TAG}
if (import.meta?.env?.DEV) {
  import('@/dev/RenderProbe.js');
  import('@/modules/state/_doctor/renderer_forwarder.js');
  import('@/dev/RenderApplyShim.js');
}
// ${ENTRY_TAG}:end
`;
    const m = code.match(/^(?:\s*import[^\n]*\n)+/m);
    const pos = m && m.index === 0 ? m[0].length : 0;
    code = code.slice(0,pos) + header + code.slice(pos);
  }

  if (code !== original) {
    backup(entryPath);
    fs.writeFileSync(entryPath, code, 'utf8');
    ok('Patched entry →', rel);
    return true;
  } else {
    log('Entry already imports RenderApplyShim');
    return false;
  }
}

function writeVerify(){
  ensureDir(path.join(ART,'x'));
  const script = `// 4r-apply verify — paste in browser console after reload
console.log('=== 4r-apply verify ===');
const bus = window.BeatBus || window.CANON_BEATBUS;
console.log('bus emit:', !!bus?.emit);
console.log('forwarder loaded:', !!window.__doctor_forwarder_loaded__);
console.log('probe loaded:', !!window.__render_probe_loaded__);
console.log('apply shim loaded:', !!window.__doctor_apply_shim_loaded__);
console.log('apply hook available:', typeof window.__doctor_apply_blueprint__ === 'function');

if (bus?.emit) {
  bus.emit('BLUEPRINT_READY', { stage:'genesis', quality:'HIGH', blueprint:{ particleCount: 1400 } });
  setTimeout(()=> {
    const has = !!window.__doctor_last_blueprint__;
    console.log('last blueprint recorded:', has);
  }, 50);
}
console.log('=== /4r-apply verify ===');`;
  fs.writeFileSync(path.join(ART, '4r-apply-verify.js'), script, 'utf8');
  ok('Wrote artifacts → doctor_artifacts/4r-apply-verify.js');
}

(function main(){
  console.log('🚀 Apply Shim One-Touch Doctor');
  const entry = findEntry();
  if (!entry) { err('Entry not found (tried src/main|index.(j|t)sx)'); process.exit(2); }

  addShimFile();
  const patched = patchEntryForShim(entry);
  writeVerify();

  const report = {
    entry: path.relative(ROOT, entry),
    patchedEntry: patched,
    created: [ path.relative(ROOT, SHIM_PATH) ],
    usesHook: '__doctor_apply_blueprint__',
    timestamp: new Date().toISOString()
  };
  ensureDir(path.join(ART,'x'));
  fs.writeFileSync(path.join(ART, '4r-apply-report.json'), JSON.stringify(report,null,2),'utf8');
  ok('Report → doctor_artifacts/4r-apply-report.json');
  info('Next: reload the page and run doctor_artifacts/4r-apply-verify.js in the browser console.');
})();

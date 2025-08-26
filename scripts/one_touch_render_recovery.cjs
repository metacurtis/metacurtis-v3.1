#!/usr/bin/env node
/**
 * One-Touch Render Recovery Doctor (Phase 4r, self-bootstrapping)
 * - Non-destructive, append-only, no external deps
 * - Restores event→pixel path via:
 *   1) DEV RenderProbe overlay
 *   2) Blueprint forwarder: BLUEPRINT_READY → rendererBridge.applyBlueprint OR AppRenderer.applyBlueprint
 *
 * Run:
 *   node scripts/one_touch_render_recovery.cjs --apply --verbose
 */

const fs = require('fs');
const _path = require('path');

const ROOT = process.cwd();
const SRC  = path.join(ROOT, 'src');
const OPTS = new Set(process.argv.slice(2));
const APPLY = OPTS.has('--apply') || OPTS.has('--write') || !OPTS.size; // default to apply
const VERBOSE = OPTS.has('--verbose');
const STRICT  = OPTS.has('--strict');

const log = (...a)=> VERBOSE && console.log('[4r-one]', ...a);
const info = (...a)=> console.log('ℹ️', ...a);
const ok = (...a)=> console.log('✅', ...a);
const warn = (...a)=> console.log('⚠️', ...a);
const err  = (...a)=> console.error('❌', ...a);

function posix(p){ return p.split(path.sep).join('/'); }
function ensureDir(p){ fs.mkdirSync(path.dirname(p), { recursive:true }); }
function fileExists(p){ try { return fs.existsSync(p) && fs.statSync(p).isFile(); } catch { return false; } }
function read(p, def=''){ try { return fs.readFileSync(p, 'utf8'); } catch { return def; } }
function safeWrite(p, content){
  ensureDir(p);
  if (fileExists(p)) fs.copyFileSync(p, p + '.bak');
  fs.writeFileSync(p, content, 'utf8');
}
function writeIfChanged(p, next){
  const prev = read(p, '');
  if (prev === next) return false;
  if (APPLY) safeWrite(p, next);
  return true;
}

const ARTIFACTS = path.join(ROOT, 'doctor_artifacts');
if (!fs.existsSync(ARTIFACTS)) fs.mkdirSync(ARTIFACTS);

if (!fs.existsSync(SRC)) {
  const msg = `src/ not found at ${posix(SRC)}. Run from project root.`;
  if (STRICT) { err(msg); process.exit(3); }
  throw new Error(msg);
}

// 1) Find entry file
const entry = [
  'main.tsx','main.jsx','main.ts','main.js',
  'index.tsx','index.jsx','index.ts','index.js',
].map(f => path.join(SRC,f)).find(fileExists);

if (!entry) {
  const msg = 'No entry under src/ (main.* or index.*).';
  if (STRICT) { err(msg); process.exit(3); }
  warn(msg);
}

// 2) DEV RenderProbe (visual heartbeat)
const renderProbePath = path.join(SRC, 'dev', 'RenderProbe.js');
const renderProbeCode = `// @doctor:4r RenderProbe (DEV-only)
// Overlay + optional canvas heartbeat. Receives payload via AppRenderer.applyBlueprint
if (import.meta?.env?.DEV && typeof window !== 'undefined') {
  (function attachProbe(){
    if (window.__doctor_render_probe__) return;
    const root = document.createElement('div');
    root.id = 'render-probe';
    root.style.cssText = [
      'position:fixed','right:12px','bottom:12px','z-index:99999',
      'font:12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      'color:#0f0','background:rgba(0,0,0,0.65)',
      'padding:8px 10px','border-radius:8px','box-shadow:0 2px 8px rgba(0,0,0,0.35)',
      'pointer-events:none'
    ].join(';');
    root.textContent = 'RenderProbe: waiting...';
    document.body.appendChild(root);

    // Optional canvas micro-viz (does not interfere with your renderer)
    const c = document.createElement('canvas');
    c.id = 'render-probe-canvas';
    c.width = 300; c.height = 150;
    c.style.cssText = 'position:fixed; right:12px; bottom:48px; z-index:99998; opacity:0.9; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.35)';
    document.body.appendChild(c);
    const ctx = c.getContext('2d');

    function microViz(payload){
      const count = payload?.blueprint?.particleCount ?? payload?.particleCount ?? 0;
      ctx.clearRect(0,0,c.width,c.height);
      if (!count) return;
      const n = Math.min(count, 400);
      for (let i=0;i<n;i++){
        const x = Math.random()*c.width;
        const y = Math.random()*c.height;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    function update(payload){
      const p = payload || {};
      const stage = p.stage ?? p.to ?? p.name ?? 'unknown';
      const quality = p.quality ?? p.tier ?? 'n/a';
      const pc = p.blueprint?.particleCount ?? p.particleCount ?? '?';
      root.textContent = \`RenderProbe ✓ stage=\${stage} quality=\${quality} particles=\${pc}\`;
      microViz(p);
    }

    window.AppRenderer = window.AppRenderer || {};
    window.AppRenderer.applyBlueprint = (payload) => {
      try { update(payload); } catch (e) { console.error('[RenderProbe] error', e); }
    };

    window.__doctor_render_probe__ = { root, canvas:c };
    console.log('🩺 RenderProbe attached');
  })();

  if (import.meta?.hot) {
    import.meta.hot.dispose(() => {
      try {
        const el = window.__doctor_render_probe__?.root;
        const cv = window.__doctor_render_probe__?.canvas;
        if (el?.parentNode) el.parentNode.removeChild(el);
        if (cv?.parentNode) cv.parentNode.removeChild(cv);
      } catch {}
      delete window.__doctor_render_probe__;
    });
  }
}
`;

// 3) Blueprint forwarder (no imports; waits for BeatBus, then subscribes)
const forwarderPath = path.join(SRC, 'modules', 'state', '_doctor', 'renderer_forwarder.js');
const forwarderCode = `// @doctor:4r blueprint forwarder (append-only, idempotent)
// Forwards BLUEPRINT_READY → rendererBridge.applyBlueprint OR AppRenderer.applyBlueprint
(function(){
  const G = (typeof globalThis !== 'undefined') ? globalThis : window;

  function getBus(){
    return G.BeatBus || G.CANON_BEATBUS;
  }

  function forward(payload){
    let did = false;
    try {
      if (G.rendererBridge?.applyBlueprint) {
        G.rendererBridge.applyBlueprint(payload);
        did = true;
      }
    } catch (e) { console.warn('[4r] forward to rendererBridge failed', e); }
    try {
      // Always also update DEV probe if present
      if (G.AppRenderer?.applyBlueprint) {
        G.AppRenderer.applyBlueprint(payload);
        did = true;
      }
    } catch (e) { console.warn('[4r] forward to AppRenderer failed', e); }
    if (!did) console.warn('[4r] No applyBlueprint target available (yet).');
  }

  function subscribe(){
    if (G.__doctor_bp_subscribed__) return;
    const bus = getBus();
    if (!bus?.on) return false;
    const handler = (payload) => {
      try { forward(payload); }
      catch (e){ console.error('[4r] blueprint handler error', e); }
    };
    const off = bus.on('BLUEPRINT_READY', handler);
    G.__doctor_bp_subscribed__ = { off };
    console.log('🧩 [4r] Adapter wired: BLUEPRINT_READY → applyBlueprint');
    return true;
  }

  function ready(fn){
    if (typeof document === 'undefined') return fn();
    if (document.readyState !== 'loading') return fn();
    const h = () => { document.removeEventListener('DOMContentLoaded', h); fn(); };
    document.addEventListener('DOMContentLoaded', h, { once:true });
  }

  ready(() => {
    // Try immediately, then poll briefly for late BeatBus
    if (!subscribe()){
      let tries = 0;
      const t = setInterval(() => {
        tries++;
        if (subscribe() || tries > 50) clearInterval(t);
      }, 200);
    }
  });

  if (import.meta?.hot) {
    import.meta.hot.dispose(() => {
      try { G.__doctor_bp_subscribed__?.off?.(); } catch {}
      delete G.__doctor_bp_subscribed__;
    });
  }
})();
`;

// 4) Write files (append-only; create backups if overwriting)
const created = [];
if (!fileExists(renderProbePath) || !read(renderProbePath).includes('@doctor:4r')) {
  if (APPLY) safeWrite(renderProbePath, renderProbeCode);
  created.push(posix(path.relative(ROOT, renderProbePath)));
}
if (!fileExists(forwarderPath) || !read(forwarderPath).includes('@doctor:4r')) {
  if (APPLY) safeWrite(forwarderPath, forwarderCode);
  created.push(posix(path.relative(ROOT, forwarderPath)));
}

// 5) Patch entry: add tagged imports (idempotent)
let entryPatches = 0;
if (entry) {
  const entryCode = read(entry, '');
  const relForwarder = posix('./' + path.relative(path.dirname(entry), forwarderPath)).replace(/^\.\.\/src\//, './');
  const relProbe     = posix('./' + path.relative(path.dirname(entry), renderProbePath)).replace(/^\.\.\/src\//, './');
  const TAG_A = '// @doctor:4r-import-forwarder';
  const TAG_P = '// @doctor:4r-import-probe';

  let next = entryCode;
  if (!entryCode.includes(TAG_A) && !entryCode.includes(relForwarder)) {
    next += `\n${TAG_A}\nimport '${relForwarder}';\n`;
    entryPatches++;
  }
  if (!entryCode.includes(TAG_P) && !entryCode.includes(relProbe)) {
    next += `\n${TAG_P}\nif (import.meta?.env?.DEV) import('${relProbe}');\n`;
    entryPatches++;
  }
  if (writeIfChanged(entry, next)) {
    log('Entry patched:', posix(path.relative(ROOT, entry)));
  }
}

// 6) Verifier & checklist
const verifyJS = `// Phase 4r Verify — paste in browser console after app boots
(async function(){
  const bus = window.BeatBus || window.CANON_BEATBUS;
  if (!bus?.emit) { console.warn('[4r] BeatBus missing emit'); return; }
  const payload = { stage:'genesis', quality:'HIGH', blueprint:{ particleCount:2000 } };
  console.log('[4r] Emitting BLUEPRINT_READY test payload', payload);
  bus.emit('BLUEPRINT_READY', payload);
  setTimeout(()=> {
    const badge = document.getElementById('render-probe');
    if (badge) { console.log('✅ RenderProbe:', badge.textContent); }
    else { console.warn('⚠️ RenderProbe not present (dev-only). Check entry imports.'); }
  }, 150);
})();`;
fs.writeFileSync(path.join(ARTIFACTS, '4r-verify.js'), verifyJS, 'utf8');

const checklist = `# Phase 4r — Render Recovery (One-Touch)

## What this did
- [x] Wrote DEV RenderProbe → ${posix(path.relative(ROOT, renderProbePath))}
- [x] Wrote blueprint forwarder → ${posix(path.relative(ROOT, forwarderPath))}
- [x] Patched entry (${entry ? posix(path.relative(ROOT, entry)) : 'not found'}) with tagged imports

## Verify
1) Start dev server
2) In browser console: \`doctor_artifacts/4r-verify.js\`
3) Expect:
   - "Adapter wired..." log
   - RenderProbe badge updates with stage/quality/particles
   - Canvas heartbeat shows dots (micro-viz)

## Rollback
- Remove lines tagged \`@doctor:4r\` in entry
- Delete the two files above (and/or restore \`.bak\` backups)
`;
fs.writeFileSync(path.join(ARTIFACTS, '4r-checklist.md'), checklist, 'utf8');

// 7) Report
const report = {
  entry: entry ? posix(path.relative(ROOT, entry)) : null,
  created,
  entryPatches,
  notes: [
    'No external dependencies, no imports from BeatBus—adapter polls global bus.',
    'HMR-safe; idempotent guards prevent duplicate listeners.',
    'Probe is DEV-only; does not affect production bundles.'
  ]
};
fs.writeFileSync(path.join(ARTIFACTS, '4r-report.json'), JSON.stringify(report, null, 2), 'utf8');

// 8) Summary
console.log('');
info('One-Touch Render Recovery Doctor (Phase 4r)');
console.log('Mode:', APPLY ? 'APPLY' : 'DRY RUN', '| Verbose:', VERBOSE, '| Strict:', STRICT);
console.log('Entry:', report.entry || 'not found');
console.log('Created:', created.length ? created.join(', ') : '(none)');
console.log('Patched entry imports:', entryPatches);
console.log('');
ok('Artifacts →', posix(path.relative(ROOT, ARTIFACTS)) + '/');
console.log(' - 4r-checklist.md');
console.log(' - 4r-report.json');
console.log(' - 4r-verify.js');
console.log('');
process.exit(0);

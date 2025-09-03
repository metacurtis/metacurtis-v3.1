#!/usr/bin/env node
/* eslint-env node */
/**
 * Render Resubscribe Hotfix Doctor (4r)
 * - Guarantees BeatBus import + global
 * - Subscribes to BLUEPRINT_READY with retries
 * - Forwards to rendererBridge/AppRenderer + RenderProbe
 * - DEV-only entry wiring, idempotent, non-destructive (backs up changed files)
 *
 * Usage:
 *   node scripts/doctor_render_resubscribe.cjs --write
 *   (omit --write for dry run)
 */

const fs = require('fs');
const _path = require('path');

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const OPTS = new Set(process.argv.slice(2));
const WRITE = OPTS.has('--write');
const ART = path.join(ROOT, 'doctor_artifacts');
if (!fs.existsSync(ART)) fs.mkdirSync(ART, { recursive: true });

// Adjust only if your canonical bus path differs (ledger says this is correct)
const CANONICAL_BUS_PATH = '/src/src/modules/orchestration/core/BeatBus.js';

// --- helpers ---
const ok = (...a) => console.log('✅', ...a);
const info = (...a) => console.log('ℹ️ ', ...a);
const warn = (...a) => console.log('⚠️ ', ...a);
const err = (...a) => console.error('❌', ...a);

function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''; }
function same(a,b){ return a.replace(/\r\n/g,'\n') === b.replace(/\r\n/g,'\n'); }
function ensureDir(p){ fs.mkdirSync(path.dirname(p), { recursive: true }); }
function writeSafely(file, content){
  const prev = read(file);
  if (!WRITE){
    if (!prev) info('(dry) create', file);
    else if (!same(prev, content)) info('(dry) update', file);
    else info('(dry) unchanged', file);
    return false;
  }
  ensureDir(file);
  if (!prev) {
    fs.writeFileSync(file, content, 'utf8');
    ok('created', path.relative(ROOT, file));
    return true;
  }
  if (!same(prev, content)) {
    fs.copyFileSync(file, file + '.bak');
    fs.writeFileSync(file, content, 'utf8');
    ok('updated', path.relative(ROOT, file), '(backup -> .bak)');
    return true;
  }
  info('unchanged', path.relative(ROOT, file));
  return false;
}

function findEntry(){
  const candidates = [
    path.join(SRC, 'main.jsx'),
    path.join(SRC, 'main.tsx'),
    path.join(SRC, 'main.js'),
    path.join(SRC, 'index.jsx'),
    path.join(SRC, 'index.tsx'),
    path.join(SRC, 'index.js'),
  ];
  return candidates.find(fs.existsSync);
}

// --- RenderProbe (minimal dev overlay + update hook) ---
const RENDER_PROBE_FILE = path.join(SRC, 'dev', 'RenderProbe.js');
const RENDER_PROBE_CODE = `// @doctor:4r RenderProbe
(() => {
  if (typeof window === 'undefined' || window.__render_probe_loaded__) return;
  window.__render_probe_loaded__ = true;

  const root = document.createElement('div');
  root.id = '__render_probe__';
  root.style.cssText = 'position:fixed;z-index:2147483647;right:8px;top:8px;padding:6px 8px;font:12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;background:#111a;border:1px solid #333;color:#9fe;backdrop-filter:blur(3px);border-radius:6px;pointer-events:none';
  root.innerHTML = '🩺 RenderProbe — idle';
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.body.contains(root)) document.body.appendChild(root);
  });

  const canvas = document.createElement('canvas');
  canvas.width = 80; canvas.height = 40;
  canvas.style.cssText = 'display:block;margin-top:4px;border:1px solid #333';
  root.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const draw = (n=0) => {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const dots = Math.min(60, n|0);
    for (let i=0;i<dots;i++){
      const x = Math.random()*canvas.width;
      const y = Math.random()*canvas.height;
      ctx.fillRect(x,y,1,1);
    }
  };

  window.__render_probe__ = {
    update(bp){
      try {
        const stage = bp?.stage ?? 'unknown';
        const qual  = bp?.quality ?? bp?.tier ?? 'unknown';
        const pc    = bp?.blueprint?.particleCount ?? bp?.particleCount ?? 0;
        root.firstChild.nodeValue = '🩺 RenderProbe — ' + stage + ' · ' + qual + ' · ' + pc + 'p';
        draw(pc/50);
      } catch(e) { console.warn('[RenderProbe]', e); }
    }
  };

  console.log('🩺 RenderProbe attached');
})();`;

// --- Forwarder (force import bus, subscribe, forward, retries) ---
const FORWARDER_FILE = path.join(SRC, 'modules', 'state', '_doctor', 'renderer_forwarder.js');
const FORWARDER_CODE = `// @doctor:4r renderer_forwarder
(() => {
  if (typeof window === 'undefined' || window.__doctor_forwarder_loaded__) return;
  window.__doctor_forwarder_loaded__ = true;

  const subscribeWith = (bus) => {
    if (!bus || typeof bus.on !== 'function') return false;
    if (window.__doctor_bp_off) return true; // already wired
    const off = bus.on('BLUEPRINT_READY', (payload) => {
      try {
        window.__doctor_last_blueprint__ = payload;
        const apply =
          (window.rendererBridge && typeof window.rendererBridge.applyBlueprint === 'function' && window.rendererBridge.applyBlueprint) ||
          (window.AppRenderer && typeof window.AppRenderer.applyBlueprint === 'function' && window.AppRenderer.applyBlueprint) ||
          null;
        if (apply) apply(payload);
        if (window.__render_probe__?.update) window.__render_probe__.update(payload);
      } catch (e) {
        console.error('🧩 [4r] forward error', e);
      }
    });
    window.__doctor_bp_off = off;
    window.__doctor_bp_subscribed__ = true;
    console.log('🧩 [4r] Forwarder subscribed');
    return true;
  };

  const tryGlobals = () => {
    const bus = window.BeatBus || window.CANON_BEATBUS;
    return subscribeWith(bus);
  };

  // 1) Try any existing global instance
  if (tryGlobals()) return;

  // 2) Force import canonical BeatBus to guarantee instantiation + globals
  import('${CANONICAL_BUS_PATH}')
    .then((mod) => {
      const bus = mod?.default || window.BeatBus || window.CANON_BEATBUS || mod?.BeatBus || mod?.bus;
      if (subscribeWith(bus)) return;

      // 3) Retry a few times in case init order delays .on
      let tries = 0;
      const t = setInterval(() => {
        const ok = tryGlobals();
        if (ok || ++tries > 60) clearInterval(t);
      }, 50);
    })
    .catch((e) => {
      console.warn('🧩 [4r] BeatBus import failed:', e);
      // last resort: keep polling globals
      let tries = 0;
      const t = setInterval(() => {
        const ok = tryGlobals();
        if (ok || ++tries > 60) clearInterval(t);
      }, 50);
    });
})();`;

// --- Entry patch (DEV-only dynamic imports) ---
function patchEntry(entryFile) {
  const tag = '// @doctor:4r-entry';
  const devBlock =
`// @doctor:4r-entry
if (import.meta?.env?.DEV) {
  import('/src/dev/RenderProbe.js');
  import('/src/modules/state/_doctor/renderer_forwarder.js');
}
// @doctor:4r-entry:end
`;
  const src = read(entryFile);
  if (!src.includes(tag)) {
    const updated = devBlock + src;
    writeSafely(entryFile, updated);
    return { patched: true, entryFile };
  }
  info('entry already wired:', path.relative(ROOT, entryFile));
  return { patched: false, entryFile };
}

// --- Verify snippet ---
const VERIFY_FILE = path.join(ART, '4r-verify.js');
const VERIFY_CODE = `// Paste in browser console after reload
console.log('=== 4r verify ===');
const bus = window.BeatBus || window.CANON_BEATBUS;
console.log('bus emit available:', !!bus?.emit);
console.log('forwarder loaded:', !!window.__doctor_forwarder_loaded__);
console.log('subscribed:', !!window.__doctor_bp_subscribed__);
console.log('probe loaded:', !!window.__render_probe_loaded__);

if (bus?.emit) {
  bus.emit('BLUEPRINT_READY', { stage:'genesis', quality:'HIGH', blueprint:{ particleCount: 1200 } });
  setTimeout(() => {
    console.log('last blueprint seen:', window.__doctor_last_blueprint__ ? 'yes' : 'no');
  }, 50);
}
console.log('=== /4r verify ===');`;

// --- run ---
(function main(){
  console.log('🚀 Render Resubscribe Hotfix Doctor (4r) —', WRITE ? 'WRITE' : 'DRY RUN');

  const entry = findEntry();
  if (!entry) {
    err('Could not find an entry file (src/main.* or src/index.*).');
    process.exit(2);
  }

  const created = [];
  if (writeSafely(RENDER_PROBE_FILE, RENDER_PROBE_CODE)) created.push(RENDER_PROBE_FILE);
  if (writeSafely(FORWARDER_FILE,    FORWARDER_CODE))     created.push(FORWARDER_FILE);

  const { patched } = patchEntry(entry);
  writeSafely(VERIFY_FILE, VERIFY_CODE);

  const report = {
    entry: path.relative(ROOT, entry),
    created: created.map(f => path.relative(ROOT, f)),
    patchedEntry: patched,
    canonicalBusPath: CANONICAL_BUS_PATH,
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync(path.join(ART, '4r-report.json'), JSON.stringify(report, null, 2), 'utf8');

  console.log('\n📄 Entry:', path.relative(ROOT, entry));
  if (created.length) console.log('🆕 Created:', created.map(f => path.relative(ROOT, f)).join(', '));
  console.log('🔧 Patched entry imports:', patched ? 2 : 'already present');
  console.log('\n✅ Artifacts → doctor_artifacts/');
  console.log(' - 4r-report.json');
  console.log(' - 4r-verify.js');
})();


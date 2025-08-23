#!/usr/bin/env node
/**
 * Render Path One-Touch Doctor
 * - Idempotent
 * - No external deps
 * - Non-destructive (.bak backups)
 *
 * What it does:
 * 1) Ensures probe + forwarder exist (or refreshes with current template).
 * 2) Normalizes entry to a single DEV-only alias-based dynamic import block.
 * 3) Removes duplicate/legacy @doctor 4r blocks and absolute "/src/..." imports.
 * 4) Emits verify script for browser console.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const ART = path.join(ROOT, 'doctor_artifacts');
const VERBOSE = process.argv.includes('--verbose') || process.argv.includes('-v');

function log(...a){ if(VERBOSE) console.log('[4r-one-touch]', ...a); }
function info(...a){ console.log('ℹ️ ', ...a); }
function ok(...a){ console.log('✅', ...a); }
function warn(...a){ console.log('⚠️ ', ...a); }
function err(...a){ console.error('❌', ...a); }

function ensureDir(p){ fs.mkdirSync(path.dirname(p), { recursive: true }); }

function writeFileSafe(file, content, tag){
  ensureDir(file);
  if (fs.existsSync(file)) {
    const existing = fs.readFileSync(file, 'utf8');
    if (existing.includes(tag)) {
      // refresh only if content has changed
      if (existing !== content) {
        fs.writeFileSync(file, content, 'utf8');
        ok('Refreshed', path.relative(ROOT, file));
      } else {
        log('Up-to-date', path.relative(ROOT, file));
      }
      return 'updated';
    }
    // back up if not our template yet
    fs.copyFileSync(file, file + '.bak');
    warn('Backed up existing file →', path.relative(ROOT, file) + '.bak');
  }
  fs.writeFileSync(file, content, 'utf8');
  ok('Wrote', path.relative(ROOT, file));
  return 'written';
}

function findEntry(){
  const candidates = [
    'src/main.jsx','src/main.tsx',
    'src/index.jsx','src/index.tsx'
  ];
  for (const c of candidates){
    const p = path.join(ROOT,c);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const PROBE_PATH = path.join(SRC, 'dev', 'RenderProbe.js');
const FORWARDER_PATH = path.join(SRC, 'modules', 'state', '_doctor', 'renderer_forwarder.js');

const PROBE_TAG = '@doctor:4r-probe';
const FORWARDER_TAG = '@doctor:4r-forwarder';
const ENTRY_TAG = '@doctor:4r-entry';

const PROBE_CODE = `// ${PROBE_TAG}
(() => {
  if (globalThis.__render_probe_loaded__) return;
  globalThis.__render_probe_loaded__ = true;

  const mountBadge = () => {
    if (document.getElementById('__doctor_probe_badge__')) return;
    const el = document.createElement('div');
    el.id = '__doctor_probe_badge__';
    el.style.cssText = 'position:fixed;right:8px;bottom:8px;z-index:999999;font:12px/1.2 system-ui;background:rgba(0,0,0,.65);color:#fff;padding:6px 8px;border-radius:6px;box-shadow:0 2px 10px rgba(0,0,0,.25)';
    el.textContent = 'RenderProbe: waiting…';
    document.body.appendChild(el);
  };

  const update = (payload) => {
    const el = document.getElementById('__doctor_probe_badge__');
    if (!el) return;
    const p = payload || globalThis.__doctor_last_blueprint__;
    if (!p) { el.textContent = 'RenderProbe: waiting…'; return; }
    const cnt = p?.blueprint?.particleCount ?? p?.particleCount ?? '?';
    const stg = p?.stage ?? '?';
    const q = p?.quality ?? p?.tier ?? '?';
    el.textContent = \`Blueprint: \${stg} | \${q} | \${cnt}\`;
  };

  const ready = () => {
    mountBadge();
    update();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready, { once:true });
  } else {
    ready();
  }

  // Listen to BLUEPRINT_READY for UI updates (lightweight)
  const bus = globalThis.BeatBus || globalThis.CANON_BEATBUS;
  let off = null;
  if (bus?.on) {
    off = bus.on('BLUEPRINT_READY', (payload) => {
      globalThis.__doctor_last_blueprint__ = payload;
      update(payload);
    });
  }

  if (import.meta?.hot) {
    import.meta.hot.dispose(() => {
      try { off?.(); } catch {}
      try {
        const el = document.getElementById('__doctor_probe_badge__');
        el?.remove();
      } catch {}
      globalThis.__render_probe_loaded__ = false;
    });
  }
})();`;

const FORWARDER_CODE = `// ${FORWARDER_TAG}
(() => {
  if (globalThis.__doctor_forwarder_loaded__) return;
  globalThis.__doctor_forwarder_loaded__ = true;

  const bus = globalThis.BeatBus || globalThis.CANON_BEATBUS;
  if (!bus?.on) {
    console.warn('[@doctor:4r] No BeatBus available to subscribe');
    return;
  }

  const apply = (payload) => {
    // Record for probe
    globalThis.__doctor_last_blueprint__ = payload;

    // Try common renderer apply locations
    const fn =
      globalThis.rendererBridge?.applyBlueprint ||
      globalThis.AppRenderer?.applyBlueprint ||
      globalThis.__doctor_apply_blueprint__;

    if (typeof fn === 'function') {
      try { fn(payload.blueprint || payload, payload); }
      catch (e) { console.error('[@doctor:4r] applyBlueprint failed', e); }
    } else {
      // Soft hint to help wiring
      console.warn('[@doctor:4r] No applyBlueprint found on rendererBridge/AppRenderer. Expose one to complete the loop.');
    }
  };

  const off = bus.on('BLUEPRINT_READY', (payload) => {
    apply(payload);
  });

  globalThis.__doctor_bp_subscribed__ = true;

  if (import.meta?.hot) {
    import.meta.hot.dispose(() => {
      try { off?.(); } catch {}
      globalThis.__doctor_forwarder_loaded__ = false;
      globalThis.__doctor_bp_subscribed__ = false;
    });
  }
})();`;

function patchEntry(entryPath){
  const rel = path.relative(ROOT, entryPath);
  let code = fs.readFileSync(entryPath, 'utf8');
  const original = code;

  // 1) Remove any existing @doctor:4r-entry block
  const entryBlockRe = new RegExp(`\\/\\/ ${ENTRY_TAG}[\\s\\S]*?\\/\\/ ${ENTRY_TAG}:end`, 'g');
  code = code.replace(entryBlockRe, '');

  // 2) Remove legacy import markers + lines
  const removeLines = [
    /\/\/\s*@doctor:4r-import-forwarder[^\n]*\n?/g,
    /import\s+['"]\.\/modules\/state\/_doctor\/renderer_forwarder\.js['"];?\n?/g,
    /import\s+['"]@\/modules\/state\/_doctor\/renderer_forwarder\.js['"];?\n?/g,
    /import\s*\(\s*['"]\/src\/modules\/state\/_doctor\/renderer_forwarder\.js['"]\s*\)\s*;?\n?/g,

    /\/\/\s*@doctor:4r-import-probe[^\n]*\n?/g,
    /import\s+['"]\.\/dev\/RenderProbe\.js['"];?\n?/g,
    /import\s+['"]@\/dev\/RenderProbe\.js['"];?\n?/g,
    /import\s*\(\s*['"]\/src\/dev\/RenderProbe\.js['"]\s*\)\s*;?\n?/g,
  ];
  removeLines.forEach((re)=>{ code = code.replace(re, ''); });

  // 3) Also remove any stray absolute /src dynamic imports we might have added earlier
  code = code.replace(/if\s*\(\s*import\.meta\??\.env\??\.DEV\s*\)\s*\{\s*import\('\/src\/dev\/RenderProbe\.js'\);\s*import\('\/src\/modules\/state\/_doctor\/renderer_forwarder\.js'\);\s*\}\s*/g, '');

  // 4) Insert a single, clean DEV alias block right after the topmost import group (or at top if none)
  const block = `// ${ENTRY_TAG}
if (import.meta?.env?.DEV) {
  import('@/dev/RenderProbe.js');
  import('@/modules/state/_doctor/renderer_forwarder.js');
}
// ${ENTRY_TAG}:end
`;

  // Find first non-comment line; we prefer after the initial import group.
  let insertPos = 0;
  const importGroup = code.match(/^(?:\s*import[^\n]*\n)+/m);
  if (importGroup && importGroup.index === 0) {
    insertPos = importGroup[0].length;
  }
  code = code.slice(0, insertPos) + block + code.slice(insertPos);

  if (code !== original) {
    fs.copyFileSync(entryPath, entryPath + '.bak');
    warn('Backed up entry →', rel + '.bak');
    fs.writeFileSync(entryPath, code, 'utf8');
    ok('Patched entry →', rel);
    return true;
  } else {
    log('Entry already normalized →', rel);
    return false;
  }
}

function writeVerify(){
  ensureDir(ART);
  const verify = `// 4r verify — paste into browser console after the app loads
console.log('=== 4r verify ===');
const bus = window.BeatBus || window.CANON_BEATBUS;
console.log('bus emit available:', !!bus?.emit);
console.log('forwarder loaded:', !!window.__doctor_forwarder_loaded__);
console.log('probe loaded:', !!window.__render_probe_loaded__);
console.log('subscribed:', !!window.__doctor_bp_subscribed__);

if (bus?.emit) {
  bus.emit('BLUEPRINT_READY', { stage:'genesis', quality:'HIGH', blueprint:{ particleCount: 1200 } });
  setTimeout(() => {
    console.log('last blueprint seen:', !!window.__doctor_last_blueprint__);
  }, 50);
}
console.log('apply available:',
  typeof window.rendererBridge?.applyBlueprint === 'function' ||
  typeof window.AppRenderer?.applyBlueprint === 'function' ||
  typeof window.__doctor_apply_blueprint__ === 'function'
);
console.log('=== /4r verify ===');`;
  fs.writeFileSync(path.join(ART, '4r-verify.js'), verify, 'utf8');
  ok('Wrote artifacts → doctor_artifacts/4r-verify.js');
}

(function main(){
  console.log('🚀 Render Path One-Touch Doctor');
  ensureDir(ART);

  // 1) Ensure forwarder + probe
  writeFileSafe(FORWARDER_PATH, FORWARDER_CODE, FORWARDER_TAG);
  writeFileSafe(PROBE_PATH, PROBE_CODE, PROBE_TAG);

  // 2) Patch entry
  const entry = findEntry();
  if (!entry) {
    err('Cannot find entry file (tried src/main.(j|t)sx, src/index.(j|t)sx)');
    process.exit(2);
  }
  const patched = patchEntry(entry);

  // 3) Verify script
  writeVerify();

  // 4) Summary
  const report = {
    entry: path.relative(ROOT, entry),
    patchedEntry: patched,
    canonicalBusPath: '/src/src/modules/orchestration/core/BeatBus.js',
    created: [
      fs.existsSync(PROBE_PATH) && path.relative(ROOT, PROBE_PATH),
      fs.existsSync(FORWARDER_PATH) && path.relative(ROOT, FORWARDER_PATH),
    ].filter(Boolean),
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync(path.join(ART, '4r-report.json'), JSON.stringify(report, null, 2), 'utf8');
  ok('Report → doctor_artifacts/4r-report.json');

  info('Next: reload dev server and paste doctor_artifacts/4r-verify.js into the browser console.');
})();

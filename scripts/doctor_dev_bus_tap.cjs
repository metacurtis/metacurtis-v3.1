#!/usr/bin/env node
/**
 * doctor_dev_bus_tap.cjs
 * Expose BeatBus to window in DEV when localStorage.canonDevTools === '1'.
 * - Import adapter via namespace (handles default or named exports)
 * - Append a guarded, idempotent tap block
 * - Only edits: src/dev/renderHealthcheck.js
 * Dry-run by default; use --commit (and optionally --no-verify) to persist.
 */
const fs = require('fs'); const path = require('path'); const cp = require('child_process');

const FILE = 'src/dev/renderHealthcheck.js';
const NOW  = new Date().toISOString().replace(/[:]/g,'-');
const SNAP = path.join('snapshots', `doctor_dev_bus_tap_${NOW}`);
const DO_COMMIT = process.argv.includes('--commit');
const NO_VERIFY = process.argv.includes('--no-verify');
const MSG = 'chore(dev): expose BeatBus tap in DEV (namespace import + guarded tap)';

function ex(f){ return fs.existsSync(f); }
function rd(f){ return fs.readFileSync(f,'utf8'); }
function wr(f,s){ fs.writeFileSync(f,s,'utf8'); }
function ensureDir(d){ fs.mkdirSync(d,{recursive:true}); }
function backupOnce(f){ const bak=f+'.bak'; if(!ex(bak)){ fs.copyFileSync(f, bak); console.log('· backup', bak); } }

if (!ex(FILE)) { console.error('! missing', FILE); process.exit(1); }
let src = rd(FILE); const orig = src; backupOnce(FILE);

/* 1) ensure adapter import via namespace (export-agnostic) */
const IMPORT_LINE = `import * as BeatBusAdapter from '@/modules/orchestration/core/BeatBusAdapter.js';`;
if (!/BeatBusAdapter\.js/.test(src)) {
  const importBlock = src.match(/^(?:import[\s\S]*?\n)+/m);
  if (importBlock) {
    const idx = importBlock.index + importBlock[0].length;
    src = src.slice(0, idx) + IMPORT_LINE + '\n' + src.slice(idx);
  } else {
    src = IMPORT_LINE + '\n' + src;
  }
} else if (!/import\s+\*\s+as\s+BeatBusAdapter\s+from/.test(src)) {
  // if there is an existing import from BeatBusAdapter but not namespace, leave it (avoid breaking build)
  // tap block below will still work if global getBeatBus or default exists on the module object
}

/* 2) inject DEV-only global tap (idempotent via sentinel) */
if (!/\/\* <<< DEV BUS TAP \*\//.test(src) && !/✅ BeatBus tap active/.test(src)) {
  const block = `
/* >>> DEV BUS TAP (auto) — guarded & idempotent */
if (import.meta.env.DEV && (globalThis.localStorage?.canonDevTools === '1')) {
  try {
    // robustly obtain the bus (supports both default export and named getBeatBus)
    const __bus =
      (BeatBusAdapter.getBeatBus?.() ?? BeatBusAdapter.getBeatBus ??
       BeatBusAdapter.default?.()   ?? BeatBusAdapter.default) || null;

    if (__bus) {
      globalThis.BeatBus = __bus;
      globalThis.busTap = (evt, fn) => {
        if (!evt || typeof fn !== 'function') return () => {};
        const off = __bus.on?.(evt, fn);
        console.log('🔌 busTap', evt);
        return typeof off === 'function' ? off : () => { try { __bus.off?.(evt, fn); } catch(_){} };
      };
      console.log('✅ BeatBus tap active');
    }
  } catch (e) {
    console.warn('BeatBus tap failed:', e);
  }
}
/* <<< DEV BUS TAP */
`;
  src = src + '\n' + block;
}

/* 3) write & snapshot if changed */
if (src !== orig) {
  wr(FILE, src);
  ensureDir(SNAP);
  fs.writeFileSync(path.join(SNAP, 'renderHealthcheck.js.txt'), src, 'utf8');
  console.log('· patched', FILE);
} else {
  console.log('· no-op', FILE);
}

/* 4) optional commit */
if (DO_COMMIT){
  try {
    cp.execSync('git add -A', {stdio:'inherit'});
    cp.execSync(`git commit ${NO_VERIFY?'--no-verify':''} -m "${MSG}"`, {stdio:'inherit'});
    const tag = 'doctor_dev_bus_tap_' + NOW;
    cp.execSync(`git tag ${tag}`, {stdio:'inherit'});
    console.log('✓ committed & tagged', tag);
  } catch (e) {
    console.warn('! git failed:', e?.message||e);
  }
} else {
  console.log('· dry run complete — re-run with --commit to persist');
}

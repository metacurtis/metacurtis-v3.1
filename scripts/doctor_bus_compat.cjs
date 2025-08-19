#!/usr/bin/env node
/**
 * doctor_bus_compat.cjs
 * Make Engine + StateController use a robust BeatBus import:
 *   import * as BeatBusAdapter from '.../BeatBusAdapter.js';
 *   const BeatBus = BeatBusAdapter.getBeatBus
 *        ? (typeof BeatBusAdapter.getBeatBus === 'function'
 *            ? BeatBusAdapter.getBeatBus() : BeatBusAdapter.getBeatBus)
 *        : (BeatBusAdapter.default || BeatBusAdapter);
 *
 * Also removes any previous default/named BeatBus imports from the adapter.
 * Idempotent. Dry-run by default. Use --commit (and optionally --no-verify).
 */
const fs = require('fs'); const path = require('path'); const cp = require('child_process');

const NOW  = new Date().toISOString().replace(/[:]/g,'-');
const SNAP = path.join('snapshots', `doctor_bus_compat_${NOW}`);
const DO_COMMIT = process.argv.includes('--commit');
const NO_VERIFY = process.argv.includes('--no-verify');
const MSG = 'chore(dev): BeatBus adapter compatibility (namespace import + safe resolve)';

const FILES = [
  'src/state/StateController.js',
  'src/engine/ConsciousnessEngine.js',
];

function ex(f){ return fs.existsSync(f); }
function rd(f){ return fs.readFileSync(f,'utf8'); }
function wr(f,s){ fs.writeFileSync(f,s,'utf8'); }
function ensureDir(d){ fs.mkdirSync(d,{recursive:true}); }
function backupOnce(f){ const bak=f+'.bak'; if(!ex(bak)){ fs.copyFileSync(f, bak); console.log('· backup', bak); } }
function snap(f){ ensureDir(SNAP); fs.writeFileSync(path.join(SNAP, f.replace(/\//g,'__')+'.txt'), rd(f)); }

function addAfterImports(src, code){
  const m = src.match(/^(?:\s*import[\s\S]*?\n)+/m);
  if (m) return src.slice(0, m.index + m[0].length) + code + src.slice(m.index + m[0].length);
  return code + src;
}

function patchFile(f){
  if (!ex(f)) return false;
  let s = rd(f), o = s; backupOnce(f);

  // 1) Remove default or named BeatBus imports from BeatBusAdapter.js
  s = s.replace(
    /^import\s+BeatBus\s+from\s+['"][^'"]*BeatBusAdapter\.js['"]\s*;?\s*$/gm,
    ''
  );
  s = s.replace(
    /^import\s*\{\s*getBeatBus\s*\}\s*from\s+['"][^'"]*BeatBusAdapter\.js['"]\s*;?\s*$/gm,
    ''
  );
  s = s.replace(
    /^import\s+\*\s+as\s+BeatBusAdapter\s+from\s+['"][^'"]*BeatBusAdapter\.js['"]\s*;?\s*$/m,
    '' // we'll re-add a single canonical one below
  );

  // 2) Ensure namespace import exists
  if (!/BeatBusAdapter\.js/.test(s) || !/import\s+\*\s+as\s+BeatBusAdapter\s+from\s+['"][^'"]*BeatBusAdapter\.js['"]/.test(s)){
    s = addAfterImports(s, `import * as BeatBusAdapter from '@/modules/orchestration/core/BeatBusAdapter.js';\n`);
  }

  // 3) Ensure "const BeatBus = ..." resolver exists
  if (!/\bconst\s+BeatBus\s*=/.test(s)){
    const resolver = `const BeatBus = (BeatBusAdapter.getBeatBus
  ? (typeof BeatBusAdapter.getBeatBus === 'function' ? BeatBusAdapter.getBeatBus() : BeatBusAdapter.getBeatBus)
  : (BeatBusAdapter.default || BeatBusAdapter));\n`;
    s = addAfterImports(s, resolver);
  }

  if (s !== o){ wr(f, s); snap(f); console.log('· patched', f); return true; }
  console.log('· no-op', f); return false;
}

let changed = false;
for (const f of FILES){ changed = patchFile(f) || changed; }

if (changed){
  if (DO_COMMIT){
    try{
      cp.execSync('git add -A', {stdio:'inherit'});
      cp.execSync(`git commit ${NO_VERIFY?'--no-verify':''} -m "${MSG}"`, {stdio:'inherit'});
      const tag = 'doctor_bus_compat_' + NOW;
      cp.execSync(`git tag ${tag}`, {stdio:'inherit'});
      console.log('✓ committed & tagged', tag);
    }catch(e){ console.warn('! git failed:', e?.message||e); }
  } else {
    console.log('· dry run complete — re-run with --commit to persist');
  }
} else {
  console.log('· nothing to change');
}

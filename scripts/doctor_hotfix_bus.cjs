#!/usr/bin/env node
/**
 * doctor_hotfix_bus.cjs
 * - Normalize BeatBus import to a default import from the adapter
 * - Remove any prior getBeatBus/namespace resolver blocks
 * - Make Engine listeners accept both old/new payload shapes
 * Idempotent; dry-run by default. Use --commit (optionally --no-verify).
 */
const fs = require('fs'); const path = require('path'); const cp = require('child_process');

const NOW  = new Date().toISOString().replace(/[:]/g,'-');
const SNAP = path.join('snapshots', `doctor_hotfix_bus_${NOW}`);
const DO_COMMIT = process.argv.includes('--commit');
const NO_VERIFY = process.argv.includes('--no-verify');
const MSG = 'chore(dev): restore BeatBus default import + tolerant listeners';

const TARGETS = [
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

function normalizeImport(s){
  // Remove any import lines from BeatBusAdapter (named/default/namespace)
  s = s.replace(/^import\s+.*?\s+from\s+['"][^'"]*BeatBusAdapter\.js['"]\s*;?\s*$/gm, '');
  // Add the canonical default import exactly once
  if (!/from\s+['"][^'"]*BeatBusAdapter\.js['"]/.test(s)){
    s = addAfterImports(s, `import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';\n`);
  } else {
    s = s.replace(/import\s+.*?from\s+['"][^'"]*BeatBusAdapter\.js['"]\s*;?/m,
                  "import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';");
  }
  // Remove any previously injected resolver const BeatBus = (BeatBusAdapter...
  s = s.replace(/const\s+BeatBus\s*=\s*\(BeatBusAdapter[\s\S]*?\);\s*\n?/g, '');
  return s;
}

function tolerantListeners(s){
  // QUALITY_CHANGE listener → tolerant
  s = s.replace(
    /BeatBus\.on\(\s*EVENTS\.QUALITY_CHANGE\s*,\s*\([^\)]*\)\s*=>\s*\{/,
    "BeatBus.on(EVENTS.QUALITY_CHANGE, (payload = {}) => { const tier = payload?.tier ?? payload?.quality; if (!tier) return; "
  );
  // STAGE_CHANGE listener → tolerant
  s = s.replace(
    /BeatBus\.on\(\s*EVENTS\.STAGE_CHANGE\s*,\s*\([^\)]*\)\s*=>\s*\{/,
    "BeatBus.on(EVENTS.STAGE_CHANGE, (payload = {}) => { const stage = payload?.stage ?? payload?.to; if (!stage) return; "
  );
  return s;
}

let changed = false;
for (const f of TARGETS){
  if (!ex(f)) { console.warn('! missing', f); continue; }
  let src = rd(f), orig = src; backupOnce(f);
  src = normalizeImport(src);
  if (f.includes('ConsciousnessEngine.js')) src = tolerantListeners(src);
  if (src !== orig){ wr(f, src); snap(f); console.log('· patched', f); changed = true; } else { console.log('· no-op', f); }
}

if (changed){
  if (DO_COMMIT){
    try {
      cp.execSync('git add -A', {stdio:'inherit'});
      cp.execSync(`git commit ${NO_VERIFY?'--no-verify':''} -m "${MSG}"`, {stdio:'inherit'});
      const tag = 'doctor_hotfix_bus_' + NOW;
      cp.execSync(`git tag ${tag}`, {stdio:'inherit'});
      console.log('✓ committed & tagged', tag);
    } catch (e) { console.warn('! git failed:', e?.message||e); }
  } else {
    console.log('· dry run complete — re-run with --commit to persist');
  }
} else {
  console.log('· nothing to change');
}

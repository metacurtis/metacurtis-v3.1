#!/usr/bin/env node
/**
 * doctor_unify_beatbus.cjs
 * Ensure every module uses the same bus via BeatBusAdapter.getBeatBus().
 * Idempotent, dry-run by default. Use --commit (and optionally --no-verify).
 */
const fs = require('fs'); const path = require('path'); const cp = require('child_process');

const DO_COMMIT = process.argv.includes('--commit');
const NO_VERIFY = process.argv.includes('--no-verify');
const MSG = 'chore(dev): unify BeatBus to adapter (single-lane bus)';

const NOW  = new Date().toISOString().replace(/[:]/g,'-');
const SNAP = path.join('snapshots', `doctor_unify_beatbus_${NOW}`);

const FILES = [
  'src/engine/ConsciousnessEngine.js',
  'src/theater/TheaterDirector.js',
  'src/theater/TheaterDirector.jsx',
  'src/components/theater/OpeningSequence.jsx',
  // add more if your repo references core/BeatBus elsewhere
];

function ex(f){ return fs.existsSync(f); }
function rd(f){ return fs.readFileSync(f,'utf8'); }
function wr(f,s){ fs.writeFileSync(f,s,'utf8'); }
function ensureDir(d){ fs.mkdirSync(d,{recursive:true}); }
function backupOnce(f){ const bak=f+'.bak'; if(!ex(bak)){ fs.copyFileSync(f, bak); console.log('· backup', f+'.bak'); } }
function snap(f){ ensureDir(SNAP); fs.writeFileSync(path.join(SNAP, f.replace(/\//g,'__')+'.txt'), rd(f)); }

function patchFile(file){
  if(!ex(file)) return false;
  let s = rd(file), orig = s; backupOnce(file);

  // 1) remove direct BeatBus import lines (core/BeatBus) — keep others
  const beatBusCoreRe = /^import\s+BeatBus\s+from\s+['"][^'"]*\/core\/BeatBus(?:\.js)?['"];?\s*$/gm;
  s = s.replace(beatBusCoreRe, '');

  // if file never imported core/BeatBus, skip further changes
  if (s === orig) { console.log('· no-op', file); return false; }

  // 2) ensure adapter import (named getBeatBus)
  if (!/BeatBusAdapter\.js/.test(s)) {
    const firstImports = s.match(/^(?:import[\s\S]*?\n)+/m);
    const ins = `import { getBeatBus } from '@/modules/orchestration/core/BeatBusAdapter.js';\n`;
    if (firstImports) {
      const idx = firstImports.index + firstImports[0].length;
      s = s.slice(0, idx) + ins + s.slice(idx);
    } else {
      s = ins + s;
    }
  } else if (!/getBeatBus/.test(s)) {
    // adapter exists but not the named import — add it safely
    s = s.replace(/(from\s+['"][^'"]*BeatBusAdapter\.js['"]\s*;?\s*)/, '$1');
    // Add a separate named import
    s = s.replace(/^(import[\s\S]*?\n)/m, (m)=> m + `import { getBeatBus } from '@/modules/orchestration/core/BeatBusAdapter.js';\n`);
  }

  // 3) define BeatBus instance once (after imports)
  if (!/\bconst\s+BeatBus\s*=/.test(s)) {
    const importEnd = (s.match(/^(?:import[\s\S]*?\n)+/m)||[''])[0].length;
    const bind = `const BeatBus = (typeof getBeatBus === 'function' ? getBeatBus() : getBeatBus);\n`;
    s = s.slice(0, importEnd) + bind + s.slice(importEnd);
  }

  // 4) write/snapshot
  wr(file, s); snap(file); console.log('· patched', file); return true;
}

/* run */
let changed = false;
FILES.forEach(f => { changed = patchFile(f) || changed; });

if (changed){
  if (DO_COMMIT){
    try {
      require('child_process').execSync('git add -A', {stdio:'inherit'});
      require('child_process').execSync(`git commit ${NO_VERIFY?'--no-verify':''} -m "${MSG}"`, {stdio:'inherit'});
      const tag = 'doctor_unify_beatbus_' + NOW;
      require('child_process').execSync(`git tag ${tag}`, {stdio:'inherit'});
      console.log('✓ committed & tagged', tag);
    } catch (e) {
      console.warn('! git failed:', e?.message||e);
    }
  } else {
    console.log('· dry run complete — re-run with --commit to persist');
  }
} else {
  console.log('· nothing to change');
}

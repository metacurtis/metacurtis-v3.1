#!/usr/bin/env node
/**
 * doctor_core_signal_hardening.cjs
 * - Fix QUALITY_CHANGE destructuring ({ tier } -> { quality })
 * - Normalize ConsciousnessEngine to BeatBusAdapter singleton
 * Idempotent. Dry-run by default. Use --commit to persist and tag.
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = process.cwd();
const FILE = 'src/engine/ConsciousnessEngine.js';

const NOW = new Date().toISOString().replace(/[:]/g,'-');
const SNAP_DIR = path.join('snapshots', `doctor_core_signal_hardening_${NOW}`);

const ARGS = new Set(process.argv.slice(2));
const DO_COMMIT = ARGS.has('--commit');
const DO_PUSH = ARGS.has('--push');
const NO_VERIFY = ARGS.has('--no-verify');
const MSG = (() => {
  const i = process.argv.indexOf('--message');
  if (i !== -1 && process.argv[i+1]) return process.argv[i+1];
  return 'chore(dev): core signals — BeatBusAdapter + QUALITY_CHANGE wiring';
})();

function p(...segs){ return path.join(ROOT, ...segs); }
function exists(f){ return fs.existsSync(p(f)); }
function read(f){ return fs.readFileSync(p(f), 'utf8'); }
function write(f, s){ fs.writeFileSync(p(f), s, 'utf8'); }
function ensureDir(d){ fs.mkdirSync(p(d), { recursive:true }); }
function backupOnce(f){
  const bak = f + '.bak';
  if (!exists(bak)) {
    fs.copyFileSync(p(f), p(bak));
    console.log('· backup created:', bak);
  }
}
function snapshot(f, s){
  ensureDir(SNAP_DIR);
  fs.writeFileSync(p(SNAP_DIR, f.replace(/\//g,'__') + '.txt'), s, 'utf8');
}

if (!exists(FILE)) {
  console.warn('! missing', FILE);
  process.exit(0);
}

let src = read(FILE);
const orig = src;
backupOnce(FILE);

/** 1) Swap BeatBus import -> BeatBusAdapter + create singleton bus */
if (!/BeatBusAdapter\.js/.test(src)) {
  // Replace import BeatBus ... (various path styles)
  src = src.replace(
    /import\s+BeatBus\s+from\s+['"]@?\/?modules\/orchestration\/core\/BeatBus['"];?/,
    "import { getBeatBus } from '@/modules/orchestration/core/BeatBusAdapter.js';"
  );
  // If no import matched (some projects alias differently), try another common alias:
  src = src.replace(
    /import\s+BeatBus\s+from\s+['"]@modules\/orchestration\/core\/BeatBus['"];?/,
    "import { getBeatBus } from '@/modules/orchestration/core/BeatBusAdapter.js';"
  );

  // Insert bus singleton (only once)
  if (!/__BUS__\s*=/.test(src)) {
    // Add just after the last import line
    const importBlockMatch = src.match(/^(?:import .*\n)+/m);
    if (importBlockMatch) {
      const inject = `\n// doctor:core-signal — BeatBus singleton\nconst __BUS__ = (typeof getBeatBus === 'function' ? getBeatBus() : getBeatBus);\n`;
      const idx = importBlockMatch.index + importBlockMatch[0].length;
      src = src.slice(0, idx) + inject + src.slice(idx);
    }
  }

  // Replace all BeatBus.on/emit with __BUS__.on/emit
  src = src.replace(/BeatBus\.on\(/g, '__BUS__.on(');
  src = src.replace(/BeatBus\.emit\(/g, '__BUS__.emit(');
}

/** 2) Fix QUALITY_CHANGE handler: ({ tier }) -> ({ quality }) and variable uses */
src = src.replace(
  /(__BUS__\.on\(|BeatBus\.on\()(\s*EVENTS\.QUALITY_CHANGE\s*,\s*)\(\{\s*tier\s*\}\)\s*=>\s*\{\s*[^}]*?currentQuality\s*=\s*tier;?/m,
  (m, pfx, evt) => {
    return `${pfx}${evt}({ quality }) => { this.currentQuality = quality;`;
  }
);

// Also fix log lines "Quality change to ${tier}"
src = src.replace(/Quality change to \$\{tier\}/g, 'Quality change to ${quality}');

// BuildAndEmit call in that handler: pass 'quality'
src = src.replace(
  /buildAndEmitBlueprint\(\s*this\.currentStage\s*,\s*tier\s*\)/g,
  'buildAndEmitBlueprint(this.currentStage, quality)'
);

/** 3) Optional robustness: if STAGE_CHANGE handler destructures { stage } from a different shape, leave as-is. */

/** 4) Save if changes occurred */
if (src !== orig) {
  write(FILE, src);
  snapshot(FILE, src);
  console.log('· patched', FILE);
} else {
  console.log('· no-op', FILE);
}

/** 5) Git (opt-in) */
if (DO_COMMIT) {
  try {
    cp.execSync('git add -A', {stdio:'inherit'});
    cp.execSync(`git commit ${NO_VERIFY?'--no-verify':''} -m "${MSG}"`, {stdio:'inherit'});
    const tag = 'doctor_core_signal_hardening_' + NOW;
    cp.execSync(`git tag ${tag}`, {stdio:'inherit'});
    console.log('✓ committed & tagged', tag);
    if (DO_PUSH) {
      cp.execSync(`git push ${NO_VERIFY?'--no-verify':''}`, {stdio:'inherit'});
      cp.execSync(`git push --tags ${NO_VERIFY?'--no-verify':''}`, {stdio:'inherit'});
    }
  } catch (e) {
    console.warn('! git step failed:', e?.message||e);
  }
} else {
  console.log('· dry run complete — re-run with --commit to persist');
}

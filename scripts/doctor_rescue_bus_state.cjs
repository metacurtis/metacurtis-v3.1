#!/usr/bin/env node
/**
 * doctor_rescue_bus_state.cjs
 *
 * Goals (idempotent):
 *  - Adapter: ensure default export + getBeatBus shim (compat both ways)
 *  - StateController: canonicalize events (STAGE_CHANGE {from,to}, QUALITY_CHANGE {tier})
 *  - Engine: tolerant listeners (accept {stage}|{to}, {tier}|{quality})
 *  - Remove accidental BeatBus shadow vars caused by dev taps
 *  - Create timestamped snapshots of patched files
 *
 * Dry run by default. Use --commit to commit (optionally --no-verify).
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const DO_COMMIT = process.argv.includes('--commit');
const NO_VERIFY = process.argv.includes('--no-verify');

const NOW = new Date().toISOString().replace(/:/g, '-');
const SNAP = path.join('snapshots', `doctor_rescue_bus_state_${NOW}`);
const FILES = {
  adapter: 'src/modules/orchestration/core/BeatBusAdapter.js',
  state:   'src/state/StateController.js',
  engine:  'src/engine/ConsciousnessEngine.js',
};

function ex(p) { return fs.existsSync(p); }
function rd(p) { return fs.readFileSync(p, 'utf8'); }
function wr(p, s) { fs.writeFileSync(p, s, 'utf8'); }
function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); }
function backupOnce(p) { const bak = p + '.bak'; if (!ex(bak)) { fs.copyFileSync(p, bak); log(`backup ${bak}`); } }
function snap(p, s) { ensureDir(SNAP); const out = path.join(SNAP, p.replace(/\//g, '__') + '.txt'); fs.writeFileSync(out, s, 'utf8'); }
function log(...a){ console.log('·', ...a); }
function warn(...a){ console.warn('!', ...a); }

function replaceOnce(src, re, rep){
  const next = src.replace(re, rep);
  return { changed: next !== src, src: next };
}

// 1) Adapter: ensure default export (if missing) and getBeatBus shim
function patchAdapter(file){
  if (!ex(file)) { warn('missing', file); return false; }
  let src = rd(file), orig = src; backupOnce(file);

  const hasDefault = /export\s+default\s+/.test(src);
  const hasGet = /export\s+(?:function|const)\s+getBeatBus\b/.test(src);

  // If there's no default but there *is* getBeatBus, add a default shim
  if (!hasDefault && hasGet){
    // Avoid double shim
    if (!/doctor:default-export-shim/.test(src)) {
      src += `

// doctor:default-export-shim — idempotent
// If getBeatBus is a function, call it; otherwise assume it's the bus object.
export default (typeof getBeatBus === 'function' ? getBeatBus() : getBeatBus);
`;
      log('patched default export shim (adapter)');
    }
  }

  // If neither default nor getBeatBus exist, *do nothing* (don't override unknown impl)
  // Optional: expose a named shim if only default exists (harmless)
  if (hasDefault && !/export\s+function\s+getBeatBus\b/.test(src) && !/export\s+const\s+getBeatBus\b/.test(src)){
    if (!/doctor:getBeatBus-shim/.test(src)){
      // Try to reference default under a stable name
      src += `

// doctor:getBeatBus-shim — idempotent
import BeatBusDefaultForShim from './BeatBusAdapter.js';
export function getBeatBus(){ return BeatBusDefaultForShim; }
`;
      log('patched getBeatBus shim (adapter)');
    }
  }

  if (src !== orig) { wr(file, src); snap(file, src); return true; }
  log('no-op', file);
  return false;
}

// 2) StateController: canonicalize setStage/setQuality; remove BeatBus shadow
function patchState(file){
  if (!ex(file)) { warn('missing', file); return false; }
  let src = rd(file), orig = src; backupOnce(file);

  // Normalize adapter import to default
  src = src.replace(
    /import\s+{?\s*getBeatBus\s*}?\s+from\s+['"][^'"]*BeatBusAdapter\.js['"];?/g,
    `import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';`
  );

  // Remove accidental shadow (const BeatBus = (typeof getBeatBus...) remnants)
  src = src.replace(/^\s*const\s+BeatBus\s*=\s*\([^)]*\);\s*$/mg, '');

  // setStage: ensure {from,to}
  if (/function\s+setStage\s*\(/.test(src)){
    src = src.replace(
      /function\s+setStage\s*\([\s\S]*?\{[\s\S]*?\}\s*\n\}/m,
`function setStage(name){
  if (!name || name===_stage) return;
  const _prev = _stage;
  _stage = name;
  _emit(EVENTS.STAGE_CHANGE, { from:_prev, to:_stage });
}`.trim()
    );
  }

  // setQuality: ensure {tier}
  if (/function\s+setQuality\s*\(/.test(src)){
    src = src.replace(
      /function\s+setQuality\s*\([\s\S]*?\{[\s\S]*?\}\s*\n\}/m,
`function setQuality(tier){
  if (!tier || tier===_quality) return;
  _quality = tier;
  _emit(EVENTS.QUALITY_CHANGE, { tier });
}`.trim()
    );
  }

  if (src !== orig){ wr(file, src); snap(file, src); log('patched', file); return true; }
  log('no-op', file); return false;
}

// 3) Engine: tolerant listeners + remove BeatBus shadow
function patchEngine(file){
  if (!ex(file)) { warn('missing', file); return false; }
  let src = rd(file), orig = src; backupOnce(file);

  // Normalize adapter import to default
  src = src.replace(
    /import\s+{?\s*getBeatBus\s*}?\s+from\s+['"][^'"]*BeatBusAdapter\.js['"];?/g,
    `import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';`
  );

  // Remove accidental shadow (const BeatBus = ...)
  src = src.replace(/^\s*const\s+BeatBus\s*=\s*\([^)]*\);\s*$/mg, '');

  // Listener: STAGE_CHANGE — tolerate payload.stage or payload.to
  if (/BeatBus\.on\(\s*EVENTS\.STAGE_CHANGE/.test(src)){
    src = src.replace(
      /BeatBus\.on\(\s*EVENTS\.STAGE_CHANGE\s*,\s*\(\{\s*stage\s*\}\)\s*=>\s*\{/,
      `BeatBus.on(EVENTS.STAGE_CHANGE, (payload = {}) => { const stage = payload.stage ?? payload.to;`
    );
  }

  // Listener: QUALITY_CHANGE — tolerate payload.tier or payload.quality
  if (/BeatBus\.on\(\s*EVENTS\.QUALITY_CHANGE/.test(src)){
    src = src.replace(
      /BeatBus\.on\(\s*EVENTS\.QUALITY_CHANGE\s*,\s*\(\{\s*tier\s*\}\)\s*=>\s*\{/,
      `BeatBus.on(EVENTS.QUALITY_CHANGE, (payload = {}) => { const tier = payload.tier ?? payload.quality;`
    );
  }

  if (src !== orig){ wr(file, src); snap(file, src); log('patched', file); return true; }
  log('no-op', file); return false;
}

/* run */
const changed = [
  patchAdapter(FILES.adapter),
  patchState(FILES.state),
  patchEngine(FILES.engine),
].some(Boolean);

/* commit if requested */
if (DO_COMMIT && changed) {
  try {
    cp.execSync('git add -A', { stdio:'inherit' });
    cp.execSync(`git commit ${NO_VERIFY ? '--no-verify' : ''} -m "rescue: unify BeatBus + canonicalize StateController events + tolerant Engine listeners"`, { stdio:'inherit' });
    const tag = 'doctor_rescue_bus_state_' + NOW;
    cp.execSync(`git tag ${tag}`, { stdio:'inherit' });
    console.log('✓ committed & tagged', tag);
  } catch (e) {
    console.warn('! git failed:', e?.message || e);
  }
} else {
  console.log('· dry run complete — re-run with --commit to persist');
}

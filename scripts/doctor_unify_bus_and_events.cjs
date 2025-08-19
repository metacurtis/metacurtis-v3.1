#!/usr/bin/env node
/**
 * doctor_unify_bus_and_events.cjs
 * - Unify BeatBus usage to adapter getBeatBus() across modules
 * - Fix StateController event payloads to canonical {from,to} and {tier}
 * - Make Engine listeners accept both old/new shapes (stage|to, quality|tier)
 * Idempotent. Dry-run by default. Use --commit (optionally --no-verify).
 */
const fs = require('fs'); const path = require('path'); const cp = require('child_process');

const NOW  = new Date().toISOString().replace(/[:]/g,'-');
const SNAP = path.join('snapshots', `doctor_unify_bus_and_events_${NOW}`);
const DO_COMMIT = process.argv.includes('--commit');
const NO_VERIFY = process.argv.includes('--no-verify');
const MSG = 'chore(dev): unify BeatBus via adapter + canonicalize event shapes';

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
  const m = src.match(/^(?:import[\s\S]*?\n)+/m);
  if (m) return src.slice(0, m.index + m[0].length) + code + src.slice(m.index + m[0].length);
  return code + src;
}

/** replace a JS function by name with provided body (balanced braces) */
function replaceFunction(src, name, body){
  const sig = new RegExp(`\\bfunction\\s+${name}\\s*\\(`);
  const m = src.match(sig);
  if (!m) return src;
  const openIdx = src.indexOf('{', m.index);
  if (openIdx < 0) return src;
  let depth = 0, i = openIdx;
  for (; i < src.length; i++){
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}'){
      depth--;
      if (depth === 0){ i++; break; }
    }
  }
  const headStart = src.lastIndexOf('\n', m.index) + 1;
  const indent = (src.slice(headStart, openIdx).match(/^\s*/)||[''])[0];
  return src.slice(0, headStart) + indent + body.trim() + '\n' + src.slice(i);
}

let changed = false;

/* ────────────────────────────────────────────────────────────────────────── */
/* 1) StateController.js: unify bus + canonical events                       */
/* ────────────────────────────────────────────────────────────────────────── */
(() => {
  const f = FILES[0]; if (!ex(f)) return;
  let s = rd(f), o = s; backupOnce(f);

  // remove default BeatBus import; ensure getBeatBus import
  s = s.replace(/^import\s+BeatBus\s+from\s+['"][^'"]*BeatBusAdapter\.js['"];?\s*$/gm, '');
  if (!/BeatBusAdapter\.js/.test(s)) {
    s = addAfterImports(s, `import { getBeatBus } from '@/modules/orchestration/core/BeatBusAdapter.js';\n`);
  } else if (!/getBeatBus/.test(s)) {
    s = s.replace(/(from\s+['"][^'"]*BeatBusAdapter\.js['"]\s*;?\s*)/, '$1');
    s = addAfterImports(s, `import { getBeatBus } from '@/modules/orchestration/core/BeatBusAdapter.js';\n`);
  }
  if (!/\bconst\s+BeatBus\s*=/.test(s)){
    s = addAfterImports(s, `const BeatBus = (typeof getBeatBus === 'function' ? getBeatBus() : getBeatBus);\n`);
  }

  // setStage → { from, to, stage: to }
  if (/function\s+setStage\s*\(/.test(s)){
    const body = `
function setStage(name){
  if (!name || name===_stage) return;
  const _prev = _stage;
  _stage = name;
  _emit(EVENTS.STAGE_CHANGE, { from:_prev, to:_stage, stage:_stage });
}`.trim();
    s = replaceFunction(s, 'setStage', body);
  }

  // setQuality → { tier, quality:tier, stage:_stage }
  if (/function\s+setQuality\s*\(/.test(s)){
    const body = `
function setQuality(tier){
  if (!tier || tier===_quality) return;
  _quality = tier;
  _emit(EVENTS.QUALITY_CHANGE, { tier, quality:_quality, stage:_stage });
}`.trim();
    s = replaceFunction(s, 'setQuality', body);
  }

  if (s !== o){ wr(f, s); snap(f); console.log('· patched', f); changed = true; } else { console.log('· no-op', f); }
})();

/* ────────────────────────────────────────────────────────────────────────── */
/* 2) ConsciousnessEngine.js: unify bus + robust listeners                   */
/* ────────────────────────────────────────────────────────────────────────── */
(() => {
  const f = FILES[1]; if (!ex(f)) return;
  let s = rd(f), o = s; backupOnce(f);

  // remove any default BeatBus import from adapter; add getBeatBus
  s = s.replace(/^import\s+BeatBus\s+from\s+['"][^'"]*BeatBusAdapter\.js['"];?\s*$/gm, '');
  if (!/BeatBusAdapter\.js/.test(s)) {
    s = addAfterImports(s, `import { getBeatBus } from '@/modules/orchestration/core/BeatBusAdapter.js';\n`);
  } else if (!/getBeatBus/.test(s)) {
    s = s.replace(/(from\s+['"][^'"]*BeatBusAdapter\.js['"]\s*;?\s*)/, '$1');
    s = addAfterImports(s, `import { getBeatBus } from '@/modules/orchestration/core/BeatBusAdapter.js';\n`);
  }
  if (!/\bconst\s+BeatBus\s*=/.test(s)){
    s = addAfterImports(s, `const BeatBus = (typeof getBeatBus === 'function' ? getBeatBus() : getBeatBus);\n`);
  }

  // Make STAGE_CHANGE listener accept {stage} or {to}
  s = s.replace(
    /BeatBus\.on\s*\(\s*EVENTS\.STAGE_CHANGE\s*,\s*\(\{\s*stage\s*\}\)\s*=>\s*\{/,
    "BeatBus.on(EVENTS.STAGE_CHANGE, (payload = {}) => { const stage = payload?.stage ?? payload?.to; if (!stage) return; {"
  );

  // Make QUALITY_CHANGE listener accept {tier} or {quality}
  s = s.replace(
    /BeatBus\.on\s*\(\s*EVENTS\.QUALITY_CHANGE\s*,\s*\(\{\s*tier\s*\}\)\s*=>\s*\{/,
    "BeatBus.on(EVENTS.QUALITY_CHANGE, (payload = {}) => { const tier = payload?.tier ?? payload?.quality; if (!tier) return; {"
  );

  if (s !== o){ wr(f, s); snap(f); console.log('· patched', f); changed = true; } else { console.log('· no-op', f); }
})();

/* ────────────────────────────────────────────────────────────────────────── */

if (changed){
  if (DO_COMMIT){
    try {
      cp.execSync('git add -A', {stdio:'inherit'});
      cp.execSync(`git commit ${NO_VERIFY?'--no-verify':''} -m "${MSG}"`, {stdio:'inherit'});
      const tag = 'doctor_unify_bus_and_events_' + NOW;
      cp.execSync(`git tag ${tag}`, {stdio:'inherit'});
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

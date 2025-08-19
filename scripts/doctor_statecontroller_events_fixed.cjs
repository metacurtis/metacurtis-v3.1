#!/usr/bin/env node
/**
 * doctor_statecontroller_events_fixed.cjs
 * Normalize StateController events with correct underscores (no stray asterisks):
 *   - STAGE_CHANGE { from, to }
 *   - QUALITY_CHANGE { tier }
 * Idempotent. Dry-run by default. Use --commit to persist & tag.
 */
const fs = require('fs'); const path = require('path'); const cp = require('child_process');

const ROOT = process.cwd();
const CANDIDATES = [
  'src/state/StateController.js',
  'src/core/StateController.js',
  'src/modules/state/StateController.js',
  'src/StateController.js'
];

const NOW = new Date().toISOString().replace(/[:]/g,'-');
const SNAP = path.join('snapshots', `doctor_statecontroller_events_fixed_${NOW}`);

const DO_COMMIT = process.argv.includes('--commit');
const DO_PUSH   = process.argv.includes('--push');
const NO_VERIFY = process.argv.includes('--no-verify');
const MSG = (()=> {
  const i = process.argv.indexOf('--message');
  return (i>0 && process.argv[i+1]) ? process.argv[i+1]
    : 'chore(dev): StateController — canonical events (from/to, tier) [underscore fix]';
})();

function p(...s){ return path.join(ROOT, ...s); }
function ex(f){ return fs.existsSync(p(f)); }
function rd(f){ return fs.readFileSync(p(f),'utf8'); }
function wr(f,s){ fs.writeFileSync(p(f), s, 'utf8'); }
function ensureDir(d){ fs.mkdirSync(p(d), { recursive:true }); }
function backupOnce(f){ const bak=f+'.bak'; if (!ex(bak)) { fs.copyFileSync(p(f), p(bak)); console.log('· backup', bak); } }
function snap(f){ ensureDir(SNAP); fs.writeFileSync(p(SNAP, f.replace(/\//g,'__')+'.txt'), rd(f)); }

/** Replace a top-level function declaration by name, brace-balanced */
function replaceFunction(src, name, newBody){
  const sig = new RegExp(`\\bfunction\\s+${name}\\s*\\(`);
  const m = src.match(sig);
  if (!m) return { src, changed:false, reason:`function ${name} not found` };
  const headerStart = src.lastIndexOf('\n', m.index) + 1;
  const open = src.indexOf('{', m.index);
  if (open < 0) return { src, changed:false, reason:'no {' };
  let depth = 0, i = open;
  for (; i < src.length; i++){
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}'){ depth--; if (depth === 0){ i++; break; } }
  }
  if (depth !== 0) return { src, changed:false, reason:'unbalanced braces' };
  const indent = (src.slice(headerStart, open).match(/^\s*/)||[''])[0];
  const inject = `${indent}${newBody.trim()}\n`;
  return { src: src.slice(0, headerStart) + inject + src.slice(i), changed:true };
}

function patch(target){
  let src = rd(target), orig = src; backupOnce(target);
  let changed = false;

  const SET_STAGE = `
function setStage(name){
  if (!name || name===_stage) return;
  const _prev = _stage;
  _stage = name;
  _emit(EVENTS.STAGE_CHANGE, { from:_prev, to:_stage });
}
`.trim();

  const SET_QUALITY = `
function setQuality(tier){
  if (!tier || tier===_quality) return;
  _quality = tier;
  _emit(EVENTS.QUALITY_CHANGE, { tier });
}
`.trim();

  let r1 = replaceFunction(src, 'setStage', SET_STAGE);
  src = r1.src; changed = changed || r1.changed;

  let r2 = replaceFunction(src, 'setQuality', SET_QUALITY);
  src = r2.src; changed = changed || r2.changed;

  if (changed){
    wr(target, src);
    snap(target);
    console.log('· patched', target);
  } else {
    console.log('· no-op', target, r1.reason || r2.reason || '');
  }
  return changed;
}

/* run */
const file = CANDIDATES.find(ex);
if (!file){
  console.warn('! StateController not found. Tried:\n' + CANDIDATES.map(f=>'  - '+f).join('\n'));
  process.exit(0);
}
const changed = patch(file);

/* git */
if (DO_COMMIT && changed){
  try{
    cp.execSync('git add -A', {stdio:'inherit'});
    cp.execSync(`git commit ${NO_VERIFY?'--no-verify':''} -m "${MSG}"`, {stdio:'inherit'});
    const tag = 'doctor_statecontroller_events_fixed_' + NOW;
    cp.execSync(`git tag ${tag}`, {stdio:'inherit'});
    console.log('✓ committed & tagged', tag);
    if (DO_PUSH){
      cp.execSync(`git push ${NO_VERIFY?'--no-verify':''}`, {stdio:'inherit'});
      cp.execSync(`git push --tags ${NO_VERIFY?'--no-verify':''}`, {stdio:'inherit'});
    }
  } catch (e) {
    console.warn('! git step failed:', e?.message||e);
  }
} else {
  console.log('· dry run complete — re-run with --commit to persist');
}

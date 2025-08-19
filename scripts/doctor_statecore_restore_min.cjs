#!/usr/bin/env node
/**
 * doctor_statecore_restore_min.cjs
 * Remove dev bus taps and restore StateController to canonical, stable form.
 * - Cleans src/dev/renderHealthcheck.js: remove injected DEV BUS TAP block + adapter import
 * - Restores/repairs src/state/StateController.js to canonical StateCore
 * Idempotent. Dry-run by default. Use --commit (optionally --no-verify) to persist.
 */
const fs = require('fs'); const path = require('path'); const cp = require('child_process');

const RH_FILE = 'src/dev/renderHealthcheck.js';
const STATE_CANDIDATES = [
  'src/state/StateController.js',
  'src/core/StateController.js',
  'src/modules/state/StateController.js',
  'src/StateController.js'
];

const NOW  = new Date().toISOString().replace(/[:]/g,'-');
const SNAP = path.join('snapshots', `doctor_statecore_restore_min_${NOW}`);
const DO_COMMIT = process.argv.includes('--commit');
const NO_VERIFY = process.argv.includes('--no-verify');
const MSG = 'chore(dev): restore StateCore and remove dev bus taps';

function p(...s){ return path.join(process.cwd(), ...s); }
function ex(f){ return fs.existsSync(p(f)); }
function rd(f){ return fs.readFileSync(p(f),'utf8'); }
function wr(f,s){ fs.writeFileSync(p(f), s, 'utf8'); }
function ensureDir(d){ fs.mkdirSync(p(d), {recursive:true}); }
function backupOnce(f){ const b=f+'.bak'; if(!ex(b)){ fs.copyFileSync(p(f), p(b)); console.log('· backup', b); } }
function snapFile(f){ ensureDir(SNAP); fs.writeFileSync(p(SNAP, f.replace(/\//g,'__')+'.txt'), rd(f)); }

/* 1) Clean renderHealthcheck injected tap + adapter import */
function cleanRenderHealthcheck(){
  if (!ex(RH_FILE)) return false;
  let s = rd(RH_FILE), orig = s; backupOnce(RH_FILE);

  // remove any DEV BUS TAP block inserted earlier
  const blocks = [
    /\/\*\s*>>> DEV BUS TAP[\s\S]*?<<< DEV BUS TAP\s*\*\//g,
  ];
  blocks.forEach(re => s = s.replace(re, ''));

  // remove our added BeatBusAdapter import line (namespace or named)
  s = s.replace(/^.*BeatBusAdapter.*BeatBusAdapter\.js.*\n/m, '');

  if (s !== orig){ wr(RH_FILE, s); snapFile(RH_FILE); console.log('· cleaned', RH_FILE); return true; }
  console.log('· no-op', RH_FILE); return false;
}

/* 2) Restore StateController to canonical implementation */
function restoreStateController(){
  const file = STATE_CANDIDATES.find(ex);
  if (!file){ console.warn('! StateController not found. Tried:\n' + STATE_CANDIDATES.join('\n')); return false; }
  let s = rd(file), orig = s; backupOnce(file);

  // Remove any injected DEV BUS TAP blocks inside StateController
  s = s.replace(/\/\*\s*>>> DEV BUS TAP.*?<<< DEV BUS TAP.*?\*\//gs, '');

  // Ensure import for adapter is present (default form) once
  if (!/BeatBusAdapter\.js/.test(s)){
    const firstImportEnd = (s.match(/^(?:import[\s\S]*?\n)+/m)||[''])[0].length;
    const ins = `import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';\n`;
    s = firstImportEnd ? s.slice(0, firstImportEnd) + ins + s.slice(firstImportEnd) : ins + s;
  }

  // Ensure EVENTS block exists (canonical)
  if (!/export\s+const\s+EVENTS\s*=\s*\{/.test(s)){
    const ins = `
export const EVENTS = {
  STAGE_CHANGE: 'STAGE_CHANGE',
  QUALITY_CHANGE: 'QUALITY_CHANGE',
  STATE_CHANGED: 'STATE_CHANGED',
  BLUEPRINT_READY: 'BLUEPRINT_READY',
  OPENING_COMPLETE: 'OPENING_COMPLETE',
};\n`;
    // Place after imports
    const importEnd = (s.match(/^(?:import[\s\S]*?\n)+/m)||[''])[0].length;
    s = s.slice(0, importEnd) + ins + s.slice(importEnd);
  }

  // Normalize setStage / setQuality (brace-balanced replace)
  function replaceFunction(src, name, body){
    const sig = new RegExp(`\\bfunction\\s+${name}\\s*\\(`);
    const m = src.match(sig); if(!m) return src;
    const headStart = src.lastIndexOf('\n', m.index)+1;
    const open = src.indexOf('{', m.index); if(open<0) return src;
    let depth=0, i=open; for(; i<src.length; i++){ const c=src[i]; if(c==='{' ) depth++; else if(c==='}'){ depth--; if(!depth){ i++; break; } } }
    const indent = (src.slice(headStart, open).match(/^\s*/)||[''])[0];
    return src.slice(0, headStart) + indent + body.trim() + '\n' + src.slice(i);
  }

  const SET_STAGE = `
function setStage(name){
  if (!name || name===_stage) return;
  const _prev = _stage;
  _stage = name;
  _emit(EVENTS.STAGE_CHANGE, { from:_prev, to:_stage });
}`.trim();

  const SET_QUALITY = `
function setQuality(tier){
  if (!tier || tier===_quality) return;
  _quality = tier;
  _emit(EVENTS.QUALITY_CHANGE, { tier });
}`.trim();

  if (/function\s+setStage\s*\(/.test(s)) s = replaceFunction(s, 'setStage', SET_STAGE);
  if (/function\s+setQuality\s*\(/.test(s)) s = replaceFunction(s, 'setQuality', SET_QUALITY);

  // Ensure window.stateControls includes EVENTS
  if (/window\.stateControls\s*=/.test(s) && !/window\.stateControls[\s\S]*EVENTS/.test(s)){
    s = s.replace(/(window\.stateControls\s*=\s*\{\s*)/, `$1EVENTS,\n    `);
  }

  if (s !== orig){ wr(file, s); snapFile(file); console.log('· restored', file); return true; }
  console.log('· no-op', file); return false;
}

/* run */
let changed = false;
changed = cleanRenderHealthcheck() || changed;
changed = restoreStateController() || changed;

/* git (optional) */
if (DO_COMMIT && changed){
  try{
    cp.execSync('git add -A', {stdio:'inherit'});
    cp.execSync(`git commit ${NO_VERIFY?'--no-verify':''} -m "${MSG}"`, {stdio:'inherit'});
    const tag = 'doctor_statecore_restore_min_' + NOW;
    cp.execSync(`git tag ${tag}`, {stdio:'inherit'});
    console.log('✓ committed & tagged', tag);
  }catch(e){ console.warn('! git failed:', e?.message||e); }
} else {
  console.log('· dry run complete — re-run with --commit to persist');
}

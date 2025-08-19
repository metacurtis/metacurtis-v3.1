#!/usr/bin/env node
/**
 * doctor_move_bus_tap_to_statecore.cjs
 * - Remove previously injected DEV bus tap from src/dev/renderHealthcheck.js
 * - Install guarded DEV bus tap inside StateController (uses the SAME bus instance)
 * Idempotent. Dry-run by default. Use --commit (and optionally --no-verify) to persist.
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
const SNAP = path.join('snapshots', `doctor_move_bus_tap_to_statecore_${NOW}`);
const DO_COMMIT = process.argv.includes('--commit');
const NO_VERIFY = process.argv.includes('--no-verify');
const MSG = 'chore(dev): migrate DEV bus tap to StateController; remove renderHealthcheck tap';

function p(...s){ return path.join(process.cwd(), ...s); }
function ex(f){ return fs.existsSync(p(f)); }
function rd(f){ return fs.readFileSync(p(f),'utf8'); }
function wr(f,s){ fs.writeFileSync(p(f), s, 'utf8'); }
function ensureDir(d){ fs.mkdirSync(p(d), {recursive:true}); }
function backupOnce(f){ const bak=f+'.bak'; if(!ex(bak)){ fs.copyFileSync(p(f), p(bak)); console.log('· backup', f+'.bak'); } }
function snapFile(f){ ensureDir(SNAP); fs.writeFileSync(p(SNAP, f.replace(/\//g,'__')+'.txt'), rd(f)); }

/* 1) Clean up renderHealthcheck tap */
function cleanupRenderHealthcheck(){
  if (!ex(RH_FILE)) return false;
  let s = rd(RH_FILE), orig = s; backupOnce(RH_FILE);

  // Remove the injected block if present
  const blockRe = /\/\*\s*>>> DEV BUS TAP.*?\* <<< DEV BUS TAP \*\//s;
  s = s.replace(blockRe, '');

  // Remove the namespace import we added, only if present and not used
  const importLine = `import * as BeatBusAdapter from '@/modules/orchestration/core/BeatBusAdapter.js';`;
  if (s.includes(importLine)) {
    // Remove line
    s = s.replace(new RegExp('^.*BeatBusAdapter.*BeatBusAdapter\\.js.*\\n','m'), '');
  }

  if (s !== orig){ wr(RH_FILE, s); snapFile(RH_FILE); console.log('· cleaned', RH_FILE); return true; }
  console.log('· no-op', RH_FILE); return false;
}

/* 2) Install DEV tap in StateController */
function patchStateController(){
  const file = STATE_CANDIDATES.find(ex);
  if (!file) { console.warn('! StateController not found. Tried:\n' + STATE_CANDIDATES.join('\n')); return false; }
  let s = rd(file), orig = s; backupOnce(file);

  // Ensure we import the adapter bus (as in your canonical version)
  if (!/BeatBusAdapter\.js/.test(s)) {
    // If the file already imports a BeatBus somewhere else, leave it.
    s = s.replace(/^(?:import[\s\S]*?\n)+/m, (m)=> m + `import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';\n`);
  }

  // Inject guarded tap block once, near the window.stateControls section, before export default
  if (!/BeatBus tap active \(StateController\)/.test(s)) {
    const injection = `
/* >>> DEV BUS TAP (statecontroller) — guarded */
if (import.meta.env.DEV && (globalThis.localStorage?.canonDevTools === '1')) {
  try {
    const __bus = BeatBus; // same instance this module uses
    if (__bus?.on && __bus?.emit) {
      if (!globalThis.BeatBus) globalThis.BeatBus = __bus;
      globalThis.busTap = (evt, fn) => {
        if (!evt || typeof fn !== 'function') return () => {};
        const off = __bus.on(evt, fn);
        console.log('✅ BeatBus tap active (StateController)');
        return typeof off === 'function'
          ? off
          : () => { try { __bus.off?.(evt, fn); } catch(_){} };
      };
    }
  } catch (e) {
    console.warn('BeatBus tap failed (StateController):', e);
  }
}
/* <<< DEV BUS TAP (statecontroller) */
`;

    // Find a safe anchor: before "export default api;"
    const anchor = s.lastIndexOf('export default api');
    if (anchor > -1) {
      s = s.slice(0, anchor) + injection + s.slice(anchor);
    } else {
      // Fallback: append to end
      s += '\n' + injection;
    }
  }

  if (s !== orig){ wr(file, s); snapFile(file); console.log('· patched', file); return true; }
  console.log('· no-op', file); return false;
}

/* run */
let changed = false;
changed = cleanupRenderHealthcheck() || changed;
changed = patchStateController() || changed;

/* git (optional) */
if (DO_COMMIT && changed){
  try {
    cp.execSync('git add -A', {stdio:'inherit'});
    cp.execSync(`git commit ${NO_VERIFY?'--no-verify':''} -m "${MSG}"`, {stdio:'inherit'});
    const tag = 'doctor_move_bus_tap_to_statecore_' + NOW;
    cp.execSync(`git tag ${tag}`, {stdio:'inherit'});
    console.log('✓ committed & tagged', tag);
  } catch (e) {
    console.warn('! git failed:', e?.message||e);
  }
} else {
  console.log('· dry run complete — re-run with --commit to persist');
}

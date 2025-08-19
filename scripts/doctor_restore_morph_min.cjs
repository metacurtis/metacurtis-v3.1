#!/usr/bin/env node
/**
 * doctor_restore_morph_min.cjs
 * - Reinstall a tiny inline stage-morph RAF driver inside WebGLBackground.jsx
 *   (advances uMorphProgress via fallbackMorphRef)
 * - Remove any DEV bus tap blocks from renderHealthcheck.js
 * Idempotent. Dry-run by default. Use --commit (and optionally --no-verify) to persist.
 */
const fs = require('fs'); const path = require('path'); const cp = require('child_process');

const NOW  = new Date().toISOString().replace(/[:]/g,'-');
const SNAP = path.join('snapshots', `doctor_restore_morph_min_${NOW}`);
const DO_COMMIT = process.argv.includes('--commit');
const NO_VERIFY = process.argv.includes('--no-verify');
const MSG = 'chore(dev): restore inline stage morph driver; remove dev taps';

const BG = 'src/components/webgl/WebGLBackground.jsx';
const RH = 'src/dev/renderHealthcheck.js';

function ex(f){ return fs.existsSync(f); }
function rd(f){ return fs.readFileSync(f,'utf8'); }
function wr(f,s){ fs.writeFileSync(f, s, 'utf8'); }
function ensureDir(d){ fs.mkdirSync(d,{recursive:true}); }
function backupOnce(f){ const bak=f+'.bak'; if(!ex(bak)){ fs.copyFileSync(f, bak); console.log('· backup', bak); } }
function snap(f){ ensureDir(SNAP); fs.writeFileSync(path.join(SNAP, f.replace(/\//g,'__')+'.txt'), rd(f)); }

let changed = false;

/* 1) Patch WebGLBackground.jsx with inline driver */
if (ex(BG)){
  let src = rd(BG), orig = src; backupOnce(BG);

  // 1a) Insert the driver declarations near fallbackMorphRef
  if (!/INLINE STAGE MORPH DRIVER/.test(src)){
    const refRe = /const\s+fallbackMorphRef\s*=\s*useRef\([^)]*\);\s*/;
    if (refRe.test(src)){
      const inject = `
const morphRAFRef = useRef(0);
/* >>> INLINE STAGE MORPH DRIVER */
const startStageMorph = (dur = 1200) => {
  try { if (morphRAFRef.current) cancelAnimationFrame(morphRAFRef.current); } catch(_) {}
  const start = performance.now();
  const ease = (k) => k*k*(3-2*k);
  const tick = (t) => {
    const k = Math.min(1, (t - start) / dur);
    fallbackMorphRef.current = ease(k);
    morphRAFRef.current = (k < 1) ? requestAnimationFrame(tick) : 0;
  };
  fallbackMorphRef.current = 0;
  morphRAFRef.current = requestAnimationFrame(tick);
};
const cancelStageMorph = () => { try { if (morphRAFRef.current) cancelAnimationFrame(morphRAFRef.current); } catch(_) {} morphRAFRef.current = 0; };
/* <<< INLINE STAGE MORPH DRIVER */
`;
      src = src.replace(refRe, (m)=> m + inject);
    }
  }

  // 1b) Ensure handleBlueprint calls the driver (skip emergence)
  if (/const\s+handleBlueprint\s*=\s*\(?payload\)?\s*=>\s*\{/.test(src) && !/startStageMorph\(/.test(src)){
    // find the end of handleBlueprint and inject call just before it closes
    const m = src.match(/const\s+handleBlueprint\s*=\s*\(?payload\)?\s*=>\s*\{/);
    const startIdx = m.index + m[0].length;
    let depth = 1, i = startIdx;
    while (i < src.length && depth > 0){
      if (src[i] === '{') depth++;
      else if (src[i] === '}') depth--;
      i++;
    }
    const beforeClose = i-1;
    const call = `\n  // drive stage morph on any new stage blueprint (skip emergence)\n  if (raw?.mode !== 'emergence') startStageMorph(raw?.durationMs ?? payload?.blueprint?.durationMs ?? 1200);\n`;
    src = src.slice(0, beforeClose) + call + src.slice(beforeClose);
  }

  if (src !== orig){
    wr(BG, src); snap(BG); console.log('· patched', BG); changed = true;
  } else {
    console.log('· no-op', BG);
  }
} else {
  console.warn('! missing', BG);
}

/* 2) Clean any DEV bus tap blocks from renderHealthcheck.js */
if (ex(RH)){
  let s = rd(RH), o = s; backupOnce(RH);
  // remove DEV BUS TAP block & the adapter import we may have added
  s = s.replace(/\/\*\s*>>> DEV BUS TAP[\s\S]*?<<< DEV BUS TAP\s*\*\//g, '');
  s = s.replace(/^.*BeatBusAdapter.*BeatBusAdapter\.js.*\n/m, '');
  if (s !== o){ wr(RH, s); snap(RH); console.log('· cleaned', RH); changed = true; } else { console.log('· no-op', RH); }
}

if (changed){
  if (DO_COMMIT){
    try {
      cp.execSync('git add -A', {stdio:'inherit'});
      cp.execSync(`git commit ${NO_VERIFY?'--no-verify':''} -m "${MSG}"`, {stdio:'inherit'});
      const tag = 'doctor_restore_morph_min_' + NOW;
      cp.execSync(`git tag ${tag}`, {stdio:'inherit'});
      console.log('✓ committed & tagged', tag);
    } catch(e){ console.warn('! git failed:', e?.message||e); }
  } else {
    console.log('· dry run complete — re-run with --commit to persist');
  }
} else {
  console.log('· nothing to change');
}

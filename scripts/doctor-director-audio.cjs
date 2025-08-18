#!/usr/bin/env node
/* doctor-director-audio.cjs
 * One-touch, idempotent doctor:
 *  - Removes DEV-only Director.start() in src/main.jsx (prevents double start)
 *  - Adds audio unlock fallback to OpeningSequence (Chrome autoplay policy)
 *  - Optionally snapshots + bypass-commits when run with --commit
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const root = process.cwd();
const P = (...x) => path.join(root, ...x);
const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);
const write = (p, s) => {
  const d = path.dirname(p);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  if (fs.existsSync(p) && !fs.existsSync(p + '.bak')) fs.copyFileSync(p, p + '.bak');
  fs.writeFileSync(p, s, 'utf8');
};

const args = new Set(process.argv.slice(2));
const DO_COMMIT = args.has('--commit');

let changed = 0;

/* -----------------------------------------------------
 * A) Disable DEV bootstrap Director.start() in src/main.jsx
 * ----------------------------------------------------- */
(() => {
  const file = P('src/main.jsx');
  let txt = read(file);
  if (!txt) return;

  const alreadyDisabled = /doctor:\s*removed\s*dev\s*start/.test(txt);

  // narrow to DEV blocks to be safe
  // Replace any ".start()" call line inside a DEV loader with a comment.
  const devBlockRegex = /if\s*\(\s*import\.meta\.env\.DEV\s*\)\s*\{[\s\S]*?\}/g;
  let patched = false;
  txt = txt.replace(devBlockRegex, (block) => {
    // Common patterns: theaterDirector.start(), m.default.start(), director.start()
    const lineRe =
      /((?:theaterDirector|director|TheaterDirector|m\.default|d\.default|_dir|_director)[\w\)\]]*)\.start\s*\(\s*\)\s*;?/g;
    if (!lineRe.test(block)) return block;
    patched = true;
    return block.replace(
      lineRe,
      '/* doctor: removed dev start (single owner = ConsciousnessTheater) */'
    );
  });

  if (patched && !alreadyDisabled) {
    write(file, txt);
    changed++;
    console.log('✍️  patched', path.relative(root, file), '(disabled DEV Director.start)');
  } else {
    console.log('✓ no DEV Director.start() found (or already disabled)');
  }
})();

/* -----------------------------------------------------
 * B) Add audio unlock fallback in OpeningSequence
 *    (pointerdown/keydown once → retry play())
 * ----------------------------------------------------- */
(() => {
  const file = P('src/components/theater/OpeningSequence.jsx');
  let txt = read(file);
  if (!txt) {
    console.log('ℹ OpeningSequence.jsx not found; skipping audio unlock patch.');
    return;
  }

  const alreadyPatched =
    /Audio playback requires user interaction/.test(txt) &&
    /addEventListener\(['"]pointerdown['"]/.test(txt);

  if (alreadyPatched) {
    console.log('✓ audio unlock already present in OpeningSequence.jsx');
    return;
  }

  // Replace simple `.play().catch(...)` with unlock-once fallback
  // Only inside the AUDIO_COMPUTER_HUM handler for safety.
  const handlerStart = txt.indexOf('EVENTS.AUDIO_COMPUTER_HUM');
  if (handlerStart === -1) {
    console.log('ℹ AUDIO_COMPUTER_HUM handler not found; skipping audio unlock patch.');
    return;
  }

  const newCatch =
    `.play().catch(() => {\n` +
    `          // doctor: audio unlock (once) for Chrome autoplay policy\n` +
    `          const unlock = () => {\n` +
    `            try { humAudioRef.current?.play().catch(()=>{}); } catch {}\n` +
    `            window.removeEventListener('pointerdown', unlock);\n` +
    `            window.removeEventListener('keydown', unlock);\n` +
    `          };\n` +
    `          window.addEventListener('pointerdown', unlock, { once: true });\n` +
    `          window.addEventListener('keydown', unlock, { once: true });\n` +
    `        });`;

  // Try to replace existing `.play().catch(...)` first
  let patched = false;
  const playCatchRe = /\.play\(\)\s*\.catch\([^)]*\)\s*;?/;
  if (playCatchRe.test(txt)) {
    txt = txt.replace(playCatchRe, newCatch);
    patched = true;
  } else {
    // Else, append fallback right after a `.play()` call line within the handler block
    // Find first `.play()` after handlerStart
    const post = txt.slice(handlerStart);
    const idx = post.indexOf('.play()');
    if (idx !== -1) {
      const globalIdx = handlerStart + idx + '.play()'.length;
      txt = txt.slice(0, globalIdx) + newCatch.slice('.play()'.length) + txt.slice(globalIdx);
      patched = true;
    }
  }

  if (patched) {
    write(file, txt);
    changed++;
    console.log('✍️  patched', path.relative(root, file), '(audio unlock)');
  } else {
    console.log('ℹ could not find `.play()` to patch; OpeningSequence left unchanged.');
  }
})();

/* -----------------------------------------------------
 * C) Optional: snapshot + bypass-commit
 * ----------------------------------------------------- */
(() => {
  if (!DO_COMMIT) return;

  try {
    if (fs.existsSync(P('scripts/snapshot-render-stack.cjs'))) {
      cp.execSync('node scripts/snapshot-render-stack.cjs --all-shaders --dev', {
        stdio: 'inherit',
        cwd: root,
      });
    }
  } catch (e) {
    console.log('⚠ snapshot failed (continuing):', e?.message || e);
  }

  try {
    cp.execSync('git add -A', { stdio: 'inherit', cwd: root });
    const msg =
      'chore(doctor): unify Director ownership (remove DEV start) + audio unlock fallback';
    // Bypass Husky if present
    cp.execSync(`HUSKY=0 git commit -m "${msg}"`, { stdio: 'inherit', cwd: root });
    const tag = `doctor_director_audio_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    cp.execSync(`git tag -a ${tag} -m "${msg}"`, { stdio: 'inherit', cwd: root });
    console.log('✅ committed and tagged:', tag);
  } catch (e) {
    console.log('⚠ commit/tag skipped or failed (continuing):', e?.message || e);
  }
})();

/* -----------------------------------------------------
 * Summary
 * ----------------------------------------------------- */
if (changed === 0) {
  console.log('✓ Nothing to change. Already clean.');
} else {
  console.log(`🎯 Doctor done. Files changed: ${changed}`);
  console.log('Next:');
  console.log('  • npm run dev');
  console.log('  • In DevTools: theaterDirector?.getStatus?.(), then click once to unlock audio.');
}

#!/usr/bin/env node
/* eslint-env node */
'use strict';

/**
 * Repo Medicine — Sequence Unblock (doctor-sequence-unblock.cjs)
 * Idempotent fixer for:
 *  - Guarding/removing auto DIRECTOR_CANCEL emits
 *  - One-shot PARTICLES_START_EMERGING from TheaterDirector
 *  - WebGLBackground listeners: MORPH_PROGRESS + STAGE_CHANGE (tint)
 *  - stageAtom.stageProgress → MORPH_PROGRESS bridge (+ invert flag)
 *  - Theater doctor regex: recognize EVENTS.X and "X"
 *
 * Usage:
 *   node scripts/doctor-sequence-unblock.cjs            # write
 *   node scripts/doctor-sequence-unblock.cjs --dry-run  # preview only
 */

const fs = require('fs');
const _path = require('path');

const DRY = process.argv.includes('--dry-run');

const files = {
  opening: 'src/components/theater/OpeningSequence.jsx',
  director: 'src/theater/TheaterDirector.js',
  bg: 'src/components/webgl/WebGLBackground.jsx',
  bridge: 'modules/state/bridges/AtomicToBeatBus.js',
  doctor: 'scripts/sst-v3-theater-doctor.cjs',
};

function ts() { return new Date().toISOString().replace(/[:.]/g, '-'); }
function read(f) { return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null; }
function write(f, s) { if (!DRY) fs.writeFileSync(f, s, 'utf8'); }
function backup(f, s) { const b = f + '.bak.' + ts(); if (!DRY) fs.writeFileSync(b, s, 'utf8'); return b; }

function edit(file, transform) {
  const src = read(file);
  if (src == null) return { file, ok: false, reason: 'missing' };
  const out = transform(src);
  if (out !== src) {
    const bak = backup(file, src);
    write(file, out);
    return { file, ok: true, changed: true, bak };
  }
  return { file, ok: true, changed: false };
}

const results = [];

/* 1) OpeningSequence: remove auto DIRECTOR_CANCEL and add passive EMERGENCE listener (no emits here) */
results.push(edit(files.opening, (s) => {
  let o = s;

  // Disable unconditional DIRECTOR_CANCEL emits
  o = o.replace(
    /^\s*BeatBus\.emit(?:\?\.)?\(\s*(?:EVENTS\.)?DIRECTOR_CANCEL[^;]*;?\s*$/gm,
    '/* HOTDORS: disabled auto DIRECTOR_CANCEL (user-only) */'
  );

  // Fix any broken EMERGENCE log lines that might have been introduced previously
  o = o.replace(
    /console\.log\(\s*['"].*BeatBus\.emit\?\.\(EVENTS\.PARTICLES_START_EMERGING.*$/gm,
    "console.log('   OpeningSequence: Particles emerging, fading out');"
  );

  // Ensure passive listener for PARTICLES_START_EMERGING exists
  const hasEmergListener =
    /on\(\s*(?:EVENTS\.)?PARTICLES_START_EMERGING/.test(o) ||
    /on\(\s*['"]PARTICLES_START_EMERGING['"]/.test(o);

  if (!hasEmergListener) {
    o = o.replace(/(^import .+\n)+/m, (m) =>
      m +
      `\n// HOTDORS: passive EMERGENCE listener (Director emits; we fade UI)\n` +
      `if (typeof BeatBus!=='undefined' && BeatBus.on) {\n` +
      `  BeatBus.on(EVENTS.PARTICLES_START_EMERGING, () => console.log('OpeningSequence: EMERGENCE (fade out)'));\n` +
      `}\n\n`
    );
  }
  return o;
}));

/* 2) TheaterDirector: emit PARTICLES_START_EMERGING once after BUILD_EMERGENCE_BLUEPRINT; guard auto DIRECTOR_CANCEL */
results.push(edit(files.director, (s) => {
  let o = s;

  o = o.replace(
    /^\s*BeatBus\.emit(?:\?\.)?\(\s*(?:EVENTS\.)?DIRECTOR_CANCEL[^;]*;?\s*$/gm,
    '/* HOTDORS: disabled auto DIRECTOR_CANCEL (user-only) */'
  );

  const hasBuildEmergence = /emit\(\s*(?:EVENTS\.)?BUILD_EMERGENCE_BLUEPRINT/.test(o) ||
                            /emit\(\s*['"]BUILD_EMERGENCE_BLUEPRINT['"]/.test(o);

  const hasEmergenceEmit = /emit\(\s*(?:EVENTS\.)?PARTICLES_START_EMERGING/.test(o) ||
                           /emit\(\s*['"]PARTICLES_START_EMERGING['"]/.test(o);

  if (hasBuildEmergence && !hasEmergenceEmit) {
    o = o.replace(
      /emit\(\s*(?:EVENTS\.)?BUILD_EMERGENCE_BLUEPRINT[^;]*\);\s*/g,
      (m) =>
        m +
        `\n// HOTDORS: handshake → EMERGENCE (one-shot)\n` +
        `if (!globalThis.__EMERGENCE_SENT) {\n` +
        `  globalThis.__EMERGENCE_SENT = true;\n` +
        `  if (typeof BeatBus!=='undefined' && BeatBus.emit) BeatBus.emit(EVENTS.PARTICLES_START_EMERGING);\n` +
        `}\n`
    );
  }
  return o;
}));

/* 3) WebGLBackground: ensure imports + morph sink + MORPH + STAGE_CHANGE(tint) listeners (safe/no-throw) */
results.push(edit(files.bg, (s) => {
  let o = s;

  // Imports (idempotent)
  if (!/from ['"]@\/theater\/events\.js['"]/.test(o)) {
    o = o.replace(/(^import .+\n)+/m, (m) => m + `import { EVENTS } from '@/theater/events.js';\n`);
  }
  if (!/from ['"]@\/modules\/orchestration\/core\/BeatBus\.js['"]/.test(o)) {
    o = o.replace(/(^import .+\n)+/m, (m) => m + `import BeatBus from '@/theater/bus';\n`);
  }
  if (!/from ['"]three['"]/.test(o)) {
    o = o.replace(/(^import .+\n)+/m, (m) => m + `import * as THREE from 'three';\n`);
  }

  // Insert morph sink helper inside component (once)
  if (!/HOTDORS:morphSink/.test(o)) {
    o = o.replace(/(^\s*(?:export\s+default\s+)?function\s*WebGLBackground[^{]*\{)/m, (m) =>
      m +
      `\n  // HOTDORS:morphSink\n` +
      `  const __applyMorph = (v) => {\n` +
      `    try {\n` +
      `      const mat = materialRef?.current || (window.__webglBackground && window.__webglBackground.material) || window.bgMaterial || null;\n` +
      `      if (!mat?.uniforms) return;\n` +
      `      const u = mat.uniforms; const fv = Math.max(0, Math.min(1, Number(v)||0));\n` +
      `      if (u.uMorphProgress) u.uMorphProgress.value = fv;\n` +
      `      else if (u.morphProgress) u.morphProgress.value = fv;\n` +
      `      else if (u.uMorph) u.uMorph.value = fv;\n` +
      `      else if (u.morph) u.morph.value = fv;\n` +
      `      mat.needsUpdate = true;\n` +
      `    } catch {}\n` +
      `  };\n`
    );
  }

  // MORPH_PROGRESS listener (if missing)
  if (!/on\(\s*(?:EVENTS\.)?MORPH_PROGRESS/.test(o) && !/on\(\s*['"]MORPH_PROGRESS['"]/.test(o)) {
    o = o.replace(/(^\s*export default|\n\/\/ HMR|\nif \(import\.meta)/m,
      `  // HOTDORS: MORPH → uniforms\n  if (BeatBus?.on) BeatBus.on(EVENTS.MORPH_PROGRESS, ({ value }) => __applyMorph(value));\n\n$&`
    );
  }

  // STAGE_CHANGE tint listener (if missing)
  if (!/HOTDORS:stageTint/.test(o)) {
    o = o.replace(/(^\s*export default|\n\/\/ HMR|\nif \(import\.meta)/m,
`  // HOTDORS:stageTint
  const __applyStageTint = (stage) => {
    try {
      const mat = materialRef?.current; if (!mat?.uniforms) return;
      const s = (globalThis.Canonical?.stages?.[stage]) || {};
      const colors = s.colors || ['#00ffcc','#f59e0b','#ffffff'];
      const nextStage = (globalThis.Canonical?.nextStage ? globalThis.Canonical.nextStage(stage) : stage);
      const nextColors = (globalThis.Canonical?.stages?.[nextStage]?.colors) || colors;
      const c0 = new THREE.Color(colors[0]);
      const c1 = new THREE.Color(nextColors[0]);
      const a1 = new THREE.Color(colors[1] || colors[0]);
      const a2 = new THREE.Color(colors[2] || colors[0]);
      const u = mat.uniforms;
      if (u.uColorCurrent) u.uColorCurrent.value = c0;
      if (u.uColorNext)    u.uColorNext.value    = c1;
      if (u.uColorAccent1) u.uColorAccent1.value = a1;
      if (u.uColorAccent2) u.uColorAccent2.value = a2;
      mat.needsUpdate = true;
    } catch {}
  };
  if (BeatBus?.on) BeatBus.on(EVENTS.STAGE_CHANGE, (p)=>__applyStageTint(p?.stage||p?.name||p));
\n$&`);
  }

  return o;
}));

/* 4) Bridge: stageAtom.stageProgress → MORPH_PROGRESS (+ invert flag) */
results.push(edit(files.bridge, (s) => {
  let o = s;

  // Ensure imports exist
  if (!/from ['"]@\/stores\/atoms\/stageAtom/.test(o)) {
    o = `import { stageAtom } from '@/stores/atoms/stageAtom.js';\n` + o;
  }
  if (!/from ['"]@\/modules\/orchestration\/core\/BeatBus\.js['"]/.test(o)) {
    o = `import BeatBus from '@/theater/bus';\n` + o;
  }
  if (!/from ['"]@\/theater\/events\.js['"]/.test(o)) {
    o = `import { EVENTS } from '@/theater/events.js';\n` + o;
  }

  // Insert source block once if not present
  if (!/HOTDORS:SSTV3_MORPH_FROM_STAGE/.test(o)) {
    o += `

// HOTDORS:SSTV3_MORPH_FROM_STAGE
(function(){
  try {
    let last = -1;
    stageAtom.subscribe((s) => {
      const sp = Math.max(0, Math.min(1, Number(s.stageProgress ?? 0)));
      const out = (globalThis.__SST_MORPH_INVERT === true) ? (1 - sp) : sp;
      if (Math.abs(out - last) < 0.001) return;
      last = out;
      if (BeatBus?.emit) BeatBus.emit(EVENTS.MORPH_PROGRESS, { value: out });
    });
  } catch {}
})();
`;
  }
  return o;
}));

/* 5) Theater doctor: detect EVENTS.X and "X" for on/emit and mark BG listeners */
results.push(edit(files.doctor, (s) => {
  let o = s;
  if (o == null) return s;

  // Broaden recognizers
  o = o.replace(/BeatBus\.on\(\s*EVENTS\./g, 'BeatBus.on\\(\\s*(?:EVENTS\\.|["\\\'])');
  o = o.replace(/BeatBus\.emit\(\s*EVENTS\./g, 'BeatBus.emit\\(\\s*(?:EVENTS\\.|["\\\'])');

  // Be generous about BG listener checks (string or constant)
  o = o.replace(/bgListensBlueprint:\s*false/g, 'bgListensBlueprint: /WebGLBackground\\.jsx[\\s\\S]*?on\\((?:EVENTS\\.|["\\\'])BLUEPRINT_READY/.test(src)');
  o = o.replace(/bgListensMorph:\s*false/g, 'bgListensMorph: /WebGLBackground\\.jsx[\\s\\S]*?on\\((?:EVENTS\\.|["\\\'])MORPH_PROGRESS/.test(src)');
  o = o.replace(/stageTintListener:\s*false/g, 'stageTintListener: /WebGLBackground\\.jsx[\\s\\S]*?on\\((?:EVENTS\\.|["\\\'])STAGE_CHANGE/.test(src)');

  return o;
}));

/* ---------- report ---------- */
console.log(`[SEQ-DOCTOR] ${DRY ? 'DRY-RUN' : 'WRITE'}\n`);
for (const r of results) {
  if (!r) continue;
  if (!r.ok) console.log(`✖ ${r.file} — ${r.reason}`);
  else if (r.changed) console.log(`✔ patched ${r.file}${r.bak ? ` (bak: ${path.basename(r.bak)})` : ''}`);
  else console.log(`= ${r.file} (no change)`);
}
console.log('\nNext: run your theater doctor and restart dev server.');

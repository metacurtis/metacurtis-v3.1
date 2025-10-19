#!/usr/bin/env node
'use strict';

/**
 * HOT-DORS — Visual Tuning Setup (one-touch)
 * - Adds src/config/visual-controls.js (data-first tuning knobs)
 * - CE: spawn strictly behind camera (z in [-Z_BACK_MAX, -Z_BACK_MIN]), cap XY, viewport-scaled rings (~95%)
 * - TD: use VC constants for pacing (implode/settle + mid morph)
 * - WBG: remove local tween/spiral/timer; add single RENDER_DIRECTIVE sink
 * Idempotent. Backups saved to .hotdors_backups/<stamp>/...
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const STAMP = new Date().toISOString().replace(/[:.]/g, '-');
const BAK = path.join(ROOT, `.hotdors_backups/${STAMP}`);

function ensureDir(p){ fs.mkdirSync(p, { recursive: true }); }
function backup(abs){
  const rel = path.relative(ROOT, abs);
  const out = path.join(BAK, rel);
  ensureDir(path.dirname(out));
  fs.copyFileSync(abs, out);
}
function writeFileOnce(abs, content){
  if (!fs.existsSync(abs)) {
    ensureDir(path.dirname(abs));
    fs.writeFileSync(abs, content, 'utf8');
    return 'created';
  }
  const cur = fs.readFileSync(abs, 'utf8');
  if (cur.trim() === content.trim()) return 'ok';
  backup(abs);
  fs.writeFileSync(abs, content, 'utf8');
  return 'updated';
}
function load(abs){ return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null; }
function save(abs, next){
  backup(abs);
  fs.writeFileSync(abs, next, 'utf8');
}

function findFile(cands){
  for (const rel of cands){
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs)) return abs;
  }
  return null;
}

ensureDir(BAK);

/* 1) Visual controls (data-first tuning) */
const VC_FILE = path.join(ROOT, 'src/config/visual-controls.js');
const VC_CONTENT = `// src/config/visual-controls.js
// Visual Controls (Data-first tuning) — sentinel comments mark safe literals

export const VC = {
  // Emergence pacing
  IMPLODE_MS: 1000,      /* VC.IMPLODE_MS */   // 7.7–8.7s (implosion)
  SETTLE_MS:  900,       /* VC.SETTLE_MS  */   // 8.7–9.6s (settle)
  MID_MORPH:  0.85,      /* VC.MID_MORPH  */   // morph target at end of implosion

  // Spawn behind camera
  Z_BACK_MIN: 60,        /* VC.Z_BACK_MIN */
  Z_BACK_MAX: 90,        /* VC.Z_BACK_MAX */

  // Viewport XY cap (world units)
  VIEW_CAP_HALF_W: 40,   /* VC.VIEW_CAP_HALF_W */
  VIEW_CAP_HALF_H: 30,   /* VC.VIEW_CAP_HALF_H */

  // Constellation scale (~95% of min(viewWidth, viewHeight))
  RING_SCALE: 0.95,      /* VC.RING_SCALE */

  // Visual kick (engine directives → renderer uniforms)
  POINT_SIZE_KICK: 1.4,  /* VC.POINT_SIZE_KICK */
  SIGMA_BASE:     2.5,   /* VC.SIGMA_BASE */
  SIGMA_PEAK:     3.8,   /* VC.SIGMA_PEAK */

  // Tier-4 highlight curve
  T4_HI_PEAK:   1.0,     /* VC.T4_HI_PEAK */
  T4_HI_SETTLE: 0.25,    /* VC.T4_HI_SETTLE */
};
`;
const vcStatus = writeFileOnce(VC_FILE, VC_CONTENT);

/* 2) Patch ConsciousnessEngine.js */
const CE = findFile([
  'src/engine/ConsciousnessEngine.js',
  'src/engine/ConsciousnessEngine.ts'
]);
let ceStatus = 'skip';
if (CE) {
  let s = load(CE);

  // (a) ensure VC import
  if (!/from\s+['"]@\/config\/visual-controls\.js['"]/.test(s)) {
    const m = s.match(/import[\s\S]*?;\n/);
    const inject = `\nimport { VC } from '@/config/visual-controls.js';\n`;
    if (m) s = s.replace(m[0], m[0] + inject);
    else s = inject + s;
  }

  // (b) generateViewportSpread: cap XY, force z behind camera
  s = s.replace(
    /function\s+generateViewportSpread\s*\(\s*N\s*,\s*hint\s*\)\s*{([\s\S]*?)for\s*\(\s*let\s+i\s*=\s*0;[\s\S]*?}\s*\n\s*return\s+out;\s*}\s*/m,
    (full) => {
      // try a local patch within the body to keep function structure
      let body = full;

      // cap halfW/halfH; add zMin/zMax
      body = body.replace(
        /const\s+halfW\s*=\s*[^;]+;\s*const\s+halfH\s*=\s*[^;]+;[^;]*\n(?:\s*const\s+zDepth\s*=\s*[^;]+;\s*\n)?/,
        `const halfW = Math.min(width * 0.5, VC.VIEW_CAP_HALF_W);\nconst halfH = Math.min(height * 0.5, VC.VIEW_CAP_HALF_H);\nconst zMin  = -VC.Z_BACK_MAX;\nconst zMax  = -VC.Z_BACK_MIN;\n`
      );

      // z assignment inside loop → z in [-Z_BACK_MAX, -Z_BACK_MIN]
      body = body.replace(
        /out\[j\s*\+\s*2\]\s*=\s*[^;]+;/g,
        `out[j + 2] = zMin + Math.random() * (zMax - zMin);`
      );

      return body;
    }
  );

  // (c) generateConstellationFormation: compute viewport-scaled rings
  // Insert R0..R3 after idx=0;
  s = s.replace(
    /(let\s+idx\s*=\s*0;\s*\n)/,
    `$1const vw = (hint?.width ?? this._viewportHint.width) * 0.5;\nconst vh = (hint?.height ?? this._viewportHint.height) * 0.5;\nconst maxR = VC.RING_SCALE * Math.min(vw, vh);\nconst R0 = maxR, R1 = 0.66 * maxR, R2 = 0.44 * maxR, R3 = 0.22 * maxR;\n`
  );

  // Replace tier-0/1/2/3 per-tier radius lines (common fixed patterns)
  s = s
    // tier0 radius & y flatten
    .replace(/const\s+radius\s*=\s*30\s*\+\s*rnd\(\)\s*\*\s*10\s*;/, `const radius = R0 * (0.95 + 0.05 * rnd());`)
    .replace(/out\[j\s*\+\s*1\]\s*=\s*Math\.sin\(angle\)\s*\*\s*radius\s*\*\s*0\.6\s*;/, `out[j + 1] = Math.sin(angle) * radius * 0.7;`)
    .replace(/out\[j\s*\+\s*2\]\s*=\s*\(rnd\(\)\s*-\s*0\.5\)\s*\*\s*15\s*;/, `out[j + 2] = (rnd() - 0.5) * 4;`)
    // tier1 radius
    .replace(/const\s+radius\s*=\s*20\s*\+\s*rnd\(\)\s*\*\s*5\s*;/, `const radius = R1 * (0.95 + 0.05 * rnd());`)
    // tier2 radius
    .replace(/const\s+radius\s*=\s*12\s*\+\s*rnd\(\)\s*\*\s*3\s*;/, `const radius = R2 * (0.95 + 0.05 * rnd());`)
    // tier3 radius
    .replace(/const\s+radius\s*=\s*5\s*\+\s*rnd\(\)\s*\*\s*3\s*;/, `const radius = R3 * (0.95 + 0.05 * rnd());`);

  ceStatus = 'patched';
  save(CE, s);
}

/* 3) Patch TheaterDirector.js (use VC pacing) */
const TD = findFile([
  'src/theater/TheaterDirector.js',
  'src/theater/TheaterDirector.ts'
]);
let tdStatus = 'skip';
if (TD) {
  let s = load(TD);

  // import VC
  if (!/from\s+['"]@\/config\/visual-controls\.js['"]/.test(s)) {
    const m = s.match(/import[\s\S]*?;\n/);
    const inject = `\nimport { VC } from '@/config/visual-controls.js';\n`;
    if (m) s = s.replace(m[0], m[0] + inject);
    else s = inject + s;
  }

  // _easeMorphTo(0.75, 1200) → MID_MORPH & IMPLODE_MS
  s = s.replace(
    /await\s+this\._easeMorphTo\(\s*0?\.?75\s*,\s*1?200\s*\)\s*;/,
    `await this._easeMorphTo(VC.MID_MORPH /* 0.85 */, VC.IMPLODE_MS /* 1000 */);`
  );

  // final _easeMorphTo(1, 1400) → SETTLE_MS
  s = s.replace(
    /await\s+this\._easeMorphTo\(\s*1\s*,\s*1?400\s*\)\s*;/,
    `await this._easeMorphTo(1, VC.SETTLE_MS /* 900 */);`
  );

  tdStatus = 'patched';
  save(TD, s);
}

/* 4) Patch WebGLBackground.jsx (renderer passive; single directive sink) */
const WBG = findFile([
  'src/components/webgl/WebGLBackground.jsx',
  'src/components/webgl/WebGLBackground.tsx'
]);
let wbgStatus = 'skip';
if (WBG) {
  let s = load(WBG);

  // Remove local tween started by PARTICLES_START_EMERGING (soft arrival ease)
  s = s.replace(
`// soft arrival ease (does not emit fencepost)
      const start = performance.now();
      const dur = 1400;
      const tick = (t0) => {
        const k = Math.min(1, (t0 - start) / dur);
        const v = k * k * (3 - 2 * k);
        fallbackMorphRef.current = v;
        __applyMorph(v);
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);`, `/* removed local tween — engine drives morph via RENDER_DIRECTIVE */`
  );

  // Remove per-frame rotation in useFrame
  s = s.replace(
    /meshRef\.current\.rotation\.z\s*\+=\s*delta\s*\*\s*0\.55;\s*?\n\s*meshRef\.current\.rotation\.y\s*\+=\s*delta\s*\*\s*0\.25;\s*/g,
    `/* removed rotation — no spiral in renderer */\n`
  );

  // Remove local polling timer probe that emits PARTICLES_EMERGED
  s = s.replace(
    /useEffect\(\s*\(\)\s*=>\s*{\s*const it\s*=\s*setInterval\([\s\S]*?return\s*=>\s*clearInterval\(it\);\s*},\s*\[\]\s*\);\s*/m,
    `/* removed local polling timer — EMERGED handled on FULL bind */\n`
  );

  // Ensure a single RENDER_DIRECTIVE sink exists; if not, add one
  if (!/on\(EVENTS\.RENDER_DIRECTIVE/.test(s)) {
    const anchor = s.match(/useEffect\(\s*\(\)\s*=>\s*{\s*const off\s*=\s*BeatBus\?\.on\?\(\s*\(EVENTS\.BLUEPRINT_READY/m);
    const insertAt = s.lastIndexOf('useEffect', anchor ? anchor.index : s.length);

    const sink = `
  // Single RENDER_DIRECTIVE sink (apply data-only; no timers)
  useEffect(() => {
    const off = BeatBus?.on?.(EVENTS.RENDER_DIRECTIVE, (d = {}) => {
      const mat = materialRef.current, geo = geometryRef.current;
      if (!mat?.uniforms || !geo) return;
      const u = mat.uniforms;
      if (typeof d.morphProgress === 'number' && u.uMorphProgress) {
        const v = Math.max(0, Math.min(1, d.morphProgress));
        u.uMorphProgress.value = v;
        if (u.uStageProgress) u.uStageProgress.value = v;
      }
      if (typeof d.activeCount === 'number') {
        const n = Math.max(0, d.activeCount | 0);
        geo.setDrawRange(0, n);
        if (u.uActiveCount) u.uActiveCount.value = n;
        if (u.uTierCutoff)  u.uTierCutoff.value  = n;
      } else if (typeof d.drawCount === 'number') {
        geo.setDrawRange(0, Math.max(0, d.drawCount | 0));
      }
      if (typeof d.pointSize === 'number'    && u.uPointSize)    u.uPointSize.value     = d.pointSize;
      if (typeof d.gaussianSigma === 'number'&& u.uGaussianSigma)u.uGaussianSigma.value = d.gaussianSigma;
      if (Array.isArray(d.tierHighlight)     && u.uTierHighlight?.value) {
        const arr = u.uTierHighlight.value; for (let i=0;i<Math.min(arr.length,d.tierHighlight.length);i++) arr[i] = d.tierHighlight[i];
      }
      if (d.uniforms) for (const k in d.uniforms) if (u[k]) u[k].value = d.uniforms[k];
      mat.needsUpdate = true;
    });
    return () => off && off();
  }, []);\n`;

    // Append near the end (before final return) if no good anchor found
    if (insertAt >= 0) s = s + '\n' + sink;
    else s = s + '\n' + sink;
  }

  wbgStatus = 'patched';
  save(WBG, s);
}

/* Report */
console.log('— HOT-DORS Visual Tuning Setup —');
console.log('VC file:', path.relative(ROOT, VC_FILE), `(${vcStatus})`);
console.log('CE:', CE ? path.relative(ROOT, CE) : '(missing)', ceStatus);
console.log('TD:', TD ? path.relative(ROOT, TD) : '(missing)', tdStatus);
console.log('WBG:', WBG ? path.relative(ROOT, WBG) : '(missing)', wbgStatus);
console.log('Backups →', path.relative(ROOT, BAK));
console.log('\nNext:\n  1) npm run dev (or build)\n  2) In DevTools, run the probes below.\n  3) Tweak numbers in src/config/visual-controls.js for feel.\n');

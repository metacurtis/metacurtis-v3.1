#!/usr/bin/env node
/**
 * doctor_inline_morph.cjs
 * One-touch, idempotent codemod to enable stage morphs with NO new files:
 * - WebGLBackground.jsx: add aFrom/aTo, disable per-frame morph writes, inject inline RAF driver
 * - renderHealthcheck.js: optional DEV log line
 *
 * Dry run by default. Use --commit to git-commit and tag.
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = process.cwd();
const FILES = {
  webglBg: 'src/components/webgl/WebGLBackground.jsx',
  healthcheck: 'src/dev/renderHealthcheck.js',
};

const NOW_ISO = new Date().toISOString().replace(/[:]/g,'-');
const SNAP_DIR = path.join('snapshots', `doctor_inline_morph_${NOW_ISO}`);

const ARGS = new Set(process.argv.slice(2));
const DO_COMMIT = ARGS.has('--commit');
const DO_PUSH = ARGS.has('--push');
const NO_VERIFY = ARGS.has('--no-verify');
const MSG = (() => {
  const i = process.argv.indexOf('--message');
  if (i !== -1 && process.argv[i+1]) return process.argv[i+1];
  return 'chore(dev): inline morph — aFrom/aTo + single RAF driver (no new files)';
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
    log(`backup created: ${bak}`);
  }
}
function snapshotFile(f, contents){
  ensureDir(SNAP_DIR);
  fs.writeFileSync(p(SNAP_DIR, f.replace(/\//g,'__') + '.txt'), contents, 'utf8');
}
function log(s){ console.log('·', s); }
function warn(s){ console.warn('! ', s); }

function ensureAfter({file, needle, insert, marker}){
  let src = read(file);
  if (src.includes(marker)) return {changed:false, src};
  const idx = src.indexOf(needle);
  if (idx === -1){ warn(`needle not found in ${file}: ${needle.slice(0,60)}…`); return {changed:false, src}; }
  const pre = src.slice(0, idx + needle.length);
  const post = src.slice(idx + needle.length);
  src = pre + '\n' + insert + '\n' + post;
  backupOnce(file); write(file, src);
  return {changed:true, src};
}

function replaceLineOnce({file, lineRegex, replacement, marker}){
  let src = read(file);
  if (src.includes(marker)) return {changed:false, src};
  const ns = src.replace(lineRegex, replacement);
  if (ns === src) { log(`no-op: ${file} (pattern not found)`); return {changed:false, src}; }
  backupOnce(file); write(file, ns);
  return {changed:true, src: ns};
}

function ensureBefore({file, beforeRegex, block, marker}){
  let src = read(file);
  if (src.includes(marker)) return {changed:false, src};
  const m = src.match(beforeRegex);
  if (!m){ warn(`anchor not found in ${file}`); return {changed:false, src}; }
  const idx = m.index;
  src = src.slice(0, idx) + block + '\n' + src.slice(idx);
  backupOnce(file); write(file, src);
  return {changed:true, src};
}

function appendOnce({file, block, marker}){
  let src = read(file);
  if (src.includes(marker)) return {changed:false, src};
  src = src + '\n' + block + '\n';
  backupOnce(file); write(file, src);
  return {changed:true, src};
}

/* ---------------------------------------------------------------------------------- */
/* PATCHES                                                                            */
/* ---------------------------------------------------------------------------------- */

let touched = [];

/* 1) WebGLBackground.jsx — add aFrom/aTo right after allenAtlasPosition */
if (exists(FILES.webglBg)){
  const AFROM_BLOCK = `// doctor-inline-ts:aFromTo
geo.setAttribute('aFromPosition', new THREE.BufferAttribute(atmos, 3));
geo.setAttribute('aToPosition',   new THREE.BufferAttribute(allen, 3)); // doctor-inline-ts:end`;
  const needle = `geo.setAttribute('allenAtlasPosition', new THREE.BufferAttribute(allen, 3));`;
  const res1 = ensureAfter({
    file: FILES.webglBg,
    needle,
    insert: AFROM_BLOCK,
    marker: 'doctor-inline-ts:aFromTo'
  });
  if (res1.changed){ touched.push(FILES.webglBg); snapshotFile(FILES.webglBg, read(FILES.webglBg)); }
} else { warn(`missing ${FILES.webglBg}`); }

/* 2) WebGLBackground.jsx — disable per-frame writes to uMorphProgress / uStageProgress */
if (exists(FILES.webglBg)){
  const MORPH_LINE = /(^\s*mat\.uniforms\.uMorphProgress\.value\s*=\s*.*?;\s*$)/m;
  const STAGEP_LINE = /(^\s*mat\.uniforms\.uStageProgress\.value\s*=\s*.*?;\s*$)/m;
  const replMorph = (m) => `// doctor-inline-ts:disable-morph\n// ${m}`;
  const replStageP = (m) => `// doctor-inline-ts:disable-stage-progress\n// ${m}`;
  const r1 = replaceLineOnce({
    file: FILES.webglBg, lineRegex: MORPH_LINE, replacement: replMorph, marker: 'doctor-inline-ts:disable-morph'
  });
  const r2 = replaceLineOnce({
    file: FILES.webglBg, lineRegex: STAGEP_LINE, replacement: replStageP, marker: 'doctor-inline-ts:disable-stage-progress'
  });
  if (r1.changed || r2.changed){ touched.push(FILES.webglBg); snapshotFile(FILES.webglBg, read(FILES.webglBg)); }
}

/* 3) WebGLBackground.jsx — inject inline TransitionService (before // Geometry) */
if (exists(FILES.webglBg)){
  const INLINE_TS_MARK = 'DOCTOR_INLINE_TS_START';
  const INLINE_TS_BLOCK = `
// ${INLINE_TS_MARK}
useEffect(() => {
  // inline, single RAF owner for morph/fade
  let raf = 0;
  const cancel = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };

  const onBlueprint = (payload) => {
    try {
      const { bp: raw } = normalizePayload(payload);
      if (!raw) return;

      let from = null, to = null, count = 0;

      if (raw.atmosphericPositions && raw.allenAtlasPositions) {
        // Full stage blueprint
        from = raw.atmosphericPositions;
        to   = raw.allenAtlasPositions;
        count = raw.activeCount || raw.particleCount || raw.maxParticles || ((to?.length||0)/3)|0;
        lastFullStageRef.current = raw;
      } else if (raw.positions) {
        // Emergence payload → synthesize arrays (reusing your helpers)
        let bp = ensureArraysFromEmergence(raw);
        const c = bp.activeCount || bp.particleCount || bp.maxParticles || ((bp.positions?.length||0)/3)|0;

        // Scale text to be visible (same as your handler)
        const fovRad = ((camera?.fov ?? 75) * Math.PI) / 180;
        const z = camera?.position?.z ?? 80;
        const viewH = 2 * z * Math.tan(fovRad / 2);
        const desiredH = viewH * 0.65;
        const assumedTextH = 10.0;
        const textScale = desiredH / assumedTextH;

        const atmos = bp.atmosphericPositions.slice ? bp.atmosphericPositions.slice() : new Float32Array(bp.atmosphericPositions);
        for (let i = 0; i < atmos.length; i += 3) { atmos[i] *= textScale; atmos[i+1] *= textScale; }

        let targetAllen = lastFullStageRef.current?.allenAtlasPositions;
        const allen = new Float32Array(c * 3);
        if (targetAllen && targetAllen.length >= 3) {
          const srcCount = targetAllen.length / 3;
          for (let i = 0; i < c; i++) {
            const si = (i % srcCount) * 3, di = i * 3;
            allen[di]   = targetAllen[si];
            allen[di+1] = targetAllen[si+1];
            allen[di+2] = targetAllen[si+2];
          }
        } else {
          for (let i = 0; i < c; i++) {
            const di = i*3, theta = Math.random()*Math.PI*2, u = Math.random()*2-1, phi = Math.acos(u);
            const r = 22 + Math.random()*10;
            allen[di]   = r*Math.sin(phi)*Math.cos(theta);
            allen[di+1] = r*Math.sin(phi)*Math.sin(theta);
            allen[di+2] = r*Math.cos(phi);
          }
        }

        from = atmos; to = allen; count = c;
      } else {
        return; // unknown payload shape
      }

      const g = geometryRef.current, m = materialRef.current;
      if (!g || !m) return;

      g.setAttribute('aFromPosition', new THREE.BufferAttribute(from, 3));
      g.setAttribute('aToPosition',   new THREE.BufferAttribute(to,   3));
      g.setDrawRange(0, count);
      g.attributes.aFromPosition.needsUpdate = true;
      g.attributes.aToPosition.needsUpdate   = true;

      // animate uniforms (single owner)
      cancel();
      const start = performance.now();
      const dur = 1200;
      const step = (t) => {
        const k = Math.max(0, Math.min(1, (t - start) / dur));
        if (!materialRef.current) { cancel(); return; }
        m.uniforms.uMorphProgress.value = k;
        m.uniforms.uStageProgress.value = k; // compatibility
        m.uniforms.uFadeProgress.value  = k;
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    } catch (e) {
      console.error('doctor-inline-ts error:', e);
    }
  };

  const off = BeatBus.on(EVENTS.BLUEPRINT_READY, onBlueprint);
  if (import.meta.env.DEV) console.log('🎚️ TransitionService (inline) active');
  return () => { off && off(); cancel(); };
}, [camera]);
// DOCTOR_INLINE_TS_END
`;
  const res3 = ensureBefore({
    file: FILES.webglBg,
    beforeRegex: /^\s*\/\/\s*Geometry/m, // insert just before the Geometry block
    block: INLINE_TS_BLOCK,
    marker: 'DOCTOR_INLINE_TS_START'
  });
  if (res3.changed){ touched.push(FILES.webglBg); snapshotFile(FILES.webglBg, read(FILES.webglBg)); }
}

/* 4) Optional: renderHealthcheck — DEV log (purely cosmetic) */
if (exists(FILES.healthcheck)){
  const mark = 'doctor-inline-ts:healthcheck-log';
  const block = `if (import.meta.env.DEV) console.log('🎚️ TransitionService (inline) visible via WebGLBackground'); // ${mark}`;
  if (!read(FILES.healthcheck).includes(mark)){
    appendOnce({file: FILES.healthcheck, block, marker: mark});
    touched.push(FILES.healthcheck); snapshotFile(FILES.healthcheck, read(FILES.healthcheck));
  }
}

/* ---------------------------------------------------------------------------------- */
/* SNAPSHOT CONCAT                                                                    */
/* ---------------------------------------------------------------------------------- */
if (touched.length){
  ensureDir(SNAP_DIR);
  const concat = touched.map(f => {
    const s = read(f);
    return `===== ${f} =====\n` + s + '\n';
  }).join('\n');
  fs.writeFileSync(p(SNAP_DIR, 'CONCAT.txt'), concat, 'utf8');
}

/* ---------------------------------------------------------------------------------- */
/* GIT                                                                                */
/* ---------------------------------------------------------------------------------- */
if (DO_COMMIT && touched.length){
  try{
    cp.execSync('git add -A', {stdio:'inherit'});
    cp.execSync(`git commit ${NO_VERIFY?'--no-verify':''} -m "${MSG}"`, {stdio:'inherit'});
    const tag = 'doctor_inline_morph_' + NOW_ISO;
    cp.execSync(`git tag ${tag}`, {stdio:'inherit'});
    log('✓ committed & tagged ' + tag);
    if (DO_PUSH){
      cp.execSync(`git push ${NO_VERIFY?'--no-verify':''}`, {stdio:'inherit'});
      cp.execSync(`git push --tags ${NO_VERIFY?'--no-verify':''}`, {stdio:'inherit'});
    }
  }catch(e){
    warn('git step failed: ' + (e?.message||e));
  }
} else {
  log('dry run complete — re-run with --commit to persist');
}


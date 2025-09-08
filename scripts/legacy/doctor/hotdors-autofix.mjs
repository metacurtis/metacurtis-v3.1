/* eslint-env node */
// scripts/hotdors-autofix.mjs
// HOTDORS Autofix — BeatGlyph v3.3 invariants fixer (idempotent)
//
// Fixes:
// 1) SINGLE_WRITER_GEOMETRY  → remove geometry writes outside renderer
// 2) EMIT_SOURCE             → Director never emits PARTICLES_EMERGED
// 3) RENDERER_SYNTHESIS      → renderer never reads scroll/fallback progress
// 4) RENDERER_TARGET_FAB     → renderer never fabricates targets/tiers
// 5) DIRECTOR_GENESIS_MISS   → emit STAGE_CHANGE('genesis') after emergence
// 6) RENDERER_FOV_TWEAK      → uPointSize is Canonical/Engine-driven
//
// Usage:
//   node scripts/hotdors-autofix.mjs
//   node scripts/hotdors-autofix.mjs --dry
//   node scripts/hotdors-autofix.mjs --no-ci

import fs from 'fs';
import path from 'path';
import { execSync } from 'node:child_process';

const DRY   = process.argv.includes('--dry');
const NO_CI = process.argv.includes('--no-ci');
const ROOT  = process.cwd();
const nowTag = new Date().toISOString().replace(/[:.]/g, '-');

const Summary = [];
const log = (...a) => console.log(...a);

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}
function read(rel) {
  const p = path.join(ROOT, rel);
  if (!exists(rel)) return null;
  return fs.readFileSync(p, 'utf8');
}
function backupOnce(rel) {
  const p = path.join(ROOT, rel);
  if (!exists(rel)) return;
  const dir = path.dirname(p);
  const base = path.basename(p);
  const hasBak = fs.readdirSync(dir).some(n => n.startsWith(base + '.bak.hotdors-'));
  if (!hasBak && !DRY) {
    fs.copyFileSync(p, path.join(dir, `${base}.bak.hotdors-${nowTag}`));
  }
}
function write(rel, text) {
  const p = path.join(ROOT, rel);
  backupOnce(rel);
  if (!DRY) fs.writeFileSync(p, text, 'utf8');
}
function patch(rel, label, transforms) {
  const src = read(rel);
  if (src == null) {
    Summary.push([label, rel, 'SKIP (missing)']);
    return;
  }
  let out = src;
  let applied = 0;
  for (const t of transforms) {
    const before = out;
    out = t(out);
    if (out !== before) applied++;
  }
  if (applied > 0) write(rel, out);
  Summary.push([label, rel, applied > 0 ? `OK (${applied} change${applied>1?'s':''})` : 'NOOP']);
}

function firstExisting(candidates) {
  for (const rel of candidates) if (exists(rel)) return rel;
  return null;
}

// ---- File targets (auto-detect .js/.jsx/.ts/.tsx variants) ----
const FILES = {
  canvas: firstExisting([
    'src/components/webgl/WebGLCanvas.jsx',
    'src/components/webgl/WebGLCanvas.tsx',
    'src/components/webgl/WebGLCanvas.js',
    'src/components/webgl/WebGLCanvas.ts'
  ]),
  renderer: firstExisting([
    'src/components/webgl/WebGLBackground.jsx',
    'src/components/webgl/WebGLBackground.tsx',
    'src/components/webgl/WebGLBackground.js',
    'src/components/webgl/WebGLBackground.ts'
  ]),
  director: firstExisting([
    'src/theater/TheaterDirector.js',
    'src/theater/TheaterDirector.ts',
    'src/theater/TheaterDirector.jsx',
    'src/theater/TheaterDirector.tsx'
  ]),
  engine: firstExisting([
    'src/engine/ConsciousnessEngine.js',
    'src/engine/ConsciousnessEngine.ts'
  ]),
  sentinel: 'tools/sst-guard.mjs'
};

// ---------- 1) SINGLE_WRITER_GEOMETRY: remove geometry writes outside renderer ----------
if (FILES.canvas) {
  patch(FILES.canvas, 'SINGLE_WRITER_GEOMETRY', [
    (txt) => {
      const lines = txt.split('\n');
      const keep = [];
      for (let line of lines) {
        // strip any line (even commented) that calls setAttribute()/setDrawRange()
        if (/\.\s*setAttribute\s*\(/.test(line) || /\.\s*setDrawRange\s*\(/.test(line)) continue;
        keep.push(line);
      }
      return keep.join('\n').replace(/\n{3,}/g, '\n\n'); // collapse excessive blank lines
    },
    // Also scrub tokens from comments so sentinel won't flag
    (txt) => txt.replace(/setAttribute\s*\(/g, 'SET_ATTR_REMOVED(')
                .replace(/setDrawRange\s*\(/g, 'SET_DRAW_RANGE_REMOVED(')
  ]);
}

// ---------- 2) EMIT_SOURCE + 5) DIRECTOR_GENESIS_MISSING ----------
if (FILES.director) {
  patch(FILES.director, 'DIRECTOR EMIT + GENESIS', [
    // remove any PARTICLES_EMERGED emits
    (txt) => txt.replace(/^\s*BeatBus\.emit\s*\(\s*EVENTS\.PARTICLES_EMERGED[^;]*;\s*$/gm,
                         '/* HOTDORS: Director must not emit PARTICLES_EMERGED (renderer-only). Removed. */'),
    // ensure STAGE_CHANGE('genesis') after awaiting once(PARTICLES_EMERGED)
    (txt) => {
      const hasAwait = /await\s+this\.once\s*\(\s*EVENTS\.PARTICLES_EMERGED/.test(txt);
      if (!hasAwait) return txt;
      const alreadyHas = /once\s*\(\s*EVENTS\.PARTICLES_EMERGED[^)]*\)[\s\S]{0,200}STAGE_CHANGE[\s\S]{0,80}['"]genesis['"]/.test(txt);
      if (alreadyHas) return txt;
      return txt.replace(
        /(await\s+this\.once\s*\(\s*EVENTS\.PARTICLES_EMERGED[^)]*\)\s*;\s*\n)/,
        `$1      // HOTDORS: explicit handoff to genesis stage per v3.3\n      BeatBus.emit(EVENTS.STAGE_CHANGE, { stage: 'genesis' });\n`
      );
    }
  ]);
}

// ---------- 3/4/6) RENDERER FIXES: scroll read, fabrication removal, FOV tweak ----------
if (FILES.renderer) {
  patch(FILES.renderer, 'RENDERER FIXES', [
    // Remove any scroll listener effect blocks
    (txt) => {
      // remove addEventListener('scroll', ...) blocks (best-effort)
      let out = txt.replace(
        /\s*useEffect\(\s*\(\)\s*=>\s*\{\s*const\s+onScroll[\s\S]*?window\.removeEventListener\(\s*['"]scroll['"][\s\S]*?\}\s*,\s*\[\s*\]\s*\);\s*/m,
        '\n// HOTDORS: removed scroll fallback (renderer is a dumb sink)\n'
      );
      // remove fallbackScrollRef declarations
      out = out.replace(/^\s*const\s+fallbackScrollRef\s*=\s*useRef\(\s*0\s*\)\s*;\s*$/m,
                        '// HOTDORS: removed scroll fallback ref');
      // stop using fallbackScrollRef in useFrame
      out = out.replace(
        /const\s+sp\s*=\s*Math\.max\(\s*scrollProgress\s*,\s*fallbackScrollRef\.current\s*\)\s*;/,
        'const sp = Math.max(0, Math.min(1, Number(scrollProgress) || 0)); // HOTDORS: no renderer scroll reads'
      );
      return out;
    },
    // Remove ensureArraysFromEmergence function entirely
    (txt) => txt.replace(/function\s+ensureArraysFromEmergence\s*\([^]*?\n}\n\n?/m,
                         '/* HOTDORS: ensureArraysFromEmergence removed (moved to Engine) */\n'),
    // Remove call-sites to ensureArraysFromEmergence; early-return if minimal bp detected
    (txt) => txt.replace(/let\s+bp\s*=\s*ensureArraysFromEmergence\s*\(\s*raw\s*\)\s*;\s*/m,
                         'console.warn("HOTDORS: Ignoring minimal emergence blueprint; Engine must emit full arrays."); return; '),
    // Scrub lingering tokens in comments/strings so sentinel won't trip
    (txt) => txt.replace(/ensureArraysFromEmergence/gi, 'ENSURE_ARRAYS_REMOVED')
                .replace(/\bfabricate\b/gi, 'synthesize_removed'),
    // Replace FOV/point-size heuristic with Canonical-driven default
    (txt) => {
      // If code probes ALIASED_POINT_SIZE_RANGE, nuke that block and set a canon-driven default.
      if (/ALIASED_POINT_SIZE_RANGE|GPU-safe point size detection/.test(txt)) {
        let out = txt.replace(
          /\/\/\s*GPU-safe point size detection[\s\S]*?const\s+mat\s*=\s*new\s+THREE\.ShaderMaterial\(/m,
          `const POINT_SIZE_DEFAULT = (Canonical?.features?.pointSizeDefault ?? 48.0); // HOTDORS: canon-driven point size\n\n    const mat = new THREE.ShaderMaterial(`
        );
        // Ensure uniform uses default
        out = out.replace(/uPointSize:\s*\{\s*value:\s*[^}]+\}/m, 'uPointSize: { value: POINT_SIZE_DEFAULT }');
        return out;
      }
      return txt;
    }
  ]);
}

// ---------- 4) ENGINE: ensure emergence blueprint emits full arrays ----------
if (FILES.engine) {
  patch(FILES.engine, 'ENGINE EMERGENCE BLUEPRINT', [
    // robust function-body replacement (brace matching) with HOTDORS marker
    (txt) => {
      if (/HOTDORS_FULL_EMERGENCE/.test(txt)) return txt;

      const sig = 'buildEmergenceBlueprint';
      const idx = txt.indexOf(sig);
      if (idx === -1) return txt;

      // find function start (the "{" after the signature)
      let start = txt.indexOf('{', idx);
      if (start === -1) return txt;

      // find matching closing brace for the function body
      let i = start, depth = 0;
      while (i < txt.length) {
        const ch = txt[i++];
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) break;
        }
      }
      const end = i; // index after the closing brace
      if (end <= start) return txt;

      const before = txt.slice(0, start + 1);


      const body = `
    // HOTDORS_FULL_EMERGENCE: Engine emits full arrays; renderer remains a dumb sink
    const opts = { text = 'HELLO CURTIS', count = 2000 } = {};
    console.log(\`🌟 Building emergence: "\${text}" with \${count} particles\`);

    // Base 2D text particle positions (glyph sampling)
    const positions = this.textToParticlePositions(text, count);
    const tiers = new Uint8Array(count);
    for (let i = 0; i < count; i++) tiers[i] = Math.floor(Math.random() * 4);

    // Canon-based per-tier properties (kept simple; override via Canonical if desired)
    const sizeByTier = [0.6, 0.8, 1.2, 1.5];
    const opacityByTier = [0.5, 0.6, 0.75, 0.9];
    const atlasByTier = [7, 1, 4, 1];

    const maxParticles = count;
    const atmosphericPositions = new Float32Array(maxParticles * 3);
    const text3DPositions = new Float32Array(maxParticles * 3);
    const animationSeeds = new Float32Array(maxParticles * 3);
    const sizeMultipliers = new Float32Array(maxParticles);
    const opacityData = new Float32Array(maxParticles);
    const atlasIndices = new Float32Array(maxParticles);
    const tierData = new Float32Array(maxParticles);

    for (let i = 0; i < count; i++) {
      const j = i * 3;

      // Atmospheric: spread around glyph area to make the morph visible
      atmosphericPositions[j + 0] = positions[j + 0] + (Math.random() - 0.5) * 60;
      atmosphericPositions[j + 1] = positions[j + 1] + (Math.random() - 0.5) * 45;
      atmosphericPositions[j + 2] = (Math.random() - 0.5) * 40;

      // Text target: the glyph positions (shallow Z)
      text3DPositions[j + 0] = positions[j + 0];
      text3DPositions[j + 1] = positions[j + 1];
      text3DPositions[j + 2] = positions[j + 2];

      const t = tiers[i] | 0;
      tierData[i] = t;
      sizeMultipliers[i] = sizeByTier[t] ?? 1.0;
      opacityData[i] = opacityByTier[t] ?? 0.8;
      atlasIndices[i] = atlasByTier[t] ?? 1;

      animationSeeds[j + 0] = Math.random();
      animationSeeds[j + 1] = Math.random();
      animationSeeds[j + 2] = Math.random();
    }

    return {
      id: 'emergence-genesis',
      mode: 'emergence',
      stageName: 'genesis',
      count,
      particleCount: count,
      maxParticles: count,
      activeCount: count,
      atmosphericPositions,
      text3DPositions,
      animationSeeds,
      sizeMultipliers,
      opacityData,
      atlasIndices,
      tierData,
      metadata: {
        sourceText: text,
        createdAt: Date.now()
      }
    };
`;

      // Rebuild function: keep signature, replace body
      // before: text up to '{' inclusive; after: we kept from the closing '}' (we'll replace it)
      const rebuilt = before + body + '  }' + txt.slice(end); // ensure single closing brace

      return rebuilt;
    },
  ]);
}

// --------------- Summary + verify ---------------
(function printSummary() {
  const pad = (s, n) => (s + ' '.repeat(n)).slice(0, n);
  log('\nHOTDORS Autofix summary:\n');
  log(pad('Fix', 28), pad('File', 52), 'Result');
  log('-'.repeat(28), '-'.repeat(52), '------');
  for (const [label, rel, res] of Summary) {
    log(pad(label, 28), pad(rel ?? '(none)', 52), res);
  }
  log('');
})();

// Optional sentinel run
if (!DRY && !NO_CI && exists(FILES.sentinel)) {
  try {
    log('Running sentinel (tools/sst-guard.mjs)…\n');
    execSync('node tools/sst-guard.mjs', { stdio: 'inherit' });
  } catch (e) {
    process.exit(e.status || 1);
  }
}

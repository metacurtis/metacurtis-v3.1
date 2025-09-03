#!/usr/bin/env node
/* eslint-env node */
/* doctor-one-touch.cjs
 * ONE-TOUCH — SST v3 Theater Patch
 * Fixes (idempotent):
 *  - Remove auto DIRECTOR_CANCEL emits (user-only)
 *  - Ensure EMERGENCE handshake (TheaterDirector emits PARTICLES_START_EMERGING once)
 *  - WebGLBackground: single EVENTS import, BeatBus import, clamp01 helper
 *  - WebGLBackground: listeners for BLUEPRINT_READY (keep), MORPH_PROGRESS (uniform sink),
 *                     STAGE_CHANGE → tint via setStageName
 *  - Keep stage→morph lane on bus (no change unless missing)
 *
 * Usage:
 *   node scripts/doctor-one-touch.cjs           # dry-run (no writes)
 *   node scripts/doctor-one-touch.cjs --write   # apply changes
 */

'use strict';

const fs = require('fs');
const _path = require('path');

const WRITE = process.argv.includes('--write');
const ROOT = process.cwd();

const F = {
  opening: 'src/components/theater/OpeningSequence.jsx',
  director: 'src/theater/TheaterDirector.js',
  bg: 'src/components/webgl/WebGLBackground.jsx',
  bridge: 'modules/state/bridges/AtomicToBeatBus.js',
};

function read(file) {
  const p = path.join(ROOT, file);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}
function write(file, text) {
  const p = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text, 'utf8');
}
function backup(file, text) {
  const bak = file + '.bak.' + new Date().toISOString().replace(/[:.]/g, '-');
  write(bak, text);
  return bak;
}
function edit(file, mutator) {
  const src = read(file);
  if (src == null) return { file, ok: false, reason: 'missing' };
  const out = mutator(src);
  if (out !== src) {
    const bak = backup(file, src);
    if (WRITE) write(file, out);
    return { file, ok: true, changed: true, bak };
  }
  return { file, ok: true, changed: false };
}

// ───────────────── helpers used inside patches ─────────────────
function ensureSingleEventsImport(code) {
  // Remove any existing EVENTS imports (different paths) then add one canonical line
  let o = code.replace(
    /^import\s+\{\s*EVENTS\s*\}\s+from\s+['"][^'"]*events\.js['"];?\s*$/gm,
    ''
  );
  if (!/from ['"]@\/theater\/events\.js['"]/.test(o)) {
    o = o.replace(/(^\s*import .+\n)+/m, (m) => m + "import { EVENTS } from '@/theater/events.js';\n");
  }
  return o;
}
function ensureBeatBusImport(code) {
  let o = code.replace(
    /^import\s+BeatBus\s+from\s+['"][^'"]*BeatBus\.js['"];?\s*$/gm,
    ''
  );
  if (!/from ['"]@\/modules\/orchestration\/core\/BeatBus\.js['"]/.test(o)) {
    o = o.replace(/(^\s*import .+\n)+/m, (m) => m + "import BeatBus from '@/modules/orchestration/core/BeatBus.js';\n");
  }
  return o;
}
function ensureClampHelper(code) {
  if (/const\s+clamp01\s*=\s*\(/.test(code)) return code;
  // Insert after imports block if possible, else at top
  if (/(^\s*import .+\n)+/m.test(code)) {
    return code.replace(/(^\s*import .+\n)+/m, (m) => m + "const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));\n");
  }
  return "const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));\n" + code;
}

// ───────────────── patches ─────────────────

// 1) OpeningSequence — remove auto DIRECTOR_CANCEL emits; clean broken emergence log lines
function patchOpeningSequence(src) {
  let o = src;

  // Remove auto director cancel emits (keep user triggered elsewhere)
  o = o.replace(
    /^\s*BeatBus\.emit(?:\?\.)?\(\s*EVENTS\.DIRECTOR_CANCEL[^;]*;?\s*$/gm,
    '/* HOTDORS: disabled auto DIRECTOR_CANCEL (user-only) */'
  );

  // Fix earlier broken log lines if exist
  o = o.replace(
    /console\.log\(\s*['"].*BeatBus\.emit\?\.\(EVENTS\.PARTICLES_START_EMERGING.*$/gm,
    "console.log('   OpeningSequence: Particles emerging, fading out');"
  );

  return o;
}

// 2) TheaterDirector — ensure EMERGENCE one-shot after BUILD_EMERGENCE_BLUEPRINT
function patchTheaterDirector(src) {
  let o = src;

  // Remove auto director cancel emits
  o = o.replace(
    /^\s*BeatBus\.emit(?:\?\.)?\(\s*EVENTS\.DIRECTOR_CANCEL[^;]*;?\s*$/gm,
    '/* HOTDORS: disabled auto DIRECTOR_CANCEL (user-only) */'
  );

  // Only add handshake if we can find BUILD_EMERGENCE_BLUEPRINT emits and no EMERGENCE yet
  if (/emit\(\s*EVENTS\.BUILD_EMERGENCE_BLUEPRINT/.test(o) &&
      !/emit\(\s*EVENTS\.PARTICLES_START_EMERGING/.test(o)) {
    o = o.replace(
      /emit\(\s*EVENTS\.BUILD_EMERGENCE_BLUEPRINT[^;]*\);\s*/g,
      (m) =>
        m +
        "\n// HOTDORS: handshake → EMERGENCE (one-shot)\n" +
        "if (!globalThis.__EMERGENCE_SENT) {\n" +
        "  globalThis.__EMERGENCE_SENT = true;\n" +
        "  BeatBus?.emit?.(EVENTS.PARTICLES_START_EMERGING);\n" +
        "}\n"
    );
  }

  return o;
}

// 3) WebGLBackground — unify imports, add listeners for morph & stage, keep BLUEPRINT_READY, tint via setStageName
function patchWebGLBackground(src) {
  let o = src;

  // Normalize imports
  o = ensureSingleEventsImport(o);
  o = ensureBeatBusImport(o);
  o = ensureClampHelper(o);

  // Ensure MORPH listener (idempotent): updates fallbackMorphRef.current
  if (!/HOTDORS_MORPH_LISTENER/.test(o)) {
    // Insert after fallbackRefs if present; else after first useEffect
    if (/const\s+fallbackScrollRef\s*=\s*useRef/.test(o)) {
      o = o.replace(
        /const\s+fallbackScrollRef\s*=\s*useRef\([^)]+\);\s*\n/,
        (m) =>
          m +
          "\n  // HOTDORS_MORPH_LISTENER\n" +
          "  useEffect(() => {\n" +
          "    const off = BeatBus?.on?.(EVENTS.MORPH_PROGRESS, (p) => {\n" +
          "      try { fallbackMorphRef.current = clamp01(p?.value); } catch {}\n" +
          "    });\n" +
          "    return () => off && off();\n" +
          "  }, []);\n\n"
      );
    } else {
      // Fallback: inject near top of component
      o = o.replace(
        /(function\s+WebGLBackground\s*\([\s\S]*?\)\s*\{\s*)/,
        (m) =>
          m +
          "  // HOTDORS_MORPH_LISTENER\n" +
          "  useEffect(() => {\n" +
          "    const off = BeatBus?.on?.(EVENTS.MORPH_PROGRESS, (p) => {\n" +
          "      try { fallbackMorphRef.current = clamp01(p?.value); } catch {}\n" +
          "    });\n" +
          "    return () => off && off();\n" +
          "  }, []);\n\n"
      );
    }
  }

  // Ensure STAGE_CHANGE → tint (via setStageName) so material colors update (useMemo pickStageColors)
  if (!/HOTDORS_STAGE_TINT/.test(o)) {
    o = o.replace(
      /(function\s+WebGLBackground\s*\([\s\S]*?\)\s*\{\s*)/,
      (m) =>
        m +
        "  // HOTDORS_STAGE_TINT\n" +
        "  useEffect(() => {\n" +
        "    const off = BeatBus?.on?.(EVENTS.STAGE_CHANGE, (p) => {\n" +
        "      try { setStageName(p?.stage || p?.name || String(p)); } catch {}\n" +
        "    });\n" +
        "    return () => off && off();\n" +
        "  }, []);\n\n"
    );
  }

  return o;
}

// 4) Bridge (AtomicToBeatBus) — ensure at least one MORPH_PROGRESS emit path (don’t duplicate)
function patchBridge(src) {
  let o = src;
  // If nothing emits MORPH_PROGRESS, add a simple stageProgress→MORPH bridge with optional invert
  if (!/MORPH_PROGRESS/.test(o)) {
    // Add import for BeatBus/EVENTS if missing
    if (!/from ['"]@\/theater\/events\.js['"]/.test(o)) {
      o = "import { EVENTS } from '@/theater/events.js';\n" + o;
    }
    if (!/from ['"]@\/modules\/orchestration\/core\/BeatBus\.js['"]/.test(o)) {
      o = "import BeatBus from '@/modules/orchestration/core/BeatBus.js';\n" + o;
    }
    // Add a minimal subscription for stageAtom (we assume it already imports stageAtom here)
    if (!/onStageProgressToMorph/.test(o)) {
      o +=
        "\n// HOTDORS:onStageProgressToMorph (idempotent)\n" +
        "try {\n" +
        "  const clamp01 = (v) => Math.max(0, Math.min(1, Number(v)||0));\n" +
        "  let last = -1;\n" +
        "  stageAtom?.subscribe?.((s) => {\n" +
        "    const g = clamp01(s?.stageProgress);\n" +
        "    if (g === last) return; last = g;\n" +
        "    const inv = !!globalThis.__SST_MORPH_INVERT; const out = inv ? 1 - g : g;\n" +
        "    BeatBus?.emit?.(EVENTS.MORPH_PROGRESS, { value: out });\n" +
        "  });\n" +
        "} catch {}\n";
    }
  }
  return o;
}

// ───────────────── run ─────────────────
const results = [];
results.push(edit(F.opening, patchOpeningSequence));
results.push(edit(F.director, patchTheaterDirector));
results.push(edit(F.bg, patchWebGLBackground));
results.push(edit(F.bridge, patchBridge));

const summary = results.map(r => {
  if (!r.ok) return [r.file, 'missing'];
  return [r.file, r.changed ? (WRITE ? 'patched' : 'would patch') : 'ok'];
});

console.log(`\n[ONE-TOUCH] ${WRITE ? 'WRITE' : 'DRY-RUN'}\n`);
console.table(Object.fromEntries(summary));
console.log('\nChecks:\n - Director emits EMERGENCE once\n - WebGLBackground listens MORPH + STAGE_CHANGE and tints\n - EVENTS import deduped\n - Bridge emits MORPH (from stageAtom.stageProgress)\n');
if (!WRITE) console.log('Re-run with --write to apply.\n');


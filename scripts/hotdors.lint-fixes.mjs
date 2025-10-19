#!/usr/bin/env node
/* eslint-env node */
/**
 * HOT-DORS — Lint Fix Consolidator
 * - Marks repo scripts as Node env (process/console)
 * - Removes brittle escapes (\o, \)) from injected strings
 * - Renames unused callback params to _var (satisfies /^_/ rule)
 * - Fixes empty catch blocks by adding /* noop *\/
 * - Hooks: adjusts WebGLBackground resize effect deps
 * - Engine: silences unused imports/locals (rename to _X)
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const T = (rel) => path.join(ROOT, rel);
const exists = (rel) => fs.existsSync(T(rel));
const read = (rel) => (exists(rel) ? fs.readFileSync(T(rel), 'utf8') : null);
const write = (rel, s) => fs.writeFileSync(T(rel), s, 'utf8');
const backup = (rel) => {
  const p = T(rel), dir = path.dirname(p), base = path.basename(p);
  if (!exists(rel)) return;
  const tag = new Date().toISOString().replace(/[:.]/g, '-');
  const has = fs.readdirSync(dir).some(n => n.startsWith(base + '.bak.lint-'));
  if (!has) fs.copyFileSync(p, path.join(dir, `${base}.bak.lint-${tag}`));
};

function patch(rel, fn) {
  const s = read(rel);
  if (s == null) return false;
  const out = fn(s);
  if (out !== s) { backup(rel); write(rel, out); return true; }
  return false;
}

/* ---------- 1) Node scripts: add eslint-env & fix minor issues ---------- */
const NODE_SCRIPTS = [
  'scripts/agent.goalrunner.mjs',
  'scripts/hotdors.emergence-from-text.mjs',
  'scripts/hotdors.finalize-orchestrator-and-emergence.mjs',
  'scripts/hotdors.scroll-orchestrator.mjs',
];

for (const file of NODE_SCRIPTS) {
  if (!exists(file)) continue;
  patch(file, (s) => {
    let out = s;
    // Ensure eslint-env node at top
    if (!/^\s*\/\*\s*eslint-env\s+node\s*\*\//.test(out)) {
      out = `/* eslint-env node */\n${out}`;
    }
    // Remove unnecessary escape sequences in string literals used by replace injections
    out = out.replace(/\\\)/g, ')').replace(/\\o/g, 'o');

    // Unused replacer params → prefix with _
    out = out.replace(/\((\s*)m(\s*)=>/g, '($1_m$2=>');
    out = out.replace(/\((\s*)e(\s*)=>/g, '($1_e$2=>');

    // If any bare catch {} exist, add noop
    out = out.replace(/catch\s*\(\s*([a-zA-Z0-9_]+)?\s*\)\s*\{\s*\}/g, 'catch ($1) { /* noop */ }');

    return out;
  });
}

/* ---------- 2) OpeningSequence: empty catch + gesture flag usage ---------- */
const OPENING = 'src/components/theater/OpeningSequence.jsx';
if (exists(OPENING)) {
  patch(OPENING, (s) => {
    let out = s;

    // Normalize empty catch blocks
    out = out.replace(/catch\s*\(\s*([a-zA-Z0-9_]+)?\s*\)\s*\{\s*\}/g, 'catch ($1) { /* noop */ }');

    // If we have a gesture flag declared but not used, ensure AUDIO_COMPUTER_HUM respects it
    if (/let\s+gestureOk\s*=/.test(out) && /AUDIO_COMPUTER_HUM/.test(out)) {
      out = out.replace(
        /humAudioRef\.current\s*\.\s*play\(\)\s*\.catch\([^)]+\);/,
        'if (gestureOk) { humAudioRef.current.play().catch(() => {}); }'
      );
    }
    // Variant with __gestureOk
    if (/let\s+__gestureOk\s*=/.test(out) && /AUDIO_COMPUTER_HUM/.test(out)) {
      out = out.replace(
        /humAudioRef\.current\s*\.\s*play\(\)\s*\.catch\([^)]+\);/,
        'if (__gestureOk) { humAudioRef.current.play().catch(() => {}); }'
      );
    }

    return out;
  });
}

/* ---------- 3) Renderer: hook deps warning ---------- */
const RENDERER = 'src/components/webgl/WebGLBackground.jsx';
if (exists(RENDERER)) {
  patch(RENDERER, (s) => {
    let out = s;
    // Replace deps array of the resize/DPR effect to include objects (size, gl)
    out = out.replace(
      /useEffect\(\s*\(\)\s*=>\s*\{\s*const mat[\s\S]*?mat\.uniformsNeedUpdate\s*=\s*true;\s*\},\s*\[[^\]]*\]\s*\);/m,
      (block) => block.replace(/\[[^\]]*\]/, '[size, gl]')
    );
    return out;
  });
}

/* ---------- 4) Engine: silence unused vars (THREE, maxAttempts) ---------- */
const ENGINE = 'src/engine/ConsciousnessEngine.js';
if (exists(ENGINE)) {
  patch(ENGINE, (s) => {
    let out = s;
    // If THREE import is present and unused, prefix with _
    out = out.replace(/import\s+\*\s+as\s+THREE\s+from\s+['"]three['"];/, (m) => m.replace('THREE', '_THREE'));
    // Rename maxAttempts → _maxAttempts if present
    out = out.replace(/\bmaxAttempts\b/g, '_maxAttempts');
    return out;
  });
}

/* ---------- 5) ESLint v9 ignores (deprecated .eslintignore) ---------- */
const ESLINT_CONFIG = 'eslint.config.js';
if (exists(ESLINT_CONFIG)) {
  patch(ESLINT_CONFIG, (s) => {
    if (/ignores\s*:\s*\[/.test(s)) return s; // already has ignores
    // Insert an ignores array into the exported config (best-effort)
    return s.replace(
      /export\s+default\s+\[/,
      `export default [
  { ignores: ['node_modules/**', 'dist/**', '.husky/**'] },`
    );
  });
} else {
  // Provide a minimal config if none exists (won't overwrite)
  const minimal =
`/* eslint-env node */
import js from '@eslint/js';
export default [
  js.configs.recommended,
  { ignores: ['node_modules/**', 'dist/**', '.husky/**'] },
];\n`;
  const dest = 'eslint.config.js';
  if (!exists(dest)) { backup(dest); write(dest, minimal); }
}

/* ---------- Done ---------- */
console.log('\n✅ HOT-DORS lint-fixes applied. Now run:\n  npm run validate\n');

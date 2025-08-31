#!/usr/bin/env node
// HOT-DORS: Purge allen* attributes (code + shaders) and add a runtime guard.
// Idempotent. Requires Node 16+ (ESM). Run from repo root.
// Usage: node scripts/hotdors.purge-allen.mjs [--dry]

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DRY = process.argv.includes('--dry');
const ROOT = process.cwd();
const EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.glsl', '.vert', '.frag']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.cache']);

const WGB_PATH = 'src/components/webgl/WebGLBackground.jsx';
const RUNTIME_MARK = 'HOTDORS_PURGE_ALLEN_GUARD';

async function walk(dir) {
  const out = [];
  const ents = await fs.readdir(dir, { withFileTypes: true });
  for (const e of ents) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

function replaceAllAllen(src) {
  let changed = 0;
  const before1 = (src.match(/\ballenAtlasPositions\b/g) || []).length;
  const before2 = (src.match(/\ballenAtlasPosition\b/g) || []).length;
  if (before1) {
    src = src.replace(/\ballenAtlasPositions\b/g, 'text3DPositions');
    changed += before1;
  }
  if (before2) {
    src = src.replace(/\ballenAtlasPosition\b/g, 'text3DPosition');
    changed += before2;
  }
  return { src, changed };
}

async function rewriteFile(p) {
  const ext = path.extname(p);
  if (!EXTS.has(ext)) return { p, changed: 0, injected: false, skipped: true };

  let src = await fs.readFile(p, 'utf8');
  const original = src;

  // global replace
  let { src: next, changed } = replaceAllAllen(src);
  src = next;

  // runtime guard injection in WebGLBackground
  let injected = false;
  if (p.endsWith(WGB_PATH) && !src.includes(RUNTIME_MARK)) {
    // insert right after "geometryRef.current = geo;"
    src = src.replace(
      /(geometryRef\.current\s*=\s*geo;\s*\n)/,
      `$1      // ${RUNTIME_MARK}: map+remove stray allen attribute at runtime\n` +
      `      try {\n` +
      `        if (geo.getAttribute && geo.getAttribute("allenAtlasPosition")) {\n` +
      `          const a = geo.getAttribute("allenAtlasPosition");\n` +
      `          if (!geo.getAttribute("text3DPosition")) geo.setAttribute("text3DPosition", a);\n` +
      `          geo.deleteAttribute("allenAtlasPosition");\n` +
      `        }\n` +
      `      } catch {}\n`
    );
    if (src !== original && !src.includes(RUNTIME_MARK) === false) injected = true;
  }

  if (!DRY && (changed || injected) && src !== original) {
    await fs.writeFile(p, src, 'utf8');
  }
  return { p, changed, injected, skipped: false };
}

async function main() {
  console.log('🔧 HOT-DORS purge-allen: scanning…');
  const files = await walk(ROOT);
  const targets = files.filter(f => EXTS.has(path.extname(f)));
  const results = [];
  for (const p of targets) {
    // keep paths inside repo for neat logs
    const rel = path.relative(ROOT, p);
    const res = await rewriteFile(rel);
    results.push(res);
  }

  const touched = results.filter(r => (r.changed || r.injected) && !r.skipped);
  const totalRepls = touched.reduce((n, r) => n + r.changed, 0);
  const injected = touched.filter(r => r.injected).map(r => r.p);

  console.log(`🧹 Replacements: ${totalRepls}  |  Files touched: ${touched.length}`);
  if (injected.length) console.log(`🪄 Runtime guard injected in:`, injected);

  // Self-verify: any leftover allen tokens?
  const leftovers = [];
  for (const rel of targets) {
    const s = await fs.readFile(rel, 'utf8');
    if (/\ballenAtlasPosition(s)?\b/.test(s)) leftovers.push(rel);
  }

  if (leftovers.length) {
    console.log('\n❌ Verification failed — remaining references:');
    leftovers.forEach(f => console.log('  -', f));
    console.log('\nFix or re-run (maybe a non-standard extension?). Exiting 1.');
    process.exitCode = 1;
  } else {
    console.log('\n✅ Verification passed — no allen* references remain.');
    console.log('   Tip: restart dev server if running so shaders recompile cleanly.');
  }
}

main().catch(e => {
  console.error('💥 purge-allen crashed:', e);
  process.exitCode = 1;
});

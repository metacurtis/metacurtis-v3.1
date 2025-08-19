#!/usr/bin/env node
'use strict';

/**
 * Doctor Starter (idempotent patcher)
 * -----------------------------------
 * - Dry-run by default.
 * - Only commits when --commit is supplied.
 * - Optional: --tag, --push, --no-verify, --message "..."
 * - Snapshots patched files under snapshots/doctor_<name>_<stamp>_<sha>/
 *
 * Usage examples:
 *   node scripts/doctor-starter.cjs --name morph-pipeline                 # dry run
 *   node scripts/doctor-starter.cjs --name morph-pipeline --commit        # commit + tag
 *   node scripts/doctor-starter.cjs --name morph-pipeline --commit --push # also push
 *   node scripts/doctor-starter.cjs --name morph-pipeline --commit --no-verify --message "chore(dev): morph pipeline"
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

////////////////////////////////////////////////////////////////////////////////
// arg parsing
////////////////////////////////////////////////////////////////////////////////
const argv = process.argv.slice(2);
function getFlag(name, def = false) {
  const key = `--${name}`;
  if (argv.includes(key)) return true;
  const i = argv.findIndex(a => a.startsWith(`${key}=`));
  if (i >= 0) return argv[i].split('=').slice(1).join('=') || true;
  return def;
}
function getStr(name, def = '') {
  const v = getFlag(name, null);
  return v === true || v === null ? def : String(v);
}

const NAME = getStr('name', 'starter');
const DO_COMMIT = !!getFlag('commit', false);
const DO_PUSH = !!getFlag('push', false);
const NO_VERIFY = !!getFlag('no-verify', false);
const DO_TAG = getFlag('tag', true); // tag by default when committing
const MSG = getStr('message', `chore(doctor): ${NAME} — apply patch set`);

////////////////////////////////////////////////////////////////////////////////
// repo root + git info
////////////////////////////////////////////////////////////////////////////////
function sh(cmd, opts = {}) {
  return cp.execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts }).trim();
}

function repoRoot() {
  try {
    return sh('git rev-parse --show-toplevel');
  } catch {
    return process.cwd();
  }
}
const ROOT = repoRoot();
process.chdir(ROOT);

function gitShortSha() {
  try {
    return sh('git rev-parse --short HEAD');
  } catch {
    return 'nohead';
  }
}

function nowStamp() {
  // ISO-ish, filesystem-safe
  return new Date().toISOString().replace(/[:.]/g, '-');
}

////////////////////////////////////////////////////////////////////////////////
/** filesystem helpers (idempotent write + .bak on first change) */
////////////////////////////////////////////////////////////////////////////////
function readFile(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}
function writeFileOnce(p, content) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const prev = readFile(p);
  if (prev === content) return { changed: false, reason: 'identical' };
  if (prev !== null && !fs.existsSync(p + '.bak')) {
    fs.writeFileSync(p + '.bak', prev);
  }
  fs.writeFileSync(p, content, 'utf8');
  return { changed: true };
}

////////////////////////////////////////////////////////////////////////////////
// patch helpers (safe + chatty)
////////////////////////////////////////////////////////////////////////////////
function ensureImport(filePath, importLine) {
  const src = readFile(filePath);
  if (src == null) return { changed: false, skipped: true, reason: 'missing file' };
  if (new RegExp('^\\s*' + escapeRegExp(importLine), 'm').test(src)) {
    return { changed: false, reason: 'import exists' };
  }
  const out = importLine + '\n' + src;
  const r = writeFileOnce(filePath, out);
  if (r.changed) console.log('✍️  +import', rel(filePath));
  return r;
}

function ensureAfter(filePath, needleRegex, insertText) {
  const src = readFile(filePath);
  if (src == null) return { changed: false, skipped: true, reason: 'missing file' };
  if (src.includes(insertText)) return { changed: false, reason: 'already present' };
  const re = needleRegex instanceof RegExp ? needleRegex : new RegExp(needleRegex, 'm');
  const m = re.exec(src);
  if (!m) return { changed: false, reason: 'needle not found' };
  const idx = m.index + m[0].length;
  const out = src.slice(0, idx) + '\n' + insertText + '\n' + src.slice(idx);
  const r = writeFileOnce(filePath, out);
  if (r.changed) console.log('✍️  +after', rel(filePath), '←', re);
  return r;
}

function replaceOnce(filePath, regex, replacement) {
  const src = readFile(filePath);
  if (src == null) return { changed: false, skipped: true, reason: 'missing file' };
  const out = src.replace(regex, replacement);
  if (out === src) return { changed: false, reason: 'no match' };
  const r = writeFileOnce(filePath, out);
  if (r.changed) console.log('✍️  ~replace', rel(filePath), '←', regex);
  return r;
}

function ensureBetweenMarkers(filePath, startMarker, block, endMarker) {
  const src = readFile(filePath);
  if (src == null) return { changed: false, skipped: true, reason: 'missing file' };
  const start = `// >>> ${startMarker}`;
  const end = `// <<< ${endMarker}`;
  const reBlock = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`, 'm');
  const newChunk = `${start}\n${block}\n${end}`;
  if (reBlock.test(src)) {
    const out = src.replace(reBlock, newChunk);
    if (out === src) return { changed: false, reason: 'block up-to-date' };
    const r = writeFileOnce(filePath, out);
    if (r.changed) console.log('✍️  ~block', rel(filePath), `[${startMarker}]`);
    return r;
  } else {
    const out = src + '\n\n' + newChunk + '\n';
    const r = writeFileOnce(filePath, out);
    if (r.changed) console.log('✍️  +block', rel(filePath), `[${startMarker}]`);
    return r;
  }
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function rel(p) {
  return path.relative(ROOT, p);
}

////////////////////////////////////////////////////////////////////////////////
// snapshot (only touched files)
////////////////////////////////////////////////////////////////////////////////
function snapshot(files) {
  if (!files.length) return null;
  const dir = path.join(
    ROOT,
    'snapshots',
    `doctor_${NAME}_${nowStamp()}_${gitShortSha()}`
  );
  fs.mkdirSync(dir, { recursive: true });
  const concat = [];
  for (const f of files) {
    const src = readFile(f);
    if (src == null) continue;
    const dst = path.join(dir, rel(f).replace(/[\\/]/g, '__') + '.txt');
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.writeFileSync(dst, src, 'utf8');
    concat.push(`// ===== ${rel(f)} =====\n${src}\n`);
    console.log('📄 saved', rel(f), '→', rel(dst));
  }
  fs.writeFileSync(path.join(dir, 'CONCAT.txt'), concat.join('\n'), 'utf8');
  console.log('\n✅ Snapshot complete.\n  Dir   :', rel(dir), '\n  Count :', files.length);
  return dir;
}

////////////////////////////////////////////////////////////////////////////////
// PATCH PLAN (edit this section for each doctor)
////////////////////////////////////////////////////////////////////////////////

// Example (commented). Un-comment and adjust for a real patch.
// const PATCHES = [
//   {
//     file: path.join(ROOT, 'src/dev/renderHealthcheck.js'),
//     run() {
//       ensureImport(
//         this.file,
//         "import { installTransitionService } from '../runtime/TransitionService.js';"
//       );
//       ensureAfter(this.file, /__RENDER_HEALTHCHECK__\(\)\s*;?/, 'installTransitionService();');
//     },
//   },
// ];

const PATCHES = []; // ← start empty. Add entries like the commented example above.

////////////////////////////////////////////////////////////////////////////////
// execution
////////////////////////////////////////////////////////////////////////////////
(async function main() {
  console.log(`🩺 Doctor: ${NAME} (dry-run=${!DO_COMMIT})`);
  const touched = [];

  for (const step of PATCHES) {
    try {
      const before = readFile(step.file);
      step.run();
      const after = readFile(step.file);
      if (before !== after) touched.push(step.file);
    } catch (e) {
      console.error('✖ Patch failed for', rel(step.file), '-', e.message);
      process.exitCode = 1;
      return;
    }
  }

  if (!touched.length) {
    console.log('ℹ No changes (idempotent / nothing to do).');
    return;
  }

  // Snapshot patched files
  snapshot(touched);

  if (!DO_COMMIT) {
    console.log('\n💡 Dry run only. Re-run with --commit to create a commit and tag.');
    return;
  }

  // Commit + optional tag/push
  try {
    const commitCmd = `git add -A && git commit ${NO_VERIFY ? '--no-verify ' : ''}-m "${MSG.replace(/"/g, '\\"')}"`;
    cp.execSync(commitCmd, { stdio: 'inherit' });
  } catch (e) {
    console.warn('⚠ Commit failed or skipped:', e.message);
  }

  if (DO_TAG) {
    const tag = `doctor_${NAME}_${nowStamp()}`;
    try {
      cp.execSync(`git tag -a ${tag} -m "${tag}"`, { stdio: 'inherit' });
      console.log('🏷  tagged:', tag);
    } catch (e) {
      console.warn('⚠ Tag failed:', e.message);
    }
  }

  if (DO_PUSH) {
    try {
      cp.execSync('git push --follow-tags', { stdio: 'inherit' });
      console.log('🚀 pushed with tags.');
    } catch (e) {
      console.warn('⚠ Push failed:', e.message);
    }
  }

  console.log('✅ Doctor finished.');
})();

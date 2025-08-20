#!/usr/bin/env node
/**
 * doctor_migrate_state_modules.cjs
 *
 * Goal:
 *  1) Move src/state/** -> src/modules/state/**
 *  2) Update imports/exports (incl. dynamic import() & require()) to '@/modules/state/...'
 *  3) Ensure jsconfig/tsconfig has proper aliases; dedupe if needed
 *  4) Optionally wire main to import '@/modules/state/index.js' (safe: your index auto-inits in DEV)
 *
 * Usage:
 *   node scripts/doctor_migrate_state_modules.cjs           # dry run
 *   node scripts/doctor_migrate_state_modules.cjs --apply   # make changes
 *   node scripts/doctor_migrate_state_modules.cjs --apply --commit
 *
 * Notes:
 * - Uses git mv when repo detected, else fs.renameSync.
 * - Backs up modified files with .bak once per file.
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = process.cwd();
const P = (...s) => path.join(ROOT, ...s);

const args = new Set(process.argv.slice(2));
const APPLY = args.has('--apply') || args.has('--commit');
const COMMIT = args.has('--commit');

const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next', '.vite', 'coverage', '.cache', 'snapshots']);
const CODE_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

function log(...m){ console.log(...m); }
function warn(...m){ console.warn(...m); }

function exists(f){ return fs.existsSync(P(f)); }
function read(f){ return fs.readFileSync(P(f), 'utf8'); }
function write(f, s){
  fs.mkdirSync(path.dirname(P(f)), { recursive: true });
  fs.writeFileSync(P(f), s, 'utf8');
}
function backupOnce(absPath){
  const bak = absPath + '.bak';
  if (!fs.existsSync(bak)) {
    fs.copyFileSync(absPath, bak);
  }
}

function isGitRepo(){
  try { cp.execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' }); return true; }
  catch { return false; }
}
function gitMv(oldAbs, newAbs){
  try { cp.execSync(`git mv "${oldAbs}" "${newAbs}"`, { stdio: 'ignore' }); return true; }
  catch { return false; }
}

function walk(dir, out = []){
  const full = P(dir);
  if (!fs.existsSync(full)) return out;
  for (const name of fs.readdirSync(full)) {
    if (IGNORE_DIRS.has(name)) continue;
    const abs = path.join(full, name);
    const rel = path.relative(ROOT, abs);
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) walk(rel, out);
    else out.push(rel);
  }
  return out;
}

function migrateSpecifier(spec){
  // If already correct or doesn't touch /state/, leave it.
  if (spec.includes('/modules/state/')) return spec;
  if (!spec.includes('/state/')) return spec;

  // Normalize any leading prefixes and rebuild to alias
  // Examples handled:
  //  './state/x', '../state/x', '../../state/x', 'src/state/x', '@/state/x'
  const idx = spec.indexOf('/state/');
  if (idx === -1) return spec;

  const after = spec.slice(idx + '/state/'.length);
  return `@/modules/state/${after}`;
}

function rewriteImports(content){
  let changed = content;

  // 1) import ... from '...'
  changed = changed.replace(
    /\bfrom\s+(['"`])([^'"`]+)\1/g,
    (m, q, spec) => `from ${q}${migrateSpecifier(spec)}${q}`
  );

  // 2) bare import '...'
  changed = changed.replace(
    /\bimport\s+(['"`])([^'"`]+)\1/g,
    (m, q, spec) => `import ${q}${migrateSpecifier(spec)}${q}`
  );

  // 3) export ... from '...'
  changed = changed.replace(
    /\bexport\s+[^;]*?\s+from\s+(['"`])([^'"`]+)\1/g,
    (m, q, spec) => m.replace(spec, migrateSpecifier(spec))
  );

  // 4) dynamic import('...')
  changed = changed.replace(
    /\bimport\s*\(\s*(['"`])([^'"`]+)\1\s*\)/g,
    (m, q, spec) => `import(${q}${migrateSpecifier(spec)}${q})`
  );

  // 5) require('...')
  changed = changed.replace(
    /\brequire\s*\(\s*(['"`])([^'"`]+)\1\s*\)/g,
    (m, q, spec) => `require(${q}${migrateSpecifier(spec)}${q})`
  );

  return changed;
}

function updateCodeImports(){
  const candidates = walk('src').filter(f => CODE_EXTS.has(path.extname(f)));
  const changed = [];
  for (const rel of candidates) {
    const abs = P(rel);
    const orig = read(rel);
    const next = rewriteImports(orig);
    if (next !== orig) {
      changed.push(rel);
      if (APPLY) {
        backupOnce(abs);
        write(rel, next);
      }
    }
  }
  return changed;
}

function moveStateTree(){
  const srcRoot = 'src/state';
  const dstRoot = 'src/modules/state';
  if (!exists(srcRoot)) {
    log('ℹ️ No src/state directory found. Skipping move step.');
    return { moved: [], skipped: [] };
  }
  const files = walk(srcRoot);
  const moved = [], skipped = [];

  for (const rel of files) {
    const absOld = P(rel);
    const destRel = rel.replace(/^src\/state\//, 'src/modules/state/');
    const absNew = P(destRel);

    if (fs.existsSync(absNew)) {
      skipped.push({ from: rel, to: destRel, reason: 'dest-exists' });
      continue;
    }

    if (APPLY) {
      fs.mkdirSync(path.dirname(absNew), { recursive: true });
      const ok = isGitRepo() ? gitMv(absOld, absNew) : (fs.renameSync(absOld, absNew), true);
      if (!ok) {
        // Fallback to copy + unlink if git mv failed
        fs.copyFileSync(absOld, absNew);
        fs.unlinkSync(absOld);
      }
    }
    moved.push({ from: rel, to: destRel });
  }

  // Try to remove empty src/state dirs after move
  if (APPLY) {
    try {
      const full = P(srcRoot);
      if (fs.existsSync(full)) {
        // Remove dir if empty (best effort)
        const left = walk(srcRoot);
        if (left.length === 0) fs.rmSync(full, { recursive: true, force: true });
      }
    } catch {}
  }

  return { moved, skipped };
}

function ensureAliasConfig(file){
  if (!exists(file)) return null;
  try {
    const abs = P(file);
    const json = JSON.parse(read(file));
    json.compilerOptions = json.compilerOptions || {};
    json.compilerOptions.baseUrl = json.compilerOptions.baseUrl || '.';
    json.compilerOptions.paths = json.compilerOptions.paths || {};

    // Deduplicate and enforce desired alias entries
    const paths = { ...json.compilerOptions.paths };
    paths['@/*'] = ['src/*'];
    paths['@/modules/*'] = ['src/modules/*'];
    json.compilerOptions.paths = paths;

    const before = JSON.stringify(JSON.parse(read(file)), null, 2);
    const after = JSON.stringify(json, null, 2);
    if (before !== after && APPLY) {
      backupOnce(abs);
      write(file, after);
    }
    return { file, changed: before !== after };
  } catch (e) {
    warn(`⚠️ Could not parse ${file}:`, e.message);
    return { file, changed: false, error: e.message };
  }
}

function wireMain(){
  const mains = ['src/main.jsx', 'src/main.tsx'].filter(exists);
  const touched = [];
  for (const rel of mains) {
    const abs = P(rel);
    const src = read(rel);
    if (src.includes("@/modules/state/index.js") || src.includes("@/modules/state/index.ts")) continue;
    const inject = `import '@/modules/state/index.js';\n`;
    const next = inject + src;
    if (APPLY) {
      backupOnce(abs);
      write(rel, next);
    }
    touched.push(rel);
  }
  return touched;
}

(function run(){
  log('🩺 Repo Doctor: Migrate src/state -> src/modules/state');
  log(`   Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}${COMMIT ? ' + COMMIT' : ''}\n`);

  // 1) Move tree
  const { moved, skipped } = moveStateTree();
  log(`📁 Move plan: ${moved.length} file(s) to relocate${APPLY ? '' : ' (dry-run)'}${skipped.length ? `, ${skipped.length} skipped` : ''}`);

  // 2) Rewrite imports/exports across repo
  const changed = updateCodeImports();
  log(`🔁 Imports updated in ${changed.length} file(s)${APPLY ? '' : ' (dry-run)'}`);

  // 3) Ensure alias config in jsconfig/tsconfig
  const cfgResults = [];
  cfgResults.push(ensureAliasConfig('jsconfig.json'));
  cfgResults.push(ensureAliasConfig('tsconfig.json'));
  const cfgChanged = cfgResults.filter(r => r && r.changed).length;
  log(`🧭 Alias config updated in ${cfgChanged} config file(s)${APPLY ? '' : ' (dry-run)'}`);

  // 4) Wire main to load state entry (safe in DEV; your index auto-inits in dev)
  const mainsTouched = wireMain();
  if (mainsTouched.length) log(`🧩 main wired: ${mainsTouched.join(', ')}`);

  // Summary
  log('\n— Summary —');
  log(`Moved: ${moved.length}`);
  if (skipped.length) log(`Skipped (dest exists): ${skipped.length}`);
  log(`Imports rewritten: ${changed.length}`);
  log(`Configs touched: ${cfgChanged}`);
  if (mainsTouched.length) log(`Main wired: ${mainsTouched.length} file(s)`);

  // Optional commit
  if (APPLY && COMMIT && isGitRepo()) {
    try {
      cp.execSync('git add -A', { stdio: 'inherit' });
      cp.execSync('git commit -m "doctor: migrate state -> src/modules/state and update imports"', { stdio: 'inherit' });
      log('✅ Git commit created.');
    } catch (e) {
      warn('⚠️ Git commit failed:', e.message);
    }
  }

  log('\nNext:')
  log('  • Run your app: npm run dev');
  log('  • Verify no lingering imports:');
  log(`    grep -R "from '.*state/" -n src || true`);
  log(`    grep -R 'import(.*state/' -n src || true`);
  log('  • In browser console:');
  log('    canon.status()');
  log('    __stateController?.nextStage?.()  // if your controller exposes it');
})();

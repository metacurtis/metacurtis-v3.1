#!/usr/bin/env node
/* eslint-env node */
/**
 * doctor-v2-structure.cjs
 * Purpose: make V2 load reliably in Vite by enforcing:
 *   - one BeatBus instance (bus-spine)
 *   - bridge boot at app start
 *   - no '@/' alias from inside /modules (use '@modules' or relative)
 *   - fix import specifiers in src/** to use '@modules' (no ../modules)
 *   - tidy dynamic imports in modules/state/*
 *
 * Run:
 *   node scripts/doctor-v2-structure.cjs            # dry run (prints plan)
 *   node scripts/doctor-v2-structure.cjs --apply    # apply changes
 */

const fs = require('fs');
const _path = require('path');

const CWD = process.cwd();
const APPLY = process.argv.includes('--apply');

const SRC = path.join(CWD, 'src');
const MOD = path.join(CWD, 'modules');

function read(p) { try { return fs.readFileSync(p,'utf8'); } catch { return null; } }
function write(p, s) { fs.mkdirSync(path.dirname(p), {recursive:true}); fs.writeFileSync(p, s); }
function exists(p) { return fs.existsSync(p); }

function patchFile(file, transform) {
  const src = read(file);
  if (src == null) return { file, ok:false, reason:'missing' };
  const out = transform(src);
  if (out === src) return { file, ok:true, changed:false };
  if (APPLY) write(file, out);
  return { file, ok:true, changed:true };
}

function listFiles(root, exts = ['.js', '.jsx', '.cjs', '.mjs', '.ts', '.tsx']) {
  const out = [];
  (function walk(d) {
    if (!exists(d)) return;
    for (const name of fs.readdirSync(d)) {
      const p = path.join(d, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (exts.includes(path.extname(p))) out.push(p);
    }
  })(root);
  return out;
}

function summaryRow(label, res) {
  if (!res) return;
  if (!res.ok) console.log('✗', label, '→', res.file, res.reason || '');
  else if (res.changed) console.log('✔', label, '→', res.file);
  else console.log('＝', label, '→', res.file, '(no change)');
}

// --- Step A: ensure bus spine (one BeatBus everywhere) ---
function ensureBusSpine() {
  const p = path.join(SRC, 'orchestration', 'bus-spine.js');
  const target = [
    "import BeatBus from '@modules/orchestration/core/BeatBus.js';",
    "if (!globalThis.BeatBus) globalThis.BeatBus = BeatBus;",
    "if (!globalThis.__BeatBus) globalThis.__BeatBus = BeatBus;",
    "export default BeatBus;",
    ""
  ].join('\n');

  if (!exists(p)) {
    if (APPLY) write(p, target);
    return { file:p, ok:true, changed:true };
  }
  return patchFile(p, (s) => {
    if (/globalThis\.__BeatBus/.test(s) && /@modules\/orchestration\/core\/BeatBus\.js/.test(s)) return s;
    return target;
  });
}

// --- Step B: ensure main boot imports (bridge + spine) ---
function ensureMainBoot() {
  const candidates = ['src/main.jsx', 'src/main.tsx'].map(f=>path.join(CWD,f));
  const file = candidates.find(exists);
  if (!file) return { file:'src/main.jsx', ok:false, reason:'missing (no main.jsx/tsx)' };

  return patchFile(file, (s) => {
    let out = s;

    // add bus-spine import
    if (!out.includes("@/orchestration/bus-spine.js")) {
      out = `import '@/orchestration/bus-spine.js';\n` + out;
    }
    // add state bridge boot (modules is sibling of src => ../modules)
    if (!out.includes("../modules/state/index.js")) {
      out = `import '../modules/state/index.js';\n` + out;
    }
    return out;
  });
}

// --- Step C: fix imports inside modules/** (no "@/modules") ---
function fixModulesImports() {
  const files = listFiles(MOD);
  let changed = 0, scanned = 0;
  for (const f of files) {
    const res = patchFile(f, (s) => {
      let out = s;

      // from "@/modules/..." -> from "@modules/..."
      out = out.replace(/from\s+['"]@\/modules\//g, "from '@modules/");
      out = out.replace(/import\(\s*['"]@\/modules\//g, "import('@modules/");

      // VERY common culprits:
      // modules/state/index.js importing EventDebugger with "@/..."
      // modules/state/core/StateValidator.js dynamic import of "@/modules/state/core/StateController"
      // After alias swap, optionally add .js for dynamic import clarity
      out = out.replace(
        /import\(\s*['"]@modules\/([^'"]+)['"]\s*\)/g,
        (m, pth) => {
          // if already has extension, leave it; else add .js
          if (/\.(js|mjs|cjs|ts|tsx|jsx)$/.test(pth)) return `import('@modules/${pth}')`;
          return `import('@modules/${pth}.js')`;
        }
      );

      // If file is in modules/state/core and imports StateController via alias,
      // prefer local relative for robustness.
      if (f.endsWith(path.join('modules','state','core','StateValidator.js'))) {
        out = out.replace(
          /import\(\s*['"]@modules\/state\/core\/StateController(?:\.js)?['"]\s*\)/g,
          "import('./StateController.js')"
        );
      }

      return out;
    });
    scanned++;
    if (res.changed) changed++;
  }
  return { file: MOD, ok:true, changed: changed>0, details:{scanned, changed} };
}

// --- Step D: fix imports inside src/** that point to modules via relative or "@/modules" ---
function fixSrcImports() {
  const files = listFiles(SRC);
  let changed = 0, scanned = 0;

  const relToModulesRE = new RegExp(String.raw`from\s+['"](\.\./)+modules/([^'"]+)['"]`, 'g');
  const relDynToModulesRE = new RegExp(String.raw`import\(\s*['"](\.\./)+modules/([^'"]+)['"]\s*\)`, 'g');

  for (const f of files) {
    const res = patchFile(f, (s) => {
      let out = s;

      // Convert any relative hops to @modules
      out = out.replace(relToModulesRE, (m, _, tail) => `from '@modules/${tail}'`);
      out = out.replace(relDynToModulesRE, (m, _, tail) => `import('@modules/${tail}')`);

      // Convert misused "@/modules" (which points to src/modules and 404s) to "@modules"
      out = out.replace(/from\s+['"]@\/modules\//g, "from '@modules/");
      out = out.replace(/import\(\s*['"]@\/modules\//g, "import('@modules/");

      return out;
    });
    scanned++;
    if (res.changed) changed++;
  }
  return { file: SRC, ok:true, changed: changed>0, details:{scanned, changed} };
}

// --- Step E: ensure vite alias '@modules' exists (read & warn only) ---
function verifyViteAlias() {
  const candidates = ['vite.config.js','vite.config.mjs','vite.config.ts'].map(f=>path.join(CWD,f));
  const file = candidates.find(exists);
  if (!file) return { file:'vite.config.js', ok:false, reason:'not found (skipped)' };
  const s = read(file) || '';
  const hasModules = /['"]@modules['"]\s*:\s*path\.resolve\([\s\S]*['"]\.\/modules['"]\)/.test(s);
  return { file, ok:true, changed:false, note: hasModules ? 'alias ok' : 'WARNING: @modules alias missing in vite config' };
}

// --- Step F: write report ---
(function main(){
  console.log('[v2-structure] apply =', APPLY ? 'yes' : 'no (dry run)');
  const r1 = ensureBusSpine();
  const r2 = ensureMainBoot();
  const r3 = fixModulesImports();
  const r4 = fixSrcImports();
  const r5 = verifyViteAlias();

  summaryRow('bus-spine', r1);
  summaryRow('main boot', r2);
  console.log(r3.ok ? `✔ modules/* imports fixed (scanned ${r3.details.scanned}, changed ${r3.details.changed})`
                    : '✗ modules/* pass failed');
  console.log(r4.ok ? `✔ src/* imports fixed (scanned ${r4.details.scanned}, changed ${r4.details.changed})`
                    : '✗ src/* pass failed');
  if (r5.note) console.log('ℹ', r5.note, '→', r5.file);

  if (!APPLY) console.log('\n(dry run) Re-run with --apply to write changes.');
})();

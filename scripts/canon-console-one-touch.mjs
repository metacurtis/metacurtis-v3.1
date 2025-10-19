#!/usr/bin/env node
/* canon-console-one-touch.mjs
 * Self-verifying, self-bootstrapping, idempotent two-phase wire-up for canon-console.
 * PHASE 1: enforce single injector, add guards, retire 0-byte stubs, wire App.jsx (DEV-only).
 * PHASE 2: generate report + verify invariants.
 *
 * Usage:
 *   node scripts/canon-console-one-touch.mjs [--dry-run] [--no-retire]
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const log = (...a)=>console.log('[CanonOneTouch]', ...a);
const warn= (...a)=>console.warn('[CanonOneTouch]', ...a);
const err = (...a)=>console.error('[CanonOneTouch]', ...a);

const DRY = process.argv.includes('--dry-run');
const NO_RETIRE = process.argv.includes('--no-retire');

const rel = p => path.relative(ROOT, p);
const exists = p => fs.existsSync(p);
const read  = p => fs.readFileSync(p,'utf8');
const write = (p, s) => fs.writeFileSync(p, s, 'utf8');
const mkdirp= p => fs.mkdirSync(p, {recursive:true});
const stat  = p => fs.statSync(p);

const BACKUPS = path.join(ROOT, '.canon_backups');
const REPORTS = path.join(ROOT, '.canon_reports');
mkdirp(BACKUPS); mkdirp(REPORTS);

function backup(p) {
  const stamp = new Date().toISOString().replace(/[:.]/g,'-');
  const dst = path.join(BACKUPS, rel(p).replace(/[\/\\]/g,'__') + '.bak.' + stamp);
  fs.cpSync(p, dst, {recursive:false});
  return dst;
}

function replaceOnce(content, pattern, replacement) {
  if (pattern.test(content)) return { changed:false, out:content };
  return { changed:true, out: replacement + content };
}

function insertAtTopIfMissing(file, needleRegex, insertText) {
  if (!exists(file)) return {changed:false, reason:'missing'};
  let src = read(file);
  if (needleRegex.test(src)) return {changed:false, reason:'present'};
  if (!DRY) { backup(file); write(file, insertText + '\n' + src); }
  return {changed:true};
}

function ensureSingleInjector() {
  const legacy = path.join(ROOT, 'canon-console/browser/inject.js');
  let changed = false, backed='';
  if (exists(legacy)) {
    if (!DRY) { backed = backup(legacy); fs.rmSync(legacy); }
    log('Removed legacy injector:', rel(legacy), backed?`(backup → ${rel(backed)})`: '');
    changed = true;
  }
  // Scrub obvious references in package scripts or helper scripts (best-effort)
  const candidates = ['package.json'].concat(
    fs.existsSync(path.join(ROOT,'scripts')) ? fs.readdirSync(path.join(ROOT,'scripts')).map(f=>'scripts/'+f) : []
  ).filter(f => exists(path.join(ROOT,f)) && stat(path.join(ROOT,f)).isFile());

  const regex = /console\/runtime\/inject\.js/g;
  for (const f of candidates) {
    const p = path.join(ROOT,f);
    let s = read(p);
    if (regex.test(s)) {
      if (!DRY) { backup(p); s = s.replace(regex, 'canon-console/browser/inject.js'); write(p, s); }
      log('Rewrote legacy injector reference in', f);
      changed = true;
    }
  }
  return changed;
}

function wireAppImport() {
  // Ensure App.jsx dev-only import exists (idempotent)
  const app = path.join(ROOT, 'src/App.jsx');
  if (!exists(app)) { warn('App.jsx not found at src/App.jsx — skipping wire.'); return false; }
  let src = read(app);
  const importLine = "void import('../canon-console/browser/inject.js');";
  const guardBlock =
`// DEV: load Canon Dev-OS injector (idempotent, browser-only)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ${importLine}
}`;
  if (src.includes(importLine) || src.includes('canon-console/browser/inject.js')) {
    log('App.jsx already wires the injector.');
    return false;
  }
  if (!DRY) { backup(app); src = guardBlock + '\n' + src; write(app, src); }
  log('Injected DEV-only import into src/App.jsx');
  return true;
}

function guardInjectorModule() {
  const inj = path.join(ROOT, 'canon-console/browser/inject.js');
  if (!exists(inj)) { warn('Injector not found:', rel(inj)); return false; }
  let src = read(inj);
  let changed = false;

  // DEV gate & idempotency
  if (!/__canonInjectorV3__/.test(src)) {
    const guard =
`// >>> Canon Dev-OS v3 Idempotency Guard <<<
if (typeof window !== 'undefined') {
  if (window.__canonInjectorV3__) {
    console.debug('[Canon] injector v3 already active');
    export default undefined;
  } else {
    window.__canonInjectorV3__ = { ts: Date.now(), loaded: {} };
  }
}
if (!(import.meta?.env?.DEV)) { export default undefined; }`;
    if (!DRY) { backup(inj); src = guard + '\n' + src; write(inj, src); }
    log('Added idempotency + DEV guard to injector.');
    changed = true;
  }

  // Ensure it marks loaded flags (best-effort)
  if (!/CANON_INJECTOR\s*\?\.\s*loaded/.test(src)) {
    // Add a tiny helper at bottom
    const helper =
`\n// Mark loaded helper (best-effort)
(window.CANON_INJECTOR ||= {}).loaded = Object.assign(
  { bridge:false, pilot:false, vtap:false, mini:false, hud:false, steps:false, plays:false },
  window.CANON_INJECTOR.loaded
);`;
    if (!DRY) { backup(inj); src = read(inj) + helper; write(inj, src); }
    log('Added loaded-state initializer to injector (non-invasive).');
    changed = true;
  }
  return changed;
}

function hardenHud() {
  const hud = path.join(ROOT, 'canon-console/runtime/hud.js');
  if (!exists(hud)) { warn('HUD v2 not found:', rel(hud)); return false; }
  const snippet = `
/* Kill legacy HUDs (defensive) */
(function enforceSingleHud(){
  const kill = () => {
    for (const id of ['canon-hud','canon_pilot_ui','canon-pilot-ui']) {
      const n = document.getElementById(id); if (n) n.remove();
    }
  };
  try {
    kill();
    new MutationObserver(kill).observe(document.documentElement,{childList:true,subtree:true});
  } catch {}
})();`;
  const src = read(hud);
  if (src.includes('enforceSingleHud')) { log('HUD v2 legacy-killer present.'); return false; }
  if (!DRY) { backup(hud); write(hud, src + '\n' + snippet + '\n'); }
  log('Appended legacy-HUD killer to HUD v2.');
  return true;
}

function retireStubs() {
  if (NO_RETIRE) { log('Retire skipped (--no-retire)'); return false; }
  const retireTargets = [
    'canon-console/browser/collectors/atomCollector.js',
    'canon-console/browser/collectors/eventCollector.js',
    'canon-console/browser/rules/importRules.js',
    'canon-console/browser/rules/shaderRules.js',
    'canon-console/agent/lib/analyzer.js',
    'canon-console/agent/lib/deduper.js',
    'canon-console/agent/lib/fingerprint.js',
    'canon-console/store/indexedDBStore.js',
    'canon-console/ui/ConsoleOverlay.jsx',
    'canon-console/ui/IncidentList.jsx',
    'canon-console/sinks/beatbusSink.js'
  ];
  const retiredDir = path.join(ROOT, 'canon-console/_retired');
  mkdirp(retiredDir);
  let moved = 0;
  for (const pRel of retireTargets) {
    const p = path.join(ROOT, pRel);
    if (!exists(p)) continue;
    const size = stat(p).size;
    const lines = read(p).split(/\r?\n/).length;
    // Only move truly empty/placeholder files
    if (size <= 10 || lines <= 2) {
      const dst = path.join(retiredDir, path.basename(p));
      if (!DRY) { backup(p); fs.renameSync(p, dst); }
      moved++;
      log('Retired stub →', rel(dst));
    }
  }
  return moved>0;
}

// Lightweight inventory + verify
function simpleInventory(dir) {
  const list = [];
  (function walk(d){
    for (const f of fs.readdirSync(d, {withFileTypes:true})) {
      const abs = path.join(d,f.name);
      if (f.isDirectory()) walk(abs);
      else list.push(abs);
    }
  })(dir);
  const isText = p => /\.(m?js|jsx|ts|tsx|json|md|css|html|cjs|mjs)$/i.test(p);
  const rows = list.filter(isText).map(p=>{
    const code = read(p);
    const flags = {
      INJ: /__canonInjectorV3__/.test(code),
      HUD: /__canonHudV2__|canon-hud-v2/.test(code),
      VTAP:/violation-?tap|CANON_VIOLATION/.test(code),
      GUARD:/bridge-guard|Canon\s*Guard/i.test(code),
      DOM: /document\./.test(code),
      WIN: /window\./.test(code),
    };
    return { file: rel(p), bytes: stat(p).size, loc: code.split(/\r?\n/).length, flags };
  });
  return rows.sort((a,b)=>a.file.localeCompare(b.file));
}

function writeReport(rows, outPath) {
  const md = [];
  md.push(`# canon-console One-Touch Report\n`);
  md.push(`- Generated: ${new Date().toISOString()}`);
  md.push(`- Files scanned: **${rows.length}**\n`);
  md.push(`| File | Bytes | LOC | Flags |\n|---|---:|---:|---|`);
  for (const r of rows) {
    const fl = Object.entries(r.flags).filter(([,v])=>v).map(([k])=>k).join(' ');
    md.push(`| \`${r.file}\` | ${r.bytes} | ${r.loc} | ${fl} |`);
  }
  write(outPath, md.join('\n'));
  log('Report →', rel(outPath));
}

// Verifications that should pass when clean
function verifyInvariants() {
  const fails = [];

  // A) Only modern injector import in repo (and App.jsx wires it)
  const app = path.join(ROOT,'src/App.jsx');
  if (!exists(app) || !read(app).includes("canon-console/browser/inject.js")) {
    fails.push('App.jsx missing DEV import of canon-console/browser/inject.js');
  }
  const legacy = path.join(ROOT,'canon-console/browser/inject.js');
  if (exists(legacy)) fails.push('Legacy injector file still exists: canon-console/browser/inject.js');

  // B) HUD presence
  const hud = path.join(ROOT,'canon-console/runtime/hud.js');
  if (!exists(hud)) fails.push('HUD v2 not found at canon-console/runtime/hud.js');

  // C) Injector guard present
  const inj = path.join(ROOT,'canon-console/browser/inject.js');
  if (!exists(inj)) fails.push('Injector not found at canon-console/browser/inject.js');
  else if (!/__canonInjectorV3__/.test(read(inj))) fails.push('Injector missing idempotency guard (__canonInjectorV3__)');

  return fails;
}

function main(){
  log('PHASE 1 — Bootstrap (idempotent)');
  const changed = {
    singleInjector: ensureSingleInjector(),
    appImport:      wireAppImport(),
    injGuard:       guardInjectorModule(),
    hudHarden:      hardenHud(),
    retire:         retireStubs(),
  };
  Object.entries(changed).forEach(([k,v])=> log(` - ${k}: ${v?'changed':'ok'}`));

  log('PHASE 2 — Verify & Report');
  const rows = simpleInventory(path.join(ROOT,'canon-console'));
  writeReport(rows, path.join(REPORTS,'canon-console-one-touch-report.md'));

  const fails = verifyInvariants();
  if (fails.length) {
    err('⛔ Verification FAILED:');
    fails.forEach(f=>err(' -', f));
    process.exit(1);
  } else {
    log('✅ Verification PASS — single injector, HUD v2 present, guards in place.');
    log('Tip: In DevTools run:');
    console.log(`await window.CANON_INJECTOR?.ready?.(); window.CANON_INJECTOR?.loaded;`);
    console.log(`typeof window.__canonHudV2__; document.getElementById('canon-hud-v2');`);
  }
}
main();

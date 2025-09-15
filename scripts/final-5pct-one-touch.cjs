#!/usr/bin/env node
/* Final 5% One-Touch — Canon+Sentinel Harmony
 * - Enforce MEMORY_FRAGMENT_TRIGGER everywhere
 * - Ensure ENGINE_VIEWPORT_HINT exists in EVENTS
 * - Keep EVENTS as named export; default export preserved
 * - Run Sentinel preflight; if fail → Agent apply → re-verify
 * - Idempotent; creates .bak timestamped backups on first writes
 */
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

const ROOT = process.cwd();
const SRC_DIRS = ['src', 'canon-console', 'console', 'scripts', 'modules']; // primary code areas

function exists(p){ try{ fs.accessSync(p); return true; } catch { return false; } }
function ensureDir(d){ if(!exists(d)) fs.mkdirSync(d,{recursive:true}); }
function read(p){ return exists(p) ? fs.readFileSync(p,'utf8') : ''; }
function backup(p){
  if (!exists(p)) return null;
  const bak = p + '.bak.' + Date.now();
  fs.copyFileSync(p, bak);
  return bak;
}
function writeAtomic(p, s){
  ensureDir(path.dirname(p));
  const old = read(p);
  if (old === s) return {changed:false};
  const bak = backup(p);
  fs.writeFileSync(p, s, 'utf8');
  return {changed:true, bak};
}
function patchFile(p, mutator){
  if (!exists(p)) return {skipped:true, reason:'missing'};
  const s = read(p);
  const out = mutator(s);
  if (out === false || out === s) return {changed:false};
  const bak = backup(p);
  fs.writeFileSync(p, out, 'utf8');
  return {changed:true, bak};
}
function logStep(msg){ console.log('\n\u25B6 ' + msg); }
function logOK(msg){ console.log('OK ' + msg); }
function logX(msg){ console.log('X  ' + msg); }
function tryRun(cmd, opts={}){
  try{ cp.execSync(cmd, {stdio:'inherit', ...opts}); return true; } catch { return false; }
}

/* A) EVENTS catalog: ensure parity + naming */
function patchEventsCatalog(){
  const evPath = path.join(ROOT, 'src/theater/events.js');
  if (!exists(evPath)) return {skipped:true, reason:'src/theater/events.js missing'};
  const res = patchFile(evPath, (s)=>{
    let t = s;

    // Ensure named export exists
    const hasNamed = /export\s+const\s+EVENTS\s*=\s*\{[\s\S]*?\}\s*;?/.test(t);
    if (!hasNamed) {
      // Try to locate an object with events; else inject minimal scaffold
      if (/export\s+default\s+EVENTS/.test(t) && /const\s+EVENTS\s*=/.test(t)) {
        // OK: there's a const EVENTS; convert to named if not already exported named
        // We keep as-is; fall through
      } else if (/export\s+default\s*\{/.test(t)) {
        // Replace default object with named + default re-export
        t = t.replace(/export\s+default\s*\{/, 'export const EVENTS = {');
        if (!/export\s+default\s+EVENTS/.test(t)) t += '\nexport default EVENTS;\n';
      } else if (!/const\s+EVENTS\s*=/.test(t)) {
        // Prepend a fresh scaffold if nothing found
        t = `export const EVENTS = {\n};\n` + t;
        if (!/export\s+default\s+EVENTS/.test(t)) t += '\nexport default EVENTS;\n';
      } else {
        // Ensure it's exported named
        t = t.replace(/(^|\n)\s*const\s+EVENTS\s*=/, '\nexport const EVENTS =');
        if (!/export\s+default\s+EVENTS/.test(t)) t += '\nexport default EVENTS;\n';
      }
    }

    // Guarantee ENGINE_VIEWPORT_HINT & MEMORY_FRAGMENT_TRIGGER entries
    function ensureKey(objSrc, key, valLiteral){
      if (new RegExp(`\\b${key}\\s*:`).test(objSrc)) return objSrc;
      // inject before closing }
      return objSrc.replace(/(EVENTS\s*=\s*\{[\s\S]*?)(\}\s*;?)/, (m, a, b)=> `${a}  ${key}: ${valLiteral},\n${b}`);
    }

    // Normalize EVENTS literal text area for robust insertion
    let eventsBlock = t.match(/export\s+const\s+EVENTS\s*=\s*\{[\s\S]*?\}\s*;?/);
    if (!eventsBlock) return t; // give up gracefully
    let evSrc = eventsBlock[0];

    // Ensure ENGINE_VIEWPORT_HINT
    evSrc = ensureKey(evSrc, 'ENGINE_VIEWPORT_HINT', `'ENGINE_VIEWPORT_HINT'`);

    // Ensure MEMORY_FRAGMENT_TRIGGER
    evSrc = ensureKey(evSrc, 'MEMORY_FRAGMENT_TRIGGER', `'MEMORY_FRAGMENT_TRIGGER'`);

    // If TRIGGER_FRAGMENT exists, alias it to MEMORY_FRAGMENT_TRIGGER to avoid hard break while we rewrite refs.
    if (!/\bTRIGGER_FRAGMENT\s*:/.test(evSrc)) {
      evSrc = ensureKey(evSrc, 'TRIGGER_FRAGMENT', `EVENTS.MEMORY_FRAGMENT_TRIGGER`);
    } else {
      // If present as its own string, remap to MEMORY_FRAGMENT_TRIGGER for safety.
      evSrc = evSrc.replace(/\bTRIGGER_FRAGMENT\s*:\s*['"]TRIGGER_FRAGMENT['"]/,
                            'TRIGGER_FRAGMENT: EVENTS.MEMORY_FRAGMENT_TRIGGER');
    }

    // Put the updated block back
    t = t.replace(/export\s+const\s+EVENTS\s*=\s*\{[\s\S]*?\}\s*;?/, evSrc);

    // Ensure default export line exists
    if (!/export\s+default\s+EVENTS\s*;?/.test(t)) t += '\nexport default EVENTS;\n';

    return t;
  });
  return res;
}

/* B) Repo-wide reference rewrite: TRIGGER_FRAGMENT -> MEMORY_FRAGMENT_TRIGGER */
function rewriteFragmentEverywhere(){
  const hits = [];
  function processFile(fp){
    if (!/\.(js|jsx|mjs|cjs|ts|tsx)$/.test(fp)) return;
    const rel = path.relative(ROOT, fp);
    const src = read(fp);
    if (!src) return;
    // Skip minified bundles/backups where risk > reward
    if (rel.startsWith('.hotdors_backups') || rel.startsWith('.fix-backups') || rel.startsWith('snapshots/') || rel.startsWith('rendering_bundle')) return;

    // Replace code patterns safely:
    // 1) EVENTS.MEMORY_FRAGMENT_TRIGGER -> EVENTS.MEMORY_FRAGMENT_TRIGGER
    // 2) 'TRIGGER_FRAGMENT'/'"TRIGGER_FRAGMENT"' event names in emit/on calls to MEMORY_FRAGMENT_TRIGGER (only when inside BeatBus emit/on)
    let out = src;

    out = out.replace(/\bEVENTS\.TRIGGER_FRAGMENT\b/g, 'EVENTS.MEMORY_FRAGMENT_TRIGGER');

    // Target BeatBus.emit(EVENTS.MEMORY_FRAGMENT_TRIGGER, ...) and BeatBus.on(EVENTS.MEMORY_FRAGMENT_TRIGGER, ...)
    out = out.replace(/BeatBus\.(emit|on)\(\s*(['"])TRIGGER_FRAGMENT\2\s*,/g, 'BeatBus.$1(EVENTS.MEMORY_FRAGMENT_TRIGGER,');

    // Avoid string replacements elsewhere to reduce false positives
    if (out !== src) {
      const {changed, bak} = writeAtomic(fp, out);
      if (changed) hits.push({file: rel, bak});
    }
  }

  function walk(d){
    const ents = fs.readdirSync(d, {withFileTypes:true});
    for (const e of ents){
      const p = path.join(d, e.name);
      if (e.isDirectory()){
        // skip node_modules / .git
        if (e.name === 'node_modules' || e.name === '.git') continue;
        walk(p);
      } else {
        processFile(p);
      }
    }
  }

  for (const base of SRC_DIRS){
    const dir = path.join(ROOT, base);
    if (exists(dir)) walk(dir);
  }
  return hits;
}

/* C) Ensure package.json scripts exist for Sentinel/Agent */
function ensurePkgScripts(){
  const pjPath = path.join(ROOT,'package.json');
  if (!exists(pjPath)) return {skipped:true, reason:'package.json missing'};
  const pj = JSON.parse(read(pjPath) || '{}');
  pj.scripts = pj.scripts || {};
  let changed = false;
  if (!pj.scripts['agent:run']) { pj.scripts['agent:run'] = 'node scripts/agent/runner.mjs'; changed = true; }
  if (!pj.scripts['validate:opening']) { pj.scripts['validate:opening'] = 'node scripts/verify-opening.mjs'; changed = true; }
  if (changed){
    fs.writeFileSync(pjPath, JSON.stringify(pj,null,2) + '\n', 'utf8');
  }
  return {changed};
}

/* D) Run Sentinel, optionally Agent apply, then re-verify */
function runSentinelAndMaybeAgent(){
  logStep('Running Sentinel preflight (validate:opening)');
  const ok = tryRun('npm run -s validate:opening');
  if (ok) { logOK('Sentinel: Opening sentinel OK'); return {ok:true}; }
  logX('Sentinel failed — applying Agent fencepost patches');
  const applied = tryRun('npm run -s agent:run -- --goal=opening:fencepost --apply');
  if (!applied) return {ok:false, msg:'Agent apply failed'};
  logStep('Re-running Sentinel after Agent apply');
  const ok2 = tryRun('npm run -s validate:opening');
  if (!ok2) return {ok:false, msg:'Sentinel still failing after Agent apply'};
  logOK('Sentinel: Opening sentinel OK after Agent apply');
  return {ok:true};
}

/* E) MAIN */
(function main(){
  console.log('\n=== Final 5% One-Touch — Canon+Sentinel Harmony ===');

  logStep('Patching events catalog for parity (ENGINE_VIEWPORT_HINT, MEMORY_FRAGMENT_TRIGGER, named EVENTS)');
  const ev = patchEventsCatalog();
  if (ev.skipped) logX(`Events catalog: ${ev.reason}`);
  else if (ev.changed) logOK(`Patched src/theater/events.js (backup: ${ev.bak || 'n/a'})`);
  else logOK('Events catalog already compliant');

  logStep('Rewriting TRIGGER_FRAGMENT -> MEMORY_FRAGMENT_TRIGGER across repo (code paths)');
  const rewrites = rewriteFragmentEverywhere();
  if (rewrites.length) {
    logOK(`Updated ${rewrites.length} file(s)`);
    rewrites.slice(0,6).forEach(h=>console.log('  •', h.file));
    if (rewrites.length > 6) console.log(`  …and ${rewrites.length-6} more`);
  } else {
    logOK('No outdated TRIGGER_FRAGMENT references found (or already unified)');
  }

  logStep('Ensuring package.json scripts for Sentinel/Agent');
  const pkg = ensurePkgScripts();
  if (pkg.skipped) logX(`package.json: ${pkg.reason}`);
  else if (pkg.changed) logOK('Added scripts: agent:run, validate:opening');
  else logOK('package.json scripts already present');

  const res = runSentinelAndMaybeAgent();
  if (!res.ok) {
    console.log('\nFinal status: \u274C  Sentinel not green.');
    if (res.msg) console.log('Reason:', res.msg);
    console.log('\nNext steps:\n  1) Inspect console output above for failing invariant(s)\n  2) Fix or re-run:\n     npm run agent:run -- --goal=opening:fencepost --apply\n     npm run validate:opening\n');
    process.exit(2);
  }

  console.log('\nFinal status: \u2705  All green. Harmony achieved.');
  console.log('\nNext steps:\n' +
    '  1) npm run dev\n' +
    "  2) In DevTools console (while wiring): localStorage.canonBusMode = 'TELEMETRY'; location.reload();\n" +
    '  3) Verify live: CANON_CONSOLE.stats(); CANON_PILOT.getState(); hotdors.selfverifyATS();\n' +
    "  4) Flip to STRICT when stable: localStorage.canonBusMode = 'STRICT'; location.reload();\n"
  );
})();

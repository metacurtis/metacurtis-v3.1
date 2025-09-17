#!/usr/bin/env node
/**
 * Canon Dev Audit — inventory & optional purge of non-Canon dev tools.
 * Usage:
 *   node scripts/canon-dev-audit.cjs           # inventory only
 *   node scripts/canon-dev-audit.cjs --purge   # purge known UI offenders
 *   node scripts/canon-dev-audit.cjs --patch   # patch injector & gate L2 UI
 *
 * Outputs:
 *   .canon_reports/dev-audit.json  (structured data)
 *   .canon_reports/dev-audit.md    (readable list)
 *   .canon_backups/<stamp>/...     (file backups when purging/patching)
 */
const fs = require('fs'); const path = require('path');

const ROOT = process.cwd();
const PURGE = process.argv.includes('--purge');
const PATCH = process.argv.includes('--patch');
const STAMP = new Date().toISOString().replace(/[:.]/g,'-');
const BACKDIR = p => path.join(ROOT, '.canon_backups', 'dev_audit_'+STAMP, p.replace(/[\\/]/g,'__')+'.bak');
const REPORT_DIR = path.join(ROOT, '.canon_reports');
fs.mkdirSync(REPORT_DIR, { recursive:true });

const IGNORE = new Set(['node_modules','.git','dist','build','.next','.vite','.canon_backups','.vercel']);
const EXTS = /\.(c?js|mjs|jsx|ts|tsx|json|md|html|css|glsl)$/i;

// Patterns that often indicate dev overlays/inspectors/injectors
const FILE_REGEXES = [
  /pilot-ui-mini\.js$/i,
  /mini.*hud/i, /hud.*v1/i, /dev[-_]?hud/i, /overlay/i,
  /inject.*(alt|dev|test)/i,
  /console.*l2.*inject/i,
  // webgl debug & perf helpers
  /stats(\.module|\.min)?\.js/i, /dat\.gui/i, /@?leva/i, /r3f-perf/i,
  /axeshelper/i, /gridhelper/i, /gizmos?/i, /inspector/i,
];

const TEXT_MARKERS = [
  'Mini HUD','Pilot L3','Canon L2','badge','perf panel','debug hud','overlay',
  'Stats.js','dat.GUI','r3f-perf','AxesHelper','GridHelper',
  'devtool','dev tools','__DEV__','HMR','inspector',
];

// Canon SSOT paths to KEEP
const KEEP = new Set([
  'canon-console/browser/inject.js',
  'canon-console/runtime/hud.js',
  'canon-console/runtime/hud-macro-core.js',
  'canon-console/runtime/bridge-guard.js',
  'canon-console/runtime/steps.js',
  'canon-console/runtime/playbooks.js',
]);

// Known offenders we can remove safely
const KNOWN_KILL = [
  'canon-console/runtime/pilot-ui-mini.js',
];

function walk(dir, out){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if (IGNORE.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p,out);
    else if (EXTS.test(ent.name)) out.push(p);
  }
}

function isSuspect(pathname, buf){
  if (FILE_REGEXES.some(rx => rx.test(pathname))) return true;
  if (!buf) return false;
  const text = buf.toString('utf8');
  return TEXT_MARKERS.some(m => text.includes(m));
}

function listImports(pathname, text){
  const im = [];
  const rx = /\bimport\s+(?:[^'"]+from\s+)?['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)/g;
  let m; while((m = rx.exec(text))) im.push(m[1]||m[2]);
  return im;
}

const files=[]; walk(ROOT, files);

// Build index & suspects
const index = new Map(); // path -> {imports:[], text}
const suspects = [];
for(const f of files){
  const rel = path.relative(ROOT, f);
  let buf=null; try{ buf=fs.readFileSync(f);}catch{}
  const txt = buf ? buf.toString('utf8') : '';
  index.set(rel, { imports:listImports(rel,txt), text:txt });
  if (isSuspect(rel, buf)) suspects.push(rel);
}

// Who-imports graph
const importers = new Map(); // target -> [importer...]
for(const [rel,{imports}] of index){
  for(const imp of imports){
    // Normalize relative imports into likely repo paths
    if (imp.startsWith('.') || imp.startsWith('/')){
      // best effort: try both with and without leading slash
      const guess = imp.replace(/^\//,'').replace(/^\.\//,'');
      const hits = [...index.keys()].filter(k => k.endsWith(guess) || k.endsWith(guess+'.js') || k.endsWith(guess+'.mjs') || k.endsWith(guess+'.jsx') || k.endsWith(guess+'.ts') || k.endsWith(guess+'.tsx'));
      for(const h of hits){
        if (!importers.has(h)) importers.set(h,[]);
        importers.get(h).push(rel);
      }
    } else {
      // package import — skip
    }
  }
}

// Group suspects by category
function categorize(p){
  const s=p.toLowerCase();
  if (s.includes('pilot-ui-mini')) return 'mini';
  if (/mini.*hud|hud.*v1|dev.*hud|overlay/.test(s)) return 'altHud';
  if (/inject.*(alt|dev|test)/.test(s) || s.includes('console') && s.includes('inject')) return 'injector';
  if (/stats|dat\.gui|leva|r3f-perf|axeshelper|gridhelper|inspector/.test(s)) return 'webglDev';
  return 'other';
}
const groups = { mini:[], altHud:[], injector:[], webglDev:[], other:[] };
for(const rel of suspects) groups[categorize(rel)].push(rel);

// Write reports
const report = {
  root: ROOT,
  timestamp: STAMP,
  counts: Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,v.length])),
  groups,
  importers: Object.fromEntries([...importers.entries()]),
};
fs.writeFileSync(path.join(REPORT_DIR,'dev-audit.json'), JSON.stringify(report,null,2));
fs.writeFileSync(path.join(REPORT_DIR,'dev-audit.md'),
  `# Canon Dev Audit (${STAMP})\n\n` +
  `## Summary\n` +
  Object.entries(report.counts).map(([k,c])=>`- ${k}: ${c}`).join('\n') + '\n\n' +
  `## Details\n` +
  Object.entries(groups).map(([k,arr])=>`### ${k}\n`+ (arr.length?arr.map(x=>`- ${x}`).join('\n'):'(none)')).join('\n\n') + '\n\n' +
  `## Importers (who references what)\n` +
  [...importers.entries()].map(([t,arr])=>`- ${t}\n  ${arr.map(x=>'  - '+x).join('\n')}`).join('\n')
);
console.log('📄 Report written to .canon_reports/dev-audit.{json,md}');

// Purge known offenders (with backups)
function backupWrite(rel, data){
  const abs = path.join(ROOT, rel);
  const back = BACKDIR(rel);
  fs.mkdirSync(path.dirname(back), { recursive:true });
  if (fs.existsSync(abs)) fs.copyFileSync(abs, back);
  fs.writeFileSync(abs, data);
}
function backupDelete(rel){
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return;
  const back = BACKDIR(rel);
  fs.mkdirSync(path.dirname(back), { recursive:true });
  fs.copyFileSync(abs, back);
  fs.rmSync(abs);
}

if (PURGE){
  console.log('\n🧹 Purge mode: removing known offenders…');
  for(const rel of KNOWN_KILL){
    if (fs.existsSync(path.join(ROOT, rel))){
      backupDelete(rel); console.log('  - deleted', rel);
    }
  }
  // Heuristic: kill obvious mini/alt HUDs (not HUD v2 itself)
  for(const rel of groups.mini.concat(groups.altHud)){
    if (KEEP.has(rel)) continue;
    if (/hud\.js$/.test(rel)) continue; // keep main HUD
    backupDelete(rel); console.log('  - deleted', rel);
  }
  // Heuristic: kill alternate dev injectors (not canon-console/browser/inject.js)
  for(const rel of groups.injector){
    if (rel !== 'canon-console/browser/inject.js'){
      backupDelete(rel); console.log('  - deleted', rel);
    }
  }
  // WebGL dev helpers: comment-out quick (non-destructive) by wrapping with noop guard
  for(const rel of groups.webglDev){
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    const src = fs.readFileSync(abs,'utf8');
    const wrapped = `/* Canon Dev Sweeper: disabled debug helper\n${src}\n*/\n`;
    backupWrite(rel, wrapped);
    console.log('  - disabled (commented)', rel);
  }
}

// Patch injector & L2 UI gates
if (PATCH){
  console.log('\n🩹 Patch mode: simplifying injector + gating L2 UI…');
  const injRel = 'canon-console/browser/inject.js';
  const injAbs = path.join(ROOT, injRel);
  if (fs.existsSync(injAbs)){
    const src = fs.readFileSync(injAbs,'utf8');
    let out = src;

    // Remove any pilot mini import chain
    out = out.replace(/\.then\(function\(\)\s*\{\s*return\s+imp\('runtime\/pilot-ui-mini\.js','mini'\);\s*\}\)/g, '');

    // Ensure HUD → MacroCore → ensureMacrosReady order exists once
    if (!/imp\('runtime\/hud-macro-core\.js','macros'\)/.test(out)){
      out = out.replace(
        /(imp\('runtime\/hud\.js'[\s\S]*?\)\s*\))/,
        `$1
      .then(function(){ return imp('runtime/hud-macro-core.js','macros'); })
      .then(function(){ return ensureMacrosReady(); })`
      );
    }

    // Write back
    backupWrite(injRel, out);
    console.log('  - patched', injRel);
  }

  // Gate L2 UI in console/runtime/inject.js if present
  const l2Rel = 'console/runtime/inject.js';
  const l2Abs = path.join(ROOT, l2Rel);
  if (fs.existsSync(l2Abs)){
    const src = fs.readFileSync(l2Abs,'utf8');
    let out = src;
    if (!/L2_UI_ENABLED/.test(out)){
      out = out.replace(
        /(function\(\)\s*\{\s*if\s*\(typeof window[^\n]*\)\s*return;[\s\S]*?window\.__CANON_L2__\s*=\s*true;)/,
        `$1
  const L2_UI_ENABLED = (localStorage.getItem('canonL2Ui') !== 'off') && !window.__CANON_NO_L2_UI__;`
      ).replace(/ensureUI\(\);/g, 'if (L2_UI_ENABLED) ensureUI();')
       .replace(/updateUI\(\);/g, 'if (L2_UI_ENABLED) updateUI();');
      backupWrite(l2Rel, out);
      console.log('  - gated L2 UI', l2Rel);
    } else {
      console.log('  - L2 UI already gated', l2Rel);
    }
  }

  // Ensure HUD presence flag in HUD v2
  const hudRel = 'canon-console/runtime/hud.js';
  const hudAbs = path.join(ROOT, hudRel);
  if (fs.existsSync(hudAbs)){
    const src = fs.readFileSync(hudAbs,'utf8');
    if (!/__canonHudV2__\s*=/.test(src)){
      const out = src.replace(
        /(if\s*\(window\.__canonHudV2Integrated__\)\s*return;\s*window\.__canonHudV2Integrated__\s*=\s*true;)/,
        `$1
  // Canonical HUD presence flag
  window.__canonHudV2__ = true;`
      );
      backupWrite(hudRel, out);
      console.log('  - added HUD presence flag', hudRel);
    }
  }
}

console.log('\n✅ Done.');

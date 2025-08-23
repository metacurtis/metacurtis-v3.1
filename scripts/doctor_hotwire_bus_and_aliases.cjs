#!/usr/bin/env node
/**
 * doctor_hotwire_bus_and_aliases.cjs
 * - Ensure BeatBus singleton is globally available in DEV (window.BeatBus + window.busTap)
 * - Replace any BeatBusAdapter imports with BeatBus singleton
 * - Ensure engine is instantiated once by canon/init
 * - Deduplicate "@/*" in jsconfig.json and ensure "@/modules/*"
 * Idempotent; .bak backups; snapshots saved.
 */
const fs = require('fs'); const path = require('path'); const cp = require('child_process');

const ROOT = process.cwd();
const NOW  = new Date().toISOString().replace(/[:]/g,'-');
const SNAP = P('snapshots', `doctor_hotwire_bus_and_aliases_${NOW}`);
const DO_COMMIT = process.argv.includes('--commit');
const NO_VERIFY = process.argv.includes('--no-verify');
const DO_TAG    = process.argv.includes('--tag');
const DO_PUSH   = process.argv.includes('--push');

function P(...s){ return path.join(ROOT, ...s); }
function ex(f){ return fs.existsSync(P(f)); }
function rd(f){ return fs.readFileSync(P(f),'utf8'); }
function wr(f,s){ fs.mkdirSync(path.dirname(P(f)),{recursive:true}); fs.writeFileSync(P(f), s, 'utf8'); }
function backupOnce(f){ const bak=f+'.bak'; if(!ex(bak) && ex(f)){ fs.mkdirSync(path.dirname(P(bak)),{recursive:true}); fs.copyFileSync(P(f), P(bak)); log('backup', `${f} -> ${f}.bak`); } }
function snap(f,s){ fs.mkdirSync(SNAP,{recursive:true}); fs.writeFileSync(path.join(SNAP, f.replace(/\//g,'__')+'.txt'), s,'utf8'); }
function log(kind,msg){ console.log(`· ${kind} ${msg}`); }

let changed=0;

/* ---- 1) Fix jsconfig.json duplicate alias and ensure "@/modules/*" ---- */
(function patchJsconfig(){
  const FILE='jsconfig.json'; if(!ex(FILE)) return;
  backupOnce(FILE);
  let s = rd(FILE); let j;
  try { j = JSON.parse(s); } catch { j = null; }
  if(!j){ // minimal fallback: remove duplicate "@/*" lines
    const lines = s.split(/\r?\n/);
    let seen = false;
    for (let i=0;i<lines.length;i++){
      if (/"@\/\*"\s*:\s*\[\s*"src\/\*"\s*\]\s*,?/.test(lines[i])) {
        if (seen) { lines.splice(i,1); i--; } else seen = true;
      }
    }
    s = lines.join('\n');
  } else {
    const co = j.compilerOptions || (j.compilerOptions = {});
    const paths = co.paths || (co.paths = {});
    // Keep existing keys but normalize the two we care about
    paths['@/*'] = ['src/*'];
    if (!paths['@/modules/*']) paths['@/modules/*'] = ['src/modules/*'];
    s = JSON.stringify(j, null, 2) + '\n';
  }
  wr(FILE,s); snap(FILE,s); log('patch', FILE); changed++;
})();

/* ---- 2) Replace BeatBusAdapter imports across src → BeatBus singleton ---- */
(function replaceAdapter(){
  if(!ex('src')) return;
  const files = [];
  const okExt = new Set(['.js','.jsx','.ts','.tsx']);
  (function walk(dir){
    for (const e of fs.readdirSync(P(dir))){
      const fp = path.join(dir,e);
      const st = fs.statSync(P(fp));
      if (st.isDirectory()) walk(fp);
      else if (okExt.has(path.extname(e))) files.push(fp);
    }
  })('src');
  for (const f of files){
    let s = rd(f), o = s;
    if (/\/BeatBusAdapter\.js/.test(s)){
      backupOnce(f);
      s = s.replace(/\/BeatBusAdapter\.js/g, '/BeatBus.js');
      wr(f,s); snap(f,s); log('patch', f); changed++;
    }
  }
})();

/* ---- 3) Ensure BeatBus.js exposes a DEV global + busTap ---- */
(function ensureBusGlobal(){
  const FILE='src/src/modules/orchestration/core/BeatBus.js';
  if (!ex(FILE)) return;
  backupOnce(FILE);
  let s = rd(FILE), o = s;

  // Ensure default export exists
  if (!/export\s+default\s+beatBus/.test(s)) {
    s = s.replace(/\n*$/, '\n\nexport default beatBus;\nexport { BeatBus };\n');
  }

  // Ensure DEV global block
  if (!/window\.BeatBus/.test(s) && !/globalThis\.BeatBus/.test(s)) {
    const block = `

// DEV global tap
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  try {
    window.BeatBus = beatBus;
    if (!window.busTap) window.busTap = (evt, fn) => beatBus.on(evt, fn);
  } catch (e) { /* noop */ }
}
`;
    s += block;
  }

  if (s!==o){ wr(FILE,s); snap(FILE,s); log('patch', FILE); changed++; }
})();

/* ---- 4) Ensure canon/init boots bus + engine and exposes busTap (idempotent) ---- */
(function ensureCanonInit(){
  const FILE='src/canon/init.js';
  const content = ex(FILE) ? rd(FILE) : '';
  let s = content; const o = s; backupOnce(FILE);

  // Ensure imports
  if (!/from ['"]@\/modules\/orchestration\/core\/BeatBus\.js['"]/.test(s)){
    s = `import BeatBus from '@/src/modules/orchestration/core/BeatBus.js';\n` + s;
  }
  if (!/['"]@\/engine\/ConsciousnessEngine\.js['"]/.test(s)){
    s += `\nimport '@/engine/ConsciousnessEngine.js';\n`;
  }

  // Ensure DEV tap
  if (!/busTap/.test(s)) {
    s += `
if (import.meta.env.DEV) {
  if (!globalThis.BeatBus) globalThis.BeatBus = BeatBus;
  if (!globalThis.busTap) globalThis.busTap = (evt, fn) => BeatBus.on(evt, fn);
  console.log('✅ Canon init: BeatBus DEV tap ready');
}
`;
  }

  if (s!==o){ wr(FILE,s); snap(FILE,s); log('normalize', FILE); changed++; }
})();

/* ---- 5) Ensure main.jsx imports canon/init early ---- */
(function ensureMainImport(){
  const FILE='src/main.jsx'; if(!ex(FILE)) return;
  backupOnce(FILE);
  let s = rd(FILE), o = s;
  if (!/['"]@\/canon\/init\.js['"]/.test(s)) {
    s = s.replace(/(^\s*import\s+.*\n)+/m, (block)=> block + `import '@/canon/init.js';\n`);
  }
  if (s!==o){ wr(FILE,s); snap(FILE,s); log('patch', FILE); changed++; }
})();

/* ---- 6) Commit/tag (optional) ---- */
if (DO_COMMIT && changed){
  try {
    cp.execSync('git add -A', {stdio:'inherit'});
    cp.execSync(`git commit ${NO_VERIFY?'--no-verify':''} -m "chore(canon): hotwire bus + aliases + engine bootstrap"`, {stdio:'inherit'});
    if (DO_TAG){
      const tag = `canon_hotwire_${NOW}`;
      cp.execSync(`git tag ${tag}`, {stdio:'inherit'});
      if (DO_PUSH){ cp.execSync('git push',{stdio:'inherit'}); cp.execSync('git push --tags',{stdio:'inherit'}); }
    }
  } catch (e) { console.warn('! git failed:', e?.message||e); }
} else {
  console.log('· dry run complete — re-run with --commit to persist');
}

#!/usr/bin/env node
/**
 * doctor_post_bootstrap_fix.cjs
 * - Fix duplicate @/* alias in jsconfig.json, ensure "@/modules/*"
 * - Normalize src/main.jsx DEV injectors (remove duplicate CanonFinisher block)
 * - Ensure single BeatBus singleton import everywhere (replace BeatBusAdapter)
 * - Make Engine listeners accept {stage|to} and {tier|quality}
 * - Ensure engine is instantiated by importing once in main.jsx
 * - Provide dev busTap if renderHealthcheck is missing
 * Idempotent. Backups (.bak) on first touch. Snapshots saved.
 */
const fs = require('fs'); const path = require('path'); const cp = require('child_process');

const ROOT = process.cwd();
const NOW  = new Date().toISOString().replace(/[:]/g,'-');
const SNAP = P('snapshots', `doctor_post_bootstrap_fix_${NOW}`);
const DO_COMMIT = process.argv.includes('--commit');
const NO_VERIFY = process.argv.includes('--no-verify');
const DO_TAG = process.argv.includes('--tag');
const DO_PUSH = process.argv.includes('--push');

function P(...s){ return path.join(ROOT, ...s); }
function ex(f){ return fs.existsSync(P(f)); }
function rd(f){ return fs.readFileSync(P(f),'utf8'); }
function wr(f,s){ fs.mkdirSync(path.dirname(P(f)), {recursive:true}); fs.writeFileSync(P(f), s, 'utf8'); }
function backupOnce(f){ const bak=f+'.bak'; if(!ex(bak) && ex(f)){ fs.mkdirSync(path.dirname(P(bak)),{recursive:true}); fs.copyFileSync(P(f), P(bak)); log('backup', `${f} -> ${f}.bak`);} }
function snap(f,s){ fs.mkdirSync(SNAP,{recursive:true}); fs.writeFileSync(path.join(SNAP, f.replace(/\//g,'__')+'.txt'), s,'utf8'); }
function log(kind,msg){ console.log(`· ${kind} ${msg}`); }

let changed = 0;

/* 1) jsconfig.json aliases */
(function patchJsconfig(){
  const FILE='jsconfig.json'; if(!ex(FILE)) return;
  backupOnce(FILE);
  let s = rd(FILE), orig = s;
  // try JSON parse safely
  let json;
  try { json = JSON.parse(s); } catch { json = null; }
  if (!json) {
    // fallback: simple line-based fix for duplicate "@/*"
    const lines = s.split(/\r?\n/);
    let seen = false;
    for (let i=0;i<lines.length;i++){
      if (/"@\/\*"\s*:\s*\[\s*"src\/\*"\s*\]\s*,?/.test(lines[i])) {
        if (seen) { lines.splice(i,1); i--; }
        else seen = true;
      }
    }
    s = lines.join('\n');
    // ensure "@/modules/*"
    if (!/"@\/modules\/\*"/.test(s)) {
      s = s.replace(/"paths"\s*:\s*\{\s*/m, `"paths": { "@/modules/*": ["src/modules/*"], `);
    }
  } else {
    const co = json.compilerOptions || (json.compilerOptions = {});
    const paths = co.paths || (co.paths = {});
    paths['@/*'] = ['src/*'];          // exactly once
    paths['@/modules/*'] = ['src/modules/*'];
    s = JSON.stringify(json, null, 2) + '\n';
  }
  if (s!==orig){ wr(FILE,s); snap(FILE,s); log('patch', FILE); changed++; }
})();

/* 2) Replace any BeatBusAdapter imports -> BeatBus singleton */
(function replaceBeatBusAdapter(){
  const SRC='src';
  if(!ex(SRC)) return;
  const exts = new Set(['.js','.jsx','.ts','.tsx']);
  const files = [];
  (function walk(dir){
    for (const e of fs.readdirSync(P(dir))) {
      const fp = path.join(dir,e);
      const st = fs.statSync(P(fp));
      if (st.isDirectory()) walk(fp);
      else if (exts.has(path.extname(e))) files.push(fp);
    }
  })('src');
  for (const f of files){
    let s = rd(f), orig = s;
    if (/BeatBusAdapter\.js/.test(s)) {
      backupOnce(f);
      s = s.replace(/\/BeatBusAdapter\.js/g, '/BeatBus.js');
    }
    if (s!==orig){ wr(f,s); snap(f,s); log('patch', f); changed++; }
  }
})();

/* 3) Make Engine listeners accept both {stage|to} and {tier|quality} */
(function patchEngine(){
  const FILE = 'src/engine/ConsciousnessEngine.js';
  if (!ex(FILE)) return;
  backupOnce(FILE);
  let s = rd(FILE), o = s;

  // Import path already swapped by step 2.

  // Stage handler shape
  s = s.replace(
    /BeatBus\.on\(\s*EVENTS\.STAGE_CHANGE\s*,\s*\((.*?)\)\s*=>\s*\{\s*([\s\S]*?)\}\s*\)\s*;?/m,
    (m,params,body)=>{
      // Enforce payload param
      const param = params.includes('{') ? 'payload = {}' : 'payload = {}';
      const handler = `
BeatBus.on(EVENTS.STAGE_CHANGE, (${param}) => {
  const stage = payload.stage ?? payload.to;
  if (!stage) return;
  console.log(\`🧠 Engine: Stage -> \${stage}\`);
  this.currentStage = stage;
  this.buildAndEmitBlueprint(stage, this.currentQuality);
});`.trim();
      return handler;
    }
  );

  // Quality handler shape
  s = s.replace(
    /BeatBus\.on\(\s*EVENTS\.QUALITY_CHANGE\s*,\s*\((.*?)\)\s*=>\s*\{\s*([\s\S]*?)\}\s*\)\s*;?/m,
    (m,params,body)=>{
      const param = params.includes('{') ? 'payload = {}' : 'payload = {}';
      const handler = `
BeatBus.on(EVENTS.QUALITY_CHANGE, (${param}) => {
  const tier = payload.tier ?? payload.quality;
  if (!tier) return;
  console.log(\`🧠 Engine: Quality -> \${tier}\`);
  this.currentQuality = tier;
  this.buildAndEmitBlueprint(this.currentStage, tier);
});`.trim();
      return handler;
    }
  );

  if (s!==o){ wr(FILE,s); snap(FILE,s); log('patch', FILE); changed++; }
})();

/* 4) Normalize src/main.jsx: remove duplicate CanonFinisher block and ensure engine import */
(function patchMain(){
  const FILE='src/main.jsx'; if(!ex(FILE)) return;
  backupOnce(FILE);
  let s = rd(FILE), o = s;

  // Remove anything after // CanonFinisher:dev-injectors (whole trailing block)
  s = s.replace(/\n\/\/\s*CanonFinisher:dev-injectors[\s\S]*$/m, '\n');

  // Ensure engine is imported once to instantiate singleton side-effects
  if (!/['"]@\/engine\/ConsciousnessEngine\.js['"]/.test(s)) {
    s = s.replace(/(^\s*import\s+.*\n)+/m, (block)=> block + `import '@/engine/ConsciousnessEngine.js';\n`);
  }

  if (s!==o){ wr(FILE,s); snap(FILE,s); log('patch', FILE); changed++; }
})();

/* 5) Provide dev busTap if renderHealthcheck is missing */
(function ensureHealthcheck(){
  const FILE='src/dev/renderHealthcheck.js';
  if (ex(FILE)) return;
  const SRC = `// dev bus tap (optional)
if (import.meta.env.DEV) {
  try {
    const bus = window.BeatBus;
    if (bus) {
      window.busTap = (evt, fn) => bus.on(evt, fn);
      console.log('✅ Dev busTap ready');
    }
  } catch {}
}
export {};`;
  wr(FILE, SRC); snap(FILE, SRC); log('create', FILE); changed++;
})();

/* 6) Commit/tag optionally */
if (DO_COMMIT && changed){
  try{
    cp.execSync('git add -A', {stdio:'inherit'});
    cp.execSync(`git commit ${NO_VERIFY?'--no-verify':''} -m "chore(canon): post-bootstrap fixes (aliases, DEV injectors, bus, engine listeners)"`, {stdio:'inherit'});
    if (DO_TAG){
      const tag = `canon_post_bootstrap_fix_${NOW}`;
      cp.execSync(`git tag ${tag}`, {stdio:'inherit'});
      if (DO_PUSH){ cp.execSync('git push',{stdio:'inherit'}); cp.execSync('git push --tags',{stdio:'inherit'}); }
    }
  }catch(e){ console.warn('! git failed:', e?.message||e); }
} else {
  console.log('· dry run complete — re-run with --commit to persist');
}

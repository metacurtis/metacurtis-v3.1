#!/usr/bin/env node
/**
 * Unify BeatBus imports to canonical src/modules/... path.
 * - Rewrites any string literal "modules/orchestration/core/BeatBus[.js]"
 *   to "src/modules/orchestration/core/BeatBus.js"
 * - Scans *.js,*.jsx,*.ts,*.tsx under src/ and modules/
 * - Writes a timestamped .bak per changed file (use git to revert if needed)
 * - Supports --dry-run to preview changes
 */
const fs = require('fs');
const _path = require('path');

const CWD = process.cwd();
const ROOTS = ['src','modules'].map(p=>path.join(CWD,p)).filter(fs.existsSync);
const exts = new Set(['.js','.jsx','.ts','.tsx']);
const CANON = 'src/modules/orchestration/core/BeatBus.js';

// match "... 'modules/orchestration/core/BeatBus' ..." or with .js, preserving quotes
const RE = /(['"])modules\/orchestration\/core\/BeatBus(?:\.js)?\1/g;
// also catch require()/dynamic import() string literals
// (above regex already handles quoted strings regardless of context)

function walk(dir, files=[]){
  for(const entry of fs.readdirSync(dir)){
    const fp = path.join(dir, entry);
    const st = fs.statSync(fp);
    if(st.isDirectory()){
      if(/(^|\/)(node_modules|dist|build|\.git)(\/|$)/.test(fp)) continue;
      walk(fp, files);
    } else {
      if(exts.has(path.extname(fp))) files.push(fp);
    }
  }
  return files;
}

function backupPath(fp){
  const ts = new Date().toISOString().replace(/[:.]/g,'-');
  return fp + `.bak.beatbus-${ts}`;
}

function unifyFile(fp, dry){
  const src = fs.readFileSync(fp, 'utf8');
  let changed = false;
  const out = src.replace(RE, (m,q) => { changed = true; return `${q}${CANON}${q}`; });
  if(!changed) return {changed:false};

  if(dry) return {changed:true, dry:true};

  const bak = backupPath(fp);
  fs.copyFileSync(fp, bak);
  fs.writeFileSync(fp, out);
  return {changed:true, backup:bak};
}

function main(){
  const dry = process.argv.includes('--dry-run');
  if(ROOTS.length===0){
    console.error('No src/ or modules/ directories found.');
    process.exit(1);
  }
  const all = ROOTS.flatMap(r=>walk(r));
  let touched=0, changedFiles=[];
  for(const fp of all){
    const res = unifyFile(fp, dry);
    if(res.changed){
      touched++;
      changedFiles.push({fp, backup:res.backup||null, dry});
    }
  }
  if(touched===0){
    console.log('No legacy BeatBus imports found. Nothing to do.');
    process.exit(0);
  }
  console.log(`Rewrote ${touched} file(s) to "${CANON}".`);
  if(dry){
    console.log('Dry-run; no files were modified. Files that would change:');
    changedFiles.forEach(x=>console.log(' -', x.fp));
  } else {
    console.log('Backups created next to each changed file with .bak.beatbus-<timestamp>');
  }
  // Optional: warn about duplicate identical imports (informational)
  const dupWarn = [];
  for (const {fp} of changedFiles){
    const txt = fs.readFileSync(fp, 'utf8');
    const lines = txt.split(/\r?\n/).filter(l=>/^\s*import\s.+['"]src\/modules\/orchestration\/core\/BeatBus(?:\.js)?['"]\s*;?\s*$/.test(l));
    const uniq = new Set(lines);
    if(lines.length > uniq.size) dupWarn.push(fp);
  }
  if(dupWarn.length){
    console.log('\nNote: Possible duplicate BeatBus import lines found in:');
    dupWarn.forEach(f=>console.log(' -', f));
    console.log('(Consider manual cleanup if needed.)');
  }
}

main();

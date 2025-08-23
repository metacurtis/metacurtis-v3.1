#!/usr/bin/env node
/**
 * HOT-DORS Patch Kit
 * - Patch 1: sprintctl.cjs commit parser (proper +/− diffstats)
 * - Patch 2: hot-dors.cjs StateCore invariant (narrow heuristic)
 */
const fs = require('fs');
const path = require('path');

const CWD = process.cwd();
const TS = () => new Date().toISOString().replace(/[:.]/g,'-');

function backup(p){
  const bak = p + '.bak.' + TS();
  fs.copyFileSync(p, bak);
  return bak;
}
function write(p, s){
  fs.writeFileSync(p, s);
}
function ok(msg){ console.log('✔', msg); }
function fail(msg){ console.error('✖', msg); }

function patchSprintctl(){
  const p = path.join(CWD, 'scripts', 'sprintctl.cjs');
  if(!fs.existsSync(p)) return fail('scripts/sprintctl.cjs not found');
  const src = fs.readFileSync(p,'utf8');
  const sig = 'function commitListSinceUntil(sinceISO, untilISO)';
  const idx = src.indexOf(sig);
  if(idx === -1) return fail('commitListSinceUntil() not found in sprintctl');

  // find matching brace to replace whole function body
  const braceStart = src.indexOf('{', idx);
  let i = braceStart, depth = 0;
  for(; i < src.length; i++){
    const ch = src[i];
    if(ch === '{') depth++;
    else if(ch === '}'){
      depth--;
      if(depth === 0){ i++; break; }
    }
  }
  if(depth !== 0) return fail('brace parsing failed for sprintctl');
  const before = src.slice(0, idx);
  const after  = src.slice(i);

  const newFunc = `function commitListSinceUntil(sinceISO, untilISO){
  const hdr = '__CM__';
  const cmd = 'git log --reverse --since=\"' + sinceISO + '\" --until=\"' + untilISO + '\" ' +
              '--pretty=format:' + hdr + '%n%H%n%ct%n%an%n%ae%n%s --numstat';
  const raw = safeExec(cmd);
  if(!raw) return [];

  const lines = raw.split('\\n');
  const commits = [];
  let cur = null;
  let expect = 0; // next 5 header lines

  for(const line of lines){
    if(line === hdr){
      if(cur) commits.push(cur);
      cur = { sha:'', timestamp:0, authorName:'', authorEmail:'', subject:'', added:0, deleted:0, files:[] };
      expect = 5;
      continue;
    }
    if(expect > 0){
      const idx = 5 - expect;
      if(idx === 0) cur.sha = line.trim();
      if(idx === 1) cur.timestamp = Number(line.trim())*1000;
      if(idx === 2) cur.authorName = line;
      if(idx === 3) cur.authorEmail = line;
      if(idx === 4) cur.subject = line;
      expect--;
      continue;
    }
    if(!cur) continue;
    // numstat: added<TAB>deleted<TAB>path
    if(!line.trim()) continue;
    const parts = line.split('\\t');
    if(parts.length === 3){
      const a = parts[0] === '-' ? 0 : parseInt(parts[0],10);
      const d = parts[1] === '-' ? 0 : parseInt(parts[1],10);
      const p = parts[2];
      if(!Number.isNaN(a)) cur.added += a;
      if(!Number.isNaN(d)) cur.deleted += d;
      cur.files.push({ path:p, added: Number.isNaN(a)?0:a, deleted: Number.isNaN(d)?0:d });
    }
  }
  if(cur) commits.push(cur);
  return commits;
}
`;
  backup(p);
  write(p, before + newFunc + after);
  ok('Patched sprintctl.cjs: commitListSinceUntil()');
}

function patchHotDors(){
  const p = path.join(CWD, 'scripts', 'hot-dors.cjs');
  if(!fs.existsSync(p)) return fail('scripts/hot-dors.cjs not found');
  let s = fs.readFileSync(p,'utf8');

  // Replace the "2) StateCore" block up to "3) Single morph driver"
  const startRe = /\/\/\s*2\)\s*StateCore[^\n]*\n/;
  const startMatch = startRe.exec(s);
  if(!startMatch) return fail('Could not locate start of StateCore block');
  const startIdx = startMatch.index + startMatch[0].length;

  const endRe   = /\/\/\s*3\)\s*Single\s*morph\s*driver/;
  const endMatch = endRe.exec(s.slice(startIdx));
  if(!endMatch) return fail('Could not locate end marker for StateCore block');
  const endIdx = startIdx + endMatch.index;

  const newBlock = `// 2) StateCore is sole writer (heuristic, narrowed)
const offenders=[];
for (const f of files){
  if (/StateCore/.test(f.path)) continue;
  const content = f.content;

  const hasGlobalSC =
    /(?:window|globalThis)\\.SC\\s*=/.test(content);

  // React class setState (global-ish UI mutation we still want to flag)
  const hasReactSetState = /\\.setState\\(/.test(content);

  // Ignore generic "set(" calls (Maps, vectors, Zustand-style atom setters)
  // and anything under stores/atoms or createAtom files
  const isAtomFile =
    /stores\\/atoms\\//.test(f.path) || /createAtom|atomStore|zustand/.test(content);

  if ((hasGlobalSC || hasReactSetState) && !isAtomFile){
    offenders.push(f.path);
  }
}
r.stateCoreOnly.pass = offenders.length===0;
r.stateCoreOnly.violations = offenders;

`;

  const out = s.slice(0, startIdx) + newBlock + s.slice(endIdx);
  backup(p);
  write(p, out);
  ok('Patched hot-dors.cjs: narrowed StateCore heuristic');
}

(function main(){
  try{
    patchSprintctl();
    patchHotDors();
    ok('Done. You can now regenerate your report and re-run HOT-DORS.');
  }catch(e){
    fail(e.stack || e.message);
    process.exit(1);
  }
})();

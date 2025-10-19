#!/usr/bin/env node
/* eslint-env node */
/**
 * Repo Medicine — Sprint Recorder (sprintctl)
 * Purpose: timeboxed, evidence-based velocity capture for HOT-DORS governed repos.
 * Commands: --install | start [label...] | snapshot [--commit] [--no-verify] [note...]
 *           | note [text...] | stop [--commit] [--no-verify] [--tag] [--tag-prefix v= "sprint/"] [--push]
 *           | status | record-commit | report [sprintId]
 * Outputs:  doctor_artifacts/sprints/S-YYYYMMDD-HHMM(...)/{sprint.json, report.md, commits.json, hot-dors-*.json, *summary.md}
 * Hooks:    Installs .git/hooks/post-commit to auto-record commits when a sprint is active.
 * Active time: computed from beacon bursts (commits & snapshots) with idle-gap threshold (default 45m).
 *
 * Enhancements in this version:
 *  - Runs doctors automatically (doctor:all if present, else imports/atoms/render + hot-dors).
 *  - Optional commit on snapshot/stop with --commit (and --no-verify to bypass husky).
 *  - Optional tagging/push on stop: --tag [--tag-prefix sprint/] --push
 *  - Append-only NDJSON log (doctor_artifacts/sprint-log.ndjson).
 */

const fs = require('fs');
const _path = require('path');
const { execSync } = require('child_process');

const CWD = process.cwd();
const ART = (...p)=>path.join(CWD,'doctor_artifacts',...p);
const SPRINTS = ART('sprints');
const ACTIVE = ART('.sprint-active.json');
const NDJSON = ART('sprint-log.ndjson');
const EXIT = { OK:0, ERR:1 };

const IDLE_MINUTES = 45;         // gap threshold between beacons to count towards active time
const MIN_SESSION_MIN = 10;      // minimum credited length per session window

// ---------------- utils ----------------
function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p,{recursive:true}); }
function readJSON(p, fallback=null){ try{ return JSON.parse(fs.readFileSync(p,'utf8')); }catch{ return fallback; } }
function writeJSON(p, obj){ ensureDir(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(obj,null,2)); }
function nowISO(){ return new Date().toISOString(); }
function safeExec(cmd,opts={}){ try{ return execSync(cmd,{encoding:'utf8',stdio:['ignore','pipe','pipe'],...opts}).trim(); }catch(e){ return ''; } }
function appendNdjson(entry){ ensureDir(path.dirname(NDJSON)); fs.appendFileSync(NDJSON, JSON.stringify(entry) + '\n'); }

function haveHotDors(){
  if(fs.existsSync(path.join(CWD,'scripts','hot-dors.cjs'))) return 'node "scripts/hot-dors.cjs"';
  if(fs.existsSync(path.join(CWD,'hot-dors.cjs'))) return 'node "hot-dors.cjs"';
  return '';
}
function runHotDors(){
  const cmd = haveHotDors();
  if(!cmd) return { ok:false, reason:'hot-dors not found' };
  const out = safeExec(cmd, {stdio: 'pipe'});
  const rpt = readJSON(ART('hot-dors-report.json'), null);
  const sumPath = ART('hot-dors-summary.md');
  return { ok:true, out, report:rpt, summaryPath: fs.existsSync(sumPath)?sumPath:null };
}

function pkgScripts(){
  try { return (JSON.parse(fs.readFileSync(path.join(CWD,'package.json'),'utf8')).scripts)||{}; }
  catch { return {}; }
}
function runDoctors(){
  const s = pkgScripts();
  const runIf = (name) => s[name] ? (console.log(`→ running ${name}`), safeExec(`npm -s run ${name}`, { })) : '';
  if (s['doctor:all']) { runIf('doctor:all'); return; }
  runIf('doctor:imports');
  runIf('doctor:atoms');
  runIf('doctor:render');
  const cd = haveHotDors(); if (cd) safeExec(cd, {});
}

function gitBranch(){ return safeExec('git rev-parse --abbrev-ref HEAD') || 'unknown'; }
function gitUser(){ return { name: safeExec('git config user.name')||'unknown', email: safeExec('git config user.email')||'unknown' }; }
function gitHead(){ return safeExec('git rev-parse HEAD') || ''; }
function gitIsRepo(){ return !!safeExec('git rev-parse --is-inside-work-tree'); }
function gitAddAll(){ safeExec('git add -A'); }
function gitCommit(msg, { noVerify=false } = {}){
  const flag = noVerify ? ' --no-verify' : '';
  try { safeExec(`git commit${flag} -m ${JSON.stringify(msg)}`); return true; }
  catch (e) { return false; } // nothing to commit is fine
}
function gitTag(tagName, message=''){
  return safeExec(`git tag -a ${JSON.stringify(tagName)} -m ${JSON.stringify(message)}`, { }) || '';
}
function gitPush({ withTags=false } = {}){
  const branch = gitBranch();
  safeExec(`git push origin ${branch}`, { });
  if (withTags) safeExec('git push --tags', { });
}

function commitListSinceUntil(sinceISO, untilISO){
  const hdr = '__CM__';
  const cmd = 'git log --reverse --since="' + sinceISO + '" --until="' + untilISO + '" ' +
              '--pretty=format:' + hdr + '%n%H%n%ct%n%an%n%ae%n%s --numstat';
  const raw = safeExec(cmd);
  if(!raw) return [];
  const lines = raw.split('\n');
  const commits = [];
  let cur = null; let expect = 0;
  for(const line of lines){
    if(line === hdr){
      if(cur) commits.push(cur);
      cur = { sha:'', timestamp:0, authorName:'', authorEmail:'', subject:'', added:0, deleted:0, files:[] };
      expect = 5; continue;
    }
    if(expect > 0){
      const idx = 5 - expect;
      if(idx === 0) cur.sha = line.trim();
      if(idx === 1) cur.timestamp = Number(line.trim())*1000;
      if(idx === 2) cur.authorName = line;
      if(idx === 3) cur.authorEmail = line;
      if(idx === 4) cur.subject = line;
      expect--; continue;
    }
    if(!cur || !line.trim()) continue;
    const parts = line.split('\t');
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
function beaconsFrom(commits, snapshots){
  const ts = [];
  for(const c of commits) ts.push(c.timestamp);
  for(const s of snapshots) ts.push(new Date(s.when).getTime());
  return ts.sort((a,b)=>a-b);
}
function computeActiveMinutes(beaconTimes){
  if(beaconTimes.length===0) return 0;
  const idle = IDLE_MINUTES*60*1000;
  let sessions=[]; let sStart = beaconTimes[0], sEnd = beaconTimes[0];
  for(let i=1;i<beaconTimes.length;i++){
    const t = beaconTimes[i];
    if(t - sEnd <= idle){ sEnd = t; }
    else { sessions.push([sStart,sEnd]); sStart=t; sEnd=t; }
  }
  sessions.push([sStart,sEnd]);
  let totalMs=0;
  for(const [a,b] of sessions){
    const len = Math.max(b-a, MIN_SESSION_MIN*60*1000);
    totalMs += len;
  }
  return Math.round(totalMs/60000);
}
function sprintIdFrom(ts,label=''){
  const d = new Date(ts);
  const pad=n=>String(n).padStart(2,'0');
  const id = `S-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  const suffix = label ? '-'+label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') : '';
  return id + suffix;
}
function activeSprint(){
  const a = readJSON(ACTIVE,null);
  if(!a) return null;
  a.dir = path.join(SPRINTS, a.id);
  a.sprintPath = path.join(a.dir,'sprint.json');
  a.data = readJSON(a.sprintPath, a);
  return a;
}
function boolBadge(inv){
  if(!inv) return 'N/A';
  const pass = !!(inv.singleBus?.pass && inv.stateCoreOnly?.pass && inv.singleMorphDriver?.pass);
  return pass ? 'PASS' : 'FAIL';
}
function num(x){ return (x>0?'+':'') + String(x); }
function writeReportMD(dir, sprint){
  const md = `# Repo Medicine — Sprint Report
**Sprint:** ${sprint.id}  
**Label:** ${sprint.label||'-'}  
**Branch:** ${sprint.branch}  
**Start:** ${sprint.start}  
**Stop:**  ${sprint.stop||'-'}  

## HOT-DORS
- Start: Invariants = ${boolBadge(sprint.dorsStart?.sentinels?.invariants)}
- Stop:  Invariants = ${boolBadge(sprint.dorsStop?.sentinels?.invariants)}
- Delta Orphans: ${num(sprint.delta?.orphans)}  |  Perf Badge (stop): ${sprint.dorsStop?.sentinels?.performance?.badge?.toUpperCase()||'N/A'}

## Commits
- Count: ${sprint.commits?.length||0}
- Diffstat: +${sprint.stats?.added||0} / -${sprint.stats?.deleted||0}

## Active Time
- Beacons: ${sprint.beacons||0}
- Credited active minutes: ${sprint.activeMinutes||0} (~${(sprint.activeMinutes/60).toFixed(2)}h)

## Files
- HOT-DORS start: ${sprint.files?.dorsStart||'-'}
- HOT-DORS stop:  ${sprint.files?.dorsStop||'-'}
- Commits JSON:   ${sprint.files?.commits||'-'}

---
_This report is generated by sprintctl. Evidence lives under \`doctor_artifacts/sprints/${sprint.id}/\`._
`;
  fs.writeFileSync(path.join(dir,'report.md'), md);
}

// ---------------- arg parsing ----------------
function splitArgs(argv){
  const flags = {};
  const rest = [];
  for (const a of argv) {
    if (a.startsWith('--')) {
      const [k, ...vparts] = a.slice(2).split('=');
      const v = vparts.length ? vparts.join('=') : true;
      flags[k] = v;
    } else {
      rest.push(a);
    }
  }
  return { flags, text: rest.join(' ').trim() };
}

// ---------------- install ----------------
function install(){
  if(!gitIsRepo()){ console.error('Not a git repository.'); process.exit(EXIT.ERR); }
  ensureDir('scripts');
  // copy self if different path
  const target = path.join(CWD,'scripts','sprintctl.cjs');
  if(path.resolve(__filename)!==path.resolve(target)){
    fs.copyFileSync(__filename, target);
    console.log('Installed scripts/sprintctl.cjs');
  }
  // npm scripts
  const pkgPath = path.join(CWD,'package.json');
  const pkgRaw = fs.readFileSync(pkgPath,'utf8');
  const pkg = JSON.parse(pkgRaw);
  pkg.scripts = pkg.scripts||{};
  pkg.scripts['sprint:start']    = 'node scripts/sprintctl.cjs start';
  pkg.scripts['sprint:snapshot'] = 'node scripts/sprintctl.cjs snapshot';
  pkg.scripts['sprint:stop']     = 'node scripts/sprintctl.cjs stop';
  pkg.scripts['sprint:status']   = 'node scripts/sprintctl.cjs status';
  pkg.scripts['sprint:note']     = 'node scripts/sprintctl.cjs note';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg,null,2)+'\n');
  console.log('Added npm scripts: sprint:start | sprint:snapshot | sprint:stop | sprint:status | sprint:note');

  // git hook
  const hooksDir = path.join(CWD,'.git','hooks');
  ensureDir(hooksDir);
  const hookPath = path.join(hooksDir,'post-commit');
  const hook = `#!/usr/bin/env bash
# Repo Medicine — auto-record commit when sprint active
node scripts/sprintctl.cjs record-commit || true
`;
  fs.writeFileSync(hookPath, hook);
  try{ fs.chmodSync(hookPath, 0o755); }catch{}
  console.log('Installed .git/hooks/post-commit');

  console.log('Install complete.');
}

// --------------- commands ---------------
function cmdStart(label){
  if(!gitIsRepo()){ console.error('Not a git repository.'); process.exit(EXIT.ERR); }
  if(fs.existsSync(ACTIVE)){ console.error('A sprint is already active. Run: npm run sprint:status'); process.exit(EXIT.ERR); }
  ensureDir(SPRINTS);
  const start = nowISO();
  const id = sprintIdFrom(start, label);
  const dir = path.join(SPRINTS, id);
  ensureDir(dir);

  // Doctors (all) + HOT-DORS snapshot (start)
  runDoctors();
  const startSnap = runHotDors();
  const dorsStart = startSnap.report||null;
  if(dorsStart) writeJSON(path.join(dir,'hot-dors-start.json'), dorsStart);
  if(startSnap.summaryPath) fs.copyFileSync(startSnap.summaryPath, path.join(dir,'hot-dors-start-summary.md'));

  const meta = {
    id, label, branch: gitBranch(), start, stop:null,
    user: gitUser(), startHead: gitHead(),
    dorsStart, dorsStop:null, commits:[], stats:{added:0, deleted:0},
    snapshots:[{ when:start, kind:'start' }], beacons:1, activeMinutes:0,
    files:{
      dorsStart: dorsStart ? `doctor_artifacts/sprints/${id}/hot-dors-start.json` : null,
      dorsStop: null, commits: null
    }
  };
  writeJSON(path.join(dir,'sprint.json'), meta);
  writeJSON(ACTIVE, { id, label, start });

  appendNdjson({ ts:start, kind:'start', id, branch: meta.branch, user: meta.user });
  console.log(`Sprint started: ${id}`);
  console.log(`Folder: doctor_artifacts/sprints/${id}`);
}

function cmdSnapshot(note='', flags={}){
  const a = activeSprint();
  if(!a){ console.error('No active sprint. Run: npm run sprint:start'); process.exit(EXIT.ERR); }
  const dir = a.dir;
  const sprint = readJSON(a.sprintPath,{});
  // Run doctors + HOT-DORS
  runDoctors();
  const snap = runHotDors();
  const ts = nowISO().replace(/[:.]/g,'-');
  if(snap.report) writeJSON(path.join(dir,`snap-${ts}-hot-dors.json`), snap.report);
  if(snap.summaryPath) fs.copyFileSync(snap.summaryPath, path.join(dir,`snap-${ts}-summary.md`));

  sprint.snapshots = sprint.snapshots||[];
  const when = nowISO();
  sprint.snapshots.push({ when, kind:'manual', note: (note||'').trim()||undefined });
  sprint.beacons = (sprint.beacons||0) + 1;
  writeJSON(a.sprintPath, sprint);

  appendNdjson({ ts: when, kind:'snapshot', id: sprint.id, note });
  console.log('Snapshot captured.');

  // Optional commit with artifacts
  if (flags.commit) {
    const msg = `chore(sprint): snapshot — ${note || '(no note)'} [${sprint.id}]`;
    gitAddAll();
    const ok = gitCommit(`${msg}

Artifacts:
- doctor_artifacts/hot-dors-summary.md
- doctor_artifacts/imports-state-summary.md
- doctor_artifacts/atoms-summary.md
- doctor_artifacts/sprints/${sprint.id}/snap-${ts}-summary.md
`, { noVerify: !!flags['no-verify'] });
    console.log(ok ? '✓ Snapshot commit created.' : 'ⓘ No changes to commit.');
  }
}

function cmdNote(text){
  const a = activeSprint();
  if(!a){ console.error('No active sprint.'); process.exit(EXIT.ERR); }
  const s = readJSON(a.sprintPath,{});
  const when = nowISO();
  s.notes = s.notes||[];
  s.notes.push({ when, text: (text||'').trim() });
  writeJSON(a.sprintPath, s);
  appendNdjson({ ts: when, kind:'note', id: s.id, text });
  console.log('Note recorded.');
}

function cmdRecordCommit(){
  const a = activeSprint();
  if(!a) process.exit(EXIT.OK); // quietly ignore if not active
  const { id, dir } = a;
  const s = readJSON(a.sprintPath,{});
  // latest commit
  const sha = gitHead();
  const rec = commitListSinceUntil('1970-01-01T00:00:00Z', nowISO()).find(c=>c.sha===sha);
  if(!rec) process.exit(EXIT.OK);
  s.commits = s.commits||[];
  if(!s.commits.find(c=>c.sha===rec.sha)){
    s.commits.push(rec);
    s.stats = s.stats||{added:0,deleted:0};
    s.stats.added += rec.added; s.stats.deleted += rec.deleted;
    s.beacons = (s.beacons||0) + 1;
    writeJSON(path.join(dir,'sprint.json'), s);
    appendNdjson({ ts: nowISO(), kind:'commit', id, sha: rec.sha, added: rec.added, deleted: rec.deleted });
  }
  process.exit(EXIT.OK);
}

function cmdStop(flags={}){
  const a = activeSprint();
  if(!a){ console.error('No active sprint.'); process.exit(EXIT.ERR); }
  const dir = a.dir;
  const meta = readJSON(a.sprintPath,{});
  meta.stop = nowISO();
  meta.stopHead = gitHead();

  // Pull commits in window
  const commits = commitListSinceUntil(meta.start, meta.stop);
  meta.commits = commits;
  meta.files = meta.files || {};
  meta.files.commits = `doctor_artifacts/sprints/${meta.id}/commits.json`;
  writeJSON(path.join(dir,'commits.json'), commits);

  // Doctors + HOT-DORS end
  runDoctors();
  const endSnap = runHotDors();
  if(endSnap.report){ meta.dorsStop = endSnap.report; writeJSON(path.join(dir,'hot-dors-stop.json'), endSnap.report); meta.files.dorsStop = `doctor_artifacts/sprints/${meta.id}/hot-dors-stop.json`; }
  if(endSnap.summaryPath) fs.copyFileSync(endSnap.summaryPath, path.join(dir,'hot-dors-stop-summary.md'));

  // Active time via beacons (commits + snapshots)
  const beacons = beaconsFrom(commits, meta.snapshots||[]);
  meta.activeMinutes = computeActiveMinutes(beacons);

  // Diff metrics (orphans, etc.)
  const orphansStart = meta.dorsStart?.sentinels?.aliases?.trueOrphans?.length||0;
  const orphansStop  = meta.dorsStop?.sentinels?.aliases?.trueOrphans?.length||0;
  meta.delta = { orphans: orphansStop - orphansStart };

  writeJSON(path.join(dir,'sprint.json'), meta);
  writeReportMD(dir, meta);
  try{ fs.unlinkSync(ACTIVE); }catch{}
  appendNdjson({ ts: meta.stop, kind:'stop', id: meta.id, delta: meta.delta });

  console.log(`Sprint stopped: ${meta.id}`);
  console.log(`Evidence: doctor_artifacts/sprints/${meta.id}/report.md`);

  // Optional commit of artifacts + tag/push
  if (flags.commit) {
    const msg = `chore(sprint): stop — ${meta.id}

Artifacts:
- doctor_artifacts/sprints/${meta.id}/report.md
- doctor_artifacts/sprints/${meta.id}/hot-dors-stop-summary.md
- doctor_artifacts/hot-dors-summary.md
- doctor_artifacts/imports-state-summary.md
- doctor_artifacts/atoms-summary.md
`;
    gitAddAll();
    const ok = gitCommit(msg, { noVerify: !!flags['no-verify'] });
    console.log(ok ? '✓ Stop commit created.' : 'ⓘ No changes to commit.');
  }
  if (flags.tag) {
    const pref = typeof flags['tag-prefix'] === 'string' ? flags['tag-prefix'] : 'sprint/';
    const tagName = `${pref}${meta.id}`;
    gitTag(tagName, `Sprint ${meta.id}`);
    console.log(`✓ Tagged: ${tagName}`);
    if (flags.push) { gitPush({ withTags:true }); console.log('✓ Pushed branch and tags.'); }
  } else if (flags.push) {
    gitPush({ withTags:false }); console.log('✓ Pushed branch.');
  }
}

function cmdStatus(){
  const a = activeSprint();
  if(!a){ console.log('No active sprint.'); process.exit(EXIT.OK); }
  const s = readJSON(a.sprintPath,{});
  console.log(`Active sprint: ${s.id} (${s.label||'-'})`);
  console.log(`Started: ${s.start}  | Branch: ${s.branch}`);
  console.log(`Beacons: ${s.beacons||1}  | Commits so far: ${s.commits?.length||0}`);
}

function cmdReport(id){
  if(!id){
    if(!fs.existsSync(SPRINTS)){ console.log('No sprints found.'); return; }
    const ids = fs.readdirSync(SPRINTS).filter(n=>fs.statSync(path.join(SPRINTS,n)).isDirectory()).sort();
    if(ids.length===0){ console.log('No sprints found.'); return; }
    id = ids[ids.length-1];
  }
  const dir = path.join(SPRINTS, id);
  const s = readJSON(path.join(dir,'sprint.json'), null);
  if(!s){ console.error('Sprint not found:', id); process.exit(EXIT.ERR); }
  writeReportMD(dir, s);
  console.log(`Report regenerated: doctor_artifacts/sprints/${id}/report.md`);
}

// --------------- main ---------------
const [, , cmd, ...argv] = process.argv;
const { flags, text } = splitArgs(argv);

switch(cmd){
  case '--install': install(); break;
  case 'start':     cmdStart(text); break;
  case 'snapshot':  cmdSnapshot(text, flags); break;
  case 'note':      cmdNote(text); break;
  case 'stop':      cmdStop(flags); break;
  case 'status':    cmdStatus(); break;
  case 'record-commit': cmdRecordCommit(); break;
  case 'report':    cmdReport(argv[0]); break;
  default:
    console.log(`Sprint Recorder
Usage:
  node scripts/sprintctl.cjs --install
  npm run sprint:start -- "Label for this sprint"
  npm run sprint:snapshot -- "Optional note" [--commit] [--no-verify]
  npm run sprint:note -- "Freeform note or link"
  npm run sprint:stop -- [--commit] [--no-verify] [--tag] [--tag-prefix=sprint/] [--push]
  npm run sprint:status
  node scripts/sprintctl.cjs report [sprintId]
`);
}

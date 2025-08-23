#!/usr/bin/env node
// Repo Medicine — Sprint Timeline (pretty printer)
const fs = require('fs'), path = require('path');
const CWD = process.cwd(), BASE = path.join(CWD,'doctor_artifacts','sprints');
const tz = 'America/Chicago';
function latestId(){ if(!fs.existsSync(BASE)) return null;
  const ids = fs.readdirSync(BASE).filter(f=>fs.statSync(path.join(BASE,f)).isDirectory()).sort(); return ids.pop()||null; }
function pad(s,n){ s=String(s); return s.length>=n?s:s+' '.repeat(n-s.length); }
function fmt(ts){ return ts?new Date(ts).toLocaleString('en-US',{timeZone:tz}):'-'; }
const id = process.argv[2] || latestId(); if(!id){ console.error('No sprints found.'); process.exit(1); }
const sprintPath = path.join(BASE,id,'sprint.json');
if(!fs.existsSync(sprintPath)){ console.error('Not found:', sprintPath); process.exit(1); }
const s = JSON.parse(fs.readFileSync(sprintPath,'utf8'));
console.log(`# Sprint ${id}`);
console.log(`Branch: ${s.branch}`); console.log(`Start : ${fmt(s.start)}`); console.log(`Stop  : ${fmt(s.stop)}`);
console.log(`Active: ${s.activeMinutes||0} min\n`);
console.log('Snapshots:'); (s.snapshots||[]).forEach(x=>console.log(' -', pad(fmt(x.when),22), (x.kind||'manual'), x.note?`| ${x.note}`:'')); console.log('');
console.log('Commits:'); (s.commits||[]).forEach(c=>{
  const when = new Date(c.timestamp).toLocaleString('en-US',{timeZone:tz});
  console.log(' -', pad(when,22), c.sha.slice(0,7), '|', c.added+'+', c.deleted+'-', '|', c.subject);
}); console.log('');
console.log(`Files:\n - ${path.relative(CWD, sprintPath)}\n - ${path.relative(CWD, path.join(BASE,id,'hot-dors-start.json'))} (if present)\n - ${path.relative(CWD, path.join(BASE,id,'hot-dors-stop.json'))} (if present)`);

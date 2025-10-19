#!/usr/bin/env node
/* eslint-env node */
const fs=require('fs'), path=require('path'); const CWD=process.cwd();
const runs=path.join(CWD,'doctor_artifacts','runs.jsonl'); const out=path.join(CWD,'doctor_artifacts','metrics');
if(!fs.existsSync(runs)){ process.exit(0); }
const rows=fs.readFileSync(runs,'utf8').trim().split(/\n+/).map(l=>{try{return JSON.parse(l)}catch{return null}}).filter(Boolean);
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'runs.json'), JSON.stringify({rows},null,2));
const keys=[...new Set(rows.flatMap(r=>Object.keys(r)))];
const csv=[keys.join(',')].concat(rows.map(r=>keys.map(k=>String(r[k]??'').replace(/"/g,'""')).map(v=>(/[,\n"]/.test(v)?'"'+v+'"':v)).join(',')));
fs.writeFileSync(path.join(out,'runs.csv'), csv.join('\n'));
console.log('evidence-rollup: wrote', path.relative(CWD,path.join(out,'runs.json')), 'and .csv');

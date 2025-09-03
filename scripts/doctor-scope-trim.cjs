#!/usr/bin/env node
/* eslint-env node */
/**
 * doctor-scope-trim.cjs
 * Reduce HOT-DORS to: repo-medicine (perf + validate) + sprint recorder.
 * - Disables runtime bridge imports
 * - Ensures scripts
 * - Writes minimal pre-push gate (strict perf + record)
 * - Ensures a tiny evidence rollup if you don't already have one
 */
const fs = require('fs');
const _path = require('path');

const CWD = process.cwd();
const join = (...p)=>path.join(CWD, ...p);

function readJSON(p, d=null){ try{return JSON.parse(fs.readFileSync(p,'utf8'))}catch{ return d } }
function writeJSON(p, o){ fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p, JSON.stringify(o,null,2)+'\n'); }
function writeFile(p, s, mode){ fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p, s); if (mode) try{fs.chmodSync(p,mode)}catch{} }
function patchFile(p, edit){
  if (!fs.existsSync(p)) return {file:p, ok:false, reason:'missing'};
  const src = fs.readFileSync(p,'utf8');
  const out = edit(src);
  if (out !== src) { fs.writeFileSync(p,out); return {file:p, ok:true, changed:true}; }
  return {file:p, ok:true, changed:false};
}

const summary = [];

// 1) Core config: keep perf/evidence; disable runtime bits
const cfgPath = join('hot-dors.config.json');
const cfg = readJSON(cfgPath, {});
cfg.packs = cfg.packs || {};
cfg.packs.enable = ['perf-core','evidence']; // minimal, safe
cfg.packs.disable = ['runtime-bridge','import-rewriter','dev-bridge','stateflow'];
cfg.perf = cfg.perf || {};
if (typeof cfg.perf.fpsMin !== 'number') cfg.perf.fpsMin = 55;
writeJSON(cfgPath, cfg);
summary.push('config:minimal core enabled; runtime packs disabled; fpsMin set');

// 2) Remove runtime imports from src/main.jsx (idempotent)
const mainJsx = join('src','main.jsx');
const mainRes = patchFile(mainJsx, s =>
  s
  // comment OR remove known runtime side-effects if present
  .replace(/^\s*import\s+['"]\.\.\/modules\/state\/index\.js['"];\s*\n/gm, '')
  .replace(/^\s*import\s+['"]\.\.\/\.\.\/modules\/state\/index\.js['"];\s*\n/gm, '')
  .replace(/^\s*import\s+['"]@\/orchestration\/bus-spine\.js['"];\s*\n/gm, '')
);
summary.push(`src/main.jsx:${mainRes.changed?'runtime imports removed':'no runtime imports found'}`);

// 3) Ensure package scripts
const pkgPath = join('package.json');
const pkg = readJSON(pkgPath, {});
pkg.scripts = pkg.scripts || {};
pkg.scripts['doctor:perf'] = 'node scripts/doctor-perf.cjs';
pkg.scripts['doctor:perf:strict'] = 'node scripts/doctor-perf.cjs --strict-perf';
pkg.scripts['doctor:repo'] = pkg.scripts['doctor:repo'] || 'npm run validate && npm run doctor:perf';
pkg.scripts['evidence:rollup'] = pkg.scripts['evidence:rollup'] || 'node scripts/evidence-rollup.cjs';
writeJSON(pkgPath, pkg);
summary.push('package.json:scripts ensured (doctor:perf, :strict, doctor:repo, evidence:rollup)');

// 4) Minimal pre-push hook (strict floor + record); no other side-effects
const gitDir = join('.git');
if (fs.existsSync(gitDir)) {
  const hooks = join('.git','hooks');
  fs.mkdirSync(hooks, {recursive:true});
  const prePush = [
    '#!/usr/bin/env bash',
    'set -e',
    'if [ -f "scripts/doctor-perf.cjs" ]; then',
    '  # Strict floor, also append a JSONL record',
    '  node scripts/doctor-perf.cjs --strict-perf --record || exit $?',
    'fi'
  ].join('\n') + '\n';
  writeFile(join(' .git','hooks','pre-push').replace(' ','') , prePush, 0o755);
  summary.push('git:pre-push installed (strict perf + record)');
} else {
  summary.push('git:not a repo (hooks skipped)');
}

// 5) Ensure evidence-rollup if missing (reads runs.jsonl → metrics/{runs.json,runs.csv})
const rollPath = join('scripts','evidence-rollup.cjs');
if (!fs.existsSync(rollPath)) {
  const roll = `#!/usr/bin/env node
const fs=require('fs'), path=require('path'); const CWD=process.cwd();
const runs=path.join(CWD,'doctor_artifacts','runs.jsonl'); const out=path.join(CWD,'doctor_artifacts','metrics');
if(!fs.existsSync(runs)){ process.exit(0); }
const rows=fs.readFileSync(runs,'utf8').trim().split(/\\n+/).map(l=>{try{return JSON.parse(l)}catch{return null}}).filter(Boolean);
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'runs.json'), JSON.stringify({rows},null,2));
const keys=[...new Set(rows.flatMap(r=>Object.keys(r)))];
const csv=[keys.join(',')].concat(rows.map(r=>keys.map(k=>String(r[k]??'').replace(/"/g,'""')).map(v=>(/[,\\n"]/.test(v)?'"'+v+'"':v)).join(',')));
fs.writeFileSync(path.join(out,'runs.csv'), csv.join('\\n'));
console.log('evidence-rollup: wrote', path.relative(CWD,path.join(out,'runs.json')), 'and .csv');
`;
  writeFile(rollPath, roll, 0o755);
  summary.push('scripts:evidence-rollup seeded');
} else {
  summary.push('scripts:evidence-rollup exists');
}

console.log('[scope-trim] Done.');
summary.forEach(s=>console.log(' -', s));

/* eslint-env node */
import path from 'node:path';
import { detectOpeningIssues } from '../detectors/opening.mjs';
import { applyPatches } from '../patchers/opening.mjs';
export async function runGoal({ apply=false, cwd=process.cwd() } = {}){
  const issues = await detectOpeningIssues({ cwd });
  const errs = issues.filter(i => i.level !== 'warn');
  const warns = issues.filter(i => i.level === 'warn');

  if (!errs.length && !warns.length){ console.log('Fencepost: OK'); return 0; }
  if (errs.length){
    console.log('Fencepost issues:');
    for (const e of errs){ console.log(' - ' + e.msg); }
  }
  if (warns.length){
    for (const w of warns){ const rel = w.file ? path.relative(cwd, w.file) : ''; console.log('▲ ' + w.msg + (rel ? ' [' + rel + ']' : '')); }
  }
  if (apply && errs.length){
    const res = await applyPatches({ issues: errs, cwd });
    console.log(res.summary);
    const again = await detectOpeningIssues({ cwd });
    const left = again.filter(i => i.level !== 'warn');
    if (left.length){ console.log('Remaining:'); left.forEach(i => console.log(' - ' + i.msg)); return 1; }
    console.log('Fencepost: OK'); return 0;
  }
  return errs.length ? 1 : 0;
}

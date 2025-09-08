/* eslint-env node */
import fs from 'node:fs'; import path from 'node:path';

export async function runGoal({goal, apply=false, cwd=process.cwd()}){
  if(goal==='opening:fencepost'){ const { runFence } = await import('./runners/fencepost.mjs'); return runFence({apply,cwd}); }
  if(goal==='opening:visuals'){ const { runVisuals } = await import('./runners/visuals.mjs'); return runVisuals({cwd}); }
  if(goal==='opening:record'){ const { runRecord } = await import('./runners/record.mjs'); return runRecord({cwd}); }
  if(goal==='opening:phase1'){ const { runPhase1 } = await import('./runners/phase1.mjs'); return runPhase1({cwd}); }
  console.error('Unknown goal:', goal); return 2;
}

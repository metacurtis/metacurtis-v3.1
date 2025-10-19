#!/usr/bin/env node
/* eslint-env node */
import { runGoal } from './index.mjs';
const args=Object.fromEntries(process.argv.slice(2).filter(a=>/^--/.test(a)).map(a=>{const i=a.indexOf('=');return i>0?[a.slice(2,i),a.slice(i+1)]:[a.slice(2),true]}));
const goal=String(args.goal||''); const apply=!!args.apply;
if(!goal){ console.error('Usage: npm run agent:run -- --goal=opening:fencepost|opening:visuals|opening:record [--apply]'); process.exit(2); }
const code=await runGoal({goal,apply}); process.exit(code);

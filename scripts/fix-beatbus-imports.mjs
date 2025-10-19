#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');
const exts = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

const patterns = [
  { from: /@modules\/orchestration\/core\/BeatBus\.js/g, to: '@/theater/bus' },
  { from: /@\/modules\/orchestration\/core\/BeatBus\.js/g, to: '@/theater/bus' },
  { from: /(['"])@modules\/orchestration\/core\/BeatBus(['"])/g, to: '$1@/theater/bus$2' },
  { from: /(['"])@\/modules\/orchestration\/core\/BeatBus(['"])/g, to: '$1@/theater/bus$2' },
  // if any relative BeatBus.js slipped in:
  { from: /(['"])\.\/BeatBus\.js(['"])/g, to: '$1@/theater/bus$2' },
];

let changed = 0;
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else {
      if (!exts.has(path.extname(p))) continue;
      let s = fs.readFileSync(p, 'utf8');
      let out = s;
      for (const {from,to} of patterns) out = out.replace(from, to);
      if (out !== s) {
        fs.writeFileSync(p, out, 'utf8');
        console.log('✓ rewrote import in', p);
        changed++;
      }
    }
  }
}
walk(root);
console.log(changed ? `\nDone. Updated ${changed} file(s).` : '\nNo imports needed updates.');

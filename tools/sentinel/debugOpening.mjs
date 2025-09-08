#!/usr/bin/env node
/* eslint-env node */
import fs from 'node:fs';
import path from 'node:path';
import { runOpeningChecks } from './openingChecks.mjs';

function read(p){ try { return fs.readFileSync(p,'utf8'); } catch { return ''; } }

const opening  = read('src/components/theater/OpeningSequence.jsx');
const engine   = read('src/engine/ConsciousnessEngine.js');
const renderer = read('src/components/webgl/WebGLBackground.jsx');
const theater  = read('src/components/consciousness/ConsciousnessTheater.jsx');

const { rows, fails } = runOpeningChecks({ opening, engine, renderer, theater, debug:true });

console.log('\nOpening debug report:');
for (const r of rows) {
  const tag = r.ok ? 'OK ' : 'X  ';
  console.log(tag, r.label);
  if (!r.ok && r._snippet) {
    console.log('   ↳ match context:');
    console.log('   ' + r._snippet.replace(/\n/g,'\n   '));
  }
}
console.log('\nResult:', fails ? 'FAIL' : 'OK');
if (fails) process.exit(1);

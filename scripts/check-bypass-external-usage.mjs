#!/usr/bin/env node
import { readFileSync } from 'fs';
import { glob } from 'glob';

const BYPASS_FUNCTIONS = ['jumpToStage', 'nextStage', 'prevStage', 'setStage'];
const files = glob.sync('src/**/*.{js,jsx}', { nodir: true }).filter(f => !f.includes('narrativeAtom.js'));

console.log('# External Calls to Bypass Helpers\n');

BYPASS_FUNCTIONS.forEach(fn => {
  const regex = new RegExp(`narrativeAtom\\.${fn}\\(`, 'g');
  const matches = [];
  
  files.forEach(file => {
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, i) => {
      if (regex.test(line)) {
        matches.push({ file, line: i + 1, code: line.trim() });
      }
    });
  });
  
  console.log(`## ${fn}: ${matches.length} external calls\n`);
  matches.forEach(m => console.log(`- \`${m.file}:${m.line}\`\n  ${m.code}\n`));
});

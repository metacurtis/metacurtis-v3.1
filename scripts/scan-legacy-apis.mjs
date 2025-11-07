#!/usr/bin/env node
import { readFileSync } from 'fs';
import { walk } from '../tools/lib/walk.mjs';

const LEGACY_PATTERNS = {
  'window.stageControls (mutations)': /window\.stageControls(?!\.(get|is|current))/g,
  'window.stageControls (read)': /window\.stageControls\.(get|is|current)/g,
  'narrativeAtom bypasses': /narrativeAtom\.(jumpToStage|nextStage|prevStage|setStage)\s*\(/g,
  'START_NARRATIVE emits': /BeatBus\.emit\(EVENTS\.START_NARRATIVE/g,
  'AUTO_ADVANCE refs': /isAutoAdvanceEnabled|setAutoAdvanceEnabled/g,
  'stressTest calls': /stageControls\.stressTest|stageControls\.batchTransition/g
};

const results = {};
for (const key of Object.keys(LEGACY_PATTERNS)) {
  results[key] = [];
}

for await (const file of walk('src')) {
  if (!file.endsWith('.js') && !file.endsWith('.jsx')) continue;
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');

  for (const [pattern, regex] of Object.entries(LEGACY_PATTERNS)) {
    lines.forEach((line, i) => {
      if (regex.test(line)) {
        results[pattern].push({
          file,
          line: i + 1,
          code: line.trim(),
        });
      }
    });
  }
}

console.log('# Legacy API Usage Report\n');
for (const [pattern, matches] of Object.entries(results)) {
  console.log(`## ${pattern} (${matches.length} occurrences)\n`);
  matches.forEach((m) => {
    console.log(`- ${m.file}:${m.line}`);
    console.log(`  \`${m.code}\`\n`);
  });
}

const total = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
console.log(`\n**Total patterns found:** ${total}`);

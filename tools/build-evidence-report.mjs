#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const outDir = 'reports';
const timestamp = new Date().toISOString().split('T')[0];

const sst = JSON.parse(readFileSync(join(outDir, 'sst-extract.json'), 'utf8'));
const beatbus = JSON.parse(readFileSync(join(outDir, 'beatbus-map.json'), 'utf8'));
const sourceHits = JSON.parse(readFileSync(join(outDir, 'source-hits.json'), 'utf8'));

let report = '# MetaCurtis System Evidence Report\n\n';
report += `**Generated:** ${new Date().toISOString()}\n\n`;
report += '## Summary\n\n';
report += `- Stages: ${Object.keys(sst.stages || {}).length}\n`;
report += `- Events: ${Object.keys(beatbus).length}\n`;
report += `- Pattern Types: ${Object.keys(sourceHits).length}\n`;
report += `- Opening Timeline: ${sst.opening?.timeline?.profile || 'N/A'}\n\n`;

report += '## Opening Sequence Event Flow\n\n';
const openingEvents = [
  'ENGINE_VIEWPORT_HINT', 'WBG:BIND', 'WBG:FENCEPOST',
  'CHAOS_START', 'COALESCE_START', 'SETTLE_START',
  'PARTICLES_EMERGED', 'ENABLE_SCROLL', 'OPENING_COMPLETE'
];

openingEvents.forEach(event => {
  if (beatbus[event]) {
    report += `### ${event}\n\n`;
    if (beatbus[event].emitters?.length > 0) {
      report += '**Emitters:**\n';
      beatbus[event].emitters.forEach(e => report += `- \`${e.file}:${e.line}\`\n`);
      report += '\n';
    }
    if (beatbus[event].listeners?.length > 0) {
      report += '**Listeners:**\n';
      beatbus[event].listeners.forEach(l => report += `- \`${l.file}:${l.line}\`\n`);
      report += '\n';
    }
  }
});

report += '## Key Patterns\n\n';
Object.keys(sourceHits).forEach(pattern => {
  report += `### ${pattern} (${sourceHits[pattern].length} occurrences)\n\n`;
  sourceHits[pattern].slice(0, 3).forEach(hit => {
    report += `- \`${hit.file}:${hit.line}\`\n`;
  });
  if (sourceHits[pattern].length > 3) {
    report += `- ... and ${sourceHits[pattern].length - 3} more\n`;
  }
  report += '\n';
});

writeFileSync(join(outDir, `investigation-report-${timestamp}.md`), report);
console.log(`[build-report] Created master report → reports/investigation-report-${timestamp}.md`);

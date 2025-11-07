#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { walk } from './lib/walk.mjs';

const outDir = 'reports';
mkdirSync(outDir, { recursive: true });

const PATTERNS = [
  { key: 'OPENING_PHASE', re: /(chaos|coalesce|settle)/i },
  { key: 'MOTION_MODE', re: /uMotionMode/i },
  { key: 'MORPH_PROGRESS', re: /uMorphProgress|morphProgress/i },
  { key: 'RENDERER_DIRECTIVE', re: /applyRendererDirective/i },
  { key: 'FENCEPOST', re: /FENCEPOST|PARTICLES_EMERGED/i },
  { key: 'VIEWPORT_HINT', re: /ENGINE_VIEWPORT_HINT/i },
  { key: 'ENABLE_SCROLL', re: /ENABLE_SCROLL/i },
];

function captureContext(lines, idx, span = 2) {
  const start = Math.max(0, idx - span);
  const end = Math.min(lines.length, idx + span + 1);
  return lines.slice(start, end)
    .map((l, i) => `${start + i + 1}: ${l}`)
    .join('\n');
}

const hits = {};

for await (const file of walk('src')) {
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  PATTERNS.forEach(({ key, re }) => {
    lines.forEach((line, idx) => {
      if (re.test(line)) {
        if (!hits[key]) hits[key] = [];
        hits[key].push({
          file: file.replace(/^src\//, ''),
          line: idx + 1,
          context: captureContext(lines, idx, 2)
        });
      }
    });
  });
}

writeFileSync(join(outDir, 'source-hits.json'), JSON.stringify(hits, null, 2));

let md = '# Source Pattern Hits\n\n';
md += `Generated: ${new Date().toISOString()}\n\n`;
Object.keys(hits).forEach(key => {
  md += `## ${key} (${hits[key].length} hits)\n\n`;
  hits[key].forEach(hit => {
    md += `### ${hit.file}:${hit.line}\n\n\`\`\`javascript\n${hit.context}\n\`\`\`\n\n`;
  });
});

writeFileSync(join(outDir, 'source-hits.md'), md);
console.log(`[scan-source] Found ${Object.keys(hits).length} patterns → reports/source-hits.{json,md}`);

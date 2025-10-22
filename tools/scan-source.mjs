import fs from 'fs';
import { walk } from './lib/walk.mjs';

const outDir = 'reports';
await fs.promises.mkdir(outDir, { recursive: true });

const PATTERNS = [
  { key: 'OPENING_PHASE', re: /\b(black|cursor|TERMINAL_TYPE|SCREEN_FILL|chaos|coalesce|settle|emergence)\b/i },
  { key: 'NARRATION_API', re: /\bSTART_NARRIATIVE\b|\bNARRATIVE_LINE\b|\bBEAT FIRED\b|\bskipNarration\b/i },
  { key: 'RENDERER',      re: /\bRENDER_DIRECTIVE\b|\buMorphProgress\b|\bPARTICLES_EMERGED\b/i },
  { key: 'STAGE_CHANGE',  re: /\bSTAGE_CHANGE(D)?\b|\bjumpToStage\b/i }
];

function context(lines, i, span=2) {
  const s = Math.max(0, i-span), e=Math.min(lines.length, i+span+1);
  return lines.slice(s,e).map((l,k)=>`${s+k+1}: ${l}`).join('\n');
}

const hits = [];
for await (const file of walk('src')) {
  const txt = await fs.promises.readFile(file,'utf8');
  const lines = txt.split('\n');
  PATTERNS.forEach(({key, re}) => {
    lines.forEach((ln, i) => { if (re.test(ln)) hits.push({ key, file, line:i+1, context:context(lines,i) }); });
  });
}
const byKey = hits.reduce((acc,h)=>((acc[h.key] ||= []).push(h),acc),{});
fs.writeFileSync('reports/source-hits.json', JSON.stringify(byKey,null,2));
let md = '# Source Evidence Scan\n\n';
for (const k of Object.keys(byKey)) {
  md += `## ${k}\n\n`;
  for (const h of byKey[k]) md += `- \`${h.file}:${h.line}\`\n\n\`\`\`text\n${h.context}\n\`\`\`\n\n`;
}
fs.writeFileSync('reports/source-hits.md', md);
console.log('[scan-source] wrote reports/source-hits.{json,md}');

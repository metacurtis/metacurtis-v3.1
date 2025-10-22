import fs from 'fs';
import { walk } from './lib/walk.mjs';

const outDir = 'reports';
await fs.promises.mkdir(outDir, { recursive: true });

const AUDIO_EVENT_RE = /\bAUDIO_[A-Z0-9_]+\b/;
const AUDIO_NEW_RE   = /new\s+Audio\s*\(\s*(['"])(.*?)\1\s*\)/;
const AUDIO_PLAY_RE  = /\.play\s*\(\s*\)/;
const UNLOCK_RE      = /(pointerdown|touchstart|keydown)/i;

const hits = {
  events: {}, // eventName -> [{file,line,context}]
  elements: [], // {file,line,src,context}
  playCalls: [], // {file,line,context}
  unlocks: [] // {file,line,context}
};

function context(lines, i, span=2) {
  const s = Math.max(0, i-span), e=Math.min(lines.length, i+span+1);
  return lines.slice(s,e).map((l,k)=>`${s+k+1}: ${l}`).join('\n');
}

for await (const file of walk('src')) {
  const txt = await fs.promises.readFile(file,'utf8');
  const lines = txt.split('\n');

  // events
  lines.forEach((ln,i)=>{
    const m = ln.match(AUDIO_EVENT_RE);
    if (m) {
      const ev = m[0];
      (hits.events[ev] ||= []).push({file, line:i+1, context:context(lines,i)});
    }
  });

  // new Audio
  lines.forEach((ln,i)=>{
    const m = ln.match(AUDIO_NEW_RE);
    if (m) {
      hits.elements.push({file, line:i+1, src:m[2], context:context(lines,i)});
    }
  });

  // .play()
  lines.forEach((ln,i)=>{
    if (AUDIO_PLAY_RE.test(ln)) {
      hits.playCalls.push({file, line:i+1, context:context(lines,i)});
    }
  });

  // unlock gates
  lines.forEach((ln,i)=>{
    if (UNLOCK_RE.test(ln) && /addEventListener|window\.addEventListener/.test(ln)) {
      hits.unlocks.push({file, line:i+1, context:context(lines,i)});
    }
  });
}

fs.writeFileSync('reports/audio-hits.json', JSON.stringify(hits,null,2));
let md = '# Audio Evidence\n\n';
md += '## Events\n\n';
for (const [ev, arr] of Object.entries(hits.events)) {
  md += `### ${ev}\n` + arr.map(e=>`- \`${e.file}:${e.line}\``).join('\n') + '\n\n';
}
md += '## new Audio(src)\n\n' + hits.elements.map(e=>`- \`${e.file}:${e.line}\` src=${e.src}\n\n\`\`\`text\n${e.context}\n\`\`\``).join('\n');
md += '\n## .play() calls\n\n' + hits.playCalls.map(e=>`- \`${e.file}:${e.line}\`\n\n\`\`\`text\n${e.context}\n\`\`\``).join('\n');
md += '\n## Unlock gates\n\n' + hits.unlocks.map(e=>`- \`${e.file}:${e.line}\`\n\n\`\`\`text\n${e.context}\n\`\`\``).join('\n');
fs.writeFileSync('reports/audio-hits.md', md);
console.log('[scan-audio] wrote reports/audio-hits.{json,md}');

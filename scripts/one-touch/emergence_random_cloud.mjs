#!/usr/bin/env node
import fs from 'node:fs';

const file = 'src/engine/ConsciousnessEngine.js';
if (!fs.existsSync(file)) { console.error('❌ Missing', file); process.exit(1); }

let s = fs.readFileSync(file, 'utf8');
const orig = s;

// Replace the spiral TARGET block with randomized expanded cloud
// Match the block starting at const swirlRadius ... through the for() that writes text3DPositions.
const reSpiral =
  /const\s+swirlRadius[\s\S]*?=\s*Math\.min\(vw,\s*vh\)\s*\*\s*0\.\d+;\s*for\s*\(let\s+i=0;i<count;i\+\+\)\s*\{\s*const\s+j\s*=\s*i\s*\*\s*3;[\s\S]*?text3DPositions\[j\+0\]\s*=\s*[\s\S]*?;\s*text3DPositions\[j\+1\]\s*=\s*[\s\S]*?;\s*text3DPositions\[j\+2\]\s*=\s*[\s\S]*?;\s*\}\s*/m;

if (reSpiral.test(s)) {
  s = s.replace(
    reSpiral,
`const expandedRadius = Math.min(vw, vh) * 0.45;
for (let i = 0; i < count; i++) {
  const j = i * 3;
  const ang = Math.random() * Math.PI * 2;
  const r   = Math.random() * expandedRadius;
  text3DPositions[j+0] = Math.cos(ang) * r;
  text3DPositions[j+1] = Math.sin(ang) * r;
  text3DPositions[j+2] = (Math.random() - 0.5) * 25.0;
}
`
  );
} else {
  console.warn('• Spiral block not found. No replacement performed.');
}

if (s !== orig) {
  fs.writeFileSync(file + `.bak.random-target-${Date.now()}`, orig, 'utf8');
  fs.writeFileSync(file, s, 'utf8');
  console.log('✓ Replaced emergence TARGET with randomized expanded cloud in', file);
} else {
  console.log('• No changes needed', file);
}

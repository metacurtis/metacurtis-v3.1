#!/usr/bin/env node
import fs from 'node:fs';

const file = 'src/engine/ConsciousnessEngine.js';
if (!fs.existsSync(file)) {
  console.error('❌ Missing', file);
  process.exit(1);
}
let s = fs.readFileSync(file, 'utf8');
const orig = s;

// ─────────────────────────────────────────────────────────────────────────────
// A) DEDUPE OPENING FLAGS IN CONSTRUCTOR
//    Keep exactly one block after `this.currentQuality = 'HIGH';`
// ─────────────────────────────────────────────────────────────────────────────
s = s.replace(
  /(this\.currentQuality\s*=\s*'HIGH';)(?![\s\S]*?\/\/ Opening gates)/,
  `$1
    // Opening gates / fences (single source of truth)
    if (this._openingPhase === undefined) this._openingPhase = true;
    if (this._openingEpoch  === undefined) this._openingEpoch  = 0;
    if (this._emergenceCount=== undefined) this._emergenceCount= 0;`
);

// remove any duplicate repeats of those three lines later in the constructor
s = s.replace(
  /(\s*if\s*\(this\._openingPhase\s*===\s*undefined\)[^\n]*\n\s*if\s*\(this\._openingEpoch[^\n]*\n\s*if\s*\(this\._emergenceCount[^\n]*\n){2,}/g,
  '$1' // keep only one
);

// ─────────────────────────────────────────────────────────────────────────────
// B) DIRECT OPENING GATE AT TOP OF buildAndEmitBlueprint()
//    Block non-genesis builds during opening even on direct calls.
// ─────────────────────────────────────────────────────────────────────────────
if (!/buildAndEmitBlueprint\s*\(\s*stage\s*,\s*quality\s*\)\s*\{\s*if\s*\(this\._openingPhase\s*&&\s*stage\s*!==\s*'genesis'\)/.test(s)) {
  s = s.replace(
    /buildAndEmitBlueprint\s*\(\s*stage\s*,\s*quality\s*\)\s*\{\s*/,
    `buildAndEmitBlueprint(stage, quality) {
    if (this._openingPhase && stage !== 'genesis') {
      console.warn('🧠 Engine: blocked non-genesis during opening:', stage);
      return;
    }
`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// C) EMERGENCE: REPLACE SPIRAL TARGET WITH RANDOM EXPANDED CLOUD
//    This kills the swirl rings and gives chaotic gas burst.
// ─────────────────────────────────────────────────────────────────────────────
const spiralBlockRE =
/const\s+swirlRadius\s*=\s*Math\.min\(vw,\s*vh\)\s*\*\s*0\.40;\s*for\s*\(let\s+i\s*=\s*0;\s*i\s*<\s*count;\s*i\+\+\)\s*\{\s*const\s+j\s*=\s*i\s*\*\s*3;\s*const\s+t\s*=\s*i\s*\/\s*count;\s*const\s+ang\s*=\s*t\s*\*\s*Math\.PI\s*\*\s*8\.0;\s*const\s+r\s*=\s*t\s*\*\s*swirlRadius;\s*text3DPositions\[j\+0\]\s*=\s*Math\.cos\(ang\)\s*\*\s*r;\s*text3DPositions\[j\+1\]\s*=\s*Math\.sin\(ang\)\s*\*\s*r;\s*text3DPositions\[j\+2\]\s*=\s*Math\.sin\(ang\s*\*\s*2\.0\)\s*\*\s*10\.0;\s*\}/m;

if (spiralBlockRE.test(s)) {
  s = s.replace(
    spiralBlockRE,
`const expandedRadius = Math.min(vw, vh) * 0.50; // bigger for dramatic burst
for (let i = 0; i < count; i++) {
  const j = i * 3;
  const ang = Math.random() * Math.PI * 2;
  const r   = Math.random() * expandedRadius;
  text3DPositions[j+0] = Math.cos(ang) * r;
  text3DPositions[j+1] = Math.sin(ang) * r;
  text3DPositions[j+2] = (Math.random() - 0.5) * 30.0; // deeper z for glow
}`
  );
} else {
  // Some earlier patch may have removed it; try to swap a similar block, or skip.
  console.warn('• Spiral TARGET block not found — skip (maybe already randomized).');
}

if (s !== orig) {
  fs.writeFileSync(file + `.bak.emergence-fix-${Date.now()}`, orig, 'utf8');
  fs.writeFileSync(file, s, 'utf8');
  console.log('✓ Engine patched: dedup flags + random expanded TARGET (no spiral) + opening gate in buildAndEmitBlueprint');
} else {
  console.log('• No changes needed (engine already clean).');
}

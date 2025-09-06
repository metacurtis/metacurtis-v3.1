const fs = require('fs');

// Fix the engine file
const engineFile = 'src/engine/ConsciousnessEngine.js';
let engine = fs.readFileSync(engineFile, 'utf8');

// Replace the spiral pattern with random clouds
const spiralStart = 'const swirlRadius = Math.min(vw, vh) * 0.40;';
const spiralEnd = 'text3DPositions[j+2] = Math.sin(ang * 2.0) * 10.0;';

const startIdx = engine.indexOf(spiralStart);
const endIdx = engine.indexOf(spiralEnd, startIdx) + spiralEnd.length + 6; // include closing brace

if (startIdx > -1 && endIdx > startIdx) {
  const newCode = `const expandedRadius = Math.min(vw, vh) * 0.5;
    for (let i=0;i<count;i++){
      const j=i*3;
      const ang = Math.random() * Math.PI * 2;
      const r = Math.random() * expandedRadius;
      text3DPositions[j+0] = Math.cos(ang) * r;
      text3DPositions[j+1] = Math.sin(ang) * r;
      text3DPositions[j+2] = (Math.random()-0.5) * 30.0;
    }`;
  
  engine = engine.substring(0, startIdx) + newCode + engine.substring(endIdx);
  fs.writeFileSync(engineFile, engine);
  console.log('✅ Fixed emergence - replaced spiral with random cloud');
}

// Also fix the duplicate opening phase flags
engine = engine.replace(/(\s+if \(this\._openingPhase === undefined\)[^\n]+\n){2,}/g, 
  '    if (this._openingPhase === undefined) this._openingPhase = true;\n');
fs.writeFileSync(engineFile, engine);
console.log('✅ Cleaned up duplicate flags');

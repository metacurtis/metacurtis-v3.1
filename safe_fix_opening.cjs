const fs = require('fs');

console.log('🔧 Applying safe fixes...\n');

// Read the engine file
let engine = fs.readFileSync('src/engine/ConsciousnessEngine.js', 'utf8');

// Fix 1: Just change the radius values (safer approach)
engine = engine.replace(/const gasRadius = Math\.min\(vw, vh\) \* 0\.35;/g, 
                        'const gasRadius = Math.min(vw, vh) * 0.75;');

engine = engine.replace(/const swirlRadius = Math\.min\(vw, vh\) \* 0\.40;/g,
                        'const expandedRadius = Math.min(vw, vh) * 0.6;');

// Fix 2: Replace the spiral loop with random (if it exists)
if (engine.includes('t * Math.PI * 8.0')) {
  engine = engine.replace(
    /for \(let i=0;i<count;i\+\+\)\{[\s]*const j=i\*3, t = i \/ count;[\s\S]*?text3DPositions\[j\+2\] = Math\.sin\(ang \* 2\.0\) \* 10\.0;[\s]*\}/,
    `for (let i=0;i<count;i++){
      const j=i*3;
      const ang = Math.random() * Math.PI * 2;
      const r = Math.random() * expandedRadius;
      text3DPositions[j+0] = Math.cos(ang) * r;
      text3DPositions[j+1] = Math.sin(ang) * r;
      text3DPositions[j+2] = (Math.random()-0.5) * 30.0;
    }`
  );
}

// Save the file
fs.writeFileSync('src/engine/ConsciousnessEngine.js', engine);
console.log('✅ Applied safe fixes to engine\n');

// Fix the stage change blocking
engine = fs.readFileSync('src/engine/ConsciousnessEngine.js', 'utf8');

// Find and strengthen the stage change block
if (engine.includes('STAGE_CHANGE')) {
  engine = engine.replace(
    /console\.log\(`🧠 Engine: Blocking \$\{stage\} during opening phase`\);/,
    'console.log(`🚫 Engine: BLOCKED stage change to ${stage} - opening in progress`);'
  );
  fs.writeFileSync('src/engine/ConsciousnessEngine.js', engine);
  console.log('✅ Strengthened stage blocking\n');
}

console.log('Done! Restart your dev server.');

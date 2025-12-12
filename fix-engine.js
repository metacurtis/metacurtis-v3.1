const fs = require('fs');

let content = fs.readFileSync('src/engine/ConsciousnessEngine.js', 'utf8');

// Remove the broken EVENTS lines (lines 10-15)
const lines = content.split('\n');
const fixedLines = [];

for (let i = 0; i < lines.length; i++) {
  // Skip the broken EVENTS definition lines
  if (i >= 9 && i <= 14) {
    // Skip lines 10-15 (0-indexed, so 9-14)
    continue;
  }
  fixedLines.push(lines[i]);
}

// Join back together
content = fixedLines.join('\n');

fs.writeFileSync('src/engine/ConsciousnessEngine.js', content);
console.log('✅ Fixed ConsciousnessEngine.js');

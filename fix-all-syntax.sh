#!/bin/bash

echo "Fixing syntax errors in ConsciousnessEngine.js..."

# Check the context around line 74
echo "Context around line 74:"
sed -n '70,80p' src/engine/ConsciousnessEngine.js

# Create a comprehensive fix script
cat > fix-syntax.cjs << 'EOJS'
const fs = require('fs');

// Fix ConsciousnessEngine.js
let engineContent = fs.readFileSync('src/engine/ConsciousnessEngine.js', 'utf8');

// Look for orphaned closing braces or incomplete statements
// The error suggests there's a closing brace without a matching opening
// or an incomplete object/function definition

// Find and fix the specific issue around line 74
const lines = engineContent.split('\n');

// Check if line 73-75 has an incomplete event listener or object
if (lines[73] && lines[73].includes('});') && lines[74] && lines[74].includes('});')) {
  // Remove duplicate closing
  lines.splice(74, 1);
  console.log('Removed duplicate closing at line 75');
}

// Also check for incomplete BeatBus.on() statements
let inListener = false;
let listenerStart = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('BeatBus.on(') && !lines[i].includes('});')) {
    inListener = true;
    listenerStart = i;
  }
  
  if (inListener && i === 73 && lines[i].trim() === 'formation,') {
    // This looks like an incomplete listener
    lines[i] = '    // formation listener removed - incomplete';
    if (lines[i+1].trim() === '});') {
      lines[i+1] = '';
    }
    console.log('Fixed incomplete listener at line', i);
    break;
  }
}

// Write fixed content
fs.writeFileSync('src/engine/ConsciousnessEngine.js', lines.join('\n'));
console.log('ConsciousnessEngine.js fixed');
EOJS

node fix-syntax.cjs
rm fix-syntax.cjs

echo "Testing build..."
npm run build

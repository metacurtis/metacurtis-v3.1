#!/bin/bash

# Create a Node script to fix the brace mismatch
cat > fix-braces.cjs << 'EOJS'
const fs = require('fs');
const content = fs.readFileSync('src/theater/TheaterDirector.js', 'utf8');

// Count braces to find the mismatch
let lines = content.split('\n');
let braceCount = 0;
let problemLine = -1;

lines.forEach((line, index) => {
  const openBraces = (line.match(/{/g) || []).length;
  const closeBraces = (line.match(/}/g) || []).length;
  braceCount += openBraces - closeBraces;
  
  if (index === 136 && closeBraces > 0 && braceCount < 0) {
    problemLine = index;
    console.log(`Found extra brace at line ${index + 1}`);
  }
});

// Remove the extra closing brace at line 137
if (problemLine > 0 || lines[136].trim() === '}') {
  lines.splice(136, 1);
  fs.writeFileSync('src/theater/TheaterDirector.js', lines.join('\n'));
  console.log('Fixed: Removed extra closing brace');
}
EOJS

node fix-braces.cjs
rm fix-braces.cjs

# Test the build
npm run build

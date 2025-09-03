#!/usr/bin/env node
/* eslint-env node */
const fs = require('fs');

// The problem: ConsciousnessEngine is building emergence blueprints for every event
const CE = 'src/engine/ConsciousnessEngine.js';
if (fs.existsSync(CE)) {
  let content = fs.readFileSync(CE, 'utf8');
  
  // Find where BUILD_EMERGENCE_BLUEPRINT is handled
  const emergenceHandler = content.indexOf('BeatBus.on(EVENTS.BUILD_EMERGENCE_BLUEPRINT');
  if (emergenceHandler !== -1) {
    // Add a flag to prevent duplicate emergence builds
    if (!content.includes('this.emergenceBuilt')) {
      // Add flag at class level
      const constructorEnd = content.indexOf('this.blueprintCache = new Map()');
      if (constructorEnd !== -1) {
        const afterCache = content.indexOf(';', constructorEnd) + 1;
        content = content.slice(0, afterCache) + '\n    this.emergenceBuilt = false;' + content.slice(afterCache);
      }
      
      // Check flag in emergence handler
      const handlerBody = content.indexOf('{', emergenceHandler);
      const nextLine = content.indexOf('\n', handlerBody) + 1;
      content = content.slice(0, nextLine) + 
        '\n    // Only build emergence once\n    if (this.emergenceBuilt) return;\n    this.emergenceBuilt = true;\n' + 
        content.slice(nextLine);
      
      fs.writeFileSync(CE, content);
      console.log('✅ Fixed ConsciousnessEngine - emergence only builds once');
    }
  }
}

// Also fix WebGLBackground to take the last blueprint, not both
const WGB = 'src/components/webgl/WebGLBackground.jsx';
if (fs.existsSync(WGB)) {
  let content = fs.readFileSync(WGB, 'utf8');
  
  // Skip emergence blueprints after initial load
  const handleBlueprint = content.indexOf('const handleBlueprint = (payload) => {');
  if (handleBlueprint !== -1) {
    const afterNormalize = content.indexOf('normalizePayload(payload);', handleBlueprint);
    if (afterNormalize !== -1 && !content.includes('Skip emergence after initial')) {
      const nextLine = content.indexOf('\n', afterNormalize) + 1;
      const fix = `
  // Skip emergence after initial stage is set
  if (raw?.mode === 'emergence' && lastFullStageRef.current) {
    return;
  }
`;
      content = content.slice(0, nextLine) + fix + content.slice(nextLine);
      fs.writeFileSync(WGB, content);
      console.log('✅ Fixed WebGLBackground - ignores emergence after first stage');
    }
  }
}

console.log('\nRestart dev server for fixes to take effect.');

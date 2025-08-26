#!/usr/bin/env node
const fs = require('fs');

// Fix 1: WebGLBackground - ignore cached emergence blueprints
const WGB = 'src/components/webgl/WebGLBackground.jsx';
if (fs.existsSync(WGB)) {
 let content = fs.readFileSync(WGB, 'utf8');
 
 // Find handleBlueprint function
 const handleStart = content.indexOf('const handleBlueprint = (payload) => {');
 if (handleStart !== -1) {
   // Add the check right after normalizePayload
   const insertPoint = content.indexOf('normalizePayload(payload);', handleStart);
   if (insertPoint !== -1) {
     const afterNormalize = content.indexOf('\n', insertPoint) + 1;
     
     if (!content.includes('Skip cached emergence blueprints')) {
       const fix = `
 // Skip cached emergence blueprints when we have real stage data
 if (cached && raw?.mode === 'emergence' && lastFullStageRef.current) {
   return;
 }
`;
       content = content.slice(0, afterNormalize) + fix + content.slice(afterNormalize);
       fs.writeFileSync(WGB, content);
       console.log('✅ Fixed WebGLBackground - will ignore cached emergence blueprints');
     } else {
       console.log('WebGLBackground already fixed');
     }
   }
 }
}

// Fix 2: ConsciousnessEngine - clear emergence cache on stage changes
const CE = 'src/engine/ConsciousnessEngine.js';
if (fs.existsSync(CE)) {
 let content = fs.readFileSync(CE);
 
 // Find STAGE_CHANGE listener
 const stageListener = content.indexOf('BeatBus.on(EVENTS.STAGE_CHANGE');
 if (stageListener !== -1) {
   // Find the handler body
   const handlerStart = content.indexOf('{', stageListener);
   const nextLine = content.indexOf('\n', handlerStart) + 1;
   
   if (!content.includes('Clear emergence blueprints from cache')) {
     const fix = `
     // Clear emergence blueprints from cache on stage change
     this.blueprintCache.forEach((value, key) => {
       if (key.includes('emergence')) {
         this.blueprintCache.delete(key);
       }
     });
`;
     content = content.slice(0, nextLine) + fix + content.slice(nextLine);
     fs.writeFileSync(CE, content);
     console.log('✅ Fixed ConsciousnessEngine - clears emergence cache on stage change');
   } else {
     console.log('ConsciousnessEngine already fixed');
   }
 }
}

console.log('\n✅ Blueprint cache issue fixed. Restart dev server.');

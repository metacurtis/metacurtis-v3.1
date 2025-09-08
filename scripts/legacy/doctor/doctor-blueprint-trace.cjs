#!/usr/bin/env node
/* eslint-env node */
/**
* Doctor: Blueprint Trace
* Finds all BLUEPRINT_READY emitters and listeners in the codebase
*/

const fs = require('fs');
const _path = require('path');
const { execSync } = require('child_process');

const EVENTS = ['BLUEPRINT_READY', 'BUILD_EMERGENCE_BLUEPRINT', 'BUILD_BLUEPRINT'];
const results = {
 emitters: [],
 listeners: [],
 cachePoints: [],
 suspicious: []
};

function searchFiles(dir, pattern, category) {
 try {
   // Use grep to find all occurrences
   const cmd = `grep -r "${pattern}" ${dir} --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null || true`;
   const output = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
   
   if (output) {
     output.split('\n').filter(Boolean).forEach(line => {
       const [file, ...rest] = line.split(':');
       const content = rest.join(':').trim();
       
       // Categorize by type
       if (content.includes('.emit(')) {
         results.emitters.push({ file, line: content, event: pattern });
       } else if (content.includes('.on(') || content.includes('.once(')) {
         results.listeners.push({ file, line: content, event: pattern });
       }
       
       // Check for caching
       if (content.includes('cache') || content.includes('Cache') || content.includes('stored')) {
         results.cachePoints.push({ file, line: content });
       }
       
       // Look for suspicious re-emissions
       if (content.includes('setTimeout') || content.includes('setInterval') || content.includes('requestAnimationFrame')) {
         results.suspicious.push({ file, line: content, reason: 'timed re-emission' });
       }
     });
   }
 } catch (e) {
   // Ignore errors
 }
}

console.log('🔍 Blueprint Trace Doctor\n');
console.log('Searching for blueprint emitters and listeners...\n');

// Search all relevant directories
const dirs = ['src', 'modules', 'scripts'];
EVENTS.forEach(event => {
 dirs.forEach(dir => {
   if (fs.existsSync(dir)) {
     searchFiles(dir, event, event);
   }
 });
});

// Also search for specific patterns
dirs.forEach(dir => {
 if (fs.existsSync(dir)) {
   searchFiles(dir, 'blueprint.*cache', 'cache');
   searchFiles(dir, 'lastBlueprint', 'storage');
   searchFiles(dir, 'emergence.*blueprint', 'emergence');
 }
});

// Analyze results
console.log('📊 ANALYSIS RESULTS\n');

console.log('🚀 BLUEPRINT EMITTERS:');
if (results.emitters.length === 0) {
 console.log('  No emitters found');
} else {
 const byFile = {};
 results.emitters.forEach(e => {
   if (!byFile[e.file]) byFile[e.file] = [];
   byFile[e.file].push(e);
 });
 
 Object.entries(byFile).forEach(([file, entries]) => {
   console.log(`\n  ${file}:`);
   entries.forEach(e => {
     console.log(`    - ${e.event}: ${e.line.substring(0, 80)}...`);
   });
 });
}

console.log('\n👂 BLUEPRINT LISTENERS:');
if (results.listeners.length === 0) {
 console.log('  No listeners found');
} else {
 const byFile = {};
 results.listeners.forEach(l => {
   if (!byFile[l.file]) byFile[l.file] = [];
   byFile[l.file].push(l);
 });
 
 Object.entries(byFile).forEach(([file, entries]) => {
   console.log(`\n  ${file}:`);
   entries.forEach(l => {
     console.log(`    - ${l.event}: ${l.line.substring(0, 80)}...`);
   });
 });
}

console.log('\n💾 CACHING POINTS:');
if (results.cachePoints.length === 0) {
 console.log('  No caching found');
} else {
 results.cachePoints.forEach(c => {
   console.log(`  ${c.file}:`);
   console.log(`    ${c.line.substring(0, 100)}...`);
 });
}

console.log('\n⚠️  SUSPICIOUS PATTERNS:');
if (results.suspicious.length === 0) {
 console.log('  No suspicious patterns found');
} else {
 results.suspicious.forEach(s => {
   console.log(`  ${s.file} (${s.reason}):`);
   console.log(`    ${s.line.substring(0, 100)}...`);
 });
}

// Check for specific known issues
console.log('\n🔍 SPECIFIC CHECKS:\n');

// Check ConsciousnessEngine
const enginePath = 'src/engine/ConsciousnessEngine.js';
if (fs.existsSync(enginePath)) {
 const content = fs.readFileSync(enginePath, 'utf8');
 const cacheCount = (content.match(/cache/gi) || []).length;
 const emitCount = (content.match(/emit.*BLUEPRINT_READY/g) || []).length;
 console.log(`ConsciousnessEngine.js:`);
 console.log(`  - Cache references: ${cacheCount}`);
 console.log(`  - BLUEPRINT_READY emits: ${emitCount}`);
 
 // Check for blueprint cache
 if (content.includes('blueprintCache') || content.includes('cachedBlueprints')) {
   console.log(`  ⚠️  Has blueprint caching system`);
 }
}

// Check WebGLBackground
const webglPath = 'src/components/webgl/WebGLBackground.jsx';
if (fs.existsSync(webglPath)) {
 const content = fs.readFileSync(webglPath, 'utf8');
 const listenerCount = (content.match(/on.*BLUEPRINT_READY/g) || []).length;
 console.log(`\nWebGLBackground.jsx:`);
 console.log(`  - BLUEPRINT_READY listeners: ${listenerCount}`);
 
 // Check for multiple handlers
 if (listenerCount > 1) {
   console.log(`  ⚠️  Multiple blueprint listeners detected!`);
 }
}

// Check for emergence controllers
const emergencePath = 'src/modules/emerge/EmergenceController.js';
if (fs.existsSync(emergencePath)) {
 const content = fs.readFileSync(emergencePath, 'utf8');
 const emitCount = (content.match(/emit/g) || []).length;
 console.log(`\nEmergenceController.js:`);
 console.log(`  - Total emits: ${emitCount}`);
}

console.log('\n📋 RECOMMENDATIONS:\n');

if (results.emitters.length > 1) {
 console.log('⚠️  Multiple blueprint emitters detected. This can cause race conditions.');
 console.log('   Consider centralizing blueprint emission in ConsciousnessEngine only.\n');
}

if (results.cachePoints.length > 0) {
 console.log('⚠️  Blueprint caching detected. Cached blueprints may be re-emitted incorrectly.');
 console.log('   Check that cache invalidation happens on stage changes.\n');
}

if (results.suspicious.length > 0) {
 console.log('⚠️  Timed re-emissions detected. These may cause duplicate blueprints.');
 console.log('   Review setTimeout/setInterval calls that might re-emit blueprints.\n');
}

console.log('💡 To fix duplicate blueprints:');
console.log('   1. Ensure ConsciousnessEngine is the only BLUEPRINT_READY emitter');
console.log('   2. Check that blueprint cache clears on STAGE_CHANGE');
console.log('   3. Remove any setTimeout/setInterval that re-emits blueprints');
console.log('   4. Add blueprint ID checking in WebGLBackground to ignore duplicates');


#!/usr/bin/env node
/* eslint-env node */
// scripts/canon-console-apply-all-patches.js
// Purpose: Apply all Canon Console patches in order

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Canon Console: Applying All Level 1 Patches');
console.log('===============================================\n');

const patches = [
  'canon-console-patch-1-emitter.js',
  'canon-console-patch-2-console-stack.js',
  'canon-console-patch-3-webgl-fixes.js',
  'canon-console-patch-4-silent-mode.js'
];

async function runPatches() {
  for (const patch of patches) {
    const patchPath = path.join(__dirname, patch);
    console.log(`\n📦 Running: ${patch}`);
    console.log('─'.repeat(50));
    
    try {
      execSync(`node ${patchPath}`, { 
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..')
      });
    } catch (error) {
      console.error(`\n❌ Failed to apply ${patch}`);
      console.error(error);
      process.exit(1);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ All Canon Console patches applied successfully!');
  console.log('='.repeat(50));
  
  console.log('\n📋 Next Steps:');
  console.log('1. cd canon-console && npm install');
  console.log('2. npm start (to run the server)');
  console.log('3. Add to your main.jsx:');
  console.log(`   if (import.meta.env.DEV) {
     import('../canon-console/browser/inject.js');
   }`);
  console.log('\n🧪 Test with:');
  console.log('   console.error(new Error("Test error"))');
  console.log('   window.__CANON_CONSOLE_DEBUG = true (for debug logs)');
  console.log('   window.__canonIncidents.getStats() (view stats)');
}

runPatches();
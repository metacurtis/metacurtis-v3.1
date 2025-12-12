#!/usr/bin/env node
// scripts/canon-console-verify.js
// Purpose: Verify Canon Console patches were applied correctly

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

console.log('🔍 Canon Console: Verifying Patches');
console.log('====================================\n');

const checks = [
  {
    file: 'canon-console/store/emitter.js',
    contains: 'class Emitter',
    description: 'Browser-safe emitter exists'
  },
  {
    file: 'canon-console/store/incidentStore.js',
    contains: 'this.bus = new Emitter()',
    description: 'IncidentStore uses Emitter'
  },
  {
    file: 'canon-console/sinks/consoleSink.js',
    contains: 'errArg?.stack',
    description: 'Console sink captures error stacks'
  },
  {
    file: 'canon-console/sinks/webglSink.js',
    contains: 'gl.drawElements',
    description: 'WebGL sink monitors drawElements'
  },
  {
    file: 'canon-console/sinks/webglSink.js',
    contains: 'getErrorNames',
    description: 'WebGL sink has GL error detection'
  },
  {
    file: 'canon-console/browser/inject.js',
    contains: 'CC_DEBUG',
    description: 'Browser injection has debug flag'
  },
  {
    file: 'canon-console/browser/inject.js',
    contains: 'maxReconnectAttempts',
    description: 'Reconnect limiting is in place'
  }
];

async function verify() {
  let allPassed = true;
  
  for (const check of checks) {
    const filePath = path.join(projectRoot, check.file);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const passed = content.includes(check.contains);
      
      if (passed) {
        console.log(`✅ ${check.description}`);
        console.log(`   File: ${check.file}`);
      } else {
        console.log(`❌ ${check.description}`);
        console.log(`   File: ${check.file}`);
        console.log(`   Missing: "${check.contains}"`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${check.description}`);
      console.log(`   File not found: ${check.file}`);
      allPassed = false;
    }
    
    console.log('');
  }
  
  if (allPassed) {
    console.log('✨ All patches verified successfully!');
    console.log('\n🚀 Canon Console Level 1 is ready to use');
  } else {
    console.log('⚠️  Some patches may not have been applied correctly');
    console.log('   Run: node scripts/canon-console-apply-all-patches.js');
    process.exit(1);
  }
}

verify();
#!/usr/bin/env node
/* eslint-env node */
// scripts/canon-console-fix-package.js
// Purpose: Fix the empty/corrupted package.json

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

console.log('🔧 Canon Console: Fixing package.json');
console.log('======================================\n');

const packageJson = {
  "name": "canon-console",
  "version": "1.0.0",
  "type": "module",
  "description": "Smart noise-reducing development console for MetaCurtis",
  "main": "index.js",
  "scripts": {
    "start": "node agent/server.js",
    "dev": "nodemon agent/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.13.0",
    "chalk": "^5.3.0",
    "kleur": "^4.1.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=16.0.0"
  }
};

async function fixPackageJson() {
  const packagePath = path.join(projectRoot, 'canon-console/package.json');
  
  try {
    // Check if file exists and what's in it
    try {
      const existing = await fs.readFile(packagePath, 'utf-8');
      console.log('Current package.json content:');
      console.log('─'.repeat(40));
      console.log(existing || '(empty file)');
      console.log('─'.repeat(40));
    } catch (err) {
      console.log('⚠️  No package.json found or file is unreadable');
    }
    
    // Write the correct package.json
    await fs.writeFile(
      packagePath,
      JSON.stringify(packageJson, null, 2),
      'utf-8'
    );
    
    console.log('\n✅ Fixed: canon-console/package.json');
    console.log('\nPackage.json now contains:');
    console.log('─'.repeat(40));
    console.log(JSON.stringify(packageJson, null, 2));
    console.log('─'.repeat(40));
    
    console.log('\n✨ package.json fixed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. cd canon-console');
    console.log('2. npm install');
    console.log('3. npm start');
    
  } catch (error) {
    console.error('❌ Failed to fix package.json:', error);
    process.exit(1);
  }
}

fixPackageJson().catch(console.error);
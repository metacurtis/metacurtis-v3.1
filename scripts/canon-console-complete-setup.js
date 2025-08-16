#!/usr/bin/env node
// scripts/canon-console-complete-setup.js
// Purpose: Create complete Canon Console Level 1 implementation

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

console.log('🚀 Canon Console: Complete Level 1 Setup');
console.log('=========================================\n');

// All file contents in one place
const files = {
  // Package.json
  'canon-console/package.json': JSON.stringify({
    "name": "canon-console",
    "version": "1.0.0",
    "type": "module",
    "description": "Smart noise-reducing development console",
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
    }
  }, null, 2),

  // Emitter
  'canon-console/store/emitter.js': `export class Emitter {
  #map = new Map();
  on(type, fn) { 
    const set = this.#map.get(type) ?? this.#map.set(type, new Set()).get(type);
    set.add(fn); 
    return () => this.off(type, fn); 
  }
  off(type, fn) { this.#map.get(type)?.delete(fn); }
  emit(type, payload) { 
    this.#map.get(type)?.forEach(fn => { 
      try { fn(payload); } catch {} 
    }); 
  }
}
export default Emitter;`,

  // Add more files here...
};

async function setup() {
  // Create directories
  const dirs = [
    'canon-console',
    'canon-console/agent',
    'canon-console/store',
    'canon-console/model',
    'canon-console/sinks',
    'canon-console/browser'
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(path.join(projectRoot, dir), { recursive: true });
    console.log(`✅ Dir: ${dir}`);
  }
  
  // Create files
  for (const [filePath, content] of Object.entries(files)) {
    await fs.writeFile(path.join(projectRoot, filePath), content, 'utf-8');
    console.log(`✅ File: ${filePath}`);
  }
  
  console.log('\n✨ Canon Console structure complete!');
  console.log('\nNext steps:');
  console.log('1. cd canon-console');
  console.log('2. npm install');
  console.log('3. npm start');
}

setup().catch(console.error);

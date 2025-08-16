#!/usr/bin/env node
// scripts/canon-console-patch-1-emitter.js
// Purpose: Replace Node EventEmitter with browser-safe emitter

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

console.log('🔧 Canon Console Patch 1: Browser-Safe Emitter');
console.log('================================================');

async function applyPatch() {
  try {
    // Step 1: Create emitter.js
    const emitterPath = path.join(projectRoot, 'canon-console/store/emitter.js');
    const emitterContent = `// Minimal browser-safe emitter (no Node deps)
export class Emitter {
  #map = new Map();
  
  on(type, fn) { 
    const set = this.#map.get(type) ?? this.#map.set(type, new Set()).get(type);
    set.add(fn); 
    return () => this.off(type, fn); 
  }
  
  off(type, fn) { 
    this.#map.get(type)?.delete(fn); 
  }
  
  emit(type, payload) { 
    this.#map.get(type)?.forEach(fn => { 
      try { 
        fn(payload); 
      } catch {} 
    }); 
  }
}

export default Emitter;
`;

    await fs.writeFile(emitterPath, emitterContent, 'utf-8');
    console.log('✅ Created: canon-console/store/emitter.js');

    // Step 2: Update incidentStore.js to use Emitter
    const storePath = path.join(projectRoot, 'canon-console/store/incidentStore.js');
    const storeContent = await fs.readFile(storePath, 'utf-8');
    
    // Replace EventEmitter import and extends
    let updatedContent = storeContent
      .replace(/import\s+{\s*EventEmitter\s*}\s+from\s+['"]events['"];?/g, 
               "import { Emitter } from './emitter.js';")
      .replace(/class\s+IncidentStore\s+extends\s+EventEmitter\s*{/, 
               'class IncidentStore {');
    
    // Add emitter instance and proxy methods if not present
    if (!updatedContent.includes('this.bus = new Emitter()')) {
      updatedContent = updatedContent.replace(
        'constructor() {',
        `constructor() {
    this.bus = new Emitter();`
      );
      
      // Add proxy methods after constructor
      const constructorEnd = updatedContent.indexOf('initStats()') - 1;
      const beforeInit = updatedContent.substring(0, constructorEnd);
      const afterInit = updatedContent.substring(constructorEnd);
      
      const proxyMethods = `
  
  // Proxy emitter methods
  on(...args) { return this.bus.on(...args); }
  off(...args) { return this.bus.off(...args); }
  emit(...args) { return this.bus.emit(...args); }
  
  `;
      
      updatedContent = beforeInit + proxyMethods + afterInit;
    }
    
    // Replace all this.emit() with this.bus.emit()
    updatedContent = updatedContent.replace(/this\.emit\(/g, 'this.bus.emit(');
    
    await fs.writeFile(storePath, updatedContent, 'utf-8');
    console.log('✅ Updated: canon-console/store/incidentStore.js');
    console.log('   - Removed Node EventEmitter dependency');
    console.log('   - Added browser-safe Emitter');
    console.log('   - Updated all emit calls');
    
    console.log('\n✨ Patch 1 complete: Browser-safe emitter installed');
    
  } catch (error) {
    console.error('❌ Error applying patch:', error);
    process.exit(1);
  }
}

// Run the patch
applyPatch();
#!/usr/bin/env node
/**
 * State Bridge Doctor - Safely connects StateCore to Atoms
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

// 1. Audit existing state
function auditState() {
  console.log('📊 State Audit\n');
  
  // Find all atom files
  const atomFiles = [];
  const storeFiles = [];
  
  function scan(dir) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory() && !f.includes('node_modules')) {
        scan(full);
      } else if (f.includes('Atom') || f.includes('atom')) {
        atomFiles.push(full);
      } else if (f.includes('Store') || f.includes('store')) {
        storeFiles.push(full);
      }
    });
  }
  
  scan(path.join(ROOT, 'src'));
  
  console.log(`Found ${atomFiles.length} atom files`);
  console.log(`Found ${storeFiles.length} store files`);
  
  return { atomFiles, storeFiles };
}

// 2. Create minimal StateCore
function createStateCore() {
  const stateCorePath = path.join(ROOT, 'src/modules/state/StateCore.js');
  
  if (fs.existsSync(stateCorePath)) {
    console.log('StateCore already exists');
    return;
  }
  
  const code = `// Minimal StateCore for bridging
class StateCore {
  constructor() {
    this.state = {
      stage: 'genesis',
      morphProgress: 0,
      scrollProgress: 0,
      quality: 'HIGH',
      fps: 60
    };
    
    this.listeners = new Set();
  }
  
  get(key) {
    return this.state[key];
  }
  
  set(key, value) {
    const old = this.state[key];
    this.state[key] = value;
    this.notify(key, value, old);
  }
  
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  
  notify(key, value, old) {
    this.listeners.forEach(fn => fn(key, value, old));
  }
}

export const stateCore = new StateCore();
window.SC = stateCore; // Debug access
`;

  fs.mkdirSync(path.dirname(stateCorePath), { recursive: true });
  fs.writeFileSync(stateCorePath, code);
  console.log('✅ Created minimal StateCore');
}

// 3. Wire to BeatBus
function wireToBeatBus() {
  const bridgePath = path.join(ROOT, 'src/modules/state/BeatBusBridge.js');
  
  const code = `import { stateCore } from './StateCore.js';

// Bridge StateCore changes to BeatBus
export function initBridge() {
  if (!window.BeatBus) {
    console.warn('BeatBus not ready for bridge');
    return;
  }
  
  // State changes emit to BeatBus
  stateCore.subscribe((key, value, old) => {
    if (key === 'stage') {
      window.BeatBus.emit('STAGE_CHANGE', { from: old, to: value });
    }
    if (key === 'morphProgress') {
      window.BeatBus.emit('MORPH_UPDATE', { progress: value });
    }
  });
  
  // BeatBus events update state
  window.BeatBus.on('STAGE_CHANGE', ({ to }) => {
    stateCore.set('stage', to);
  });
  
  console.log('✅ StateCore ↔ BeatBus bridge active');
}

// Auto-init when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBridge);
} else {
  setTimeout(initBridge, 100);
}
`;

  fs.writeFileSync(bridgePath, code);
  console.log('✅ Created BeatBus bridge');
}

// Run
const audit = auditState();
createStateCore();
wireToBeatBus();

console.log('\n📋 Next Steps:');
console.log('1. Import bridge in main.jsx: import "@/modules/state/BeatBusBridge"');
console.log('2. Test in console: SC.set("stage", "neural")');
console.log('3. Verify BeatBus: BUS.getDebugInfo()');

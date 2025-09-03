#!/usr/bin/env node
/* eslint-env node */
/**
 * Doctor: Render Apply
 * Ensures WebGLBackground actually applies blueprint positions to geometry
 */

const fs = require('fs');
const _path = require('path');

const WGB_PATH = 'src/components/webgl/WebGLBackground.jsx';

function patchWebGLBackground() {
  let content = fs.readFileSync(WGB_PATH, 'utf8');
  
  // Check if already patched
  if (content.includes('__applyBlueprint')) {
    console.log('WebGLBackground already has __applyBlueprint');
    return false;
  }
  
  // Add the apply function after the component declaration
  const applyFunction = `
  // DOCTOR: Apply blueprint positions to geometry
  const __applyBlueprint = (data) => {
    if (!geometryRef.current || !data?.blueprint) return;
    
    const bp = data.blueprint;
    const geo = geometryRef.current;
    
    // Apply positions
    if (bp.atmosphericPositions) {
      geo.setAttribute('position', new THREE.BufferAttribute(bp.atmosphericPositions, 3));
      geo.attributes.position.needsUpdate = true;
    }
    
    // Apply targets if present
    if (bp.allenAtlasTargets) {
      geo.setAttribute('target', new THREE.BufferAttribute(bp.allenAtlasTargets, 3));
      if (geo.attributes.target) geo.attributes.target.needsUpdate = true;
    }
    
    // Update particle count uniform
    if (materialRef.current?.uniforms?.uActiveCount) {
      materialRef.current.uniforms.uActiveCount.value = bp.activeCount || bp.particleCount;
    }
    
    // Update stage index for shader
    if (materialRef.current?.uniforms?.uStageIndex) {
      const stages = ['genesis', 'discipline', 'neural', 'velocity', 'architecture', 'harmony', 'transcendence'];
      const idx = stages.indexOf(data.stage);
      materialRef.current.uniforms.uStageIndex.value = idx >= 0 ? idx : 0;
    }
    
    console.log('Applied blueprint:', data.stage, bp.particleCount, 'particles');
  };
`;

  // Add after the component function declaration
  content = content.replace(
    /(function WebGLBackground.*?\{)/,
    `$1${applyFunction}`
  );
  
  // Replace the BLUEPRINT_READY handler to actually apply the data
  content = content.replace(
    /BeatBus\.on\(EVENTS\.BLUEPRINT_READY,\s*\([^)]*\)\s*=>\s*\{[^}]*\}\)/,
    `BeatBus.on(EVENTS.BLUEPRINT_READY, (data) => {
      console.log('✅ Renderer: applying blueprint', data.stage);
      __applyBlueprint(data);
    })`
  );
  
  // If no handler exists, add one
  if (!content.includes('EVENTS.BLUEPRINT_READY')) {
    content = content.replace(
      /(useEffect\(\(\) => \{)/,
      `$1
    const offBlueprint = BeatBus.on(EVENTS.BLUEPRINT_READY, (data) => {
      console.log('✅ Renderer: applying blueprint', data.stage);
      __applyBlueprint(data);
    });
    `
    );
    
    // Add cleanup
    content = content.replace(
      /(return \(\) => \{)/,
      `$1
      offBlueprint?.();`
    );
  }
  
  fs.writeFileSync(WGB_PATH, content);
  console.log('✅ Patched WebGLBackground to apply blueprints');
  return true;
}

// Also ensure the bridge is wired
function ensureBridgeInit() {
  const MAIN_PATH = 'src/main.jsx';
  let content = fs.readFileSync(MAIN_PATH, 'utf8');
  
  if (!content.includes('AtomicToBeatBus')) {
    // Add import and init
    const bridgeInit = `
// Initialize state bridge
import wireAtomicToBeatBus from '../modules/state/bridges/AtomicToBeatBus.js';
wireAtomicToBeatBus();
`;
    
    content = content.replace(
      /(import .*?\n)+/,
      `$&${bridgeInit}`
    );
    
    fs.writeFileSync(MAIN_PATH, content);
    console.log('✅ Added bridge initialization to main.jsx');
    return true;
  }
  
  console.log('Bridge initialization already present');
  return false;
}

// Fix the AtomicToBeatBus bridge to use stageProgress correctly
function fixBridge() {
  const BRIDGE_PATH = 'modules/state/bridges/AtomicToBeatBus.js';
  if (!fs.existsSync(BRIDGE_PATH)) {
    console.log('! Bridge file not found');
    return false;
  }
  
  let content = fs.readFileSync(BRIDGE_PATH, 'utf8');
  
  // Fix the morph progress to use stageAtom.stageProgress
  content = content.replace(
    /let lastMorph = interactionAtom\.getState\(\)\.morphProgress \?\? 0;[\s\S]*?interactionAtom\.subscribe\([^}]+\}\);/,
    `// Use stageAtom's stageProgress for morph
  let lastMorph = stageAtom.getState().stageProgress ?? 0;
  stageAtom.subscribe((s) => {
    const v = Number(s.stageProgress ?? 0);
    if (v !== lastMorph) {
      BeatBus.emit(EVENTS.MORPH_PROGRESS, { value: v });
      lastMorph = v;
    }
  });`
  );
  
  fs.writeFileSync(BRIDGE_PATH, content);
  console.log('✅ Fixed bridge to use stageAtom.stageProgress');
  return true;
}

// Run all fixes
console.log('🔧 Doctor: Render Apply\n');

const results = {
  webgl: patchWebGLBackground(),
  bridge: ensureBridgeInit(),
  bridgeFix: fixBridge()
};

console.log('\n📊 Summary:');
console.log('- WebGLBackground patched:', results.webgl);
console.log('- Bridge initialized:', results.bridge);
console.log('- Bridge fixed:', results.bridgeFix);

if (results.webgl || results.bridge || results.bridgeFix) {
  console.log('\n✅ Changes applied. Restart dev server.');
} else {
  console.log('\n✓ No changes needed.');
}

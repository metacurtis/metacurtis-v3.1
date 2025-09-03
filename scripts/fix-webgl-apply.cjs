#!/usr/bin/env node
/* eslint-env node */
const fs = require('fs');

const WGB = 'src/components/webgl/WebGLBackground.jsx';
let content = fs.readFileSync(WGB, 'utf8');

// Find where to insert the apply function - after the component starts but before the return
const componentStart = content.indexOf('export default function WebGLBackground');
const firstUseEffect = content.indexOf('useEffect(', componentStart);

if (componentStart === -1 || firstUseEffect === -1) {
  console.error('Could not find insertion point');
  process.exit(1);
}

// Insert the apply function before the first useEffect
const applyFunction = `
  // Apply blueprint data to geometry
  const applyBlueprintToGeometry = (data) => {
    if (!geometryRef.current || !data?.blueprint) return;
    
    const bp = data.blueprint;
    const geo = geometryRef.current;
    
    // Apply positions
    if (bp.atmosphericPositions) {
      geo.setAttribute('position', new THREE.BufferAttribute(bp.atmosphericPositions, 3));
      geo.attributes.position.needsUpdate = true;
    }
    
    // Update uniforms
    if (materialRef.current) {
      if (materialRef.current.uniforms.uActiveCount) {
        materialRef.current.uniforms.uActiveCount.value = bp.activeCount || bp.particleCount;
      }
      if (materialRef.current.uniforms.uStageIndex) {
        const stages = ['genesis', 'discipline', 'neural', 'velocity', 'architecture', 'harmony', 'transcendence'];
        materialRef.current.uniforms.uStageIndex.value = stages.indexOf(data.stage) || 0;
      }
    }
    
    console.log('Applied blueprint:', data.stage, bp.particleCount);
  };

`;

// Insert before first useEffect
content = content.slice(0, firstUseEffect) + applyFunction + content.slice(firstUseEffect);

// Now update the BLUEPRINT_READY handler to call our function
content = content.replace(
  /console\.log\(['"`].*?Renderer.*?BLUEPRINT_READY.*?\);/g,
  `console.log('✅ Renderer: applying blueprint');
    applyBlueprintToGeometry(data);`
);

fs.writeFileSync(WGB, content);
console.log('✅ Fixed WebGLBackground');

#!/usr/bin/env node
/**
 * Render Pipeline Diagnostic
 * Generates a DEV-only diagnostic module that exposes the full render state
 */

const fs = require('fs');
const _path = require('path');

const diagnostic = `// Render Pipeline Diagnostic (DEV-only)
if (import.meta.env.DEV) {
  window.__renderDiag = {
    materials: new Map(),
    geometries: new Map(),
    uniforms: new Map(),
    
    register(name, obj) {
      if (!obj) return;
      
      if (obj.type?.includes('Material')) {
        this.materials.set(name, obj);
        if (obj.uniforms) {
          this.uniforms.set(name, Object.keys(obj.uniforms));
        }
      }
      
      if (obj.type?.includes('Geometry') || obj.attributes) {
        this.geometries.set(name, obj);
      }
    },
    
    report() {
      console.group('🔍 Render Diagnostic');
      
      console.log('Materials:', this.materials.size);
      this.materials.forEach((mat, name) => {
        console.log('  -', name, mat.type, mat.uniforms ? Object.keys(mat.uniforms).join(', ') : 'no uniforms');
      });
      
      console.log('Geometries:', this.geometries.size);
      this.geometries.forEach((geo, name) => {
        const pos = geo.attributes?.position;
        console.log('  -', name, pos ? pos.count + ' vertices' : 'no position data');
      });
      
      console.log('Morph uniforms found:');
      this.uniforms.forEach((keys, name) => {
        const morphKeys = keys.filter(k => k.toLowerCase().includes('morph'));
        if (morphKeys.length) {
          console.log('  -', name, morphKeys.join(', '));
        }
      });
      
      console.groupEnd();
      return this;
    },
    
    testMorph(value = 0.5) {
      let updated = 0;
      this.materials.forEach((mat, name) => {
        if (!mat.uniforms) return;
        
        ['uMorphProgress', 'morphProgress', 'uMorph', 'morph'].forEach(key => {
          if (mat.uniforms[key]) {
            mat.uniforms[key].value = value;
            mat.needsUpdate = true;
            updated++;
            console.log('✓ Set', name + '.' + key, 'to', value);
          }
        });
      });
      
      return updated + ' uniforms updated';
    },
    
    testStageColors(stage = 'neural') {
      const colors = {
        genesis: ['#00FF00', '#22c55e', '#15803d'],
        discipline: ['#1e40af', '#3b82f6', '#1d4ed8'],
        neural: ['#4338ca', '#a855f7', '#7c3aed'],
        velocity: ['#7c3aed', '#9333ea', '#6b21a8'],
        architecture: ['#0891b2', '#06b6d4', '#0e7490'],
        harmony: ['#f59e0b', '#d97706', '#b45309'],
        transcendence: ['#ffffff', '#f59e0b', '#00ffcc']
      };
      
      const palette = colors[stage] || colors.genesis;
      let updated = 0;
      
      this.materials.forEach((mat, name) => {
        if (!mat.uniforms) return;
        
        if (mat.uniforms.uColorCurrent) {
          mat.uniforms.uColorCurrent.value.set(palette[0]);
          updated++;
        }
        if (mat.uniforms.uColorAccent1) {
          mat.uniforms.uColorAccent1.value.set(palette[1]);
          updated++;
        }
      });
      
      return updated + ' color uniforms updated to ' + stage;
    }
  };
  
  console.log('🔍 Render diagnostic loaded. Use:');
  console.log('  __renderDiag.report()     - Show all materials/geometries');
  console.log('  __renderDiag.testMorph(0.5) - Force morph value');
  console.log('  __renderDiag.testStageColors("neural") - Force stage colors');
}

export default window.__renderDiag;
`;

// Write diagnostic module
fs.writeFileSync('src/dev/RenderDiagnostic.js', diagnostic);

// Patch WebGLBackground to register its material
const webglPath = 'src/components/webgl/WebGLBackground.jsx';
if (fs.existsSync(webglPath)) {
  let content = fs.readFileSync(webglPath, 'utf8');
  
  // Add import if missing
  if (!content.includes('RenderDiagnostic')) {
    content = content.replace(
      /(^import .+\n)+/m,
      `$&import '@/dev/RenderDiagnostic.js';\n`
    );
  }
  
  // Register material after creation
  if (!content.includes('__renderDiag?.register')) {
    content = content.replace(
      /(\s+)(const material = .*?;)/,
      `$1$2\n$1window.__renderDiag?.register('WebGLBackground', material);`
    );
    
    content = content.replace(
      /(\s+)(materialRef\.current = .*?;)/,
      `$1$2\n$1window.__renderDiag?.register('WebGLBackground-ref', materialRef.current);`
    );
  }
  
  fs.writeFileSync(webglPath, content);
  console.log('✓ Patched WebGLBackground to register with diagnostic');
}

console.log('✓ Created src/dev/RenderDiagnostic.js');
console.log('\nAfter restart, use:');
console.log('  __renderDiag.report()');
console.log('  __renderDiag.testMorph(0.5)');
console.log('  __renderDiag.testStageColors("neural")');

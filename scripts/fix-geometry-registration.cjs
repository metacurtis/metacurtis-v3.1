#!/usr/bin/env node
const fs = require('fs');
const _path = require('path');

// Patch WebGLBackground to register geometry
const webglPath = 'src/components/webgl/WebGLBackground.jsx';
if (fs.existsSync(webglPath)) {
  let content = fs.readFileSync(webglPath, 'utf8');
  
  // Add geometry registration after positions are set
  if (!content.includes('register.*geometry')) {
    // Find where geometry.setAttribute is called
    content = content.replace(
      /(geometry\.setAttribute\('position', new THREE\.BufferAttribute\(.*?\)\);)/g,
      `$1
      window.__renderDiag?.register('particles', geometry);
      window.__particleGeometry = geometry;`
    );
    
    // Also register after any setPositions calls
    content = content.replace(
      /(setPositions\(.*?\);)/g,
      `$1
      if (geometryRef.current) {
        window.__renderDiag?.register('particles-ref', geometryRef.current);
        window.__particleGeometry = geometryRef.current;
      }`
    );
  }
  
  fs.writeFileSync(webglPath, content);
  console.log('✓ Patched WebGLBackground to register geometry');
} else {
  console.log('! WebGLBackground.jsx not found');
}

console.log('\nRestart dev server, then check:');
console.log('  __renderDiag.report()  - should show geometry now');
console.log('  __particleGeometry.attributes.position.count  - particle count');

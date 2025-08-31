#!/usr/bin/env node
import fs from 'fs';

const file = 'src/components/webgl/WebGLBackground.jsx';
if (!fs.existsSync(file)) {
  console.error('Missing', file);
  process.exit(1);
}
let s = fs.readFileSync(file, 'utf8');

// 1) Kill any stray partial token like "window.__pa"
s = s.replace(/.*window\.__pa.*\n?/g, '');

// 2) Normalize the expose-globals block right after materialRef.current = mat;
s = s.replace(
  /materialRef\.current\s*=\s*mat;\s*\n([\s\S]*?)\n\s*return mat;/,
  () => `materialRef.current = mat;
if (typeof window !== "undefined") {
  window.__webglBackground = { material: mat, meshRef, geometryRef, camera };
  window.__consciousnessMaterial = mat;
  window.__particleGeometry = geometryRef.current;
  window.__r3fCamera = camera;
}
return mat;`
);

// 3) Ensure <points> has only one ref prop
s = s.replace(/<points([^>]*?)\s+ref=\{[^}]+\}([^>]*?)\s+ref=\{[^}]+\}/g, '<points$1$2');

fs.writeFileSync(file, s, 'utf8');
console.log('✔ patched', file);

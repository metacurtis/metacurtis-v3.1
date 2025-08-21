// doctor_webgl_init_emergency.cjs
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Quick fix to find where Three.js should initialize
const srcDir = path.join(process.cwd(), 'src');

// Search for WebGL initialization patterns
const patterns = [
  /new\s+THREE\.WebGLRenderer/,
  /new\s+THREE\.Scene/,
  /new\s+THREE\.PerspectiveCamera/,
  /window\.renderer\s*=/,
  /window\.scene\s*=/,
  /window\.camera\s*=/
];

console.log('🔍 Searching for Three.js initialization...\n');

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];
  
  patterns.forEach(pattern => {
    if (pattern.test(content)) {
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (pattern.test(line)) {
          findings.push({
            file: path.relative(process.cwd(), filePath),
            line: idx + 1,
            code: line.trim()
          });
        }
      });
    }
  });
  
  return findings;
}

// Scan all JS/JSX files
function walkDir(dir) {
  const results = [];
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.includes('node_modules')) {
      results.push(...walkDir(fullPath));
    } else if (file.match(/\.(jsx?|tsx?)$/)) {
      const findings = scanFile(fullPath);
      if (findings.length > 0) {
        results.push(...findings);
      }
    }
  });
  
  return results;
}

const findings = walkDir(srcDir);

if (findings.length === 0) {
  console.error('❌ NO THREE.JS INITIALIZATION FOUND!');
  console.log('\nGenerating emergency initialization fix...\n');
  
  // Generate initialization code
  const emergencyInit = `
// src/webgl/emergencyInit.js
import * as THREE from 'three';

export function initializeWebGL() {
  // Create renderer
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true 
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);
  
  // Create scene
  const scene = new THREE.Scene();
  
  // Create camera
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;
  
  // Make globally accessible for debugging
  window.renderer = renderer;
  window.scene = scene;
  window.camera = camera;
  
  // Basic render loop
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
  
  console.log('✅ WebGL Emergency Init Complete');
  
  return { renderer, scene, camera };
}

// Call this from your main app
`;

  fs.writeFileSync(
    path.join(srcDir, 'webgl', 'emergencyInit.js'),
    emergencyInit
  );
  
  console.log('Created: src/webgl/emergencyInit.js');
  console.log('\nNow import and call initializeWebGL() in your App.jsx or main component');
  
} else {
  console.log('Found Three.js initialization code:\n');
  findings.forEach(f => {
    console.log(`${f.file}:${f.line}`);
    console.log(`  ${f.code}\n`);
  });
  
  console.log('\n⚠️ Three.js code exists but window.renderer/scene/camera are missing');
  console.log('This means the initialization code exists but isn\'t being called');
  console.log('\nCheck that:');
  console.log('1. The component containing this code is actually mounted');
  console.log('2. The initialization runs on mount (useEffect with [])');
  console.log('3. Variables are assigned to window for debugging');
}
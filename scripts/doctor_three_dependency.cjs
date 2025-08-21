#!/usr/bin/env node
/**
 * Three.js Dependency Analysis Doctor
 * Finds why Three.js suddenly stopped loading
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();

console.log('🔍 Three.js Dependency Doctor\n');

// 1. Check package.json
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
console.log('Three.js version:', pkg.dependencies.three || 'NOT FOUND');

// 2. Check node_modules
const threeExists = fs.existsSync(path.join(ROOT, 'node_modules/three'));
console.log('Three.js in node_modules:', threeExists);

if (threeExists) {
  const threePkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules/three/package.json'), 'utf8'));
  console.log('Actual installed version:', threePkg.version);
}

// 3. Check for duplicate Three.js
try {
  const dupes = execSync('npm ls three', { encoding: 'utf8' });
  console.log('\nThree.js dependency tree:\n', dupes);
} catch (e) {
  console.log('Error checking duplicates:', e.message);
}

// 4. Check Vite config
const viteConfig = path.join(ROOT, 'vite.config.js');
if (fs.existsSync(viteConfig)) {
  const config = fs.readFileSync(viteConfig, 'utf8');
  if (config.includes('three')) {
    console.log('\n⚠️ Vite config mentions Three.js - check for exclusions or optimizations');
  }
  if (config.includes('exclude') || config.includes('external')) {
    console.log('⚠️ Vite has exclusions that might affect Three.js');
  }
}

// 5. Find all Three.js imports
console.log('\nScanning for Three.js imports...');
const srcFiles = [];
function scan(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory() && !file.includes('node_modules')) {
      scan(full);
    } else if (file.match(/\.(jsx?|tsx?)$/)) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('three')) {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('from') && line.includes('three')) {
            console.log(`  ${path.relative(ROOT, full)}:${idx+1} - ${line.trim()}`);
          }
        });
      }
    }
  });
}
scan(path.join(ROOT, 'src'));

// 6. Fix suggestions
console.log('\n📋 Fixes to try:');
console.log('1. Clear cache: rm -rf node_modules/.vite');
console.log('2. Reinstall: rm -rf node_modules package-lock.json && npm install');
console.log('3. Force Three.js: npm install three@latest --save');
console.log('4. Check for conflicting global THREE: window.THREE = undefined');

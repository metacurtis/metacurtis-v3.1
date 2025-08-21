#!/usr/bin/env node
/**
* Self-bootstrapping WebGL Initialization Doctor
* Finds, diagnoses, and fixes Three.js initialization issues
*/

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');

class WebGLInitDoctor {
 constructor() {
   this.findings = {
     rendererInit: [],
     sceneInit: [],
     cameraInit: [],
     mountPoints: [],
     renderLoops: []
   };
 }

 diagnose() {
   console.log('🔍 WebGL Initialization Doctor\n');
   
   // Step 1: Find existing Three.js code
   this.scanForThreeJS();
   
   // Step 2: Determine what's missing
   const missing = this.identifyMissing();
   
   // Step 3: Generate and inject fix
   if (missing.length > 0) {
     this.generateBootstrap(missing);
   }
   
   // Step 4: Wire into existing app
   this.wireIntoApp();
   
   // Step 5: Create verification script
   this.createVerification();
 }

 scanForThreeJS() {
   const files = this.getAllFiles(SRC, ['.js', '.jsx']);
   
   files.forEach(file => {
     const content = fs.readFileSync(file, 'utf8');
     
     if (/new\s+THREE\.WebGLRenderer/.test(content)) {
       this.findings.rendererInit.push(file);
     }
     if (/new\s+THREE\.Scene/.test(content)) {
       this.findings.sceneInit.push(file);
     }
     if (/new\s+THREE\.(Perspective|Orthographic)Camera/.test(content)) {
       this.findings.cameraInit.push(file);
     }
     if (/requestAnimationFrame|\.render\(/.test(content)) {
       this.findings.renderLoops.push(file);
     }
   });
 }

 identifyMissing() {
   const missing = [];
   if (this.findings.rendererInit.length === 0) missing.push('renderer');
   if (this.findings.sceneInit.length === 0) missing.push('scene');
   if (this.findings.cameraInit.length === 0) missing.push('camera');
   if (this.findings.renderLoops.length === 0) missing.push('renderLoop');
   return missing;
 }

 generateBootstrap(missing) {
   const bootstrapPath = path.join(SRC, 'webgl', 'WebGLBootstrap.js');
   
   const bootstrap = `// Auto-generated WebGL Bootstrap
import * as THREE from 'three';

class WebGLBootstrap {
 constructor() {
   this.renderer = null;
   this.scene = null;
   this.camera = null;
   this.animationId = null;
 }

 init(container = document.body) {
   console.log('[WebGLBootstrap] Initializing...');
   
   ${missing.includes('renderer') ? `
   // Create renderer
   this.renderer = new THREE.WebGLRenderer({ 
     antialias: true,
     alpha: true,
     powerPreference: 'high-performance'
   });
   this.renderer.setSize(window.innerWidth, window.innerHeight);
   this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
   container.appendChild(this.renderer.domElement);
   ` : '// Renderer exists elsewhere'}
   
   ${missing.includes('scene') ? `
   // Create scene
   this.scene = new THREE.Scene();
   this.scene.background = new THREE.Color(0x000000);
   ` : '// Scene exists elsewhere'}
   
   ${missing.includes('camera') ? `
   // Create camera
   this.camera = new THREE.PerspectiveCamera(
     75,
     window.innerWidth / window.innerHeight,
     0.1,
     1000
   );
   this.camera.position.set(0, 0, 5);
   ` : '// Camera exists elsewhere'}
   
   // Make globally accessible for debugging
   window.renderer = this.renderer;
   window.scene = this.scene;
   window.camera = this.camera;
   
   // Handle resize
   window.addEventListener('resize', this.handleResize.bind(this));
   
   ${missing.includes('renderLoop') ? `
   // Start render loop
   this.animate();
   ` : '// Render loop exists elsewhere'}
   
   // Verification cube (remove after confirming it works)
   this.addTestCube();
   
   console.log('[WebGLBootstrap] ✅ Initialization complete');
   return { renderer: this.renderer, scene: this.scene, camera: this.camera };
 }

 handleResize() {
   if (this.camera) {
     this.camera.aspect = window.innerWidth / window.innerHeight;
     this.camera.updateProjectionMatrix();
   }
   if (this.renderer) {
     this.renderer.setSize(window.innerWidth, window.innerHeight);
   }
 }

 animate() {
   this.animationId = requestAnimationFrame(this.animate.bind(this));
   
   // Rotate test cube if it exists
   if (this.testCube) {
     this.testCube.rotation.x += 0.01;
     this.testCube.rotation.y += 0.01;
   }
   
   if (this.renderer && this.scene && this.camera) {
     this.renderer.render(this.scene, this.camera);
   }
 }

 addTestCube() {
   const geometry = new THREE.BoxGeometry(1, 1, 1);
   const material = new THREE.MeshBasicMaterial({ 
     color: 0x00ff00,
     wireframe: true 
   });
   this.testCube = new THREE.Mesh(geometry, material);
   this.scene.add(this.testCube);
   console.log('[WebGLBootstrap] Test cube added - you should see a green wireframe cube');
 }

 dispose() {
   if (this.animationId) {
     cancelAnimationFrame(this.animationId);
   }
   if (this.renderer) {
     this.renderer.dispose();
   }
   window.removeEventListener('resize', this.handleResize);
 }
}

// Auto-initialize if imported
const bootstrap = new WebGLBootstrap();

// Export for manual control
export { bootstrap, WebGLBootstrap };

// Initialize on DOM ready if not already initialized
if (typeof window !== 'undefined') {
 if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', () => {
     if (!window.renderer) {
       bootstrap.init();
     }
   });
 } else {
   // DOM already loaded
   setTimeout(() => {
     if (!window.renderer) {
       bootstrap.init();
     }
   }, 100);
 }
}
`;

   fs.mkdirSync(path.dirname(bootstrapPath), { recursive: true });
   fs.writeFileSync(bootstrapPath, bootstrap);
   console.log(`✅ Generated: ${path.relative(ROOT, bootstrapPath)}`);
 }

 wireIntoApp() {
   // Find main app file
   const appFiles = ['App.jsx', 'App.js', 'app.jsx', 'app.js'].map(f => path.join(SRC, f));
   const appFile = appFiles.find(f => fs.existsSync(f));
   
   if (!appFile) {
     console.log('⚠️  Could not find App.jsx to wire bootstrap');
     return;
   }
   
   let content = fs.readFileSync(appFile, 'utf8');
   
   // Check if already importing
   if (content.includes('WebGLBootstrap')) {
     console.log('✅ WebGLBootstrap already imported');
     return;
   }
   
   // Add import at the top
   const importStatement = `import './webgl/WebGLBootstrap';\n`;
   
   // Find the first import or use start of file
   const importMatch = content.match(/^import\s+/m);
   if (importMatch) {
     const insertPos = content.indexOf(importMatch[0]);
     content = content.slice(0, insertPos) + importStatement + content.slice(insertPos);
   } else {
     content = importStatement + content;
   }
   
   fs.writeFileSync(appFile, content);
   console.log(`✅ Wired bootstrap into ${path.basename(appFile)}`);
 }

 createVerification() {
   const verifyPath = path.join(SRC, 'webgl', 'verifyWebGL.js');
   
   const verification = `// WebGL Verification Script
export function verifyWebGL() {
 const report = {
   renderer: !!window.renderer,
   scene: !!window.scene,
   camera: !!window.camera,
   canvas: !!document.querySelector('canvas'),
   THREE: !!window.THREE
 };
 
 console.table(report);
 
 if (Object.values(report).every(v => v)) {
   console.log('✅ WebGL fully initialized');
 } else {
   console.error('❌ WebGL initialization incomplete:', report);
 }
 
 return report;
}

// Add to window for console access
window.verifyWebGL = verifyWebGL;

// Auto-verify after short delay
setTimeout(verifyWebGL, 1000);
`;

   fs.writeFileSync(verifyPath, verification);
   console.log(`✅ Created verification: ${path.relative(ROOT, verifyPath)}`);
 }

 getAllFiles(dir, extensions) {
   const files = [];
   
   const scan = (d) => {
     if (!fs.existsSync(d)) return;
     
     fs.readdirSync(d).forEach(file => {
       const fullPath = path.join(d, file);
       const stat = fs.statSync(fullPath);
       
       if (stat.isDirectory() && !file.includes('node_modules')) {
         scan(fullPath);
       } else if (extensions.some(ext => file.endsWith(ext))) {
         files.push(fullPath);
       }
     });
   };
   
   scan(dir);
   return files;
 }
}

// Run
console.log('🚀 Self-Bootstrapping WebGL Doctor\n');
const doctor = new WebGLInitDoctor();
doctor.diagnose();

console.log('\n📋 Next Steps:');
console.log('1. Restart your dev server');
console.log('2. Check console for green wireframe cube');
console.log('3. Run window.verifyWebGL() to confirm');
console.log('4. Remove test cube from WebGLBootstrap.js once confirmed');

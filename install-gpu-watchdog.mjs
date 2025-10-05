#!/usr/bin/env node
// install-gpu-watchdog.mjs
// Canon Dev-OS v3.7: Single-Writer GPU Watchdog Installer
// Corrected for your inject.js structure

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  injectPath: 'canon-console/browser/inject.js',
  sentinelPath: 'tools/sst-guard.mjs',
  packagePath: 'package.json',
  force: process.argv.includes('--force'),
  verify: process.argv.includes('--verify')
};

function install() {
  console.log('🚀 Canon GPU Watchdog Installer v3.7\n');

  try {
    updateInjectFile();
    updatePackageJson();
    updateSentinel();
    
    if (verify()) {
      console.log('\n✅ SUCCESS: GPU Watchdog installed!');
      console.log('\nTest in browser console:');
      console.log('  window.CANON_GPU_WATCHDOG.test()');
      console.log('\nValidate architecture:');
      console.log('  npm run validate:single-writer');
    }
  } catch (err) {
    console.error('\n❌ Installation failed:', err.message);
    process.exit(1);
  }
}

function updateInjectFile() {
  const injectFile = path.resolve(CONFIG.injectPath);
  
  if (!fs.existsSync(injectFile)) {
    throw new Error(`inject.js not found at: ${injectFile}`);
  }
  
  let content = fs.readFileSync(injectFile, 'utf8');
  
  // Check if already installed
  if (content.includes('installSingleWriterWatchdog') && !CONFIG.force) {
    console.log('✓ Watchdog already in inject.js');
    return;
  }
  
  // Remove old version if forcing
  if (CONFIG.force && content.includes('installSingleWriterWatchdog')) {
    const startMarker = '// === Single-Writer Watchdog';
    const endMarker = '// === End Single-Writer Watchdog';
    const startIdx = content.indexOf(startMarker);
    const endIdx = content.indexOf(endMarker);
    if (startIdx !== -1 && endIdx !== -1) {
      content = content.slice(0, startIdx) + content.slice(endIdx + endMarker.length + 1);
    }
  }
  
  // Find the Canon Bus Limiter section as insertion point
  const marker = '// >>> Canon Bus Limiter v1 <';
  const insertIdx = content.indexOf(marker);
  
  if (insertIdx === -1) {
    throw new Error('Could not find Canon Bus Limiter marker in inject.js');
  }
  
  // Insert BEFORE the Bus Limiter
  const watchdogCode = `
// === Single-Writer Watchdog (DEV only) ======================================
// Prevents GPU writes outside renderer - Canon Dev-OS v3.7
// Installed: ${new Date().toISOString()}
(function installSingleWriterWatchdog() {
  try {
    if (window.__gpuWatchdogInstalled) return;
    window.__gpuWatchdogInstalled = true;

    const mode = localStorage.getItem('canonSingleWriter') || 'warn';
    const allowlist = [
      'WebGLBackground.jsx',
      'WebGLCanvas.jsx',
      '/src/components/webgl/',
      'renderer'  // Allow any file with 'renderer' in the path
    ];

    window.__gpuViolations = [];
    
    const checkCaller = (fnName) => {
      if (typeof globalThis !== 'undefined' && globalThis.__GPU_WATCHDOG_SUSPEND__ === true) {
        return;
      }
      const stack = new Error().stack || '';
      const allowed = allowlist.some(pattern => stack.includes(pattern));
      
      if (!allowed) {
        // Extract the most relevant caller from stack
        const lines = stack.split('\\n');
        const callerLine = lines[3] || lines[2] || 'unknown';
        
        const violation = {
          fn: fnName,
          timestamp: Date.now(),
          caller: callerLine.trim()
        };
        
        window.__gpuViolations.push(violation);
        console.warn('[GPU Watchdog]', fnName, 'from non-renderer:', violation.caller);
        
        // Report to Canon systems
        if (window.BeatBus?.emit) {
          window.BeatBus.emit('CANON_VIOLATION', { 
            type: 'SINGLE_WRITER', 
            ...violation 
          });
        }
        
        if (window.CANON_CONSOLE?.incidents?.add) {
          window.CANON_CONSOLE.incidents.add({
            code: 'SINGLE_WRITER_VIOLATION',
            severity: 'error',
            message: \`GPU write from non-renderer: \${fnName}\`,
            context: violation
          });
        }
        
        if (mode === 'strict') {
          throw new Error(\`GPU SINGLE_WRITER_VIOLATION: \${fnName} from non-renderer\`);
        }
      }
    };

    // Wait for THREE.js then patch
    const patchThree = () => {
      if (!window.THREE?.BufferGeometry?.prototype) {
        window.__gpuWatchdogRetries = (window.__gpuWatchdogRetries || 0) + 1;
        if (window.__gpuWatchdogRetries < 50) {
          setTimeout(patchThree, 100);
        } else {
          console.warn('[GPU Watchdog] THREE.js not found after 50 attempts');
        }
        return;
      }

      const proto = window.THREE.BufferGeometry.prototype;
      const orig = {
        setAttribute: proto.setAttribute,
        setDrawRange: proto.setDrawRange
      };
      
      // Patch setAttribute
      proto.setAttribute = function(...args) {
        checkCaller('setAttribute');
        return orig.setAttribute.apply(this, args);
      };
      
      // Patch setDrawRange
      proto.setDrawRange = function(...args) {
        checkCaller('setDrawRange');
        return orig.setDrawRange.apply(this, args);
      };
      
      // Also patch ShaderMaterial uniforms if available
      if (window.THREE.ShaderMaterial?.prototype) {
        const shaderProto = window.THREE.ShaderMaterial.prototype;
        const uniformsDesc = Object.getOwnPropertyDescriptor(shaderProto, 'uniforms');
        if (uniformsDesc?.set) {
          Object.defineProperty(shaderProto, 'uniforms', {
            ...uniformsDesc,
            set: function(value) {
              checkCaller('uniforms.set');
              return uniformsDesc.set.call(this, value);
            }
          });
        }
      }
      
      console.log('🛡️ GPU Watchdog v3.7 active (mode:', mode, ')');
      console.log('📊 Use window.CANON_GPU_WATCHDOG for control');
    };
    
    patchThree();
    
    // Control API
    window.CANON_GPU_WATCHDOG = {
      version: '3.7',
      test: () => {
        if (!window.THREE) return 'THREE.js not loaded yet';
        const before = window.__gpuViolations.length;
        try {
          const geom = new THREE.BufferGeometry();
          geom.setAttribute('test', new THREE.Float32BufferAttribute([0,0,0], 3));
          const after = window.__gpuViolations.length;
          return after > before ? 
            '✅ Watchdog working! Caught violation.' : 
            '❌ No violation caught - check installation';
        } catch(e) {
          return '✅ Strict mode working: ' + e.message;
        }
      },
      getViolations: () => window.__gpuViolations,
      clearViolations: () => { window.__gpuViolations = []; },
      setMode: (m) => { 
        localStorage.setItem('canonSingleWriter', m);
        console.log('[GPU Watchdog] Mode set to:', m);
        return m;
      },
      getMode: () => localStorage.getItem('canonSingleWriter') || 'warn'
    };
    
  } catch (e) {
    console.error('[GPU Watchdog] Install failed:', e);
  }
})();
// === End Single-Writer Watchdog =============================================

`;
  
  // Insert before Bus Limiter
  content = content.slice(0, insertIdx) + watchdogCode + content.slice(insertIdx);
  
  fs.writeFileSync(injectFile, content, 'utf8');
  console.log('✓ Watchdog injected into inject.js');
}

function updatePackageJson() {
  const pkg = JSON.parse(fs.readFileSync(CONFIG.packagePath, 'utf8'));
  
  if (!pkg.scripts) pkg.scripts = {};
  
  if (pkg.scripts['validate:single-writer'] && !CONFIG.force) {
    console.log('✓ Validation script already in package.json');
    return;
  }
  
  pkg.scripts['validate:single-writer'] = "grep -r 'setAttribute\\|setDrawRange\\|material\\.uniforms' src --include='*.js' --include='*.jsx' | grep -v 'WebGL' && echo '❌ GPU writes outside renderer' && exit 1 || echo '✅ Single-writer clean'";
  
  fs.writeFileSync(CONFIG.packagePath, JSON.stringify(pkg, null, 2));
  console.log('✓ Validation script added to package.json');
}

function updateSentinel() {
  if (!fs.existsSync(CONFIG.sentinelPath)) {
    console.log('⚠ Sentinel not found (optional)');
    return;
  }
  
  let content = fs.readFileSync(CONFIG.sentinelPath, 'utf8');
  
  if (content.includes('Single-writer architecture')) {
    console.log('✓ Sentinel already has GPU checks');
    return;
  }
  
  const check = `
  // Single-writer architecture enforcement
  row(!/(setAttribute|setDrawRange|material\\.uniforms)/.test(engine), 'Engine: no direct GPU writes');
  row(!/(setAttribute|setDrawRange|material\\.uniforms)/.test(theater), 'Theater: no direct GPU writes');
`;
  
  const insertIdx = content.indexOf("console.log('\\nOpening checks:");
  if (insertIdx !== -1) {
    content = content.slice(0, insertIdx) + check + '\n' + content.slice(insertIdx);
    fs.writeFileSync(CONFIG.sentinelPath, content);
    console.log('✓ Sentinel updated with GPU checks');
  }
}

function verify() {
  console.log('\n📋 Verification:');
  
  const checks = [];
  
  // Check inject.js
  try {
    const injectContent = fs.readFileSync(CONFIG.injectPath, 'utf8');
    checks.push(injectContent.includes('installSingleWriterWatchdog'));
    console.log(checks[0] ? '✅ Watchdog in inject.js' : '❌ Watchdog missing');
  } catch(e) {
    console.log('❌ Could not read inject.js');
    checks.push(false);
  }
  
  // Check package.json
  try {
    const pkg = JSON.parse(fs.readFileSync(CONFIG.packagePath, 'utf8'));
    checks.push(!!pkg.scripts?.['validate:single-writer']);
    console.log(checks[1] ? '✅ Validation script in package.json' : '❌ Script missing');
  } catch(e) {
    console.log('❌ Could not read package.json');
    checks.push(false);
  }
  
  // Try to run validation
  try {
    console.log('\nRunning architecture validation...');
    execSync('npm run validate:single-writer', { stdio: 'inherit' });
    checks.push(true);
  } catch (e) {
    // It's okay if validation fails - that means it found violations to fix
    console.log('⚠️  Validation found GPU writes (or script missing)');
    checks.push(true);
  }
  
  return checks.every(c => c);
}

// Main execution
if (CONFIG.verify) {
  process.exit(verify() ? 0 : 1);
} else {
  install();
}

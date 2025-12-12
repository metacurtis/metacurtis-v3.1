#!/usr/bin/env node
// scripts/canon-console-patch-3-webgl-fixes.js
// Purpose: Fix Three.js FPS monitoring, add drawElements, add GL error detection

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

console.log('🔧 Canon Console Patch 3: WebGL Sink Fixes');
console.log('============================================');

async function applyPatch() {
  try {
    const sinkPath = path.join(projectRoot, 'canon-console/sinks/webglSink.js');
    let content = await fs.readFile(sinkPath, 'utf-8');
    
    // Fix 1: Three.js FPS hook with proper closure
    const hookThreeNew = `  hookThree() {
    const sink = this;
    const THREE = window?.THREE;
    if (!THREE?.WebGLRenderer) return;
    
    const proto = THREE.WebGLRenderer.prototype;
    
    // FPS monitor with proper closure
    const originalRender = proto.render;
    let frameCount = 0;
    let lastFPSReport = Date.now();
    
    proto.render = function(...args) {
      frameCount++;
      const now = Date.now();
      const delta = now - lastFPSReport;
      
      if (delta > 1000) {
        const fps = (frameCount * 1000) / delta;
        if (fps < 30) {
          sink.store.add(new Incident({
            code: 'LOW_FPS',
            severity: 'warn',
            message: \`Low FPS detected: \${fps.toFixed(1)}\`,
            tags: ['three', 'performance', 'fps'],
            context: { fps }
          }));
        }
        frameCount = 0;
        lastFPSReport = now;
      }
      
      return originalRender.call(this, ...args);
    };
  }`;
    
    // Replace hookThree method
    content = content.replace(/hookThree\(\)\s*{[\s\S]*?^  \}/m, hookThreeNew);
    
    // Fix 2: Add drawElements support and GL error checking in wrapContext
    const wrapContextNew = `  wrapContext(gl) {
    if (!gl || this.contexts.has(gl)) return;
    
    this.contexts.set(gl, true);
    
    // Wrap shader compilation
    const originalCompileShader = gl.compileShader;
    gl.compileShader = (shader) => {
      originalCompileShader.call(gl, shader);
      this.checkShaderCompilation(gl, shader);
    };
    
    // Wrap program linking
    const originalLinkProgram = gl.linkProgram;
    gl.linkProgram = (program) => {
      originalLinkProgram.call(gl, program);
      this.checkProgramLinking(gl, program);
    };
    
    // Draw call monitoring (arrays + elements)
    const originalDrawArrays = gl.drawArrays.bind(gl);
    const originalDrawElements = gl.drawElements?.bind(gl);
    let drawCallCount = 0;
    let lastDrawReport = Date.now();
    
    gl.drawArrays = (...args) => {
      drawCallCount++;
      const now = Date.now();
      if (now - lastDrawReport > 1000) {
        if (drawCallCount > 100) {
          this.reportHighDrawCalls(drawCallCount);
        }
        drawCallCount = 0;
        lastDrawReport = now;
      }
      return originalDrawArrays(...args);
    };
    
    if (originalDrawElements) {
      gl.drawElements = (...args) => {
        drawCallCount++;
        const now = Date.now();
        if (now - lastDrawReport > 1000) {
          if (drawCallCount > 100) {
            this.reportHighDrawCalls(drawCallCount);
          }
          drawCallCount = 0;
          lastDrawReport = now;
        }
        return originalDrawElements(...args);
      };
    }
    
    // Throttled GL error surfacing (1Hz)
    let lastErrorReport = 0;
    const errorNames = this.getErrorNames(gl);
    
    const checkErrors = () => {
      const now = performance.now();
      if (now - lastErrorReport < 1000) {
        requestAnimationFrame(checkErrors);
        return;
      }
      lastErrorReport = now;
      
      let err = gl.getError();
      while (err && err !== gl.NO_ERROR) {
        this.store.add(new Incident({
          code: 'GL_ERROR',
          severity: 'error',
          message: \`gl.getError: \${errorNames[err] || err}\`,
          tags: ['webgl', 'glerror']
        }));
        err = gl.getError();
      }
      requestAnimationFrame(checkErrors);
    };
    requestAnimationFrame(checkErrors);
    
    // Monitor context loss
    const canvas = gl.canvas;
    if (canvas) {
      canvas.addEventListener('webglcontextlost', (e) => {
        this.reportContextLost(e);
      });
      
      canvas.addEventListener('webglcontextrestored', (e) => {
        this.reportContextRestored(e);
      });
    }
  }`;
    
    // Replace wrapContext method
    content = content.replace(/wrapContext\(gl\)\s*{[\s\S]*?^  \}/m, wrapContextNew);
    
    // Add getErrorNames helper if not present
    if (!content.includes('getErrorNames')) {
      const helperMethods = `
  getErrorNames(gl) {
    return {
      [gl.NO_ERROR]: 'NO_ERROR',
      [gl.INVALID_ENUM]: 'INVALID_ENUM',
      [gl.INVALID_VALUE]: 'INVALID_VALUE',
      [gl.INVALID_OPERATION]: 'INVALID_OPERATION',
      [gl.OUT_OF_MEMORY]: 'OUT_OF_MEMORY',
      [gl.INVALID_FRAMEBUFFER_OPERATION]: 'INVALID_FRAMEBUFFER_OPERATION',
      [gl.CONTEXT_LOST_WEBGL]: 'CONTEXT_LOST_WEBGL'
    };
  }
`;
      // Add before the last closing brace
      content = content.replace(/}\s*\nexport default/, helperMethods + '}\n\nexport default');
    }
    
    await fs.writeFile(sinkPath, content, 'utf-8');
    console.log('✅ Updated: canon-console/sinks/webglSink.js');
    console.log('   - Fixed Three.js FPS monitoring (closure scope)');
    console.log('   - Added drawElements support');
    console.log('   - Added throttled GL error detection (1Hz)');
    
    console.log('\n✨ Patch 3 complete: WebGL sink fully operational');
    
  } catch (error) {
    console.error('❌ Error applying patch:', error);
    process.exit(1);
  }
}

// Run the patch
applyPatch();
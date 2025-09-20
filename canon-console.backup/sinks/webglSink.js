// canon-console/sinks/webglSink.js
import Incident from '../model/incident.js';

class WebGLSink {
  constructor(store) {
    this.store = store;
    this.installed = false;
    this.contexts = new WeakMap();
  }
  
  install() {
    if (this.installed) return;
    
    // Hook into WebGL context creation
    if (typeof HTMLCanvasElement !== 'undefined') {
      this.hookCanvas();
    }
    
    // Hook into Three.js if available
    if (typeof window !== 'undefined' && window.THREE) {
      this.hookThree();
    }
    
    this.installed = true;
  }
  
  hookCanvas() {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const self = this;
    
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      const context = originalGetContext.call(this, type, ...args);
      
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
        self.wrapContext(context);
      }
      
      return context;
    };
  }
  
      wrapContext(gl) {
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
          message: `gl.getError: ${errorNames[err] || err}`,
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
  }
  
  checkShaderCompilation(gl, shader) {
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      const source = gl.getShaderSource(shader);
      const isVertex = gl.getShaderParameter(shader, gl.SHADER_TYPE) === gl.VERTEX_SHADER;
      
      const incident = new Incident({
        code: 'SHADER_COMPILE_FAIL',
        severity: 'critical',
        message: `${isVertex ? 'Vertex' : 'Fragment'} shader compilation failed`,
        tags: ['webgl', 'shader', isVertex ? 'vertex' : 'fragment'],
        evidence: {
          glLog: info,
          raw: source?.substring(0, 500)
        },
        context: {
          shader: {
            type: isVertex ? 'vertex' : 'fragment',
            source: source?.length
          }
        }
      });
      
      this.store.add(incident);
    }
  }
  
  checkProgramLinking(gl, program) {
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      
      const incident = new Incident({
        code: 'SHADER_LINK_FAIL',
        severity: 'critical',
        message: 'Shader program linking failed',
        tags: ['webgl', 'shader', 'program'],
        evidence: {
          linkLog: info
        }
      });
      
      this.store.add(incident);
    }
    
    // Also check validation
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      
      const incident = new Incident({
        code: 'GL_VALIDATE_FAIL',
        severity: 'error',
        message: 'Shader program validation failed',
        tags: ['webgl', 'shader', 'validation'],
        evidence: {
          linkLog: info
        }
      });
      
      this.store.add(incident);
    }
  }
  
  reportHighDrawCalls(count) {
    const incident = new Incident({
      code: 'HIGH_DRAW_CALLS',
      severity: 'warn',
      message: `High draw call count: ${count}/sec`,
      tags: ['webgl', 'performance'],
      context: {
        drawCalls: count
      }
    });
    
    this.store.add(incident);
  }
  
  reportContextLost(event) {
    const incident = new Incident({
      code: 'WEBGL_CONTEXT_LOST',
      severity: 'critical',
      message: 'WebGL context lost',
      tags: ['webgl', 'context'],
      evidence: {
        raw: event
      }
    });
    
    this.store.add(incident);
  }
  
  reportContextRestored(event) {
    const incident = new Incident({
      code: 'WEBGL_CONTEXT_RESTORED',
      severity: 'info',
      message: 'WebGL context restored',
      tags: ['webgl', 'context'],
      evidence: {
        raw: event
      }
    });
    
    this.store.add(incident);
  }
  
      hookThree() {
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
            message: `Low FPS detected: ${fps.toFixed(1)}`,
            tags: ['three', 'performance', 'fps'],
            context: { fps }
          }));
        }
        frameCount = 0;
        lastFPSReport = now;
      }
      
      return originalRender.call(this, ...args);
    };
  }
  
  uninstall() {
    // Note: Cannot fully uninstall canvas hooks without page reload
    this.installed = false;
  }
}

export default WebGLSink;
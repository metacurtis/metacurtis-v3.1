// src/utils/webgl/ShaderDebugSystem.js
// SHADER DEBUG SYSTEM - Development tools, visualization, and AI co-debugging

import * as THREE from 'three';

// Debug mode configuration
const DEBUG_CONFIG = {
  enabled: process.env.NODE_ENV === 'development',
  visualizations: {
    stageColors: true,
    gridOverlay: true,
    particleFlashing: true,
    uniformValues: true,
    performanceMetrics: true,
  },
  logging: {
    uniformUpdates: false,
    shaderCompilation: true,
    performanceWarnings: true,
    stageTransitions: true,
  },
  controls: {
    keyboardShortcuts: true,
    onScreenOverlay: true,
    realTimeEditing: false, // Future: Live shader editing
  },
};

// Debug visualization modes
const DEBUG_MODES = {
  OFF: { name: 'Off', value: 0 },
  STAGE_COLORS: { name: 'Stage Colors', value: 1 },
  GRID_COORDS: { name: 'Grid Coordinates', value: 2 },
  ANIMATION_SEEDS: { name: 'Animation Seeds', value: 3 },
  PERFORMANCE_HEAT: { name: 'Performance Heatmap', value: 4 },
  UNIFORM_VALUES: { name: 'Uniform Visualization', value: 5 },
  PARTICLE_IDS: { name: 'Particle IDs', value: 6 },
};

// Debug shader extensions
const DEBUG_VERTEX_ADDITIONS = `
  uniform int uDebugMode;
  uniform float uDebugIntensity;
  uniform vec3 uDebugColor;
  
  varying float vDebugValue;
  varying vec3 vDebugColor;
  varying vec2 vGridCoords;
  varying vec4 vAnimationSeeds;
  
  void applyDebugModifications(inout vec3 pos, inout vec3 debugColor) {
    vGridCoords = gridCoords;
    vAnimationSeeds = animationSeeds;
    
    if (uDebugMode == 1) { // Stage Colors
      debugColor = uDebugColor;
      vDebugValue = float(uStage) / 5.0;
    }
    else if (uDebugMode == 2) { // Grid Coordinates
      debugColor = vec3(gridCoords.x, gridCoords.y, 0.5);
      vDebugValue = gridCoords.x + gridCoords.y;
    }
    else if (uDebugMode == 3) { // Animation Seeds
      debugColor = vec3(animationSeeds.xyz);
      vDebugValue = animationSeeds.w;
    }
    else if (uDebugMode == 4) { // Performance Heat (based on particle distance)
      float dist = length(pos.xy);
      debugColor = vec3(dist * 0.1, 1.0 - dist * 0.1, 0.0);
      vDebugValue = dist;
    }
    else if (uDebugMode == 5) { // Uniform Values
      debugColor = vec3(uStageProgress, float(uStage) / 5.0, uColorIntensity);
      vDebugValue = uStageProgress;
    }
    else if (uDebugMode == 6) { // Particle IDs
      float particleId = float(gl_VertexID) / 16000.0;
      debugColor = vec3(sin(particleId * 10.0), cos(particleId * 15.0), sin(particleId * 20.0));
      vDebugValue = particleId;
    }
    
    vDebugColor = debugColor;
    
    // Debug flash effect
    if (uDebugMode > 0) {
      float flashRate = 2.0 + float(uDebugMode);
      float flash = sin(uTime * flashRate) * 0.1 + 1.0;
      pos *= flash * uDebugIntensity;
    }
  }
`;

const DEBUG_FRAGMENT_ADDITIONS = `
  uniform int uDebugMode;
  uniform float uDebugIntensity;
  uniform bool uShowDebugOverlay;
  
  varying float vDebugValue;
  varying vec3 vDebugColor;
  varying vec2 vGridCoords;
  varying vec4 vAnimationSeeds;
  
  vec3 applyDebugVisualization(vec3 baseColor, float alpha) {
    if (uDebugMode == 0) return baseColor;
    
    vec3 debugColor = vDebugColor;
    float debugAlpha = alpha * uDebugIntensity;
    
    // Add debug overlay information
    if (uShowDebugOverlay) {
      // Grid lines
      float gridX = abs(fract(vGridCoords.x * 10.0) - 0.5);
      float gridY = abs(fract(vGridCoords.y * 10.0) - 0.5);
      if (gridX < 0.1 || gridY < 0.1) {
        debugColor = mix(debugColor, vec3(1.0), 0.3);
      }
      
      // Value indicators
      if (vDebugValue > 0.8) {
        debugColor = mix(debugColor, vec3(1.0, 0.0, 0.0), 0.5); // High values in red
      }
    }
    
    return mix(baseColor, debugColor, 0.7);
  }
`;

class ShaderDebugSystem {
  constructor() {
    this.enabled = DEBUG_CONFIG.enabled;
    this.currentMode = DEBUG_MODES.OFF;
    this.debugIntensity = 1.0;
    this.showOverlay = true;
    this.uniformLog = [];
    this.performanceLog = [];
    this.overlayElement = null;
    this.keyboardListeners = [];

    if (this.enabled) {
      this.initializeDebugSystem();
    }
  }

  // Initialize debug system
  initializeDebugSystem() {
    console.log('🔍 Shader Debug System initialized');

    if (DEBUG_CONFIG.controls.keyboardShortcuts) {
      this.setupKeyboardShortcuts();
    }

    if (DEBUG_CONFIG.controls.onScreenOverlay) {
      this.createDebugOverlay();
    }
  }

  // Setup keyboard shortcuts
  setupKeyboardShortcuts() {
    const handleKeyDown = event => {
      if (!event.altKey) return; // Alt + key combinations

      switch (event.code) {
        case 'KeyD':
          this.toggleDebugMode();
          event.preventDefault();
          break;
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
        case 'Digit6':
          {
            /* eslint-disable-next-line no-unused-vars */
            const mode = parseInt(event.code.replace('Digit', ''));
          }
          break;
        case 'KeyO':
          this.toggleOverlay();
          event.preventDefault();
          break;
        case 'KeyI':
          this.adjustIntensity(event.shiftKey ? 0.1 : -0.1);
          event.preventDefault();
          break;
        case 'KeyL':
          this.logCurrentState();
          event.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    this.keyboardListeners.push(() => window.removeEventListener('keydown', handleKeyDown));
  }

  // Create debug overlay UI
  createDebugOverlay() {
    if (this.overlayElement) return;

    this.overlayElement = document.createElement('div');
    this.overlayElement.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      width: 300px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      z-index: 10000;
      border: 1px solid #333;
      display: ${this.showOverlay ? 'block' : 'none'};
    `;

    document.body.appendChild(this.overlayElement);
    this.updateOverlay();
  }

  // Update debug overlay content
  updateOverlay() {
    if (!this.overlayElement) return;

    const currentModeName =
      Object.values(DEBUG_MODES).find(m => m.value === this.currentMode.value)?.name || 'Unknown';

    this.overlayElement.innerHTML = `
      <h3 style="margin: 0 0 10px 0; color: #00ff00;">🔍 Shader Debug</h3>
      <div><strong>Mode:</strong> ${currentModeName}</div>
      <div><strong>Intensity:</strong> ${this.debugIntensity.toFixed(2)}</div>
      <div><strong>Overlay:</strong> ${this.showOverlay ? 'ON' : 'OFF'}</div>
      <br>
      <div style="font-size: 10px; color: #888;">
        <strong>Shortcuts:</strong><br>
        Alt+D: Toggle debug<br>
        Alt+1-6: Debug modes<br>
        Alt+O: Toggle overlay<br>
        Alt+I: Adjust intensity<br>
        Alt+L: Log state
      </div>
      <br>
      <div id="debug-stats" style="font-size: 10px; color: #0ff;">
        ${this.getStatsHTML()}
      </div>
    `;
  }

  // Get stats HTML for overlay
  getStatsHTML() {
    const recent = this.performanceLog.slice(-5);
    if (recent.length === 0) return 'No performance data';

    const avgFps = recent.reduce((sum, log) => sum + log.fps, 0) / recent.length;
    const lastLog = recent[recent.length - 1];

    return `
      <strong>Performance:</strong><br>
      FPS: ${avgFps.toFixed(1)}<br>
      Particles: ${lastLog.particleCount || 'N/A'}<br>
      Stage: ${lastLog.stage || 'N/A'}
    `;
  }

  // Enhance shader material with debug uniforms
  enhanceShaderMaterial(material, stage = 0) {
    if (!this.enabled) return material;

    // Add debug uniforms
    material.uniforms = {
      ...material.uniforms,
      uDebugMode: { value: this.currentMode.value },
      uDebugIntensity: { value: this.debugIntensity },
      uDebugColor: { value: this.getStageDebugColor(stage) },
      uShowDebugOverlay: { value: this.showOverlay },
    };

    // Enhance shaders with debug code
    if (material.vertexShader && !material.vertexShader.includes('applyDebugModifications')) {
      material.vertexShader = this.injectDebugCode(material.vertexShader, 'vertex');
    }

    if (material.fragmentShader && !material.fragmentShader.includes('applyDebugVisualization')) {
      material.fragmentShader = this.injectDebugCode(material.fragmentShader, 'fragment');
    }

    // Force shader recompilation
    material.needsUpdate = true;

    if (DEBUG_CONFIG.logging.shaderCompilation) {
      console.log(
        `🔧 Enhanced shader material for stage ${stage} with debug mode ${this.currentMode.value}`
      );
    }

    return material;
  }

  // Inject debug code into shaders
  injectDebugCode(shader, type) {
    if (type === 'vertex') {
      // Add debug variables and functions after uniforms
      const uniformsEnd = shader.lastIndexOf('varying');
      const insertPoint = shader.indexOf('\n', uniformsEnd);

      return (
        shader.slice(0, insertPoint) +
        '\n' +
        DEBUG_VERTEX_ADDITIONS +
        shader.slice(insertPoint).replace(
          'gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);',
          `
               vec3 debugColor = vec3(1.0);
               applyDebugModifications(pos, debugColor);
               gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
               `
        )
      );
    } else {
      // Fragment shader
      const uniformsEnd = shader.lastIndexOf('varying');
      const insertPoint = shader.indexOf('\n', uniformsEnd);

      return (
        shader.slice(0, insertPoint) +
        '\n' +
        DEBUG_FRAGMENT_ADDITIONS +
        shader.slice(insertPoint).replace(
          'gl_FragColor = vec4(color * circle, alpha * circle);',
          `
               color = applyDebugVisualization(color, alpha);
               gl_FragColor = vec4(color * circle, alpha * circle);
               `
        )
      );
    }
  }

  // Get debug color for stage
  getStageDebugColor(stage) {
    const colors = [
      new THREE.Color(1, 0, 0), // Red - Genesis
      new THREE.Color(1, 0.5, 0), // Orange - Awakening
      new THREE.Color(1, 1, 0), // Yellow - Structure
      new THREE.Color(0, 1, 0), // Green - Learning
      new THREE.Color(0, 0, 1), // Blue - Building
      new THREE.Color(1, 0, 1), // Magenta - Mastery
    ];
    return colors[stage] || colors[0];
  }

  // Debug mode controls
  setDebugMode(mode) {
    const modeObj = Object.values(DEBUG_MODES).find(m => m.value === mode);
    if (modeObj) {
      this.currentMode = modeObj;
      this.updateOverlay();
      console.log(`🔍 Debug mode set to: ${modeObj.name}`);
    }
  }

  toggleDebugMode() {
    const modes = Object.values(DEBUG_MODES);
    const currentIndex = modes.findIndex(m => m.value === this.currentMode.value);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.setDebugMode(modes[nextIndex].value);
  }

  toggleOverlay() {
    this.showOverlay = !this.showOverlay;
    if (this.overlayElement) {
      this.overlayElement.style.display = this.showOverlay ? 'block' : 'none';
    }
    console.log(`🔍 Debug overlay ${this.showOverlay ? 'enabled' : 'disabled'}`);
  }

  adjustIntensity(delta) {
    this.debugIntensity = Math.max(0.1, Math.min(2.0, this.debugIntensity + delta));
    this.updateOverlay();
    console.log(`🔍 Debug intensity: ${this.debugIntensity.toFixed(2)}`);
  }

  // Logging and monitoring
  logUniformUpdate(uniformName, value, stage) {
    if (!DEBUG_CONFIG.logging.uniformUpdates) return;

    this.uniformLog.push({
      timestamp: performance.now(),
      uniform: uniformName,
      value: typeof value === 'object' ? JSON.stringify(value) : value,
      stage,
    });

    // Keep only last 100 entries
    if (this.uniformLog.length > 100) {
      this.uniformLog = this.uniformLog.slice(-100);
    }
  }

  logPerformance(fps, particleCount, stage, memoryUsage = 0) {
    this.performanceLog.push({
      timestamp: performance.now(),
      fps,
      particleCount,
      stage,
      memoryUsage,
    });

    if (this.performanceLog.length > 50) {
      this.performanceLog = this.performanceLog.slice(-50);
    }

    this.updateOverlay();

    // Performance warnings
    if (DEBUG_CONFIG.logging.performanceWarnings && fps < 30) {
      console.warn(
        `⚠️ Low FPS detected: ${fps.toFixed(1)} at stage ${stage} with ${particleCount} particles`
      );
    }
  }

  logCurrentState() {
    const state = {
      debugMode: this.currentMode,
      intensity: this.debugIntensity,
      recentPerformance: this.performanceLog.slice(-5),
      recentUniforms: this.uniformLog.slice(-10),
    };

    console.log('🔍 Current Debug State:', state);

    // Copy to clipboard if possible
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(JSON.stringify(state, null, 2))
        .then(() => console.log('📋 Debug state copied to clipboard'));
    }
  }

  // Get debug information for AI co-debugging
  getDebugInfo() {
    return {
      enabled: this.enabled,
      currentMode: this.currentMode,
      intensity: this.debugIntensity,
      performanceMetrics: this.getPerformanceMetrics(),
      recommendations: this.getDebugRecommendations(),
    };
  }

  getPerformanceMetrics() {
    const recent = this.performanceLog.slice(-10);
    if (recent.length === 0) return null;

    const avgFps = recent.reduce((sum, log) => sum + log.fps, 0) / recent.length;
    const minFps = Math.min(...recent.map(log => log.fps));
    const maxFps = Math.max(...recent.map(log => log.fps));

    return { avgFps, minFps, maxFps, sampleCount: recent.length };
  }

  getDebugRecommendations() {
    const metrics = this.getPerformanceMetrics();
    const recommendations = [];

    if (metrics && metrics.avgFps < 45) {
      recommendations.push('Consider reducing particle count');
      recommendations.push('Enable frustum culling');
      recommendations.push('Check for shader complexity issues');
    }

    if (this.uniformLog.length > 80) {
      recommendations.push('High uniform update frequency detected');
    }

    return recommendations;
  }

  // Cleanup
  destroy() {
    this.keyboardListeners.forEach(cleanup => cleanup());
    if (this.overlayElement) {
      document.body.removeChild(this.overlayElement);
    }
  }

  // Enable/disable debug system
  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled && !this.overlayElement) {
      this.initializeDebugSystem();
    } else if (!enabled && this.overlayElement) {
      this.overlayElement.style.display = 'none';
    }
  }
}

// Export singleton instance
export const shaderDebugSystem = new ShaderDebugSystem();

// Export configurations and class
export { DEBUG_CONFIG, DEBUG_MODES, ShaderDebugSystem };

// Development global access
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.shaderDebugSystem = shaderDebugSystem;
  window.DEBUG_MODES = DEBUG_MODES;
}

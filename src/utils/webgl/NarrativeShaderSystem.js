// src/utils/webgl/NarrativeShaderSystem.js
// MEMOIZED SHADER SYSTEM - Reusable across components, future-ready

import * as THREE from 'three';

// Stage configurations with shader overrides
const NARRATIVE_STAGES = {
  0: { name: 'genesis', particles: 2000, color: '#1E3A8A', overrideQuality: null },
  1: { name: 'awakening', particles: 4000, color: '#D97706', overrideQuality: null },
  2: { name: 'structure', particles: 6000, color: '#059669', overrideQuality: null },
  3: { name: 'learning', particles: 8000, color: '#0EA5E9', overrideQuality: null },
  4: { name: 'building', particles: 12000, color: '#7C3AED', overrideQuality: null },
  5: { name: 'mastery', particles: 16000, color: '#F59E0B', overrideQuality: 'ULTRA' }, // Force ULTRA for mastery
};

// Base narrative vertex shader
const NARRATIVE_VERTEX_SHADER = `
  uniform float uTime;
  uniform int uStage;
  uniform float uStageProgress;
  uniform bool uNarrativeEnabled;
  uniform bool uDebugMode;
  uniform vec3 uCursorPos;
  uniform float uCursorRadius;
  uniform float uRepulsionStrength;
  uniform float uVisibleWidth;
  uniform float uVisibleHeight;
  
  attribute vec4 animationSeeds;
  attribute vec2 gridCoords;
  
  varying vec3 vColor;
  varying float vDebugValue;
  
  void main() {
    vec3 pos = position;
    vColor = color;
    vDebugValue = 0.0;
    
    if (uNarrativeEnabled) {
      float personalPhase = animationSeeds.x * 100.0;
      
      // Stage 0: Genesis - minimal drift
      if (uStage == 0) {
        pos += sin(position * 0.1 + uTime * 0.05 + personalPhase) * 0.1;
        if (uDebugMode) vDebugValue = 0.1;
      }
      // Stage 1: Awakening - erratic bursts
      else if (uStage == 1) {
        pos += sin(position * 0.3 + uTime * 0.3 + personalPhase) * mix(0.1, 0.4, uStageProgress);
        pos.y += sin(uTime * 2.0 + animationSeeds.y * 10.0) * 0.2 * uStageProgress;
        if (uDebugMode) vDebugValue = 0.2;
      }
      // Stage 2: Structure - grid formation
      else if (uStage == 2) {
        pos.x += sin(gridCoords.y * 10.0 + uTime) * 0.1 * uStageProgress;
        pos.y += cos(gridCoords.x * 10.0 + uTime) * 0.1 * uStageProgress;
        if (uDebugMode) vDebugValue = 0.3;
      }
      // Stage 3: Learning - neural patterns
      else if (uStage == 3) {
        float neural = sin(position.x * 5.0) * cos(position.y * 5.0);
        pos += normalize(position) * neural * 0.2 * uStageProgress;
        pos += sin(position.yzx * 0.8 + uTime * 0.6 + personalPhase) * 0.3;
        if (uDebugMode) vDebugValue = 0.4;
      }
      // Stage 4: Building - swarming clusters  
      else if (uStage == 4) {
        pos += normalize(position) * sin(uTime * 1.5 + personalPhase) * 0.4 * uStageProgress;
        if (uDebugMode) vDebugValue = 0.5;
      }
      // Stage 5: Mastery - synchronized consciousness
      else if (uStage == 5) {
        float spiral = atan(position.y, position.x) + length(position.xy) * 2.0;
        pos.x += sin(spiral + uTime * 2.0) * 0.3 * uStageProgress;
        pos.y += cos(spiral + uTime * 2.0) * 0.3 * uStageProgress;
        pos += normalize(position) * sin(uTime * 1.0 + personalPhase) * 0.5;
        if (uDebugMode) vDebugValue = 0.6;
      }
      
      // Core-lock protection (cursor repulsion)
      float distToCursor = distance(pos.xy, uCursorPos.xy);
      if (distToCursor < uCursorRadius) {
        vec2 repulsion = normalize(pos.xy - uCursorPos.xy) * (1.0 - distToCursor / uCursorRadius);
        pos.xy += repulsion * uRepulsionStrength;
      }
    }
    
    // Debug mode: Flash particles based on stage
    if (uDebugMode) {
      float debugFlash = sin(uTime * 5.0) * 0.1 + 1.0;
      pos *= debugFlash;
    }
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = 2.0 + float(uStage) * 0.5;
  }
`;

// Base narrative fragment shader
const NARRATIVE_FRAGMENT_SHADER = `
  uniform int uStage;
  uniform float uStageProgress;
  uniform vec3 uStageColor;
  uniform float uColorIntensity;
  uniform float uTime;
  uniform bool uDebugMode;
  
  varying vec3 vColor;
  varying float vDebugValue;
  
  void main() {
    // Create circular particles
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    float circle = 1.0 - smoothstep(0.2, 0.5, dist);
    
    // Stage-based color evolution
    vec3 color = uStageColor;
    
    // Debug mode: Show stage-specific colors
    if (uDebugMode) {
      if (uStage == 0) color = vec3(1.0, 0.0, 0.0); // Red for genesis
      else if (uStage == 1) color = vec3(1.0, 0.5, 0.0); // Orange for awakening
      else if (uStage == 2) color = vec3(1.0, 1.0, 0.0); // Yellow for structure
      else if (uStage == 3) color = vec3(0.0, 1.0, 0.0); // Green for learning
      else if (uStage == 4) color = vec3(0.0, 0.0, 1.0); // Blue for building
      else if (uStage == 5) color = vec3(1.0, 0.0, 1.0); // Magenta for mastery
      
      // Flash debug value
      color *= (vDebugValue + sin(uTime * 10.0) * 0.2 + 1.0);
    }
    
    // Breathing effect
    float pulse = sin(uTime * 1.5) * 0.1 + 0.9;
    float alpha = mix(0.4, 1.0, uStageProgress) * pulse * uColorIntensity;
    
    gl_FragColor = vec4(color * circle, alpha * circle);
  }
`;

// Alternate theme shaders (future expansion)
const ALTERNATE_THEMES = {
  retro: {
    vertex: NARRATIVE_VERTEX_SHADER.replace('sin(uTime * 2.0', 'sin(uTime * 4.0'), // Faster for retro
    fragment: NARRATIVE_FRAGMENT_SHADER.replace('sin(uTime * 1.5)', 'sin(uTime * 3.0)'), // Different pulse
  },
  minimal: {
    vertex: NARRATIVE_VERTEX_SHADER.replace('* 0.5', '* 0.2'), // Reduced movement
    fragment: NARRATIVE_FRAGMENT_SHADER.replace('* 0.1 + 0.9', '* 0.05 + 0.95'), // Subtle pulse
  },
};

// Shader system class
class NarrativeShaderSystem {
  constructor() {
    this.shaderCache = new Map();
    this.currentTheme = 'default';
    this.debugMode = process.env.NODE_ENV === 'development';
  }

  // Get shaders for specific stage
  getShadersForStage(stage, theme = 'default') {
    const cacheKey = `${stage}-${theme}`;

    if (!this.shaderCache.has(cacheKey)) {
      const stageConfig = NARRATIVE_STAGES[stage] || NARRATIVE_STAGES[0];

      let vertex = NARRATIVE_VERTEX_SHADER;
      let fragment = NARRATIVE_FRAGMENT_SHADER;

      // Apply theme modifications
      if (theme !== 'default' && ALTERNATE_THEMES[theme]) {
        vertex = ALTERNATE_THEMES[theme].vertex;
        fragment = ALTERNATE_THEMES[theme].fragment;
      }

      this.shaderCache.set(cacheKey, {
        vertex,
        fragment,
        color: stageConfig.color,
        stageConfig,
        particles: stageConfig.particles,
        overrideQuality: stageConfig.overrideQuality,
      });
    }

    return this.shaderCache.get(cacheKey);
  }

  // Create shader material for stage
  createMaterialForStage(stage, uniforms = {}, theme = 'default') {
    const shaderData = this.getShadersForStage(stage, theme);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        // Base uniforms
        uTime: { value: 0 },
        uStage: { value: stage },
        uStageProgress: { value: 0 },
        uNarrativeEnabled: { value: true },
        uDebugMode: { value: this.debugMode },
        uStageColor: { value: new THREE.Color(shaderData.color) },
        uColorIntensity: { value: 1.0 },
        uCursorPos: { value: new THREE.Vector3(0, 0, 0) },
        uCursorRadius: { value: 2.0 },
        uRepulsionStrength: { value: 0.5 },
        uVisibleWidth: { value: 10 },
        uVisibleHeight: { value: 10 },

        // Merge with provided uniforms
        ...uniforms,
      },
      vertexShader: shaderData.vertex,
      fragmentShader: shaderData.fragment,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });

    return material;
  }

  // Switch theme at runtime
  setTheme(theme) {
    this.currentTheme = theme;
    this.shaderCache.clear(); // Clear cache to force regeneration
    console.log(`🎨 Shader theme switched to: ${theme}`);
  }

  // Toggle debug mode
  toggleDebugMode() {
    this.debugMode = !this.debugMode;
    console.log(`🔍 Shader debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
    return this.debugMode;
  }

  // Get available themes
  getAvailableThemes() {
    return ['default', ...Object.keys(ALTERNATE_THEMES)];
  }

  // Get stage configuration
  getStageConfig(stage) {
    return NARRATIVE_STAGES[stage] || NARRATIVE_STAGES[0];
  }

  // Clear shader cache
  clearCache() {
    this.shaderCache.clear();
    console.log('🧹 Shader cache cleared');
  }

  // Development helpers
  precompileAllShaders() {
    if (process.env.NODE_ENV === 'development') {
      const themes = this.getAvailableThemes();
      for (let stage = 0; stage <= 5; stage++) {
        for (const theme of themes) {
          this.getShadersForStage(stage, theme);
        }
      }
      console.log(`🚀 Precompiled ${this.shaderCache.size} shader combinations`);
    }
  }
}

// Export singleton instance
export const narrativeShaderSystem = new NarrativeShaderSystem();

// Export stage configurations and shader constants
export {
  NARRATIVE_STAGES,
  NARRATIVE_VERTEX_SHADER,
  NARRATIVE_FRAGMENT_SHADER,
  ALTERNATE_THEMES,
  NarrativeShaderSystem,
};

// Development global access
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.narrativeShaderSystem = narrativeShaderSystem;
}

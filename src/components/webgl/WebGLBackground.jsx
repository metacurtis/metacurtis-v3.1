// src/components/webgl/WebGLBackground.jsx
// ENHANCED NARRATIVE PARTICLE SYSTEM - PHASE 5 COMMUNITY-VALIDATED FIX
// Applied: Remove duplicate uniforms, leverage Three.js built-ins, preserve architecture

import { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { useInteractionStore } from '@/stores/useInteractionStore';
import usePerformanceStore from '@/stores/performanceStore';
import { useNarrativeStore } from '@/stores/narrativeStore';
import { narrativeTransition } from '@/config/narrativeParticleConfig';
import WebGLEffectsManager from '@/utils/webgl/WebGLEffectsManager.js';

// Enhanced system imports (preserved)
import { narrativeShaderSystem } from '@/utils/webgl/NarrativeShaderSystem';
import { frustumAwareGenerator } from '@/utils/webgl/FrustumAwareParticleGenerator';
import { stagePerformanceManager } from '@/utils/webgl/StagePerformanceModes';
import { shaderDebugSystem } from '@/utils/webgl/ShaderDebugSystem';

const componentId = `narrative-particles-${Math.random().toString(36).substr(2, 9)}`;

/* ────────────────────────────────────────────────────────────────────────────
   NARRATIVE STATE MANAGEMENT (PRESERVED)
   ------------------------------------------------------------------------- */
const useNarrativeSelectors = () => ({
  enableNarrativeMode: usePerformanceStore(s => s.enableNarrativeMode ?? true),
  currentStage: usePerformanceStore(s => s.narrative?.currentStage ?? 0),
  stageProgress: usePerformanceStore(s => s.narrative?.progress ?? 0),
});

/* ────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT (PRESERVED ARCHITECTURE)
   ------------------------------------------------------------------------- */
export default function WebGLBackground() {
  const pointsRef = useRef();
  const materialRef = useRef();
  const geometryRef = useRef();
  const effectsManagerRef = useRef(null);

  const { size, camera } = useThree();
  const qualityLevel = useInteractionStore(s => s.qualityLevel || 'HIGH');

  // Narrative state (preserved)
  const { enableNarrativeMode, currentStage, stageProgress } = useNarrativeSelectors();

  /* ENHANCED GRID CONFIGURATION (PRESERVED) */
  const narrativeConfig = useMemo(() => {
    const effectiveQuality = stagePerformanceManager.updateStage(currentStage, qualityLevel, 60, 0);

    const baseConfig = frustumAwareGenerator.calculateOptimalGridWithCulling(
      size.width / 100,
      size.height / 100,
      currentStage,
      effectiveQuality,
      camera,
      null
    );

    const enhancedConfig = stagePerformanceManager.applyStageModifications(
      baseConfig,
      currentStage
    );

    if (shaderDebugSystem.enabled) {
      console.log(
        `🎬 Enhanced Narrative Config: Stage ${currentStage}, ${enhancedConfig.totalParticles} particles, Quality: ${effectiveQuality}`
      );
    }

    return enhancedConfig;
  }, [currentStage, qualityLevel, size.width, size.height, camera, enableNarrativeMode]);

  /* ENHANCED PARTICLE DATA GENERATION (PRESERVED) */
  const narrativeData = useMemo(() => {
    const data = frustumAwareGenerator.generateParticleDataWithCulling(
      narrativeConfig,
      currentStage
    );

    if (shaderDebugSystem.enabled) {
      const stats = frustumAwareGenerator.getCullingStats();
      console.log(`🔍 Particle generation stats:`, stats);
    }

    return data;
  }, [narrativeConfig, currentStage]);

  /* SHADER UNIFORMS - COMMUNITY FIX: Use Three.js built-ins, avoid duplicates */
  const narrativeUniforms = useMemo(
    () => ({
      // Time
      uTime: { value: 0 },
      uDeltaTime: { value: 0 },

      // Narrative state
      uNarrativeEnabled: { value: enableNarrativeMode },
      uStage: { value: currentStage },
      uStageProgress: { value: stageProgress },

      // Visual properties
      uSize: { value: Math.max(1.0, 3.0 - currentStage * 0.3) },
      uVisibleWidth: { value: narrativeConfig.visibleWidth },
      uVisibleHeight: { value: narrativeConfig.visibleHeight },

      // Colors
      uStageColor: { value: new THREE.Color(narrativeConfig.stageColor) },
      uColorIntensity: { value: 1.0 },

      // Interaction
      uCursorPos: { value: new THREE.Vector3(0, 0, 0) },
      uCursorRadius: { value: 2.0 },
      uRepulsionStrength: { value: 0.5 },

      // Performance
      uParticleDensity: {
        value:
          narrativeConfig.totalParticles /
          (narrativeConfig.visibleWidth * narrativeConfig.visibleHeight),
      },
      uTotalParticles: { value: narrativeConfig.totalParticles },

      // Scroll velocity integration
      uScrollVelocity: { value: 1.0 },

      // Debug mode - COMMUNITY FIX: Consistent int types, no conflicts
      uDebugMode: {
        value:
          process.env.NODE_ENV === 'development' ? shaderDebugSystem.currentMode?.value || 0 : 0,
      },
      uDebugIntensity: {
        value:
          process.env.NODE_ENV === 'development' ? shaderDebugSystem.debugIntensity || 1.0 : 1.0,
      },
    }),
    [narrativeConfig, enableNarrativeMode, currentStage, stageProgress]
  );

  /* NARRATIVE VERTEX SHADER - COMMUNITY FIX: No duplicate declarations */
  const narrativeVertexShader = `
    // COMMUNITY FIX: Use Three.js built-in uniforms (automatically injected)
    // No manual declaration of modelViewMatrix, projectionMatrix, etc.
    
    // Custom uniforms only
    uniform float uTime;
    uniform int uStage;
    uniform float uStageProgress;
    uniform bool uNarrativeEnabled;
    uniform vec3 uCursorPos;
    uniform float uCursorRadius;
    uniform float uRepulsionStrength;
    uniform float uScrollVelocity;
    
    // Debug uniforms - COMMUNITY FIX: Single declaration, consistent int type
    uniform int uDebugMode;
    uniform float uDebugIntensity;
    
    // Attributes (Three.js built-ins: position, color automatically available)
    attribute vec4 animationSeeds;
    attribute vec2 gridCoords;
    
    // Varyings - COMMUNITY FIX: Single declaration
    varying vec3 vColor;
    varying float vDebugValue;
    varying vec2 vGridCoords;
    
    void main() {
      vec3 pos = position;
      
      // Initialize varyings
      vColor = color;
      vGridCoords = gridCoords;
      vDebugValue = float(uStage) / 5.0; // Convert stage to debug value
      
      if (uNarrativeEnabled) {
        float personalPhase = animationSeeds.x * 100.0;
        float velocityEffect = clamp(uScrollVelocity, 0.2, 2.0);
        
        // Stage-specific animations (preserved logic)
        if (uStage == 0) {
          pos += sin(position * 0.1 + uTime * 0.05 + personalPhase) * 0.1 * velocityEffect;
        }
        else if (uStage == 1) {
          pos += sin(position * 0.3 + uTime * 0.3 + personalPhase) * mix(0.1, 0.4, uStageProgress) * velocityEffect;
          pos.y += sin(uTime * 2.0 + animationSeeds.y * 10.0) * 0.2 * uStageProgress * velocityEffect;
        }
        else if (uStage == 2) {
          pos.x += sin(gridCoords.y * 10.0 + uTime) * 0.1 * uStageProgress * velocityEffect;
          pos.y += cos(gridCoords.x * 10.0 + uTime) * 0.1 * uStageProgress * velocityEffect;
        }
        else if (uStage == 3) {
          float neural = sin(position.x * 5.0) * cos(position.y * 5.0);
          pos += normalize(position) * neural * 0.2 * uStageProgress * velocityEffect;
          pos += sin(position.yzx * 0.8 + uTime * 0.6 + personalPhase) * 0.3 * velocityEffect;
        }
        else if (uStage == 4) {
          pos += normalize(position) * sin(uTime * 1.5 + personalPhase) * 0.4 * uStageProgress * velocityEffect;
        }
        else if (uStage == 5) {
          float spiral = atan(position.y, position.x) + length(position.xy) * 2.0;
          pos.x += sin(spiral + uTime * 2.0) * 0.3 * uStageProgress * velocityEffect;
          pos.y += cos(spiral + uTime * 2.0) * 0.3 * uStageProgress * velocityEffect;
          pos += normalize(position) * sin(uTime * 1.0 + personalPhase) * 0.5 * velocityEffect;
        }
        
        // Core-lock protection (cursor repulsion)
        float distToCursor = distance(pos.xy, uCursorPos.xy);
        if (distToCursor < uCursorRadius) {
          vec2 repulsion = normalize(pos.xy - uCursorPos.xy) * (1.0 - distToCursor / uCursorRadius);
          pos.xy += repulsion * uRepulsionStrength;
        }
      }
      
      // COMMUNITY FIX: Use Three.js built-in matrices (automatically available)
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = (2.0 + float(uStage) * 0.5) * clamp(uScrollVelocity, 0.5, 1.8);
    }
  `;

  /* NARRATIVE FRAGMENT SHADER - COMMUNITY FIX: No duplicate declarations */
  const narrativeFragmentShader = `
    // Custom uniforms only
    uniform int uStage;
    uniform float uStageProgress;
    uniform vec3 uStageColor;
    uniform float uColorIntensity;
    uniform float uTime;
    uniform float uScrollVelocity;
    
    // Debug uniforms - COMMUNITY FIX: Single declaration, consistent int type
    uniform int uDebugMode;
    uniform float uDebugIntensity;
    
    // Varyings - COMMUNITY FIX: Single declaration, no conflicts
    varying vec3 vColor;
    varying float vDebugValue;
    varying vec2 vGridCoords;
    
    void main() {
      // Create circular particles
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      float circle = 1.0 - smoothstep(0.2, 0.5, dist);
      
      // Stage-based color evolution
      vec3 color = uStageColor;
      
      // Breathing effect with velocity influence
      float velocityPulse = clamp(uScrollVelocity, 0.3, 1.5);
      float pulse = sin(uTime * 1.5 * velocityPulse) * 0.1 + 0.9;
      float alpha = mix(0.4, 1.0, uStageProgress) * pulse * uColorIntensity;
      
      // Debug mode visualization - COMMUNITY FIX: Proper int comparison
      if (uDebugMode == 1) {
        // Stage debug - red tint
        color = mix(color, vec3(1.0, 0.2, 0.2), 0.3);
      } else if (uDebugMode == 2) {
        // Progress debug - green based on stage progress
        color = mix(color, vec3(0.2, 1.0, 0.2), uStageProgress * 0.5);
      } else if (uDebugMode == 3) {
        // Performance debug - blue based on debug value
        color = mix(color, vec3(0.2, 0.2, 1.0), vDebugValue * 0.5);
      }
      
      // Apply debug intensity
      if (uDebugMode > 0) {
        alpha *= uDebugIntensity;
      }
      
      gl_FragColor = vec4(color * circle, alpha * circle);
    }
  `;

  /* ENHANCED MATERIAL - COMMUNITY FIX: Use fixed shaders with enhanced systems */
  const narrativeMaterial = useMemo(() => {
    // Create base material with community-validated shaders
    const baseMaterial = new THREE.ShaderMaterial({
      uniforms: narrativeUniforms,
      vertexShader: narrativeVertexShader,
      fragmentShader: narrativeFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    // COMMUNITY FIX: Apply enhanced systems safely (no shader injection conflicts)
    let enhancedMaterial = baseMaterial;

    // Try to enhance with shader system (fallback to base if conflicts)
    try {
      if (narrativeShaderSystem.createMaterialForStage && !process.env.NODE_ENV === 'development') {
        // Only use shader system enhancements in production to avoid debug conflicts
        enhancedMaterial =
          narrativeShaderSystem.createMaterialForStage(currentStage, narrativeUniforms) ||
          baseMaterial;
      }
    } catch (error) {
      console.warn('🔧 Shader system enhancement skipped (conflict prevention):', error.message);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`🎨 Created community-fixed material for stage ${currentStage}`);
    }

    return enhancedMaterial;
  }, [currentStage, narrativeUniforms, narrativeVertexShader, narrativeFragmentShader]);

  /* ENHANCED GEOMETRY (PRESERVED) */
  const narrativeGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const actualCount = narrativeData.actualParticleCount || narrativeConfig.totalParticles;

    geometry.setAttribute('position', new THREE.BufferAttribute(narrativeData.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(narrativeData.colors, 3));
    geometry.setAttribute(
      'animationSeeds',
      new THREE.BufferAttribute(narrativeData.animationSeeds, 4)
    );
    geometry.setAttribute('gridCoords', new THREE.BufferAttribute(narrativeData.gridCoords, 2));

    // Set draw range for culled particles
    geometry.setDrawRange(0, actualCount);

    return geometry;
  }, [narrativeData, narrativeConfig]);

  // Initialize enhanced systems (PRESERVED)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Initializing enhanced narrative particle system - Phase 5 fixes applied');

      try {
        narrativeShaderSystem.precompileAllShaders?.();
        console.log(
          '🎨 Shader system ready:',
          narrativeShaderSystem.getAvailableThemes?.() || 'Basic'
        );
      } catch (error) {
        console.warn('🔧 Shader system initialization warning:', error.message);
      }

      try {
        console.log('🔍 Debug system ready:', shaderDebugSystem.getDebugInfo?.() || 'Basic');
      } catch (error) {
        console.warn('🔧 Debug system initialization warning:', error.message);
      }
    }

    // Scroll velocity listener (PRESERVED)
    const handleScrollVelocityUpdate = event => {
      const { velocity } = event.detail;
      if (narrativeMaterial.uniforms && narrativeMaterial.uniforms.uScrollVelocity) {
        narrativeMaterial.uniforms.uScrollVelocity.value = velocity;
      }
    };

    window.addEventListener('scrollVelocityUpdate', handleScrollVelocityUpdate);

    return () => {
      window.removeEventListener('scrollVelocityUpdate', handleScrollVelocityUpdate);
    };
  }, [narrativeMaterial]);

  /* EFFECTS MANAGER (PRESERVED) */
  useEffect(() => {
    effectsManagerRef.current = new WebGLEffectsManager();
    return () => effectsManagerRef.current?.destroy?.();
  }, []);

  /* ENHANCED ANIMATION LOOP (PRESERVED) */
  let lastTime = 0;
  let frameCount = 0;
  useFrame(({ clock }) => {
    const currentTime = clock.getElapsedTime();
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    frameCount++;

    if (narrativeMaterial.uniforms) {
      // Update time uniforms
      narrativeMaterial.uniforms.uTime.value = currentTime;
      narrativeMaterial.uniforms.uDeltaTime.value = deltaTime;

      // Update narrative state uniforms
      narrativeMaterial.uniforms.uNarrativeEnabled.value = enableNarrativeMode;
      narrativeMaterial.uniforms.uStage.value = currentStage;
      narrativeMaterial.uniforms.uStageProgress.value = stageProgress;

      // Update debug uniforms - COMMUNITY FIX: Safe debug system integration
      if (process.env.NODE_ENV === 'development') {
        narrativeMaterial.uniforms.uDebugMode.value = shaderDebugSystem.currentMode?.value || 0;
        narrativeMaterial.uniforms.uDebugIntensity.value = shaderDebugSystem.debugIntensity || 1.0;

        // Safe debug logging
        try {
          shaderDebugSystem.logUniformUpdate?.('uStage', currentStage, currentStage);
          shaderDebugSystem.logUniformUpdate?.('uStageProgress', stageProgress, currentStage);
        } catch (error) {
          // Continue silently if debug system unavailable
        }
      }

      // Update stage color
      if (narrativeMaterial.uniforms.uStageColor) {
        narrativeMaterial.uniforms.uStageColor.value.setStyle(narrativeConfig.stageColor);
      }
    }

    // Performance monitoring (PRESERVED)
    if (frameCount % 60 === 0) {
      const fps = Math.round(60 / (deltaTime || 0.016));
      const particleCount = narrativeConfig.totalParticles;

      try {
        usePerformanceStore.getState().updateFPS?.(fps);
        stagePerformanceManager.updateStage?.(currentStage, qualityLevel, fps, 0);
        shaderDebugSystem.logPerformance?.(fps, particleCount, currentStage);
      } catch (error) {
        // Continue if enhanced systems unavailable
      }

      if (fps < 30 && enableNarrativeMode) {
        console.warn(
          `⚠️ Low FPS (${fps}) at stage ${currentStage} with ${particleCount} particles`
        );
      }
    }
  });

  /* ENHANCED CLEANUP (PRESERVED) */
  useEffect(
    () => () => {
      narrativeGeometry?.dispose();
      narrativeMaterial?.dispose();
      effectsManagerRef.current?.destroy?.();

      if (process.env.NODE_ENV === 'development' && shaderDebugSystem.enabled) {
        console.log('🧹 Cleaning up WebGL resources - Phase 5');
      }

      try {
        const stats = frustumAwareGenerator.getCullingStats?.();
        const perfReport = stagePerformanceManager.getPerformanceReport?.();

        if (process.env.NODE_ENV === 'development') {
          console.log('📊 Final Performance Report:', perfReport);
          console.log('🔍 Final Culling Stats:', stats);
        }
      } catch (error) {
        // Continue cleanup even if enhanced systems unavailable
      }
    },
    [narrativeGeometry, narrativeMaterial]
  );

  /* RENDER (PRESERVED) */
  return (
    <>
      <color attach="background" args={['#0a0a0a']} />
      <points ref={pointsRef} geometry={narrativeGeometry} material={narrativeMaterial} />
    </>
  );
}

// src/components/webgl/WebGLBackground.jsx - Enhanced with Aurora + External Shaders
import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useInteractionStore } from '@/stores/useInteractionStore';
import { narrativeTransition } from '@/config/narrativeParticleConfig';
import WebGLEffectsManager from '@/utils/webgl/WebGLEffectsManager.js';

// EXTERNAL SHADERS: Updated paths to match your actual structure
import vertexShaderSource from '@/components/webgl/shaders/vertex.glsl';
import fragmentShaderSource from '@/components/webgl/shaders/fragment.glsl';

// Generate unique component ID for debugging
const componentId = `webglbg-${Math.random().toString(36).substr(2, 9)}`;

export default function WebGLBackground() {
  const pointsRef = useRef();
  const materialRef = useRef();
  const geometryRef = useRef();
  const effectsManagerRef = useRef(null);

  const frameCountRef = useRef(0);
  const lastLogTimeRef = useRef(0);
  const lastBaseUpdateRef = useRef(0);
  const debugLogCountRef = useRef(0); // PHASE 3: Debug logging counter

  const qualityLevel = useInteractionStore(state => state.qualityLevel || 'ULTRA');

  // UNLEASHED: 12K particles for volumetric aurora density!
  const particleConfig = useMemo(() => {
    const configs = {
      LOW: { count: 6000, baseSize: 1.8 },
      MEDIUM: { count: 8000, baseSize: 2.0 },
      HIGH: { count: 12000, baseSize: 3.5 },
      ULTRA: { count: 16000, baseSize: 5.5 }, // 16K particles at 4.5px for volumetric density!
    };
    return configs[qualityLevel] || configs.ULTRA;
  }, [qualityLevel]);

  console.log(
    `⚡ WebGLBackground-${componentId} - Quality: ${qualityLevel}, Particles: ${particleConfig.count}`
  );

  // Initialize WebGLEffectsManager
  useEffect(() => {
    console.log(`⚡ WebGLEffectsManager creating for ${componentId}...`);
    effectsManagerRef.current = new WebGLEffectsManager();
    console.log(`⚡ WebGLEffectsManager created for ${componentId}`);

    return () => {
      effectsManagerRef.current?.destroy?.();
      console.log(`⚡ WebGLEffectsManager destroyed for ${componentId}`);
    };
  }, []);

  // PHASE 1: CRITICAL FIX - Quality Defines Setup
  useEffect(() => {
    if (materialRef.current) {
      // Clear all existing defines to prevent conflicts
      materialRef.current.defines = {};

      // Set quality-specific defines based on current quality level
      switch (qualityLevel) {
        case 'MEDIUM':
          materialRef.current.defines.QUALITY_MEDIUM = true;
          console.log(`🔧 PHASE 1 FIX: Set QUALITY_MEDIUM define`);
          break;
        case 'HIGH':
          materialRef.current.defines.QUALITY_HIGH = true;
          console.log(`🔧 PHASE 1 FIX: Set QUALITY_HIGH define`);
          break;
        case 'ULTRA':
          materialRef.current.defines.QUALITY_ULTRA = true;
          console.log(`🔧 PHASE 1 FIX: Set QUALITY_ULTRA define`);
          break;
        default:
          // LOW quality - no defines needed, falls back to basic behavior
          console.log(`🔧 PHASE 1 FIX: LOW quality - no defines set (basic behavior)`);
          break;
      }

      // CRITICAL: Force shader recompilation with new defines
      materialRef.current.needsUpdate = true;

      // Debug logging to verify defines are set
      console.log(`🔧 PHASE 1 FIX: Quality Defines Updated:`, {
        qualityLevel,
        defines: materialRef.current.defines,
        definesCount: Object.keys(materialRef.current.defines).length,
      });
    }
  }, [qualityLevel]);

  // FIXED: Full viewport particle distribution
  const particleData = useMemo(() => {
    console.log(
      `⚡ Generating VOLUMETRIC 12K particle data for ${particleConfig.count} particles...`
    );

    const positions = new Float32Array(particleConfig.count * 3);
    const animFactors1 = new Float32Array(particleConfig.count * 4);
    const animFactors2 = new Float32Array(particleConfig.count * 4);

    for (let i = 0; i < particleConfig.count; i++) {
      const i3 = i * 3;
      const i4 = i * 4;

      // FIXED: More varied movement to break up "skin" effect
      positions[i3] = (Math.random() - 0.5) * 50; // x: -25 to +25 (slightly reduced)
      positions[i3 + 1] = (Math.random() - 0.5) * 35; // y: -17.5 to +17.5
      positions[i3 + 2] = (Math.random() - 0.5) * 25; // z: -12.5 to +12.5 (more depth variation)

      // animFactors1: speed, phase, randomFactor1, randomAngle
      animFactors1[i4] = 0.2 + Math.random() * 1.6; // speed (much more variation)
      animFactors1[i4 + 1] = Math.random() * Math.PI * 2; // phase
      animFactors1[i4 + 2] = Math.random(); // randomFactor1
      animFactors1[i4 + 3] = Math.random() * Math.PI * 2; // randomAngle

      // animFactors2: scaleMultiplier, swirlFactor, depthFactor, noiseScale
      animFactors2[i4] = 0.4 + Math.random() * 1.2; // scaleMultiplier (much more size variation)
      animFactors2[i4 + 1] = 0.1 + Math.random() * 0.8; // swirlFactor (more varied movement)
      animFactors2[i4 + 2] = 0.3 + Math.random() * 0.7; // depthFactor
      animFactors2[i4 + 3] = 0.5 + Math.random() * 0.5; // noiseScale
    }

    return { positions, animFactors1, animFactors2 };
  }, [particleConfig.count]);

  const uniforms = useMemo(() => {
    const currentPreset = narrativeTransition.getCurrentDisplayPreset();

    console.log(`⚡ Current preset colors:`, currentPreset.colors);
    console.log(`⚡ Current preset name:`, currentPreset.name);

    // Using your stable base size approach
    const emergencyBaseSize = currentPreset.baseSize ?? particleConfig.baseSize;

    const initialUniforms = {
      uTime: { value: 0.0 },
      uSize: { value: emergencyBaseSize },
      uScrollProgress: { value: 0.0 },
      uCursorPos: { value: new THREE.Vector3(0, 0, 0) },
      uCursorRadius: { value: currentPreset.cursorRadius ?? 2.0 },
      uRepulsionStrength: { value: currentPreset.repulsionStrength ?? 1.2 },
      // FIXED: Use actual narrative colors
      uColorA: { value: new THREE.Color(currentPreset.colors?.[0] ?? '#E040FB') },
      uColorB: { value: new THREE.Color(currentPreset.colors?.[1] ?? '#536DFE') },
      uColorC: { value: new THREE.Color(currentPreset.colors?.[2] ?? '#00E5FF') },
      uColorIntensity: { value: currentPreset.colorIntensity ?? 1.6 },

      // NEW: Aurora and ripple uniforms
      uRippleTime: { value: 0.0 },
      uRippleCenter: { value: new THREE.Vector3(0, 0, 0) },
      uRippleStrength: { value: 0.0 },
      uWavePhase: { value: 0.0 }, // Global wave phase for aurora
    };

    console.log(
      `⚡ Initializing uniforms - baseSize: ${emergencyBaseSize.toFixed(3)} from preset: ${currentPreset.name}`
    );
    console.log(
      `⚡ Colors: A=${currentPreset.colors?.[0]}, B=${currentPreset.colors?.[1]}, C=${currentPreset.colors?.[2]}`
    );

    // Initialize Effects Manager base values
    if (effectsManagerRef.current) {
      console.log(`⚡ Setting Effects Manager base values`);

      // Use setBaseUniformValue method from YOUR Effects Manager
      effectsManagerRef.current.setBaseUniformValue('uSize', initialUniforms.uSize.value);
      effectsManagerRef.current.setBaseUniformValue(
        'uColorIntensity',
        initialUniforms.uColorIntensity.value
      );
      effectsManagerRef.current.setBaseUniformValue(
        'uCursorRadius',
        initialUniforms.uCursorRadius.value
      );
      effectsManagerRef.current.setBaseUniformValue(
        'uRepulsionStrength',
        initialUniforms.uRepulsionStrength.value
      );
      effectsManagerRef.current.setBaseUniformValue('uColorA', initialUniforms.uColorA.value);
      effectsManagerRef.current.setBaseUniformValue('uColorB', initialUniforms.uColorB.value);
      effectsManagerRef.current.setBaseUniformValue('uColorC', initialUniforms.uColorC.value);
    }

    return initialUniforms;
  }, [particleConfig.baseSize]);

  const updateNarrativeMood = useCallback(
    currentTime => {
      if (!uniforms || !effectsManagerRef.current) return;

      const currentPreset = narrativeTransition.updateTransition(currentTime);
      const transitionState = narrativeTransition.getTransitionState();

      if (currentPreset) {
        // Apply base values from preset to uniforms (using your stable multiplier approach)
        const multipliedSize = Math.max(
          0.5,
          (currentPreset.baseSize ?? particleConfig.baseSize) * 2
        );
        uniforms.uSize.value = multipliedSize;
        uniforms.uColorIntensity.value = Math.max(0.1, currentPreset.colorIntensity ?? 1.6);
        uniforms.uCursorRadius.value = Math.max(0.5, currentPreset.cursorRadius ?? 2.0);
        uniforms.uRepulsionStrength.value = Math.max(0.1, currentPreset.repulsionStrength ?? 1.2);

        // FIXED: Ensure colors are properly applied
        if (currentPreset.colors && currentPreset.colors.length >= 3) {
          uniforms.uColorA.value.setStyle(currentPreset.colors[0]);
          uniforms.uColorB.value.setStyle(currentPreset.colors[1]);
          uniforms.uColorC.value.setStyle(currentPreset.colors[2]);
        }

        // Update Effects Manager base values when mood settles (FIXED: prevent update loop)
        if (!transitionState.isTransitioning && currentTime - lastBaseUpdateRef.current > 5000) {
          // Increased to 5 seconds
          console.log(`⚡ Mood settled to ${currentPreset.name} - updating manager base values`);
          console.log(
            `⚡ New colors: A=${currentPreset.colors?.[0]}, B=${currentPreset.colors?.[1]}, C=${currentPreset.colors?.[2]}`
          );

          effectsManagerRef.current.setBaseUniformValue('uSize', multipliedSize);
          effectsManagerRef.current.setBaseUniformValue(
            'uColorIntensity',
            uniforms.uColorIntensity.value
          );
          effectsManagerRef.current.setBaseUniformValue(
            'uCursorRadius',
            uniforms.uCursorRadius.value
          );
          effectsManagerRef.current.setBaseUniformValue(
            'uRepulsionStrength',
            uniforms.uRepulsionStrength.value
          );
          effectsManagerRef.current.setBaseUniformValue('uColorA', uniforms.uColorA.value);
          effectsManagerRef.current.setBaseUniformValue('uColorB', uniforms.uColorB.value);
          effectsManagerRef.current.setBaseUniformValue('uColorC', uniforms.uColorC.value);

          lastBaseUpdateRef.current = currentTime;
        }
      }
    },
    [uniforms, particleConfig.baseSize]
  );

  // PHASE 2: Enhanced letter burst with FIXED radial ripples
  const triggerEnhancedLetterBurst = useCallback(
    (event, currentElapsedTime) => {
      // PHASE 2 FIX: Accept current time parameter
      if (!effectsManagerRef.current || !uniforms) {
        console.warn(`⚡ Effects manager or uniforms not ready for enhanced burst`);
        return;
      }

      console.log(
        `🔧 PHASE 2 FIX: VOLUMETRIC Letter burst - intensity: ${event.intensity?.toFixed(3)} - 12K GOD RAYS!`
      );
      const eventIntensity = Math.min(event.intensity || 0.3, 0.7);
      const duration = 1800;

      // PHASE 2 FIX: Trigger radial ripple at click position with CORRECT timing
      if (event.position) {
        uniforms.uRippleCenter.value.set(event.position.x, event.position.y, event.position.z || 0);
        uniforms.uRippleStrength.value = eventIntensity * 2.0;

        // CRITICAL FIX: Set ripple start time to current time (not 0)
        uniforms.uRippleTime.value = currentElapsedTime; // This becomes the "start time" for the ripple

        console.log(`🔧 PHASE 2 FIX: Triggered radial ripple at position:`, event.position);
        console.log(`🔧 PHASE 2 FIX: Ripple start time set to: ${currentElapsedTime.toFixed(3)}`);
      }

      // Enhanced size and color effects
      if (effectsManagerRef.current.letterBurst) {
        effectsManagerRef.current.letterBurst(eventIntensity, duration);
        console.log(`⚡ letterBurst preset triggered with aurora enhancement`);
      } else {
        effectsManagerRef.current.addEffect({
          uniform: 'uSize',
          toValue:
            (effectsManagerRef.current.baseValues.get('uSize') ?? uniforms.uSize.value) *
            (3.5 + eventIntensity * 3.0),
          duration: duration,
          curve: 'burst',
          easing: 'easeOutQuart',
          intensity: 1.0,
        });

        effectsManagerRef.current.addEffect({
          uniform: 'uColorIntensity',
          toValue:
            (effectsManagerRef.current.baseValues.get('uColorIntensity') ??
              uniforms.uColorIntensity.value) *
            (2.5 + eventIntensity * 1.5),
          duration: duration * 0.8,
          curve: 'burst',
          easing: 'easeOutQuart',
          intensity: 1.0,
        });

        console.log(`⚡ Enhanced aurora effects triggered`);
      }

      // Update cursor position
      if (event.position && uniforms.uCursorPos) {
        uniforms.uCursorPos.value.set(event.position.x, event.position.y, event.position.z || 0);
      }
    },
    [uniforms]
  );

  const processParticleEvents = useCallback(
    (currentTime, currentElapsedTime) => {
      // PHASE 2 FIX: Accept elapsed time parameter
      const store = useInteractionStore.getState();
      const events = store.consumeInteractionEvents?.() || [];

      if (events.length > 0) {
        events.forEach(event => {
          switch (event.type) {
            case 'heroLetterBurst':
              triggerEnhancedLetterBurst(event, currentElapsedTime); // PHASE 2 FIX: Pass elapsed time
              break;
            case 'letterClick':
              console.log(`⚡ Processing letterClick event`);
              break;
            case 'particleAssembly':
              console.log(`⚡ Processing particleAssembly event (placeholder)`);
              // We'll implement this in the next phase
              break;
            default:
              console.log(`⚡ Unhandled event type: ${event.type}`);
          }
        });
      }
    },
    [triggerEnhancedLetterBurst]
  );

  useFrame(({ clock }) => {
    if (!uniforms || !pointsRef.current || !materialRef.current || !effectsManagerRef.current)
      return;

    const currentTimeMs = clock.elapsedTime * 1000;
    const currentElapsedTime = clock.elapsedTime; // For ripple timing
    frameCountRef.current++;

    // Update narrative mood and base uniforms
    updateNarrativeMood(currentTimeMs);

    // Process events every other frame for performance (with elapsed time)
    if (frameCountRef.current % 2 === 0) {
      processParticleEvents(currentTimeMs, currentElapsedTime); // PHASE 2 FIX: Pass elapsed time
    }

    // Update effects (this applies effects on top of base uniforms)
    effectsManagerRef.current.updateEffects(uniforms, currentTimeMs);

    // Update time uniform
    uniforms.uTime.value = currentElapsedTime;

    // NEW: Update aurora wave phase for lifelike movement
    uniforms.uWavePhase.value = currentElapsedTime * 0.3;

    // PHASE 2 FIX: Update ripple time and decay with CORRECT timing logic
    if (uniforms.uRippleStrength.value > 0.0) {
      // Note: uRippleTime is the START time, uTime is current time
      // The shader calculates: currentRippleAnimTime = uTime - uRippleTime
      // So we don't need to update uRippleTime here, just let the decay happen

      // Gradually decay ripple strength
      uniforms.uRippleStrength.value *= 0.995;
      if (uniforms.uRippleStrength.value < 0.01) {
        uniforms.uRippleStrength.value = 0.0;
      }
    }

    // PHASE 3: Debug logging for Aurora and Ripple uniforms (throttled)
    debugLogCountRef.current++;
    if (debugLogCountRef.current % 180 === 0) {
      // Every ~3 seconds at 60fps
      console.group(`🔧 PHASE 3 DEBUG: Aurora & Ripple Uniform Values`);
      console.log(
        `🌊 Aurora Wave Phase: ${uniforms.uWavePhase.value.toFixed(3)} (should be continuously changing)`
      );
      console.log(
        `💥 Ripple Strength: ${uniforms.uRippleStrength.value.toFixed(4)} (should be >0 during ripples)`
      );
      console.log(
        `📍 Ripple Center: (${uniforms.uRippleCenter.value.x.toFixed(2)}, ${uniforms.uRippleCenter.value.y.toFixed(2)}, ${uniforms.uRippleCenter.value.z.toFixed(2)})`
      );
      console.log(`⏰ Ripple Start Time: ${uniforms.uRippleTime.value.toFixed(3)}`);
      console.log(`⏰ Current Time: ${uniforms.uTime.value.toFixed(3)}`);
      console.log(`⚡ Current Quality Level: ${qualityLevel}`);
      console.log(`🎯 Material Defines:`, materialRef.current?.defines || 'NO DEFINES SET');
      console.groupEnd();
    }

    // Update scroll progress every 3rd frame
    if (frameCountRef.current % 3 === 0) {
      const scrollProgress = useInteractionStore.getState().scrollProgress || 0;
      uniforms.uScrollProgress.value = scrollProgress;
    }

    // Update cursor position with smooth interpolation
    const cursorPos = useInteractionStore.getState().cursorPosition;
    if (cursorPos && uniforms.uCursorPos) {
      const currentPos = uniforms.uCursorPos.value;
      const targetPos = new THREE.Vector3(cursorPos.x, cursorPos.y, cursorPos.z || 0);
      if (!currentPos.equals(targetPos)) {
        currentPos.lerp(targetPos, 0.08);
      }
    }

    // Periodic logging (reduced frequency)
    if (currentTimeMs - lastLogTimeRef.current > 8000) {
      // Increased from 5000ms to 8000ms
      const currentPresetForLog = narrativeTransition.getCurrentDisplayPreset();
      console.log(
        `⚡ System-${componentId} - 🌟 12K VOLUMETRIC PARTICLES! Preset: ${currentPresetForLog.name}, baseSize: ${uniforms.uSize.value.toFixed(3)}, Count: ${particleConfig.count}`
      );
      lastLogTimeRef.current = currentTimeMs;
    }
  });

  // Cleanup effect
  useEffect(() => {
    const currentGeometry = geometryRef.current;
    const currentMaterial = materialRef.current;
    return () => {
      if (currentGeometry) {
        currentGeometry.dispose();
      }
      if (currentMaterial) {
        currentMaterial.dispose();
      }
      console.log(`⚡ WebGLBackground-${componentId} cleanup completed`);
    };
  }, []);

  return (
    <>
      <color attach="background" args={['#0a0a0a']} />
      <points ref={pointsRef}>
        <bufferGeometry ref={geometryRef}>
          <bufferAttribute
            attach="attributes-position"
            count={particleConfig.count}
            array={particleData.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-animFactors1"
            count={particleConfig.count}
            array={particleData.animFactors1}
            itemSize={4}
          />
          <bufferAttribute
            attach="attributes-animFactors2"
            count={particleConfig.count}
            array={particleData.animFactors2}
            itemSize={4}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShaderSource}
          fragmentShader={fragmentShaderSource}
          uniforms={uniforms}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false} // Enhanced for volumetric blending
          vertexColors={false}
        />
      </points>
    </>
  );
}

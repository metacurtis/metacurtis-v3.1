// src/components/webgl/WebGLBackground.jsx - Refined for Interactive Surface Evolution
import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useInteractionStore } from '@/stores/useInteractionStore';
import { narrativeTransition } from '@/config/narrativeParticleConfig';
import WebGLEffectsManager from '@/utils/webgl/WebGLEffectsManager.js';

// EXTERNAL SHADERS
import vertexShaderSource from '@/components/webgl/shaders/vertex.glsl';
import fragmentShaderSource from '@/components/webgl/shaders/fragment.glsl';

const componentId = `webglbg-${Math.random().toString(36).substr(2, 9)}`;

export default function WebGLBackground() {
  const pointsRef = useRef();
  const materialRef = useRef();
  const geometryRef = useRef();
  const effectsManagerRef = useRef(null);

  const frameCountRef = useRef(0);
  const lastLogTimeRef = useRef(0);
  const lastBaseUpdateRef = useRef(0);
  const debugUniformLogCountRef = useRef(0);

  const { gl, size } = useThree(); // Added gl and size for capabilities log

  const qualityLevel = useInteractionStore(state => state.qualityLevel || 'ULTRA');

  const particleConfig = useMemo(() => {
    const configs = {
      LOW: { count: 6000, baseSize: 1.8 },
      MEDIUM: { count: 8000, baseSize: 2.0 },
      HIGH: { count: 12000, baseSize: 3.5 },
      ULTRA: { count: 16000, baseSize: 5.5 }, // Default baseSize for ULTRA
    };
    return configs[qualityLevel] || configs.ULTRA;
  }, [qualityLevel]);

  console.log(
    `[${componentId}] Initializing - Quality: ${qualityLevel}, Particles: ${particleConfig.count}`
  );

  // Log WebGL capabilities once
  useEffect(() => {
    if (gl && gl.getParameter) {
      try {
        const pointSizeRange = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
        console.group(`[${componentId}] WebGL Capabilities`);
        console.log(`Point Size Range: [${pointSizeRange[0]}, ${pointSizeRange[1]}]`);
        console.log(`Device Pixel Ratio: ${window.devicePixelRatio || 1}`);
        console.log(`Canvas Size: ${size.width}x${size.height}`);
        console.groupEnd();
      } catch (e) {
        console.warn(`[${componentId}] Could not query WebGL point size limits:`, e);
      }
    }
  }, [gl, size]);

  // Initialize WebGLEffectsManager
  useEffect(() => {
    console.log(`[${componentId}] WebGLEffectsManager creating...`);
    effectsManagerRef.current = new WebGLEffectsManager();
    console.log(`[${componentId}] WebGLEffectsManager created.`);
    return () => {
      effectsManagerRef.current?.destroy?.();
      console.log(`[${componentId}] WebGLEffectsManager destroyed.`);
    };
  }, []);

  // Shader Defines Setup (Quality Tiers)
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.defines = {};
      let defineSetMessage = 'LOW quality (no specific define)';
      switch (qualityLevel) {
        case 'MEDIUM':
          materialRef.current.defines.QUALITY_MEDIUM = true;
          defineSetMessage = 'QUALITY_MEDIUM define set';
          break;
        case 'HIGH':
          materialRef.current.defines.QUALITY_HIGH = true;
          defineSetMessage = 'QUALITY_HIGH define set';
          break;
        case 'ULTRA':
          materialRef.current.defines.QUALITY_ULTRA = true;
          defineSetMessage = 'QUALITY_ULTRA define set';
          break;
      }
      materialRef.current.needsUpdate = true; // Force shader recompilation
      console.log(
        `[${componentId}] Shader Quality Defines: ${defineSetMessage}`,
        materialRef.current.defines
      );
    }
  }, [qualityLevel]);

  const particleData = useMemo(() => {
    console.log(`[${componentId}] Generating particle data for ${particleConfig.count} particles.`);
    const positions = new Float32Array(particleConfig.count * 3);
    const animFactors1 = new Float32Array(particleConfig.count * 4);
    const animFactors2 = new Float32Array(particleConfig.count * 4);

    // Debug tracking for distribution
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity,
      minZ = Infinity,
      maxZ = -Infinity;
    let minScale = Infinity,
      maxScale = -Infinity;

    for (let i = 0; i < particleConfig.count; i++) {
      const i3 = i * 3;
      const i4 = i * 4;
      positions[i3] = (Math.random() - 0.5) * 50;
      minX = Math.min(minX, positions[i3]);
      maxX = Math.max(maxX, positions[i3]);
      positions[i3 + 1] = (Math.random() - 0.5) * 35;
      minY = Math.min(minY, positions[i3 + 1]);
      maxY = Math.max(maxY, positions[i3 + 1]);
      positions[i3 + 2] = (Math.random() - 0.5) * 25;
      minZ = Math.min(minZ, positions[i3 + 2]);
      maxZ = Math.max(maxZ, positions[i3 + 2]);
      animFactors1[i4] = 0.2 + Math.random() * 1.6;
      animFactors1[i4 + 1] = Math.random() * Math.PI * 2;
      animFactors1[i4 + 2] = Math.random();
      animFactors1[i4 + 3] = Math.random() * Math.PI * 2;
      animFactors2[i4] = 0.4 + Math.random() * 1.2;
      minScale = Math.min(minScale, animFactors2[i4]);
      maxScale = Math.max(maxScale, animFactors2[i4]);
      animFactors2[i4 + 1] = 0.1 + Math.random() * 0.8;
      animFactors2[i4 + 2] = 0.3 + Math.random() * 0.7;
      animFactors2[i4 + 3] = 0.5 + Math.random() * 0.5;
    }

    // console.group(`[${componentId}] Particle Data Generation Analysis`);
    // console.log(`Position Bounds: X[${minX.toFixed(2)},${maxX.toFixed(2)}], Y[${minY.toFixed(2)},${maxY.toFixed(2)}], Z[${minZ.toFixed(2)},${maxZ.toFixed(2)}]`);
    // console.log(`Scale Multiplier Range: [${minScale.toFixed(3)},${maxScale.toFixed(3)}]`);
    // console.groupEnd();

    return { positions, animFactors1, animFactors2 };
  }, [particleConfig.count]);

  const uniforms = useMemo(() => {
    const currentPreset = narrativeTransition.getCurrentDisplayPreset();

    // ⭐ TUNABLE: Adjust this multiplier for overall particle size ⭐
    const jsBaseSizeMultiplier = 2.0; // Example: 2x the preset/config base size. Try 1.0, 1.5, 2.5 etc.

    const calculatedBaseSize = currentPreset.baseSize ?? particleConfig.baseSize;
    const finalUSizValue = calculatedBaseSize * jsBaseSizeMultiplier;

    const initialUniforms = {
      uTime: { value: 0.0 },
      uSize: { value: finalUSizValue },
      uScrollProgress: { value: 0.0 },
      uCursorPos: { value: new THREE.Vector3(0, 0, 0) },
      uCursorRadius: { value: currentPreset.cursorRadius ?? 2.0 },
      uRepulsionStrength: { value: currentPreset.repulsionStrength ?? 1.2 },
      uColorA: { value: new THREE.Color(currentPreset.colors?.[0] ?? '#E040FB') },
      uColorB: { value: new THREE.Color(currentPreset.colors?.[1] ?? '#536DFE') },
      uColorC: { value: new THREE.Color(currentPreset.colors?.[2] ?? '#00E5FF') },
      uColorIntensity: { value: currentPreset.colorIntensity ?? 1.6 },
      uRippleTime: { value: 0.0 },
      uRippleCenter: { value: new THREE.Vector3(0, 0, 0) },
      uRippleStrength: { value: 0.0 },
      uWavePhase: { value: 0.0 },
    };

    console.log(
      `[${componentId}] Uniforms Initialized. Preset: ${currentPreset.name}, Original BaseSize: ${calculatedBaseSize.toFixed(2)}, JS Multiplier: ${jsBaseSizeMultiplier.toFixed(1)}, Final uSize: ${finalUSizValue.toFixed(2)}`
    );

    if (effectsManagerRef.current) {
      // console.log(`[${componentId}] Setting initial Effects Manager base values.`);
      Object.keys(initialUniforms).forEach(key => {
        const uniformEntry = initialUniforms[key];
        if (
          typeof uniformEntry.value === 'number' ||
          uniformEntry.value instanceof THREE.Color ||
          uniformEntry.value instanceof THREE.Vector3
        ) {
          effectsManagerRef.current.setBaseUniformValue(key, uniformEntry.value);
        }
      });
    }
    return initialUniforms;
  }, [particleConfig.baseSize]);

  const updateNarrativeMood = useCallback(
    currentTime => {
      if (!uniforms || !effectsManagerRef.current) return;
      const currentPreset = narrativeTransition.updateTransition(currentTime);
      const transitionState = narrativeTransition.getTransitionState();

      if (currentPreset) {
        // ⭐ ENSURE CONSISTENT MULTIPLIER WITH useMemo for uniforms ⭐
        const jsBaseSizeMultiplier = 2.0; // Keep this the same as in 'uniforms' useMemo
        const calculatedBaseSize = currentPreset.baseSize ?? particleConfig.baseSize;
        const finalUSizValue = Math.max(0.5, calculatedBaseSize * jsBaseSizeMultiplier);

        uniforms.uSize.value = finalUSizValue;
        uniforms.uColorIntensity.value = Math.max(0.1, currentPreset.colorIntensity ?? 1.6);
        uniforms.uCursorRadius.value = Math.max(0.5, currentPreset.cursorRadius ?? 2.0);
        uniforms.uRepulsionStrength.value = Math.max(0.1, currentPreset.repulsionStrength ?? 1.2);

        if (currentPreset.colors && currentPreset.colors.length >= 3) {
          uniforms.uColorA.value.setStyle(currentPreset.colors[0]);
          uniforms.uColorB.value.setStyle(currentPreset.colors[1]);
          uniforms.uColorC.value.setStyle(currentPreset.colors[2]);
        }

        if (!transitionState.isTransitioning && currentTime - lastBaseUpdateRef.current > 2000) {
          // console.log(`[${componentId}] Mood settled: ${currentPreset.name}. Updating manager base values (uSize: ${finalUSizValue.toFixed(2)}).`);
          effectsManagerRef.current.setBaseUniformValue('uSize', uniforms.uSize.value);
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

  const triggerEnhancedLetterBurst = useCallback(
    (event, currentElapsedTime) => {
      if (!effectsManagerRef.current || !uniforms) return;

      // console.log(`[${componentId}] Letter Burst Triggered: intensity=${event.intensity?.toFixed(2)}`);
      const eventIntensity = Math.min(event.intensity || 0.3, 0.7);
      const duration = 1800;

      if (event.position) {
        uniforms.uRippleCenter.value.set(event.position.x, event.position.y, event.position.z || 0);
        uniforms.uRippleStrength.value = eventIntensity * 2.0; // Initial ripple strength
        uniforms.uRippleTime.value = currentElapsedTime; // Ripple start time
        // console.log(`[${componentId}] Ripple Initiated: Center=(${event.position.x.toFixed(2)}), Strength=${uniforms.uRippleStrength.value.toFixed(2)}, StartTime=${currentElapsedTime.toFixed(2)}`);
      }

      if (effectsManagerRef.current.letterBurst) {
        effectsManagerRef.current.letterBurst(eventIntensity, duration);
      } else {
        const baseSizeForEffect =
          effectsManagerRef.current.baseValues.get('uSize') ?? uniforms.uSize.value;
        // ⭐ Tune these burst multipliers based on the new baseSize ⭐
        const burstSizeMultiplier = 1.2 + eventIntensity * 0.5; // Example: Reduced for larger base
        const burstIntensityMultiplier = 1.1 + eventIntensity * 0.3; // Example: Reduced

        effectsManagerRef.current.addEffect({
          uniform: 'uSize',
          toValue: baseSizeForEffect * burstSizeMultiplier,
          duration: duration,
          curve: 'burst',
          easing: 'easeOutQuart',
          intensity: 1.0,
        });
        effectsManagerRef.current.addEffect({
          uniform: 'uColorIntensity',
          toValue:
            (effectsManagerRef.current.baseValues.get('uColorIntensity') ??
              uniforms.uColorIntensity.value) * burstIntensityMultiplier,
          duration: duration * 0.8,
          curve: 'burst',
          easing: 'easeOutQuart',
          intensity: 1.0,
        });
      }
      if (event.position && uniforms.uCursorPos) {
        uniforms.uCursorPos.value.set(event.position.x, event.position.y, event.position.z || 0);
      }
    },
    [uniforms]
  );

  const processParticleEvents = useCallback(
    (currentTime, currentElapsedTime) => {
      const store = useInteractionStore.getState();
      const events = store.consumeInteractionEvents?.() || [];
      if (events.length > 0) {
        events.forEach(event => {
          switch (event.type) {
            case 'heroLetterBurst':
              triggerEnhancedLetterBurst(event, currentElapsedTime);
              break;
            // Other event types can be logged if needed for debugging
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
    const currentElapsedTime = clock.elapsedTime;
    frameCountRef.current++;

    updateNarrativeMood(currentTimeMs);

    if (frameCountRef.current % 2 === 0) {
      processParticleEvents(currentTimeMs, currentElapsedTime);
    }

    effectsManagerRef.current.updateEffects(uniforms, currentTimeMs);

    uniforms.uTime.value = currentElapsedTime;
    uniforms.uWavePhase.value = currentElapsedTime * 0.3; // Aurora global animation

    if (uniforms.uRippleStrength.value > 0.0) {
      uniforms.uRippleStrength.value *= 0.995; // Ripple decay
      if (uniforms.uRippleStrength.value < 0.01) {
        uniforms.uRippleStrength.value = 0.0;
      }
    }

    // Throttled detailed uniform logging for active Aurora/Ripple tuning
    debugUniformLogCountRef.current++;
    if (debugUniformLogCountRef.current % 180 === 0) {
      // Approx every 3 seconds
      console.group(`[${componentId}] Animation Uniforms Snapshot`);
      console.log(
        `Time: ${uniforms.uTime.value.toFixed(2)}, WavePhase: ${uniforms.uWavePhase.value.toFixed(2)}`
      );
      console.log(
        `Ripple: Strength=${uniforms.uRippleStrength.value.toFixed(3)}, Center=(${uniforms.uRippleCenter.value.x.toFixed(2)}), StartTime=${uniforms.uRippleTime.value.toFixed(2)}`
      );
      console.log(`Quality: ${qualityLevel}, Defines:`, materialRef.current?.defines);
      console.groupEnd();
    }

    if (frameCountRef.current % 3 === 0) {
      const scrollProgress = useInteractionStore.getState().scrollProgress || 0;
      uniforms.uScrollProgress.value = scrollProgress;
    }

    const cursorPos = useInteractionStore.getState().cursorPosition;
    if (cursorPos && uniforms.uCursorPos) {
      const currentPos = uniforms.uCursorPos.value;
      const targetPos = new THREE.Vector3(cursorPos.x, cursorPos.y, cursorPos.z || 0);
      if (!currentPos.equals(targetPos)) {
        currentPos.lerp(targetPos, 0.08);
      }
    }

    if (currentTimeMs - lastLogTimeRef.current > 8000) {
      const currentPresetForLog = narrativeTransition.getCurrentDisplayPreset();
      console.log(
        `[${componentId}] System Status - Preset: ${currentPresetForLog.name}, uSize: ${uniforms.uSize.value.toFixed(2)}, Particles: ${particleConfig.count}`
      );
      lastLogTimeRef.current = currentTimeMs;
    }
  });

  useEffect(() => {
    const currentGeometry = geometryRef.current;
    const currentMaterial = materialRef.current;
    return () => {
      if (currentGeometry) currentGeometry.dispose();
      if (currentMaterial) currentMaterial.dispose();
      // console.log(`[${componentId}] WebGL resources cleanup completed.`);
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
          depthTest={false}
          vertexColors={false}
        />
      </points>
    </>
  );
}

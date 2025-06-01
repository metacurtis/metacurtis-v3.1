// src/components/webgl/WebGLBackground.jsx - PROFESSIONAL SHADER RESTORATION
import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useInteractionStore } from '@/stores/useInteractionStore';
import { narrativeTransition } from '@/config/narrativeParticleConfig';
import WebGLEffectsManager from '@/utils/webgl/WebGLEffectsManager.js';

// PROFESSIONAL SHADER IMPORTS - Multiple strategies
let vertexShaderSource = null;
let fragmentShaderSource = null;

// Strategy 1: Direct string imports (bypassing GLSL plugin temporarily)
try {
  // We'll load your actual shader content directly
  vertexShaderSource = `// Uniforms
uniform float uTime;
uniform float uSize; // This will now dynamically control particle size
uniform float uScrollProgress;
uniform vec3 uCursorPos;
uniform float uCursorRadius;
uniform float uRepulsionStrength;

// Attributes
attribute vec4 animFactors1; // x: speed, y: phase, z: randomFactor1, w: randomAngle
attribute vec4 animFactors2; // x: scaleMultiplier, y: swirlFactor, z: depthFactor, w: noiseScale

// Varyings
varying vec3 vColorFactor;
varying float vAlpha;
varying vec3 vWorldPosition;

// snoise function is assumed to be prepended from noise.glsl
// Ensure noiseString in WebGLBackground.jsx is valid and contains snoise if uncommenting below.

void main() {
  vec3 workingPosition = position;

  float speed = animFactors1.x;
  float phase = animFactors1.y;
  float randomFactor1 = animFactors1.z;
  float randomAngle = animFactors1.w;
  float scaleMultiplier = animFactors2.x; // For size variation per particle
  float swirlFactor = animFactors2.y;
  float depthFactor = animFactors2.z;
  float noiseDisplacementScale = animFactors2.w;

  float time = uTime * speed + phase;

  // Swirling motion
  float swirlRadius = 0.5 + randomFactor1 * 0.5;
  workingPosition.x += cos(time + randomAngle) * swirlRadius * swirlFactor;
  workingPosition.z += sin(time + randomAngle) * swirlRadius * swirlFactor;

  // Noise-based displacement (Uncomment if noise.glsl is set up)
  /*
  float noiseStrength = 0.5 * noiseDisplacementScale;
  #if defined(QUALITY_MEDIUM) || defined(QUALITY_HIGH) || defined(QUALITY_ULTRA)
    vec3 noiseInput = workingPosition * 0.15 + vec3(uTime * speed * 0.1);
    workingPosition.x += snoise(noiseInput + vec3(0.0, 1.0, 2.0)) * noiseStrength;
    workingPosition.y += snoise(noiseInput + vec3(1.0, 2.0, 0.0)) * noiseStrength;
  #endif
  #if defined(QUALITY_HIGH) || defined(QUALITY_ULTRA)
    vec3 noiseInputForZ = workingPosition * 0.15 + vec3(uTime * speed * 0.1);
    workingPosition.z += snoise(noiseInputForZ + vec3(2.0, 0.0, 1.0)) * noiseStrength * 1.5;
  #endif
  */

  // Scroll-based animation
  workingPosition.z += uScrollProgress * -15.0 * depthFactor;

  // Cursor interaction
  vec3 fromCursor = workingPosition - uCursorPos;
  float distToCursor = length(fromCursor);
  float interactionEffect = 0.0;
  if (distToCursor < uCursorRadius && uCursorRadius > 0.0) {
    interactionEffect = smoothstep(uCursorRadius, uCursorRadius * 0.1, distToCursor);
    workingPosition += normalize(fromCursor) * interactionEffect * uRepulsionStrength * (1.0 + randomFactor1);
  }

  vec4 modelPosition = modelMatrix * vec4(workingPosition, 1.0);
  vWorldPosition = modelPosition.xyz;
  vec4 viewPosition = viewMatrix * modelPosition;
  gl_Position = projectionMatrix * viewPosition;

  // --- Calculate final pointSize using uSize ---
  float pointSize = uSize * scaleMultiplier;
  pointSize *= (1.0 + interactionEffect * 2.5); // Interaction can boost size

  // Optional: Distance-based attenuation (perspective scaling)
  // If you enable this, you'll likely need to use larger base uSize values.
  // The '2.0' factor controls how quickly particles shrink. Larger (e.g., 15.0) = less aggressive.
  /*
  #if defined(QUALITY_HIGH) || defined(QUALITY_ULTRA)
    if (viewPosition.z < -0.01) { 
      pointSize *= (2.0 / -viewPosition.z); 
    }
  #endif
  */

  // Clamp to a min and a reasonably large max. Adjust max (400.0) if needed.
  gl_PointSize = clamp(pointSize, 0.5, 400.0); // Min size can be small

  // Pass varyings to fragment shader
  vColorFactor = vec3(randomFactor1, speed, phase / (2.0 * 3.14159265));
  vAlpha = clamp(1.0 - interactionEffect * 1.8, 0.15, 1.0); 
}`;

  fragmentShaderSource = `uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uColorIntensity;
uniform float uTime; // For shimmer

varying vec3 vColorFactor;
varying float vAlpha;
varying vec3 vWorldPosition; // For shimmer

// snoise function is assumed to be prepended from noise.glsl if used by shimmer
// float snoise(vec3 v); 

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  float mask = smoothstep(0.5, 0.45, dist); // Soft circular mask

  if (mask < 0.01) { // Discard fully transparent pixels outside the circle
    discard;
  }

  // Original Color mixing
  vec3 color = mix(uColorA, uColorB, smoothstep(0.0, 1.0, vColorFactor.x));
  color = mix(color, uColorC, smoothstep(0.0, 1.0, vColorFactor.y));

  // Optional: Add shimmer (Uncomment if snoise is available and desired)
  /*
  #if defined(QUALITY_MEDIUM) || defined(QUALITY_HIGH) || defined(QUALITY_ULTRA)
    float timeColorShift = (sin(uTime * 0.5 + vWorldPosition.x * 0.2 + vWorldPosition.y * 0.1) + 1.0) * 0.5;
    vec3 shimmerColor = mix(uColorA * 0.7, uColorC * 1.3, sin(uTime * 2.0 + vColorFactor.z * 5.0) * 0.5 + 0.5); 
    color = mix(color, shimmerColor, timeColorShift * 0.25 * vColorFactor.z);
  #endif
  */

  color *= uColorIntensity;

  gl_FragColor = vec4(color, vAlpha * mask);
}`;

  console.log('✅ PROFESSIONAL: Using your exact shader code directly');
} catch (error) {
  console.error('❌ PROFESSIONAL: Could not load shader content:', error);
}

// Generate unique component ID for debugging
const componentId = Math.random().toString(36).substr(2, 9);

export default function WebGLBackground() {
  // Refs for WebGL objects
  const pointsRef = useRef();
  const materialRef = useRef();
  const geometryRef = useRef();
  const effectsManagerRef = useRef(null);

  // Performance and state tracking
  const frameCountRef = useRef(0);
  const lastLogTimeRef = useRef(0);
  const lastBaseUpdateRef = useRef(0);
  const { camera, size } = useThree();

  // Get quality level from your existing system
  const qualityLevel = useInteractionStore(state => state.qualityLevel || 'HIGH');

  // Particle configuration based on quality
  const particleConfig = useMemo(() => {
    const configs = {
      LOW: { count: 3000, baseSize: 4.0 },
      MEDIUM: { count: 5000, baseSize: 5.0 },
      HIGH: { count: 5000, baseSize: 5.0 },
      ULTRA: { count: 8000, baseSize: 5.0 },
    };
    return configs[qualityLevel] || configs.HIGH;
  }, [qualityLevel]);

  console.log(
    `⚡ PROFESSIONAL WebGLBackground-${componentId} - Quality: ${qualityLevel}, Particles: ${particleConfig.count}`
  );

  // ===============================
  // EFFECTS MANAGER SETUP
  // ===============================
  useEffect(() => {
    console.log(`⚡ WebGLEffectsManager instance creating...`);
    effectsManagerRef.current = new WebGLEffectsManager();
    console.log(`⚡ WebGLEffectsManager instance created successfully`);

    return () => {
      effectsManagerRef.current?.destroy?.();
      console.log(`⚡ WebGLEffectsManager instance destroyed`);
    };
  }, []);

  // ===============================
  // PROFESSIONAL PARTICLE GENERATION (YOUR ORIGINAL STRUCTURE)
  // ===============================
  const particleData = useMemo(() => {
    console.log(
      `⚡ Generating PROFESSIONAL particle data for ${particleConfig.count} particles...`
    );

    const positions = new Float32Array(particleConfig.count * 3);
    const animFactors1 = new Float32Array(particleConfig.count * 4);
    const animFactors2 = new Float32Array(particleConfig.count * 4);

    for (let i = 0; i < particleConfig.count; i++) {
      const i3 = i * 3;
      const i4 = i * 4;

      // Position: Spread particles in 3D space
      positions[i3] = (Math.random() - 0.5) * 20; // x
      positions[i3 + 1] = (Math.random() - 0.5) * 12; // y
      positions[i3 + 2] = (Math.random() - 0.5) * 8; // z

      // Animation factors 1: speed, phase, randomFactor1, randomAngle
      animFactors1[i4] = 0.5 + Math.random() * 1.5; // speed
      animFactors1[i4 + 1] = Math.random() * Math.PI * 2; // phase
      animFactors1[i4 + 2] = Math.random(); // randomFactor1
      animFactors1[i4 + 3] = Math.random() * Math.PI * 2; // randomAngle

      // Animation factors 2: scaleMultiplier, swirlFactor, depthFactor, noiseScale
      animFactors2[i4] = 0.8 + Math.random() * 0.4; // scaleMultiplier
      animFactors2[i4 + 1] = 0.3 + Math.random() * 0.7; // swirlFactor
      animFactors2[i4 + 2] = 0.5 + Math.random() * 0.5; // depthFactor
      animFactors2[i4 + 3] = 0.5 + Math.random() * 0.5; // noiseScale
    }

    return { positions, animFactors1, animFactors2 };
  }, [particleConfig.count]);

  // ===============================
  // PROFESSIONAL SHADER UNIFORMS (YOUR ORIGINAL STRUCTURE)
  // ===============================
  const uniforms = useMemo(() => {
    // Get initial preset for base values
    const currentPreset = narrativeTransition.getCurrentDisplayPreset();

    const initialUniforms = {
      // Vertex shader uniforms (from your vertex.glsl)
      uTime: { value: 0.0 },
      uSize: { value: currentPreset.baseSize || particleConfig.baseSize },
      uScrollProgress: { value: 0.0 },
      uCursorPos: { value: new THREE.Vector3(0, 0, 0) },
      uCursorRadius: { value: currentPreset.cursorRadius || 1.5 },
      uRepulsionStrength: { value: currentPreset.repulsionStrength || 0.8 },

      // Fragment shader uniforms (from your fragment.glsl)
      uColorA: { value: new THREE.Color(currentPreset.colors[0] || '#E040FB') },
      uColorB: { value: new THREE.Color(currentPreset.colors[1] || '#536DFE') },
      uColorC: { value: new THREE.Color(currentPreset.colors[2] || '#00E5FF') },
      uColorIntensity: { value: currentPreset.colorIntensity || 1.3 },
    };

    console.log(
      `⚡ Initializing PROFESSIONAL uniforms - baseSize: ${initialUniforms.uSize.value.toFixed(3)}`
    );

    // Initialize effects manager base values
    if (effectsManagerRef.current) {
      console.log(`⚡ Initializing Effects Manager base values`);
      Object.keys(initialUniforms).forEach(key => {
        const uniform = initialUniforms[key];
        if (
          typeof uniform.value === 'number' ||
          uniform.value instanceof THREE.Color ||
          uniform.value instanceof THREE.Vector3
        ) {
          effectsManagerRef.current.setBaseUniformValue(key, uniform.value);
        }
      });
    }

    return initialUniforms;
  }, [particleConfig.baseSize, particleConfig.count]);

  // ===============================
  // NARRATIVE MOOD UPDATES (YOUR ORIGINAL LOGIC)
  // ===============================
  const updateNarrativeMood = useCallback(
    currentTime => {
      if (!uniforms || !effectsManagerRef.current) return;

      // Update narrative transition
      const currentPreset = narrativeTransition.updateTransition(currentTime);
      const transitionState = narrativeTransition.getTransitionState();

      // Update base uniforms from current preset
      if (currentPreset) {
        uniforms.uSize.value = currentPreset.baseSize || particleConfig.baseSize;
        uniforms.uColorIntensity.value = currentPreset.colorIntensity || 1.3;
        uniforms.uCursorRadius.value = currentPreset.cursorRadius || 1.5;
        uniforms.uRepulsionStrength.value = currentPreset.repulsionStrength || 0.8;

        // Update colors
        if (currentPreset.colors && currentPreset.colors.length >= 3) {
          uniforms.uColorA.value.setStyle(currentPreset.colors[0]);
          uniforms.uColorB.value.setStyle(currentPreset.colors[1]);
          uniforms.uColorC.value.setStyle(currentPreset.colors[2]);
        }

        // Update effects manager base values when mood settles (throttled)
        if (!transitionState.isTransitioning && currentTime - lastBaseUpdateRef.current > 500) {
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
          lastBaseUpdateRef.current = currentTime;

          console.log(`⚡ Mood settled to ${currentPreset.name} - updating manager base values`);
        }
      }

      return currentPreset;
    },
    [uniforms, particleConfig.baseSize]
  );

  // ===============================
  // PROFESSIONAL PARTICLE BURST EFFECTS
  // ===============================
  const triggerProfessionalLetterBurst = useCallback(
    event => {
      if (!effectsManagerRef.current || !uniforms) {
        console.warn(`⚡ Effects manager or uniforms not ready for burst`);
        return;
      }

      console.log(`⚡ PROFESSIONAL Letter burst - intensity: ${event.intensity.toFixed(3)}`);

      const eventIntensity = Math.min(event.intensity || 0.3, 0.5);
      const duration = 1400;

      // Use the professional letterBurst preset method if available
      if (effectsManagerRef.current.letterBurst) {
        effectsManagerRef.current.letterBurst(eventIntensity, duration);
        console.log(`[WebGLEffectsManager] Professional letterBurst preset triggered`);
      } else {
        // Fallback to manual effects
        effectsManagerRef.current.addEffect({
          uniform: 'uSize',
          toValue: effectsManagerRef.current.baseValues.get('uSize') * (2.2 + eventIntensity * 2.3),
          duration: duration,
          curve: 'burst',
          easing: 'easeOutQuart',
          intensity: 1.0,
        });

        effectsManagerRef.current.addEffect({
          uniform: 'uColorIntensity',
          toValue:
            effectsManagerRef.current.baseValues.get('uColorIntensity') *
            (1.6 + eventIntensity * 0.8),
          duration: duration * 0.8,
          curve: 'burst',
          easing: 'easeOutQuart',
          intensity: 1.0,
        });

        console.log(`[WebGLEffectsManager] Manual letterBurst effects triggered`);
      }

      // Update cursor position for repulsion effect
      if (event.position && uniforms.uCursorPos) {
        uniforms.uCursorPos.value.set(event.position.x, event.position.y, event.position.z || 0);
      }
    },
    [uniforms]
  );

  // ===============================
  // INTERACTION EVENT PROCESSING
  // ===============================
  const processParticleEvents = useCallback(
    currentTime => {
      const store = useInteractionStore.getState();
      const events = store.consumeInteractionEvents?.() || [];

      if (events.length > 0) {
        events.forEach(event => {
          switch (event.type) {
            case 'heroLetterBurst':
              triggerProfessionalLetterBurst(event);
              break;
            case 'letterClick':
              console.log(`⚡ Processing letterClick event`);
              break;
            default:
              console.log(`⚡ Unhandled event type: ${event.type}`);
          }
        });
      }
    },
    [triggerProfessionalLetterBurst]
  );

  // ===============================
  // MAIN RENDER LOOP (OPTIMIZED)
  // ===============================
  useFrame(({ clock }) => {
    if (!uniforms || !pointsRef.current || !effectsManagerRef.current) return;

    const currentTime = clock.elapsedTime * 1000;
    frameCountRef.current++;

    // 1. Update narrative mood transitions (throttled)
    updateNarrativeMood(currentTime);

    // 2. Process new interaction events (throttled)
    if (frameCountRef.current % 2 === 0) {
      processParticleEvents(currentTime);
    }

    // 3. Update effects manager (applies all active effects)
    effectsManagerRef.current.updateEffects(uniforms, currentTime);

    // 4. Update time-based uniforms
    uniforms.uTime.value = clock.elapsedTime;

    // 5. Update scroll progress (throttled)
    if (frameCountRef.current % 3 === 0) {
      const scrollProgress = useInteractionStore.getState().scrollProgress || 0;
      uniforms.uScrollProgress.value = scrollProgress;
    }

    // 6. Update cursor position (smooth interpolation)
    const cursorPos = useInteractionStore.getState().cursorPosition;
    if (cursorPos && !uniforms.uCursorPos.value.equals(cursorPos)) {
      uniforms.uCursorPos.value.lerp(cursorPos, 0.08);
    }

    // Throttled logging (every 3 seconds)
    if (currentTime - lastLogTimeRef.current > 3000) {
      const currentPreset = narrativeTransition.getCurrentDisplayPreset();
      console.log(
        `⚡ PROFESSIONAL System-${componentId} 📊 Preset: ${currentPreset.name}, baseSize: ${uniforms.uSize.value.toFixed(3)}, Quality: ${qualityLevel}`
      );
      lastLogTimeRef.current = currentTime;
    }
  });

  // ===============================
  // COMPONENT CLEANUP
  // ===============================
  useEffect(() => {
    return () => {
      if (geometryRef.current) {
        geometryRef.current.dispose();
      }
      if (materialRef.current) {
        materialRef.current.dispose();
      }
      console.log(`⚡ PROFESSIONAL WebGLBackground-${componentId} cleanup completed`);
    };
  }, []);

  // ===============================
  // RENDER JSX WITH YOUR PROFESSIONAL SHADERS
  // ===============================
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
          vertexColors={false}
        />
      </points>
    </>
  );
}

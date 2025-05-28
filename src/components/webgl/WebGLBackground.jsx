// src/components/webgl/WebGLBackground.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useQualityStore } from '@/stores/qualityStore';
import { useInteractionStore } from '@/stores/useInteractionStore';
import { useNarrativeStore } from '@/stores/useNarrativeStore'; // NEW: Narrative integration
import useResourceTracker from '@/hooks/useResourceTracker';
import { wrapQualityDefines } from '@/utils/shaderUtils';

// Importing shader strings
import noiseString from './shaders/noise.glsl';
import vertexString from './shaders/vertex.glsl';
import fragmentString from './shaders/fragment.glsl';

// Log shader string lengths on import (for debugging purposes)
console.log('WebGLBackground: Imported full noiseString length:', noiseString?.length);
console.log('WebGLBackground: Imported full vertexString length:', vertexString?.length);
console.log('WebGLBackground: Imported full fragmentString length:', fragmentString?.length);

// === PARTICLE EVENT PROCESSING SYSTEM ===

/**
 * Process interaction events and trigger corresponding particle effects
 * @param {Object} event - Event from interaction store
 * @param {Object} uniforms - Shader uniforms object
 * @param {number} currentTime - Current animation time
 */
const processParticleEvent = (event, uniforms, currentTime) => {
  console.log(`[ParticleEventProcessor] Processing event: ${event.type}`, event);

  switch (event.type) {
    case 'heroLetterBurst':
      triggerLetterBurst(event, uniforms, currentTime);
      break;

    case 'letterClick':
      triggerLetterClick(event, uniforms, currentTime);
      break;

    case 'narrativeRipple':
      triggerNarrativeRipple(event, uniforms, currentTime);
      break;

    case 'narrativeHighlight':
      triggerNarrativeHighlight(event, uniforms, currentTime);
      break;

    case 'moodTransition':
      triggerMoodTransition(event, uniforms, currentTime);
      break;

    default:
      console.warn(`[ParticleEventProcessor] Unknown event type: ${event.type}`);
  }
};

/**
 * Hero letter burst effect (maintains existing behavior)
 * @param {Object} event - Event with position and intensity
 * @param {Object} uniforms - Shader uniforms
 * @param {number} currentTime - Current time
 */
const triggerLetterBurst = (event, uniforms, currentTime) => {
  if (!event.position || !uniforms.uCursorPos) return;

  // Set cursor position to trigger existing repulsion effect
  uniforms.uCursorPos.value.set(event.position.x, event.position.y, event.position.z || 0);

  // Temporarily boost repulsion for burst effect
  const originalRepulsion = uniforms.uRepulsionStrength.value;
  uniforms.uRepulsionStrength.value = originalRepulsion * (event.intensity || 1.0) * 2.0;

  // Reset repulsion after short duration
  setTimeout(() => {
    if (uniforms.uRepulsionStrength) {
      uniforms.uRepulsionStrength.value = originalRepulsion;
    }
  }, 300);

  console.log(
    `[ParticleEffects] Letter burst at (${event.position.x}, ${event.position.y}) intensity: ${event.intensity}`
  );
};

/**
 * Letter click effect with visual feedback
 * @param {Object} event - Event with letterIndex and section
 * @param {Object} uniforms - Shader uniforms
 * @param {number} currentTime - Current time
 */
const triggerLetterClick = (event, uniforms, currentTime) => {
  // Create position based on letter index (rough approximation)
  const letterPositions = [
    { x: -3, y: 0, z: 0 }, // M
    { x: -1, y: 0, z: 0 }, // C
    { x: 1, y: 0, z: 0 }, // 3
    { x: 3, y: 0, z: 0 }, // V
  ];

  const position = letterPositions[event.letterIndex] || letterPositions[0];

  // Trigger burst effect at letter position
  triggerLetterBurst(
    {
      ...event,
      position,
      intensity: 1.5,
    },
    uniforms,
    currentTime
  );

  // Brief color intensity flash
  if (uniforms.uColorIntensity) {
    const originalIntensity = uniforms.uColorIntensity.value;
    uniforms.uColorIntensity.value = originalIntensity * 1.8;

    setTimeout(() => {
      if (uniforms.uColorIntensity) {
        uniforms.uColorIntensity.value = originalIntensity;
      }
    }, 200);
  }

  console.log(`[ParticleEffects] Letter ${event.letterIndex} clicked in section: ${event.section}`);
};

/**
 * Narrative ripple effect for story moments
 * @param {Object} event - Event with center point and ripple parameters
 * @param {Object} uniforms - Shader uniforms
 * @param {number} currentTime - Current time
 */
const triggerNarrativeRipple = (event, uniforms, currentTime) => {
  if (!event.center || !uniforms.uCursorPos) return;

  // Create expanding ripple effect by manipulating cursor radius over time
  const rippleDuration = event.duration || 2000; // 2 seconds
  const maxRadius = event.maxRadius || 5.0;
  const startRadius = uniforms.uCursorRadius.value;

  let rippleStartTime = currentTime * 1000; // Convert to milliseconds

  const animateRipple = () => {
    const elapsed = currentTime * 1000 - rippleStartTime;
    const progress = Math.min(elapsed / rippleDuration, 1);

    if (progress < 1) {
      // Expand then contract
      const rippleProgress =
        progress < 0.5
          ? progress * 2 // Expand phase
          : 2 - progress * 2; // Contract phase

      uniforms.uCursorRadius.value = startRadius + maxRadius * rippleProgress;
      uniforms.uCursorPos.value.set(event.center.x, event.center.y, event.center.z || 0);

      requestAnimationFrame(animateRipple);
    } else {
      // Reset to original values
      uniforms.uCursorRadius.value = startRadius;
    }
  };

  animateRipple();
  console.log(`[ParticleEffects] Narrative ripple at (${event.center.x}, ${event.center.y})`);
};

/**
 * Highlight effect for interactive narrative elements
 * @param {Object} event - Event with target area and highlight parameters
 * @param {Object} uniforms - Shader uniforms
 * @param {number} currentTime - Current time
 */
const triggerNarrativeHighlight = (event, uniforms, _currentTime) => {
  if (!event.area || !uniforms.uCursorPos) return;

  // Create pulsing highlight effect
  const pulseDuration = event.duration || 1000;
  const pulseIntensity = event.intensity || 0.5;

  if (uniforms.uColorIntensity) {
    const originalIntensity = uniforms.uColorIntensity.value;
    const startTime = currentTime * 1000;

    const animatePulse = () => {
      const elapsed = currentTime * 1000 - startTime;
      const progress = elapsed / pulseDuration;

      if (progress < 1) {
        // Sine wave pulse
        const pulseValue = Math.sin(progress * Math.PI * 4) * pulseIntensity;
        uniforms.uColorIntensity.value = originalIntensity + pulseValue;

        requestAnimationFrame(animatePulse);
      } else {
        uniforms.uColorIntensity.value = originalIntensity;
      }
    };

    animatePulse();
  }

  console.log(`[ParticleEffects] Narrative highlight in area:`, event.area);
};

/**
 * Special effect for mood transitions
 * @param {Object} event - Mood transition event
 * @param {Object} uniforms - Shader uniforms
 * @param {number} currentTime - Current time
 */
const triggerMoodTransition = (event, uniforms, _currentTime) => {
  // Create particle "celebration" effect during mood changes
  if (uniforms.uRepulsionStrength && uniforms.uColorIntensity) {
    const originalRepulsion = uniforms.uRepulsionStrength.value;
    const originalIntensity = uniforms.uColorIntensity.value;

    // Brief particle excitement
    uniforms.uRepulsionStrength.value = originalRepulsion * 0.3; // Less repulsion = more clustering
    uniforms.uColorIntensity.value = originalIntensity * 1.4; // Brighter colors

    setTimeout(() => {
      if (uniforms.uRepulsionStrength && uniforms.uColorIntensity) {
        uniforms.uRepulsionStrength.value = originalRepulsion;
        uniforms.uColorIntensity.value = originalIntensity;
      }
    }, 1500);
  }

  console.log(`[ParticleEffects] Mood transition effect: ${event.fromMood} → ${event.toMood}`);
};

export default function WebGLBackground(props) {
  // State to manage if the WebGL resources are ready for rendering
  const [isReady, setIsReady] = useState(false);
  // Ref for the points object
  const pointsRef = useRef();
  // Custom hook for tracking and disposing Three.js resources
  const tracker = useResourceTracker();

  // Get dynamic values from Zustand stores
  const particleCount = useQualityStore(s => s.particleCount);
  const currentQualityTier = useQualityStore(s => s.currentQualityTier);
  const scrollProgress = useInteractionStore(s => s.scrollProgress);

  // === NEW: NARRATIVE STORE INTEGRATION ===
  const currentPreset = useNarrativeStore(s => s.activePreset);
  const updateTransition = useNarrativeStore(s => s.updateTransition);
  const consumeInteractionEvents = useInteractionStore(s => s.consumeInteractionEvents);

  // Get Three.js scene essentials from R3F
  const { camera, mouse: r3fMouse } = useThree();

  // --- Component Props & Defaults (ENHANCED with narrative override) ---
  const baseSize = props.baseSize ?? currentPreset?.baseSize ?? 0.1;

  // Memoize propColors with narrative override capability
  const stablePropColors = useMemo(() => {
    // NARRATIVE OVERRIDE: Use narrative preset colors if available, otherwise props/defaults
    if (currentPreset?.colors && Array.isArray(currentPreset.colors)) {
      return currentPreset.colors;
    }
    return props.colors || ['#E040FB', '#536DFE', '#00E5FF']; // Original defaults
  }, [props.colors, currentPreset?.colors]);

  const cursorRadius = props.cursorRadius ?? currentPreset?.cursorRadius ?? 1.5;
  const repulsionStr = props.repulsionStr ?? currentPreset?.repulsionStrength ?? 0.8;

  // Effect for deferred initialization logic based on particleCount and qualityTier
  useEffect(() => {
    if (isReady) return; // Don't re-initialize if already ready

    // Check if necessary data is available
    if (typeof particleCount === 'number' && particleCount > 0 && currentQualityTier) {
      const initLogic = () => {
        try {
          console.log(
            `WebGLBackground (Enhanced): Deferred init. Particle count: ${particleCount}, Quality: ${currentQualityTier}, Mood: ${currentPreset?.name || 'default'}`
          );
          setIsReady(true); // Set ready state to trigger buffer and material creation
        } catch (e) {
          console.error(
            'Error during WebGLBackground (Enhanced) deferred setup:',
            e.message,
            e.stack
          );
        }
      };

      let idleCallbackId;
      // Use requestIdleCallback for non-critical initialization if available
      if ('requestIdleCallback' in window) {
        idleCallbackId = requestIdleCallback(initLogic, { timeout: 2000 });
      } else {
        // Fallback to setTimeout if requestIdleCallback is not available
        const timeoutId = setTimeout(initLogic, 200);
        idleCallbackId = { _timeoutId: timeoutId, cancel: () => clearTimeout(timeoutId) };
      }

      // Cleanup function to cancel callback if component unmounts or dependencies change
      return () => {
        if (idleCallbackId) {
          if (typeof idleCallbackId === 'number' && 'cancelIdleCallback' in window) {
            cancelIdleCallback(idleCallbackId);
          } else if (idleCallbackId.cancel) {
            idleCallbackId.cancel();
          }
        }
      };
    } else {
      console.log(
        'WebGLBackground (Enhanced): Waiting for valid particleCount or currentQualityTier.'
      );
    }
  }, [particleCount, isReady, currentQualityTier, currentPreset?.name]); // Add currentPreset?.name dependency

  // Memoized calculation for particle positions and animation attributes
  const { positions, anim1, anim2 } = useMemo(() => {
    if (!isReady || typeof particleCount !== 'number' || particleCount <= 0) {
      // Return empty arrays if not ready or invalid particle count
      return {
        positions: new Float32Array(0),
        anim1: new Float32Array(0),
        anim2: new Float32Array(0),
      };
    }
    console.log(`WebGLBackground (Enhanced): Calculating buffers for ${particleCount} particles.`);
    const posArray = new Float32Array(particleCount * 3); // x, y, z
    const a1 = new Float32Array(particleCount * 4); // Animation factors set 1
    const a2 = new Float32Array(particleCount * 4); // Animation factors set 2
    const field = { w: 14, h: 8, d: 7 }; // Dimensions of the particle field

    // Populate attribute arrays with random values
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3,
        i4 = i * 4;
      posArray[i3] = (Math.random() * 2 - 1) * field.w;
      posArray[i3 + 1] = (Math.random() * 2 - 1) * field.h;
      posArray[i3 + 2] = (Math.random() * 2 - 1) * field.d;
      a1[i4] = 0.1 + Math.random() * 0.4;
      a1[i4 + 1] = Math.random() * Math.PI * 2;
      a1[i4 + 2] = Math.random();
      a1[i4 + 3] = Math.random() * Math.PI * 2;
      a2[i4] = 0.4 + Math.random() * 0.6;
      a2[i4 + 1] = 0.2 + Math.random() * 0.4;
      a2[i4 + 2] = 0.3 + Math.random() * 0.7;
      a2[i4 + 3] = 0.1 + Math.random() * 0.2;
    }
    return { positions: posArray, anim1: a1, anim2: a2 };
  }, [isReady, particleCount]); // Dependencies: re-calculate if readiness or particle count changes

  // Memoized creation of shader uniforms (ENHANCED with narrative support)
  const uniforms = useMemo(() => {
    if (!isReady) return null; // Don't create uniforms if not ready
    console.log('WebGLBackground (Enhanced): Creating/updating uniforms with narrative support.');

    // Get color intensity from narrative preset or fallback
    const colorIntensity = currentPreset?.colorIntensity ?? 1.3;

    return {
      // === EXISTING UNIFORMS (PRESERVED EXACTLY) ===
      uTime: { value: 0 },
      uSize: { value: baseSize },
      uScrollProgress: { value: 0 },
      uCursorPos: { value: new THREE.Vector3() },
      uCursorRadius: { value: cursorRadius },
      uRepulsionStrength: { value: repulsionStr },
      uColorA: { value: new THREE.Color(stablePropColors[0]) },
      uColorB: { value: new THREE.Color(stablePropColors[1]) },
      uColorC: { value: new THREE.Color(stablePropColors[2]) },
      uColorIntensity: { value: colorIntensity },

      // === NEW: NARRATIVE UNIFORMS (Ready for future shader enhancement) ===
      uSpeedFactor: { value: currentPreset?.uniforms?.uSpeedFactor ?? 1.0 },
      uCursorInfluence: { value: currentPreset?.uniforms?.uCursorInfluence ?? 1.0 },
    };
  }, [isReady, baseSize, stablePropColors, cursorRadius, repulsionStr, currentPreset]); // Add currentPreset dependency

  // Memoized creation of the shader material
  const material = useMemo(() => {
    if (
      !isReady ||
      !uniforms ||
      !vertexString ||
      !fragmentString ||
      !noiseString ||
      !currentQualityTier
    ) {
      console.log(
        'WebGLBackground: Not ready or shader strings/uniforms/qualityTier missing for enhanced material.'
      );
      return null;
    }
    console.log(
      `WebGLBackground (Enhanced): Creating ShaderMaterial with quality: ${currentQualityTier}, mood: ${currentPreset?.name || 'default'}`
    );
    try {
      const mat = new THREE.ShaderMaterial({
        defines: wrapQualityDefines(currentQualityTier), // Dynamically set shader defines based on quality
        uniforms: uniforms,
        vertexShader: noiseString + '\n' + vertexString, // Prepend noise functions to vertex shader
        fragmentShader: fragmentString,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      tracker.track(mat); // Track material for disposal
      return mat;
    } catch (e) {
      console.error('Error creating ShaderMaterial with enhanced functionality:', e);
      return null;
    }
  }, [isReady, uniforms, currentQualityTier, tracker, currentPreset?.name]);

  // Memoized creation of the buffer geometry
  const geometry = useMemo(() => {
    if (!isReady || positions.length === 0) return null; // Don't create geometry if not ready or no positions
    console.log('WebGLBackground (Enhanced): Creating BufferGeometry.');
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('animFactors1', new THREE.BufferAttribute(anim1, 4));
    geo.setAttribute('animFactors2', new THREE.BufferAttribute(anim2, 4));
    tracker.track(geo); // Track geometry for disposal
    return geo;
  }, [isReady, positions, anim1, anim2, tracker]); // Dependencies for geometry

  // Effect to track the points object itself once it's created
  useEffect(() => {
    if (pointsRef.current) tracker.track(pointsRef.current);
  }, [tracker]); // Dependency: tracker instance (should be stable)

  // useFrame hook for per-frame updates (ENHANCED with narrative and event processing)
  useFrame(({ clock }) => {
    if (!isReady || !uniforms || !pointsRef.current) return; // Ensure everything is ready

    // === NARRATIVE TRANSITION UPDATES ===
    updateTransition(clock.elapsedTime * 1000); // Convert to milliseconds

    // === INTERACTION EVENT PROCESSING ===
    const pendingEvents = consumeInteractionEvents();
    if (pendingEvents.length > 0) {
      console.log(`[WebGLBackground] Processing ${pendingEvents.length} interaction events`);

      // Process each event with specific particle effects
      pendingEvents.forEach(event => {
        processParticleEvent(event, uniforms, clock.elapsedTime);
      });
    }

    // === EXISTING UNIFORM UPDATES (PRESERVED) ===
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uScrollProgress.value = scrollProgress;

    // === ENHANCED UNIFORM UPDATES (with narrative values) ===
    // Update colors from current preset (handles transitions automatically)
    if (currentPreset?.colors) {
      uniforms.uColorA.value.set(currentPreset.colors[0]);
      uniforms.uColorB.value.set(currentPreset.colors[1]);
      uniforms.uColorC.value.set(currentPreset.colors[2]);
    }

    // Update size and intensity from current preset
    uniforms.uSize.value = currentPreset?.baseSize ?? baseSize;
    uniforms.uColorIntensity.value = currentPreset?.colorIntensity ?? 1.3;
    uniforms.uCursorRadius.value = currentPreset?.cursorRadius ?? cursorRadius;
    uniforms.uRepulsionStrength.value = currentPreset?.repulsionStrength ?? repulsionStr;

    // Update narrative-specific uniforms
    if (uniforms.uSpeedFactor) {
      uniforms.uSpeedFactor.value = currentPreset?.uniforms?.uSpeedFactor ?? 1.0;
    }
    if (uniforms.uCursorInfluence) {
      uniforms.uCursorInfluence.value = currentPreset?.uniforms?.uCursorInfluence ?? 1.0;
    }

    // === EXISTING MOUSE INTERACTION (PRESERVED EXACTLY) ===
    // Project mouse screen coordinates to world space for interaction
    const vec = new THREE.Vector3(r3fMouse.x, r3fMouse.y, 0.5); // NDC space
    vec.unproject(camera); // Unproject to camera space
    const dir = vec.sub(camera.position).normalize(); // Get direction vector from camera
    const distance = Math.abs(dir.z) > 0.0001 ? -camera.position.z / dir.z : 10;
    const worldMouse = camera.position.clone().add(dir.multiplyScalar(distance));
    uniforms.uCursorPos.value.set(worldMouse.x, worldMouse.y, worldMouse.z);
  });

  // Conditional rendering: only render if ready and essential components exist
  if (!isReady || !geometry || !material) {
    return null;
  }

  console.log(
    `WebGLBackground (Enhanced): Rendering points with mood: ${currentPreset?.name || 'default'}`
  );
  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
}

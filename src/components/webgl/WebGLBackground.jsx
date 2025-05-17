// src/components/webgl/WebGLBackground.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useQualityStore } from '@/stores/qualityStore';
import { useInteractionStore } from '@/stores/useInteractionStore'; // Assuming this path is correct
import useResourceTracker from '@/hooks/useResourceTracker'; // Assuming this path is correct
import { wrapQualityDefines } from '@/utils/shaderUtils'; // Assuming this path is correct

// Importing shader strings
import noiseString from './shaders/noise.glsl';
import vertexString from './shaders/vertex.glsl';
import fragmentString from './shaders/fragment.glsl';

// Log shader string lengths on import (for debugging purposes)
console.log('WebGLBackground: Imported full noiseString length:', noiseString?.length);
console.log('WebGLBackground: Imported full vertexString length:', vertexString?.length);
console.log('WebGLBackground: Imported full fragmentString length:', fragmentString?.length);

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

  // Get Three.js scene essentials from R3F
  // Removed 'viewport' as it was unused
  const { camera, mouse: r3fMouse } = useThree();

  // --- Component Props & Defaults ---
  const baseSize = props.baseSize ?? 0.1; // Default particle size
  // Memoize propColors to stabilize its reference for useMemo dependencies
  const stablePropColors = useMemo(() => {
    return props.colors || ['#E040FB', '#536DFE', '#00E5FF']; // Default colors
  }, [props.colors]);
  const cursorRadius = props.cursorRadius ?? 1.5; // Default cursor interaction radius
  const repulsionStr = props.repulsionStr ?? 0.8; // Default cursor repulsion strength

  // Effect for deferred initialization logic based on particleCount and qualityTier
  useEffect(() => {
    if (isReady) return; // Don't re-initialize if already ready

    // Check if necessary data is available
    if (typeof particleCount === 'number' && particleCount > 0 && currentQualityTier) {
      const initLogic = () => {
        try {
          console.log(
            `WebGLBackground (Full Shaders): Deferred init. Particle count: ${particleCount}, Quality: ${currentQualityTier}`
          );
          setIsReady(true); // Set ready state to trigger buffer and material creation
        } catch (e) {
          console.error(
            'Error during WebGLBackground (Full Shaders) deferred setup:',
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
        'WebGLBackground (Full Shaders): Waiting for valid particleCount or currentQualityTier.'
      );
    }
  }, [particleCount, isReady, currentQualityTier]); // Dependencies for this effect

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
    console.log(
      `WebGLBackground (Full Shaders): Calculating buffers for ${particleCount} particles.`
    );
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

  // Memoized creation of shader uniforms
  const uniforms = useMemo(() => {
    if (!isReady) return null; // Don't create uniforms if not ready
    console.log('WebGLBackground (Full Shaders): Creating/updating uniforms.');
    return {
      uTime: { value: 0 },
      uSize: { value: baseSize },
      uScrollProgress: { value: 0 },
      uCursorPos: { value: new THREE.Vector3() },
      uCursorRadius: { value: cursorRadius },
      uRepulsionStrength: { value: repulsionStr },
      uColorA: { value: new THREE.Color(stablePropColors[0]) },
      uColorB: { value: new THREE.Color(stablePropColors[1]) },
      uColorC: { value: new THREE.Color(stablePropColors[2]) },
      uColorIntensity: { value: 1.3 },
    };
  }, [isReady, baseSize, stablePropColors, cursorRadius, repulsionStr]); // Dependencies for uniforms

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
        'WebGLBackground: Not ready or shader strings/uniforms/qualityTier missing for full material.'
      );
      return null;
    }
    console.log(
      `WebGLBackground (Full Shaders): Creating ShaderMaterial with quality: ${currentQualityTier}`
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
      console.error('Error creating ShaderMaterial with full shaders:', e);
      return null;
    }
    // Removed static shader strings (noiseString, vertexString, fragmentString) from dependencies
    // as they are imported constants and won't change.
  }, [isReady, uniforms, currentQualityTier, tracker]);

  // Memoized creation of the buffer geometry
  const geometry = useMemo(() => {
    if (!isReady || positions.length === 0) return null; // Don't create geometry if not ready or no positions
    console.log('WebGLBackground (Full Shaders): Creating BufferGeometry.');
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

  // useFrame hook for per-frame updates (animations, uniform updates)
  useFrame(({ clock }) => {
    if (!isReady || !uniforms || !pointsRef.current) return; // Ensure everything is ready

    // Update time and scroll progress uniforms
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uScrollProgress.value = scrollProgress;

    // Project mouse screen coordinates to world space for interaction
    const vec = new THREE.Vector3(r3fMouse.x, r3fMouse.y, 0.5); // NDC space
    vec.unproject(camera); // Unproject to camera space
    const dir = vec.sub(camera.position).normalize(); // Get direction vector from camera
    // Calculate distance to a plane (assuming particles are roughly on a plane or interaction is depth-agnostic)
    // This distance calculation might need adjustment based on your scene's depth and particle distribution.
    // A common approach is to intersect with a plane at z=0 in world space or a specific depth.
    const distance = Math.abs(dir.z) > 0.0001 ? -camera.position.z / dir.z : 10;
    const worldMouse = camera.position.clone().add(dir.multiplyScalar(distance));
    uniforms.uCursorPos.value.set(worldMouse.x, worldMouse.y, worldMouse.z);
  });

  // Conditional rendering: only render if ready and essential components exist
  if (!isReady || !geometry || !material) {
    return null;
  }

  console.log('WebGLBackground (Full Shaders): Rendering points.');
  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
}

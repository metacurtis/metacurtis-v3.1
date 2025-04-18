// src/components/webgl/WebGLBackground.jsx
import * as THREE from 'three'; // Import THREE namespace
import { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useInteractionStore } from '@/stores/useInteractionStore'; // Import Zustand store (ensure alias @ works or use relative path)

// Settings
const particleCount = 5000;
const particleSize = 0.05;
const fieldRadius = 10;
const cursorInteractionRadius = 1.5;
const cursorRepulsionStrength = 0.05;

// Colors for scroll interpolation
const topColor = new THREE.Color('#ffffff'); // White at top
const bottomColor = new THREE.Color('#ff00ff'); // Magenta at bottom (example)

/**
 * Renders the background WebGL scene with particles reacting to cursor and scroll.
 */
function WebGLBackground() {
  const instancedMeshRef = useRef();
  const materialRef = useRef(); // Ref for the material to change its color
  const dummyRef = useRef(new THREE.Object3D());
  const { viewport, mouse } = useThree();

  // --- Get Scroll Progress from Zustand Store ---
  // This hook subscribes the component to changes in scrollProgress
  const scrollProgress = useInteractionStore(state => state.scrollProgress);

  // Generate particle data
  const particlesData = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const data = Array.from({ length: particleCount }, () => ({
      initialY: 0,
      offset: Math.random() * Math.PI * 2,
      speedFactor: 0.5 + Math.random() * 0.5,
      amplitudeFactor: 0.05 + Math.random() * 0.1,
    }));
    const tempVec = new THREE.Vector3();
    for (let i = 0; i < particleCount; i++) {
      tempVec.randomDirection().multiplyScalar(Math.random() * fieldRadius);
      tempVec.toArray(positions, i * 3);
      data[i].initialY = tempVec.y;
    }
    return { positions, data };
  }, []);

  // Initialize instance matrices
  useEffect(() => {
    const mesh = instancedMeshRef.current;
    if (!mesh) return;
    const dummy = dummyRef.current;
    for (let i = 0; i < particleCount; i++) {
      dummy.position.fromArray(particlesData.positions, i * 3);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    console.log('Particle instances initialized.');
  }, [particlesData]);

  // Animate particles, add cursor interaction, and scroll color change
  useFrame((state, delta) => {
    const mesh = instancedMeshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return; // Ensure mesh and material exist
    const dummy = dummyRef.current;
    const time = state.clock.elapsedTime;

    // --- Update Particle Color based on Scroll ---
    // Interpolate color based on scrollProgress (0=top, 1=bottom)
    // The lerpColors function modifies the first color (material.color) in place
    material.color.lerpColors(topColor, bottomColor, scrollProgress);

    // --- Cursor Interaction ---
    const pointer = new THREE.Vector3(
      (mouse.x * viewport.width) / 2,
      (mouse.y * viewport.height) / 2,
      0
    );

    // --- Update Particle Positions (Oscillation + Repulsion) ---
    for (let i = 0; i < particleCount; i++) {
      dummy.position.fromArray(particlesData.positions, i * 3);
      const { initialY, offset, speedFactor, amplitudeFactor } = particlesData.data[i];
      const oscillation = Math.sin(time * speedFactor + offset) * amplitudeFactor;
      dummy.position.y = initialY + oscillation;

      const distanceToCursor = dummy.position.distanceTo(pointer);
      if (distanceToCursor < cursorInteractionRadius) {
        const repulsionFactor = 1 - distanceToCursor / cursorInteractionRadius;
        const repulsionVec = dummy.position.clone().sub(pointer).normalize();
        dummy.position.addScaledVector(repulsionVec, repulsionFactor * cursorRepulsionStrength);
      }

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      {/* Using default black background now */}
      <color attach="background" args={['#000000']} />

      {/* Reduced ambient light intensity for better contrast with white/magenta */}
      <ambientLight intensity={0.4} />

      <instancedMesh
        ref={instancedMeshRef}
        args={[null, null, particleCount]}
        frustumCulled={false}
      >
        <sphereGeometry args={[particleSize, 8, 8]} />
        {/* Assign ref to material and start with topColor (white) */}
        <meshStandardMaterial ref={materialRef} color={topColor} roughness={0.5} />
      </instancedMesh>
    </>
  );
}

export default WebGLBackground;

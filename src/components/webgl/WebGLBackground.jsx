// src/components/webgl/WebGLBackground.jsx
import * as THREE from 'three';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

// Settings for the particle system
const particleCount = 5000; // Number of particles
const particleSize = 0.05; // Size of each particle
const fieldRadius = 10; // Radius of the sphere particles are distributed in

/**
 * Renders the background WebGL scene with an animated particle system.
 */
function WebGLBackground() {
  const instancedMeshRef = useRef();
  // Ref to store the dummy object for matrix updates
  const dummyRef = useRef(new THREE.Object3D());

  // Generate random particle positions and initial animation offsets only once
  const particlesData = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const data = Array.from({ length: particleCount }, () => ({
      // Store initial y position and random factors for animation variation
      initialY: 0,
      offset: Math.random() * Math.PI * 2, // Random phase offset
      speedFactor: 0.5 + Math.random() * 0.5, // Random speed variation
      amplitudeFactor: 0.05 + Math.random() * 0.1, // Random movement amplitude variation
    }));
    const tempVec = new THREE.Vector3();

    for (let i = 0; i < particleCount; i++) {
      tempVec.randomDirection().multiplyScalar(Math.random() * fieldRadius);
      tempVec.toArray(positions, i * 3);
      data[i].initialY = tempVec.y; // Store initial Y for oscillation calculation
    }
    return { positions, data };
  }, []); // Empty dependency array ensures this runs only once

  // Set initial instance transforms only once after mount
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
  }, [particlesData]); // Depend on particlesData

  // Animate particles on each frame
  useFrame((state, delta) => {
    const mesh = instancedMeshRef.current;
    if (!mesh) return;
    const dummy = dummyRef.current;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < particleCount; i++) {
      // Get current matrix (optional, can recalculate from initial pos)
      // mesh.getMatrixAt(i, dummy.matrix);
      // dummy.position.setFromMatrixPosition(dummy.matrix);

      // Start from initial position
      dummy.position.fromArray(particlesData.positions, i * 3);

      // Apply oscillation based on time, initial position, and random factors
      const { initialY, offset, speedFactor, amplitudeFactor } = particlesData.data[i];
      dummy.position.y = initialY + Math.sin(time * speedFactor + offset) * amplitudeFactor;

      // Update the matrix for this instance
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    // VERY Important: Flag the instance matrix as needing an update
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      {/* <directionalLight position={[5, 5, -5]} intensity={0.3} /> */}

      <instancedMesh
        ref={instancedMeshRef}
        args={[null, null, particleCount]}
        frustumCulled={false}
      >
        <sphereGeometry args={[particleSize, 8, 8]} />
        <meshStandardMaterial color="#888888" roughness={0.5} />
      </instancedMesh>
    </>
  );
}

export default WebGLBackground;

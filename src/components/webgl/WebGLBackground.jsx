// src/components/webgl/WebGLBackground.jsx
import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
// Removed store/useThree imports for now as interactions are temporarily disabled

// Settings
const particleCount = 7000; // Increased count for denser field like reference
const particleBaseSize = 0.02; // Base size for points material
const fieldRadius = 10;

/**
 * Renders the background WebGL scene using PointsMaterial for particles.
 */
function WebGLBackground() {
  const pointsRef = useRef();

  // Generate particle positions and colors only once
  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3); // RGB for each particle
    const color = new THREE.Color(); // Helper to set colors

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Position (random sphere distribution)
      const radius = Math.random() * fieldRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1); // Correct spherical distribution

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Color (Example: lerp between magenta and purple based on distance from center)
      const distanceFromCenter = Math.sqrt(
        positions[i3] ** 2 + positions[i3 + 1] ** 2 + positions[i3 + 2] ** 2
      );
      const colorFactor = Math.min(distanceFromCenter / (fieldRadius * 0.8), 1.0); // Normalize distance
      color.lerpColors(new THREE.Color('#ff00ff'), new THREE.Color('#8800ff'), colorFactor);
      color.toArray(colors, i3);
    }
    return [positions, colors];
  }, []); // Empty dependency array ensures this runs only once

  // Animate the whole system (simple rotation for now)
  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.05; // Slow rotation
      // TODO: Implement more complex particle movement later
    }
  });

  return (
    <>
      {/* Black background */}
      <color attach="background" args={['#000000']} />
      {/* No lights needed for PointsMaterial with vertexColors */}
      {/* <ambientLight intensity={0.4} /> */}

      {/* Points primitive for rendering particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          {/* Define attributes for position and color */}
          <bufferAttribute
            attach="attributes-position" // Use 'attributes-position' shortcut
            count={particleCount}
            array={positions}
            itemSize={3} // x, y, z
          />
          <bufferAttribute
            attach="attributes-color" // Use 'attributes-color' shortcut
            count={particleCount}
            array={colors}
            itemSize={3} // r, g, b
            normalized={false} // Colors are 0.0 to 1.0
          />
        </bufferGeometry>
        {/* Material for rendering points */}
        <pointsMaterial
          size={particleBaseSize}
          vertexColors={true} // <-- Tell material to use the 'color' attribute
          sizeAttenuation={true} // Make points smaller further away
          depthWrite={false} // Often good for particle blending
          blending={THREE.AdditiveBlending} // <-- Creates a brighter, glowy effect
          transparent={true} // Needed for additive blending
          opacity={0.8} // Adjust opacity
        />
      </points>
    </>
  );
}

export default WebGLBackground;

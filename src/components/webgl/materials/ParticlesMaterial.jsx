// src/components/webgl/materials/ParticlesMaterial.jsx
import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei'; // Can use this helper again now shader code is separate
import vertexShader from '../shaders/particle.vert'; // Import external shaders
import fragmentShader from '../shaders/particle.frag';

// Define the material using shaderMaterial helper for cleaner uniform handling
const ParticlesShaderMaterial = shaderMaterial(
  // Uniforms definition
  {
    uTime: 0,
    uSize: 0.02,
    // Add scroll/color/cursor uniforms later as needed
    // uScrollProgress: 0.0,
    // uColorA: new THREE.Color('#ffffff'),
    // uColorB: new THREE.Color('#ff00ff'),
    // uCursorPos: new THREE.Vector3(),
  },
  // Vertex Shader
  vertexShader,
  // Fragment Shader (currently outputs white)
  fragmentShader,
  // Optional: Callback to set further material properties
  material => {
    material.blending = THREE.AdditiveBlending;
    material.depthWrite = false;
    material.transparent = true; // Keep true for soft edges/blending
    // material.vertexColors = true; // Set automatically by shaderMaterial if color attribute is used
  }
);

// --- ParticlesMaterial Component ---
// This component manages the material instance and updates uniforms
export function ParticlesMaterial(props) {
  const materialRef = useRef();

  // Update time uniform on each frame
  useFrame(state => {
    if (materialRef.current?.uniforms?.uTime) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    // TODO: Update other uniforms based on props or store values later
    // if (materialRef.current?.uniforms?.uScrollProgress) {
    //   materialRef.current.uniforms.uScrollProgress.value = props.scrollProgress;
    // }
  });

  // Return the R3F element for the material, passing uniforms via props
  // We use the 'key' prop with Date.now() as a simple way to force re-creation
  // if shader code changes drastically, though Drei's shaderMaterial handles some updates.
  // A better key might be derived from shader source hashes if needed.
  return (
    <primitive
      object={new ParticlesShaderMaterial()}
      ref={materialRef}
      attach="material"
      {...props}
      key={ParticlesShaderMaterial.key}
    />
  );

  // Alternative using extend (might run into previous issues, primitive is safer)
  // return <particlesShaderMaterial ref={materialRef} key={ParticlesShaderMaterial.key} {...props} />;
}

// Extend is needed if using the JSX tag <particlesShaderMaterial />
// extend({ ParticlesShaderMaterial }); // Not needed if using <primitive>

// Note: We could also pass uniforms directly as props to <particlesShaderMaterial {...props} uSize={size} />
// if we use extend and the JSX tag, shaderMaterial handles mapping them.
// Using <primitive> requires manual uniform updates in useFrame or via ref.

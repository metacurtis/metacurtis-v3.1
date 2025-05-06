// src/components/webgl/WebGLCanvas.jsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
// --- Only import PerspectiveCamera from Drei ---
import { PerspectiveCamera } from '@react-three/drei';

// Simple placeholder content
const SceneContent = () => {
  return (
    <>
      {/* --- Use lowercase 'a' for the core R3F element --- */}
      <ambientLight intensity={0.6} />
      {/* A simple box to verify rendering */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="royalblue" />
      </mesh>
    </>
  );
};

export const WebGLCanvas = () => {
  return (
    <Canvas
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
      }}
    >
      {/* Use the PerspectiveCamera component from Drei */}
      <PerspectiveCamera makeDefault position={[0, 1, 5]} fov={75} />

      <SceneContent />
    </Canvas>
  );
};

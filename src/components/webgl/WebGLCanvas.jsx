// src/components/webgl/WebGLCanvas.jsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei'; // Only import needed Drei components
import { SimpleAnimatedCube } from '../graphics/SimpleAnimatedCube'; // Adjust path if needed
import { useQualityStore } from '../../stores/qualityStore'; // Adjust path if needed

// Simple scene content component
const SceneContent = () => {
  return (
    <>
      {/* Use lowercase for intrinsic Three.js elements managed by R3F */}
      <ambientLight intensity={0.6} />
      {/* Render the animated cube */}
      <SimpleAnimatedCube position={[0, 0, 0]} />
    </>
  );
};

// Main WebGL Canvas component
export const WebGLCanvas = () => {
  // Get frameloopMode from the Zustand store
  const frameloopMode = useQualityStore(state => state.frameloopMode);

  // Debug log to verify the mode when the component renders
  // You can remove this later once confirmed working
  console.log('WebGLCanvas rendering with frameloopMode:', frameloopMode);

  return (
    <Canvas
      // Style to make it cover the background
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1, // Ensure it's behind UI content
      }}
      // --- THIS IS THE CORRECTED LINE ---
      // Set frameloop dynamically based on the value from the store
      frameloop={frameloopMode}
    >
      {/* Default camera setup using Drei component */}
      <PerspectiveCamera
        makeDefault // Make this the default camera R3F uses
        position={[0, 1, 5]} // Position it slightly up and back
        fov={75} // Field of view
      />

      {/* Render the actual scene contents */}
      <SceneContent />
    </Canvas>
  );
};

// If you prefer default exports for components:
// export default WebGLCanvas;
// Remember to adjust the import in App.jsx if you change this.

// src/App.jsx (Unused React import removed)
// No 'import React from 'react';' needed here for basic JSX

import { Canvas } from '@react-three/fiber';

// Core Layout and Scene Components
// IMPORTANT: Ensure these paths and component names match your actual file structure!
import Layout from './components/ui/Layout'; // Or './components/layout/Layout'
import WebGLBackground from './components/webgl/WebGLBackground'; // Or './components/webgl/BackgroundScene'

// Import Section Components
// IMPORTANT: Ensure these paths and component names match your actual file structure!
import Hero from './sections/Hero'; // Or './components/sections/HeroSection'
// Import other sections as they are created
// import About from './sections/About';
// import Features from './sections/Features';
// import Contact from './sections/Contact';

function App() {
  return (
    <>
      {/* Fixed canvas using the 'style' prop */}
      <Canvas
        // Apply positioning styles DIRECTLY via the style prop
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: -1, // Ensure it's behind HTML content
          // pointerEvents: 'none', // Add if clicks need to pass through canvas
        }}
        camera={{ position: [0, 0, 5], fov: 50 }} // Camera settings
        dpr={[1, 1.5]} // Performance: Clamp device pixel ratio
        flat // Performance: Use linear tone mapping
      >
        {/* Render your WebGL scene component */}
        <WebGLBackground />
      </Canvas>

      {/* Layout component renders Navbar/Footer and scrolls over the canvas */}
      <Layout>
        {/* Page sections are rendered as children of Layout */}
        <Hero />
        {/* Add other sections here as they are created */}
        {/* <About /> */}
        {/* <Features /> */}
        {/* <Contact /> */}
        {/* Temporary divs for spacing if needed during dev */}
        <div id="about" className="h-screen"></div> {/* Example spacer */}
        <div id="features" className="h-screen"></div> {/* Example spacer */}
        <div id="contact" className="h-screen"></div> {/* Example spacer */}
      </Layout>
    </>
  );
}

export default App;

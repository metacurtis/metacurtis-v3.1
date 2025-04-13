// src/App.jsx (Corrected Import Paths based on 'tree' output & user confirmation)

import { Canvas } from '@react-three/fiber';

// Core Layout and Scene Components
// Corrected import paths based on your 'tree' output
import Layout from './components/ui/Layout'; // Corrected path to 'ui' directory
import WebGLBackground from './components/webgl/WebGLBackground'; // <-- Using WebGLBackground as confirmed

// Import Section Components
// Corrected import path and component name based on your 'tree' output
import Hero from './sections/Hero'; // Corrected path and name
// Import other sections as they are created
import About from './sections/About';
import Features from './sections/Features';
import Contact from './sections/Contact';

function App() {
  return (
    <>
      {/* Fixed canvas using the 'style' prop */}
      <Canvas
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: -1,
        }}
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 1.5]}
        flat
      >
        {/* Render your WebGL scene component */}
        {/* Ensure WebGLBackground component exists and filename matches import */}
        <WebGLBackground /> {/* <-- Using WebGLBackground as confirmed */}
      </Canvas>

      {/* Layout component renders Navbar/Footer and scrolls over the canvas */}
      {/* Ensure Layout component exists and is imported correctly */}
      <Layout>
        {/* Page sections are rendered as children of Layout */}
        {/* Ensure Hero component exists and is imported correctly */}
        <Hero />
        {/* Add other sections here as they are created */}
        <About />
        <Features />
        <Contact />
        {/* Temporary divs for spacing if needed during dev */}
        <div id="about" className="h-screen"></div> {/* Example spacer */}
        <div id="features" className="h-screen"></div> {/* Example spacer */}
        <div id="contact" className="h-screen"></div> {/* Example spacer */}
      </Layout>
    </>
  );
}

export default App;

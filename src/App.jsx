// src/App.jsx (Cleaned up - End of Phase 4)

// Removed 'React' and 'useEffect' import as they are likely unused now
// If you add hooks back later, re-import { useEffect } from 'react';
import Layout from './components/ui/Layout'; // Check Path
import Hero from './components/sections/Hero'; // Check Path
import About from './components/sections/About'; // Check Path
import Features from './components/sections/Features'; // Check Path
import Contact from './components/sections/Contact'; // Check Path
import CanvasErrorBoundary from './components/ui/CanvasErrorBoundary'; // Check Path
import { WebGLCanvas } from './components/webgl/WebGLCanvas'; // Check Path
// Removed store imports related to FrameloopSwitcher unless kept
// import { useQualityStore, FRAMELOOP_MODES } from './stores/qualityStore';
// Removed interaction store imports unless used elsewhere now
// import { useInteractionStore } from './stores/useInteractionStore';

// Removed FrameloopSwitcher definition unless you want to keep it uncommented below
/*
const FrameloopSwitcher = () => {
  const setFrameloopMode = useQualityStore((state) => state.setFrameloopMode);
  const currentMode = useQualityStore((state) => state.frameloopMode);
  // ... return JSX for buttons ...
};
*/

export default function App() {
  // Removed unused _isDev variable
  // Removed interaction store logic unless needed

  return (
    <>
      {/* Optional: Keep the FrameloopSwitcher for manual testing if desired */}
      {/* <FrameloopSwitcher /> */}

      {/* R3F Canvas rendering within an Error Boundary */}
      <CanvasErrorBoundary>
        <WebGLCanvas />
      </CanvasErrorBoundary>

      {/* Main page layout and sections */}
      <Layout>
        <Hero />
        <About />
        <Features />
        <Contact />
      </Layout>
    </>
  );
}

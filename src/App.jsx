// src/App.jsx (Simplified for Phase 3 - Step 1)

import { useEffect } from 'react';
// import ParticleField from './components/webgl/ParticleField'; // REMOVED FOR NOW
import CanvasErrorBoundary from './components/ui/CanvasErrorBoundary';
// import DevPerformanceMonitor from './components/ui/DevPerformanceMonitor'; // REMOVED FOR NOW
// import QualitySelector from './components/ui/QualitySelector'; // REMOVED FOR NOW
// import ResourceMonitor from './components/ui/ResourceMonitor'; // REMOVED FOR NOW
import Layout from './components/ui/Layout';
import Hero from './components/sections/Hero'; // Ensure path is correct (components/sections/Hero ?)
import About from './components/sections/About'; // Ensure path is correct
import Features from './components/sections/Features'; // Ensure path is correct
import Contact from './components/sections/Contact'; // Ensure path is correct
import { useInteractionStore } from './stores/useInteractionStore'; // Ensure path is correct

// --- Import the new minimal canvas ---
import { WebGLCanvas } from './components/webgl/WebGLCanvas'; // Make sure path is correct

export default function App() {
  const isDev = process.env.NODE_ENV === 'development';
  const setCursorPosition = useInteractionStore(s => s.setCursorPosition);
  const setScrollProgress = useInteractionStore(s => s.setScrollProgress);

  // Mouse → Zustand (Keep)
  useEffect(() => {
    const onMouse = e => setCursorPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMouse);
    return () => window.removeEventListener('mousemove', onMouse);
  }, [setCursorPosition]);

  // Scroll → Zustand (Keep)
  useEffect(() => {
    const onScroll = () => {
      const top = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(max > 0 ? top / max : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Initial call
    return () => window.removeEventListener('scroll', onScroll);
  }, [setScrollProgress]);

  return (
    <>
      {/* {isDev && <DevPerformanceMonitor />} */}
      {/* {isDev && <QualitySelector />} */}
      {/* {isDev && <ResourceMonitor />} */}

      {/* Render the minimal WebGL Canvas inside the error boundary */}
      <CanvasErrorBoundary>
        <WebGLCanvas />
      </CanvasErrorBoundary>

      {/* Keep the main page layout and sections */}
      <Layout>
        <Hero />
        <About />
        <Features />
        <Contact />
      </Layout>
    </>
  );
}

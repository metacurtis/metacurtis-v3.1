// src/App.jsx

import { useEffect } from 'react';
import ParticleField from './components/webgl/ParticleField';
import { useInteractionStore } from './stores/useInteractionStore';
import CanvasErrorBoundary from './components/ui/CanvasErrorBoundary';
import ResourceMonitor from './components/ui/ResourceMonitor';
import QualitySelector from './components/ui/QualitySelector';
import Layout from './components/ui/Layout';
import Hero from './sections/Hero';
import About from './sections/About';
import Features from './sections/Features';
import Contact from './sections/Contact';

function App() {
  const setCursorPosition = useInteractionStore(state => state.setCursorPosition);
  const setScrollProgress = useInteractionStore(state => state.setScrollProgress);

  // Mouse position → Zustand
  useEffect(() => {
    const onMouse = e => setCursorPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMouse);
    return () => window.removeEventListener('mousemove', onMouse);
  }, [setCursorPosition]);

  // Scroll progress → Zustand
  useEffect(() => {
    const onScroll = () => {
      const sTop = window.scrollY;
      const maxScrl = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(maxScrl > 0 ? sTop / maxScrl : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    // initialize
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [setScrollProgress]);

  return (
    <>
      {/* DOM-overlays, outside of Canvas */}
      <ResourceMonitor />
      <QualitySelector />

      {/* Canvas & 3D scene, with error boundary */}
      <CanvasErrorBoundary>
        <ParticleField
          count={8000}
          baseSize={0.04}
          colors={['#ff00ff', '#00ffff', '#0066ff']}
          quality="high"
        />
      </CanvasErrorBoundary>

      {/* Site content */}
      <Layout>
        <Hero />
        <About />
        <Features />
        <Contact />
      </Layout>
    </>
  );
}

export default App;

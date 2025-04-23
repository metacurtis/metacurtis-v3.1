// src/App.jsx

import { useEffect } from 'react';
import ParticleField from './components/webgl/ParticleField';
import CanvasErrorBoundary from './components/ui/CanvasErrorBoundary';
import DevPerformanceMonitor from './components/ui/DevPerformanceMonitor';
import QualitySelector from './components/ui/QualitySelector';
import ResourceMonitor from './components/ui/ResourceMonitor';
import Layout from './components/ui/Layout';
import Hero from './sections/Hero';
import About from './sections/About';
import Features from './sections/Features';
import Contact from './sections/Contact';
import { useInteractionStore } from './stores/useInteractionStore';

export default function App() {
  const isDev = process.env.NODE_ENV === 'development';
  const setCursorPosition = useInteractionStore(s => s.setCursorPosition);
  const setScrollProgress = useInteractionStore(s => s.setScrollProgress);

  // Mouse → Zustand
  useEffect(() => {
    const onMouse = e => setCursorPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMouse);
    return () => window.removeEventListener('mousemove', onMouse);
  }, [setCursorPosition]);

  // Scroll → Zustand
  useEffect(() => {
    const onScroll = () => {
      const top = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(max > 0 ? top / max : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [setScrollProgress]);

  return (
    <>
      {isDev && <DevPerformanceMonitor />}
      {isDev && <QualitySelector />}
      {isDev && <ResourceMonitor />}

      <CanvasErrorBoundary>
        <ParticleField
          count={8000}
          baseSize={0.04}
          colors={['#ff00ff', '#00ffff', '#0066ff']}
          quality="high"
        />
      </CanvasErrorBoundary>

      <Layout>
        <Hero />
        <About />
        <Features />
        <Contact />
      </Layout>
    </>
  );
}

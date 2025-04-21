// src/App.jsx
import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import ErrorBoundary from './components/ErrorBoundary';

// Store Hook & Action
import { useInteractionStore } from './stores/useInteractionStore';

// Core Components
import Layout from './components/ui/Layout';
import WebGLBackground from './components/webgl/WebGLBackground';
import CanvasSizeUpdater from './components/webgl/CanvasSizeUpdater';

// Section Components
import Hero from './sections/Hero';
import About from './sections/About';
import Features from './sections/Features';
import Contact from './sections/Contact';

function App() {
  const setCursorPosition = useInteractionStore(state => state.setCursorPosition);
  const setScrollProgress = useInteractionStore(state => state.setScrollProgress);

  // Mouse listener
  useEffect(() => {
    const handleMouseMove = e => setCursorPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [setCursorPosition]);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
      setScrollProgress(Math.min(1, Math.max(0, progress)));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setScrollProgress]);

  return (
    <>
      <ErrorBoundary>
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
          <WebGLBackground />
          <CanvasSizeUpdater />
        </Canvas>
      </ErrorBoundary>

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

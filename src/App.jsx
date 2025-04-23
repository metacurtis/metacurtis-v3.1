import { useEffect } from 'react';
import AdaptiveRenderer from './components/webgl/AdaptiveRenderer';
import ParticleField from './components/webgl/ParticleField';
import CanvasErrorBoundary from './components/ui/CanvasErrorBoundary';
import DevPerformanceMonitor from './components/ui/DevPerformanceMonitor';
import QualitySelector from './components/ui/QualitySelector';
import Layout from './components/ui/Layout';
import Hero from './sections/Hero';
import About from './sections/About';
import Features from './sections/Features';
import Contact from './sections/Contact';
import { useInteractionStore } from './stores/useInteractionStore';

export default function App() {
  const setCursorPosition = useInteractionStore(s => s.setCursorPosition);
  const setScrollProgress = useInteractionStore(s => s.setScrollProgress);

  // Mouse → store
  useEffect(() => {
    const onMouse = e => setCursorPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMouse);
    return () => window.removeEventListener('mousemove', onMouse);
  }, [setCursorPosition]);

  // Scroll → store
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
      {/* ← DOM overlays OUTSIDE the Canvas */}
      <DevPerformanceMonitor />
      <QualitySelector />

      {/* ← Canvas & 3D scene (no <div> in here!) */}
      <CanvasErrorBoundary>
        <AdaptiveRenderer
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
        >
          <ParticleField
            count={8000}
            baseSize={0.04}
            colors={['#ff00ff', '#00ffff', '#0066ff']}
            quality="high"
          />
        </AdaptiveRenderer>
      </CanvasErrorBoundary>

      {/* Your page content */}
      <Layout>
        <Hero />
        <About />
        <Features />
        <Contact />
      </Layout>
    </>
  );
}

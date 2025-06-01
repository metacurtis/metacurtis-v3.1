// src/App.jsx - FIXED VERSION
import { Suspense, lazy } from 'react';
import CanvasErrorBoundary from '@/components/ui/CanvasErrorBoundary';
import Layout from '@/components/ui/Layout';
import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Features from '@/components/sections/Features';
import Contact from '@/components/sections/Contact';
import DevPerformanceMonitor from '@/components/dev/DevPerformanceMonitor';

const WebGLCanvas = lazy(() => import('@/components/webgl/WebGLCanvas'));

export default function App() {
  const isDevelopment = import.meta.env.DEV;
  console.log(
    `App.jsx: isDevelopment = ${isDevelopment}. DevPerformanceMonitor will be rendered if true.`
  );

  return (
    <div className="app-container relative">
      {/* WebGL Particles - Isolated rendering layer */}
      <div
        className="webgl-layer"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        <CanvasErrorBoundary>
          <Suspense
            fallback={
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'white',
                  fontSize: '18px',
                  fontFamily: 'monospace',
                }}
              >
                Loading particles...
              </div>
            }
          >
            <WebGLCanvas />
          </Suspense>
        </CanvasErrorBoundary>
      </div>

      {/* HTML Content Layer - Completely separate rendering */}
      <div
        className="html-layer"
        style={{
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Hero Section - Full Viewport, HTML only */}
        <Hero />

        {/* Layout with other sections - HTML only */}
        <Layout>
          <div style={{ paddingTop: '100vh' }}>
            {' '}
            {/* Offset for full-screen Hero */}
            <About />
            <Features />
            <Contact />
          </div>
        </Layout>
      </div>

      {/* Dev tools */}
      {isDevelopment && <DevPerformanceMonitor />}
    </div>
  );
}

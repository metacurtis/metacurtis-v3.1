// src/App.jsx
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
    <>
      {/* WebGL Particles - Behind everything */}
      <CanvasErrorBoundary>
        <Suspense fallback={null}>
          <WebGLCanvas />
        </Suspense>
      </CanvasErrorBoundary>

      {/* Hero Section - Full Viewport, breaks out of Layout */}
      <Hero />

      {/* Layout with other sections */}
      <Layout>
        {/* Content sections that scroll normally */}
        <div style={{ paddingTop: '100vh' }}>
          {' '}
          {/* Offset for full-screen Hero */}
          <About />
          <Features />
          <Contact />
        </div>
      </Layout>

      {/* Dev tools */}
      {isDevelopment && <DevPerformanceMonitor />}
    </>
  );
}

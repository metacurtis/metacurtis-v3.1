// src/App.jsx - PURE STATE-DRIVEN ARCHITECTURE
// No scrolling, no traditional sections, pure narrative state transitions

import { Suspense, lazy } from 'react';
import CanvasErrorBoundary from '@/components/ui/CanvasErrorBoundary';
import GenesisCodeExperience from '@/components/sections/GenesisCodeExperience';
import DevPerformanceMonitor from '@/components/dev/DevPerformanceMonitor';

const WebGLCanvas = lazy(() => import('@/components/webgl/WebGLCanvas'));

export default function App() {
  const isDevelopment = import.meta.env.DEV;

  console.log('🚀 MetaCurtis App: Pure state-driven architecture initialized');
  console.log(`🔧 Development mode: ${isDevelopment}`);

  return (
    <div className="metacurtis-app">
      {/* WebGL Particle Layer - Responds to narrative state */}
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
                  color: '#00ff00',
                  fontSize: '18px',
                  fontFamily: '"Courier New", monospace',
                  textShadow: '0 0 10px #00ff00',
                }}
              >
                LOADING GENESIS CODE...
              </div>
            }
          >
            <WebGLCanvas />
          </Suspense>
        </CanvasErrorBoundary>
      </div>

      {/* Complete Interface Layer - State-driven narrative experience */}
      <div
        className="interface-layer"
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden', // No scrolling
        }}
      >
        <GenesisCodeExperience />
      </div>

      {/* Development Tools */}
      {isDevelopment && <DevPerformanceMonitor />}

      {/* Global Styles */}
    </div>
  );
}

/*
🎯 PURE STATE-DRIVEN ARCHITECTURE

✅ NO SCROLLING:
- Fixed viewport dimensions (100vh/100vw)
- overflow: hidden at all levels
- No traditional sections or Layout component

✅ PURE STATE INTERFACE:
- GenesisCodeExperience is the complete interface
- All navigation via narrative state transitions
- Particles respond to narrative state changes

✅ CLEAN ARCHITECTURE:
- WebGL layer for particles (zIndex: 1)
- Interface layer for interactions (zIndex: 10)
- No section management or ScrollTrigger needed

✅ PERFORMANCE OPTIMIZED:
- Lazy loading for WebGL canvas
- Proper error boundaries
- Development tools conditionally loaded

This replaces all traditional website architecture with pure state-driven narrative experience.
*/

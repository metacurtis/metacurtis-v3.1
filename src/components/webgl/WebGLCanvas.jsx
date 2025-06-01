// src/components/webgl/WebGLCanvas.jsx - FIXED VERSION
import { Suspense, lazy, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { useQualityStore } from '@/stores/qualityStore';
import AdaptiveQualitySystem_ReactComponent from '@/components/quality/AdaptiveQualitySystem.jsx';

// LAZY-LOAD WebGLBackground with explicit .jsx extension
// 🚨 CRITICAL: Ensure WebGLBackground.jsx is in the SAME directory as this file,
// OR update this path to be correct relative to WebGLCanvas.jsx
const WebGLBackground = lazy(() => import('./WebGLBackground.jsx'));

export default function WebGLCanvas() {
  console.log('👋 WebGLCanvas render (Testing Lazy Load with Explicit Extension)');

  const frameloopMode = useQualityStore(s => s.frameloopMode);
  const targetDpr = useQualityStore(s => s.targetDpr);
  const webglEnabled = useQualityStore(s => s.webglEnabled);

  useEffect(() => {
    console.log('WebGLCanvas (Lazy Test): Canvas props update from store ->', {
      frameloopMode,
      targetDpr,
    });
  }, [frameloopMode, targetDpr]);

  if (!webglEnabled) {
    console.log('WebGLCanvas: WebGL is disabled. Rendering null.');
    return null;
  }

  if (typeof AdaptiveQualitySystem_ReactComponent !== 'function') {
    console.error('WebGLCanvas: AdaptiveQualitySystem_ReactComponent is NOT a function!');
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'red',
          background: 'black',
          fontSize: '20px',
          fontFamily: 'monospace',
        }}
      >
        Error: AQS component failed to load
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            background: 'rgba(0, 0, 0, 0.8)',
            fontSize: '18px',
          }}
        >
          Loading WebGL...
        </div>
      }
    >
      <Canvas
        frameloop={frameloopMode}
        dpr={targetDpr}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={75} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 7]} intensity={0.8} />

        <WebGLBackground />

        <AdaptiveQualitySystem_ReactComponent />
      </Canvas>
    </Suspense>
  );
}

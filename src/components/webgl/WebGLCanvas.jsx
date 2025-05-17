// src/components/webgl/WebGLCanvas.jsx
import { Suspense, lazy, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { useQualityStore } from '@/stores/qualityStore';
import AdaptiveQualitySystem_ReactComponent from '@/components/quality/AdaptiveQualitySystem.jsx';

// LAZY-LOAD WebGLBackground with explicit .jsx extension
const WebGLBackground = lazy(() => import('./WebGLBackground.jsx')); // Added .jsx

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
      <div style={{ color: 'red', background: 'black', padding: '20px', fontSize: '20px' }}>
        Error: AQS component failed.
      </div>
    );
  }

  return (
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

      <Suspense fallback={null}>
        {' '}
        {/* Suspense is crucial for lazy loading */}
        <WebGLBackground />
      </Suspense>

      <AdaptiveQualitySystem_ReactComponent />
    </Canvas>
  );
}

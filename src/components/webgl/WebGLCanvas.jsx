// src/components/webgl/WebGLCanvas.jsx - MERGED FIXED VERSION
// Enhanced with WebGL context recovery while preserving quality system architecture

import { Suspense, lazy, useEffect, useRef, useState } from 'react';
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

  // Quality store integration (preserved)
  const frameloopMode = useQualityStore(s => s.frameloopMode);
  const targetDpr = useQualityStore(s => s.targetDpr);
  const webglEnabled = useQualityStore(s => s.webglEnabled);

  // WebGL Context Recovery System (added)
  const canvasRef = useRef();
  const [contextLost, setContextLost] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Quality store props logging (preserved)
  useEffect(() => {
    console.log('WebGLCanvas (Lazy Test): Canvas props update from store ->', {
      frameloopMode,
      targetDpr,
    });
  }, [frameloopMode, targetDpr]);

  // WebGL Context Recovery System (added)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleContextLost = event => {
      console.warn('🚨 WebGL Context Lost - Attempting recovery');
      event.preventDefault(); // Prevent default handling
      setContextLost(true);

      // Attempt recovery after a short delay
      setTimeout(() => {
        if (retryCount < maxRetries) {
          console.log(`🔄 Attempting context recovery (${retryCount + 1}/${maxRetries})`);
          setRetryCount(prev => prev + 1);
          setContextLost(false);
        } else {
          console.error('❌ Max context recovery attempts reached');
        }
      }, 1000);
    };

    const handleContextRestored = event => {
      console.log('✅ WebGL Context Restored');
      setContextLost(false);
      setRetryCount(0);
    };

    // Add event listeners for context recovery
    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    return () => {
      if (canvas) {
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      }
    };
  }, [retryCount]);

  // Force garbage collection on context loss (if available)
  useEffect(() => {
    if (contextLost && window.gc) {
      window.gc();
    }
  }, [contextLost]);

  // WebGL disabled check (preserved)
  if (!webglEnabled) {
    console.log('WebGLCanvas: WebGL is disabled. Rendering null.');
    return null;
  }

  // AQS component validation (preserved)
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

  // Context recovery UI (added)
  if (contextLost) {
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
          color: 'white',
          background: 'rgba(0, 0, 0, 0.9)',
          fontSize: '18px',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              animation: 'spin 1s linear infinite',
              fontSize: '48px',
              marginBottom: '20px',
            }}
          >
            🔄
          </div>
          <div>Recovering WebGL context...</div>
          <div style={{ fontSize: '14px', opacity: 0.7, marginTop: '10px' }}>
            Attempt {retryCount}/{maxRetries}
          </div>
        </div>
      </div>
    );
  }

  // Max retries reached UI (added)
  if (retryCount >= maxRetries) {
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
          color: 'white',
          background: 'rgba(0, 0, 0, 0.9)',
          fontSize: '18px',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <div style={{ marginBottom: '10px' }}>WebGL Context Recovery Failed</div>
          <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '20px' }}>
            Unable to restore WebGL context after {maxRetries} attempts
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
            onMouseOver={e => (e.target.style.backgroundColor = '#2563EB')}
            onMouseOut={e => (e.target.style.backgroundColor = '#3B82F6')}
          >
            Reload Page
          </button>
        </div>
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
        ref={canvasRef} // Added for context recovery
        frameloop={frameloopMode} // Preserved from original
        dpr={targetDpr} // Preserved from original
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
        }}
        // Enhanced WebGL settings for better stability and performance
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false, // Don't fail on slower GPUs
          preserveDrawingBuffer: false, // Better performance
          premultipliedAlpha: true,
          stencil: false, // Better performance if not needed
          depth: true,
        }}
        // Enhanced canvas creation handler
        onCreated={({ gl, scene, camera }) => {
          // Enhanced WebGL setup
          gl.setClearColor('#0a0a0a', 1);
          gl.setPixelRatio(Math.min(window.devicePixelRatio, targetDpr || 2));

          // Context loss prevention
          gl.getContext().canvas.addEventListener('webglcontextlost', e => {
            console.warn('Canvas context lost event detected in onCreated');
          });

          if (process.env.NODE_ENV === 'development') {
            console.log('🎮 Enhanced WebGL Canvas initialized:', {
              renderer: gl.getContext().getParameter(gl.getContext().RENDERER),
              vendor: gl.getContext().getParameter(gl.getContext().VENDOR),
              version: gl.getContext().getParameter(gl.getContext().VERSION),
              maxTextureSize: gl.getContext().getParameter(gl.getContext().MAX_TEXTURE_SIZE),
              frameloop: frameloopMode,
              dpr: targetDpr,
            });
          }
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

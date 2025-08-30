import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import WebGLBackground from './WebGLBackground';

function WebGLCanvasInner({ morphProgress = 0, scrollProgress = 0 }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <WebGLBackground morphProgress={morphProgress} scrollProgress={scrollProgress} />
      <Preload all />
    </>
  );
}

// Simple error boundary using React class component
class WebGLErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('WebGL Canvas Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'black',
            color: 'white',
          }}
        >
          <div>
            <h2>WebGL Error</h2>
            <p>{this.state.error?.message || 'An error occurred'}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                padding: '10px 20px',
                marginTop: '10px',
                background: '#333',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function WebGLCanvas({ morphProgress = 0, scrollProgress = 0 }) {
  const containerRef = useRef();

  useEffect(() => {
    // Ensure container fills viewport
    if (containerRef.current) {
      const container = containerRef.current;
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100vw';
      container.style.height = '100vh';
      container.style.pointerEvents = 'none';
    }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
      }}
    >
      <WebGLErrorBoundary>
        <Suspense fallback={null}>
          <Canvas
            shadows
            dpr={[1, 2]}
            camera={{
              position: [0, 0, 150], // Further back to see everything
              fov: 50, // Narrower FOV for less distortion
              near: 0.1,
              far: 1000,
            }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          >
            <WebGLCanvasInner morphProgress={morphProgress} scrollProgress={scrollProgress} />
          </Canvas>
        </Suspense>
      </WebGLErrorBoundary>
    </div>
  );
}

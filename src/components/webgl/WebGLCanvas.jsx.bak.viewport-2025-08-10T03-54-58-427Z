// src/components/webgl/WebGLCanvas.jsx
// SST v3.0 COMPLIANT - Props-driven renderer

import { Suspense, lazy, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import DevPerformanceMonitor from '@/components/dev/DevPerformanceMonitor';
import DebugExpose from '@/components/dev/DebugExpose';

// Lazy load WebGL components
const WebGLBackground = lazy(() => import('./WebGLBackground'));

// WebGL context pool class
class WebGLContextPool {
  constructor() {
    this.contextPool = [];
    this.maxPoolSize = 3;
    this.activeContexts = new Set();
    this.contextStats = {
      created: 0,
      reused: 0,
      disposed: 0,
      maxConcurrent: 0,
    };
    this.stateCache = new Map();
  }

  createOptimizedContext(canvas, contextAttributes = {}) {
    const optimizedAttributes = {
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false,
      premultipliedAlpha: false,
      stencil: false,
      depth: true,
      ...contextAttributes,
    };

    let context = null;
    try {
      context =
        canvas.getContext('webgl2', optimizedAttributes) ||
        canvas.getContext('webgl', optimizedAttributes);
    } catch (error) {
      console.error('WebGLContextPool: Context creation failed:', error);
    }

    if (context) {
      this.contextStats.created++;
      this.activeContexts.add(context);
    }

    return context;
  }

  cacheWebGLState(context) {
    if (!context) return;
    this.stateCache.set(context, {
      timestamp: Date.now(),
    });
  }

  getStats() {
    return { ...this.contextStats };
  }

  clearPool() {
    this.contextPool = [];
    this.stateCache.clear();
  }
}

// Performance monitor class
class CanvasPerformanceMonitor {
  constructor() {
    this.metrics = {
      frameRate: 0,
      renderTime: 0,
      memoryUsage: 0,
      lastUpdate: 0,
    };
  }

  updateMetrics(data) {
    Object.assign(this.metrics, data, { lastUpdate: Date.now() });
  }

  getPerformanceGrade() {
    if (this.metrics.frameRate >= 55) return 'A';
    if (this.metrics.frameRate >= 45) return 'B';
    if (this.metrics.frameRate >= 30) return 'C';
    return 'D';
  }
}

// Extension interference detection
const detectAdvancedExtensionInterference = () => {
  try {
    const testCanvas = document.createElement('canvas');
    const ctx = testCanvas.getContext('webgl');
    const interference = !ctx || typeof ctx.TRIANGLES !== 'number';
    testCanvas.remove();

    return {
      interference,
      type: interference ? 'webgl_blocked' : 'none',
    };
  } catch (error) {
    return {
      interference: true,
      type: 'detection_failed',
      error: error.message,
    };
  }
};

// ===== MAIN COMPONENT WITH PROPS =====
export default function WebGLCanvas({
  stage = 'genesis',
  morphProgress = 0,
  scrollProgress = 0,
  quality = 'HIGH',
  particleCount = 5000,
  webglEnabled = true,
  fps = 60,
  frameTime = 16.67,
}) {
  // Canvas reference
  const canvasRef = useRef(null);

  // Component state
  const [webglSupported, setWebglSupported] = useState(true);
  const [contextLost, setContextLost] = useState(false);
  const [extensionInterference, setExtensionInterference] = useState(null);
  const [canvasStrategy, setCanvasStrategy] = useState(0);

  // Initialize systems with useMemo
  const contextPool = useMemo(() => new WebGLContextPool(), []);
  const performanceMonitor = useMemo(() => new CanvasPerformanceMonitor(), []);

  // Update performance monitor with props
  useEffect(() => {
    performanceMonitor.updateMetrics({
      frameRate: fps,
      renderTime: frameTime,
    });
  }, [fps, frameTime, performanceMonitor]);

  // Event logging
  const addEventLog = useCallback(
    (eventName, payload) => {
      performanceMonitor.updateMetrics({
        lastEvent: eventName,
        eventTimestamp: Date.now(),
        ...payload,
      });

      if (import.meta.env.DEV) {
        console.log(`🎯 Canvas Event: ${eventName}`, payload);
      }
    },
    [performanceMonitor]
  );

  // Extension interference detection
  useEffect(() => {
    const interference = detectAdvancedExtensionInterference();
    setExtensionInterference(interference);
    if (interference.interference) {
      console.warn('[WebGLCanvas] Extension interference detected:', interference);
      addEventLog('extension_interference_detected', interference);
    }
  }, [addEventLog]);

  // Canvas error handler
  const handleCanvasError = useCallback(
    error => {
      console.error('[WebGLCanvas] Canvas creation failed:', error);
      addEventLog('webgl_canvas_error', {
        error: error.message,
        strategy: canvasStrategy,
        extensionInterference: extensionInterference?.interference,
        contextPoolStats: contextPool.getStats(),
      });

      if (canvasStrategy < 2) {
        console.log(`[WebGLCanvas] Trying fallback strategy ${canvasStrategy + 1}`);
        setCanvasStrategy(canvasStrategy + 1);
      } else {
        console.error('[WebGLCanvas] All strategies failed, disabling WebGL');
        setWebglSupported(false);
        contextPool.clearPool();
      }
    },
    [canvasStrategy, extensionInterference, contextPool, addEventLog]
  );

  // Context loss handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleContextLost = event => {
      event.preventDefault();
      setContextLost(true);
      console.warn('[WebGLCanvas] WebGL context lost, initiating recovery...');
      addEventLog('webgl_context_lost', {
        recovery: 'initiated',
        extensionInterference: extensionInterference?.interference,
        contextPoolStats: contextPool.getStats(),
      });
    };

    const handleContextRestored = () => {
      setContextLost(false);
      console.log('[WebGLCanvas] WebGL context restored successfully');
      addEventLog('webgl_context_restored', {
        status: 'success',
        strategy: canvasStrategy,
        contextPoolStats: contextPool.getStats(),
      });
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [extensionInterference, canvasStrategy, contextPool, addEventLog]);

  // Canvas performance monitoring
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        performanceMonitor.updateMetrics({
          canvasWidth: width,
          canvasHeight: height,
          pixelCount: width * height,
        });
      }
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [performanceMonitor]);

  // Canvas configuration
  const canvasConfig = useMemo(() => {
    const baseConfig = {
      className: 'w-full h-full',
      gl: {
        antialias: quality !== 'LOW',
        alpha: true,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false,
      },
    };

    switch (canvasStrategy) {
      case 1:
        baseConfig.gl.powerPreference = 'default';
        break;
      case 2:
        baseConfig.gl.antialias = false;
        baseConfig.gl.alpha = false;
        break;
    }

    return baseConfig;
  }, [quality, canvasStrategy]);

  // Fallback renders
  if (!webglSupported) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_50%)]" />
        </div>
        <div className="absolute bottom-4 right-4 bg-black/80 border border-red-600 rounded-lg p-3 text-red-400 font-mono text-sm">
          <div className="font-bold mb-2">⚛️ WebGL Not Supported</div>
          <div>Stage: {stage}</div>
          <div>Progress: {Math.round(scrollProgress * 100)}%</div>
        </div>
      </div>
    );
  }

  if (contextLost) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-green-400 text-lg font-mono">Restoring WebGL context...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full">
      <Canvas
        ref={canvasRef}
        {...canvasConfig}
        onCreated={({ gl, scene, camera, size }) => {
          const startTime = performance.now();

          // Access canvas element
          const canvasElement = canvasRef.current;
          if (canvasElement) {
            canvasElement.setAttribute('data-webgl-version', gl.capabilities.isWebGL2 ? '2' : '1');
            canvasElement.setAttribute('data-quality-tier', quality);
            canvasElement.setAttribute('data-particle-count', particleCount.toString());
          }

          // Context optimization
          const context = gl.getContext();
          contextPool.cacheWebGLState(context);

          // Optimal WebGL settings
          gl.setClearColor('#000000', 1);
          gl.shadowMap.enabled = false;
          scene.fog = null;

          // Check point size range
          const glContext = gl.getContext();
          const pointSizeRange = glContext.getParameter(glContext.ALIASED_POINT_SIZE_RANGE);

          const setupTime = performance.now() - startTime;

          console.log('[WebGLCanvas] Canvas created with constellation optimization', {
            renderer: gl.capabilities.isWebGL2 ? 'WebGL2' : 'WebGL1',
            maxTextures: gl.capabilities.maxTextures,
            maxVertexAttributes: gl.capabilities.maxVertexAttributes,
            pointSizeRange: pointSizeRange,
            canvasSize: { width: canvasElement?.width, height: canvasElement?.height },
            setupTime: setupTime.toFixed(2) + 'ms',
            contextPoolStats: contextPool.getStats(),
            quality: quality,
            particles: particleCount,
            stage: stage,
            strategy: canvasStrategy,
          });

          addEventLog('webgl_canvas_created', {
            webgl_version: gl.capabilities.isWebGL2 ? 2 : 1,
            point_size_range: pointSizeRange,
            setup_time: setupTime,
          });
        }}
        onError={handleCanvasError}
      >
        {/* Optimal camera for constellation viewing */}
        <PerspectiveCamera makeDefault position={[0, 0, 80]} fov={75} near={0.1} far={200} />

        {/* Minimal lighting for particles */}
        <ambientLight intensity={0.4} />

        {/* Dev tools */}
        {import.meta.env.DEV && <DebugExpose />}

        {/* Main particle system WITH PROPS */}
        <Suspense fallback={null}>
          {webglEnabled && (
            <WebGLBackground
              stage={stage}
              morphProgress={morphProgress}
              scrollProgress={scrollProgress}
            />
          )}
        </Suspense>
      </Canvas>

      {/* Performance monitoring */}
      <DevPerformanceMonitor />

      {/* Debug overlay */}
      {false &&import.meta.env.DEV && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'rgba(0,0,0,0.9)',
            color: '#00ff88',
            padding: '16px',
            borderRadius: '8px',
            fontFamily: 'Courier New, monospace',
            fontSize: '12px',
            border: '1px solid #00ff88',
            zIndex: 1000,
            minWidth: '300px',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#00ffcc' }}>
            🌌 CONSTELLATION STATUS
          </div>
          <div>Stage: {stage}</div>
          <div>Progress: {Math.round(scrollProgress * 100)}%</div>
          <div>Morph: {Math.round(morphProgress * 100)}%</div>
          <div>Quality: {quality}</div>
          <div>Particles: {particleCount}</div>
          <div>WebGL: {webglEnabled ? '✓' : '✗'}</div>
          <div>Canvas: {canvasRef.current ? '✓' : '✗'}</div>
          <div>Context: {contextLost ? '✗' : '✓'}</div>

          <div
            style={{
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <div style={{ color: '#00ccff', fontWeight: 'bold', marginBottom: '4px' }}>
              Performance:
            </div>
            <div>Grade: {performanceMonitor.getPerformanceGrade()}</div>
            <div>FPS: {fps.toFixed(1)}</div>
            <div>Frame Time: {frameTime.toFixed(1)}ms</div>
          </div>

          {/* SST v3.0 Props */}
          <div
            style={{
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <div style={{ color: '#ffff00', fontWeight: 'bold', marginBottom: '4px' }}>
              SST v3.0 Props:
            </div>
            <div>Stage: {stage}</div>
            <div>Morph: {morphProgress.toFixed(2)}</div>
            <div>Scroll: {scrollProgress.toFixed(2)}</div>
          </div>

          {/* Debug controls */}
          <div
            style={{
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <button
              onClick={() => {
                window.location.hash = '#debug-particles';
                window.location.reload();
              }}
              style={{
                background: '#00ff88',
                color: '#000',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                marginRight: '8px',
              }}
            >
              Debug Mode
            </button>
            <button
              onClick={() => {
                const event = new CustomEvent('webgl-force-init', {
                  detail: { stage: stage, reason: 'manual_test' },
                });
                window.dispatchEvent(event);
              }}
              style={{
                background: '#00ccff',
                color: '#000',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              Force Render
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Global debug access
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.canvasDebug = {
    getCanvasElement: () => document.querySelector('canvas'),

    getCanvasInfo: () => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return 'No canvas found';

      return {
        width: canvas.width,
        height: canvas.height,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
        webglVersion: canvas.getAttribute('data-webgl-version'),
        qualityTier: canvas.getAttribute('data-quality-tier'),
        particleCount: canvas.getAttribute('data-particle-count'),
      };
    },

    testContextPooling: () => {
      console.log('🧪 Testing WebGL context pooling...');
      const testCanvas = document.createElement('canvas');
      const contextPool = new WebGLContextPool();
      const ctx = contextPool.createOptimizedContext(testCanvas);
      const stats = contextPool.getStats();
      testCanvas.remove();
      return stats;
    },

    detectInterference: () => detectAdvancedExtensionInterference(),

    testWebGLSupport: () => {
      const canvas = document.createElement('canvas');
      const webgl2 = canvas.getContext('webgl2');
      const webgl1 = canvas.getContext('webgl');

      const support = {
        webgl2: !!webgl2,
        webgl1: !!webgl1,
        pointSizeRange: webgl2
          ? webgl2.getParameter(webgl2.ALIASED_POINT_SIZE_RANGE)
          : webgl1
            ? webgl1.getParameter(webgl1.ALIASED_POINT_SIZE_RANGE)
            : null,
      };

      canvas.remove();
      console.log('🧪 WebGL Support Test:', support);
      return support;
    },
  };

  console.log('🎯 Enhanced Canvas Debug Tools Available:');
  console.log('🧪 Test context pooling: window.canvasDebug.testContextPooling()');
  console.log('🔍 Detect interference: window.canvasDebug.detectInterference()');
  console.log('🧪 Test WebGL support: window.canvasDebug.testWebGLSupport()');
  console.log('📊 Get canvas info: window.canvasDebug.getCanvasInfo()');
}

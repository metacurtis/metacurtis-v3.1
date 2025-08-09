// WebGLCanvas.jsx — Orchestrator (No R3F)
// SST v3.0 compliant. Owns status/overlays; WebGLBackground just draws.
import React, { useState, useEffect, useMemo } from 'react';
import { ensureCanonGeometry, createCanonMaterial } from '@/renderer/materialFactory';
import WebGLBackground from './WebGLBackground';
import DevPerformanceMonitor from '@/components/dev/DevPerformanceMonitor';

const isDev = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV)
  || (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');

export default function WebGLCanvas({
  stage = 'genesis',
  morphProgress = 0,
  scrollProgress = 0,
  quality = 'HIGH',
  particleCount = 5000,
  webglEnabled = true,
  fps = 60,
}) {
  const [webglSupported, setWebglSupported] = useState(true);
  const [contextLost, setContextLost] = useState(false);

  // WebGL support check
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      setWebglSupported(!!gl);
      canvas.remove();
    } catch { setWebglSupported(false); }
  }, []);

  const onContextLost = useMemo(() => () => setContextLost(true), []);
  const onContextRestored = useMemo(() => () => setContextLost(false), []);

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4" />
          <p className="text-green-400 text-lg font-mono">Restoring WebGL context…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {webglEnabled && (
        <WebGLBackground
          id="canon-webgl-bg"
          stage={stage}
          morphProgress={morphProgress}
          scrollProgress={scrollProgress}
          quality={quality}
          particleCount={particleCount}
          onContextLost={onContextLost}
          onContextRestored={onContextRestored}
        />
      )}

      <DevPerformanceMonitor />

      {isDev && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            left: 20,
            background: 'rgba(0,0,0,0.9)',
            color: '#00ff88',
            padding: 12,
            borderRadius: 8,
            fontFamily: 'monospace',
            fontSize: 11,
            border: '1px solid #00ff88',
            zIndex: 1000,
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>🌌 WebGL Status</div>
          <div>Stage: {stage}</div>
          <div>Morph: {(morphProgress * 100).toFixed(0)}%</div>
          <div>Scroll: {(scrollProgress * 100).toFixed(0)}%</div>
          <div>Quality: {quality}</div>
          <div>Particles: {particleCount}</div>
          <div>FPS: {fps.toFixed(0)}</div>
        </div>
      )}
    </>
  );
}

// Dev helpers
if (typeof window !== 'undefined') {
  window.canvasDebug = {
    getCanvasElement: () => document.getElementById('canon-webgl-bg'),
    getCanvasInfo: () => {
      const canvas = document.getElementById('canon-webgl-bg');
      if (!canvas) return 'No canvas found';
      return {
        width: canvas.width,
        height: canvas.height,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
        dpr: window.devicePixelRatio || 1,
      };
    },
    testWebGLSupport: () => {
      const canvas = document.createElement('canvas');
      const gl2 = canvas.getContext('webgl2');
      const gl1 = gl2 ? null : canvas.getContext('webgl');
      const support = { webgl2: !!gl2, webgl1: !!gl1, supported: !!(gl2 || gl1) };
      canvas.remove();
      return support;
    },
  };
}

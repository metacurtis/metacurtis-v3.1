// src/components/webgl/AdaptiveRenderer.jsx

import { Canvas } from '@react-three/fiber';
import usePerformanceStore from '@/stores/performanceStore';

/**
 * AdaptiveRenderer
 *
 * Wraps R3F’s <Canvas> and adjusts renderer settings (dpr, antialias)
 * based on the current performance quality level from the Zustand store.
 */
export default function AdaptiveRenderer({
  // Pass through any Canvas props you need (style, camera, children, etc.)
  style,
  camera = { position: [0, 0, 5], fov: 50 },
  children,
}) {
  const quality = usePerformanceStore(state => state.quality);

  // Define settings per quality tier
  const settings = {
    ultra: { dpr: [1, 2], antialias: true },
    high: { dpr: [1, 1.5], antialias: true },
    medium: { dpr: [1, 1], antialias: false },
    low: { dpr: [0.5, 1], antialias: false },
  }[quality] || { dpr: [1, 1], antialias: true };

  return (
    <Canvas
      style={style}
      camera={camera}
      dpr={settings.dpr}
      gl={{ antialias: settings.antialias }}
      flat
    >
      {children}
    </Canvas>
  );
}

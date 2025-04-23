import { useEffect, useState } from 'react';
import usePerformanceStore from '@/stores/performanceStore.js';

export default function DevPerformanceMonitor() {
  const fps = usePerformanceStore(state => state.metrics.fps);
  const frame = usePerformanceStore(state => state.metrics.avgFrameTime);
  const [, setTick] = useState(0);

  useEffect(() => {
    // Re-render whenever metrics change
    const unsubscribe = usePerformanceStore.subscribe(
      () => setTick(t => t + 1),
      state => state.metrics
    );
    return unsubscribe;
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 8,
        right: 8,
        background: 'rgba(0,0,0,0.6)',
        color: '#0f0',
        padding: '4px 8px',
        fontFamily: 'monospace',
        fontSize: 12,
        borderRadius: 4,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      <div>FPS: {fps.toFixed(1)}</div>
      <div>Frame: {frame.toFixed(1)} ms</div>
    </div>
  );
}

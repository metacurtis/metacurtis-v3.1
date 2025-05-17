// src/components/dev/DevPerformanceMonitor.jsx
import { memo } from 'react';
import usePerformanceStore from '@/stores/performanceStore.js';
import { useQualityStore } from '@/stores/qualityStore';

// Pulled out of render so it never changes identity
const dashboardStyle = {
  position: 'fixed',
  bottom: '10px',
  left: '10px',
  background: 'rgba(0,0,0,0.85)',
  color: '#00ff00',
  padding: '12px 18px',
  fontFamily: 'monospace',
  fontSize: '14px',
  borderRadius: '6px',
  zIndex: '10001',
  pointerEvents: 'auto',
  lineHeight: '1.6',
  minWidth: '300px',
  border: '1px solid #009900',
  boxShadow: '0 0 10px rgba(0,255,0,0.3)',
};
const statRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '3px',
};
function safeToFixed(num, digits = 1) {
  return typeof num === 'number' && !isNaN(num) ? num.toFixed(digits) : 'N/A';
}

function DevPerformanceMonitor() {
  // ← primitive selectors: each hook only re‑runs when that one value changes
  const fps = usePerformanceStore(state => state.fps);
  const avgFrameTime = usePerformanceStore(state => state.avgFrameTime);
  const deltaMs = usePerformanceStore(state => state.deltaMs);
  const jankCount = usePerformanceStore(state => state.jankCount);
  const jankRatio = usePerformanceStore(state => state.jankRatio);

  // quality flag to bail early in prod or when WebGL’s off
  const webglEnabled = useQualityStore(state => state.webglEnabled);
  if (!webglEnabled) return null;

  return (
    <div style={dashboardStyle}>
      <div style={statRowStyle}>
        <span>FPS (avg):</span> <span>{safeToFixed(fps)}</span>
      </div>
      <div style={statRowStyle}>
        <span>Frame (avg):</span> <span>{safeToFixed(avgFrameTime)} ms</span>
      </div>
      <div style={statRowStyle}>
        <span>Frame (last):</span> <span>{safeToFixed(deltaMs)} ms</span>
      </div>
      <div style={statRowStyle}>
        <span>Jank Count:</span> <span>{jankCount}</span>
      </div>
      <div style={statRowStyle}>
        <span>Jank Ratio:</span> <span>{safeToFixed(jankRatio * 100)}%</span>
      </div>
    </div>
  );
}

export default memo(DevPerformanceMonitor);

// src/components/ui/ResourceMonitor.jsx

import React, { useEffect } from 'react';
import useResourceStore from '@/stores/resourceStore.js';

export default function ResourceMonitor() {
  const sample = useResourceStore(s => s.sampleResources);
  const stats = useResourceStore(s => s.resourceStats);

  useEffect(() => {
    sample();
    const id = setInterval(sample, 1000);
    return () => clearInterval(id);
  }, [sample]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 10,
        left: 10,
        color: '#fff',
        background: 'rgba(0,0,0,0.6)',
        padding: '8px 12px',
        borderRadius: 4,
        fontFamily: 'sans-serif',
        zIndex: 1000,
      }}
    >
      <div>Textures: {stats.counts.texture}</div>
      <div>Materials: {stats.counts.material}</div>
      <div>Geometry: {stats.counts.geometry}</div>
      {stats.leakWarning && (
        <div style={{ color: 'salmon', marginTop: 4 }}>⚠️ Resource leak detected!</div>
      )}
    </div>
  );
}

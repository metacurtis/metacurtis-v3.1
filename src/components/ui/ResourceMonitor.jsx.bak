// src/components/ui/ResourceMonitor.jsx

import useResourceStore from '@/stores/resourceStore.js';

export default function ResourceMonitor() {
  // Safely retrieve stats; fallback to zeros
  const stats = useResourceStore(s => s.stats) || {
    geometry: 0,
    material: 0,
    texture: 0,
  };
  const { geometry, material, texture } = stats;

  return (
    <div
      style={{
        position: 'fixed',
        top: 8,
        left: 8,
        background: 'rgba(0,0,0,0.6)',
        color: '#0ff',
        padding: '4px 8px',
        fontFamily: 'monospace',
        fontSize: 12,
        borderRadius: 4,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      <div>Geometries: {geometry}</div>
      <div>Materials: {material}</div>
      <div>Textures: {texture}</div>
    </div>
  );
}

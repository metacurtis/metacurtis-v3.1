// src/components/ui/ResourceMonitor.jsx
import { useEffect } from 'react';
import useResourceStore from '@/stores/resourceStore.js';

export default function ResourceMonitor() {
  // Pull values and the updater from the store
  const geometryCount = useResourceStore(s => s.geometryCount);
  const materialCount = useResourceStore(s => s.materialCount);
  const textureCount = useResourceStore(s => s.textureCount);
  const estimatedMemoryMB = useResourceStore(s => s.estimatedMemoryMB);
  const updateStats = useResourceStore(s => s.updateStats);

  // On mount, immediately refresh, then every second thereafter
  useEffect(() => {
    updateStats(); // first tick
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, [updateStats]);

  return (
    <div className="resource-monitor fixed bottom-4 right-4 p-2 bg-black/50 text-white rounded text-sm">
      <p>Geometries: {geometryCount}</p>
      <p>Materials: {materialCount}</p>
      <p>Textures: {textureCount}</p>
      <p>Memory: {(typeof estimatedMemoryMB === 'number' ? estimatedMemoryMB : 0).toFixed(1)} MB</p>
    </div>
  );
}

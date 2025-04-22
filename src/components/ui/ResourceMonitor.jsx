// src/components/ui/ResourceMonitor.jsx
import { useEffect, useState } from 'react';
import useResourceStats from '@/stores/resourceStore';

export default function ResourceMonitor() {
  const stats = useResourceStats();
  const [snapshot, setSnapshot] = useState({
    geometries: 0,
    textures: 0,
    materials: 0,
    memoryMB: '0.0',
  });

  useEffect(() => {
    const unsub = useResourceStats.subscribe(s => {
      setSnapshot({
        geometries: s.geometryCount,
        textures: s.textureCount,
        materials: s.materialCount,
        memoryMB: s.estimatedMemoryMB.toFixed(1),
      });
    });
    return unsub;
  }, []);

  return (
    <div className="resource-monitor fixed bottom-4 right-4 p-2 bg-black/50 text-white rounded text-sm">
      <p>Geometries: {snapshot.geometries}</p>
      <p>Textures: {snapshot.textures}</p>
      <p>Materials: {snapshot.materials}</p>
      <p>Memory: {snapshot.memoryMB} MB</p>
    </div>
  );
}

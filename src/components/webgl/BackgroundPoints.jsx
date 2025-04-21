import { useMemo } from 'react';
import * as THREE from 'three';

export function BackgroundPoints({ count = 8000, size = 5, color = '#ffffff' }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const half = 10;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() * 2 - 1) * half;
      positions[i3 + 1] = (Math.random() * 2 - 1) * half;
      positions[i3 + 2] = (Math.random() * 2 - 1) * half;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count]);

  return (
    <points geometry={geometry}>
      <pointsMaterial attach="material" size={size} color={color} depthWrite={false} transparent />
    </points>
  );
}

// src/components/webgl/MinimalTestCanvas.jsx

import { Canvas } from '@react-three/fiber';

export default function MinimalTestCanvas() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)' }}>
      <Canvas style={{ background: 'lightblue' }}>
        <ambientLight intensity={0.5} />
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="orange" />
        </mesh>
      </Canvas>
    </div>
  );
}

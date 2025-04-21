import { Canvas } from '@react-three/fiber';
import WebGLBackground from './WebGLBackground';
import CanvasSizeUpdater from './CanvasSizeUpdater';

export default function ParticleField({
  count,
  baseSize,
  colors,
  quality,
  zIndex = -1,
  cameraPos = [0, 0, 5],
  fov = 50,
  dpr = [1, 1.5],
}) {
  return (
    <Canvas
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex }}
      camera={{ position: cameraPos, fov }}
      dpr={dpr}
      flat
    >
      <WebGLBackground count={count} baseSize={baseSize} colors={colors} quality={quality} />
      <CanvasSizeUpdater />
    </Canvas>
  );
}

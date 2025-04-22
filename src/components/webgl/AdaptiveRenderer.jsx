import { Canvas } from '@react-three/fiber';
import usePerformanceStore from '@/stores/performanceStore.js';
import { useQuality } from './QualityController';

export default function AdaptiveRenderer({ children, style = {}, camera, ...canvasProps }) {
  const { dprMin, dprMax, antialias } = useQuality();
  const device = usePerformanceStore(s => s.device);

  return (
    <Canvas
      // Turn on detailed shader compile errors
      onCreated={({ gl }) => {
        gl.debug.checkShaderErrors = true;
      }}
      dpr={[dprMin, dprMax]}
      camera={camera}
      gl={{
        antialias,
        powerPreference: device.powerPreference || 'high-performance',
      }}
      style={style}
      {...canvasProps}
    >
      {children}
    </Canvas>
  );
}

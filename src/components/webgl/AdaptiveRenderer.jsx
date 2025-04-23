import { Canvas } from '@react-three/fiber';
import FPSCalculator from './FPSCalculator';
import useAdaptiveQuality from '@/hooks/useAdaptiveQuality.js';

/**
 * Wraps <Canvas> to inject our FPS tick hook
 * — but does *not* render DOM overlays inside the Canvas.
 */
export default function AdaptiveRenderer(props) {
  // Kick off the adaptive‐quality system
  useAdaptiveQuality();

  return (
    <Canvas {...props}>
      {/* Tick FPS into Zustand each frame */}
      <FPSCalculator />
      {/* Your 3D scene children */}
      {props.children}
    </Canvas>
  );
}

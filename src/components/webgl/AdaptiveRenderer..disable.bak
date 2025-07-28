import { Canvas } from '@react-three/fiber';
import FPSCalculator from './FPSCalculator';

/**
 * Wraps <Canvas> to inject our FPS tick hook
 */
export default function AdaptiveRenderer(props) {
  return (
    <Canvas {...props}>
      {/* ← Must be inside Canvas so useFrame works */}
      <FPSCalculator />
      {props.children}
    </Canvas>
  );
}

import { useFrame } from '@react-three/fiber';
import usePerformanceStore from '@/stores/performanceStore.js';

export default function FPSCalculator() {
  const tickFrame = usePerformanceStore(s => s.tickFrame);
  useFrame((_, delta) => {
    tickFrame(delta);
  });
  return null;
}

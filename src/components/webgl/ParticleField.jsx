import { Canvas } from '@react-three/fiber';
import { BackgroundPoints } from './BackgroundPoints';
import { useInteractionStore } from '@/stores/useInteractionStore';

export default function ParticleField() {
  const scrollProgress = useInteractionStore(state => state.scrollProgress);

  return (
    <Canvas pixelRatio={window.devicePixelRatio}>
      <BackgroundPoints color="#00ffff" />
    </Canvas>
  );
}

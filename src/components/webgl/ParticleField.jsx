import { ParticleField } from '@webgl/ParticleField';

function BackgroundScene() {
  const quality = useInteractionStore(s => s.qualityLevel);
  return (
    <>
      <color attach="background" args={['#000000']} />
      <ParticleField
        count={12000}
        quality={quality}
        colors={['#f0f', '#0ff', '#06f']}
        size={0.05}
        radius={3}
        strength={2}
      />
    </>
  );
}

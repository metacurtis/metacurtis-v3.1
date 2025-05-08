// src/components/webgl/WebGLCanvas.jsx
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { SimpleAnimatedCube } from '../graphics/SimpleAnimatedCube'; // Adjust path
import { useQualityStore } from '../../stores/qualityStore'; // Adjust path
import { AdaptiveQualitySystem } from '../quality/AdaptiveQualitySystem'; // Adjust path

const SceneContent = () => {
  return (
    <>
      <ambientLight intensity={0.6} />
      <SimpleAnimatedCube position={[0, 0, 0]} />
    </>
  );
};

export const WebGLCanvas = () => {
  const frameloopMode = useQualityStore(state => state.frameloopMode);
  const targetDpr = useQualityStore(state => state.targetDpr);

  return (
    <Canvas
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
      }}
      frameloop={frameloopMode}
      dpr={targetDpr}
    >
      <PerspectiveCamera makeDefault position={[0, 1, 5]} fov={75} />
      <SceneContent />
      <AdaptiveQualitySystem />
    </Canvas>
  );
};

import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

export default function DebugExpose() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    window.renderer = gl;
    window.scene = scene;
    window.camera = camera;
  }, [gl, scene, camera]);
  return null;
}

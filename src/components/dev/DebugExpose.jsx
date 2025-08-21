import { useThree } from '@react-three/fiber';
import { useEffect } from 'react'; // @doctor:4b-disposers
const __doctorDisposers = [];
export default function DebugExpose() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    window.renderer = gl;
    window.scene = scene;
    window.camera = camera;
  }, [gl, scene, camera]);
  return null;
} // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}
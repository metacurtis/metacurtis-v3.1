import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useInteractionStore } from '@/stores/useInteractionStore';

import noiseSrc from './shaders/noise.glsl';
import vertexSrc from './shaders/vertex.glsl';
import fragmentSrc from './shaders/fragment.glsl';

export default function WebGLBackground() {
  const { viewport, mouse } = useThree();
  const scrollProgress = useInteractionStore(s => s.scrollProgress);
  const materialRef = useRef();

  // 1) Generate your particle arrays (as before)
  const [posArr, a1Arr, a2Arr] = useMemo(() => {
    const c = 8000;
    const p = new Float32Array(c * 3);
    const a1 = new Float32Array(c * 4);
    const a2 = new Float32Array(c * 4);
    for (let i = 0; i < c; i++) {
      const i3 = i * 3,
        i4 = i * 4;
      p[i3] = (Math.random() * 2 - 1) * (viewport.width / 2);
      p[i3 + 1] = (Math.random() * 2 - 1) * (viewport.height / 2);
      p[i3 + 2] = (Math.random() * 2 - 1) * 2;
      a1[i4] = 0.3 + Math.random() * 0.7;
      a1[i4 + 1] = 0.3 + Math.random() * 0.7;
      a1[i4 + 2] = 0.3 + Math.random() * 0.7;
      a1[i4 + 3] = Math.random() * 6.283;
      a2[i4] = 0.1 + Math.random() * 0.2;
    }
    return [p, a1, a2];
  }, [viewport]);

  // 2) Build geometry
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    g.setAttribute('animFactors1', new THREE.BufferAttribute(a1Arr, 4));
    g.setAttribute('animFactors2', new THREE.BufferAttribute(a2Arr, 4));
    return g;
  }, [posArr, a1Arr, a2Arr]);

  // 3) Concatenate noise + vertex
  const vertexShader = useMemo(
    () => `${noiseSrc}\nprecision mediump float;\n${vertexSrc}`,
    [noiseSrc, vertexSrc]
  );

  // 4) Material
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: 0.03 },
          uScrollProgress: { value: scrollProgress },
          uColorA: { value: new THREE.Color('#ff00ff') },
          uColorB: { value: new THREE.Color('#00ffff') },
          uColorC: { value: new THREE.Color('#0066ff') },
          uColorIntensity: { value: 1.2 },
          uCursorPos: { value: new THREE.Vector3() },
          uCursorRadius: { value: 2.0 },
          uRepulsionStrength: { value: 1.0 },
        },
        vertexShader,
        fragmentShader: fragmentSrc,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [vertexShader, fragmentSrc, scrollProgress]
  );

  // 5) Animate uniforms
  useFrame(({ clock }) => {
    const mat = materialRef.current;
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uScrollProgress.value = scrollProgress;
    mat.uniforms.uCursorPos.value.set(
      (mouse.x * viewport.width) / 2,
      (mouse.y * viewport.height) / 2,
      0
    );
  });

  // 6) Render
  return (
    <>
      <color attach="background" args={['#000000']} />
      <points geometry={geometry}>
        <primitive object={material} attach="material" ref={materialRef} />
      </points>
    </>
  );
}

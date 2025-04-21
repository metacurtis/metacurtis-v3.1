// src/components/webgl/WebGLBackground.jsx

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useInteractionStore } from '@/stores/useInteractionStore';
import useAdaptiveQuality from '@/hooks/useAdaptiveQuality.js';
import { includeChunk, wrapQualityDefines } from '@/shaders/shaderUtils.js';
import vertexSrc from './shaders/vertex.glsl';
import fragmentSrc from './shaders/fragment.glsl';

export default function WebGLBackground({
  count = 8000,
  baseSize = 0.04,
  colors = ['#ff00ff', '#00ffff', '#0066ff'],
  quality = 'high',
}) {
  // Now this runs inside R3F's <Canvas> context
  useAdaptiveQuality();

  // Standard R3F/Three.js setup
  const { viewport, mouse } = useThree();
  const scrollProgress = useInteractionStore(s => s.scrollProgress);
  const materialRef = useRef();

  // 1) Prepare shaders with quality defines
  const vertexShader = useMemo(() => {
    const base = includeChunk('noise.glsl') + '\nprecision mediump float;\n' + vertexSrc;
    return wrapQualityDefines(quality, base);
  }, [quality]);

  const fragmentShader = useMemo(() => {
    const base = 'precision mediump float;\n' + fragmentSrc;
    return wrapQualityDefines(quality, base);
  }, [quality]);

  // 2) Generate particle data
  const [posArr, a1Arr, a2Arr] = useMemo(() => {
    const pCount = count;
    const p = new Float32Array(pCount * 3);
    const a1 = new Float32Array(pCount * 4);
    const a2 = new Float32Array(pCount * 4);
    const halfW = viewport.width / 2;
    const halfH = viewport.height / 2;

    for (let i = 0; i < pCount; i++) {
      const i3 = i * 3,
        i4 = i * 4;
      p[i3] = (Math.random() * 2 - 1) * halfW;
      p[i3 + 1] = (Math.random() * 2 - 1) * halfH;
      p[i3 + 2] = (Math.random() * 2 - 1) * 2;

      a1[i4] = 0.3 + Math.random() * 0.7;
      a1[i4 + 1] = 0.3 + Math.random() * 0.7;
      a1[i4 + 2] = 0.3 + Math.random() * 0.7;
      a1[i4 + 3] = Math.random() * Math.PI * 2;

      a2[i4] = 0.1 + Math.random() * 0.2;
    }

    return [p, a1, a2];
  }, [viewport, count]);

  // 3) Build geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    geo.setAttribute('animFactors1', new THREE.BufferAttribute(a1Arr, 4));
    geo.setAttribute('animFactors2', new THREE.BufferAttribute(a2Arr, 4));
    return geo;
  }, [posArr, a1Arr, a2Arr]);

  // 4) Create material
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: baseSize },
          uScrollProgress: { value: scrollProgress },
          uColorA: { value: new THREE.Color(colors[0]) },
          uColorB: { value: new THREE.Color(colors[1]) },
          uColorC: { value: new THREE.Color(colors[2]) },
          uColorIntensity: { value: 1.2 },
          uCursorPos: { value: new THREE.Vector3() },
          uCursorRadius: { value: 2.0 },
          uRepulsionStrength: { value: 1.0 },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [vertexShader, fragmentShader, baseSize, scrollProgress, colors]
  );

  // 5) Update uniforms each frame
  useFrame(({ clock }) => {
    const mat = materialRef.current;
    if (!mat) return;
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

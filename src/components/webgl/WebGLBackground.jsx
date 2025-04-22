// src/components/webgl/WebGLBackground.jsx

import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useInteractionStore } from '@/stores/useInteractionStore';
import useResourceTracker from '@/hooks/useResourceTracker.js';
import { wrapQualityDefines } from '@/shaders/shaderUtils.js';

// Import the three separate GLSL files:
import noiseSrc from './shaders/noise.glsl';
import vertexSrc from './shaders/vertex.glsl';
import fragmentSrc from './shaders/fragment.glsl';

export default function WebGLBackground({
  count = 8000,
  baseSize = 0.06,
  colors = ['#ff00ff', '#00ffff', '#0066ff'],
  quality = 'high',
  cursorRadius = 2.0,
  repulsionStr = 1.0,
}) {
  const pointsRef = useRef();
  const scrollProgress = useInteractionStore(s => s.scrollProgress);
  const { viewport, mouse } = useThree();
  const tracker = useResourceTracker();

  // 1) Build up particle data arrays once
  const [positions, anim1, anim2] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const a1 = new Float32Array(count * 4);
    const a2 = new Float32Array(count * 4);
    const field = { w: 14, h: 8, d: 2 };

    for (let i = 0; i < count; i++) {
      const i3 = i * 3,
        i4 = i * 4;
      pos[i3] = (Math.random() * 2 - 1) * field.w;
      pos[i3 + 1] = (Math.random() * 2 - 1) * field.h;
      pos[i3 + 2] = (Math.random() * 2 - 1) * field.d;

      a1[i4] = 0.3 + Math.random() * 0.7;
      a1[i4 + 1] = 0.3 + Math.random() * 0.7;
      a1[i4 + 2] = 0.3 + Math.random() * 0.7;
      a1[i4 + 3] = Math.random() * 2 * Math.PI;

      a2[i4] = 0.1 + Math.random() * 0.2;
    }

    return [pos, a1, a2];
  }, [count]);

  // 2) Prepare uniforms & colors
  const colorA = new THREE.Color(colors[0]);
  const colorB = new THREE.Color(colors[1]);
  const colorC = new THREE.Color(colors[2]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: baseSize },
      uScrollProgress: { value: 0 },
      uCursorPos: { value: new THREE.Vector3() },
      uCursorRadius: { value: cursorRadius },
      uRepulsionStrength: { value: repulsionStr },
      uColorA: { value: colorA },
      uColorB: { value: colorB },
      uColorC: { value: colorC },
      uColorIntensity: { value: 1.2 },
    }),
    [baseSize, cursorRadius, repulsionStr, colorA, colorB, colorC]
  );

  // 3) Create the material, *prepending* noiseSrc
  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      defines: wrapQualityDefines(quality),
      uniforms,
      vertexShader: noiseSrc + '\n' + vertexSrc,
      fragmentShader: fragmentSrc,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // Debug: print final code
    mat.onBeforeCompile = ({ vertexShader, fragmentShader }) => {
      console.group('🛠️ Shader Compilation Debug');
      console.log('--- VERTEX SHADER ---\n', vertexShader);
      console.log('--- FRAGMENT SHADER ---\n', fragmentShader);
      console.groupEnd();
    };

    return mat;
  }, [uniforms, quality]);

  // 4) Build geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('animFactors1', new THREE.BufferAttribute(anim1, 4));
    geo.setAttribute('animFactors2', new THREE.BufferAttribute(anim2, 4));
    return geo;
  }, [positions, anim1, anim2]);

  // 5) Track resources once mounted
  useEffect(() => {
    if (pointsRef.current) {
      tracker.track(pointsRef.current);
    }
  }, [tracker]);

  // 6) Update uniforms every frame
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uScrollProgress.value = scrollProgress;
    uniforms.uCursorPos.value.set(
      (mouse.x * viewport.width) / 2,
      (mouse.y * viewport.height) / 2,
      0
    );
  });

  // 7) Render
  return (
    <>
      <color attach="background" args={['#000000']} />
      <points ref={pointsRef} geometry={geometry} material={material} />
    </>
  );
}

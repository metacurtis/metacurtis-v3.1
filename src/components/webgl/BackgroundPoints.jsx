// src/components/webgl/BackgroundPoints.jsx
import * as THREE from 'three';
import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

export function BackgroundPoints() {
  const { viewport, mouse } = useThree();
  const geometry = useMemo(() => {
    const positions = new Float32Array([-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uSize: { value: 30.0 } },
        vertexShader: `
      precision mediump float;
      uniform float uSize;
      void main() {
        gl_PointSize = uSize;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
        fragmentShader: `
      precision mediump float;
      void main() {
        gl_FragColor = vec4(1.0); // white
      }
    `,
        transparent: true,
        depthWrite: false,
      }),
    []
  );

  return <points geometry={geometry} material={material} />;
}

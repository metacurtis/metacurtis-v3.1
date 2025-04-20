// src/components/webgl/WebGLBackground.jsx
import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useInteractionStore } from '@/stores/useInteractionStore';

// ── Full Simplex Noise GLSL ───────────────────────────────────────────────
const glslSimplexNoise = `
precision mediump float;
vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t){ return t*t*t*(t*(t*6.0-15.0)+10.0); }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy), i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx, x2 = x0 - i2 + C.yyy, x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute( permute( permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
                           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                           + i.x + vec4(0.0, i1.x, i2.x, 1.0) );
  float n_ = 0.142857142857; vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x2_ = x_ * ns.x + ns.yyyy, y2_ = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x2_) - abs(y2_);
  vec4 b0 = vec4(x2_.xy, y2_.xy), b1 = vec4(x2_.zw, y2_.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0, s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x), p1 = vec3(a0.zw,h.y), p2 = vec3(a1.xy,h.z), p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m*m; m = m*m;
  vec4 px = vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3));
  return 42.0 * dot(m, px);
}
`;

// ── Vertex Shader ─────────────────────────────────────────────────────────
const vertexShader = `
precision mediump float;
${glslSimplexNoise}

uniform float uTime, uSize;
uniform vec3  uCursorPos;
uniform float uCursorRadius, uRepulsionStrength;

attribute vec4 animFactors1, animFactors2;
varying float vElevation, vAlpha;

void main() {
  float t = uTime * 0.1;
  float freq = 0.3, amp = animFactors2.x * 1.5;
  float n = snoise(vec3(position.xy * freq + animFactors1.w, t + animFactors1.w));
  vec3 pos = position + normalize(position) * n * amp;

  // Repel from cursor
  float d = distance(pos.xy, uCursorPos.xy);
  if (d < uCursorRadius) {
    float f = 1.0 - (d / uCursorRadius);
    pos += normalize(vec3(pos.xy - uCursorPos.xy, 0.0)) * (f*f) * uRepulsionStrength;
  }

  vElevation = pos.z * 0.5 + 0.5;
  float xyD = length(pos.xy);
  vAlpha = (1.0 - min(xyD / 8.0, 1.0)) * 0.8 + 0.2; // falloff

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = uSize * (300.0 / -mv.z);
  gl_Position  = projectionMatrix * mv;
}
`;

// ── Fragment Shader ────────────────────────────────────────────────────────
const fragmentShader = `
precision mediump float;

uniform float uScrollProgress, uColorIntensity;
uniform vec3 uColorA, uColorB, uColorC;

varying float vElevation, vAlpha;

void main() {
  float m = smoothstep(0.0,1.0, mix(vElevation, uScrollProgress, 0.7));
  vec3 col = m < 0.5
    ? mix(uColorA, uColorB, m*2.0)
    : mix(uColorB, uColorC, (m-0.5)*2.0);
  col *= uColorIntensity;

  float d = length(gl_PointCoord - 0.5);
  float a = 1.0 - smoothstep(0.45, 0.5, d);
  if (a < 0.01) discard;

  gl_FragColor = vec4(col, a * vAlpha);
}
`;

// ── Component ─────────────────────────────────────────────────────────────
export default function WebGLBackground() {
  const materialRef = useRef();
  const { viewport, mouse } = useThree();
  const scrollProgress = useInteractionStore(s => s.scrollProgress);

  // Generate data once
  const [positions, anim1, anim2] = useMemo(() => {
    const count = 8000;
    const pos = new Float32Array(count * 3);
    const a1 = new Float32Array(count * 4);
    const a2 = new Float32Array(count * 4);
    const fs = { w: 14, h: 8, d: 2 };
    for (let i = 0; i < count; i++) {
      const i3 = i * 3,
        i4 = i * 4;
      pos[i3] = (Math.random() * 2 - 1) * fs.w;
      pos[i3 + 1] = (Math.random() * 2 - 1) * fs.h;
      pos[i3 + 2] = (Math.random() * 2 - 1) * fs.d;
      a1[i4] = 0.3 + Math.random() * 0.7;
      a1[i4 + 1] = 0.3 + Math.random() * 0.7;
      a1[i4 + 2] = 0.3 + Math.random() * 0.7;
      a1[i4 + 3] = Math.random() * 6.283;
      a2[i4] = 0.1 + Math.random() * 0.2;
    }
    return [pos, a1, a2];
  }, []);

  // Uniforms
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 0.04 },
      uScrollProgress: { value: scrollProgress },
      uColorA: { value: new THREE.Color('#ff00ff') },
      uColorB: { value: new THREE.Color('#00ffff') },
      uColorC: { value: new THREE.Color('#0066ff') },
      uColorIntensity: { value: 1.2 },
      uCursorPos: { value: new THREE.Vector3() },
      uCursorRadius: { value: 2.0 },
      uRepulsionStrength: { value: 1.0 },
    }),
    [scrollProgress]
  );

  // Material
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [uniforms]
  );

  // Update each frame
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uScrollProgress.value = scrollProgress;
    uniforms.uCursorPos.value.set(
      (mouse.x * viewport.width) / 2,
      (mouse.y * viewport.height) / 2,
      0
    );
  });

  // Geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('animFactors1', new THREE.BufferAttribute(anim1, 4));
    geo.setAttribute('animFactors2', new THREE.BufferAttribute(anim2, 4));
    return geo;
  }, [positions, anim1, anim2]);

  // Render black background + points
  return (
    <>
      <color attach="background" args={['#000000']} />
      <points geometry={geometry} material={material} ref={materialRef} />
    </>
  );
}

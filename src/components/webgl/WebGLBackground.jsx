// src/components/webgl/WebGLBackground.jsx
import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber'; // Re-add useThree
import { useInteractionStore } from '@/stores/useInteractionStore'; // Re-add store import

// --- GLSL Noise Function (Simplex 3D) ---
const glslSimplexNoise = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0) ; const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) ); vec3 x0 =   v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g; vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy ); vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + C.yyy; vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857; vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z); vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ * ns.x + ns.yyyy; vec4 y = y_ * ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy ); vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.51 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m; m = m * m;
    vec4 px = vec4( dot(x0,p0), dot(x1,p1), dot(x2,p2), dot(x3,p3) );
    return 42.0 * dot( m, px);
  }
`;

// --- Raw Shader Code ---

const rawVertexShader = `
  precision mediump float;

  // --- UNIFORMS ---
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uSize;
  uniform vec3 uCursorPos; // <-- ADDED BACK
  uniform float uCursorRadius; // <-- ADDED BACK
  uniform float uRepulsionStrength; // <-- ADDED BACK

  // --- ATTRIBUTES ---
  attribute vec3 position;
  attribute vec4 animFactors1; // xFreq, yFreq, zFreq, phase
  attribute vec4 animFactors2; // amplitude, unused, unused, unused

  // --- Noise Function ---
  ${glslSimplexNoise} // Inject noise function code

  void main() {
    // --- Noise-Based Animation Logic ---
    float time = uTime * 0.1;
    float noiseFrequency = 0.3;
    float noiseAmplitude = animFactors2.x * 1.5;
    float noise = snoise(vec3(position.xy * noiseFrequency + animFactors1.w, time + animFactors1.w));
    vec3 displacement = normalize(position) * noise * noiseAmplitude;
    vec3 animatedPos = position + displacement;
    // --- End Noise-Based Animation Logic ---

    // --- Cursor Repulsion Logic --- ADDED BACK
    float distToCursor = distance(animatedPos, uCursorPos);
    if (distToCursor < uCursorRadius) {
       float repulsionFactor = 1.0 - (distToCursor / uCursorRadius);
       vec3 repulsionDir = normalize(animatedPos - uCursorPos);
       // Apply repulsion force
       animatedPos += repulsionDir * pow(repulsionFactor, 2.0) * uRepulsionStrength;
    }
    // --- End Cursor Repulsion ---

    vec4 mvPosition = modelViewMatrix * vec4(animatedPos, 1.0);

    // Point size with attenuation
    gl_PointSize = uSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const rawFragmentShader = `
  precision mediump float;

  // Uniforms for scroll color interpolation - ADDED BACK
  uniform float uScrollProgress;
  uniform vec3 uColorA; // e.g., Magenta
  uniform vec3 uColorB; // e.g., Cyan

  void main() {
    // Calculate scroll color lerp - ADDED BACK
    vec3 finalColor = mix(uColorA, uColorB, uScrollProgress);

    // Circular point shape with soft edges - ADDED BACK
    float distanceToCenter = length(gl_PointCoord - vec2(0.5));
    float alpha = 1.0 - smoothstep(0.45, 0.5, distanceToCenter);

    // Discard fully transparent pixels - ADDED BACK
    if (alpha < 0.01) discard;

    // Set final color and alpha
    gl_FragColor = vec4(finalColor, alpha * 0.8);
  }
`;

// --- WebGLBackground Component ---

// Settings
const particleCount = 7000;
const fieldRadius = 10;
const cursorInteractionRadius = 1.5;
const cursorRepulsionStrength = 1.5;
// Define colors for the mix
const colorA = new THREE.Color('#ff00ff'); // Magenta
const colorB = new THREE.Color('#00ffff'); // Cyan

function WebGLBackground() {
  const pointsRef = useRef();
  const materialRef = useRef(); // Ref needed to update uniforms
  // Get interaction states
  const { viewport, mouse } = useThree(); // <-- Need mouse/viewport for cursor pos
  const scrollProgress = useInteractionStore(state => state.scrollProgress); // Need scroll

  // Generate particle positions and animation factors
  const [positions, animFactors1, animFactors2] = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const animFactors1 = new Float32Array(particleCount * 4);
    const animFactors2 = new Float32Array(particleCount * 4);
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const i4 = i * 4;
      const radius = Math.random() * fieldRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      animFactors1[i4 + 0] = 0.5 + Math.random() * 0.5;
      animFactors1[i4 + 1] = 0.5 + Math.random() * 0.5;
      animFactors1[i4 + 2] = 0.5 + Math.random() * 0.5;
      animFactors1[i4 + 3] = Math.random() * Math.PI * 2;
      animFactors2[i4 + 0] = 0.1 + Math.random() * 0.15; // Amplitude in .x
    }
    return [positions, animFactors1, animFactors2];
  }, []);

  // Define uniforms for RawShaderMaterial, including interactions
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uSize: { value: 0.015 }, // Keep smaller size
      uScrollProgress: { value: 0.0 }, // Add scroll uniform
      uColorA: { value: colorA }, // Add color uniforms
      uColorB: { value: colorB },
      uCursorPos: { value: new THREE.Vector3() }, // Add cursor uniforms
      uCursorRadius: { value: cursorInteractionRadius },
      uRepulsionStrength: { value: cursorRepulsionStrength },
    }),
    []
  );

  // Create the material instance using THREE.RawShaderMaterial
  const material = useMemo(
    () =>
      new THREE.RawShaderMaterial({
        uniforms: uniforms,
        vertexShader: rawVertexShader, // Includes noise AND cursor logic
        fragmentShader: rawFragmentShader, // Includes scroll color logic
        depthWrite: false,
        transparent: true, // Needed for soft edges / blending
        blending: THREE.AdditiveBlending, // Use additive blending
      }),
    [uniforms]
  );

  // Update uniforms on each frame
  useFrame(state => {
    // Check if uniforms exist before updating
    if (materialRef.current?.uniforms) {
      // Use ref to access material uniforms
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      // Update scroll progress uniform from Zustand store
      materialRef.current.uniforms.uScrollProgress.value = scrollProgress;
      // Update cursor position uniform - ADDED BACK
      materialRef.current.uniforms.uCursorPos.value.set(
        (mouse.x * viewport.width) / 2,
        (mouse.y * viewport.height) / 2,
        0 // Assuming interaction on z=0 plane
      );
    }
  });

  return (
    <>
      <color attach="background" args={['#000000']} />
      {/* No lights needed */}

      <points ref={pointsRef}>
        <bufferGeometry>
          {/* Attach position AND custom animation factor attributes */}
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-animFactors1"
            count={particleCount}
            array={animFactors1}
            itemSize={4}
          />
          <bufferAttribute
            attach="attributes-animFactors2"
            count={particleCount}
            array={animFactors2}
            itemSize={4}
          />
        </bufferGeometry>
        {/* Attach the RawShaderMaterial instance using primitive */}
        <primitive object={material} attach="material" ref={materialRef} />
      </points>
    </>
  );
}

export default WebGLBackground;

// src/components/webgl/shaders/vertex.glsl - DEBUG VERSION

// Uniforms
uniform float uTime;
uniform float uSize;
uniform float uScrollProgress;
uniform vec3 uCursorPos;
uniform float uCursorRadius;
uniform float uRepulsionStrength;

// Aurora and ripple effects
uniform float uRippleTime;
uniform vec3 uRippleCenter;
uniform float uRippleStrength;
uniform float uWavePhase;

// Attributes
attribute vec4 animFactors1; // x: speed, y: phase, z: randomFactor1, w: randomAngle
attribute vec4 animFactors2; // x: scaleMultiplier, y: swirlFactor, z: depthFactor, w: noiseScale

// Varyings
varying vec3 vColorFactor;
varying float vAlpha;
varying vec3 vWorldPosition;
varying float vWaveIntensity;

// DEBUG VARYINGS: Pass calculated values to fragment shader for visualization
varying float vDebugBaseSize;
varying float vDebugScaleMultiplier;
varying float vDebugViewZ;
varying float vDebugPerspectiveScale;
varying float vDebugFinalSize;

// Simplified Perlin-like noise function
float noise(vec3 p) {
  return fract(sin(dot(p, vec3(12.9898, 78.233, 54.53))) * 43758.5453);
}

float smoothNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f); // Smoothstep

  return mix(
    mix(mix(noise(i), noise(i + vec3(1,0,0)), f.x),
        mix(noise(i + vec3(0,1,0)), noise(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(noise(i + vec3(0,0,1)), noise(i + vec3(1,0,1)), f.x),
        mix(noise(i + vec3(0,1,1)), noise(i + vec3(1,1,1)), f.x), f.y), f.z);
}

void main() {
  vec3 workingPosition = position;

  float speed = animFactors1.x;
  float phase = animFactors1.y;
  float randomFactor1 = animFactors1.z;
  float randomAngle = animFactors1.w;
  float scaleMultiplier = animFactors2.x;
  float swirlFactor = animFactors2.y;
  float depthFactor = animFactors2.z;
  float noiseDisplacementScale = animFactors2.w;

  // DEBUG: Store base values for debugging
  vDebugBaseSize = uSize;
  vDebugScaleMultiplier = scaleMultiplier;

  float time = uTime * speed + phase;
  float waveTime = uTime * 0.5 + uWavePhase;
  
  // Large-scale waves (aurora bands)
  float wave1 = sin(workingPosition.x * 0.1 + waveTime) * 0.6;
  float wave2 = sin(workingPosition.x * 0.07 + workingPosition.y * 0.05 + waveTime * 1.3) * 0.4;
  float wave3 = sin(workingPosition.y * 0.08 + waveTime * 0.8) * 0.3;
  
  // Medium-scale undulation
  float wave4 = sin(workingPosition.x * 0.2 + workingPosition.z * 0.15 + waveTime * 2.0) * 0.2;
  float wave5 = sin(workingPosition.y * 0.25 + waveTime * 1.7) * 0.15;

  // Noise-based displacement
  float noiseStrength = 0.3 * noiseDisplacementScale;
  vec3 noiseInput = workingPosition * 0.02 + vec3(waveTime * 0.1, waveTime * 0.08, time * 0.05);
  float perlinNoise = 0.0;
  float perlinNoise2 = 0.0;
  
  // Quality-based noise (Activated by 'defines' from JS)
  #if defined(QUALITY_MEDIUM) || defined(QUALITY_HIGH) || defined(QUALITY_ULTRA)
    perlinNoise = smoothNoise(noiseInput) * 2.0 - 1.0;
    perlinNoise2 = smoothNoise(noiseInput * 2.0 + vec3(1.0)) * 2.0 - 1.0;
    workingPosition.x += perlinNoise * noiseStrength * 0.8;
    workingPosition.y += perlinNoise2 * noiseStrength * 0.6;
  #endif
  #if defined(QUALITY_HIGH) || defined(QUALITY_ULTRA)
    float perlinNoise3 = smoothNoise(noiseInput * 1.5 + vec3(2.0, 0.0, 1.0)) * 2.0 - 1.0;
    workingPosition.z += perlinNoise3 * noiseStrength * 1.0;
  #endif

  vec3 auroraMovement = vec3(
    (wave1 + wave4 + perlinNoise * 0.3) * 0.3,
    (wave2 + wave5 + wave3 + perlinNoise2 * 0.2) * 0.25,
    (wave3 + perlinNoise * 0.15) * 0.15 // Using perlinNoise here as perlinNoise3 might not be defined for lower qualities
  );
  workingPosition += auroraMovement;

  float swirlRadius = 0.4 + randomFactor1 * 0.4;
  workingPosition.x += cos(time + randomAngle) * swirlRadius * swirlFactor;
  workingPosition.z += sin(time + randomAngle) * swirlRadius * swirlFactor;

  // Radial ripples (Using uTime for ripple progression)
  vec3 rippleVector = workingPosition - uRippleCenter;
  float rippleDistance = length(rippleVector.xy); // Consider .xyz if ripple should be 3D
  float rippleEffect = 0.0;
  
  if (uRippleStrength > 0.0 && rippleDistance < 50.0) { // Ripple active radius
    // uRippleTime from JS is just the start time, use uTime for animation
    float currentRippleAnimTime = uTime - uRippleTime; // Time since ripple started
    float rippleWave = sin(rippleDistance * 0.3 - currentRippleAnimTime * 8.0) * exp(-rippleDistance * 0.05 - currentRippleAnimTime * 0.5) * // Ripple decay over time & distance
                       uRippleStrength;
    
    if (rippleDistance > 0.01) { // Avoid normalize(0,0)
      vec2 rippleDirection = normalize(rippleVector.xy);
      workingPosition.xy += rippleDirection * rippleWave * 0.6;
      workingPosition.z += rippleWave * 0.2; // Ripple affects depth too
    }
    rippleEffect = abs(rippleWave) * 0.5; // Modulate effect strength
  }

  workingPosition.z += uScrollProgress * -15.0 * depthFactor;

  vec3 fromCursor = workingPosition - uCursorPos;
  float distToCursor = length(fromCursor);
  float interactionEffect = 0.0;
  if (distToCursor < uCursorRadius && uCursorRadius > 0.0) {
    interactionEffect = smoothstep(uCursorRadius, uCursorRadius * 0.1, distToCursor);
    workingPosition += normalize(fromCursor) * interactionEffect * uRepulsionStrength * (1.0 + randomFactor1);
  }

  vec4 modelPosition = modelMatrix * vec4(workingPosition, 1.0);
  vWorldPosition = modelPosition.xyz;
  vec4 viewPosition = viewMatrix * modelPosition;
  gl_Position = projectionMatrix * viewPosition;

  // DEBUG: Store view Z for debugging
  vDebugViewZ = viewPosition.z;

  // POINT SIZE CALCULATION WITH DEBUG LOGGING
  float pointSize = uSize * scaleMultiplier;
  pointSize *= (1.0 + interactionEffect * 1.5); // Slightly reduced interaction boost for larger base
  pointSize *= (1.0 + rippleEffect * 1.0);   // Slightly reduced ripple boost

  // DEBUG: Track perspective scaling
  float perspectiveScale = 1.0;
  
  #if defined(QUALITY_HIGH) || defined(QUALITY_ULTRA)
   if (viewPosition.z < -0.01) { 
    perspectiveScale = (1.0 + 2.0 / max(-viewPosition.z, 1.0)); // Changed from 3.0 to 10.0
    pointSize *= perspectiveScale;
  }
  #endif

  // DEBUG: Store perspective scale factor
  vDebugPerspectiveScale = perspectiveScale;

  // Apply final clamping
  float finalSize = clamp(pointSize, 1.0, 400.0);
  
  // DEBUG: Store final calculated size
  vDebugFinalSize = finalSize;
  
  gl_PointSize = finalSize;

  vColorFactor = vec3(randomFactor1, speed, phase / (2.0 * 3.14159265));
  vAlpha = clamp(1.0 - interactionEffect * 1.5 + rippleEffect * 0.25, 0.2, 1.0); // MODIFIED: Min alpha to 0.2
  
  vWaveIntensity = (wave1 + wave2 + wave3) * 0.4 + perlinNoise * 0.2 + rippleEffect;
}
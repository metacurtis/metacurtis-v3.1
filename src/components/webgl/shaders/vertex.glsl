// src/components/webgl/shaders/vertex.glsl (Full Functionality - Corrected)

// Uniforms
uniform float uTime;
uniform float uSize;
uniform float uScrollProgress;
uniform vec3 uCursorPos;
uniform float uCursorRadius;
uniform float uRepulsionStrength;

// Attributes (position is auto-provided by Three.js)
// DO NOT REDECLARE: attribute vec3 position; 
attribute vec4 animFactors1;  // x: speed, y: phase, z: randomFactor1, w: randomAngle
attribute vec4 animFactors2;  // x: scaleMultiplier, y: swirlFactor, z: depthFactor, w: noiseScale

// Varyings
varying vec3 vColorFactor;
varying float vAlpha;
varying vec3 vWorldPosition;

// snoise function is assumed to be prepended from noise.glsl
// float snoise(vec3 v); // No need for declaration if noise.glsl is prepended

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

  float time = uTime * speed + phase;

  // Swirling motion
  float swirlRadius = 0.5 + randomFactor1 * 0.5;
  workingPosition.x += cos(time + randomAngle) * swirlRadius * swirlFactor;
  workingPosition.z += sin(time + randomAngle) * swirlRadius * swirlFactor;

  // Noise-based displacement
  float noiseStrength = 0.5 * noiseDisplacementScale;
  #if defined(QUALITY_MEDIUM) || defined(QUALITY_HIGH) || defined(QUALITY_ULTRA)
    vec3 noiseInput = workingPosition * 0.15 + vec3(uTime * speed * 0.1);
    workingPosition.x += snoise(noiseInput + vec3(0.0, 1.0, 2.0)) * noiseStrength;
    workingPosition.y += snoise(noiseInput + vec3(1.0, 2.0, 0.0)) * noiseStrength;
  #endif
  #if defined(QUALITY_HIGH) || defined(QUALITY_ULTRA)
    vec3 noiseInputForZ = workingPosition * 0.15 + vec3(uTime * speed * 0.1);
    workingPosition.z += snoise(noiseInputForZ + vec3(2.0, 0.0, 1.0)) * noiseStrength * 1.5;
  #endif

  // Scroll-based animation
  workingPosition.z += uScrollProgress * -15.0 * depthFactor;

  // Cursor interaction
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

  float pointSize = uSize * scaleMultiplier;
  pointSize *= (1.0 + interactionEffect * 2.5);
  #if defined(QUALITY_HIGH) || defined(QUALITY_ULTRA)
    if (viewPosition.z < -0.01) {
      pointSize *= (2.0 / -viewPosition.z);
    }
  #endif
  gl_PointSize = clamp(pointSize, 1.0, 80.0);

  vColorFactor = vec3(randomFactor1, speed, phase / (2.0 * 3.14159265));
  vAlpha = clamp(1.0 - interactionEffect * 1.8, 0.15, 1.0); 
}

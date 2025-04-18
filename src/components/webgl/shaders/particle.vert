// src/components/webgl/shaders/particle.vert

// Precision is important in RawShaderMaterial
precision mediump float;

// --- UNIFORMS ---
uniform mat4 modelViewMatrix;    // Provided by Three.js
uniform mat4 projectionMatrix;   // Provided by Three.js
uniform float uTime;
uniform float uSize;
// Add interaction uniforms later
// uniform vec3 uCursorPos;
// uniform float uCursorRadius;
// uniform float uRepulsionStrength;

// --- ATTRIBUTES ---
attribute vec3 position;          // Built-in position
attribute vec4 animFactorsVec4; // Custom: xFreq, yFreq, zFreq, phase
attribute float animFactorAmp;  // Custom: amplitude

// Varyings (if needed - not currently)
// varying vec3 vColor;

void main() {
  // --- Time-based Animation Logic ---
  float time = uTime * 0.3;
  float xFreq = animFactorsVec4.x;
  float yFreq = animFactorsVec4.y;
  float zFreq = animFactorsVec4.z;
  float phase = animFactorsVec4.w;
  float amp = animFactorAmp;

  vec3 animatedPos = position; // Start with original position
  animatedPos.x += sin(time * xFreq + phase) * amp;
  animatedPos.y += cos(time * yFreq + phase * 0.5) * amp;
  animatedPos.z += sin(time * zFreq + phase * 0.8) * amp * 0.5;
  // --- End Animation Logic ---

  // TODO: Add cursor repulsion logic here later

  vec4 mvPosition = modelViewMatrix * vec4(animatedPos, 1.0);

  // Point size with attenuation
  gl_PointSize = uSize * (300.0 / -mvPosition.z); // Adjust 300.0 for desired scaling
  gl_Position = projectionMatrix * mvPosition;
}


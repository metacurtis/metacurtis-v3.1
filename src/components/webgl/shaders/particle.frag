// src/components/webgl/shaders/particle.frag

// Precision is important
precision mediump float;

// Uniforms for scroll color interpolation (Add back later)
// uniform float uScrollProgress;
// uniform vec3 uColorA; // Light Magenta
// uniform vec3 uColorB; // Cyan

// Varyings (if needed - not currently)
// varying vec3 vColor;

void main() {
  // Calculate scroll color lerp (Add back later)
  // vec3 finalColor = mix(uColorA, uColorB, uScrollProgress);
  vec3 finalColor = vec3(1.0); // Output white for now

  // Circular point shape with soft edges
  float distanceToCenter = length(gl_PointCoord - vec2(0.5));
  float alpha = 1.0 - smoothstep(0.45, 0.5, distanceToCenter);

  // Discard fully transparent pixels
  if (alpha < 0.01) discard;

  // Set final color and alpha (apply base opacity)
  gl_FragColor = vec4(finalColor, alpha * 0.8);
}


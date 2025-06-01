uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uColorIntensity;
uniform float uTime; // For shimmer

varying vec3 vColorFactor;
varying float vAlpha;
varying vec3 vWorldPosition; // For shimmer

// snoise function is assumed to be prepended from noise.glsl if used by shimmer
// float snoise(vec3 v); 

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  float mask = smoothstep(0.5, 0.45, dist); // Soft circular mask

  if (mask < 0.01) { // Discard fully transparent pixels outside the circle
    discard;
  }

  // Original Color mixing
  vec3 color = mix(uColorA, uColorB, smoothstep(0.0, 1.0, vColorFactor.x));
  color = mix(color, uColorC, smoothstep(0.0, 1.0, vColorFactor.y));

  // Optional: Add shimmer (Uncomment if snoise is available and desired)
  /*
  #if defined(QUALITY_MEDIUM) || defined(QUALITY_HIGH) || defined(QUALITY_ULTRA)
    float timeColorShift = (sin(uTime * 0.5 + vWorldPosition.x * 0.2 + vWorldPosition.y * 0.1) + 1.0) * 0.5;
    vec3 shimmerColor = mix(uColorA * 0.7, uColorC * 1.3, sin(uTime * 2.0 + vColorFactor.z * 5.0) * 0.5 + 0.5); 
    color = mix(color, shimmerColor, timeColorShift * 0.25 * vColorFactor.z);
  #endif
  */

  color *= uColorIntensity;

  gl_FragColor = vec4(color, vAlpha * mask);
}
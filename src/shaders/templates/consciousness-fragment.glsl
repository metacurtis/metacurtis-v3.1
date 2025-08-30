precision mediump float;

// Uniforms
uniform sampler2D uAtlasTexture;
uniform float uTime;
uniform vec3 uColorCurrent;
uniform vec3 uColorNext;
uniform vec3 uColorAccent1;
uniform vec3 uColorAccent2;
uniform float uActiveCount;
uniform float uFadeProgress;
uniform float uGaussianSigma;

// Varyings
varying float vBlend;
varying float vAlpha;
varying vec2 vAtlasUVOffset;
varying float vTierID;
varying float vSizeMultiplier;
varying float vParticleIndex;

float gaussianFalloff(vec2 coord, float sigma) {
  vec2 centered = coord - 0.5;
  float distSq = dot(centered, centered);
  return exp(-distSq * sigma * sigma * 4.0);
}

vec4 sampleAtlas(vec2 uvOffset, vec2 pointCoord) {
  float spriteSize = 0.25; // 4x4 grid
  vec2 uv = uvOffset + pointCoord * spriteSize;
  return texture2D(uAtlasTexture, uv);
}

void main() {
  // Fade particles beyond active count
  if (vParticleIndex >= uActiveCount) {
    discard;
  }
  
  // Sample sprite texture
  vec4 sprite = sampleAtlas(vAtlasUVOffset, gl_PointCoord);
  if (sprite.a < 0.01) discard;
  
  // Mix colors based on scroll progress
  vec3 color = mix(uColorCurrent, uColorNext, vBlend);
  
  // Add tier-based color variation
  if (vTierID > 2.5) {
    color = mix(color, uColorAccent1, 0.3);
  } else if (vTierID > 1.5) {
    color = mix(color, uColorAccent2, 0.2);
  }
  
  // Apply gaussian edge falloff
  float sigma = uGaussianSigma > 0.0 ? uGaussianSigma : 2.5;
  float edgeFade = gaussianFalloff(gl_PointCoord, sigma);
  
  // Final alpha
  float alpha = vAlpha * sprite.a * edgeFade * uFadeProgress;
  
  // Add subtle shimmer
  float shimmer = 1.0 + sin(uTime * 2.0 + vParticleIndex * 0.1) * 0.05;
  color *= shimmer;
  
  gl_FragColor = vec4(color * sprite.rgb, alpha);
}
precision mediump float;

// Uniforms
uniform sampler2D uAtlasTexture;
uniform float uTime;
uniform vec3 uColorCurrent;
uniform vec3 uColorNext;
uniform vec3 uColorAccent1;
uniform vec3 uColorAccent2;
uniform vec3 uPalette0;
uniform vec3 uPalette1;
uniform vec3 uPalette2;
uniform vec3 uPalette3;
uniform float uTierHighlight;
uniform float uActiveCount;
uniform float uFadeProgress;
uniform float uGaussianSigma;
uniform float uBandHeight;
uniform float uBandFade;
uniform bool uForceMono;
uniform vec3 uMonoColor;

// Varyings
varying vec3 vPosition;
varying float vBlend;
varying float vAlpha;
varying vec2 vAtlasUVOffset;
varying float vTierID;
varying float vTier;
varying float vSizeMultiplier;
varying float vParticleIndex;

vec3 getTierColor(int t) {
  if (t == 0) return uPalette0;
  if (t == 1) return uPalette1;
  if (t == 2) return uPalette2;
  return uPalette3;
}

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

  int tierIndex = int(clamp(floor(vTier + 0.5), 0.0, 3.0));

  // Core glow accent for galactic band feel
  float fade = clamp(uBandFade, 0.0, 1.0);
  float distFromBandCenter = abs(vPosition.y);
  float bandHalfHeight = max(0.35, uBandHeight * 0.65);
  float bandCurve = smoothstep(bandHalfHeight, 0.0, distFromBandCenter);
  float coreStrength = pow(bandCurve, 2.0) * fade;
  float haloStrength = (1.0 - smoothstep(0.0, bandHalfHeight * 2.4, distFromBandCenter)) * fade;
  float tierGlowBoost = tierIndex == 3 ? 2.4 : (tierIndex == 2 ? 1.8 : 1.0);
  vec3 glowGradient = mix(vec3(0.0, 0.95, 0.6), vec3(0.0, 1.0, 0.0), coreStrength);
  
  // Base color mix + tier palette influence
  vec3 color = mix(uColorCurrent, uColorNext, vBlend);
  vec3 stageColor = getTierColor(tierIndex);
  color = mix(color, stageColor, 0.35);
  if (tierIndex == 3) {
    color = mix(color, uColorAccent1, 0.25);
  } else if (tierIndex == 2) {
    color = mix(color, uColorAccent2, 0.2);
  }
  
  // Apply gaussian edge falloff
  float sigma = uGaussianSigma > 0.0 ? uGaussianSigma : 2.5;
  float edgeFade = gaussianFalloff(gl_PointCoord, sigma);

  // Add subtle shimmer and additive core glow
  float shimmer = 1.0 + sin(uTime * 2.0 + vParticleIndex * 0.1) * 0.05;
  float twinkle = 1.0 + sin(uTime * 5.0 + vParticleIndex * 0.03) * 0.03;
  vec3 finalColor = color * sprite.rgb * shimmer * twinkle;
  vec3 haloTint = vec3(0.0, 0.7, 0.4);
  vec3 ambientGlow = vec3(0.0, 0.25, 0.12) * clamp(1.0 - bandCurve, 0.0, 1.0) * fade;
  finalColor += glowGradient * (coreStrength * tierGlowBoost * 0.5);
  finalColor += haloTint * (haloStrength * 0.25);
  finalColor += ambientGlow;

  if (uForceMono) {
    finalColor = uMonoColor;
  }

  // Slightly elevate starfield opacity for Tier 0
  float tierOpacityBoost = tierIndex == 0 ? 1.6 : (tierIndex == 1 ? 1.1 : 1.0);
  float baseOpacity = vAlpha * tierOpacityBoost;
  float alpha = baseOpacity * sprite.a * edgeFade * uFadeProgress;

  if (abs(uTierHighlight - float(tierIndex)) < 0.5) {
    finalColor *= 1.2;
    alpha *= 1.1;
  }

  gl_FragColor = vec4(finalColor, alpha);
}

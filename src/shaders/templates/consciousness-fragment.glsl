


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
uniform float uQrPhotoMode;
uniform float uMorphProgress;
uniform float uOpacityMin;
uniform float uOpacityMax;
uniform float uCenterWeighting;
uniform float uDepthFalloffPower;

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

  // QR PHOTO MODE — bypass atlas/bokeh for flat, square modules
  if (uQrPhotoMode > 0.5) {
    // Keep a hard square footprint per point (no glow/blur).
    float edge = 0.08;
    float maskX = step(edge, gl_PointCoord.x) * step(gl_PointCoord.x, 1.0 - edge);
    float maskY = step(edge, gl_PointCoord.y) * step(gl_PointCoord.y, 1.0 - edge);
    float coverage = clamp(maskX * maskY, 0.0, 1.0);

    vec3 onColor = vec3(1.0);   // module (bright)
    vec3 offColor = vec3(0.0);  // background
    vec3 baseColor = mix(offColor, onColor, coverage);
    gl_FragColor = vec4(baseColor, 1.0);
    return;
  }

  // Sample sprite texture (non-QR path)
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
  float tierGlowBoost = tierIndex == 3 ? 2.1 : (tierIndex == 2 ? 1.55 : 1.08);
  vec3 glowGradient = mix(vec3(0.18, 0.1, 0.54), vec3(0.84, 0.68, 1.0), coreStrength);
  
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

  float morphClamped = clamp(uMorphProgress, 0.0, 1.0);
  float subjectWeight = tierIndex == 3 ? 1.0 : (tierIndex == 2 ? 0.72 : (tierIndex == 1 ? 0.34 : 0.18));
  float fieldWeight = 1.0 - subjectWeight;
  float centerRadius = length(vPosition.xy);
  float centerPower = max(0.9, uCenterWeighting * 1.15);
  float centerFocus = 1.0 / (1.0 + pow(centerRadius * 0.11, centerPower));
  centerFocus = clamp(centerFocus, 0.0, 1.0);
  float depthPower = max(0.8, uDepthFalloffPower * 0.9);
  float depthFocus = 1.0 / (1.0 + pow(abs(vPosition.z) * 0.18, depthPower));
  depthFocus = clamp(depthFocus, 0.0, 1.0);
  float authorityRise = smoothstep(0.38, 1.0, morphClamped);
  float earlyFieldSuppression = 1.0 - smoothstep(0.24, 0.78, morphClamped);

  // Keep motion present but restrained so the word remains authoritative.
  float shimmerAmp = mix(0.01, 0.022, subjectWeight);
  float twinkleAmp = shimmerAmp * 0.45;
  float shimmer = 1.0 + sin(uTime * 2.0 + vParticleIndex * 0.1) * shimmerAmp;
  float twinkle = 1.0 + sin(uTime * 5.0 + vParticleIndex * 0.03) * twinkleAmp;
  vec3 finalColor = color * sprite.rgb * shimmer * twinkle;
  vec3 haloTint = vec3(0.36, 0.28, 0.88);
  vec3 ambientGlow = vec3(0.13, 0.08, 0.3) * clamp(1.0 - bandCurve, 0.0, 1.0) * fade;
  finalColor += glowGradient * (coreStrength * tierGlowBoost * (0.22 + subjectWeight * 0.22));
  finalColor += haloTint * (haloStrength * 0.14 * (0.58 + centerFocus * 0.42));
  finalColor += ambientGlow * (0.54 + fieldWeight * 0.28);

  // Give the center hierarchy and let the field yield to the word.
  float fieldColorSubordination = 1.0 - fieldWeight * (0.18 + centerFocus * 0.22 + earlyFieldSuppression * 0.08);
  fieldColorSubordination = clamp(fieldColorSubordination, 0.52, 1.0);
  float fieldAlphaSubordination = 1.0 - fieldWeight * (0.1 + centerFocus * 0.14 + earlyFieldSuppression * 0.05);
  fieldAlphaSubordination = clamp(fieldAlphaSubordination, 0.64, 1.0);
  float subjectLift = 1.0 + subjectWeight * (0.12 + centerFocus * 0.12 + authorityRise * 0.08);
  vec3 crispHighlight = mix(uColorAccent2, vec3(0.9, 0.82, 1.0), 0.42);
  float clarityLift = subjectWeight * (0.14 + centerFocus * 0.22) * authorityRise;
  finalColor = mix(finalColor, crispHighlight * sprite.rgb, clarityLift);
  finalColor *= mix(fieldColorSubordination, subjectLift, subjectWeight);
  finalColor *= mix(0.78, 1.0, depthFocus * (0.7 + subjectWeight * 0.3));

  float opacityMin = clamp(min(uOpacityMin, uOpacityMax), 0.0, 1.0);
  float opacityMax = clamp(max(uOpacityMin, uOpacityMax), opacityMin, 1.0);
  float baseOpacity = clamp(vAlpha, 0.0, 1.0);
  float controlledOpacity = mix(baseOpacity, mix(opacityMin, opacityMax, baseOpacity), 0.52);
  float tierOpacityBoost = tierIndex == 0 ? 1.1 : (tierIndex == 1 ? 0.96 : (tierIndex == 2 ? 1.0 : 1.08));
  float alpha = controlledOpacity * tierOpacityBoost * sprite.a * edgeFade * uFadeProgress;
  alpha *= mix(fieldAlphaSubordination, subjectLift, subjectWeight);
  alpha *= mix(0.78, 1.0, depthFocus);
  alpha *= 1.0 + authorityRise * subjectWeight * 0.08;
  alpha = clamp(alpha, 0.0, 1.0);

  if (abs(uTierHighlight - float(tierIndex)) < 0.5) {
    finalColor *= 1.2;
    alpha *= 1.1;
  }

  gl_FragColor = vec4(finalColor, alpha);
}

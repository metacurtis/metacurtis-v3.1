


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
uniform float uOpacityMin;
uniform float uOpacityMax;
uniform vec2 uResolution;
uniform float uMorphProgress;
uniform float uPointerActive;
uniform float uPointerIntensity;
uniform vec2 uPointerNdc;

// Varyings
varying vec3 vPosition;
varying float vBlend;
varying float vAlpha;
varying vec2 vAtlasUVOffset;
varying float vTierID;
varying float vTier;
varying float vSizeMultiplier;
varying float vParticleIndex;
varying float vGlyphInfluence;
varying float vFormWeight;

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

float pointerMask(vec2 fragCoord, vec2 resolution, vec2 pointerNdc, float innerRadius, float outerRadius) {
  vec2 safeResolution = max(resolution, vec2(1.0));
  vec2 fragUv = fragCoord / safeResolution;
  vec2 pointerUv = pointerNdc * 0.5 + 0.5;
  vec2 delta = fragUv - pointerUv;
  delta.x *= safeResolution.x / safeResolution.y;
  float dist = length(delta);
  return 1.0 - smoothstep(innerRadius, outerRadius, dist);
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
  float tierGlowBoostBase = tierIndex == 3 ? 2.4 : (tierIndex == 2 ? 1.8 : 1.0);
  vec3 glowGradient = mix(vec3(0.12, 0.35, 0.46), vec3(0.28, 0.57, 0.74), coreStrength);
  
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
  float glyphPresence = clamp(vGlyphInfluence, 0.0, 1.0);
  float carrierWeight = clamp(vFormWeight, 0.0, 1.0);
  float coherence = smoothstep(0.78, 1.0, uMorphProgress);
  float preResolveAtmosphere = 1.0 - smoothstep(0.58, 0.96, uMorphProgress);
  float resolveCoolLift = smoothstep(0.72, 1.0, uMorphProgress);
  float formPresence = glyphPresence * carrierWeight * coherence;
  float mistCoherence = glyphPresence * (1.0 - carrierWeight) * coherence;
  float tierAuthority = smoothstep(1.0, 3.0, float(tierIndex)) * mix(1.0, 0.28, mistCoherence);
  float resolvedWeight = max(formPresence, tierAuthority);
  float mistWeight = clamp((1.0 - resolvedWeight) * (1.0 - 0.35 * coreStrength), 0.0, 1.0);
  float spriteLight = dot(sprite.rgb, vec3(0.299, 0.587, 0.114));
  float mistRegionMask = mistWeight * mix(0.42, 1.0, glyphPresence * (1.0 - carrierWeight));
  float mistWaveA = sin(vPosition.x * 0.021 + vPosition.y * 0.015 + uTime * 0.23);
  float mistWaveB = cos(vPosition.y * 0.018 - vPosition.z * 0.012 + uTime * 0.17);
  float mistWaveC = sin((vPosition.x - vPosition.z) * 0.014 + uTime * 0.11);
  float mistTemporalContrast =
    1.0
    + (
      mistWaveA * 0.034 +
      mistWaveB * 0.022 +
      mistWaveC * 0.016
    ) * mistRegionMask;
  float mistBandDensity =
    1.0
    + (
      bandCurve - 0.42
    ) * 0.16 * mistRegionMask;
  float mistShape = mix(sprite.a, edgeFade, 0.8);
  float spritePresence = mix(spriteLight, mistShape, mistWeight * 0.88);
  spritePresence = min(1.0, spritePresence + mistCoherence * 0.07 * (0.6 + 0.4 * mistWeight));

  // Keep low tiers reading as field density while resolved structure retains more detail.
  float shimmer = 1.0 + sin(uTime * 2.0 + vParticleIndex * 0.1) * mix(0.014, 0.05, resolvedWeight);
  float twinkle = 1.0 + sin(uTime * 5.0 + vParticleIndex * 0.03) * mix(0.008, 0.03, resolvedWeight);
  vec3 finalColor = color * spritePresence * shimmer * twinkle;
  float tierGlowBoost = tierGlowBoostBase * mix(1.0, 0.55, mistCoherence);
  vec3 haloTint = vec3(0.08, 0.24, 0.31);
  float mistBandReadability =
    mix(0.76, 1.14, bandCurve)
    * mix(1.08, 0.97, coherence)
    * mistBandDensity
    * mistTemporalContrast;
  vec3 ambientGlow =
    vec3(0.032, 0.118, 0.158)
    * clamp(1.0 - bandCurve, 0.0, 1.0)
    * fade
    * mix(1.2, 0.96, coherence);
  vec3 coherenceTint = mix(stageColor, vec3(0.86, 0.9, 0.94), mix(0.1, 0.15, resolveCoolLift));
  vec3 mistFamilyTint = mix(color, coherenceTint, 0.4);
  vec3 formAuthorityTint = mix(mistFamilyTint, vec3(0.86, 0.89, 0.94), 0.2 + 0.08 * resolveCoolLift);
  float carrierGlowTrim = mix(1.0, 0.5, formPresence);
  float carrierAmbientTrim = mix(1.0, 0.74, formPresence);
  float fieldMistLift =
    mistWeight
    * fade
    * mix(0.044, 0.024, coherence)
    * (0.78 + 0.22 * spritePresence)
    * mistBandReadability;
  finalColor += glowGradient * (coreStrength * tierGlowBoost * 0.5 * carrierGlowTrim);
  finalColor += haloTint * (haloStrength * 0.25 * carrierGlowTrim);
  finalColor += ambientGlow * carrierAmbientTrim;
  finalColor += mistFamilyTint * (fieldMistLift * (0.66 + 0.34 * preResolveAtmosphere));
  finalColor += coherenceTint * (
    mistCoherence
    * mix(0.047, 0.037, resolveCoolLift)
    * mistWeight
    * mix(0.84, 1.02, bandCurve)
    * mistTemporalContrast
  );
  finalColor = mix(finalColor, max(finalColor, formAuthorityTint * (0.76 + 0.16 * spritePresence)), formPresence * 0.32);

  float pointerPresence = clamp(uPointerActive * uPointerIntensity, 0.0, 1.0);
  float pointerAlphaLift = 0.0;
  if (pointerPresence > 0.0) {
    float pointerCore = pointerMask(gl_FragCoord.xy, uResolution, uPointerNdc, 0.0, 0.11);
    float pointerField = pointerMask(gl_FragCoord.xy, uResolution, uPointerNdc, 0.0, 0.26);
    float pointerMist = pointerMask(gl_FragCoord.xy, uResolution, uPointerNdc, 0.0, 0.38);
    float pointerHalo = max(pointerField - pointerCore * 0.78, 0.0);
    float pointerAura = max(pointerMist - pointerField * 0.72, 0.0);
    float tierAtmosphereWeight = tierIndex == 0 ? 1.0 : (tierIndex == 1 ? 0.9 : (tierIndex == 2 ? 0.72 : 0.52));
    float subjectShield = smoothstep(0.18, 0.9, coreStrength);
    float formShield = smoothstep(0.08, 0.82, max(subjectShield, formPresence));
    float calmWeight = formPresence * (pointerField * 0.55 + pointerAura * 0.3);
    float atmosphereWeight = tierAtmosphereWeight * (1.0 - 0.34 * subjectShield) * (1.0 - 0.48 * calmWeight);
    float morphWeight = mix(0.72, 1.0, smoothstep(0.45, 1.0, uMorphProgress));
    vec3 pointerTint = mix(color, uColorAccent1, 0.18);
    pointerTint = mix(pointerTint, uColorAccent2, 0.1);
    pointerTint = mix(pointerTint, vec3(1.0), 0.04 + formPresence * 0.06);
    vec3 mistTint = mix(pointerTint, color, 0.52);
    vec3 pointerAtmosphere = mistTint * (pointerCore * 0.055 + pointerHalo * 0.032 + pointerAura * 0.018);
    vec3 pointerEmanation = mistTint * pow(pointerAura, 2.0) * 0.01;
    vec3 formAuthority = pointerTint * formPresence * formShield * (pointerCore * 0.12 + pointerHalo * 0.03);
    float formDepth = pointerPresence * formPresence * (pointerHalo * 0.035 + pointerAura * 0.012);
    finalColor *= 1.0 - formDepth;
    finalColor += (pointerAtmosphere + pointerEmanation) * pointerPresence * atmosphereWeight * morphWeight;
    finalColor += formAuthority * pointerPresence * morphWeight;
    pointerAlphaLift =
      pointerPresence * morphWeight * (
        (pointerCore * 0.08 + pointerHalo * 0.03 + pointerAura * 0.015) * atmosphereWeight * (1.0 - 0.35 * formPresence) +
        formPresence * formShield * pointerCore * 0.04
      );
  }

  // Keep atmospheric tiers softer while preserving resolved structure headroom.
  float opacityMin = clamp(min(uOpacityMin, uOpacityMax), 0.0, 1.0);
  float opacityMax = clamp(max(uOpacityMin, uOpacityMax), opacityMin, 1.0);
  float opacityControlActive = 1.0 - step(0.49, opacityMax);
  float tierOpacityBoost = tierIndex == 0 ? 0.58 : (tierIndex == 1 ? 0.76 : (tierIndex == 2 ? 0.96 : 1.04));
  float baseOpacity = clamp(vAlpha * tierOpacityBoost, 0.0, 1.0);
  float controlledOpacity = mix(opacityMin, opacityMax, baseOpacity);
  float formOpacityCeiling = min(1.0, opacityMax * 2.25 + 0.03);
  float formOpacity = min(baseOpacity, max(controlledOpacity, formOpacityCeiling));
  float resolvedOpacity = mix(baseOpacity, controlledOpacity, opacityControlActive);
  resolvedOpacity = mix(resolvedOpacity, formOpacity, formPresence * opacityControlActive);
  float alphaShape = mix(sprite.a * edgeFade, mistShape, mistWeight * 0.88);
  float formEdgeShape = sprite.a * mix(edgeFade, edgeFade * edgeFade, 0.34);
  alphaShape = mix(alphaShape, formEdgeShape, formPresence * 0.72);
  float alpha = resolvedOpacity * alphaShape * uFadeProgress;
  alpha *= 1.0 + pointerAlphaLift;
  alpha *= 1.0 + formPresence * 0.06;
  alpha *= 1.0 + mistCoherence * 0.03 * mistWeight;

  if (abs(uTierHighlight - float(tierIndex)) < 0.5) {
    finalColor *= 1.2;
    alpha *= 1.1;
  }

  gl_FragColor = vec4(finalColor, alpha);
}

precision mediump float;

// ✅ SST v2.0 UNIFORMS - Enhanced with tier support
uniform sampler2D uAtlasTexture;
uniform float uTime;
uniform vec3 uColorCurrent;
uniform vec3 uColorNext;

// ✅ NEW: Tier fade uniforms
uniform float uTierCutoff;
uniform float uFadeProgress;

// ✅ SST v2.0 VARYINGS - Enhanced tier system
varying float vBlend;
varying float vAlpha;
varying vec2 vAtlasUVOffset;
varying float vTierID;
varying float vSizeMultiplier;

// ✅ NEW: Receive particle index from vertex shader
varying float vParticleIndex;

// ✅ PROFESSIONAL GAUSSIAN FALLOFF
float gaussianFalloff(vec2 coord, float sigma) {
  vec2 center = coord - 0.5;
  float distance = length(center);
  return exp(-pow(distance * sigma, 2.0));
}

// ✅ HSV COLOR SYSTEM - Enhanced vibrancy
vec3 rgb2hsv(vec3 rgb) {
  float maxVal = max(rgb.r, max(rgb.g, rgb.b));
  float minVal = min(rgb.r, min(rgb.g, rgb.b));
  float delta = maxVal - minVal;
  
  float hue = 0.0;
  if (delta > 0.0) {
    if (maxVal == rgb.r) hue = mod((rgb.g - rgb.b) / delta, 6.0);
    else if (maxVal == rgb.g) hue = (rgb.b - rgb.r) / delta + 2.0;
    else hue = (rgb.r - rgb.g) / delta + 4.0;
  }
  
  float saturation = maxVal > 0.0 ? delta / maxVal : 0.0;
  return vec3(hue / 6.0, saturation, maxVal);
}

vec3 hsv2rgb(vec3 hsv) {
  vec3 rgb = clamp(abs(mod(hsv.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return hsv.z * mix(vec3(1.0), rgb, hsv.y);
}

// ✅ ATLAS TEXTURE SAMPLING
vec4 sampleAtlasTexture(vec2 uvOffset, vec2 pointCoord) {
  float spriteSize = 0.25;
  vec2 atlasUV = uvOffset + pointCoord * spriteSize;
  return texture2D(uAtlasTexture, atlasUV);
}

// ✅ TIER-SPECIFIC SHIMMER
float generateShimmer(vec2 coord, float time, float tier) {
  if (tier < 1.5) {
    // Tier 1: Very subtle shimmer
    return 1.0 + sin(coord.x * 4.0 + time * 1.0) * 0.03;
  } else if (tier < 2.5) {
    // Tier 2: Minimal shimmer
    return 1.0 + sin(coord.y * 3.0 + time * 0.8) * 0.04;
  } else if (tier < 3.5) {
    // Tier 3: Twinkling shimmer
    float shimmer1 = sin(coord.x * 8.0 + time * 2.0) * 0.08;
    float shimmer2 = cos(coord.y * 6.0 + time * 1.5) * 0.06;
    return 1.0 + shimmer1 + shimmer2;
  } else {
    // Tier 4: Prominent shimmer
    float shimmer1 = sin(coord.x * 10.0 + time * 1.8) * 0.1;
    float shimmer2 = cos(coord.y * 8.0 + time * 1.4) * 0.08;
    float radialShimmer = sin(length(coord - 0.5) * 15.0 + time * 2.5) * 0.05;
    return 1.0 + shimmer1 + shimmer2 + radialShimmer;
  }
}

void main() {
  vec2 particleCoord = gl_PointCoord;
  
  // ✅ FIX: Debug mode for testing
  #ifdef DEBUG_PARTICLES
    gl_FragColor = vec4(1.0, 0.1, 0.9, 1.0);
    return;
  #endif
  
  // ✅ NEW: Calculate tier-based fade using vParticleIndex instead of gl_VertexID
  float tierFade = 1.0;
  
  // Smooth fade for particles beyond cutoff
  if (vParticleIndex >= uTierCutoff) {
    float fadeDistance = vParticleIndex - uTierCutoff;
    float fadeRange = 1000.0; // Fade over 1000 particles
    tierFade = 1.0 - smoothstep(0.0, fadeRange, fadeDistance);
    tierFade *= uFadeProgress;
  }
  
  // Early discard for fully faded particles
  if (tierFade < 0.001) discard;
  
  // Sample atlas texture
  vec4 atlasColor = sampleAtlasTexture(vAtlasUVOffset, particleCoord);
  
  if (atlasColor.a < 0.001) discard;
  
  // ✅ COLOR INTERPOLATION with tier enhancement
  vec3 currentHSV = rgb2hsv(uColorCurrent);
  vec3 nextHSV = rgb2hsv(uColorNext);
  
  // Tier-based saturation boost
  float saturationBoost = 1.0;
  if (vTierID > 3.5) {
    saturationBoost = 1.2; // Tier 4: More vibrant
  } else if (vTierID > 2.5) {
    saturationBoost = 1.1; // Tier 3: Slightly vibrant
  }
  
  vec3 blendedHSV = vec3(
    mix(currentHSV.x, nextHSV.x, vBlend),
    min(1.0, mix(currentHSV.y, nextHSV.y, vBlend) * saturationBoost),
    mix(currentHSV.z, nextHSV.z, vBlend)
  );
  
  vec3 vibrantColor = hsv2rgb(blendedHSV);
  
  // Combine with atlas texture
  vec3 finalColor = mix(vibrantColor, vibrantColor * atlasColor.rgb, 0.6);
  
  // Apply tier fade to alpha
  float finalAlpha = vAlpha * atlasColor.a * tierFade;
  
  // ✅ ENHANCED: Tier-specific shimmer
  float shimmer = generateShimmer(particleCoord, uTime, vTierID);
  finalColor *= shimmer;
  
  // ✅ PROFESSIONAL GAUSSIAN FALLOFF
  float gaussianSigma = 2.5;
  if (vTierID < 1.5) {
    gaussianSigma = 3.0; // Softer edges for atmospheric dust
  } else if (vTierID > 3.5) {
    gaussianSigma = 2.0; // Sharper edges for constellation points
  }
  
  float edgeFalloff = gaussianFalloff(particleCoord, gaussianSigma);
  finalAlpha *= edgeFalloff;
  
  // ✅ Subtle breathing pulse
  float pulseSpeed = vTierID > 3.5 ? 0.8 : 1.2;
  float pulse = 1.0 + 0.05 * sin(uTime * pulseSpeed);
  finalColor *= pulse;
  
  gl_FragColor = vec4(finalColor, finalAlpha);
}
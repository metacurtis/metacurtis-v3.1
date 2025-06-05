// src/components/webgl/shaders/fragment.glsl - ENHANCED CONTRAST & SHIMMER

uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uColorIntensity;
uniform float uTime;
uniform float uWavePhase;

varying vec3 vColorFactor;
varying float vAlpha;
varying vec3 vWorldPosition;
varying float vWaveIntensity;

// DEBUG VARYINGS
varying float vDebugBaseSize;
varying float vDebugScaleMultiplier;
varying float vDebugViewZ;
varying float vDebugPerspectiveScale;
varying float vDebugFinalSize;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  
  // ENHANCED: Better core/halo contrast
  float coreSize = 0.12; // Slightly smaller core for sharper contrast
  float haloSize = 0.55; // Larger halo for more glow
  
  float coreMask = smoothstep(coreSize + 0.08, coreSize, dist); // Sharper core falloff
  float haloMask = smoothstep(haloSize, haloSize * 0.1, dist);  // Softer halo with more range
  
  float mask = max(coreMask, haloMask * 0.5); // Stronger halo contribution
  
  if (mask < 0.003) { // Stricter discard for cleaner edges
    discard;
  }

  float waveTime = uTime * 0.15 + uWavePhase; // MUCH SLOWER: For longer-lasting color changes
  
  // DARKER, MORE COMPLETE: Enhanced base colors with deeper saturation
  vec3 baseColor = mix(uColorA * 0.7, uColorB * 0.6, smoothstep(0.0, 1.0, vColorFactor.x)); // Darker, richer base
  baseColor = mix(baseColor, uColorC * 0.65, smoothstep(0.0, 1.0, vColorFactor.y)); // Deeper highlights
  
  // LONGER-LASTING: Much slower color phase changes for extended color regions
  float colorPhase1 = sin(vWorldPosition.x * 0.04 + vWorldPosition.y * 0.03 + waveTime * 0.4) * 0.5 + 0.5; // Much slower
  float colorPhase2 = sin(vWorldPosition.x * 0.035 + waveTime * 0.6 + 1.57) * 0.5 + 0.5;                    // Slower transitions
  float colorPhase3 = sin(vWorldPosition.y * 0.038 + waveTime * 0.5 + 3.14) * 0.5 + 0.5;                   // Extended phases
  
  // DARKER, MORE SATURATED: Enhanced wave colors with deeper blues and cyans
  vec3 waveColorA = mix(uColorA * 0.8, uColorB * 0.7, colorPhase1); // Deeper colors
  vec3 waveColorB = mix(uColorB * 0.75, uColorC * 0.9, colorPhase2); // Richer saturation
  vec3 waveColorC = mix(uColorA * 0.85, uColorC * 0.8, colorPhase3); // More complete color range
  
  // PHASE 2A: Enhanced color response to ripples
  vec3 coreEffectColor = baseColor;
  coreEffectColor = mix(coreEffectColor, waveColorA, vWaveIntensity * 0.5); // STRONGER ripple color response
  coreEffectColor = mix(coreEffectColor, waveColorB, colorPhase2 * 0.3);   
  
  vec3 haloEffectColor = baseColor * 0.75; 
  haloEffectColor = mix(haloEffectColor, waveColorC, vWaveIntensity * 0.55);  // ENHANCED ripple halo
  haloEffectColor = mix(haloEffectColor, waveColorA, colorPhase1 * 0.35);     
  
  vec3 finalColor = mix(haloEffectColor, coreEffectColor, coreMask);

  // PHASE 2A: Ripple-responsive shimmer enhancement
  float rippleBoost = clamp(vWaveIntensity * 0.3, 0.0, 0.5); // Ripples boost shimmer
  
  // Enhanced shimmer with ripple interaction
  float scatterShimmer = sin(waveTime * 0.8 + vWorldPosition.x * 0.15 + vWorldPosition.y * 0.12 + rippleBoost * 10.0) * 0.5 + 0.5;
  float timeColorShift = (sin(waveTime * 0.6 + vWorldPosition.x * 0.12 + vWorldPosition.y * 0.1 + rippleBoost * 8.0) + 1.0) * 0.5;
  
  // Enhanced shimmer colors with ripple amplification
  vec3 shimmerColor = mix(uColorA * (1.0 + rippleBoost), uColorC * (1.2 + rippleBoost), scatterShimmer);
  
  // Ripple-enhanced shimmer impact
  finalColor = mix(finalColor, shimmerColor, (timeColorShift + rippleBoost) * 0.5 * vColorFactor.z * haloMask * (0.4 + coreMask * 0.5));

  // LONGER-LASTING: Slower breathing and flicker for sustained color regions
  float auroraIntensityBreath = 1.0 + sin(vWorldPosition.x * 0.03 + vWorldPosition.y * 0.025 + waveTime * 0.4) * 0.35; // Much slower breath
  float volumetricFlicker = 0.8 + 0.2 * sin(waveTime * 1.5 + vColorFactor.z * 6.0 + vWorldPosition.x * 0.08); // Slower flicker
  
  // ENHANCED: Balanced intensity for rich color presentation
  finalColor *= (volumetricFlicker * 1.15) * auroraIntensityBreath * uColorIntensity; // Balanced for color richness

  // SOFTER: Gentle bloom for natural glow
  float bloomBoostFactor = coreMask * 0.3 + haloMask * 0.2; // Gentler bloom
  finalColor *= (1.0 + bloomBoostFactor);
  
  float volumetricAlpha = vAlpha * mask;
  volumetricAlpha *= (1.0 + coreMask * 0.4); // Slightly more opaque core
  volumetricAlpha = clamp(volumetricAlpha, 0.0, 1.0);

  gl_FragColor = vec4(finalColor, volumetricAlpha);
}
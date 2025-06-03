// src/components/webgl/shaders/fragment.glsl - DEBUG VERSION

uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uColorIntensity;
uniform float uTime;
uniform float uWavePhase; // Already passed from JS

varying vec3 vColorFactor;
varying float vAlpha;
varying vec3 vWorldPosition;
varying float vWaveIntensity;

// DEBUG VARYINGS: Receive debug values from vertex shader
varying float vDebugBaseSize;
varying float vDebugScaleMultiplier;
varying float vDebugViewZ;
varying float vDebugPerspectiveScale;
varying float vDebugFinalSize;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  
  float coreSize = 0.15; // MODIFIED: Slightly smaller core for more halo
  float haloSize = 0.5; 
  
  float coreMask = smoothstep(coreSize + 0.05, coreSize, dist); // MODIFIED: Sharper core falloff
  float haloMask = smoothstep(haloSize, haloSize * 0.15, dist); // MODIFIED: Softer halo falloff
  
  float mask = max(coreMask, haloMask * 0.4); // MODIFIED: Halo contributes more to base mask
  
  if (mask < 0.005) { // MODIFIED: Stricter discard
    discard;
  }

  float waveTime = uTime * 0.3 + uWavePhase; 
  
  vec3 baseColor = mix(uColorA, uColorB, smoothstep(0.0, 1.0, vColorFactor.x));
  baseColor = mix(baseColor, uColorC, smoothstep(0.0, 1.0, vColorFactor.y));
  
  float colorPhase1 = sin(vWorldPosition.x * 0.1 + vWorldPosition.y * 0.06 + waveTime) * 0.5 + 0.5;
  float colorPhase2 = sin(vWorldPosition.x * 0.08 + waveTime * 1.5 + 1.57) * 0.5 + 0.5;
  float colorPhase3 = sin(vWorldPosition.y * 0.09 + waveTime * 1.1 + 3.14) * 0.5 + 0.5;
  
  vec3 waveColorA = mix(uColorA * 1.15, uColorB * 1.05, colorPhase1); // MODIFIED: Slightly brighter wave colors
  vec3 waveColorB = mix(uColorB * 1.05, uColorC * 1.25, colorPhase2);
  vec3 waveColorC = mix(uColorA * 1.2, uColorC * 1.05, colorPhase3);
  
  vec3 coreEffectColor = baseColor;
  coreEffectColor = mix(coreEffectColor, waveColorA, vWaveIntensity * 0.25); // MODIFIED: Stronger wave mix
  coreEffectColor = mix(coreEffectColor, waveColorB, colorPhase2 * 0.15);
  
  vec3 haloEffectColor = baseColor * 0.75; // MODIFIED: Halo base color slightly darker
  haloEffectColor = mix(haloEffectColor, waveColorC, vWaveIntensity * 0.3);  // MODIFIED: Stronger wave mix
  haloEffectColor = mix(haloEffectColor, waveColorA, colorPhase1 * 0.2);
  
  vec3 finalColor = mix(haloEffectColor, coreEffectColor, coreMask);

  // Volumetric shimmer for god-ray scattering
  float scatterShimmer = sin(waveTime * 1.2 + vWorldPosition.x * 0.28 + vWorldPosition.y * 0.17) * 0.5 + 0.5; // MODIFIED: Slightly adjusted shimmer params
  float timeColorShift = (sin(waveTime * 0.9 + vWorldPosition.x * 0.22 + vWorldPosition.y * 0.14) + 1.0) * 0.5;
  
  vec3 shimmerColor = mix(uColorA * 1.4, uColorC * 1.5, scatterShimmer); // MODIFIED: Brighter shimmer base colors
  // MODIFIED: Significantly increased shimmer impact. Tweak this 0.45 value as needed.
  finalColor = mix(finalColor, shimmerColor, timeColorShift * 0.45 * vColorFactor.z * haloMask * (0.5 + coreMask * 0.5) );

  float auroraIntensityBreath = 1.0 + sin(vWorldPosition.x * 0.05 + vWorldPosition.y * 0.04 + waveTime * 0.7) * 0.35; // MODIFIED: Stronger breath
  float volumetricFlicker = 0.8 + 0.2 * sin(waveTime * 2.5 + vColorFactor.z * 8.0 + vWorldPosition.x * 0.12); // MODIFIED: Stronger flicker
  
  finalColor *= (volumetricFlicker * 1.2) * auroraIntensityBreath * uColorIntensity; // MODIFIED: Boosted overall dynamic intensity

  float bloomBoostFactor = coreMask * 0.45 + haloMask * 0.2; // MODIFIED: Stronger bloom boost
  finalColor *= (1.0 + bloomBoostFactor);
  
  float volumetricAlpha = vAlpha * mask;
  volumetricAlpha *= (1.0 + coreMask * 0.3); // MODIFIED: Core slightly more opaque
  volumetricAlpha = clamp(volumetricAlpha, 0.0, 1.0); // Ensure alpha is clamped

  // DEBUG MODE: Visualize size calculation values
  // Uncomment ONE of these debug modes to visualize different aspects:
  
  // DEBUG MODE 1: Show final calculated size as brightness
  //  float debugBrightness = vDebugFinalSize / 50.0; // Normalize to visible range
  //  finalColor = vec3(debugBrightness, debugBrightness, debugBrightness);
  
  // DEBUG MODE 2: Show perspective scale factor as color
  // float perspectiveNorm = clamp(vDebugPerspectiveScale / 10.0, 0.0, 1.0);
  // finalColor = vec3(perspectiveNorm, 0.0, 1.0 - perspectiveNorm); // Blue = low scale, Red = high scale
  
  // DEBUG MODE 3: Show view Z depth as color
  // float depthNorm = clamp((-vDebugViewZ) / 50.0, 0.0, 1.0);
  // finalColor = vec3(0.0, depthNorm, 1.0 - depthNorm); // Green = close, Blue = far
  
  // DEBUG MODE 4: Show base size uniform as color
  // float baseNorm = vDebugBaseSize / 20.0;
  // finalColor = vec3(baseNorm, baseNorm, 0.0); // Yellow intensity = base size
  
  // DEBUG MODE 5: Show scale multiplier as color
  // finalColor = vec3(vDebugScaleMultiplier, 0.0, vDebugScaleMultiplier); // Purple intensity = scale multiplier

  gl_FragColor = vec4(finalColor, volumetricAlpha);
}
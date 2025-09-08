precision mediump float;

// ✅ NEW: Add particle index attribute for WebGL 1 compatibility
attribute float particleIndex;

// ✅ SST v2.0 UNIFORMS - Enhanced with tier support
uniform float uTime;
uniform float uStageProgress;
uniform float uPointSize;
uniform vec3 uColorCurrent;
uniform vec3 uColorNext;
uniform float uStageBlend;
uniform float uTotalSprites;
uniform float uFadeNear;
uniform float uFadeFar;
uniform float uDevicePixelRatio;
uniform vec2 uResolution;

// ✅ SST v2.0 ATTRIBUTES - Enhanced tier system
attribute vec3 atmosphericPosition;
attribute vec3 allenAtlasPosition;
attribute vec3 animationSeed;
attribute float atlasIndex;      // ✅ FIXED: float type for shader compatibility
attribute float sizeMultiplier;  // ✅ NEW: Tier-based size control
attribute float tierData;        // ✅ FIXED: float type for tier identification
attribute float opacityData;     // ✅ NEW: Tier-based opacity

// ✅ SST v2.0 VARYINGS - Enhanced with tier data
varying float vBlend;
varying float vAlpha;
varying vec2 vAtlasUVOffset;
varying float vTierID;          // ✅ NEW: Pass tier to fragment shader
varying float vSizeMultiplier;  // ✅ NEW: Pass size multiplier for edge calculation

// ✅ NEW: Pass particle index to fragment shader
varying float vParticleIndex;

const float PI = 3.14159265359;
const float TWO_PI = 6.28318530718;

// ✅ ENHANCED: Tier-specific movement patterns
vec3 generateConsciousnessMovement(vec3 basePos, vec3 seeds, float time, float progress, float tier) {
  float personalPhase = seeds.x * TWO_PI;
  float movementStyle = seeds.y;
  float breathingRate = seeds.z;
  
  float viewportScale = max(uResolution.x, uResolution.y) / 1000.0;
  
  // ✅ TIER 1: Atmospheric drift with noise clustering
  if (tier < 1.5) {
    vec3 atmosphericDrift = vec3(
      sin(basePos.x * 0.3 + time * 0.8 + personalPhase) * 0.12 * viewportScale,
      cos(basePos.y * 0.25 + time * 0.64 + personalPhase * 0.7) * 0.12 * viewportScale,
      sin(time * 0.6 + breathingRate * TWO_PI) * 0.06
    );
    
    // Subtle clustering movement
    float clusterPhase = sin(basePos.x * 0.1 + basePos.y * 0.1) * 0.5 + 0.5;
    atmosphericDrift *= 0.8 + clusterPhase * 0.4;
    
    return atmosphericDrift;
  }
  
  // ✅ TIER 2: Minimal spatial movement
  else if (tier < 2.5) {
    return vec3(
      sin(time * 0.3 + personalPhase) * 0.04 * viewportScale,
      cos(time * 0.25 + personalPhase * 0.8) * 0.04 * viewportScale,
      sin(time * 0.4 + breathingRate * TWO_PI) * 0.02
    );
  }
  
  // ✅ TIER 3: Twinkling oscillation
  else if (tier < 3.5) {
    float twinkleSpeed = 2.0 + movementStyle * 2.0;
    float twinkleAmount = 0.05 + sin(time * twinkleSpeed + personalPhase) * 0.03;
    
    return vec3(
      sin(time * 0.5 + personalPhase) * twinkleAmount * viewportScale,
      cos(time * 0.4 + personalPhase * 1.1) * twinkleAmount * viewportScale,
      sin(time * 0.6 + breathingRate * TWO_PI) * 0.03
    );
  }
  
  // ✅ TIER 4: Prominent constellation movement
  else {
    // Sine wave oscillation for prominence
    float prominencePhase = sin(time * 1.5 + personalPhase) * 0.5 + 0.5;
    float prominenceScale = 0.03 + prominencePhase * 0.02;
    
    vec3 constellationMovement = vec3(
      sin(basePos.x * 0.2 + time * 0.6 + personalPhase) * prominenceScale,
      cos(basePos.y * 0.15 + time * 0.5 + personalPhase * 0.9) * prominenceScale,
      sin(time * 0.7 + breathingRate * TWO_PI) * 0.02
    );
    
    // Center-weighted stability
    float distanceFromCenter = length(basePos.xy);
    float centerStability = 1.0 - smoothstep(0.0, 30.0, distanceFromCenter);
    constellationMovement *= (1.0 - centerStability * 0.5);
    
    return constellationMovement;
  }
}

// ✅ ENHANCED: Tier-aware point sizing
float calculatePointSize(vec3 worldPos, float baseScale, float progress, vec3 seeds, float sizeMultiplier, float tier) {
  float distance = length(worldPos);
  
  // Base size with tier multiplier
  float tierScale = baseScale * sizeMultiplier;
  
  // Distance-based scaling
  float distanceScale = tierScale * (300.0 / max(distance, 1.0));
  
  // Tier-specific size behaviors
  float minSize = 2.0;
  float maxSize = 30.0;
  
  if (tier < 1.5) {
    // Tier 1: Smallest, subtle variation
    minSize = 1.5;
    maxSize = 15.0;
  } else if (tier < 2.5) {
    // Tier 2: Medium, stable size
    minSize = 2.0;
    maxSize = 20.0;
  } else if (tier < 3.5) {
    // Tier 3: Large with twinkling
    minSize = 3.0;
    maxSize = 25.0;
    float twinkle = sin(uTime * 3.0 + seeds.x * TWO_PI) * 0.1 + 0.9;
    distanceScale *= twinkle;
  } else {
    // Tier 4: Largest, prominent
    minSize = 4.0;
    maxSize = 35.0; // ✅ Increased for Intel iGPU visibility
  }
  
  float finalSize = clamp(distanceScale, minSize, maxSize);
  
  // ✅ FIX: Ensure minimum size for Intel iGPU
  return max(finalSize, 3.0);
}

// ✅ ENHANCED: Tier-based alpha calculation
float calculateAlpha(float progress, vec3 seeds, float distanceFromCenter, float opacityData, float tier) {
  // Base alpha from tier opacity data
  float baseAlpha = opacityData;
  
  // Tier-specific alpha behaviors
  if (tier < 1.5) {
    // Tier 1: Soft atmospheric fade
    baseAlpha *= 0.8 + progress * 0.2;
  } else if (tier < 2.5) {
    // Tier 2: Stable medium opacity
    baseAlpha *= 0.9;
  } else if (tier < 3.5) {
    // Tier 3: Twinkling alpha
    float twinkleAlpha = 0.8 + sin(uTime * 2.5 + seeds.y * TWO_PI) * 0.2;
    baseAlpha *= twinkleAlpha;
  } else {
    // Tier 4: Maximum visibility
    baseAlpha *= 0.95 + sin(uTime * 1.0 + seeds.z * TWO_PI) * 0.05;
  }
  
  // Distance fade
  float distanceFade = 1.0 - smoothstep(25.0, 40.0, distanceFromCenter);
  
  return baseAlpha * distanceFade;
}

void main() {
  // ✅ NEW: Pass particle index to fragment shader
  vParticleIndex = particleIndex;
  
  // ✅ ATLAS INTEGRATION - Point-sprite texture coordinates
  float spritesPerRow = 4.0;
  float spriteSize = 1.0 / spritesPerRow;
  float row = floor(atlasIndex / spritesPerRow);
  float col = mod(atlasIndex, spritesPerRow);
  vAtlasUVOffset = vec2(col, row) * spriteSize;
  
  // Pass tier data to fragment shader
  vTierID = tierData;
  vSizeMultiplier = sizeMultiplier;
  
  // ✅ BRAIN MORPHING - Atmospheric dust → Allen Atlas coordinates
  vec3 basePos = mix(atmosphericPosition, allenAtlasPosition, clamp(uStageProgress, 0.0, 1.0));
  
  // Apply tier-specific consciousness movement
  vec3 drift = generateConsciousnessMovement(basePos, animationSeed, uTime, uStageProgress, tierData);
  vec3 finalPos = basePos + drift;
  
  // Calculate final position
  vec4 worldPosition = modelViewMatrix * vec4(finalPos, 1.0);
  gl_Position = projectionMatrix * worldPosition;
  
  // ✅ ENHANCED: Tier-aware point sizing
  float pointSize = calculatePointSize(
    worldPosition.xyz, 
    uPointSize, 
    uStageProgress, 
    animationSeed, 
    sizeMultiplier,
    tierData
  );
  gl_PointSize = pointSize;
  
  // ✅ COLOR BLENDING
  vBlend = uStageBlend;
  
  // ✅ ENHANCED: Tier-based alpha calculation
  float distanceFromCenter = length(finalPos.xy);
  vAlpha = calculateAlpha(uStageProgress, animationSeed, distanceFromCenter, opacityData, tierData);
}
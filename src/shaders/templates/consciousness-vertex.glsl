precision mediump float;

// Attributes
attribute float particleIndex;
attribute vec3 atmosphericPosition;
attribute vec3 text3DPosition;
attribute vec3 animationSeed;
attribute float atlasIndex;
attribute float sizeMultiplier;
attribute float tierData;
attribute float opacityData;

// Uniforms
uniform float uTime;
uniform float uMorphProgress;
uniform float uScrollProgress;
uniform float uPointSize;
uniform vec3 uColorCurrent;
uniform vec3 uColorNext;
uniform float uTotalSprites;
uniform float uDevicePixelRatio;
uniform vec2 uResolution;

// Varyings
varying float vBlend;
varying float vAlpha;
varying vec2 vAtlasUVOffset;
varying float vTierID;
varying float vSizeMultiplier;
varying float vParticleIndex;

const float PI = 3.14159265359;
const float TWO_PI = 6.28318530718;

vec3 generateMovement(vec3 basePos, vec3 seeds, float time, float tier) {
  float phase = seeds.x * TWO_PI;
  float speed = seeds.y;
  float depth = seeds.z;
  
  // Tier-based movement (reduced amplitude)
  if (tier < 1.5) {
    // Atmospheric drift
    return vec3(
      sin(time * 0.8 + phase) * 1.0,
      cos(time * 0.6 + phase * 0.7) * 1.0,
      sin(time * 0.5 + depth * TWO_PI) * 0.3
    );
  } else if (tier < 2.5) {
    // Stable orbital
    return vec3(
      sin(time * 0.3 + phase) * 0.3,
      cos(time * 0.3 + phase) * 0.3,
      sin(time * 0.4 + depth * TWO_PI) * 0.1
    );
  } else if (tier < 3.5) {
    // Twinkling
    float twinkle = sin(time * 3.0 + phase) * 0.5 + 0.5;
    return vec3(
      sin(time * 0.5 + phase) * twinkle * 0.5,
      cos(time * 0.5 + phase) * twinkle * 0.5,
      sin(time * 0.6 + depth * TWO_PI) * 0.2
    );
  } else {
    // Prominent
    return vec3(
      sin(time * 0.2 + phase) * 0.2,
      cos(time * 0.2 + phase) * 0.2,
      sin(time * 0.3 + depth * TWO_PI) * 0.1
    );
  }
}

void main() {
  vParticleIndex = particleIndex;
  vTierID = tierData;
  vSizeMultiplier = sizeMultiplier;
  
  // Atlas UV setup (4x4 grid)
  float spritesPerRow = 4.0;
  float spriteSize = 1.0 / spritesPerRow;
  float row = floor(atlasIndex / spritesPerRow);
  float col = mod(atlasIndex, spritesPerRow);
  vAtlasUVOffset = vec2(col, row) * spriteSize;
  
  // Position morphing between atmospheric and text
  vec3 basePos = mix(atmosphericPosition, text3DPosition, clamp(uMorphProgress, 0.0, 1.0));
  
  // Add movement
  vec3 movement = generateMovement(basePos, animationSeed, uTime, tierData);
  vec3 finalPos = basePos + movement;
  
  // Transform to screen space
  vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  // Point size with CONTROLLED attenuation and clamping
  float dist = length(mvPosition.xyz);
  float attenuation = min(2.0, 200.0 / dist);  // More controlled attenuation
  float baseSize = uPointSize * sizeMultiplier * attenuation;
  
  // Apply device pixel ratio but cap it
  gl_PointSize = baseSize * min(2.0, uDevicePixelRatio);
  
  // Much tighter size constraints
  gl_PointSize = clamp(gl_PointSize, 1.0, 32.0);
  
  // Pass color blend
  vBlend = uScrollProgress;
  
  // Calculate alpha with tier-based adjustment
  float tierAlpha = 1.0;
  if (tierData < 1.0) tierAlpha = 0.8;
  else if (tierData < 2.0) tierAlpha = 0.9;
  
  vAlpha = opacityData * tierAlpha * (0.5 + 0.5 * uMorphProgress);
}

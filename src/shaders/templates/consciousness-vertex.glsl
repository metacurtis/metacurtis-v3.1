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
uniform vec2 uViewportFit;

// Varyings
varying vec3 vPosition;
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
  
  // Tier-based movement
  if (tier < 1.5) {
    // Atmospheric drift
    return vec3(
      sin(time * 0.8 + phase) * 2.0,
      cos(time * 0.6 + phase * 0.7) * 2.0,
      sin(time * 0.5 + depth * TWO_PI) * 0.5
    );
  } else if (tier < 2.5) {
    // Stable orbital
    return vec3(
      sin(time * 0.3 + phase) * 0.5,
      cos(time * 0.3 + phase) * 0.5,
      sin(time * 0.4 + depth * TWO_PI) * 0.2
    );
  } else if (tier < 3.5) {
    // Twinkling
    float twinkle = sin(time * 3.0 + phase) * 0.5 + 0.5;
    return vec3(
      sin(time * 0.5 + phase) * twinkle,
      cos(time * 0.5 + phase) * twinkle,
      sin(time * 0.6 + depth * TWO_PI) * 0.3
    );
  } else {
    // Prominent
    return vec3(
      sin(time * 0.2 + phase) * 0.3,
      cos(time * 0.2 + phase) * 0.3,
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
  finalPos.x *= uViewportFit.x;
  finalPos.y *= uViewportFit.y;
  vPosition = finalPos;
  
  // Transform to screen space
  vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  // Point size with distance attenuation
  float dist = length(mvPosition.xyz);
  // gentler near-camera size; avoid "magnified pixels"
  float attenuation = 180.0 / dist;
  float tierSizeBoost = tierData < 0.5 ? 1.25 : (tierData > 2.5 ? 1.1 : 1.0);
  gl_PointSize = uPointSize * sizeMultiplier * tierSizeBoost * attenuation * uDevicePixelRatio;
  gl_PointSize = clamp(gl_PointSize, 2.0, 36.0);
  
  // Pass color blend
  vBlend = uScrollProgress;
  
  // Calculate alpha
  vAlpha = opacityData * (0.5 + 0.5 * uMorphProgress);
}

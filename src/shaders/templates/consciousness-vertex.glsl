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
uniform vec2 uAtmoFit;
uniform vec2 uTextFit;
uniform float uMoveDampStart;
uniform float uMoveDampStartY;
uniform float uPostMorphFreeze;
uniform vec4 uDriftAmp;
uniform vec4 uDriftHz;

// Varyings
varying vec3 vPosition;
varying float vBlend;
varying float vAlpha;
varying vec2 vAtlasUVOffset;
varying float vTierID;
varying float vSizeMultiplier;
varying float vParticleIndex;
varying float vTier;
varying float vPulsePhase;

const float TWO_PI = 6.28318530718;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
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

  // Position morphing between atmospheric and text (scale endpoints before mixing)
  vec3 atmoPos = atmosphericPosition;
  vec3 textPos = text3DPosition;
  atmoPos.x *= uAtmoFit.x;
  atmoPos.y *= uAtmoFit.y;
  textPos.x *= uTextFit.x;
  textPos.y *= uTextFit.y;

  float morph = clamp(uMorphProgress, 0.0, 1.0);
  vec3 basePos = mix(atmoPos, textPos, morph);

  float tier = clamp(tierData, 0.0, 3.0);
  vTier = tier;

  float amp = (tier < 0.5) ? uDriftAmp.x :
              (tier < 1.5) ? uDriftAmp.y :
              (tier < 2.5) ? uDriftAmp.z : uDriftAmp.w;
  float hz  = (tier < 0.5) ? uDriftHz.x :
              (tier < 1.5) ? uDriftHz.y :
              (tier < 2.5) ? uDriftHz.z : uDriftHz.w;

  vec2 uv = basePos.xy * 0.25 + animationSeed.xy * 0.15;
  float tt = uTime * hz + animationSeed.z * TWO_PI;
  float n1 = noise(uv + vec2(tt, 0.0));
  float n2 = noise(uv + vec2(0.0, tt));
  vec3 drift = vec3(n1 - 0.5, 0.0, n2 - 0.5) * (amp * 2.0);

  // Tier 2 stays structurally locked (no positional drift)
  if (tier > 1.5 && tier < 2.5) {
    drift = vec3(0.0);
  }

  vPulsePhase = (tier > 2.5) ? tt : 0.0;

  vec3 movement = drift;

  float freeze = (uPostMorphFreeze > 0.5) ? 0.0 : 1.0;
  float moveGain = 1.0 - smoothstep(uMoveDampStart, 1.0, morph);
  float moveGainY = 1.0 - smoothstep(uMoveDampStartY, 1.0, morph);

  movement.x *= moveGain * freeze;
  movement.y *= moveGainY * freeze;
  movement.z *= moveGain * freeze;

  if (morph >= 0.98 || uPostMorphFreeze > 0.5) {
    movement = vec3(0.0);
  }

  vec3 finalPos = basePos + movement;
  vPosition = finalPos;

  // Transform to screen space
  vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Point size with distance attenuation
  float dist = max(length(mvPosition.xyz), 0.0001);
  float attenuation = 180.0 / dist;
  float tierSizeBoost = tier < 0.5 ? 1.25 : (tier > 2.5 ? 1.1 : 1.0);
  gl_PointSize = uPointSize * sizeMultiplier * tierSizeBoost * attenuation * uDevicePixelRatio;
  gl_PointSize = clamp(gl_PointSize, 2.0, 36.0);

  // Pass color blend
  vBlend = uScrollProgress;

  // Calculate alpha
  vAlpha = opacityData * (0.5 + 0.5 * uMorphProgress);
}

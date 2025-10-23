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
uniform float uSpreadFactor;
uniform float uMorphType;
uniform float uMotionMode;
uniform vec3 uMotionParams;
uniform vec2 uGridSpacing;
uniform float uFlowTurbulence;
uniform float uStreakIntensity;

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

vec3 generateMovement(vec3 basePos, vec3 seeds, float morphProgress, float tier) {
  vec3 movement = vec3(0.0);
  float tierPhase = tier * 0.5 + seeds.x * TWO_PI;
  vec3 params = uMotionParams;
  int mode = int(floor(uMotionMode + 0.5));

  if (mode == 0) {
    float speed = max(0.1, params.x);
    float amplitude = max(0.05, params.y);
    float frequency = max(0.1, params.z);
    movement = vec3(
      sin(uTime * 0.5 * speed + tierPhase) * amplitude,
      cos(uTime * 0.3 * speed + tierPhase) * amplitude,
      sin(uTime * 0.4 * speed + tierPhase) * amplitude * 0.5
    );
  } else if (mode == 1) {
    vec2 spacing = max(abs(uGridSpacing), vec2(0.1));
    vec2 gridPos = floor(basePos.xy / spacing) * spacing;
    float wobble = params.y != 0.0 ? params.y : 0.2;
    movement = vec3(
      (gridPos.x - basePos.x) * 0.2 + sin(uTime * 0.2 + tierPhase) * wobble,
      (gridPos.y - basePos.y) * 0.2 + cos(uTime * 0.18 + tierPhase * 0.9) * wobble,
      sin(uTime * 0.15 + seeds.z * TWO_PI) * wobble * 0.5
    );
  } else if (mode == 2) {
    float flowSpeed = max(0.05, params.x);
    float amplitude = params.y;
    float turbulence = max(0.0, uFlowTurbulence);
    vec2 flowDir = normalize(vec2(cos(params.z + tierPhase * 0.1), sin(params.z + seeds.y)));
    movement = vec3(
      flowDir.x * flowSpeed * (1.0 + sin(uTime * 0.6 + tierPhase) * turbulence),
      flowDir.y * flowSpeed * (1.0 + cos(uTime * 0.5 + seeds.y * TWO_PI) * turbulence),
      sin(uTime * 0.4 + basePos.x * 0.1 + seeds.z * TWO_PI) * amplitude * 0.3
    );
  } else if (mode == 3) {
    float streakSpeed = uStreakIntensity * max(0.1, params.x);
    float verticalAmp = params.y != 0.0 ? params.y : 0.2;
    float lag = clamp(tier * 0.05 + seeds.x * 0.02, 0.0, 0.9);
    movement = vec3(
      streakSpeed * (1.0 - lag),
      sin(uTime * 2.0 + tierPhase) * verticalAmp,
      0.0
    );
  } else if (mode == 4) {
    float orbitSpeed = max(0.05, params.x);
    float orbitRadius = max(0.05, params.y);
    float flatten = params.z != 0.0 ? params.z : 0.7;
    float angle = uTime * orbitSpeed + tierPhase * 3.14159;
    movement = vec3(
      cos(angle) * orbitRadius,
      sin(angle) * orbitRadius * flatten,
      sin(angle * 2.0 + seeds.z * TWO_PI) * orbitRadius * 0.3
    );
  }

  movement *= (1.0 - morphProgress * 0.8);
  return movement;
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
  float spread = max(uSpreadFactor, 0.0);
  float morphType = uMorphType;
  float isDissolve = 1.0 - step(0.5, abs(morphType - 1.0));
  float isReform = 1.0 - step(0.5, abs(morphType - 2.0));
  float dissolveAmt = clamp(1.0 - morph, 0.0, 1.0);
  float reformAmt = clamp(morph, 0.0, 1.0);

  if (isDissolve > 0.0) {
    float dissolveSpread = mix(1.0, clamp(spread, 1.0, 4.0), dissolveAmt);
    atmoPos.xy *= dissolveSpread;
  }
  if (isReform > 0.0) {
    float reformScale = mix(1.0, clamp(spread, 0.4, 1.0), reformAmt);
    textPos.xy *= reformScale;
  }

  vec3 basePos = mix(atmoPos, textPos, morph);
  
  // Add movement
  vec3 movement = generateMovement(basePos, animationSeed, morph, tierData);

  float freeze = (uPostMorphFreeze > 0.5) ? 0.0 : 1.0;
  float moveGain = 1.0 - smoothstep(uMoveDampStart, 1.0, morph);
  float moveGainY = 1.0 - smoothstep(uMoveDampStartY, 1.0, morph);

  movement.x *= moveGain * freeze;
  movement.y *= moveGainY * freeze;
  movement.z *= moveGain * freeze;

  if (morph >= 0.985 || uPostMorphFreeze > 0.5) {
    movement = vec3(0.0);
  }

  vec3 finalPos = basePos + movement;
  
  if (isDissolve > 0.0) {
    vec3 radial = normalize(vec3(basePos.xy, 0.0001));
    finalPos += radial * (clamp(spread, 1.0, 4.0) - 1.0) * dissolveAmt * 6.0;
  }
  if (isReform > 0.0) {
    vec3 targetDir = normalize(vec3(textPos.xy, 0.0001));
    finalPos -= targetDir * max(1.0 - clamp(spread, 0.0, 1.0), 0.0) * reformAmt * 4.0;
  }
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

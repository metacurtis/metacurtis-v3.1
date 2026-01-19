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
uniform float uTierMode[4];
uniform vec4  uTierParams0;
uniform vec4  uTierParams1;
uniform vec4  uTierParams2;
uniform vec4  uTierParams3;
uniform vec2  uGridSpacing;
uniform float uFlowTurbulence;
uniform float uStreakIntensity;
uniform float uQrPhotoMode;
uniform float uGlyphTargetActive;
uniform vec3 uGlyphTargetCenter;
uniform float uGlyphTargetRadius;
uniform float uGlyphPulseIntensity;

// Varyings
varying vec3 vPosition;
varying float vBlend;
varying float vAlpha;
varying vec2 vAtlasUVOffset;
varying float vTierID;
varying float vTier;
varying float vSizeMultiplier;
varying float vParticleIndex;

const float PI = 3.14159265359;
const float TWO_PI = 6.28318530718;

vec4 getTierParams(int t) {
  if (t == 0) return uTierParams0;
  if (t == 1) return uTierParams1;
  if (t == 2) return uTierParams2;
  return uTierParams3;
}

float getTierMode(int t) {
  return (t >= 0 && t < 4) ? uTierMode[t] : 0.0;
}

vec3 applyTierMovement(vec3 basePos, int tierIndex) {
  float mode = getTierMode(tierIndex);
  vec4 params = getTierParams(tierIndex);
  float baseTaper = clamp(1.0 - uMorphProgress, 0.0, 1.0);
  float taper = baseTaper;

  // For drift mode, keep a small baseline so the glyph "breathes"
  if (mode < 0.5) {
    taper = max(baseTaper, 0.15);
  }

  vec3 offset = vec3(0.0);

  if (mode < 0.5) {
    float speed = max(0.1, params.x);
    float amplitude = params.y;
    float freq = max(0.1, params.z);
    float signal = sin(dot(basePos.xy, vec2(freq)) + uTime * speed);
    offset = vec3(signal, -signal, 0.0) * amplitude;
  } else if (mode < 1.5) {
    float sx = max(uGridSpacing.x, 1e-4);
    float sy = max(uGridSpacing.y, 1e-4);
    vec2 snapped = vec2(
      floor(basePos.x / sx + 0.5) * sx,
      floor(basePos.y / sy + 0.5) * sy
    );
    vec2 wob = vec2(sin(uTime * 6.28318) * params.x, cos(uTime * 3.14159) * params.x);
    offset = vec3(snapped.x - basePos.x + wob.x, snapped.y - basePos.y + wob.y, 0.0);
  } else if (mode < 2.5) {
    vec2 dir = normalize(vec2(0.7, 0.3));
    float turbulence = clamp(uFlowTurbulence, 0.0, 2.0);
    offset = vec3(dir, 0.0) * params.x * (1.0 + turbulence) + vec3(0.0, sin(uTime * 1.5) * params.y * (1.0 + turbulence), 0.0);
  } else if (mode < 3.5) {
    float streak = max(0.0, uStreakIntensity + params.x);
    offset = vec3(streak * 0.3, sin(uTime * 3.0) * (params.y + uStreakIntensity * 0.2), 0.0);
  } else {
    float radius = max(0.05, params.y);
    float speed = max(0.05, params.x);
    float flatten = clamp(1.0 - params.z, 0.2, 1.0);
    float angle = uTime * speed + basePos.x * 0.25;
    vec2 orbit = vec2(cos(angle) * radius, sin(angle) * radius * flatten);
    offset = vec3(orbit, 0.0);
  }

  return basePos + offset * taper;
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
  int tierIndex = int(clamp(floor(tierData + 0.5), 0.0, 3.0));
  vec3 tierAdjusted = applyTierMovement(basePos, tierIndex);
  
  // Add movement
  vec3 movement = tierAdjusted - basePos;

  float freeze = (uPostMorphFreeze > 0.5) ? 0.0 : 1.0;

  // Existing morph-based damping envelope
  float moveGainBase  = 1.0 - smoothstep(uMoveDampStart,  1.0, morph);
  float moveGainYBase = 1.0 - smoothstep(uMoveDampStartY, 1.0, morph);

  // Look up mode again for this vertex
  float mode = getTierMode(tierIndex);
  // driftMask = 1.0 when mode < 0.5, else 0.0
  float driftMask     = step(mode, 0.5);
  float nonDriftMask  = 1.0 - driftMask;

  // For drift: keep full gain (1.0) even when morph ~ 1
  // For other modes: use the existing envelope
  float moveGain  = mix(1.0, moveGainBase,  nonDriftMask);
  float moveGainY = mix(1.0, moveGainYBase, nonDriftMask);

  movement.x *= moveGain  * freeze;
  movement.y *= moveGainY * freeze;
  movement.z *= moveGain  * freeze;

  // Only the freeze flag should fully kill motion;
  // drift can continue at a low baseline even when morph ~ 1.0.
  if (uPostMorphFreeze > 0.5) {
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
    // Break coherent reform lines coming from atmospheric positions
    vec3 reformNoise = vec3(
      sin(particleIndex * 0.1 + uTime),
      cos(particleIndex * 0.13 + uTime * 1.1),
      0.0
    ) * (1.0 - morph) * 8.0;
    finalPos += reformNoise;
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
  float pointSize = uPointSize * sizeMultiplier * tierSizeBoost * attenuation * uDevicePixelRatio;
  pointSize = clamp(pointSize, 2.0, 36.0);

  // In QR photo mode, lock size so modules stay stable and photo-like.
  if (uQrPhotoMode > 0.5) {
    pointSize = uPointSize * uDevicePixelRatio;
    pointSize = max(pointSize, 2.0);
  }
  gl_PointSize = pointSize;
  
  // Pass color blend
  vBlend = uScrollProgress;
  
  // Calculate alpha
  vec2 ndc = gl_Position.xy / max(gl_Position.w, 1e-4);
  float edgeDist = max(abs(ndc.x), abs(ndc.y));
  float edgeFade = 1.0 - smoothstep(0.7, 1.0, edgeDist);
  float morphFade = smoothstep(0.15, 0.55, uMorphProgress);
  float atmosphericFade = mix(edgeFade, 1.0, morphFade);
  float glyphInfluence = 0.0;
  if (uGlyphTargetActive > 0.5) {
    float glyphRadius = max(uGlyphTargetRadius, 0.001);
    float glyphDist = distance(finalPos, uGlyphTargetCenter);
    glyphInfluence = 1.0 - smoothstep(glyphRadius, glyphRadius * 1.6, glyphDist);
  }
  float glyphPulse = 0.5 + 0.5 * sin(uTime * 5.0);
  float glyphBoost = glyphInfluence * glyphPulse * uGlyphPulseIntensity * uGlyphTargetActive;
  vAlpha = opacityData * (0.5 + 0.5 * uMorphProgress) * atmosphericFade * (1.0 + glyphBoost);
  vTier = tierData;
}

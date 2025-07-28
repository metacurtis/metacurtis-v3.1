// src/shaders/templates/consciousness-vertex.glsl
precision mediump float;

// ====== ATTRIBUTES (do NOT declare position) ======
attribute float particleIndex;
attribute vec3  atmosphericPosition;
attribute vec3  allenAtlasPosition;
attribute vec3  animationSeed;
attribute float atlasIndex;
attribute float sizeMultiplier;
attribute float tierData;
attribute float opacityData;
attribute vec3  behaviorData;
attribute float storyAffinity;
attribute float memoryFragment;
attribute float fusionMoment;

// ====== UNIFORMS ======
uniform float uTime;
uniform float uMorphProgress;   // 0..1 morph atmospheric -> brain
uniform float uStageBlend;      // color blend progress (0..1)
uniform float uActiveCount;     // active particle cutoff

uniform float uPointSize;
uniform float uDevicePixelRatio;
uniform vec2  uResolution;

uniform float uSpritesPerRow;   // atlas grid
uniform float uTotalSprites;    // spritesPerRow^2

uniform vec3  uColorCurrent;
uniform vec3  uColorNext;

uniform float uEnableGaussian;  // quality flag (0/1)

uniform float uTierHighlight[4];
uniform float uHighlightStrength;
uniform float uFusionActive;
uniform float uFusionIntensity;
uniform vec3  uFusionEpicenter;

uniform float uStageIndex;
uniform float uBrainRegion;

uniform float uSceneScale;

// --- SST v3.0 additions ---
uniform float uAnchorLockStrength; // 0..1: how strongly tiers ≥2 adhere to atlas positions
uniform float uDriftAmplitude;     // 0..1: global drift amplitude for low tiers

// ====== VARYINGS ======
varying float vTierID;
varying float vBlend;
varying float vAlpha;
varying vec2  vAtlasUVOffset;
varying float vParticleIndex;
varying float vSizeMultiplier;

const float PI = 3.14159265359;
const float TWO_PI = 6.28318530718;

// Helper: stage check
bool isStage(float idx) {
  return abs(uStageIndex - idx) < 0.5;
}

// ---- small tier movement baseline ----
vec3 tierMovement(vec3 basePos, vec3 seeds, float time, float tier) {
  float p = seeds.x * TWO_PI;

  if (tier < 0.5) {
    // Substrate drift – scaled by global amplitude
    return vec3(
      sin(basePos.x * 0.3 + time * 0.8 + p) * 0.12,
      cos(basePos.y * 0.25 + time * 0.64 + p * 0.7) * 0.12,
      sin(time * 0.6 + seeds.z * TWO_PI) * 0.06
    ) * uDriftAmplitude;
  } else if (tier < 1.5) {
    // Spatial mild orbit
    float a = time * 0.4 + p;
    return vec3(
      cos(a) * 0.06 * seeds.y,
      sin(a * 0.7) * 0.04,
      sin(a) * 0.03 * seeds.z
    );
  } else if (tier < 2.5) {
    // Anchors twinkle drift
    float s = 0.05 + sin(time * 2.0 + p) * 0.03;
    return vec3(
      sin(time * 0.5 + p) * s,
      cos(time * 0.4 + p * 1.1) * s,
      sin(time * 0.6 + seeds.z * TWO_PI) * s * 0.5
    );
  } else {
    // Constellations: very stable
    float phase = sin(time * 0.5 + p) * 0.5 + 0.5;
    float scale = 0.03 + phase * 0.02;
    return vec3(
      sin(basePos.x * 0.2 + time * 0.3 + p) * scale,
      cos(basePos.y * 0.15 + time * 0.25 + p * 0.9) * scale,
      sin(time * 0.4 + seeds.z * TWO_PI) * scale * 0.5
    );
  }
}

float tierPointSize(vec3 viewPos, float baseScale, float tier, float sizeMul, vec3 seeds) {
  float dist = length(viewPos);
  float scale = baseScale * sizeMul * (300.0 / max(dist, 1.0));

  float minS = 2.0 * uDevicePixelRatio;
  float maxS = 30.0 * uDevicePixelRatio;

  if (tier < 0.5) {
    minS = 1.5 * uDevicePixelRatio; maxS = 15.0 * uDevicePixelRatio;
  } else if (tier < 1.5) {
    minS = 2.0 * uDevicePixelRatio; maxS = 20.0 * uDevicePixelRatio;
  } else if (tier < 2.5) {
    minS = 3.0 * uDevicePixelRatio; maxS = 25.0 * uDevicePixelRatio;
    float pulse = 0.9 + 0.1 * sin(uTime * 2.2 + seeds.x * TWO_PI);
    scale *= pulse;
  } else {
    minS = 4.0 * uDevicePixelRatio; maxS = 35.0 * uDevicePixelRatio;
  }

  return clamp(scale, minS, maxS);
}

float tierAlpha(float tier, vec3 seeds, float baseOpacity, float distanceFromCenter) {
  float a = baseOpacity;

  if (tier < 0.5)      a *= 0.9;
  else if (tier < 1.5) a *= 0.95;
  else if (tier < 2.5) a *= (0.8 + 0.2 * sin(uTime * 2.5 + seeds.y * TWO_PI));
  else                 a *= (0.95 + 0.05 * sin(uTime * 1.0 + seeds.z * TWO_PI));

  // gentle center fade
  float df = 1.0 - smoothstep(25.0, 60.0, distanceFromCenter);
  a *= df;

  // highlight boost
  float h = uTierHighlight[int(tier)];
  if (h > 0.0) a *= (1.0 + h * uHighlightStrength);

  return a;
}

void main() {
  vParticleIndex  = particleIndex;
  vTierID         = tierData;
  vSizeMultiplier = sizeMultiplier;
  vBlend          = uStageBlend;

  // atlas tile offset
  float spriteSize = 1.0 / uSpritesPerRow;
  float row = floor(atlasIndex / uSpritesPerRow);
  float col = mod(atlasIndex, uSpritesPerRow);
  vAtlasUVOffset = vec2(col, row) * spriteSize;

  // morph
  float m = clamp(uMorphProgress, 0.0, 1.0);
  vec3 basePos = mix(atmosphericPosition, allenAtlasPosition, m);

  // movement
  vec3 mv = tierMovement(basePos, animationSeed, uTime, vTierID);

  // Tier locking: tiers >= 2 should adhere to atlas targets as lock→1
  // lock = 0 for tiers 0/1, lock = uAnchorLockStrength for tiers 2/3
  float lock = step(1.5, vTierID) * clamp(uAnchorLockStrength, 0.0, 1.0);

  // fusion impulse
  if (uFusionActive > 0.5) {
    vec3 toEpi = uFusionEpicenter - basePos;
    float d = length(toEpi);
    float effect = exp(-d * 0.05) * uFusionIntensity;
    mv += normalize(toEpi) * effect * 0.5;
  }

  vec3 drifted = basePos + mv;
  vec3 finalPos = mix(drifted, basePos, lock); // lock pulls back to target

  // Stage-specific: Velocity (stageIndex ≈ 3)
  if (isStage(3.0)) {
    // radial push + subtle swirl
    float t = uTime;
    float push = 1.0 + 0.35 * sin(t * 2.0 + animationSeed.x * TWO_PI);
    float ang  = 0.6 * t + animationSeed.y * TWO_PI;
    mat2 rot = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
    finalPos.xy = rot * finalPos.xy;
    finalPos *= push;
  }

  // apply global scene scale
  finalPos *= uSceneScale;

  // project
  vec4 mvPos = modelViewMatrix * vec4(finalPos, 1.0);
  gl_Position = projectionMatrix * mvPos;

  gl_PointSize = tierPointSize(mvPos.xyz, uPointSize, vTierID, vSizeMultiplier, animationSeed);

  float distCenter = length(finalPos);
  vAlpha = tierAlpha(vTierID, animationSeed, opacityData, distCenter);
}
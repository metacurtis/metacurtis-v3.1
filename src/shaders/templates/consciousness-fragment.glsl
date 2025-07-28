// src/shaders/templates/consciousness-fragment.glsl
precision mediump float;

uniform sampler2D uAtlasTexture;

uniform float uTime;
uniform vec3  uColorCurrent;
uniform vec3  uColorNext;

uniform float uEnableGaussian;   // 0/1
uniform float uShimmerIntensity;
uniform float uFogDensity;

uniform float uActiveCount;      // active cutoff
uniform float uFadeProgress;

uniform float uSpritesPerRow;
uniform float uTotalSprites;

uniform float uTierHighlight[4];
uniform float uHighlightStrength;

uniform float uStageIndex;

// --- SST v3.0 additions ---
uniform float uAlphaCutoff;   // e.g. 0.35
uniform float uEdgeSoftness;  // e.g. 0.08

varying float vTierID;
varying float vBlend;
varying float vAlpha;
varying vec2  vAtlasUVOffset;
varying float vParticleIndex;
varying float vSizeMultiplier;

// ---- utils ----
vec3 rgb2hsv(vec3 c) {
  float cMax = max(c.r, max(c.g, c.b));
  float cMin = min(c.r, min(c.g, c.b));
  float d = cMax - cMin;
  float h = 0.0;
  if (d > 0.0) {
    if (cMax == c.r)      h = mod((c.g - c.b) / d, 6.0);
    else if (cMax == c.g) h = ((c.b - c.r) / d) + 2.0;
    else                  h = ((c.r - c.g) / d) + 4.0;
  }
  float s = (cMax == 0.0) ? 0.0 : d / cMax;
  float v = cMax;
  return vec3(h / 6.0, s, v);
}
vec3 hsv2rgb(vec3 c) {
  vec3 k = abs(mod(c.x * 6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0);
  return c.z * mix(vec3(1.0), clamp(k - 1.0, 0.0, 1.0), c.y);
}

vec4 sampleAtlas(vec2 uvOffset, vec2 pt, float spritesPerRow) {
  float spriteSize = 1.0 / spritesPerRow;
  vec2 uv = uvOffset + pt * spriteSize;
  return texture2D(uAtlasTexture, uv);
}

float gaussianFalloff(vec2 coord, float sigma) {
  vec2 c = coord - 0.5;
  float d = length(c);
  return exp(-pow(d * sigma, 2.0));
}

// subtle stage accent (baseline)
vec3 stageAccent(vec3 base, float tier, vec2 pc, float time, float stageIndex) {
  if (stageIndex < 0.5) {
    float g = 0.02 * sin((pc.y * 18.0) + time * 5.0);
    base.g += g;
  } else if (stageIndex < 2.5) {
    float p = 0.03 * sin(length(pc - 0.5) * 10.0 - time * 2.0);
    base += vec3(p * 0.6, p * 0.2, p * 0.8);
  } else if (stageIndex < 3.5) {
    float l = step(0.995, sin(pc.x * 40.0 + pc.y * 30.0 + time * 8.0));
    base += vec3(l) * 0.12;
  }
  return base;
}

void main() {
  vec2 pc = gl_PointCoord;

  // activation fade
  float vis = 1.0;
  if (vParticleIndex >= uActiveCount) {
    float d = vParticleIndex - uActiveCount;
    float range = 1000.0;
    vis = 1.0 - smoothstep(0.0, range, d);
    vis *= uFadeProgress;
  }
  if (vis <= 0.001) discard;

  // atlas sample
  float spritesPerRow = floor(sqrt(uTotalSprites + 0.5));
  vec4 atlasCol = sampleAtlas(vAtlasUVOffset, pc, spritesPerRow);
  
  // Clean sprite edges (avoid visible cross/diamond artifacts at small sizes)
  float softA = smoothstep(uAlphaCutoff, uAlphaCutoff + uEdgeSoftness, atlasCol.a);
  if (softA <= 0.001) discard;

  // HSV color blend
  vec3 hsvA = rgb2hsv(uColorCurrent);
  vec3 hsvB = rgb2hsv(uColorNext);

  float satBoost = 1.0;
  if (vTierID > 2.5)      satBoost = 1.2;
  else if (vTierID > 1.5) satBoost = 1.1;

  vec3 hsv = vec3(
    mix(hsvA.x, hsvB.x, vBlend),
    min(1.0, mix(hsvA.y, hsvB.y, vBlend) * satBoost),
    mix(hsvA.z, hsvB.z, vBlend)
  );
  vec3 color = hsv2rgb(hsv);

  // sprite influence
  color = mix(color, color * atlasCol.rgb, 0.6);

  // shimmer
  float sh = 1.0;
  if (vTierID < 0.5) {
    sh = 1.0 + sin(pc.x * 4.0 + uTime) * 0.03 * uShimmerIntensity;
  } else if (vTierID < 1.5) {
    sh = 1.0 + sin(pc.y * 3.0 + uTime * 0.8) * 0.04 * uShimmerIntensity;
  } else if (vTierID < 2.5) {
    float s1 = sin(pc.x * 8.0 + uTime * 2.0) * 0.08;
    float s2 = cos(pc.y * 6.0 + uTime * 1.5) * 0.06;
    sh = 1.0 + (s1 + s2) * uShimmerIntensity;
  } else {
    float s1 = sin(pc.x * 10.0 + uTime * 1.8) * 0.10;
    float s2 = cos(pc.y * 8.0 + uTime * 1.4) * 0.08;
    float rs = sin(length(pc - 0.5) * 15.0 + uTime * 2.5) * 0.05;
    sh = 1.0 + (s1 + s2 + rs) * uShimmerIntensity;
  }
  color *= sh;

  // stage accent (subtle)
  color = stageAccent(color, vTierID, pc, uTime, uStageIndex);

  // alpha + falloff
  float alpha = vAlpha * softA * vis;

  if (uEnableGaussian > 0.5) {
    float g = gaussianFalloff(pc, 2.5);
    alpha *= g;
  } else {
    float d = length(pc - 0.5);
    float f = 1.0 - smoothstep(0.3, 0.5, d);
    alpha *= f;
  }

  // gentle fog
  if (uFogDensity > 0.0) {
    float fog = 0.08 * (1.0 - exp(-uFogDensity * 0.5));
    color = mix(color, vec3(0.0), fog);
  }

  gl_FragColor = vec4(color, alpha);
}
precision mediump float;

/* === UNIFORMS === */
uniform sampler2D uAtlasTexture;
uniform float uTime;
uniform vec3  uColorCurrent;
uniform vec3  uColorNext;

uniform float uTierCutoff;
uniform float uFadeProgress;

/* NEW uniforms your JS should set (safe defaults below if not set) */
uniform float uGaussianSigma;          // e.g. 2.5
uniform float uTierHighlight[4];       // per-tier boost: [t0..t3]

/* === VARYINGS from vertex shader === */
varying float vBlend;
varying float vAlpha;
varying vec2  vAtlasUVOffset;
varying float vTierID;
varying float vSizeMultiplier;
varying float vParticleIndex;

/* ---------- helpers ---------- */

float gaussianFalloff(vec2 coord, float sigma) {
  // coord is gl_PointCoord in [0,1]^2
  vec2 c = coord - 0.5;
  float d = dot(c, c);           // r^2
  // Higher sigma = softer edge. (2.0–4.0 looks good)
  return exp(-d * sigma * sigma * 4.0);
}

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0);
  return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

vec4 sampleAtlasTexture(vec2 uvOffset, vec2 pointCoord) {
  // 4×4 grid (16 sprites)
  float spriteSize = 0.25;
  vec2 uv = uvOffset + pointCoord * spriteSize;
  return texture2D(uAtlasTexture, uv);
}

float shimmer(vec2 coord, float time, float tier) {
  if (tier < 1.5) {
    return 1.0 + sin(coord.x * 4.0 + time * 1.0) * 0.03;
  } else if (tier < 2.5) {
    return 1.0 + sin(coord.y * 3.0 + time * 0.8) * 0.04;
  } else if (tier < 3.5) {
    float s1 = sin(coord.x * 8.0 + time * 2.0) * 0.08;
    float s2 = cos(coord.y * 6.0 + time * 1.5) * 0.06;
    return 1.0 + s1 + s2;
  } else {
    float s1 = sin(coord.x * 10.0 + time * 1.8) * 0.10;
    float s2 = cos(coord.y * 8.0  + time * 1.4) * 0.08;
    float sr = sin(length(coord - 0.5) * 15.0 + time * 2.5) * 0.05;
    return 1.0 + s1 + s2 + sr;
  }
}

/* ---------- main ---------- */

void main() {
  // MUST be inside main (fixes your "global initializer" error)
  vec2 particleCoord = gl_PointCoord;

  // Fade-out beyond drawRange / activeCount
  float cutoffFade = 1.0;
  if (vParticleIndex >= uTierCutoff) {
    float fadeDistance = vParticleIndex - uTierCutoff;
    float fadeRange = 1000.0;
    cutoffFade = 1.0 - smoothstep(0.0, fadeRange, fadeDistance);
    cutoffFade *= uFadeProgress;
  }
  if (cutoffFade < 0.001) discard;

  // Sample sprite from atlas
  vec4 atlasColor = sampleAtlasTexture(vAtlasUVOffset, particleCoord);
  if (atlasColor.a < 0.001) discard;

  // Color blend current → next (HSV for nicer transitions)
  vec3 curHSV  = rgb2hsv(uColorCurrent);
  vec3 nextHSV = rgb2hsv(uColorNext);
  vec3 mixHSV  = vec3(
    mix(curHSV.x,  nextHSV.x,  vBlend),
    mix(curHSV.y,  nextHSV.y,  vBlend),
    mix(curHSV.z,  nextHSV.z,  vBlend)
  );

  // Per-tier saturation boost via uTierHighlight
  int tidx = int(clamp(floor(vTierID + 0.5), 0.0, 3.0));
  float satBoost = 1.0 + clamp(uTierHighlight[tidx], 0.0, 1.0) * 0.4;
  mixHSV.y = clamp(mixHSV.y * satBoost, 0.0, 1.0);

  vec3 vibrant = hsv2rgb(mixHSV);
  vec3 finalRGB = mix(vibrant, vibrant * atlasColor.rgb, 0.6);

  // Alpha: base * cutoff * gaussian edge
  float alpha = vAlpha * atlasColor.a * cutoffFade;
  float sigma = max(uGaussianSigma, 0.001);
  alpha *= gaussianFalloff(particleCoord, sigma);

  // Add shimmer by tier
  finalRGB *= shimmer(particleCoord, uTime, vTierID);

  gl_FragColor = vec4(finalRGB, alpha);
}

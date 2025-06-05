// src/components/webgl/shaders/vertex.glsl – GOLD STANDARD HOLE‑FREE VERSION
// -----------------------------------------------------------------------------
// This build keeps every logical block you already rely on (living movement,
// flag waves, cursor repulsion, shimmer, aurora, etc.) but *removes the old
// XY‑radiation displacement* that punched the notorious center‑hole.   
// Instead, **all"breathing / radiation" energy is now applied on the *Z axis
// only*, and every interactive force is wrapped in a *core‑lock* check so no
// particle inside the lock radius can be yanked outwards.
// -----------------------------------------------------------------------------

// ────────────────  UNIFORMS  ────────────────────────────────────────────────
uniform float uTime;
uniform float uSize;
uniform float uScrollProgress;
uniform vec3  uCursorPos;
uniform float uCursorRadius;
uniform float uRepulsionStrength;

// Aurora & ripple effects
uniform bool  uAuroraEnabled;
uniform float uAuroraIntensity;
uniform float uAuroraSpeed;

// Ripple – GOLD‑standard, core‑locked
uniform bool  uRippleEnabled;
uniform float uRippleTime;
uniform vec3  uRippleCenter;
uniform float uRippleStrength;

// Flag wave
uniform bool  uFlagWaveEnabled;
uniform float uFlagAmplitude;
uniform float uFlagFrequency;
uniform float uFlagSpeed;

// Living (ambient) movement
uniform float uLivingAmplitude;
uniform float uLivingFrequency;
uniform float uLivingSpeed;

// Shimmer & wind
uniform float uShimmerIntensity;
uniform float uWindStrength;
uniform vec2  uWindDirection;

// Viewport / coverage – used in JS but handy for shader logic
uniform float uCoverageWidth;
uniform float uCoverageHeight;
uniform vec2  uViewportSize;

// ────────────────  ATTRIBUTES & VARYINGS  ──────────────────────────────────
attribute vec3 position;
attribute vec4 animationSeeds;       // x,y,z,w → per‑particle randomness

varying  float vLifetime;
varying  float vWaveIntensity;
varying  vec3  vWorldPosition;
varying  float vDistanceFromCenter;

// ────────────────  CONSTANTS  ──────────────────────────────────────────────
const float CORE_LOCK_RADIUS        = 1.5;  // particles inside never move radially
const float SAFE_DISPLACEMENT_RADIUS = 3.0; // smooth‑falloff zone (unused but kept)
const float MAX_RIPPLE_DISTANCE      = 40.0;

// ═══════════════════════════════════════════════════════════════════════════
// 1) HOLE‑FREE “RADIATION”  – *Z‑axis only*
//    (Old version used radial XY which created voids.)
// ═══════════════════════════════════════════════════════════════════════════
float holeFreeRadiation(vec3 p, float t, float rand)
{
  float a = sin(p.x * 0.30 + t * 1.20) * cos(p.y * 0.20 + t * 0.80);
  float b = sin(p.x * 0.70 + t * 0.60) * cos(p.y * 0.50 + t * 1.10);
  float n = sin(rand * 6.28318 + t * 2.0) * 0.3;
  return (a + b * 0.6 + n) * 0.25;            // 100 % Z‑only
}

// 2) Living movement – coordinate‑based waves (no radial math)
vec3 livingMovement(vec3 p, float t, vec4 seeds)
{
  vec3 m = vec3(0.0);
  m.x = sin(p.y * uLivingFrequency       + t * uLivingSpeed)        * uLivingAmplitude * 0.3;
  m.y = cos(p.x * uLivingFrequency * 0.7 + t * uLivingSpeed * 0.8)  * uLivingAmplitude * 0.3;
  m.z = sin(p.x * 0.4 + t * 1.1) * cos(p.y * 0.3 + t * 0.9) * uLivingAmplitude;
  m.z += sin(seeds.x * 6.28318 + t * 2.0) * uLivingAmplitude * 0.2;
  return m;
}

// 3) Flag surface wave
float flagWave(vec3 p, float t)
{
  if (!uFlagWaveEnabled) return 0.0;
  float w = sin(p.x * uFlagFrequency       + t * uFlagSpeed) *
            cos(p.y * uFlagFrequency * 0.7 + t * uFlagSpeed * 0.8);
  w += sin(p.x * uFlagFrequency * 1.3 + t * uFlagSpeed * 1.2) * 0.5;
  return w * uFlagAmplitude;
}

// 4) Wind (XY only, no radial bias)
vec2 windEffect(vec3 p, float t, float rand)
{
  if (uWindStrength <= 0.0) return vec2(0.0);
  float w = sin(p.x * 0.1 + t * 2.0) * cos(p.y * 0.15 + t * 1.5);
  vec2 e = uWindDirection * w * uWindStrength;
  e += vec2( sin(rand * 6.28318 + t * 3.0),
             cos(rand * 6.28318 + t * 2.5) ) * 0.1 * uWindStrength;
  return e;
}

// ────────────────  MAIN  ───────────────────────────────────────────────────
void main()
{
  vec3 p   = position;                // working position
  float t  = uTime * 0.5;             // slow master clock
  vec4 rnd = animationSeeds;

  // Distance from centre (for locks / diagnostics)
  float dCentre = length(p.xy);

  // 1) Z‑only radiation breath
  p.z += holeFreeRadiation(p, t, rnd.x) * 2.0;

  // 2) Ambient living motion
  p += livingMovement(p, t, rnd);

  // 3) Flag billow
  p.z += flagWave(p, t);

  // 4) Wind
  p.xy += windEffect(p, t, rnd.y);

  // 5) Core‑locked ripple
  float rippleAmp = 0.0;
  if (uRippleEnabled && uRippleStrength > 0.0)
  {
    vec3  v   = p - uRippleCenter;
    float dr  = length(v.xy);
    if (dr > CORE_LOCK_RADIUS && dr < MAX_RIPPLE_DISTANCE)
    {
      float age = uTime - uRippleTime;
      float w   = sin(dr * 0.4 - age * 12.0) * exp(-dr * 0.05 - age * 0.5);
      w = clamp(w * uRippleStrength, -0.16, 0.16);
      vec2 dir  = normalize(v.xy + vec2(1e-4));
      p.z += w;             // Z
      p.xy += dir * w * 0.12; // tiny XY – outside core only
      rippleAmp = abs(w);
    }
  }

  // 6) Core‑locked cursor repulsion
  float interact = 0.0;
  vec3  vc = p - uCursorPos;
  float dc = length(vc);
  if (dc > CORE_LOCK_RADIUS && dc < uCursorRadius)
  {
    interact = smoothstep(uCursorRadius, uCursorRadius * 0.1, dc);
    p += normalize(vc + vec3(1e-4)) * interact * uRepulsionStrength * 0.3;
  }

  // 7) Optional shimmer (Z‑only)
  if (uShimmerIntensity > 0.0)
  {
    float sh = sin(p.x * 2.0 + uTime * 4.0) * cos(p.y * 1.5 + uTime * 3.5);
    p.z += sh * uShimmerIntensity * 0.1;
  }

  // 8) Optional aurora (Z‑only)
  if (uAuroraEnabled && uAuroraIntensity > 0.0)
  {
    float au = sin(p.x * 0.2 + uTime * uAuroraSpeed) *
               cos(p.y * 0.15 + uTime * uAuroraSpeed * 0.7);
    p.z += au * uAuroraIntensity * 0.8;
  }

  // ───── store varyings
  vLifetime           = rnd.z;
  vWaveIntensity      = rippleAmp + interact;
  vWorldPosition      = p;
  vDistanceFromCenter = dCentre;

  // ───── final position & size
  vec4 mv  = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float size = uSize * (300.0 / -mv.z);
  gl_PointSize = clamp(size, 1.0, 20.0);
}

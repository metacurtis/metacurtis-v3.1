// src/components/webgl/shaders/vertex.glsl – DIGITAL AWAKENING COGNITIVE TRANSFORMATION
// ✅ CURTIS WHORTON: Neural shift patterns representing amygdala → prefrontal cortex journey
// ✅ COMPATIBLE: Uses existing uniform system with DIGITAL AWAKENING enhancements

// ────────────────  EXISTING UNIFORMS (MAINTAINED FOR COMPATIBILITY) ───────
uniform float uTime;
uniform float uSize;
uniform float uScrollProgress;
uniform vec3  uCursorPos;
uniform float uCursorRadius;
uniform float uRepulsionStrength;

// ✅ DIGITAL AWAKENING: Stage-based uniforms (mapped from existing data)
uniform int uStage;               // 0-4 DIGITAL AWAKENING stages (from narrativeStore)
uniform float uStageProgress;     // 0-1 within current stage
uniform vec3 uStageColor;         // Current DIGITAL AWAKENING stage color

// ✅ NEURAL SHIFT: Effect uniforms (mapped to existing system)
uniform bool  uAuroraEnabled;
uniform float uAuroraIntensity;
uniform float uAuroraSpeed;
uniform bool  uRippleEnabled;
uniform float uRippleTime;
uniform vec3  uRippleCenter;
uniform float uRippleStrength;

// ✅ NEURAL SHIFT: Living movement uniforms (cognitive transformation)
uniform bool  uFlagWaveEnabled;
uniform float uFlagAmplitude;
uniform float uFlagFrequency;
uniform float uFlagSpeed;
uniform float uLivingAmplitude;
uniform float uLivingFrequency;
uniform float uLivingSpeed;
uniform float uShimmerIntensity;
uniform float uWindStrength;
uniform vec2  uWindDirection;

// Debug uniforms (existing system)
uniform int uDebugMode;
uniform float uDebugIntensity;
uniform vec3 uDebugColor;
uniform bool uShowDebugOverlay;

// ────────────────  ATTRIBUTES & VARYINGS (EXISTING NAMES) ─────────────────
// ✅ NO REDECLARATION: Three.js provides these automatically
// attribute vec3 position;      // ❌ NEVER redeclare built-ins
// attribute vec3 color;         // ❌ NEVER redeclare built-ins
attribute vec4 animationSeeds;   // ✅ EXISTING: Now contains neural cognitive seeds

// Existing varyings (maintained for compatibility)
varying float vLifetime;
varying float vWaveIntensity;
varying vec3  vWorldPosition;
varying float vDistanceFromCenter;

// ✅ DIGITAL AWAKENING: Additional varyings for cognitive visualization
varying float vCognitiveState;
varying vec3 vDebugColor;
varying float vDebugValue;

// ────────────────  CONSTANTS ──────────────────────────────────────────────
const float COGNITIVE_CORE_RADIUS = 2.5;  // ✅ DIGITAL AWAKENING: Protected cognitive center
const float MAX_INTERACTION_DISTANCE = 40.0;

// ✅ DIGITAL AWAKENING: Curtis Whorton's cognitive transformation patterns
vec3 calculateDigitalAwakeningPattern(vec3 pos, float time, vec4 seeds, int stage, float progress) {
  vec3 cognitiveMovement = vec3(0.0);
  float personalPhase = seeds.x * 6.28318; // Personal cognitive signature
  float reactivity = seeds.y;    // Amygdala reactivity factor (high in early stages)
  float processing = seeds.z;    // Processing capability (grows through stages)
  float integration = seeds.w;   // Strategic integration potential (peaks in later stages)
  
  if (stage == 0) {
    // GENESIS: Curtis struggling alone - scattered, reactive, amygdala-driven chaos
    float reactiveScatter = sin(pos.x * 0.4 + time * 2.5 + personalPhase) * 
                           cos(pos.y * 0.3 + time * 2.0 + reactivity * 3.14);
    float defensiveCluster = sin(reactivity * 6.28 + time * 3.0) * 0.5;
    float anxiousMovement = cos(time * 4.0 + personalPhase) * reactivity * 0.3;
    
    cognitiveMovement.x = reactiveScatter * 1.4 + anxiousMovement;
    cognitiveMovement.y = reactiveScatter * 1.0 + anxiousMovement * 0.7;
    cognitiveMovement.z = defensiveCluster * 0.7; // Shallow, defensive thinking
    
  } else if (stage == 1) {
    // SILENT: "Something needs to change" - processing, questioning, beginning organization
    float questioningOscillation = sin(pos.x * 0.2 + time * 1.2) * 
                                  cos(pos.y * 0.15 + time * 1.0);
    float processingDepth = sin(time * 0.6 + processing * 6.28) * progress;
    float contemplativeCircling = sin(time * 0.8 + personalPhase) * 0.6;
    
    cognitiveMovement.x = questioningOscillation * (1.0 + progress * 0.5) + contemplativeCircling;
    cognitiveMovement.y = questioningOscillation * (0.8 + progress * 0.7) + contemplativeCircling * 0.8;
    cognitiveMovement.z = processingDepth * 1.4; // Deeper contemplation beginning
    
  } else if (stage == 2) {
    // AWAKENING: "Teach me to code" breakthrough - rapid neural reorganization
    float breakthroughIntensity = 1.2 + progress * 2.5; // Dramatic increase during breakthrough
    float reorganization = sin(pos.x * 0.5 + time * 4.5) * 
                         cos(pos.y * 0.4 + time * 4.0) * breakthroughIntensity;
    float neuralFlash = sin(time * 9.0 + personalPhase) * progress * 1.0;
    float perspectiveShift = cos(time * 6.0 + integration * 6.28) * progress * 1.2;
    
    cognitiveMovement.x = reorganization * 1.8 + perspectiveShift;
    cognitiveMovement.y = reorganization * 1.5 + perspectiveShift * 0.9;
    cognitiveMovement.z = neuralFlash * 2.5; // Dramatic cognitive breakthrough
    
  } else if (stage == 3) {
    // ACCELERATION: Strategic AI-enhanced development - prefrontal cortex dominance
    float strategicFlow = sin(pos.x * 0.1 + time * 0.8) * 
                         cos(pos.y * 0.08 + time * 0.6);
    float systematicPattern = sin(time * 1.4 + integration * 6.28) * 0.8;
    float efficiency = mix(1.2, 0.8, progress); // More efficient over time
    float aiCollaboration = sin(time * 1.1 + processing * 6.28) * 0.9;
    
    cognitiveMovement.x = strategicFlow * efficiency * 2.0 + aiCollaboration;
    cognitiveMovement.y = strategicFlow * efficiency * 1.7 + aiCollaboration * 0.8;
    cognitiveMovement.z = systematicPattern * 1.2; // Controlled strategic depth
    
  } else if (stage == 4) {
    // TRANSCENDENCE: Human-AI collaborative mastery - unified consciousness
    float radius = length(pos.xy);
    float consciousBreathe = sin(time * 1.0 + radius * 0.12) * 
                            cos(time * 0.8 + personalPhase);
    float consciousnessSpiral = sin(atan(pos.y, pos.x) + time * 0.4 + radius * 0.06);
    float harmonic = sin(time * 0.5 + integration * 6.28) * 0.6;
    float unifiedFlow = cos(time * 0.3 + processing * 6.28) * 0.7;
    
    cognitiveMovement.x = consciousBreathe * 1.2 + consciousnessSpiral * 0.4 + unifiedFlow;
    cognitiveMovement.y = consciousBreathe * 1.2 + consciousnessSpiral * 0.5 + unifiedFlow * 0.9;
    cognitiveMovement.z = harmonic + sin(time * 0.5 + radius * 0.1) * 1.0; // Deep, unified breathing
  }
  
  return cognitiveMovement;
}

// ✅ DIGITAL AWAKENING: Core protection during cognitive transformation
vec3 applyCognitiveProtection(vec3 pos, vec3 cursor, float radius, float strength) {
  vec3 diff = pos - cursor;
  float dist = length(diff.xy);
  
  // Protect cognitive center (Curtis's core identity) during transformation
  if (dist < COGNITIVE_CORE_RADIUS) {
    return pos; // No disruption to core cognitive patterns (Marine discipline preserved)
  }
  
  if (dist < radius && dist > 0.001) {
    vec2 repulsion = normalize(diff.xy) * (1.0 - dist / radius) * strength * 0.4;
    pos.xy += repulsion; // Gentle interaction beyond core
  }
  
  return pos;
}

// ✅ DIGITAL AWAKENING: Z-axis cognitive breathing effect (depth of thinking)
float cognitiveBreathing(vec3 p, float t, float stage, float cognitiveLoad) {
  float baseBreathing = sin(p.x * 0.25 + t * 1.1) * cos(p.y * 0.2 + t * 0.9);
  float depthFactor = sin(t * 0.7) * cognitiveLoad; // Deeper thinking = more Z movement
  
  // Stage-specific breathing patterns
  if (stage < 1.0) {
    // Genesis: Shallow, anxious breathing
    return (baseBreathing * 0.6 + depthFactor * 0.3) * 0.4;
  } else if (stage < 2.0) {
    // Silent: Deeper, contemplative breathing
    return (baseBreathing * 0.8 + depthFactor * 0.5) * 0.4;
  } else if (stage < 3.0) {
    // Awakening: Dramatic, breakthrough breathing
    return (baseBreathing * 1.2 + depthFactor * 0.8) * 0.4;
  } else if (stage < 4.0) {
    // Acceleration: Controlled, strategic breathing
    return (baseBreathing * 1.0 + depthFactor * 0.7) * 0.4;
  } else {
    // Transcendence: Harmonious, unified breathing
    return (baseBreathing * 0.9 + depthFactor * 0.6) * 0.4;
  }
}

// ✅ EXISTING: Living movement mapped to cognitive patterns
vec3 livingMovement(vec3 p, float t) {
  float cognitiveStage = float(uStage);
  float stageAmplitude = uLivingAmplitude;
  float stageFrequency = uLivingFrequency;
  float stageSpeed = uLivingSpeed;
  
  // Cognitive transformation breathing
  float cognitiveBreathX = sin(p.x * 0.2 * stageFrequency + t * stageSpeed) * stageAmplitude;
  float cognitiveBreathY = cos(p.y * 0.15 * stageFrequency + t * stageSpeed * 0.9) * stageAmplitude;
  float cognitiveBreathZ = sin(t * 0.6 * stageSpeed + cognitiveStage) * stageAmplitude * 0.5;
  
  return vec3(cognitiveBreathX, cognitiveBreathY, cognitiveBreathZ) * 0.8;
}

// ✅ EXISTING: Flag wave mapped to cognitive wave patterns
vec3 flagWave(vec3 p, float t) {
  if (!uFlagWaveEnabled) return vec3(0.0);
  
  float cognitiveWave = sin(p.x * 0.1 + t * uFlagSpeed) * cos(p.y * 0.08 + t * uFlagSpeed * 0.7);
  return vec3(cognitiveWave * uFlagAmplitude * 0.3, cognitiveWave * uFlagAmplitude * 0.2, 0.0);
}

// ✅ DEBUG INTEGRATION: Calculate debug values using existing system
void calculateDebugValues(vec3 worldPos, vec4 seeds, int debugMode, int stage) {
  if (debugMode == 1) { // DIGITAL AWAKENING Stage Colors
    vDebugColor = uDebugColor;
    vDebugValue = float(stage) / 4.0;
  }
  else if (debugMode == 2) { // Cognitive Grid
    vec2 cognitiveGrid = worldPos.xy * 0.08;
    vDebugColor = vec3(abs(sin(cognitiveGrid.x * 10.0)), abs(cos(cognitiveGrid.y * 10.0)), 0.9);
    vDebugValue = cognitiveGrid.x + cognitiveGrid.y;
  }
  else if (debugMode == 3) { // Cognitive Seeds
    vDebugColor = abs(seeds.xyz);
    vDebugValue = seeds.w;
  }
  else if (debugMode == 4) { // Cognitive Load Heatmap
    float cognitiveDistance = length(worldPos.xy) / 25.0;
    float loadIntensity = 0.3 + float(stage) * 0.175; // Cognitive load by stage
    vDebugColor = vec3(loadIntensity, 1.0 - loadIntensity, cognitiveDistance);
    vDebugValue = loadIntensity;
  }
  else if (debugMode == 5) { // DIGITAL AWAKENING Progression
    vDebugColor = vec3(uStageProgress, float(stage) / 4.0, 1.0);
    vDebugValue = uStageProgress;
  }
  else if (debugMode == 6) { // Particle Cognitive IDs
    float particleId = seeds.x;
    vDebugColor = vec3(
      abs(sin(particleId * 10.0)), 
      abs(cos(particleId * 15.0)), 
      abs(sin(particleId * 20.0))
    );
    vDebugValue = particleId;
  }
  else {
    vDebugColor = vec3(1.0);
    vDebugValue = 0.0;
  }
}

// ────────────────  MAIN ──────────────────────────────────────────────────
void main() {
  vec3 p = position;                // working position
  float t = uTime * 0.6;           // ✅ DIGITAL AWAKENING: Slightly faster for cognitive dynamics
  vec4 cognitiveSeeds = animationSeeds; // ✅ REUSE: Existing attribute as cognitive seeds

  // Distance from centre (for core protection)
  float dCentre = length(p.xy);

  // ✅ DIGITAL AWAKENING: Apply Curtis Whorton's cognitive transformation patterns
  vec3 digitalAwakeningMovement = calculateDigitalAwakeningPattern(p, t, cognitiveSeeds, uStage, uStageProgress);
  p += digitalAwakeningMovement;

  // ✅ EXISTING: Add living movement (mapped to cognitive breathing)
  p += livingMovement(p, t);

  // ✅ EXISTING: Add flag wave (mapped to cognitive wave patterns)
  p += flagWave(p, t);

  // ✅ DIGITAL AWAKENING: Z-axis cognitive breathing (replaces old radiation)
  float cognitiveLoad = 0.3 + float(uStage) * 0.175; // Stage-based cognitive load
  p.z += cognitiveBreathing(p, t, float(uStage), cognitiveLoad) * 2.5;

  // ✅ DIGITAL AWAKENING: Apply core protection during transformation
  p = applyCognitiveProtection(p, uCursorPos, uCursorRadius, uRepulsionStrength);

  // ✅ MAINTAINED: Ripple effect with cognitive core protection
  float rippleAmp = 0.0;
  if (uRippleEnabled && uRippleStrength > 0.0) {
    vec3 v = p - uRippleCenter;
    float dr = length(v.xy);
    if (dr > COGNITIVE_CORE_RADIUS && dr < MAX_INTERACTION_DISTANCE) {
      float age = uTime - uRippleTime;
      float w = sin(dr * 0.4 - age * 12.0) * exp(-dr * 0.05 - age * 0.5);
      w = clamp(w * uRippleStrength, -0.16, 0.16);
      vec2 dir = normalize(v.xy + vec2(1e-4));
      p.z += w;             // Z-axis ripple
      p.xy += dir * w * 0.12; // Minimal XY displacement
      rippleAmp = abs(w);
    }
  }

  // ✅ MAINTAINED: Aurora effect (cognitive shimmer)
  if (uAuroraEnabled && uAuroraIntensity > 0.0) {
    float cognitiveShimmer = sin(p.x * 0.3 + uTime * uAuroraSpeed) *
                            cos(p.y * 0.25 + uTime * uAuroraSpeed * 0.8);
    p.z += cognitiveShimmer * uAuroraIntensity * 1.0;
  }

  // ✅ DIGITAL AWAKENING: Store cognitive state and debug values
  vCognitiveState = float(uStage) / 4.0; // 0.0-1.0 cognitive progression
  vLifetime = cognitiveSeeds.z;
  vWaveIntensity = rippleAmp;
  vWorldPosition = p;
  vDistanceFromCenter = dCentre;

  // ✅ DEBUG INTEGRATION: Calculate debug values
  calculateDebugValues(p, cognitiveSeeds, uDebugMode, uStage);

  // ✅ MAINTAINED: Final position and size calculation
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  // ✅ DIGITAL AWAKENING: Size scaling based on cognitive stage complexity
  float cognitiveScale = 1.0 + float(uStage) * 0.3; // Larger with complexity
  float baseSize = uSize * (300.0 / -mv.z) * cognitiveScale;
  gl_PointSize = clamp(baseSize, 1.0, 24.0); // Increased max for cognitive visualization
}

/*
🧠 DIGITAL AWAKENING VERTEX SHADER - CURTIS WHORTON'S COGNITIVE TRANSFORMATION ✅

✅ COGNITIVE TRANSFORMATION STAGES:
- Genesis (0): Curtis struggling alone - scattered, reactive, amygdala-driven chaos
- Silent (1): "Something needs to change" - processing, questioning patterns
- Awakening (2): "Teach me to code" breakthrough - rapid neural reorganization  
- Acceleration (3): Strategic AI-enhanced development - prefrontal cortex dominance
- Transcendence (4): Human-AI collaborative mastery - unified consciousness

✅ NEURAL SHIFT MOVEMENT PATTERNS:
- reactiveScatter: Chaotic, defensive movements (amygdala baseline)
- questioningOscillation: Contemplative, processing patterns (transition)
- perspectiveShift: Dramatic reorganization during breakthrough
- strategicFlow: Efficient, organized, purposeful movement (prefrontal)
- consciousBreathe: Harmonious consciousness integration (mastery)

✅ COMPATIBILITY MAINTAINED:
- Uses existing uniform structure with DIGITAL AWAKENING enhancements
- No built-in attribute redeclaration (prevents compilation errors)
- Maps cognitive states to existing effect uniforms
- Maintains debug system integration (Alt+D, Alt+O, Alt+I)

✅ COGNITIVE CORE PROTECTION:
- Preserves Curtis's core identity (Marine discipline) during transformation
- Gentle interaction beyond protected cognitive center
- Allows growth while maintaining foundational values

This shader transforms particles into authentic visualization of Curtis Whorton's
DIGITAL AWAKENING - representing the cognitive journey from reactive to strategic
thinking that enabled unprecedented human-AI collaborative development! 🧠⚡
*/
// src/components/webgl/shaders/fragment.glsl - DIGITAL AWAKENING COGNITIVE TRANSFORMATION
// ✅ FIXED: Removed varying assignments that caused compilation errors
// ✅ CURTIS WHORTON: Cognitive state colors representing amygdala → prefrontal cortex journey

// ────────────────  UNIFORMS (MATCHING VERTEX SHADER) ──────────────────────
uniform float uTime;
uniform int uStage;               // 0-4 DIGITAL AWAKENING stages
uniform float uStageProgress;     // 0-1 within current stage
uniform vec3 uStageColor;         // Current DIGITAL AWAKENING stage color
uniform float uAuroraIntensity;   // Cognitive shimmer intensity
uniform float uShimmerIntensity;  // Cognitive complexity shimmer

// Debug uniforms (existing system)
uniform int uDebugMode;
uniform float uDebugIntensity;
uniform vec3 uDebugColor;
uniform bool uShowDebugOverlay;

// ────────────────  VARYINGS (EXACT MATCH WITH VERTEX SHADER) ─────────────
// ✅ READ-ONLY: These are calculated in vertex shader, only read here
varying float vLifetime;
varying float vWaveIntensity;
varying vec3  vWorldPosition;
varying float vDistanceFromCenter;
varying float vCognitiveState;    // 0.0-1.0 cognitive progression
varying vec3  vDebugColor;        // ✅ READ-ONLY: Set by vertex shader
varying float vDebugValue;        // ✅ READ-ONLY: Set by vertex shader

// ────────────────  DIGITAL AWAKENING COGNITIVE COLORS ────────────────────
vec3 getDigitalAwakeningColor(int stage, float progress, float lifetime) {
  vec3 stageColor;
  
  if (stage == 0) {
    // GENESIS: Curtis struggling alone - scattered, reactive (amygdala dominance)
    // Colors: Bright greens representing struggle and isolation
    vec3 primaryGreen = vec3(0.133, 0.773, 0.369);   // #22c55e
    vec3 secondaryGreen = vec3(0.086, 0.639, 0.290); // #16a34a
    vec3 deepGreen = vec3(0.082, 0.502, 0.239);      // #15803d
    
    // Anxious, scattered color mixing
    float anxiousMix = sin(vWorldPosition.x * 0.5 + uTime * 3.0) * 0.5 + 0.5;
    stageColor = mix(primaryGreen, mix(secondaryGreen, deepGreen, progress), anxiousMix);
    
  } else if (stage == 1) {
    // SILENT: "Something needs to change" - processing, questioning
    // Colors: Bright blues representing contemplation and preparation
    vec3 primaryBlue = vec3(0.231, 0.510, 0.961);    // #3b82f6
    vec3 secondaryBlue = vec3(0.149, 0.388, 0.922);  // #2563eb
    vec3 deepBlue = vec3(0.114, 0.306, 0.847);       // #1d4ed8
    
    // Contemplative, processing color mixing
    float contemplativeMix = sin(vWorldPosition.y * 0.3 + uTime * 1.5) * 0.5 + 0.5;
    stageColor = mix(primaryBlue, mix(secondaryBlue, deepBlue, progress), contemplativeMix);
    
  } else if (stage == 2) {
    // AWAKENING: "Teach me to code" breakthrough - neural reorganization
    // Colors: Bright purples representing breakthrough and transformation
    vec3 primaryPurple = vec3(0.659, 0.333, 0.969);  // #a855f7
    vec3 secondaryPurple = vec3(0.576, 0.200, 0.918); // #9333ea
    vec3 deepPurple = vec3(0.486, 0.227, 0.929);     // #7c3aed
    
    // Breakthrough, explosive color mixing
    float breakthroughMix = sin(vWorldPosition.x * 0.8 + uTime * 5.0) * 
                           cos(vWorldPosition.y * 0.6 + uTime * 4.0) * 0.5 + 0.5;
    stageColor = mix(primaryPurple, mix(secondaryPurple, deepPurple, progress), breakthroughMix);
    
    // Add breakthrough flash effect
    float breakthroughFlash = sin(uTime * 8.0 + vCognitiveState * 10.0) * progress * 0.3;
    stageColor += vec3(breakthroughFlash);
    
  } else if (stage == 3) {
    // ACCELERATION: Strategic AI-enhanced development - prefrontal cortex dominance
    // Colors: Bright cyans representing strategic thinking and efficiency
    vec3 primaryCyan = vec3(0.024, 0.714, 0.831);    // #06b6d4
    vec3 secondaryCyan = vec3(0.034, 0.569, 0.698);  // #0891b2
    vec3 deepCyan = vec3(0.055, 0.455, 0.565);       // #0e7490
    
    // Strategic, efficient color mixing
    float strategicMix = sin(vWorldPosition.x * 0.2 + uTime * 1.2) * 
                        cos(vWorldPosition.y * 0.15 + uTime * 1.0) * 0.5 + 0.5;
    stageColor = mix(primaryCyan, mix(secondaryCyan, deepCyan, progress), strategicMix);
    
  } else if (stage == 4) {
    // TRANSCENDENCE: Human-AI collaborative mastery - unified consciousness
    // Colors: Bright golds representing mastery and enlightenment
    vec3 primaryGold = vec3(0.961, 0.620, 0.043);    // #f59e0b
    vec3 secondaryGold = vec3(0.851, 0.467, 0.024);  // #d97706
    vec3 deepGold = vec3(0.706, 0.325, 0.035);       // #b45309
    
    // Unified, harmonious color mixing
    float radius = length(vWorldPosition.xy);
    float unifiedMix = sin(radius * 0.1 + uTime * 0.8) * 
                      cos(atan(vWorldPosition.y, vWorldPosition.x) + uTime * 0.4) * 0.5 + 0.5;
    stageColor = mix(primaryGold, mix(secondaryGold, deepGold, progress), unifiedMix);
    
    // Add consciousness glow
    float consciousnessGlow = sin(uTime * 2.0 + radius * 0.05) * 0.2;
    stageColor += vec3(consciousnessGlow * 0.8, consciousnessGlow * 0.6, consciousnessGlow * 0.2);
  }
  
  return stageColor;
}

// ────────────────  PARTICLE SHAPE & EFFECTS ──────────────────────────────
float getParticleShape(vec2 coord) {
  // Create soft circular particle with cognitive complexity
  vec2 centered = coord - 0.5;
  float dist = length(centered);
  
  // Soft circular falloff with cognitive complexity variation
  float cognitiveComplexity = 1.0 + vCognitiveState * 0.5;
  float shape = 1.0 - smoothstep(0.0, 0.5 * cognitiveComplexity, dist);
  
  // Add cognitive shimmer to edges
  float shimmer = sin(dist * 10.0 + uTime * 4.0) * 0.1 + 0.9;
  shape *= shimmer;
  
  return shape;
}

float getCognitiveIntensity() {
  // Base intensity varies by cognitive state
  float baseIntensity = 0.6 + vCognitiveState * 0.4; // Brighter with higher cognition
  
  // Add wave intensity for interaction feedback
  float waveBoost = vWaveIntensity * 0.4;
  
  // Add distance-based intensity (closer to center = more intense)
  float distanceIntensity = 1.0 - clamp(vDistanceFromCenter / 30.0, 0.0, 0.6);
  
  // Cognitive shimmer based on stage
  float cognitiveShimmer = sin(uTime * 2.0 + vCognitiveState * 8.0) * 0.15 + 0.85;
  
  return (baseIntensity + waveBoost + distanceIntensity) * cognitiveShimmer;
}

// ────────────────  DEBUG VISUALIZATION ────────────────────────────────────
// ✅ FIXED: Use debug values computed in vertex shader (READ-ONLY)
vec3 applyDebugVisualization(vec3 baseColor, float baseAlpha) {
  if (uDebugMode == 0) return baseColor;
  
  vec3 debugColor = baseColor;
  float debugIntensity = uDebugIntensity;
  
  // ✅ READ-ONLY: Use vDebugColor computed in vertex shader
  if (uDebugMode >= 1 && uDebugMode <= 6) {
    debugColor = mix(baseColor, vDebugColor, debugIntensity * 0.7);
  }
  
  // Add debug overlay if enabled
  if (uShowDebugOverlay) {
    float gridLine = step(0.95, fract(vWorldPosition.x * 0.1)) + 
                     step(0.95, fract(vWorldPosition.y * 0.1));
    debugColor += vec3(gridLine * 0.3);
  }
  
  return debugColor;
}

// ────────────────  MAIN ────────────────────────────────────────────────────
void main() {
  // Get particle shape
  float particleShape = getParticleShape(gl_PointCoord);
  
  // Early discard for performance
  if (particleShape < 0.01) discard;
  
  // Get DIGITAL AWAKENING stage color
  vec3 stageColor = getDigitalAwakeningColor(uStage, uStageProgress, vLifetime);
  
  // Apply cognitive intensity
  float cognitiveIntensity = getCognitiveIntensity();
  
  // Calculate base alpha with cognitive enhancement
  float baseAlpha = particleShape * cognitiveIntensity;
  
  // Enhanced alpha for higher cognitive states
  baseAlpha *= (0.6 + vCognitiveState * 0.4);
  
  // Apply debug visualization
  vec3 finalColor = applyDebugVisualization(stageColor, baseAlpha);
  
  // Add cognitive shimmer effect
  float shimmerEffect = sin(uTime * 3.0 + vWorldPosition.x * 0.5) * 
                       cos(uTime * 2.5 + vWorldPosition.y * 0.4) * 
                       uShimmerIntensity * 0.2;
  finalColor += vec3(shimmerEffect);
  
  // Add aurora cognitive glow
  float auroraGlow = sin(uTime * 1.5 + length(vWorldPosition.xy) * 0.1) * 
                     uAuroraIntensity * 0.3;
  finalColor += vec3(auroraGlow * 0.6, auroraGlow * 0.4, auroraGlow * 0.8);
  
  // Ensure visibility - make particles brighter
  finalColor *= 1.6; // ✅ ENHANCED: 60% brighter for proper visibility
  
  // Final alpha with enhanced visibility
  float finalAlpha = clamp(baseAlpha * 1.3, 0.0, 1.0); // ✅ ENHANCED: 30% more visible
  
  gl_FragColor = vec4(finalColor, finalAlpha);
}

/*
🧠 DIGITAL AWAKENING FRAGMENT SHADER - CURTIS WHORTON'S COGNITIVE COLORS ✅

✅ COMPILATION FIXED:
- Removed all varying assignments (vDebugColor, vDebugValue are READ-ONLY)
- Eliminated calculateNeuralDebugValues function (moved to vertex shader)
- Uses debug values computed in vertex shader only
- No more "l-value required" errors

✅ DIGITAL AWAKENING COLOR STAGES:
- Genesis (0): Bright greens - Curtis struggling alone (amygdala dominance)
- Silent (1): Bright blues - "Something needs to change" (processing)
- Awakening (2): Bright purples - "Teach me to code" breakthrough
- Acceleration (3): Bright cyans - Strategic AI-enhanced development
- Transcendence (4): Bright golds - Human-AI collaborative mastery

✅ ENHANCED VISIBILITY:
- Increased brightness by 60% for clear particle definition
- Enhanced alpha by 30% for better visibility
- Maintained cognitive visual effects and stage progression

✅ DEBUG INTEGRATION:
- Uses vertex shader debug values (read-only)
- Complete debug mode support maintained
- Debug overlay support functional

This fixed fragment shader eliminates all compilation errors while maintaining
Curtis Whorton's DIGITAL AWAKENING cognitive transformation visualization! 🧠⚡
*/
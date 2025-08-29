# Particle Living Behavior Documentation

## The "Living Line" Effect in HEL Letters

The organic movement comes from individual particle autonomy:

### Key Attributes for Living Effect:
- **animationPhase**: Each particle has unique phase (0 to 2π)
- **jitterOffset**: Small position variations (±0.2 units)
- **sizeBreathing**: Size oscillation (0.8x to 1.2x)
- **opacityPulse**: Alpha variation (0.6 to 1.0)

### Implementation for CTF:

```javascript
// In CTFAnimationSystem
buildLivingBehavior() {
  const N = this.ctf.count;
  const phase = new Float32Array(N);
  const jitter = new Float32Array(N * 3);
  const breathe = new Float32Array(N);
  
  for (let i = 0; i < N; i++) {
    // Unique phase per particle
    phase[i] = Math.random() * Math.PI * 2;
    
    // Position jitter for organic movement
    jitter[i * 3] = (Math.random() - 0.5) * 0.2;
    jitter[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
    jitter[i * 3 + 2] = 0;
    
    // Breathing rate variation
    breathe[i] = 0.8 + Math.random() * 0.4;
  }
  
  return { phase, jitter, breathe };
}
```

### Vertex Shader for Living Effect:

```glsl
attribute float aPhase;
attribute vec3 aJitter;
attribute float aBreathe;

uniform float uTime;

void main() {
  // Living offset calculation
  float wave = sin(uTime * 2.0 + aPhase);
  vec3 aliveOffset = aJitter * wave * 0.5;
  
  // Size breathing
  float size = baseSize * (1.0 + wave * aBreathe * 0.2);
  
  vec3 finalPosition = position + aliveOffset;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPosition, 1.0);
  gl_PointSize = size;
}
```

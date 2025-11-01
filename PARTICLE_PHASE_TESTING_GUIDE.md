# 🧪 PARTICLE_PHASE Visual Effects - Testing Guide

## 📋 Quick Verification Steps

### 1. Browser Console Diagnostic (30 seconds)

Open browser console and run:

```javascript
// Check if listener is registered
console.log('Listener count:', BeatBus.listenerCount('PARTICLE_PHASE'));

// Should show: 2 or 3 (WebGLBackground + other listeners)
```

### 2. Manual Phase Test (1 minute)

Test each phase individually:

```javascript
// Test chaos phase
BeatBus.emit('PARTICLE_PHASE', { 
  phase: 'chaos', 
  duration: 2000,
  rendererSpin: { z: 0.5, y: 0.2 }
});

// Wait 3 seconds, then test coalesce
BeatBus.emit('PARTICLE_PHASE', { 
  phase: 'coalesce', 
  duration: 2000 
});

// Wait 3 seconds, then test settle
BeatBus.emit('PARTICLE_PHASE', { 
  phase: 'settle', 
  duration: 1500 
});
```

**Expected Console Output After Each Emission:**
```
🌊 [OPENING PHASE] {phase: 'chaos', duration: 2000, ...}
🌪️ [CHAOS] Starting random motion
   Set uTurbulence = 0.8
   Set uSpeedMultiplier = 1.5
   Set uMotionMode = 1 (chaos)
   Set uDriftAmp = 2.0
   Applied renderer spin: {z: 0.5, y: 0.2}
```

### 3. Check Uniform Values (30 seconds)

```javascript
// Get current renderer state
const snapshot = window.getRendererSnapshot();
console.log(snapshot);

// Should show something like:
// {
//   morph: 0.5,
//   pointSize: 48,
//   freeze: 0,
//   drawCount: 15000
// }
```

To check specific uniforms:

```javascript
// Access renderer diagnostics (if exposed)
if (window.__rendererDiagnostics) {
  console.log('uTurbulence:', window.__rendererDiagnostics.getUniformValue('uTurbulence'));
  console.log('uMotionMode:', window.__rendererDiagnostics.getUniformValue('uMotionMode'));
  console.log('uSpeedMultiplier:', window.__rendererDiagnostics.getUniformValue('uSpeedMultiplier'));
}
```

### 4. Visual Verification

Watch particles during opening sequence:

#### Chaos Phase (Expected)
- ✅ Particles moving chaotically/randomly
- ✅ High turbulence/jitter
- ✅ Screen rotating if rendererSpin configured
- ✅ Fast, erratic motion

#### Coalesce Phase (Expected)
- ✅ Motion slowing down
- ✅ Particles beginning to form patterns
- ✅ Less turbulence than chaos
- ✅ Gradual organization

#### Settle Phase (Expected)
- ✅ Particles locking into final positions
- ✅ Minimal/no turbulence
- ✅ Stable formation (word/constellation)
- ✅ Morph complete (value = 1.0)

---

## 🔍 Debugging: No Visual Changes?

### Problem: Listener fires but no visual effect

**Check 1: Uniforms exist?**
```javascript
const mat = document.querySelector('points')?.material;
console.log('Uniforms:', mat ? Object.keys(mat.uniforms) : 'no material');
```

**Expected to see:**
- `uTurbulence`
- `uMotionMode`  
- `uSpeedMultiplier`
- `uDriftAmp`
- `uMorphProgress`

**If missing:** These uniforms need to be added to the shader and material initialization.

### Problem: Events not reaching listener

**Check 2: Listener registered?**
```javascript
console.log('PARTICLE_PHASE listeners:', BeatBus.listenerCount('PARTICLE_PHASE'));
```

**Expected:** 2 or more

**If 0 or 1:** Listener didn't register. Check React component lifecycle.

### Problem: Listener fires once then stops

**Check 3: Component unmounted?**
```javascript
// This should exist if component mounted
console.log('Renderer active:', !!window.getRendererSnapshot);
```

**If false:** Component unmounted. Check parent component lifecycle.

---

## 🎯 Success Criteria

✅ **Phase 1: Console Logs Working**
- See 🌊/🌪️/🌀/🎯 logs when phases trigger
- See "Set uTurbulence = X" logs
- See "Set uMotionMode = X" logs

✅ **Phase 2: Uniforms Updating**
- `window.__rendererDiagnostics.getUniformValue('uTurbulence')` changes per phase
- Material `uniformsNeedUpdate` flag set to true

✅ **Phase 3: Visual Motion Changes**
- Particles actually move differently in each phase
- Chaos = chaotic, Coalesce = organizing, Settle = locked

---

## 📊 Verification Matrix

| Phase | uTurbulence | uMotionMode | uSpeedMultiplier | uDriftAmp | Visual |
|-------|------------|-------------|------------------|-----------|--------|
| Chaos | 0.8 | 1 | 1.5 | 2.0 | Chaotic motion |
| Coalesce | 0.3 | 2 | 1.0 | 0.8 | Forming pattern |
| Settle | 0.0 | 3 | 0.5 | 0.2 | Locked/stable |

---

## 🚨 Known Issues / Limitations

### Issue 1: Uniforms Don't Exist
**Symptom:** Console shows warnings about missing uniforms  
**Cause:** Shader doesn't have these uniforms defined  
**Fix:** Add uniforms to shader template and material creation

### Issue 2: Visual Changes Too Subtle
**Symptom:** Particles move but change is hard to see  
**Cause:** Uniform values too conservative  
**Fix:** Increase values (e.g., uTurbulence = 1.5 for chaos)

### Issue 3: Phases Overlap
**Symptom:** Next phase starts before previous finishes  
**Cause:** Timing in OpeningSequenceController too fast  
**Fix:** Increase phase durations in SST config

---

## 🛠️ Next Steps if Fix Incomplete

### If uniforms are missing:

1. Check shader template: `src/shaders/templates/consciousness-vertex.glsl`
2. Look for motion-related uniforms
3. Add missing uniforms:
   ```glsl
   uniform float uTurbulence;
   uniform float uMotionMode;
   uniform float uSpeedMultiplier;
   uniform float uDriftAmp;
   ```

4. Update material creation in `createRendererMaterial.js`

### If visual effects still not visible:

1. Ensure shader vertex shader actually USES these uniforms
2. Check if particle positions are being recalculated per frame
3. Verify `useFrame` hook is running
4. Check if `renderGuardRef.current` is blocking updates

---

## 📞 Support

If you still see no visual changes after:
1. ✅ Console logs show uniform updates
2. ✅ Uniforms exist in material
3. ✅ No errors in console

Then the issue is likely in the **shader implementation** or **particle position calculation**, not the event system.

**Next diagnostic:** Examine vertex shader to see if it responds to these uniforms.

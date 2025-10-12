# MetaCurtis AI Partner Field Manual v1.0
## The Definitive Debugging & Development Guide

**Document Status:** 📘 OPERATIONAL REFERENCE  
**Version:** 1.0  
**Last Updated:** 2025-01-11  
**Authority:** ABSOLUTE - All AI partners must reference this document  
**Purpose:** Enable any AI assistant to diagnose and fix issues across the entire MetaCurtis velocity stack

---

## 🎯 QUICK START FOR AI PARTNERS

### Your First 3 Minutes

**When you receive a bug report or development task:**

1. **Identify the Layer** (Use the symptom guide in Section 3)
2. **Run the Diagnostic** (Section 4 - Layer-specific checks)
3. **Apply the Protocol** (Section 5 - Layer-specific fixes)

**Golden Rule:** Always validate after changes. Never commit without testing.

---

## 📋 TABLE OF CONTENTS

1. **System Architecture Overview** - What you're working with
2. **The 4 Velocity Layers** - Deep dive into each layer
3. **Symptom-to-Layer Mapping** - Quick diagnosis guide
4. **Layer-Specific Diagnostic Protocols** - How to investigate
5. **Layer-Specific Fix Protocols** - How to repair
6. **Cross-Layer Dependencies** - How layers interact
7. **Validation Procedures** - How to verify fixes
8. **Common Failure Patterns** - Recognize these quickly
9. **Emergency Rollback Procedures** - When things go wrong
10. **Reference: File Map** - Where everything lives

---

## 1. SYSTEM ARCHITECTURE OVERVIEW

### The MetaCurtis Stack

```
┌─────────────────────────────────────────────────────┐
│              USER EXPERIENCE LAYER                  │
│         (Visual Tests Validate This)                │
└─────────────────────────────────────────────────────┘
                         ▲
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
┌───▼───┐          ┌─────▼────┐         ┌────▼────┐
│LAYER 4│          │ LAYER 3  │         │LAYER 2  │
│Quality│◄────────►│Instrument│◄───────►│Contract │
│Shields│          │ation     │         │Enforce. │
└───▲───┘          └─────▲────┘         └────▲────┘
    │                    │                    │
    └────────────────────┼────────────────────┘
                         │
                    ┌────▼────┐
                    │ LAYER 1 │
                    │Constitu-│
                    │ tional  │
                    └─────────┘
```

**Layer Flow:**
1. **Layer 1** (Constitutional) → Defines configuration truth
2. **Layer 2** (Contracts) → Validates logic against Layer 1
3. **Layer 3** (Instrumentation) → Provides runtime feedback
4. **Layer 4** (Quality) → Validates user-facing behavior

**Critical Principle:** Lower layers support higher layers. Fix from bottom up.

---

## 2. THE 4 VELOCITY LAYERS (DEEP DIVE)

### LAYER 1: CONSTITUTIONAL GROUNDING (Configuration Truth)

**Purpose:** Single Source of Truth for all configuration  
**Velocity Gain:** 2-3x (prevents config drift)  
**Files:**
- `sst/canon/v3.5.json` - Master configuration
- `sst/canon/v3.5.schema.json` - Validation schema
- `sst/tools/validate-sst.cjs` - Validation script
- `sst/tools/detect-drift.cjs` - Drift detection
- `.husky/pre-commit` - Enforcement hook

**Philosophy:**  
Configuration is **law**. Code must reference the SST, never hardcode values. This prevents:
- Magic numbers scattered in code
- Configuration drift over time
- Inconsistent stage definitions
- Merge conflicts on config values

**Key Concepts:**

1. **SST v3.5 Structure:**
```json
{
  "stages": {
    "genesis": {
      "slug": "genesis",
      "particlesBase": 2000,
      "colors": ["#00FF00", "#22c55e"],
      "brainRegion": "hippocampus",
      ...
    }
  },
  "performance": {
    "frameRate": { "target": 60, "minimum": 55 }
  },
  "visual": {
    "letterGeometry": { ... }
  }
}
```

2. **How Code References SST:**
```javascript
// ✅ CORRECT
import SST from '@/config/sst-loader.js';
const particleCount = SST.stages.genesis.particlesBase;

// ❌ WRONG
const particleCount = 2000; // Drift detection will catch this
```

3. **Validation Flow:**
```
Developer edits SST → Git add → Pre-commit hook →
validate-sst (schema check) → detect-drift (hardcode check) →
If pass: commit allowed | If fail: commit blocked
```

**What Can Break:**
- Schema mismatch (SST doesn't match v3.5.schema.json)
- Missing required fields
- Invalid data types
- Hardcoded values in code that should use SST

**How to Diagnose:**
```bash
npm run validate-sst        # Check schema
npm run detect-drift        # Check for hardcoded values
```

**How to Fix:**
1. Schema errors → Update SST to match schema
2. Drift detected → Replace hardcoded value with SST reference
3. Missing fields → Add field to SST with correct type

---

### LAYER 2: CONTRACT ENFORCEMENT (Logic Validation)

**Purpose:** Validate engine behavior before browser testing  
**Velocity Gain:** 2x (catch bugs earlier)  
**Files:**
- `tests/contracts/blueprint-tests.js` - Contract test suite
- Blueprint validation logic
- Event schema validation

**Philosophy:**  
Contracts define **behavioral expectations**. Engine must fulfill contracts before visual testing. This prevents:
- Runtime errors that only show up in browser
- Silent failures that corrupt state
- Event schema violations
- Blueprint generation bugs

**Key Concepts:**

1. **Blueprint Contract:**
```javascript
// Engine must generate valid blueprints
{
  stage: "genesis",          // Must be valid stage name
  particleCount: 2000,       // Must match SST
  colors: [...],             // Must match SST
  positions: Float32Array,   // Must be correct type
  // All fields validated
}
```

2. **Event Contract:**
```javascript
// All events must have:
{
  ev: "WBG:FENCEPOST",    // Event name
  t: 12345.6,              // Timestamp
  // Additional event-specific fields
}
```

3. **Test Execution Flow:**
```
npm run test:contracts →
Blueprint validation (schema + SST match) →
Event validation (schema + ordering) →
If pass: proceed to visual tests | If fail: fix engine
```

**What Can Break:**
- Blueprint missing required fields
- Blueprint values don't match SST
- Event missing timestamp or name
- Event ordering violation (e.g., fencepost before bind)

**How to Diagnose:**
```bash
npm run test:contracts
# Read error message - it will tell you which contract failed
```

**How to Fix:**
1. Blueprint error → Check `src/engine/ConsciousnessEngine.js` blueprint generation
2. Event error → Check event emission in `src/components/webgl/WebGLBackground.jsx`
3. Schema mismatch → Update blueprint/event to match contract expectations

---

### LAYER 3: INSTRUMENTATION (Runtime Feedback)

**Purpose:** Provide real-time visibility into system behavior  
**Velocity Gain:** 6-10x shader iteration, 2x debugging  
**Components:**

#### 3a. Shader HMR (Hot Module Replacement)
**Files:**
- `vite.config.js` - Shader HMR plugin
- `src/main.jsx` - HMR listener

**Purpose:** <500ms shader updates without page reload

**How it Works:**
```
Edit .glsl file → Vite detects change →
Custom plugin emits 'glsl-update' event →
Client listener receives event →
Toast notification + console log →
Shader reloads
```

**What Can Break:**
- Vite config missing plugin
- HMR listener not attached
- Toast utility not loaded
- Shader compilation errors

**How to Diagnose:**
```bash
npm run dev
# Edit a .glsl file
# Check console for: "[SHADER HMR] filename.glsl updated"
# Check for green toast notification
```

**How to Fix:**
1. No console message → Check `vite.config.js` has shaderHMR plugin
2. No toast → Check `src/main.jsx` has HMR listener + toast import
3. Shader errors → Check shader syntax in browser console

#### 3b. Probe System (Real-Time Metrics)
**File:** `src/config/canonical/canonicalAuthority.js`

**Purpose:** Instant access to FPS, particle counts, geometry bounds

**API:**
```javascript
window.probe.draw()   // {active: 2000, draw: 2000, match: true}
window.probe.fps()    // 60.0
window.probe.aabb()   // {centerX, centerY, extX, extY}
window.probe.depth()  // {min, max, range}
```

**What Can Break:**
- Probe not initialized
- Probe methods return undefined
- Probe attached to wrong object

**How to Diagnose:**
```javascript
// In browser console
typeof window.probe           // Should be 'object'
typeof window.probe.draw      // Should be 'function'
window.probe.draw()           // Should return object with data
```

**How to Fix:**
1. Probe undefined → Check `canonicalAuthority.js` initialization
2. Methods missing → Check probe object structure
3. No data → Check probe is reading from correct source

#### 3c. Probe History (Temporal Debugging)
**File:** `src/config/canonical/canonicalAuthority.js`

**Purpose:** Record and analyze performance over time

**API:**
```javascript
probe.history.start()      // Start recording
probe.history.stop()       // Stop recording
probe.history.analyze()    // Get stats (FPS, memory, drops)
probe.history.query(fn)    // Find specific samples
probe.history.plot('fps')  // ASCII visualization
probe.history.export()     // JSON export
```

**What Can Break:**
- History not initialized
- Recording not capturing data
- Analysis returns empty results

**How to Diagnose:**
```javascript
probe.history.start()
// Wait 3 seconds
probe.history.stop()
probe.history.samples.length  // Should be > 0
```

**How to Fix:**
1. No samples → Check `history.record()` is called in `probe.draw()` wrapper
2. Missing methods → Check `createProbeHistory()` function exists
3. No auto-record → Check probe.draw wrapper implementation

#### 3d. Trace System (Event Monitoring)
**File:** `src/main.jsx`

**Purpose:** Record all system events for fencepost validation

**API:**
```javascript
window.__trace           // Array of events
window.dumpTrace()       // Get copy of trace
window.clearTrace()      // Reset trace
window.pushTrace(event)  // Add event
```

**What Can Break:**
- Trace not initialized
- Events not being pushed
- Trace array grows unbounded

**How to Diagnose:**
```javascript
window.dumpTrace()                    // Should return array
window.dumpTrace().length             // Should be > 0 after page loads
window.dumpTrace().find(e => e.ev === 'WBG:FENCEPOST')  // Should exist
```

**How to Fix:**
1. Trace empty → Check engine/renderer calling `pushTrace()`
2. Trace undefined → Check `src/main.jsx` initialization
3. Trace too large → Check circular buffer logic (limit 500)

#### 3e. Toast Notifications (Visual Feedback)
**File:** `src/utils/toast.js`

**Purpose:** Show visual feedback for HMR and events

**API:**
```javascript
window.toast('Message')
window.toast('Success!', { type: 'success' })
window.toast('Error!', { type: 'error', duration: 3000 })
```

**What Can Break:**
- Toast utility not loaded
- Toast doesn't appear
- Toast styling broken

**How to Diagnose:**
```javascript
typeof window.toast                    // Should be 'function'
window.toast('Test')                   // Should show green toast
```

**How to Fix:**
1. Toast undefined → Check `src/utils/toast.js` exists and exports `showToast`
2. Toast not visible → Check z-index and positioning in toast styles
3. Toast not called → Check HMR listener calls `window.toast()`

---

### LAYER 4: QUALITY SHIELDS (Automated Testing)

**Purpose:** Validate user-facing behavior automatically  
**Velocity Gain:** 3-5x (automated regression detection)  
**Files:**
- `playwright.config.js` - Test configuration
- `tests/visual/*.spec.ts` - Test suites
- `tests/visual/helpers.ts` - Test utilities
- `package.json` - Test scripts

**Philosophy:**  
Tests validate **end-to-end behavior**. They catch regressions before users see them. This prevents:
- Visual regressions from code changes
- Performance degradation
- Contract violations at runtime
- Race conditions and timing issues

**Key Concepts:**

1. **Test Types:**
```
Opening Sequence Tests (6 tests)
├── Fencepost contract validation
├── Event ordering checks
├── Morph settling validation
└── Geometry stability checks

Diagnostic Tests (3 tests)
├── Trace system verification
├── Global initialization checks
└── Event structure validation
```

2. **Helper Functions:**
```typescript
// Wait for fencepost contract
await waitForFencepostAndStage(page)
// Checks for WBG:FENCEPOST followed by WBG:BIND

// Wait for theater ready
await waitForTheaterReady(page)
// Ensures director initialized and trace active

// Sample geometry
const metrics = await sampleTextAabb(page)
// Returns {ratioX, ratioY, centerX, centerY}
```

3. **Serial Execution:**
```bash
# Tests run with --workers=1 to avoid race conditions
npm run test:visual
# Runs: playwright test tests/visual/ --workers=1
```

**What Can Break:**
- Tests timeout (45 seconds)
- Assertions fail
- Helpers don't find expected events
- Race conditions in parallel execution

**How to Diagnose:**
```bash
# Run specific test
npm run test:visual -- tests/visual/opening-sequence.spec.ts:55

# Run in headed mode (see browser)
npm run test:visual -- --headed

# Run with debug
npm run test:visual -- --debug

# Check test report
npx playwright show-report
```

**How to Fix by Error Type:**

**A. Timeout Errors:**
```
Error: page.waitForFunction: Test timeout of 45000ms exceeded
```
**Diagnosis:**
- Helper waiting for event that never fires
- Race condition on window.__trace
- Application failed to initialize

**Fix Protocol:**
1. Check `window.theaterDirector` exists in browser
2. Check `window.__trace` is array with events
3. Check specific event exists: `dumpTrace().find(e => e.ev === 'WBG:FENCEPOST')`
4. If missing, check engine/renderer emitting events
5. If timing issue, increase timeout or fix initialization order

**B. Assertion Errors:**
```
Error: expect(received).toBeCloseTo(expected, precision)
```
**Diagnosis:**
- Value outside expected range
- Animation not settled
- Precision too tight

**Fix Protocol:**
1. Check actual value vs expected (error shows both)
2. If close (within 1%), relax precision: `toBeCloseTo(1, 2)` instead of `toBeCloseTo(1, 3)`
3. If far off, investigate why value changed (geometry update? config change?)
4. Add settling time if animation: `await page.waitForTimeout(500)`

**C. Helper Errors:**
```
Error: waitForFencepostAndStage timeout
```
**Diagnosis:**
- Events not matching expected patterns
- Event property wrong ('tag' vs 'ev')
- Event ordering violated

**Fix Protocol:**
1. Run diagnostic test: `npm run test:visual -- tests/visual/debug-trace-tags.spec.ts`
2. Check trace structure matches helper expectations
3. Update helper to match actual event format
4. Verify fencepost comes before stage bind in trace

**D. Race Condition Errors:**
```
Sometimes pass, sometimes fail
```
**Diagnosis:**
- Parallel test execution
- Shared global state

**Fix Protocol:**
1. Ensure `--workers=1` in package.json test:visual script
2. Check helpers clear state: `window.clearTrace()`
3. Add `test.beforeEach()` cleanup if needed

---

## 3. SYMPTOM-TO-LAYER MAPPING (QUICK DIAGNOSIS)

Use this guide to quickly identify which layer has the problem:

### Configuration Issues → **LAYER 1**
- "Stage colors don't match design"
- "Particle count wrong"
- "Configuration values inconsistent"
- "Can't commit, validation fails"
- **Check:** `npm run validate-sst`

### Logic/Blueprint Issues → **LAYER 2**
- "Engine crashes on initialization"
- "Blueprint generation fails"
- "Events missing required fields"
- "Contract tests failing"
- **Check:** `npm run test:contracts`

### Iteration Speed Issues → **LAYER 3**
- "Shader changes take 5 seconds"
- "Can't see FPS"
- "No performance data"
- "Can't debug timing issues"
- **Check:** `npm run dev` + browser console

### Visual/Behavioral Issues → **LAYER 4**
- "Visual regression detected"
- "Tests timing out"
- "Fencepost contract violated"
- "Geometry bounds wrong"
- **Check:** `npm run test:visual`

### Cross-Layer Issues
If symptoms span multiple categories, check layers bottom-up:
1. Layer 1 (config correct?)
2. Layer 2 (contracts still pass?)
3. Layer 3 (instrumentation working?)
4. Layer 4 (tests pass?)

---

## 4. LAYER-SPECIFIC DIAGNOSTIC PROTOCOLS

### LAYER 1 DIAGNOSTIC

**Step 1: Validate Schema**
```bash
npm run validate-sst
```
**Expected Output:**
```
✅ Canonical config is valid.
```
**If Fails:** See error message for field/type mismatch

**Step 2: Check for Drift**
```bash
npm run detect-drift
```
**Expected Output:**
```
No drift detected
```
**If Fails:** See line numbers of hardcoded values

**Step 3: Manual Verification**
```bash
# Check SST structure
cat sst/canon/v3.5.json | jq '.stages.genesis'
# Should return genesis configuration

# Check schema exists
ls sst/canon/v3.5.schema.json
# Should exist
```

---

### LAYER 2 DIAGNOSTIC

**Step 1: Run Contract Tests**
```bash
npm run test:contracts
```
**Expected Output:**
```
18 passed (or similar number)
```

**Step 2: If Failures, Identify Type**
```bash
# Blueprint validation failure
grep -A 10 "blueprint" tests/contracts/blueprint-tests.js

# Event validation failure
grep -A 10 "event" tests/contracts/blueprint-tests.js
```

**Step 3: Manual Blueprint Check**
```javascript
// In browser console after engine initialization
window.lastBlueprint  // If exposed, check structure
// Should have: stage, particleCount, colors, positions, etc.
```

---

### LAYER 3 DIAGNOSTIC

**Step 1: Check Probe System**
```javascript
// In browser console
typeof window.probe                    // 'object'
typeof window.probe.history            // 'object'
window.probe.draw()                    // Returns data
window.probe.fps()                     // Returns number
```

**Step 2: Check Trace System**
```javascript
Array.isArray(window.__trace)          // true
window.__trace.length > 0              // true
window.dumpTrace()                     // Returns array
```

**Step 3: Check Shader HMR**
```bash
npm run dev
# Edit any .glsl file
# Check console for: "[SHADER HMR] filename.glsl updated"
# Check for toast notification
```

**Step 4: Check Toast System**
```javascript
typeof window.toast                    // 'function'
window.toast('Test')                   // Shows toast
```

---

### LAYER 4 DIAGNOSTIC

**Step 1: Run Visual Tests**
```bash
npm run test:visual
```
**Expected Output:**
```
9 passed (2-3 minutes)
```

**Step 2: If Failures, Check Specific Test**
```bash
# Run single test
npm run test:visual -- tests/visual/opening-sequence.spec.ts:55

# Run in headed mode
npm run test:visual -- --headed -g "keeps genesis morph settled"
```

**Step 3: Check Helper Functions**
```bash
# Run diagnostic tests
npm run test:visual -- tests/visual/debug-trace-tags.spec.ts
npm run test:visual -- tests/visual/debug-globals.spec.ts
```

**Step 4: Manual Validation**
```javascript
// In browser console
window.theaterDirector              // Should exist
window.__trace.length               // Should be > 100
window.probe                         // Should exist
```

---

## 5. LAYER-SPECIFIC FIX PROTOCOLS

### LAYER 1 FIXES

**Problem:** Schema validation fails
```bash
npm run validate-sst
# Error: stages.genesis.particlesBase: Expected number, received string
```

**Fix Protocol:**
1. Open `sst/canon/v3.5.json`
2. Find the field mentioned in error
3. Check `sst/canon/v3.5.schema.json` for expected type
4. Fix the value to match type
5. Re-validate: `npm run validate-sst`
6. Commit: `git commit -m "fix(sst): correct genesis.particlesBase type"`

---

**Problem:** Drift detected
```bash
npm run detect-drift
# Found hardcoded value: src/engine/ConsciousnessEngine.js:123
#   const particleCount = 2000;
```

**Fix Protocol:**
1. Open the file mentioned
2. Import SST loader: `import SST from '@/config/sst-loader.js';`
3. Replace hardcoded value: `const particleCount = SST.stages.genesis.particlesBase;`
4. Re-check: `npm run detect-drift`
5. Commit: `git commit -m "fix(drift): replace hardcoded particle count with SST reference"`

---

### LAYER 2 FIXES

**Problem:** Contract test fails - Blueprint validation
```bash
npm run test:contracts
# Blueprint validation failed: missing field 'colors'
```

**Fix Protocol:**
1. Open `src/engine/ConsciousnessEngine.js`
2. Find blueprint generation function
3. Add missing field:
```javascript
const blueprint = {
  stage: stageName,
  particleCount: SST.stages[stageName].particlesBase,
  colors: SST.stages[stageName].colors,  // ADD THIS
  positions: positionArray,
  // ... other fields
};
```
4. Re-test: `npm run test:contracts`
5. Commit: `git commit -m "fix(engine): add colors field to blueprint"`

---

**Problem:** Contract test fails - Event validation
```bash
npm run test:contracts
# Event validation failed: missing timestamp
```

**Fix Protocol:**
1. Open `src/components/webgl/WebGLBackground.jsx`
2. Find event emission: `pushTrace({ ev: 'WBG:FENCEPOST' })`
3. Add timestamp:
```javascript
pushTrace({
  t: performance.now(),  // ADD THIS
  ev: 'WBG:FENCEPOST',
  // ... other fields
});
```
4. Re-test: `npm run test:contracts`
5. Commit: `git commit -m "fix(events): add timestamp to fencepost event"`

---

### LAYER 3 FIXES

**Problem:** Shader HMR not working

**Fix Protocol:**
1. Check `vite.config.js` has plugin:
```javascript
function shaderHMR() {
  return {
    name: 'shader-hmr',
    handleHotUpdate({ file, server }) {
      if (file.endsWith('.glsl')) {
        server.ws.send({
          type: 'custom',
          event: 'glsl-update',
          data: { file }
        });
        return [];
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), shaderHMR()],  // Make sure it's here
  // ...
});
```

2. Check `src/main.jsx` has listener:
```javascript
if (import.meta.hot) {
  import.meta.hot.on('glsl-update', (data) => {
    console.log('🔥 Shader updated:', data.file);
    window.toast?.(`Shader updated: ${data.file.split('/').pop()}`, { type: 'success' });
  });
}
```

3. Test: Edit a .glsl file, check console and toast
4. Commit: `git commit -m "fix(hmr): restore shader hot module replacement"`

---

**Problem:** Probe history not recording

**Fix Protocol:**
1. Check `src/config/canonical/canonicalAuthority.js`:
```javascript
// Ensure probe.history exists
window.probe.history = createProbeHistory();

// Ensure auto-recording wrapper exists
const originalDraw = window.probe.draw;
window.probe.draw = function() {
  const result = originalDraw.call(this);
  if (window.probe.history) {
    window.probe.history.record({
      fps: window.probe.fps?.(),
      draw: result,
      memory: performance.memory?.usedJSHeapSize / 1048576
    });
  }
  return result;
};
```

2. Test in browser:
```javascript
probe.history.start()
// Wait 3 seconds
probe.history.stop()
probe.history.samples.length  // Should be > 0
```

3. Commit: `git commit -m "fix(probe): restore history recording wrapper"`

---

**Problem:** Trace not capturing events

**Fix Protocol:**
1. Check `src/main.jsx` initialization:
```javascript
if (!window.__trace) {
  window.__trace = [];
  window.dumpTrace = () => [...window.__trace];
  window.clearTrace = () => { window.__trace.length = 0; };
  window.pushTrace = (event) => {
    window.__trace.push({ t: performance.now(), ...event });
    if (window.__trace.length > 500) window.__trace.shift();
  };
}
```

2. Check engine/renderer calling pushTrace:
```javascript
// In ConsciousnessEngine.js or WebGLBackground.jsx
window.pushTrace?.({ ev: 'CE:EMIT', mode: 'emergence', stage: 'genesis' });
```

3. Test:
```javascript
window.dumpTrace().length  // Should be > 0
```

4. Commit: `git commit -m "fix(trace): restore event capture system"`

---

### LAYER 4 FIXES

**Problem:** Test timeout - waitForFencepostAndStage

**Fix Protocol:**
1. Run diagnostic test:
```bash
npm run test:visual -- tests/visual/debug-trace-tags.spec.ts
```

2. Check output for event structure:
```
TAG SUMMARY:
  "WBG:FENCEPOST": 1
  "WBG:BIND": 2
```

3. If events exist but test fails, check helper in `tests/visual/helpers.ts`:
```typescript
export async function waitForFencepostAndStage(page: Page, timeout = 30_000) {
  await page.waitForFunction(() => {
    const trace = (window as any).__trace;
    if (!Array.isArray(trace)) return false;
    
    // Check for actual event property name ('ev' not 'tag')
    const hasFencepost = trace.some((e: any) => e.ev === 'WBG:FENCEPOST');
    const hasStageBind = trace.some((e: any) => 
      e.ev === 'WBG:BIND' && e.kind === 'stage'
    );
    
    return hasFencepost && hasStageBind;
  }, { timeout });
}
```

4. Test: `npm run test:visual -- -g "fencepost"`
5. Commit: `git commit -m "fix(tests): update helper to match actual event structure"`

---

**Problem:** Assertion error - value out of range

**Fix Protocol:**
1. Check error message:
```
Expected: 1
Received: 0.9987
Expected precision: 3
```

2. Determine if value is:
   - **Close (within 1%):** Relax precision
   - **Far (> 5% off):** Investigate root cause

3. If close, update test:
```typescript
// Change from:
expect(morphState.shaderMorph).toBeCloseTo(1, 3);  // ±0.0005

// Change to:
expect(morphState.shaderMorph).toBeCloseTo(1, 2);  // ±0.005
```

4. If far, investigate:
```bash
# Check config
cat sst/canon/v3.5.json | jq '.stages.genesis'

# Check engine logic
grep -A 20 "shaderMorph" src/engine/ConsciousnessEngine.js
```

5. Commit: `git commit -m "fix(tests): relax morph precision tolerance for animation settling"`

---

**Problem:** Race condition - intermittent failures

**Fix Protocol:**
1. Ensure serial execution in `package.json`:
```json
{
  "scripts": {
    "test:visual": "playwright test tests/visual/ --workers=1"
  }
}
```

2. Add state cleanup in test:
```typescript
test.beforeEach(async ({ page }) => {
  await page.evaluate(() => {
    if ((window as any).__trace) {
      (window as any).__trace = [];
    }
  });
});
```

3. Test multiple runs:
```bash
for i in {1..5}; do npm run test:visual; done
# Should pass all 5 times
```

4. Commit: `git commit -m "fix(tests): ensure serial execution and state cleanup"`

---

## 6. CROSS-LAYER DEPENDENCIES

### How Layers Interact

**Dependency Chain:**
```
Layer 4 (Tests) depends on →
  Layer 3 (Instrumentation) depends on →
    Layer 2 (Contracts) depends on →
      Layer 1 (Configuration)
```

**Example Cascade:**

1. **Layer 1 Change:** Update `genesis.particlesBase` from 2000 to 2500 in SST
2. **Layer 2 Impact:** Contract tests now expect 2500 particles in blueprint
3. **Layer 3 Impact:** Probe.draw() reports 2500 particles
4. **Layer 4 Impact:** Visual tests verify geometry with 2500 particles

**Fix Order:**  
When cascading changes occur, fix bottom-up:
1. Update Layer 1 (SST)
2. Verify Layer 2 (contracts still pass)
3. Check Layer 3 (instrumentation shows new values)
4. Update Layer 4 (test expectations if needed)

---

### Common Dependency Patterns

**Pattern 1: Config → Code → Test**
```
SST defines particleCount → 
Engine uses SST value → 
Contract validates it → 
Visual test checks it
```
**Fix:** If test fails, check config first, then engine, then test expectations.

---

**Pattern 2: Event → Trace → Helper → Test**
```
Engine emits event → 
Trace captures it → 
Helper waits for it → 
Test validates ordering
```
**Fix:** If test times out, check event is emitted, then trace captures, then helper matches format.

---

**Pattern 3: HMR → Toast → Visual Feedback**
```
File changes → 
Vite detects → 
Plugin emits event → 
Listener shows toast
```
**Fix:** If no feedback, check each link in chain: Vite config, plugin, listener, toast utility.

---

## 7. VALIDATION PROCEDURES

### After Every Fix

**Step 1: Run Relevant Layer Tests**
```bash
# Layer 1
npm run validate-sst && npm run detect-drift

# Layer 2
npm run test:contracts

# Layer 3
npm run dev  # Check console for initialization messages

# Layer 4
npm run test:visual
```

**Step 2: Run Full Diagnostic**
```bash
node scripts/velocity-diagnostic.cjs
# Should show 19/19 (100%)
```

**Step 3: Manual Verification**
```bash
# Open browser, check:
# - Console has no errors
# - window.probe exists
# - window.__trace has events
# - Toast notifications work
```

**Step 4: Commit Only If All Pass**
```bash
git add <files>
git commit -m "fix(layer): description of fix"
```

---

### Pre-Commit Checklist

Before committing any fix:
- [ ] Relevant tests pass
- [ ] No new console errors
- [ ] Velocity diagnostic shows 100%
- [ ] Manual browser check clean
- [ ] Commit message descriptive

---

## 8. COMMON FAILURE PATTERNS

### Pattern 1: "The Cascade"
**Symptom:** One change breaks multiple layers  
**Example:** SST change → contract fails → test fails  
**Fix:** Work bottom-up, fixing each layer in sequence

---

### Pattern 2: "The Race"
**Symptom:** Test passes sometimes, fails others  
**Example:** Parallel tests corrupting shared trace  
**Fix:** Ensure `--workers=1` and state cleanup in `beforeEach`

---

### Pattern 3: "The Drift"
**Symptom:** Hardcoded values don't match config  
**Example:** Engine uses 2000 particles, SST says 2500  
**Fix:** Replace hardcoded value with SST reference

---

### Pattern 4: "The Mismatch"
**Symptom:** Helper expects event format that doesn't exist  
**Example:** Helper checks `e.tag`, events use `e.ev`  
**Fix:** Update helper to match actual event structure

---

### Pattern 5: "The Timing"
**Symptom:** Animation not settled, test checks too early  
**Example:** morph = 0.9987 instead of 1.0  
**Fix:** Add `waitForTimeout(500)` or relax precision

---

## 9. EMERGENCY ROLLBACK PROCEDURES

### When to Rollback

Rollback immediately if:
- Multiple tests fail after your change
- Visual regression breaks core functionality
- Cannot diagnose issue within 30 minutes
- Change introduces console errors

---

### How to Rollback

**Option 1: Soft Rollback (Undo Last Commit)**
```bash
git reset --soft HEAD~1
# Your changes are now uncommitted but still in working directory
# Fix the issue, then commit again
```

**Option 2: Hard Rollback (Discard Changes)**
```bash
git reset --hard HEAD~1
# Changes are completely discarded
# Start over from last known good state
```

**Option 3: Revert Specific Commit**
```bash
git log --oneline | head -10  # Find commit hash
git revert <commit-hash>
# Creates new commit that undoes the changes
```

---

### After Rollback

1. Verify tests pass: `npm run test:visual`
2. Verify diagnostic clean: `node scripts/velocity-diagnostic.cjs`
3. Document what went wrong
4. Plan fix with better understanding
5. Apply fix incrementally and test at each step

---

## 10. REFERENCE: FILE MAP

### Configuration (Layer 1)
```
sst/
├── canon/
│   ├── v3.5.json                    # Master config (READ THIS FIRST)
│   └── v3.5.schema.json             # Validation schema
└── tools/
    ├── validate-sst.cjs             # Schema validator
    └── detect-drift.cjs             # Drift detector
```

### Contracts (Layer 2)
```
tests/
└── contracts/
    └── blueprint-tests.js           # Contract test suite
```

### Instrumentation (Layer 3)
```
src/
├── config/
│   └── canonical/
│       └── canonicalAuthority.js    # Probe + probe.history
├── main.jsx                         # Trace system + HMR listener
└── utils/
    └── toast.js                     # Toast notification utility

vite.config.js                       # Shader HMR plugin
```

### Quality (Layer 4)
```
tests/
└── visual/
    ├── opening-sequence.spec.ts     # Main test suite (6 tests)
    ├── debug-globals.spec.ts        # Diagnostic (2 tests)
    ├── debug-trace-tags.spec.ts     # Diagnostic (1 test)
    └── helpers.ts                   # Test utilities

playwright.config.js                 # Test configuration
```

### Engine (Modified by Layer 2 fixes)
```
src/
├── engine/
│   └── ConsciousnessEngine.js       # Blueprint generation
└── components/
    └── webgl/
        └── WebGLBackground.jsx      # Event emission, rendering
```

---

## 🎯 FINAL PROTOCOL FOR AI PARTNERS

### When You Receive a Task

1. **Read the error/symptom**
2. **Use Section 3 to identify layer**
3. **Use Section 4 for layer-specific diagnostic**
4. **Use Section 5 for layer-specific fix**
5. **Use Section 7 to validate fix**
6. **Use Section 9 if fix causes more problems**

### Golden Rules

1. **Never skip validation** - Always test after changes
2. **Fix bottom-up** - Start with Layer 1, work to Layer 4
3. **One layer at a time** - Don't mix layer fixes
4. **Always check dependencies** - Layer changes affect higher layers
5. **Document your work** - Clear commit messages
6. **When in doubt, rollback** - Better safe than broken

---

## 📞 SUPPORT RESOURCES

### Diagnostic Tools
- `node scripts/velocity-diagnostic.cjs` - Full system health check
- `npm run test:visual -- tests/visual/debug-trace-tags.spec.ts` - Event structure
- `npm run test:visual -- tests/visual/debug-globals.spec.ts` - Initialization state

### Reference Documents
- This manual (AI_PARTNER_FIELD_MANUAL.md)
- VELOCITY_STACK_STATUS.md - Current state
- SST v3.5 (sst/canon/v3.5.json) - Configuration truth
- Velocity Playbook (if available) - Development workflows

---

**END OF MANUAL**

**Version:** 1.0  
**Maintainer:** MetaCurtis Development Team  
**Last Updated:** 2025-01-11  
**Status:** Production-ready operational reference

This manual is the **definitive guide** for all AI partners working on MetaCurtis. Reference it first, always.

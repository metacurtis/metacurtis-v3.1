# START HERE: Feature Development Quick Start

**Last Updated:** January 2025  
**Status:** Production-Ready Velocity Stack  
**Time to First Feature:** 10 minutes

---

## 🚀 Your First 10 Minutes

### Step 1: Validate Stack Health (2 mins)
```bash
npm run validate-sst    # Layer 1: Config integrity
npm run test:contracts  # Layer 2: Logic correctness
npm run dev             # Layer 3: Start instrumentation
```

**Expected Output:**
- `✅ Canonical config is valid`
- `18 passed` (contracts)
- Server at `http://localhost:5175`

### Step 2: Open Browser Console (1 min)
```javascript
// Check instrumentation is live
window.probe.draw()         // {active: 2000, draw: 2000, match: true}
window.probe.fps()          // 60.0
window.probe.history        // {start, stop, analyze, ...}
window.__trace.length       // > 100
```

**If any fail:** See `AI_PARTNER_FIELD_MANUAL.md` Section 4 (Diagnostics)

### Step 3: Choose Your Feature Type (2 mins)

| Feature Type | Start With | Example |
|-------------|-----------|---------|
| **New Stage** | SST → Engine → Tests | Add "Emergence" stage 7 |
| **Shader Effect** | Edit .glsl → HMR | Update particle glow |
| **Timing Change** | SST beatsheet → Director | Adjust narration sync |
| **Performance Opt** | Probe history → Engine | Reduce particle count |

---

## 📝 Feature Development Template

### Example: Add New Stage "Emergence"

#### Phase 1: Update SST (5 mins)
```bash
code sst/canon/v3.5.json
```

Add to `stages` object:
```json
"emergence": {
  "slug": "emergence",
  "label": "EMERGENCE DAWN",
  "particlesBase": 10000,
  "colors": ["#ff00ff", "#00ffff", "#ffffff"],
  "brainRegion": "consciousnessCore",
  "letterGeometry": {
    "word": "EMERGENCE",
    "font": "Montserrat",
    "weight": 300,
    "depth": 0.8
  }
}
```

**Validate:**
```bash
npm run validate-sst    # Must pass
npm run detect-drift    # Must show "No drift"
```

#### Phase 2: Test Contracts (2 mins)
```bash
npm run test:contracts
```

**Expected:** Still passes (SST change doesn't break logic)

#### Phase 3: Update Engine (10 mins)
```bash
code src/engine/ConsciousnessEngine.js
```

No changes needed if using SST references correctly:
```javascript
// ✅ This automatically picks up new stage
const config = SST.stages[stageName];
const particleCount = config.particlesBase;
```

**Test in browser:**
```javascript
stageControls.jumpToStage(7)  // Emergence
probe.draw()                   // {active: 10000, ...}
```

#### Phase 4: Record Performance (3 mins)
```javascript
probe.history.start()
// Wait 5 seconds at stage 7
probe.history.stop()
probe.history.analyze()
```

**Check:** FPS ≥ 55, memory stable

#### Phase 5: Add Visual Test (10 mins)
```bash
code tests/visual/stage-snapshots.spec.ts
```

Add test:
```typescript
test('Stage 7: Emergence (magenta, 10K particles)', async ({ page }) => {
  await skipOpening(page);
  await page.evaluate(() => window.stageControls.jumpToStage(7));
  await waitForStable(page, 'emergence');
  
  const draw = await page.evaluate(() => window.probe.draw());
  expect(draw.active).toBe(10000);
  
  await expect(page).toHaveScreenshot('emergence-stage.png');
});
```

**Generate baseline:**
```bash
npm run test:visual:update
```

**Validate:**
```bash
npm run test:visual
# Should pass 10/10
```

#### Phase 6: Commit
```bash
git add sst/ src/ tests/
git commit -m "feat(stage): add emergence stage with 10K particles

SST: Added emergence stage definition
Engine: Auto-pickup via SST references  
Tests: Added visual regression baseline
Performance: 57 FPS avg (probe.history validated)

All layers validated:
✅ Constitutional (validate-sst passed)
✅ Contracts (18/18 passed)
✅ Instrumentation (probe.history: 57 FPS)
✅ Quality (10/10 visual tests passed)"
```

**Total Time:** 30-40 minutes for complete feature

---

## 🔧 Common Development Workflows

### Workflow 1: Shader Iteration (5-10 mins)
```bash
npm run dev
code src/shaders/templates/consciousness-fragment.glsl
# Edit colors/effects
# OBSERVE: <500ms update + toast notification
```

**Performance check:**
```javascript
probe.history.start()
// Wait 5 seconds
probe.history.analyze()
// Verify: FPS still ≥55
```

### Workflow 2: Performance Investigation (15-20 mins)
```javascript
// Reproduce issue
probe.history.start()
stageControls.jumpToStage(3)  // Where drop occurs
// Wait 3 seconds
probe.history.stop()

// Analyze
probe.history.analyze()
// Check: FPS drops, memory trends
probe.history.plot('fps')
// Visual ASCII chart

// Export for bug report
const data = probe.history.export()
```

### Workflow 3: Fix Bug Reported in Visual Test (10-15 mins)
```bash
# Run failing test
npm run test:visual -- -g "velocity"

# Use HMR to iterate fix
code src/shaders/templates/consciousness-fragment.glsl
# Edit + observe instant feedback

# Re-run test
npm run test:visual -- -g "velocity"
# Should pass without baseline update
```

---

## 🚨 When Things Break

### Error: SST validation fails
```bash
npm run validate-sst
# Read error → Fix sst/canon/v3.5.json → Re-validate
```

### Error: Contract test fails
```bash
npm run test:contracts
# Read which test failed
# Fix src/engine/ or src/components/
# Re-run until pass
```

### Error: Visual test times out
```bash
# Run diagnostic
npm run test:visual -- tests/visual/debug-trace-tags.spec.ts
# Check event structure
# Update helper in tests/visual/helpers.ts if needed
```

### Error: Performance regression
```javascript
probe.history.start()
// Reproduce issue
probe.history.analyze()
// Check: memory.trend, fps.drops
// Fix code, re-validate
```

**Full troubleshooting:** See `AI_PARTNER_FIELD_MANUAL.md` Sections 4-5

---

## 📊 Definition of Done (Every Feature)

Before committing, verify:
- [ ] `npm run validate-sst` passes (Layer 1)
- [ ] `npm run test:contracts` passes (Layer 2)
- [ ] `probe.history` shows no performance regression (Layer 3)
- [ ] `npm run test:visual` passes (Layer 4)
- [ ] No console errors in browser
- [ ] Commit message documents all layer validations

**Time:** 3-5 minutes to full validation

---

## 🎯 Your Velocity Advantage

| Traditional Dev | MetaCurtis Velocity | Gain |
|----------------|-------------------|------|
| 5s page reload | <500ms shader HMR | **10x** |
| Manual QA | Automated visual tests | **5x** |
| Config drift | SST validation | **3x** |
| Guess debugging | probe.history | **2x** |
| **COMBINED** | | **10-15x** |

**Sustainable velocity:** You maintain this 10-15x baseline indefinitely.

---

## 📚 Reference Documents (By Use Case)

| Need | Document |
|------|----------|
| **System overview** | `system overview` (attached doc 1) |
| **Debugging protocol** | `debug v4.0` (attached doc 2) |
| **Architecture rules** | `Architectural SST` (attached doc 3) |
| **Feature specs** | `SST3.5` (attached doc 4) |
| **Development rules** | `Constitutional Development Protocol` (attached doc 5) |
| **Complete workflows** | `playbook development capabilities` (attached doc 6) |
| **Troubleshooting** | `AI_PARTNER_FIELD_MANUAL` (attached doc 7) |

**Golden Rule:** Reference docs only when stuck. Build first, read later.

---

## 🚀 Ready to Build?

1. Run: `npm run validate-sst && npm run test:contracts && npm run dev`
2. Open: `http://localhost:5175`
3. Console: `probe.draw()` to confirm instrumentation
4. **Start building your feature**

**You now have a 10-15x velocity multiplier. Use it.** 🎯


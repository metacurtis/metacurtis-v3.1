# Shader Effect Iteration Template

**Goal:** Safely implement or tweak a shader effect without breaking emergence or performance.  
**Applies to:** `src/shaders/templates/*`, stage-specific shader modules.

---

## 1. Prep & Baseline
- [ ] `npm run dev`
- [ ] Capture current metrics with `window.probe.history.start()` / `stop()` (baseline FPS/memory)
- [ ] Note current visual baseline screenshot (optional)

## 2. Implement Change
- [ ] Edit shader file(s)
- [ ] Save and confirm <500 ms HMR, no runtime errors in console
- [ ] Use `window.__trace` to confirm no unexpected renderer events

## 3. Validate Performance
- [ ] `probe.history.start()` before effect
- [ ] Exercise animation/path affected
- [ ] `probe.history.analyze()` → FPS ≥ 55, no large spikes in GPU/CPU time
- [ ] If regression detected: adjust effect or add adaptive guard (e.g., tier-based parameters from SST/VC)

## 4. Automated Tests
- [ ] `npm run validate-sst` (guards against accidental config edits)
- [ ] `npm run test:contracts`
- [ ] `npm run test:visual -- -g "<related spec>"` (update baseline only if visual change intentional)

## 5. Update Docs / Controls
- [ ] Reflect new knobs in SST or VC (`src/config/visual-controls.js`) if needed
- [ ] Document usage or new parameters in `docs/VELOCITY_SYSTEM.md` or feature doc

## 6. Commit
- [ ] `git add` shader + SST/VC + tests
- [ ] Commit with note about performance probe results and updated snapshots

**Definition of Done:** Shader renders error-free, performance probe stable, visual tests updated.


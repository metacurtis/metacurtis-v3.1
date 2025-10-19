# Performance Investigation Template

**Goal:** Diagnose and resolve performance regressions using the velocity instrumentation stack.

---

## 1. Reproduce & Record
- [ ] Launch app (`npm run dev`)
- [ ] Reproduce the scenario (stage, narrative segment, interaction)
- [ ] `window.probe.history.start()`
- [ ] Run scenario for at least 5–10 seconds
- [ ] `window.probe.history.stop()`
- [ ] `window.probe.history.analyze()` → capture FPS, draw counts, memory trend
- [ ] Export data `window.probe.history.export()` and attach to issue/PR

## 2. Identify Hot Path
- [ ] Inspect `probe.history.plot('fps')` and `plot('memory')`
- [ ] Check renderer traces (`window.__trace.slice(-50)`) for repeated binds or directives
- [ ] Validate engine events (contracts) to ensure no redundant rebuilds
- [ ] Confirm stage particle counts via SST, not hardcoded overrides

## 3. Apply Fix
- [ ] Adjust SST (particle budgets, tier ratios) **or**
- [ ] Update engine/renderer logic with adaptive guard (respect single-writer rule)
- [ ] Document new tunables in VC/SST if applicable

## 4. Validate Fix
- [ ] Re-run steps in Section 1
- [ ] Compare pre/post probe data (FPS, activeCount, CPU/GPU time)
- [ ] Ensure emergence pipeline still emits single `PARTICLES_EMERGED`
- [ ] Run `npm run validate-sst`, `npm run test:contracts`
- [ ] Run targeted visual tests (`npm run test:visual -- -g "<spec>"`)

## 5. Regression Shield
- [ ] Add/Update automated test (e.g., Playwright assertion on draw counts, Vitest sentinel)
- [ ] Consider adding threshold check to CI (e.g., `scripts/morph-stability-doctor.cjs`)

## 6. Communicate & Commit
- [ ] Summarize findings + probe metrics in PR/commit message
- [ ] `git add` code, SST/VC updates, tests
- [ ] Commit with reference to exported telemetry artifact

**Definition of Done:** Probe data shows improved/stable metrics, all layers green, regression guard in place.


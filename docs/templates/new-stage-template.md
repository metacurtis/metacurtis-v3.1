# New Stage Development Template

**Goal:** Introduce a new stage through SST first, validate, and ship with confidence.

---

## 1. Define Stage in SST
- [ ] Edit `sst/canon/v3.5.json`
- [ ] Add stage entry under `stages` (slug, label, particle budget, colors, brainRegion)
- [ ] Update `stageOrder` / narrative references if required
- [ ] Run `npm run validate-sst`
- [ ] Run `npm run detect-drift`

## 2. Verify Contracts
- [ ] `npm run test:contracts`
- [ ] Review BeatBus events for new stage (no missing payload fields)

## 3. Engine / Director Checks
- [ ] Confirm `ConsciousnessEngine` derives config from SST (no hardcodes)
- [ ] Ensure stage transitions in `TheaterDirector`/scroll orchestrator require no manual wiring
- [ ] Add/adjust tier or quality mappings if the stage changes particle budgets

## 4. Renderer Validation
- [ ] Jump to stage in browser console (`stageControls.jumpToStage(idx)`)
- [ ] `window.probe.draw()` → matches expected particles
- [ ] `window.probe.history.start()/stop()` → FPS ≥ target, no spikes

## 5. Add Visual Regression
- [ ] Add snapshot to `tests/visual/`
- [ ] `npm run test:visual -- -g "<stage name>"` (update baseline if intentional)
- [ ] `npm run test:visual`

## 6. Documentation & Commit
- [ ] Update narrative copy / docs as needed
- [ ] `git add` SST + tests + relevant code
- [ ] Commit message includes validation checklist

**Definition of Done:** All automated layers green, probe history stable, visual baseline updated.


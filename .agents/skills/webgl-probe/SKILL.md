---
name: webgl-probe
description: Use when validating landing slice visual changes against the velocity-stage visual contract. Requires an external worktree, runs the current landing verification lane, and reports probe/screens/schema/single-writer results without editing source.
---

# WebGL Probe

## Pre-Probe
1. Confirm you are in an external worktree, not the main checkout.
2. Run `git status --short --branch` and classify dirty state:
   - source under test
   - evidence artifacts
   - noise
   - unknown
3. Stop and report if unknown files or unrelated source changes would make the result ambiguous.
4. State the visual hypothesis being tested.
5. Read `docs/landing-visual-contract.md` if the success criteria are not already clear.

## Execution
Primary path:
```bash
./scripts/start-flow.sh landing-verify
```

Fallback only if the helper script is unavailable:
```bash
npm run audit:landing:formation
LANDING_CHECKPOINTS=0,5400,7800,9800,12200 npm run probe:landing:velocity
LANDING_SCREEN_CHECKPOINTS=5400,7800,9800,12200 npm run screens:landing:velocity
npm run contact:landing:velocity
npm run compare:landing:velocity
npm run diagnose:landing:velocity
npm run gate:landing:velocity
```

## Required Report
- probe artifact path
- screenshot artifact paths
- schema violations: yes/no
- single-writer violations: yes/no
- visual conclusion against `docs/landing-visual-contract.md`:
  - FORM legibility: pass/fail
  - FORM dominance: pass/fail
  - FORM spatial coherence: pass/fail
- next smallest recommended fix

## Post-Probe
1. Do not edit source based on probe results unless the operator instructs it.
2. Classify new outputs as Evidence / Noise / Unknown.
3. Present findings and wait for the next instruction.

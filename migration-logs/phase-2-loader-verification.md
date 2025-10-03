# Phase 2: SST Loader Verification

## Runtime Checks
- Loader logic executed via replica harness (`node --input-type=module` with manual JSON load) to work around Node's missing `import ... assert { type: 'json' }` support.
- Helper calls confirmed:
  - `getStageByIndex(0)` → `GENESIS SPARK`
  - `getStageByName('genesis')` → word `HELLO CURTIS`
  - `getStageByScroll(0.5)` → `VELOCITY EXPLOSION`
- Dual-frame-rate aliases return `60` for both `performance.frameRate.target` and `.targetFps`.
- Particle budget aliases return `2000` for both `stages.genesis.particleCount` and `.particlesBase`.
- Feature flag lookup (`ctfOpening`) resolves to `false`; fragment helper returns the canonical fragment payload.
- Deep-freeze guard blocks mutation: attempting `SST.stages.genesis.word = 'TEST'` leaves value unchanged (`HELLO CURTIS`).

## Window Exposure
- Dev-only exposure path retained; to verify in browser console: `window.SST.version` → `"3.5.0"` (requires running Vite dev server).

## Notes
- Direct `node` import currently fails on `assert { type: 'json' }`; replica harness ensures loader behaviour is validated without altering production syntax requirements.

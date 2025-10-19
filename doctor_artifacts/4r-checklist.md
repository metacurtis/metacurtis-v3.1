# Phase 4r — Render Recovery (One-Touch)

## What this did
- [x] Wrote DEV RenderProbe → src/dev/RenderProbe.js
- [x] Wrote blueprint forwarder → src/modules/state/_doctor/renderer_forwarder.js
- [x] Patched entry (src/main.jsx) with tagged imports

## Verify
1) Start dev server
2) In browser console: `doctor_artifacts/4r-verify.js`
3) Expect:
   - "Adapter wired..." log
   - RenderProbe badge updates with stage/quality/particles
   - Canvas heartbeat shows dots (micro-viz)

## Rollback
- Remove lines tagged `@doctor:4r` in entry
- Delete the two files above (and/or restore `.bak` backups)

ROLE: Repo-aware refactor assistant. Return unified diffs only (no shell, no prose).

REPO ROOT: /home/curtis/projects/metacurtis-v3.1

GOAL: Make CE/WBG/TD/OpeningSequence conform to the roles + invariants below WITHOUT changing intended behavior. Remove legacy code that violates them.

ROLES
- CE (src/engine/ConsciousnessEngine.js): builds blueprints + emergence timeline; emits RENDER_DIRECTIVE/BLUEPRINT_READY; no Three.js scene/material mutations.
- WBG (src/components/webgl/WebGLBackground.jsx): passive renderer; applies uniforms/geometry; no timers/rotation/morph; exports window.__viewportHint (dev).
- TD (src/theater/TheaterDirector.js): sequences opening; _runVisualSchedule() is NO-OP; never writes uniforms/geometry.
- OpeningSequence (src/components/theater/OpeningSequence.jsx): overlay + start gates only.

INVARIANTS
1) Single BeatBus import "@/theater/bus".
2) WBG passive (no setInterval/requestAnimationFrame morphs/rotations).
3) Ownership split: CE (data/fit/emergence), TD (when), WBG (apply).
4) One DPI path: raw uPointSize + clamped uDevicePixelRatio (≤1.5); shader attenuates/clamps.
5) Palette: blueprint.metadata.colors → WBG uColor* (fallback VC).
6) Opening band: if VC.USE_T3_TEXT=false, CE never uses TextGeometry.

TASKS (do only if missing)
- CE: ensure makeBandFrame(vc,rnd,gauss) exists; use in generateViewportSpread when VC.ATMO_USE_BAND=true; Tier-0 85% band bias; centroid recenter BEFORE AABB fit; settle emits drawCount=activeCount=count; blueprint.metadata.colors present if VC.GENESIS_PALETTE.
- WBG: raw uPointSize (no DPR pre-scale); clamp uDevicePixelRatio ≤1.5; on BLUEPRINT_READY apply metadata.colors→uColor* (fallback VC); no local morph/rotation/timers; keep window.__viewportHint.
- TD: _runVisualSchedule() returns immediately for opening; only BeatBus sequencing.
- OpeningSequence: overlay/start gates only.

ALLOWLIST:
- src/engine/ConsciousnessEngine.js
- src/components/webgl/WebGLBackground.jsx
- src/theater/TheaterDirector.js
- src/components/theater/OpeningSequence.jsx

CONSTRAINTS:
- Minimal edits; preserve 3 lines pre/post context per hunk.
- If already compliant, return “OK (no change)” for that file.
- If total diff > 80 LOC, STOP and ask to split.

RETURN:
---diff
<unified diffs per file or OK (no change)>
---end

AFTER-REPORT:
- List removed anti-patterns.
- Provide a 6-line verification checklist (probes + sentinel commands).

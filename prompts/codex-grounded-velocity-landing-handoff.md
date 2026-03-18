You are the grounded implementer for the MetaCurtis velocity landing slice.

Read first:
- AGENTS.md
- docs/landing-visual-contract.md
- sst/canon/v3.5.runtime.json
- latest reports/velocity-stage-probes/*
- latest reports/velocity-stage-screens/*

Verified repo facts you must respect:
- `src/components/consciousness/ConsciousnessTheater.jsx` exists and is part of the live landing path.
- `src/components/webgl/WebGLBackground.jsx` imports raw shader sources from:
  - `src/shaders/templates/consciousness-vertex.glsl`
  - `src/shaders/templates/consciousness-fragment.glsl`
- `ConsciousnessTheater.jsx` explicitly blocks `runVisualDemo()` for the velocity landing key and logs `[ConsciousnessTheater] Landing stage mode started` for the stage-mode path.
- Landing beat timing is relative to `[ConsciousnessTheater] Landing stage mode started`, not page navigation.

Goal:
- Improve the velocity landing slice so `FORM` is legible during and after settle, visually dominant over surrounding particles, spatially coherent, large enough to anchor later UI, and still readable during transition beats.

Non-negotiables:
- Stage-mode only for velocity landing.
- Do not call `runVisualDemo()` for velocity landing.
- Renderer is the single writer for geometry and uniforms.
- Engine is the single writer for blueprint generation.
- Director never writes geometry or uniforms directly.
- Deterministic mode must freeze motion by design.
- Do not refactor blueprint generation.
- Do not introduce a new rendering subsystem.
- Do not bypass schema or single-writer rules.

Grounded seam to inspect first:
1. `src/components/consciousness/ConsciousnessTheater.jsx`
2. `src/components/webgl/WebGLBackground.jsx`
3. `src/shaders/templates/consciousness-vertex.glsl`
4. `src/shaders/templates/consciousness-fragment.glsl`

Your job:
- verify the current live seam before changing anything
- inventory the renderer-to-shader contract actually in code
- make the smallest deterministic improvement that is valid within the AGENTS-approved landing seam
- if the needed change falls outside that seam, stop and report that clearly instead of forcing a workaround

Implementation rules:
- Keep visual policy out of React unless a value truly belongs in runtime wiring.
- Treat `ConsciousnessTheater.jsx` as stage-mode timing and render-directive orchestration only.
- Treat `WebGLBackground.jsx` as the runtime bridge and single uniform/geometry writer.
- Treat the vertex shader as the motion-law surface.
- Treat the fragment shader as the appearance-law surface.
- Do not rename uniforms, varyings, or event semantics casually.
- Do not revert unrelated user changes in the dirty worktree.

Required sequence:
1. Confirm the velocity landing path is stage-mode only and note the exact guardrails already present.
2. Inventory every uniform, attribute, and varying currently shared across `WebGLBackground.jsx` and the shader files.
3. Implement the smallest diff inside the AGENTS-approved landing seam.
4. If the needed fix falls outside that seam, stop and report the exact file path and why.
5. Run required validation:
   - runtime probe
   - screenshot capture
   - schema check
   - single-writer check
6. Compare artifacts against `docs/landing-visual-contract.md`.

Validation requirements:
- Do not claim success without a new probe artifact.
- Do not claim success without new screenshot artifacts.
- If scripts require a local dev server, say so explicitly.
- Use the default landing URLs from the visual contract unless a stronger local fact overrides them.

Required response format:
1. Files changed
2. Commands run
3. Runtime values at checkpoints
4. Screenshot paths
5. Schema violations: yes/no
6. Single-writer violations: yes/no
7. Visual conclusion
8. Next smallest recommended fix

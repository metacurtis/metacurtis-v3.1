# Single-Writer Ownership (authoritative)

Uniforms / GPU
- `uMotionMode`, `uFlowTurbulence`, `uOpacityMin`, `uOpacityMax`, `uParticleFlash` → `src/components/webgl/WebGLBackground.jsx` (RENDER_DIRECTIVE handler) **only**
- `uMorphProgress` → Morph subsystem (engine + MorphAnimationController) emits `MORPH_PROGRESS`; renderer only listens

Blueprints / Geometry
- Bind/unbind + buffer mutation → `src/components/webgl/WebGLBackground.jsx` **only**
- `BUILD_EMERGENCE_BLUEPRINT` → engine emits requests; controllers never write GPU state directly

Fences
- `BLUEPRINT_READY` → `src/engine/ConsciousnessEngine.js`
- `PARTICLES_EMERGED` → renderer (source:`renderer-*`), controllers only *wait*

Overlay / UI
- UI overlays never write GPU uniforms or emit `MORPH_PROGRESS`

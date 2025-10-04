# Architecture Rules (Read First)

1) SST is law. All values originate from `sst/canon/vX.json`. Code reads SST; no hardcodes.
2) Renderer is the only GPU writer. Only `WebGLBackground.jsx` calls `geometry.setDrawRange` or mutates `material.uniforms`.
3) No mid-morph rebuilds. Engine blocks blueprint rebuilds during emergence (except emergence itself).
4) Never cache fallbacks. If font/assets aren’t ready, return a temporary layout and do not cache it.
5) One path to letters. 3D text is built via `_build3DLetters` only; emergence targets that output when font is ready.

## Developer Checklist
- Change vision → Edit SST → `npm run validate-sst`.
- Fix visuals → Tiny diffs to allowlisted files. Renderer writes GPU.
- Opening QA → Probes: `draw` (full), `morph→1.0 ≤2.2s`, `aabb≥0.82`, `endpointsDifferent:true`.

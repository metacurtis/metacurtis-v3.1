// canon-console/runtime/playbooks.js
// Canon Console — Base Playbooks (clean, no step definitions here)
// NOTE: Steps are provided by runtime/steps.js (and optionally steps-extra.js)

export const Playbooks = {
  GL_VALIDATE_FAIL_BASELINE: {
    id: 'GL_VALIDATE_FAIL_BASELINE',
    plan: [
      // Compile with a safe define variant for quick shader sanity
      { step: 'compile_variant', args: { defines: { BASELINE_VARIANT: 1 }, target: 'shadow' } },
      // Basic asserts: compile/link/validate
      { step: 'assert', args: { shaderCompileOk: true, linkOk: true, validateOk: true } },
      // Hot-swap material to the validated variant
      { step: 'hotswap_material', args: {} },
      // Visibility safety: drawRange ← uActiveCount (or geometry count)
      { step: 'set_draw_range_from_uniforms', args: {} },
      // Performance sanity probe
      { step: 'verify_metrics', args: { fpsMin: 55, glErrors: 0, probeMs: 240 } },
    ],
  },
};

// Keep a default export for legacy call-sites that do `import Playbooks from ...`
export default Playbooks;

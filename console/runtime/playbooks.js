// console/runtime/playbooks.js
// Minimal L2 playbooks (JS objects, zero deps)
export const Playbooks = {
  GL_VALIDATE_FAIL_BASELINE: {
    id: 'GL_VALIDATE_FAIL_BASELINE',
    when: { code: 'GL_VALIDATE_STATUS_FALSE', gpu: { integrated: true } },
    plan: [
      { step: 'compile_variant', args: { defines: { BASELINE_VARIANT: 1 }, target: 'shadow' } },
      { step: 'assert',          args: { shaderCompileOk: true, linkOk: true, validateOk: true } },
      { step: 'hotswap_material', args: {} },
      { step: 'set_draw_range_from_uniforms', args: {} },
      { step: 'verify_metrics',   args: { fpsMin: 55, glErrors: 0, probeMs: 240 } }
    ]
  },
  BLUEPRINT_TIERDATA_CONVERT: {
    id: 'BLUEPRINT_TIERDATA_CONVERT',
    when: { code: 'BLUEPRINT_TIERDATA_MISMATCH' },
    plan: [
      // kept for parity with guidebook; your runtime guard already normalizes blueprints
      { step: 'verify_metrics', args: { fpsMin: 50, glErrors: 0, probeMs: 200 } }
    ]
  }
};
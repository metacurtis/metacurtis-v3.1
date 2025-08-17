// canon-console/runtime/playbooks-extra.js
export const ExtraPlaybooks = {
  BLUEPRINT_TIERDATA_CONVERT: {
    id: 'BLUEPRINT_TIERDATA_CONVERT',
    when: { code: 'BLUEPRINT_GUARDED' },
    plan: [
      { step: 'convert_tiers_to_tierData', args: {} },
      { step: 'set_draw_range_from_uniforms', args: {} },
      { step: 'verify_metrics', args: { fpsMin: 55, probeMs: 240 } }
    ],
  },
};

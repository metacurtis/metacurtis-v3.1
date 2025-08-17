// canon-console/agent/policy.js
export const policy = {
  slos: { fpsP95: 55, linkFailuresBudget: 1, fallbackRateMax: 0.1 },
  guardrails: { neverSacrifice: ['tier4Prominence','colorPhilosophy','morphSmoothness'] },
  degradeOrder: ['particleCount.tier1','particleCount.tier2','pointSize','atlasRes'],
  decisions(ctx){
    const { incident, gpu, metrics } = ctx;
    // Intel/integrated GL validate → safe baseline, auto
    if (incident?.code === 'GL_VALIDATE_STATUS_FALSE' && gpu?.integrated) {
      return { action:'RUN_PLAYBOOK', id:'GL_VALIDATE_FAIL_BASELINE', auto:true,
        rationale:'Integrated GPU validation fail → baseline variant' };
    }
    // Tier data mismatches should already be Guard-fixed → observe
    if (incident?.code === 'BLUEPRINT_GUARDED') return { action:'OBSERVE', rationale:'Guard already fixed blueprint' };
    // FPS policy (ask-first)
    if (metrics?.fpsP95 && metrics.fpsP95 < this.slos.fpsP95) {
      return { action:'DEGRADE', how:'particleCount.tier1', amount:0.15, auto:false,
        rationale:'FPS below SLO, degrade least visible first' };
    }
    return { action:'OBSERVE', rationale:'No action' };
  },
  explain(decision, ctx){
    return [
      ['observe','incident', ctx?.incident?.code || 'n/a'],
      ['gpu', ctx?.gpu],
      ['metrics', ctx?.metrics],
      ['decision', decision]
    ];
  }
};
if (typeof window!=='undefined') window.CANON_POLICY = policy;

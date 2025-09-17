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


/** Smart Degrade Policy (GPU-aware, risk-scored)
 * Emits DEGRADE suggestion when fps is low on integrated GPUs.
 * Keeps DEGRADE as suggest-only unless `auto=true` and confidence high.
 */
function smartDegradePolicy(ctx){
  const gpu = (ctx && ctx.gpu) || {};
  const last = ctx && ctx.lastIncident;
  const isIntegrated = /Intel|Iris|UHD/i.test(String(gpu?.renderer||gpu?.vendor||''));
  let riskScore = 0; // 0..100
  if (last && (last.code==='FPS_LOW' || last.code==='VERIFY_FPS_FAIL')) riskScore += 40;
  if (isIntegrated) riskScore += 35;
  const action = (riskScore >= 60) ? 'DEGRADE' : 'OBSERVE';
  const amount = (riskScore >= 80) ? 0.7 : 0.85; // drawRange scale
  return { action, why:'smart-degrade', riskScore, isIntegrated, amount };
}

// Append to policy export if missing:
try {
  if (typeof policy === 'object') {
    const base = policy.decisions;
    policy.decisions = function(ctx){
      const d = base ? base(ctx) : { action:'OBSERVE' };
      const sd = smartDegradePolicy(ctx||{});
      // Only upgrade to DEGRADE if sd asks for it and base didn't already decide something stronger
      if (sd.action==='DEGRADE' && (d.action==='OBSERVE' || d.action==='RUN_PLAYBOOK')) {
        return sd;
      }
      return d;
    };
  }
} catch {}

// [CANON:GUARD:L2]
import { CanonGuardL1 } from './L1.js';
export class CanonGuardL2 extends CanonGuardL1 {
  suggestFix(violation){
    const m = violation?.message||'';
    if (m.includes('STAGE_CHANGE')) return { script:'doctor_state_events.cjs', suggestion:'Emit {from,to}' };
    if (m.includes('QUALITY_CHANGE')) return { script:'doctor_quality_event.cjs', suggestion:'Emit {tier}' };
    if (m.includes('BLUEPRINT_READY')) return { script:'doctor_blueprint_shape.cjs', suggestion:'Emit {blueprint,stage,quality,cached}' };
    return null;
  }
  analyze(){ return this.getViolations().map(v => ({ v, fix:this.suggestFix(v) })); }
}

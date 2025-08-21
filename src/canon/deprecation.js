// @doctor:4b-disposers
const __doctorDisposers = []; /** Canon Deprecation Protocol (phased) */export class DeprecationManager {
  constructor() {
    this.schedule = new Map();
    this.telemetry = new Map();
    this.phases = { TELEMETRY: 'TELEMETRY', WARN: 'WARN', STRICT: 'STRICT' };
  }
  register(d) {
    this.schedule.set(d.id, { ...d, currentPhase: this.phases.TELEMETRY, violators: new Set() });
    console.log('Deprecation registered:', d.id);
  }
  check(id, source) {
    const dep = this.schedule.get(id);
    if (!dep) return null;
    dep.violators.add(source);
    const c = (this.telemetry.get(id) || 0) + 1;
    this.telemetry.set(id, c);
    if (dep.currentPhase === this.phases.WARN) console.warn('Deprecated:', dep.old, '->', dep.new);
    if (dep.currentPhase === this.phases.STRICT) throw new Error('Deprecated API used: ' + dep.old);
    return { phase: dep.currentPhase };
  }
  advancePhase(id) {
    const dep = this.schedule.get(id);
    if (!dep) return;
    const order = [this.phases.TELEMETRY, this.phases.WARN, this.phases.STRICT];
    const idx = order.indexOf(dep.currentPhase);
    if (idx < order.length - 1) {
      if (order[idx + 1] === this.phases.STRICT && dep.violators.size) {
        console.warn('Cannot move to STRICT — violators remain:', dep.violators.size);
        dep.currentPhase = this.phases.WARN;
      } else {
        dep.currentPhase = order[idx + 1];
      }
      console.log('Deprecation phase ->', dep.currentPhase);
    }
  }
  getReport() {
    const active = [];
    const blockers = [];
    const ready = [];
    const tel = {};
    this.schedule.forEach((dep, id) => {
      active.push({ id, phase: dep.currentPhase, violators: dep.violators.size });
      tel[id] = this.telemetry.get(id) || 0;
      if (dep.violators.size) blockers.push({ id, violators: Array.from(dep.violators) });else
      ready.push(id);
    });
    return { active, telemetry: tel, readyForNextPhase: ready, blockers };
  }
}
export default DeprecationManager; // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}
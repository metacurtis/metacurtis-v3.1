/**
 * Contract Tester - emitter + blueprint + morph helpers.
 */
import ContractRegistry from '../contracts/registry.js';

export class ContractTester {
  constructor() {
    this.results = [];
    this.covered = new Set();
  }
  testEmitter(name, emitFn) {
    const emitted = [];
    const mock = { emit: (e, p) => emitted.push({ event: e, payload: p }) };
    const result = { emitter: name, passed: true, violations: [] };
    try {
      emitFn(mock);
    } catch (e) {
      result.passed = false;
      result.error = e.message;
    }
    emitted.forEach(({ event, payload }) => {
      const v = ContractRegistry.validate(event, payload);
      if (!v.valid) {
        result.passed = false;
        result.violations.push({ event, violations: v.violations });
      }
      this.covered.add(event);
    });
    this.results.push(result);
    return result;
  }
  testBlueprint(bp) {
    const c = ContractRegistry.blueprints;
    const res = { type: 'blueprint', passed: true, violations: [] };
    (c.required || []).forEach(f => {
      if (!(f in (bp || {}))) {
        res.passed = false;
        res.violations.push({ type: 'missing_field', field: f });
      }
    });
    if ('particleCount' in (bp || {})) {
      const mm = c.constraints.particleCount;
      if (bp.particleCount < mm.min || bp.particleCount > mm.max) {
        res.passed = false;
        res.violations.push({ type: 'constraint_violation', field: 'particleCount' });
      }
    }
    this.results.push(res);
    return res;
  }
  getCoverage() {
    const total = Object.keys(ContractRegistry.events).length;
    const tested = this.covered.size;
    return {
      total,
      tested,
      percentage: total ? ((tested / total) * 100).toFixed(1) + '%' : '0%',
      missing: Object.keys(ContractRegistry.events).filter(e => !this.covered.has(e)),
    };
  }
  getReport() {
    const failures = this.results.filter(r => !r.passed);
    return {
      total: this.results.length,
      passed: this.results.length - failures.length,
      failed: failures.length,
      coverage: this.getCoverage(),
      failures: failures.slice(0, 5),
    };
  }
}

export default ContractTester;

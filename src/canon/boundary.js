/**
 * Canon Bus Boundary Enforcement
 * Validates all BeatBus.emit payloads against ContractRegistry.
 */
import ContractRegistry from './contracts/registry.js'; // @doctor:4b-disposers
const __doctorDisposers = [];
export const BoundaryModes = { TELEMETRY: 'TELEMETRY', WARN: 'WARN', STRICT: 'STRICT' };

export class BusBoundary {
  constructor(mode = BoundaryModes.WARN) {
    this.mode = mode;
    this.violations = [];
    this.telemetry = { total: 0, valid: 0, invalid: 0, rejected: 0 };
  }
  enforce(BeatBus) {
    if (!BeatBus || BeatBus.__boundaryEnforced) return;
    const original = BeatBus.emit.bind(BeatBus);
    const boundary = this;
    BeatBus.emit = function (event, payload) {
      boundary.telemetry.total++;
      const validation = ContractRegistry.validate(event, payload || {});
      if (validation.valid) {
        boundary.telemetry.valid++;
      } else {
        boundary.telemetry.invalid++;
        boundary.violations.push({
          event,
          payload: validation.payload,
          violations: validation.violations,
          ts: Date.now()
        });
        if (boundary.mode === BoundaryModes.WARN) {
          console.warn('Canon Boundary: contract violation', event, validation.violations);
        }
        if (boundary.mode === BoundaryModes.STRICT) {
          console.error('Canon Boundary: REJECTED', event, validation.violations);
          boundary.telemetry.rejected++;
          const inCI = typeof process !== 'undefined' && process && process.env && process.env.CI;
          if (inCI) {
            throw new Error('Contract violation in CI: ' + event);
          }
          return;
        }
      }
      if (validation.deprecations && validation.deprecations.length) {
        console.warn('Canon Boundary: deprecated fields in ' + event, validation.deprecations);
      }
      return original(event, validation.payload || payload || {});
    };
    BeatBus.__boundaryEnforced = true;
    console.log('Canon Boundary enforcing in mode', this.mode);
  }
  setMode(mode) {
    if (!Object.values(BoundaryModes).includes(mode)) throw new Error('Invalid mode: ' + mode);
    this.mode = mode;
    console.log('Canon Boundary mode ->', mode);
  }
  getReport() {
    const t = this.telemetry;
    return {
      mode: this.mode,
      telemetry: t,
      violations: this.violations.slice(-10),
      violationRate: t.total ? (t.invalid / t.total * 100).toFixed(1) + '%' : '0%'
    };
  }
}

export default BusBoundary; // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}
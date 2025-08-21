// @doctor:4b-disposers
const __doctorDisposers = []; /** Canon Doctor Base (governance scaffold) */export class CanonDoctor {
  constructor(cfg) {
    this.name = cfg.name;
    this.description = cfg.description || '';
    this.riskScore = cfg.riskScore || 'LOW';
    this.blastRadius = cfg.blastRadius || [];
    this.verifications = cfg.verifications || [];
    this.dryRun = false;
    this.changes = [];
  }
  async preflight() {
    console.log('CANON DOCTOR:', this.name, '| Risk:', this.riskScore);
    return true;
  }
  async preview() {
    this.dryRun = true;
    return [];
  }
  async operate() {
    throw new Error('override operate()');
  }
  async verify() {
    return { passed: true, results: [] };
  }
  async rollback() {
    console.log('rollback (noop)');
  }
  async execute() {
    await this.preflight();
    await this.preview();
    this.dryRun = false;
    const changes = await this.operate();
    const v = await this.verify();
    return { success: v.passed, changes, verification: v };
  }
}
export default CanonDoctor; // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}
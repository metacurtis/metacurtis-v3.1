/** Canon Suite Amplified Initialization */
import ContractRegistry from './contracts/registry.js';
import BusBoundary, { BoundaryModes } from './boundary.js';
import CanonHUD from './hud.js';
import ContractTester from './tests/contracts.test.js';
import DeprecationManager from './deprecation.js';

import CanonGuardL2 from '../canon-guard/L2.js';
import CanonConsoleL2 from '../canon-console/L2.js';

export function initCanonAmplified() {
  if (typeof window === 'undefined') return;
  if (window.__CANON_AMPLIFIED) return;
  window.__CANON_AMPLIFIED = Date.now();
  console.log('Canon Suite: Initializing AMPLIFIED...');
  const contracts = ContractRegistry;
  const boundary = new BusBoundary(
    import.meta.env && import.meta.env.DEV ? BoundaryModes.WARN : BoundaryModes.TELEMETRY
  );
  const hud = new CanonHUD();
  const tester = new ContractTester();
  const deprecation = new DeprecationManager();
  deprecation.register({
    id: 'quality-to-tier',
    type: 'field',
    old: 'quality',
    new: 'tier',
    since: '0.9.0',
    phases: { telemetry: 't1', warn: 't2', strict: 't3' },
  });
  const guard = new CanonGuardL2();
  const consoleTool = new CanonConsoleL2();
  const BB = window.BeatBus;
  if (BB) {
    boundary.enforce(BB);
    guard.autoProtect(BB);
  } else {
    console.warn('Canon: BeatBus not found at init (will retry)');
    setTimeout(() => {
      if (window.BeatBus) {
        boundary.enforce(window.BeatBus);
        guard.autoProtect(window.BeatBus);
        console.log('Canon: Late enforcement applied');
      }
    }, 100);
  }
  if (import.meta.env && import.meta.env.DEV) hud.init();
  window.canon = {
    contracts,
    boundary,
    hud,
    tester,
    deprecation,
    guard,
    console: consoleTool,
    status: () => ({
      version: contracts.version,
      mode: boundary.mode,
      initialized: window.__CANON_AMPLIFIED,
      components: {
        boundary: boundary.getReport(),
        guard: guard.getStats(),
        console: consoleTool.getStats(),
        deprecations: deprecation.getReport(),
      },
    }),
    setMode: m => boundary.setMode(m),
    getDriftReport: () => contracts.getDriftReport(),
  };
  window.__CANON_GUARD_ACTIVE = true;
  window.__CANON_CONSOLE_ACTIVE = true;
  window.__CANON_CONTRACTS_ACTIVE = true;
  window.__CANON_BOUNDARY_ACTIVE = true;
  console.log('Canon Suite AMPLIFIED ready');
}

if (typeof window !== 'undefined') {
  if (!window.__CANON_AMPLIFIED) initCanonAmplified();
}

export default initCanonAmplified;

// src/state/commands/NavigationCommands.js
// Canonical navigation entry point. Validates target stage and delegates to orchestrator.

import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import { stageAtom } from '../atoms';

const getStageOrder = () => {
  if (Array.isArray(Canonical?.stageOrder) && Canonical.stageOrder.length) {
    return Canonical.stageOrder;
  }
  return Object.keys(Canonical?.stages || {});
};

export function navigateToStageCanonical(targetStage, options = {}) {
  const origin = options.origin || 'unknown';
  const stageOrder = getStageOrder();
  const valid = stageOrder.includes(targetStage);

  if (!valid) {
    console.warn('[NAV_CANON] Invalid stage', { targetStage, origin });
    return false;
  }

  // Give Director a chance to own the transition if it exposes a hook.
  if (typeof window !== 'undefined' && window.theaterDirector?.onExternalStageNavigate) {
    try {
      window.theaterDirector.onExternalStageNavigate(targetStage, {
        origin,
        viaScroll: !!options.viaScroll,
        mode: options.mode || 'stage-entry',
      });
    } catch (err) {
      console.warn('[NAV_CANON] Director hook failed, falling back to atom', { err, targetStage, origin });
    }
  }

  // Fallback path: attempt StateCommands, then dev-only atom jump.
  if (typeof window !== 'undefined' && window.StateCommands?.setStage) {
    try {
      window.StateCommands.setStage(targetStage, { origin });
      return true;
    } catch (err) {
      console.warn('[NAV_CANON] StateCommands.setStage failed; checking dev fallback', { err, targetStage, origin });
    }
  }

  const isDev = !!import.meta?.env?.DEV;
  if (!isDev) {
    console.warn('[NAV_CANON] Atom fallback in prod; consider wiring Director/StateCommands', { targetStage, origin });
    return false;
  }
  stageAtom.jumpToStage(targetStage);
  return true;
}

const NavigationCommands = { navigateToStageCanonical };

// Optional global exposure for consoles/dev tools.
if (typeof window !== 'undefined') {
  window.NavigationCommands = Object.assign({}, window.NavigationCommands, NavigationCommands);
}

export default NavigationCommands;

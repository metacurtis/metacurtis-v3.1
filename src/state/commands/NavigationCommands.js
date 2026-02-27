// src/state/commands/NavigationCommands.js
// Canonical navigation entry point. Validates target stage and delegates to orchestrator.

import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import stateCommands from './StateCommands.js';

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

  // Canonical fallback path: imported StateCommands authority only (no global dependency).
  if (stateCommands?.setStage) {
    try {
      stateCommands.setStage(targetStage, { origin });
      return true;
    } catch (err) {
      console.warn('[NAV_CANON] StateCommands.setStage failed; checking dev fallback', { err, targetStage, origin });
    }
  }

  const isDev = !!import.meta?.env?.DEV;
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isLandingSlice = searchParams?.get('slice') === 'landing_stage';
  if (isDev && typeof stateCommands?.setStage !== 'function') {
    const wiringError = new Error('[NAV_CANON] Missing canonical StateCommands.setStage wiring');
    console.error('[NAV_CANON] startup wiring assertion failed', {
      targetStage,
      origin,
      stack: wiringError.stack,
    });
    throw wiringError;
  }
  if (!isDev) {
    console.warn('[NAV_CANON] Atom fallback in prod; consider wiring Director/StateCommands', { targetStage, origin });
    return false;
  }
  if (isLandingSlice) {
    console.error('[NAV_CANON] Dev atom fallback blocked in landing slice mode', {
      targetStage,
      origin,
    });
    return false;
  }
  const stack = new Error().stack;
  console.error('[NAV_CANON] Navigation blocked: no canonical authority path available', {
    targetStage,
    origin,
    isDev,
    isLandingSlice,
    stack,
  });
  return false;
}

const NavigationCommands = { navigateToStageCanonical };

// Optional global exposure for consoles/dev tools.
if (typeof window !== 'undefined') {
  window.NavigationCommands = Object.assign({}, window.NavigationCommands, NavigationCommands);
}

export default NavigationCommands;

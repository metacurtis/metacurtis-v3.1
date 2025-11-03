// src/state/validation/NavigationContractValidator.js
// Runtime enforcement for SST v3.5 navigation contracts.

import SST from '@/config/sst-loader.js';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import { stageAtom } from '@/state/atoms/stageAtom.js';

const STAGES =
  Array.isArray(Canonical?.stageOrder) && Canonical.stageOrder.length
    ? Canonical.stageOrder.slice()
    : Object.keys(Canonical?.stages || {});

/**
 * NavigationContractValidator enforces SST-defined navigation rules at runtime.
 */
class NavigationContractValidator {
  constructor() {
    this.contracts = SST.navigation?.contracts || {};
    this.transitions = SST.navigation?.transitions || {};
    this.performance = SST.navigation?.performance || {};
    this.singleWriter = SST.navigation?.singleWriter || {};

    this.lastNavigation = 0;
    this.violationHistory = [];

    if (import.meta.env?.DEV) {
      console.log('[ContractValidator] Initialized with SST v3.5 contracts');
    }
  }

  /**
   * Validate orchestrated navigation (UnifiedNavigationAPI).
   */
  validateOrchestrated(targetStage, options = {}) {
    const contract = this.contracts.orchestrated;
    if (!contract) {
      throw new Error('[ContractValidator] Orchestrated contract not found in SST');
    }

    const violations = [];
    const requirements = contract.requirements || {};
    const source = typeof options?.source === 'string' ? options.source : '';
    const normalizedSource = source.toLowerCase();
    const isAutoAdvance =
      normalizedSource.includes('auto_advance') || normalizedSource.includes('narration');
    const isSystemTriggered =
      normalizedSource.includes('opening') || normalizedSource.includes('scroll_orchestrated');

    if (requirements.scrollSurfaceReady?.value) {
      const scrollReady =
        typeof window !== 'undefined' && window.ScrollOrchestrator?.isRunning === true;
      if (isAutoAdvance) {
        if (import.meta.env?.DEV) {
          console.log('[ContractValidator] ✅ scrollSurfaceReady exempted (auto-advance has fallback)', {
            source: options.source,
            scrollReady,
          });
        }
      } else if (!scrollReady) {
        violations.push(
          this._createViolation('scrollSurfaceReady', true, scrollReady, {
            message: 'ScrollOrchestrator must be running for orchestrated navigation',
            validation: requirements.scrollSurfaceReady.validation,
            severity: 'ERROR',
          })
        );
      }
    }

    if (requirements.openingComplete?.value) {
      const openingComplete =
        (typeof window !== 'undefined' && window.stateCommands?.openingComplete === true) ||
        stageAtom.getState?.().openingComplete === true;
      if (!openingComplete) {
        violations.push(
          this._createViolation('openingComplete', true, openingComplete, {
            message: 'Opening sequence must complete before orchestrated navigation',
            validation: requirements.openingComplete.validation,
            severity: 'ERROR',
          })
        );
      }
    }

    if (requirements.validStage && !STAGES.includes(targetStage)) {
      violations.push(
        this._createViolation('validStage', `One of: ${STAGES.join(', ')}`, targetStage, {
          message: `Invalid target stage: ${targetStage}`,
          validation: requirements.validStage.validation,
          severity: 'ERROR',
        })
      );
    }

    if (requirements.minIntervalMs) {
      const minInterval = Number(requirements.minIntervalMs.value) || 0;
      if (!isAutoAdvance && !isSystemTriggered) {
        if (this.lastNavigation > 0) {
          const elapsed = Date.now() - this.lastNavigation;
          if (elapsed < minInterval) {
            violations.push(
              this._createViolation(
                'minIntervalMs',
                `>= ${minInterval}ms`,
                `${elapsed}ms`,
                {
                  message: `Navigation too rapid: ${elapsed}ms since last (min: ${minInterval}ms)`,
                  validation: requirements.minIntervalMs.validation,
                  severity: 'WARNING',
                }
              )
            );
          }
        }
      } else if (import.meta.env?.DEV) {
        console.log('[ContractValidator] ✅ minInterval check exempted', {
          source: options.source,
          reason: 'auto-advance or system-triggered',
        });
      }
    }

    return this._handleValidationResult('orchestrated', violations, {
      targetStage,
      options,
    });
  }

  /**
   * Validate direct navigation (StateCommands internal use only).
   */
  validateDirect(targetStage, caller = 'unknown') {
    const contract = this.contracts.direct;
    if (!contract) {
      throw new Error('[ContractValidator] Direct contract not found in SST');
    }

    const violations = [];
    const requirements = contract.requirements || {};

    if (requirements.authorized) {
      const isAuthorized =
        typeof caller === 'string' &&
        (caller.includes('StateCommands') || caller.includes('stageAtom'));

      if (!isAuthorized) {
        violations.push(
          this._createViolation(
            'authorized',
            'StateCommands.js or stageAtom.js',
            caller,
            {
              message: 'Direct navigation only allowed from StateCommands',
              validation: requirements.authorized.validation,
              severity: 'CRITICAL',
            }
          )
        );
      }
    }

    if (requirements.validStage && !STAGES.includes(targetStage)) {
      violations.push(
        this._createViolation('validStage', `One of: ${STAGES.join(', ')}`, targetStage, {
          message: `Invalid target stage: ${targetStage}`,
          validation: requirements.validStage.validation,
          severity: 'ERROR',
        })
      );
    }

    return this._handleValidationResult('direct', violations, {
      targetStage,
      caller,
    });
  }

  /**
   * Validate fallback navigation (emergency only).
   */
  validateFallback(targetStage, errorContext = {}) {
    const contract = this.contracts.fallback;
    if (!contract) {
      throw new Error('[ContractValidator] Fallback contract not found in SST');
    }

    const violations = [];
    const requirements = contract.requirements || {};

    if (requirements.errorCondition?.value && !errorContext.previousNavigationFailed) {
      violations.push(
        this._createViolation(
          'errorCondition',
          'previousNavigationFailed === true',
          false,
          {
            message: 'Fallback navigation only allowed after navigation failure',
            validation: requirements.errorCondition.validation,
            severity: 'WARNING',
          }
        )
      );
    }

    console.warn?.('[ContractValidator] 🚨 FALLBACK NAVIGATION USED', {
      targetStage,
      errorContext,
      contract: 'navigation.contracts.fallback',
    });

    return this._handleValidationResult('fallback', violations, {
      targetStage,
      errorContext,
      severity: 'WARNING',
    });
  }

  /**
   * Validate auto-advance request.
   */
  validateAutoAdvance(fromStage, toStage, options = {}) {
    const contract = SST.navigation?.autoAdvance;
    if (!contract) {
      throw new Error('[ContractValidator] Auto-advance contract not found in SST');
    }

    const violations = [];
    const state = stageAtom.getState?.() || {};

    if (!state.autoAdvanceEnabled) {
      violations.push(
        this._createViolation('autoAdvanceEnabled', true, false, {
          message: 'Auto-advance is disabled',
          severity: 'ERROR',
        })
      );
    }

    if (typeof stageAtom.canAutoAdvance === 'function') {
      const canAdvance = stageAtom.canAutoAdvance();
      if (!canAdvance) {
        violations.push(
          this._createViolation('minIntervalMs', true, canAdvance, {
            message: 'Auto-advance controller reported interval violation',
            severity: 'WARNING',
          })
        );
      }
    }

    return this._handleValidationResult('autoAdvance', violations, {
      fromStage,
      toStage,
      options,
    });
  }

  /**
   * Helpers
   */
  _createViolation(requirement, expected, actual, extras = {}) {
    return {
      requirement,
      expected,
      actual,
      message: extras.message || 'Contract requirement failed',
      validation: extras.validation,
      severity: extras.severity || 'ERROR',
    };
  }

  _handleValidationResult(contractType, violations, context) {
    const result = {
      valid: violations.length === 0,
      contractType,
      violations,
      context,
      timestamp: Date.now(),
    };

    if (SST.navigation?.validation?.logViolations) {
      if (result.valid) {
        console.log?.(`[ContractValidator] ✅ ${contractType} validated`, context);
      } else {
        console.error?.(`[ContractValidator] ❌ ${contractType} violated`, {
          violations,
          context,
        });
      }
    }

    if (!result.valid) {
      this.violationHistory.push(result);
      if (this.violationHistory.length > 100) {
        this.violationHistory.shift();
      }

      if (SST.navigation?.validation?.throwOnViolation) {
        const error = new Error(
          `[ContractValidator] Navigation contract violated: ${contractType}\n` +
            violations.map((v) => `  - ${v.message}`).join('\n')
        );
        error.violations = violations;
        error.context = context;
        throw error;
      }
    } else {
      this.lastNavigation = Date.now();
    }

    return result;
  }

  getViolationHistory() {
    return [...this.violationHistory];
  }

  clearViolationHistory() {
    this.violationHistory = [];
  }

  getContracts() {
    return {
      contracts: this.contracts,
      transitions: this.transitions,
      performance: this.performance,
      singleWriter: this.singleWriter,
    };
  }
}

export const contractValidator = new NavigationContractValidator();

if (typeof window !== 'undefined') {
  window.contractValidator = contractValidator;
}

export default contractValidator;

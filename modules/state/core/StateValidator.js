// modules/state/core/StateValidator.js
// SST v3.0 - Validate state integrity and consistency
// Ensures all state changes maintain system invariants

import StateReader from './StateReader';
import { SST_V3_CONFIG } from '@/config/sst3/sst-v3.0-config';

class StateValidator {
  constructor() {
    if (StateValidator.instance) {
      return StateValidator.instance;
    }

    this.reader = StateReader.getInstance();
    this.validationRules = this._initializeRules();
    this.validationHistory = [];
    this.maxHistory = 50;

    // Throttling for production performance
    this._validationThrottle = null;
    this._pendingValidation = false;
    
    // Create throttled version of validateAll
    this.validateThrottled = this._createThrottledValidate();

    StateValidator.instance = this;
  }

  // ===== RULE INITIALIZATION =====

  _initializeRules() {
    // Define constants to avoid self-reference
    const validStages = ['genesis', 'discipline', 'neural', 'velocity', 'architecture', 'harmony', 'transcendence'];
    const validTiers = ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'];

    return {
      stage: {
        validStages, // Store as property for external access
        validateCurrent: (state) => {
          const stage = state.narrative.currentStage;
          return {
            valid: validStages.includes(stage),
            error: `Invalid stage: ${stage}`
          };
        },
        validateSync: (state) => {
          const narrativeStage = state.narrative.currentStage;
          const stageStage = state.stage.currentStage;
          return {
            valid: narrativeStage === stageStage,
            error: `Stage sync error: narrative(${narrativeStage}) !== stage(${stageStage})`
          };
        }
      },

      progress: {
        validateBounds: (state) => {
          const errors = [];
          const checkBounds = (value, name) => {
            if (value < 0 || value > 1) {
              errors.push(`${name} out of bounds: ${value}`);
            }
          };

          checkBounds(state.narrative.globalProgress, 'globalProgress');
          checkBounds(state.narrative.scrollProgress, 'scrollProgress');
          checkBounds(state.narrative.morphProgress, 'morphProgress');
          checkBounds(state.stage.stageProgress, 'stageProgress');

          return {
            valid: errors.length === 0,
            error: errors.join(', ')
          };
        },
        validateConsistency: (state) => {
          const stageIndex = state.stage.stageIndex;
          const globalProgress = state.narrative.globalProgress;
          const expectedProgress = stageIndex / 6; // 7 stages, 0-6 index
          const tolerance = 0.2;

          return {
            valid: Math.abs(globalProgress - expectedProgress) <= tolerance,
            error: `Progress inconsistent: global(${globalProgress.toFixed(2)}) vs expected(${expectedProgress.toFixed(2)})`
          };
        }
      },

      quality: {
        validTiers, // Store as property for external access
        validateTier: (state) => {
          const tier = state.quality.currentQualityTier;
          return {
            valid: validTiers.includes(tier),
            error: `Invalid quality tier: ${tier}`
          };
        },
        validateParticleCount: (state) => {
          const count = state.performance.particleCount;
          const max = SST_V3_CONFIG?.performance?.maxParticles || 20000;
          return {
            valid: count >= 0 && count <= max,
            error: `Particle count out of range: ${count} (max: ${max})`
          };
        }
      },

      performance: {
        validateFPS: (state) => {
          const fps = state.performance.fps;
          return {
            valid: fps >= 0 && fps <= 240,
            error: `Invalid FPS: ${fps}`
          };
        },
        validateMemory: (state) => {
          const { used, limit } = state.resource.memory;
          return {
            valid: used <= limit,
            error: `Memory exceeded: ${used}/${limit}`
          };
        }
      },

      interaction: {
        validateMousePosition: (state) => {
          const { x, y } = state.interaction.mousePosition;
          const width = window.innerWidth || 1920;
          const height = window.innerHeight || 1080;
          
          return {
            valid: x >= 0 && x <= width && y >= 0 && y <= height,
            error: `Mouse position out of viewport: (${x}, ${y})`
          };
        }
      }
    };
  }

  // ===== VALIDATION METHODS =====

  /**
   * Validate all rules immediately
   */
  validateAll() {
    const state = this.reader.getFullState();
    const results = {
      timestamp: Date.now(),
      valid: true,
      errors: [],
      warnings: []
    };

    // Run all validation rules
    Object.entries(this.validationRules).forEach(([category, rules]) => {
      Object.entries(rules).forEach(([ruleName, rule]) => {
        if (typeof rule === 'function') {
          try {
            const result = rule(state);
            if (!result.valid) {
              results.valid = false;
              results.errors.push({
                category,
                rule: ruleName,
                error: result.error
              });
            }
          } catch (e) {
            results.warnings.push({
              category,
              rule: ruleName,
              error: `Validation error: ${e.message}`
            });
          }
        }
      });
    });

    // Record in history
    this._recordValidation(results);

    return results;
  }

  /**
   * Create throttled validation function
   * @private
   */
  _createThrottledValidate() {
    let timeoutId = null;
    let lastCall = 0;
    const delay = 500; // 500ms throttle
    
    return () => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCall;
      
      // Clear any pending timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // If enough time has passed, validate immediately
      if (timeSinceLastCall >= delay) {
        lastCall = now;
        return this.validateAll();
      }
      
      // Otherwise, schedule validation
      const remainingTime = delay - timeSinceLastCall;
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        this.validateAll();
        timeoutId = null;
      }, remainingTime);
    };
  }

  /**
   * Validate with throttling (legacy method for compatibility)
   * @deprecated Use validateThrottled instead
   */
  validateThrottled() {
    // This method is now properly implemented via _createThrottledValidate
    return this.validateThrottled();
  }

  validateCategory(category) {
    const state = this.reader.getFullState();
    const rules = this.validationRules[category];
    
    if (!rules) {
      console.error(`StateValidator: Unknown category ${category}`);
      return { valid: false, errors: [`Unknown category: ${category}`] };
    }

    const results = {
      category,
      valid: true,
      errors: []
    };

    Object.entries(rules).forEach(([ruleName, rule]) => {
      if (typeof rule === 'function') {
        const result = rule(state);
        if (!result.valid) {
          results.valid = false;
          results.errors.push({
            rule: ruleName,
            error: result.error
          });
        }
      }
    });

    return results;
  }

  // ===== SPECIFIC VALIDATORS =====

  validateStageTransition(fromStage, toStage) {
    const validStages = this.validationRules.stage.validStages;
    
    if (!validStages.includes(fromStage) || !validStages.includes(toStage)) {
      return {
        valid: false,
        error: 'Invalid stage in transition'
      };
    }

    const fromIndex = validStages.indexOf(fromStage);
    const toIndex = validStages.indexOf(toStage);
    const distance = Math.abs(toIndex - fromIndex);

    // Warn if jumping more than 2 stages
    if (distance > 2) {
      return {
        valid: true,
        warning: `Large stage jump: ${fromStage} → ${toStage} (distance: ${distance})`
      };
    }

    return { valid: true };
  }

  validateQualityChange(fromTier, toTier) {
    const validTiers = this.validationRules.quality.validTiers;
    
    if (!validTiers.includes(fromTier) || !validTiers.includes(toTier)) {
      return {
        valid: false,
        error: 'Invalid tier in transition'
      };
    }

    // Check if downgrade is due to performance
    if (validTiers.indexOf(toTier) < validTiers.indexOf(fromTier)) {
      const fps = this.reader.getCurrentFPS();
      if (fps < 30) {
        return {
          valid: true,
          reason: 'Performance-based downgrade'
        };
      }
    }

    return { valid: true };
  }

  validateMemoryFragment(fragmentId) {
    // Check if fragment exists in config
    const fragments = SST_V3_CONFIG?.memoryFragments || {};
    
    return {
      valid: fragmentId in fragments,
      error: `Unknown memory fragment: ${fragmentId}`
    };
  }

  // ===== STATE CONSISTENCY CHECKS =====

  checkStateConsistency() {
    const issues = [];
    const state = this.reader.getFullState();

    // Check stage synchronization
    if (state.narrative.currentStage !== state.stage.currentStage) {
      issues.push({
        severity: 'error',
        message: 'Stage atoms are out of sync',
        data: {
          narrative: state.narrative.currentStage,
          stage: state.stage.currentStage
        }
      });
    }

    // Check progress alignment
    const stageProgress = state.stage.stageProgress;
    const morphProgress = state.narrative.morphProgress;
    if (Math.abs(stageProgress - morphProgress) > 0.1) {
      issues.push({
        severity: 'warning',
        message: 'Stage and morph progress misaligned',
        data: { stageProgress, morphProgress }
      });
    }

    // Check resource limits
    const memoryUsage = state.resource.memory.used / state.resource.memory.limit;
    if (memoryUsage > 0.9) {
      issues.push({
        severity: 'warning',
        message: 'High memory usage',
        data: { usage: `${(memoryUsage * 100).toFixed(1)}%` }
      });
    }

    return {
      consistent: issues.filter(i => i.severity === 'error').length === 0,
      issues
    };
  }

  // ===== HISTORY & REPORTING =====

  _recordValidation(results) {
    this.validationHistory.push(results);
    
    if (this.validationHistory.length > this.maxHistory) {
      this.validationHistory.shift();
    }
  }

  getValidationHistory() {
    return [...this.validationHistory];
  }

  getLastValidation() {
    return this.validationHistory[this.validationHistory.length - 1] || null;
  }

  generateReport() {
    const current = this.validateAll();
    const consistency = this.checkStateConsistency();
    const state = this.reader.getFullState();

    return {
      timestamp: Date.now(),
      valid: current.valid && consistency.consistent,
      state: {
        stage: state.narrative.currentStage,
        quality: state.quality.currentQualityTier,
        fps: state.performance.fps,
        particles: state.performance.particleCount
      },
      validation: current,
      consistency,
      history: {
        recentValidations: this.validationHistory.slice(-5),
        errorRate: this._calculateErrorRate()
      }
    };
  }

  _calculateErrorRate() {
    if (this.validationHistory.length === 0) return 0;
    
    const errors = this.validationHistory.filter(v => !v.valid).length;
    return errors / this.validationHistory.length;
  }

  // ===== DEVELOPMENT HELPERS =====

  runDiagnostics() {
    console.group('🔍 State Validation Diagnostics');
    
    const validation = this.validateAll();
    console.log('Validation:', validation.valid ? '✅ PASS' : '❌ FAIL');
    if (validation.errors.length > 0) {
      console.table(validation.errors);
    }
    
    const consistency = this.checkStateConsistency();
    console.log('Consistency:', consistency.consistent ? '✅ PASS' : '⚠️ ISSUES');
    if (consistency.issues.length > 0) {
      console.table(consistency.issues);
    }
    
    const report = this.generateReport();
    console.log('Error Rate:', `${(report.history.errorRate * 100).toFixed(1)}%`);
    
    console.groupEnd();
    
    return report;
  }

  // ===== SINGLETON ACCESS =====

  static getInstance() {
    if (!StateValidator.instance) {
      StateValidator.instance = new StateValidator();
    }
    return StateValidator.instance;
  }

  /**
   * Wire up automatic validation on state changes
   * Call this once during app initialization
   */
  static wireToStateController() {
    const validator = StateValidator.getInstance();
    const StateController = import('@modules/state/core/StateController').then(module => {
      const controller = module.default;
      
      // Subscribe to after-write events
      controller.onAfterWrite((state, entry) => {
        // Use throttled validation for performance
        validator.validateThrottled();
      });
      
      console.log('✅ StateValidator wired to StateController');
    }).catch(err => {
      console.error('Failed to wire StateValidator:', err);
    });
  }
}

// Export singleton instance
export default StateValidator.getInstance();

// Development helpers
if (import.meta.env.DEV) {
  window.StateValidator = StateValidator;
  window.stateValidator = StateValidator.getInstance();
  
  // Quick validation methods
  window.sv = {
    validate: () => window.stateValidator.validateAll(),
    check: () => window.stateValidator.checkStateConsistency(),
    report: () => window.stateValidator.generateReport(),
    diagnose: () => window.stateValidator.runDiagnostics()
  };
  
  console.log('✅ StateValidator available at window.stateValidator');
  console.log('✅ Quick access: window.sv.validate(), window.sv.diagnose()');
}
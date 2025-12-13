// canon-console/runtime/contracts/registry.js
// Contract validation for SST v3.3 event catalog

export const CONTRACT_VERSION = '3.3.0';

export const ContractRegistry = {
  version: CONTRACT_VERSION,
  lastUpdated: new Date().toISOString(),

  events: {
    // Opening sequence events
    CURSOR_SHOW: {
      version: '1.0.0',
      optional: ['timestamp'],
    },
    
    CURSOR_BLINK: {
      version: '1.0.0',
      required: ['count'],
      optional: ['interval'],
    },
    
    TERMINAL_TYPE: {
      version: '1.0.0',
      required: ['lines'],
      optional: ['typeSpeed', 'lineDelay'],
    },
    
    SCREEN_FILL: {
      version: '1.0.0',
      required: ['text'],
      optional: ['scrollSpeed'],
    },
    
    // Engine/Renderer gates
    ENGINE_VIEWPORT_HINT: {
      version: '1.0.0',
      optional: ['width', 'height', 'aspect', 'cameraZ'],
    },
    
    BUILD_EMERGENCE_BLUEPRINT: {
      version: '1.0.0',
      required: ['mode', 'source', 'target', 'count'],
      optional: ['tierRatios', 'viewportHint', 'direction'],
      constraints: {
        tierRatios: {
          arrayLength: 4,
          sumTo: 1.0,
        }
      },
    },
    
    PARTICLES_EMERGED: {
      version: '1.0.0',
      optional: ['timestamp', 'count'],
    },
    
    // Renderer tuning
    RENDERER_TUNE: {
      version: '1.0.0',
      optional: [
        'driftAmp', 'vibeAmp', 'flutterAmp', 'verticalBias',
        'rotZSpeedDegPerSec', 'trails', 'brightToward', 'dimAway',
        'tierReveal', 'tierSpeedScale', 'breathingAmp',
        'breathingPeriodSec', 'flareProb', 'flareGain', 'pulseOnce'
      ],
  },
  
  MORPH_PROGRESS: {
    version: '1.0.0',
    required: ['progress', 'source'],
    optional: ['timestamp'],
    constraints: {
      progress: { min: 0, max: 1 }
    },
  },
    
  // Stage management (with migration)
  STAGE_CHANGE: {
    version: '1.0.0',
    required: ['from', 'to', 'source'],
    optional: ['duration', 'trigger', 'reason', 'timestamp'],
      deprecated: {
        stage: {
          since: '3.0.0',
          use: 'from and to',
          removal: '4.0.0',
        }
      },
      migration: payload => {
        // Handle old {stage: 'name'} format
        if (payload && 'stage' in payload && !('to' in payload)) {
          const migrated = {
            from: payload.from || 'unknown',
            to: payload.stage,
          };
          delete payload.stage;
          Object.assign(payload, migrated);
        }
        return payload;
      },
    },
    
    // Quality management (with migration)
    QUALITY_CHANGE: {
      version: '1.0.0',
      required: ['tier'],
      valid: {
        tier: ['LOW', 'MEDIUM', 'HIGH', 'ULTRA']
      },
      deprecated: {
        quality: {
          since: '3.0.0',
          use: 'tier',
          removal: '4.0.0',
        }
      },
      migration: payload => {
        if (payload && 'quality' in payload && !('tier' in payload)) {
          payload.tier = payload.quality;
          delete payload.quality;
        }
        return payload;
      },
    },
    
    BLUEPRINT_READY: {
      version: '1.0.0',
      required: ['blueprint'],
      optional: ['stage', 'quality', 'mode', 'cached', 'buildTime'],
    },
    
    // Memory fragments (with alias handling)
    MEMORY_FRAGMENT_TRIGGER: {
      version: '1.0.0',
      required: ['stage'],
      optional: ['scrollPosition', 'fragmentId'],
    },
    
    // Audio events
    AUDIO_START_STAGE: {
      version: '1.0.0',
      required: ['stage'],
      optional: ['volume', 'fadeIn'],
    },
  },

  validate(type, payload) {
    // Handle alias
    if (type === 'TRIGGER_FRAGMENT') {
      type = 'MEMORY_FRAGMENT_TRIGGER';
    }
    
    const contract = this.events[type];
    if (!contract) {
      // Unknown event - allow but log
      if (typeof window !== 'undefined' && window.CANON_CONSOLE?.debug) {
        console.debug(`[Contract] Unknown event: ${type}`);
      }
      return { valid: true, type: 'unknown', payload };
    }

    const result = {
      valid: true,
      violations: [],
      deprecations: [],
      migrated: false,
      payload: payload || {},
    };

    // Apply migrations
    if (typeof contract.migration === 'function') {
      const original = JSON.stringify(payload || {});
      result.payload = contract.migration({ ...(payload || {}) });
      if (JSON.stringify(result.payload) !== original) {
        result.migrated = true;
      }
    }

    // Check required fields
    const missing = (contract.required || []).filter(f => !(f in (result.payload || {})));
    if (missing.length) {
      result.valid = false;
      result.violations.push({
        type: 'missing_required',
        fields: missing,
        message: `Missing required fields: ${missing.join(', ')}`
      });
    }

    // Check valid values
    if (contract.valid) {
      Object.keys(contract.valid).forEach(field => {
        const allowed = contract.valid[field];
        const value = result.payload[field];
        if (value !== undefined && !allowed.includes(value)) {
          result.valid = false;
          result.violations.push({
            type: 'invalid_value',
            field,
            value,
            valid: allowed,
            message: `Invalid ${field}: "${value}". Must be one of: ${allowed.join(', ')}`
          });
        }
      });
    }

    // Check constraints
    if (contract.constraints) {
      Object.keys(contract.constraints).forEach(field => {
        const constraint = contract.constraints[field];
        const value = result.payload[field];
        
        if (value !== undefined) {
          // Numeric constraints
          if (constraint.min !== undefined && value < constraint.min) {
            result.valid = false;
            result.violations.push({
              type: 'constraint_violation',
              field,
              value,
              constraint: 'min',
              expected: constraint.min,
              message: `${field} below minimum: ${value} < ${constraint.min}`
            });
          }
          if (constraint.max !== undefined && value > constraint.max) {
            result.valid = false;
            result.violations.push({
              type: 'constraint_violation',
              field,
              value,
              constraint: 'max',
              expected: constraint.max,
              message: `${field} above maximum: ${value} > ${constraint.max}`
            });
          }
          
          // Array constraints
          if (constraint.arrayLength !== undefined && Array.isArray(value)) {
            if (value.length !== constraint.arrayLength) {
              result.valid = false;
              result.violations.push({
                type: 'constraint_violation',
                field,
                value: value.length,
                constraint: 'arrayLength',
                expected: constraint.arrayLength,
                message: `${field} wrong length: expected ${constraint.arrayLength}, got ${value.length}`
              });
            }
          }
        }
      });
    }

    // Check deprecations
    if (contract.deprecated) {
      Object.keys(contract.deprecated).forEach(field => {
        if (field in (payload || {})) {
          result.deprecations.push({
            field,
            ...contract.deprecated[field]
          });
        }
      });
    }

    return result;
  }
};

export default ContractRegistry;

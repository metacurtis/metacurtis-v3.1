// @doctor:4b-disposers
const __doctorDisposers = []; /**
 * Canon Contract Registry v1.0.0
 * Single source of truth for event/data contracts (versioned).
 */export const CONTRACT_VERSION = '1.0.0';

export const ContractRegistry = {
  version: CONTRACT_VERSION,
  lastUpdated: '2025-08-19T21-54-34',

  events: {
    STAGE_CHANGE: {
      version: '1.0.0',
      required: ['from', 'to'],
      optional: ['duration', 'trigger']
    },
    QUALITY_CHANGE: {
      version: '1.0.0',
      required: ['tier'],
      valid: { tier: ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'] },
      deprecated: { quality: { since: '0.9.0', use: 'tier', removal: '2.0.0' } },
      migration: (payload) => {
        if (payload && 'quality' in payload && !('tier' in payload)) {
          payload = { ...payload, tier: payload.quality };
          delete payload.quality;
        }
        return payload;
      }
    },
    BLUEPRINT_READY: {
      version: '1.0.0',
      required: ['stage', 'quality', 'blueprint'],
      optional: ['cached', 'buildTime']
    }
  },

  blueprints: {
    version: '1.0.0',
    required: ['particleCount', 'atmosphericPositions', 'allenAtlasPositions'],
    optional: ['tierDistribution', 'behaviorData'],
    constraints: {
      particleCount: { min: 100, max: 15000 }
    }
  },

  deprecations: {
    active: [
    {
      type: 'field',
      path: 'QUALITY_CHANGE.quality',
      since: '0.9.0',
      removal: '2.0.0',
      migration: 'Use tier instead'
    }],

    getActive() {
      return this.active;
    },
    check(type, payload) {
      const out = [];
      this.active.forEach((d) => {
        if (d.path.split('.')[0] === type) {
          const field = d.path.split('.').pop();
          if (payload && field in payload) {
            out.push({ field, message: d.migration, removal: d.removal });
          }
        }
      });
      return out;
    }
  },

  validate(type, payload) {
    const contract = this.events[type];
    if (!contract) return { valid: true, type: 'unknown', payload };

    const result = {
      valid: true,
      violations: [],
      deprecations: this.deprecations.check(type, payload || {}),
      migrated: false,
      payload: payload || {}
    };

    if (typeof contract.migration === 'function') {
      result.payload = contract.migration({ ...(payload || {}) }) || {};
      if (JSON.stringify(result.payload) !== JSON.stringify(payload || {})) {
        result.migrated = true;
      }
    }

    const missing = (contract.required || []).filter((f) => !(f in (result.payload || {})));
    if (missing.length) {
      result.valid = false;
      result.violations.push({ type: 'missing_required', fields: missing });
    }

    if (contract.valid) {
      Object.keys(contract.valid).forEach((field) => {
        const allowed = contract.valid[field];
        if (field in (result.payload || {}) && !allowed.includes(result.payload[field])) {
          result.valid = false;
          result.violations.push({
            type: 'invalid_value',
            field,
            value: result.payload[field],
            valid: allowed
          });
        }
      });
    }

    return result;
  },

  getDriftReport() {
    return {
      version: this.version,
      deprecations: this.deprecations.getActive(),
      coverage: this.getCoverage()
    };
  },
  getCoverage() {
    const total = Object.keys(this.events).length;
    const tested = 0;
    return { total, tested, percentage: total ? (tested / total * 100).toFixed(1) + '%' : '0%' };
  }
};

export default ContractRegistry; // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}
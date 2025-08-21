// @doctor:4b-disposers
const __doctorDisposers = []; /**
 * Canon Guard L1 - Passive Validator
 * Full contract validation against SST
 */export class CanonGuardL1 {
  constructor(contracts) {
    this.violations = [];
    this.validations = 0;
    this.startTime = Date.now();

    // Default contracts if none provided
    this.contracts = contracts || {
      morphing: {
        inputs: ['scrollProgress', 'morphProgress'],
        outputs: ['uMorphProgress', 'uFadeProgress'],
        validation: {
          range: [0, 1],
          updateFrequency: 60
        }
      },
      blueprint: {
        required: ['particleCount', 'atmosphericPositions', 'allenAtlasPositions'],
        constraints: {
          particleCount: { min: 0, max: 15000 },
          tierDistribution: { sum: 1.0 }
        }
      },
      events: {
        STAGE_CHANGE: {
          required: ['from', 'to'],
          optional: ['duration', 'reason']
        },
        QUALITY_CHANGE: {
          required: ['tier'],
          valid: ['LOW', 'MEDIUM', 'HIGH', 'ULTRA']
        },
        BLUEPRINT_READY: {
          required: ['stage', 'quality', 'blueprint'],
          optional: ['cached', 'buildTime']
        }
      }
    };

    console.log('🛡️ Canon Guard L1: Initialized with contracts');
  }

  validate(type, data) {
    this.validations++;

    // Event validation
    if (this.contracts.events[type]) {
      return this.validateEvent(type, data);
    }

    // Blueprint validation
    if (type === 'blueprint') {
      return this.validateBlueprint(data);
    }

    // Morphing validation
    if (type === 'morphing') {
      return this.validateMorphing(data);
    }

    return { valid: true, type: 'unknown' };
  }

  validateEvent(type, data) {
    const contract = this.contracts.events[type];
    const violations = [];

    // Check required fields
    if (contract.required) {
      const missing = contract.required.filter((field) => !(field in (data || {})));
      if (missing.length > 0) {
        violations.push({
          type: 'missing_required',
          fields: missing,
          message: `Event ${type} missing required fields: ${missing.join(', ')}`
        });
      }
    }

    // Check valid values
    if (contract.valid && data?.tier) {
      if (!contract.valid.includes(data.tier)) {
        violations.push({
          type: 'invalid_value',
          field: 'tier',
          value: data.tier,
          message: `Invalid tier: ${data.tier}. Must be one of: ${contract.valid.join(', ')}`
        });
      }
    }

    if (violations.length > 0) {
      this.logViolation(type, data, violations);
      return { valid: false, violations };
    }

    return { valid: true };
  }

  validateBlueprint(blueprint) {
    if (!blueprint) {
      return { valid: false, message: 'Blueprint is null' };
    }

    const violations = [];
    const contract = this.contracts.blueprint;

    // Check required fields
    for (const field of contract.required) {
      if (!blueprint[field]) {
        violations.push({
          type: 'missing_field',
          field,
          message: `Blueprint missing required field: ${field}`
        });
      }
    }

    // Check particle count constraints
    if (blueprint.particleCount) {
      const { min, max } = contract.constraints.particleCount;
      if (blueprint.particleCount < min || blueprint.particleCount > max) {
        violations.push({
          type: 'constraint_violation',
          field: 'particleCount',
          value: blueprint.particleCount,
          message: `Particle count ${blueprint.particleCount} outside range [${min}, ${max}]`
        });
      }
    }

    if (violations.length > 0) {
      this.logViolation('blueprint', blueprint, violations);
      return { valid: false, violations };
    }

    return { valid: true };
  }

  validateMorphing(data) {
    const violations = [];
    const contract = this.contracts.morphing;

    // Check range constraints
    if ('morphProgress' in data) {
      const [min, max] = contract.validation.range;
      if (data.morphProgress < min || data.morphProgress > max) {
        violations.push({
          type: 'range_violation',
          field: 'morphProgress',
          value: data.morphProgress,
          message: `morphProgress ${data.morphProgress} outside range [${min}, ${max}]`
        });
      }
    }

    if (violations.length > 0) {
      this.logViolation('morphing', data, violations);
      return { valid: false, violations };
    }

    return { valid: true };
  }

  logViolation(type, data, violations) {
    const entry = {
      type,
      data,
      violations,
      timestamp: Date.now()
    };

    this.violations.push(entry);

    // Keep only last 100 violations
    if (this.violations.length > 100) {
      this.violations.shift();
    }

    console.warn(`🛡️ Canon Guard: ${type} validation failed`, violations[0].message);
  }

  getViolations() {
    return this.violations;
  }

  getStats() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    return {
      uptime,
      validations: this.validations,
      violations: this.violations.length,
      violationRate:
      this.validations > 0 ?
      (this.violations.length / this.validations * 100).toFixed(2) + '%' :
      '0%'
    };
  }
}

export default CanonGuardL1; // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}
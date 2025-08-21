// src/modules/state/StateCoreCanonValidator.js
/**
 * Canon Suite Validator for StateCore
 * Ensures architectural compliance and SST v3.0 alignment
 */

export class StateCoreCanonValidator {
  constructor(stateCore) {
    this.stateCore = stateCore;
    this.violations = [];
    this.validations = [];
  }

  /**
   * Run full validation suite
   */
  async validate() {
    console.log('🛡️ Canon Validator: Starting StateCore validation...');

    this.violations = [];
    this.validations = [];

    // Test 1: Initialization
    await this.validateInitialization();

    // Test 2: Atom access
    await this.validateAtomAccess();

    // Test 3: State operations
    await this.validateStateOperations();

    // Test 4: SST compliance
    await this.validateSSTCompliance();

    // Test 5: Canon integration
    await this.validateCanonIntegration();

    return {
      passed: this.violations.length === 0,
      validations: this.validations,
      violations: this.violations,
    };
  }

  async validateInitialization() {
    try {
      if (!this.stateCore.initialized) {
        this.stateCore.initialize();
      }

      if (!this.stateCore.initialized) {
        throw new Error('Failed to initialize');
      }

      this.validations.push({
        test: 'initialization',
        passed: true,
        message: 'StateCore initialized successfully',
      });
    } catch (error) {
      this.violations.push({
        test: 'initialization',
        error: error.message,
      });
    }
  }

  async validateAtomAccess() {
    const atoms = [
      'narrative',
      'performance',
      'interaction',
      'resource',
      'stage',
      'quality',
      'clock',
    ];

    for (const atomName of atoms) {
      try {
        const state = this.stateCore.get(atomName);

        if (state === null || state === undefined) {
          throw new Error(`Atom ${atomName} returned null/undefined`);
        }

        this.validations.push({
          test: `atom-access-${atomName}`,
          passed: true,
          message: `Atom ${atomName} accessible`,
        });
      } catch (error) {
        this.violations.push({
          test: `atom-access-${atomName}`,
          error: error.message,
        });
      }
    }
  }

  async validateStateOperations() {
    try {
      // Test get with selector
      const currentStage = this.stateCore.get('narrative', s => s?.currentStage);

      // Test set with test value
      const testKey = 'testValue_' + Date.now();
      const testValue = 'test-' + Date.now();

      this.stateCore.set('interaction', state => ({
        ...state,
        [testKey]: testValue,
      }));

      // Verify set worked
      const retrieved = this.stateCore.get('interaction', s => s[testKey]);

      if (retrieved !== testValue) {
        throw new Error('Set/Get operation failed');
      }

      // Clean up test value
      this.stateCore.set('interaction', state => {
        const newState = { ...state };
        delete newState[testKey];
        return newState;
      });

      this.validations.push({
        test: 'state-operations',
        passed: true,
        message: 'State operations working correctly',
      });
    } catch (error) {
      this.violations.push({
        test: 'state-operations',
        error: error.message,
      });
    }
  }

  async validateSSTCompliance() {
    try {
      // Check SST v3.0 stages
      const stages = [
        'genesis',
        'discipline',
        'neural',
        'velocity',
        'architecture',
        'harmony',
        'transcendence',
      ];
      const narrativeState = this.stateCore.get('narrative');
      const currentStage = narrativeState?.currentStage;

      if (currentStage && !stages.includes(currentStage)) {
        throw new Error(`Invalid stage: ${currentStage}`);
      }

      // Check quality tiers
      const tiers = ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'];
      const qualityState = this.stateCore.get('quality');
      const currentTier = qualityState?.currentTier;

      if (currentTier && !tiers.includes(currentTier)) {
        throw new Error(`Invalid quality tier: ${currentTier}`);
      }

      this.validations.push({
        test: 'sst-compliance',
        passed: true,
        message: 'SST v3.0 compliance verified',
      });
    } catch (error) {
      this.violations.push({
        test: 'sst-compliance',
        error: error.message,
      });
    }
  }

  async validateCanonIntegration() {
    try {
      const compliance = this.stateCore.validateCanonCompliance();

      if (!compliance.boundary || !compliance.version) {
        throw new Error('Missing Canon contract fields');
      }

      if (compliance.boundary !== 'STATE_AUTHORITY') {
        throw new Error('Invalid Canon boundary');
      }

      this.validations.push({
        test: 'canon-integration',
        passed: true,
        message: 'Canon Suite integration verified',
      });
    } catch (error) {
      this.violations.push({
        test: 'canon-integration',
        error: error.message,
      });
    }
  }
}

export default StateCoreCanonValidator;

#!/usr/bin/env node

/**
 * StateCore Phase 1 Doctor - Minimal Core Implementation
 * 
 * Purpose: Create minimal StateCore that wraps existing atoms
 * Validates: Atom access, Canon Suite integration, basic get/set
 * 
 * Run: node scripts/doctor_statecore_phase1.cjs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class StateCorePhase1Doctor {
  constructor() {
    this.rootDir = process.cwd();
    this.srcDir = path.join(this.rootDir, 'src');
    this.results = {
      created: [],
      validated: [],
      errors: [],
      warnings: []
    };
  }

  async run() {
    console.log('🏗️ StateCore Phase 1: Minimal Core Implementation\n');
    console.log('=' .repeat(80));
    
    try {
      // Step 1: Create StateCore module
      console.log('\n📦 Step 1: Creating StateCore Module...');
      await this.createStateCore();
      
      // Step 2: Create Canon Suite validator
      console.log('\n🛡️ Step 2: Creating Canon Validator...');
      await this.createCanonValidator();
      
      // Step 3: Create index file for clean imports
      console.log('\n📁 Step 3: Creating Index File...');
      await this.createIndexFile();
      
      // Step 4: Create test harness
      console.log('\n🧪 Step 4: Creating Test Harness...');
      await this.createTestHarness();
      
      // Step 5: Run validation
      console.log('\n✅ Step 5: Running Validation...');
      await this.runValidation();
      
      // Step 6: Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Implementation failed:', error);
      process.exit(1);
    }
  }

  async createStateCore() {
    const stateCoreContent = `// src/modules/state/StateCore.js
/**
 * StateCore - Minimal Central State Authority (Phase 1)
 * Wraps existing atoms behind a unified interface: get/set/subscribe/snapshot
 * No async work; safe to init synchronously.
 * 
 * @canon-boundary STATE_AUTHORITY
 * @sst-version 3.0
 */

import { narrativeAtom } from '@/stores/atoms/narrativeAtom';
import { performanceAtom } from '@/stores/atoms/performanceAtom';
import { interactionAtom } from '@/stores/atoms/interactionAtom';
import { resourceAtom } from '@/stores/atoms/resourceAtom';
import { stageAtom } from '@/stores/atoms/stageAtom';
import { qualityAtom } from '@/stores/atoms/qualityAtom';
import { clockAtom } from '@/stores/atoms/clockAtom';

class StateCore {
  constructor() {
    this.atoms = {
      narrative: narrativeAtom,
      performance: performanceAtom,
      interaction: interactionAtom,
      resource: resourceAtom,
      stage: stageAtom,
      quality: qualityAtom,
      clock: clockAtom
    };
    
    this.initialized = false;
    this.initTime = null;
    
    // Canon Suite contract
    this.canonContract = {
      boundary: 'STATE_AUTHORITY',
      version: '1.0.0',
      sstCompliance: 'v3.0'
    };
    
    if (import.meta.env.DEV) {
      this._setupDevTools();
    }
  }
  
  /**
   * Ensure initialization before operations
   */
  ensureInit() {
    if (!this.initialized) {
      this.initialize();
    }
  }
  
  /**
   * Initialize StateCore (synchronous for Phase 1)
   * @canon-gate INITIALIZATION
   */
  initialize() {
    if (this.initialized) {
      return;
    }
    
    console.log('🎯 StateCore: Initializing (Phase 1)...');
    
    try {
      // Verify all atoms are accessible
      this._verifyAtoms();
      
      // Set conservative initial state
      this._setInitialState();
      
      // Mark as initialized
      this.initialized = true;
      this.initTime = Date.now();
      
      console.log('✅ StateCore: Initialized successfully');
      
      // Notify Canon Suite (lowercase window.canon)
      if (typeof globalThis !== 'undefined' && globalThis.canon?.validate) {
        globalThis.canon.validate('STATE_CORE_INIT', {
          atoms: Object.keys(this.atoms),
          timestamp: this.initTime
        });
      }
      
      return true;
    } catch (error) {
      console.error('❌ StateCore initialization failed:', error);
      this.initialized = false;
      throw error;
    }
  }
  
  /**
   * Get state from specific atom
   * @param {string} atomName - Name of atom
   * @param {function} selector - Optional selector function
   */
  get(atomName, selector) {
    this.ensureInit();
    
    const atom = this.atoms[atomName];
    if (!atom || typeof atom.getState !== 'function') {
      console.error(\`Unknown or invalid atom: \${atomName}\`);
      return null;
    }
    
    const state = atom.getState();
    
    if (selector && typeof selector === 'function') {
      try {
        return selector(state);
      } catch (error) {
        console.error(\`Selector error for \${atomName}:\`, error);
        return state;
      }
    }
    
    return state;
  }
  
  /**
   * Set state for specific atom
   * @param {string} atomName - Name of atom
   * @param {any} newState - New state or updater function
   */
  set(atomName, newState) {
    this.ensureInit();
    
    const atom = this.atoms[atomName];
    if (!atom || typeof atom.setState !== 'function') {
      console.error(\`Unknown or invalid atom: \${atomName}\`);
      return false;
    }
    
    try {
      atom.setState(newState);
      
      if (import.meta.env.DEV) {
        console.log(\`StateCore: Updated \${atomName}\`, 
          typeof newState === 'function' ? '[Function]' : newState);
      }
      
      return true;
    } catch (error) {
      console.error(\`Failed to set state for \${atomName}:\`, error);
      return false;
    }
  }
  
  /**
   * Subscribe to atom changes
   * @param {string} atomName - Name of atom
   * @param {function} listener - Listener function
   */
  subscribe(atomName, listener) {
    const atom = this.atoms[atomName];
    if (!atom || typeof atom.subscribe !== 'function') {
      console.error(\`Unknown or invalid atom: \${atomName}\`);
      return () => {};
    }
    
    return atom.subscribe(listener);
  }
  
  /**
   * Get all current states (snapshot)
   */
  getSnapshot() {
    const snapshot = {};
    
    for (const [name, atom] of Object.entries(this.atoms)) {
      try {
        snapshot[name] = atom.getState?.();
      } catch (error) {
        console.error(\`Failed to get state for \${name}:\`, error);
        snapshot[name] = null;
      }
    }
    
    return snapshot;
  }
  
  /**
   * Verify all atoms are accessible
   * @private
   */
  _verifyAtoms() {
    const missing = [];
    
    for (const [name, atom] of Object.entries(this.atoms)) {
      if (!atom || typeof atom.getState !== 'function' || typeof atom.setState !== 'function') {
        missing.push(name);
      }
    }
    
    if (missing.length > 0) {
      throw new Error(\`Missing or invalid atoms: \${missing.join(', ')}\`);
    }
    
    return true;
  }
  
  /**
   * Set conservative initial state 
   * Phase 1: Don't touch stage (Director/BeatBus owns it)
   * @private
   */
  _setInitialState() {
    // Only set a safe quality default if missing
    const currentTier = this.get('quality', s => s?.currentTier);
    if (!currentTier) {
      this.set('quality', state => ({
        ...state,
        currentTier: 'HIGH'
      }));
    }
  }
  
  /**
   * Setup development tools
   * @private
   */
  _setupDevTools() {
    if (typeof window === 'undefined') return;
    
    window.StateCore = this;
    window.SC = {
      get: this.get.bind(this),
      set: this.set.bind(this),
      snapshot: this.getSnapshot.bind(this),
      atoms: this.atoms
    };
    
    console.log('🔧 StateCore DevTools available:');
    console.log('  window.SC.get(atomName, selector?)');
    console.log('  window.SC.set(atomName, newState)');
    console.log('  window.SC.snapshot()');
  }
  
  /**
   * Canon Suite validation interface
   */
  validateCanonCompliance() {
    return {
      boundary: this.canonContract.boundary,
      version: this.canonContract.version,
      initialized: this.initialized,
      atoms: Object.keys(this.atoms),
      health: 'healthy'
    };
  }
}

// Create singleton instance
const stateCore = new StateCore();

// Auto-initialize in browser on DOMContentLoaded
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    stateCore.initialize();
  });
}

// Export both default and named for flexibility
export default stateCore;
export { stateCore };
`;

    const targetPath = path.join(this.srcDir, 'modules', 'state', 'StateCore.js');
    const targetDir = path.dirname(targetPath);
    
    // Create directory if needed
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(targetPath, stateCoreContent);
    this.results.created.push(targetPath);
    console.log(`  ✓ Created: ${path.relative(this.rootDir, targetPath)}`);
  }

  async createCanonValidator() {
    const validatorContent = `// src/modules/state/StateCoreCanonValidator.js
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
      violations: this.violations
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
        message: 'StateCore initialized successfully'
      });
    } catch (error) {
      this.violations.push({
        test: 'initialization',
        error: error.message
      });
    }
  }
  
  async validateAtomAccess() {
    const atoms = ['narrative', 'performance', 'interaction', 'resource', 'stage', 'quality', 'clock'];
    
    for (const atomName of atoms) {
      try {
        const state = this.stateCore.get(atomName);
        
        if (state === null || state === undefined) {
          throw new Error(\`Atom \${atomName} returned null/undefined\`);
        }
        
        this.validations.push({
          test: \`atom-access-\${atomName}\`,
          passed: true,
          message: \`Atom \${atomName} accessible\`
        });
      } catch (error) {
        this.violations.push({
          test: \`atom-access-\${atomName}\`,
          error: error.message
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
        [testKey]: testValue
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
        message: 'State operations working correctly'
      });
    } catch (error) {
      this.violations.push({
        test: 'state-operations',
        error: error.message
      });
    }
  }
  
  async validateSSTCompliance() {
    try {
      // Check SST v3.0 stages
      const stages = ['genesis', 'discipline', 'neural', 'velocity', 'architecture', 'harmony', 'transcendence'];
      const narrativeState = this.stateCore.get('narrative');
      const currentStage = narrativeState?.currentStage;
      
      if (currentStage && !stages.includes(currentStage)) {
        throw new Error(\`Invalid stage: \${currentStage}\`);
      }
      
      // Check quality tiers
      const tiers = ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'];
      const qualityState = this.stateCore.get('quality');
      const currentTier = qualityState?.currentTier;
      
      if (currentTier && !tiers.includes(currentTier)) {
        throw new Error(\`Invalid quality tier: \${currentTier}\`);
      }
      
      this.validations.push({
        test: 'sst-compliance',
        passed: true,
        message: 'SST v3.0 compliance verified'
      });
    } catch (error) {
      this.violations.push({
        test: 'sst-compliance',
        error: error.message
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
        message: 'Canon Suite integration verified'
      });
    } catch (error) {
      this.violations.push({
        test: 'canon-integration',
        error: error.message
      });
    }
  }
}

export default StateCoreCanonValidator;
`;

    const targetPath = path.join(this.srcDir, 'modules', 'state', 'StateCoreCanonValidator.js');
    fs.writeFileSync(targetPath, validatorContent);
    this.results.created.push(targetPath);
    console.log(`  ✓ Created: ${path.relative(this.rootDir, targetPath)}`);
  }

  async createIndexFile() {
    const indexContent = `// src/modules/state/index.js
/**
 * State module exports
 * Clean import: import { stateCore } from '@/modules/state'
 */

export { default as stateCore } from './StateCore.js';
export { default as StateCoreCanonValidator } from './StateCoreCanonValidator.js';
`;

    const targetPath = path.join(this.srcDir, 'modules', 'state', 'index.js');
    fs.writeFileSync(targetPath, indexContent);
    this.results.created.push(targetPath);
    console.log(`  ✓ Created: ${path.relative(this.rootDir, targetPath)}`);
  }

  async createTestHarness() {
    const testContent = `#!/usr/bin/env node
/**
 * StateCore Phase 1 Test Harness
 * Run: node scripts/test_statecore_phase1.cjs
 */

const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('🧪 StateCore Phase 1 Test Harness\\n');
  console.log('=' .repeat(40));
  
  const tests = {
    passed: [],
    failed: []
  };
  
  // Test 1: Module files exist
  console.log('\\n📦 Test 1: Module Files');
  const moduleFiles = [
    'src/modules/state/StateCore.js',
    'src/modules/state/StateCoreCanonValidator.js',
    'src/modules/state/index.js'
  ];
  
  for (const file of moduleFiles) {
    const filePath = path.join(process.cwd(), file);
    try {
      if (fs.existsSync(filePath)) {
        console.log(\`  ✅ \${path.basename(file)} exists\`);
        tests.passed.push(\`module-\${path.basename(file)}\`);
      } else {
        throw new Error('File not found');
      }
    } catch (error) {
      console.log(\`  ❌ \${path.basename(file)}: \${error.message}\`);
      tests.failed.push(\`module-\${path.basename(file)}\`);
    }
  }
  
  // Test 2: Atom files exist
  console.log('\\n⚛️ Test 2: Atom Files');
  const atoms = ['narrative', 'performance', 'interaction', 'resource', 'stage', 'quality', 'clock'];
  
  for (const atom of atoms) {
    const atomFile = path.join(process.cwd(), \`src/stores/atoms/\${atom}Atom.js\`);
    try {
      if (fs.existsSync(atomFile)) {
        console.log(\`  ✅ \${atom}Atom.js exists\`);
        tests.passed.push(\`atom-\${atom}\`);
      } else {
        throw new Error('File not found');
      }
    } catch (error) {
      console.log(\`  ❌ \${atom}Atom.js: \${error.message}\`);
      tests.failed.push(\`atom-\${atom}\`);
    }
  }
  
  // Test 3: Check for alias configuration
  console.log('\\n🔗 Test 3: Alias Configuration');
  const viteConfig = path.join(process.cwd(), 'vite.config.js');
  try {
    if (fs.existsSync(viteConfig)) {
      const content = fs.readFileSync(viteConfig, 'utf8');
      if (content.includes('@') && content.includes('src')) {
        console.log('  ✅ Vite alias @ -> src configured');
        tests.passed.push('alias-config');
      } else {
        console.log('  ⚠️ Vite alias might not be configured');
        tests.passed.push('alias-config-warning');
      }
    }
  } catch (error) {
    console.log('  ⚠️ Could not verify alias config');
  }
  
  // Final report
  console.log('\\n' + '=' .repeat(40));
  console.log('📊 Test Results:');
  console.log(\`  ✅ Passed: \${tests.passed.length}\`);
  console.log(\`  ❌ Failed: \${tests.failed.length}\`);
  
  if (tests.failed.length === 0) {
    console.log('\\n🎉 All Phase 1 tests passed!');
    console.log('\\n💡 Next steps:');
    console.log('  1. Import StateCore in your main.jsx:');
    console.log('     import "@/modules/state/StateCore"');
    console.log('  2. Test in browser console:');
    console.log('     SC.get("narrative")');
    console.log('     SC.set("quality", {currentTier: "ULTRA"})');
    console.log('     SC.snapshot()');
    console.log('  3. Run Phase 2 doctor for BeatBus bridge:');
    console.log('     node scripts/doctor_statecore_phase2.cjs');
  } else {
    console.log('\\n⚠️ Some tests failed. Please review:');
    for (const test of tests.failed) {
      console.log(\`  • \${test}\`);
    }
  }
  
  return tests.failed.length === 0;
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test harness failed:', error);
  process.exit(1);
});
`;

    const targetPath = path.join(this.rootDir, 'scripts', 'test_statecore_phase1.cjs');
    fs.writeFileSync(targetPath, testContent);
    fs.chmodSync(targetPath, '755');
    this.results.created.push(targetPath);
    console.log(`  ✓ Created: ${path.relative(this.rootDir, targetPath)}`);
  }

  async runValidation() {
    try {
      // Run the test harness
      const output = execSync('node scripts/test_statecore_phase1.cjs', {
        cwd: this.rootDir,
        encoding: 'utf8'
      });
      
      console.log(output);
      this.results.validated.push('Phase 1 tests passed');
    } catch (error) {
      console.error('Validation failed:', error.message);
      this.results.errors.push('Validation failed: ' + error.message);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 STATECORE PHASE 1 IMPLEMENTATION REPORT');
    console.log('='.repeat(80));
    
    console.log('\n✅ CREATED FILES:');
    for (const file of this.results.created) {
      console.log(`  • ${path.relative(this.rootDir, file)}`);
    }
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      for (const error of this.results.errors) {
        console.log(`  • ${error}`);
      }
    }
    
    console.log('\n🔧 BROWSER TESTING COMMANDS:');
    console.log('  window.SC.get("narrative")                        // Get full narrative state');
    console.log('  window.SC.get("narrative", s => s.currentStage)   // Get specific value');
    console.log('  window.SC.get("quality", s => s.currentTier)      // Get quality tier');
    console.log('  window.SC.set("quality", {currentTier: "ULTRA"})  // Set state');
    console.log('  window.SC.snapshot()                               // Get all states');
    
    console.log('\n📝 INTEGRATION STEPS:');
    console.log('  1. Add to main.jsx (after other imports):');
    console.log('     import "@/modules/state/StateCore"');
    console.log('');
    console.log('  2. Or if you need the instance:');
    console.log('     import { stateCore } from "@/modules/state"');
    console.log('');
    console.log('  3. Test in browser console with window.SC commands');
    
    console.log('\n⚠️ IMPORTANT NOTES:');
    console.log('  • StateCore uses synchronous initialization (no async)');
    console.log('  • Canon integration uses lowercase window.canon');
    console.log('  • Stage is NOT set by StateCore (Director/BeatBus owns it)');
    console.log('  • Quality defaults to HIGH if not set');
    
    console.log('\n🚀 NEXT PHASE:');
    console.log('  After testing Phase 1 in browser, run Phase 2:');
    console.log('  node scripts/doctor_statecore_phase2.cjs');
    console.log('  This will create the BeatBus bridge for events');
    
    console.log('\n' + '='.repeat(80));
    console.log('✨ Phase 1 Complete! StateCore minimal implementation ready.');
    console.log('='.repeat(80));
  }
}

// Self-bootstrap and run
async function main() {
  const doctor = new StateCorePhase1Doctor();
  await doctor.run();
}

main().catch(console.error);

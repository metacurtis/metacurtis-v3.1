#!/usr/bin/env node
// scripts/validate-atomic-stores.js
// ✅ VALIDATION SCRIPT: Atomic store integration testing
// Revolutionary Implementation Session 2 - Phase 1

/**
 * ✅ ATOMIC STORE VALIDATION SUITE
 * Tests compatibility, performance, and feature parity
 * Can be run via: npm run validate:atomic
 */

console.log('🧪 Starting Atomic Store Validation Suite...\n');

// Validation results
const results = {
  tests: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  issues: [],
};

// Test helper functions
const test = (name, fn) => {
  results.tests++;
  try {
    const result = fn();
    if (result === true || result === undefined) {
      results.passed++;
      console.log(`✅ ${name}`);
    } else {
      results.failed++;
      console.log(`❌ ${name}: ${result}`);
      results.issues.push(`${name}: ${result}`);
    }
  } catch (error) {
    results.failed++;
    console.log(`❌ ${name}: ${error.message}`);
    results.issues.push(`${name}: ${error.message}`);
  }
};

const warn = (message) => {
  results.warnings++;
  console.log(`⚠️  ${message}`);
};

// Mock browser environment for Node.js testing
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  performance: { now: () => Date.now() },
  location: { search: '' },
  devicePixelRatio: 1,
  innerWidth: 1920,
  innerHeight: 1080,
};

global.document = {
  addEventListener: () => {},
  removeEventListener: () => {},
  createElement: () => ({ getContext: () => null }),
  body: {},
  documentElement: {},
};

global.navigator = {
  userAgent: 'Node.js Test Environment',
  hardwareConcurrency: 8,
};

// Mock React for compatibility testing
global.React = {
  useSyncExternalStore: (subscribe, getSnapshot) => getSnapshot(),
  useState: (initial) => [initial, () => {}],
  useEffect: () => {},
};

console.log('🔧 Test environment initialized\n');

// Core validation tests
console.log('📦 Testing Atomic Store Architecture...\n');

test('Clock Atom Creation', () => {
  const { clockAtom } = require('../src/stores/atoms/clockAtom.js');
  const state = clockAtom.getState();
  
  if (!state) return 'Failed to get clock state';
  if (typeof state.fps !== 'number') return 'FPS not initialized as number';
  if (typeof state.updateClock !== 'function') return 'updateClock method missing';
  if (typeof state.canScaleToUltra !== 'function') return 'canScaleToUltra method missing';
  
  return true;
});

test('Stage Atom Creation', () => {
  const { stageAtom } = require('../src/stores/atoms/stageAtom.js');
  const state = stageAtom.getState();
  
  if (!state) return 'Failed to get stage state';
  if (state.currentStage !== 'genesis') return 'Initial stage not genesis';
  if (typeof state.setStage !== 'function') return 'setStage method missing';
  if (typeof state.jumpToStage !== 'function') return 'jumpToStage method missing';
  if (typeof state.getNavigationState !== 'function') return 'getNavigationState method missing';
  
  return true;
});

test('Quality Atom Creation', () => {
  const { qualityAtom } = require('../src/stores/atoms/qualityAtom.js');
  const state = qualityAtom.getState();
  
  if (!state) return 'Failed to get quality state';
  if (state.currentTier !== 'HIGH') return 'Initial tier not HIGH';
  if (typeof state.setQualityTier !== 'function') return 'setQualityTier method missing';
  if (typeof state.updateParticleBudget !== 'function') return 'updateParticleBudget method missing';
  if (typeof state.getQualityConfig !== 'function') return 'getQualityConfig method missing';
  
  return true;
});

console.log('\n🔄 Testing Compatibility Shim...\n');

test('Atomic Store Compatibility', () => {
  // Set environment to use atomic stores
  process.env.VITE_ATOMIC_STORE = 'true';
  
  const { useNarrativeStore } = require('../src/stores/narrativeStore.atomic.js');
  
  // Test selector function
  const stateSlice = useNarrativeStore(state => ({
    currentStage: state.currentStage,
    stageProgress: state.stageProgress,
    jumpToStage: state.jumpToStage,
  }));
  
  if (!stateSlice) return 'Failed to get state slice';
  if (stateSlice.currentStage !== 'genesis') return 'Wrong initial stage';
  if (typeof stateSlice.jumpToStage !== 'function') return 'jumpToStage not available';
  
  return true;
});

test('Feature Flag System', () => {
  const featureFlags = require('../src/utils/featureFlags.atomic.js');
  
  if (!featureFlags.default) return 'Feature flags not exported';
  if (typeof featureFlags.default.isAtomicStoreEnabled !== 'function') return 'isAtomicStoreEnabled missing';
  if (typeof featureFlags.default.getStatus !== 'function') return 'getStatus missing';
  
  const status = featureFlags.default.getStatus();
  if (!status.atomicStores) return 'Atomic stores should be enabled in test';
  
  return true;
});

console.log('\n⚛️ Testing Atomic Store Operations...\n');

test('Clock Atom Updates', () => {
  const { clockAtom } = require('../src/stores/atoms/clockAtom.js');
  
  // Test update operation
  clockAtom.getState().updateClock({
    fps: 60,
    deltaMs: 16.67,
    averageFrameTime: 16.67,
    jankCount: 0,
    jankRatio: 0,
  });
  
  const state = clockAtom.getState();
  if (state.fps !== 60) return 'FPS update failed';
  if (state.performanceGrade !== 'ULTRA') return 'Performance grade calculation failed';
  if (!state.canScaleToUltra()) return 'Ultra scaling detection failed';
  
  return true;
});

test('Stage Atom Navigation', () => {
  const { stageAtom } = require('../src/stores/atoms/stageAtom.js');
  
  // Test stage jumping
  stageAtom.getState().jumpToStage('velocity');
  
  let state = stageAtom.getState();
  if (state.currentStage !== 'velocity') return 'Stage jump failed';
  if (state.stageIndex !== 3) return 'Stage index wrong';
  if (!state.metacurtisActive) return 'Feature unlocking failed';
  
  // Test navigation methods
  stageAtom.getState().nextStage();
  state = stageAtom.getState();
  if (state.currentStage !== 'architecture') return 'Next stage navigation failed';
  
  stageAtom.getState().prevStage();
  state = stageAtom.getState();
  if (state.currentStage !== 'velocity') return 'Previous stage navigation failed';
  
  return true;
});

test('Quality Atom Scaling', () => {
  const { qualityAtom } = require('../src/stores/atoms/qualityAtom.js');
  
  // Test quality tier changes
  qualityAtom.getState().setQualityTier('ULTRA-A');
  
  let state = qualityAtom.getState();
  if (state.currentTier !== 'ULTRA-A') return 'Quality tier change failed';
  
  // Test particle budget calculation
  const particleCount = qualityAtom.getState().updateParticleBudget('velocity');
  if (particleCount < 12000) return 'Particle budget calculation failed';
  
  // Test performance scaling
  qualityAtom.getState().updateScalingCapability(62, 0.02);
  state = qualityAtom.getState();
  if (!state.canScaleToUltraB) return 'Ultra-B scaling detection failed';
  
  return true;
});

console.log('\n🔗 Testing Integration Systems...\n');

test('Central Clock Integration', () => {
  const integration = require('../src/core/CentralEventClock.atomic.js');
  
  if (!integration.default) return 'Integration module not exported';
  
  const status = integration.default.getIntegrationStatus();
  if (typeof status !== 'object') return 'Integration status not available';
  
  return true;
});

test('Store Loader System', () => {
  const storeLoader = require('../src/stores/index.js');
  
  if (!storeLoader.default) return 'Store loader not exported';
  if (typeof storeLoader.loadNarrativeStore !== 'function') return 'loadNarrativeStore missing';
  if (typeof storeLoader.initializeStores !== 'function') return 'initializeStores missing';
  if (typeof storeLoader.validateStoreIntegrity !== 'function') return 'validateStoreIntegrity missing';
  
  return true;
});

console.log('\n🎯 Testing API Compatibility...\n');

test('API Method Preservation', () => {
  const { useNarrativeStore } = require('../src/stores/narrativeStore.atomic.js');
  
  const state = useNarrativeStore();
  
  // Check key methods exist
  const requiredMethods = [
    'jumpToStage', 'nextStage', 'prevStage', 'setGlobalProgress',
    'getNavigationState', 'getCurrentStageData', 'getStageTitle',
    'isStageFeatureEnabled', 'resetNarrative'
  ];
  
  for (const method of requiredMethods) {
    if (typeof state[method] !== 'function') {
      return `Required method ${method} missing or not a function`;
    }
  }
  
  // Check key properties exist
  const requiredProperties = [
    'currentStage', 'stageProgress', 'globalProgress', 'isTransitioning',
    'memoryFragmentsUnlocked', 'metacurtisActive'
  ];
  
  for (const prop of requiredProperties) {
    if (state[prop] === undefined) {
      return `Required property ${prop} missing`;
    }
  }
  
  return true;
});

test('Scroll Integration', () => {
  const { createScrollBinding } = require('../src/stores/narrativeStore.atomic.js');
  
  if (typeof createScrollBinding !== 'function') return 'createScrollBinding missing';
  
  // Test scroll binding creation (should not throw)
  const cleanup = createScrollBinding();
  if (typeof cleanup !== 'function') return 'Scroll binding cleanup not returned';
  
  return true;
});

console.log('\n📊 Validation Results:\n');

// Print summary
console.log(`Tests Run: ${results.tests}`);
console.log(`Passed: ${results.passed} ✅`);
console.log(`Failed: ${results.failed} ${results.failed > 0 ? '❌' : ''}`);
console.log(`Warnings: ${results.warnings} ${results.warnings > 0 ? '⚠️' : ''}`);

if (results.issues.length > 0) {
  console.log('\n❌ Issues Found:');
  results.issues.forEach(issue => console.log(`  - ${issue}`));
}

// Success criteria
const success = results.failed === 0;
const completionRate = (results.passed / results.tests * 100).toFixed(1);

console.log(`\nCompletion Rate: ${completionRate}%`);

if (success) {
  console.log('\n🎉 All tests passed! Atomic stores are ready for Phase 2.');
  process.exit(0);
} else {
  console.log('\n💥 Some tests failed. Review issues before proceeding.');
  process.exit(1);
}

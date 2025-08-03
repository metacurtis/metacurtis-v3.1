// modules/state/index.js
// Initialize and wire the state management system

import StateController from './core/StateController';
import StateReader from './core/StateReader';
import StateValidator from './core/StateValidator';

/**
 * Initialize the state management system
 * Call this once during app startup
 */
export function initializeStateManagement() {
  console.log('🚀 Initializing state management system...');

  // Get singleton instances
  const controller = StateController.getInstance();
  const reader = StateReader.getInstance();
  const validator = StateValidator.getInstance();

  // Wire validator to controller for automatic validation
  const unsubscribe = controller.onAfterWrite((state, entry) => {
    // High-risk mutations get immediate validation
    const highRiskCategories = ['transition', 'quality', 'session'];

    if (highRiskCategories.includes(entry.category)) {
      validator.validateAll();
    } else {
      // Other changes use throttled validation
      validator.validateThrottled();
    }
  });

  // Log successful initialization
  console.log('✅ State management initialized:');
  console.log('  - StateController: Ready');
  console.log('  - StateReader: Ready');
  console.log('  - StateValidator: Wired to Controller');

  // Return cleanup function
  return () => {
    unsubscribe();
    controller.dispose();
    console.log('🧹 State management system cleaned up');
  };
}

// Export the singletons for direct access
export { default as StateController } from './core/StateController';
export { default as StateReader } from './core/StateReader';
export { default as StateValidator } from './core/StateValidator';

// Development mode: Initialize automatically
if (import.meta.env.DEV) {
  // Auto-initialize in development for easier testing
  window.addEventListener('DOMContentLoaded', () => {
    window.__stateCleanup = initializeStateManagement();
    console.log('💡 Dev mode: State management auto-initialized');
    console.log('💡 Cleanup available at window.__stateCleanup()');
  });
}

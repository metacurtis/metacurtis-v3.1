// modules/state/index.js
// Initialize and wire the state management system

import StateController from './core/StateController';
import StateReader from './core/StateReader';
import StateValidator from './core/StateValidator';
import AtomicBridge from './bridges/AtomicToBeatBus';
import StateDebugger from './bridges/StateDebugger';

// Import BeatBus once it's available
let BeatBus = null;
let EventValidator = null;

/**
 * Initialize the state management system
 * Call this once during app startup
 * @param {Object} options - Initialization options
 * @param {boolean} options.enableDebugger - Enable state debugger in dev mode
 * @param {boolean} options.enableEventValidation - Enable event validation
 * @param {boolean} options.enableEventDebugger - Enable event debugger
 */
export async function initializeStateManagement(options = {}) {
  const {
    enableDebugger = true,
    enableEventValidation = import.meta.env.DEV,
    enableEventDebugger = import.meta.env.DEV
  } = options;
  
  console.log('🚀 Initializing state management system...');
  
  // Get singleton instances
  const controller = StateController.getInstance();
  const _reader = StateReader.getInstance();
  const validator = StateValidator.getInstance();
  
  // Wire validator to controller for automatic validation
  const unsubscribeValidator = controller.onAfterWrite((state, entry) => {
    // High-risk mutations get immediate validation
    const highRiskCategories = ['transition', 'quality', 'session'];
    
    if (highRiskCategories.includes(entry.category)) {
      validator.validateAll();
    } else {
      // Other changes use throttled validation
      validator.validateThrottled();
    }
  });
  
  // Try to import and initialize BeatBus
  try {
    const beatBusModule = await import('@modules/orchestration/core/BeatBus');
    BeatBus = beatBusModule.default;
    
    // Initialize EventValidator if requested
    if (enableEventValidation) {
      const validatorModule = await import('../orchestration/core/EventValidator.js');
      EventValidator = validatorModule.default;
      EventValidator.initialize({
        enabled: true,
        strict: false,
        validateUnknown: true
      });
    }
    
    // Initialize EventDebugger if requested
    if (enableEventDebugger && import.meta.env.DEV) {
      const debuggerModule = await import('@modules/orchestration/core/EventDebugger');
      const EventDebugger = debuggerModule.default;
      EventDebugger.initialize({
        autoShow: false,
        position: 'bottom-right'
      });
      
      // Add keyboard shortcut for event debugger
      window.addEventListener('keydown', handleEventDebuggerShortcut);
      console.log('  - EventDebugger: Ready (Ctrl+Shift+E to toggle)');
    }
    
    // Connect AtomicBridge to BeatBus
    AtomicBridge.initialize(BeatBus);
    console.log('  - AtomicBridge: Connected to BeatBus');
  } catch (err) {
    console.warn('  - BeatBus not available yet:', err.message);
  }
  
  // Initialize state debugger in dev mode
  if (import.meta.env.DEV && enableDebugger) {
    StateDebugger.initialize({
      autoShow: false,
      recordSnapshots: true,
      createUI: true
    });
    
    // Add keyboard shortcut for state debugger
    window.addEventListener('keydown', handleStateDebuggerShortcut);
    console.log('  - StateDebugger: Ready (Ctrl+Shift+D to toggle)');
  }
  
  // Log successful initialization
  console.log('✅ State management initialized:');
  console.log('  - StateController: Ready');
  console.log('  - StateReader: Ready');
  console.log('  - StateValidator: Wired to Controller');
  if (BeatBus) {
    console.log('  - BeatBus: Connected');
  }
  
  // Return cleanup function
  return () => {
    unsubscribeValidator();
    
    // Dispose bridges
    AtomicBridge.dispose();
    
    // Clean up debuggers
    if (import.meta.env.DEV) {
      window.removeEventListener('keydown', handleStateDebuggerShortcut);
      window.removeEventListener('keydown', handleEventDebuggerShortcut);
    }
    
    // Dispose core systems
    controller.dispose();
    
    console.log('🧹 State management system cleaned up');
  };
}

// Keyboard shortcut handlers
function handleStateDebuggerShortcut(e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    StateDebugger.getInstance().toggle();
  }
}

function handleEventDebuggerShortcut(e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'E') {
    const EventDebugger = window.eventDebugger;
    if (EventDebugger) {
      EventDebugger.toggle();
    }
  }
}

/**
 * Connect BeatBus to the state system after initialization
 * Use this if BeatBus isn't available during initial setup
 */
export async function connectBeatBus() {
  if (!BeatBus) {
    const beatBusModule = await import('@modules/orchestration/core/BeatBus');
    BeatBus = beatBusModule.default;
  }
  
  AtomicBridge.initialize(BeatBus);
  console.log('🌉 BeatBus connected to state system');
  
  return BeatBus;
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
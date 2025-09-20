// canon-console/runtime/contract-tap.js
// Validates BeatBus events against contract registry

import ContractRegistry from './contracts/registry.js';

export function installContractTap(BeatBus, incidentCollector) {
  if (!BeatBus || !incidentCollector) {
    console.warn('[Contract-Tap] Missing dependencies');
    return;
  }

  let validationCount = 0;
  let violationCount = 0;
  let migrationCount = 0;

  // Intercept emit to validate
  const originalEmit = BeatBus.emit.bind(BeatBus);
  
  BeatBus.emit = function(eventType, payload) {
    validationCount++;
    
    // Validate against contract
    const result = ContractRegistry.validate(eventType, payload);
    
    // Report violations
    if (!result.valid) {
      violationCount++;
      incidentCollector.add({
        code: 'CONTRACT_VIOLATION',
        severity: 'warn',
        message: `Contract violation in ${eventType}`,
        context: {
          event: eventType,
          violations: result.violations,
          payload: payload
        },
        timestamp: Date.now()
      });
    }
    
    // Report deprecations
    if (result.deprecations && result.deprecations.length > 0) {
      incidentCollector.add({
        code: 'DEPRECATED_FIELD',
        severity: 'info',
        message: `Deprecated field usage in ${eventType}`,
        context: {
          event: eventType,
          deprecations: result.deprecations,
          payload: payload
        },
        timestamp: Date.now()
      });
    }
    
    // Track migrations
    if (result.migrated) {
      migrationCount++;
      console.log(`[Contract-Tap] Migrated payload for ${eventType}`);
    }
    
    // Emit with potentially migrated payload
    return originalEmit(eventType, result.payload || payload);
  };
  
  // Expose stats
  window.CANON_CONTRACT_TAP = {
    getStats: () => ({
      validationCount,
      violationCount,
      migrationCount,
      violationRate: validationCount > 0 
        ? ((violationCount / validationCount) * 100).toFixed(1) + '%'
        : '0%'
    }),
    getRegistry: () => ContractRegistry
  };
  
  console.log('📝 Contract-Tap installed and validating events');
}

export default { installContractTap };

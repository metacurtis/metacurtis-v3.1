#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function main() {
  console.log('=== Session 2: Event Vocabulary & Contract Registry ===\n');
  
  // Step 1: Create safe events expansion
  const safeEventsCode = `// src/theater/events-safe.js
// Safe subset of events for incremental testing

export const EVENTS_CORE = {
  // Critical opening sequence events
  STAGE_CHANGE: 'STAGE_CHANGE',
  QUALITY_CHANGE: 'QUALITY_CHANGE',
  BLUEPRINT_READY: 'BLUEPRINT_READY',
  PARTICLES_EMERGED: 'PARTICLES_EMERGED',
};

export const EVENTS_OPENING = {
  // Opening sequence specific
  CURSOR_SHOW: 'CURSOR_SHOW',
  CURSOR_BLINK: 'CURSOR_BLINK',
  TERMINAL_TYPE: 'TERMINAL_TYPE',
  SCREEN_FILL: 'SCREEN_FILL',
  ENGINE_VIEWPORT_HINT: 'ENGINE_VIEWPORT_HINT',
  ENABLE_SCROLL: 'ENABLE_SCROLL',
};

export const EVENTS_RUNTIME = {
  // Runtime events
  MORPH_PROGRESS: 'MORPH_PROGRESS',
  RENDERER_TUNE: 'RENDERER_TUNE',
  TICK: 'TICK',
  BUILD_EMERGENCE_BLUEPRINT: 'BUILD_EMERGENCE_BLUEPRINT',
};

// Feature flag controlled expansion
export const EVENTS = (() => {
  const events = { ...EVENTS_CORE };
  
  // Always include opening events (they're working)
  Object.assign(events, EVENTS_OPENING);
  
  // Conditionally add runtime events
  if (typeof window !== 'undefined') {
    if (window.CANON_FEATURES?.runtimeEvents !== false) {
      Object.assign(events, EVENTS_RUNTIME);
    }
  }
  
  return events;
})();

export default EVENTS;
`;

  await fs.writeFile('src/theater/events-safe.js', safeEventsCode);
  console.log('✓ Created events-safe.js with feature flags');

  // Step 2: Create contract registry
  const contractRegistryCode = `// canon-console/runtime/contracts/registry.js
// Ported from src/canon/contracts/registry.js with improvements

export const CONTRACT_VERSION = '1.1.0';

export const ContractRegistry = {
  version: CONTRACT_VERSION,
  lastUpdated: new Date().toISOString(),

  events: {
    STAGE_CHANGE: {
      version: '1.0.0',
      required: ['from', 'to'],
      optional: ['duration', 'trigger', 'reason'],
    },
    
    QUALITY_CHANGE: {
      version: '1.0.0',
      required: ['tier'],
      valid: { tier: ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'] },
      deprecated: { 
        quality: { 
          since: '0.9.0', 
          use: 'tier', 
          removal: '2.0.0' 
        } 
      },
      migration: payload => {
        if (payload && 'quality' in payload && !('tier' in payload)) {
          console.log('[Contract] Migrating quality -> tier');
          payload = { ...payload, tier: payload.quality };
          delete payload.quality;
        }
        return payload;
      },
    },
    
    BLUEPRINT_READY: {
      version: '1.0.0',
      required: ['stage', 'quality', 'blueprint'],
      optional: ['cached', 'buildTime'],
    },
    
    PARTICLES_EMERGED: {
      version: '1.0.0',
      optional: ['timestamp', 'count'],
    },
    
    MORPH_PROGRESS: {
      version: '1.0.0',
      required: ['value'],
      constraints: {
        value: { min: 0, max: 1 }
      }
    },
  },

  validate(type, payload) {
    const contract = this.events[type];
    if (!contract) return { valid: true, type: 'unknown', payload };

    const result = {
      valid: true,
      violations: [],
      deprecations: [],
      migrated: false,
      payload: payload || {},
    };

    // Apply migrations
    if (typeof contract.migration === 'function') {
      const migrated = contract.migration({ ...(payload || {}) });
      if (JSON.stringify(migrated) !== JSON.stringify(payload || {})) {
        result.payload = migrated;
        result.migrated = true;
      }
    }

    // Check required fields
    const missing = (contract.required || []).filter(f => !(f in (result.payload || {})));
    if (missing.length) {
      result.valid = false;
      result.violations.push({ 
        type: 'missing_required', 
        fields: missing 
      });
    }

    // Check valid values
    if (contract.valid) {
      Object.keys(contract.valid).forEach(field => {
        const allowed = contract.valid[field];
        if (field in (result.payload || {}) && !allowed.includes(result.payload[field])) {
          result.valid = false;
          result.violations.push({
            type: 'invalid_value',
            field,
            value: result.payload[field],
            valid: allowed,
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
          if (constraint.min !== undefined && value < constraint.min) {
            result.valid = false;
            result.violations.push({
              type: 'constraint_violation',
              field,
              value,
              constraint: 'min',
              expected: constraint.min
            });
          }
          if (constraint.max !== undefined && value > constraint.max) {
            result.valid = false;
            result.violations.push({
              type: 'constraint_violation',
              field,
              value,
              constraint: 'max',
              expected: constraint.max
            });
          }
        }
      });
    }

    // Check deprecations
    if (contract.deprecated) {
      Object.keys(contract.deprecated).forEach(field => {
        if (field in (payload || {})) {
          result.deprecations.push(contract.deprecated[field]);
        }
      });
    }

    return result;
  }
};

export default ContractRegistry;
`;

  // Create contracts directory
  await fs.mkdir('canon-console/runtime/contracts', { recursive: true });
  await fs.writeFile('canon-console/runtime/contracts/registry.js', contractRegistryCode);
  console.log('✓ Created contract registry');

  // Step 3: Create contract-tap
  const contractTapCode = `// canon-console/runtime/contract-tap.js
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
        message: \`Contract violation in \${eventType}\`,
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
        message: \`Deprecated field usage in \${eventType}\`,
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
      console.log(\`[Contract-Tap] Migrated payload for \${eventType}\`);
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
`;

  await fs.writeFile('canon-console/runtime/contract-tap.js', contractTapCode);
  console.log('✓ Created contract-tap');

  // Step 4: Test script
  const testScript = `// Test Contract Validation
console.log('=== Testing Contract Validation ===');

// Test 1: Emit with deprecated field
console.log('Test 1: Deprecated field (quality -> tier)');
window.BeatBus.emit('QUALITY_CHANGE', { quality: 'HIGH' });

// Test 2: Missing required field
setTimeout(() => {
  console.log('Test 2: Missing required fields');
  window.BeatBus.emit('STAGE_CHANGE', { from: 'genesis' }); // Missing 'to'
}, 500);

// Test 3: Invalid value
setTimeout(() => {
  console.log('Test 3: Invalid tier value');
  window.BeatBus.emit('QUALITY_CHANGE', { tier: 'SUPER' }); // Invalid tier
}, 1000);

// Test 4: Check stats
setTimeout(() => {
  console.log('Test 4: Contract validation stats:');
  console.log(window.CANON_CONTRACT_TAP?.getStats?.());
  
  // Check incidents
  const incidents = window.CANON_CONSOLE?.incidents?.get?.() || [];
  const contractIncidents = incidents.filter(i => 
    i.code === 'CONTRACT_VIOLATION' || 
    i.code === 'DEPRECATED_FIELD'
  );
  
  console.log('Contract incidents:', contractIncidents);
}, 1500);
`;

  await fs.writeFile('test-contracts.js', testScript);
  console.log('✓ Created test script\n');

  console.log('=== Next Step: Wire into Injector ===');
  console.log('Add this after violation-tap in canon-console/browser/inject.js:\n');
  console.log(`
.then(function () {
  // Install Contract-Tap
  return imp('runtime/contract-tap.js', 'contractTap', function (m) {
    try {
      const BeatBus = w.BeatBus || w.theaterBus?.bus;
      const incidentCollector = w.CANON_CONSOLE?.incidents || { add: console.warn };
      
      if (BeatBus && m.default) {
        m.default.installContractTap(BeatBus, incidentCollector);
        L.contractTap = true;
        console.log('Contract-Tap installed');
      }
    } catch (e) {
      errors.push(e);
      console.warn('Contract-Tap error:', e);
    }
  });
})
`);

  console.log('\n=== Session 2 Phase 1 Complete ===');
  console.log('1. Safe events file created');
  console.log('2. Contract registry ported');
  console.log('3. Contract-tap created');
  console.log('4. Ready to wire into injector');
}

main().catch(console.error);

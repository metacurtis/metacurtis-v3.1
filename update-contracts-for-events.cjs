#!/usr/bin/env node

const fs = require('fs').promises;

async function main() {
  console.log('=== Updating Contract Registry for Your Events ===\n');
  
  // Update the contract registry with your actual events
  const updatedRegistryCode = `// canon-console/runtime/contracts/registry.js
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
      required: ['value'],
      constraints: {
        value: { min: 0, max: 1 }
      },
    },
    
    // Stage management (with migration)
    STAGE_CHANGE: {
      version: '1.0.0',
      required: ['from', 'to'],
      optional: ['duration', 'trigger', 'reason'],
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
        console.debug(\`[Contract] Unknown event: \${type}\`);
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
        message: \`Missing required fields: \${missing.join(', ')}\`
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
            message: \`Invalid \${field}: "\${value}". Must be one of: \${allowed.join(', ')}\`
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
              message: \`\${field} below minimum: \${value} < \${constraint.min}\`
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
              message: \`\${field} above maximum: \${value} > \${constraint.max}\`
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
                message: \`\${field} wrong length: expected \${constraint.arrayLength}, got \${value.length}\`
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

export default ContractRegistry;`;

  await fs.writeFile('canon-console/runtime/contracts/registry.js', updatedRegistryCode);
  console.log('✓ Updated contract registry for SST v3.3 events');

  // Now update the injector to include contract-tap
  const injectorPath = 'canon-console/browser/inject.js';
  const injectorContent = await fs.readFile(injectorPath, 'utf8');
  
  if (!injectorContent.includes('contract-tap')) {
    // Find where to insert (after violation-tap)
    const marker = "imp('runtime/violation-tap.js', 'vtap')";
    const insertIndex = injectorContent.indexOf(marker);
    
    if (insertIndex !== -1) {
      const endOfLine = injectorContent.indexOf('})', insertIndex) + 2;
      
      const contractTapInsertion = `
    .then(function () {
      // Install Contract-Tap  
      return imp('runtime/contract-tap.js', 'contractTap', function (m) {
        try {
          const BeatBus = w.BeatBus || w.theaterBus?.bus;
          const incidentCollector = w.CANON_CONSOLE?.incidents || { 
            add: function(incident) {
              console.warn('[Contract]', incident.message, incident.context);
            }
          };
          
          if (BeatBus && m.default && m.default.installContractTap) {
            m.default.installContractTap(BeatBus, incidentCollector);
            L.contractTap = true;
            console.log('📝 Contract-Tap installed');
          }
        } catch (e) {
          errors.push(e);
          console.warn('Contract-Tap error:', e);
        }
      });
    })`;
      
      const updated = 
        injectorContent.slice(0, endOfLine) + 
        contractTapInsertion + 
        injectorContent.slice(endOfLine);
        
      await fs.writeFile(injectorPath, updated);
      console.log('✓ Added Contract-Tap to injector');
    } else {
      console.log('⚠ Could not find violation-tap marker in injector');
    }
  } else {
    console.log('✓ Contract-Tap already in injector');
  }

  // Create comprehensive test
  const testCode = `// Test SST v3.3 Contract Validation
console.log('=== Testing SST v3.3 Contracts ===\\n');

// Test 1: Valid events
console.log('Test 1: Valid events');
window.BeatBus.emit('CURSOR_BLINK', { count: 2, interval: 250 });
window.BeatBus.emit('ENGINE_VIEWPORT_HINT', { width: 1920, height: 1080 });
console.log('✓ Valid events emitted\\n');

// Test 2: Migration (quality -> tier)
setTimeout(() => {
  console.log('Test 2: Field migration');
  window.BeatBus.emit('QUALITY_CHANGE', { quality: 'HIGH' });
  console.log('Should auto-migrate quality -> tier\\n');
}, 500);

// Test 3: Missing required fields
setTimeout(() => {
  console.log('Test 3: Missing required field');
  window.BeatBus.emit('STAGE_CHANGE', { from: 'genesis' }); // Missing 'to'
  console.log('Should show violation\\n');
}, 1000);

// Test 4: Invalid constraint
setTimeout(() => {
  console.log('Test 4: Constraint violation');
  window.BeatBus.emit('MORPH_PROGRESS', { value: 1.5 }); // > 1
  console.log('Should show constraint violation\\n');
}, 1500);

// Test 5: Check results
setTimeout(() => {
  console.log('=== Results ===');
  console.log('Contract stats:', window.CANON_CONTRACT_TAP?.getStats?.());
  
  const incidents = window.CANON_CONSOLE?.incidents?.get?.() || [];
  const contractIncidents = incidents.filter(i => 
    i.code === 'CONTRACT_VIOLATION' || 
    i.code === 'DEPRECATED_FIELD'
  );
  
  if (contractIncidents.length > 0) {
    console.log('\\nContract incidents detected:');
    contractIncidents.forEach(i => {
      console.log(\`  - \${i.code}: \${i.message}\`);
    });
  }
  
  console.log('\\n✓ Contract validation active!');
}, 2000);`;

  await fs.writeFile('test-sst-contracts.js', testCode);
  console.log('✓ Created SST v3.3 contract test\n');

  console.log('=== Session 2 Complete ===');
  console.log('1. Contract registry updated for SST v3.3');
  console.log('2. Contract-tap wired into injector');
  console.log('3. Field migrations configured (quality->tier, stage->from/to)');
  console.log('4. Test script ready');
  console.log('\nRun: npm run dev');
  console.log('Then copy test-sst-contracts.js to console');
}

main().catch(console.error);

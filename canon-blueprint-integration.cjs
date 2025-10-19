#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function main() {
  console.log(colors.blue + '=== Session 1: BlueprintGuard Integration ===' + colors.reset);
  
  // Step 1: Verify environment
  try {
    await fs.access('canon-console');
    console.log(colors.green + '✓' + colors.reset + ' canon-console found');
  } catch {
    console.log(colors.red + '✗ canon-console not found' + colors.reset);
    process.exit(1);
  }

  // Step 2: Check for backup
  try {
    await fs.access('canon-console.backup');
  } catch {
    console.log(colors.yellow + '⚠ Creating backup...' + colors.reset);
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    await execAsync('cp -r canon-console canon-console.backup');
  }

  // Step 3: Create blueprint-guard-v2.js
  console.log('\n' + colors.blue + '=== Creating BlueprintGuard V2 ===' + colors.reset);
  
  const guardCode = `// canon-console/runtime/blueprint-guard-v2.js
export class BlueprintGuardV2 {
  constructor() {
    this.validationCount = 0;
    this.fallbacksApplied = 0;
  }

  install(BeatBus, incidentCollector, EVENTS) {
    if (!BeatBus || !EVENTS?.BLUEPRINT_READY) {
      console.warn('BlueprintGuardV2: Cannot install - missing dependencies');
      return;
    }

    BeatBus.on(EVENTS.BLUEPRINT_READY, (payload) => {
      const validation = this.validate(payload?.blueprint);
      
      if (!validation.ok) {
        incidentCollector.add({
          code: 'BLUEPRINT_INVALID',
          severity: 'warn',
          message: 'Blueprint validation failed: ' + validation.errors.join(', '),
          context: {
            errors: validation.errors,
            count: validation.count,
            stage: payload?.stage,
            quality: payload?.quality
          },
          timestamp: Date.now()
        });

        if (payload && payload.blueprint) {
          const fallback = this.createFallback(validation.count || 1000);
          payload.blueprint = fallback;
          payload.cached = false;
          payload._guard_fixed = true;
          this.fallbacksApplied++;
          
          incidentCollector.add({
            code: 'BLUEPRINT_FALLBACK_APPLIED',
            severity: 'info',
            message: 'Fallback blueprint applied',
            context: {
              particleCount: fallback.activeCount,
              originalErrors: validation.errors
            },
            timestamp: Date.now()
          });
        }
      }
      
      this.validationCount++;
    });

    console.log('🛡️ BlueprintGuardV2: Installed and monitoring');
  }

  validate(blueprint) {
    if (!blueprint) {
      return { ok: false, errors: ['blueprint is null'], count: 0 };
    }

    const errors = [];
    const count = blueprint.activeCount || 
                  blueprint.particleCount || 
                  blueprint.maxParticles || 
                  (blueprint.positions ? (blueprint.positions.length / 3) | 0 : 0);

    if (!count || count < 1) {
      errors.push('count <= 0');
    }

    const need3 = ['atmosphericPositions', 'text3DPositions'];
    need3.forEach(key => {
      if (!blueprint[key]) {
        errors.push(key + ' missing');
      } else if (!this.isTypedArray(blueprint[key])) {
        errors.push(key + ' not typed array');
      } else if (blueprint[key].length % 3 !== 0) {
        errors.push(key + ' length not divisible by 3');
      }
    });

    const need1 = ['sizeMultipliers', 'opacityData', 'atlasIndices', 'tierData'];
    need1.forEach(key => {
      if (blueprint[key] && !this.isTypedArray(blueprint[key])) {
        errors.push(key + ' not typed array');
      }
    });

    return { ok: errors.length === 0, errors, count };
  }

  createFallback(count = 1000) {
    const n = Math.max(1, Math.min(count, 2000));
    
    const atmosphericPositions = new Float32Array(n * 3);
    const text3DPositions = new Float32Array(n * 3);
    const animationSeeds = new Float32Array(n * 3);
    const sizeMultipliers = new Float32Array(n);
    const opacityData = new Float32Array(n);
    const atlasIndices = new Float32Array(n);
    const tierData = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 24 + Math.random() * 10;
      
      const j = i * 3;
      atmosphericPositions[j] = radius * Math.sin(phi) * Math.cos(theta);
      atmosphericPositions[j + 1] = radius * Math.sin(phi) * Math.sin(theta);
      atmosphericPositions[j + 2] = radius * Math.cos(phi);
      
      text3DPositions.set(atmosphericPositions.subarray(j, j + 3), j);
      
      animationSeeds[j] = Math.random();
      animationSeeds[j + 1] = Math.random();
      animationSeeds[j + 2] = Math.random();
      
      sizeMultipliers[i] = 1;
      opacityData[i] = 0.8;
      atlasIndices[i] = 1;
      tierData[i] = 0;
    }

    return {
      stageName: 'genesis',
      activeCount: n,
      particleCount: n,
      maxParticles: n,
      atmosphericPositions,
      text3DPositions,
      animationSeeds,
      sizeMultipliers,
      opacityData,
      atlasIndices,
      tierData,
      _isFallback: true
    };
  }

  isTypedArray(arr) {
    return arr && (arr.BYTES_PER_ELEMENT > 0);
  }

  getStats() {
    return {
      validationCount: this.validationCount,
      fallbacksApplied: this.fallbacksApplied,
      fallbackRate: this.validationCount > 0 
        ? ((this.fallbacksApplied / this.validationCount) * 100).toFixed(1) + '%'
        : '0%'
    };
  }
}

export const blueprintGuard = new BlueprintGuardV2();
export default blueprintGuard;`;

  await fs.writeFile('canon-console/runtime/blueprint-guard-v2.js', guardCode);
  console.log(colors.green + '✓' + colors.reset + ' Created blueprint-guard-v2.js');

  // Step 4: Update injector
  console.log('\n' + colors.blue + '=== Updating Injector ===' + colors.reset);
  
  const injectorPath = 'canon-console/browser/inject.js';
  const injectorContent = await fs.readFile(injectorPath, 'utf8');
  
  if (injectorContent.includes('blueprint-guard-v2')) {
    console.log(colors.yellow + '⚠ Already integrated' + colors.reset);
  } else {
    const insertPoint = injectorContent.indexOf('// Install Bridge-Guard');
    if (insertPoint === -1) {
      console.log(colors.red + '✗ Could not find insertion point' + colors.reset);
    } else {
      const nextSection = injectorContent.indexOf('// Install', insertPoint + 100);
      const actualInsertPoint = nextSection > -1 ? nextSection : injectorContent.length;
      
      const injection = `
  // Install Blueprint Guard V2
  try {
    const { blueprintGuard } = await import('../runtime/blueprint-guard-v2.js');
    const BeatBus = window.BeatBus || window.theaterBus?.bus;
    const EVENTS = (await import('@/theater/events.js')).EVENTS;
    
    if (BeatBus && EVENTS) {
      blueprintGuard.install(BeatBus, incidentCollector, EVENTS);
      FLAGS.BLUEPRINT_GUARD_V2 = true;
      console.log('Blueprint Guard V2 installed');
    }
  } catch (e) {
    console.warn('Blueprint Guard V2 not installed:', e);
  }

`;
      
      const updated = 
        injectorContent.slice(0, actualInsertPoint) + 
        injection + 
        injectorContent.slice(actualInsertPoint);
      
      await fs.writeFile(injectorPath, updated);
      console.log(colors.green + '✓' + colors.reset + ' Updated injector');
    }
  }

  console.log('\n' + colors.green + '=== Session 1 Complete ===' + colors.reset);
  console.log('Next: npm run dev, then test in console');
}

main().catch(console.error);

// canon-console/runtime/blueprint-guard-v2.js
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

    BeatBus.on(EVENTS.BLUEPRINT_READY, (payload = {}) => {
      const validation = this.validate(payload?.blueprint);
      
      if (!validation.ok) {
        const stage = payload?.stage ?? payload?.blueprint?.stageName ?? null;
        const quality = payload?.quality ?? payload?.tier ?? null;
        const cacheKey = payload?.cacheKey ?? (stage ? `${stage}|${quality || 'HIGH'}` : null);
        const cachedBeforeGuard = !!payload?.cached;

        incidentCollector.add({
          code: 'BLUEPRINT_INVALID',
          severity: 'warn',
          message: 'Blueprint validation failed: ' + validation.errors.join(', '),
          context: {
            errors: validation.errors,
            count: validation.count,
            stage,
            quality,
            cacheKey
          },
          timestamp: Date.now()
        });

        if (payload && payload.blueprint) {
          const fallback = this.createFallback(validation.count || 1000);
          payload.blueprint = fallback;
          payload.cached = false;
          payload._guard_fixed = true;
          payload.guardFallback = true;
          payload.guardIssues = validation.errors.slice();
          payload.cacheKey = cacheKey;
          payload.cachedBeforeGuard = cachedBeforeGuard;
          this.fallbacksApplied++;
          
          incidentCollector.add({
            code: 'BLUEPRINT_FALLBACK_APPLIED',
            severity: 'info',
            message: 'Fallback blueprint applied',
            context: {
              particleCount: fallback.activeCount,
              originalErrors: validation.errors,
              cacheKey
            },
            timestamp: Date.now()
          });

          if (BeatBus?.emit && EVENTS?.BLUEPRINT_INVALIDATED) {
            try {
              BeatBus.emit(EVENTS.BLUEPRINT_INVALIDATED, {
                stage: stage ?? fallback.stageName ?? null,
                quality,
                cacheKey,
                issues: validation.errors.slice(),
                fallback: true,
                guardVersion: 'v2',
                cachedBeforeGuard,
                fallbackCount: fallback.activeCount,
                timestamp: Date.now(),
              });
            } catch (error) {
              console.warn('BlueprintGuardV2: failed to emit BLUEPRINT_INVALIDATED', error);
            }
          }
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

// Blueprint validation function - HOT-DORS injected
const __canonBlueprintValidate = (blueprint) => {
  const issues = [];
  
  // Check typed arrays
  const isTypedArray = (x) => ArrayBuffer.isView(x) && x.BYTES_PER_ELEMENT;
  const isLen3Multiple = (x) => isTypedArray(x) && x.length % 3 === 0;
  
  if (!isLen3Multiple(blueprint?.atmosphericPositions)) {
    issues.push('atmosphericPositions: missing/invalid typed array');
  }
  
  if (!isLen3Multiple(blueprint?.text3DPositions)) {
    issues.push('text3DPositions: missing/invalid typed array');
  }
  
  // Check particle count bounds
  const count = blueprint?.particleCount || blueprint?.activeCount || 0;
  if (count < 100 || count > 200000) {
    issues.push(`particleCount out of bounds: ${count}`);
  }
  
  // NaN/Infinity scan (sample first 100)
  const scanForNaN = (arr, name) => {
    if (!isTypedArray(arr)) return;
    const limit = Math.min(arr.length, 100);
    for (let i = 0; i < limit; i++) {
      if (!Number.isFinite(arr[i])) {
        issues.push(`${name} contains NaN/Infinity at index ${i}`);
        break;
      }
    }
  };
  
  scanForNaN(blueprint?.atmosphericPositions, 'atmosphericPositions');
  scanForNaN(blueprint?.text3DPositions, 'text3DPositions');
  
  return { valid: issues.length === 0, issues };
};

// Hook into blueprint processing
const originalInstall = blueprintGuard.install;
blueprintGuard.install = function(BeatBus, incidentCollector, EVENTS) {
  // Call original if it exists
  if (originalInstall) {
    originalInstall.call(this, BeatBus, incidentCollector, EVENTS);
  }
  
  // Add validation tap
  if (BeatBus && EVENTS?.BLUEPRINT_READY) {
    BeatBus.on(EVENTS.BLUEPRINT_READY, (payload) => {
      const validation = __canonBlueprintValidate(payload?.blueprint ?? payload);
      if (!validation.valid) {
        console.warn('[BlueprintGuard] Validation failed:', validation.issues);
        
        if (incidentCollector?.add) {
          incidentCollector.add({
            code: 'BLUEPRINT_INVALID',
            severity: 'error',
            message: 'Blueprint validation failed',
            context: { issues: validation.issues }
          });
        }
        
        BeatBus.emit('CANON_VIOLATION', {
          type: 'BLUEPRINT_GUARD',
          issues: validation.issues,
          ts: Date.now()
        });
      }
    });
    
    console.log('🛡️ Blueprint validation wired to BLUEPRINT_READY');
  }
};


export default blueprintGuard;

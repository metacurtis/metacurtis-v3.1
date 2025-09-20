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
export default blueprintGuard;
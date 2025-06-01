// src/utils/webgl/WebGLEffectsManager.js - Your Enhanced Version

import * as THREE from 'three'; // Keep for Color/Vector3 if manager handles them

console.log('[WebGLEffectsManager] Module loaded.');

class WebGLEffectsManager {
  constructor() {
    this.activeEffects = new Map();
    this.baseValues = new Map(); // Stores the "resting" or "current base" value of a uniform
    this.nextEffectId = 0;

    // IMPROVEMENT 1: Effect Pooling
    this.effectPool = [];
    this.maxPoolSize = 50;

    // IMPROVEMENT 2: Uniform Change Tracking
    this.uniformsChanged = new Set();
    this.lastFrameValues = new Map();

    // IMPROVEMENT 3: Batch Processing Groups
    this.effectGroups = new Map();

    // IMPROVEMENT 4: Performance Metrics
    this.metrics = {
      effectsProcessed: 0,
      averageUpdateTime: 0,
      peakMemoryUsage: 0, // You'd need to implement logic to track this
      framesSinceLastCleanup: 0,
    };

    console.log('[WebGLEffectsManager] Enhanced instance initialized');
  }

  // --- Effect Pooling ---
  _getPooledEffect() {
    const effect = this.effectPool.pop() || {};
    // Initialize/reset common properties
    effect.id = null;
    effect.startTime = 0;
    effect.duration = 0;
    effect.easingType = 'linear';
    effect.uniformName = null;
    effect.fromValue = 0;
    effect.toValue = 0;
    effect.intensity = 1.0;
    effect.curve = 'standard';
    effect.onComplete = null;
    effect._lastAppliedValue = 0; // Or initial value type
    effect._isActive = false;
    return effect;
  }

  _returnToPool(effect) {
    effect._isActive = false; // Mark as inactive
    // Further reset properties if necessary
    effect.onComplete = null;
    if (this.effectPool.length < this.maxPoolSize) {
      this.effectPool.push(effect);
    }
  }

  // --- Base Value Management ---
  setBaseUniformValue(uniformName, value) {
    let valueToStore = value;
    if (value instanceof THREE.Color) {
      valueToStore =
        this.baseValues.get(uniformName) instanceof THREE.Color
          ? this.baseValues.get(uniformName).copy(value)
          : value.clone();
    } else if (
      value instanceof THREE.Vector2 ||
      value instanceof THREE.Vector3 ||
      value instanceof THREE.Vector4
    ) {
      valueToStore =
        this.baseValues.get(uniformName)?.constructor === value.constructor
          ? this.baseValues.get(uniformName).copy(value)
          : value.clone();
    }
    this.baseValues.set(uniformName, valueToStore);
    // console.log(`[WebGLEffectsManager] Base value updated for ${uniformName}:`, valueToStore);
  }

  // --- Add Effect (using pooling and batching) ---
  addEffect(config) {
    const id = config.id || `${config.uniform}_effect_${this.nextEffectId++}`;
    const now = performance.now();

    const effect = this._getPooledEffect();

    const baseVal = this.baseValues.get(config.uniform);
    if (baseVal === undefined) {
      console.warn(
        `[WebGLEffectsManager] No base value for "${config.uniform}" found when adding effect "${id}". Using 0 or current uniform value. Call setBaseUniformValue first.`
      );
      // This situation should ideally be avoided by proper initialization.
      // If WebGLBackground passes current live uniforms, could use that as a fallback.
    }

    effect.id = id;
    effect.startTime = now;
    effect.duration = config.duration || 1000;
    effect.easingType = config.easing || 'linear';
    effect.uniformName = config.uniform;
    // fromValue is CRITICAL: it's the value the effect starts from, often the base value.
    effect.fromValue = baseVal ?? config.fromValue ?? 0; // Prioritize stored base, then explicit fromValue, then 0
    effect.toValue = config.toValue;
    effect.intensity = config.intensity || 1.0;
    effect.curve = config.curve || 'standard';
    effect.onComplete = config.onComplete;
    effect._isActive = true;

    // Clone if fromValue is an object to prevent shared reference modification
    if (typeof effect.fromValue === 'object' && effect.fromValue?.clone) {
      effect.fromValue = effect.fromValue.clone();
    }
    effect._lastAppliedValue = effect.fromValue;

    this.activeEffects.set(id, effect);

    if (!this.effectGroups.has(config.uniform)) {
      this.effectGroups.set(config.uniform, new Set());
    }
    this.effectGroups.get(config.uniform).add(id);

    this.uniformsChanged.add(config.uniform); // Mark this uniform as potentially dirty

    // console.log(`[WebGLEffectsManager] Added effect: ${id} for ${effect.uniformName}`);
    return id;
  }

  _addEffectBatch(effectConfigs) {
    // ... (Your batch addition logic using _getPooledEffect and Object.assign)
    // Ensure fromValue is correctly sourced from this.baseValues.get(config.uniform)
  }

  // --- Update Effects ---
  _applyEasing(t, type) {
    // ... (Your existing easing functions) ...
    switch (type) {
      case 'easeOutQuart':
        return 1 - Math.pow(1 - t, 4);
      case 'easeOutBounce':
        if (t < 1 / 2.75) return 7.5625 * t * t;
        if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
      case 'easeInOutCubic':
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      default:
        return t; // linear
    }
  }

  _calculateEffectValue(effect, easedProgress) {
    // Ensure fromValue, toValue are correctly used.
    // This version is for numeric uniforms.
    const { fromValue, toValue, intensity, curve } = effect;

    if (typeof fromValue === 'number' && typeof toValue === 'number') {
      const range = toValue - fromValue;
      switch (curve) {
        case 'pulse':
          return fromValue + range * Math.sin(easedProgress * Math.PI) * intensity;

        case 'burst': {
          // <-- Added opening brace for block scope
          const burstProgress =
            easedProgress < 0.3 ? easedProgress / 0.3 : 1.0 - (easedProgress - 0.3) / 0.7;
          return fromValue + range * burstProgress * intensity;
        } // <-- Added closing brace

        case 'wave':
          return (
            fromValue + range * (Math.sin(easedProgress * Math.PI * 2) * 0.5 + 0.5) * intensity
          );

        default: // 'standard'
          return fromValue + range * easedProgress;
      }
    }

    // Fallback for non-numeric - needs proper typed interpolation
    // Consider if this fallback is still appropriate or if an error should be thrown for unsupported types.
    if (easedProgress >= 1.0) {
      return toValue;
    }
    return fromValue;
  }

  updateEffects(uniforms, currentTime) {
    if (this.activeEffects.size === 0 && this.uniformsChanged.size === 0) return;

    const updateStartTime = performance.now();
    const completedEffects = [];
    this.uniformsChanged.clear(); // Clear at start, will be repopulated by active effects

    this.effectGroups.forEach((effectIds, uniformName) => {
      if (!uniforms[uniformName]) return;

      const uniformEffectsOnThis = [];
      effectIds.forEach(id => {
        const effect = this.activeEffects.get(id);
        if (effect?._isActive) uniformEffectsOnThis.push(effect);
      });

      if (uniformEffectsOnThis.length === 0) {
        // No active effects for this uniform, ensure it's at its base value if it was changed last frame by an effect
        const baseValue = this.baseValues.get(uniformName);
        const lastValue = this.lastFrameValues.get(uniformName);
        if (baseValue !== undefined && lastValue !== baseValue) {
          // Check type for proper assignment/copy
          if (
            uniforms[uniformName].value instanceof THREE.Color &&
            baseValue instanceof THREE.Color
          ) {
            uniforms[uniformName].value.copy(baseValue);
          } else if (
            uniforms[uniformName].value instanceof THREE.Vector3 &&
            baseValue instanceof THREE.Vector3
          ) {
            // Example
            uniforms[uniformName].value.copy(baseValue);
          } else {
            uniforms[uniformName].value = baseValue;
          }
          this.lastFrameValues.set(uniformName, baseValue);
          this.uniformsChanged.add(uniformName);
        }
        return;
      }

      // For simplicity, current override: last active effect processed sets the value.
      // A more complex system would blend/sum values if multiple effects target the same uniform.
      let finalCalculatedValue;
      let effectToApply;

      uniformEffectsOnThis.forEach(effect => {
        const elapsed = currentTime - effect.startTime;
        const progress = Math.min(elapsed / effect.duration, 1.0);

        if (progress >= 1.0) {
          completedEffects.push(effect.id);
          effect._isActive = false;
          // The value will be set to base by the block above in the next frame if no other effects,
          // or to its end value by the effect itself if it's the last one.
          // For burst/pulse, the curve itself should return it to fromValue.
          if (effect.curve === 'burst' || effect.curve === 'pulse') {
            finalCalculatedValue = effect.fromValue; // Ensure it ends at fromValue
          } else {
            finalCalculatedValue = effect.toValue; // Standard effects end at toValue
          }
          effectToApply = effect; // Mark this one
          return; // No further processing for this effect this frame
        }

        const easedProgress = this._applyEasing(progress, effect.easingType);
        finalCalculatedValue = this._calculateEffectValue(effect, easedProgress);
        effectToApply = effect; // This effect is active and sets the value
      });

      if (effectToApply) {
        // If any effect was processed (active or just completed)
        const lastKnownValue = this.lastFrameValues.get(uniformName);
        // Crude change detection for numbers, needs type handling for objects
        let valueChanged = true;
        if (typeof finalCalculatedValue === 'number' && typeof lastKnownValue === 'number') {
          valueChanged = Math.abs(finalCalculatedValue - lastKnownValue) > 0.001;
        } else if (finalCalculatedValue !== lastKnownValue) {
          // Basic reference check for objects
          valueChanged = true;
        }

        if (valueChanged) {
          if (
            uniforms[uniformName].value instanceof THREE.Color &&
            finalCalculatedValue instanceof THREE.Color
          ) {
            uniforms[uniformName].value.copy(finalCalculatedValue);
          } else {
            // Assuming numeric for now based on _calculateEffectValue
            uniforms[uniformName].value = finalCalculatedValue;
          }
          this.lastFrameValues.set(uniformName, finalCalculatedValue);
          this.uniformsChanged.add(uniformName);
        }
      }
    });

    completedEffects.forEach(effectId => {
      const effect = this.activeEffects.get(effectId);
      if (effect) {
        this.effectGroups.get(effect.uniformName)?.delete(effectId);
        if (effect.onComplete) effect.onComplete();
        this._returnToPool(effect);
        this.activeEffects.delete(effectId);
      }
    });

    this.metrics.framesSinceLastCleanup++;
    if (this.metrics.framesSinceLastCleanup > 300) {
      this._performPeriodicCleanup();
      this.metrics.framesSinceLastCleanup = 0;
    }
    // ... (update performance metrics) ...
  }

  _performPeriodicCleanup() {
    /* ... Your cleanup ... */
  }

  // --- Preset Effects (Example for letterBurst) ---
  letterBurst(intensity = 1.0, duration = 800) {
    const effectIdBase = `letterBurst_${this.nextEffectId}`; // Use common base for ID for batched effects
    this.nextEffectId++; // Increment once for the batch

    const baseSize = this.baseValues.get('uSize') ?? 1.0; // Fallback needed
    const baseColorIntensity = this.baseValues.get('uColorIntensity') ?? 1.0; // Fallback needed

    const effectsToBatch = [
      {
        id: `${effectIdBase}_size`,
        uniform: 'uSize',
        toValue: baseSize * (1.8 + intensity * 0.7), // Peak of burst
        fromValue: baseSize, // Manager will use this as start & end for burst curve
        duration: duration,
        curve: 'burst',
        easing: 'easeOutQuart',
        intensity: 1.0, // curve's own intensity
      },
      {
        id: `${effectIdBase}_color`,
        uniform: 'uColorIntensity',
        toValue: baseColorIntensity * (1.4 + intensity * 0.3),
        fromValue: baseColorIntensity,
        duration: duration * 0.8, // Slightly shorter
        curve: 'burst',
        easing: 'easeOutQuart',
        intensity: 1.0,
      },
    ];

    // Using a loop instead of _addEffectBatch for clarity on individual addEffect calls
    effectsToBatch.forEach(config => this.addEffect(config));
    console.log(`[WebGLEffectsManager] Batched letterBurst effects: ${effectIdBase}`);
    return effectIdBase;
  }

  // ... (other preset methods, getPerformanceMetrics, _estimateMemoryUsage, destroy) ...
  destroy() {
    this.activeEffects.forEach(effect => this._returnToPool(effect));
    this.activeEffects.clear();
    this.baseValues.clear();
    this.effectGroups.clear();
    this.lastFrameValues.clear();
    this.uniformsChanged.clear();
    this.effectPool.length = 0; // Empty the pool
    console.log('[WebGLEffectsManager] Enhanced instance destroyed and cleaned up.');
  }
}

export default WebGLEffectsManager;

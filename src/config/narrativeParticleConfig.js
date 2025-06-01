// src/config/narrativeParticleConfig.js

/**
 * Simplified Narrative Particle System Configuration
 * Single source of truth for all particle behavior and visual presets
 */

// === REASONABLE BASELINE CONFIGURATION ===
export const BASELINE_CONFIG = {
  baseSize: 4.0, // Reasonable baseline for visible but manageable bursts
  colors: ['#E040FB', '#536DFE', '#00E5FF'],
  cursorRadius: 1.5,
  repulsionStrength: 0.8,
  colorIntensity: 1.3,
  field: { w: 14, h: 8, d: 7 },
};

// === NARRATIVE PRESETS (Reasonable sizes for 12-20px max bursts) ===
export const NARRATIVE_PRESETS = {
  heroIntro: {
    name: 'Hero Introduction',
    colors: ['#E040FB', '#536DFE', '#00E5FF'], // Purple/Blue theme
    baseSize: 5, // 5px base → 15-25px bursts (reasonable)
    colorIntensity: 1.3,
    speedMultiplier: 1.0,
    cursorRadius: 1.5,
    repulsionStrength: 0.8,
    transitionDuration: 2000,
    uniforms: {
      uColorIntensity: 1.3,
      uSpeedFactor: 1.0,
      uCursorInfluence: 1.0,
    },
  },

  narrativeCalm: {
    name: 'Calm Narrative',
    colors: ['#4CAF50', '#81C784', '#A5D6A7'], // Green theme
    baseSize: 3, // 3px base → 9-15px bursts (subtle)
    colorIntensity: 1.1,
    speedMultiplier: 0.7,
    cursorRadius: 2.0,
    repulsionStrength: 0.5,
    transitionDuration: 2500,
    uniforms: {
      uColorIntensity: 1.1,
      uSpeedFactor: 0.7,
      uCursorInfluence: 0.5,
    },
  },

  narrativeExcited: {
    name: 'Excited Narrative',
    colors: ['#FF5722', '#FF9800', '#FFC107'], // Orange/Red theme
    baseSize: 4, // 4px base → 12-20px bursts (energetic but controlled)
    colorIntensity: 1.5,
    speedMultiplier: 1.4,
    cursorRadius: 1.2,
    repulsionStrength: 1.0,
    transitionDuration: 1500,
    uniforms: {
      uColorIntensity: 1.5,
      uSpeedFactor: 1.4,
      uCursorInfluence: 1.0,
    },
  },

  narrativeMystery: {
    name: 'Mystery Narrative',
    colors: ['#3F51B5', '#673AB7', '#9C27B0'], // Purple theme
    baseSize: 3, // 3px base → 9-15px bursts (mysterious/subtle)
    colorIntensity: 0.9,
    speedMultiplier: 0.8,
    cursorRadius: 3.0,
    repulsionStrength: 0.3,
    transitionDuration: 3000,
    uniforms: {
      uColorIntensity: 0.9,
      uSpeedFactor: 0.8,
      uCursorInfluence: 0.3,
    },
  },

  narrativeTriumph: {
    name: 'Triumph Narrative',
    colors: ['#FFD700', '#FFF176', '#FFFFFF'], // Gold/White theme
    baseSize: 6, // 6px base → 18-30px bursts (celebratory but reasonable)
    colorIntensity: 1.8,
    speedMultiplier: 1.2,
    cursorRadius: 1.0,
    repulsionStrength: 1.2,
    transitionDuration: 1000,
    uniforms: {
      uColorIntensity: 1.8,
      uSpeedFactor: 1.2,
      uCursorInfluence: 1.2,
    },
  },
};

// === UTILITY FUNCTIONS ===

/**
 * Get preset by name with fallback to heroIntro
 */
export const getPreset = presetName => {
  return NARRATIVE_PRESETS[presetName] || NARRATIVE_PRESETS.heroIntro;
};

/**
 * Get all available preset names
 */
export const getAvailablePresets = () => {
  return Object.keys(NARRATIVE_PRESETS);
};

/**
 * Linear interpolation utility
 */
const lerp = (a, b, t) => {
  if (typeof a !== 'number' || typeof b !== 'number' || typeof t !== 'number') {
    console.warn('[NarrativeParticleConfig] Invalid lerp inputs:', { a, b, t });
    return typeof a === 'number' ? a : typeof b === 'number' ? b : 0;
  }
  return a * (1 - t) + b * t;
};

/**
 * Convert hex color to RGB components
 */
const hexToRgb = hex => {
  if (typeof hex !== 'string') return null;
  const cleanHex = hex.replace('#', '');
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split('')
          .map(c => c + c)
          .join('')
      : cleanHex;

  if (!/^[a-f\d]{6}$/i.test(fullHex)) return null;

  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : null;
};

/**
 * Convert RGB components to hex color
 */
const rgbToHex = rgb => {
  const toHex = component => {
    const hexVal = Math.round(Math.max(0, Math.min(255, component * 255))).toString(16);
    return hexVal.length === 1 ? '0' + hexVal : hexVal;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
};

/**
 * Interpolate between two colors in RGB space
 */
const interpolateColor = (fromColorHex, toColorHex, progress) => {
  const fromRgb = hexToRgb(fromColorHex);
  const toRgb = hexToRgb(toColorHex);

  if (!fromRgb || !toRgb) {
    console.warn('[NarrativeParticleConfig] Invalid color for interpolation.', {
      fromColorHex,
      toColorHex,
    });
    return fromRgb ? fromColorHex : toRgb ? toColorHex : '#FFFFFF';
  }

  const interpolatedRgb = {
    r: lerp(fromRgb.r, toRgb.r, progress),
    g: lerp(fromRgb.g, toRgb.g, progress),
    b: lerp(fromRgb.b, toRgb.b, progress),
  };

  return rgbToHex(interpolatedRgb);
};

/**
 * Smooth easing function for natural transitions
 */
const easeInOutCubic = t => {
  let tClamped = Math.max(0, Math.min(1, t));
  return tClamped < 0.5
    ? 4 * tClamped * tClamped * tClamped
    : 1 - Math.pow(-2 * tClamped + 2, 3) / 2;
};

/**
 * Create smooth transition between two presets
 */
export const interpolatePresets = (fromPresetConfig, toPresetConfig, progress) => {
  if (!fromPresetConfig || !toPresetConfig) {
    console.warn('[NarrativeParticleConfig] Invalid preset for interpolation');
    return toPresetConfig || fromPresetConfig || NARRATIVE_PRESETS.heroIntro;
  }

  const easedProgress = easeInOutCubic(progress);

  const getSafe = (obj, path, fallback) => {
    return path
      .split('.')
      .reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : fallback), obj);
  };

  const from = (path, fallback) => getSafe(fromPresetConfig, path, fallback);
  const to = (path, fallback) => getSafe(toPresetConfig, path, fallback);

  return {
    name: `Transitioning from ${from('name', 'Unknown')} to ${to('name', 'Unknown')}`,
    colors: from('colors', BASELINE_CONFIG.colors).map((fromColor, index) => {
      const toColor = to('colors', BASELINE_CONFIG.colors)[index] || fromColor;
      return interpolateColor(fromColor, toColor, easedProgress);
    }),
    baseSize: lerp(
      from('baseSize', BASELINE_CONFIG.baseSize),
      to('baseSize', BASELINE_CONFIG.baseSize),
      easedProgress
    ),
    colorIntensity: lerp(
      from('colorIntensity', BASELINE_CONFIG.colorIntensity),
      to('colorIntensity', BASELINE_CONFIG.colorIntensity),
      easedProgress
    ),
    speedMultiplier: lerp(from('speedMultiplier', 1.0), to('speedMultiplier', 1.0), easedProgress),
    cursorRadius: lerp(
      from('cursorRadius', BASELINE_CONFIG.cursorRadius),
      to('cursorRadius', BASELINE_CONFIG.cursorRadius),
      easedProgress
    ),
    repulsionStrength: lerp(
      from('repulsionStrength', BASELINE_CONFIG.repulsionStrength),
      to('repulsionStrength', BASELINE_CONFIG.repulsionStrength),
      easedProgress
    ),
    transitionDuration: to('transitionDuration', 2000),
    uniforms: {
      uColorIntensity: lerp(
        from('uniforms.uColorIntensity', BASELINE_CONFIG.colorIntensity),
        to('uniforms.uColorIntensity', BASELINE_CONFIG.colorIntensity),
        easedProgress
      ),
      uSpeedFactor: lerp(
        from('uniforms.uSpeedFactor', 1.0),
        to('uniforms.uSpeedFactor', 1.0),
        easedProgress
      ),
      uCursorInfluence: lerp(
        from('uniforms.uCursorInfluence', 1.0),
        to('uniforms.uCursorInfluence', 1.0),
        easedProgress
      ),
    },
  };
};

/**
 * Simple transition manager class - replaces the Zustand store
 */
export class NarrativeTransitionManager {
  constructor() {
    this.currentMood = 'heroIntro';
    this.isTransitioning = false;
    this.transitionProgress = 0;
    this.fromPreset = getPreset('heroIntro');
    this.toPreset = getPreset('heroIntro');
    this.startTime = 0;
    this.duration = 2000;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(listener => listener());
  }

  setMood(newMoodName, options = {}) {
    if (newMoodName === this.currentMood && !this.isTransitioning) {
      console.log(`[NarrativeTransition] Already in mood "${newMoodName}"`);
      return;
    }

    const targetPreset = getPreset(newMoodName);
    if (!targetPreset) {
      console.error(`[NarrativeTransition] Preset for "${newMoodName}" not found`);
      return;
    }

    console.log(`[NarrativeTransition] Starting transition: ${this.currentMood} → ${newMoodName}`);

    this.currentMood = newMoodName;
    this.isTransitioning = true;
    this.transitionProgress = 0;
    this.fromPreset = this.isTransitioning ? this.toPreset : this.getCurrentDisplayPreset();
    this.toPreset = targetPreset;
    this.startTime = performance.now();
    this.duration = options.duration || targetPreset.transitionDuration || 2000;

    this.notify();
  }

  updateTransition(currentTime = performance.now()) {
    if (!this.isTransitioning) {
      return this.getCurrentDisplayPreset();
    }

    const elapsed = currentTime - this.startTime;
    this.transitionProgress = Math.min(elapsed / this.duration, 1.0);

    if (this.transitionProgress >= 1.0) {
      console.log(`[NarrativeTransition] Transition to "${this.currentMood}" complete`);
      this.isTransitioning = false;
      this.transitionProgress = 1.0;
      this.notify();
      return this.toPreset;
    }

    return interpolatePresets(this.fromPreset, this.toPreset, this.transitionProgress);
  }

  getCurrentDisplayPreset() {
    if (this.isTransitioning) {
      return interpolatePresets(this.fromPreset, this.toPreset, this.transitionProgress);
    }
    return getPreset(this.currentMood);
  }

  getMood() {
    return this.currentMood;
  }

  getTransitionState() {
    return {
      isTransitioning: this.isTransitioning,
      progress: this.transitionProgress,
      currentMood: this.currentMood,
    };
  }
}

// === SINGLETON INSTANCE ===
export const narrativeTransition = new NarrativeTransitionManager();

// === DEFAULT EXPORT ===
export default NARRATIVE_PRESETS;

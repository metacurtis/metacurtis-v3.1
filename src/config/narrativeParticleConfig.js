/**
 * Narrative Particle System Configuration
 * Defines visual presets for different story moods while maintaining performance
 */

// === BASELINE CONFIGURATION (Matches current WebGLBackground.jsx exactly) ===
const BASELINE_CONFIG = {
  baseSize: 0.1,
  colors: ['#E040FB', '#536DFE', '#00E5FF'], // Current Hero colors
  cursorRadius: 1.5,
  repulsionStrength: 0.8,
  colorIntensity: 1.3,
  field: { w: 14, h: 8, d: 7 }, // Particle field dimensions
};

// === NARRATIVE MOOD PRESETS ===
export const NARRATIVE_PRESETS = {
  /**
   * HERO INTRO - Exactly matches current Hero section
   * This ensures zero visual changes when system activates
   */
  heroIntro: {
    name: 'Hero Introduction',
    colors: ['#E040FB', '#536DFE', '#00E5FF'], // Exact current colors
    baseSize: 0.1,
    colorIntensity: 1.3,
    speedMultiplier: 1.0,
    cursorRadius: 1.5,
    repulsionStrength: 0.8,
    animationStyle: 'standard',
    transitionDuration: 0, // No transition needed for default state
    uniforms: {
      uColorIntensity: 1.3,
      uSpeedFactor: 1.0,
      uCursorInfluence: 1.0,
    },
  },

  /**
   * NARRATIVE CALM - Soothing green/blue palette
   * For peaceful story moments, slower movement
   */
  narrativeCalm: {
    name: 'Calm Narrative',
    colors: ['#4CAF50', '#81C784', '#A5D6A7'], // Gentle greens
    baseSize: 0.08,
    colorIntensity: 1.1,
    speedMultiplier: 0.6,
    cursorRadius: 2.0,
    repulsionStrength: 0.5,
    animationStyle: 'gentle',
    transitionDuration: 2000, // 2-second smooth transition
    uniforms: {
      uColorIntensity: 1.1,
      uSpeedFactor: 0.6,
      uCursorInfluence: 0.5,
    },
  },

  /**
   * NARRATIVE EXCITED - Energetic warm colors
   * For action/excitement moments, faster movement
   */
  narrativeExcited: {
    name: 'Excited Narrative',
    colors: ['#FF5722', '#FF9800', '#FFC107'], // Warm oranges/yellows
    baseSize: 0.12,
    colorIntensity: 1.5,
    speedMultiplier: 1.4,
    cursorRadius: 1.2,
    repulsionStrength: 1.2,
    animationStyle: 'energetic',
    transitionDuration: 1500,
    uniforms: {
      uColorIntensity: 1.5,
      uSpeedFactor: 1.4,
      uCursorInfluence: 1.2,
    },
  },

  /**
   * NARRATIVE MYSTERY - Deep purples/dark blues
   * For mysterious/suspenseful moments
   */
  narrativeMystery: {
    name: 'Mystery Narrative',
    colors: ['#3F51B5', '#673AB7', '#9C27B0'], // Deep purples
    baseSize: 0.06,
    colorIntensity: 0.9,
    speedMultiplier: 0.8,
    cursorRadius: 3.0,
    repulsionStrength: 0.3,
    animationStyle: 'mysterious',
    transitionDuration: 3000, // Slower, more dramatic transition
    uniforms: {
      uColorIntensity: 0.9,
      uSpeedFactor: 0.8,
      uCursorInfluence: 0.3,
    },
  },

  /**
   * NARRATIVE TRIUMPH - Bright golds/whites
   * For victory/achievement moments
   */
  narrativeTriumph: {
    name: 'Triumph Narrative',
    colors: ['#FFD700', '#FFF176', '#FFFFFF'], // Golds and bright white
    baseSize: 0.14,
    colorIntensity: 1.8,
    speedMultiplier: 1.2,
    cursorRadius: 1.0,
    repulsionStrength: 1.5,
    animationStyle: 'triumphant',
    transitionDuration: 1000,
    uniforms: {
      uColorIntensity: 1.8,
      uSpeedFactor: 1.2,
      uCursorInfluence: 1.5,
    },
  },
};

// === UTILITY FUNCTIONS ===

/**
 * Get preset by name with fallback to heroIntro
 * @param {string} presetName - Name of the preset to retrieve
 * @returns {Object} Preset configuration object
 */
export const getPreset = presetName => {
  return NARRATIVE_PRESETS[presetName] || NARRATIVE_PRESETS.heroIntro;
};

/**
 * Convert hex color to RGB components
 * @param {string} hex - Hex color string (e.g., '#FF0000')
 * @returns {Object} RGB components {r, g, b} in 0-1 range
 */
const hexToRgb = hex => {
  const cleanHex = hex.replace('#', '');
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split('')
          .map(c => c + c)
          .join('')
      : cleanHex;

  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 1, g: 1, b: 1 };
};

/**
 * Convert RGB components to hex color
 * @param {Object} rgb - RGB components {r, g, b} in 0-1 range
 * @returns {string} Hex color string
 */
const rgbToHex = rgb => {
  const toHex = component => {
    const hex = Math.round(Math.max(0, Math.min(255, component * 255))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return '#' + toHex(rgb.r) + toHex(rgb.g) + toHex(rgb.b);
};

/**
 * Interpolate between two colors in RGB space
 * @param {string} fromColor - Starting hex color
 * @param {string} toColor - Target hex color
 * @param {number} progress - Interpolation progress (0-1)
 * @returns {string} Interpolated hex color
 */
const interpolateColor = (fromColor, toColor, progress) => {
  const fromRgb = hexToRgb(fromColor);
  const toRgb = hexToRgb(toColor);

  const interpolatedRgb = {
    r: lerp(fromRgb.r, toRgb.r, progress),
    g: lerp(fromRgb.g, toRgb.g, progress),
    b: lerp(fromRgb.b, toRgb.b, progress),
  };

  return rgbToHex(interpolatedRgb);
};

/**
 * Create smooth transition between two presets with proper color interpolation
 * @param {Object} fromPreset - Starting preset
 * @param {Object} toPreset - Target preset
 * @param {number} progress - Transition progress (0-1)
 * @returns {Object} Interpolated preset configuration
 */
export const interpolatePresets = (fromPreset, toPreset, progress) => {
  if (!validatePreset(fromPreset) || !validatePreset(toPreset)) {
    console.warn('[NarrativeParticleConfig] Invalid preset for interpolation, using fromPreset');
    return { ...fromPreset };
  }
  progress = Math.max(0, Math.min(1, progress));
  const easedProgress = easeInOutCubic(progress);

  return {
    name: `Transitioning to ${toPreset.name}`,
    colors: fromPreset.colors.map((fromColor, index) => {
      const toColor = toPreset.colors[index] || fromColor;
      return interpolateColor(fromColor, toColor, easedProgress);
    }),
    baseSize: lerp(fromPreset.baseSize, toPreset.baseSize, easedProgress),
    colorIntensity: lerp(fromPreset.colorIntensity, toPreset.colorIntensity, easedProgress),
    speedMultiplier: lerp(fromPreset.speedMultiplier, toPreset.speedMultiplier, easedProgress),
    cursorRadius: lerp(fromPreset.cursorRadius, toPreset.cursorRadius, easedProgress),
    repulsionStrength: lerp(
      fromPreset.repulsionStrength,
      toPreset.repulsionStrength,
      easedProgress
    ),
    animationStyle: progress < 0.5 ? fromPreset.animationStyle : toPreset.animationStyle,
    transitionDuration: toPreset.transitionDuration,
    uniforms: {
      uColorIntensity: lerp(
        fromPreset.uniforms.uColorIntensity,
        toPreset.uniforms.uColorIntensity,
        easedProgress
      ),
      uSpeedFactor: lerp(
        fromPreset.uniforms.uSpeedFactor,
        toPreset.uniforms.uSpeedFactor,
        easedProgress
      ),
      uCursorInfluence: lerp(
        fromPreset.uniforms.uCursorInfluence,
        toPreset.uniforms.uCursorInfluence,
        easedProgress
      ),
    },
  };
};

/**
 * Smooth easing function for natural transitions
 * @param {number} t - Progress value (0-1)
 * @returns {number} Eased progress value
 */
const easeInOutCubic = t => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/**
 * Linear interpolation utility with safety checks
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
const lerp = (a, b, t) => {
  if (typeof a !== 'number' || typeof b !== 'number' || typeof t !== 'number') {
    console.warn('[NarrativeParticleConfig] Invalid lerp inputs:', { a, b, t });
    return typeof a === 'number' ? a : 0;
  }
  return a + (b - a) * t;
};

/**
 * Get all available preset names
 * @returns {Array<string>} Array of preset names
 */
export const getAvailablePresets = () => {
  return Object.keys(NARRATIVE_PRESETS);
};

/**
 * Validate that a preset has all required properties
 * @param {Object} preset - Preset to validate
 * @returns {boolean} True if preset is valid
 */
export const validatePreset = preset => {
  const requiredProps = ['name', 'colors', 'baseSize', 'colorIntensity', 'speedMultiplier'];
  return requiredProps.every(prop => Object.prototype.hasOwnProperty.call(preset, prop));
};

/**
 * Batch validate all presets at startup
 * @returns {Object} Summary of validation results
 */
export const validateAllPresets = () => {
  const results = {};
  let validCount = 0;
  let invalidCount = 0;

  Object.keys(NARRATIVE_PRESETS).forEach(presetName => {
    const validation = validatePreset(NARRATIVE_PRESETS[presetName]);
    results[presetName] = validation;

    if (validation) {
      validCount++;
    } else {
      invalidCount++;
      console.error(`[NarrativeParticleConfig] Preset "${presetName}" is invalid.`);
    }
  });

  console.log(
    `[NarrativeParticleConfig] Validation complete: ${validCount} valid, ${invalidCount} invalid presets`
  );

  return {
    valid: validCount,
    invalid: invalidCount,
    results,
    allValid: invalidCount === 0,
  };
};

// === INITIALIZATION VALIDATION ===
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const validation = validateAllPresets();
    if (!validation.allValid) {
      console.error(
        '[NarrativeParticleConfig] Some presets failed validation - system may be unstable'
      );
    }
  }, 100);
}

// === BASELINE EXPORT ===
export { BASELINE_CONFIG };

// === DEFAULT EXPORT ===
export default NARRATIVE_PRESETS;

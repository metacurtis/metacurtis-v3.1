// src/config/narrativeParticleConfig.js - COMPLETE REPLACEMENT
/**
 * Curtis Whorton's Digital Awakening - Complete Origin Story Configuration
 * REPLACES existing narrative system with MC3V story
 */

// === MC3V STORY CONFIGURATION ===
export const BASELINE_CONFIG = {
  baseSize: 4.0,
  colors: ['#00FF00', '#4338CA', '#0D9488'],
  cursorRadius: 1.5,
  repulsionStrength: 0.8,
  colorIntensity: 1.3,
  field: { w: 14, h: 8, d: 7 },
};

// === MC3V DIGITAL AWAKENING STAGES (COMPLETE REPLACEMENT) ===
export const NARRATIVE_PRESETS = {
  genesis: {
    name: 'Genesis Code (1983)',
    description: 'Age 8: Ping-pong game on Commodore 64. The spark that would sleep for 42 years.',
    colors: ['#00FF00', '#FFFF00', '#00FFFF'], // C64 green/yellow/cyan
    baseSize: 2,
    particleCount: 2000,
    colorIntensity: 0.9,
    speedMultiplier: 0.5,
    cursorRadius: 2.5,
    repulsionStrength: 0.3,
    transitionDuration: 3000,
    uniforms: {
      uColorIntensity: 0.9,
      uSpeedFactor: 0.5,
      uCursorInfluence: 0.3,
    },
    memoryFragments: [
      '10 PRINT... first algorithm understood',
      'BASIC commands flowing like magic',
      'Screen glow in the basement darkness',
    ],
  },

  silent: {
    name: 'Silent Years (1983-2022)',
    description: 'Marine Corps precision. Systems thinking forged in discipline.',
    colors: ['#1E40AF', '#374151', '#6B7280'],
    baseSize: 3,
    particleCount: 4000,
    colorIntensity: 1.0,
    speedMultiplier: 0.8,
    cursorRadius: 3.0,
    repulsionStrength: 0.6,
    transitionDuration: 2500,
    uniforms: {
      uColorIntensity: 1.0,
      uSpeedFactor: 0.8,
      uCursorInfluence: 0.6,
    },
    memoryFragments: [
      'Marine Corps: mission completion mindset',
      'Leadership principles shape thinking',
      'Systematic approach to every challenge',
    ],
  },

  awakening: {
    name: 'AI Awakening (2022)',
    description: 'ChatGPT curriculum request. Neural networks demystified. Partnership begins.',
    colors: ['#4338CA', '#7C3AED', '#EC4899'],
    baseSize: 4,
    particleCount: 8000,
    colorIntensity: 1.3,
    speedMultiplier: 1.2,
    cursorRadius: 2.0,
    repulsionStrength: 0.8,
    transitionDuration: 2000,
    uniforms: {
      uColorIntensity: 1.3,
      uSpeedFactor: 1.2,
      uCursorInfluence: 0.8,
    },
    memoryFragments: [
      'Strategic AI partnership begins',
      'Linear algebra: understanding mathematics',
      'Pattern recognition mastery unlocked',
    ],
  },

  acceleration: {
    name: 'Acceleration (Feb 2025)',
    description: 'Day 1: Teach me to code. Architecture revelation. Systems in harmony.',
    colors: ['#7C3AED', '#0D9488', '#059669'],
    baseSize: 5,
    particleCount: 12000,
    colorIntensity: 1.5,
    speedMultiplier: 1.6,
    cursorRadius: 1.5,
    repulsionStrength: 1.0,
    transitionDuration: 1500,
    uniforms: {
      uColorIntensity: 1.5,
      uSpeedFactor: 1.6,
      uCursorInfluence: 1.0,
    },
    memoryFragments: [
      'Zustand discovery: elegance over complexity',
      'System architecture breakthrough',
      '42-year gap bridged in weeks',
    ],
  },

  transcendence: {
    name: 'GLSL Transcendence (Mar 2025)',
    description: 'Direct GPU access. 8M particles/second. Top 0.001% performance.',
    colors: ['#0D9488', '#D97706', '#FFD700'],
    baseSize: 6,
    particleCount: 16000,
    colorIntensity: 1.8,
    speedMultiplier: 1.4,
    cursorRadius: 1.2,
    repulsionStrength: 1.2,
    transitionDuration: 1000,
    uniforms: {
      uColorIntensity: 1.8,
      uSpeedFactor: 1.4,
      uCursorInfluence: 1.2,
    },
    memoryFragments: [
      'GLSL breakthrough: hardware mastery',
      'MetaCurtis emerges: vision realized',
      'Human-AI collaboration perfected',
    ],
  },
};

// === UTILITY FUNCTIONS ===
export const getPreset = presetName => {
  return NARRATIVE_PRESETS[presetName] || NARRATIVE_PRESETS.genesis;
};

export const getAvailablePresets = () => {
  return Object.keys(NARRATIVE_PRESETS);
};

const lerp = (a, b, t) => {
  if (typeof a !== 'number' || typeof b !== 'number' || typeof t !== 'number') {
    console.warn('[MC3V] Invalid lerp inputs:', { a, b, t });
    return typeof a === 'number' ? a : typeof b === 'number' ? b : 0;
  }
  return a * (1 - t) + b * t;
};

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

const rgbToHex = rgb => {
  const toHex = component => {
    const hexVal = Math.round(Math.max(0, Math.min(255, component * 255))).toString(16);
    return hexVal.length === 1 ? '0' + hexVal : hexVal;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
};

const interpolateColor = (fromColorHex, toColorHex, progress) => {
  const fromRgb = hexToRgb(fromColorHex);
  const toRgb = hexToRgb(toColorHex);

  if (!fromRgb || !toRgb) {
    console.warn('[MC3V] Invalid color for interpolation.', { fromColorHex, toColorHex });
    return fromRgb ? fromColorHex : toRgb ? toColorHex : '#FFFFFF';
  }

  const interpolatedRgb = {
    r: lerp(fromRgb.r, toRgb.r, progress),
    g: lerp(fromRgb.g, toRgb.g, progress),
    b: lerp(fromRgb.b, toRgb.b, progress),
  };

  return rgbToHex(interpolatedRgb);
};

const easeInOutCubic = t => {
  let tClamped = Math.max(0, Math.min(1, t));
  return tClamped < 0.5
    ? 4 * tClamped * tClamped * tClamped
    : 1 - Math.pow(-2 * tClamped + 2, 3) / 2;
};

export const interpolatePresets = (fromPresetConfig, toPresetConfig, progress) => {
  if (!fromPresetConfig || !toPresetConfig) {
    console.warn('[MC3V] Invalid preset for interpolation');
    return toPresetConfig || fromPresetConfig || NARRATIVE_PRESETS.genesis;
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
    name: `Transitioning: ${from('name', 'Unknown')} → ${to('name', 'Unknown')}`,
    description: to('description', ''),
    colors: from('colors', BASELINE_CONFIG.colors).map((fromColor, index) => {
      const toColor = to('colors', BASELINE_CONFIG.colors)[index] || fromColor;
      return interpolateColor(fromColor, toColor, easedProgress);
    }),
    baseSize: lerp(
      from('baseSize', BASELINE_CONFIG.baseSize),
      to('baseSize', BASELINE_CONFIG.baseSize),
      easedProgress
    ),
    particleCount: Math.round(
      lerp(from('particleCount', 2000), to('particleCount', 2000), easedProgress)
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
    memoryFragments: to('memoryFragments', []),
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

// === MC3V NARRATIVE MANAGER ===
export class MC3VNarrativeManager {
  constructor() {
    this.currentStage = 'genesis';
    this.isTransitioning = false;
    this.transitionProgress = 0;
    this.fromPreset = getPreset('genesis');
    this.toPreset = getPreset('genesis');
    this.startTime = 0;
    this.duration = 2000;
    this.listeners = new Set();
    this.stageOrder = ['genesis', 'silent', 'awakening', 'acceleration', 'transcendence'];
    this.currentStageIndex = 0;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(listener => listener());
  }

  setStage(stageName, options = {}) {
    if (stageName === this.currentStage && !this.isTransitioning) {
      console.log(`[MC3V] Already in stage "${stageName}"`);
      return;
    }

    const targetPreset = getPreset(stageName);
    if (!targetPreset) {
      console.error(`[MC3V] Stage "${stageName}" not found`);
      return;
    }

    const stageIndex = this.stageOrder.indexOf(stageName);
    if (stageIndex !== -1) {
      this.currentStageIndex = stageIndex;
    }

    console.log(`[MC3V] Stage transition: ${this.currentStage} → ${stageName}`);

    this.currentStage = stageName;
    this.isTransitioning = true;
    this.transitionProgress = 0;
    this.fromPreset = this.isTransitioning ? this.toPreset : this.getCurrentDisplayPreset();
    this.toPreset = targetPreset;
    this.startTime = performance.now();
    this.duration = options.duration || targetPreset.transitionDuration || 2000;

    this.notify();
  }

  nextStage() {
    const nextIndex = Math.min(this.currentStageIndex + 1, this.stageOrder.length - 1);
    if (nextIndex > this.currentStageIndex) {
      this.setStage(this.stageOrder[nextIndex]);
      return true;
    }
    return false;
  }

  prevStage() {
    const prevIndex = Math.max(this.currentStageIndex - 1, 0);
    if (prevIndex < this.currentStageIndex) {
      this.setStage(this.stageOrder[prevIndex]);
      return true;
    }
    return false;
  }

  getCurrentStageInfo() {
    const preset = getPreset(this.currentStage);
    return {
      stage: this.currentStage,
      index: this.currentStageIndex,
      total: this.stageOrder.length,
      name: preset.name,
      description: preset.description,
      memoryFragments: preset.memoryFragments || [],
      isFirst: this.currentStageIndex === 0,
      isLast: this.currentStageIndex === this.stageOrder.length - 1,
    };
  }

  updateTransition(currentTime = performance.now()) {
    if (!this.isTransitioning) {
      return this.getCurrentDisplayPreset();
    }

    const elapsed = currentTime - this.startTime;
    this.transitionProgress = Math.min(elapsed / this.duration, 1.0);

    if (this.transitionProgress >= 1.0) {
      console.log(`[MC3V] Transition to "${this.currentStage}" complete`);
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
    return getPreset(this.currentStage);
  }

  getStage() {
    return this.currentStage;
  }

  getTransitionState() {
    return {
      isTransitioning: this.isTransitioning,
      progress: this.transitionProgress,
      currentStage: this.currentStage,
      stageIndex: this.currentStageIndex,
      totalStages: this.stageOrder.length,
    };
  }

  // Legacy compatibility
  setMood(stageName, options = {}) {
    return this.setStage(stageName, options);
  }

  getMood() {
    return this.getStage();
  }
}

// === SINGLETON INSTANCE ===
export const narrativeTransition = new MC3VNarrativeManager();

// === DEFAULT EXPORT ===
export default NARRATIVE_PRESETS;

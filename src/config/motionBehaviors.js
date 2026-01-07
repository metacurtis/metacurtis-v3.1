// src/config/motionBehaviors.js

export const DEFAULT_MOTION_BEHAVIOR = 'sea_wave_gentle';

export const MOTION_BEHAVIOR_ALIASES = {
  wave: DEFAULT_MOTION_BEHAVIOR,
  waving_sea: DEFAULT_MOTION_BEHAVIOR,
  sea_wave: DEFAULT_MOTION_BEHAVIOR,
};

export const MOTION_BEHAVIORS = {
  sea_wave_gentle: {
    label: 'Sea Wave (Gentle)',
    description: 'Coherent sine/cosine wave field with soft drift.',
    overrides: {
      flagWaveEnabled: true,
      flagAmplitudeMultiplier: 1.0,
      flagSpeedMultiplier: 1.0,
      livingAmplitudeMultiplier: 1.0,
      livingFrequencyMultiplier: 1.0,
      livingSpeedMultiplier: 1.0,
    },
  },
};

export const MOTION_BEHAVIOR_NAMES = Object.keys(MOTION_BEHAVIORS);

export const normalizeMotionBehavior = behaviorName => {
  if (!behaviorName) return DEFAULT_MOTION_BEHAVIOR;
  return MOTION_BEHAVIOR_ALIASES[behaviorName] || behaviorName;
};

export const applyMotionBehavior = (baseConfig, behaviorName) => {
  const normalizedName = normalizeMotionBehavior(behaviorName);
  const behavior = MOTION_BEHAVIORS[normalizedName] || MOTION_BEHAVIORS[DEFAULT_MOTION_BEHAVIOR];
  const overrides = behavior?.overrides || {};

  const baseFlagSpeed =
    typeof baseConfig.flagSpeed === 'number' ? baseConfig.flagSpeed : baseConfig.livingSpeed;

  return {
    ...baseConfig,
    motionBehavior: normalizedName,
    flagWaveEnabled: overrides.flagWaveEnabled ?? true,
    flagAmplitude: baseConfig.flagAmplitude * (overrides.flagAmplitudeMultiplier ?? 1),
    flagSpeed: baseFlagSpeed * (overrides.flagSpeedMultiplier ?? 1),
    livingAmplitude: baseConfig.livingAmplitude * (overrides.livingAmplitudeMultiplier ?? 1),
    livingFrequency: baseConfig.livingFrequency * (overrides.livingFrequencyMultiplier ?? 1),
    livingSpeed: baseConfig.livingSpeed * (overrides.livingSpeedMultiplier ?? 1),
  };
};

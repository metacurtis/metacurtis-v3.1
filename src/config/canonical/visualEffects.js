// High-impact beat presets. Modes: 0=drift,1=grid,2=flow,3=streak,4=orbit
export const PARTICLE_EFFECTS = {
  particles_begin_columns: {
    type: 'particle',
    uMotionMode: 1,
    gridX: 0.12,
    gridY: 0.48,
    tierModes: [1, 4, 1, 4],
    tierParams: [
      [0.15, 0.03, 0.0, 0.0],
      [0.9, 0.45, 0.15, 0.0],
      [0.18, 0.02, 0.0, 0.0],
      [1.0, 0.55, 0.22, 0.0],
    ],
    uSpreadFactor: 0.05,
  },
  reform_as_structure: {
    type: 'particle',
    uMotionMode: 1,
    gridX: 0.20,
    gridY: 0.30,
    tierModes: [1, 1, 4, 4],
    tierParams: [
      [0.18, 0.02, 0.0, 0.0],
      [0.20, 0.02, 0.0, 0.0],
      [0.8, 0.40, 0.20, 0.0],
      [0.9, 0.55, 0.25, 0.0],
    ],
    uSpreadFactor: 0.04,
  },
  tier2_lock_into_grid: {
    type: 'particle',
    uMotionMode: 1,
    gridX: 0.18,
    gridY: 0.18,
    tierModes: [0, 1, 1, 4],
    tierParams: [
      [0.40, 0.80, 1.20, 0.0],
      [0.16, 0.02, 0.0, 0.0],
      [0.18, 0.02, 0.0, 0.0],
      [0.9, 0.40, 0.20, 0.0],
    ],
    uSpreadFactor: 0.03,
  },
  reform_as_flow: {
    type: 'particle',
    uMotionMode: 2,
    uFlowTurbulence: 1.20,
    tierModes: [2, 4, 2, 4],
    tierParams: [
      [1.0, 0.35, 0.8, 0.0],
      [0.9, 0.45, 0.2, 0.0],
      [0.8, 0.30, 0.7, 0.0],
      [0.8, 0.50, 0.2, 0.0],
    ],
    uSpreadFactor: 0.10,
  },
  neural_pathways_light: {
    type: 'particle',
    uMotionMode: 2,
    uFlowTurbulence: 0.85,
    tierModes: [2, 2, 4, 4],
    tierParams: [
      [0.9, 0.30, 0.7, 0.0],
      [0.8, 0.25, 0.6, 0.0],
      [0.8, 0.45, 0.2, 0.0],
      [0.9, 0.55, 0.2, 0.0],
    ],
    uSpreadFactor: 0.08,
  },
  tier3_cadence_pulse:    { type: 'particle', uTierHighlight: 3, uSpreadFactor: 0.10, intensity: 1.2 },
  tier2_pulse_sync:       { type: 'particle', uTierHighlight: 2, uSpreadFactor: 0.07, intensity: 0.9 },
  connection_strengthen:  { type: 'particle', uTierHighlight: 1, uSpreadFactor: 0.05, intensity: 0.7 },
  flicker_fade_back_to_blue: { type: 'particle', uTierHighlight: 1, uSpreadFactor: 0.05, intensity: 0.4 },
  cascade_acceleration: {
    type: 'particle',
    uMotionMode: 3,
    uStreakIntensity: 1.4,
    tierModes: [3,3,4,4],
    tierParams: [
      [1.5, 0.35, 0.0, 0.0],
      [1.3, 0.30, 0.0, 0.0],
      [0.9, 0.45, 0.2, 0.0],
      [1.1, 0.55, 0.2, 0.0],
    ],
    uSpreadFactor: 0.06,
  },
  particles_accelerate: {
    type: 'particle',
    uMotionMode: 3,
    uStreakIntensity: 1.6,
    tierModes: [3, 3, 4, 4],
    tierParams: [
      [1.6, 0.40, 0.05, 0.0],
      [1.3, 0.32, 0.05, 0.0],
      [1.1, 0.48, 0.2, 0.0],
      [1.2, 0.60, 0.2, 0.0],
    ],
    uSpreadFactor: 0.07,
  },
  streak_trails_form: {
    type: 'particle',
    uMotionMode: 3,
    uStreakIntensity: 1.2,
    tierModes: [3, 3, 3, 4],
    tierParams: [
      [1.2, 0.30, 0.10, 0.0],
      [1.0, 0.28, 0.08, 0.0],
      [0.9, 0.35, 0.12, 0.0],
      [1.0, 0.45, 0.18, 0.0],
    ],
    uSpreadFactor: 0.05,
  },
  consciousness_nodes_pulse: {
    type: 'particle',
    uTierHighlight: 3,
    tierModes: [2,4,2,4],
    tierParams: [
      [0.8, 0.25, 0.6, 0.0],
      [0.9, 0.35, 0.2, 0.0],
      [0.8, 0.35, 0.7, 0.0],
      [0.9, 0.55, 0.2, 0.0],
    ],
    uSpreadFactor: 0.09,
  },
  cosmic_dust_swirl: {
    type: 'particle',
    uMotionMode: 4,
    tierModes: [0,4,4,4],
    tierParams: [
      [0.45, 0.7, 1.0, 0.0],
      [0.9,  0.65, 0.20, 0.0],
      [1.0,  0.72, 0.18, 0.0],
      [1.2,  0.85, 0.15, 0.0],
    ],
    uSpreadFactor: 0.12,
  },
  golden_ratio_spiral: {
    type: 'particle',
    uMotionMode: 4,
    tierModes: [0, 4, 4, 4],
    tierParams: [
      [0.50, 0.78, 1.05, 0.0],
      [0.95, 0.70, 0.22, 0.0],
      [1.08, 0.80, 0.18, 0.0],
      [1.34, 0.92, 0.15, 0.0],
    ],
    uSpreadFactor: 0.10,
  },
  fusion_pattern: {
    type: 'particle',
    uMotionMode: 2,
    uFlowTurbulence: 1.4,
    tierModes: [2,2,4,4],
    tierParams: [
      [1.1, 0.4, 0.9, 0.0],
      [1.0, 0.3, 0.8, 0.0],
      [0.9, 0.45, 0.2, 0.0],
      [1.0, 0.6, 0.2, 0.0],
    ],
    uSpreadFactor: 0.1,
  },
  tier3_lightning_burst: {
    type: 'particle',
    uTierHighlight: 3,
    intensity: 1.5,
    uSpreadFactor: 0.09,
    tierModes: [4, 4, 4, 4],
    tierParams: [
      [1.2, 0.30, 0.0, 0.0],
      [1.3, 0.35, 0.0, 0.0],
      [1.4, 0.40, 0.0, 0.0],
      [1.6, 0.45, 0.0, 0.0],
    ],
  },
  tier3_synaptic_flash: {
    type: 'particle',
    uMotionMode: 3,
    uStreakIntensity: 1.2,
    uParticleFlash: 0.8,
    uSpreadFactor: 0.06,
    tierHighlight: [3],
    tierModes: [3, 3, 3, 3],
    tierParams: [
      [1.2, 0.30, 0.10, 0.0],
      [1.0, 0.28, 0.08, 0.0],
      [0.9, 0.35, 0.12, 0.0],
      [1.0, 0.45, 0.18, 0.0],
    ],
  },
  gentle_drift: {
    type: 'particle',
    uMotionMode: 3,
    uFlowTurbulence: 0.2,
    uSpreadFactor: 0.05,
    tierHighlight: [0, 1],
    tierModes: [0, 0, 0, 0],
    tierParams: [
      [0.8, 0.20, 0.50, 0.0],
      [0.8, 0.20, 0.50, 0.0],
      [0.8, 0.20, 0.50, 0.0],
      [0.8, 0.20, 0.50, 0.0],
    ],
  },
  tier3_subtle_pulse: {
    type: 'particle',
    uParticleFlash: 0.2,
    uOpacityMin: 0.5,
    uOpacityMax: 1.0,
    tierHighlight: [3],
  },
  tier2_flicker_increase: {
    type: 'particle',
    uParticleFlash: 0.4,
    uOpacityMin: 0.5,
    uOpacityMax: 1.0,
    tierHighlight: [2],
  },
  tier3_glow_pulse: {
    type: 'particle',
    uParticleFlash: 0.6,
    uOpacityMin: 0.5,
    uOpacityMax: 1.0,
    tierHighlight: [3],
  },
  tier3_construction_guide: {
    type: 'particle',
    uMotionMode: 1,
    uFlowTurbulence: 0.05,
    uSpreadFactor: 0.03,
    tierHighlight: [3],
    tierModes: [1, 1, 1, 1],
    tierParams: [
      [0.18, 0.02, 0.0, 0.0],
      [0.18, 0.02, 0.0, 0.0],
      [0.18, 0.02, 0.0, 0.0],
      [0.18, 0.02, 0.0, 0.0],
    ],
  },
  golden_ratio_complete: {
    type: 'particle',
    uMotionMode: 4,
    tierModes: [4, 4, 4, 4],
    tierParams: [
      [0.60, 0.80, 1.00, 0.0],
      [0.90, 0.72, 0.20, 0.0],
      [1.05, 0.82, 0.18, 0.0],
      [1.30, 0.94, 0.15, 0.0],
    ],
    uSpreadFactor: 0.10,
  },
  isometric_view_rotate: {
    type: 'particle',
    uMotionMode: 4,
    tierModes: [4, 4, 4, 4],
    tierParams: [
      [0.25, 0.60, 0.10, 0.0],
      [0.25, 0.60, 0.10, 0.0],
      [0.25, 0.60, 0.10, 0.0],
      [0.25, 0.60, 0.10, 0.0],
    ],
    uSpreadFactor: 0.05,
  },
  laminar_flow_perfect: {
    type: 'particle',
    uMotionMode: 2,
    uFlowTurbulence: 0.4,
    uSpreadFactor: 0.06,
    tierModes: [2, 2, 2, 2],
    tierParams: [
      [1.0, 0.25, 0.7, 0.0],
      [1.0, 0.25, 0.7, 0.0],
      [1.0, 0.25, 0.7, 0.0],
      [1.0, 0.25, 0.7, 0.0],
    ],
  },
  layer_stack_reveal: {
    type: 'particle',
    uMotionMode: 1,
    gridX: 0.20,
    gridY: 0.20,
    uSpreadFactor: 0.04,
    tierModes: [1, 1, 1, 1],
    tierParams: [
      [0.18, 0.02, 0.0, 0.0],
      [0.18, 0.02, 0.0, 0.0],
      [0.18, 0.02, 0.0, 0.0],
      [0.18, 0.02, 0.0, 0.0],
    ],
  },
  master_plan_glow: {
    type: 'particle',
    uParticleFlash: 0.5,
    uOpacityMin: 0.6,
    uOpacityMax: 1.0,
    tierHighlight: [3],
  },
  orbit_sync_begin: {
    type: 'particle',
    uMotionMode: 4,
    uSpreadFactor: 0.08,
    tierModes: [4, 4, 4, 4],
    tierParams: [
      [0.40, 0.70, 0.8, 0.0],
      [0.40, 0.70, 0.8, 0.0],
      [0.40, 0.70, 0.8, 0.0],
      [0.40, 0.70, 0.8, 0.0],
    ],
  },
  phase_lock_achieve: {
    type: 'particle',
    uMotionMode: 1,
    uFlowTurbulence: 0.02,
    tierModes: [1, 1, 1, 1],
    tierParams: [
      [0.12, 0.01, 0.0, 0.0],
      [0.12, 0.01, 0.0, 0.0],
      [0.12, 0.01, 0.0, 0.0],
      [0.12, 0.01, 0.0, 0.0],
    ],
    uSpreadFactor: 0.02,
  },
  question_expand: {
    type: 'particle',
    uMotionMode: 2,
    uFlowTurbulence: 0.6,
    uSpreadFactor: 0.08,
    tierModes: [2, 2, 2, 2],
    tierParams: [
      [1.0, 0.30, 0.8, 0.0],
      [1.0, 0.30, 0.8, 0.0],
      [1.0, 0.30, 0.8, 0.0],
      [1.0, 0.30, 0.8, 0.0],
    ],
  },
  unified_field: {
    type: 'particle',
    uMotionMode: 0,
    uSpreadFactor: 0.05,
    tierHighlight: [0, 1, 2, 3],
    tierModes: [0, 0, 0, 0],
    tierParams: [
      [0.7, 0.15, 0.5, 0.0],
      [0.7, 0.15, 0.5, 0.0],
      [0.7, 0.15, 0.5, 0.0],
      [0.7, 0.15, 0.5, 0.0],
    ],
  },
  transcendent_integration: {
    type: 'particle',
    uMotionMode: 4,
    uParticleFlash: 0.7,
    uSpreadFactor: 0.1,
    tierHighlight: [0, 1, 2, 3],
    tierModes: [4, 4, 4, 4],
    tierParams: [
      [0.6, 0.80, 1.0, 0.0],
      [0.6, 0.80, 1.0, 0.0],
      [0.6, 0.80, 1.0, 0.0],
      [0.6, 0.80, 1.0, 0.0],
    ],
  },
  velocity_peak: {
    type: 'particle',
    uMotionMode: 3,
    uStreakIntensity: 1.4,
    uSpreadFactor: 0.07,
    tierModes: [3, 3, 3, 3],
    tierParams: [
      [1.6, 0.40, 0.05, 0.0],
      [1.3, 0.32, 0.05, 0.0],
      [1.1, 0.48, 0.2, 0.0],
      [1.2, 0.60, 0.2, 0.0],
    ],
  },
  galactic_arm_rotate: {
    type: 'particle',
    uMotionMode: 4,
    uSpreadFactor: 0.12,
    tierModes: [4, 4, 4, 4],
    tierParams: [
      [0.50, 0.75, 1.0, 0.0],
      [0.90, 0.70, 0.22, 0.0],
      [1.05, 0.82, 0.18, 0.0],
      [1.25, 0.90, 0.15, 0.0],
    ],
  },
};

const assertAllowedParams = (verb, params, allowed) => {
  if (!params || typeof params !== 'object' || Array.isArray(params)) return;
  for (const key of Object.keys(params)) {
    if (!allowed.includes(key)) {
      throw new Error(`[visualEffects] ${verb}: unsupported param '${key}'`);
    }
  }
};

const normalizeColor = (c, fallback) => (typeof c === 'string' && c.length ? c : fallback);

// Canonical verb → renderer-uniform map.
// Only fields defined in RENDER_DIRECTIVE_FIELDS/RENDER_DIRECTIVE_FIELD_TYPE_MAP are used.
export const VERB_UNIFORM_MAP = {
  chaos: () => ({
    uMotionMode: 3,
    uFlowTurbulence: 1.0,
    uParticleFlash: 0.8,
    uOpacityMin: 0.4,
    uOpacityMax: 1.0,
  }),
  coalesce: () => ({
    uMotionMode: 1,
    uFlowTurbulence: 0.35,
    uParticleFlash: 0.5,
    uOpacityMin: 0.5,
    uOpacityMax: 0.9,
  }),
  settle: () => ({
    uMotionMode: 1,
    uFlowTurbulence: 0.15,
    uParticleFlash: 0.2,
    uOpacityMin: 0.6,
    uOpacityMax: 0.9,
  }),
  gentle_drift: () => ({
    uMotionMode: 3,
    uFlowTurbulence: 0.2,
    uOpacityMin: 0.5,
    uOpacityMax: 0.8,
  }),
  breathing_rhythm: () => ({
    uMotionMode: 0,
    uParticleFlash: 0.25,
    uOpacityMin: 0.45,
    uOpacityMax: 0.85,
  }),
  flicker_fade_back_to_blue: () => ({
    uMotionMode: 0,
    uParticleFlash: 0.35,
    uOpacityMin: 0.4,
    uOpacityMax: 0.9,
  }),
  pullIn: (params = {}) => {
    assertAllowedParams('pullIn', params, ['text', 'color', 'intensity', 'bloom', 'camera']);
    const color = normalizeColor(params.color, '#00A4FF');
    const intensity = typeof params.intensity === 'number' ? params.intensity : 0.18;
    const bloom = typeof params.bloom === 'number' ? params.bloom : 0.08;
    return {
      uniforms: {
        uMotionMode: 1,
        uFlowTurbulence: 0.5,
        uParticleFlash: 0.6,
        uEffectIntensity: intensity,
        uBloomIntensity: bloom,
        uColor: color,
      },
      _meta: { verb: 'pullIn', color, intensity, bloom, text: params.text || '', camera: params.camera || null },
    };
  },
  morph: (params = {}) => {
    assertAllowedParams('morph', params, ['text', 'color', 'intensity', 'bloom', 'camera']);
    const color = normalizeColor(params.color, '#19F4C7');
    const intensity = typeof params.intensity === 'number' ? params.intensity : 0.22;
    const bloom = typeof params.bloom === 'number' ? params.bloom : 0.1;
    return {
      uniforms: {
        uMotionMode: 1,
        uFlowTurbulence: 0.45,
        uParticleFlash: 0.55,
        uEffectIntensity: intensity,
        uBloomIntensity: bloom,
        uColor: color,
      },
      _meta: { verb: 'morph', color, intensity, bloom, text: params.text || '', camera: params.camera || null },
    };
  },
  sparkDrift: (params = {}) => {
    assertAllowedParams('sparkDrift', params, ['text', 'color', 'intensity', 'bloom', 'camera']);
    const color = normalizeColor(params.color, '#A37CFF');
    const intensity = typeof params.intensity === 'number' ? params.intensity : 0.26;
    const bloom = typeof params.bloom === 'number' ? params.bloom : 0.12;
    return {
      uniforms: {
        uMotionMode: 3,
        uFlowTurbulence: 0.85,
        uParticleFlash: 0.7,
        uEffectIntensity: intensity,
        uBloomIntensity: bloom,
        uColor: color,
      },
      _meta: { verb: 'sparkDrift', color, intensity, bloom, text: params.text || '', camera: params.camera || null },
    };
  },
  bloomPulse: (params = {}) => {
    assertAllowedParams('bloomPulse', params, ['text', 'color', 'intensity', 'bloom', 'camera']);
    const color = normalizeColor(params.color, '#A37CFF');
    const bloomPeak =
      typeof params.bloom === 'number'
        ? params.bloom
        : typeof params.bloom?.peak === 'number'
          ? params.bloom.peak
          : 0.25;
    const intensity = typeof params.intensity === 'number' ? params.intensity : 0.12;
    const bloomShape =
      params.bloom && typeof params.bloom === 'object' && params.bloom.shape
        ? params.bloom.shape
        : 'rampThenFade';
    return {
      uniforms: {
        uMotionMode: 0,
        uFlowTurbulence: 0.2,
        uParticleFlash: 0.8,
        uEffectIntensity: intensity,
        uBloomIntensity: bloomPeak,
        uBloomShape: bloomShape,
        uColor: color,
      },
      _meta: { verb: 'bloomPulse', color, intensity, bloom: params.bloom ?? bloomPeak, text: params.text || '', camera: params.camera || null },
    };
  },
  endCard: (params = {}) => {
    assertAllowedParams('endCard', params, ['title', 'subtitle', 'fadeInMs', 'holdMs', 'fadeOutMs', 'color']);
    const color = normalizeColor(params.color, '#FFFFFF');
    return {
      uniforms: {
        uFadeToBlack: 1,
        uEndCardAlpha: 1,
        uEndCardColor: color,
      },
      _meta: {
        verb: 'endCard',
        title: params.title || 'MetaCurtis',
        subtitle: params.subtitle || '',
        fadeInMs: params.fadeInMs ?? 400,
        holdMs: params.holdMs ?? 2200,
        fadeOutMs: params.fadeOutMs ?? 400,
        color,
      },
    };
  },
  // Legacy narration cues (Discipline) — neutral mappings to prevent hard-fail
  particles_begin_columns: (params = {}) => ({
    uniforms: {},
    _meta: { verb: 'particles_begin_columns', legacyCue: true, params },
  }),
  tier2_lock_into_grid: (params = {}) => ({
    uniforms: {},
    _meta: { verb: 'tier2_lock_into_grid', legacyCue: true, params },
  }),
  reform_as_structure: (params = {}) => ({
    uniforms: {},
    _meta: { verb: 'reform_as_structure', legacyCue: true, params },
  }),
};

export const CAMERA_EFFECTS = {
  breathing_rhythm:        { type: 'camera' },
  genesis_callback_purple: { type: 'camera' },
  all_stages_echo:         { type: 'camera' },
  ballet_choreography:     { type: 'camera' },
  blueprint_complete:      { type: 'camera' },
  blueprint_grid_emerge:   { type: 'camera' },
};

export function getVisualEffect(key) {
  if (PARTICLE_EFFECTS[key]) return PARTICLE_EFFECTS[key];
  if (CAMERA_EFFECTS[key]) return CAMERA_EFFECTS[key];
  return null;
}

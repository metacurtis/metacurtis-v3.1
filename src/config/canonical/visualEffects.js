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

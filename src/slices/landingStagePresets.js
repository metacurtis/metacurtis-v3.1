import SST from '../config/sst-loader.js';

const VELOCITY_STAGE_WORD =
  typeof SST?.visual?.letterGeometry?.velocity?.word === 'string' &&
  SST.visual.letterGeometry.velocity.word.trim()
    ? SST.visual.letterGeometry.velocity.word.trim()
    : 'FORM';

export const LANDING_STAGE_PRESETS = Object.freeze({
  agency_dark: Object.freeze({
    baseStage: 'architecture',
    word: 'FORM',
    palette: Object.freeze(['#111827', '#1F2937', '#93C5FD']),
    quality: 'HIGH',
    tierMix: Object.freeze([0.58, 0.22, 0.12, 0.08]),
    particlesBase: 9000,
  }),
  saas_clean: Object.freeze({
    baseStage: 'genesis',
    word: 'LAUNCH',
    palette: Object.freeze(['#E5E7EB', '#94A3B8', '#0F172A']),
    quality: 'HIGH',
    tierMix: Object.freeze([0.62, 0.2, 0.1, 0.08]),
    particlesBase: 8500,
  }),
  luxury_gold: Object.freeze({
    baseStage: 'harmony',
    word: 'ATELIER',
    palette: Object.freeze(['#FDE68A', '#F59E0B', '#78350F']),
    quality: 'ULTRA',
    tierMix: Object.freeze([0.5, 0.2, 0.15, 0.15]),
    particlesBase: 11000,
  }),
  cyber_teal: Object.freeze({
    baseStage: 'neural',
    word: 'CYBER',
    palette: Object.freeze(['#0F172A', '#14B8A6', '#22D3EE']),
    tierMix: Object.freeze([0.55, 0.22, 0.13, 0.1]),
    particlesBase: 9800,
  }),
  healthcare_calm: Object.freeze({
    baseStage: 'genesis',
    word: 'CARE',
    palette: Object.freeze(['#E0F2FE', '#7DD3FC', '#0EA5E9']),
    tierMix: Object.freeze([0.64, 0.2, 0.1, 0.06]),
    particlesBase: 7800,
  }),
  fintech_black: Object.freeze({
    baseStage: 'architecture',
    word: 'CAPITAL',
    palette: Object.freeze(['#020617', '#1E293B', '#38BDF8']),
    quality: 'HIGH',
    tierMix: Object.freeze([0.56, 0.22, 0.12, 0.1]),
    particlesBase: 10200,
  }),
  startup_purple: Object.freeze({
    baseStage: 'velocity',
    word: 'LAUNCH',
    palette: Object.freeze(['#312E81', '#7C3AED', '#C4B5FD']),
    quality: 'HIGH',
    tierMix: Object.freeze([0.52, 0.2, 0.14, 0.14]),
    particlesBase: 10800,
  }),
  velocity_stage: Object.freeze({
    baseStage: 'velocity',
    word: VELOCITY_STAGE_WORD,
    palette: Object.freeze(['#7C3AED', '#9333EA', '#6B21A8']),
    quality: 'HIGH',
    tierMix: Object.freeze([0.45, 0.2, 0.15, 0.2]),
    particlesBase: 15000,
  }),
  enterprise_blue: Object.freeze({
    baseStage: 'discipline',
    word: 'TRUST',
    palette: Object.freeze(['#0F172A', '#1D4ED8', '#93C5FD']),
    quality: 'HIGH',
    tierMix: Object.freeze([0.58, 0.22, 0.12, 0.08]),
    particlesBase: 9400,
  }),
});

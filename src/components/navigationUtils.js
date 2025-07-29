// src/components/navigationUtils.js
// Navigation utilities exported separately to satisfy react-refresh

// ✅ SST v2.0: Canonical 7-stage order
const MC3V_STAGE_ORDER = [
  'genesis',
  'discipline',
  'neural',
  'velocity',
  'architecture',
  'harmony',
  'transcendence',
];

const STAGE_LABELS = {
  genesis: '1983',
  discipline: '1983-2022',
  neural: '2022',
  velocity: 'Feb 2025',
  architecture: 'Mar 2025',
  harmony: 'Mar 2025',
  transcendence: 'Present',
};

const stageToIndex = stageName => {
  const index = MC3V_STAGE_ORDER.indexOf(stageName);
  return index === -1 ? 0 : index;
};

const getStageInfo = stageName => {
  const index = stageToIndex(stageName);
  return {
    name: stageName,
    index,
    label: STAGE_LABELS[stageName] || stageName,
    progress: index / (MC3V_STAGE_ORDER.length - 1),
    isFirst: index === 0,
    isLast: index === MC3V_STAGE_ORDER.length - 1,
  };
};

export const navigationUtils = {
  stageOrder: MC3V_STAGE_ORDER,
  stageLabels: STAGE_LABELS,
  isValidStage: stageName => MC3V_STAGE_ORDER.includes(stageName),
  getStageInfo,
  getAllStagesInfo: () => MC3V_STAGE_ORDER.map(stage => getStageInfo(stage)),
};

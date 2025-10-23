// src/orchestration/navigation/narrativeNavigation.js
// Provides a global navigation helper used by Narrative UI controls (prod + dev).

import stageAtom from '@/state/atoms/stageAtom.js';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';
import unifiedNav from '@/theater/UnifiedNavigationAPI.js';

const getStageNames = () => {
  const names = stageAtom.getStageNames?.();
  if (Array.isArray(names) && names.length > 0) return names;
  const canonicalOrder = Array.isArray(Canonical?.stageOrder) ? Canonical.stageOrder : [];
  if (canonicalOrder.length) return canonicalOrder;
  return Object.keys(Canonical?.stages || {});
};

const emitStartNarrative = (stageName) => {
  if (!stageName) return;
  BeatBus.emit?.(EVENTS.START_NARRATIVE, {
    stage: stageName,
    source: 'user_action',
  });
};

const jumpToStage = (stageName, options = {}) => {
  const stageNames = getStageNames();
  const targetIndex = stageNames.indexOf(stageName);
  if (targetIndex === -1) {
    console.warn('[narrativeNavigation] Unknown stage:', stageName);
    return false;
  }

  const { smooth = true, emitNarration = true } = options;
  const currentStage = stageAtom.getState().currentStage;
  if (currentStage === stageName) return true;

  unifiedNav
    .navigateToStage(stageName, {
      smooth,
      skipNarration: !emitNarration,
      source: 'narrative_navigation',
    })
    .then(() => {
      if (emitNarration) emitStartNarrative(stageName);
    })
    .catch((error) => {
      console.warn('[narrativeNavigation] navigateToStage failed', { stageName, error });
    });
  return true;
};

const toggleAutoAdvance = (forcedValue) => {
  const current = stageAtom.getState().autoAdvanceEnabled;
  const nextValue =
    typeof forcedValue === 'boolean' ? forcedValue : !current;
  stageAtom.setAutoAdvanceEnabled(nextValue);
  return nextValue;
};

const buildNavigationState = () => {
  const info = stageAtom.getStageInfo?.() || {};
  const stageNames = getStageNames();
  const totalStages = stageNames.length;
  const currentIndex =
    typeof info.stageIndex === 'number' ? info.stageIndex : 0;

  return {
    currentStage: info.currentStage || stageNames[currentIndex] || null,
    currentIndex,
    allStages: stageNames,
    isTransitioning: !!info.isTransitioning,
    autoAdvanceEnabled: !!info.autoAdvanceEnabled,
    canGoPrev: currentIndex > 0,
    canGoNext: currentIndex < totalStages - 1,
  };
};

const buildStageButtons = () => {
  const stageNames = getStageNames();
  const info = stageAtom.getStageInfo?.() || {};
  const activeStage = info.currentStage;

  return stageNames.map((name, index) => {
    const stageMeta = Canonical?.stages?.[name] || {};
    const baseLabel = stageMeta.label || stageMeta.word || null;
    const label =
      baseLabel ??
      (typeof stageMeta.ordinal === 'number'
        ? `${stageMeta.ordinal + 1}. ${name.toUpperCase()}`
        : name.toUpperCase());

    return {
      id: name,
      label,
      isActive: activeStage === name,
      onClick: () => jumpToStage(name, { smooth: true, emitNarration: true }),
      index,
    };
  });
};

const nextStage = () => {
  const stageNames = getStageNames();
  const info = stageAtom.getStageInfo?.() || {};
  const currentIndex = typeof info.stageIndex === 'number' ? info.stageIndex : 0;
  const nextIndex = Math.min(currentIndex + 1, stageNames.length - 1);
  const nextStageName = stageNames[nextIndex];

  if (!nextStageName || nextStageName === info.currentStage) return false;

  unifiedNav
    .navigateToStage(nextStageName, {
      smooth: true,
      skipNarration: false,
      source: 'narrative_navigation_next',
    })
    .then(() => emitStartNarrative(nextStageName))
    .catch((error) => {
      console.warn('[narrativeNavigation] nextStage navigate failed', { nextStageName, error });
    });
  return true;
};

const prevStage = () => {
  const stageNames = getStageNames();
  const info = stageAtom.getStageInfo?.() || {};
  const currentIndex = typeof info.stageIndex === 'number' ? info.stageIndex : 0;
  const prevIndex = Math.max(currentIndex - 1, 0);
  const prevStageName = stageNames[prevIndex];

  if (!prevStageName || prevStageName === info.currentStage) return false;

  unifiedNav
    .navigateToStage(prevStageName, {
      smooth: true,
      skipNarration: false,
      source: 'narrative_navigation_prev',
    })
    .then(() => emitStartNarrative(prevStageName))
    .catch((error) => {
      console.warn('[narrativeNavigation] prevStage navigate failed', { prevStageName, error });
    });
  return true;
};

const navigationAPI = {
  getNavigationState: buildNavigationState,
  getStageButtonData: buildStageButtons,
  nextStage,
  prevStage,
  jumpToStage,
  toggleAutoAdvance,
};

if (typeof window !== 'undefined') {
  window.narrativeNavigation = Object.assign(
    {},
    window.narrativeNavigation,
    navigationAPI,
  );
}

export default navigationAPI;

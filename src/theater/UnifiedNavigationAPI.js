/**
 * UnifiedNavigationAPI v1.0
 *
 * Single entry point for ALL stage navigation.
 * Guarantees full orchestration (fragments, scroll sync, narration).
 *
 * RULE: Nothing should call narrativeAtom.jumpToStage directly.
 * RULE: Nothing should call stageAtom.jumpToStage directly.
 * RULE: All navigation goes through this API.
 */

import BeatBus from '@/theater/bus';
import NavigationGate from '@/theater/NavigationGate.js';
import { stageAtom } from '@/state/atoms';
import stateCommands from '@/state/commands/StateCommands.js';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';

class UnifiedNavigationAPI {
  constructor() {
    this.initialized = false;
    this.currentStage = null;

    console.log('🎯 [UNIFIED NAV] API initialized');
  }

  /**
   * Navigate to specific stage by slug
   * Triggers full orchestration via scroll
   */
  async navigateToStage(targetStage, options = {}) {
    const {
      smooth = true,
      skipNarration = false,
      source = 'unknown',
      settleMs = 450,
      releaseDelayMs = 150,
    } = options;

    console.log('🎯 [UNIFIED NAV] navigateToStage', {
      targetStage,
      source,
      smooth,
      skipNarration,
      method: 'ORCHESTRATED',
    });

    const fallbackStages =
      typeof window !== 'undefined'
        ? window.SST?.stages || window.Canonical?.stages || {}
        : {};
    const stageOrder =
      Array.isArray(Canonical?.stageOrder) && Canonical.stageOrder.length
        ? Canonical.stageOrder
        : Object.keys(fallbackStages);
    const stageCount = stageOrder.length;
    const targetIndex = stageOrder.indexOf(targetStage);

    if (targetIndex === -1) {
      console.error('🚨 [UNIFIED NAV] Invalid stage:', targetStage);
      return false;
    }

    // Calculate target scroll percentage
    const denominator = Math.max(stageCount - 1, 1);
    const targetProgress = stageCount > 1 ? targetIndex / denominator : 0;
    const targetScrollPercent = targetProgress * 100;

    // Skip narration if requested
    if (skipNarration && window.narrationController?.skipNarration) {
      window.narrationController.skipNarration();
    }

    // DIAGNOSTIC: Check if scroll is possible
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      console.warn('🚨 [UNIFIED NAV] Window or document unavailable');
      stateCommands.setScrollProgress(targetProgress, {
        origin: 'unified_nav_headless',
      });
      return true;
    }

    const documentHeight = document.body?.scrollHeight ?? 0;
    const windowHeight = window.innerHeight ?? 0;
    const maxScroll = Math.max(documentHeight - windowHeight, 0);
    const scrollTarget = (targetScrollPercent / 100) * maxScroll;

    console.log('🎯 [UNIFIED NAV] Scroll calculation', {
      targetScrollPercent,
      documentHeight,
      windowHeight,
      maxScroll,
      scrollTarget,
      currentScroll: typeof window.scrollY === 'number' ? window.scrollY : 0,
    });

    // Check if document is scrollable
    NavigationGate.start(targetStage, source);
    let finalReason = 'committed';

    try {
      if (maxScroll <= 0 || Number.isNaN(scrollTarget)) {
        console.warn('🚨 [UNIFIED NAV] Document not scrollable - navigation aborted', {
          documentHeight,
          windowHeight,
        });
        stateCommands.setScrollProgress(targetProgress, {
          origin: 'unified_nav_fallback',
        });
        finalReason = 'document_not_scrollable';
        return true;
      }

      try {
        window.scrollTo({
          top: scrollTarget,
          behavior: smooth ? 'smooth' : 'auto',
        });
      } catch {
        window.scrollTo(0, scrollTarget);
      }

      await new Promise((resolve) => setTimeout(resolve, Math.max(0, settleMs)));

      const currentStage = stageAtom.getState?.()?.currentStage;
      if (currentStage !== targetStage) {
        stateCommands.setScrollProgress(targetProgress, {
          origin: 'unified_nav_scroll_sync',
        });
      }

      if (releaseDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, releaseDelayMs));
      }

      return true;
    } catch (err) {
      console.error('🚨 [UNIFIED NAV] navigateToStage error', err);
      finalReason = 'error';
      return false;
    } finally {
      NavigationGate.end(finalReason);
    }
  }

  /**
   * Navigate to next stage
   */
  nextStage(options = {}) {
    const currentStage = this.getCurrentStage();
    const stages = Object.keys(window.SST?.stages || {});
    const currentIndex = stages.indexOf(currentStage);
    const nextIndex = Math.min(currentIndex + 1, stages.length - 1);

    if (nextIndex === currentIndex) {
      console.log('🎯 [UNIFIED NAV] Already at last stage');
      return false;
    }

    return this.navigateToStage(stages[nextIndex], {
      ...options,
      source: 'nextStage',
    });
  }

  /**
   * Navigate to previous stage
   */
  prevStage(options = {}) {
    const currentStage = this.getCurrentStage();
    const stages = Object.keys(window.SST?.stages || {});
    const currentIndex = stages.indexOf(currentStage);
    const prevIndex = Math.max(currentIndex - 1, 0);

    if (prevIndex === currentIndex) {
      console.log('🎯 [UNIFIED NAV] Already at first stage');
      return false;
    }

    return this.navigateToStage(stages[prevIndex], {
      ...options,
      source: 'prevStage',
    });
  }

  /**
   * Get current stage from stageAtom (read-only)
   */
  getCurrentStage() {
    return window.stageControls?.getCurrentStage?.() || 'genesis';
  }

  /**
   * Listen to stage changes (read-only access)
   */
  onStageChange(callback) {
    return BeatBus.on('STAGE_CHANGE', callback);
  }
}

// Create singleton instance
const unifiedNav = new UnifiedNavigationAPI();

// Expose globally for debugging
if (typeof window !== 'undefined') {
  window.unifiedNav = unifiedNav;
  console.log('🎯 [UNIFIED NAV] Available at window.unifiedNav');
}

export default unifiedNav;

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

import BeatBus from '@/systems/events/BeatBus';

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
  navigateToStage(targetStage, options = {}) {
    const {
      smooth = true,
      skipNarration = false,
      source = 'unknown',
    } = options;

    console.log('🎯 [UNIFIED NAV] navigateToStage', {
      targetStage,
      source,
      smooth,
      skipNarration,
      method: 'ORCHESTRATED',
    });

    // Get stage index from SST
    const stages = window.SST?.stages || window.Canonical?.stages;
    if (!stages) {
      console.error('🚨 [UNIFIED NAV] SST not available');
      return false;
    }

    const stageOrder = Object.keys(stages);
    const stageCount = stageOrder.length;
    const targetIndex = stageOrder.indexOf(targetStage);

    if (targetIndex === -1) {
      console.error('🚨 [UNIFIED NAV] Invalid stage:', targetStage);
      return false;
    }

    // Calculate target scroll percentage
    const denominator = Math.max(stageCount - 1, 1);
    const targetScrollPercent = stageCount > 1 ? (targetIndex / denominator) * 100 : 0;

    // Skip narration if requested
    if (skipNarration && window.narrationController?.skipNarration) {
      window.narrationController.skipNarration();
    }

    // DIAGNOSTIC: Check if scroll is possible
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      console.warn('🚨 [UNIFIED NAV] Window or document unavailable');
      return false;
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
    if (maxScroll <= 0 || Number.isNaN(scrollTarget)) {
      console.warn('🚨 [UNIFIED NAV] Document not scrollable - using direct stage jump as fallback');

      if (window.stageControls?.jumpToStage) {
        window.stageControls.jumpToStage(targetStage);
        console.log('🎯 [UNIFIED NAV] Used fallback stage jump');
      } else {
        console.warn('🚨 [UNIFIED NAV] Fallback stageControls.jumpToStage unavailable');
      }

      return true;
    }

    // Attempt scroll
    window.scrollTo({
      top: scrollTarget,
      behavior: smooth ? 'smooth' : 'auto',
    });

    // Verify scroll happened
    setTimeout(() => {
      const actualScroll = typeof window.scrollY === 'number' ? window.scrollY : 0;
      if (Math.abs(actualScroll - scrollTarget) > 10) {
        console.warn('🚨 [UNIFIED NAV] Scroll failed', {
          actualScroll,
          scrollTarget,
          delta: actualScroll - scrollTarget,
        });
      } else {
        console.log('✅ [UNIFIED NAV] Scroll succeeded');
      }
    }, smooth ? 500 : 100);

    return true;
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

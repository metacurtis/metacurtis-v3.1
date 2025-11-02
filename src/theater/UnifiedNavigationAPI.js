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
import { Canonical } from '@/config/canonical/canonicalAuthority.js';

class UnifiedNavigationAPI {
  constructor() {
    this.initialized = false;
    this.currentStage = null;

    console.log('🎯 [UNIFIED NAV] API initialized');
  }

  /**
   * Wait for scroll surface to become ready
   * Checks both document height and ScrollOrchestrator state
   *
   * @param {number} timeoutMs - Maximum wait time
   * @returns {Promise<boolean>} - True if ready, false if timeout
   */
  async _waitForScrollSurface(timeoutMs = 5000) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }

    const startTime = performance.now();

    const checkReady = () => {
      const bodyHeight = document.body?.scrollHeight ?? 0;
      const viewportHeight = window.innerHeight ?? 0;
      const hasHeight = bodyHeight > viewportHeight;

      const orchestrator =
        window.scrollOrchestrator || window.__scrollOrchestrator || null;
      const isRunning = orchestrator?.isRunning?.() ?? orchestrator?.running ?? false;

      return hasHeight && !!orchestrator && isRunning;
    };

    if (checkReady()) {
      return true;
    }

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const elapsed = performance.now() - startTime;

        if (checkReady()) {
          clearInterval(interval);
          console.log(`✅ [UNIFIED NAV] Scroll surface ready after ${Math.round(elapsed)}ms`);
          resolve(true);
          return;
        }

        if (elapsed >= timeoutMs) {
          clearInterval(interval);
          const orchestrator =
            window.scrollOrchestrator || window.__scrollOrchestrator || null;
          console.error(`❌ [UNIFIED NAV] Scroll surface timeout after ${timeoutMs}ms`);
          console.error('   Diagnostics:', {
            bodyHeight: document.body?.scrollHeight ?? 0,
            windowHeight: window.innerHeight ?? 0,
            hasOrchestrator: !!orchestrator,
            isRunning: orchestrator?.isRunning?.() ?? orchestrator?.running ?? false,
          });
          resolve(false);
        }
      }, 100);
    });
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
    const targetScrollPercent = stageCount > 1 ? (targetIndex / denominator) * 100 : 0;

    // Skip narration if requested
    if (skipNarration && window.narrationController?.skipNarration) {
      window.narrationController.skipNarration();
    }

    // DIAGNOSTIC: Check if scroll is possible
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      console.error('🚨 [UNIFIED NAV] Window or document unavailable - cannot navigate');
      throw new Error(
        'UnifiedNavigationAPI: Cannot navigate without window/document. ' +
          'This indicates a timing issue - navigation attempted before DOM ready.'
      );
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
        console.error('🚨 [UNIFIED NAV] Document not scrollable - waiting for scroll surface');

        const scrollReady = await this._waitForScrollSurface?.(5000);

        if (!scrollReady) {
          window.navigationPathMonitor?.recordPath?.('fallback');
          console.error('🚨 FALLBACK DETECTED - Scroll surface unavailable during navigation');
          throw new Error(
            'UnifiedNavigationAPI: Scroll surface never became ready. ' +
              'Check: (1) Body has height, (2) ScrollOrchestrator initialized, (3) Enough content for scroll'
          );
        }

        console.log('✅ [UNIFIED NAV] Scroll surface ready, retrying navigation');
        return this.navigateToStage(targetStage, options);
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
        console.warn(
          `⚠️ [UNIFIED NAV] Stage mismatch after scroll: expected ${targetStage}, got ${currentStage}. ` +
            'ScrollOrchestrator may not have detected stage boundary.'
        );
      }

      if (releaseDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, releaseDelayMs));
      }

      finalReason = 'scroll_complete';

      const finalStage = stageAtom.getState?.()?.currentStage;
      const success = finalStage === targetStage;

      if (success) {
        console.log('✅ [UNIFIED NAV] Navigation complete', {
          stage: targetStage,
          reason: finalReason,
          orchestrated: true,
        });
        window.navigationPathMonitor?.recordPath?.('orchestrated');
      } else {
        console.error('❌ [UNIFIED NAV] Navigation completed but stage mismatch', {
          expected: targetStage,
          actual: finalStage,
          reason: finalReason,
        });
        window.navigationPathMonitor?.recordPath?.('fallback');
      }

      return success;
    } catch (err) {
      console.error('🚨 [UNIFIED NAV] navigateToStage error', err);
      finalReason = 'error';
      window.navigationPathMonitor?.recordPath?.('fallback');
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

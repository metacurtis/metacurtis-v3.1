// src/theater/ScrollOrchestrator.js
// BeatGlyph v3.3 — ScrollOrchestrator
// Purpose: map window scroll -> stage-local progress; publish MORPH_PROGRESS, STAGE_CHANGE, and MEMORY_FRAGMENT_TRIGGER.
// Kinetics: speedMultiplier=2.0, smoothing=0.15, overshoot=0.05 (v3.3 canon)

import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';
import {
  exposeDiagnostics,
  exposeControlSurface,
  revokeControlSurface,
  isControlAllowed,
} from '@/utils/runtimeGuards.js';

const DEBUG_SCROLL = true;

const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));

// v3.3 easing: soften edges 0..10% and 90..100%
function easePercent(p) {
  if (p <= 10) { 
    const x = p / 10; 
    return x * x * 10; 
  } // in
  if (p >= 90) { 
    const x = (100 - p) / 10; 
    return 100 - (x * x * 10); 
  } // out
  return p;
}

export default class ScrollOrchestrator {
  constructor() {
    this._onScroll = this._onScroll.bind(this);
    this._update = this._update.bind(this);
    this._ensureScrollableArea = this._ensureScrollableArea.bind(this);
    this.running = false;
    this.lastStageIndex = -1;
    this.morph = 1;
    this.morphTarget = 1;
    this.fragmentFired = new Set();
    this.scrollLocked = false;
  
    this._rafId = 0;
    this._resizeHandlerBound = null;
    
    // throttle / change-detect emit guards
    this._lastEmitVal = 1;
    this._lastEmitTs = 0;
    this._lastScrollLogBucket = null;

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      this._ensureScrollableArea('constructor');
      this._resizeHandlerBound = event => this._ensureScrollableArea(event);
      window.addEventListener('resize', this._resizeHandlerBound, { passive: true });
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.fragmentFired.clear();
    this.scrollLocked = false;
    if (typeof window !== 'undefined') {
      if (!this._resizeHandlerBound) {
        this._resizeHandlerBound = event => this._ensureScrollableArea(event);
        window.addEventListener('resize', this._resizeHandlerBound, { passive: true });
      }
      window.addEventListener('scroll', this._onScroll, { passive: true });
      revokeControlSurface('__scrollOrchestrator');
      revokeControlSurface('scrollOrchestrator');
      exposeControlSurface('__scrollOrchestrator', () => this._createControlSurface(), {
        setMorph: 'scroll:setMorph',
      });
      exposeControlSurface('scrollOrchestrator', () => this._createControlSurface(), {
        setMorph: 'scroll:setMorph',
      });
      exposeDiagnostics('scrollOrchestrator', () => this.getState());
      this._ensureScrollableArea('start');
    }
    // kick once
    this._onScroll();
    // schedule smoothing loop
    this._schedule();
    // dev
    if (DEBUG_SCROLL) {
      console.log('📜 ScrollOrchestrator started');
    }
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this._onScroll);
      if (this._resizeHandlerBound) {
        window.removeEventListener('resize', this._resizeHandlerBound);
        this._resizeHandlerBound = null;
      }
      revokeControlSurface('__scrollOrchestrator');
      revokeControlSurface('scrollOrchestrator');
    }
  
    if (this._rafId) { 
      cancelAnimationFrame(this._rafId); 
      this._rafId = 0; 
    }
    if (DEBUG_SCROLL) {
      console.log('📜 ScrollOrchestrator stopped');
    }
  }

  _createControlSurface() {
    const self = this;
    const surface = {};
    Object.defineProperties(surface, {
      getState: {
        value: () => self.getState(),
        enumerable: true,
      },
      running: {
        get: () => self.running,
        enumerable: true,
      },
      scrollLocked: {
        get: () => self.scrollLocked,
        enumerable: true,
      },
      morph: {
        get: () => self.morph,
        enumerable: true,
      },
      morphTarget: {
        get: () => self.morphTarget,
        enumerable: true,
      },
      setMorph: {
        value: (value) => self.setMorph(value, { origin: 'external' }),
        enumerable: true,
      },
    });
    return surface;
  }

  _schedule() {
    if (!this.running) return;
    
    // Cancel any pending frame
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
    }
    
    // Schedule the smoothing update
    this._rafId = requestAnimationFrame(() => this._update());
  }

  _update() {
    if (!this.running) return;

    // Smoothing: lerp toward target
    const smoothing = Canonical?.scrollAndMorph?.morphResponse?.smoothing ?? 0.15;
    const delta = this.morphTarget - this.morph;
    
    // If we're close enough, snap and stop
    if (Math.abs(delta) < 0.001) {
      this.morph = this.morphTarget;
    } else {
      // Apply smoothing
      this.morph += delta * smoothing;
      
      // Apply overshoot if configured
      const overshoot = Canonical?.scrollAndMorph?.morphResponse?.overshoot ?? 0.05;
      if (overshoot > 0 && Math.abs(delta) > 0.1) {
        this.morph += delta * overshoot * Math.sin(Date.now() * 0.001);
      }
      
      // Continue animating
      this._schedule();
    }

    // Emit morph progress (with throttling)
    const now = Date.now();
    const shouldEmit = (
      Math.abs(this.morph - this._lastEmitVal) > 0.005 || // changed enough
      (now - this._lastEmitTs) > 100 // or 100ms passed
    );
    
    if (shouldEmit) {
      this._lastEmitVal = this.morph;
      this._lastEmitTs = now;
      
      const currentStage = Canonical?.stageOrder?.[this.lastStageIndex] || 'unknown';
      
      BeatBus.emit?.(EVENTS.MORPH_PROGRESS, {
        value: clamp01(this.morph),
        target: clamp01(this.morphTarget),
        stage: currentStage,
        stageIndex: this.lastStageIndex
      });
    }
  }

  _ensureScrollableArea(originOrEvent = 'runtime') {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const origin =
      typeof originOrEvent === 'string'
        ? originOrEvent
        : (originOrEvent && typeof originOrEvent.type === 'string'
            ? `event:${originOrEvent.type}`
            : 'runtime');

    const stageOrder = Array.isArray(Canonical?.stageOrder) ? Canonical.stageOrder : [];
    const stageCount =
      stageOrder.length ||
      Object.keys(Canonical?.stages || {}).length ||
      1;

    const windowHeight = Math.max(window.innerHeight || document.documentElement?.clientHeight || 0, 1);
    const totalHeight = Math.max(windowHeight, stageCount * windowHeight);

    const body = document.body;
    const html = document.documentElement;
    if (!body || !html) return;

    console.log('📜 [SCROLL SETUP]', {
      origin,
      stageCount,
      windowHeight,
      totalHeight,
      currentBodyHeight: body.scrollHeight,
    });

    body.style.minHeight = `${totalHeight}px`;
    body.style.height = `${totalHeight}px`;
    html.style.minHeight = `${totalHeight}px`;
    html.style.height = `${totalHeight}px`;

    requestAnimationFrame(() => {
      const bodyHeight = document.body.scrollHeight;
      const maxScroll = bodyHeight - window.innerHeight;
      console.log('📜 [SCROLL SETUP] Verification:', {
        origin,
        bodyHeight,
        maxScroll,
        isScrollable: maxScroll > 0,
      });
      if (maxScroll <= 0) {
        console.error('🚨 [SCROLL SETUP] FAILED - Page not scrollable!', {
          origin,
          bodyHeight,
          windowHeight: window.innerHeight,
        });
      }
    });
  }

  _onScroll() {
    try {
      const doc = document.documentElement;
      const denom = Math.max(1, doc.scrollHeight - doc.clientHeight);
      const rawPct = (doc.scrollTop / denom) * 100;
      const easedPct = easePercent(rawPct);
      if (typeof document !== 'undefined') {
        try {
          this.scrollLocked = (document.body?.style?.overflow || '') === 'hidden';
        } catch {
          this.scrollLocked = false;
        }
      }

      // stage detection
      const bps = Canonical?.scrollAndMorph?.stageBreakpointsPercent || [0, 100];
      let stageIdx = bps.length - 2;
      for (let i = 0; i < bps.length - 1; i++) {
        if (easedPct >= bps[i] && easedPct < bps[i + 1]) { 
          stageIdx = i; 
          break; 
        }
      }
      
      // Handle edge case: if we're at 100%, we're in the last stage
      if (easedPct >= 100 && bps.length > 1) {
        stageIdx = bps.length - 2;
      }
      
      const stageName = Canonical?.stageOrder?.[stageIdx] || 
                        Object.keys(Canonical.stages || {})[stageIdx] || 
                        'unknown';

      if (DEBUG_SCROLL) {
        const bucket = Math.floor(easedPct / 10) * 10;
        if (!Number.isNaN(bucket) && bucket !== this._lastScrollLogBucket) {
          this._lastScrollLogBucket = bucket;
          console.log('🎬 [SCROLL]', {
            percent: Math.round(easedPct),
            bucket,
            currentStage: stageName,
            scrollLocked: !!this.scrollLocked,
          });
        }
      }

      // local progress within stage
      const start = bps[stageIdx] ?? 0;
      const end = bps[stageIdx + 1] ?? 100;
      const local = clamp01((easedPct - start) / Math.max(1, end - start));

      // v3.5 adjustment: keep genesis fully formed (no post-emergence un-morph)
      if (stageIdx === 0) {
        this.morphTarget = 1;
      } else {
        const speed = Canonical?.scrollAndMorph?.morphResponse?.speedMultiplier ?? 2.0;
        this.morphTarget = clamp01(local * speed);
      }
      
      // ensure the loop runs to converge to new target
      this._schedule();

      BeatBus.emit?.(EVENTS.SCROLL_PROGRESS, {
        scrollPercent: easedPct,
        rawScrollPercent: rawPct,
        currentStage: stageName,
        stageIndex: stageIdx,
        stageProgress: local * 100,
        localProgress: local,
        morphTarget: this.morphTarget,
        morph: this.morph,
      });

      // stage change event
      if (stageIdx !== this.lastStageIndex && stageName && stageName !== 'unknown') {
        this.lastStageIndex = stageIdx;
        console.log('📜 [SCROLL PATH]', {
          scrollPercent: Math.round(easedPct),
          targetStage: stageName,
          path: 'SCROLL_ORCHESTRATED',
          willTriggerFragments: true,
          willTriggerMorph: true,
          timestamp: performance.now(),
        });
        BeatBus.emit?.(EVENTS.STAGE_CHANGE, { 
          stage: stageName, 
          index: stageIdx,
          scrollPercent: easedPct,
          localProgress: local
        });
        this._lastScrollLogBucket = null;
        if (DEBUG_SCROLL) {
          console.log(`📜 Stage change: ${stageName} (${stageIdx})`);
        }
      }

      // memory fragment trigger per stage
      const fragments = Canonical?.getFragmentsForStage?.(stageName) || [];
      for (const fragment of fragments) {
        const tier = fragment?.tier || 'unknown';
        const triggerPercent = typeof fragment?.triggerPercent === 'number'
          ? fragment.triggerPercent
          : (typeof fragment?.trigger?.percent === 'number' ? fragment.trigger.percent : null);
        if (triggerPercent === null) continue;

        const key = `${stageName}::${tier}::${triggerPercent}`;
        if (!this.fragmentFired.has(key) && easedPct >= triggerPercent) {
          this.fragmentFired.add(key);
          BeatBus.emit?.(EVENTS.MEMORY_FRAGMENT_TRIGGER, {
            stage: stageName,
            id: fragment.id || key,
            tier,
            triggerPercent,
            source: 'scroll-threshold',
            timestamp:
              typeof performance !== 'undefined' && typeof performance.now === 'function'
                ? performance.now()
                : Date.now(),
          });
          console.log(`📜 Memory fragment triggered: ${key}`);
        }
      }
    } catch (e) {
      console.warn('[ScrollOrchestrator] scroll error', e);
    }
  }

  // Public API for debugging
  getState() {
    return {
      running: this.running,
      morph: this.morph,
      morphTarget: this.morphTarget,
      lastStageIndex: this.lastStageIndex,
      stage: Canonical?.stageOrder?.[this.lastStageIndex] || 'unknown',
      fragmentsFired: Array.from(this.fragmentFired)
    };
  }

  // Force a specific morph value (for testing)
  setMorph(value, options = {}) {
    const origin = options.origin || 'internal';
    if (origin !== 'internal' && !isControlAllowed('scroll:setMorph')) {
      console.warn('[ScrollOrchestrator] Unauthorized setMorph attempt blocked');
      return;
    }
    this.morph = clamp01(value);
    this.morphTarget = this.morph;
    this._lastEmitVal = -1; // Force emit on next update
    this._schedule();
  }

  // Reset to initial state
  reset() {
    this.morph = 1;
    this.morphTarget = 1;
    this.lastStageIndex = -1;
    this.fragmentFired.clear();
    this._lastEmitVal = 1;
    this._lastEmitTs = 0;
  }
}

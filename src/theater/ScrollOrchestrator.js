// src/theater/ScrollOrchestrator.js
// BeatGlyph v3.3 — ScrollOrchestrator
// Purpose: map window scroll -> stage-local progress; publish MORPH_PROGRESS, STAGE_CHANGE, and MEMORY_FRAGMENT_TRIGGER.
// Kinetics: speedMultiplier=2.0, smoothing=0.15, overshoot=0.05 (v3.3 canon)

import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';

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
    this.running = false;
    this.lastStageIndex = -1;
    this.morph = 1;
    this.morphTarget = 1;
    this.fragmentFired = new Set();
  
    this._rafId = 0;
    this._offBeatBus = [];
    this.openingComplete = false;
    this.currentPhase = 'preload';

    // throttle / change-detect emit guards
    this._lastEmitVal = 1;
    this._lastEmitTs = 0;

    const lifecycleEvent = EVENTS.LIFECYCLE_PHASE || 'LIFECYCLE_PHASE';
    if (typeof BeatBus?.on === 'function') {
      const offPhase = BeatBus.on(lifecycleEvent, (payload = {}) => {
        if (payload?.phase) {
          this.currentPhase = payload.phase;
          if (payload.phase === 'runtime' || payload.phase === 'complete') {
            this.openingComplete = true;
            if (this.running) this._onScroll();
          } else if (payload.phase === 'opening' || payload.phase === 'emergence') {
            this.openingComplete = false;
          }
        }
      });
      if (offPhase) this._offBeatBus.push(offPhase);

      const offEnable = BeatBus.on(EVENTS.ENABLE_SCROLL, () => {
        this.openingComplete = true;
        if (this.running) this._onScroll();
      });
      if (offEnable) this._offBeatBus.push(offEnable);
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.fragmentFired.clear();
    window.addEventListener('scroll', this._onScroll, { passive: true });
    // kick once
    this._onScroll();
    // schedule smoothing loop
    this._schedule();
    // dev
    if (typeof window !== 'undefined') window.__scrollOrchestrator = this;
    console.log('📜 ScrollOrchestrator started');
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    window.removeEventListener('scroll', this._onScroll);
  
    if (this._rafId) { 
      cancelAnimationFrame(this._rafId); 
      this._rafId = 0; 
    }
    console.log('📜 ScrollOrchestrator stopped');
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

  _onScroll() {
    if (!this.openingComplete) {
      this.morphTarget = 1;
      return;
    }
    try {
      const doc = document.documentElement;
      const denom = Math.max(1, doc.scrollHeight - doc.clientHeight);
      const rawPct = (doc.scrollTop / denom) * 100;
      const easedPct = easePercent(rawPct);

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

      // stage change event
      if (stageIdx !== this.lastStageIndex && stageName && stageName !== 'unknown') {
        this.lastStageIndex = stageIdx;
        BeatBus.emit?.(EVENTS.STAGE_CHANGE, { 
          stage: stageName, 
          index: stageIdx,
          scrollPercent: easedPct,
          localProgress: local
        });
        console.log(`📜 Stage change: ${stageName} (${stageIdx})`);
      }

      // memory fragment trigger per stage
      const st = Canonical?.stages?.[stageName] || {};
      const frag = st.memoryFragment;
      if (frag && typeof frag.triggerPercent === 'number') {
        const key = `${stageName}::${frag.triggerPercent}`;
        if (!this.fragmentFired.has(key) && easedPct >= frag.triggerPercent) {
          this.fragmentFired.add(key);
          BeatBus.emit?.(EVENTS.MEMORY_FRAGMENT_TRIGGER, { 
            stage: stageName, 
            id: frag.id || key,
            triggerPercent: frag.triggerPercent
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
  setMorph(value) {
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

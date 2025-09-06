// src/theater/ScrollOrchestrator.js
// BeatGlyph v3.3 — ScrollOrchestrator
// Purpose: map window scroll -> stage-local progress; publish MORPH_PROGRESS, STAGE_CHANGE, and MEMORY_FRAGMENT_TRIGGER.
// Kinetics: speedMultiplier=2.0, smoothing=0.15, overshoot=0.05 (v3.3 canon)

import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';

const clamp01 = (v)=> Math.max(0, Math.min(1, Number(v)||0));

// v3.3 easing: soften edges 0..10% and 90..100%
function easePercent(p) {
  if (p <= 10) { const x=p/10; return x*x*10; }       // in
  if (p >= 90){ const x=(100-p)/10; return 100-(x*x*10); } // out
  return p;
}

export default class ScrollOrchestrator {
  constructor() {
    this._onScroll = this._onScroll.bind(this);
    this.running = false;
    this.lastStageIndex = -1;
    this.morph = 0;
    this.morphTarget = 0;
    this.fragmentFired = new Set();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.fragmentFired.clear();
    window.addEventListener('scroll', this._onScroll, { passive: true });
    // kick once
    this._onScroll();
    // RAF tick for smoothing / overshoot
    const loop = () => {
      if (!this.running) return;
      // smoothing 0.15, overshoot 0.05
      const smoothing = Canonical?.scrollAndMorph?.morphResponse?.smoothing ?? 0.15;
      const overshoot = Canonical?.scrollAndMorph?.morphResponse?.overshoot ?? 0.05;
      const delta = this.morphTarget - this.morph;
      this.morph += delta * smoothing;
      // small elastic settle near 1.0
      if (this.morphTarget > 0.95 && this.morph > 0.95) {
        this.morph = Math.min(1, this.morph + overshoot * (1 - this.morph));
      }
      BeatBus.emit?.(EVENTS.MORPH_PROGRESS, { value: clamp01(this.morph) });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    // dev
    if (typeof window !== 'undefined') window.__scrollOrchestrator = this;
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    window.removeEventListener('scroll', this._onScroll);
  }

  _onScroll() {
    try {
      const doc = document.documentElement;
      const denom = Math.max(1, doc.scrollHeight - doc.clientHeight);
      const rawPct = (doc.scrollTop / denom) * 100;
      const easedPct = easePercent(rawPct);

      // stage detection
      const bps = Canonical?.scrollAndMorph?.stageBreakpointsPercent || [0,100];
      let stageIdx = bps.length - 2;
      for (let i=0;i<bps.length-1;i++) {
        if (easedPct >= bps[i] && easedPct < bps[i+1]) { stageIdx = i; break; }
      }
      const stageName = Canonical?.stageOrder?.[stageIdx] || Object.keys(Canonical.stages||{})[stageIdx];

      // local progress within stage
      const start = bps[stageIdx] ?? 0;
      const end   = bps[stageIdx+1] ?? 100;
      const local = clamp01((easedPct - start) / Math.max(1, end - start));

      // v3.3 morph: speedMultiplier=2.0
      const speed = Canonical?.scrollAndMorph?.morphResponse?.speedMultiplier ?? 2.0;
      this.morphTarget = clamp01(local * speed);

      // stage change event
      if (stageIdx !== this.lastStageIndex && stageName) {
        this.lastStageIndex = stageIdx;
        BeatBus.emit?.(EVENTS.STAGE_CHANGE, { stage: stageName, index: stageIdx });
      }

      // memory fragment trigger per stage
      const st = Canonical?.stages?.[stageName] || {};
      const frag = st.memoryFragment;
      if (frag && typeof frag.triggerPercent === 'number') {
        const key = `${stageName}::${frag.triggerPercent}`;
        if (!this.fragmentFired.has(key) && easedPct >= frag.triggerPercent) {
          this.fragmentFired.add(key);
          BeatBus.emit?.(EVENTS.MEMORY_FRAGMENT_TRIGGER, { stage: stageName, id: frag.id || key });
        }
      }
    } catch (e) {
      console.warn('[ScrollOrchestrator] scroll error', e);
    }
  }
}

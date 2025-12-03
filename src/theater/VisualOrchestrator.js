// src/theater/VisualOrchestrator.js
// Purpose: single writer for RENDER_DIRECTIVE orchestration payloads
/**
 * VisualOrchestrator – Primary RENDER_DIRECTIVE writer (target state).
 *
 * INVARIANTS (Phase 1):
 * - This is one of two allowed RENDER_DIRECTIVE emitters.
 * - Long-term goal is for VisualOrchestrator to be the only writer, with bus/emitters.js
 *   serving only as a helper or being retired.
 *
 * Enforcement:
 * - tools/check-render-directive-single-writer.cjs fails if any new emit site
 *   appears outside these two modules.
 */

import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';

const clamp01 = (value) => {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
};

class VisualOrchestrator {
  constructor() {
    this.initialized = false;
    this._listeners = [];
    this.state = {
      stageName: Canonical?.stageOrder?.[0] || 'genesis',
      stageIndex: 0,
      morphProgress: 0,
      scrollPercent: 0,
      mode: 'opening',
      lastVerb: null,
      lastEffect: null,
    };
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;
    const subscribe = (eventKey, handler) => {
      if (typeof BeatBus?.on !== 'function') return;
      const off = BeatBus.on(EVENTS[eventKey] || eventKey, handler);
      if (typeof off === 'function') {
        this._listeners.push(off);
      }
    };
    subscribe('STAGE_CHANGE', this._handleStageChange);
    subscribe('MORPH_PROGRESS', this._handleMorph);
    subscribe('SCROLL_PROGRESS', this._handleScroll);
    if (typeof window !== 'undefined') {
      window.visualOrchestrator = this;
    }
  }

  dispose() {
    this._listeners.forEach((off) => off && off());
    this._listeners = [];
    this.initialized = false;
  }

  updateFromOpening(payload = {}) {
    this.init();
    this.state.mode = 'opening';
    if (Number.isFinite(payload.uMorphProgress)) {
      this.state.morphProgress = clamp01(payload.uMorphProgress);
    }
    const directive = this._composeDirective({
      phase: 'opening',
      verb: payload.verb ?? null,
      effect: payload.effect ?? null,
      ...payload,
    });
    this._emitDirective(directive);
  }

  updateFromScroll(payload = {}) {
    this.init();
    this.state.mode = 'scroll';
    const { stageName, stageIndex } = payload;
    if (typeof stageName === 'string') {
      this.state.stageName = stageName;
    }
    if (Number.isFinite(stageIndex)) {
      this.state.stageIndex = stageIndex;
    }
    if (Number.isFinite(payload.scrollPercent)) {
      this.state.scrollPercent = payload.scrollPercent;
    }
    const directive = this._composeDirective({
      phase: 'scroll',
      scrollPercent: this.state.scrollPercent,
      ...payload,
    });
    this._emitDirective(directive);
  }

  applyVerb(payload = {}) {
    this.init();
    const {
      verb = null,
      effect = {},
      phase = 'narration',
      stage,
      source = 'beat_visual',
      overrides = {},
    } = payload;
    if (typeof stage === 'string') {
      this.state.stageName = stage;
    }
    this.state.mode = phase || 'narration';
    this.state.lastVerb = verb;
    this.state.lastEffect = effect && Object.keys(effect).length ? { ...effect } : null;
    const directive = this._composeDirective({
      phase: phase || 'narration',
      verb,
      ...effect,
      ...overrides,
      source,
    });
    this._emitDirective(directive);
  }

  _emitDirective(payload) {
    if (!payload) return;
    const finalDirective = payload;
    console.log(
      "%c[VO→BUS]",
      "color:#9bff4d;font-weight:bold",
      {
        phase: finalDirective.phase,
        verb: finalDirective.verb,
        hasEffect: !!finalDirective.effect,
        effectKeys: finalDirective.effect ? Object.keys(finalDirective.effect) : [],
      }
    );
    BeatBus.emit(EVENTS.RENDER_DIRECTIVE, finalDirective);
  }

  _composeDirective(overrides = {}) {
    const phase = overrides.phase || this.state.mode;
    const includeMorph = false; // morph is animator-owned; directives no longer drive it
    const directive = {
      source: 'visual_orchestrator',
      stage: overrides.stage || this.state.stageName,
      stageIndex:
        Number.isFinite(overrides.stageIndex) ? overrides.stageIndex : this.state.stageIndex,
      ...(includeMorph && {
        uMorphProgress: Number.isFinite(overrides.uMorphProgress)
          ? clamp01(overrides.uMorphProgress)
          : this.state.morphProgress,
        morphProgress: Number.isFinite(overrides.morphProgress)
          ? clamp01(overrides.morphProgress)
          : this.state.morphProgress,
      }),
      scrollPercent:
        Number.isFinite(overrides.scrollPercent)
          ? overrides.scrollPercent
          : this.state.scrollPercent,
      phase,
    };
    try {
      console.log('🔬 VO_COMPOSE_DIRECTIVE', {
        phase: this.state.mode,
        includingMorph: includeMorph,
        morphProgress: this.state.morphProgress,
        resultHasMorph: 'uMorphProgress' in directive,
        timestamp: (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(),
      });
    } catch {}
    if (this.state.lastVerb && overrides.verb === undefined) {
      directive.verb = this.state.lastVerb;
    }
    if (this.state.lastEffect && overrides.effect === undefined) {
      directive.effect = this.state.lastEffect;
    }
    return {
      ...directive,
      ...overrides,
      source: 'visual_orchestrator',
    };
  }

  _handleStageChange = (payload = {}) => {
    const stage = payload.to ?? payload.stage;
    if (typeof stage === 'string') {
      this.state.stageName = stage;
      const order = Canonical?.stageOrder || [];
      const idx = order.indexOf(stage);
      this.state.stageIndex = idx >= 0 ? idx : this.state.stageIndex;
    }
  };

  _handleMorph = (payload = {}) => {
    const value =
      payload.progress ?? payload.morphProgress ?? payload.value ?? payload.morphTarget;
    if (Number.isFinite(value)) {
      this.state.morphProgress = clamp01(value);
    }
  };

  _handleScroll = (payload = {}) => {
    if (typeof payload.scrollPercent === 'number') {
      this.state.scrollPercent = payload.scrollPercent;
    }
    if (typeof payload.currentStage === 'string') {
      this.state.stageName = payload.currentStage;
    }
    if (Number.isFinite(payload.stageIndex)) {
      this.state.stageIndex = payload.stageIndex;
    }
  };
}

const visualOrchestrator = new VisualOrchestrator();
visualOrchestrator.init();

export default visualOrchestrator;

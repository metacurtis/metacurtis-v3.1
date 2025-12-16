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
    const { effect, ...rest } = payload || {};
    const hasEffect = effect && typeof effect === 'object';
    const verb = typeof rest.verb === 'string' ? rest.verb : undefined;
    if (Number.isFinite(rest.uMorphProgress)) {
      this.state.morphProgress = clamp01(rest.uMorphProgress);
    }
    this.state.lastEffect = hasEffect ? effect : null;
    this.state.lastVerb = verb || null;
    const directive = this._composeDirective({
      phase: 'opening',
      ...(verb ? { verb } : {}),
      ...(hasEffect ? { effect } : {}),
      ...rest,
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
      source = 'visual_orchestrator',
      overrides = {},
      params = {},
    } = payload;
    const stageName = typeof stage === 'string' ? stage : this.state.stageName;
    let resolvedEffect = effect && Object.keys(effect).length ? effect : null;
    if (!resolvedEffect && verb && typeof Canonical?.resolveVisualVerb === 'function') {
      resolvedEffect = Canonical.resolveVisualVerb(verb, params) || null;
    }
    if (!verb) {
      console.warn('[VO] applyVerb called without verb', { payload });
      return;
    }
    if (!resolvedEffect) {
      console.warn('[VO] Unknown visual verb; no effect resolved', { verb, stage: stageName });
      return;
    }
    if (typeof stage === 'string') {
      this.state.stageName = stageName;
    }
    this.state.mode = phase || 'narration';
    this.state.lastVerb = verb;
    this.state.lastEffect = resolvedEffect && Object.keys(resolvedEffect).length ? { ...resolvedEffect } : null;
    const directive = this._composeDirective({
      phase: phase || 'narration',
      verb,
      stage: stageName,
      kind: 'uniforms',
      effect: resolvedEffect,
      ...(resolvedEffect?.uniforms ? { uniforms: resolvedEffect.uniforms } : resolvedEffect),
      ...overrides,
      ...(params && Object.keys(params).length
        ? { _meta: { ...(resolvedEffect?._meta || {}), params } }
        : {}),
      source,
    });
    this._emitDirective(directive);

    if (params && params.camera) {
      this.applyCamera({
        stage: stageName,
        camera: params.camera,
        cueId: overrides?.beatId || null,
        source,
      });
    }
  }

  applyCamera(payload = {}) {
    this.init();
    const {
      stage = this.state.stageName,
      camera = null,
      cueId = null,
      source = 'visual_orchestrator',
      overrides = {},
    } = payload;
    if (!camera) {
      console.warn('[VO] applyCamera called without camera payload', { payload });
      return;
    }
    const normalizedCueId = typeof cueId === 'string' && cueId.length ? cueId : undefined;
    const directive = {
      stage,
      kind: 'camera',
      camera,
      ...(normalizedCueId ? { cueId: normalizedCueId } : {}),
      ...overrides,
      verb: 'camera',
      source: 'visual_orchestrator',
      phase: this.state?.phase ?? 'visual_demo',
    };
    this._emitDirective(directive);
  }

  _emitDirective(payload) {
    if (!payload) return;
    // Ensure required schema fields
    payload.timestamp = payload.timestamp ?? performance.now();
    payload.source = payload.source ?? 'visual_orchestrator';

    // Diagnostic log
    console.log('[VO→BUS]', {
      phase: payload.phase,
      verb: payload.verb,
      hasEffect: !!payload.effect,
      effectKeys: payload.effect ? Object.keys(payload.effect) : []
    });

    BeatBus.emit(EVENTS.RENDER_DIRECTIVE, payload);
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
    const stage = payload.to;
    if (typeof stage === 'string') {
      this.state.stageName = stage;
      const order = Canonical?.stageOrder || [];
      const idx = order.indexOf(stage);
      this.state.stageIndex = idx >= 0 ? idx : this.state.stageIndex;
    }
  };

  _handleMorph = (payload = {}) => {
    const value = payload.progress;
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

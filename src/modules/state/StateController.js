// StateController — single-writer facade over stage/quality (dev-safe)
// Emits STAGE_CHANGE / QUALITY_CHANGE onto BeatBus; mirrors to existing *Controls if present.
import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';

export const EVENTS = {
  STAGE_CHANGE: 'STAGE_CHANGE',
  QUALITY_CHANGE: 'QUALITY_CHANGE',
  STATE_CHANGED: 'STATE_CHANGED',
  OPENING_COMPLETE: 'OPENING_COMPLETE',
};

const existing = globalThis.__STATE_CONTROLLER__;
let api = existing;

if (!api) {
  let _stage = 'opening';
  let _quality = 'HIGH';
  let _clockStart = null;

  const emit = (code, payload) => { try { BeatBus && BeatBus.emit && BeatBus.emit(code, payload); } catch(_){} };

  api = {
    getStage(){ return _stage; },
    getQuality(){ return _quality; },
    startClock(){ _clockStart = (typeof performance!=='undefined'?performance.now():Date.now()); return _clockStart; },
    stopClock(){ const t = (typeof performance!=='undefined'?performance.now():Date.now()); const d = _clockStart? (t - _clockStart) : 0; _clockStart=null; return d; },
    setStage(name){
      if (name && name !== _stage) {
        _stage = name;
        emit(EVENTS.STAGE_CHANGE, { stage: name, at: Date.now() });
        emit(EVENTS.STATE_CHANGED, { stage:_stage, quality:_quality });
        try { globalThis.stageControls && globalThis.stageControls.setStage && globalThis.stageControls.setStage(name); } catch(_){}
      }
      return _stage;
    },
    setQuality(tier){
      if (tier && tier !== _quality) {
        _quality = tier;
        emit(EVENTS.QUALITY_CHANGE, { tier, at: Date.now() });
        emit(EVENTS.STATE_CHANGED, { stage:_stage, quality:_quality });
        try { globalThis.qualityControls && globalThis.qualityControls.setQuality && globalThis.qualityControls.setQuality(tier); } catch(_){}
      }
      return _quality;
    },
  };
  globalThis.__STATE_CONTROLLER__ = api;
  globalThis.stateControls = api; // convenience
}

export default api;

// EngineStateBridge — wires StateController events to existing engine/theater cues.
// Non-invasive: replays known events the engine already handles (emergence/genesis).
import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';
import State, { EVENTS as STATE_EVENTS } from '@/modules/state/StateController.js';
import { EVENTS as THEATER_EVENTS } from '@/theater/events.js';

if (!globalThis.__ENGINE_STATE_BRIDGE__) {
  const on = (e, fn) => { try { return BeatBus.on(e, fn); } catch(_) { return ()=>{}; } };

  const handleStage = ({ stage }) => {
    try { console.log('🔗 EngineStateBridge: STAGE_CHANGE →', stage); } catch(_){}
    if (stage === 'genesis') {
      try { BeatBus.emit(THEATER_EVENTS.PREWARM_GENESIS_BLUEPRINT); } catch(_) {}
      setTimeout(() => {
        try { BeatBus.emit(THEATER_EVENTS.BUILD_EMERGENCE_BLUEPRINT, { sourceText: 'HELLO CURTIS', count: 2000 }); } catch(_){}
      }, 50);
    } else {
      // Generic request hook (no-op if engine doesn't handle it yet)
      const code = THEATER_EVENTS.REQUEST_STAGE_BUILD || 'REQUEST_STAGE_BUILD';
      try { BeatBus.emit(code, { stage }); } catch(_){}
    }
  };

  const handleQuality = ({ tier }) => {
    try { console.log('🔗 EngineStateBridge: QUALITY_CHANGE →', tier); } catch(_){}
    const code = THEATER_EVENTS.QUALITY_CHANGE || 'QUALITY_CHANGE';
    try { BeatBus.emit(code, { tier }); } catch(_){}
  };

  const unsubs = [
    on(STATE_EVENTS.STAGE_CHANGE, handleStage),
    on(STATE_EVENTS.QUALITY_CHANGE, handleQuality),
  ];

  globalThis.__ENGINE_STATE_BRIDGE__ = { off(){ unsubs.forEach(f=>{ try{ f&&f(); }catch(_){} }); } };
  try { console.log('✅ EngineStateBridge active (idempotent)'); } catch(_){}
}

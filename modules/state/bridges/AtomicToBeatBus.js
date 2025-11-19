// AtomicToBeatBus.js
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';
import { stageAtom } from '@/stores/atoms/stageAtom.js';

let wired = false;

export default function wireAtomicToBeatBus() {
  if (wired) return;
  wired = true;

  if (typeof console !== 'undefined') {
    console.warn('[Canon] modules/state/bridges/AtomicToBeatBus is deprecated; migrate callers to explicit BeatBus wiring.');
  }

  // 1) Stage changes → tell the orchestra
  let prevStage = stageAtom.getState().currentStage;
  stageAtom.subscribe((s) => {
    const next = s.currentStage;
    if (next !== prevStage) {
      BeatBus.emit(EVENTS.STAGE_CHANGE, { from: prevStage, to: next, reason: 'atom' });
      if (EVENTS.STAGE_CHANGED !== EVENTS.STAGE_CHANGE) {
        BeatBus.emit(EVENTS.STAGE_CHANGED, { from: prevStage, to: next, reason: 'atom' });
      }
      BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, { stage: next, trigger: 'stage-change' });
      if (EVENTS.BUILD_BLUEPRINT !== EVENTS.BUILD_EMERGENCE_BLUEPRINT) {
        BeatBus.emit(EVENTS.BUILD_BLUEPRINT, { stage: next, trigger: 'stage-change' });
      }
      prevStage = next;
    }
  });

  // 2) MORPH_PROGRESS bus traffic is now owned exclusively by MorphAnimationController.
  //    Do not reintroduce atom-driven morph emits from this legacy bridge.

  console.log('🔌 AtomicToBeatBus bridge wired');
}

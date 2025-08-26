// AtomicToBeatBus.js
import BeatBus from '@/modules/orchestration/core/BeatBus.js';
import { EVENTS } from '@/theater/events.js';
import { stageAtom } from '@/stores/atoms/stageAtom.js';

let wired = false;

export default function wireAtomicToBeatBus() {
  if (wired) return;
  wired = true;

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

  // 2) Use stageAtom's stageProgress for morph
  let lastMorph = stageAtom.getState().stageProgress ?? 0;
  stageAtom.subscribe((s) => {
    const v = Number(s.stageProgress ?? 0);
    if (v !== lastMorph) {
      BeatBus.emit(EVENTS.MORPH_PROGRESS, { value: v });
      lastMorph = v;
    }
  });

  console.log('🔌 AtomicToBeatBus bridge wired');
}

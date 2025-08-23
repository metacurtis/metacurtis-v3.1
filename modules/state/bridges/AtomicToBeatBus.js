// AtomicToBeatBus.js
import BeatBus from '@/modules/orchestration/core/BeatBus.js';
import { EVENTS } from '@/theater/events.js';
import { stageAtom } from '@/stores/atoms/stageAtom.js';
import { interactionAtom } from '@/stores/atoms/interactionAtom.js'; // holds morphProgress slot

let wired = false;
export default function wireAtomicToBeatBus() {
  if (wired) return;
  wired = true;

  // 1) Stage changes → tell the orchestra
  let prevStage = stageAtom.getState().currentStage;
  stageAtom.subscribe((s) => {
    const next = s.currentStage;
    if (next !== prevStage) {
      BeatBus.emit(EVENTS.STAGE_CHANGED, { from: prevStage, to: next, reason: 'atom' });
      // optional: nudge blueprint directly if your engine expects this too
      BeatBus.emit(EVENTS.BUILD_BLUEPRINT, { stage: next, trigger: 'stage-change' });
      prevStage = next;
    }
  });

  // 2) Morph progress (keep it in interactionAtom.morphProgress)
  // If you don't have this field yet, add it and update from UI/scroll.
  let lastMorph = interactionAtom.getState().morphProgress ?? 0;
  interactionAtom.subscribe((s) => {
    const v = Number(s.morphProgress ?? 0);
    if (v !== lastMorph) {
      BeatBus.emit(EVENTS.MORPH_PROGRESS, { value: v });
      lastMorph = v;
    }
  });

  // 3) Optional: quality tier changes (particle budgets) → hint Engine
  // import { qualityAtom } from '@/stores/atoms/qualityAtom.js';
  // qualityAtom.subscribe((q)=> BeatBus.emit(EVENTS.QUALITY_UPDATED, { tier: q.tier }));
}

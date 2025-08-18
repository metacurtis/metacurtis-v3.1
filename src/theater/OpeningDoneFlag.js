// OpeningDoneFlag: mark opening complete once, then silence duplicate EMERGED in DEV
import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';
import { EVENTS as E } from '@/theater/events.js';

if (!globalThis.__OPENING_FLAG_V3__) {
  globalThis.__OPENING_FLAG_V3__ = true;
  globalThis.__OPENING_DONE__ = !!globalThis.__OPENING_DONE__;
  let emittedOnce = false;

  const mark = (via) => {
    if (!globalThis.__OPENING_DONE__) {
      globalThis.__OPENING_DONE__ = true;
      console.log('🏁 Opening complete (', via, ')');
    }
  };

  // First EMERGED wins; swallow later ones in DEV (no-op but still let original emit flow)
  const off1 = BeatBus.on(E.PARTICLES_EMERGED, (payload={}) => {
    if (!emittedOnce) {
      emittedOnce = true;
      mark(payload.via || 'emerged');
    } else {
      if (import.meta.env?.DEV) console.log('🔇 (DEV) duplicate PARTICLES_EMERGED ignored');
    }
  });

  // Backup tripwires
  const off2 = BeatBus.on(E.ENABLE_SCROLL, () => mark('enable_scroll'));
  const off3 = BeatBus.on(E.START_NARRATIVE, () => mark('start_narrative'));

  // Optional: expose a reset in DEV
  if (import.meta.env?.DEV) {
    globalThis.__resetOpeningForTest = () => { emittedOnce=false; globalThis.__OPENING_DONE__=false; console.log('🔄 Opening flags reset'); };
  }

  console.log('✅ OpeningDoneFlag armed');
}

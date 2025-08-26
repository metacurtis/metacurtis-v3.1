import BeatBus from '@modules/orchestration/core/BeatBus.js';
if (!globalThis.BeatBus) globalThis.BeatBus = BeatBus;
if (!globalThis.__BeatBus) globalThis.__BeatBus = BeatBus;
export default BeatBus;

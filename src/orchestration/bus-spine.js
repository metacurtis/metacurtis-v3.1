import BeatBus from '@/theater/bus';
if (!globalThis.BeatBus) globalThis.BeatBus = BeatBus;
if (!globalThis.__BeatBus) globalThis.__BeatBus = BeatBus;
export default BeatBus;

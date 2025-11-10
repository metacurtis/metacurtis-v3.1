// src/modules/orchestration/core/BeatBus.js
// Deprecated shim: re-export the canonical BeatBus from '@/theater/bus'.
// This keeps legacy tooling alive while guaranteeing a single bus instance.
import baseBus, { BeatBus } from '@/theater/bus';

const KEY = Symbol.for('metacurtis.canon.beatbus');
const globalScope = typeof globalThis !== 'undefined' ? globalThis : {};
const beatBus = globalScope[KEY] ?? baseBus;
if (globalScope && !globalScope[KEY]) {
  globalScope[KEY] = beatBus;
}

if (typeof globalThis !== 'undefined' && !globalThis.__CANON_BEATBUS_SHIM_WARNED__) {
  try {
    if (import.meta?.env?.DEV) {
      console.warn('[Canon] Importing BeatBus via "@/modules/orchestration/core/BeatBus" is deprecated. Use "@/theater/bus" instead.');
    }
  } catch {}
  globalThis.__CANON_BEATBUS_SHIM_WARNED__ = true;
}

export default beatBus;
export { BeatBus };

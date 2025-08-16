/**
 * @typedef {import('../../ports/StatePort.js').StatePort} StatePort
 */

/** @param {any} initial @returns {StatePort} */
export function createState(initial = {}) {
  let state = (globalThis.structuredClone ? structuredClone(initial) : { ...initial });
  const subs = new Set();
  return {
    get: () => state,
    set: (patch) => {
      state = typeof patch === 'function' ? patch(state) : { ...state, ...patch };
      subs.forEach(fn => fn(state));
    },
    subscribe: (fn) => (subs.add(fn), () => subs.delete(fn)),
  };
}

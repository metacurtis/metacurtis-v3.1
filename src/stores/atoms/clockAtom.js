// @doctor:4b-disposers
const __doctorDisposers = []; // src/stores/atoms/clockAtom.js
const createClockAtom = () => {let state = {
    fps: 60,
    deltaMs: 16.67,
    averageFrameTime: 16.67,
    jankCount: 0,
    performanceGrade: 'A'
  };
  const listeners = new Set();

  return {
    getState: () => state,
    setState: (newState) => {
      state = { ...state, ...newState };
      listeners.forEach((fn) => fn(state));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
};

export const clockAtom = createClockAtom(); // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}
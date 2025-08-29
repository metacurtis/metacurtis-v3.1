// src/state/atoms/clockAtom.js
const createClockAtom = () => {
  let state = { 
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
      listeners.forEach(fn => fn(state));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
};

export const clockAtom = createClockAtom();

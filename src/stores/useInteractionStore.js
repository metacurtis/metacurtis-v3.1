// src/stores/useInteractionStore.js
import { create } from 'zustand';

export const useInteractionStore = create(set => ({
  // existing...
  cursor: { x: 0, y: 0 },
  scrollProgress: 0,

  // NEW for About section:
  typewriterProgress: 0, // 0.0–1.0
  setTypewriterProgress: p => set({ typewriterProgress: p }),

  // your existing actions:
  setCursorPosition: pos => set({ cursor: pos }),
  setScrollProgress: p => set({ scrollProgress: p }),
}));

// src/stores/useInteractionStore.js
import { create } from 'zustand';

/**
 * Zustand store for managing interaction-related state,
 * like cursor position, scroll position, etc.
 */
export const useInteractionStore = create(set => ({
  // --- State ---
  cursorPosition: { x: 0, y: 0 },
  scrollProgress: 0, // <-- ADDED: Scroll progress (0 at top, 1 at bottom)

  // --- Actions ---
  setCursorPosition: position => set({ cursorPosition: position }),

  /**
   * Updates the scroll progress state.
   * @param {number} progress - The new scroll progress (0 to 1).
   */
  setScrollProgress: progress => set({ scrollProgress: progress }), // <-- ADDED Action
}));

// Optional: Log store changes in development
if (process.env.NODE_ENV === 'development') {
  // Filter logs slightly to avoid excessive noise from scroll
  let lastLoggedScroll = -1;
  useInteractionStore.subscribe(state => {
    // Log cursor only if it changes significantly (example)
    // console.log('InteractionStore cursor:', state.cursorPosition);

    // Log scroll only if it changes by more than 0.01 (example)
    if (
      Math.abs(state.scrollProgress - lastLoggedScroll) > 0.01 ||
      state.scrollProgress === 0 ||
      state.scrollProgress === 1
    ) {
      console.log('InteractionStore scrollProgress:', state.scrollProgress.toFixed(2));
      lastLoggedScroll = state.scrollProgress;
    }
  });
}

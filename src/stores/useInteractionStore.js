// src/stores/useInteractionStore.js
import { create } from 'zustand';

export const useInteractionStore = create((set, get) => ({
  // === EXISTING STATE (PRESERVED EXACTLY) ===
  cursor: { x: 0, y: 0 },
  scrollProgress: 0,
  typewriterProgress: 0, // 0.0–1.0

  // === NEW: EVENT QUEUE SYSTEM ===
  eventQueue: [], // Array of interaction events to be processed
  maxQueueSize: 10, // Prevent memory issues

  // === EXISTING ACTIONS (PRESERVED EXACTLY) ===
  setCursorPosition: pos => set({ cursor: pos }),
  setScrollProgress: p => set({ scrollProgress: p }),
  setTypewriterProgress: p => set({ typewriterProgress: p }),

  // === NEW: EVENT SYSTEM ACTIONS ===

  /**
   * Add an interaction event to the queue with deduplication
   * @param {Object} event - Event object with type, position, intensity, etc.
   */
  addInteractionEvent: event => {
    const state = get();
    const currentTime = Date.now();
    const newQueue = [...state.eventQueue];

    // DEDUPLICATION: Check for similar events within same animation frame (~16ms)
    const isDuplicate = newQueue.some(existingEvent => {
      const timeDiff = currentTime - existingEvent.timestamp;
      const isSameFrame = timeDiff < 16; // Within same animation frame
      const isSameType = existingEvent.type === event.type;

      // For position-based events, check proximity
      if (event.position && existingEvent.position) {
        const dx = Math.abs(event.position.x - existingEvent.position.x);
        const dy = Math.abs(event.position.y - existingEvent.position.y);
        const isSamePosition = dx < 5 && dy < 5; // Within 5px tolerance
        return isSameFrame && isSameType && isSamePosition;
      }

      // For non-position events, just check type and timing
      if (event.letterIndex !== undefined && existingEvent.letterIndex !== undefined) {
        const isSameLetter = event.letterIndex === existingEvent.letterIndex;
        return isSameFrame && isSameType && isSameLetter;
      }

      // Default: same type within same frame
      return isSameFrame && isSameType;
    });

    // Skip if duplicate detected
    if (isDuplicate) {
      console.log(`[InteractionStore] Duplicate event filtered: ${event.type}`);
      return;
    }

    // Prevent queue overflow
    if (newQueue.length >= state.maxQueueSize) {
      newQueue.shift(); // Remove oldest event
    }

    // Add timestamp and unique ID
    const enhancedEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: currentTime,
    };

    newQueue.push(enhancedEvent);
    set({ eventQueue: newQueue });
  },

  /**
   * Get and clear all pending events (for WebGL consumption)
   * @returns {Array} Array of pending events
   */
  consumeInteractionEvents: () => {
    const state = get();
    const events = [...state.eventQueue];
    set({ eventQueue: [] }); // Clear the queue
    return events;
  },

  /**
   * COMPATIBILITY WRAPPER: Maintains existing triggerBurst functionality
   * This ensures Hero.jsx and any existing code continues working unchanged
   * @param {Object} position - {x, y} coordinates
   * @param {number} intensity - Burst intensity
   */
  triggerBurst: (position, intensity = 1.0) => {
    const { addInteractionEvent } = get();
    addInteractionEvent({
      type: 'heroLetterBurst',
      position,
      intensity,
      originSection: 'hero',
      // Maintain compatibility with existing behavior
      compatibilityMode: true,
    });
  },

  /**
   * Enhanced letter click with section context
   * @param {number} letterIndex - Which letter (0-3 for M,C,3,V)
   * @param {string} section - Origin section identifier
   */
  triggerLetterClick: (letterIndex, section = 'hero') => {
    const { addInteractionEvent } = get();
    addInteractionEvent({
      type: 'letterClick',
      letterIndex,
      section,
      timestamp: Date.now(),
    });
  },

  // === UTILITY ACTIONS ===

  /**
   * Clear all events (useful for debugging/reset)
   */
  clearEventQueue: () => set({ eventQueue: [] }),

  /**
   * Get current queue size (for monitoring)
   */
  getQueueSize: () => get().eventQueue.length,
}));

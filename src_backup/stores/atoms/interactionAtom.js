// src/stores/atoms/interactionAtom.js
// User interaction and UI state management
import { createAtom } from './createAtom';
import { ensureCanonGeometry, createCanonMaterial } from '@/renderer/materialFactory';

const initialState = {
  // Interaction events queue
  interactionEvents: [],

  // UI states
  typewriterProgress: 0,
  hoveredElement: null,
  clickedElements: [],

  // Mouse/touch tracking
  mousePosition: { x: 0, y: 0 },
  touchActive: false,

  // Keyboard state
  keysPressed: new Set(),
  lastKeyPress: null,

  // Scroll state
  scrollDirection: 'down',
  lastScrollTime: 0,
  scrollVelocity: 0,
};

export const interactionAtom = createAtom(initialState, (get, set) => ({
  // Event queue management
  addInteractionEvent: event => {
    set(state => ({
      ...state,
      interactionEvents: [
        ...state.interactionEvents,
        {
          ...event,
          id: `event_${Date.now()}_${Math.random()}`,
          timestamp: Date.now(),
          processed: false,
        },
      ],
    }));
  },

  consumeInteractionEvents: () => {
    const events = get().interactionEvents.filter(e => !e.processed);

    // Mark as processed
    set(state => ({
      ...state,
      interactionEvents: state.interactionEvents.map(e =>
        events.includes(e) ? { ...e, processed: true } : e
      ),
    }));

    return events;
  },

  cleanupProcessedEvents: () => {
    const cutoffTime = Date.now() - 5000; // Keep events for 5 seconds
    set(state => ({
      ...state,
      interactionEvents: state.interactionEvents.filter(
        e => !e.processed || e.timestamp > cutoffTime
      ),
    }));
  },

  // Typewriter effect
  setTypewriterProgress: progress => {
    set(state => ({ ...state, typewriterProgress: progress }));
  },

  // Mouse/touch tracking
  updateMousePosition: (x, y) => {
    set(state => ({ ...state, mousePosition: { x, y } }));
  },

  setTouchActive: active => {
    set(state => ({ ...state, touchActive: active }));
  },

  // Hover management
  setHoveredElement: element => {
    set(state => ({ ...state, hoveredElement: element }));
  },

  // Click tracking
  recordClick: elementId => {
    set(state => ({
      ...state,
      clickedElements: [
        ...state.clickedElements,
        {
          id: elementId,
          timestamp: Date.now(),
        },
      ],
    }));
  },

  // Keyboard tracking
  setKeyPressed: (key, pressed) => {
    set(state => {
      const newKeys = new Set(state.keysPressed);
      if (pressed) {
        newKeys.add(key);
      } else {
        newKeys.delete(key);
      }
      return {
        ...state,
        keysPressed: newKeys,
        lastKeyPress: pressed ? key : state.lastKeyPress,
      };
    });
  },

  // Scroll tracking
  updateScrollState: (direction, velocity) => {
    set(state => ({
      ...state,
      scrollDirection: direction,
      scrollVelocity: velocity,
      lastScrollTime: Date.now(),
    }));
  },

  // Utilities
  reset: () => {
    set(initialState);
  },
}));

// Development helpers
if (import.meta.env.DEV) {
  window.interactionAtom = interactionAtom;
}

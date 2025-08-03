// modules/state/bridges/AtomicToBeatBus.js
// SST v3.0 - Automatic bridge between atomic stores and BeatBus events
// Listens to atom changes and emits corresponding BeatBus events

import { narrativeAtom } from '@/stores/atoms/narrativeAtom';
import { performanceAtom } from '@/stores/atoms/performanceAtom';
import { interactionAtom } from '@/stores/atoms/interactionAtom';
import { resourceAtom } from '@/stores/atoms/resourceAtom';
import { qualityAtom } from '@/stores/atoms/qualityAtom';
import { stageAtom } from '@/stores/atoms/stageAtom';
import { clockAtom } from '@/stores/atoms/clockAtom';

// BeatBus will be imported once it exists
// For now, we'll prepare the bridge structure
let BeatBus = null;

class AtomicToBeatBusBridge {
  constructor() {
    if (AtomicToBeatBusBridge.instance) {
      return AtomicToBeatBusBridge.instance;
    }

    this.subscriptions = [];
    this.isActive = false;
    this.lastStates = {};

    // Event mapping configuration
    this.eventMappings = this._createEventMappings();

    // Batching for high-frequency events
    this._interactionBatch = null;
    this._interactionRAF = null;

    AtomicToBeatBusBridge.instance = this;
  }

  /**
   * Create mappings between atom changes and BeatBus events
   */
  _createEventMappings() {
    return {
      narrative: {
        atom: narrativeAtom,
        events: {
          currentStage: 'STATE_STAGE_CHANGED',
          globalProgress: 'STATE_PROGRESS_CHANGED',
          morphProgress: 'STATE_MORPH_CHANGED',
          scrollProgress: 'STATE_SCROLL_CHANGED',
          activeMemoryFragment: 'STATE_MEMORY_FRAGMENT_CHANGED',
          isTransitioning: 'STATE_TRANSITION_CHANGED',
        },
      },

      performance: {
        atom: performanceAtom,
        events: {
          fps: 'STATE_FPS_CHANGED',
          particleCount: 'STATE_PARTICLE_COUNT_CHANGED',
          frameTime: 'STATE_FRAME_TIME_CHANGED',
          // Removed currentTier - that's in qualityAtom
        },
      },

      quality: {
        atom: qualityAtom,
        events: {
          currentQualityTier: 'STATE_QUALITY_CHANGED',
          targetDpr: 'STATE_DPR_CHANGED',
          particleCount: 'STATE_PARTICLE_BUDGET_CHANGED',
        },
      },

      stage: {
        atom: stageAtom,
        events: {
          // Only emit sync event to avoid duplication with narrative
          currentStage: 'STATE_STAGE_SYNC',
          stageProgress: 'STATE_STAGE_PROGRESS_CHANGED',
          isTransitioning: 'STATE_TRANSITIONING',
          autoAdvanceEnabled: 'STATE_AUTO_ADVANCE_CHANGED',
        },
      },

      interaction: {
        atom: interactionAtom,
        events: {
          // Interaction events are handled differently - they accumulate
          _special: 'INTERACTION_EVENTS_UPDATED',
        },
      },

      resource: {
        atom: resourceAtom,
        events: {
          // Resource changes are batched
          _special: 'RESOURCE_STATS_UPDATED',
        },
      },

      clock: {
        atom: clockAtom,
        events: {
          fps: 'CLOCK_FPS_UPDATED',
          deltaMs: 'CLOCK_DELTA_UPDATED',
        },
      },
    };
  }

  /**
   * Initialize the bridge with BeatBus reference
   */
  initialize(beatBusInstance) {
    if (this.isActive) {
      console.warn('AtomicToBeatBus: Already initialized');
      return;
    }

    BeatBus = beatBusInstance;

    if (!BeatBus || !BeatBus.emit) {
      console.error('AtomicToBeatBus: Invalid BeatBus instance');
      return;
    }

    // Subscribe to all atoms
    this._subscribeToAtoms();

    this.isActive = true;
    console.log('🌉 AtomicToBeatBus: Bridge initialized');
  }

  /**
   * Subscribe to all configured atoms
   */
  _subscribeToAtoms() {
    Object.entries(this.eventMappings).forEach(([name, config]) => {
      const { atom, events } = config;

      if (!atom.subscribe) {
        console.warn(`AtomicToBeatBus: ${name} atom has no subscribe method`);
        return;
      }

      // Store initial state
      this.lastStates[name] = atom.getState();

      // Subscribe to changes
      const unsubscribe = atom.subscribe(newState => {
        this._handleAtomChange(name, newState, events);
      });

      this.subscriptions.push(unsubscribe);
    });
  }

  /**
   * Handle atom state changes and emit events
   */
  _handleAtomChange(atomName, newState, eventConfig) {
    if (!this.isActive || !BeatBus) return;

    const lastState = this.lastStates[atomName] || {};
    const changes = this._detectChanges(lastState, newState);

    // Handle special cases
    if (eventConfig._special) {
      this._handleSpecialEvent(atomName, eventConfig._special, newState, changes);
    } else {
      // Emit events for each changed property
      changes.forEach(({ key, oldValue, newValue }) => {
        const eventName = eventConfig[key];
        if (eventName) {
          this._emitEvent(eventName, {
            atomName,
            property: key,
            oldValue,
            newValue,
            fullState: newState,
          });
        }
      });
    }

    // Update last state
    this.lastStates[atomName] = { ...newState };
  }

  /**
   * Detect what changed between states
   */
  _detectChanges(oldState, newState) {
    const changes = [];
    const allKeys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);

    allKeys.forEach(key => {
      const oldValue = oldState[key];
      const newValue = newState[key];

      // Simple comparison - could be enhanced for deep objects
      if (oldValue !== newValue) {
        changes.push({ key, oldValue, newValue });
      }
    });

    return changes;
  }

  /**
   * Handle special event types
   */
  _handleSpecialEvent(atomName, eventName, state, changes) {
    switch (atomName) {
      case 'interaction':
        // Batch interaction events with RAF to prevent flooding
        if (changes.some(c => c.key === 'interactionEvents')) {
          if (!this._interactionBatch) {
            this._interactionBatch = {
              events: state.interactionEvents,
              count: state.interactionEvents.length,
            };

            // Schedule emission on next frame
            if (!this._interactionRAF) {
              this._interactionRAF = requestAnimationFrame(() => {
                if (this._interactionBatch) {
                  this._emitEvent(eventName, this._interactionBatch);
                  this._interactionBatch = null;
                }
                this._interactionRAF = null;
              });
            }
          } else {
            // Update batch with latest data
            this._interactionBatch.events = state.interactionEvents;
            this._interactionBatch.count = state.interactionEvents.length;
          }
        }
        break;

      case 'resource':
        // Batch resource updates
        if (changes.length > 0) {
          this._emitEvent(eventName, {
            stats: state.stats,
            memory: state.memory,
            changes: changes.map(c => c.key),
          });
        }
        break;
    }
  }

  /**
   * Emit event through BeatBus
   */
  _emitEvent(eventName, data) {
    if (!BeatBus) return;

    try {
      BeatBus.emit(eventName, {
        ...data,
        timestamp: Date.now(),
        source: 'AtomicBridge',
      });

      if (import.meta.env.DEV) {
        console.debug(`🌉 Bridge: ${eventName}`, data);
      }
    } catch (error) {
      console.error(`AtomicToBeatBus: Error emitting ${eventName}:`, error);
    }
  }

  /**
   * Manually trigger sync for all atoms
   */
  syncAll() {
    if (!this.isActive) {
      console.warn('AtomicToBeatBus: Bridge not active');
      return;
    }

    Object.entries(this.eventMappings).forEach(([name, config]) => {
      const currentState = config.atom.getState();
      this._handleAtomChange(name, currentState, config.events);
    });

    console.log('🌉 Bridge: Manual sync completed');
  }

  /**
   * Get bridge statistics
   */
  getStats() {
    return {
      isActive: this.isActive,
      subscribedAtoms: Object.keys(this.eventMappings),
      subscriptionCount: this.subscriptions.length,
      hasBeatBus: !!BeatBus,
    };
  }

  /**
   * Pause bridge (stop emitting events)
   */
  pause() {
    this.isActive = false;
    console.log('🌉 Bridge: Paused');
  }

  /**
   * Resume bridge
   */
  resume() {
    if (!BeatBus) {
      console.error('AtomicToBeatBus: Cannot resume without BeatBus');
      return;
    }

    this.isActive = true;
    this.syncAll(); // Sync current state
    console.log('🌉 Bridge: Resumed');
  }

  /**
   * Cleanup bridge
   */
  dispose() {
    // Cancel any pending RAF
    if (this._interactionRAF) {
      cancelAnimationFrame(this._interactionRAF);
      this._interactionRAF = null;
    }

    // Unsubscribe from all atoms
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];

    // Clear state
    this.lastStates = {};
    this.isActive = false;
    this._interactionBatch = null;
    BeatBus = null;

    // Clear singleton
    AtomicToBeatBusBridge.instance = null;

    console.log('🌉 Bridge: Disposed');
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!AtomicToBeatBusBridge.instance) {
      AtomicToBeatBusBridge.instance = new AtomicToBeatBusBridge();
    }
    return AtomicToBeatBusBridge.instance;
  }
}

// Export singleton instance
export default AtomicToBeatBusBridge.getInstance();

// Development helpers
if (import.meta.env.DEV) {
  window.AtomicBridge = AtomicToBeatBusBridge.getInstance();

  window.bridge = {
    stats: () => window.AtomicBridge.getStats(),
    sync: () => window.AtomicBridge.syncAll(),
    pause: () => window.AtomicBridge.pause(),
    resume: () => window.AtomicBridge.resume(),
  };

  console.log('🌉 AtomicToBeatBus available at window.AtomicBridge');
  console.log('🌉 Quick access: window.bridge.stats(), window.bridge.sync()');
}

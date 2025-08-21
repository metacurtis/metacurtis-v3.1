// src/modules/state/BeatBusBridge.js
/**
 * BeatBus Bridge for StateCore
 * Connects BeatBus events to atom state updates
 *
 * @canon-boundary STATE_EVENT_BRIDGE
 * @sst-version 3.0
 */

import { stateCore } from './StateCore';
import * as BeatBusModule from '@/modules/orchestration/core/BeatBus';

// Get BUS instance with fallbacks
const BUS =
  (typeof window !== 'undefined' && window.BeatBus) ||
  BeatBusModule.default ||
  BeatBusModule.BeatBus ||
  BeatBusModule.bus;

class BeatBusBridge {
  constructor() {
    this.eventMappings = new Map();
    this.subscriptions = new Map();
    this.initialized = false;
    this.eventCount = 0;

    this.canonContract = {
      boundary: 'STATE_EVENT_BRIDGE',
      version: '1.0.0',
      sstCompliance: 'v3.0',
    };

    if (import.meta.env.DEV) {
      this._setupDevTools();
    }
  }

  initialize() {
    if (this.initialized) return;

    if (!BUS) {
      console.warn('BeatBusBridge: BUS not available yet');
      return;
    }

    // Ensure Canon boundary is enforced on the bus
    try {
      if (globalThis.canon?.boundary?.enforce && !BUS.__boundaryEnforced) {
        globalThis.canon.boundary.enforce(BUS);
        BUS.__boundaryEnforced = true;
        console.log('🚌 BeatBusBridge: boundary enforced');
      }
    } catch (e) {
      console.warn('BeatBusBridge: boundary enforcement failed', e);
    }

    // Ensure StateCore is initialized
    if (!stateCore.initialized) {
      stateCore.initialize();
    }

    // Setup mappings and listeners
    this._setupCoreMappings();
    this._connectEventListeners();
    this._setupAtomSubscriptions();

    this.initialized = true;
    console.log('✅ BeatBusBridge: Initialized with', this.eventMappings.size, 'mappings');

    // Notify Canon
    if (globalThis.canon?.validate) {
      globalThis.canon.validate('BEATBUS_BRIDGE_INIT', {
        mappings: this.eventMappings.size,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Setup core event to atom mappings
   * @private
   */
  _setupCoreMappings() {
    // STAGE_CHANGE - Canon uses { from, to } pattern
    this.mapEvent('STAGE_CHANGE', (data = {}) => {
      const next = data.to ?? data.stage ?? data.nextStage;
      if (!next) return;

      stateCore.set('narrative', (state = {}) => ({
        ...state,
        currentStage: next,
        stageStartTime: Date.now(),
        isTransitioning: false,
      }));

      // Also update stage atom if it exists
      if (stateCore.atoms.stage) {
        stateCore.set('stage', (state = {}) => ({
          ...state,
          current: next,
          index: this._getStageIndex(next),
        }));
      }
    });

    // QUALITY_CHANGE - supports both tier and quality keys
    this.mapEvent('QUALITY_CHANGE', (data = {}) => {
      const tier = data.tier ?? data.quality;
      if (!tier) return;

      stateCore.set('quality', (state = {}) => ({
        ...state,
        currentTier: tier,
        dpr: data.dpr ?? state.dpr,
        particleMultiplier: data.multiplier ?? state.particleMultiplier,
      }));
    });

    // PERFORMANCE_UPDATE
    this.mapEvent('PERFORMANCE_UPDATE', (data = {}) => {
      stateCore.set('performance', (state = {}) => ({
        ...state,
        fps: data.fps ?? state.fps,
        frameTime: data.frameTime ?? state.frameTime,
        particleCount: data.particleCount ?? state.particleCount,
      }));
    });

    // FRAME_TICK - special handling for clockAtom
    this.mapEvent('FRAME_TICK', (data = {}) => {
      if (!stateCore.atoms.clock) return;

      const prev = stateCore.get('clock') || {};
      stateCore.atoms.clock.setState({
        ...prev,
        fps: data.fps ?? prev.fps,
        deltaMs: data.deltaMs ?? prev.deltaMs,
        averageFrameTime: data.averageFrameTime ?? prev.averageFrameTime,
      });
    });

    // DIRECTOR_STAGE_TRANSITION
    this.mapEvent('DIRECTOR_STAGE_TRANSITION', (data = {}) => {
      const next = data.nextStage ?? data.to;
      if (!next) return;

      stateCore.set('narrative', (state = {}) => ({
        ...state,
        isTransitioning: true,
        nextStage: next,
        transitionDuration: data.duration ?? 1000,
      }));
    });

    // MEMORY_FRAGMENT_ACTIVATE - safe array handling
    this.mapEvent('MEMORY_FRAGMENT_ACTIVATE', (data = {}) => {
      const prev = stateCore.get('narrative') || {};
      const explored = prev.fragmentsExplored || [];
      const set = new Set(explored);

      if (data.fragmentId) {
        set.add(data.fragmentId);
      }

      stateCore.set('narrative', (state = {}) => ({
        ...state,
        activeMemoryFragment: data.fragmentId ?? state.activeMemoryFragment,
        fragmentsExplored: Array.from(set),
      }));
    });

    // USER_INTERACTION - safe array handling
    this.mapEvent('USER_INTERACTION', (data = {}) => {
      const prev = stateCore.get('interaction') || {};
      const list = prev.interactionEvents || [];

      stateCore.set('interaction', (state = {}) => ({
        ...state,
        lastInteraction: data.type ?? state.lastInteraction,
        interactionEvents: [...list.slice(-9), data],
      }));
    });

    // RESOURCE_UPDATE - safe object spreading
    this.mapEvent('RESOURCE_UPDATE', (data = {}) => {
      stateCore.set('resource', (state = {}) => ({
        ...state,
        stats: { ...(state.stats || {}), ...(data.stats || {}) },
        memory: { ...(state.memory || {}), ...(data.memory || {}) },
      }));
    });
  }

  /**
   * Connect event listeners to BeatBus
   * @private
   */
  _connectEventListeners() {
    for (const [event, handler] of this.eventMappings) {
      const listener = payload => {
        try {
          handler(payload);
          this.eventCount++;

          if (import.meta.env.DEV) {
            console.log(`🌉 BeatBus → StateCore: ${event}`, payload);
          }
        } catch (e) {
          console.error(`Bridge error handling ${event}:`, e);
        }
      };

      if (BUS && BUS.on) {
        BUS.on(event, listener);
        this.subscriptions.set(event, listener);
      }
    }
  }

  /**
   * Setup atom subscriptions for state → event flow
   * @private
   */
  _setupAtomSubscriptions() {
    // narrative → event
    stateCore.subscribe('narrative', (state = {}) => {
      if (state.currentStage && BUS && BUS.emit) {
        BUS.emit('STATE_STAGE_UPDATED', {
          stage: state.currentStage,
          progress: state.globalProgress,
          source: 'narrative-atom',
        });
      }
    });

    // quality → event
    stateCore.subscribe('quality', (state = {}) => {
      if (state.currentTier && BUS && BUS.emit) {
        BUS.emit('STATE_QUALITY_UPDATED', {
          tier: state.currentTier,
          dpr: state.dpr,
          source: 'quality-atom',
        });
      }
    });

    // performance warning
    stateCore.subscribe('performance', (state = {}) => {
      if (typeof state.fps === 'number' && state.fps < 30 && BUS && BUS.emit) {
        BUS.emit('PERFORMANCE_WARNING', {
          fps: state.fps,
          frameTime: state.frameTime,
          source: 'performance-atom',
        });
      }
    });
  }

  /**
   * Map an event to a state update handler
   */
  mapEvent(event, handler) {
    this.eventMappings.set(event, handler);
  }

  /**
   * Remove an event mapping
   */
  unmapEvent(event) {
    const listener = this.subscriptions.get(event);
    if (listener && BUS && BUS.off) {
      BUS.off(event, listener);
    }
    this.subscriptions.delete(event);
    this.eventMappings.delete(event);
  }

  /**
   * Emit an event through BeatBus
   */
  emit(event, data) {
    if (BUS && BUS.emit) {
      BUS.emit(event, {
        ...data,
        source: 'state-core',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Get stage index (-1 for unknown)
   * @private
   */
  _getStageIndex(stage) {
    const stages = [
      'genesis',
      'discipline',
      'neural',
      'velocity',
      'architecture',
      'harmony',
      'transcendence',
    ];
    return stages.indexOf(stage); // Returns -1 if unknown
  }

  /**
   * Setup development tools
   * @private
   */
  _setupDevTools() {
    if (typeof window === 'undefined') return;

    window.BeatBusBridge = this;
    window.BB = {
      emit: this.emit.bind(this),
      mappings: () => Array.from(this.eventMappings.keys()),
      eventCount: () => this.eventCount,
      test: (event, data) => {
        if (BUS && BUS.emit) {
          console.log(`🧪 Testing event: ${event}`);
          BUS.emit(event, data || {});
        } else {
          console.warn('BUS not available for testing');
        }
      },
    };

    console.log('🔧 BeatBusBridge DevTools: window.BB.{emit,mappings,eventCount,test}');
  }

  /**
   * Canon compliance validation
   */
  validateCanonCompliance() {
    return {
      boundary: this.canonContract.boundary,
      version: this.canonContract.version,
      initialized: this.initialized,
      eventMappings: this.eventMappings.size,
      eventCount: this.eventCount,
      health: this.initialized ? 'healthy' : 'not-initialized',
    };
  }

  /**
   * Cleanup and dispose
   */
  dispose() {
    for (const [event, listener] of this.subscriptions) {
      if (BUS && BUS.off) {
        BUS.off(event, listener);
      }
    }

    this.eventMappings.clear();
    this.subscriptions.clear();
    this.initialized = false;

    console.log('🌉 BeatBusBridge: Disposed');
  }
}

// Create singleton instance
const beatBusBridge = new BeatBusBridge();

// Single auto-init on DOM ready
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => beatBusBridge.initialize(), 100);
  });
}

export default beatBusBridge;
export { beatBusBridge };

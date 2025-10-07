// canon-console/runtime/lifecycle-guards.js
// Behavioral contract enforcement for event lifecycles
// v3.6.1 - Fixed for opening sequence compatibility

const enqueueMicrotask = typeof queueMicrotask === 'function'
  ? queueMicrotask
  : (fn) => Promise.resolve().then(fn);

const PHASE_ALLOW_MAP = {
  BUILD_EMERGENCE_BLUEPRINT: ['opening', 'emergence'],
  PARTICLES_START_EMERGING: ['opening', 'emergence'],
  PARTICLES_EMERGED: ['opening', 'emergence'],
  BLUEPRINT_READY: ['emergence', 'runtime', 'complete'],
  FENCEPOST_LISTENERS_READY: ['opening', 'emergence'],
  RENDER_DIRECTIVE: ['emergence', 'runtime', 'complete'],
  RENDERER_TUNE: ['opening', 'emergence', 'runtime', 'complete'],
  MORPH_PROGRESS: ['opening', 'emergence', 'runtime', 'complete'],
  STAGE_CHANGE: ['opening', 'emergence', 'runtime', 'complete'],
  ENABLE_SCROLL: ['runtime', 'complete'],
  LIFECYCLE_PHASE: ['*'],
};

const PIXEL_CRITICAL_EVENTS = new Set([
  'RENDER_DIRECTIVE',
  'RENDERER_TUNE',
  'MORPH_PROGRESS',
]);

export class LifecycleGuards {
  constructor() {
    this.guards = new Map();
    this.violations = [];
    this.enabled = true;
    this.openingSequenceActive = false;
    this.currentPhase = 'preload';
    this.phaseQueue = [];
    this.allowedPhases = PHASE_ALLOW_MAP;
    this.beatBus = null;
    this.emergenceLocked = false;
  }

  register(eventName, contract) {
    this.guards.set(eventName, {
      ...contract,
      occurrences: 0,
      lastEmitter: null,
      lastContext: null,
      firstOccurrence: null,
      lastPayload: null
    });
  }

  isPhaseAllowed(eventName, phase) {
    const normalized = typeof phase === 'string' ? phase.toLowerCase() : 'runtime';
    const allowed = this.allowedPhases[eventName];
    if (!allowed || allowed.includes('*')) return true;
    if (normalized === 'emergence' && this.emergenceLocked && PIXEL_CRITICAL_EVENTS.has(eventName)) {
      return false;
    }
    return allowed.includes(normalized);
  }

  _phaseQueueKey(eventName, payload) {
    const stage = payload?.stage ?? payload?.to ?? payload?.target ?? '';
    if (eventName === 'RENDER_DIRECTIVE') {
      return `${eventName}::${stage || 'directive'}`;
    }
    if (eventName === 'BLUEPRINT_READY') {
      return `${eventName}::${stage || ''}::${payload?.mode || ''}`;
    }
    return `${eventName}::${stage}`;
  }

  queueDeferredEvent(eventName, payload) {
    const key = this._phaseQueueKey(eventName, payload);
    const entry = { eventName, payload, key };
    const idx = this.phaseQueue.findIndex((item) => item.key === key);
    if (idx >= 0) {
      this.phaseQueue[idx] = entry;
    } else {
      this.phaseQueue.push(entry);
    }
  }

  flushQueuedEvents() {
    if (!this.phaseQueue.length || !this.beatBus?.emit) return;
    const remaining = [];
    const toReplay = [];
    for (const entry of this.phaseQueue) {
      if (this.isPhaseAllowed(entry.eventName, this.currentPhase)) {
        toReplay.push(entry);
      } else {
        remaining.push(entry);
      }
    }
    this.phaseQueue = remaining;
    toReplay.forEach((entry) => {
      enqueueMicrotask(() => {
        try {
          this.beatBus.emit(entry.eventName, entry.payload);
        } catch (err) {
          if (typeof console !== 'undefined' && console.warn) {
            console.warn('[LifecycleGuard] replay failed for', entry.eventName, err);
          }
        }
      });
    });
  }

  updatePhase(phase) {
    const normalized = typeof phase === 'string' ? phase.toLowerCase() : 'runtime';
    this.currentPhase = normalized;
    this.openingSequenceActive = normalized === 'opening' || normalized === 'emergence';
    if (normalized === 'runtime' || normalized === 'complete' || normalized === 'opening') {
      this.emergenceLocked = false;
    }
    this.flushQueuedEvents();
  }

  install(BeatBus, incidentCollector) {
    if (!BeatBus) return;

    this.beatBus = BeatBus;
    
    // Register default guards
    this.registerDefaults();
    
    // Intercept emit to track lifecycle
    const originalEmit = BeatBus.emit.bind(BeatBus);
    BeatBus.emit = (eventName, payload) => {
      if (this.enabled) {
        if (eventName === 'BUILD_EMERGENCE_BLUEPRINT' && payload?.fastForward) {
          this.updatePhase('opening');
        }
        const context = this.getCurrentContext();
        const phase = this.currentPhase || context?.phase || 'runtime';

        if (!this.isPhaseAllowed(eventName, phase)) {
          this.queueDeferredEvent(eventName, payload);
          return;
        }

        const validation = this.validate(eventName, 'BeatBus', context, payload);
        
        if (!validation.valid) {
          const incident = {
            code: 'LIFECYCLE_VIOLATION',
            severity: 'error',
            message: `${eventName}: ${validation.reason}`,
            context: {
              event: eventName,
              violation: validation.violation,
              occurrences: this.guards.get(eventName)?.occurrences
            },
            timestamp: Date.now()
          };
          
          incidentCollector.add(incident);
          
          // In STRICT mode, only block if critical and not in opening
          if (localStorage.getItem('canonBusMode') === 'STRICT' && 
              validation.critical && 
              !this.openingSequenceActive) {
            console.error('[LifecycleGuard] Blocking emission:', eventName, validation);
            return false;
          } else {
            console.warn('[LifecycleGuard] Violation (allowing):', eventName, validation.reason);
          }
        }
      }
      
      return originalEmit(eventName, payload);
    };
    
    // Monitor for opening sequence / phase transitions
    BeatBus.on('CURSOR_SHOW', () => this.updatePhase('opening'));
    BeatBus.on('PARTICLES_EMERGED', () => {
      this.emergenceLocked = true;
      this.updatePhase('emergence');
    });
    BeatBus.on('ENABLE_SCROLL', () => this.updatePhase('runtime'));
    BeatBus.on('LIFECYCLE_PHASE', (payload = {}) => {
      if (payload?.phase) {
        this.updatePhase(payload.phase);
      }
    });
    
    console.log('🛡️ Lifecycle Guards installed');
  }

  registerDefaults() {
    // BUILD_EMERGENCE_BLUEPRINT - Allow during opening and stage changes
    this.register('BUILD_EMERGENCE_BLUEPRINT', {
      maxOccurrences: 20,  // Allow multiple (one per stage + opening)
      validPhases: ['opening', 'emergence', 'runtime'],
      minInterval: 50,  // Prevent only rapid-fire
      critical: false,   // Don't block
      description: 'Emergence blueprint builds on stage changes'
    });
    
    // PARTICLES_EMERGED - Renderer emits this per emergence
    this.register('PARTICLES_EMERGED', {
      maxOccurrences: 20,  // Allow multiple 
      validPhases: ['opening', 'emergence', 'runtime'],
      minInterval: 50,
      critical: false,
      description: 'Particles emerged signals emergence complete'
    });
    
    // RENDERER_TUNE - Can happen multiple times during setup
    this.register('RENDERER_TUNE', {
      maxOccurrences: 100,  // Many during opening
      minInterval: 10,
      critical: false,
      description: 'Renderer tuning happens frequently during setup'
    });
    
    // Stage changes should not be too rapid
    this.register('STAGE_CHANGE', {
      minInterval: 100,
      validEmitters: ['stageAtom', 'TheaterDirector', 'ScrollOrchestrator'],
      critical: false,
      description: 'Stage changes should be deliberate, not rapid'
    });
    
    // Quality changes should be infrequent
    this.register('QUALITY_CHANGE', {
      minInterval: 500,
      maxPerMinute: 10,
      critical: true,
      description: 'Quality changes should be infrequent'
    });
    
    // Opening sequence events - track but don't block
    this.register('CURSOR_SHOW', {
      maxOccurrences: 5,
      validPhases: ['preload', 'opening'],
      critical: false
    });
    
    this.register('CURSOR_BLINK', {
      maxOccurrences: 10,
      validPhases: ['opening'],
      critical: false
    });
    
    this.register('TERMINAL_TYPE', {
      maxOccurrences: 5,
      validPhases: ['opening'],
      critical: false
    });
    
    this.register('SCREEN_FILL', {
      maxOccurrences: 5,
      validPhases: ['opening'],
      critical: false
    });
  }

  validate(eventName, emitter, context, payload) {
    const guard = this.guards.get(eventName);
    if (!guard) return { valid: true };

    const now = Date.now();

    // Track first occurrence
    if (!guard.firstOccurrence) {
      guard.firstOccurrence = now;
    }
    
    // Check max occurrences
    guard.occurrences++;
    if (guard.maxOccurrences && guard.occurrences > guard.maxOccurrences) {
      return {
        valid: false,
        reason: `Exceeded max occurrences (expected: ${guard.maxOccurrences}, actual: ${guard.occurrences})`,
        violation: 'FREQUENCY_VIOLATION',
        critical: guard.critical
      };
    }
    
    // Check minimum interval
    if (guard.minInterval && guard.lastOccurrence) {
      const interval = now - guard.lastOccurrence;
      let skipIntervalCheck = false;

      if (eventName === 'STAGE_CHANGE' && guard.lastPayload && payload) {
        const sameDestination = guard.lastPayload?.to === payload?.to;
        const atomInvolved = guard.lastPayload?.reason === 'atom' || payload?.reason === 'atom';
        if (sameDestination && atomInvolved) {
          skipIntervalCheck = true;
        }
      }

      if (!skipIntervalCheck && interval < guard.minInterval) {
        return {
          valid: false,
          reason: `Too rapid (interval: ${interval}ms, minimum: ${guard.minInterval}ms)`,
          violation: 'TIMING_VIOLATION',
          critical: guard.critical
        };
      }
    }
    
    // Check rate limit
    if (guard.maxPerMinute) {
      const minuteAgo = now - 60000;
      const recentCount = this.violations.filter(v => 
        v.event === eventName && v.timestamp > minuteAgo
      ).length;
      
      if (recentCount >= guard.maxPerMinute) {
        return {
          valid: false,
          reason: `Rate limit exceeded (${recentCount}/min, max: ${guard.maxPerMinute}/min)`,
          violation: 'RATE_VIOLATION',
          critical: guard.critical
        };
      }
    }
    
    // Check valid phases
    if (guard.validPhases && !guard.validPhases.includes(context.phase)) {
      return {
        valid: false,
        reason: `Invalid phase (expected: ${guard.validPhases.join(', ')}, actual: ${context.phase})`,
        violation: 'PHASE_VIOLATION',
        critical: guard.critical
      };
    }
    
    guard.lastOccurrence = now;
    guard.lastEmitter = emitter;
    guard.lastContext = context;
    guard.lastPayload = payload;

    return { valid: true };
  }
  
  getCurrentContext() {
    return {
      phase: this.detectPhase(),
      stage: window.stageControls?.getCurrentStage?.() || 'unknown',
      quality: window.qualityControls?.getCurrentTier?.() || 'unknown',
      timestamp: Date.now()
    };
  }
  
  detectPhase() {
    if (this.currentPhase) return this.currentPhase;
    // More sophisticated phase detection
    const hasStarted = this.guards.get('CURSOR_SHOW')?.occurrences > 0;
    const hasEmerged = this.guards.get('PARTICLES_EMERGED')?.occurrences > 0;
    const hasStageChange = this.guards.get('STAGE_CHANGE')?.occurrences > 0;
    const hasTerminal = this.guards.get('TERMINAL_TYPE')?.occurrences > 0;
    
    if (!hasStarted) return 'preload';
    if (hasStarted && !hasEmerged) return 'opening';
    if (hasEmerged && !hasStageChange) return 'emergence';
    return 'runtime';
  }
  
  setOpeningActive(active) {
    this.updatePhase(active ? 'opening' : 'runtime');
    console.log(`[LifecycleGuard] Opening sequence active: ${active}`);
  }
  
  reset() {
    this.guards.forEach(guard => {
      guard.occurrences = 0;
      guard.firstOccurrence = null;
      guard.lastOccurrence = null;
      guard.lastPayload = null;
    });
    this.violations = [];
    this.openingSequenceActive = false;
    this.phaseQueue = [];
    this.currentPhase = 'preload';
    this.emergenceLocked = false;
  }
  
  getReport() {
    const report = {
      guards: {},
      violations: this.violations.slice(-10),
      phase: this.detectPhase(),
      openingActive: this.openingSequenceActive
    };
    
    this.guards.forEach((guard, event) => {
      if (guard.occurrences > 0) {
        report.guards[event] = {
          occurrences: guard.occurrences,
          maxAllowed: guard.maxOccurrences,
          violated: guard.maxOccurrences ? guard.occurrences > guard.maxOccurrences : false,
          critical: guard.critical || false
        };
      }
    });
    
    return report;
  }
}

export const lifecycleGuards = new LifecycleGuards();
export default lifecycleGuards;

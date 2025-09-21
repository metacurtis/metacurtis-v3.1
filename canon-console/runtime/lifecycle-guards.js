// canon-console/runtime/lifecycle-guards.js
// Behavioral contract enforcement for event lifecycles
// v3.6.1 - Fixed for opening sequence compatibility

export class LifecycleGuards {
  constructor() {
    this.guards = new Map();
    this.violations = [];
    this.enabled = true;
    this.openingSequenceActive = false;
  }

  register(eventName, contract) {
    this.guards.set(eventName, {
      ...contract,
      occurrences: 0,
      lastEmitter: null,
      lastContext: null,
      firstOccurrence: null
    });
  }

  install(BeatBus, incidentCollector) {
    if (!BeatBus) return;
    
    // Register default guards
    this.registerDefaults();
    
    // Intercept emit to track lifecycle
    const originalEmit = BeatBus.emit.bind(BeatBus);
    BeatBus.emit = (eventName, payload) => {
      if (this.enabled) {
        const context = this.getCurrentContext();
        const validation = this.validate(eventName, 'BeatBus', context);
        
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
    
    // Monitor for opening sequence
    BeatBus.on('CURSOR_SHOW', () => this.openingSequenceActive = true);
    BeatBus.on('PARTICLES_EMERGED', () => {
      setTimeout(() => this.openingSequenceActive = false, 1000);
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

  validate(eventName, emitter, context) {
    const guard = this.guards.get(eventName);
    if (!guard) return { valid: true };
    
    // During opening sequence, be more lenient
    if (this.openingSequenceActive) {
      const criticalEvents = ['QUALITY_CHANGE']; // Only truly critical events
      if (!criticalEvents.includes(eventName)) {
        guard.occurrences++;
        guard.lastOccurrence = Date.now();
        return { valid: true }; // Allow during opening
      }
    }
    
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
      if (interval < guard.minInterval) {
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
    this.openingSequenceActive = active;
    console.log(`[LifecycleGuard] Opening sequence active: ${active}`);
  }
  
  reset() {
    this.guards.forEach(guard => {
      guard.occurrences = 0;
      guard.firstOccurrence = null;
      guard.lastOccurrence = null;
    });
    this.violations = [];
    this.openingSequenceActive = false;
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
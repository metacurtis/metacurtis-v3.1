// canon-console/runtime/lifecycle-guards.js
// Behavioral contract enforcement for event lifecycles

export class LifecycleGuards {
  constructor() {
    this.guards = new Map();
    this.violations = [];
    this.enabled = true;
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
          
          // In STRICT mode, prevent emission
          if (localStorage.getItem('canonBusMode') === 'STRICT') {
            console.error('[LifecycleGuard] Blocking emission:', eventName, validation);
            return false;
          }
        }
      }
      
      return originalEmit(eventName, payload);
    };
    
    console.log('🛡️ Lifecycle Guards installed');
  }

  registerDefaults() {
    // Critical: Emergence should only happen once
    this.register('BUILD_EMERGENCE_BLUEPRINT', {
      maxOccurrences: 1,
      validPhases: ['opening'],
      resetOn: 'page_reload',
      critical: true,
      description: 'Emergence blueprint should only build once during opening'
    });
    
    // Particles emerged is a one-time fencepost
    this.register('PARTICLES_EMERGED', {
      maxOccurrences: 1,
      validPhases: ['opening', 'emergence'],
      critical: true,
      description: 'Particles emerged is a one-time fencepost event'
    });
    
    // Stage changes should not be too rapid
    this.register('STAGE_CHANGE', {
      minInterval: 100, // ms between changes
      validEmitters: ['stageAtom', 'TheaterDirector'],
      description: 'Stage changes should be deliberate, not rapid'
    });
    
    // Quality changes should be infrequent
    this.register('QUALITY_CHANGE', {
      minInterval: 500,
      maxPerMinute: 10,
      description: 'Quality changes should be infrequent'
    });
  }

  validate(eventName, emitter, context) {
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
        violation: 'FREQUENCY_VIOLATION'
      };
    }
    
    // Check minimum interval
    if (guard.minInterval && guard.lastOccurrence) {
      const interval = now - guard.lastOccurrence;
      if (interval < guard.minInterval) {
        return {
          valid: false,
          reason: `Too rapid (interval: ${interval}ms, minimum: ${guard.minInterval}ms)`,
          violation: 'TIMING_VIOLATION'
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
          violation: 'RATE_VIOLATION'
        };
      }
    }
    
    // Check valid phases
    if (guard.validPhases && !guard.validPhases.includes(context.phase)) {
      return {
        valid: false,
        reason: `Invalid phase (expected: ${guard.validPhases.join(', ')}, actual: ${context.phase})`,
        violation: 'PHASE_VIOLATION'
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
    // Simple phase detection based on what has occurred
    const hasEmerged = this.guards.get('PARTICLES_EMERGED')?.occurrences > 0;
    const hasStarted = this.guards.get('CURSOR_SHOW')?.occurrences > 0;
    
    if (!hasStarted) return 'preload';
    if (!hasEmerged) return 'opening';
    return 'runtime';
  }
  
  reset() {
    this.guards.forEach(guard => {
      guard.occurrences = 0;
      guard.firstOccurrence = null;
      guard.lastOccurrence = null;
    });
    this.violations = [];
  }
  
  getReport() {
    const report = {
      guards: {},
      violations: this.violations.slice(-10),
      phase: this.detectPhase()
    };
    
    this.guards.forEach((guard, event) => {
      if (guard.occurrences > 0) {
        report.guards[event] = {
          occurrences: guard.occurrences,
          maxAllowed: guard.maxOccurrences,
          violated: guard.maxOccurrences ? guard.occurrences > guard.maxOccurrences : false
        };
      }
    });
    
    return report;
  }
}

export const lifecycleGuards = new LifecycleGuards();
export default lifecycleGuards;
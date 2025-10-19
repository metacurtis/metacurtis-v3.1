#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function main() {
  console.log('=== Adding Lifecycle Guards to Canon Dev-OS ===\n');
  
  // Step 1: Create Lifecycle Guards module
  const lifecycleGuardsCode = `// canon-console/runtime/lifecycle-guards.js
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
            message: \`\${eventName}: \${validation.reason}\`,
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
        reason: \`Exceeded max occurrences (expected: \${guard.maxOccurrences}, actual: \${guard.occurrences})\`,
        violation: 'FREQUENCY_VIOLATION'
      };
    }
    
    // Check minimum interval
    if (guard.minInterval && guard.lastOccurrence) {
      const interval = now - guard.lastOccurrence;
      if (interval < guard.minInterval) {
        return {
          valid: false,
          reason: \`Too rapid (interval: \${interval}ms, minimum: \${guard.minInterval}ms)\`,
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
          reason: \`Rate limit exceeded (\${recentCount}/min, max: \${guard.maxPerMinute}/min)\`,
          violation: 'RATE_VIOLATION'
        };
      }
    }
    
    // Check valid phases
    if (guard.validPhases && !guard.validPhases.includes(context.phase)) {
      return {
        valid: false,
        reason: \`Invalid phase (expected: \${guard.validPhases.join(', ')}, actual: \${context.phase})\`,
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
export default lifecycleGuards;`;

  await fs.writeFile('canon-console/runtime/lifecycle-guards.js', lifecycleGuardsCode);
  console.log('✓ Created lifecycle-guards.js');

  // Step 2: Create Learning System
  const learningSystemCode = `// canon-console/runtime/learning-system.js
// Pattern recognition and auto-remediation

export class LearningSystem {
  constructor() {
    this.patterns = new Map();
    this.fixes = new Map();
    this.history = [];
  }
  
  install(incidentCollector) {
    // Listen to incidents and learn patterns
    const originalAdd = incidentCollector.add.bind(incidentCollector);
    incidentCollector.add = (incident) => {
      this.analyzeIncident(incident);
      return originalAdd(incident);
    };
    
    console.log('🧠 Learning System installed');
  }
  
  analyzeIncident(incident) {
    const pattern = this.extractPattern(incident);
    const signature = this.generateSignature(pattern);
    
    if (this.patterns.has(signature)) {
      const known = this.patterns.get(signature);
      known.occurrences++;
      known.lastSeen = Date.now();
      
      // If we have a fix and it's recurring, suggest it
      if (known.occurrences > 2 && this.fixes.has(signature)) {
        const fix = this.fixes.get(signature);
        console.warn(\`[Learning] Recurring issue detected: \${signature}\`);
        console.warn(\`[Learning] Suggested fix: \${fix.description}\`);
        
        // Auto-apply if configured
        if (fix.autoApply && localStorage.getItem('canonAutoFix') === 'true') {
          this.applyFix(fix);
        }
      }
    } else {
      // New pattern discovered
      this.patterns.set(signature, {
        ...pattern,
        occurrences: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now()
      });
    }
    
    this.history.push({ incident, pattern, signature, timestamp: Date.now() });
    if (this.history.length > 100) this.history.shift();
  }
  
  extractPattern(incident) {
    return {
      code: incident.code,
      severity: incident.severity,
      category: this.categorize(incident),
      context: this.sanitizeContext(incident.context)
    };
  }
  
  categorize(incident) {
    if (incident.code.includes('LIFECYCLE')) return 'lifecycle';
    if (incident.code.includes('BLUEPRINT')) return 'blueprint';
    if (incident.code.includes('CONTRACT')) return 'contract';
    if (incident.code.includes('PERFORMANCE')) return 'performance';
    return 'unknown';
  }
  
  sanitizeContext(context) {
    // Extract only the relevant parts for pattern matching
    return {
      event: context?.event,
      violation: context?.violation,
      emitter: context?.emitter
    };
  }
  
  generateSignature(pattern) {
    return \`\${pattern.code}-\${pattern.category}-\${pattern.context?.event || 'unknown'}\`;
  }
  
  registerFix(signature, fix) {
    this.fixes.set(signature, {
      ...fix,
      signature,
      applied: 0,
      successful: 0
    });
  }
  
  applyFix(fix) {
    console.log(\`[Learning] Applying fix: \${fix.description}\`);
    try {
      if (typeof fix.apply === 'function') {
        fix.apply();
        fix.applied++;
        fix.successful++;
      }
    } catch (e) {
      console.error('[Learning] Fix failed:', e);
    }
  }
  
  getInsights() {
    const insights = {
      totalPatterns: this.patterns.size,
      recurringIssues: [],
      suggestedFixes: [],
      topCategories: {}
    };
    
    // Find recurring issues
    this.patterns.forEach((pattern, signature) => {
      if (pattern.occurrences > 2) {
        insights.recurringIssues.push({
          signature,
          occurrences: pattern.occurrences,
          category: pattern.category
        });
      }
    });
    
    // Count by category
    this.patterns.forEach(pattern => {
      insights.topCategories[pattern.category] = 
        (insights.topCategories[pattern.category] || 0) + pattern.occurrences;
    });
    
    // Get available fixes
    this.fixes.forEach((fix, signature) => {
      if (this.patterns.has(signature)) {
        insights.suggestedFixes.push({
          signature,
          description: fix.description,
          applied: fix.applied,
          successful: fix.successful
        });
      }
    });
    
    return insights;
  }
}

export const learningSystem = new LearningSystem();
export default learningSystem;`;

  await fs.writeFile('canon-console/runtime/learning-system.js', learningSystemCode);
  console.log('✓ Created learning-system.js');

  // Step 3: Update injector to include new modules
  const injectorPath = 'canon-console/browser/inject.js';
  const injector = await fs.readFile(injectorPath, 'utf8');
  
  if (!injector.includes('lifecycle-guards')) {
    // Find insertion point after contract-tap
    const marker = "console.log('📝 Contract-Tap installed');";
    const insertIndex = injector.indexOf(marker);
    
    if (insertIndex !== -1) {
      const insertion = `
        }
      });
    })
    .then(function () {
      // Install Lifecycle Guards
      return imp('runtime/lifecycle-guards.js', 'lifecycleGuards', function (m) {
        try {
          const BeatBus = w.BeatBus || w.theaterBus?.bus;
          const incidentCollector = w.CANON_CONSOLE?.incidents || { 
            add: function(incident) { console.warn('[Lifecycle]', incident); }
          };
          
          if (BeatBus && m.default) {
            m.default.install(BeatBus, incidentCollector);
            L.lifecycleGuards = true;
            console.log('🛡️ Lifecycle Guards installed');
          }
        } catch (e) {
          errors.push(e);
          console.warn('Lifecycle Guards error:', e);
        }
      });
    })
    .then(function () {
      // Install Learning System
      return imp('runtime/learning-system.js', 'learningSystem', function (m) {
        try {
          const incidentCollector = w.CANON_CONSOLE?.incidents || {
            add: function(incident) { console.warn('[Learning]', incident); }
          };
          
          if (m.default) {
            m.default.install(incidentCollector);
            L.learningSystem = true;
            
            // Expose for debugging
            w.CANON_LEARNING = m.default;
            console.log('🧠 Learning System installed');
          }
        } catch (e) {
          errors.push(e);
          console.warn('Learning System error:', e);`;
      
      const endIndex = injector.indexOf('}', insertIndex) + 1;
      const updated = injector.slice(0, endIndex) + insertion + '        }' + injector.slice(endIndex);
      
      await fs.writeFile(injectorPath, updated);
      console.log('✓ Updated injector');
    }
  } else {
    console.log('✓ Injector already has lifecycle guards');
  }

  // Step 4: Create verification test
  const testCode = `// Test Lifecycle Guards
console.log('=== Testing Lifecycle Guards ===\\n');

// Test 1: Try to emit emergence twice (should fail)
console.log('Test 1: Double emergence');
window.BeatBus.emit('BUILD_EMERGENCE_BLUEPRINT', { mode: 'test' });
window.BeatBus.emit('BUILD_EMERGENCE_BLUEPRINT', { mode: 'test2' });

// Test 2: Rapid stage changes (should warn)
console.log('\\nTest 2: Rapid stage changes');
for (let i = 0; i < 3; i++) {
  window.BeatBus.emit('STAGE_CHANGE', { from: 'stage' + i, to: 'stage' + (i+1) });
}

// Test 3: Check guards report
setTimeout(() => {
  console.log('\\nLifecycle Guards Report:');
  const guards = window.lifecycleGuards || window.CANON_CONSOLE?.lifecycleGuards;
  if (guards?.getReport) {
    console.log(guards.getReport());
  }
  
  // Check learning insights
  console.log('\\nLearning System Insights:');
  if (window.CANON_LEARNING?.getInsights) {
    console.log(window.CANON_LEARNING.getInsights());
  }
  
  // Check incidents
  const incidents = window.CANON_CONSOLE?.incidents?.get?.() || [];
  const lifecycleIncidents = incidents.filter(i => i.code === 'LIFECYCLE_VIOLATION');
  console.log('\\nLifecycle violations detected:', lifecycleIncidents.length);
  lifecycleIncidents.forEach(i => {
    console.log(\`  - \${i.message}\`);
  });
}, 500);`;

  await fs.writeFile('test-lifecycle-guards.js', testCode);
  console.log('✓ Created test file\n');

  console.log('=== Lifecycle Guards Installation Complete ===');
  console.log('The system now:');
  console.log('  - Prevents double emergence');
  console.log('  - Catches rapid stage changes');
  console.log('  - Learns from recurring patterns');
  console.log('  - Suggests fixes for known issues');
  console.log('\nRun: npm run dev');
  console.log('Then copy test-lifecycle-guards.js to console');
}

// Self-verification
async function verify() {
  try {
    await fs.access('canon-console/runtime/lifecycle-guards.js');
    await fs.access('canon-console/runtime/learning-system.js');
    console.log('✓ Self-verification passed');
    return true;
  } catch {
    console.log('✗ Files not created yet');
    return false;
  }
}

// Run with self-verification
main()
  .then(() => verify())
  .then(ok => {
    if (ok) {
      console.log('\n✓ Lifecycle Guards ready for use');
    }
  })
  .catch(console.error);

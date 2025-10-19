// canon-console/runtime/learning-system.js
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
        console.warn(`[Learning] Recurring issue detected: ${signature}`);
        console.warn(`[Learning] Suggested fix: ${fix.description}`);
        
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
    return `${pattern.code}-${pattern.category}-${pattern.context?.event || 'unknown'}`;
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
    console.log(`[Learning] Applying fix: ${fix.description}`);
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
export default learningSystem;
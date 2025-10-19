/**
 * Canon Guard L2 - Active Guardian
 * Suggests corrections and generates doctor scripts
 */
import CanonGuardL1 from './L1.js';

export class CanonGuardL2 extends CanonGuardL1 {
  constructor(contracts) {
    super(contracts);
    this.suggestions = new Map();
    this.patterns = new Map();

    console.log('🛡️ Canon Guard L2: Active guardian initialized');
  }

  validate(type, data) {
    const result = super.validate(type, data);

    // Track patterns
    if (!result.valid) {
      this.trackPattern(type, result.violations);
    }

    return result;
  }

  trackPattern(type, violations) {
    const key = `${type}:${violations[0].type}`;
    const pattern = this.patterns.get(key) || { count: 0, lastSeen: null };

    pattern.count++;
    pattern.lastSeen = Date.now();

    this.patterns.set(key, pattern);

    // Generate suggestion after 3 occurrences
    if (pattern.count === 3) {
      this.generateSuggestion(type, violations[0]);
    }
  }

  generateSuggestion(type, violation) {
    const suggestions = {
      'STAGE_CHANGE:missing_required': {
        fix: 'Ensure both from and to are provided',
        doctorScript: 'doctor-fix-stage-events.cjs',
        code: `BeatBus.emit('STAGE_CHANGE', { from: currentStage, to: newStage })`,
      },
      'QUALITY_CHANGE:invalid_value': {
        fix: 'Use valid tier values: LOW, MEDIUM, HIGH, ULTRA',
        doctorScript: 'doctor-fix-quality-tiers.cjs',
        code: `BeatBus.emit('QUALITY_CHANGE', { tier: 'HIGH' })`,
      },
      'blueprint:missing_field': {
        fix: 'Ensure blueprint has all required fields',
        doctorScript: 'doctor-validate-blueprints.cjs',
        code: 'Check ConsciousnessEngine.buildBlueprint()',
      },
      'morphing:range_violation': {
        fix: 'Clamp morph progress to [0, 1]',
        doctorScript: 'doctor-fix-morph-range.cjs',
        code: 'morphProgress = Math.max(0, Math.min(1, value))',
      },
    };

    const key = `${type}:${violation.type}`;
    const suggestion = suggestions[key] || {
      fix: 'Check contract requirements',
      doctorScript: null,
      code: null,
    };

    this.suggestions.set(key, suggestion);

    console.log(`🛡️ Canon Guard L2 Suggestion: ${suggestion.fix}`);
    if (suggestion.code) {
      console.log(`    Code: ${suggestion.code}`);
    }
    if (suggestion.doctorScript) {
      console.log(`    Doctor: node scripts/${suggestion.doctorScript}`);
    }
  }

  suggestFix(violation) {
    const key = `${violation.type}:${violation.violations?.[0]?.type}`;
    return this.suggestions.get(key);
  }

  generateDoctorScript(violations) {
    const scripts = [];

    for (const violation of violations) {
      const suggestion = this.suggestFix(violation);
      if (suggestion?.doctorScript) {
        scripts.push(suggestion.doctorScript);
      }
    }

    return scripts.filter((s, i, a) => a.indexOf(s) === i); // unique
  }

  autoProtect(BeatBus) {
    if (!BeatBus) return;

    console.log('🛡️ Canon Guard L2: Installing auto-protection...');

    // Intercept and validate all events
    const events = Object.keys(this.contracts.events);

    for (const event of events) {
      BeatBus.on(event, data => {
        const result = this.validate(event, data);

        if (!result.valid) {
          const suggestion = this.suggestFix({ type: event, violations: result.violations });
          if (suggestion) {
            console.warn(`🛡️ Auto-fix available: ${suggestion.fix}`);
          }
        }
      });
    }

    console.log(`🛡️ Canon Guard L2: Protecting ${events.length} event types`);
  }

  getPatterns() {
    return Array.from(this.patterns.entries()).map(([key, value]) => ({
      pattern: key,
      ...value,
    }));
  }

  analyze() {
    return {
      violations: this.getViolations(),
      patterns: this.getPatterns(),
      suggestions: Array.from(this.suggestions.entries()).map(([key, value]) => ({
        issue: key,
        ...value,
      })),
      stats: this.getStats(),
    };
  }
}

export default CanonGuardL2;

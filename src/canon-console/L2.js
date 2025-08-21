/**
 * Canon Console L2 - Active Assistant
 * Context-aware filtering and fix suggestions
 */
import CanonConsoleL1 from './L1.js'; // @doctor:4b-disposers
const __doctorDisposers = [];
export class CanonConsoleL2 extends CanonConsoleL1 {
  constructor() {
    super();
    this.context = null;
    this.filters = { show: [], hide: [] };
    this.suggestions = new Map();

    console.log('🎮 Canon Console L2: Active assistant ready');
  }

  setContext(context) {
    this.context = context;

    const contextFilters = {
      morphing: {
        show: ['morph', 'scroll', 'uniform', 'progress', 'stage'],
        hide: ['particle', 'audio', 'network', 'mouse']
      },
      rendering: {
        show: ['blueprint', 'shader', 'webgl', 'fps', 'particle', 'draw'],
        hide: ['event', 'state', 'audio']
      },
      performance: {
        show: ['fps', 'memory', 'cache', 'quality', 'render', 'frame'],
        hide: ['debug', 'verbose', 'trace']
      },
      events: {
        show: ['emit', 'event', 'stage', 'quality', 'blueprint'],
        hide: ['render', 'particle', 'shader']
      }
    };

    this.filters = contextFilters[context] || { show: [], hide: [] };

    console.log(`🎮 Canon Console: Context set to '${context}'`);
    console.log(`    Showing: ${this.filters.show.join(', ') || 'all'}`);
    console.log(`    Hiding: ${this.filters.hide.join(', ') || 'none'}`);
  }

  shouldShowContextual(message) {
    if (!this.context) return true;

    const msgStr = String(message).toLowerCase();

    // Check hide filters first (blacklist)
    for (const term of this.filters.hide) {
      if (msgStr.includes(term)) {
        return false;
      }
    }

    // If show filters exist, use them (whitelist)
    if (this.filters.show.length > 0) {
      for (const term of this.filters.show) {
        if (msgStr.includes(term)) {
          return true;
        }
      }
      return false; // Hide if no show terms match
    }

    return true; // Show by default if no filters
  }

  shouldShow(level, message) {
    // First check verbosity level
    if (!super.shouldShow(level, message)) {
      return false;
    }

    // Then check context filters
    return this.shouldShowContextual(message);
  }

  detectPattern(message) {
    const pattern = super.detectPattern(message);

    // Generate suggestions for common patterns
    if (pattern.count === 3 && !this.suggestions.has(message)) {
      const suggestion = this.generateSuggestion(message);
      if (suggestion) {
        this.suggestions.set(message, suggestion);
        console.log(`🎮 Canon Console: Suggestion available - ${suggestion.brief}`);
      }
    }

    return pattern;
  }

  generateSuggestion(message) {
    const msgLower = String(message).toLowerCase();

    const suggestionMap = {
      uniform: {
        brief: 'Uniform issue detected',
        fix: 'Check shader uniforms match material uniforms',
        doctorScript: 'doctor-fix-uniforms.cjs'
      },
      null: {
        brief: 'Null reference detected',
        fix: 'Add null checks before accessing properties',
        doctorScript: 'doctor-add-null-checks.cjs'
      },
      undefined: {
        brief: 'Undefined value detected',
        fix: 'Ensure all variables are initialized',
        doctorScript: 'doctor-fix-undefined.cjs'
      },
      failed: {
        brief: 'Operation failure detected',
        fix: 'Check error details and stack trace',
        doctorScript: null
      },
      deprecated: {
        brief: 'Deprecated API usage',
        fix: 'Update to modern API',
        doctorScript: 'doctor-fix-deprecated.cjs'
      }
    };

    for (const [key, suggestion] of Object.entries(suggestionMap)) {
      if (msgLower.includes(key)) {
        return suggestion;
      }
    }

    return null;
  }

  getSuggestions() {
    return Array.from(this.suggestions.entries()).map(([message, suggestion]) => ({
      message: message.slice(0, 50) + '...',
      ...suggestion
    }));
  }

  analyze() {
    const stats = this.getStats();

    return {
      ...stats,
      context: this.context,
      filters: this.filters,
      suggestions: this.getSuggestions()
    };
  }
}

export default CanonConsoleL2; // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}
/**
 * Canon Console L1 - Silent Monitor
 * Basic noise reduction and pattern detection
 */
export class CanonConsoleL1 {
  constructor() {
    this.patterns = new Map();
    this.messageCount = 0;
    this.startTime = Date.now();
    this.verbosity = 'important'; // critical, important, verbose
    this.duplicateThreshold = 5;

    console.log('🎮 Canon Console L1: Silent monitor active');
  }

  shouldShow(level, message) {
    const priority = {
      error: 3,
      warn: 2,
      log: 1,
      info: 0,
      debug: -1,
    };

    const threshold = {
      critical: 3,
      important: 2,
      verbose: 0,
      debug: -1,
    };

    return priority[level] >= threshold[this.verbosity];
  }

  detectPattern(message) {
    this.messageCount++;

    // Create pattern key from first 50 chars
    const key = String(message).slice(0, 50);
    const pattern = this.patterns.get(key) || {
      count: 0,
      first: Date.now(),
      last: null,
      suppressed: false,
    };

    pattern.count++;
    pattern.last = Date.now();

    // Suppress after threshold
    if (pattern.count === this.duplicateThreshold && !pattern.suppressed) {
      pattern.suppressed = true;
      console.warn(
        `🎮 Canon Console: Suppressing repeated message (×${pattern.count}): "${key}..."`
      );
    }

    this.patterns.set(key, pattern);

    return pattern;
  }

  setVerbosity(level) {
    this.verbosity = level;
    console.log(`🎮 Canon Console: Verbosity set to '${level}'`);
  }

  getStats() {
    const runtime = Math.floor((Date.now() - this.startTime) / 1000);
    const topPatterns = Array.from(this.patterns.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([msg, data]) => ({
        message: msg,
        count: data.count,
        suppressed: data.suppressed,
      }));

    return {
      runtime,
      messagesTotal: this.messageCount,
      patternsDetected: this.patterns.size,
      suppressedPatterns: Array.from(this.patterns.values()).filter(p => p.suppressed).length,
      verbosity: this.verbosity,
      topPatterns,
    };
  }

  clearPatterns() {
    this.patterns.clear();
    console.log('🎮 Canon Console: Pattern cache cleared');
  }
}

export default CanonConsoleL1;

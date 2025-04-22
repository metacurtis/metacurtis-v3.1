// src/utils/performance/PerformanceMetrics.js

/**
 * PerformanceMetrics
 *
 * Tracks per‑frame timings, computes a moving average of frame durations,
 * derives average FPS, and detects “jank” frames exceeding a threshold.
 */
export default class PerformanceMetrics {
  /**
   * @param {Object} options
   * @param {number} [options.windowSize=60]      - Number of frames to include in the moving window
   * @param {number} [options.jankThreshold=50]   - Frame duration (ms) above which a frame counts as “jank”
   */
  constructor({ windowSize = 60, jankThreshold = 50 } = {}) {
    this.windowSize = windowSize;
    this.jankThreshold = jankThreshold;
    this.frameTimes = []; // circular buffer of recent frame durations (ms)
    this.jankCount = 0; // count of frames in buffer exceeding jankThreshold
  }

  /**
   * Call once per frame with the delta in milliseconds.
   * Returns an object of current metrics:
   * {
   *   fps,            // average frames per second over the window
   *   avgFrameTime,   // average frame duration in ms
   *   jankCount,      // number of “jank” frames (> threshold) in the window
   *   jankRatio       // fraction of frames considered jank
   * }
   *
   * @param {number} deltaMs  — time since last frame in milliseconds
   */
  tick(deltaMs) {
    // Add this frame’s duration
    this.frameTimes.push(deltaMs);
    if (deltaMs > this.jankThreshold) {
      this.jankCount++;
    }

    // Remove oldest if over window size
    if (this.frameTimes.length > this.windowSize) {
      const removed = this.frameTimes.shift();
      if (removed > this.jankThreshold) {
        this.jankCount--;
      }
    }

    // Compute averages
    const sumMs = this.frameTimes.reduce((sum, t) => sum + t, 0);
    const avgFrameTime = sumMs / this.frameTimes.length;
    const fps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
    const jankRatio = this.frameTimes.length > 0 ? this.jankCount / this.frameTimes.length : 0;

    return {
      fps,
      avgFrameTime,
      jankCount: this.jankCount,
      jankRatio,
    };
  }
}

// src/utils/performance/PerformanceMetrics.js

/**
 * PerformanceMetrics
 *
 * Tracks raw frame‑times, computes moving‑average FPS,
 * exposes statistics and simple jank detection.
 */

export default class PerformanceMetrics {
  /**
   * @param {object} options
   * @param {number} options.windowSize       Number of samples to keep for moving average (default 60)
   * @param {number} options.jankThreshold    ms threshold above which a frame is considered jank (default 50ms)
   */
  constructor({ windowSize = 60, jankThreshold = 50 } = {}) {
    this.windowSize = windowSize;
    this.jankThreshold = jankThreshold;

    // Circular buffer of recent frame durations (ms)
    this.frameTimes = new Array(windowSize).fill(0);
    this.index = 0;
    this.count = 0; // how many real samples we have (≤ windowSize)
  }

  /**
   * Record the duration of the latest frame.
   * @param {number} deltaTime — frame time in seconds (from requestAnimationFrame)
   */
  tick(deltaTime) {
    const ms = deltaTime * 1000;

    // Store
    this.frameTimes[this.index] = ms;
    this.index = (this.index + 1) % this.windowSize;
    if (this.count < this.windowSize) this.count++;

    // Return stats optionally
    return {
      lastFrameMs: ms,
      avgFps: this.getAverageFps(),
      avgFrameTime: this.getAverageFrameTime(),
      jankCount: this.getJankCount(),
    };
  }

  /**
   * Compute average frame time (ms) over the window.
   */
  getAverageFrameTime() {
    if (this.count === 0) return 0;
    const sum = this.frameTimes.slice(0, this.count).reduce((a, b) => a + b, 0);
    return sum / this.count;
  }

  /**
   * Compute moving‑average FPS = 1000 / avgFrameTime.
   */
  getAverageFps() {
    const avgMs = this.getAverageFrameTime();
    return avgMs > 0 ? 1000 / avgMs : 0;
  }

  /**
   * Count how many frames in the buffer exceed the jank threshold.
   */
  getJankCount() {
    if (this.count === 0) return 0;
    return this.frameTimes.slice(0, this.count).filter(ms => ms > this.jankThreshold).length;
  }

  /**
   * Returns an object of current metrics.
   */
  getStats() {
    return {
      frameTimes: this.frameTimes.slice(0, this.count),
      averageFrameMs: this.getAverageFrameTime(),
      averageFps: this.getAverageFps(),
      jankThreshold: this.jankThreshold,
      jankCount: this.getJankCount(),
      windowSize: this.windowSize,
      sampleCount: this.count,
    };
  }

  /**
   * Utility: is the last frame janky?
   */
  isLastFrameJank() {
    const lastIndex = (this.index + this.windowSize - 1) % this.windowSize;
    return this.frameTimes[lastIndex] > this.jankThreshold;
  }
}

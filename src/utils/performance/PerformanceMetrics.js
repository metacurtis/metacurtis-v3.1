// src/utils/performance/PerformanceMetrics.js

/**
 * PerformanceMetrics
 *
 * Tracks the last N frame‐times (ms) and computes:
 *  - fps: 1000 / avg frame time
 *  - avgFrameTime: moving average in ms
 *  - jankCount: number of frames > jankThreshold (ms)
 *  - jankRatio: jankCount / windowSize
 */
export default class PerformanceMetrics {
  /**
   * @param {Object} [opts]
   * @param {number} [opts.windowSize=60]      Number of frames to average over
   * @param {number} [opts.jankThreshold=50]   Frame‐time (ms) above which a frame is considered “janky”
   */
  constructor({ windowSize = 60, jankThreshold = 50 } = {}) {
    this.windowSize = windowSize;
    this.jankThreshold = jankThreshold;
    this.frameTimes = []; // ms
    this.jankCount = 0;
  }

  /**
   * Call once per frame with the delta (seconds) from useFrame.
   * @param {number} deltaSeconds
   */
  tick(deltaSeconds) {
    const ms = deltaSeconds * 1000;
    this.frameTimes.push(ms);

    // Keep window capped
    if (this.frameTimes.length > this.windowSize) {
      const removed = this.frameTimes.shift();
      if (removed > this.jankThreshold) {
        this.jankCount = Math.max(0, this.jankCount - 1);
      }
    }

    // Count jank
    if (ms > this.jankThreshold) {
      this.jankCount++;
    }
  }

  /**
   * Returns the current metrics snapshot.
   * @returns {{ fps: number, avgFrameTime: number, jankCount: number, jankRatio: number }}
   */
  getMetrics() {
    const n = this.frameTimes.length;
    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    const avgFrameTime = n > 0 ? sum / n : 0;
    const fps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
    const jankRatio = n > 0 ? this.jankCount / n : 0;

    return {
      fps,
      avgFrameTime,
      jankCount: this.jankCount,
      jankRatio,
    };
  }
}

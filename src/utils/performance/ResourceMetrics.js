// src/utils/performance/ResourceMetrics.js

import Registry from '@/utils/webgl/ResourceRegistry.js';

/**
 * Reads the global ResourceRegistry to compute stats:
 * - total count per type
 * - delta since last sample
 * - leak detection flag
 */
export default class ResourceMetrics {
  constructor() {
    this.lastCounts = {};
  }

  /**
   * Sample the registry now.
   * @returns {{counts:object, delta:object, leakWarning:boolean}}
   */
  sample() {
    const counts = Registry.getCounts();
    const delta = {};
    let leak = false;

    for (const type in counts) {
      const prev = this.lastCounts[type] || 0;
      delta[type] = counts[type] - prev;
      if (delta[type] > 0) leak = true;
    }

    this.lastCounts = { ...counts };
    return {
      counts,
      delta,
      leakWarning: leak,
    };
  }
}

// src/hooks/useAdaptiveQuality.js
import { useEffect } from 'react';
import usePerformanceStore from '@/stores/performanceStore.js';

/**
 * useAdaptiveQuality
 *
 * Watches the FPS in your performance store and only
 * bumps the quality tier when it actually changes.
 */
export default function useAdaptiveQuality() {
  const setQuality = usePerformanceStore(s => s.setQuality);

  useEffect(() => {
    const unsubscribe = usePerformanceStore.subscribe(state => {
      const { fps } = state.metrics;
      let tier;
      if (fps >= 65) tier = 'ultra';
      else if (fps >= 55) tier = 'high';
      else if (fps >= 45) tier = 'medium';
      else tier = 'low';

      // only update when different
      if (state.quality !== tier) {
        setQuality(tier);
      }
    });

    return unsubscribe;
  }, [setQuality]);
}

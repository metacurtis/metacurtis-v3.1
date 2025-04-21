// src/hooks/useAdaptiveQuality.js

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import AdaptiveQualitySystem, { QualityLevels } from '@/utils/performance/AdaptiveQualitySystem.js';
import PerformanceMetrics from '@/utils/performance/PerformanceMetrics.js';
import usePerformanceStore from '@/stores/performanceStore.js';

/**
 * Default‑exported hook for adaptive quality.
 * Must be used inside an R3F <Canvas> subtree.
 */
export default function useAdaptiveQuality({
  windowSize = 60,
  jankThreshold = 50,
  ultraFps = 65,
  highFps = 55,
  mediumFps = 45,
  initial = QualityLevels.HIGH,
} = {}) {
  // Grab only the setters
  const setMetrics = usePerformanceStore(state => state.setMetrics);
  const setQuality = usePerformanceStore(state => state.setQuality);

  const aqsRef = useRef(null);
  const metricsRef = useRef(null);

  // Initialize metrics & AQS once
  if (!metricsRef.current) {
    metricsRef.current = new PerformanceMetrics({ windowSize, jankThreshold });
  }
  if (!aqsRef.current) {
    aqsRef.current = new AdaptiveQualitySystem({
      windowSize,
      ultraFps,
      highFps,
      mediumFps,
      initial,
    });
    // Seed the store
    setQuality(aqsRef.current.currentLevel);
  }

  // Every R3F frame
  useFrame((_, delta) => {
    // 1) update performance metrics
    const metrics = metricsRef.current.tick(delta);
    // 2) advance quality system
    const newLevel = aqsRef.current.tick();
    // 3) write back to store
    setMetrics(metrics);
    setQuality(newLevel);
  });

  // Return current quality so React re‑renders when it changes
  return usePerformanceStore(state => state.quality);
}

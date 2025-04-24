// src/components/webgl/AQSTicker.jsx
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import AdaptiveQualitySystem from '@/utils/performance/AdaptiveQualitySystem';
import usePerformanceStore from '@/stores/performanceStore';

export default function AQSTicker() {
  const setQuality = usePerformanceStore(s => s.setQuality);

  // create one AQS instance per mount
  const aqs = useMemo(() => new AdaptiveQualitySystem(), []);

  // subscribe to quality‐changes once
  useEffect(() => {
    const unsub = aqs.subscribe(level => setQuality(level));
    return unsub;
  }, [aqs, setQuality]);

  // tick() each R3F frame
  useFrame(() => {
    aqs.tick();
  });

  return null;
}

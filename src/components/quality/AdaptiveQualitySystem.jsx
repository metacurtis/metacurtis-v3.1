// src/components/quality/AdaptiveQualitySystem.jsx
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useQualityStore } from '@/stores/qualityStore';
import usePerformanceStore from '@/stores/performanceStore'; // Default import
import AQSEngine, { QualityLevels } from '@/utils/performance/AdaptiveQualitySystem.js';

export default function AdaptiveQualitySystem_ReactComponent() {
  // Quality Store setters
  const setCurrentQualityTierInStore = useQualityStore(s => s.setCurrentQualityTier);
  const setTargetDprInStore = useQualityStore(s => s.setTargetDpr);
  const setFrameloopModeInStore = useQualityStore(s => s.setFrameloopMode);
  const setParticleCountInStore = useQualityStore(s => s.setParticleCount);

  // Get the tickFrame action from performanceStore
  const tickPerformanceFrame = usePerformanceStore.getState().tickFrame;

  const aqsEngineRef = useRef(null);

  useEffect(() => {
    console.log('AdaptiveQualitySystem_ReactComponent: useEffect mounting, init AQSEngine.');
    try {
      aqsEngineRef.current = new AQSEngine({
        ultraFps: 55,
        highFps: 45,
        mediumFps: 25,
        checkInterval: 1500,
        windowSize: 90,
        hysteresisChecks: 3,
        initialLevel: QualityLevels.HIGH,
      });
      console.log('AdaptiveQualitySystem_ReactComponent: AQSEngine instantiated.');

      const unsubscribeFromAQSEngine = aqsEngineRef.current.subscribe(level => {
        console.log('AdaptiveQualitySystem_ReactComponent: New level from AQSEngine:', level);
        setCurrentQualityTierInStore(level);

        switch (level) {
          case QualityLevels.ULTRA:
            setTargetDprInStore(Math.min(window.devicePixelRatio || 1, 1.5));
            setFrameloopModeInStore('always');
            setParticleCountInStore(8000);
            break;
          case QualityLevels.HIGH:
            setTargetDprInStore(1.0);
            setFrameloopModeInStore('always');
            setParticleCountInStore(5000);
            break;
          case QualityLevels.MEDIUM:
            setTargetDprInStore(0.75);
            setFrameloopModeInStore('demand');
            setParticleCountInStore(2500);
            break;
          case QualityLevels.LOW: // This was the line with the syntax error
          default: // Added default to catch any other case
            setTargetDprInStore(0.5);
            setFrameloopModeInStore('demand');
            setParticleCountInStore(1000);
            break;
        }
      });

      // No separate requestAnimationFrame loop needed here for AQSEngine.tick(),
      // as useFrame will handle the ticking for both engines.
      return () => {
        console.log('AdaptiveQualitySystem_ReactComponent: Cleaning up AQSEngine subscription.');
        unsubscribeFromAQSEngine();
      };
    } catch (e) {
      console.error(
        '!!! CRITICAL ERROR initializing AQSEngine in AdaptiveQualitySystem_ReactComponent:',
        e.message,
        e.stack
      );
    }
  }, [
    setCurrentQualityTierInStore,
    setTargetDprInStore,
    setFrameloopModeInStore,
    setParticleCountInStore,
  ]);

  useFrame((state, delta) => {
    // delta is time since last frame in seconds
    if (aqsEngineRef.current) {
      aqsEngineRef.current.tick(); // AQSEngine uses performance.now() internally
    }
    if (tickPerformanceFrame) {
      tickPerformanceFrame(delta); // Call the action from performanceStore
    }
  });

  return null; // This component does not render any UI itself
}

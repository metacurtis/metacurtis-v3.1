// src/components/quality/AdaptiveQualitySystem.jsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useQualityStore } from '../../stores/qualityStore'; // Adjust path

// Constants for AQS logic
const FPS_UPDATE_INTERVAL = 0.5; // Seconds
const LOW_FPS_THRESHOLD = 40;
const HIGH_FPS_THRESHOLD = 55;
const LOW_DPR = 0.75;
const HIGH_DPR = Math.min(window.devicePixelRatio || 1, 1.5); // Use same cap as store init

export const AdaptiveQualitySystem = () => {
  const setMeasuredFps = useQualityStore(state => state.setMeasuredFps);
  const setTargetDpr = useQualityStore(state => state.setTargetDpr);

  const lastUpdateTime = useRef(0);
  const frameCount = useRef(0);

  useFrame(state => {
    frameCount.current++;
    const time = state.clock.elapsedTime;

    if (time - lastUpdateTime.current >= FPS_UPDATE_INTERVAL) {
      const fps = Math.round(frameCount.current / (time - lastUpdateTime.current));
      setMeasuredFps(fps);
      frameCount.current = 0;
      lastUpdateTime.current = time;

      // Basic AQS Logic using direct state check
      const currentDpr = useQualityStore.getState().targetDpr;
      if (fps < LOW_FPS_THRESHOLD && currentDpr !== LOW_DPR) {
        setTargetDpr(LOW_DPR);
      } else if (fps > HIGH_FPS_THRESHOLD && currentDpr !== HIGH_DPR) {
        setTargetDpr(HIGH_DPR);
      }
    }
  });

  return null;
};

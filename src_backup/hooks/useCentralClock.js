// src/hooks/useCentralClock.js
// 🔗 Central Clock React Integration - Production Ready

import { useEffect, useRef } from 'react';
import { ensureCanonGeometry, createCanonMaterial } from '@/renderer/materialFactory';
import centralEventClock from '@/core/CentralEventClock';

export const useCentralClock = (eventType, callback, deps = []) => {
  const callbackRef = useRef();
  
  useEffect(() => {
    callbackRef.current = callback;
  }, deps);
  
  useEffect(() => {
    const stableCallback = (...args) => {
      if (callbackRef.current) {
        callbackRef.current(...args);
      }
    };
    
    const unsubscribe = centralEventClock.on(eventType, stableCallback);
    return unsubscribe;
  }, [eventType]);
};

export const useCentralTick = (callback, deps = []) => {
  return useCentralClock('tick', callback, deps);
};

export const useFPSWindow = (callback, deps = []) => {
  return useCentralClock('fpsWindow', callback, deps);
};

export const useResize = (callback, deps = []) => {
  return useCentralClock('resize', callback, deps);
};

export const useVisibility = (callback, deps = []) => {
  return useCentralClock('visibility', callback, deps);
};

export const useCentralClockBootstrap = () => {
  useEffect(() => {
    centralEventClock.start();
    return () => {
      centralEventClock.stop();
    };
  }, []);
};

export default useCentralClock;

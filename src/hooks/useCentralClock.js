// src/hooks/useCentralClock.js
// 🔗 Central Clock React Integration - Production Ready

import { useEffect, useRef } from 'react';
import centralEventClock from '@/core/CentralEventClock'; // @doctor:4b-disposers
const __doctorDisposers = [];
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

export default useCentralClock; // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}
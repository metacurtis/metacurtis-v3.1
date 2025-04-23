// src/hooks/useResourceTracker.js
import { useRef, useEffect } from 'react';
import ResourceTracker from '@/utils/webgl/ResourceTracker.js';

export default function useResourceTracker() {
  const trackerRef = useRef(null);

  if (!trackerRef.current) {
    // only construct once
    trackerRef.current = new ResourceTracker();
  }

  useEffect(() => {
    // on unmount, dispose
    return () => {
      trackerRef.current.dispose();
    };
  }, []);

  return trackerRef.current;
}

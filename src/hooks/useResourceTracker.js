// src/hooks/useResourceTracker.js

import { useRef, useEffect } from 'react';
import ResourceTracker from '@/utils/webgl/ResourceTracker.js';

/**
 * Hook that provides a ResourceTracker instance
 * and automatically disposes on unmount.
 */
export default function useResourceTracker() {
  const ref = useRef(null);
  if (!ref.current) {
    ref.current = new ResourceTracker();
  }

  useEffect(() => {
    return () => {
      ref.current.dispose();
      ref.current = null;
    };
  }, []);

  return ref.current;
}

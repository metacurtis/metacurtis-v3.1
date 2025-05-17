// src/hooks/useResourceTracker.js
import { useRef, useEffect } from 'react';
// Ensure this path correctly points to your ResourceTracker CLASS definition
import ResourceTrackerClass from '@/utils/webgl/ResourceTracker.js';

/**
 * Custom React hook to manage an instance of the ResourceTracker class.
 * It creates a tracker instance on mount and disposes of it on unmount.
 * @returns {ResourceTrackerClass} The instance of the ResourceTracker.
 */
export default function useResourceTracker() {
  // useRef to hold the tracker instance across renders without causing re-renders
  const trackerInstanceRef = useRef(null);

  // Initialize the tracker instance only once
  if (trackerInstanceRef.current === null) {
    console.log('useResourceTracker: Creating new ResourceTrackerClass instance.');
    trackerInstanceRef.current = new ResourceTrackerClass();
  }

  // useEffect for cleanup: dispose of tracked resources when the component unmounts
  useEffect(() => {
    const currentTrackerInstance = trackerInstanceRef.current;
    // The cleanup function returned by useEffect
    return () => {
      if (currentTrackerInstance && typeof currentTrackerInstance.dispose === 'function') {
        console.log('useResourceTracker: Disposing resources via tracker instance.');
        currentTrackerInstance.dispose();
      }
      trackerInstanceRef.current = null; // Optional: clear ref on unmount
    };
  }, []); // Empty dependency array ensures this effect runs only on mount and unmount

  // Return the stable tracker instance
  return trackerInstanceRef.current;
}

import { useEffect, useState, useCallback } from 'react';
import { Canonical } from '../config/canonical/canonicalAuthority.js';

export function useMemoryFragments(stageName, scrollPercent, activeNarrativeSegment) {
  const [activeFragments, setActiveFragments] = useState([]);
  const [fragmentStates, setFragmentStates] = useState({});

  useEffect(() => {
    const active = Canonical.getActiveFragments(stageName, scrollPercent, activeNarrativeSegment);
    setActiveFragments(active);
    
    // Initialize states for new fragments
    active.forEach(frag => {
      if (!fragmentStates[frag.id]) {
        setFragmentStates(prev => ({
          ...prev,
          [frag.id]: { state: 'pending', startTime: null }
        }));
      }
    });
  }, [stageName, scrollPercent, activeNarrativeSegment]);

  const triggerFragment = useCallback((fragmentId) => {
    const fragment = activeFragments.find(f => f.id === fragmentId);
    if (!fragment) return;

    // Update state
    setFragmentStates(prev => ({
      ...prev,
      [fragmentId]: { state: 'triggering', startTime: Date.now() }
    }));

    // Emit particle effect
    if (fragment.particleEffect?.onTrigger) {
      window.dispatchEvent(new CustomEvent('fragmentParticleEffect', {
        detail: {
          fragmentId,
          effect: fragment.particleEffect.onTrigger,
          stage: stageName
        }
      }));
    }

    // Play audio
    if (fragment.audio?.onTrigger) {
      // Audio implementation would go here
      console.log(`🔊 Playing: ${fragment.audio.onTrigger}`);
    }

    // Transition to active
    setTimeout(() => {
      setFragmentStates(prev => ({
        ...prev,
        [fragmentId]: { ...prev[fragmentId], state: 'active' }
      }));
    }, 500);
  }, [activeFragments, stageName]);

  const dismissFragment = useCallback((fragmentId) => {
    const fragment = activeFragments.find(f => f.id === fragmentId);
    
    setFragmentStates(prev => ({
      ...prev,
      [fragmentId]: { ...prev[fragmentId], state: 'dismissing' }
    }));

    // Emit dismiss effect
    if (fragment?.particleEffect?.onDismiss) {
      window.dispatchEvent(new CustomEvent('fragmentParticleEffect', {
        detail: {
          fragmentId,
          effect: fragment.particleEffect.onDismiss,
          stage: stageName
        }
      }));
    }

    setTimeout(() => {
      setFragmentStates(prev => ({
        ...prev,
        [fragmentId]: { ...prev[fragmentId], state: 'completed' }
      }));
    }, 500);
  }, [activeFragments, stageName]);

  return {
    activeFragments,
    fragmentStates,
    triggerFragment,
    dismissFragment
  };
}

export default useMemoryFragments;

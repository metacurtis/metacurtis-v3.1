// Generic hook for subscribing to atoms
import { useState, useEffect } from 'react';

export function useAtom(atom) {
  const [state, setState] = useState(atom.getState());
  
  useEffect(() => {
    // Subscribe to atom changes
    const unsubscribe = atom.subscribe(setState);
    
    // Cleanup on unmount
    return unsubscribe;
  }, [atom]);
  
  return state;
}

// Convenience hook for atom values with selector
export function useAtomValue(atom, selector) {
  const state = useAtom(atom);
  
  if (selector && typeof selector === 'function') {
    return selector(state);
  }
  
  return state;
}

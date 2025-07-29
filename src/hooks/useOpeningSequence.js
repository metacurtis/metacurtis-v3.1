import { useState, useEffect } from 'react';
import { THEATER_CONSTANTS as TC } from '@/components/consciousness/constants';

export function useOpeningSequence(onComplete) {
  const [phase, setPhase] = useState('black');
  const [showCursor, setShowCursor] = useState(false);
  const [terminalLines, setTerminalLines] = useState([]);
  const [screenFillActive, setScreenFillActive] = useState(false);

  useEffect(() => {
    const sequence = [];
    let time = TC.OPENING_BLACK_DURATION;

    // Build sequence
    sequence.push({
      delay: time,
      action: () => setPhase('cursor'),
    });

    // ... rest of sequence logic

    const timeouts = sequence.map(({ delay, action }) => setTimeout(action, delay));

    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  return {
    phase,
    showCursor,
    terminalLines,
    screenFillActive,
    isComplete: phase === 'complete',
  };
}

import { useEffect, useRef, useState } from 'react';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';
import { useAtomValue, stageAtom } from '@/state/atoms';

const CLIMAX_STAGE = 'transcendence';
const TRIGGER_DELAY_MS = 35000;

export default function ClimaxSequenceController() {
  const currentStage = useAtomValue(stageAtom, (state) => state.currentStage);
  const [status, setStatus] = useState('idle');

  const triggerTimerRef = useRef(null);
  const armedRef = useRef(false);

  // Listen for engine-emitted climax steps for diagnostics/UI
  useEffect(() => {
    const off = BeatBus.on?.(EVENTS.CLIMAX_STEP, (payload = {}) => {
      if (!payload?.step) return;
      setStatus(payload.step);
    });
    return () => off?.();
  }, []);

  // Arm climax trigger when stage == transcendence
  useEffect(() => {
    if (triggerTimerRef.current) {
      clearTimeout(triggerTimerRef.current);
      triggerTimerRef.current = null;
    }

    if (currentStage !== CLIMAX_STAGE) {
      armedRef.current = false;
      setStatus('idle');
      return undefined;
    }

    if (armedRef.current) {
      setStatus((prev) => (prev === 'idle' ? 'arming' : prev));
      return undefined;
    }

    armedRef.current = true;
    setStatus('arming');
    console.log('🎬 Climax sequence armed for transcendence');

    triggerTimerRef.current = setTimeout(() => {
      console.log('🎬 CLIMAX SEQUENCE TRIGGERED @ 35 s');
      BeatBus.emit?.(EVENTS.START_CLIMAX);
      setStatus('triggered');
    }, TRIGGER_DELAY_MS);

    return () => {
      if (triggerTimerRef.current) {
        clearTimeout(triggerTimerRef.current);
        triggerTimerRef.current = null;
      }
    };
  }, [currentStage]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (triggerTimerRef.current) {
      clearTimeout(triggerTimerRef.current);
      triggerTimerRef.current = null;
    }
  }, []);

  if (currentStage !== CLIMAX_STAGE) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        padding: '0.5rem 1rem',
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#fff',
        fontSize: 12,
        fontFamily: 'monospace',
        borderRadius: '4px',
        zIndex: 1000,
        pointerEvents: 'none',
        textTransform: 'uppercase',
      }}
    >
      🎬 Climax: {status}
    </div>
  );
}

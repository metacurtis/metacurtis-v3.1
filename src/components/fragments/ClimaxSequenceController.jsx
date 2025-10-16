import { useEffect, useRef, useState } from 'react';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';
import { useAtomValue, stageAtom } from '@/state/atoms';

const CLIMAX_STAGE = 'transcendence';
const TRIGGER_DELAY_MS = 35000;
const CHECK_INTERVAL_MS = 100;

const SEQUENCE = [
  { step: 'dissolve', duration: 2000, emit: true },
  { step: 'portrait', duration: 3000, emit: true },
  { step: 'portrait_hold', duration: 2000, emit: false },
  { step: 'name', duration: 2000, emit: true, payload: { text: 'CURTIS WHORTON' } },
  { step: 'title', duration: 2000, emit: true, payload: { text: 'AI-NATIVE ENGINEER' } },
  { step: 'qr', duration: 3000, emit: true, payload: { url: 'https://curtisworton.com' } },
];

function nowMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

export default function ClimaxSequenceController() {
  const currentStage = useAtomValue(stageAtom, (state) => state.currentStage);
  const [sequenceActive, setSequenceActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);

  const stageEntryTimeRef = useRef(null);
  const sequenceTriggeredRef = useRef(false);
  const monitorIntervalRef = useRef(null);
  const timeoutsRef = useRef([]);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((timeoutId) => {
      if (timeoutId) clearTimeout(timeoutId);
    });
    timeoutsRef.current = [];
  };

  const clearMonitorInterval = () => {
    if (monitorIntervalRef.current) {
      clearInterval(monitorIntervalRef.current);
      monitorIntervalRef.current = null;
    }
  };

  const resetState = () => {
    clearMonitorInterval();
    clearAllTimeouts();
    setSequenceActive(false);
    setCurrentStep(null);
    sequenceTriggeredRef.current = false;
    stageEntryTimeRef.current = currentStage === CLIMAX_STAGE ? nowMs() : null;
  };

  useEffect(() => {
    resetState();
    if (currentStage === CLIMAX_STAGE) {
      console.log('🎬 Climax sequence armed for transcendence');
    }
    return () => {
      clearMonitorInterval();
      clearAllTimeouts();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStage]);

  useEffect(() => {
    if (currentStage !== CLIMAX_STAGE) return;
    if (sequenceTriggeredRef.current) return;

    monitorIntervalRef.current = setInterval(() => {
      if (sequenceTriggeredRef.current) {
        clearMonitorInterval();
        return;
      }
      if (stageEntryTimeRef.current == null) {
        stageEntryTimeRef.current = nowMs();
        return;
      }
      const elapsed = nowMs() - stageEntryTimeRef.current;
      if (elapsed >= TRIGGER_DELAY_MS) {
        sequenceTriggeredRef.current = true;
        clearMonitorInterval();
        setSequenceActive(true);
        console.log('🎬 CLIMAX SEQUENCE TRIGGERED @', Math.round(elapsed / 1000), 's');
        triggerSequence();
      }
    }, CHECK_INTERVAL_MS);

    return clearMonitorInterval;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStage]);

  const triggerSequence = () => {
    console.log('🎬 Climax sequence starting...');
    const scheduleStep = (index) => {
      if (index >= SEQUENCE.length) {
        const finalTimeout = setTimeout(() => {
          setCurrentStep('complete');
          console.log('🎬 Climax sequence COMPLETE');
        }, 0);
        timeoutsRef.current.push(finalTimeout);
        return;
      }

      const { step, duration, emit = true, payload = {} } = SEQUENCE[index];
      setCurrentStep(step);
      if (emit) {
        BeatBus.emit?.(EVENTS.CLIMAX_STEP, {
          step,
          duration,
          timestamp: nowMs(),
          ...payload,
        });
      }

      const timeoutId = setTimeout(() => {
        scheduleStep(index + 1);
      }, duration);
      timeoutsRef.current.push(timeoutId);
    };

    scheduleStep(0);
  };

  if (!sequenceActive) return null;

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
      }}
    >
      🎬 Climax: {currentStep || 'arming'}
    </div>
  );
}

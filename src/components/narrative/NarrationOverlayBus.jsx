import { useCallback, useEffect, useRef, useState } from 'react';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';

const DEFAULT_TYPEWRITER_SPEED_MS = 50;
const GRACE_WINDOW_MS = 800;

export default function NarrationOverlayBus() {
  const [visible, setVisible] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [incomingText, setIncomingText] = useState('');

  const graceTimerRef = useRef(null);
  const typeTimerRef = useRef(null);
  const indexRef = useRef(0);
  const speedRef = useRef(DEFAULT_TYPEWRITER_SPEED_MS);

  const clearGraceTimer = useCallback(() => {
    if (graceTimerRef.current) {
      clearTimeout(graceTimerRef.current);
      graceTimerRef.current = null;
    }
  }, []);

  const clearTypeTimer = useCallback(() => {
    if (typeTimerRef.current) {
      clearTimeout(typeTimerRef.current);
      typeTimerRef.current = null;
    }
  }, []);

  const resetOverlay = useCallback(() => {
    clearGraceTimer();
    clearTypeTimer();
    indexRef.current = 0;
    setIncomingText('');
    setDisplayText('');
  }, [clearGraceTimer, clearTypeTimer]);

  const scheduleGraceHide = useCallback(() => {
    clearGraceTimer();
    graceTimerRef.current = setTimeout(() => {
      graceTimerRef.current = null;
      resetOverlay();
      setVisible(false);
    }, GRACE_WINDOW_MS);
  }, [clearGraceTimer, resetOverlay]);

  const typewriterStep = useCallback(() => {
    clearTypeTimer();
    if (!incomingText) {
      setDisplayText('');
      return;
    }

    if (indexRef.current >= incomingText.length) {
      setDisplayText(incomingText);
      return;
    }

    const nextIndex = indexRef.current + 1;
    setDisplayText(incomingText.slice(0, nextIndex));
    indexRef.current = nextIndex;

    if (indexRef.current < incomingText.length) {
      typeTimerRef.current = setTimeout(typewriterStep, speedRef.current);
    }
  }, [incomingText, clearTypeTimer]);

  useEffect(() => {
    indexRef.current = 0;
    clearTypeTimer();
    if (!incomingText) {
      setDisplayText('');
      return;
    }

    typeTimerRef.current = setTimeout(typewriterStep, speedRef.current);
    return () => clearTypeTimer();
  }, [incomingText, typewriterStep, clearTypeTimer]);

  useEffect(() => {
    const isOpeningBlocked = () =>
      typeof window !== 'undefined' &&
      window.theaterDirector?.isOpeningInProgress?.() === true;

    const handleStart = (payload = {}) => {
      if (isOpeningBlocked()) return;
      clearGraceTimer();
      resetOverlay();
      setVisible(true);
      if (payload?.prefill) {
        setIncomingText(String(payload.prefill));
      }
    };

    const handleLine = (payload = {}) => {
      if (!payload || isOpeningBlocked()) return;
      const text = typeof payload.text === 'string' ? payload.text : '';
      const speedMs = Number.isFinite(payload.speedMs) && payload.speedMs > 0
        ? Math.max(10, payload.speedMs)
        : DEFAULT_TYPEWRITER_SPEED_MS;

      speedRef.current = speedMs;
      clearGraceTimer();
      clearTypeTimer();
      indexRef.current = 0;
      setVisible(true);
      setIncomingText(text);
    };

    const handleStop = () => {
      if (!visible) return;
      scheduleGraceHide();
    };

    const handleCleanup = () => {
      scheduleGraceHide();
    };

    const offStart = BeatBus.on?.(EVENTS.START_NARRATIVE, handleStart);
    const offLine = BeatBus.on?.(EVENTS.NARRATIVE_LINE, handleLine);
    const offStop = BeatBus.on?.(EVENTS.NARRATION_STOPPED, handleStop);
    const offCleanup = BeatBus.on?.(EVENTS.NARRATION_CLEANUP, handleCleanup);

    return () => {
      offStart?.();
      offLine?.();
      offStop?.();
      offCleanup?.();
      resetOverlay();
    };
  }, [clearGraceTimer, clearTypeTimer, resetOverlay, scheduleGraceHide, visible]);

  if (!visible) return null;

  return (
    <div
      data-testid="narration-overlay"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 24,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.65)',
          color: '#fff',
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          fontSize: 16,
          lineHeight: 1.45,
          padding: '12px 18px',
          borderRadius: 10,
          maxWidth: 960,
          width: 'calc(100% - 56px)',
          textAlign: 'center',
          pointerEvents: 'auto',
        }}
      >
        {displayText}
        <span style={{ opacity: 0.75 }}>|</span>
      </div>
    </div>
  );
}

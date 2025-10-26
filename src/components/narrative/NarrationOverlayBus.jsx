import { useCallback, useEffect, useRef, useState } from 'react';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';
import { loadOverlayConfig } from '@/config/overlay-config.js';
import { OverlayStateMachine, STATES } from './overlay/OverlayStateMachine.js';
import { validateEvent } from './overlay/OverlayContracts.js';
import { OverlayDiagnostics } from './overlay/OverlayDiagnostics.js';
import { OverlayTimers } from './overlay/OverlayTimers.js';
import { OverlayDeduplicator } from './overlay/OverlayDeduplication.js';

console.log('🎙️ [NarrationOverlay] Loaded (v2.0 - State Machine)');

// Module-singletons to preserve state across hot reloads
const config = loadOverlayConfig();
const stateMachine = new OverlayStateMachine();
const diagnostics = new OverlayDiagnostics();
const timers = new OverlayTimers();
const deduplicator = new OverlayDeduplicator(config.deduplication);

// Expose diagnostics for investigators
if (typeof window !== 'undefined') {
  window.__narrationOverlayDiagnostic = diagnostics;
  window.__narrationOverlayState = stateMachine;
  window.__narrationOverlayTimers = timers;
  window.__narrationOverlayDeduplicator = deduplicator;
}

export default function NarrationOverlayBus() {
  const [visible, setVisible] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [incomingText, setIncomingText] = useState('');

  const indexRef = useRef(0);
  const speedRef = useRef(config.typewriterSpeedMs);

  useEffect(() => {
    const unsubscribe = stateMachine.subscribe(() => diagnostics.recordStateTransition());
    return unsubscribe;
  }, []);

  const clearGraceTimer = useCallback(() => {
    timers.clear('grace');
  }, []);

  const clearTypeTimer = useCallback(() => {
    timers.clear('typewriter');
  }, []);

  const resetOverlay = useCallback(() => {
    clearGraceTimer();
    clearTypeTimer();
    indexRef.current = 0;
    setIncomingText('');
    setDisplayText('');

    // Force state to idle (may already be idle during rapid resets)
    if (stateMachine.getState() !== STATES.IDLE) {
      stateMachine.forceState(STATES.IDLE, 'reset');
    }
  }, [clearGraceTimer, clearTypeTimer]);

  const scheduleGraceHide = useCallback(() => {
    clearGraceTimer();
    stateMachine.transitionTo(STATES.GRACE_PERIOD, { reason: 'narration_stopped' });
    timers.set('grace', () => {
      stateMachine.transitionTo(STATES.HIDING, { reason: 'grace_expired' });
      resetOverlay();
      setVisible(false);
    }, config.graceWindowMs);
  }, [clearGraceTimer, resetOverlay]);

  const typewriterStep = useCallback(() => {
    clearTypeTimer();

    if (!incomingText) {
      setDisplayText('');
      stateMachine.transitionTo(STATES.IDLE, { reason: 'no_text' });
      return;
    }

    if (indexRef.current >= incomingText.length) {
      setDisplayText(incomingText);
      stateMachine.transitionTo(STATES.COMPLETE, {
        reason: 'typing_complete',
        length: incomingText.length,
      });
      diagnostics.recordDisplay(incomingText.length);
      return;
    }

    const nextIndex = indexRef.current + 1;
    setDisplayText(incomingText.slice(0, nextIndex));
    indexRef.current = nextIndex;

    if (indexRef.current < incomingText.length) {
      timers.set('typewriter', typewriterStep, speedRef.current);
    }
  }, [incomingText, clearTypeTimer]);

  useEffect(() => {
    indexRef.current = 0;
    clearTypeTimer();

    if (!incomingText) {
      setDisplayText('');
      return;
    }

    stateMachine.transitionTo(STATES.TYPING, {
      reason: 'new_text',
      length: incomingText.length,
    });

    timers.set('typewriter', typewriterStep, speedRef.current);
    return () => clearTypeTimer();
  }, [incomingText, typewriterStep, clearTypeTimer]);

  useEffect(() => {
    const isOpeningBlocked = () =>
      typeof window !== 'undefined' &&
      window.theaterDirector?.isOpeningInProgress?.() === true;

    const handleStart = (payload = {}) => {
      const validation = validateEvent('START_NARRATIVE', payload);
      diagnostics.recordEvent('START_NARRATIVE', payload, validation.valid);

      if (!validation.valid) {
        console.error('❌ [NarrationOverlay] Invalid START_NARRATIVE:', validation.reason);
        diagnostics.recordError('INVALID_EVENT', { event: 'START_NARRATIVE', ...validation });
        return;
      }

      if (isOpeningBlocked()) {
        diagnostics.recordError('BLOCKED', { reason: 'opening_in_progress' });
        return;
      }

      const dupCheck = deduplicator.check('START_NARRATIVE', payload);
      if (dupCheck.isDuplicate) {
        diagnostics.recordDuplicateIgnored();
        diagnostics.recordError('DUPLICATE_EVENT', { event: 'START_NARRATIVE', reason: dupCheck.reason });
        return;
      }

      clearGraceTimer();
      resetOverlay();
      setVisible(true);
      stateMachine.transitionTo(STATES.STARTING, { source: payload.source });

      if (payload?.prefill) {
        setIncomingText(String(payload.prefill));
      }
    };

    const handleLine = (payload = {}) => {
      const validation = validateEvent('NARRATIVE_LINE', payload);
      diagnostics.recordEvent('NARRATIVE_LINE', payload, validation.valid);

      if (!validation.valid) {
        console.error('❌ [NarrationOverlay] Invalid NARRATIVE_LINE:', validation.reason);
        diagnostics.recordError('INVALID_EVENT', { event: 'NARRATIVE_LINE', ...validation });
        return;
      }

      if (isOpeningBlocked()) {
        diagnostics.recordError('BLOCKED', { reason: 'opening_in_progress' });
        return;
      }

      const dupCheck = deduplicator.check('NARRATIVE_LINE', payload);
      if (dupCheck.isDuplicate) {
        diagnostics.recordDuplicateIgnored();
        diagnostics.recordError('DUPLICATE_EVENT', { event: 'NARRATIVE_LINE', reason: dupCheck.reason });
        return;
      }

      const text = payload.text;
      const speedMs =
        Number.isFinite(payload.speedMs) && payload.speedMs > 0
          ? Math.max(10, payload.speedMs)
          : config.typewriterSpeedMs;

      speedRef.current = speedMs;
      clearGraceTimer();
      clearTypeTimer();
      indexRef.current = 0;
      setVisible(true);
      setIncomingText(text);
    };

    const handleStop = () => {
      diagnostics.recordEvent('NARRATION_STOPPED', {}, true);

      if (!visible) return;
      scheduleGraceHide();
    };

    const handleCleanup = () => {
      diagnostics.recordEvent('NARRATION_CLEANUP', {}, true);
      scheduleGraceHide();
    };

    const offStart = BeatBus.on?.(EVENTS.START_NARRATIVE, handleStart);
    const offLine = BeatBus.on?.(EVENTS.NARRATIVE_LINE, handleLine);
    const offStop = BeatBus.on?.(EVENTS.NARRATION_STOPPED, handleStop);
    const offCleanup = BeatBus.on?.(EVENTS.NARRATION_CLEANUP, handleCleanup);

    return () => {
      console.log('🧹 [NarrationOverlay] Cleanup: clearing timers + resetting diagnostics');
      timers.clearAll();
      deduplicator.reset();
      offStart?.();
      offLine?.();
      offStop?.();
      offCleanup?.();
      setVisible(false);
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
        zIndex: config.style.zIndex,
      }}
    >
      <div
        style={{
          background: config.style.background,
          color: config.style.color,
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          fontSize: config.style.fontSize,
          lineHeight: config.style.lineHeight,
          padding: config.style.padding,
          borderRadius: config.style.borderRadius,
          maxWidth: config.style.maxWidth,
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

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
  const overlayStageRef = useRef(null);
  // Track the current narration run so stale events from prior runs don't hide/override.
  const overlayRunIdRef = useRef(null);
  // Track the current narration run so stale events from prior runs don't hide/override.
  const overlayRunIdRef = useRef(null);

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
    overlayRunIdRef.current = null;
    overlayRunIdRef.current = null;

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

    // Immediately render first character to avoid a blank frame between beats.
    // We deliberately do NOT clear displayText first here, to avoid a single
    // frame of empty overlay between lines.
    const firstChar = incomingText.slice(0, 1);
    setDisplayText(firstChar);
    indexRef.current = 1;

    if (incomingText.length > 1) {
      timers.set('typewriter', typewriterStep, speedRef.current);
    } else {
      // Single-character line: mark complete immediately
      diagnostics.recordDisplay(incomingText.length);
      stateMachine.transitionTo(STATES.COMPLETE, {
        reason: 'typing_complete_single_char',
        length: incomingText.length,
      });
    }
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

      const stageFromPayload = payload.stage || payload.currentStage || null;
      if (stageFromPayload) {
        overlayStageRef.current = stageFromPayload;
      }

      // Prime state, but do not show overlay until a line arrives.
      // START_NARRATIVE is a lifecycle signal only; NARRATIVE_LINE is the
      // sole authority for visible text to avoid prefill-based flashes.
      clearGraceTimer();
      resetOverlay();
      stateMachine.transitionTo(STATES.STARTING, { source: payload.source });
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

      const stageFromPayload = payload.stage || payload.currentStage || null;
      if (stageFromPayload) {
        overlayStageRef.current = stageFromPayload;
      }

      const runIdFromPayload =
        typeof payload.runId === 'number' ? payload.runId : null;
      if (runIdFromPayload !== null) {
        if (overlayRunIdRef.current === null) {
          overlayRunIdRef.current = runIdFromPayload;
        } else if (overlayRunIdRef.current !== runIdFromPayload) {
          diagnostics.recordError('LINE_IGNORED_STALE_RUN', {
            expectedRunId: overlayRunIdRef.current,
            receivedRunId: runIdFromPayload,
          });
          return;
        }
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
      // LINE is the authority to show overlay
      setVisible(true);
      setIncomingText(text);
    };

    const handleStop = (payload = {}) => {
      diagnostics.recordEvent('NARRATION_STOPPED', payload, true);

      if (payload?.preserveStage) {
        diagnostics.recordError('STOP_IGNORED_PRESERVE_STAGE', payload);
        return;
      }

      const stageFromPayload = payload.stage || payload.currentStage || null;
      const overlayStage = overlayStageRef.current;
      if (stageFromPayload && overlayStage && stageFromPayload !== overlayStage) {
        diagnostics.recordError('STOP_IGNORED_OTHER_STAGE', {
          payloadStage: stageFromPayload,
          overlayStage,
        });
        return;
      }

      const runIdFromPayload =
        typeof payload.runId === 'number' ? payload.runId : null;
      if (
        overlayRunIdRef.current !== null &&
        runIdFromPayload !== null &&
        overlayRunIdRef.current !== runIdFromPayload
      ) {
        diagnostics.recordError('STOP_IGNORED_STALE_RUN', {
          payloadRunId: runIdFromPayload,
          overlayRunId: overlayRunIdRef.current,
        });
        return;
      }

      const reason = payload.reason || '';
      const isHardEnd =
        reason === 'complete' ||
        reason === 'skip' ||
        reason === 'user' ||
        reason === 'external';

      if (!isHardEnd) {
        diagnostics.recordError('STOP_IGNORED_REASON', { reason, payload });
        return;
      }

      if (!visible) return;
      scheduleGraceHide();
    };

    const handleCleanup = (payload = {}) => {
      diagnostics.recordEvent('NARRATION_CLEANUP', payload, true);
      if (payload?.preserveStage) {
        diagnostics.recordError('CLEANUP_IGNORED_PRESERVE_STAGE', payload);
        return;
      }

      const stageFromPayload = payload.stage || payload.currentStage || null;
      const overlayStage = overlayStageRef.current;
      if (stageFromPayload && overlayStage && stageFromPayload !== overlayStage) {
        diagnostics.recordError('CLEANUP_IGNORED_OTHER_STAGE', {
          payloadStage: stageFromPayload,
          overlayStage,
        });
        return;
      }

      const runIdFromPayload =
        typeof payload.runId === 'number' ? payload.runId : null;
      if (
        overlayRunIdRef.current !== null &&
        runIdFromPayload !== null &&
        overlayRunIdRef.current !== runIdFromPayload
      ) {
        diagnostics.recordError('CLEANUP_IGNORED_STALE_RUN', {
          payloadRunId: runIdFromPayload,
          overlayRunId: overlayRunIdRef.current,
        });
        return;
      }

      const reason = payload.reason || '';
      const isHardEnd =
        reason === 'complete' ||
        reason === 'skip' ||
        reason === 'user' ||
        reason === 'external';

      if (!isHardEnd) {
        diagnostics.recordError('CLEANUP_IGNORED_REASON', { reason, payload });
        return;
      }
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

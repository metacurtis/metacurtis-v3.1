import { useCallback, useEffect, useRef, useState } from 'react';
import { useAtomValue, stageAtom } from '@/state/atoms';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import { getNarrationSegments, getNarrativeForStage } from '@/config/sst3/narrative-dialogue.js';
import {
  exposeControlSurface,
  exposeDiagnostics,
  revokeControlSurface,
  isControlAllowed,
} from '@/utils/runtimeGuards.js';
import { NarrationFragment } from '../fragments/NarrationFragment.jsx';

const DEBUG_NARRATION = true;
const DEFAULT_CHARS_PER_SECOND = 15;
const SKIP_KEYS = new Set([' ', 'Spacebar', 'Space']);
const AUTO_ADVANCE_DELAY_MS = 3000;
const AUTO_ADVANCE_RETRY_MS = 500;
const VALID_START_SOURCES = new Set([
  'opening_complete',
  'user_action',
  'auto_advance',
  'director_stage_change',
]);

// 🔬 DIAGNOSTIC: Narration lifecycle tracking
let componentInstanceCounter = 0;
const narrationDiagnostic = {
  mountHistory: [],
  unmountHistory: [],
  stageChangeEvents: [],
  completionEvents: [],
  log(event, data) {
    console.log(`🔬 [NARRATION] ${event}:`, data);
    if (typeof window !== 'undefined' && window.__autoAdvanceDiagnostic) {
      window.__autoAdvanceDiagnostic.log(`NARRATION_${event}`, data);
    }
  },
};
if (typeof window !== 'undefined') {
  window.__narrationDiagnostic = narrationDiagnostic;
}

const CANONICAL_STAGE_ORDER = Array.isArray(Canonical?.stageOrder)
  ? Canonical.stageOrder
  : Object.keys(Canonical?.stages || {});

function resolveStageKey(candidate, fallback = 'genesis') {
  if (typeof candidate === 'string') {
    const trimmed = candidate.trim();
    if (trimmed) {
      const lower = trimmed.toLowerCase();
      const match = CANONICAL_STAGE_ORDER.find((stage) => stage.toLowerCase() === lower);
      if (match) return match;
    }
  }
  if (typeof fallback === 'string' && fallback.trim()) {
    const lowerFallback = fallback.trim().toLowerCase();
    const match = CANONICAL_STAGE_ORDER.find((stage) => stage.toLowerCase() === lowerFallback);
    if (match) return match;
  }
  return CANONICAL_STAGE_ORDER[0] || 'genesis';
}

function normalizeSegments(segments = []) {
  return segments
    .filter(Boolean)
    .map((segment) => ({
      ...segment,
      timing: {
        start: Math.max(0, Number(segment?.timing?.start) || 0),
        duration: Math.max(0, Number(segment?.timing?.duration) || 0),
      },
    }))
    .sort((a, b) => (a.timing.start ?? 0) - (b.timing.start ?? 0));
}

export default function NarrationController({ defaultCharsPerSecond = DEFAULT_CHARS_PER_SECOND }) {
  const currentStage = useAtomValue(stageAtom, (state) => state.currentStage);
  const autoAdvanceEnabled = useAtomValue(stageAtom, (state) => state.autoAdvanceEnabled);
  const [activeNarration, setActiveNarration] = useState(null);

  const componentMountIdRef = useRef(null);
  const effectRunCounterRef = useRef(0);

  const timersRef = useRef(new Set());
  const activeStageRef = useRef(null);
  const activeSegmentRef = useRef(null);
  const totalSegmentsRef = useRef(0);
  const completedSegmentsRef = useRef(0);
  const skipRequestedRef = useRef(false);
  const previousOverflowRef = useRef(null);
  const autoAdvanceEnabledRef = useRef(autoAdvanceEnabled);
  const prevDepsRef = useRef({});
  const segmentTokenRef = useRef(0);
  const hasTriggeredAutoAdvanceRef = useRef(false);
  const startedStagesRef = useRef(new Set());
  const pendingStartRef = useRef(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current.clear();
  }, []);

  const unlockScroll = useCallback(() => {
    if (typeof document === 'undefined') return;
    if (previousOverflowRef.current !== null) {
      try {
        document.body.style.overflow = previousOverflowRef.current || '';
      } catch {}
      if (DEBUG_NARRATION) {
        console.log('🔓 [SCROLL UNLOCKED]');
      }
      previousOverflowRef.current = null;
    }
  }, []);

  const lockScroll = useCallback(() => {
    if (typeof document === 'undefined') return;
    if (previousOverflowRef.current !== null) return;
    try {
      previousOverflowRef.current = document.body.style.overflow || '';
      document.body.style.overflow = 'hidden';
    } catch {}
    if (DEBUG_NARRATION) {
      console.log('🔒 [SCROLL LOCKED]');
    }
  }, []);

  const resetState = useCallback(
    ({ unlock = true, preserveStage = false } = {}) => {
      const hadActiveStage = !!activeStageRef.current;
      const stageBeingCleared = activeStageRef.current;
      clearTimers();
      setActiveNarration(null);
      activeSegmentRef.current = null;
      totalSegmentsRef.current = 0;
      completedSegmentsRef.current = 0;
      skipRequestedRef.current = false;
      segmentTokenRef.current = 0;
      hasTriggeredAutoAdvanceRef.current = false;
      startedStagesRef.current.clear();
      if (DEBUG_NARRATION) {
        console.log('🎙️ [NarrationController] resetState called', {
          clearedStartedStages: true,
          previousStage: stageBeingCleared || null,
        });
      }
      if (!preserveStage) {
        if (hadActiveStage && DEBUG_NARRATION) {
          console.log('🎙️ [NarrationController] STOPPED');
        }
        if (stageBeingCleared) {
          startedStagesRef.current.delete(stageBeingCleared);
        }
        activeStageRef.current = null;
      }
      if (!preserveStage && pendingStartRef.current === stageBeingCleared) {
        pendingStartRef.current = null;
      }
      if (unlock) {
        unlockScroll();
      }
    },
    [clearTimers, unlockScroll]
  );

  const triggerAutoAdvance = useCallback(
    (completedStageName, origin = 'narration_complete') => {
      if (!completedStageName) return;
      if (hasTriggeredAutoAdvanceRef.current) {
        narrationDiagnostic.log('AUTO_ADVANCE_SKIPPED_DUPLICATE', {
          stage: completedStageName,
          origin,
        });
        return;
      }

      hasTriggeredAutoAdvanceRef.current = true;
      narrationDiagnostic.log('AUTO_ADVANCE_TRIGGER_REQUEST', {
        stage: completedStageName,
        origin,
        timestamp: Date.now(),
      });

      unlockScroll();

      if (typeof window === 'undefined') return;

      const gate = window.NavigationGate;
      if (gate?.isInFlight?.() && gate.target?.() === 'qr') {
        narrationDiagnostic.log('AUTO_ADVANCE_DEFERRED_QR', {
          stage: completedStageName,
          origin,
        });
        return;
      }

      const controls = window.stageControls;
      const isAutoEnabled =
        controls?.isAutoAdvanceEnabled?.() ??
        controls?.getState?.()?.autoAdvanceEnabled ??
        stageAtom.getState?.()?.autoAdvanceEnabled ??
        false;

      if (!isAutoEnabled) {
        narrationDiagnostic.log('AUTO_ADVANCE_DISABLED', {
          stage: completedStageName,
          origin,
        });
        if (DEBUG_NARRATION) {
          console.log('⏸️ [AUTO-ADVANCE] Disabled, not advancing', { stage: completedStageName, origin });
        }
        return;
      }

      const scheduleAutoAdvance = (timeoutMs) => {
        const timeoutId = setTimeout(() => {
          timersRef.current.delete(timeoutId);

          const liveControls = window.stageControls;
          if (!liveControls?.next) return;
          const autoStillEnabled =
            liveControls.isAutoAdvanceEnabled?.() ??
            liveControls.getState?.()?.autoAdvanceEnabled ??
            stageAtom.getState?.()?.autoAdvanceEnabled ??
            false;
          if (!autoStillEnabled) return;

          const liveStage = liveControls.getCurrentStage?.();
          if (liveStage && liveStage !== completedStageName) {
            narrationDiagnostic.log('AUTO_ADVANCE_ABORT_STAGE_CHANGED', {
              expected: completedStageName,
              actual: liveStage,
              origin,
            });
            return;
          }

          if (liveControls.canAutoAdvance && !liveControls.canAutoAdvance()) {
            narrationDiagnostic.log('AUTO_ADVANCE_WAIT', {
              stage: completedStageName,
              retryIn: AUTO_ADVANCE_RETRY_MS,
              origin,
              timestamp: Date.now(),
            });
            if (DEBUG_NARRATION) {
              console.log('⏳ [AUTO-ADVANCE] Waiting for controller window', {
                stage: completedStageName,
                retryIn: AUTO_ADVANCE_RETRY_MS,
              });
            }
            scheduleAutoAdvance(AUTO_ADVANCE_RETRY_MS);
            return;
          }

          const liveInfo = liveControls.getInfo?.() || {};
          const liveTotal =
            liveInfo.totalStages ??
            liveControls.getStageCount?.() ??
            (Array.isArray(liveControls.getStageNames?.()) ? liveControls.getStageNames().length : null);
          const liveIndex =
            liveInfo.stageIndex ??
            liveControls.getCurrentStageIndex?.() ??
            null;

          if (
            typeof liveTotal === 'number' &&
            typeof liveIndex === 'number' &&
            liveIndex >= liveTotal - 1
          ) {
            narrationDiagnostic.log('AUTO_ADVANCE_FINAL_STAGE', {
              stage: completedStageName,
              origin,
            });
            if (DEBUG_NARRATION) {
              console.log('⏭️ [AUTO-ADVANCE] Final stage reached; no further advance.');
            }
            return;
          }

          const stageNames = liveControls.getStageNames?.();
          const nextStageName =
            Array.isArray(stageNames) && typeof liveIndex === 'number'
              ? stageNames[liveIndex + 1]
              : liveInfo.nextStage ?? null;

          narrationDiagnostic.log('AUTO_ADVANCE_EXEC', {
            from: completedStageName,
            to: nextStageName,
            origin,
          });
          if (DEBUG_NARRATION) {
            console.log('⏭️ [AUTO-ADVANCE] Advancing to next stage', {
              from: completedStageName,
              nextStage: nextStageName,
              origin,
            });
          }

          const advanceVia = async () => {
            liveControls.markAutoAdvance?.();
            try {
              const nav =
                window.unifiedNav ||
                (await import('@/theater/UnifiedNavigationAPI.js')).default;

              if (nav) {
                if (nextStageName) {
                  await nav.navigateToStage(nextStageName, {
                    smooth: true,
                    source: 'narration_auto_advance',
                  });
                  return;
                }
                if (typeof nav.nextStage === 'function') {
                  await nav.nextStage({
                    smooth: true,
                    source: 'narration_auto_advance',
                  });
                  return;
                }
              }
            } catch (error) {
              console.warn('⚠️ [AUTO-ADVANCE] Unified navigation failed, using fallback', {
                error,
                nextStageName,
              });
            }

            liveControls.next?.();
            if (nextStageName) {
              BeatBus.emit?.(EVENTS.START_NARRATIVE, {
                stage: nextStageName,
                source: 'auto_advance',
              });
            }
          };

          advanceVia().catch((error) => {
            console.error('🚨 [AUTO-ADVANCE] advanceVia error', error);
          });
        }, timeoutMs);

        timersRef.current.add(timeoutId);
      };

      scheduleAutoAdvance(AUTO_ADVANCE_DELAY_MS);
    },
    [unlockScroll]
  );

  const handleNarrationComplete = useCallback(
    (segmentToken) => {
      const stageName = activeStageRef.current;
      if (!stageName) {
        narrationDiagnostic.log('COMPLETION_SKIPPED', {
          reason: 'no_active_stage',
          completed: completedSegmentsRef.current,
          total: totalSegmentsRef.current,
        });
        return;
      }

      const activeMeta = activeSegmentRef.current;
      if (
        activeMeta &&
        typeof segmentToken === 'number' &&
        activeMeta.token !== segmentToken
      ) {
        narrationDiagnostic.log('COMPLETION_TOKEN_MISMATCH', {
          stage: stageName,
          expected: activeMeta.token,
          received: segmentToken,
        });
        return;
      }

      completedSegmentsRef.current = Math.min(
        completedSegmentsRef.current + 1,
        totalSegmentsRef.current
      );
      activeSegmentRef.current = null;
      setActiveNarration(null);

      narrationDiagnostic.log('SEGMENT_COMPLETE', {
        stage: stageName,
        token: segmentToken ?? null,
        completed: completedSegmentsRef.current,
        total: totalSegmentsRef.current,
      });

      if (completedSegmentsRef.current >= totalSegmentsRef.current) {
        narrationDiagnostic.log('COMPLETION', {
          stage: stageName,
          completed: completedSegmentsRef.current,
          total: totalSegmentsRef.current,
        });
        narrationDiagnostic.completionEvents.push({
          type: 'completion',
          stage: stageName,
          time: Date.now(),
          completed: completedSegmentsRef.current,
          total: totalSegmentsRef.current,
        });
        if (DEBUG_NARRATION) {
          console.log(`✅ Narration complete: ${stageName}`);
        }
        triggerAutoAdvance(stageName, 'narration_complete');
        activeStageRef.current = null;
      }
    },
    [triggerAutoAdvance]
  );

  const scheduleSegment = useCallback(
    (stageName, segment, segmentIndex = 0, totalSegments = 0) => {
      const startDelay = Math.max(0, segment?.timing?.start ?? 0);
      const timerId = setTimeout(() => {
        timersRef.current.delete(timerId);
        if (skipRequestedRef.current || activeStageRef.current !== stageName) return;

        const text = segment?.text ?? '';
        const charsPerSecond = Number(segment?.charsPerSecond) > 0
          ? Number(segment.charsPerSecond)
          : defaultCharsPerSecond;

        if (DEBUG_NARRATION) {
          const preview = text.length > 50 ? `${text.slice(0, 50)}…` : text;
          console.log('🎙️ [BEAT FIRED]', {
            stage: stageName,
            segmentIndex,
            time: segment?.timing?.start ?? 0,
            duration: segment?.timing?.duration ?? 0,
            narration: preview,
            visual: segment?.visual ?? null,
          });
        }

        const token = ++segmentTokenRef.current;
        const segmentMeta = {
          ...segment,
          stage: stageName,
          index: segmentIndex,
          token,
        };
        activeSegmentRef.current = segmentMeta;
        setActiveNarration({
          stage: stageName,
          segmentId: segment?.id ?? null,
          text,
          isActive: true,
          charsPerSecond,
          token,
        });

        let particleEffectPayload = null;
        if (segment?.visual) {
          console.log(`[Narration] Visual cue: ${segment.visual}`);

          const effectResolver = window.Canonical?.getVisualEffect || Canonical?.getVisualEffect;
          const resolved = effectResolver ? effectResolver(segment.visual) : null;
          if (!resolved) {
            console.warn('[VISUAL] Unknown verb (skipped):', segment.visual);
          } else if (resolved.type === 'camera') {
            console.log('[VISUAL] camera-only verb:', segment.visual);
          } else {
            const visualKey = (segment.visual || '').toLowerCase();
            particleEffectPayload = { ...resolved };

            const ensure = (cond, key, value) => {
              if (cond && (particleEffectPayload[key] === undefined || particleEffectPayload[key] === null)) {
                particleEffectPayload[key] = value;
              }
            };

            ensure(
              particleEffectPayload.gridSize === undefined &&
                (visualKey.includes('grid') ||
                 visualKey.includes('structure') ||
                 visualKey.includes('column')),
              'gridSize',
              0.45
            );

            ensure(
              particleEffectPayload.uFlowTurbulence === undefined &&
                (visualKey.includes('flow') ||
                 visualKey.includes('stream') ||
                 visualKey.includes('storm')),
              'uFlowTurbulence',
              0.9
            );

            ensure(
              particleEffectPayload.uStreakIntensity === undefined &&
                (visualKey.includes('streak') ||
                 visualKey.includes('trail') ||
                 visualKey.includes('velocity')),
              'uStreakIntensity',
              1.0
            );
          }
        }

        if (segment?.memoryFragmentTrigger) {
          const fragmentData = segment.memoryFragmentTrigger;
          console.log('[Narration] 🧩 Triggering memory fragment:', fragmentData);

          BeatBus.emit?.(EVENTS.MEMORY_FRAGMENT_START, {
            stage: stageName,
            fragmentId: fragmentData.id || `${stageName}-fragment-${segment?.id || segmentIndex}`,
            fragmentType: fragmentData.type || 'ambient',
            content: fragmentData.content || {},
            position: fragmentData.position || 'bottomLeft',
            duration: fragmentData.duration || 5000,
            source: 'narration-timing',
            timestamp:
              typeof performance !== 'undefined' && typeof performance.now === 'function'
                ? performance.now()
                : Date.now(),
          });
        }

        BeatBus.emit?.(EVENTS.NARRATIVE_LINE, {
          stage: stageName,
          segmentId: segment?.id ?? null,
          text,
        });

        if (particleEffectPayload) {
          console.log('[Narration] 🎨 Emitting particle directive:', {
            verb: segment.visual,
            effect: particleEffectPayload,
          });
          BeatBus.emit?.(EVENTS.RENDER_DIRECTIVE, {
            kind: 'particle-effect',
            ...particleEffectPayload,
            verb: segment.visual,
            stage: stageName,
            source: 'beat_visual',
            timestamp:
              typeof performance !== 'undefined' && typeof performance.now === 'function'
                ? performance.now()
                : Date.now(),
          });
        }

        const isLastBeat =
          totalSegments > 0 ? segmentIndex === totalSegments - 1 : false;
        if (isLastBeat) {
          const durationMs = Math.max(0, Number(segment?.timing?.duration ?? 0));
          const fallbackDelay = durationMs + AUTO_ADVANCE_DELAY_MS + 200;
          const fallbackId = setTimeout(() => {
            timersRef.current.delete(fallbackId);
            if (hasTriggeredAutoAdvanceRef.current) return;
            narrationDiagnostic.log('AUTO_ADVANCE_FALLBACK', {
              stage: stageName,
              origin: 'last_beat_timeout',
              fallbackDelay,
              timestamp: Date.now(),
            });
            triggerAutoAdvance(stageName, 'last_beat_timeout');
          }, fallbackDelay);
          timersRef.current.add(fallbackId);
        }
      }, startDelay);

      timersRef.current.add(timerId);
    },
    [defaultCharsPerSecond, triggerAutoAdvance]
  );

  const startNarration = useCallback(
    (stageName, origin = 'internal') => {
      console.log('🔬 [NARRATION] START_NARRATION_CALLED:', {
        requestedStage: stageName,
        normalizedStage: typeof stageName === 'string' ? stageName.trim() : stageName,
        currentStage,
        origin,
        isPlaying: activeStageRef.current !== null,
        autoAdvanceEnabled: autoAdvanceEnabledRef.current,
      });
      const trustedOrigins = new Set([
        'internal',
        'auto',
        'internal-auto',
        'opening_complete',
        'user_action',
        'auto_advance',
        'event',
        'pending',
      ]);
      if (!trustedOrigins.has(origin) && !isControlAllowed('narration:control')) {
        if (DEBUG_NARRATION) {
          console.warn('🎙️ [NarrationController] External play blocked by runtime guard');
        }
        return;
      }

      const normalizedStage = typeof stageName === 'string' ? stageName.trim() : '';
      let stageKey = resolveStageKey(normalizedStage || currentStage, 'genesis');

      let narrative = getNarrativeForStage(stageKey);
      if (!narrative && stageKey !== 'genesis') {
        narrative = getNarrativeForStage('genesis');
        if (narrative) {
          stageKey = 'genesis';
        }
      }
      if (!narrative) {
        if (DEBUG_NARRATION) {
          console.warn('🎙️ [NarrationController] No canonical narration available for stage', stageKey);
        }
        return;
      }

      const segments = normalizeSegments(getNarrationSegments(stageKey));
      if (!segments.length) {
        if (DEBUG_NARRATION) {
          console.warn('🎙️ [NarrationController] Stage has empty narration segments', stageKey);
        }
        return;
      }

      const beatCount = Array.isArray(narrative.beats) ? narrative.beats.length : segments.length;
      const firstBeatText =
        narrative?.beats?.[0]?.narration?.text ??
        narrative?.beats?.[0]?.text ??
        segments[0]?.text ??
        null;
      const resolvedStageForLog = normalizedStage || stageName || stageKey;

      resetState({ preserveStage: true });
      activeStageRef.current = stageKey;
      totalSegmentsRef.current = segments.length;
      completedSegmentsRef.current = 0;
      skipRequestedRef.current = false;

      if (DEBUG_NARRATION) {
        console.log('🎙️ [NarrationController] Playing canonical beat sheet:', {
          stage: stageKey,
          totalDuration: narrative?.totalDuration ?? null,
          startOffset: narrative?.startOffset ?? 0,
          beatCount,
          firstBeatText: firstBeatText
            ? `${firstBeatText.slice(0, 50)}${firstBeatText.length > 50 ? '…' : ''}`
            : null,
          isPlaying: true,
          defaultCharsPerSecond,
          requestedStage: stageName || null,
          normalizedStage: normalizedStage || null,
        });
        console.log('📖 Starting narration for:', resolvedStageForLog);
      }
      lockScroll();

      segments.forEach((segment, index) => scheduleSegment(stageKey, segment, index, segments.length));
    },
    [currentStage, defaultCharsPerSecond, lockScroll, resetState, scheduleSegment]
  );

  const skipNarration = useCallback(
    (origin = 'skip') => {
      if (origin === 'external' && !isControlAllowed('narration:control')) {
        if (DEBUG_NARRATION) {
          console.warn('🎙️ [NarrationController] External skip blocked by runtime guard');
        }
        return;
      }
      if (!activeStageRef.current) return;
      const stageName = activeStageRef.current;
      skipRequestedRef.current = true;
      resetState({ unlock: true });
      if (DEBUG_NARRATION) {
        console.log(`⏭️ Narration skipped via ${origin}: ${stageName}`);
      }
    },
    [resetState]
  );

  useEffect(() => {
    componentInstanceCounter += 1;
    const componentId = componentInstanceCounter;
    componentMountIdRef.current = componentId;
    const mountedAt = Date.now();
    narrationDiagnostic.log('COMPONENT_MOUNT', {
      componentId,
      stageAtMount: currentStage,
    });
    narrationDiagnostic.mountHistory.push({
      type: 'component',
      componentId,
      stage: currentStage,
      time: mountedAt,
    });

    return () => {
      const lifespan = Date.now() - mountedAt;
      narrationDiagnostic.log('COMPONENT_UNMOUNT', {
        componentId,
        stageAtUnmount: currentStage,
        lifespan,
      });
      narrationDiagnostic.unmountHistory.push({
        type: 'component',
        componentId,
        stage: currentStage,
        time: Date.now(),
        lifespan,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    effectRunCounterRef.current += 1;
    const effectId = effectRunCounterRef.current;
    const componentId = componentMountIdRef.current;
    const subscribedAt = Date.now();

    narrationDiagnostic.log('EFFECT_SUBSCRIBE', {
      componentId,
      effectId,
      stage: currentStage,
      autoAdvance: autoAdvanceEnabled,
    });

    narrationDiagnostic.mountHistory.push({
      type: 'effect',
      componentId,
      effectId,
      stage: currentStage,
      autoAdvance: autoAdvanceEnabled,
      time: subscribedAt,
    });

    return () => {
      const lifespan = Date.now() - subscribedAt;
      narrationDiagnostic.log('EFFECT_CLEANUP', {
        componentId,
        effectId,
        stage: currentStage,
        autoAdvance: autoAdvanceEnabled,
        lifespan,
      });
      narrationDiagnostic.unmountHistory.push({
        type: 'effect',
        componentId,
        effectId,
        stage: currentStage,
        autoAdvance: autoAdvanceEnabled,
        time: Date.now(),
        lifespan,
      });
    };
  }, [currentStage, autoAdvanceEnabled]);

  useEffect(() => {
    autoAdvanceEnabledRef.current = autoAdvanceEnabled;
  }, [autoAdvanceEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined') return () => {};

    const controllerFactory = () => {
      const surface = {};
      Object.defineProperties(surface, {
        playNarration: {
          value: (stage) => startNarration(stage, 'external'),
          enumerable: true,
        },
        skipNarration: {
          value: () => skipNarration('external'),
          enumerable: true,
        },
        isPlaying: {
          enumerable: true,
          get() {
            return activeStageRef.current !== null;
          },
        },
        currentStage: {
          enumerable: true,
          get() {
            return activeStageRef.current;
          },
        },
        completedSegments: {
          enumerable: true,
          get() {
            return completedSegmentsRef.current;
          },
        },
        totalSegments: {
          enumerable: true,
          get() {
            return totalSegmentsRef.current;
          },
        },
      });
      return surface;
    };

    exposeControlSurface('narrationController', controllerFactory, {
      playNarration: 'narration:control',
      skipNarration: 'narration:control',
    });

    exposeDiagnostics('narration', () => ({
      isPlaying: activeStageRef.current !== null,
      activeStage: activeStageRef.current,
      completedSegments: completedSegmentsRef.current,
      totalSegments: totalSegmentsRef.current,
      scrollLocked:
        typeof document !== 'undefined'
          ? (document.body?.style?.overflow || '') === 'hidden'
          : false,
    }));

    if (DEBUG_NARRATION) {
      console.log('🎙️ [NarrationController] Guarded controller API exposed');
    }

    return () => {
      revokeControlSurface('narrationController');
    };
  }, [skipNarration, startNarration]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const deps = {
      currentStage,
      autoAdvanceEnabled,
      resetStateId: resetState,
      skipNarrationId: skipNarration,
      startNarrationId: startNarration,
    };
    const prevDeps = prevDepsRef.current;
    const changedKeys = Object.keys(deps).filter((key) => prevDeps[key] !== deps[key]);
    console.log('🔬 [NARRATION] EFFECT_DEPS_CHECK:', {
      current: deps,
      previous: prevDeps,
      changes: changedKeys,
    });
    prevDepsRef.current = deps;

    const handleStart = (payload = {}) => {
      const stageName = payload?.stage || currentStage || activeStageRef.current;
      if (!stageName) {
        narrationDiagnostic.log('START_EVENT_IGNORED_NO_STAGE', { payload });
        return;
      }

      const source = typeof payload?.source === 'string' ? payload.source : null;
      const openingInProgress =
        typeof window !== 'undefined' &&
        window.theaterDirector?.isOpeningInProgress?.() === true;

      if (openingInProgress && source !== 'opening_complete') {
        narrationDiagnostic.log('START_EVENT_DEFERRED_OPENING', {
          stage: stageName,
          source,
        });
        pendingStartRef.current = stageName;
        return;
      }

      if (source && !VALID_START_SOURCES.has(source) && source !== 'opening_complete') {
        narrationDiagnostic.log('START_EVENT_BLOCKED_INVALID_SOURCE', {
          stage: stageName,
          source,
        });
        return;
      }

      if (activeStageRef.current && activeStageRef.current === stageName) {
        narrationDiagnostic.log('START_EVENT_SKIPPED_ALREADY_PLAYING', {
          stage: stageName,
          source,
        });
        return;
      }

      if (startedStagesRef.current.has(stageName)) {
        narrationDiagnostic.log('START_EVENT_SKIPPED_ALREADY_STARTED', {
          stage: stageName,
          source,
        });
        return;
      }

      narrationDiagnostic.log('START_EVENT_ACCEPTED', {
        stage: stageName,
        source,
        openingInProgress,
      });

      const origin = source || 'event';
      startNarration(stageName, origin);
      startedStagesRef.current.add(stageName);
      console.log('🎙️ [NarrationController] Added to startedStagesRef', {
        stage: stageName,
        setSize: startedStagesRef.current.size,
        allStages: Array.from(startedStagesRef.current),
      });
    };

    const handleStageChange = (payload = {}) => {
      const nextStage = payload?.to || payload?.stage;
      narrationDiagnostic.log('STAGE_CHANGE_EVENT', {
        from: payload?.from ?? payload?.previousStage ?? null,
        to: nextStage,
        autoAdvance: autoAdvanceEnabledRef.current,
        isPlaying: activeStageRef.current !== null,
      });
      narrationDiagnostic.stageChangeEvents.push({
        ...payload,
        to: nextStage,
        time: Date.now(),
      });
      if (nextStage && nextStage !== activeStageRef.current) {
        console.log('🎙️ [NarrationController] Stage changed, resetting state', {
          from: activeStageRef.current,
          to: nextStage,
        });
        resetState();
      }
    };

    const offStart = BeatBus.on?.(EVENTS.START_NARRATIVE, handleStart);
    const offStageChange = BeatBus.on?.(EVENTS.STAGE_CHANGE, handleStageChange);

    const keyHandler = (event) => {
      if (!activeStageRef.current || skipRequestedRef.current) return;
      if (event?.defaultPrevented) return;
      const targetTag = event?.target?.tagName;
      if (targetTag && ['INPUT', 'TEXTAREA'].includes(targetTag)) return;
      if (!SKIP_KEYS.has(event.key) && event.code !== 'Space') return;
      event.preventDefault?.();
      event.stopPropagation?.();
      skipNarration('space');
    };

    window.addEventListener('keydown', keyHandler);

    return () => {
      console.log('🔬 [NARRATION] CLEANUP_REASON', {
        stage: currentStage,
        wasPlaying: activeStageRef.current !== null,
        autoAdvance: autoAdvanceEnabledRef.current,
        caller: new Error().stack.split('\n')[2] ?? null,
      });
      offStart?.();
      offStageChange?.();
      window.removeEventListener('keydown', keyHandler);
      resetState();
    };
  }, [currentStage, resetState, skipNarration, startNarration]);

  useEffect(() => {
    if (!currentStage) return;

    const openingInProgress =
      typeof window !== 'undefined' &&
      window.theaterDirector?.isOpeningInProgress?.() === true;

    if (openingInProgress) {
      narrationDiagnostic.log('AUTO_START_BLOCKED_OPENING', {
        stage: currentStage,
      });
      return;
    }

    const isAlreadyPlayingCurrentStage =
      activeStageRef.current && activeStageRef.current === currentStage;

    if (isAlreadyPlayingCurrentStage) {
      narrationDiagnostic.log('AUTO_START_SKIPPED_ALREADY_PLAYING', {
        stage: currentStage,
      });
      return;
    }

    const segments = normalizeSegments(getNarrationSegments(currentStage));
    const segmentCount = segments.length;
    if (!segmentCount) {
      narrationDiagnostic.log('AUTO_START_SKIPPED_NO_SEGMENTS', {
        stage: currentStage,
      });
      return;
    }

    if (startedStagesRef.current.has(currentStage)) {
      narrationDiagnostic.log('AUTO_START_SKIPPED_ALREADY_STARTED', {
        stage: currentStage,
      });
      return;
    }

    narrationDiagnostic.log('AUTO_START_ALLOWED', {
      stage: currentStage,
      segmentCount,
    });

    startNarration(currentStage, 'auto');
    startedStagesRef.current.add(currentStage);
  }, [currentStage, startNarration]);

  useEffect(() => {
    if (typeof window === 'undefined') return () => {};

    const intervalId = setInterval(() => {
      const opening = window.theaterDirector?.isOpeningInProgress?.() === true;
      if (opening) return;
      const pendingStage = pendingStartRef.current;
      if (!pendingStage) return;
      if (startedStagesRef.current.has(pendingStage)) {
        pendingStartRef.current = null;
        return;
      }
      narrationDiagnostic.log('PENDING_START_CONSUMED', {
        stage: pendingStage,
      });
      pendingStartRef.current = null;
      startNarration(pendingStage, 'pending');
      startedStagesRef.current.add(pendingStage);
    }, 150);

    return () => clearInterval(intervalId);
  }, [startNarration]);

  useEffect(() => {
    return () => {
      resetState();
    };
  }, [resetState]);

  if (!activeNarration?.isActive) return null;

  return (
    <NarrationFragment
      text={activeNarration.text}
      isActive={activeNarration.isActive}
      onComplete={handleNarrationComplete}
      charsPerSecond={activeNarration.charsPerSecond}
      segmentKey={activeNarration.token}
    />
  );
}

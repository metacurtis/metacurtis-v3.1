# Agent B – Critic

Flow: fix_narration_pipeline_v1 · Step 02
Generated at: 2025-12-08T17:15:04.709Z

---
## Mission
Stress-test Architect’s specification against the actual code and produce a precise diagnosis: root causes, minimal safe change surface, and do-not-touch list.

## Invariants
- Do not invent new event types or data streams.
- Do not propose code diffs; focus on diagnosis and constraints.
- Never add new writers for shared signals (e.g. MORPH_PROGRESS, RENDER_DIRECTIVE, shared atoms).
- Always distinguish between true root causes and secondary noise (e.g. diagnostic chatter).

## This Step
Role for this step: Critic


## Task
"DEBUG FLOW: fix_narration_pipeline_v1 — remove Genesis narration flicker and blank frames by fixing the contract and lifecycle between NarrationController and NarrationOverlayBus (overlay appears once and stays until complete/skip, no flicker between beats)."

## High-Level Context
Task: DEBUG FLOW: fix_narration_pipeline_v1 — remove Genesis narration flicker and blank frames by fixing the contract and lifecycle between NarrationController and NarrationOverlayBus (overlay appears once and stays until complete/skip, no flicker between beats).
Flow: fix_narration_pipeline_v1
Included files:
- src/components/narrative/NarrationController.jsx
- src/components/narrative/NarrationOverlayBus.jsx
- src/components/consciousness/ConsciousnessTheater.jsx
- src/theater/events.js
- src/config/sst3/narrative-dialogue.js
---
Agent A (Architect) has completed step 01.

## Code Context (from repo)
### File: src/components/narrative/NarrationController.jsx

```
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

const LINE_TYPE_TEMPLATES = {
  genesis: ['chapter', 'important', 'context', 'important', 'important'],
};

const SUPPORTED_LINE_TYPES = new Set(['chapter', 'important', 'context']);

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
  const completionFallbacksRef = useRef(new Map());
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
  const stageLineCounterRef = useRef(new Map());

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current.clear();
    completionFallbacksRef.current.clear();
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

  const getFallbackLineType = useCallback((stageName) => {
    const key = stageName || 'default';
    const current = stageLineCounterRef.current.get(key) ?? 0;
    stageLineCounterRef.current.set(key, current + 1);
    const template = LINE_TYPE_TEMPLATES[key];
    if (template && template[current]) {
      return template[current];
    }
    if (current === 0) return 'chapter';
    if (current === 1) return 'important';
    return 'context';
  }, []);

  const resolveLineType = useCallback(
    (stageName, scriptedType) => {
      if (scriptedType && SUPPORTED_LINE_TYPES.has(scriptedType)) {
        return scriptedType;
      }
      return getFallbackLineType(stageName);
    },
    [getFallbackLineType]
  );

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
      if (!preserveStage) {
        // Hard reset: clear everything
        setActiveNarration(null);
        activeSegmentRef.current = null;
        totalSegmentsRef.current = 0;
        completedSegmentsRef.current = 0;
        skipRequestedRef.current = false;
        segmentTokenRef.current = 0;
        hasTriggeredAutoAdvanceRef.current = false;
        startedStagesRef.current.clear();
      } else {
        // Soft reset: keep current narration and stage; just clear flags
        skipRequestedRef.current = false;
        hasTriggeredAutoAdvanceRef.current = false;
      }
      if (DEBUG_NARRATION) {
        console.log('🎙️ [NarrationController] resetState called', {
          clearedStartedStages: true,
          previousStage: stageBeingCleared || null,
        });
      }
      const timestamp =
        typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : Date.now();

      // Only broadcast STOP/CLEANUP for hard resets
      if (hadActiveStage && !preserveStage) {
        BeatBus.emit?.(EVENTS.NARRATION_STOPPED, {
          stage: stageBeingCleared ?? null,
          reason: 'reset_state',
          preserveStage,
          timestamp,
        });
      }

      if (hadActiveStage && !preserveStage) {
        BeatBus.emit?.(EVENTS.NARRATION_CLEANUP, {
          stage: stageBeingCleared ?? null,
          reason: 'reset_state',
          preserveStage,
          timestamp,
        });
      }

      if (!preserveStage) {
        if (hadActiveStage && DEBUG_NARRATION) {
          console.log('🎙️ [NarrationController] STOPPED');
        }
        if (stageBeingCleared) {
          startedStagesRef.current.delete(stageBeingCleared);
          stageLineCounterRef.current.delete(stageBeingCleared);
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
      if (typeof segmentToken === 'number') {
        const fallbackTimer = completionFallbacksRef.current.get(segmentToken);
        if (fallbackTimer) {
          clearTimeout(fallbackTimer);
          timersRef.current.delete(fallbackTimer);
          completionFallbacksRef.current.delete(segmentToken);
        }
      }
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
        const timestamp =
          typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now();
        BeatBus.emit?.(EVENTS.NARRATION_STOPPED, {
          stage: stageName,
          reason: 'complete',
          timestamp,
        });
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

        if (DEBUG_NARRATION && stageName === 'genesis' && segmentIndex === 0) {
          console.log('🔍 [GENESIS SEGMENT]', {
            index: segmentIndex,
            time: segment?.timing?.start ?? 0,
            visual: segment?.visual ?? null,
            textPreview: (text || '').slice(0, 80),
          });
        }

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
          const visualVerb = segment.visual;
          console.log('[Narration] Visual cue:', visualVerb);

          const effectResolver =
            window.canonicalAuthority?.getVisualEffect ||
            window.Canonical?.getVisualEffect ||
            Canonical?.getVisualEffect;
          const resolved = typeof effectResolver === 'function'
            ? effectResolver(visualVerb)
            : undefined;
          const isNoChangeVerb = visualVerb === 'no_change';

          const hasUniforms = (payload) => {
            if (!payload || typeof payload !== 'object') return false;
            const uniformKeys = [
              'uMotionMode',
              'uFlowTurbulence',
              'uParticleFlash',
              'uOpacityMin',
              'uOpacityMax',
              'uStreakIntensity',
              'uSpreadFactor',
              'tierHighlight',
              'tierModes',
              'tierParams',
              'gridX',
              'gridY',
              'pointSize',
              'uniforms',
              'activeCount',
              'drawCount',
            ];
            return uniformKeys.some((key) => payload[key] !== undefined && payload[key] !== null);
          };

          if (!resolved && !isNoChangeVerb) {
            console.warn('[VISUAL] Unknown verb (skipped):', visualVerb);
          } else if (resolved && resolved.type === 'camera') {
            console.log('[VISUAL] camera-only verb:', visualVerb);
          } else if (resolved && hasUniforms(resolved)) {
            particleEffectPayload = {
              ...resolved,
              source: resolved.source || 'beat_visual',
              verb: visualVerb,
            };
          } else if (resolved === null) {
            console.log('[Narration] 📷 Camera-only cue (no particle directive):', visualVerb);
          } else {
            console.warn('[Narration] ⚠️ Could not resolve visual verb:', visualVerb);
          }
        }

        const textLength = text.length || 0;
        const estimatedTypingMs =
          charsPerSecond > 0 ? (textLength / charsPerSecond) * 1000 : 0;
        const canonicalDurationMs = Math.max(0, Number(segment?.timing?.duration ?? 0));
        const fallbackDurationMs = Math.max(
          1500,
          Math.max(canonicalDurationMs, estimatedTypingMs + 2000) + 500
        );

        const completionFallback = setTimeout(() => {
          timersRef.current.delete(completionFallback);
          completionFallbacksRef.current.delete(token);
          if (activeSegmentRef.current?.token !== token) return;
          narrationDiagnostic.log('SEGMENT_COMPLETION_FALLBACK_TRIGGERED', {
            stage: stageName,
            segmentIndex,
            token,
            fallbackDurationMs,
          });
          handleNarrationComplete(token);
        }, fallbackDurationMs);
        timersRef.current.add(completionFallback);
        completionFallbacksRef.current.set(token, completionFallback);

        const explicitSpeed = Number(segment?.typeSpeed);
        const fallbackSpeed =
          charsPerSecond > 0 ? Math.round(1000 / charsPerSecond) : null;
        const speedMs =
          Number.isFinite(explicitSpeed) && explicitSpeed > 0
            ? explicitSpeed
            : fallbackSpeed;
        const narrativeTimestamp =
          typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now();

        const scriptedType = segment?.lineType || segment?.metadata?.lineType || null;
        const lineType = resolveLineType(stageName, scriptedType);

        BeatBus.emit?.(EVENTS.NARRATIVE_LINE, {
          stage: stageName,
          segmentId: segment?.id ?? null,
          segmentIndex,
          token,
          text,
          speedMs: speedMs || undefined,
          type: lineType,
          timestamp: narrativeTimestamp,
        });

        if (particleEffectPayload) {
          console.log('[Narration] 🎨 Emitting particle directive:', {
            verb: segment.visual,
            effect: particleEffectPayload,
          });
          const directivePayload = {
            source: 'beat_visual',
            channel: 'renderer',
            phase: particleEffectPayload.phase || 'narration',
            stage: stageName,
            verb: segment.visual,
            timestamp:
              typeof performance !== 'undefined' && typeof performance.now === 'function'
                ? performance.now()
                : Date.now(),
            kind: 'particle-effect',
          };
          if (particleEffectPayload.motionMode !== undefined) {
            directivePayload.uMotionMode = particleEffectPayload.motionMode;
          }
          if (particleEffectPayload.particlePhase !== undefined) {
            directivePayload.uParticlePhase = particleEffectPayload.particlePhase;
          }
          if (particleEffectPayload.uFlowTurbulence !== undefined || particleEffectPayload.turbulence !== undefined) {
            directivePayload.uFlowTurbulence =
              particleEffectPayload.uFlowTurbulence ?? particleEffectPayload.turbulence;
          }
          if (particleEffectPayload.uParticleFlash !== undefined || particleEffectPayload.flash !== undefined) {
            directivePayload.uParticleFlash =
              particleEffectPayload.uParticleFlash ?? particleEffectPayload.flash;
          }
          if (Array.isArray(particleEffectPayload.opacity)) {
            directivePayload.uOpacityMin = particleEffectPayload.opacity[0];
            directivePayload.uOpacityMax = particleEffectPayload.opacity[1];
          }
          if (particleEffectPayload.uOpacityMin !== undefined || particleEffectPayload.uOpacityMax !== undefined) {
            directivePayload.uOpacityMin =
              directivePayload.uOpacityMin ?? particleEffectPayload.uOpacityMin;
            directivePayload.uOpacityMax =
              directivePayload.uOpacityMax ?? particleEffectPayload.uOpacityMax;
          }
          if (particleEffectPayload.pointSize !== undefined) {
            directivePayload.pointSize = particleEffectPayload.pointSize;
          }
          if (particleEffectPayload.activeCount !== undefined) {
            directivePayload.activeCount = particleEffectPayload.activeCount;
          }
          BeatBus.emit?.(EVENTS.RENDER_DIRECTIVE, directivePayload);
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
    [defaultCharsPerSecond, handleNarrationComplete, resolveLineType, triggerAutoAdvance]
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
      stageLineCounterRef.current.set(stageKey, 0);
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
      if (import.meta?.env?.DEV) {
        console.log('🔬 [NARRATION] START_NARRATIVE event received', payload);
      }

      const stageName = payload?.stage || currentStage || activeStageRef.current;
      if (!stageName) {
        narrationDiagnostic.log('START_EVENT_IGNORED_NO_STAGE', { payload });
        return;
      }

      const source = typeof payload?.source === 'string' ? payload.source : null;
      const isOpeningComplete = source === 'opening_complete';
      const openingInProgress =
        typeof window !== 'undefined' &&
        window.theaterDirector?.isOpeningInProgress?.() === true;

      if (openingInProgress && !isOpeningComplete) {
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

      if (isOpeningComplete && startedStagesRef.current.has(stageName)) {
        narrationDiagnostic.log('START_EVENT_RESET_STARTED_FLAG', {
          stage: stageName,
          source,
        });
        startedStagesRef.current.delete(stageName);
      }

      if (isOpeningComplete && activeStageRef.current === stageName) {
        narrationDiagnostic.log('START_EVENT_RESET_ACTIVE_FOR_OPENING_COMPLETE', {
          stage: stageName,
          source,
        });
        resetState({ unlock: false, preserveStage: false });
      }

      if (activeStageRef.current && activeStageRef.current === stageName) {
        narrationDiagnostic.log('START_EVENT_SKIPPED_ALREADY_PLAYING', {
          stage: stageName,
          source,
        });
        if (import.meta?.env?.DEV) {
          console.log('🔬 [NARRATION] START_EVENT_SKIPPED_ALREADY_PLAYING', { stage: stageName });
        }
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

      if (stageName === 'genesis') {
        console.log('🎙️ [NARRATION] Starting genesis beatSheet', {
          stage: stageName,
          source: origin,
        });
      }

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
      // Avoid wiping active narration on effect re-runs; only remove listeners here.
    };
  }, [currentStage, resetState, skipNarration, startNarration]);

  useEffect(() => {
    if (!currentStage) return;

    // 🔒 Let Director own Genesis narration start via START_NARRATIVE(opening_complete)
    if (currentStage === 'genesis') {
      narrationDiagnostic.log('AUTO_START_SKIPPED_GENESIS', {
        stage: currentStage,
        reason: 'opening-controlled',
      });
      return;
    }

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

  return null;
}

```

### File: src/components/narrative/NarrationOverlayBus.jsx

```
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

    // Immediately render first character to avoid blank frame between beats
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

      // Prime state, but do not show overlay until a line arrives (unless prefill provided)
      clearGraceTimer();
      resetOverlay();
      stateMachine.transitionTo(STATES.STARTING, { source: payload.source });

      if (payload?.prefill) {
        setIncomingText(String(payload.prefill));
        setVisible(true);
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

      const stageFromPayload = payload.stage || payload.currentStage || null;
      if (stageFromPayload) {
        overlayStageRef.current = stageFromPayload;
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

```

### File: src/components/consciousness/ConsciousnessTheater.jsx

```
// src/components/consciousness/ConsciousnessTheater.jsx
// Director-integrated Theater — start AFTER viewport hint; race-free opening (DEV-safe cancel guard)

import { useEffect, useState, useRef } from 'react';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import { stageAtom } from '@/state/atoms/stageAtom.js';
import { qualityAtom } from '@/state/atoms/qualityAtom.js';
import { useMemoryFragments } from '@/hooks/useMemoryFragments.js';
import WebGLCanvas from '@/components/webgl/WebGLCanvas.jsx';
import { useAtomValue } from '@/state/atoms/createAtom.js';
import { narrativeAtom } from '@/state/atoms/narrativeAtom.js';
import stateCommands from '@/state/commands/StateCommands.js';
// import _DevPerformanceMonitor from '@/components/dev/DevPerformanceMonitor'; // optional

import '@/theater/disableDirectorAutostart.js';
import director from '@/theater/TheaterDirector.js';
import OpeningSequence from '@/components/theater/OpeningSequence.jsx';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';
import NavigationGate from '@/theater/NavigationGate.js';
import { NarrativeChoreography } from '@/components/narrative/NarrativeChoreography.jsx';

console.log('🧬 LOADED: ConsciousnessTheater — race-free opening (DEV-safe cancel)');

const GENESIS_STAGE_WORD = Canonical?.visual?.letterGeometry?.genesis?.word || 'GENESIS';

// Debounce helper to prevent rapid-fire navigation (default 150ms)
function createDebouncer(minInterval = 150) {
  let lastCall = 0;
  let timeoutId = null;

  return function debounce(fn) {
    const now = performance.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall < minInterval) {
      if (timeoutId) clearTimeout(timeoutId);

      const remainingTime = minInterval - timeSinceLastCall;
      timeoutId = setTimeout(() => {
        lastCall = performance.now();
        fn();
      }, remainingTime);

      console.log('⏱️ [DEBOUNCE]', {
        action: 'delayed',
        timeSinceLastCall: Math.round(timeSinceLastCall),
        remainingTime: Math.round(remainingTime),
      });

      return false;
    }

    if (timeoutId) clearTimeout(timeoutId);
    lastCall = now;
    fn();

    return true;
  };
}

const MemoryFragmentRenderer = ({ fragment, onDismiss }) => {
  if (!fragment) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0, 0, 0, 0.95)',
        border: '2px solid #00FF00',
        borderRadius: '10px',
        padding: '30px',
        zIndex: 100,
        minWidth: '400px',
        maxWidth: '600px',
      }}
    >
      <h3
        style={{
          color: '#00FF00',
          marginTop: 0,
          fontFamily: 'Courier New, monospace',
        }}
      >
        {fragment.name}
      </h3>

      <div style={{ color: '#ffffff', marginBottom: '20px' }}>
        {fragment.content?.type === 'interactive' &&
          fragment.content?.element === 'commodore_terminal' && (
            <div
              style={{
                background: '#000',
                padding: '20px',
                fontFamily: 'Courier New, monospace',
                color: '#00FF00',
                border: '1px solid #00FF00',
              }}
            >
              READY.<br />
              {'10 PRINT "'}{GENESIS_STAGE_WORD}{'"'}<br />
              {'20 GOTO 10'}<br />
              RUN<br />
              <div style={{ marginTop: '10px', opacity: 0.7 }}>
                {Array(5)
                  .fill(`${GENESIS_STAGE_WORD} `)
                  .join('')}
                ...
              </div>
            </div>
          )}
      </div>

      <button
        onClick={onDismiss}
        style={{
          padding: '10px 20px',
          background: '#00FF00',
          color: '#000',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontFamily: 'Courier New, monospace',
          fontWeight: 'bold',
        }}
      >
        Close
      </button>
    </div>
  );
};

export default function ConsciousnessTheater() {
  const currentStage = useAtomValue(stageAtom, (state) => state.currentStage);
  const scrollProgress = useAtomValue(narrativeAtom, (state) => state.scrollProgress);
  const morphProgress = useAtomValue(narrativeAtom, (state) => state.morphProgress);
  const [isInitialized, setIsInitialized] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(false);
  const showCanvas = true;

  const currentStageRef = useRef(currentStage || 'genesis');
  const morphProgressRef = useRef(0);
  const directorStartedRef = useRef(false);
  const viewportReadyRef = useRef(false);
  const arrowKeyDebounce = useRef(createDebouncer(150)).current;

  const _stageConfig = Canonical.stages[currentStage];
  const {
    activeFragments,
    fragmentStates,
    triggerFragment,
    dismissFragment,
  } = useMemoryFragments(currentStage, scrollProgress * 100, null);
  const triggerFragmentRef = useRef(triggerFragment);
  triggerFragmentRef.current = triggerFragment;

  useEffect(() => {
    morphProgressRef.current = morphProgress;
  }, [morphProgress]);

  useEffect(() => {
    if (!currentStage) return;
    currentStageRef.current = currentStage;
    if (typeof qualityAtom.updateParticleBudget === 'function') {
      qualityAtom.updateParticleBudget(currentStage);
    }
  }, [currentStage]);

  // ───────────────── Director start AFTER viewport hint; scroll locked until ENABLE_SCROLL
  useEffect(() => {
    // 1) Listen for viewport hint sent by WebGLBackground
    const offHint = BeatBus.on(EVENTS.ENGINE_VIEWPORT_HINT, () => {
      viewportReadyRef.current = true;
    });

    // 2) Start Director once, after hint
    const tick = setInterval(() => {
      if (!directorStartedRef.current && viewportReadyRef.current) {
        try { document.body.style.overflow = 'hidden'; } catch {}
        director.start();
        directorStartedRef.current = true;
        clearInterval(tick);
      }
    }, 50);

    // 3) Director handoff signals
    const offs = [
      BeatBus.on(EVENTS.ENABLE_SCROLL, () => {
        console.log('   Theater: Scroll enabled by Director');
        setScrollEnabled(true);
        try { document.body.style.overflow = ''; } catch {}
      }),
      BeatBus.on(EVENTS.START_NARRATIVE, ({ stage }) => {
        console.log(`   Theater: Starting ${stage} narrative`);
        setIsInitialized(true);
      }),
    ];

    // DEV-safe cleanup: only cancel on true unmount (prod) or when explicitly requested
    return () => {
      clearInterval(tick);
      offHint && offHint();
      offs.forEach((off) => off && off());
      try { document.body.style.overflow = ''; } catch {}
      if (!import.meta.env.DEV || window.__HARD_UNMOUNT__) {
        try { director.cancel(); } catch {}
      }
      directorStartedRef.current = false;
      viewportReadyRef.current = false;
    };
  }, []);

  // --- Viewport hint fallback — emit hint if renderer never provided one
  useEffect(() => {
    let gotHint = false;
    const off = BeatBus.on(EVENTS.ENGINE_VIEWPORT_HINT, () => { gotHint = true; });
    const timer = setTimeout(() => {
      if (!gotHint) {
        try {
          const w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
          const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
          BeatBus.emit(EVENTS.ENGINE_VIEWPORT_HINT, {
            width: w,
            height: h,
            aspect: w / Math.max(1, h),
          });
          console.log('📐 Theater: synthetic ENGINE_VIEWPORT_HINT emitted');
        } catch {}
      }
    }, 800);
    return () => {
      clearTimeout(timer);
      off && off();
    };
  }, []);

  // ───────────────── Keyboard navigation (after handoff)
  useEffect(() => {
    if (!isInitialized) return;

    const stageNames =
      Array.isArray(Canonical.stageOrder) && Canonical.stageOrder.length
        ? Canonical.stageOrder
        : Object.keys(Canonical.stages || {});

    const skipNarrationIfActive = () => {
      const controller = typeof window !== 'undefined' ? window.narrationController : null;
      if (controller?.isPlaying && typeof controller.skipNarration === 'function') {
        controller.skipNarration();
        return true;
      }
      return false;
    };

    const handleKey = (e) => {
      const tagName = e.target?.tagName;
      if (tagName && ['INPUT', 'TEXTAREA'].includes(tagName)) return;

      const key = e.key;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        console.log('🔍 [KEY DEBUG]', {
          key,
          target: tagName || 'unknown',
          defaultPrevented: e.defaultPrevented,
          timestamp: performance.now(),
        });
      }

      // Stage navigation keys
      if (key === 'ArrowRight' || key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();

        arrowKeyDebounce(() => {
          const state = stageAtom.getState?.();
          const activeStage = state?.currentStage || currentStageRef.current || stageNames[0];
          const currentIndex = Math.max(0, stageNames.indexOf(activeStage));
          const maxIndex = stageNames.length - 1;
          const targetIndex =
            key === 'ArrowRight'
              ? Math.min(currentIndex + 1, maxIndex)
              : Math.max(currentIndex - 1, 0);

          if (targetIndex === currentIndex) {
            return;
          }

          const targetStage = stageNames[targetIndex];
          const targetScrollPercent =
            maxIndex > 0 ? (targetIndex / maxIndex) * 100 : 0;

          const narrationSkipped = skipNarrationIfActive();

          console.log('🎹 [UNIFIED NAV]', {
            key,
            from: activeStage,
            to: targetStage,
            targetScrollPercent: `${targetScrollPercent.toFixed(1)}%`,
            method: 'ORCHESTRATED_JUMP',
            narrationSkipped,
          });

          const scrollRange =
            typeof window !== 'undefined'
              ? Math.max(1, document.body.scrollHeight - window.innerHeight)
              : 1;
          const scrollTarget = (targetScrollPercent / 100) * scrollRange;

          if (typeof window !== 'undefined') {
            window.scrollTo({
              top: scrollTarget,
              behavior: 'smooth',
            });
          }

          console.log('🎬 [KEY NAV]', {
            key,
            from: activeStage,
            to: targetStage,
            targetScrollPercent: `${targetScrollPercent.toFixed(1)}%`,
            narrationSkipped,
            debounced: true,
          });
        });
        return;
      }

      // Numeric shortcuts
      if (/^[0-6]$/.test(key)) {
        e.preventDefault();
        e.stopPropagation();

        const numeric = parseInt(key, 10);
        const targetIndex =
          numeric === 0 ? 0 : Math.max(0, Math.min(stageNames.length - 1, numeric - 1));
        const targetStage = stageNames[targetIndex];

        if (targetStage) {
          const narrationSkipped = skipNarrationIfActive();
          console.log('🎹 [NUMBER KEY NAV]', {
            key,
            targetStage,
            method: 'UNIFIED_ORCHESTRATED',
            timestamp: performance.now(),
            narrationSkipped,
          });

          if (window.unifiedNav) {
            window.unifiedNav.navigateToStage(targetStage, {
              smooth: true,
              skipNarration: false,
              source: 'number_key',
            });
          } else {
            window.NavigationCommands?.navigateToStageCanonical?.(targetStage, {
              origin: 'number_key_fallback',
              viaScroll: false,
            });
          }
        }
        return;
      }

      // Spacebar → next stage (kept for parity with previous behaviour)
      if (key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        const before = stageAtom.getState?.();
        const narrationSkipped = skipNarrationIfActive();
        const stageNamesRef =
          stageAtom.getStageNames?.() ?? stageNames ?? Canonical?.stageOrder ?? [];
        const currentIndex = stageNamesRef.indexOf(before?.currentStage || '');
        const nextIndex = Math.min(
          currentIndex >= 0 ? currentIndex + 1 : 1,
          Math.max(stageNamesRef.length - 1, 0)
        );
        const targetStage = stageNamesRef[nextIndex] || stageNamesRef[stageNamesRef.length - 1];

        if (targetStage && window.unifiedNav?.navigateToStage) {
          window.unifiedNav.navigateToStage(targetStage, {
            smooth: true,
            source: 'keyboard_space',
          });
        } else {
          const nextStage =
            stageNamesRef[nextIndex] || stageNamesRef[stageNamesRef.length - 1];
          window.NavigationCommands?.navigateToStageCanonical?.(nextStage, {
            origin: 'keyboard_space_fallback',
            viaScroll: false,
          });
        }
        const after = stageAtom.getState?.();
        console.log('🎬 [KEY NAV]', {
          key: 'Space',
          from: before?.currentStage ?? null,
          to: after?.currentStage ?? targetStage ?? null,
          narrationSkipped,
        });
        return;
      }

      // Developer toggles / helpers preserved
      switch (key) {
        case 'h':
        case 'H':
          window.SHOW_DIRECTOR = !window.SHOW_DIRECTOR;
          window.location.reload();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isInitialized]);

  // ───────────────── Scroll → morph/stage (after handoff)
  useEffect(() => {
    if (!isInitialized || !scrollEnabled) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      const progress = Math.min(scrollTop / scrollHeight, 1);

      stateCommands.setScrollProgress(progress, { origin: 'scroll' });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isInitialized, scrollEnabled]);

  // ───────────────── Render
  return (
    <div className="consciousness-theater-v3">
      <OpeningSequence />

      {/* tall spacer to allow scrolling once enabled */}
      <div
        style={{
          position: 'absolute',
          width: '1px',
          height: '700vh',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />

      {showCanvas && (
        <WebGLCanvas
          stage={currentStage}
          morphProgress={morphProgress}
          scrollProgress={scrollProgress}
        />
      )}

      {/* Narrative choreography overlay */}
      <NarrativeChoreography />

      {/* Memory fragments */}
      {activeFragments.map((fragment) => {
        const state = fragmentStates[fragment.id];
        return state?.state === 'active' ? (
          <MemoryFragmentRenderer
            key={fragment.id}
            fragment={fragment}
            onDismiss={() => dismissFragment(fragment.id)}
          />
        ) : null;
      })}
    </div>
  );
}

```

### File: src/theater/events.js

```
// src/theater/events.js
// SST v3.3 — Complete Event Catalog (canonical, named export)

export const EVENTS = {
  // Opening (overlay-only; Director-driven)
  CURSOR_SHOW: 'CURSOR_SHOW',
  CURSOR_BLINK: 'CURSOR_BLINK',
  TERMINAL_TYPE: 'TERMINAL_TYPE',                // { lines[], typeSpeed, lineDelay }
  SCREEN_FILL: 'SCREEN_FILL',                    // { text, scrollSpeed }
  DIRECTOR_OPENING_MODE: 'DIRECTOR_OPENING_MODE',// { mode, stage }
  OPENING_COMPLETE: 'OPENING_COMPLETE',          // Overlay fade + scan-bloat contract

  // Renderer/Theater gates
  ENGINE_VIEWPORT_HINT: 'ENGINE_VIEWPORT_HINT',  // { width, height, aspect }

  // Emergence / blueprint handoff
  BUILD_EMERGENCE_BLUEPRINT: 'BUILD_EMERGENCE_BLUEPRINT',
  BLUEPRINT_READY: 'BLUEPRINT_READY',            // { blueprint, stage?, quality?, mode? }
  BLUEPRINT_INVALIDATED: 'BLUEPRINT_INVALIDATED',// guard fallback notification
  PARTICLES_START_EMERGING: 'PARTICLES_START_EMERGING',
  PARTICLES_EMERGED: 'PARTICLES_EMERGED',        // fencepost (emit once)
  FENCEPOST_LISTENERS_READY: 'FENCEPOST_LISTENERS_READY',

  // Renderer tuning & morph
  RENDER_DIRECTIVE: 'RENDER_DIRECTIVE',          // renderer directives (intent → GPU writes)
  RENDERER_TUNE: 'RENDERER_TUNE',                // { rotZdegPerSec, swirl, vibAmp, flutter, trails, ... }
  PARTICLE_PHASE: 'PARTICLE_PHASE',              // { name }
  MORPH_PROGRESS: 'MORPH_PROGRESS',              // { progress: 0..1 }

  // Stage / narrative control
  START_NARRATIVE: 'START_NARRATIVE',            // { id?, stage? }
  NARRATIVE_LINE: 'NARRATIVE_LINE',
  NARRATION_STOPPED: 'NARRATION_STOPPED',
  NARRATION_CLEANUP: 'NARRATION_CLEANUP',
  STAGE_CHANGE: 'STAGE_CHANGE',                  // { from, to } (canonical)
  START_CLIMAX: 'START_CLIMAX',                  // Trigger climax sequence

  // Quality/tier (canonical: tier)
  QUALITY_CHANGE: 'QUALITY_CHANGE',              // { tier }

  // Scroll / fragments
  ENABLE_SCROLL: 'ENABLE_SCROLL',
  MEMORY_FRAGMENT_CHECK: 'MEMORY_FRAGMENT_CHECK',
  SCROLL_PROGRESS: 'SCROLL_PROGRESS',
  PARTICLE_CLICK_REQUEST: 'PARTICLE_CLICK_REQUEST',
  PARTICLE_CLICK_HIT: 'PARTICLE_CLICK_HIT',
  CLIMAX_STEP: 'CLIMAX_STEP',

  // Audio cues
  AUDIO_COMPUTER_HUM: 'AUDIO_COMPUTER_HUM',

  // Prewarm lifecycle
  PREWARM_GENESIS_BLUEPRINT: 'PREWARM_GENESIS_BLUEPRINT',
  PREWARM_COMPLETE: 'PREWARM_COMPLETE',

  // Director control / errors
  DIRECTOR_CANCEL: 'DIRECTOR_CANCEL',
  DIRECTOR_ERROR: 'DIRECTOR_ERROR',
};

// Contract envelope:
//   • Every emitted contract event SHOULD include { source: string, channel: 'renderer'|'engine'|'director', timestamp?: number }
//     so waiters can filter by producer/origin.
//
// RENDER_DIRECTIVE payload contract (high-level intent that the renderer maps to GPU writes):
// {
//   source: 'opening_sequence' | 'narration' | 'diagnostic' | ...,
//   channel?: 'renderer',              // renderer may add when re-emitting fenceposts
//   phase?: 'chaos'|'coalesce'|'settle'|'emergence',
//   stage?: string,
//   uMotionMode?: number,
//   uParticlePhase?: number,
//   uFlowTurbulence?: number,
//   uParticleFlash?: number,
//   uOpacityMin?: number,
//   uOpacityMax?: number,
//   uMorphProgress?: number,           // renderer maps to the uniform
//   uStageProgress?: number,
//   pointSize?: number,                // renderer maps to uPointSize
//   activeCount?: number,              // renderer maps to geometry.setDrawRange
//   gaussianSigma?: number,
//   tierHighlight?: number[],
//   uniforms?: Record<string, number[]|number>,
// }

// SST v3.x — Memory Fragment trigger points (scroll %)
export const FRAGMENT_TRIGGERS = {
  genesis: 5,
  discipline: 20,
  neural: 35,
  velocity: 49,
  architecture: 63,
  harmony: 77,
  transcendence: 92,
};

// Stage → audio file mapping (example placeholders)
export const STAGE_AUDIO = {
  genesis: 'genesis-hum.mp3',
  discipline: 'discipline-march.mp3',
  neural: 'neural-synapse.mp3',
  velocity: 'velocity-thunder.mp3',
  architecture: 'architecture-build.mp3',
  harmony: 'harmony-flow.mp3',
  transcendence: 'transcendence-cosmos.mp3',
};

// Dev convenience: expose catalog for console use (source of truth remains ESM)
if (typeof window !== 'undefined') {
  try {
    const isDevHost = /^(localhost|127\.|0\.0\.0\.0)$/i.test(location.hostname);
    if (isDevHost) window.EVENTS = EVENTS;
  } catch {}
}

export default EVENTS;

```

### File: src/config/sst3/narrative-dialogue.js

```
import { Canonical } from '@/config/canonical/canonicalAuthority.js';

const DEFAULT_CHARS_PER_SECOND = 15;
const MIN_CHARS_PER_SECOND = 4;
const MAX_CHARS_PER_SECOND = 45;

function coerceNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cloneBeat(beat) {
  try {
    return structuredClone(beat);
  } catch {
    return JSON.parse(JSON.stringify(beat || null));
  }
}

const CANONICAL_STAGE_ORDER = Array.isArray(Canonical?.stageOrder)
  ? Canonical.stageOrder
  : Object.keys(Canonical?.stages || {});

function getBeatSheet(stageName) {
  if (!stageName) return null;
  if (typeof Canonical?.getBeatSheet === 'function') {
    const sheet = Canonical.getBeatSheet(stageName);
    if (sheet) return sheet;
  }
  return Canonical?.narrative?.beatSheets?.[stageName] || null;
}

function normalizeStageName(stageName) {
  if (!stageName) return null;
  const trimmed = String(stageName).trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  const match = CANONICAL_STAGE_ORDER.find((name) => name.toLowerCase() === lower);
  return match || lower || null;
}

function computeDurationMs(text, declaredDuration) {
  const safeText = normalizeText(text);
  const declared = coerceNumber(declaredDuration, 0);
  if (declared > 0) return declared;
  if (!safeText.length) return 0;
  return Math.round((safeText.length / DEFAULT_CHARS_PER_SECOND) * 1000);
}

function computeCharsPerSecond(text, durationMs) {
  const safeText = normalizeText(text);
  const safeDuration = Math.max(durationMs, 1);
  const cps = safeText.length ? (safeText.length / (safeDuration / 1000)) : DEFAULT_CHARS_PER_SECOND;
  if (!Number.isFinite(cps) || cps <= 0) return DEFAULT_CHARS_PER_SECOND;
  return Math.max(MIN_CHARS_PER_SECOND, Math.min(MAX_CHARS_PER_SECOND, cps));
}

function resolveNarrationOffset(stageName) {
  const stage = Canonical?.stages?.[stageName] || {};
  const stageTimeline = stage?.openingTimeline || {};
  const narrativeStage = Canonical?.narrative?.stages?.[stageName] || {};
  const narrativeTimeline = narrativeStage?.timeline || {};

  const offsets = [
    stageTimeline?.narration?.startAtMs,
    stageTimeline?.narrationStartMs,
    narrativeTimeline?.narration?.startAtMs,
    narrativeTimeline?.narrationStartMs,
  ].map((value) => coerceNumber(value, 0));

  return offsets.find((value) => value > 0) ?? 0;
}

function buildStageNarrative(stageName) {
  const normalizedName = normalizeStageName(stageName);
  if (!normalizedName) return null;

  const beatSheet = getBeatSheet(normalizedName);
  if (!beatSheet) return null;

  const beats = Array.isArray(beatSheet.beats) ? beatSheet.beats : [];
  if (!beats.length) return null;

  const startOffset = resolveNarrationOffset(normalizedName);
  const normalizedSegments = [];
  let maxEndMs = 0;

  beats.forEach((beat, index) => {
    const narration = beat?.narration || {};
    const text = normalizeText(narration.text || beat?.text || '');
    const baseDuration = computeDurationMs(text, narration.duration ?? beat?.duration);
    const start = Math.max(0, coerceNumber(beat?.time, 0) + startOffset);
    const duration = Math.max(0, baseDuration);
    const endTime = start + duration;
    if (endTime > maxEndMs) {
      maxEndMs = endTime;
    }

    const lineType = narration.type || beat?.type || null;

    const segment = Object.freeze({
      id: narration.id || beat?.id || `${stageName}_beat_${index}`,
      text,
      timing: Object.freeze({
        start,
        duration,
      }),
      visual: beat?.visual ?? narration.visual ?? null,
      lineType: lineType || null,
      charsPerSecond: narration.charsPerSecond
        ? coerceNumber(narration.charsPerSecond, DEFAULT_CHARS_PER_SECOND)
        : computeCharsPerSecond(text, duration || 1),
      metadata: Object.freeze({
        beatIndex: index,
        canonicalTime: coerceNumber(beat?.time, 0),
      }),
    });

    normalizedSegments.push(segment);
  });

  const totalDuration = coerceNumber(beatSheet?.totalDuration, maxEndMs);

  return Object.freeze({
      id: beatSheet?.id || `narration_${normalizedName}`,
      stage: normalizedName,
    totalDuration,
    startOffset,
    beats: Object.freeze(beats.map(cloneBeat)),
    narration: Object.freeze({
      segments: Object.freeze(normalizedSegments),
    }),
  });
}

const dialogueCache = Object.create(null);

function ensureStage(stageName) {
  const normalized = normalizeStageName(stageName);
  if (!normalized) return null;
  if (dialogueCache[normalized]) return dialogueCache[normalized];
  const built = buildStageNarrative(normalized);
  if (!built) return null;
  dialogueCache[normalized] = built;
  return built;
}

export const NARRATIVE_DIALOGUE = new Proxy({}, {
  get(_target, key) {
    if (typeof key !== 'string') return undefined;
    return ensureStage(key) || undefined;
  },
  has(_target, key) {
    if (typeof key !== 'string') return false;
    return Boolean(ensureStage(key));
  },
  ownKeys() {
    return Canonical?.stageOrder || Object.keys(Canonical?.narrative?.beatSheets || {});
  },
  getOwnPropertyDescriptor(target, prop) {
    if (!this.has(target, prop)) return undefined;
    return {
      enumerable: true,
      configurable: true,
    };
  },
});

export function getNarrativeForStage(stageName) {
  const stage = ensureStage(stageName);
  if (!stage) return null;
  return stage;
}

export function getNarrationSegments(stageName) {
  const stage = ensureStage(stageName);
  if (!stage) return [];
  // Return defensive copies to prevent mutation downstream.
  return stage.narration.segments.map((segment) => ({
    ...segment,
    timing: { ...segment.timing },
    lineType: segment.lineType || null,
    metadata: { ...segment.metadata },
  }));
}

export function getDialogueSegment(stageName, segmentId) {
  if (!segmentId) return null;
  const segments = getNarrationSegments(stageName);
  return segments.find((segment) => segment.id === segmentId) || null;
}

export function getParticleCuesForStage(stageName) {
  const segments = getNarrationSegments(stageName);
  if (!segments.length) return [];
  return segments
    .filter((segment) => segment.visual)
    .map((segment) => ({
      timing: segment.timing.start,
      cue: segment.visual,
      segmentId: segment.id,
    }));
}

```


## Your Input Expectations
Architect’s specification, the included code files, and any existing contracts or invariants.

## Your Output Expectations
Return JSON-like sections: root_causes[], fix_surface[], do_not_touch[]. Each root cause should be labeled (RC1, RC2, …) and mapped to specific files/functions to change.

---
## Instructions
- Stay within your mission and invariants.
- Respect existing contracts (schema, Canon, tests, single-writer).
- If you propose code changes, show them as diffs or full snippets.
- If you rely on behavior from other files not shown, state your assumptions.

## Begin your reasoning and output below:

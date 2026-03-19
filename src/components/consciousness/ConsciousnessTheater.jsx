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
import { emitRenderDirective } from '@/theater/bus/emitters.js';
import { NarrativeChoreography } from '@/components/narrative/NarrativeChoreography.jsx';

console.log('🧬 LOADED: ConsciousnessTheater — race-free opening (DEV-safe cancel)');

const GENESIS_STAGE_WORD = Canonical?.visual?.letterGeometry?.genesis?.word || 'GENESIS';
const LANDING_SLICE_DEMO_KEY = 'landing_stage_slice';
const LANDING_SLICE_DEMO_KEY_PREFIX = `${LANDING_SLICE_DEMO_KEY}__`;
const LANDING_VELOCITY_PRESET_KEY = 'velocity_stage';
const LANDING_VELOCITY_DEMO_KEY = `${LANDING_SLICE_DEMO_KEY_PREFIX}${LANDING_VELOCITY_PRESET_KEY}`;

const isLandingSliceDemoKey = (demoKey) =>
  typeof demoKey === 'string' &&
  (demoKey === LANDING_SLICE_DEMO_KEY || demoKey.startsWith(LANDING_SLICE_DEMO_KEY_PREFIX));

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

const clamp01 = (value) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

const FormVoidPlacard = ({ copy }) => {
  if (!copy) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 6,
      }}
    >
      <div
        style={{
          padding: '18px 22px',
          borderRadius: '12px',
          background: 'rgba(10, 12, 16, 0.72)',
          border: '1px solid rgba(220, 230, 242, 0.35)',
          color: '#e8eef6',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          textAlign: 'center',
          maxWidth: '360px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
          pointerEvents: 'auto',
        }}
      >
        <div style={{ fontSize: '1.05rem', fontWeight: 600, letterSpacing: '0.08em' }}>
          {copy.name}
        </div>
        <div style={{ fontSize: '0.85rem', marginTop: '6px', opacity: 0.75 }}>
          {copy.title}
        </div>
        <div style={{ fontSize: '0.95rem', marginTop: '14px', lineHeight: 1.4 }}>
          {copy.line}
        </div>
        {copy.ctaHref ? (
          <a
            href={copy.ctaHref}
            style={{
              display: 'inline-block',
              marginTop: '12px',
              fontSize: '0.9rem',
              color: '#e8eef6',
              textDecoration: 'underline',
              opacity: 0.9,
              pointerEvents: 'auto',
            }}
          >
            {copy.cta}
          </a>
        ) : (
          <div style={{ fontSize: '0.9rem', marginTop: '12px', opacity: 0.85 }}>
            {copy.cta}
          </div>
        )}
      </div>
    </div>
  );
};

export default function ConsciousnessTheater({ mode } = {}) {
  const isLandingSliceMode = mode === 'landing_stage';
  const isDemoMode =
    typeof window !== 'undefined' && window.__DEMO_MODE__ === true;
  const demoKey =
    typeof window !== 'undefined' && isDemoMode ? window.__DEMO_KEY__ : null;
  const isLandingSliceDemo = isLandingSliceDemoKey(demoKey);
  const currentStage = useAtomValue(stageAtom, (state) => state.currentStage);
  const scrollProgress = useAtomValue(stageAtom, (state) => state.globalProgress ?? 0);
  const morphProgress = useAtomValue(narrativeAtom, (state) => state.morphProgress);
  const [isInitialized, setIsInitialized] = useState(false);
  const [formCameraMode, setFormCameraMode] = useState('rest');
  const [formCameraProgress, setFormCameraProgress] = useState(0);
  const [formDemoScrollEnabled, setFormDemoScrollEnabled] = useState(false);
  const [showVoidPlacard, setShowVoidPlacard] = useState(false);
  const showCanvas = true;

  const formLandingConfig = Canonical?.landingModes?.form || null;
  const formConfig = isLandingSliceMode ? formLandingConfig : null;
  const formPlacardCopy = formLandingConfig?.ui?.voidCopy;
  const showFormPlacard = isLandingSliceMode && showVoidPlacard;
  const currentStageRef = useRef(currentStage || 'genesis');
  const morphProgressRef = useRef(0);
  const directorStartedRef = useRef(false);
  const viewportReadyRef = useRef(false);
  const arrowKeyDebounce = useRef(createDebouncer(150)).current;

  const _stageConfig = Canonical.stages[currentStage];
  const formStage = isLandingSliceMode ? formConfig?.stage || 'genesis' : currentStage;
  const formMorphProgress = isLandingSliceMode ? 1 : morphProgress;
  const formRenderScroll = isLandingSliceMode ? 0 : scrollProgress;
  const allowFormScroll = isLandingSliceMode && formDemoScrollEnabled;
  // Canonical form camera input: consume stageAtom globalProgress (driven by ScrollOrchestrator).
  const formScrollInput = allowFormScroll ? clamp01(scrollProgress) : 0;
  const allowFormPlacard = isLandingSliceMode;
  const formCameraOverride = allowFormScroll
    ? {
        mode: formCameraMode,
        targetGlyph: 'O',
        progress: formCameraProgress,
        useGlyphCamera: isLandingSliceMode || isLandingSliceDemo,
        glyphMode: 'enter',
        glyphOccurrence: 1,
      }
    : null;
  const {
    activeFragments,
    fragmentStates,
    triggerFragment,
    dismissFragment,
  } = useMemoryFragments(currentStage, scrollProgress * 100, null);
  const triggerFragmentRef = useRef(triggerFragment);
  triggerFragmentRef.current = triggerFragment;

  useEffect(() => {
    if (isLandingSliceMode) return;
    morphProgressRef.current = morphProgress;
  }, [isLandingSliceMode, morphProgress]);

  useEffect(() => {
    if (isLandingSliceMode) return;
    if (!currentStage) return;
    currentStageRef.current = currentStage;
    if (typeof qualityAtom.updateParticleBudget === 'function') {
      qualityAtom.updateParticleBudget(currentStage);
    }
  }, [currentStage, isLandingSliceMode]);

  useEffect(() => {
    if (!allowFormScroll) return;
    const p = clamp01(formScrollInput);
    if (p < 0.15) {
      setFormCameraMode('rest');
      setFormCameraProgress(0);
      return;
    }
    if (p < 0.4) {
      setFormCameraMode('threshold');
      setFormCameraProgress(clamp01((p - 0.15) / 0.25));
      return;
    }
    setFormCameraMode('interior');
    setFormCameraProgress(clamp01((p - 0.4) / 0.6));
  }, [formScrollInput, allowFormScroll]);

  useEffect(() => {
    if (!allowFormPlacard) return;
    let timeoutId = null;
    const shouldShow =
      formCameraMode === 'interior' && formCameraProgress > 0.95;
    if (shouldShow) {
      timeoutId = setTimeout(() => setShowVoidPlacard(true), 800);
    } else {
      setShowVoidPlacard(false);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [formCameraMode, formCameraProgress, allowFormPlacard]);

  // ───────────────── Director start AFTER viewport hint; scroll locked until ENABLE_SCROLL
  useEffect(() => {
    const demoCleanups = [];
    // 1) Listen for viewport hint sent by WebGLBackground
    const offHint = BeatBus.on(EVENTS.ENGINE_VIEWPORT_HINT, () => {
      viewportReadyRef.current = true;
    });

    // 2) Start Director once, after hint (demo mode bypasses opening/narration)
    const tick = setInterval(() => {
      if (!directorStartedRef.current && viewportReadyRef.current) {
        // Demo mode: bypass opening, narration, scroll orchestration
        const forcedLandingDemoKey = isLandingSliceMode && !globalThis.__DEMO_MODE__
          ? (Canonical?.landingStageSliceResolved?.demoKey || LANDING_SLICE_DEMO_KEY)
          : null;
        if ((globalThis.__DEMO_MODE__ && globalThis.__DEMO_KEY__) || forcedLandingDemoKey) {
          const activeDemoKey = forcedLandingDemoKey || globalThis.__DEMO_KEY__;
          const isLandingSliceFlow = isLandingSliceMode || isLandingSliceDemoKey(activeDemoKey);
          const landingResolved = Canonical?.landingStageSliceResolved || null;
          const landingParams =
            typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const requestedPreset = (landingParams?.get('preset') || '').trim();
          const landingPreset = landingResolved?.preset || requestedPreset || null;
          const isVelocityLandingStageRoute =
            isLandingSliceMode && landingPreset === LANDING_VELOCITY_PRESET_KEY;
          const blockedVelocityLandingDemoPath =
            activeDemoKey === LANDING_VELOCITY_DEMO_KEY && !isVelocityLandingStageRoute;
          if (blockedVelocityLandingDemoPath) {
            if (import.meta.env.DEV) {
              console.error(
                '[ConsciousnessTheater] Blocked velocity landing demo path. Use ?slice=landing_stage&preset=velocity_stage.',
                {
                  activeDemoKey,
                  landingPreset,
                  isLandingSliceMode,
                }
              );
            }
          } else {
            const useStageModeLanding = isLandingSliceFlow && isVelocityLandingStageRoute;
          const landingQuality =
            (landingResolved?.quality || qualityAtom.getState?.()?.currentQualityTier || 'HIGH')
              .toString()
              .toUpperCase();
          const formWord =
            (Canonical?.landingModes?.form?.word || '').trim() || 'FORM';
          const formStageName =
            (Canonical?.landingModes?.form?.stage || 'genesis').toString().trim() || 'genesis';
          const formStageConfig =
            Canonical?.getResolvedStageByName?.(formStageName) ||
            Canonical?.stages?.[formStageName] ||
            null;
          const formTierRatios =
            Array.isArray(formStageConfig?.tierMix) &&
            formStageConfig.tierMix.length === 4
              ? formStageConfig.tierMix
              : null;
          const formCount = Number(Canonical?.landingModes?.form?.particlesBase) || 9000;
          if (useStageModeLanding) {
            console.log('[ConsciousnessTheater] Landing stage mode detected', {
              preset: landingPreset,
              stage: formStageName,
              quality: landingQuality,
            });
          } else {
            console.log(`[ConsciousnessTheater] Demo mode detected, running: ${activeDemoKey}`);
          }

          // Stop ScrollOrchestrator for non-interactive demos only
          if (useStageModeLanding) {
            director.scrollOrchestrator?.stop?.();
          } else if (
            director.scrollOrchestrator &&
            activeDemoKey !== 'demo_intent_v2' &&
            !isLandingSliceDemoKey(activeDemoKey)
          ) {
            director.scrollOrchestrator.stop();
          } else if (director.scrollOrchestrator && isLandingSliceDemoKey(activeDemoKey)) {
            director.scrollOrchestrator.start();
          }

          const hideInstantLoader = () => {
            try {
              const el = document.getElementById('instant-loader');
              if (el) el.classList.add('hidden');
            } catch {}
          };

          // Wait for blueprint bind, then start demo
          let demoBlueprintReady = false;
          let rendererReady = false;
          let emergenceRequested = false;
          let pendingActiveCount = null;
          let stageModeStarted = false;
          const deterministicBoot =
            typeof window !== 'undefined' && window.__DETERMINISTIC_MODE__ === true;

          const requestEmergenceBlueprint = () => {
            if (emergenceRequested) return;
            emergenceRequested = true;
            BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {
              mode: 'emergence',
              target: isLandingSliceFlow ? formStageName : 'genesis',
              stageName: isLandingSliceFlow ? formStageName : 'genesis',
              targetState: isLandingSliceFlow ? `${formStageName}_initial` : 'genesis_initial',
              source: 'demo',
              count: isLandingSliceFlow ? formCount : 12000,
              ...(isLandingSliceFlow ? { sourceText: formWord } : {}),
              ...(isLandingSliceFlow && formTierRatios ? { tierRatios: formTierRatios } : {}),
              fastForward: deterministicBoot,
              skipMorphAnimation: deterministicBoot,
            });
          };

          const scheduleVelocityLandingBeats = () => {
            const beats = Canonical?.visualDemos?.[activeDemoKey]?.beats || [];
            if (!Array.isArray(beats) || beats.length === 0) return;
            const buildVelocityDirective = (beat = {}) => {
              const atMsRaw = Number(beat?.atMs);
              if (!Number.isFinite(atMsRaw)) return null;
              const atMs = Math.max(0, Math.floor(atMsRaw));
              const params = beat?.params && typeof beat.params === 'object' ? beat.params : {};
              const paramUniforms =
                params.uniforms && typeof params.uniforms === 'object'
                  ? { ...params.uniforms }
                  : null;
              const hasCameraParams = params.camera && typeof params.camera === 'object';
              const isRevealWindow = atMs >= 2400;
              const beatDurationRaw = Number(beat?.durationMs);
              const beatDurationMs = Number.isFinite(beatDurationRaw)
                ? Math.max(0, beatDurationRaw)
                : null;
              const pointSizeRaw = Number(params.pointSize);
              const pointSize = Number.isFinite(pointSizeRaw)
                ? Math.max(0.5, Math.min(pointSizeRaw, 12.0))
                : (isRevealWindow ? 9 : null);
              const camera = hasCameraParams
                ? { ...params.camera }
                : (isRevealWindow
                    ? {
                        position: { x: 0, y: 0, z: 44 },
                        fov: 84,
                        durationMs: beatDurationMs != null ? beatDurationMs : 4200,
                      }
                    : null);
              const durationMs =
                beatDurationMs != null
                  ? Math.min(1600, Math.max(220, Math.round(beatDurationMs * (isRevealWindow ? 0.55 : 0.45))))
                  : null;
              const easing =
                typeof beat?.easing === 'string' && beat.easing.length
                  ? beat.easing
                  : 'smoothstep';
              if (!camera && pointSize == null) return null;
              const paramFlowTurbulenceRaw = Number(paramUniforms?.uFlowTurbulence);
              const paramFlowTurbulence = Number.isFinite(paramFlowTurbulenceRaw)
                ? Math.max(0, Math.min(2, paramFlowTurbulenceRaw))
                : null;
              if (paramUniforms && 'uFlowTurbulence' in paramUniforms) {
                delete paramUniforms.uFlowTurbulence;
              }
              const directiveUniforms = {
                ...(isRevealWindow ? {
                  uSpreadFactor: 1.2,
                  uCenterWeighting: 1.2,
                  uDepthFalloffPower: 1.6,
                  uStreakIntensity: 0.05,
                } : {}),
                ...(paramUniforms || {}),
              };
              const hasDirectiveUniforms = Object.keys(directiveUniforms).length > 0;
              const resolvedFlowTurbulence =
                paramFlowTurbulence != null
                  ? paramFlowTurbulence
                  : (isRevealWindow ? 0.25 : null);
              const mediumImmersiveBoost =
                (resolvedFlowTurbulence != null || hasDirectiveUniforms)
                  ? {
                      ...(resolvedFlowTurbulence != null ? { uFlowTurbulence: resolvedFlowTurbulence } : {}),
                      ...(hasDirectiveUniforms ? { uniforms: directiveUniforms } : {}),
                    }
                  : null;
              return {
                atMs,
                idx: Number(beat?.idx) || 0,
                verb: typeof beat?.verb === 'string' ? beat.verb : null,
                camera,
                pointSize,
                mediumImmersiveBoost,
                isRevealWindow,
                durationMs,
                easing,
              };
            };

            const resolvedBeats = beats
              .map((beat, idx) => buildVelocityDirective({ ...beat, idx }))
              .filter(Boolean);
            if (resolvedBeats.length === 0) return;

            const emitVelocityBeatDirective = (beat, override = {}) => {
              emitRenderDirective({
                source: 'visual_orchestrator',
                phase: 'landing_stage_mode_velocity',
                stage: formStageName,
                ...(beat.verb ? { verb: beat.verb } : {}),
                ...(beat.camera ? { camera: beat.camera } : {}),
                ...(beat.pointSize != null ? { pointSize: beat.pointSize } : {}),
                ...(beat.durationMs != null ? { durationMs: beat.durationMs } : {}),
                ...(beat.easing ? { easing: beat.easing } : {}),
                ...(beat.mediumImmersiveBoost || {}),
                ...override,
              });
            };

            if (deterministicBoot) {
              const finalBeat =
                resolvedBeats.find((beat) => beat.isRevealWindow && beat.atMs >= 2400)
                || resolvedBeats[resolvedBeats.length - 1];
              if (!finalBeat) return;
              const camera = finalBeat.camera
                ? { ...finalBeat.camera, durationMs: 0 }
                : null;
              emitRenderDirective({
                source: 'visual_orchestrator',
                phase: 'landing_stage_mode_velocity_deterministic',
                stage: formStageName,
                ...(finalBeat.verb ? { verb: finalBeat.verb } : {}),
                ...(camera ? { camera } : {}),
                ...(finalBeat.pointSize != null ? { pointSize: finalBeat.pointSize } : {}),
                durationMs: 0,
                ...(finalBeat.easing ? { easing: finalBeat.easing } : {}),
                ...(finalBeat.mediumImmersiveBoost || {}),
                uniforms: {
                  ...(finalBeat.mediumImmersiveBoost?.uniforms || {}),
                  uMorphProgress: 1,
                  uPostMorphFreeze: 1,
                },
              });
              if (import.meta.env.DEV) {
                console.log('[ConsciousnessTheater] Applied deterministic velocity landing pose', {
                  idx: finalBeat.idx,
                  stage: formStageName,
                });
              }
              return;
            }

            resolvedBeats.forEach((beat) => {
              if (beat.atMs === 0) {
                emitVelocityBeatDirective(beat, { durationMs: 0 });
                const reinforceTimerId = setTimeout(() => {
                  emitVelocityBeatDirective(beat, { durationMs: 0 });
                }, 64);
                demoCleanups.push(() => clearTimeout(reinforceTimerId));
                if (import.meta.env.DEV) {
                  console.log('[ConsciousnessTheater] Applied landing velocity beat immediately', {
                    idx: beat.idx,
                    atMs: beat.atMs,
                    hasCamera: !!beat.camera,
                    pointSize: beat.pointSize,
                  });
                }
                return;
              }
              const timerId = setTimeout(() => {
                emitVelocityBeatDirective(beat);
              }, beat.atMs);
              demoCleanups.push(() => clearTimeout(timerId));
              if (import.meta.env.DEV) {
                console.log('[ConsciousnessTheater] Scheduled landing velocity beat', {
                  idx: beat.idx,
                  atMs: beat.atMs,
                  hasCamera: !!beat.camera,
                  pointSize: beat.pointSize,
                });
              }
            });
          };

          const maybeStartDemo = () => {
            console.log('[DemoGate] maybeStartDemo', {
              demoBlueprintReady,
              rendererReady,
              useStageModeLanding,
              pendingActiveCount,
              timestamp: (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(),
            });
            if (!rendererReady) return;
            if (!useStageModeLanding && !demoBlueprintReady) return;
            try {
              hideInstantLoader();
              const loader = document.getElementById('instant-loader');
              if (loader) {
                loader.classList.add('hidden');
                loader.style.display = 'none';
              }
              if (useStageModeLanding) {
                if (stageModeStarted) return;
                stageModeStarted = true;
                setFormDemoScrollEnabled(false);
                setShowVoidPlacard(false);
                try {
                  qualityAtom.setCurrentQualityTier?.(landingQuality);
                } catch {}
                BeatBus.emit(EVENTS.ENABLE_SCROLL, {
                  source: 'landing_stage_mode_velocity',
                });
                try {
                  window.stageControls?.setAutoAdvanceEnabled?.(false);
                  window.stageControls?.pauseAutoAdvance?.();
                } catch {}
                stateCommands.setStage?.(formStageName, {
                  origin: 'landing_stage_mode_velocity',
                  forceEmit: true,
                });
                scheduleVelocityLandingBeats();
                console.log('[ConsciousnessTheater] Landing stage mode started', {
                  stage: formStageName,
                  preset: landingPreset,
                  quality: landingQuality,
                });
                return;
              }
              const startMorph =
                activeDemoKey === 'demo_intent_v2'
                  ? 0
                  : (isLandingSliceFlow && !deterministicBoot ? 0 : 0.98);
              director.setMorphImmediate?.(startMorph, {
                source: 'theater_demo_boot_intent',
              });
              emitRenderDirective({
                source: 'visual_orchestrator',
                phase: 'visual_demo',
                stage: isLandingSliceFlow ? formStageName : 'genesis',
                uMorphProgress: startMorph,
                uStageProgress: 1,
                uOpacityMin: 0.5,
                uOpacityMax: 1.0,
                drawCount: pendingActiveCount,
                activeCount: pendingActiveCount,
                pointSize: isLandingSliceFlow ? 3 : 48,
              });
              if (activeDemoKey === LANDING_VELOCITY_DEMO_KEY) {
                if (import.meta.env.DEV) {
                  console.error(
                    '[ConsciousnessTheater] Blocked runVisualDemo for velocity landing key. Stage-mode landing is required.',
                    { activeDemoKey }
                  );
                }
                return;
              }
              director.runVisualDemo(activeDemoKey);
              if (isLandingSliceFlow) {
                const beats =
                  Canonical?.visualDemos?.[activeDemoKey]?.beats ||
                  Canonical?.visualDemos?.[LANDING_SLICE_DEMO_KEY]?.beats ||
                  [];
                const settleBeat =
                  beats.find((beat) => beat?.verb === 'settle') || beats?.[1] || null;
                const settleAtMs = Number.isFinite(settleBeat?.atMs) ? settleBeat.atMs : 0;
                const settleDurationMs = Number.isFinite(settleBeat?.durationMs)
                  ? settleBeat.durationMs
                  : 0;
                const enableAtMs = Math.max(0, settleAtMs + settleDurationMs);
                setFormDemoScrollEnabled(false);
                setShowVoidPlacard(false);
                const enableTimer = setTimeout(() => {
                  setFormDemoScrollEnabled(true);
                }, enableAtMs);
                demoCleanups.push(() => clearTimeout(enableTimer));
                demoCleanups.push(() => setFormDemoScrollEnabled(false));
              }
              console.log(`[ConsciousnessTheater] Demo started: ${activeDemoKey}`);
            } catch (err) {
              console.error('[ConsciousnessTheater] Demo failed to start:', err);
            }
          };

          const offBlueprint = BeatBus.on(EVENTS.BLUEPRINT_READY, (p = {}) => {
            const expectedStage = isLandingSliceFlow ? formStageName : 'genesis';
            const payloadStage = p?.stage || null;
            const blueprintStage = p?.blueprint?.stageName || p?.blueprint?.stage || null;
            const stageMatches =
              payloadStage === expectedStage || blueprintStage === expectedStage;
            if (!stageMatches) return;
            pendingActiveCount =
              p?.activeCount ??
              p?.blueprint?.activeCount ??
              p?.blueprint?.particleCount ??
              null;
            demoBlueprintReady = true;
            console.log('[DemoGate] BLUEPRINT_READY', {
              expectedStage,
              payloadStage,
              blueprintStage,
              pendingActiveCount,
              timestamp: (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(),
            });
            maybeStartDemo();
          });

          const checkRendererReady = () => {
            try {
              if (window.__rendererListenersReady === true) {
                rendererReady = true;
                console.log('[DemoGate] Renderer already ready on check (__rendererListenersReady)');
                if (!useStageModeLanding) {
                  requestEmergenceBlueprint();
                }
                maybeStartDemo();
                return true;
              }
            } catch {}
            return false;
          };

          const offRendererReady = BeatBus.on(EVENTS.FENCEPOST_LISTENERS_READY, (payload = {}) => {
            if (payload?.channel !== 'renderer') return;
            rendererReady = true;
            console.log('[DemoGate] FENCEPOST_LISTENERS_READY (renderer)', {
              payload,
              timestamp: (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(),
            });
            if (!useStageModeLanding) {
              requestEmergenceBlueprint();
            }
            maybeStartDemo();
          });
          demoCleanups.push(offBlueprint, offRendererReady);

          // Immediate check in case renderer ready fired before listener registration
          checkRendererReady();
          // Timeout fallback if fencepost is missed
          const fallbackTimeout = setTimeout(() => {
            if (!rendererReady) {
              console.log('[DemoGate] Forcing rendererReady via timeout fallback');
              rendererReady = true;
              if (!useStageModeLanding) {
                requestEmergenceBlueprint();
              }
              maybeStartDemo();
            }
          }, 1000);
          demoCleanups.push(() => clearTimeout(fallbackTimeout));

          directorStartedRef.current = true;
          clearInterval(tick);
          return;
          }
        }

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
      demoCleanups.forEach((off) => off && off());
      try { document.body.style.overflow = ''; } catch {}
      if (!import.meta.env.DEV || window.__HARD_UNMOUNT__) {
        try { director.cancel(); } catch {}
      }
      directorStartedRef.current = false;
      viewportReadyRef.current = false;
    };
  }, [isLandingSliceMode, isDemoMode]);

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
    if (isLandingSliceMode) return;
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
  }, [isLandingSliceMode, isInitialized]);

  // ───────────────── Render
  return (
    <div className="consciousness-theater-v3">
      {!isLandingSliceMode && <OpeningSequence />}

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
          stage={formStage}
          morphProgress={formMorphProgress}
          scrollProgress={formRenderScroll}
          cameraOverride={formCameraOverride}
        />
      )}

      {showFormPlacard && <FormVoidPlacard copy={formPlacardCopy} />}

      {/* Narrative choreography overlay */}
      {!isLandingSliceMode && <NarrativeChoreography />}

      {/* Memory fragments */}
      {!isLandingSliceMode &&
        activeFragments.map((fragment) => {
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

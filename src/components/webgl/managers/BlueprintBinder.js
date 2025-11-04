/**
 * Blueprint Geometry Binder
 * Extracted from WebGLBackground.jsx lines ~800-1500.
 *
 * Handles:
 * - Blueprint geometry creation and binding
 * - BufferAttribute lifecycle management
 * - Material uniform synchronisation
 * - Resource disposal and cleanup
 * - BeatBus BLUEPRINT_READY integration
 * - QR mode state management
 */

import * as THREE from 'three';
import { EVENTS } from '@/theater/events.js';
import { clamp01, mapBehaviorToMode, morphTypeToInt, hexToRGBArray } from '../utils/backgroundMath.js';
import { autoscaleQrPositions } from '../utils/qrScaling.js';
import { applyMetadataColors } from '../utils/paletteUtils.js';

const disposeAttributes = (geometry) => {
  if (!geometry || !geometry.attributes) return;
  Object.keys(geometry.attributes).forEach((name) => {
    const attribute = geometry.attributes[name];
    if (attribute?.dispose) {
      attribute.dispose();
    }
    geometry.deleteAttribute(name);
  });
  if (geometry.index) {
    geometry.setIndex(null);
  }
};

export const createBlueprintBinder = ({
  refs = {},
  state = {},
  services = {},
  config = {},
  context = {},
  beatBus,
  events = EVENTS,
  normalizePayload,
}) => {
  const {
    geometryRef,
    materialRef,
    viewportHintRef,
    geometryBoundOnceRef,
    fitsLockedRef,
    ignoreDirectivesRef,
    fenceReadyRef,
    emergencePendingRef,
    emittedEmergedRef,
    lastPointSizeRef,
    timeTickEnabledRef,
    hotspotMapRef,
    lastBlueprintIdRef,
    lastBlueprintMetaRef,
    fallbackMorphRef,
    qrModeRef,
    renderGuardRef,
  } = refs;

  const { setBlueprint, setStageName, setActiveCount } = state;

  const {
    applyRendererFitsToViewport,
    updateBandHeight,
    logBind,
    scheduleRuntimeSampling,
    clearPendingFencepost,
    emitFencepostNow,
    finalizeEmergence,
    rendererState,
  } = services;

  const {
    Canonical,
    VC,
  } = config;

  const {
    trace,
    dev = false,
  } = context;

  const bus = beatBus;
  const blueprintEvent = events?.BLUEPRINT_READY ?? EVENTS.BLUEPRINT_READY;

  const applyDirective = (payload = {}) => {
    if (!payload) return false;
    if (ignoreDirectivesRef?.current) {
      if (dev) {
        console.warn('[BlueprintBinder] Directive ignored due to ignoreDirectivesRef flag', payload);
      }
      return false;
    }

    const directive =
      payload?.directive && typeof payload.directive === 'object'
        ? payload.directive
        : payload;
    const effect =
      directive?.effect && typeof directive.effect === 'object'
        ? directive.effect
        : null;

    if (dev) {
      console.log('🎨 [BlueprintBinder] Directive received', {
        verb: directive?.verb ?? payload?.verb ?? null,
        type: directive?.type || effect?.type || null,
        tiers: directive?.tiers || effect?.tiers || null,
        keys: Object.keys(directive || {}),
      });
      console.log('✅ [BlueprintBinder] Forwarding directive to renderer');
    }

    if (typeof window !== 'undefined') {
      window.__lastRenderDirectiveReceived = {
        payload,
        directive,
        effect,
        at: Date.now(),
      };
    }

    const material = materialRef?.current;
    const geometry = geometryRef?.current;
    const hasMaterial = !!material;
    const hasUniforms = !!material?.uniforms;
    const hasGeometry = !!geometry;

    if (!hasMaterial || !hasUniforms) {
      if (dev) {
        console.warn('[BlueprintBinder] Directive ignored (material not ready)', {
          hasMaterial,
          hasUniforms,
          hasGeometry,
        });
      }
      return false;
    }

    if (!hasGeometry && dev) {
      console.warn('[BlueprintBinder] Directive received before geometry ready; applying material-only updates', {
        verb: directive?.verb ?? payload?.verb ?? null,
      });
    }

    const uniforms = material.uniforms;
    let uniformsDirty = false;
    let appliedCount = 0;

    const get = (key) =>
      directive[key] !== undefined
        ? directive[key]
        : effect && effect[key] !== undefined
        ? effect[key]
        : undefined;

    const toNumber = (value) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : null;
    };

    const setStageIfProvided = () => {
      const stageName = typeof get('stage') === 'string' ? get('stage').trim() : null;
      if (stageName) {
        setStageName?.(stageName);
      }
    };

    const markDirty = (uniform) => {
      if (uniform && typeof uniform.needsUpdate === 'boolean') {
        uniform.needsUpdate = true;
      }
      uniformsDirty = true;
    };

    const setNumberUniform = (key, value) => {
      const num = toNumber(value);
      if (num === null) return false;
      const uniform = uniforms[key];
      if (!uniform) return false;
      const current = Number(uniform.value);
      if (Number.isFinite(current) && Math.abs(current - num) < 1e-4) {
        return false;
      }
      uniform.value = num;
      markDirty(uniform);
      return true;
    };

    const setArrayUniform = (uniform, values) => {
      if (!uniform || uniform.value == null) return false;
      const target = uniform.value;
      const srcArray =
        values instanceof Float32Array
          ? values
          : Array.isArray(values)
          ? values
          : null;
      if (!srcArray) return false;
      const length = target.length || srcArray.length;
      for (let i = 0; i < Math.min(length, srcArray.length); i += 1) {
        target[i] = srcArray[i];
      }
      markDirty(uniform);
      return true;
    };

    const setGridSpacing = (x, y) => {
      const uniform = uniforms.uGridSpacing;
      if (!uniform?.value) return false;
      const nextX = toNumber(x);
      const nextY = toNumber(y);
      let changed = false;
      if (nextX !== null && uniform.value[0] !== nextX) {
        uniform.value[0] = nextX;
        changed = true;
      }
      if (nextY !== null && uniform.value[1] !== nextY) {
        uniform.value[1] = nextY;
        changed = true;
      }
      if (changed) markDirty(uniform);
      return changed;
    };

    const updateTierModes = (modes) => {
      if (!Array.isArray(modes) || !uniforms.uTierMode?.value) return false;
      const target = uniforms.uTierMode.value;
      let changed = false;
      for (let i = 0; i < Math.min(target.length, modes.length); i += 1) {
        const mode = toNumber(modes[i]);
        if (mode === null) continue;
        if (target[i] !== mode) {
          target[i] = mode;
          changed = true;
        }
      }
      if (changed) markDirty(uniforms.uTierMode);
      return changed;
    };

    const updateTierParams = (params) => {
      if (!Array.isArray(params)) return false;
      let changed = false;
      params.slice(0, 4).forEach((tuple, index) => {
        const uniform = uniforms[`uTierParams${index}`];
        if (!uniform?.value || !Array.isArray(tuple)) return;
        const arr = uniform.value;
        let localChange = false;
        for (let i = 0; i < Math.min(arr.length, tuple.length); i += 1) {
          const next = Number(tuple[i]);
          if (!Number.isFinite(next)) continue;
          if (arr[i] !== next) {
            arr[i] = next;
            localChange = true;
          }
        }
        if (localChange) {
          markDirty(uniform);
          changed = true;
        }
      });
      return changed;
    };

    const applyPalette = () => {
      const palette = get('palette') || get('colors');
      if (Array.isArray(palette) && palette.length >= 3) {
        applyMetadataColors(material, palette, VC?.GENESIS_PALETTE);
        uniformsDirty = true;
      }
    };

    const applyCanonicalEffect = () => {
      if (!effect) return;

      const typeRaw = get('type');
      const type = typeof typeRaw === 'string' ? typeRaw.toLowerCase() : null;

      const tiersRaw = get('tiers');
      const tiers = Array.isArray(tiersRaw) && tiersRaw.length > 0 ? tiersRaw : null;
      const targetedTiers =
        tiers ? tiers.map((t) => Number(t)).filter((t) => Number.isFinite(t) && t >= 0 && t <= 3) : [0, 1, 2, 3];

      const highlightFirstTier = () => {
        if (!targetedTiers.length) return;
        setNumberUniform('uTierHighlight', targetedTiers[0]);
      };

      if (effect.uMotionMode !== undefined && setNumberUniform('uMotionMode', effect.uMotionMode)) {
        appliedCount += 1;
      }
      if (effect.uParticlePhase !== undefined && setNumberUniform('uParticlePhase', effect.uParticlePhase)) {
        appliedCount += 1;
      }
      if (effect.uFlowTurbulence !== undefined && setNumberUniform('uFlowTurbulence', effect.uFlowTurbulence)) {
        appliedCount += 1;
      }
      if (effect.uStreakIntensity !== undefined && setNumberUniform('uStreakIntensity', effect.uStreakIntensity)) {
        appliedCount += 1;
      }
      if (effect.uSpreadFactor !== undefined && setNumberUniform('uSpreadFactor', effect.uSpreadFactor)) {
        appliedCount += 1;
      }
      if (effect.uTierHighlight !== undefined && setNumberUniform('uTierHighlight', effect.uTierHighlight)) {
        appliedCount += 1;
      }
      if (effect.uMorphType !== undefined && setNumberUniform('uMorphType', effect.uMorphType)) {
        appliedCount += 1;
      }
      if (effect.uMotionParams !== undefined) setArrayUniform(uniforms.uMotionParams, effect.uMotionParams);

      if (Array.isArray(effect.tierModes)) updateTierModes(effect.tierModes);
      if (Array.isArray(effect.tierParams)) updateTierParams(effect.tierParams);

      const explicitGridSize = toNumber(
        effect.gridSize !== undefined ? effect.gridSize : effect.gridSpacing !== undefined ? effect.gridSpacing : null,
      );
      if (explicitGridSize !== null) {
        setGridSpacing(explicitGridSize, explicitGridSize);
      } else if (effect.gridX !== undefined || effect.gridY !== undefined) {
        const gx = toNumber(effect.gridX);
        const gy = toNumber(effect.gridY ?? effect.gridX);
        setGridSpacing(gx, gy);
      }

      if (type === 'camera') {
        return;
      }

      switch (type) {
        case 'motion': {
          const behavior = get('behavior');
          const info = mapBehaviorToMode(behavior);
          const params = info.params.slice();
          const speed = toNumber(get('speed'));
          const amplitude = toNumber(get('amplitude'));
          if (speed !== null) params[0] = speed;
          if (amplitude !== null) params[1] = amplitude;
          targetedTiers.forEach((tier) => {
            if (tier < 0 || tier > 3) return;
            if (uniforms.uTierMode?.value) {
              uniforms.uTierMode.value[tier] = info.mode;
              markDirty(uniforms.uTierMode);
            }
            const uniform = uniforms[`uTierParams${tier}`];
            if (uniform?.value?.set) {
              uniform.value.set(params);
              markDirty(uniform);
            }
          });
          break;
        }
        case 'flicker': {
          highlightFirstTier();
          const probability = toNumber(get('probability'));
          const intensity = toNumber(get('intensity'));
          const derived = intensity ?? (probability !== null ? Math.min(1.5, Math.max(0.2, probability * 10)) : null);
          if (derived !== null) setNumberUniform('uStreakIntensity', derived);
          break;
        }
        case 'pulse': {
          highlightFirstTier();
          const frequency = toNumber(get('frequency'));
          const intensity = toNumber(get('intensity'));
          const derived = intensity ?? (frequency !== null ? Math.min(1.3, Math.max(0.3, frequency * 2.5)) : 1.0);
          setNumberUniform('uStreakIntensity', derived);
          break;
        }
        case 'sparkle': {
          const sparkle = toNumber(get('intensity')) ?? 1.1;
          setNumberUniform('uStreakIntensity', sparkle);
          break;
        }
        case 'converge': {
          setNumberUniform('uMorphType', morphTypeToInt('reform'));
          setNumberUniform('uSpreadFactor', 0.45);
          break;
        }
        case 'lock': {
          setNumberUniform('uFlowTurbulence', 0.05);
          setNumberUniform('uStreakIntensity', 0.0);
          break;
        }
        case 'formation':
        case 'grid_snap': {
          const spacing = toNumber(get('spacing')) ?? toNumber(get('gridSize')) ?? 0.25;
          setGridSpacing(spacing, spacing);
          break;
        }
        case 'trail': {
          const intensity = toNumber(get('intensity')) ?? 1.2;
          setNumberUniform('uStreakIntensity', intensity);
          setNumberUniform('uFlowTurbulence', Math.max(intensity * 0.6, 0.6));
          break;
        }
        case 'acceleration': {
          const intensity = toNumber(get('intensity')) ?? 1.3;
          setNumberUniform('uStreakIntensity', intensity);
          setNumberUniform('uFlowTurbulence', Math.max(1.0, intensity));
          break;
        }
        case 'breathe': {
          const amplitude = toNumber(get('amplitude')) ?? 0.45;
          setNumberUniform('uFlowTurbulence', amplitude);
          break;
        }
        case 'prime': {
          const spread = toNumber(get('spread')) ?? 0.85;
          setNumberUniform('uSpreadFactor', spread);
          break;
        }
        case 'color_flash': {
          highlightFirstTier();
          applyPalette();
          break;
        }
        case 'color_transition': {
          applyPalette();
          break;
        }
        default:
          break;
      }
    };

    if (renderGuardRef) renderGuardRef.current = true;
    try {
      setStageIfProvided();

      const activeCount = toNumber(get('activeCount'));
      let drawUpdated = false;
      if (activeCount !== null) {
        const count = Math.max(0, Math.floor(activeCount));
        setActiveCount?.(count);
        if (geometry) {
          geometry.setDrawRange(0, count);
        }
        if (uniforms.uActiveCount) {
          uniforms.uActiveCount.value = count;
          markDirty(uniforms.uActiveCount);
        }
        if (uniforms.uTierCutoff) {
          uniforms.uTierCutoff.value = count;
          markDirty(uniforms.uTierCutoff);
        }
        if (typeof window !== 'undefined') {
          window.__lastActiveCount = count;
        }
        drawUpdated = true;
      }

      if (!drawUpdated) {
        const drawCount = toNumber(get('drawCount'));
        if (drawCount !== null) {
          const count = Math.max(0, Math.floor(drawCount));
          if (geometry) {
            geometry.setDrawRange(0, count);
          }
          if (typeof window !== 'undefined') {
            window.__lastActiveCount = count;
          }
        }
      }

      const morphValueRaw = get('morphProgress') ?? get('value');
      const morphValueNum = toNumber(morphValueRaw);
      if (morphValueNum !== null && uniforms.uMorphProgress) {
        const clamped = clamp01(morphValueNum);
        const previous = Number(uniforms.uMorphProgress.value) || 0;
        if (Math.abs(previous - clamped) > 1e-4) {
          uniforms.uMorphProgress.value = clamped;
          markDirty(uniforms.uMorphProgress);
        }
        if (uniforms.uStageProgress) {
          uniforms.uStageProgress.value = clamped;
          markDirty(uniforms.uStageProgress);
        }
        if (fallbackMorphRef) fallbackMorphRef.current = clamped;

        if (emergencePendingRef?.current && !emittedEmergedRef?.current && clamped >= 0.995) {
          emittedEmergedRef.current = true;
          emergencePendingRef.current = false;
          if (ignoreDirectivesRef) ignoreDirectivesRef.current = true;
          if (uniforms.uPostMorphFreeze && uniforms.uPostMorphFreeze.value !== 1.0) {
            uniforms.uPostMorphFreeze.value = 1.0;
            markDirty(uniforms.uPostMorphFreeze);
            trace?.('WBG:FREEZE', { value: 1, source: 'directive' });
          }
          const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
          const stageName =
            get('stage') ||
            (typeof window !== 'undefined'
              ? window.theaterDirector?.getCurrentStage?.() ?? window.theaterDirector?.currentStage
              : null) ||
            lastBlueprintMetaRef?.current?.stageName ||
            'genesis';

          if (fenceReadyRef?.current) {
            emitFencepostNow?.({
              at: now,
              source: directive?.source || payload?.source || 'renderer-directive',
              stage: stageName,
              morph: clamped,
            });
          } else {
            bus?.emit?.(events?.MORPH_PROGRESS ?? EVENTS.MORPH_PROGRESS, {
              morphProgress: clamped,
              stage: stageName,
            });
          }
        }
      }

      const pointSize = get('pointSize') ?? get('uPointSize');
      if (pointSize !== undefined) {
        const previousPointSize = uniforms.uPointSize ? Number(uniforms.uPointSize.value) : null;
        if (setNumberUniform('uPointSize', pointSize) && lastPointSizeRef) {
          lastPointSizeRef.current = previousPointSize;
        }
      }

      setNumberUniform('uGaussianSigma', get('gaussianSigma') ?? get('uGaussianSigma'));
      setNumberUniform('uSpreadFactor', get('spreadFactor') ?? get('uSpreadFactor'));
      const morphTypeValue = get('morphType');
      if (morphTypeValue !== undefined && uniforms.uMorphType) {
        const mapped = morphTypeToInt(morphTypeValue);
        if (setNumberUniform('uMorphType', mapped)) {
          trace?.('WBG:MORPH_TYPE', { value: mapped, source: 'directive' });
        }
      }

      const postMorphFreeze = get('postMorphFreeze');
      if (postMorphFreeze !== undefined && uniforms.uPostMorphFreeze) {
        setNumberUniform('uPostMorphFreeze', postMorphFreeze ? 1 : 0);
      }

      const tierHighlight = get('uTierHighlight');
      if (tierHighlight !== undefined) {
        setNumberUniform('uTierHighlight', tierHighlight);
      }
      if (Array.isArray(get('tierHighlight'))) {
        const arr = get('tierHighlight');
        const uniform = uniforms.uTierHighlight;
        if (uniform?.value && Array.isArray(arr) && arr.length > 0) {
          const value = Number(arr[0]);
          if (Number.isFinite(value)) {
            uniform.value = value;
            markDirty(uniform);
          }
        }
      }

      updateTierModes(get('tierModes'));
      updateTierParams(get('tierParams'));

      const gridSize = get('gridSize');
      const gridX = get('gridX');
      const gridY = get('gridY');
      const gridTuple = get('uGridSpacing');
      if (Array.isArray(gridTuple)) {
        setGridSpacing(gridTuple[0], gridTuple[1]);
      } else if (gridSize !== undefined) {
        setGridSpacing(gridSize, gridSize);
      } else if (gridX !== undefined || gridY !== undefined) {
        setGridSpacing(gridX, gridY ?? gridX);
      }

      const flowTurbulence = get('uFlowTurbulence') ?? get('flowTurbulence');
      if (flowTurbulence !== undefined && setNumberUniform('uFlowTurbulence', flowTurbulence)) {
        appliedCount += 1;
      }

      const streakIntensity = get('uStreakIntensity') ?? get('streakIntensity');
      if (streakIntensity !== undefined && setNumberUniform('uStreakIntensity', streakIntensity)) {
        appliedCount += 1;
      }

      const motionParams = get('uMotionParams') ?? get('motionParams');
      if (Array.isArray(motionParams) || motionParams instanceof Float32Array) {
        setArrayUniform(uniforms.uMotionParams, motionParams);
      }

      const tierModesFromEffect = effect?.tiers?.map((tier) => tier?.mode).filter((mode) => mode !== undefined);
      if (Array.isArray(tierModesFromEffect) && tierModesFromEffect.length) {
        updateTierModes(tierModesFromEffect);
      }

      const tierParamsFromEffect = effect?.tiers?.map((tier) => tier?.params).filter((params) => Array.isArray(params));
      if (tierParamsFromEffect?.length) {
        updateTierParams(tierParamsFromEffect);
      }

      if (directive?.uniforms && typeof directive.uniforms === 'object') {
        Object.entries(directive.uniforms).forEach(([key, value]) => {
          const uniform = uniforms[key];
          if (!uniform) return;
          if (typeof value === 'number') {
            setNumberUniform(key, value);
          } else if (Array.isArray(value) || value instanceof Float32Array) {
            setArrayUniform(uniform, value);
          } else if (uniform.value && typeof uniform.value.set === 'function') {
            uniform.value.set(value);
            markDirty(uniform);
          }
        });
      }

      if (get('enterQrMode')) {
        if (qrModeRef && !qrModeRef.current) {
          rendererState?.saveClearColor?.();
          const dpr = typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1;
          const uniformPointSize = uniforms.uPointSize;
          if (uniformPointSize) {
            if (lastPointSizeRef) lastPointSizeRef.current = uniformPointSize.value;
            uniformPointSize.value = Math.max(2.6, 3.2 * dpr);
            markDirty(uniformPointSize);
          }
          if (uniforms.uPostMorphFreeze) {
            uniforms.uPostMorphFreeze.value = 1.0;
            markDirty(uniforms.uPostMorphFreeze);
          }
          if (timeTickEnabledRef) timeTickEnabledRef.current = false;
          qrModeRef.current = true;
        }
      }

      if (get('exitQrMode')) {
        if (qrModeRef?.current) {
          if (uniforms.uPostMorphFreeze) {
            uniforms.uPostMorphFreeze.value = 0.0;
            markDirty(uniforms.uPostMorphFreeze);
          }
          if (uniforms.uPointSize && lastPointSizeRef?.current != null) {
            uniforms.uPointSize.value = lastPointSizeRef.current;
            markDirty(uniforms.uPointSize);
            lastPointSizeRef.current = null;
          }
          rendererState?.cleanupQrMode?.();
          if (timeTickEnabledRef) timeTickEnabledRef.current = true;
          qrModeRef.current = false;
        }
      }

      applyPalette();
      applyCanonicalEffect();

      const directUniformEntries = [
        ['uMotionMode', get('uMotionMode')],
        ['uMotionMode', effect?.motionMode],
        ['uParticlePhase', get('uParticlePhase') ?? get('particlePhase')],
        ['uParticlePhase', effect?.particlePhase],
        ['uFlowTurbulence', get('uFlowTurbulence') ?? get('flowTurbulence')],
        ['uFlowTurbulence', effect?.flowTurbulence],
        ['uTierHighlight', get('uTierHighlight')],
        ['uTierHighlight', effect?.tierHighlight],
        ['uSpreadFactor', get('uSpreadFactor')],
        ['uSpreadFactor', effect?.spreadFactor],
        ['uStreakIntensity', get('uStreakIntensity') ?? get('streakIntensity')],
        ['uStreakIntensity', effect?.intensity],
      ];

      directUniformEntries.forEach(([uniformKey, value]) => {
        if (value === undefined) return;
        if (setNumberUniform(uniformKey, value)) {
          appliedCount += 1;
        }
      });

      if (dev && appliedCount > 0) {
        console.log(`✅ [BlueprintBinder] Applied ${appliedCount} uniform updates from directive`);
      }
    } finally {
      if (renderGuardRef) renderGuardRef.current = false;
    }

    if (uniformsDirty) {
      material.uniformsNeedUpdate = true;
      if (typeof material.needsUpdate === 'boolean') {
        material.needsUpdate = true;
      }
    }

    trace?.('DIR', {
      source: 'WBG:BINDER',
      verb: directive?.verb ?? null,
      stage: directive?.stage ?? effect?.stage ?? null,
      morph: directive?.morphProgress ?? null,
    });

    return true;
  };

  const bindBlueprint = (payload = {}) => {
    if (typeof normalizePayload !== 'function') {
      console.warn('[BlueprintBinder] normalizePayload missing; aborting bind');
      return false;
    }

    const normalized = normalizePayload(payload);
    const raw = normalized.bp;
    const st = normalized.stageName;
    const quality = normalized.quality;
    let cached = normalized.cached;
    const mode = normalized.mode;
    const rawMode = raw?.mode;
    const cacheKey = normalized.cacheKey;
    const fastForwardRequested = normalized.fastForward;
    const skipMorph = normalized.skipMorphAnimation;
    const guardFixed = normalized.guardFixed;
    const guardIssues = normalized.guardIssues;
    const cachedBeforeGuard = normalized.cachedBeforeGuard;
    const sequenceId = raw?.climaxSequenceId || raw?.metadata?.climaxSequenceId || null;
    const stepName = raw?.climaxStep || (rawMode?.includes?.(':') ? rawMode.split(':')[1] : null);
    const isClimax = Boolean(rawMode?.startsWith?.('climax')) || Boolean(raw?.climaxStep);

    const id = isClimax
      ? `${st}-${raw?.particleCount || raw?.activeCount || raw?.maxParticles || 0}-${stepName || 'climax'}-${sequenceId || ''}`
      : `${st}-${raw?.count || raw?.particleCount || raw?.activeCount || 0}-${mode || 'default'}`;

    if (!raw?.atmosphericPositions || !raw?.text3DPositions) return false;
    if (id === lastBlueprintIdRef?.current) return false;
    if (lastBlueprintIdRef) lastBlueprintIdRef.current = id;

    const isEmergence = mode === 'emergence' || raw?.mode === 'emergence';
    const isOpeningChaos = mode === 'opening_chaos' || raw?.mode === 'opening_chaos';
    const shouldFastForward = isEmergence && (fastForwardRequested || skipMorph);

    if (guardFixed) {
      const issues = Array.isArray(guardIssues) ? guardIssues.join(', ') : guardIssues;
      console.warn('🛡️ Renderer: Guard supplied fallback blueprint', {
        cacheKey,
        issues,
        cachedBeforeGuard,
      });
    }

    if (isClimax && cached) {
      console.log('🎬 Climax detected - forcing fresh blueprint bind');
      cached = false;
    }

    if (!isEmergence && emergencePendingRef?.current) {
      if ((raw.stageName || st) !== 'genesis') {
        console.warn('🖼️ Renderer: ignoring pre-scroll full for stage=', raw.stageName || st);
        return false;
      }
    }

    if (isEmergence && emittedEmergedRef?.current) return false;

    setBlueprint?.(raw);
    if (lastBlueprintMetaRef) lastBlueprintMetaRef.current = raw?.metadata || {};
    setStageName?.(isEmergence ? 'genesis' : (raw.stageName || st || 'genesis'));
    setActiveCount?.(raw.activeCount || raw.particleCount || raw.maxParticles || 0);
    applyMetadataColors(materialRef?.current, raw?.metadata?.colors, VC?.GENESIS_PALETTE);

    if (isOpeningChaos && emergencePendingRef) {
      emergencePendingRef.current = true;
      if (emittedEmergedRef) emittedEmergedRef.current = false;
    }

    const uniforms = materialRef?.current?.uniforms;
    if (uniforms) {
      const palette = raw?.metadata?.colors || raw?.colors || null;
      if (palette) {
        const fetch = (idx, fallbackIdx = 0) =>
          hexToRGBArray(palette[idx] || palette[fallbackIdx] || palette[palette.length - 1]);
        uniforms.uPalette0.value = new Float32Array(fetch(0));
        uniforms.uPalette1.value = new Float32Array(fetch(1, 0));
        uniforms.uPalette2.value = new Float32Array(fetch(2, 1));
        uniforms.uPalette3.value = new Float32Array(fetch(3, 0));
        uniforms.uPalette0.needsUpdate =
          uniforms.uPalette1.needsUpdate =
          uniforms.uPalette2.needsUpdate =
          uniforms.uPalette3.needsUpdate =
            true;
      }

      const motionBehaviors = raw?.metadata?.motionBehaviors || null;
      if (motionBehaviors) {
        const tierDefs = [
          motionBehaviors.tier0,
          motionBehaviors.tier1,
          motionBehaviors.tier2,
          motionBehaviors.tier3,
        ];
        const modeArray = new Float32Array(4);
        const paramsArrays = [
          new Float32Array(4),
          new Float32Array(4),
          new Float32Array(4),
          new Float32Array(4),
        ];
        tierDefs.forEach((def, index) => {
          const { mode: behaviorMode, params } = mapBehaviorToMode(def?.behavior);
          modeArray[index] = behaviorMode;
          const src = Array.isArray(params) ? params : [0, 0, 0, 0];
          paramsArrays[index].set(src.slice(0, 4));
        });
        uniforms.uTierMode.value = modeArray;
        uniforms.uTierParams0.value = paramsArrays[0];
        uniforms.uTierParams1.value = paramsArrays[1];
        uniforms.uTierParams2.value = paramsArrays[2];
        uniforms.uTierParams3.value = paramsArrays[3];
        uniforms.uTierMode.needsUpdate =
          uniforms.uTierParams0.needsUpdate =
          uniforms.uTierParams1.needsUpdate =
          uniforms.uTierParams2.needsUpdate =
          uniforms.uTierParams3.needsUpdate =
            true;
      }

      if (uniforms.uTierHighlight) {
        uniforms.uTierHighlight.value = -1;
      }
    }

    const stageForLog = raw.stageName || st || 'genesis';
    const nextHotspotMap =
      raw?.hotspotMap || raw?.hotspotLookup?.indicesByHotspot || null;

    if (hotspotMapRef) {
      if (nextHotspotMap && typeof nextHotspotMap === 'object') {
        const hotspotIds = Object.keys(nextHotspotMap);
        const localizedMap = {};
        hotspotIds.forEach((id) => {
          const entry = nextHotspotMap[id];
          if (!entry) return;
          localizedMap[id] = {
            ...entry,
            indexSet:
              entry.indices && typeof entry.indices[Symbol.iterator] === 'function'
                ? new Set(entry.indices)
                : null,
          };
        });
        hotspotMapRef.current = localizedMap;
        if (hotspotIds.length > 0) {
          console.log('🗺️ Renderer: Hotspot map updated', hotspotIds);
          console.log(`   Stage: ${stageForLog}`);
          hotspotIds.forEach((id) => {
            const entry = nextHotspotMap[id];
            const count = entry?.indices?.length || 0;
            console.log(`   - ${id}: ${count} particles`);
          });
        } else if (!isEmergence) {
          console.log(`🗺️ Renderer: Hotspot map empty for stage ${stageForLog}`);
        }
      } else if (!isEmergence) {
        hotspotMapRef.current = {};
        console.log('🗺️ Renderer: No hotspot map in blueprint');
      } else {
        hotspotMapRef.current = {};
      }
    }

    const viewport =
      raw?.metadata?.viewport || payload?.viewportHint || window?.__viewportHint;
    if (viewport) {
      if (viewportHintRef) viewportHintRef.current = viewport;
      if (viewport?.height) updateBandHeight?.(viewport.height);
    } else {
      const fallbackHeight = window?.__viewportHint?.height;
      if (fallbackHeight) updateBandHeight?.(fallbackHeight);
    }

    const isQrBlueprint = !!raw?.metadata?.qrMode;
    if (isQrBlueprint && !raw.__qrAutoscaled) {
      if (raw.positions instanceof Float32Array) {
        autoscaleQrPositions(raw.positions, 0.9);
      }
      if (raw.atmosphericPositions instanceof Float32Array) {
        autoscaleQrPositions(raw.atmosphericPositions, 0.9);
      }
      if (raw.text3DPositions instanceof Float32Array) {
        autoscaleQrPositions(raw.text3DPositions, 0.9);
      }
      try {
        Object.defineProperty(raw, '__qrAutoscaled', {
          value: true,
          enumerable: false,
          configurable: true,
        });
      } catch {
        raw.__qrAutoscaled = true;
      }
    }

    const previousGeometry = geometryRef?.current || null;
    if (previousGeometry) {
      disposeAttributes(previousGeometry);
      previousGeometry.dispose?.();
    }

    if (typeof window !== 'undefined' && dev) {
      if (window.__particleGeometry === previousGeometry) {
        delete window.__particleGeometry;
      }
      window.__renderDiag?.unregister?.('WebGLBackground.geometry');
    }

    const geo = new THREE.BufferGeometry();
    const primaryPositions =
      isQrBlueprint
        ? raw.text3DPositions || raw.atmosphericPositions || raw.positions
        : raw.atmosphericPositions || raw.text3DPositions || raw.positions;

    if (primaryPositions instanceof Float32Array) {
      geo.setAttribute('position', new THREE.BufferAttribute(primaryPositions, 3));
    }
    if (raw.atmosphericPositions instanceof Float32Array) {
      geo.setAttribute(
        'atmosphericPosition',
        new THREE.BufferAttribute(raw.atmosphericPositions, 3),
      );
    }
    if (raw.text3DPositions instanceof Float32Array) {
      geo.setAttribute(
        'text3DPosition',
        new THREE.BufferAttribute(raw.text3DPositions, 3),
      );
    }
    if (raw.animationSeeds) {
      geo.setAttribute('animationSeed', new THREE.BufferAttribute(raw.animationSeeds, 3));
    }
    if (raw.sizeMultipliers) {
      geo.setAttribute(
        'sizeMultiplier',
        new THREE.BufferAttribute(raw.sizeMultipliers, 1),
      );
    }
    if (raw.opacityData) {
      geo.setAttribute('opacityData', new THREE.BufferAttribute(raw.opacityData, 1));
    }
    if (raw.atlasIndices) {
      geo.setAttribute('atlasIndex', new THREE.BufferAttribute(raw.atlasIndices, 1));
    }
    if (raw.tierData) {
      geo.setAttribute('tierData', new THREE.BufferAttribute(raw.tierData, 1));
    }

    const inferredCount = primaryPositions instanceof Float32Array ? primaryPositions.length / 3 : 0;
    const drawCount = raw.activeCount || raw.particleCount || inferredCount;
    const idx = new Float32Array(drawCount > 0 ? drawCount : 0);
    for (let i = 0; i < idx.length; i += 1) {
      idx[i] = i;
    }
    geo.setAttribute('particleIndex', new THREE.BufferAttribute(idx, 1));
    geo.setDrawRange(0, drawCount);
    if (geometryRef) geometryRef.current = geo;
    if (geometryBoundOnceRef) geometryBoundOnceRef.current = true;
    if (fitsLockedRef) fitsLockedRef.current = false;

    if (typeof window !== 'undefined' && dev) {
      const bg = window.__webglBackground || {};
      window.__particleGeometry = geo;
      window.__webglBackground = {
        ...bg,
        geometry: geo,
        geometryRef,
      };
      window.__renderDiag?.register?.('WebGLBackground.geometry', geo);
    }

    if (isEmergence) {
      if (fenceReadyRef) fenceReadyRef.current = false;
      clearPendingFencepost?.();
      if (ignoreDirectivesRef) ignoreDirectivesRef.current = false;
    }

    const mat = materialRef?.current;
    const freezeUniform = mat?.uniforms?.uPostMorphFreeze;
    if (freezeUniform && isEmergence && freezeUniform.value !== 0.0) {
      freezeUniform.value = 0.0;
      mat.uniformsNeedUpdate = true;
    }

    if (mat) {
      if (typeof window !== 'undefined' && dev) {
        const bg = window.__webglBackground || {};
        window.__consciousnessMaterial = mat;
        window.__webglBackground = {
          ...bg,
          material: mat,
          materialRef,
        };
        window.__renderDiag?.register?.('WebGLBackground.material', mat);
      }
      applyRendererFitsToViewport?.(geo, viewportHintRef?.current || viewport);
      logBind?.(isEmergence ? 'emergence' : 'stage', {
        stage: raw.stageName || st || 'genesis',
        mode: mode || raw?.mode || (isEmergence ? 'emergence' : 'full'),
        cached: !!cached,
      });
      scheduleRuntimeSampling?.();

      if (mat.uniforms?.uMorphProgress) {
        if (isQrBlueprint) {
          mat.uniforms.uMorphProgress.value = 1;
          if (mat.uniforms.uStageProgress) mat.uniforms.uStageProgress.value = 1;
          if (mat.uniforms.uPostMorphFreeze) mat.uniforms.uPostMorphFreeze.value = 1;
        } else {
          mat.uniforms.uMorphProgress.value = 0;
          if (mat.uniforms.uStageProgress) mat.uniforms.uStageProgress.value = 0;
        }
        mat.uniformsNeedUpdate = true;
      }
      if (ignoreDirectivesRef) ignoreDirectivesRef.current = false;

      const matUniforms = mat.uniforms;
      if (matUniforms) {
        const maybeSeedNumber = (uniform, value) => {
          if (!uniform) return false;
          const current = uniform.value;
          if (typeof current === 'number' && Number.isFinite(current)) return false;
          uniform.value = value;
          if (typeof uniform.needsUpdate === 'boolean') uniform.needsUpdate = true;
          return true;
        };

        const seededPointSize = maybeSeedNumber(
          matUniforms.uPointSize,
          raw?.metadata?.pointSize ?? matUniforms.uPointSize?.value ?? 3.0,
        );
        const seededGaussian = maybeSeedNumber(
          matUniforms.uGaussianSigma,
          raw?.metadata?.gaussianSigma ?? Canonical?.features?.gaussianSigma ?? 2.5,
        );
        const seededMorph = maybeSeedNumber(
          matUniforms.uMorphProgress,
          fallbackMorphRef?.current ?? 0,
        );

        const drawCountUniform = geometryRef?.current?.attributes?.position?.count ?? drawCount;
        if (matUniforms.uActiveCount) {
          matUniforms.uActiveCount.value = drawCountUniform;
          matUniforms.uActiveCount.needsUpdate = true;
        }
        if (matUniforms.uTierCutoff) {
          matUniforms.uTierCutoff.value = Math.max(
            matUniforms.uTierCutoff.value || 0,
            drawCountUniform,
          );
          matUniforms.uTierCutoff.needsUpdate = true;
        }
        if (seededPointSize || seededGaussian || seededMorph) {
          mat.uniformsNeedUpdate = true;
        }
      }
    }

    if (dev && !geo.__singleWriterPatched) {
      const rawSetDrawRange = geo.setDrawRange.bind(geo);
      geo.setDrawRange = (start, count) => {
        if (!renderGuardRef?.current) {
          console.warn('[SingleWriter] drawRange call blocked outside renderer path');
          return;
        }
        rawSetDrawRange(start, count);
      };
      geo.__singleWriterPatched = true;
    }

    const disableBand = isEmergence || (raw.stageName || st) === 'genesis';
    if (mat?.uniforms?.uBandFade) {
      mat.uniforms.uBandFade.value = disableBand ? 0 : 1;
      mat.uniformsNeedUpdate = true;
    }

    if (isEmergence) {
      console.log(
        '✅ Renderer: BR(emergence) bound',
        `count=${raw.particleCount || raw.activeCount}`,
        `quality=${quality}`,
      );
      if (emergencePendingRef) emergencePendingRef.current = true;
      if (emittedEmergedRef) emittedEmergedRef.current = false;
      if (dev) {
        const extent = (key) => {
          const attr = geo.attributes[key];
          if (!attr) return null;
          const arr = attr.array;
          let minX = Infinity;
          let maxX = -Infinity;
          let minY = Infinity;
          let maxY = -Infinity;
          for (let i = 0; i < arr.length; i += 3) {
            const x = arr[i];
            const y = arr[i + 1];
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
          return { w: +(maxX - minX).toFixed(2), h: +(maxY - minY).toFixed(2) };
        };
        console.debug(
          '[WBG] AABB bind',
          { pos: extent('position') },
          { atm: extent('atmosphericPosition') },
          { tgt: extent('text3DPosition') },
        );
      }
      bus?.emit?.(events?.MORPH_PROGRESS ?? EVENTS.MORPH_PROGRESS, { value: 0 });
      if (typeof finalizeEmergence === 'function') {
        const globalSST = (typeof window !== 'undefined' && window.SST) || null;
        const openConfig = globalSST?.opening ?? null;
        const skipAnimation = openConfig?.emergence?.skipMorphAnimation ?? false;
        const timelineDuration = openConfig?.timeline?.emergence?.durationMs ?? null;

        if (skipAnimation === true || shouldFastForward || fastForwardRequested === true) {
          const source = skipAnimation ? 'sst-config' : (fastForwardRequested ? 'payload-fastforward' : 'renderer-fastforward');
          if (finalizeEmergence(source)) {
            console.log('⚡ Renderer: Emergence fast-forward applied', {
              source,
              skipAnimation,
              fastForwardFlag: fastForwardRequested,
              cacheKey,
              stage: raw.stageName || st || 'genesis',
            });
          }
        } else {
          console.log('🎬 Renderer: Playing emergence animation (no fast-forward)', {
            skipAnimation,
            fastForwardFlag: fastForwardRequested,
            duration: timelineDuration ?? 2000,
            stage: raw.stageName || st || 'genesis',
          });
        }
      }
    } else {
      console.log(
        `✅ Renderer: ${cached ? 'cached' : 'new'} BR(full)`,
        `stage=${raw.stageName || st}`,
        `count=${raw.particleCount || raw.activeCount}`,
        `quality=${quality}`,
        isQrBlueprint ? '[qrMode]' : '',
      );
      if (isOpeningChaos) {
        if (fenceReadyRef) fenceReadyRef.current = false;
        clearPendingFencepost?.();
        if (geometryBoundOnceRef) geometryBoundOnceRef.current = false;
      }
    }

    if (isClimax && !isEmergence) {
      const geometry = geo;
      const material = mat;
      const positionAttr = geometry?.attributes?.position;
      const positionsArray = positionAttr?.array;
      const text3DPositions = raw?.text3DPositions;
      const atmosphericPositions = raw?.atmosphericPositions;
      const climaxStepName =
        raw?.climaxStep || raw?.mode?.split?.(':')?.[1] || null;

      const sample = (arr, start = 0, count = 9) => {
        if (arr && typeof arr.slice === 'function') {
          return Array.from(arr.slice(start, start + count));
        }
        return 'none';
      };

      const spreadStats = (arr) => {
        if (!(arr instanceof Float32Array) || arr.length < 30) {
          return { avg: 'invalid', min: 'invalid', max: 'invalid' };
        }
        let sum = 0;
        let minDist = Infinity;
        let maxDist = 0;
        for (let i = 0; i < 30; i += 3) {
          const dist =
            Math.abs(arr[i]) + Math.abs(arr[i + 1]) + Math.abs(arr[i + 2]);
          sum += dist;
          if (dist < minDist) minDist = dist;
          if (dist > maxDist) maxDist = dist;
        }
        return {
          avg: (sum / 10).toFixed(2),
          min: minDist.toFixed(2),
          max: maxDist.toFixed(2),
        };
      };

      const buffersMatch = (() => {
        if (!(text3DPositions instanceof Float32Array) || !(positionsArray instanceof Float32Array)) {
          return 'unknown';
        }
        const checks = [0, 99, 999, positionsArray.length - 1].filter(
          (idx) => idx >= 0 && idx < positionsArray.length,
        );
        return checks.every((idx) => text3DPositions[idx] === positionsArray[idx]);
      })();

      console.log('🔬 CLIMAX DIAGNOSTIC (ENHANCED):', {
        climaxStep: climaxStepName,
        particleCount: raw?.particleCount || 0,
        hasText3D: text3DPositions instanceof Float32Array,
        text3DLength: text3DPositions?.length || 0,
        hasGeometry: positionsArray instanceof Float32Array,
        geometryLength: positionsArray?.length || 0,
        text3DStart: sample(text3DPositions, 0, 9),
        text3DMiddle: sample(
          text3DPositions,
          Math.max(0, Math.floor((text3DPositions?.length || 0) / 2) - 4),
          9,
        ),
        text3DEnd: sample(
          text3DPositions,
          Math.max(0, (text3DPositions?.length || 9) - 9),
          9,
        ),
        geometryStart: sample(positionsArray, 0, 9),
        geometryMiddle: sample(
          positionsArray,
          Math.max(0, Math.floor((positionsArray?.length || 0) / 2) - 4),
          9,
        ),
        geometryEnd: sample(
          positionsArray,
          Math.max(0, (positionsArray?.length || 9) - 9),
          9,
        ),
        buffersMatch,
        shaderMorph: material?.uniforms?.shaderMorph?.value ?? 'undefined',
        spreadBlueprint: spreadStats(text3DPositions),
        spreadGeometry: spreadStats(positionsArray),
      });

      console.log('🔬 SPREAD COMPARISON: Blueprint vs Geometry', {
        blueprint: spreadStats(text3DPositions),
        geometry: spreadStats(positionsArray),
      });

      const posArray = positionsArray;
      if (posArray && posArray.length >= 30) {
        let sumX = 0;
        let sumY = 0;
        let sumZ = 0;
        for (let i = 0; i < 30; i += 3) {
          sumX += Math.abs(posArray[i]);
          sumY += Math.abs(posArray[i + 1]);
          sumZ += Math.abs(posArray[i + 2]);
        }
        const avgDist = (sumX + sumY + sumZ) / 10;
        if (avgDist < 0.1) {
          console.error('🚨 POSITIONS AT ORIGIN! Forming cluster/square');
        } else {
          console.log(`✅ Positions spread (avg dist from origin: ${avgDist.toFixed(2)})`);
        }
      }

      if (material) {
        console.log('🔬 SHADER STATE:', {
          shaderMorph: material?.uniforms?.shaderMorph?.value ?? 'undefined',
          expectedMorph: 1.0,
          morphMode: material?.uniforms?.morphMode?.value ?? 'undefined',
        });
        if (material?.uniforms?.shaderMorph) {
          material.uniforms.shaderMorph.value = 1.0;
          material.uniformsNeedUpdate = true;
          console.log('✅ Forced shaderMorph = 1.0 for climax');
        }
      }
    }

    if ((raw.stageName || st) === 'genesis' && emergencePendingRef?.current && !emittedEmergedRef?.current) {
      const matCurrent = materialRef?.current;
      const freeze = matCurrent?.uniforms?.uPostMorphFreeze;
      if (freeze && freeze.value !== 1.0) {
        freeze.value = 1.0;
        matCurrent.uniformsNeedUpdate = true;
        trace?.('WBG:FREEZE', { value: 1, source: 'blueprint' });
      }
      const emitPayload = {
        at:
          typeof performance !== 'undefined' && performance.now
            ? performance.now()
            : Date.now(),
        source: 'renderer-blueprint',
        stage: raw.stageName || st || 'genesis',
        count:
          geometryRef?.current?.attributes?.position?.count ??
          raw.activeCount ??
          raw.particleCount ??
          0,
      };
      if (fenceReadyRef) fenceReadyRef.current = true;
      clearPendingFencepost?.();
      emitFencepostNow?.(emitPayload);
      if (typeof window !== 'undefined') {
        window.__lastParticlesEmerged = emitPayload;
      }
      if (emittedEmergedRef) emittedEmergedRef.current = true;
      if (emergencePendingRef) emergencePendingRef.current = false;
      console.log('EMERGED once — emitting PARTICLES_EMERGED fencepost');
    }

    if (!isEmergence) {
      requestAnimationFrame(() => {
        const matNext = materialRef?.current;
        const freezeNext = matNext?.uniforms?.uPostMorphFreeze;
        if (freezeNext && freezeNext.value !== 0.0) {
          freezeNext.value = 0.0;
          matNext.uniformsNeedUpdate = true;
          trace?.('WBG:FREEZE', { value: 0, source: 'stage' });
        }
        if (ignoreDirectivesRef) ignoreDirectivesRef.current = false;
      });
    }

    if (!isQrBlueprint && qrModeRef?.current) {
      const uniformsNow = materialRef?.current?.uniforms;
      if (uniformsNow?.uPostMorphFreeze) {
        uniformsNow.uPostMorphFreeze.value = 0;
        uniformsNow.uPostMorphFreeze.needsUpdate = true;
      }
      if (uniformsNow?.uPointSize && lastPointSizeRef?.current != null) {
        uniformsNow.uPointSize.value = lastPointSizeRef.current;
        uniformsNow.uPointSize.needsUpdate = true;
        lastPointSizeRef.current = null;
      }
      qrModeRef.current = false;
      rendererState?.cleanupQrMode?.();
      if (timeTickEnabledRef) timeTickEnabledRef.current = true;
    }

    const isEmergenceMode =
      payload?.mode === 'emergence' || payload?.blueprint?.mode === 'emergence';
    const matCurrent = materialRef?.current;
    const currentUniforms = matCurrent?.uniforms;
    if (!isEmergenceMode && currentUniforms?.uMorphProgress) {
      const director =
        typeof window !== 'undefined' ? window.theaterDirector : null;
      const currentStage = director?.getCurrentStage?.() ?? director?.currentStage ?? null;
      const currentPhase = director?.getCurrentPhase?.() ?? director?.phase ?? null;
      const isOpeningPhase =
        currentStage === 'genesis' && currentPhase !== 'emergence';
      const startMorph = 0.0;

      currentUniforms.uMorphProgress.value = startMorph;
      if (currentUniforms.uStageProgress) {
        currentUniforms.uStageProgress.value = startMorph;
      }
      if (fallbackMorphRef) fallbackMorphRef.current = startMorph;
      matCurrent.uniformsNeedUpdate = true;

      if (isOpeningPhase && !geometryBoundOnceRef?.current) {
        if (geometryBoundOnceRef) geometryBoundOnceRef.current = true;
        return true;
      }

      if (!geometryBoundOnceRef?.current && geometryBoundOnceRef) {
        geometryBoundOnceRef.current = true;
      }

      const startTime =
        typeof performance !== 'undefined' && performance.now
          ? performance.now()
          : Date.now();
      const duration = 1200;
      const raf =
        typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
          ? window.requestAnimationFrame
          : typeof requestAnimationFrame === 'function'
          ? requestAnimationFrame
          : null;
      if (!raf) return false;
      const stepMorph = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const liveUniforms = matCurrent.uniforms;
        if (liveUniforms?.uMorphProgress) {
          liveUniforms.uMorphProgress.value = startMorph + (1 - startMorph) * progress;
        }
        if (liveUniforms?.uStageProgress) {
          liveUniforms.uStageProgress.value = startMorph + (1 - startMorph) * progress;
        }
        matCurrent.uniformsNeedUpdate = true;
        if (progress < 1) {
          raf(stepMorph);
        }
      };
      raf(stepMorph);
    }

    if (isQrBlueprint && !qrModeRef?.current) {
      rendererState?.saveClearColor?.();
      const uniformsNow = materialRef?.current?.uniforms;
      if (uniformsNow?.uPostMorphFreeze) {
        uniformsNow.uPostMorphFreeze.value = 1;
        uniformsNow.uPostMorphFreeze.needsUpdate = true;
      }
      if (uniformsNow?.uTierMode && uniformsNow.uTierMode.value) {
        const arr = uniformsNow.uTierMode.value;
        for (let i = 0; i < arr.length; i += 1) arr[i] = 0;
        uniformsNow.uTierMode.needsUpdate = true;
      }
      if (uniformsNow?.uPointSize) {
        const dpr =
          typeof window !== 'undefined' && window.devicePixelRatio
            ? window.devicePixelRatio
            : 1;
        if (lastPointSizeRef) lastPointSizeRef.current = uniformsNow.uPointSize.value;
        uniformsNow.uPointSize.value = Math.max(2.6, 3.2 * dpr);
        uniformsNow.uPointSize.needsUpdate = true;
      }
      if (timeTickEnabledRef) timeTickEnabledRef.current = false;
      if (qrModeRef) qrModeRef.current = true;
      if (materialRef?.current) {
        materialRef.current.uniformsNeedUpdate = true;
      }
    }

    return true;
  };

  let blueprintUnsub = null;

  const subscribe = () => {
    if (!bus?.on) {
      console.warn('[BlueprintBinder] beatBus missing .on');
      return () => {};
    }
    if (blueprintUnsub) {
      blueprintUnsub();
      blueprintUnsub = null;
    }
    blueprintUnsub = bus.on(blueprintEvent, bindBlueprint);

    return () => {
      blueprintUnsub?.();
      blueprintUnsub = null;
    };
  };

  const dispose = () => {
    blueprintUnsub?.();
    blueprintUnsub = null;
    rendererState?.cleanupQrMode?.();
    if (geometryRef?.current) {
      disposeAttributes(geometryRef.current);
      geometryRef.current.dispose?.();
      const dead = geometryRef.current;
      geometryRef.current = null;
      if (typeof window !== 'undefined' && dev) {
        if (window.__particleGeometry === dead) {
          delete window.__particleGeometry;
        }
        window.__renderDiag?.unregister?.('WebGLBackground.geometry');
        const bg = window.__webglBackground || {};
        if (bg.geometry === dead || bg.geometryRef === geometryRef) {
          delete bg.geometry;
          delete bg.geometryRef;
          window.__webglBackground = bg;
        }
      }
    }

    if (typeof window !== 'undefined' && dev) {
      const mat = materialRef?.current || null;
      if (mat && window.__consciousnessMaterial === mat) {
        delete window.__consciousnessMaterial;
      }
      if (mat) {
        window.__renderDiag?.unregister?.('WebGLBackground.material');
      }
      const bg = window.__webglBackground || {};
      if (bg.material === mat || bg.materialRef === materialRef) {
        delete bg.material;
        delete bg.materialRef;
        window.__webglBackground = bg;
      }
    }
  };

  const api = {
    bindBlueprint,
    applyDirective,
    subscribe,
    dispose,
  };

  if (dev && typeof window !== 'undefined') {
    window.__webglBinder = {
      ...api,
      materialRef,
      geometryRef,
    };
  }

  return api;
};

export const createBlueprintReadyHandler = (binder, onBound) => {
  return (event = {}) => {
    const { blueprint } = event;

    if (!blueprint) {
      console.error('[BlueprintBinder] BLUEPRINT_READY event missing blueprint data');
      return;
    }

    const success = binder?.bindBlueprint?.(event);

    if (success && onBound) {
      onBound(blueprint);
    }
  };
};

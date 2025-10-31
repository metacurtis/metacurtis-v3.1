// src/components/webgl/WebGLBackground.jsx
// HOT-DORS passive renderer: projection-matrix viewport hint + single directive sink
// Single writer: binds geometry/material, emits PARTICLES_EMERGED exactly once (on first FULL bind)

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
// Provide global THREE for Canon HUD/watchdog hooks
if (typeof window !== 'undefined' && !window.THREE) window.THREE = THREE;
if (typeof window !== 'undefined' && !window.RAYCAST_DIAGNOSTIC) {
  window.RAYCAST_DIAGNOSTIC = {
    lastTest: null,
    history: [],
  };
}
import { EVENTS } from '@/theater/events.js';
import BeatBus from '@/theater/bus';
import { trace } from '@/dev/trace.js';

import { getPointSpriteAtlasSingleton } from './consciousness/PointSpriteAtlas.js';
import { Canonical } from '../../config/canonical/canonicalAuthority.js';
import { VC } from '@/config/visual-controls.js';
import { particleRaycaster } from '@/utils/particleRaycast.js';

import vertexShaderSource from '../../shaders/templates/consciousness-vertex.glsl?raw';
import fragmentShaderSource from '../../shaders/templates/consciousness-fragment.glsl?raw';
import { exposeDiagnostics, exposeControlSurface, revokeControlSurface } from '@/utils/runtimeGuards.js';
import {
  clamp01,
  MORPH_TYPE_ENUM,
  morphTypeToInt,
  mapBehaviorToMode,
  hexToRGBArray,
  computeAABB,
} from './utils/backgroundMath.js';
import { autoscaleQrPositions } from './utils/qrScaling.js';
import { applyMetadataColors } from './utils/paletteUtils.js';
const DEV = (typeof import.meta !== 'undefined' && import.meta?.env?.MODE !== 'production');

function pickStageColors(stageName) {
  const s = Canonical?.stages?.[stageName] || {};
  const colors = s.colors || ['#00ffcc', '#f59e0b', '#ffffff'];
  const order = Canonical?.stageOrder || [];
  const idx = Math.max(0, order.indexOf(stageName));
  const nextStage = order[Math.min(idx + 1, Math.max(0, order.length - 1))] || stageName;
  const nextColors = Canonical?.stages?.[nextStage]?.colors || colors;
  return {
    current: new THREE.Color(colors[0]),
    next: new THREE.Color(nextColors[0]),
    acc1: new THREE.Color(colors[1] || colors[0]),
    acc2: new THREE.Color(colors[2] || colors[0]),
  };
}

function normalizePayload(payload) {
  const bp = payload?.blueprint ?? payload;
  const stageName = bp?.stageName || bp?.stage || payload?.stage || 'genesis';
  const quality = payload?.quality || payload?.tier || 'HIGH';
  const cached = !!payload?.cached;
  const mode = payload?.mode || bp?.mode;
  const cacheKey = payload?.cacheKey || bp?.metadata?.cacheKey || null;
  const fastForward =
    payload?.fastForward ??
    bp?.fastForward ??
    bp?.metadata?.fastForward ??
    false;
  const skipMorphAnimation =
    payload?.skipMorphAnimation ??
    bp?.skipMorphAnimation ??
    bp?.metadata?.skipMorphAnimation ??
    false;
  const guardFixed = payload?._guard_fixed === true || payload?.guardFallback === true;
  const guardIssues = payload?.guardIssues || bp?.metadata?.guardIssues || null;
  const cachedBeforeGuard = payload?.cachedBeforeGuard === true;
  return {
    bp,
    stageName,
    quality,
    cached,
    mode,
    cacheKey,
    fastForward: !!fastForward,
    skipMorphAnimation: !!skipMorphAnimation,
    guardFixed,
    guardIssues,
    cachedBeforeGuard,
  };
}

const clampFit = (v) => Math.min(5.0, Math.max(0.2, v));

function arrayAabb(arr) {
  if (!arr || arr.length < 3) return null;
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
  if (minX === Infinity || minY === Infinity) return null;
  return { w: maxX - minX, h: maxY - minY };
}

function attributeAabb(geo, key) {
  const attr = geo?.attributes?.[key];
  return attr?.array ? arrayAabb(attr.array) : null;
}

const vec2Close = (a = [], b = [], eps = 1e-3) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  return Math.abs((a[0] ?? 0) - (b[0] ?? 0)) < eps
    && Math.abs((a[1] ?? 0) - (b[1] ?? 0)) < eps;
};

function WebGLBackground({ morphProgress = 0, scrollProgress = 0 }) {
  const emergencePendingRef = useRef(false);
  const emittedEmergedRef   = useRef(false);

  const meshRef = useRef();
  const geometryRef = useRef(null);
  const materialRef = useRef(null);
  const geometryBoundOnceRef = useRef(false);
  // QR state / restore slots
  const qrModeRef = useRef(false);
  const pageInteractiveDispatchedRef = useRef(false);
  const restoreClearRef = useRef([0, 0, 0, 1]);
  const lastPointSizeRef = useRef(null);
  // Optional: if your render loop advances uTime, guard it here
  const timeTickEnabledRef = useRef(true);
  const renderGuardRef = useRef(false);
  const viewportHintRef = useRef(null);
  const lastBindMetaRef = useRef({ kind: null });

  const [blueprint, setBlueprint] = useState(null);
  const [stageName, setStageName] = useState('genesis');
  const [atlasTexture, setAtlasTexture] = useState(null);
  const [activeCount, setActiveCount] = useState(0);

  const lastFitStampRef = useRef({ geoId: null, width: 0, height: 0 });
  const lastUniformsRef = useRef({ atmo: [1, 1], text: [1, 1] });
  const stageNameRef = useRef(stageName);
  const blueprintRef = useRef(blueprint);
  const lastBlueprintMetaRef = useRef({});
  const hotspotMapRef = useRef({});
  const fitsLockedRef = useRef(false);
  const ignoreDirectivesRef = useRef(false);
  const fenceReadyRef = useRef(false);
  const pendingFencepostRef = useRef(false);
  const pendingFenceDataRef = useRef(null);
  const pendingFenceTimeoutRef = useRef(null);
  const spinRef = useRef({ active: false, velocity: { y: 0, z: 0 }, endTime: 0 });
  const particleEffectStateRef = useRef({
    speedMultiplier: 1.0,
    motionParams: { x: 1.0, y: 0.3, z: 0.5 },
    gridSpacing: { x: 2.0, y: 2.0 },
    turbulence: 0.1,
    streakIntensity: 1.0,
    activeMode: 0,
    activeEffects: [],
  });

  const logBind = useCallback((kind, meta = {}) => {
    const geo = geometryRef.current;
    const mat = materialRef.current;
    if (!geo || !mat?.uniforms) return;

    const uniforms = mat.uniforms;
    const vec2 = (uniform) => {
      if (!uniform) return null;
      const value = uniform.value ?? uniform;
      if (!value) return null;
      if (typeof value.toArray === 'function') {
        const tmp = [];
        value.toArray(tmp, 0);
        return tmp.slice(0, 2);
      }
      if (Array.isArray(value)) {
        return value.slice(0, 2);
      }
      if (typeof value.x === 'number' || typeof value.y === 'number') {
        return [value.x ?? null, value.y ?? null];
      }
      return null;
    };

    const payload = {
      kind,
      ...meta,
      atmoAABB: attributeAabb(geo, 'atmosphericPosition'),
      textAABB: attributeAabb(geo, 'text3DPosition'),
      uAtmoFit: vec2(uniforms.uAtmoFit) || null,
      uTextFit: vec2(uniforms.uTextFit) || null,
      uBandFade: uniforms.uBandFade?.value ?? null,
    };

    lastBindMetaRef.current = payload;
    trace('WBG:BIND', payload);
  }, []);

  const sampleRuntimeAABBOnce = useCallback((label = 'WBG:RUNTIME') => {
    const geo = geometryRef.current;
    const arr = geo?.attributes?.position?.array;
    if (!arr?.length) return;
    const meta = lastBindMetaRef.current || {};
    trace(label, {
      kind: meta.kind || null,
      stage: meta.stage || null,
      mode: meta.mode || null,
      posAABB: arrayAabb(arr),
    });
  }, []);

  const emitFencepostNow = useCallback((payload) => {
    if (!payload) return;
    trace('WBG:FENCEPOST', payload);
    BeatBus.emit(EVENTS.PARTICLES_EMERGED, payload);
    if (import.meta?.env?.DEV) {
      console.log('✅ [RENDERER] PARTICLES_EMERGED emitted', payload);
    }

    if (!pageInteractiveDispatchedRef.current) {
      pageInteractiveDispatchedRef.current = true;
      if (typeof window !== 'undefined') {
        const markInteractive = () => {
          if (typeof document !== 'undefined') {
            document.dispatchEvent(new Event('page-interactive'));
          }
        };
        if (typeof window.requestIdleCallback === 'function') {
          window.requestIdleCallback(markInteractive, { timeout: 300 });
        } else {
          window.setTimeout(markInteractive, 150);
        }
      }
    }
  }, []);

  const clearPendingFencepost = useCallback(() => {
    pendingFencepostRef.current = false;
    pendingFenceDataRef.current = null;
    if (pendingFenceTimeoutRef.current) {
      clearTimeout(pendingFenceTimeoutRef.current);
      pendingFenceTimeoutRef.current = null;
    }
  }, []);

  const flushPendingFencepost = useCallback(() => {
    if (pendingFencepostRef.current && pendingFenceDataRef.current) {
      emitFencepostNow(pendingFenceDataRef.current);
      clearPendingFencepost();
    }
  }, [clearPendingFencepost, emitFencepostNow]);

  const queueFencepost = useCallback(
    (payload) => {
      if (!payload) return;

      if (fenceReadyRef.current) {
        emitFencepostNow(payload);
        clearPendingFencepost();
        return;
      }

      pendingFencepostRef.current = true;
      pendingFenceDataRef.current = payload;

      if (pendingFenceTimeoutRef.current) {
        clearTimeout(pendingFenceTimeoutRef.current);
      }

      pendingFenceTimeoutRef.current = setTimeout(() => {
        if (!fenceReadyRef.current) {
          const pending = pendingFenceDataRef.current;
          trace('FENCEPOST_LISTENERS_READY', {
            ...(pending || {}),
            at: (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(),
            source: pending?.source ?? 'renderer-fallback',
            fallback: true,
          });
          fenceReadyRef.current = true;
          flushPendingFencepost();
        }
      }, 120);
    },
    [clearPendingFencepost, emitFencepostNow, flushPendingFencepost]
  );

  const scheduleRuntimeSampling = useCallback(() => {
    for (let i = 0; i < 30; i += 1) {
      setTimeout(() => sampleRuntimeAABBOnce('WBG:RUNTIME'), 16 * i);
    }
  }, [sampleRuntimeAABBOnce]);

  const finalizeEmergence = useCallback(
    (source = 'renderer-fastforward') => {
      if (!emergencePendingRef.current || emittedEmergedRef.current) {
        return false;
      }

      const mat = materialRef.current;
      const uniforms = mat?.uniforms;

      if (uniforms?.uMorphProgress) {
        uniforms.uMorphProgress.value = 1.0;
        if (uniforms.uStageProgress) {
          uniforms.uStageProgress.value = 1.0;
        }
      }

      if (uniforms?.uPostMorphFreeze && uniforms.uPostMorphFreeze.value !== 1.0) {
        uniforms.uPostMorphFreeze.value = 1.0;
      }

      if (mat) {
        mat.uniformsNeedUpdate = true;
      }

      BeatBus.emit?.(EVENTS.MORPH_PROGRESS, { value: 1, source });

      const now =
        typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : Date.now();

      emittedEmergedRef.current = true;
      emergencePendingRef.current = false;
      ignoreDirectivesRef.current = true;

      const payload = {
        at: now,
        source,
        stage: stageNameRef.current || 'genesis',
        morph: 1,
        fastForward: true,
      };

      queueFencepost(payload);
      trace('WBG:FAST_FORWARD', payload);
      return true;
    },
    [queueFencepost]
  );

  const { size, gl, camera } = useThree();

  useEffect(() => {
    const offReady = BeatBus?.on?.(EVENTS.FENCEPOST_LISTENERS_READY, (payload = {}) => {
      fenceReadyRef.current = true;
      trace('FENCEPOST_LISTENERS_READY', payload);
      flushPendingFencepost();
    });
    return () => {
      offReady?.();
      fenceReadyRef.current = false;
      clearPendingFencepost();
    };
  }, [clearPendingFencepost, flushPendingFencepost]);

  // DEV-only guard-friendly snapshot (no special control surface)
  useEffect(() => {
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      window.getRendererSnapshot = () => {
        const geo = geometryRef.current;
        const uniforms = materialRef.current?.uniforms || {};
        return {
          attrs: geo ? Object.keys(geo.attributes || {}) : [],
          drawCount: geo?.drawRange?.count ?? null,
          morph: uniforms.uMorphProgress?.value ?? null,
          pointSize: uniforms.uPointSize?.value ?? null,
          freeze: uniforms.uPostMorphFreeze?.value ?? null,
        };
      };
    }
  }, []);

  const applyRendererFits = useCallback((geo, viewport) => {
    const material = materialRef.current;
    if (!material?.uniforms || !geo) return;

    const resolved = viewport || viewportHintRef.current || window?.__viewportHint || {};
    const fallbackWidth = size?.width || (typeof window !== 'undefined' ? window.innerWidth : 120);
    const fallbackHeight = size?.height || (typeof window !== 'undefined' ? window.innerHeight : 90);
    const width = Math.max(1, resolved.width ?? resolved.cssWidth ?? fallbackWidth ?? 120);
    const height = Math.max(1, resolved.height ?? resolved.cssHeight ?? fallbackHeight ?? 90);

    const stamp = lastFitStampRef.current;
    const geoId = geo.uuid || geo.id;
    if (fitsLockedRef.current && stamp.geoId === geoId && stamp.width === width && stamp.height === height) {
      if (DEV) console.debug('[WBG] fits locked; skipping recompute');
      return;
    }

    if (stamp.geoId === geoId && stamp.width === width && stamp.height === height) {
      return;
    }

    const atmoAabb = computeAABB(geo, 'atmosphericPosition') || computeAABB(geo, 'position');
    const textAabb = computeAABB(geo, 'text3DPosition') || computeAABB(geo, 'position');
    if (!atmoAabb || !textAabb) return;

    const atmoTargetX = Number.isFinite(VC?.ATMO_FIT_X) ? VC.ATMO_FIT_X : 0.92;
    const atmoTargetY = Number.isFinite(VC?.ATMO_FIT_Y) ? VC.ATMO_FIT_Y : 0.85;
    const textTargetWidth = Number.isFinite(VC?.TEXT_FIT_WIDTH) ? VC.TEXT_FIT_WIDTH : 0.9;
    const textTargetMaxH = Number.isFinite(VC?.TEXT_FIT_MAX_H) ? VC.TEXT_FIT_MAX_H : 0.8;

    const halfW = width * 0.5;
    const halfH = height * 0.5;

    const atmoFitX = atmoAabb.extX > 1e-6 ? clampFit((halfW * atmoTargetX) / atmoAabb.extX) : 1;
    const atmoFitY = atmoAabb.extY > 1e-6 ? clampFit((halfH * atmoTargetY) / atmoAabb.extY) : 1;

    const textWidthScale = textAabb.extX > 1e-6 ? (halfW * textTargetWidth) / textAabb.extX : 1;
    let textFitY = textWidthScale;
    if (textAabb.extY > 1e-6) {
      const maxScaleY = (halfH * textTargetMaxH) / textAabb.extY;
      textFitY = Math.min(textFitY, maxScaleY);
    }
    const textFitX = clampFit(textWidthScale);
    textFitY = clampFit(textFitY);

    const newAtmo = [atmoFitX, atmoFitY];
    const newText = [textFitX, textFitY];

    const uniforms = material.uniforms;
    let changed = false;
    if (!vec2Close(lastUniformsRef.current.atmo, newAtmo)) {
      if (uniforms.uAtmoFit?.value?.set) {
        uniforms.uAtmoFit.value.set(atmoFitX, atmoFitY);
      } else {
        uniforms.uAtmoFit = { value: new THREE.Vector2(atmoFitX, atmoFitY) };
      }
      changed = true;
    }

    if (!vec2Close(lastUniformsRef.current.text, newText)) {
      if (uniforms.uTextFit?.value?.set) {
        uniforms.uTextFit.value.set(textFitX, textFitY);
      } else {
        uniforms.uTextFit = { value: new THREE.Vector2(textFitX, textFitY) };
      }
      changed = true;
    }

    if (uniforms.uBandFade !== undefined && uniforms.uBandFade.value !== 0) {
      uniforms.uBandFade.value = 0;
      changed = true;
    }

    if (changed) {
      material.uniformsNeedUpdate = true;
      if (DEV) {
        console.debug('[WBG] fits(set once)', {
          atmoFit: { x: newAtmo[0], y: newAtmo[1] },
          textFit: { x: newText[0], y: newText[1] },
          viewport: { width, height },
        });
      }
    }

    lastUniformsRef.current = { atmo: newAtmo, text: newText };
    lastFitStampRef.current = { geoId, width, height };
    fitsLockedRef.current = true;
  }, [size.width, size.height]);

  const lastBlueprintIdRef = useRef(null);
  const fallbackMorphRef = useRef(0);

  useEffect(() => {
    stageNameRef.current = stageName;
  }, [stageName]);

  useEffect(() => {
    blueprintRef.current = blueprint;
  }, [blueprint]);

  const bandScale = VC?.BAND_FADE_WIDTH ?? 0.35;
  const bandHeightRef = useRef(null);
  const updateBandHeight = useCallback((viewHeight) => {
    if (!Number.isFinite(viewHeight) || viewHeight <= 0) return;
    const scaled = viewHeight * bandScale;
    bandHeightRef.current = scaled;
    const mat = materialRef.current;
    if (mat?.uniforms?.uBandHeight) {
      mat.uniforms.uBandHeight.value = scaled;
      mat.uniformsNeedUpdate = true;
    }
  }, [bandScale]);

  // Point size (once) — raw base only; shader multiplies by uDevicePixelRatio
  useEffect(() => {
    const u = materialRef.current?.uniforms;
    if (!u?.uPointSize) return;
    const base = Canonical?.features?.pointSizeDefault ?? 48.0;
    u.uPointSize.value = base;
  }, []);

  // Viewport hint from projection matrix
  const emitViewportHint = useCallback(() => {
    try {
      const projection = camera?.projectionMatrix;
      if (!projection) return;

      const m11 = projection.elements?.[5] || 1; // 1/tan(fov/2)
      const tanHalfFov = 1 / m11;

      const worldPos = new THREE.Vector3();
      const distance = (() => {
        try {
          camera?.getWorldPosition?.(worldPos);
          return worldPos.length();
        } catch {
          return Math.abs(camera?.position?.z || 1);
        }
      })();

      const canvas = gl?.domElement;
      const rect = canvas?.getBoundingClientRect?.();

      const docWidth = typeof document !== 'undefined' ? document.documentElement?.clientWidth || 0 : 0;
      const docHeight = typeof document !== 'undefined' ? document.documentElement?.clientHeight || 0 : 0;
      const windowWidth = typeof window !== 'undefined'
        ? Math.max(window.innerWidth || 0, docWidth)
        : docWidth;
      const windowHeight = typeof window !== 'undefined'
        ? Math.max(window.innerHeight || 0, docHeight)
        : docHeight;

      const cssWidth = Math.max(
        rect?.width || 0,
        canvas?.clientWidth || 0,
        size.width || 0,
        windowWidth || 0,
        1,
      );
      const cssHeight = Math.max(
        rect?.height || 0,
        canvas?.clientHeight || 0,
        size.height || 0,
        windowHeight || 0,
        1,
      );

      let orientation = (windowWidth && windowHeight)
        ? (windowWidth >= windowHeight ? 'landscape' : 'portrait')
        : (cssWidth >= cssHeight ? 'landscape' : 'portrait');

      let aspect = Number.isFinite(camera?.aspect) && camera.aspect > 0
        ? camera.aspect
        : (cssHeight > 0 ? cssWidth / cssHeight : 1);

      if (!Number.isFinite(aspect) || aspect <= 0) {
        aspect = 1;
      }

      const viewHeightRaw = 2 * distance * tanHalfFov;
      let viewWidth = viewHeightRaw * aspect;
      let viewHeight = viewHeightRaw;

      if (viewWidth < viewHeight) {
        [viewWidth, viewHeight] = [viewHeight, viewWidth];
        aspect = viewWidth / viewHeight;
        orientation = 'landscape';
      } else {
        orientation = 'landscape';
      }

      const hint = {
        width: viewWidth,
        height: viewHeight,
        aspect,
        orientation,
        cssWidth,
        cssHeight,
      };

      viewportHintRef.current = hint;
      BeatBus.emit(EVENTS.ENGINE_VIEWPORT_HINT, hint);
      updateBandHeight(viewHeight);

      if (geometryRef.current) {
        applyRendererFits(geometryRef.current, hint);
        logBind('viewport', {
          stage: stageNameRef.current,
          mode: 'viewport',
          cached: !!blueprintRef.current,
        });
        scheduleRuntimeSampling();
      }

      // expose for TD/CE consumers in DEV and for probes
      if (typeof window !== 'undefined') {
        window.__viewportHint = hint;
      }

      console.log('📐 Renderer: Sent viewport hint (proj-matrix)', {
        width: viewWidth.toFixed(1),
        height: viewHeight.toFixed(1),
        aspect: aspect.toFixed(2),
        cameraDist: distance.toFixed(2),
        orientation,
      });
    } catch (e) {
      console.warn('Viewport hint emit failed', e);
    }
  }, [camera, gl, size.width, size.height, updateBandHeight, logBind, scheduleRuntimeSampling, applyRendererFits]);

  // single emit on mount; microtask-debounced resize (no RAF / no polling timers)
  useEffect(() => {
    emitViewportHint();
    let inDebounce = false;
    const onResize = () => {
      if (inDebounce) return;
      inDebounce = true;
      queueMicrotask(() => {
        try { emitViewportHint(); }
        finally { inDebounce = false; }
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [emitViewportHint]);

  // Fallback morph sink (outside emergence directives)
  const __applyMorph = (v) => {
    const mat = materialRef.current;
    if (!mat?.uniforms) return;
    const u = mat.uniforms;
    if (u.uMorphProgress) u.uMorphProgress.value = v;
    else if (u.morphProgress) u.morphProgress.value = v;
    else if (u.uMorph) u.uMorph.value = v;
    else if (u.morph) u.morph.value = v;
    mat.uniformsNeedUpdate = true;
  };

  // Stage tint sink
  const __applyStageTint = (stage) => {
    const mat = materialRef.current;
    if (!mat?.uniforms) return;
    const { current, next, acc1, acc2 } = pickStageColors(stage);
    const u = mat.uniforms;
    if (u.uColorCurrent) u.uColorCurrent.value = current;
    if (u.uColorNext)    u.uColorNext.value    = next;
    if (u.uColorAccent1) u.uColorAccent1.value = acc1;
    if (u.uColorAccent2) u.uColorAccent2.value = acc2;
    if (u.uPalette0?.value?.set) u.uPalette0.value.set([current.r, current.g, current.b]);
    if (u.uPalette1?.value?.set) u.uPalette1.value.set([acc1.r, acc1.g, acc1.b]);
    if (u.uPalette2?.value?.set) u.uPalette2.value.set([acc2.r, acc2.g, acc2.b]);
    if (u.uPalette3?.value?.set) u.uPalette3.value.set([next.r, next.g, next.b]);
    mat.uniformsNeedUpdate = true;
  };

  // Passive fallbacks (OK to keep)
  useEffect(() => {
    const off = BeatBus?.on?.(EVENTS.STAGE_CHANGE, (p) => {
      const st = p?.stage ?? p?.to ?? p?.name ?? String(p);
      setStageName(st);
      __applyStageTint(st);
    });
    return () => off && off();
  }, []);

  // atlas init
  useEffect(() => {
    const atlas = getPointSpriteAtlasSingleton();
    const texture = atlas.createWebGLTexture();
    setAtlasTexture(texture);
  }, []);

  // Emergence flag (no local tween; engine drives via directives)
  useEffect(() => {
    const off = BeatBus?.on?.(EVENTS.PARTICLES_START_EMERGING, () => {
      emergencePendingRef.current = true;
      emittedEmergedRef.current = false;
    });
    return () => off && off();
  }, []);

  useEffect(() => {
    let morphProbeTimer = null;
    const off = BeatBus?.on?.(EVENTS.STAGE_CHANGE, () => {
      if (morphProbeTimer) {
        clearInterval(morphProbeTimer);
        morphProbeTimer = null;
      }
      const uniforms = materialRef.current?.uniforms;
      const start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      morphProbeTimer = setInterval(() => {
        if (!uniforms?.uMorphProgress) return;
        const val = Number(uniforms.uMorphProgress.value) || 0;
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        console.log('[PROBE] uMorphProgress', { t: Math.round(now - start), val });
        if (now - start > 2000) {
          clearInterval(morphProbeTimer);
          morphProbeTimer = null;
        }
      }, 120);
    });
    return () => {
      if (morphProbeTimer) clearInterval(morphProbeTimer);
      off && off();
    };
  }, []);

  // Raycaster: handle click requests from canvas
  useEffect(() => {
    const handleClickRequest = (payload = {}) => {
      const mouse = payload?.mouse;
      if (!mouse) {
        console.warn('[WebGLBackground] Invalid click request payload', payload);
        return;
      }

      const mesh = meshRef.current;
      if (!camera) {
        console.error('[WebGLBackground] Camera not available for raycasting');
        return;
      }

      if (!mesh) {
        console.error('[WebGLBackground] Particle mesh not available for raycasting');
        return;
      }

      const positionAttr = mesh?.geometry?.attributes?.position;
      const particleCount = positionAttr?.count ?? 0;
      const safeGetParticle = (idx) =>
        positionAttr && idx < particleCount
          ? {
              x: positionAttr.getX(idx),
              y: positionAttr.getY(idx),
              z: positionAttr.getZ(idx),
            }
          : null;
      const centerIndex = particleCount > 0 ? Math.min(Math.floor(particleCount / 2), particleCount - 1) : 0;
      const lastIndex = particleCount > 0 ? particleCount - 1 : 0;

      const diagnostic = {
        timestamp: Date.now(),
        camera: camera
          ? {
              type: camera.type,
              position: {
                x: camera.position.x,
                y: camera.position.y,
                z: camera.position.z,
              },
              rotation: {
                x: camera.rotation.x,
                y: camera.rotation.y,
                z: camera.rotation.z,
              },
              quaternion: {
                x: camera.quaternion.x,
                y: camera.quaternion.y,
                z: camera.quaternion.z,
                w: camera.quaternion.w,
              },
              fov: camera.fov,
              aspect: camera.aspect,
              near: camera.near,
              far: camera.far,
              zoom: camera.zoom,
              matrixWorldNeedsUpdate: camera.matrixWorldNeedsUpdate,
            }
          : null,
        mesh: mesh
          ? {
              type: mesh.type,
              visible: mesh.visible,
              position: {
                x: mesh.position.x,
                y: mesh.position.y,
                z: mesh.position.z,
              },
              scale: {
                x: mesh.scale.x,
                y: mesh.scale.y,
                z: mesh.scale.z,
              },
              rotation: {
                x: mesh.rotation.x,
                y: mesh.rotation.y,
                z: mesh.rotation.z,
              },
              matrixWorldNeedsUpdate: mesh.matrixWorldNeedsUpdate,
              renderOrder: mesh.renderOrder,
              frustumCulled: mesh.frustumCulled,
              geometry: mesh.geometry
                ? {
                    type: mesh.geometry.type,
                    particleCount,
                    hasPositionAttr: Boolean(positionAttr),
                    positionNeedsUpdate: positionAttr?.needsUpdate ?? false,
                    boundingSphere: mesh.geometry.boundingSphere
                      ? {
                          centerX: mesh.geometry.boundingSphere.center.x,
                          centerY: mesh.geometry.boundingSphere.center.y,
                          centerZ: mesh.geometry.boundingSphere.center.z,
                          radius: mesh.geometry.boundingSphere.radius,
                        }
                      : null,
                    firstParticle: safeGetParticle(0),
                    centerParticle: safeGetParticle(centerIndex),
                    lastParticle: safeGetParticle(lastIndex),
                  }
                : null,
            }
          : null,
        mouse: {
          x: mouse.x,
          y: mouse.y,
        },
        raycaster: {
          threshold: particleRaycaster.raycaster.params.Points.threshold,
        },
      };

      if (typeof window !== 'undefined' && window.RAYCAST_DIAGNOSTIC) {
        window.RAYCAST_DIAGNOSTIC.lastTest = diagnostic;
        window.RAYCAST_DIAGNOSTIC.history.push(diagnostic);
      }

      console.log('🔍 DIAGNOSTIC CAPTURED');
      console.log('   Run in console: window.RAYCAST_DIAGNOSTIC.lastTest');

      const hit = particleRaycaster.getClosestParticle(mouse, camera, mesh);
      if (!hit) return;

      const particleIndex = hit.index;
      console.log(
        `✨ Particle ${particleIndex} clicked (distance: ${hit.distance.toFixed(2)})`
      );

      const hotspotMap = hotspotMapRef.current || {};
      let matchedHotspot = null;
      for (const [hotspotId, hotspotData] of Object.entries(hotspotMap)) {
        if (!hotspotData) continue;
        const { indexSet, indices } = hotspotData;
        let contains = false;
        if (indexSet && typeof indexSet.has === 'function') {
          contains = indexSet.has(particleIndex);
        } else if (indices && typeof indices.includes === 'function') {
          contains = indices.includes(particleIndex);
        }
        if (contains) {
          matchedHotspot = { hotspotId, ...hotspotData };
          break;
        }
      }

      if (matchedHotspot) {
        console.log('🎯 HOTSPOT HIT!', matchedHotspot);
        if (matchedHotspot.fragmentId) {
          console.log(`   Fragment: ${matchedHotspot.fragmentId}`);
          if (window.narrativeAtom?.activateMemoryFragment) {
            window.narrativeAtom.activateMemoryFragment(matchedHotspot.fragmentId);
            console.log(`✨ Fragment modal activated: ${matchedHotspot.fragmentId}`);
          } else {
            console.warn('[WBG] narrativeAtom.activateMemoryFragment not available');
          }
        }
      } else {
        console.log(`   Not a hotspot (particle ${particleIndex})`);
      }

      const currentStage = stageNameRef.current || 'genesis';
      const point = hit.point
        ? { x: hit.point.x, y: hit.point.y, z: hit.point.z }
        : null;
      const hotspotPayload = matchedHotspot
        ? {
            id: matchedHotspot.hotspotId ?? matchedHotspot.id ?? null,
            fragmentId: matchedHotspot.fragmentId ?? null,
            meta: {
              particles: matchedHotspot.particles ?? matchedHotspot.indices ?? null,
            },
          }
        : null;

      BeatBus.emit?.(EVENTS.PARTICLE_CLICK_HIT, {
        particleIndex,
        index: particleIndex,
        distance: hit.distance,
        point,
        stage: currentStage,
        hotspot: hotspotPayload,
        schemaVersion: '3.5',
      });
    };

    const off = BeatBus?.on?.(EVENTS.PARTICLE_CLICK_REQUEST, handleClickRequest);
    return () => off && off();
  }, [camera, meshRef]);

  // BLUEPRINT_READY → bind buffers & EMERGED fencepost (once) on first FULL genesis
  useEffect(() => {
    const handleBlueprint = (payload) => {
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
      const stepName = raw?.climaxStep || (rawMode?.includes(':') ? rawMode.split(':')[1] : null);
      const isClimax = Boolean(rawMode?.startsWith?.('climax')) || Boolean(raw?.climaxStep);

      const id = isClimax
        ? `${st}-${raw?.particleCount || raw?.activeCount || raw?.maxParticles || 0}-${stepName || 'climax'}-${sequenceId || ''}`
        : `${st}-${raw?.count || raw?.particleCount || raw?.activeCount || 0}-${mode || 'default'}`;
      if (!raw?.atmosphericPositions || !raw?.text3DPositions) return;
      if (id === lastBlueprintIdRef.current) return;
      lastBlueprintIdRef.current = id;
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

      if (isClimax) {
        if (cached) {
          console.log('🎬 Climax detected - forcing fresh blueprint bind');
        }
        cached = false;
      }

      // ignore non-genesis full binds while pending (pre-scroll)
      if (!isEmergence && emergencePendingRef.current) {
        if ((raw.stageName || st) !== 'genesis') {
          console.warn('🖼️ Renderer: ignoring pre-scroll full for stage=', raw.stageName || st);
          return;
        }
      }
      // ignore late emergence after handoff
      if (isEmergence && emittedEmergedRef.current) return;

      // bind arrays
      setBlueprint(raw);
      lastBlueprintMetaRef.current = raw?.metadata || {};
      setStageName(isEmergence ? 'genesis' : (raw.stageName || st || 'genesis'));
      setActiveCount(raw.activeCount || raw.particleCount || raw.maxParticles || 0);
      applyMetadataColors(materialRef.current, raw?.metadata?.colors, VC?.GENESIS_PALETTE);

      if (isOpeningChaos) {
        emergencePendingRef.current = true;
        emittedEmergedRef.current = false;
      }

      const uniforms = materialRef.current?.uniforms;
      if (uniforms) {
        const palette = raw?.metadata?.colors || raw?.colors || null;
        if (palette) {
          const fetch = (idx, fallbackIdx = 0) => hexToRGBArray(palette[idx] || palette[fallbackIdx] || palette[palette.length - 1]);
          uniforms.uPalette0.value = new Float32Array(fetch(0));
          uniforms.uPalette1.value = new Float32Array(fetch(1, 0));
          uniforms.uPalette2.value = new Float32Array(fetch(2, 1));
          uniforms.uPalette3.value = new Float32Array(fetch(3, 0));
          uniforms.uPalette0.needsUpdate = uniforms.uPalette1.needsUpdate = true;
          uniforms.uPalette2.needsUpdate = uniforms.uPalette3.needsUpdate = true;
        }

        const motionBehaviors = raw?.metadata?.motionBehaviors || null;
        if (motionBehaviors) {
          const tierDefs = [motionBehaviors.tier0, motionBehaviors.tier1, motionBehaviors.tier2, motionBehaviors.tier3];
          const modeArray = new Float32Array(4);
          const paramsArrays = [new Float32Array(4), new Float32Array(4), new Float32Array(4), new Float32Array(4)];
          tierDefs.forEach((def, index) => {
            const { mode, params } = mapBehaviorToMode(def?.behavior);
            modeArray[index] = mode;
            const src = Array.isArray(params) ? params : [0, 0, 0, 0];
            paramsArrays[index].set(src.slice(0, 4));
          });
          uniforms.uTierMode.value = modeArray;
          uniforms.uTierParams0.value = paramsArrays[0];
          uniforms.uTierParams1.value = paramsArrays[1];
          uniforms.uTierParams2.value = paramsArrays[2];
          uniforms.uTierParams3.value = paramsArrays[3];
          uniforms.uTierMode.needsUpdate = true;
          uniforms.uTierParams0.needsUpdate = uniforms.uTierParams1.needsUpdate = true;
          uniforms.uTierParams2.needsUpdate = uniforms.uTierParams3.needsUpdate = true;
        }

        if (uniforms.uTierHighlight) {
          uniforms.uTierHighlight.value = -1;
        }
      }

      const stageForLog = raw.stageName || st || 'genesis';
      const nextHotspotMap = raw?.hotspotMap
        || raw?.hotspotLookup?.indicesByHotspot
        || null;
      if (nextHotspotMap && typeof nextHotspotMap === 'object') {
        const hotspotIds = Object.keys(nextHotspotMap);
        const localizedMap = {};
        hotspotIds.forEach((id) => {
          const entry = nextHotspotMap[id];
          if (!entry) return;
          localizedMap[id] = {
            ...entry,
            indexSet: entry.indices && typeof entry.indices[Symbol.iterator] === 'function'
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

      const viewport = raw?.metadata?.viewport || payload?.viewportHint || window?.__viewportHint;
      if (viewport) {
        viewportHintRef.current = viewport;
        if (viewport?.height) updateBandHeight(viewport.height);
      } else {
        const fallbackHeight = window?.__viewportHint?.height;
        if (fallbackHeight) updateBandHeight(fallbackHeight);
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
          Object.defineProperty(raw, '__qrAutoscaled', { value: true, enumerable: false, configurable: true });
        } catch {
          raw.__qrAutoscaled = true;
        }
      }

      if (geometryRef.current) geometryRef.current.dispose();
      const geo = new THREE.BufferGeometry();
      const primaryPositions =
        isQrBlueprint
          ? (raw.text3DPositions || raw.atmosphericPositions || raw.positions)
          : (raw.atmosphericPositions || raw.text3DPositions || raw.positions);

      if (primaryPositions instanceof Float32Array) {
        geo.setAttribute('position', new THREE.BufferAttribute(primaryPositions, 3));
      }
      if (raw.atmosphericPositions instanceof Float32Array) {
        geo.setAttribute('atmosphericPosition', new THREE.BufferAttribute(raw.atmosphericPositions, 3));
      }
      if (raw.text3DPositions instanceof Float32Array) {
        geo.setAttribute('text3DPosition', new THREE.BufferAttribute(raw.text3DPositions, 3));
      }
      if (raw.animationSeeds)  geo.setAttribute('animationSeed',  new THREE.BufferAttribute(raw.animationSeeds, 3));
      if (raw.sizeMultipliers) geo.setAttribute('sizeMultiplier', new THREE.BufferAttribute(raw.sizeMultipliers, 1));
      if (raw.opacityData)     geo.setAttribute('opacityData',    new THREE.BufferAttribute(raw.opacityData, 1));
      if (raw.atlasIndices)    geo.setAttribute('atlasIndex',     new THREE.BufferAttribute(raw.atlasIndices, 1));
      if (raw.tierData)        geo.setAttribute('tierData',       new THREE.BufferAttribute(raw.tierData, 1));
      const inferredCount = primaryPositions instanceof Float32Array ? primaryPositions.length / 3 : 0;
      const drawCount = raw.activeCount || raw.particleCount || inferredCount;
      const idx = new Float32Array(drawCount > 0 ? drawCount : 0);
      for (let i = 0; i < idx.length; i++) idx[i] = i;
      geo.setAttribute('particleIndex', new THREE.BufferAttribute(idx, 1));
      geo.setDrawRange(0, drawCount);
      geometryRef.current = geo;
      geometryBoundOnceRef.current = true;
      fitsLockedRef.current = false;
      if (isEmergence) {
        fenceReadyRef.current = false;
        clearPendingFencepost();
        ignoreDirectivesRef.current = false;
      }
      const mat = materialRef.current;
      const freezeUniform = mat?.uniforms?.uPostMorphFreeze;
      if (freezeUniform && isEmergence && freezeUniform.value !== 0.0) {
        freezeUniform.value = 0.0;
        mat.uniformsNeedUpdate = true;
      }
      if (mat) {
        applyRendererFits(geo, viewportHintRef.current || viewport);
        logBind(isEmergence ? 'emergence' : 'stage', {
          stage: raw.stageName || st || 'genesis',
          mode: mode || raw?.mode || (isEmergence ? 'emergence' : 'full'),
          cached: !!cached,
        });
        scheduleRuntimeSampling();
        if (mat?.uniforms?.uMorphProgress) {
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
        ignoreDirectivesRef.current = false;

        const uniforms = mat?.uniforms;
        if (uniforms) {
          const maybeSeedNumber = (uniform, value) => {
            if (!uniform) return false;
            const current = uniform.value;
            if (typeof current === 'number' && Number.isFinite(current)) return false;
            uniform.value = value;
            if (typeof uniform.needsUpdate === 'boolean') uniform.needsUpdate = true;
            return true;
          };

          const seededPointSize = maybeSeedNumber(
            uniforms.uPointSize,
            raw?.metadata?.pointSize ?? uniforms.uPointSize?.value ?? 3.0
          );
          const seededGaussian = maybeSeedNumber(
            uniforms.uGaussianSigma,
            raw?.metadata?.gaussianSigma ?? Canonical?.features?.gaussianSigma ?? 2.5
          );
          const seededMorph = maybeSeedNumber(
            uniforms.uMorphProgress,
            fallbackMorphRef.current ?? 0
          );

          const drawCountUniform = geometryRef.current?.attributes?.position?.count ?? drawCount;
          if (uniforms.uActiveCount) {
            uniforms.uActiveCount.value = drawCountUniform;
            uniforms.uActiveCount.needsUpdate = true;
          }
          if (uniforms.uTierCutoff) {
            uniforms.uTierCutoff.value = Math.max(uniforms.uTierCutoff.value || 0, drawCountUniform);
            uniforms.uTierCutoff.needsUpdate = true;
          }
          if (seededPointSize || seededGaussian || seededMorph) {
            mat.uniformsNeedUpdate = true;
          }
        }
      }

      // Leave background color untouched for QR binds to avoid pre-emptive white-out.

      if (DEV && !geo.__singleWriterPatched) {
        const rawSetDrawRange = geo.setDrawRange.bind(geo);
        geo.setDrawRange = (start, count) => {
          if (!renderGuardRef.current) {
            console.warn('[SingleWriter] drawRange call blocked outside renderer path');
            return;
          }
          return rawSetDrawRange(start, count);
        };
        geo.__singleWriterPatched = true;
      }

      const disableBand = isEmergence || (raw.stageName || st) === 'genesis';
      if (mat?.uniforms?.uBandFade) {
        mat.uniforms.uBandFade.value = disableBand ? 0 : 1;
        mat.uniformsNeedUpdate = true;
      }

      if (isEmergence) {
        console.log('✅ Renderer: BR(emergence) bound', `count=${raw.particleCount || raw.activeCount}`, `quality=${quality}`);
        emergencePendingRef.current = true;
        emittedEmergedRef.current = false;
        if (DEV) {
          const extent = (key) => {
            const attr = geo.attributes[key];
            if (!attr) return null;
            const arr = attr.array;
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
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
          console.debug('[WBG] AABB bind', { pos: extent('position') }, { atm: extent('atmosphericPosition') }, { tgt: extent('text3DPosition') });
        }
        BeatBus.emit?.(EVENTS.MORPH_PROGRESS, { value: 0 });
        if (shouldFastForward) {
          const source = fastForwardRequested ? 'renderer-fastforward' : 'renderer-skip-morph';
          if (finalizeEmergence(source)) {
            console.log('⚡ Renderer: Emergence fast-forward applied', {
              source,
              cacheKey,
              stage: raw.stageName || st || 'genesis',
            });
          }
        }
      } else {
        console.log(`✅ Renderer: ${cached ? 'cached' : 'new'} BR(full)`, `stage=${raw.stageName || st}`, `count=${raw.particleCount || raw.activeCount}`, `quality=${quality}`, isQrBlueprint ? '[qrMode]' : '');
        if (isOpeningChaos) {
          fenceReadyRef.current = false;
          clearPendingFencepost();
          geometryBoundOnceRef.current = false;
        }

        if (isClimax) {
          const blueprintForDiag = raw;
          const geometry = geo;
          const material = mat;
          const positionAttr = geometry?.attributes?.position;
          const positionsArray = positionAttr?.array;
          const text3DPositions = blueprintForDiag?.text3DPositions;
          const atmosphericPositions = blueprintForDiag?.atmosphericPositions;
          const stepName = blueprintForDiag?.climaxStep || blueprintForDiag?.mode?.split?.(':')?.[1] || null;
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
              const dist = Math.abs(arr[i]) + Math.abs(arr[i + 1]) + Math.abs(arr[i + 2]);
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
            const checks = [0, 99, 999, positionsArray.length - 1].filter((idx) => idx >= 0 && idx < positionsArray.length);
            return checks.every((idx) => text3DPositions[idx] === positionsArray[idx]);
          })();

          console.log('🔬 CLIMAX DIAGNOSTIC (ENHANCED):', {
            climaxStep: stepName,
            particleCount: blueprintForDiag?.particleCount || 0,
            hasText3D: text3DPositions instanceof Float32Array,
            text3DLength: text3DPositions?.length || 0,
            hasGeometry: positionsArray instanceof Float32Array,
            geometryLength: positionsArray?.length || 0,
            text3DStart: sample(text3DPositions, 0, 9),
            text3DMiddle: sample(text3DPositions, Math.max(0, Math.floor((text3DPositions?.length || 0) / 2) - 4), 9),
            text3DEnd: sample(text3DPositions, Math.max(0, (text3DPositions?.length || 9) - 9), 9),
            geometryStart: sample(positionsArray, 0, 9),
            geometryMiddle: sample(positionsArray, Math.max(0, Math.floor((positionsArray?.length || 0) / 2) - 4), 9),
            geometryEnd: sample(positionsArray, Math.max(0, (positionsArray?.length || 9) - 9), 9),
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

        if ((raw.stageName || st) === 'genesis' && emergencePendingRef.current && !emittedEmergedRef.current) {
          const mat = materialRef.current;
          const freezeUniform = mat?.uniforms?.uPostMorphFreeze;
          if (freezeUniform && freezeUniform.value !== 1.0) {
            freezeUniform.value = 1.0;
            mat.uniformsNeedUpdate = true;
            trace('WBG:FREEZE', { value: 1, source: 'blueprint' });
          }
          const payload = {
            at: (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(),
            source: 'renderer-blueprint',
            stage: raw.stageName || st || 'genesis',
            count:
              geometryRef.current?.attributes?.position?.count ??
              raw.activeCount ??
              raw.particleCount ??
              0,
          };
          fenceReadyRef.current = true;
          clearPendingFencepost();
          emitFencepostNow(payload);
          if (typeof window !== 'undefined') {
            window.__lastParticlesEmerged = payload;
          }
          emittedEmergedRef.current = true;
          emergencePendingRef.current = false;
          console.log('EMERGED once — emitting PARTICLES_EMERGED fencepost');
        }
      }

      if (!isEmergence) {
        requestAnimationFrame(() => {
          const matNext = materialRef.current;
          const freezeNext = matNext?.uniforms?.uPostMorphFreeze;
          if (freezeNext && freezeNext.value !== 0.0) {
            freezeNext.value = 0.0;
            matNext.uniformsNeedUpdate = true;
            trace('WBG:FREEZE', { value: 0, source: 'stage' });
          }
          ignoreDirectivesRef.current = false;
        });
      }

      // ---------- SAFETY: ensure QR mode cannot leak into normal stages ----------
      if (!isQrBlueprint && qrModeRef.current) {
        const uniformsNow = materialRef.current?.uniforms;
        if (uniformsNow?.uPostMorphFreeze) {
          uniformsNow.uPostMorphFreeze.value = 0;
          uniformsNow.uPostMorphFreeze.needsUpdate = true;
        }
        if (uniformsNow?.uPointSize && lastPointSizeRef.current != null) {
          uniformsNow.uPointSize.value = lastPointSizeRef.current;
          uniformsNow.uPointSize.needsUpdate = true;
          lastPointSizeRef.current = null;
        }
        qrModeRef.current = false;
        if (gl && restoreClearRef.current) {
          const [r, g, b, a] = restoreClearRef.current;
          gl.setClearColor(new THREE.Color(r, g, b), a);
        }
        timeTickEnabledRef.current = true;
      }

      // ---------- MORPH: start at 0 for FULL binds so we actually see the transition ----------
      const isEmergenceMode = payload?.mode === 'emergence' || payload?.blueprint?.mode === 'emergence';
      const matCurrent = materialRef.current;
      const currentUniforms = matCurrent?.uniforms;
      if (!isEmergenceMode && currentUniforms?.uMorphProgress) {
        const director = typeof window !== 'undefined' ? window.theaterDirector : null;
        const currentStage = director?.getCurrentStage?.() ?? director?.currentStage ?? null;
        const currentPhase = director?.getCurrentPhase?.() ?? director?.phase ?? null;
        const isOpeningPhase = currentStage === 'genesis' && currentPhase !== 'emergence';
        const startMorph = 0.0;

        currentUniforms.uMorphProgress.value = startMorph;
        if (currentUniforms.uStageProgress) {
          currentUniforms.uStageProgress.value = startMorph;
        }
        fallbackMorphRef.current = startMorph;
        matCurrent.uniformsNeedUpdate = true;

        if (isOpeningPhase && !geometryBoundOnceRef.current) {
          geometryBoundOnceRef.current = true;
          return;
        }

        if (!geometryBoundOnceRef.current) {
          geometryBoundOnceRef.current = true;
        }

        {
          const startTime = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
          const duration = 1200;
          const raf = typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
            ? window.requestAnimationFrame
            : (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null);
          if (!raf) return;
          const step = (now) => {
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
              raf(step);
            }
          };
          raf(step);
        }
      }

      if (isQrBlueprint && !qrModeRef.current) {
        const renderer = gl;
        if (renderer) {
          const previousColor = renderer.getClearColor(new THREE.Color());
          const previousAlpha = typeof renderer.getClearAlpha === 'function' ? renderer.getClearAlpha() : 1;
          restoreClearRef.current = [previousColor.r, previousColor.g, previousColor.b, previousAlpha];
        }
        const uniforms = materialRef.current?.uniforms;
        if (uniforms?.uPostMorphFreeze) {
          uniforms.uPostMorphFreeze.value = 1;
          uniforms.uPostMorphFreeze.needsUpdate = true;
        }
        if (uniforms?.uTierMode && uniforms.uTierMode.value) {
          const arr = uniforms.uTierMode.value;
          for (let i = 0; i < arr.length; i += 1) arr[i] = 0;
          uniforms.uTierMode.needsUpdate = true;
        }
        if (uniforms?.uPointSize) {
          const dpr = typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1;
          lastPointSizeRef.current = uniforms.uPointSize.value;
          uniforms.uPointSize.value = Math.max(2.6, 3.2 * dpr);
          uniforms.uPointSize.needsUpdate = true;
        }
        timeTickEnabledRef.current = false;
        qrModeRef.current = true;
        if (materialRef.current) {
          materialRef.current.uniformsNeedUpdate = true;
        }
      }
    };
    const off = BeatBus?.on?.(EVENTS.BLUEPRINT_READY, handleBlueprint);
    return () => off && off();
  }, [updateBandHeight, logBind, scheduleRuntimeSampling, clearPendingFencepost, queueFencepost, finalizeEmergence]);

  // MORPH_PROGRESS → lightweight timeline updates
  useEffect(() => {
    if (!blueprint || !materialRef.current?.uniforms) {
      return;
    }
    if (typeof BeatBus?.on !== 'function') {
      return;
    }

    const handleMorphProgress = (payload = {}) => {
      const raw = payload?.morphProgress ?? payload?.value ?? null;
      const value = Number.isFinite(raw) ? clamp01(raw) : null;
      if (value == null) return;

      if (!geometryBoundOnceRef.current) {
        if (DEV) {
          console.log('[WBG] Morph ignored (geometry not yet bound)', payload);
        }
        return;
      }

      fallbackMorphRef.current = value;

      const mat = materialRef.current;
      const uniforms = mat?.uniforms;
      if (!uniforms) {
        if (DEV) console.warn('⚠️ [MORPH] Material uniforms missing');
        return;
      }

      __applyMorph(value);
      if (uniforms.uStageProgress) {
        uniforms.uStageProgress.value = value;
      }
      mat.uniformsNeedUpdate = true;

      if (emergencePendingRef.current && !emittedEmergedRef.current && value >= 0.995) {
        const now =
          typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now();

        if (uniforms.uPostMorphFreeze && uniforms.uPostMorphFreeze.value !== 1.0) {
          uniforms.uPostMorphFreeze.value = 1.0;
          mat.uniformsNeedUpdate = true;
          trace('WBG:FREEZE', { value: 1, source: 'morph' });
        }

        const currentStage = stageNameRef.current || 'genesis';
        queueFencepost({
          at: now,
          source: 'renderer-morph',
          stage: currentStage,
          morph: value,
        });

        emittedEmergedRef.current = true;
        emergencePendingRef.current = false;
        ignoreDirectivesRef.current = true;
      }

      if (DEV) {
        console.log('🔬 [MORPH] Updated:', value.toFixed(3));
      }
    };

    const unsubMorph = BeatBus.on(EVENTS.MORPH_PROGRESS, handleMorphProgress);

    if (DEV) {
      console.log('✅ Renderer subscribed:', {
        MORPH_PROGRESS: 'active',
        BLUEPRINT_READY: 'active (separate hook)',
      });
    }

    return () => {
      unsubMorph?.();
    };
  }, [blueprint, queueFencepost]);

  // build material once atlas+blueprint exist
  useEffect(() => {
    if (!atlasTexture || !blueprint) return;

    const stageIndex = Math.max(0, (Canonical?.stageOrder || []).indexOf(stageName));
    const POINT_SIZE_DEFAULT = Canonical?.features?.pointSizeDefault ?? 48.0;
    const palette = pickStageColors(stageName);
    const blueprintCount = blueprint?.activeCount || blueprint?.particleCount || blueprint?.maxParticles || 0;

    let mat = materialRef.current;
    let created = false;

    if (!mat) {
      created = true;
      mat = new THREE.ShaderMaterial({
        onBeforeCompile: () => { try { console.log('🧪 Shader compiled'); } catch {} },
        uniforms: {
          uTime:            { value: 0 },
          uMorphProgress:   { value: clamp01(fallbackMorphRef.current) },
          uScrollProgress:  { value: 0 },
          uStageProgress:   { value: clamp01(fallbackMorphRef.current) },
          uStageBlend:      { value: 0 },
          uAtlasTexture:    { value: atlasTexture },
          uTotalSprites:    { value: 16 },
          uPointSize:       { value: POINT_SIZE_DEFAULT },
          uDevicePixelRatio:{ value: (() => {
            try { return Math.min(gl?.getPixelRatio?.() ?? 1, 1.5); } catch { return 1; }
          })() },
          uResolution:      { value: new THREE.Vector2(1, 1) },
          uAtmoFit:         { value: new THREE.Vector2(1, 1) },
          uTextFit:         { value: new THREE.Vector2(1, 1) },
          uMoveDampStart:   { value: 0.96 },
          uMoveDampStartY:  { value: 0.9 },
          uPostMorphFreeze: { value: 0.0 },
          uActiveCount:     { value: blueprintCount },
          uTierCutoff:      { value: blueprintCount || 15000 },
          uFadeProgress:    { value: 1.0 },
          uGaussianSigma:   { value: 2.5 },
          uBandHeight:      { value: bandHeightRef.current || 0 },
          uBandFade:        { value: 0 },
          uGaussianFalloff: { value: Canonical?.features?.gaussianFalloff ?? 1.0 },
          uCenterWeighting: { value: Canonical?.features?.centerWeightingTier4 ?? 1.0 },
          uStageIndex:      { value: stageIndex },
          uBrainRegion:     { value: stageIndex },
          uSpreadFactor:    { value: 1.0 },
          uMorphType:       { value: MORPH_TYPE_ENUM.steady },
          // Legacy color uniforms (kept for compatibility)
          uColorCurrent:    { value: palette.current.clone() },
          uColorNext:       { value: palette.next.clone() },
          uColorAccent1:    { value: palette.acc1.clone() },
          uColorAccent2:    { value: palette.acc2.clone() },
          // Tier motion interface
          uTierMode:        { value: new Float32Array([0, 0, 0, 0]) },
          uTierParams0:     { value: new Float32Array([0, 0, 0, 0]) },
          uTierParams1:     { value: new Float32Array([0, 0, 0, 0]) },
          uTierParams2:     { value: new Float32Array([0, 0, 0, 0]) },
          uTierParams3:     { value: new Float32Array([0, 0, 0, 0]) },
          // Stage palette (per tier)
          uPalette0:        { value: new Float32Array([palette.current.r, palette.current.g, palette.current.b]) },
          uPalette1:        { value: new Float32Array([palette.acc1.r, palette.acc1.g, palette.acc1.b]) },
          uPalette2:        { value: new Float32Array([palette.acc2.r, palette.acc2.g, palette.acc2.b]) },
          uPalette3:        { value: new Float32Array([palette.next.r, palette.next.g, palette.next.b]) },
          uTierHighlight:   { value: -1 },
          uGridSpacing:     { value: new Float32Array([0.5, 0.5]) },
          uFlowTurbulence:  { value: 0.0 },
          uStreakIntensity:{ value: 0.0 },
          uMotionParams:   { value: new Float32Array([0, 0, 0, 0]) },
        },
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
      });
      materialRef.current = mat;
    }

    const uniforms = mat.uniforms || {};
    if (!uniforms.uSpreadFactor) uniforms.uSpreadFactor = { value: 1.0 };
    if (!uniforms.uMorphType) uniforms.uMorphType = { value: MORPH_TYPE_ENUM.steady };
    if (uniforms.uAtlasTexture) uniforms.uAtlasTexture.value = atlasTexture;
    if (uniforms.uStageIndex) uniforms.uStageIndex.value = stageIndex;
    if (uniforms.uBrainRegion) uniforms.uBrainRegion.value = stageIndex;
    if (uniforms.uPointSize) uniforms.uPointSize.value = POINT_SIZE_DEFAULT;
    if (uniforms.uDevicePixelRatio) {
      try { uniforms.uDevicePixelRatio.value = Math.min(gl?.getPixelRatio?.() ?? 1, 1.5); }
      catch { uniforms.uDevicePixelRatio.value = 1; }
    }

    if (!bandHeightRef.current) {
      const hintHeight = window?.__viewportHint?.height;
      const computed = Number.isFinite(hintHeight) && hintHeight > 0
        ? hintHeight * bandScale
        : 40 * bandScale;
      bandHeightRef.current = computed;
    }
    if (uniforms.uBandHeight && bandHeightRef.current) {
      uniforms.uBandHeight.value = bandHeightRef.current;
    }

    // Refresh stage palette each time
    if (uniforms.uColorCurrent) uniforms.uColorCurrent.value = palette.current;
    if (uniforms.uColorNext)    uniforms.uColorNext.value    = palette.next;
    if (uniforms.uColorAccent1) uniforms.uColorAccent1.value = palette.acc1;
    if (uniforms.uColorAccent2) uniforms.uColorAccent2.value = palette.acc2;

    if (uniforms.uActiveCount) uniforms.uActiveCount.value = blueprintCount;
    if (uniforms.uTierCutoff)  uniforms.uTierCutoff.value  = blueprintCount || 15000;

    mat.uniformsNeedUpdate = true;

    if (created && geometryRef.current) {
      fitsLockedRef.current = false;
      ignoreDirectivesRef.current = false;
      applyRendererFits(geometryRef.current, viewportHintRef.current);
      logBind('material-init', {
        stage: stageName,
        cached: false,
      });
      scheduleRuntimeSampling();
    }

    if (typeof window !== 'undefined') {
      exposeDiagnostics('webglBackground', () => ({
        stage: stageName,
        blueprintCount,
        activeCount,
        uniforms: mat ? Object.keys(mat.uniforms || {}) : [],
        hasGeometry: !!geometryRef.current,
        morph: mat?.uniforms?.uMorphProgress?.value ?? null,
      }));

      exposeControlSurface('__rendererDiagnostics', () => ({
        getUniformValue: (name) => {
          const uniform = mat?.uniforms?.[name];
          if (!uniform) return null;
          const val = uniform.value;
          if (val == null) return null;
          if (typeof val === 'number' || typeof val === 'string' || typeof val === 'boolean') return val;
          if (Array.isArray(val)) return [...val];
          if (val instanceof THREE.Color) {
            return {
              hex: val.getHexString(),
              rgb: [val.r, val.g, val.b],
            };
          }
          if (val && typeof val.toArray === 'function') {
            const out = [];
            val.toArray(out);
            return out;
          }
          return val;
        },
        getAttributeArray: (name) => {
          const attr = geometryRef.current?.getAttribute?.(name);
          if (!attr?.array) return null;
          return Float32Array.from(attr.array);
        },
        getActiveCount: () => mat?.uniforms?.uActiveCount?.value ?? null,
        getDrawCount: () => geometryRef.current?.drawRange?.count ?? null,
      }), {
        getUniformValue: 'renderer:diagnostics',
        getAttributeArray: 'renderer:diagnostics',
        getActiveCount: 'renderer:diagnostics',
        getDrawCount: 'renderer:diagnostics',
      });
    }

    __applyStageTint(stageName);
    return () => {
      revokeControlSurface('__rendererDiagnostics');
    };
  }, [atlasTexture, blueprint, stageName, applyRendererFits, bandScale, gl, logBind, scheduleRuntimeSampling]);

  // keep resolution/DPR updated
  useEffect(() => {
    const u = materialRef.current?.uniforms;
    if (!u) return;
    const { width, height } = size || {};
    if (u.uResolution && width && height) u.uResolution.value.set(width, height);
    if (u.uDevicePixelRatio && typeof gl?.getPixelRatio === 'function') {
      const d = Math.min(gl.getPixelRatio(), 1.5);
      if (u.uDevicePixelRatio.value !== d) u.uDevicePixelRatio.value = d;
    }
    materialRef.current.uniformsNeedUpdate = true;
  }, [size, gl]);

  // per-frame uniforms (passive)
  useFrame((state, delta) => {
    const mat = materialRef.current;
    if (!meshRef.current || !mat || !geometryRef.current) return;
    const sp = clamp01(Number(scrollProgress) || 0);
    if (timeTickEnabledRef.current && mat.uniforms.uTime) {
      mat.uniforms.uTime.value = state.clock.elapsedTime;
    }
    mat.uniforms.uScrollProgress.value = sp;
    mat.uniforms.uStageBlend.value     = (stageName === 'genesis') ? 0 : sp;
    mat.uniforms.uActiveCount.value    = activeCount;
    mat.uniforms.uTierCutoff.value     = activeCount;

    const deltaSeconds = Number.isFinite(delta) ? delta : state.clock.getDelta();
    if (meshRef.current && spinRef.current) {
      if (spinRef.current.active) {
        const { velocity, endTime } = spinRef.current;
        meshRef.current.rotation.z += (velocity.z || 0) * deltaSeconds;
        meshRef.current.rotation.y += (velocity.y || 0) * deltaSeconds;
        const now = typeof performance !== 'undefined' && performance.now
          ? performance.now()
          : Date.now();
        if (endTime && now >= endTime) {
          spinRef.current.active = false;
          spinRef.current.velocity = { y: 0, z: 0 };
        }
      } else {
        meshRef.current.rotation.z *= 0.92;
        meshRef.current.rotation.y *= 0.92;
      }
    }
    const needsFrame =
      timeTickEnabledRef.current ||
      Boolean(spinRef.current?.active) ||
      emergencePendingRef.current ||
      !emittedEmergedRef.current;

    if (needsFrame && typeof state.invalidate === 'function') {
      state.invalidate();
    }
  });


  useEffect(() => {
    if (!BeatBus?.on) return () => {};
    const handler = (payload = {}) => {
      const spin = payload?.rendererSpin;
      const duration = Number(payload?.duration) || 0;
      if (spin && (spin.z || spin.y)) {
        const velocity = {
          z: Number(spin.z) || 0,
          y: Number(spin.y) || 0,
        };
        const endTime = duration > 0 && typeof performance !== 'undefined' && performance.now
          ? performance.now() + duration
          : 0;
        spinRef.current = {
          active: true,
          velocity,
          endTime,
        };
      } else {
        spinRef.current = {
          active: false,
          velocity: { y: 0, z: 0 },
          endTime: 0,
        };
      }
    };
    const off = BeatBus.on(EVENTS.PARTICLE_PHASE, handler);
    return () => off?.();
  }, []);

  // Persist particle effect diagnostics when renderer active
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__particleEffectState = particleEffectStateRef.current;
    }
    return () => {
      if (typeof window !== 'undefined' && window.__particleEffectState === particleEffectStateRef.current) {
        delete window.__particleEffectState;
      }
    };
  }, []);


  // early-out fallback if not ready
  if (!atlasTexture || !blueprint || !materialRef.current || !geometryRef.current) {
    return (
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={new Float32Array([0,0,0])} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={8} />
      </points>
    );
  }

  return (
    <points
      ref={meshRef}
      geometry={geometryRef.current}
      material={materialRef.current}
      frustumCulled={false}
      scale={[1, 1, 1]}
    />
  );
}

export default React.memo(WebGLBackground);

// Diagnostic analysis (dev only)
if (typeof window !== 'undefined') {
  window.analyzeDiagnostic = function analyzeDiagnostic() {
    const data = window.RAYCAST_DIAGNOSTIC?.lastTest;
    if (!data) {
      console.error('No diagnostic data. Click particles first.');
      return;
    }

    console.log('==== RAYCASTING DIAGNOSTIC ANALYSIS ====\n');

    const camPos = data.camera?.position || { x: 0, y: 0, z: 0 };
    const particlePos = data.mesh?.geometry?.firstParticle || { x: 0, y: 0, z: 0 };
    const distToParticles = Math.sqrt(
      Math.pow(camPos.x - particlePos.x, 2) +
        Math.pow(camPos.y - particlePos.y, 2) +
        Math.pow(camPos.z - particlePos.z, 2)
    );

    console.log('THEORY 1: Threshold Too Small');
    console.log(`  Camera distance to particles: ${distToParticles.toFixed(2)} units`);
    console.log(`  Current threshold: ${data.raycaster.threshold}`);
    const recommendedThreshold = Math.max(0.5, distToParticles * 0.05);
    console.log(`  Recommended threshold: ${recommendedThreshold.toFixed(2)}`);
    console.log(
      `  LIKELY: ${distToParticles > 20 ? 'YES - camera very far' : 'NO - distance reasonable'}\n`
    );

    const meshPos = data.mesh?.position || { x: 0, y: 0, z: 0 };
    const meshScale = data.mesh?.scale || { x: 1, y: 1, z: 1 };
    const meshRot = data.mesh?.rotation || { x: 0, y: 0, z: 0 };
    const isIdentityTransform =
      Math.abs(meshPos.x) < 0.01 &&
      Math.abs(meshPos.y) < 0.01 &&
      Math.abs(meshPos.z) < 0.01 &&
      Math.abs(meshScale.x - 1) < 0.01 &&
      Math.abs(meshScale.y - 1) < 0.01 &&
      Math.abs(meshScale.z - 1) < 0.01 &&
      Math.abs(meshRot.x) < 0.01 &&
      Math.abs(meshRot.y) < 0.01 &&
      Math.abs(meshRot.z) < 0.01;

    console.log('THEORY 2: Mesh Transform Issue');
    console.log(
      `  Mesh position: (${meshPos.x.toFixed(3)}, ${meshPos.y.toFixed(3)}, ${meshPos.z.toFixed(3)})`
    );
    console.log(
      `  Mesh scale: (${meshScale.x.toFixed(3)}, ${meshScale.y.toFixed(3)}, ${meshScale.z.toFixed(
        3
      )})`
    );
    console.log(
      `  Mesh rotation: (${meshRot.x.toFixed(3)}, ${meshRot.y.toFixed(3)}, ${meshRot.z.toFixed(
        3
      )})`
    );
    console.log(`  Is identity transform: ${isIdentityTransform ? 'YES' : 'NO'}`);
    console.log(`  Matrix needs update: ${data.mesh?.matrixWorldNeedsUpdate}\n`);

    const particleZ = particlePos?.z ?? 0;
    const withinFrustum =
      data.camera && particleZ > -data.camera.far && particleZ < -data.camera.near;

    console.log('THEORY 3: Particles Outside Camera Frustum');
    console.log(`  Camera near: ${data.camera?.near}`);
    console.log(`  Camera far: ${data.camera?.far}`);
    console.log(`  First particle Z: ${particleZ.toFixed(2)}`);
    console.log(`  Within frustum: ${withinFrustum ? 'YES' : 'NO'}\n`);

    const boundingSphere = data.mesh?.geometry?.boundingSphere;
    console.log('THEORY 4: Bounding Sphere Missing/Wrong');
    console.log(`  Has bounding sphere: ${boundingSphere ? 'YES' : 'NO'}`);
    if (boundingSphere) {
      console.log(
        `  Center: (${boundingSphere.centerX.toFixed(2)}, ${boundingSphere.centerY.toFixed(
          2
        )}, ${boundingSphere.centerZ.toFixed(2)})`
      );
      console.log(`  Radius: ${boundingSphere.radius.toFixed(2)}`);
      console.log(`  Matches particle spread: ${boundingSphere.radius > 1 ? 'YES' : 'NO'}`);
    }
    console.log('');

    console.log('THEORY 5: Matrix World Not Updated');
    console.log(`  Camera matrix needs update: ${data.camera?.matrixWorldNeedsUpdate}`);
    console.log(`  Mesh matrix needs update: ${data.mesh?.matrixWorldNeedsUpdate}\n`);

    console.log('==== RECOMMENDATIONS ====\n');
    const fixes = [];

    if (distToParticles > 20) {
      fixes.push({
        priority: 'HIGH',
        issue: 'Camera far from particle cluster',
        fix: `particleRaycaster.setThreshold(${recommendedThreshold.toFixed(2)});`,
      });
    }

    if (!isIdentityTransform) {
      fixes.push({
        priority: 'CRITICAL',
        issue: 'Mesh has non-identity transform',
        fix: 'Call mesh.updateMatrixWorld() before raycasting or reset transforms',
      });
    }

    if (!withinFrustum) {
      fixes.push({
        priority: 'CRITICAL',
        issue: 'Particles outside camera frustum',
        fix: 'Adjust camera near/far or particle positions',
      });
    }

    if (!boundingSphere) {
      fixes.push({
        priority: 'HIGH',
        issue: 'Geometry missing bounding sphere',
        fix: 'Call geometry.computeBoundingSphere() before rendering',
      });
    }

    if (data.mesh?.matrixWorldNeedsUpdate) {
      fixes.push({
        priority: 'HIGH',
        issue: 'Mesh matrixWorld stale',
        fix: 'mesh.updateMatrixWorld() before raycasting',
      });
    }

    if (fixes.length === 0) {
      console.log('❓ No obvious issues detected. Possible causes:');
      console.log('   - Particle buffer format incompatible with Raycaster');
      console.log('   - Scene/camera mismatch in React Three Fiber');
      console.log('   - Coordinate conversion issue upstream');
    } else {
      fixes.forEach((fix, index) => {
        console.log(`${index + 1}. [${fix.priority}] ${fix.issue}`);
        console.log(`   Fix: ${fix.fix}\n`);
      });
    }

    console.log('==== FULL DATA AVAILABLE ====');
    console.log('Inspect window.RAYCAST_DIAGNOSTIC.lastTest for raw values.');

    return fixes;
  };

  console.log('🧪 Diagnostic analysis ready');
  console.log('   1. Click particles once');
  console.log('   2. Run: window.analyzeDiagnostic()');
}

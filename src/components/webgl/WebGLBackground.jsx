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

const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));
const MORPH_TYPE_ENUM = Object.freeze({
  steady: 0,
  dissolve: 1,
  reform: 2,
});

const morphTypeToInt = (value) => {
  if (Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(MORPH_TYPE_ENUM, normalized)) {
      return MORPH_TYPE_ENUM[normalized];
    }
  }
  return MORPH_TYPE_ENUM.steady;
};
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

const directiveBridgeState = { handler: null };

(() => {
  try {
    const sym = '__RENDER_DIRECTIVE_BRIDGE__';
    if (typeof globalThis !== 'undefined') {
      if (globalThis[sym]) {
        return;
      }
      globalThis[sym] = true;
    }
    if (typeof BeatBus?.on === 'function') {
      BeatBus.on(EVENTS.RENDER_DIRECTIVE, (payload) => {
        try {
          directiveBridgeState.handler?.(payload);
        } catch (error) {
          console.error('🎯 Renderer bridge handler error', error);
        }
      });
      console.log('🪢 RENDER_DIRECTIVE bridge subscribed (module scope)');
    } else {
      console.warn('🪢 BeatBus.on not available at module scope');
    }
  } catch (error) {
    console.error('🪢 Failed to init render directive bridge', error);
  }
})();

const clampFit = (v) => Math.min(5.0, Math.max(0.2, v));

function mapBehaviorToMode(behavior) {
  if (!behavior) return { mode: 0, params: [0.4, 0.8, 1.2, 0.0] };
  const b = String(behavior).toLowerCase();
  if (b.includes('drift') || b.includes('perlin')) {
    return { mode: 0, params: [0.4, 0.8, 1.2, 0.0] };
  }
  if (b.includes('grid')) {
    return { mode: 1, params: [0.15, 0.02, 0.0, 0.0] };
  }
  if (b.includes('flow') || b.includes('laminar')) {
    return { mode: 2, params: [0.6, 0.3, 0.7, 0.0] };
  }
  if (b.includes('streak') || b.includes('trail')) {
    return { mode: 3, params: [1.2, 0.3, 0.0, 0.0] };
  }
  if (b.includes('orbit') || b.includes('arm')) {
    return { mode: 4, params: [0.9, 0.6, 0.2, 0.0] };
  }
  return { mode: 0, params: [0.4, 0.8, 1.2, 0.0] };
}

const hexToRGBArray = (value) => {
  if (!value) return [1, 1, 1];
  if (Array.isArray(value) && value.length >= 3) {
    return [Number(value[0]) || 0, Number(value[1]) || 0, Number(value[2]) || 0].map((c) => Math.max(0, Math.min(1, c)));
  }
  if (typeof value === 'object' && value !== null && 'r' in value && 'g' in value && 'b' in value) {
    return [value.r, value.g, value.b];
  }
  const normalized = String(value).replace('#', '').padEnd(6, '0');
  const r = parseInt(normalized.substring(0, 2), 16) / 255;
  const g = parseInt(normalized.substring(2, 4), 16) / 255;
  const b = parseInt(normalized.substring(4, 6), 16) / 255;
  return [r, g, b];
};

function computeAABB(geo, key) {
  const attr = geo?.attributes?.[key];
  if (!attr?.array) return null;
  const arr = attr.array;
  if (!arr.length) return null;
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
  return { extX: (maxX - minX) * 0.5, extY: (maxY - minY) * 0.5 };
}

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
  // QR state / restore slots
  const qrModeRef = useRef(false);
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

  const applyMetadataColors = (colors) => {
    const fallback = (Array.isArray(VC?.GENESIS_PALETTE) && VC.GENESIS_PALETTE.length >= 3)
      ? VC.GENESIS_PALETTE.slice(0, 3)
      : null;
    const palette = (Array.isArray(colors) && colors.length >= 3) ? colors : fallback;
    if (!palette) return;
    const mat = materialRef.current;
    const u = mat?.uniforms;
    if (!u) return;
    const assign = (uniform, value) => {
      if (!uniform) return;
      const target = uniform.value ?? uniform;
      if (Array.isArray(value) && value.length >= 3 && value.every((v) => typeof v === 'number')) {
        if (target?.setRGB) {
          target.setRGB(value[0], value[1], value[2]);
          return;
        }
      }
      if (target?.set) target.set(value);
      else uniform.value = value;
    };
    assign(u.uColorCurrent, palette[0]);
    assign(u.uColorNext, palette[1] ?? palette[0]);
    assign(u.uColorAccent1, palette[2] ?? palette[0]);
    if (u.uPalette0?.value?.set) { u.uPalette0.value.set(hexToRGBArray(palette[0])); u.uPalette0.needsUpdate = true; }
    if (u.uPalette1?.value?.set) { u.uPalette1.value.set(hexToRGBArray(palette[1] ?? palette[0])); u.uPalette1.needsUpdate = true; }
    if (u.uPalette2?.value?.set) { u.uPalette2.value.set(hexToRGBArray(palette[2] ?? palette[0])); u.uPalette2.needsUpdate = true; }
    if (u.uPalette3?.value?.set) { u.uPalette3.value.set(hexToRGBArray(palette[3] ?? palette[0])); u.uPalette3.needsUpdate = true; }
    mat.uniformsNeedUpdate = true;
  };

  // Passive fallbacks (OK to keep)
  useEffect(() => {
    const off = BeatBus?.on?.(EVENTS.MORPH_PROGRESS, (p) => {
      const v = clamp01(p?.value);
      fallbackMorphRef.current = v;
      __applyMorph(v);
    });
    return () => off && off();
  }, []);
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

      BeatBus.emit?.(EVENTS.PARTICLE_CLICK_HIT, {
        particleIndex,
        distance: hit.distance,
        point: hit.point,
        hotspot: matchedHotspot,
        timestamp: performance.now(),
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
      setStageName(isEmergence ? 'genesis' : (raw.stageName || st || 'genesis'));
      setActiveCount(raw.activeCount || raw.particleCount || raw.maxParticles || 0);
      applyMetadataColors(raw?.metadata?.colors);

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

      if (geometryRef.current) geometryRef.current.dispose();
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position',            new THREE.BufferAttribute(raw.atmosphericPositions, 3));
      geo.setAttribute('atmosphericPosition', new THREE.BufferAttribute(raw.atmosphericPositions, 3));
      geo.setAttribute('text3DPosition',      new THREE.BufferAttribute(raw.text3DPositions, 3));
      if (raw.animationSeeds)  geo.setAttribute('animationSeed',  new THREE.BufferAttribute(raw.animationSeeds, 3));
      if (raw.sizeMultipliers) geo.setAttribute('sizeMultiplier', new THREE.BufferAttribute(raw.sizeMultipliers, 1));
      if (raw.opacityData)     geo.setAttribute('opacityData',    new THREE.BufferAttribute(raw.opacityData, 1));
      if (raw.atlasIndices)    geo.setAttribute('atlasIndex',     new THREE.BufferAttribute(raw.atlasIndices, 1));
      if (raw.tierData)        geo.setAttribute('tierData',       new THREE.BufferAttribute(raw.tierData, 1));
      const idx = new Float32Array((raw.activeCount || raw.particleCount || 0) || (raw.atmosphericPositions.length / 3));
      for (let i = 0; i < idx.length; i++) idx[i] = i;
      geo.setAttribute('particleIndex', new THREE.BufferAttribute(idx, 1));
      geo.setDrawRange(0, raw.activeCount || raw.particleCount);
      geometryRef.current = geo;
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
          mat.uniforms.uMorphProgress.value = 0;
          if (mat.uniforms.uStageProgress) mat.uniforms.uStageProgress.value = 0;
          mat.uniformsNeedUpdate = true;
        }
        ignoreDirectivesRef.current = false;
      }

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
        console.log(`✅ Renderer: ${cached ? 'cached' : 'new'} BR(full)`, `stage=${raw.stageName || st}`, `count=${raw.particleCount || raw.activeCount}`, `quality=${quality}`);

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
          };
          queueFencepost(payload);
          emittedEmergedRef.current = true;
          emergencePendingRef.current = false;
          console.log('EMERGED once');
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
      if (qrModeRef.current) {
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
      if (!isEmergenceMode && matCurrent?.uniforms?.uMorphProgress) {
        matCurrent.uniforms.uMorphProgress.value = 0.0;
        if (matCurrent.uniforms.uStageProgress) {
          matCurrent.uniforms.uStageProgress.value = 0.0;
        }
        matCurrent.uniformsNeedUpdate = true;

        const startTime = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
        const duration = 1500;
        const raf = typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
          ? window.requestAnimationFrame
          : (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null);
        if (!raf) return;
        const step = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / duration);
          if (matCurrent.uniforms.uMorphProgress) {
            matCurrent.uniforms.uMorphProgress.value = progress;
          }
          if (matCurrent.uniforms.uStageProgress) {
            matCurrent.uniforms.uStageProgress.value = progress;
          }
          matCurrent.uniformsNeedUpdate = true;
          if (progress < 1) {
            raf(step);
          }
        };
        raf(step);
      }
    };

    const off = BeatBus?.on?.(EVENTS.BLUEPRINT_READY, handleBlueprint);
    return () => off && off();
  }, [updateBandHeight, logBind, scheduleRuntimeSampling, clearPendingFencepost, queueFencepost, finalizeEmergence]);

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
  });

  const frameCountRef = useRef(0);

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

  // RENDER_DIRECTIVE sink (apply data-only; renderer owns all GPU writes)
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

  useEffect(() => {
    frameCountRef.current = 0;
    const handler = (payload = {}) => {
      const directive = payload?.directive || payload || {};
      const ts =
        typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now().toFixed(0)
          : Date.now();
      console.log('📥 RENDERER HANDLER CALLED:', {
        timestamp: ts,
        hasMorphProgress: typeof directive?.morphProgress === 'number',
        morphValue: directive?.morphProgress,
      });

      if (ignoreDirectivesRef.current) {
        if (DEV) console.debug('[WBG] ignoring directive post-fencepost', directive?.morphProgress);
        return;
      }
      const mat = materialRef.current;
      const geo = geometryRef.current;
      if (!mat?.uniforms || !geo) return;

      if (typeof window !== 'undefined') {
        window.__lastDirective = directive;
      }

      const uniforms = mat.uniforms;

      const currentStage = stageNameRef.current;

      trace('DIR', {
        source: 'WBG:APPLIED',
        morph: Number.isFinite(directive.morphProgress) ? clamp01(directive.morphProgress) : null,
        draw: Number.isFinite(directive.drawCount) ? directive.drawCount : null,
        active: Number.isFinite(directive.activeCount) ? directive.activeCount : null,
      });

      // ----- QR ENTER -----
      if (directive?.enterQrMode) {
        qrModeRef.current = true;
        if (gl) {
          const prev = gl.getClearColor(new THREE.Color());
          const prevAlpha = typeof gl.getClearAlpha === 'function' ? gl.getClearAlpha() : 1;
          restoreClearRef.current = [prev.r, prev.g, prev.b, prevAlpha];
          gl.setClearColor(0xffffff, 1);
        }
        if (uniforms.uPostMorphFreeze) {
          uniforms.uPostMorphFreeze.value = 1;
          uniforms.uPostMorphFreeze.needsUpdate = true;
        }
        if (uniforms.uSpreadFactor) {
          uniforms.uSpreadFactor.value = 0;
          uniforms.uSpreadFactor.needsUpdate = true;
        }
        if (uniforms.uTierMode && uniforms.uTierMode.value) {
          const arr = uniforms.uTierMode.value;
          for (let i = 0; i < arr.length; i += 1) arr[i] = 0;
          uniforms.uTierMode.needsUpdate = true;
        }
        if (uniforms.uPointSize) {
          const currentPointSize = uniforms.uPointSize.value;
          lastPointSizeRef.current = typeof currentPointSize === 'number'
            ? currentPointSize
            : Number(currentPointSize ?? 0);
          uniforms.uPointSize.value = directive.uPointSize || 2.6;
          uniforms.uPointSize.needsUpdate = true;
        }
        timeTickEnabledRef.current = false;
        mat.uniformsNeedUpdate = true;
        return;
      }

      // ----- QR EXIT -----
      if (directive?.exitQrMode) {
        qrModeRef.current = false;
        if (uniforms.uPostMorphFreeze) {
          uniforms.uPostMorphFreeze.value = 0;
          uniforms.uPostMorphFreeze.needsUpdate = true;
        }
        if (uniforms.uPointSize && lastPointSizeRef.current != null) {
          uniforms.uPointSize.value = lastPointSizeRef.current;
          uniforms.uPointSize.needsUpdate = true;
          lastPointSizeRef.current = null;
        }
        if (gl && restoreClearRef.current) {
          const [r0, g0, b0, a0] = restoreClearRef.current;
          gl.setClearColor(new THREE.Color(r0, g0, b0), a0);
        }
        timeTickEnabledRef.current = true;
        mat.uniformsNeedUpdate = true;
        return;
      }

      if (directive.kind === 'particle-effect') {
        const effect = directive.effect || {};
        console.log('[Renderer] 🎨 Particle effect:', {
          verb: directive.verb,
          stage: directive.stage || currentStage,
          keys: Object.keys(effect),
        });

        if (typeof window !== 'undefined') {
          window.__particleEffectState = { effect, directive, timestamp: performance.now() };
        }

        if (Number.isFinite(effect.spreadFactor) && uniforms.uSpreadFactor) {
          uniforms.uSpreadFactor.value = Number(effect.spreadFactor);
        }

        const applyTierArray = (uniformName, values) => {
          const target = uniforms[uniformName];
          if (!target || !Array.isArray(values)) return;
          const baseLength = Array.isArray(target.value) || target.value instanceof Float32Array
            ? target.value.length
            : values.length;
          const next = new Float32Array(baseLength);
          next.set(values.slice(0, baseLength).map((v) => Number(v) || 0));
          target.value = next;
          target.needsUpdate = true;
        };

        if (Array.isArray(effect.tierModes)) {
          applyTierArray('uTierMode', effect.tierModes);
        }

        if (Array.isArray(effect.tierParams)) {
          const sets = effect.tierParams;
          [['uTierParams0', 0], ['uTierParams1', 1], ['uTierParams2', 2], ['uTierParams3', 3]].forEach(([name, idx]) => {
            if (Array.isArray(sets[idx])) applyTierArray(name, sets[idx]);
          });
        }

        if (effect.tierHighlight !== undefined && uniforms.uTierHighlight) {
          uniforms.uTierHighlight.value = Number(effect.tierHighlight);
        }

        if (effect.gridSize !== undefined && uniforms.uGridSpacing) {
          const val = effect.gridSize;
          const next = Array.isArray(val)
            ? new Float32Array([Number(val[0]) || 0.35, Number(val[1]) || 0.35])
            : new Float32Array([Number(val) || 0.35, Number(val) || 0.35]);
          uniforms.uGridSpacing.value = next;
          uniforms.uGridSpacing.needsUpdate = true;
        }

        if (Number.isFinite(effect.uFlowTurbulence) && uniforms.uFlowTurbulence) {
          uniforms.uFlowTurbulence.value = Number(effect.uFlowTurbulence);
          uniforms.uFlowTurbulence.needsUpdate = true;
        }

        if (Number.isFinite(effect.uStreakIntensity) && uniforms.uStreakIntensity) {
          uniforms.uStreakIntensity.value = Number(effect.uStreakIntensity);
          uniforms.uStreakIntensity.needsUpdate = true;
        }

        if (Number.isFinite(effect.uSpreadFactor) && uniforms.uSpreadFactor) {
          uniforms.uSpreadFactor.value = Number(effect.uSpreadFactor);
          uniforms.uSpreadFactor.needsUpdate = true;
        }

        if (Array.isArray(effect.uMotionParams) && uniforms.uMotionParams) {
          const arr = uniforms.uMotionParams.value;
          const src = effect.uMotionParams;
          for (let i = 0; i < Math.min(arr.length || 0, src.length); i += 1) {
            arr[i] = Number(src[i]) || 0;
          }
          uniforms.uMotionParams.needsUpdate = true;
        }

        if (Array.isArray(effect.paletteOverride)) {
          const pal = effect.paletteOverride;
          const assign = (uniformName, idx, fallbackIdx = 0) => {
            const uniform = uniforms[uniformName];
            if (!uniform) return;
            const rgb = hexToRGBArray(pal[idx] || pal[fallbackIdx] || pal[pal.length - 1]);
            uniform.value.set(rgb);
            uniform.needsUpdate = true;
          };
          assign('uPalette0', 0);
          assign('uPalette1', 1, 0);
          assign('uPalette2', 2, 1);
          assign('uPalette3', 3, 0);
        }

        mat.uniformsNeedUpdate = true;
      }

      if (directive.kind === 'camera-effect' && directive.effect) {
        console.log('[Renderer] 🎥 Camera effect received (Phase 3 placeholder):', directive.verb);
      }
      if (Number.isFinite(directive?.morphProgress)) {
        frameCountRef.current += 1;
        if (frameCountRef.current <= 60) {
          console.log(
            `🎨 Renderer frame #${frameCountRef.current}: morphProgress=${(directive.morphProgress * 100).toFixed(1)}%`
          );
        } else if (frameCountRef.current % 60 === 0) {
          console.log(`🎨 Renderer: ${frameCountRef.current} total frames received`);
        }
        console.log(`🎨 Renderer received morphProgress: ${(directive.morphProgress * 100).toFixed(0)}%`);
      }

      if (DEV) renderGuardRef.current = true;
      try {
        // Draw range (single writer)
        let drawUpdated = false;
        if (Number.isFinite(directive.activeCount)) {
          const count = Math.max(0, Math.floor(directive.activeCount));
          setActiveCount(count);
          geo.setDrawRange(0, count);
          if (uniforms.uActiveCount) uniforms.uActiveCount.value = count;
          if (uniforms.uTierCutoff)  uniforms.uTierCutoff.value  = count;
          if (typeof window !== 'undefined') window.__lastActiveCount = count;
          drawUpdated = true;
        }

        if (!drawUpdated && Number.isFinite(directive.drawCount)) {
          const count = Math.max(0, Math.floor(directive.drawCount));
          geo.setDrawRange(0, count);
          if (typeof window !== 'undefined') window.__lastActiveCount = count;
        }

        // Morph progress + fencepost emission
        if (Number.isFinite(directive?.morphProgress) && uniforms.uMorphProgress) {
          const oldValue = Number(uniforms.uMorphProgress.value) || 0;
          const newValue = clamp01(directive.morphProgress);
          uniforms.uMorphProgress.value = newValue;
          if (uniforms.uStageProgress) uniforms.uStageProgress.value = newValue;
          if (Math.abs(newValue - oldValue) > 0.001) {
            console.log(
              `✅ uMorphProgress updated: ${(oldValue * 100).toFixed(1)}% → ${(newValue * 100).toFixed(1)}%`
            );
          }

          if (emergencePendingRef.current && !emittedEmergedRef.current && newValue >= 0.995) {
            emittedEmergedRef.current = true;
            emergencePendingRef.current = false;
            const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            ignoreDirectivesRef.current = true;            if (uniforms.uPostMorphFreeze && uniforms.uPostMorphFreeze.value !== 1.0) {
              uniforms.uPostMorphFreeze.value = 1.0;
              mat.uniformsNeedUpdate = true;
              trace('WBG:FREEZE', { value: 1, source: 'directive' });
            }
            const payload = {
              at: now,
              source: 'renderer-directive',
              stage: currentStage,
              morph: newValue,
            };
            queueFencepost(payload);
          }
        } else if (Number.isFinite(directive?.morphProgress) && !uniforms.uMorphProgress) {
          console.warn('⚠️ uMorphProgress uniform not found on material!');
        }

      if (Number.isFinite(directive?.pointSize) && uniforms.uPointSize) {
          uniforms.uPointSize.value = directive.pointSize;
        }
        if (Number.isFinite(directive?.gaussianSigma) && uniforms.uGaussianSigma) {
          uniforms.uGaussianSigma.value = directive.gaussianSigma;
        }
        if (Number.isFinite(directive?.spreadFactor) && uniforms.uSpreadFactor) {
          uniforms.uSpreadFactor.value = directive.spreadFactor;
        }
        if (directive?.morphType !== undefined && directive?.morphType !== null && uniforms.uMorphType) {
          uniforms.uMorphType.value = morphTypeToInt(directive.morphType);
        }
        if (directive?.postMorphFreeze !== undefined && uniforms.uPostMorphFreeze) {
          uniforms.uPostMorphFreeze.value = directive.postMorphFreeze ? 1.0 : 0.0;
          mat.uniformsNeedUpdate = true;
        }
        if (Number.isFinite(directive?.uMotionMode) && uniforms.uTierMode) {
          const m = directive.uMotionMode | 0;
          uniforms.uTierMode.value = new Float32Array([m, m, m, m]);
          uniforms.uTierMode.needsUpdate = true;
          if (m === 1 && uniforms.uGridSpacing) {
            const sx = Number.isFinite(directive?.gridX) ? Number(directive.gridX) : 0.35;
            const sy = Number.isFinite(directive?.gridY) ? Number(directive.gridY) : 0.35;
            uniforms.uGridSpacing.value = new Float32Array([sx, sy]);
            uniforms.uGridSpacing.needsUpdate = true;
          }
        }
        if (directive?.tierHighlight !== undefined && uniforms.uTierHighlight) {
          const highlightValue = Array.isArray(directive.tierHighlight)
            ? Number(directive.tierHighlight[0])
            : Number(directive.tierHighlight);
          uniforms.uTierHighlight.value = Number.isFinite(highlightValue) ? highlightValue : -1;
        }
        if (directive?.uniforms && typeof directive.uniforms === 'object') {
          for (const key in directive.uniforms) {
            if (Object.hasOwn(directive.uniforms, key) && uniforms[key]) {
              uniforms[key].value = directive.uniforms[key];
            }
          }
        }

        mat.uniformsNeedUpdate = true;
      } finally {
        if (DEV) renderGuardRef.current = false;
      }
    };

    const unsubscribe = BeatBus?.on?.(EVENTS.RENDER_DIRECTIVE, handler);
    console.log('🔌 Renderer subscribed to:', EVENTS.RENDER_DIRECTIVE);
    console.log('🔌 Event string value:', String(EVENTS.RENDER_DIRECTIVE));
    console.log('🔌 Unsubscribe function exists:', typeof unsubscribe === 'function');    console.log('✅ RENDER_DIRECTIVE subscription established (persistent)');
    if (typeof window !== 'undefined') {
      window._rendererSubscriptionCheck = () => {
        console.log('🔍 Subscription check:', {
          handlerStillExists: typeof handler === 'function',
          BeatBusExists: typeof BeatBus !== 'undefined',        });
      };
    }
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

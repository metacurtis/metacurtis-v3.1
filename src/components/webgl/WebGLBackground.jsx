// src/components/webgl/WebGLBackground.jsx
// HOT-DORS passive renderer: projection-matrix viewport hint + single directive sink
// Single writer: binds geometry/material, emits PARTICLES_EMERGED exactly once (on first FULL bind)

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
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
  computeAABB,
} from './utils/backgroundMath.js';
import { applyRendererFits, createViewportHintEmitter } from './setup/viewportFitters.js';
import {
  createRendererMaterial,
  updateMaterialFromConfig,
  disposeMaterial,
} from './setup/createRendererMaterial.js';
import {
  createBlueprintBinder,
  createBlueprintReadyHandler,
} from './managers/BlueprintBinder.js';
import { createRendererState } from './managers/RendererState.js';
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

  const applyRendererFitsToViewport = useCallback(
    (geo, viewport) => {
      applyRendererFits({
        geometry: geo,
        viewport,
        material: materialRef.current,
        viewportHintRef,
        windowSize: size,
        lastUniformsRef,
        lastFitStampRef,
        fitsLockedRef,
        vcConfig: VC,
        clampFit,
        computeAABB,
        vec2Close,
        dev: DEV,
      });
    },
    [size.width, size.height]
  );

  const getViewportLogMeta = useCallback(
    () => ({
      stage: stageNameRef.current,
      cached: !!blueprintRef.current,
    }),
    []
  );

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

  const rendererState = useMemo(() => {
    if (!gl) return null;
    return createRendererState({
      renderer: gl,
      onLog: DEV ? (msg, data) => console.log(msg, data) : undefined,
    });
  }, [gl]);

  const blueprintBinder = useMemo(
    () =>
      createBlueprintBinder({
        refs: {
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
        },
        state: {
          setBlueprint,
          setStageName,
          setActiveCount,
        },
        services: {
          applyRendererFitsToViewport,
          updateBandHeight,
          logBind,
          scheduleRuntimeSampling,
          clearPendingFencepost,
          emitFencepostNow,
          finalizeEmergence,
          rendererState,
        },
        config: {
          Canonical,
          VC,
        },
        context: {
          trace,
          dev: DEV,
        },
        beatBus: BeatBus,
        events: EVENTS,
        normalizePayload,
      }),
    [
      applyRendererFitsToViewport,
      clearPendingFencepost,
      emitFencepostNow,
      finalizeEmergence,
      logBind,
      scheduleRuntimeSampling,
      updateBandHeight,
      rendererState,
      Canonical,
      VC,
      BeatBus,
      normalizePayload,
      trace,
    ],
  );

  useEffect(() => {
    if (!blueprintBinder) {
      return () => {};
    }

    return () => {
      blueprintBinder.dispose?.();
      disposeMaterial(materialRef.current);
      materialRef.current = null;
    };
  }, [blueprintBinder]);

  // Point size (once) — raw base only; shader multiplies by uDevicePixelRatio
  useEffect(() => {
    const u = materialRef.current?.uniforms;
    if (!u?.uPointSize) return;
    const base = Canonical?.features?.pointSizeDefault ?? 48.0;
    u.uPointSize.value = base;
  }, []);

  const emitViewportHint = useCallback(
    createViewportHintEmitter({
      camera,
      gl,
      size,
      viewportHintRef,
      updateBandHeight,
      geometryRef,
      logBind,
      scheduleRuntimeSampling,
      applyRendererFits: applyRendererFitsToViewport,
      beatBus: BeatBus,
      eventName: EVENTS.ENGINE_VIEWPORT_HINT,
      getViewportLogMeta,
      dev: DEV,
    }),
    [
      camera,
      gl,
      size.width,
      size.height,
      updateBandHeight,
      logBind,
      scheduleRuntimeSampling,
      applyRendererFitsToViewport,
      getViewportLogMeta,
    ]
  );

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

  useEffect(() => {
    if (typeof BeatBus?.on !== 'function') {
      return () => {};
    }
    const handler = createBlueprintReadyHandler(
      blueprintBinder,
      (bp) => {
        if (!DEV) return;
        const stage = bp?.stageName || bp?.stage || 'genesis';
        console.log('[WebGLBackground] Blueprint bound successfully', stage);
      }
    );
    const off = BeatBus.on(EVENTS.BLUEPRINT_READY, handler);
    return () => off?.();
  }, [BeatBus, EVENTS, blueprintBinder]);

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

  // Opening sequence particle phase listener
  useEffect(() => {
    if (!BeatBus?.on || !EVENTS?.PARTICLE_PHASE) return undefined;
    const unsubscribe = BeatBus.on(EVENTS.PARTICLE_PHASE, (payload = {}) => {
      const timestamp = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
      console.log('🌊 [OPENING PHASE]', {
        phase: payload?.phase ?? payload?.name ?? null,
        duration: payload?.duration,
        mode: payload?.mode,
        timestamp,
      });

      if (!blueprintBinder) {
        console.warn('⚠️ [OPENING PHASE] No binder available');
        return;
      }

      const mat = materialRef.current;
      if (!mat?.uniforms) {
        console.warn('⚠️ [OPENING PHASE] Material uniforms not available');
        return;
      }

      const duration = payload?.duration || 2000;
      const uniforms = mat.uniforms;

      const phaseName = payload?.phase ?? payload?.name ?? null;

      switch (phaseName) {
        case 'chaos': {
          console.log('🌪️ [CHAOS] Starting random motion');
          if (uniforms.uTurbulence) {
            uniforms.uTurbulence.value = 0.8;
            console.log('   Set uTurbulence = 0.8');
          }
          if (uniforms.uSpeedMultiplier) {
            uniforms.uSpeedMultiplier.value = 1.5;
            console.log('   Set uSpeedMultiplier = 1.5');
          }
          if (uniforms.uMotionMode) {
            uniforms.uMotionMode.value = 1;
            console.log('   Set uMotionMode = 1 (chaos)');
          }
          if (uniforms.uDriftAmp) {
            uniforms.uDriftAmp.value = 2.0;
            console.log('   Set uDriftAmp = 2.0');
          }
          mat.uniformsNeedUpdate = true;

          if (payload?.rendererSpin) {
            const endTime =
              typeof performance !== 'undefined' && performance.now
                ? performance.now() + duration
                : Date.now() + duration;
            spinRef.current = {
              active: true,
              velocity: {
                z: payload.rendererSpin.z || 0,
                y: payload.rendererSpin.y || 0,
              },
              endTime,
            };
            console.log('   Applied renderer spin:', payload.rendererSpin);
          }
          break;
        }
        case 'coalesce': {
          console.log('🌀 [COALESCE] Forming word');
          if (uniforms.uTurbulence) {
            uniforms.uTurbulence.value = 0.3;
            console.log('   Set uTurbulence = 0.3');
          }
          if (uniforms.uSpeedMultiplier) {
            uniforms.uSpeedMultiplier.value = 1.0;
            console.log('   Set uSpeedMultiplier = 1.0');
          }
          if (uniforms.uMotionMode) {
            uniforms.uMotionMode.value = 2;
            console.log('   Set uMotionMode = 2 (coalesce)');
          }
          if (uniforms.uDriftAmp) {
            uniforms.uDriftAmp.value = 0.8;
            console.log('   Set uDriftAmp = 0.8');
          }
          mat.uniformsNeedUpdate = true;
          break;
        }
        case 'settle': {
          console.log('🎯 [SETTLE] Locking into form');
          if (uniforms.uTurbulence) {
            uniforms.uTurbulence.value = 0.0;
            console.log('   Set uTurbulence = 0.0');
          }
          if (uniforms.uSpeedMultiplier) {
            uniforms.uSpeedMultiplier.value = 0.5;
            console.log('   Set uSpeedMultiplier = 0.5');
          }
          if (uniforms.uMotionMode) {
            uniforms.uMotionMode.value = 3;
            console.log('   Set uMotionMode = 3 (settle)');
          }
          if (uniforms.uDriftAmp) {
            uniforms.uDriftAmp.value = 0.2;
            console.log('   Set uDriftAmp = 0.2');
          }
          if (uniforms.uMorphProgress && uniforms.uMorphProgress.value < 1.0) {
            uniforms.uMorphProgress.value = 1.0;
            console.log('   Set uMorphProgress = 1.0');
          }
          mat.uniformsNeedUpdate = true;
          break;
        }
        default:
          console.warn('❓ [OPENING PHASE] Unknown phase received', payload?.phase);
      }
    });

    console.log('✅ [RENDERER] PARTICLE_PHASE listener registered');

    return () => {
      console.log('🧹 [RENDERER] PARTICLE_PHASE listener cleanup');
      unsubscribe?.();
    };
  }, [blueprintBinder]);

  // build material once atlas+blueprint exist
  useEffect(() => {
    if (!atlasTexture || !blueprint) return;

    const stageIndex = Math.max(0, (Canonical?.stageOrder || []).indexOf(stageName));
    const POINT_SIZE_DEFAULT = Canonical?.features?.pointSizeDefault ?? 48.0;
    const palette = pickStageColors(stageName);
    const blueprintCount = blueprint?.activeCount || blueprint?.particleCount || blueprint?.maxParticles || 0;

    let mat = materialRef.current;
    let created = false;

    const devicePixelRatio = (() => {
      try {
        return Math.min(gl?.getPixelRatio?.() ?? 1, 1.5);
      } catch {
        return 1;
      }
    })();

    if (!mat) {
      created = true;
      mat = createRendererMaterial({
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        canonicalConfig: Canonical,
        atlasTexture,
        stageIndex,
        morphProgress: clamp01(fallbackMorphRef.current),
        stageProgress: clamp01(fallbackMorphRef.current),
        pointSize: POINT_SIZE_DEFAULT,
        blueprintCount,
        devicePixelRatio,
        bandHeight: typeof bandHeightRef.current === 'number'
          ? bandHeightRef.current
          : 0,
        palette,
        totalSprites: 16,
        morphTypeDefault: MORPH_TYPE_ENUM.steady,
        onBeforeCompile: () => {
          try { console.log('🧪 Shader compiled'); }
          catch { /* noop */ }
        },
        onLog: DEV ? (msg, data) => console.log(msg, data) : null,
      });
      materialRef.current = mat;
    }

    updateMaterialFromConfig(mat, Canonical);

    const uniforms = mat.uniforms || {};
    if (!uniforms.uSpreadFactor) uniforms.uSpreadFactor = { value: 1.0 };
    if (!uniforms.uMorphType) uniforms.uMorphType = { value: MORPH_TYPE_ENUM.steady };
    if (uniforms.uAtlasTexture) uniforms.uAtlasTexture.value = atlasTexture;
    if (uniforms.uStageIndex) uniforms.uStageIndex.value = stageIndex;
    if (uniforms.uBrainRegion) uniforms.uBrainRegion.value = stageIndex;
    if (uniforms.uPointSize) uniforms.uPointSize.value = POINT_SIZE_DEFAULT;
    if (uniforms.uDevicePixelRatio) {
      uniforms.uDevicePixelRatio.value = devicePixelRatio;
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
      applyRendererFitsToViewport(geometryRef.current, viewportHintRef.current);
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
  }, [atlasTexture, blueprint, stageName, applyRendererFitsToViewport, bandScale, gl, logBind, scheduleRuntimeSampling]);

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

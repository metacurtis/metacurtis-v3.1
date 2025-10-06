// src/components/webgl/WebGLBackground.jsx
// HOT-DORS passive renderer: projection-matrix viewport hint + single directive sink
// Single writer: binds geometry/material, emits PARTICLES_EMERGED exactly once (on first FULL bind)

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
// Provide global THREE for Canon HUD/watchdog hooks
if (typeof window !== 'undefined' && !window.THREE) window.THREE = THREE;
import { EVENTS } from '@/theater/events.js';
import BeatBus from '@/theater/bus';
import { trace } from '@/dev/trace.js';

import { getPointSpriteAtlasSingleton } from './consciousness/PointSpriteAtlas.js';
import { Canonical } from '../../config/canonical/canonicalAuthority.js';
import { VC } from '@/config/visual-controls.js';

import vertexShaderSource from '../../shaders/templates/consciousness-vertex.glsl?raw';
import fragmentShaderSource from '../../shaders/templates/consciousness-fragment.glsl?raw';

const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));
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
  const quality = payload?.quality || 'HIGH';
  const cached = !!payload?.cached;
  const mode = payload?.mode || bp?.mode;
  return { bp, stageName, quality, cached, mode };
}

const clampFit = (v) => Math.min(5.0, Math.max(0.2, v));

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
  const fitsLockedRef = useRef(false);
  const ignoreDirectivesRef = useRef(false);
  const directiveOffRef = useRef(null);
  const fenceReadyRef = useRef(false);
  const pendingFencepostRef = useRef(false);
  const pendingFenceDataRef = useRef(null);
  const pendingFenceTimeoutRef = useRef(null);

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

  const { size, gl, camera } = useThree();

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.__camera = camera;
    return () => {
      if (window.__camera === camera) {
        window.__camera = null;
      }
    };
  }, [camera]);

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

  // BLUEPRINT_READY → bind buffers & EMERGED fencepost (once) on first FULL genesis
  useEffect(() => {
    const handleBlueprint = (payload) => {
      const { bp: raw, stageName: st, quality, cached, mode } = normalizePayload(payload);
      const id = `${st}-${raw?.count || raw?.particleCount || raw?.activeCount || 0}-${mode || 'default'}`;
      if (!raw?.atmosphericPositions || !raw?.text3DPositions) return;
      if (id === lastBlueprintIdRef.current) return;
      lastBlueprintIdRef.current = id;

      const isEmergence = mode === 'emergence' || raw?.mode === 'emergence';

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
      } else {
        console.log(`✅ Renderer: ${cached ? 'cached' : 'new'} BR(full)`, `stage=${raw.stageName || st}`, `count=${raw.particleCount || raw.activeCount}`, `quality=${quality}`);
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
    };

    const off = BeatBus?.on?.(EVENTS.BLUEPRINT_READY, handleBlueprint);
    return () => off && off();
  }, [updateBandHeight, logBind, scheduleRuntimeSampling, clearPendingFencepost, queueFencepost]);

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
          uTime: { value: 0 },
          uMorphProgress:  { value: clamp01(fallbackMorphRef.current) },
          uScrollProgress: { value: 0 },
          uStageProgress:  { value: clamp01(fallbackMorphRef.current) },
          uStageBlend:     { value: 0 },
          uColorCurrent:   { value: palette.current.clone() },
          uColorNext:      { value: palette.next.clone() },
          uColorAccent1:   { value: palette.acc1.clone() },
          uColorAccent2:   { value: palette.acc2.clone() },
          uAtlasTexture:   { value: atlasTexture },
          uTotalSprites:   { value: 16 },
          uPointSize:      { value: POINT_SIZE_DEFAULT },
          uDevicePixelRatio: { value: (() => {
            try { return Math.min(gl?.getPixelRatio?.() ?? 1, 1.5); } catch { return 1; }
          })() },
          uResolution:     { value: new THREE.Vector2(1, 1) },
          uAtmoFit:        { value: new THREE.Vector2(1, 1) },
          uTextFit:        { value: new THREE.Vector2(1, 1) },
          uMoveDampStart:  { value: 0.96 },
          uMoveDampStartY: { value: 0.9 },
          uPostMorphFreeze: { value: 0.0 },
          uActiveCount:    { value: blueprintCount },
          uTierCutoff:     { value: blueprintCount || 15000 },
          uFadeProgress:   { value: 1.0 },
          uGaussianSigma:  { value: 2.5 },
          uTierHighlight:  { value: new Float32Array([1.0, 1.25, 1.5, 1.75]) },
          uBandHeight:     { value: bandHeightRef.current || 0 },
          uBandFade:       { value: 0 },
          uGaussianFalloff: { value: Canonical?.features?.gaussianFalloff ?? 1.0 },
          uCenterWeighting: { value: Canonical?.features?.centerWeightingTier4 ?? 1.0 },
          uStageIndex:     { value: stageIndex },
          uBrainRegion:    { value: stageIndex },
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
      window.__webglBackground = { material: mat, meshRef, geometryRef };
      window.__consciousnessMaterial = mat;
      window.__particleMaterial = mat;
      window.__particleGeometry = geometryRef.current || null;
    }

    __applyStageTint(stageName);
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
  useFrame((state) => {
    const mat = materialRef.current;
    if (!meshRef.current || !mat || !geometryRef.current) return;
    const sp = clamp01(Number(scrollProgress) || 0);
    mat.uniforms.uTime.value           = state.clock.elapsedTime;
    mat.uniforms.uScrollProgress.value = sp;
    mat.uniforms.uStageBlend.value     = (stageName === 'genesis') ? 0 : sp;
    mat.uniforms.uActiveCount.value    = activeCount;
    mat.uniforms.uTierCutoff.value     = activeCount;
  });

  // RENDER_DIRECTIVE sink (apply data-only; renderer owns all GPU writes)
  useEffect(() => {
    const handler = (directive = {}) => {
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
        if (Number.isFinite(directive.morphProgress) && uniforms.uMorphProgress) {
          const v = clamp01(directive.morphProgress);
          uniforms.uMorphProgress.value = v;
          if (uniforms.uStageProgress) uniforms.uStageProgress.value = v;

          if (emergencePendingRef.current && !emittedEmergedRef.current && v >= 0.995) {
            emittedEmergedRef.current = true;
            emergencePendingRef.current = false;
            const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            ignoreDirectivesRef.current = true;
            if (directiveOffRef.current) {
              directiveOffRef.current();
              directiveOffRef.current = null;
            }
            if (uniforms.uPostMorphFreeze && uniforms.uPostMorphFreeze.value !== 1.0) {
              uniforms.uPostMorphFreeze.value = 1.0;
              mat.uniformsNeedUpdate = true;
              trace('WBG:FREEZE', { value: 1, source: 'directive' });
            }
            const payload = {
              at: now,
              source: 'renderer-directive',
              stage: currentStage,
              morph: v,
            };
            queueFencepost(payload);
          }
        }

        if (Number.isFinite(directive.pointSize) && uniforms.uPointSize) {
          uniforms.uPointSize.value = directive.pointSize;
        }
        if (Number.isFinite(directive.gaussianSigma) && uniforms.uGaussianSigma) {
          uniforms.uGaussianSigma.value = directive.gaussianSigma;
        }
        if (Array.isArray(directive.tierHighlight) && uniforms.uTierHighlight?.value) {
          const arr = uniforms.uTierHighlight.value;
          for (let i = 0; i < Math.min(arr.length, directive.tierHighlight.length); i += 1) {
            arr[i] = directive.tierHighlight[i];
          }
        }
        if (directive.uniforms && typeof directive.uniforms === 'object') {
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

    const off = BeatBus?.on?.(EVENTS.RENDER_DIRECTIVE, handler);
    directiveOffRef.current = off;
    return () => {
      if (directiveOffRef.current) {
        directiveOffRef.current();
        directiveOffRef.current = null;
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

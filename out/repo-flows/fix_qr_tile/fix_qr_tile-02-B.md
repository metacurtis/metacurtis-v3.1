# Agent B – Critic

Flow: fix_qr_tile · Step 02
Generated at: 2025-12-08T03:38:28.144Z

---
## Mission
Stress-test Architect’s spec and prune the change surface to the safest minimal set.

## Invariants
- Do not invent new event types or streams.
- Never add new writers for MORPH_PROGRESS or RENDER_DIRECTIVE.
- Call out competing contracts or multi-writer risks.

## This Step
Role for this step: Critic

Notes for this step: Stress-test spec against Pattern-S: no new events, single-writer rules preserved.

## Task
"Make the Transcendence climax QR tile look like a centered, static, photo-like card, no glow or drift."

## High-Level Context
Task: Make the Transcendence climax QR tile look like a centered, static, photo-like card, no glow or drift.
Flow: fix_qr_tile
Included files:
- src/components/webgl/WebGLBackground.jsx
- src/shaders/templates/consciousness-fragment.glsl
- sst/canon/v3.5.json
- src/config/canonical/canonicalAuthority.js
---
Agent A (Architect) has completed step 01.

## Code Context (from repo)
### File: src/components/webgl/WebGLBackground.jsx

```
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
import { emitParticlesEmerged } from '@/theater/bus/emitters.js';
import { trace } from '@/dev/trace.js';

import { getPointSpriteAtlasSingleton } from './consciousness/PointSpriteAtlas.js';
import { Canonical } from '../../config/canonical/canonicalAuthority.js';
import { particleRaycaster } from '@/utils/particleRaycast.js';
import { useParticleChoreography } from './ParticleChoreography.jsx';

import vertexShaderSource from '../../shaders/templates/consciousness-vertex.glsl?raw';
import fragmentShaderSource from '../../shaders/templates/consciousness-fragment.glsl?raw';
import { exposeDiagnostics, exposeControlSurface, revokeControlSurface } from '@/utils/runtimeGuards.js';

const ATMO_FIT_X = 0.92;
const ATMO_FIT_Y = 0.85;
const TEXT_FIT_WIDTH = 0.9;
const TEXT_FIT_MAX_H = 0.8;
const BAND_FADE_WIDTH = 0.35;

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
const RENDERER_SINGLE_WRITER_UNIFORMS = new Set([
  'uMotionMode',
  'uFlowTurbulence',
  'uMorphProgress',
  'uStageProgress',
  'uPointSize',
]);
const VISUAL_ONLY_UNIFORMS = new Set(['uOpacityMin', 'uOpacityMax', 'uParticleFlash']);
const guardUniformWrite = (origin = 'unknown', uniformName) => {
  if (!DEV || !uniformName) return true;
  if (VISUAL_ONLY_UNIFORMS.has(uniformName)) {
    if (origin === 'renderer' || origin === 'beat_visual') return true;
    console.warn(`[Pattern S] Blocked ${origin} writing ${uniformName} (visual-only: renderer/beat_visual)`);
    return false;
  }
  if (RENDERER_SINGLE_WRITER_UNIFORMS.has(uniformName) && origin !== 'renderer') {
    console.warn(`[Pattern S] Blocked ${origin} writing ${uniformName} (single-writer: renderer)`);
    return false;
  }
  return true;
};

const getMorphEnvelope = (progress) => {
  const p = clamp01(progress);
  const clamp01Local = (x) => Math.max(0, Math.min(1, x));
  const implode = p < 0.2 ? 0 : clamp01Local((p - 0.2) / 0.4);
  const chaosPhase = clamp01Local((p - 0.2) / 0.6);
  const chaos = Math.sin(chaosPhase * Math.PI);
  const coalesce = p <= 0.7 ? 0 : Math.min((p - 0.7) / 0.3, 1.0);
  const settle = p <= 0.9 ? 0 : Math.min((p - 0.9) / 0.1, 1.0);
  return { implode, chaos, coalesce, settle };
};

const applyVisualVerbDirective = (directive = {}, uniforms, origin = 'renderer') => {
  if (!uniforms) return;
  const verb = directive?.verb || directive?.effect?.verb;
  const setUniform = (name, value) => {
    if (typeof value !== 'number') return;
    const target = uniforms[name];
    if (!target) return;
    if (!guardUniformWrite(origin, name)) return;
    target.value = value;
    target.needsUpdate = true;
  };
  const applyArrayUniform = (name, value) => {
    const uniform = uniforms[name];
    if (!uniform) return;
    if (!guardUniformWrite(origin, name)) return;
    if (Array.isArray(value)) {
      if (uniform.value?.set) {
        uniform.value.set(...value);
      } else {
        uniform.value = value.slice();
      }
    } else {
      uniform.value = value;
    }
    uniform.needsUpdate = true;
  };
  const clamp1 = (value, fallback = 1) => clamp01(Number.isFinite(value) ? value : fallback);

  if (directive?.effect && typeof directive.effect === 'object') {
    Object.entries(directive.effect).forEach(([key, value]) => {
      if (typeof value === 'number') {
        setUniform(key, value);
      } else if (Array.isArray(value)) {
        applyArrayUniform(key, value);
      }
    });
  }

  if (!verb) return;

  switch (verb) {
    case 'gentle_drift':
      setUniform('uDriftAmp', clamp1(directive?.amplitude ?? 0.25, 0.25));
      setUniform('uDriftFreq', Math.max(0.05, directive?.frequency ?? 0.15));
      break;
    case 'tier3_subtle_pulse':
      setUniform('uTier3PulseAmp', clamp1(directive?.amplitude ?? 0.6, 0.6));
      setUniform('uTier3PulseFreq', Math.max(0.2, directive?.frequency ?? 1.2));
      break;
    case 'tier2_flicker_increase':
      setUniform('uTier2FlickerAmp', clamp1(directive?.amplitude ?? 0.8, 0.8));
      setUniform('uTier2FlickerFreq', Math.max(0.5, directive?.frequency ?? 3.0));
      break;
    case 'particles_begin_columns':
      setUniform('uColumnMorphStrength', clamp1(directive?.strength ?? 1.0));
      break;
    case 'reform_as_structure':
      setUniform('uStructureBlend', clamp1(directive?.strength ?? 1.0));
      break;
    default:
      break;
  }
};

// Lightweight opening-phase detection to avoid premature freezes/fenceposts during the opening sequence
function isOpeningInProgress() {
  if (typeof window === 'undefined') return false;
  const director = window.theaterDirector;
  try {
    if (director?.isOpeningInProgress?.()) return true;
    const phase = director?.phase;
    const openingPhases = new Set([
      'black',
      'cursor',
      'terminal',
      'fill',
      'chaos',
      'coalesce',
      'settle',
      'emergence',
    ]);
    if (phase && openingPhases.has(phase)) return true;
    return director?._openingInProgress === true;
  } catch {
    return false;
  }
}

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
  const uniformsRef = useRef(null);
  const geometryBoundOnceRef = useRef(false);
  // QR state / restore slots
  const qrModeRef = useRef(false);
  const pageInteractiveDispatchedRef = useRef(false);
  const restoreClearRef = useRef([0, 0, 0, 1]);
  const lastPointSizeRef = useRef(null);
  // Optional: if your render loop advances uTime, guard it here
  const timeTickEnabledRef = useRef(true);

  // Target max |x|/|y| in NDC for QR; tuned for readable, photo-like size
  const QR_AUTO_SCALE_TARGET = 0.25;

  function autoscaleQrPositions(positions, targetNdc = QR_AUTO_SCALE_TARGET) {
    if (!(positions instanceof Float32Array) || positions.length < 3) return positions;

    // Compute bounds
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minY) || !Number.isFinite(maxY)) {
      return positions;
    }

    // Recentre
    const cx = (minX + maxX) * 0.5;
    const cy = (minY + maxY) * 0.5;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i]     -= cx;
      positions[i + 1] -= cy;
    }

    // Uniform scale to target extent
    let maxAbs = 0.000001;
    for (let i = 0; i < positions.length; i += 3) {
      const ax = Math.abs(positions[i]);
      const ay = Math.abs(positions[i + 1]);
      if (ax > maxAbs) maxAbs = ax;
      if (ay > maxAbs) maxAbs = ay;
    }
    if (!Number.isFinite(maxAbs) || maxAbs <= 0) return positions;
    const scale = targetNdc / maxAbs;
    if (!Number.isFinite(scale) || scale <= 0) return positions;

    for (let i = 0; i < positions.length; i += 3) {
      positions[i]     *= scale;
      positions[i + 1] *= scale;
    }

    return positions;
  }
  const renderGuardRef = useRef(false);
  const runWithRenderGuard = (fn) => {
    if (typeof fn !== 'function') return undefined;
    renderGuardRef.current = true;
    try {
      return fn();
    } finally {
      renderGuardRef.current = false;
    }
  };
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

  useParticleChoreography(uniformsRef);
  const ignoreDirectivesRef = useRef(false);
  const listenersReadyRef = useRef(false);
  const fenceReadyRef = useRef(false);
  const pendingFencepostRef = useRef(false);
  const pendingFenceDataRef = useRef(null);
  const pendingFenceTimeoutRef = useRef(null);
  const fencepostEmittedOnceRef = useRef(false);
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
    if (fencepostEmittedOnceRef.current) return;
    fencepostEmittedOnceRef.current = true;
    const finalPayload = {
      channel: payload.channel || 'renderer',
      ...payload,
    };
    trace('WBG:FENCEPOST', finalPayload);
    emitParticlesEmerged(finalPayload);
    if (typeof window !== 'undefined') {
      window.__lastParticlesEmerged = finalPayload;
    }
    if (import.meta?.env?.DEV) {
      console.log('✅ [RENDERER] PARTICLES_EMERGED emitted', finalPayload);
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

  const emitRendererFencepostReady = useCallback((reason = 'sink-ready') => {
    if (typeof BeatBus?.emit !== 'function') return;
    BeatBus.emit(EVENTS.FENCEPOST_LISTENERS_READY, {
      channel: 'renderer',
      source: 'webgl-renderer',
      reason,
      timestamp:
        typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : Date.now(),
    });
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
      if (fencepostEmittedOnceRef.current) return;

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

      // During opening, skip freezing/fencepost; let Director handle the handoff.
      if (isOpeningInProgress()) {
        if (DEV) {
          console.log('[WBG] finalizeEmergence skipped during opening', { source });
        }
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

      // MORPH_PROGRESS is now owned by MorphAnimationController; renderer only updates uniforms locally.

      const now =
        typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : Date.now();

      emittedEmergedRef.current = true;
      emergencePendingRef.current = false;

      trace('WBG:FAST_FORWARD', {
        at: now,
        source,
        stage: stageNameRef.current || 'genesis',
        morph: 1,
        fastForward: true,
      });
      return true;
    },
    [queueFencepost]
  );

  const { size, gl, camera } = useThree();

  useEffect(() => {
    if (!BeatBus?.on) return () => {};
    const enableDirectives = (reason) => {
      ignoreDirectivesRef.current = false;
      if (import.meta?.env?.DEV) {
        console.log('[WBG] Directives enabled', { reason });
      }
    };
    const offEmerged = BeatBus.on(EVENTS.PARTICLES_EMERGED, () => enableDirectives('particles-emerged'));
    const offOpeningComplete = BeatBus.on(EVENTS.OPENING_COMPLETE, () => enableDirectives('opening-complete'));
    const offScroll = BeatBus.on(EVENTS.ENABLE_SCROLL, () => enableDirectives('enable-scroll'));
    return () => {
      offEmerged?.();
      offOpeningComplete?.();
      offScroll?.();
    };
  }, []);

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

    const atmoTargetX = ATMO_FIT_X;
    const atmoTargetY = ATMO_FIT_Y;
    const textTargetWidth = TEXT_FIT_WIDTH;
    const textTargetMaxH = TEXT_FIT_MAX_H;

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

  const bandScale = BAND_FADE_WIDTH;
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
    const palette = (Array.isArray(colors) && colors.length >= 3) ? colors : null;
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

      // allow full binds for all stages; only block late emergence rebinding
      // ignore late emergence after handoff
      if (isEmergence && emittedEmergedRef.current) return;

      // bind arrays
      setBlueprint(raw);
      lastBlueprintMetaRef.current = raw?.metadata || {};
      setStageName(isEmergence ? 'genesis' : (raw.stageName || st || 'genesis'));
      setActiveCount(raw.activeCount || raw.particleCount || raw.maxParticles || 0);
      applyMetadataColors(raw?.metadata?.colors);

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
          autoscaleQrPositions(raw.positions, QR_AUTO_SCALE_TARGET);
        }
        if (raw.atmosphericPositions instanceof Float32Array) {
          autoscaleQrPositions(raw.atmosphericPositions, QR_AUTO_SCALE_TARGET);
        }
        if (raw.text3DPositions instanceof Float32Array) {
          autoscaleQrPositions(raw.text3DPositions, QR_AUTO_SCALE_TARGET);
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
      runWithRenderGuard(() => geo.setDrawRange(0, drawCount));
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
          // 🔬 Diagnostics: AABB at bind (atmospheric vs text) to catch collapsed/off-screen data
          const aabb = (arr) => {
            if (!(arr instanceof Float32Array) || arr.length < 3) return null;
            let minX = Infinity, minY = Infinity, minZ = Infinity;
            let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
            for (let i = 0; i < arr.length; i += 3) {
              const x = arr[i], y = arr[i + 1], z = arr[i + 2];
              if (x < minX) minX = x; if (x > maxX) maxX = x;
              if (y < minY) minY = y; if (y > maxY) maxY = y;
              if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
            }
            return {
              min: { x: +minX.toFixed(2), y: +minY.toFixed(2), z: +minZ.toFixed(2) },
              max: { x: +maxX.toFixed(2), y: +maxY.toFixed(2), z: +maxZ.toFixed(2) },
              size: { x: +(maxX - minX).toFixed(2), y: +(maxY - minY).toFixed(2), z: +(maxZ - minZ).toFixed(2) },
            };
          };
          const atmAabb = aabb(raw.atmosphericPositions);
          const textAabb = aabb(raw.text3DPositions);
          const posAabb = aabb(geo.attributes?.position?.array);
          console.log('🔬 BIND_AABB', {
            stage: raw.stageName || st || 'genesis',
            mode: mode || raw?.mode,
            atm: atmAabb,
            text: textAabb,
            geo: posAabb,
            cached: !!cached,
          });
          scheduleRuntimeSampling();
          if (isEmergence || isOpeningChaos) {
            fenceReadyRef.current = true;
            flushPendingFencepost();
            emitRendererFencepostReady(isEmergence ? 'emergence-bind' : 'opening-bind');
        }
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
        // Reset core uniforms to a safe baseline on every full bind
        if (mat?.uniforms) {
          const u = mat.uniforms;
          if (u.uPostMorphFreeze) {
            u.uPostMorphFreeze.value = 0.0;
            u.uPostMorphFreeze.needsUpdate = true;
          }
          if (u.uOpacityMin) {
            u.uOpacityMin.value = 0.5;
            u.uOpacityMin.needsUpdate = true;
          }
          if (u.uOpacityMax) {
            u.uOpacityMax.value = 1.0;
            u.uOpacityMax.needsUpdate = true;
          }
          if (u.uFadeProgress) {
            u.uFadeProgress.value = 1.0;
            u.uFadeProgress.needsUpdate = true;
          }
          if (u.uPointSize) {
            const dpr = typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1;
            u.uPointSize.value = Math.max(1.6, 2.2 * dpr);
            u.uPointSize.needsUpdate = true;
          }
          // Ensure active counts and draw range are fully open on bind
          const geoCount = geometryRef.current?.attributes?.position?.count ?? drawCount;
          if (u.uActiveCount) {
            u.uActiveCount.value = geoCount;
            u.uActiveCount.needsUpdate = true;
          }
          if (u.uTierCutoff) {
            u.uTierCutoff.value = Math.max(u.uTierCutoff.value || 0, geoCount);
            u.uTierCutoff.needsUpdate = true;
          }
          if (geometryRef.current) {
            geometryRef.current.setDrawRange(0, geoCount);
          }
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
        // No MORPH_PROGRESS emission here; MorphAnimationController drives the bus after emergence binds.
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
          // Keep geometry flagged as bound so opening morph can animate immediately.
          geometryBoundOnceRef.current = true;
        }

        const stageName = raw.stageName || st || 'genesis';
        const isGenesisFull = stageName === 'genesis' && !isEmergence;
        if (isGenesisFull && !fencepostEmittedOnceRef.current) {
          // Avoid emitting the final fencepost during opening; Director will drive it post-opening.
          if (isOpeningInProgress()) {
            if (DEV) {
              console.log('[WBG] Genesis fencepost skipped during opening');
            }
          } else {
            const now =
              typeof performance !== 'undefined' && typeof performance.now === 'function'
                ? performance.now()
                : Date.now();
            const count =
              geometryRef.current?.attributes?.position?.count ??
              raw.activeCount ??
              raw.particleCount ??
              0;
            queueFencepost({
              at: now,
              source: 'renderer-full-genesis-bind',
              stage: stageName,
              morph: uniforms?.uMorphProgress?.value ?? 1,
              cached: Boolean(cached),
              count,
            });
          }
        }

        // Note: climax diagnostics/overrides removed to allow normal morph flow

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
          uniforms.uPointSize.value = Math.max(1.8, 2.2 * dpr);
          uniforms.uPointSize.needsUpdate = true;
        }
        if (uniforms?.uFlowTurbulence) {
          uniforms.uFlowTurbulence.value = 0.0;
          uniforms.uFlowTurbulence.needsUpdate = true;
        }
        if (uniforms?.uStreakIntensity) {
          uniforms.uStreakIntensity.value = 0.0;
          uniforms.uStreakIntensity.needsUpdate = true;
        }
        if (uniforms?.uMotionMode) {
          uniforms.uMotionMode.value = 0.0;
          uniforms.uMotionMode.needsUpdate = true;
        }
        if (uniforms?.uGaussianSigma) {
          uniforms.uGaussianSigma.value = 0.5;
          uniforms.uGaussianSigma.needsUpdate = true;
        }
        if (uniforms?.uGlowIntensity) {
          uniforms.uGlowIntensity.value = 0.0;
          uniforms.uGlowIntensity.needsUpdate = true;
        }
        if (uniforms?.uVertexGlow) {
          uniforms.uVertexGlow.value = 0.0;
          uniforms.uVertexGlow.needsUpdate = true;
        }
        if (uniforms?.uEdgeFlicker) {
          uniforms.uEdgeFlicker.value = 0.0;
          uniforms.uEdgeFlicker.needsUpdate = true;
        }
        if (uniforms?.uPulseFrequency) {
          uniforms.uPulseFrequency.value = 0.0;
          uniforms.uPulseFrequency.needsUpdate = true;
        }
        if (uniforms?.uPulseAmplitude) {
          uniforms.uPulseAmplitude.value = 0.0;
          uniforms.uPulseAmplitude.needsUpdate = true;
        }
        // Ensure mesh itself is not tilted or spinning when we show the QR
        if (meshRef.current) {
          meshRef.current.rotation.set(0, 0, 0);
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
  }, [
    updateBandHeight,
    logBind,
    scheduleRuntimeSampling,
    clearPendingFencepost,
    queueFencepost,
    finalizeEmergence,
    flushPendingFencepost,
    emitRendererFencepostReady,
  ]);

  // Bridge render directives back into shader uniforms/draw ranges
  useEffect(() => {
    if (typeof BeatBus?.on !== 'function') return;
    const handleDirective = (payload = {}) => {
      const directive = payload || {};
      try {
        console.log('🔬 DIRECTIVE_CONTENTS', {
          hasMorph: ('uMorphProgress' in directive) || ('morphProgress' in directive),
          morphValue: directive.uMorphProgress ?? directive.morphProgress ?? 'MISSING',
          phase: directive.phase,
          stage: directive.stage,
          allKeys: Object.keys(directive || {}),
          timestamp: (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(),
        });
      } catch {}
      if (import.meta?.env?.DEV) {
        console.log('[WBG] handleDirective', {
          source: payload?.source,
          phase: payload?.phase,
          verb: payload?.verb || payload?.effect?.verb || null,
          keys: Object.keys(payload || {}),
        });
        if (payload?.phase === 'opening') {
          console.log('[WBG] opening directive', {
            verb: payload?.verb || payload?.effect?.verb || null,
            effectKeys: payload?.effect ? Object.keys(payload.effect) : [],
            hasEffect: !!payload?.effect,
          });
        }
      }
      const phase = payload?.phase || 'unknown';
      const isScrollPhase = phase === 'scroll';

      const mat = materialRef.current;
      const mesh = meshRef.current;
      const geometry = geometryRef.current;
      if (!mat || !geometry || !mat.uniforms) return;
      const uniforms = mat.uniforms;
      const directiveSource = payload?.source || 'renderer:directive';
      const origin = 'renderer';

      const clamp01Local = (x) => Math.max(0, Math.min(1, Number(x)));

      const setUniformNumber = (uniformName, value) => {
        if (typeof value !== 'number') return;
        if (isScrollPhase && (uniformName === 'uMorphProgress' || uniformName === 'uStageProgress')) {
          if (DEV) console.warn('[WBG] Scroll-phase directive blocked morph write', { uniformName, value });
          return;
        }
        const uniform = uniforms[uniformName];
        if (!uniform) return;
        if (!guardUniformWrite(origin, uniformName)) return;
        uniform.value = value;
        uniform.needsUpdate = true;
      };
      const applyUniformArray = (uniformName, uniform, value) => {
        if (!guardUniformWrite(origin, uniformName)) return;
        if (!uniform) return;
        if (Array.isArray(value)) {
          if (Array.isArray(uniform.value)) {
            for (let i = 0; i < Math.min(uniform.value.length, value.length); i += 1) {
              uniform.value[i] = value[i];
            }
          } else if (uniform.value?.set) {
            uniform.value.set(...value);
          } else {
            uniform.value = value;
          }
        } else {
          uniform.value = value;
        }
        uniform.needsUpdate = true;
      };

      const desiredMotionMode =
        typeof payload.uMotionNote === 'number' ? payload.uMotionNote : payload.uMotionMode;
      setUniformNumber('uMotionMode', desiredMotionMode);
      setUniformNumber('uParticlePhase', payload.uParticlePhase);
      setUniformNumber('uFlowTurbulence', payload.uFlowTurbulence);
      setUniformNumber('uParticleFlash', payload.uParticleFlash);
      setUniformNumber('uOpacityMin', payload.uOpacityMin);
      setUniformNumber('uOpacityMax', payload.uOpacityMax);
      if (typeof payload.uSpreadFactor === 'number' && payload.uSpreadFactor > 0) {
        setUniformNumber('uSpreadFactor', payload.uSpreadFactor);
      }
      setUniformNumber('uGaussianSigma', payload.uGaussianSigma);
      setUniformNumber('uBandFade', payload.bandFade);
      setUniformNumber('uBandHeight', payload.bandHeight);

      if (!isScrollPhase && typeof payload.uMorphProgress === 'number') {
        setUniformNumber('uMorphProgress', payload.uMorphProgress);
        if (typeof payload.uStageProgress === 'number') {
          setUniformNumber('uStageProgress', payload.uStageProgress);
        } else if (uniforms.uStageProgress && guardUniformWrite(origin, 'uStageProgress')) {
          uniforms.uStageProgress.value = payload.uMorphProgress;
          uniforms.uStageProgress.needsUpdate = true;
        }
      } else if (!isScrollPhase && typeof payload.uStageProgress === 'number') {
        setUniformNumber('uStageProgress', payload.uStageProgress);
      }

      if (typeof payload.pointSize === 'number') {
        const clampedSize = Math.max(0.5, Math.min(payload.pointSize, 12.0));
        setUniformNumber('uPointSize', clampedSize);
        lastPointSizeRef.current = clampedSize;
      }

      if (payload.gaussianSigma !== undefined) {
        setUniformNumber('uGaussianSigma', payload.gaussianSigma);
      }
      if (payload.bandFade !== undefined) {
        setUniformNumber('uBandFade', payload.bandFade);
      }
      if (payload.bandHeight !== undefined) {
        setUniformNumber('uBandHeight', payload.bandHeight);
      }

      if (Array.isArray(payload.tierHighlight) && uniforms.uTierHighlight) {
        applyUniformArray(
          'uTierHighlight',
          uniforms.uTierHighlight,
          payload.tierHighlight.map((v) => clamp01Local(v))
        );
      }

      if (uniforms.uTierMode) {
        const tierModes = Array.isArray(payload.tierModes)
          ? payload.tierModes
          : (typeof payload.uMotionMode === 'number'
              ? [payload.uMotionMode, payload.uMotionMode, payload.uMotionMode, payload.uMotionMode]
              : null);
        if (tierModes) {
          applyUniformArray('uTierMode', uniforms.uTierMode, tierModes);
        }
      }
      if (Array.isArray(payload.tierParams) && payload.tierParams.length >= 4) {
        const params = payload.tierParams;
        if (uniforms.uTierParams0) applyUniformArray('uTierParams0', uniforms.uTierParams0, params[0]);
        if (uniforms.uTierParams1) applyUniformArray('uTierParams1', uniforms.uTierParams1, params[1]);
        if (uniforms.uTierParams2) applyUniformArray('uTierParams2', uniforms.uTierParams2, params[2]);
        if (uniforms.uTierParams3) applyUniformArray('uTierParams3', uniforms.uTierParams3, params[3]);
      } else if (uniforms.uTierParams0) {
        // Fallback to a gentle drift template when no params provided
        const template = [0.8, 0.2, 0.5, 0.0];
        applyUniformArray('uTierParams0', uniforms.uTierParams0, template);
        if (uniforms.uTierParams1) applyUniformArray('uTierParams1', uniforms.uTierParams1, template);
        if (uniforms.uTierParams2) applyUniformArray('uTierParams2', uniforms.uTierParams2, template);
        if (uniforms.uTierParams3) applyUniformArray('uTierParams3', uniforms.uTierParams3, template);
      }
      if ((typeof payload.gridX === 'number' || typeof payload.gridY === 'number') && uniforms.uGridSpacing) {
        const gx = typeof payload.gridX === 'number' ? payload.gridX : uniforms.uGridSpacing.value?.x || 0.2;
        const gy = typeof payload.gridY === 'number' ? payload.gridY : uniforms.uGridSpacing.value?.y || 0.2;
        if (gx > 0 && gy > 0) {
          applyUniformArray('uGridSpacing', uniforms.uGridSpacing, [gx, gy]);
        }
      }

      if (payload.uniforms && typeof payload.uniforms === 'object') {
        Object.entries(payload.uniforms).forEach(([key, value]) => {
          if (!uniforms[key]) return;
          if (key === 'uTierHighlight' && Array.isArray(value)) {
            applyUniformArray(key, uniforms[key], value.map((v) => clamp01Local(v)));
            return;
          }
          if (key === 'uOpacityRamp' && Array.isArray(value)) {
            applyUniformArray(key, uniforms[key], value.map((v) => clamp01Local(v)));
            return;
          }
          applyUniformArray(key, uniforms[key], value);
        });
      }

      if (payload?.verb || payload?.effect?.verb) {
        applyVisualVerbDirective(payload, uniforms, origin);
      }

      const desiredActiveCount =
        Number.isFinite(payload.activeCount)
          ? payload.activeCount
          : Number.isFinite(payload.drawCount)
            ? payload.drawCount
            : null;
      if (desiredActiveCount !== null) {
        const attributeCount =
          geometry?.attributes?.position?.count ??
          mesh?.geometry?.attributes?.position?.count ??
          desiredActiveCount;
        const safeCount = Math.max(
          0,
          Math.min(Math.floor(desiredActiveCount), Math.floor(attributeCount))
        );
        if (geometry.setDrawRange) {
          runWithRenderGuard(() => geometry.setDrawRange(0, safeCount));
        } else if (mesh?.geometry?.setDrawRange) {
          runWithRenderGuard(() => mesh.geometry.setDrawRange(0, safeCount));
        }
      }

      mat.uniformsNeedUpdate = true;
      mat.needsUpdate = true;
    };
    const off = BeatBus.on(EVENTS.RENDER_DIRECTIVE, handleDirective);
    if (!listenersReadyRef.current) {
      listenersReadyRef.current = true;
      fenceReadyRef.current = true;
      emitRendererFencepostReady('sink-mounted');
    }
    return () => {
      off && off();
      listenersReadyRef.current = false;
    };
  }, []);

  // MORPH_PROGRESS → lightweight timeline updates
  useEffect(() => {
    if (typeof BeatBus?.on !== 'function') {
      return undefined;
    }

  const handleMorphProgress = (payload = {}) => {
      try {
        console.log('🔬 MORPH_PROGRESS_HANDLER_CALLED', {
          payload,
          currentUniform: materialRef.current?.uniforms?.uMorphProgress?.value ?? null,
          timestamp: (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(),
        });
      } catch {}
      if (import.meta?.env?.DEV) {
        console.log('[WBG] handleMorphProgress', {
          payload,
          frozen: emergencePendingRef.current ? emittedEmergedRef.current : false,
          ignoreDirectives: ignoreDirectivesRef.current,
        });
      }
      const raw =
        payload?.progress ??
        payload?.morphProgress ??
        payload?.value ??
        null;
      const value = Number.isFinite(raw) ? clamp01(raw) : null;
      if (value == null) return;

      const hasGeometry =
        geometryBoundOnceRef.current ||
        (geometryRef.current?.attributes?.position?.count ?? 0) > 0;
    if (!hasGeometry) {
      if (DEV) {
        console.log('[WBG] Morph ignored (geometry not yet bound)', payload);
      }
      return;
    }
    geometryBoundOnceRef.current = true;

      fallbackMorphRef.current = value;

      const mat = materialRef.current;
      const uniforms = mat?.uniforms;
      if (!uniforms) {
        if (DEV) console.warn('⚠️ [MORPH] Material uniforms missing');
        return;
      }

      const lastMeta = lastBlueprintMetaRef.current || {};
      const setEnvUniform = (name, val) => {
        if (!uniforms[name]) return;
        uniforms[name].value = val;
        uniforms[name].needsUpdate = true;
      };

      const env = getMorphEnvelope(value);
      setEnvUniform('uImplodeStrength', env.implode);
      setEnvUniform('uChaosStrength', env.chaos);
      setEnvUniform('uCoalesceStrength', env.coalesce);
      setEnvUniform('uSettleStrength', env.settle);

    __applyMorph(value);

    // Ensure visibility baseline on every morph tick (defensive)
    if (uniforms.uPostMorphFreeze && uniforms.uPostMorphFreeze.value !== 0.0) {
      uniforms.uPostMorphFreeze.value = 0.0;
      mat.uniformsNeedUpdate = true;
    }
    if (uniforms.uOpacityMin && uniforms.uOpacityMin.value < 0.4) {
      uniforms.uOpacityMin.value = 0.5;
      uniforms.uOpacityMin.needsUpdate = true;
    }
    if (uniforms.uOpacityMax && uniforms.uOpacityMax.value < 0.8) {
      uniforms.uOpacityMax.value = 1.0;
      uniforms.uOpacityMax.needsUpdate = true;
    }
    if (uniforms.uFadeProgress && uniforms.uFadeProgress.value !== 1.0) {
      uniforms.uFadeProgress.value = 1.0;
      uniforms.uFadeProgress.needsUpdate = true;
    }
    const geoCount = geometryRef.current?.attributes?.position?.count ?? 0;
    if (geoCount > 0) {
      if (uniforms.uActiveCount) {
        uniforms.uActiveCount.value = geoCount;
        uniforms.uActiveCount.needsUpdate = true;
      }
      if (uniforms.uTierCutoff) {
        uniforms.uTierCutoff.value = Math.max(uniforms.uTierCutoff.value || 0, geoCount);
        uniforms.uTierCutoff.needsUpdate = true;
      }
    }
      if (uniforms.uStageProgress) {
        uniforms.uStageProgress.value = value;
      }
      mat.uniformsNeedUpdate = true;
      mat.needsUpdate = true;

      const skipFreezeForOpening = isOpeningInProgress();
      const currentStage = stageNameRef.current || 'genesis';
      const isGenesis = currentStage === 'genesis';

      // Only auto-freeze non-Genesis stages after emergence completes.
      const allowAutoFreeze =
        !isGenesis && !skipFreezeForOpening;

      if (emergencePendingRef.current && !emittedEmergedRef.current && value >= 0.995) {
        const now =
          typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now();

        if (allowAutoFreeze && uniforms.uPostMorphFreeze && uniforms.uPostMorphFreeze.value !== 1.0) {
          uniforms.uPostMorphFreeze.value = 1.0;
          mat.uniformsNeedUpdate = true;
          trace('WBG:FREEZE', { value: 1, source: 'morph' });
        }

        emittedEmergedRef.current = true;
        emergencePendingRef.current = false;
      }

      if (DEV) {
        console.log('🔬 [MORPH] Updated:', value.toFixed(3));
      }
    };

    const unsubMorph = BeatBus.on(EVENTS.MORPH_PROGRESS, handleMorphProgress);
    try {
      console.log('🔬 MORPH_PROGRESS_SUBSCRIBED', {
        timestamp: (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(),
      });
    } catch {}

    if (DEV) {
      console.log('✅ Renderer subscribed:', {
        MORPH_PROGRESS: 'active',
        BLUEPRINT_READY: 'active (separate hook)',
      });
    }

    return () => {
      unsubMorph?.();
    };
  }, []);

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
          uMotionMode:      { value: 0.0 },
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
          uImplodeStrength: { value: 0.0 },
          uChaosStrength:   { value: 0.0 },
          uCoalesceStrength:{ value: 0.0 },
          uSettleStrength:  { value: 0.0 },
          uDriftAmp:        { value: 0.0 },
          uDriftFreq:       { value: 0.25 },
          uTier3PulseAmp:   { value: 0.0 },
          uTier3PulseFreq:  { value: 1.0 },
          uTier2FlickerAmp: { value: 0.0 },
          uTier2FlickerFreq:{ value: 2.5 },
          uColumnMorphStrength: { value: 0.0 },
          uStructureBlend:  { value: 0.0 },
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
          uDriftSpeed:      { value: 0.2 },
          uGlowIntensity:   { value: 1.0 },
          uVertexGlow:      { value: 1.0 },
          uEdgeFlicker:     { value: 1.0 },
          uPulseFrequency:  { value: 0.3 },
          uPulseAmplitude:  { value: 0.15 },
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
      uniformsRef.current = mat.uniforms || null;
    }

    const uniforms = mat.uniforms || {};
    uniformsRef.current = mat.uniforms || uniformsRef.current;
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

```

### File: src/shaders/templates/consciousness-fragment.glsl

```
precision mediump float;

// Uniforms
uniform sampler2D uAtlasTexture;
uniform float uTime;
uniform vec3 uColorCurrent;
uniform vec3 uColorNext;
uniform vec3 uColorAccent1;
uniform vec3 uColorAccent2;
uniform vec3 uPalette0;
uniform vec3 uPalette1;
uniform vec3 uPalette2;
uniform vec3 uPalette3;
uniform float uTierHighlight;
uniform float uActiveCount;
uniform float uFadeProgress;
uniform float uGaussianSigma;
uniform float uBandHeight;
uniform float uBandFade;

// Varyings
varying vec3 vPosition;
varying float vBlend;
varying float vAlpha;
varying vec2 vAtlasUVOffset;
varying float vTierID;
varying float vTier;
varying float vSizeMultiplier;
varying float vParticleIndex;

vec3 getTierColor(int t) {
  if (t == 0) return uPalette0;
  if (t == 1) return uPalette1;
  if (t == 2) return uPalette2;
  return uPalette3;
}

float gaussianFalloff(vec2 coord, float sigma) {
  vec2 centered = coord - 0.5;
  float distSq = dot(centered, centered);
  return exp(-distSq * sigma * sigma * 4.0);
}

vec4 sampleAtlas(vec2 uvOffset, vec2 pointCoord) {
  float spriteSize = 0.25; // 4x4 grid
  vec2 uv = uvOffset + pointCoord * spriteSize;
  return texture2D(uAtlasTexture, uv);
}

void main() {
  // Fade particles beyond active count
  if (vParticleIndex >= uActiveCount) {
    discard;
  }
  
  // Sample sprite texture
  vec4 sprite = sampleAtlas(vAtlasUVOffset, gl_PointCoord);
  if (sprite.a < 0.01) discard;

  int tierIndex = int(clamp(floor(vTier + 0.5), 0.0, 3.0));

  // Core glow accent for galactic band feel
  float fade = clamp(uBandFade, 0.0, 1.0);
  float distFromBandCenter = abs(vPosition.y);
  float bandHalfHeight = max(0.35, uBandHeight * 0.65);
  float bandCurve = smoothstep(bandHalfHeight, 0.0, distFromBandCenter);
  float coreStrength = pow(bandCurve, 2.0) * fade;
  float haloStrength = (1.0 - smoothstep(0.0, bandHalfHeight * 2.4, distFromBandCenter)) * fade;
  float tierGlowBoost = tierIndex == 3 ? 2.4 : (tierIndex == 2 ? 1.8 : 1.0);
  vec3 glowGradient = mix(vec3(0.0, 0.95, 0.6), vec3(0.0, 1.0, 0.0), coreStrength);
  
  // Base color mix + tier palette influence
  vec3 color = mix(uColorCurrent, uColorNext, vBlend);
  vec3 stageColor = getTierColor(tierIndex);
  color = mix(color, stageColor, 0.35);
  if (tierIndex == 3) {
    color = mix(color, uColorAccent1, 0.25);
  } else if (tierIndex == 2) {
    color = mix(color, uColorAccent2, 0.2);
  }
  
  // Apply gaussian edge falloff
  float sigma = uGaussianSigma > 0.0 ? uGaussianSigma : 2.5;
  float edgeFade = gaussianFalloff(gl_PointCoord, sigma);

  // Add subtle shimmer and additive core glow
  float shimmer = 1.0 + sin(uTime * 2.0 + vParticleIndex * 0.1) * 0.05;
  float twinkle = 1.0 + sin(uTime * 5.0 + vParticleIndex * 0.03) * 0.03;
  vec3 finalColor = color * sprite.rgb * shimmer * twinkle;
  vec3 haloTint = vec3(0.0, 0.7, 0.4);
  vec3 ambientGlow = vec3(0.0, 0.25, 0.12) * clamp(1.0 - bandCurve, 0.0, 1.0) * fade;
  finalColor += glowGradient * (coreStrength * tierGlowBoost * 0.5);
  finalColor += haloTint * (haloStrength * 0.25);
  finalColor += ambientGlow;

  // Slightly elevate starfield opacity for Tier 0
  float tierOpacityBoost = tierIndex == 0 ? 1.6 : (tierIndex == 1 ? 1.1 : 1.0);
  float baseOpacity = vAlpha * tierOpacityBoost;
  float alpha = baseOpacity * sprite.a * edgeFade * uFadeProgress;

  if (abs(uTierHighlight - float(tierIndex)) < 0.5) {
    finalColor *= 1.2;
    alpha *= 1.1;
  }

  gl_FragColor = vec4(finalColor, alpha);
}

```

### File: sst/canon/v3.5.json

```
{
  "meta": {
    "version": "3.5.0",
    "authority": "ABSOLUTE",
    "lastUpdated": "2025-10-02",
    "breaking_changes": [
      "text3DPosition now represents 3D letter volumes",
      "Camera angles specified per stage for dimensional reveal"
    ],
    "name": "MetaCurtis Consciousness Theater",
    "mode": "TEXT_FIRST_REVEAL",
    "documentStatus": "SINGLE_SOURCE_OF_TRUTH",
    "date": "2025-09-02",
    "compat": {
      "accepts": [
        "3.3",
        "3.4"
      ]
    }
  },
  "narrative": {
    "overlay": {
      "typewriterSpeedMs": 50,
      "graceWindowMs": 800,
      "deduplication": {
        "enabled": true,
        "thresholdMs": 100
      },
      "style": {
        "background": "rgba(0, 0, 0, 0.65)",
        "color": "#fff",
        "fontSize": 16,
        "lineHeight": 1.45,
        "padding": "12px 18px",
        "borderRadius": 10,
        "maxWidth": 960,
        "zIndex": 1000
      },
      "animation": {
        "fadeInDurationMs": 300,
        "fadeOutDurationMs": 500
      }
    }
  },
  "features": {
    "gaussianFalloff": 1,
    "centerWeightingTier4": 1,
    "ctfOpening": false,
    "beatGlyph": true,
    "scrollOrchestrator": true,
    "openingFencepostContract": true
  },
  "pipeline": {
    "modules": {
      "director": {
        "role": "orchestration",
        "writes": [
          "eventsOnly"
        ],
        "forbidden": [
          "geometry",
          "uniforms"
        ],
        "notes": "Prewarm \u2192 terminal \u2192 screen fill \u2192 emergence \u2192 stage change \u2192 enable scroll"
      },
      "engine": {
        "role": "blueprint_author",
        "writes": [
          "blueprint"
        ],
        "forbidden": [
          "gpuDraw"
        ],
        "blueprintFields": [
          "atmosphericPositions",
          "text3DPositions",
          "tierData",
          "sizeMultiplier",
          "opacityData",
          "atlasIndex",
          "animationSeed",
          "activeCount",
          "particleCount",
          "maxParticles",
          "metadata"
        ],
        "opening": {
          "emergence": {
            "target": "random_to_random_gas_cloud",
            "blueprintEventMode": "emergence"
          }
        }
      },
      "renderer": {
        "role": "dumb_renderer",
        "writes": [
          "geometry",
          "uniforms"
        ],
        "forbidden": [
          "fabricateTargets",
          "readScroll",
          "scaleByFov"
        ],
        "singleWriter": true,
        "emits": [
          "ENGINE_VIEWPORT_HINT",
          "PARTICLES_EMERGED"
        ],
        "emitOnceFencepost": true,
        "notes": "Emit ENGINE_VIEWPORT_HINT at mount/resize; bind emergence/full blueprints; emit PARTICLES_EMERGED exactly once after the first full genesis bind; may apply subtle mesh rotation during chaos window when PARTICLES_START_EMERGING is received."
      },
      "beatBus": {
        "role": "event_bus",
        "exposedGlobals": [
          "BeatBus",
          "EVENTS"
        ]
      },
      "scrollOrchestrator": {
        "role": "progress_publisher",
        "writes": [
          "eventsOnly"
        ],
        "forbidden": [
          "geometry",
          "uniforms"
        ],
        "notes": "Maps window scroll\u2192stage-local progress; publishes MORPH_PROGRESS; emits STAGE_CHANGE at breakpoints and MEMORY_FRAGMENT_TRIGGER from per-stage triggerPercent. Renderer remains a dumb sink."
      }
    },
    "singleWriterRules": [
      "Renderer is the ONLY geometry/uniform writer",
      "Engine is the ONLY blueprint author",
      "Director NEVER writes geometry/uniforms"
    ]
  },
  "shaderContract": {
    "attributes": [
      {
        "name": "position",
        "type": "vec3",
        "semantics": "current position"
      },
      {
        "name": "atmosphericPosition",
        "type": "vec3",
        "semantics": "morph source"
      },
      {
        "name": "text3DPosition",
        "type": "vec3",
        "semantics": "morph target (stage word)"
      },
      {
        "name": "tierData",
        "type": "float",
        "range": [
          0,
          3
        ],
        "semantics": "tier id"
      },
      {
        "name": "sizeMultiplier",
        "type": "float",
        "semantics": "sprite scaling per particle"
      },
      {
        "name": "opacityData",
        "type": "float",
        "semantics": "base opacity per particle"
      },
      {
        "name": "atlasIndex",
        "type": "float",
        "semantics": "sprite index in atlas"
      },
      {
        "name": "animationSeed",
        "type": "vec3",
        "semantics": "per-particle randomization"
      },
      {
        "name": "particleIndex",
        "type": "float",
        "semantics": "0..N-1 (renderer-added)"
      }
    ],
    "uniforms": [
      {
        "name": "uTime",
        "type": "float"
      },
      {
        "name": "uMorphProgress",
        "type": "float",
        "range": [
          0,
          1
        ],
        "semantics": "0=atmospheric,1=text"
      },
      {
        "name": "uScrollProgress",
        "type": "float",
        "range": [
          0,
          1
        ]
      },
      {
        "name": "uStageIndex",
        "type": "int"
      },
      {
        "name": "uActiveCount",
        "type": "int"
      },
      {
        "name": "uTierCutoff",
        "type": "int"
      },
      {
        "name": "uColorCurrent",
        "type": "vec3"
      },
      {
        "name": "uColorNext",
        "type": "vec3"
      },
      {
        "name": "uColorAccent1",
        "type": "vec3"
      },
      {
        "name": "uColorAccent2",
        "type": "vec3"
      },
      {
        "name": "uAtlasTexture",
        "type": "sampler2D"
      },
      {
        "name": "uTotalSprites",
        "type": "int",
        "value": 16
      },
      {
        "name": "uPointSize",
        "type": "float"
      },
      {
        "name": "uDevicePixelRatio",
        "type": "float"
      },
      {
        "name": "uResolution",
        "type": "vec2"
      },
      {
        "name": "uGaussianSigma",
        "type": "float"
      },
      {
        "name": "uTierHighlight",
        "type": "float[4]"
      },
      {
        "name": "uGaussianFalloff",
        "type": "float"
      },
      {
        "name": "uCenterWeighting",
        "type": "float"
      },
      {
        "name": "uStageProgress",
        "type": "float",
        "aliasOf": "uMorphProgress"
      },
      {
        "name": "uStageBlend",
        "type": "float",
        "aliasOf": "uScrollProgress"
      },
      {
        "name": "uChaosSpin",
        "type": "float",
        "optional": true,
        "semantics": "radians/sec multiplier during chaos"
      },
      {
        "name": "uTrailIntensity",
        "type": "float",
        "optional": true
      },
      {
        "name": "uTrailPersistence",
        "type": "float",
        "optional": true
      },
      {
        "name": "uBrightnessBoost",
        "type": "float",
        "optional": true
      }
    ]
  },
  "events": [
    {
      "name": "ENGINE_VIEWPORT_HINT",
      "emitter": "Renderer",
      "payload": {
        "width": "int",
        "height": "int",
        "aspect": "float"
      }
    },
    {
      "name": "PREWARM_GENESIS_BLUEPRINT",
      "emitter": "Director"
    },
    {
      "name": "PREWARM_COMPLETE",
      "emitter": "Engine",
      "payload": {
        "key": "string"
      }
    },
    {
      "name": "AUDIO_COMPUTER_HUM",
      "emitter": "Director",
      "payload": {
        "volume": "float[0..1]"
      }
    },
    {
      "name": "CURSOR_SHOW",
      "emitter": "Director"
    },
    {
      "name": "CURSOR_BLINK",
      "emitter": "Director",
      "payload": {
        "count": "int",
        "interval": "ms"
      }
    },
    {
      "name": "TERMINAL_TYPE",
      "emitter": "Director",
      "payload": {
        "lines": "string[]",
        "typeSpeed": "ms",
        "lineDelay": "ms"
      }
    },
    {
      "name": "SCREEN_FILL",
      "emitter": "Director",
      "payload": {
        "text": "string",
        "scrollSpeed": "ms"
      }
    },
    {
      "name": "BUILD_EMERGENCE_BLUEPRINT",
      "emitter": "Director",
      "payload": {
        "sourceText": "string",
        "count": "int"
      }
    },
    {
      "name": "BLUEPRINT_READY",
      "emitter": "Engine",
      "payload": {
        "stage": "string",
        "mode": "string|null"
      }
    },
    {
      "name": "PARTICLES_START_EMERGING",
      "emitter": "Director"
    },
    {
      "name": "PARTICLES_EMERGED",
      "emitter": "Renderer",
      "semantics": "emit_once_after_first_full_genesis_bind"
    },
    {
      "name": "STAGE_CHANGE",
      "emitter": "Director",
      "payload": {
        "stage": "string"
      }
    },
    {
      "name": "ENABLE_SCROLL",
      "emitter": "Director"
    },
    {
      "name": "QUALITY_CHANGE",
      "emitter": "Director",
      "payload": {
        "tier": "LOW|MEDIUM|HIGH|ULTRA"
      }
    },
    {
      "name": "MORPH_PROGRESS",
      "emitter": "Director",
      "payload": {
        "value": "float[0..1]"
      }
    },
    {
      "name": "START_NARRATIVE",
      "emitter": "Director",
      "payload": {
        "stage": "string"
      }
    },
    {
      "name": "AUDIO_START_STAGE",
      "emitter": "Director",
      "payload": {
        "stage": "string"
      }
    },
    {
      "name": "MORPH_TO_BEATGLYPH",
      "emitter": "Director",
      "payload": {
        "text": "string"
      }
    },
    {
      "name": "MEMORY_FRAGMENT_TRIGGER",
      "emitter": "Director",
      "payload": {
        "id": "string"
      }
    }
  ],
  "opening": {
    "rules": {
      "startAfterViewportHint": true,
      "stage0ColorLock": true,
      "scrollLockedUntil": "ENABLE_SCROLL",
      "emergenceModeRequired": true
    },
    "skipKey": "SPACE",
    "totalDurationMs": 12500,
    "timeline": {
      "blackout": {
        "durationMs": 2000
      },
      "cursor": {
        "blinkCount": 2,
        "intervalMs": 500
      },
      "typing": {
        "lines": [
          "SYSTEM BOOTING...",
          "LOADING MEMORY FRAGMENTS...",
          "READY.",
          "10 PRINT \"HELLO CURTIS\"",
          "20 GOTO 10",
          "RUN"
        ],
        "typeSpeed": 50,
        "lineDelay": 500,
        "completionDelayMs": 800
      },
      "fill": {
        "text": "HELLO CURTIS ",
        "scrollSpeed": 100,
        "durationMs": 2000
      },
      "emergence": {
        "durationMs": 2000,
        "waitForFencepost": true,
        "maxWaitMs": 5000,
        "stabilizeMs": 500,
        "skipMorphAnimation": false,
        "skipGenesisBlueprint": true,
        "targetState": "genesis_initial"
      },
      "profile": "chaos_coalesce_settle_v1",
      "prologue": {
        "terminalOverlay": true,
        "fadeOutAtMs": 0
      },
      "chaos": {
        "enabled": true,
        "durationMs": 2000,
        "rendererSpin": {
          "z": 0.55,
          "y": 0.25
        }
      },
      "coalesce": {
        "enabled": true,
        "durationMs": 2000,
        "morphTo": 0.6
      },
      "settle": {
        "enabled": true,
        "durationMs": 1500,
        "morphTo": 1.0,
        "constellationCoverage": [
          0.95,
          0.8,
          0.6,
          0.45
        ]
      },
      "narration": {
        "startAtMs": 13000,
        "events": [
          "START_NARRATIVE",
          "AUDIO_START_STAGE"
        ]
      },
      "beatGlyph": {
        "revealMs": 9500,
        "text": "GENESIS"
      }
    },
    "emergence": {
      "target": "random_to_random_gas_cloud",
      "mode": "emergence",
      "source": "viewportSpread"
    }
  },
  "openingFencepost": {
    "order": [
      "ENGINE_VIEWPORT_HINT (Renderer)",
      "PREWARM_GENESIS_BLUEPRINT (Director)",
      "TERMINAL_TYPE / SCREEN_FILL (Director, optional overlay)",
      "PARTICLES_START_EMERGING (Director)",
      "BLUEPRINT_READY { mode:'emergence', stage:'genesis' } (Engine)",
      "BLUEPRINT_READY { stage:'genesis' } full (Engine)",
      "PARTICLES_EMERGED (Renderer, emit_once)",
      "STAGE_CHANGE { stage:'genesis' } (Director)",
      "MORPH_PROGRESS settle \u2192 1.0 (Director)",
      "ENABLE_SCROLL (Director)",
      "START_NARRATIVE { stage:'genesis' } & AUDIO_START_STAGE { stage:'genesis' } (Director)"
    ]
  },
  "openingRules": {
    "startAfterViewportHint": true,
    "stage0ColorLock": true,
    "scrollLockedUntil": "ENABLE_SCROLL",
    "emergenceModeRequired": true
  },
  "quality": {
    "multipliers": {
      "LOW": 0.3,
      "MEDIUM": 0.6,
      "HIGH": 1,
      "ULTRA": 1.5
    },
    "maxParticles": 15000
  },
  "scrollAndMorph": {
    "stageBreakpointsPercent": [
      0,
      14,
      28,
      42,
      56,
      70,
      84,
      100
    ],
    "easing": "exponential_inout_edges",
    "morphResponse": {
      "speedMultiplier": 2,
      "smoothing": 0.15,
      "overshoot": 0.05
    },
    "stageEntry": {
      "neural": {
        "durationMs": 5000,
        "skipMorphAnimation": false,
        "start": 0,
        "target": 1
      }
    },
    "ownership": {
      "publisher": "Director",
      "rendererReadsScroll": false
    }
  },
  "spriteSemantics": {
    "substrate": 7,
    "spatialCircles": [
      0,
      1
    ],
    "anchorDiamond": 4,
    "anchorCrystal": 11,
    "star": 6,
    "burst": 13,
    "galaxy": 15
  },
  "stageOrder": [
    "genesis",
    "discipline",
    "neural",
    "velocity",
    "architecture",
    "harmony",
    "transcendence"
  ],
  "stages": {
    "genesis": {
      "label": "GENESIS SPARK",
      "ordinal": 0,
      "scrollRangePercent": [
        0,
        14
      ],
      "particlesBase": 2000,
      "word": "GENESIS",
      "palette": [
        "#00FF00",
        "#22c55e",
        "#15803d"
      ],
      "tierMix": [
        0.6,
        0.2,
        0.1,
        0.1
      ],
      "motionBehaviors": {
        "tier0": "drift_perlin_slow",
        "tier1": "orbital_micro",
        "tier2": "twinkle_soft",
        "tier3": "pulse_soft"
      },
      "camera": {
        "initial": {
          "position": { "x": 0, "y": 0, "z": 5 },
          "lookAt": { "x": 0, "y": 0, "z": 0 }
        },
        "movement": {
          "type": "static",
          "description": "Fixed camera during emergence"
        },
        "reveal": {
          "timing": 8000,
          "duration": 2000,
          "target": { "x": 0.8, "y": 0.5, "z": 4.5 },
          "easing": "easeInOutQuad",
          "description": "Subtle 15° rotation to show depth"
        },
        "keyframes": []
      },
      "morphProfile": {
        "arrival": 1,
        "easing": "smoothstep",
        "elasticity": {
          "amplitude": 0,
          "frequency": 0
        }
      },
      "memoryFragments": {
        "ambient": [
          {
            "id": "genesis_context",
            "triggerPercent": 5,
            "trigger": {
              "percent": 5
            },
            "position": {
              "anchor": "bottomLeft"
            },
            "content": {
              "text": "1983 \u2022 Dallas, Texas \u2022 Age 8",
              "fontSize": 14,
              "color": "#22c55e"
            },
            "timing": {
              "fadeIn": 1000,
              "persist": 5000,
              "fadeOut": 1000
            },
            "type": "annotation",
            "duration": 5000
          }
        ],
        "interactive": {
          "id": "genesis_code",
          "hotspot": "letter_H",
          "content": {
            "image": "commodore64-screen.png",
            "caption": "10 PRINT \"HELLO CURTIS\"\\n20 GOTO 10\\nRUN"
          },
          "particleEffect": {
            "behavior": "crtFlicker",
            "duration": 1200
          }
        },
        "climax": null
      },
      "boundaryCues": {
        "preTransitionPercent": [
          12,
          14
        ],
        "tintCrossfadeToStage": "discipline"
      },
      "audio": {
        "bed": "1980s_computer_hum",
        "narrationCue": "onEmergenceThreshold"
      },
      "openingNote": "Opening shot list (implemented using the contracts above)",
      "openingTimeline": {
        "profile": "chaos_coalesce_settle_v1",
        "prologue": {
          "terminalOverlay": true,
          "fadeOutAtMs": 0
        },
        "chaos": {
          "enabled": true,
          "durationMs": 2000,
          "rendererSpin": {
            "z": 0.55,
            "y": 0.25
          }
        },
        "coalesce": {
          "enabled": true,
          "durationMs": 2000,
          "morphTo": 0.6
        },
        "settle": {
          "enabled": true,
          "durationMs": 1500,
          "morphTo": 1.0,
          "constellationCoverage": [
            0.95,
            0.8,
            0.6,
            0.45
          ]
        },
        "narration": {
          "startAtMs": 13000,
          "events": [
            "START_NARRATIVE",
            "AUDIO_START_STAGE"
          ]
        },
        "beatGlyph": {
          "revealMs": 9500,
          "text": "HELLO CURTIS"
        }
      }
    },
    "discipline": {
      "label": "DISCIPLINE FORGE",
      "ordinal": 1,
      "scrollRangePercent": [
        14,
        28
      ],
      "particlesBase": 3000,
      "word": "STRUCTURE",
      "palette": [
        "#1e40af",
        "#3b82f6",
        "#1d4ed8"
      ],
      "tierMix": [
        0.55,
        0.25,
        0.1,
        0.1
      ],
      "motionBehaviors": {
        "tier0": "grid_drift",
        "tier1": "column_orbit",
        "tier2": "pulse_cadence_120bpm",
        "tier3": "crystalline_authority"
      },
      "camera": {
        "initial": {
          "position": { "x": 0, "y": -1, "z": 5 },
          "lookAt": { "x": 0, "y": 0, "z": 0 }
        },
        "movement": {
          "type": "orbit",
          "axis": "y",
          "degrees": 10,
          "duration": 35000,
          "speed": 0.1,
          "easing": "linear",
          "description": "Slow orbit to reveal structure"
        },
        "keyframes": [
          { "time": 0, "position": { "x": 0, "y": -1, "z": 5 } },
          { "time": 35000, "position": { "x": 1.5, "y": -1, "z": 4.5 } }
        ]
      },
      "morphProfile": {
        "arrival": 1,
        "easing": "smoothstep",
        "elasticity": {
          "amplitude": 0,
          "frequency": 0
        }
      },
      "memoryFragments": {
        "ambient": [
          {
            "id": "discipline_context",
            "triggerPercent": 18,
            "trigger": {
              "percent": 18
            },
            "position": {
              "anchor": "topLeft"
            },
            "content": {
              "text": "1998 \u2022 Parris Island \u2022 Discipline Forged",
              "fontSize": 14,
              "color": "#3b82f6"
            },
            "timing": {
              "fadeIn": 1000,
              "persist": 5000,
              "fadeOut": 1000
            },
            "type": "annotation",
            "duration": 5000
          }
        ],
        "interactive": {
          "id": "discipline_emblem",
          "hotspot": "letter_S",
          "content": {
            "image": "discipline-ega.png",
            "caption": "Honor. Courage. Commitment."
          },
          "particleEffect": {
            "behavior": "snapFormation",
            "duration": 1000
          }
        },
        "climax": null
      }
    },
    "neural": {
      "label": "NEURAL AWAKENING",
      "ordinal": 2,
      "scrollRangePercent": [
        28,
        42
      ],
      "particlesBase": 5000,
      "word": "AWAKENING",
      "palette": [
        "#4338ca",
        "#a855f7",
        "#7c3aed"
      ],
      "tierMix": [
        0.55,
        0.2,
        0.15,
        0.1
      ],
      "motionBehaviors": {
        "tier0": "neural_flow",
        "tier1": "connection_orbit",
        "tier2": "synapse_flash_prob_0.02",
        "tier3": "hub_nodes_temporal"
      },
      "camera": {
        "initial": {
          "position": { "x": 0, "y": 0, "z": 5 },
          "lookAt": { "x": 0, "y": 0, "z": 0 }
        },
        "movement": {
          "type": "orbit_discovery",
          "axis": "xy",
          "degrees": 15,
          "duration": 30000,
          "speed": 0.3,
          "wobble": 0.1,
          "easing": "easeInOutSine",
          "description": "Curious orbital movement revealing connections"
        },
        "keyframes": [
          { "time": 0, "position": { "x": 0, "y": 0, "z": 5 } },
          { "time": 10000, "position": { "x": 1, "y": 0.5, "z": 4.8 } },
          { "time": 20000, "position": { "x": -0.5, "y": -0.3, "z": 5.2 } },
          { "time": 30000, "position": { "x": 0, "y": 0, "z": 5 } }
        ]
      },
      "uniformOverrides": {
        "uGaussianSigma": 2
      },
      "memoryFragments": {
        "ambient": [
          {
            "id": "neural_context",
            "triggerPercent": 34,
            "trigger": {
              "percent": 34
            },
            "position": {
              "anchor": "topRight"
            },
            "content": {
              "text": "2005 \u2022 Austin, Texas \u2022 Neural Spark",
              "fontSize": 14,
              "color": "#a855f7"
            },
            "timing": {
              "fadeIn": 1000,
              "persist": 5000,
              "fadeOut": 1000
            },
            "type": "annotation",
            "duration": 5000
          }
        ],
        "interactive": {
          "id": "neural_interface",
          "hotspot": "cluster_alpha",
          "content": {
            "image": "neural-diagram.png",
            "caption": "First machine learning prototype came alive in MATLAB."
          },
          "particleEffect": {
            "behavior": "neuralPulse",
            "duration": 1400
          }
        },
        "climax": null
      }
    },
    "velocity": {
      "label": "VELOCITY EXPLOSION",
      "ordinal": 3,
      "scrollRangePercent": [
        42,
        56
      ],
      "particlesBase": 12000,
      "word": "VELOCITY",
      "palette": [
        "#7c3aed",
        "#9333ea",
        "#6b21a8"
      ],
      "tierMix": [
        0.45,
        0.2,
        0.15,
        0.2
      ],
      "motionBehaviors": {
        "tier0": "storm_medium",
        "tier1": "streak_trail",
        "tier2": "burst_on_beat",
        "tier3": "lightning_global"
      },
      "camera": {
        "initial": {
          "position": { "x": 0, "y": 0, "z": 6 },
          "lookAt": { "x": 0, "y": 0, "z": 0 }
        },
        "movement": {
          "type": "dolly_push",
          "startZ": 6,
          "endZ": 4,
          "duration": 40000,
          "easing": "easeInQuad",
          "shake": {
            "enabled": true,
            "amplitude": 0.1,
            "frequency": 5
          },
          "description": "Dramatic push-in with energy shake"
        },
        "keyframes": [
          { "time": 0, "position": { "x": 0, "y": 0, "z": 6 } },
          { "time": 20000, "position": { "x": 0, "y": 0, "z": 5 } },
          { "time": 40000, "position": { "x": 0, "y": 0, "z": 4 } }
        ]
      },
      "morphProfile": {
        "arrival": 1,
        "easing": "smoothstep",
        "elasticity": {
          "amplitude": 0.05,
          "frequency": 0.5
        }
      },
      "memoryFragments": {
        "ambient": [
          {
            "id": "velocity_context",
            "triggerPercent": 48,
            "trigger": {
              "percent": 48
            },
            "position": {
              "anchor": "bottomRight"
            },
            "content": {
              "text": "2012 \u2022 Silicon Valley \u2022 Launch Velocity",
              "fontSize": 14,
              "color": "#9333ea"
            },
            "timing": {
              "fadeIn": 1000,
              "persist": 5000,
              "fadeOut": 1000
            },
            "type": "annotation",
            "duration": 5000
          }
        ],
        "interactive": {
          "id": "velocity_launch",
          "hotspot": "orbit_path",
          "content": {
            "image": "launch-dashboard.png",
            "caption": "Realtime analytics firing across 12 markets."
          },
          "particleEffect": {
            "behavior": "hyperdriveBurst",
            "duration": 1100
          }
        },
        "climax": null
      }
    },
    "architecture": {
      "label": "ARCHITECTURE CONSCIOUSNESS",
      "ordinal": 4,
      "scrollRangePercent": [
        56,
        70
      ],
      "particlesBase": 8000,
      "word": "SYSTEMS",
      "palette": [
        "#0891b2",
        "#06b6d4",
        "#0e7490"
      ],
      "tierMix": [
        0.5,
        0.2,
        0.15,
        0.15
      ],
      "motionBehaviors": {
        "tier0": "grid_flow",
        "tier1": "scaffold_layers_3",
        "tier2": "blueprint_pulse",
        "tier3": "cornerstone_nodes_frontal"
      },
      "camera": {
        "initial": {
          "position": { "x": 3, "y": 3, "z": 5 },
          "lookAt": { "x": 0, "y": 0, "z": 0 }
        },
        "movement": {
          "type": "isometric_track",
          "pattern": "blueprint",
          "degrees": 12,
          "duration": 35000,
          "easing": "linear",
          "description": "Isometric view revealing system structure"
        },
        "keyframes": [
          { "time": 0, "position": { "x": 3, "y": 3, "z": 5 } },
          { "time": 17500, "position": { "x": -3, "y": 3, "z": 5 } },
          { "time": 35000, "position": { "x": 3, "y": 3, "z": 5 } }
        ]
      },
      "morphProfile": {
        "arrival": 1,
        "easing": "smoothstep",
        "elasticity": {
          "amplitude": 0,
          "frequency": 0
        }
      },
      "memoryFragments": {
        "ambient": [
          {
            "id": "architecture_context",
            "triggerPercent": 62,
            "trigger": {
              "percent": 62
            },
            "position": {
              "anchor": "center",
              "offset": {
                "x": 220,
                "y": 0
              }
            },
            "content": {
              "text": "2016 \u2022 Seattle \u2022 Systems Reforged",
              "fontSize": 14,
              "color": "#06b6d4"
            },
            "timing": {
              "fadeIn": 1000,
              "persist": 5000,
              "fadeOut": 1000
            },
            "type": "annotation",
            "duration": 5000
          }
        ],
        "interactive": {
          "id": "architecture_blueprint",
          "hotspot": "pillar_one",
          "content": {
            "image": "system-blueprint.png",
            "caption": "Layered fault-tolerant mesh with self-healing edges."
          },
          "particleEffect": {
            "behavior": "schematicReveal",
            "duration": 1300
          }
        },
        "climax": null
      }
    },
    "harmony": {
      "label": "HARMONIC MASTERY",
      "ordinal": 5,
      "scrollRangePercent": [
        70,
        84
      ],
      "particlesBase": 12000,
      "word": "FLOW STATE",
      "palette": [
        "#f59e0b",
        "#d97706",
        "#b45309"
      ],
      "tierMix": [
        0.5,
        0.2,
        0.15,
        0.15
      ],
      "motionBehaviors": {
        "tier0": "laminar_flow",
        "tier1": "orbit_sync_groups_4",
        "tier2": "ballet_fibonacci",
        "tier3": "conductor_nodes_cerebellar"
      },
      "camera": {
        "initial": {
          "position": { "x": 0, "y": 0, "z": 5 },
          "lookAt": { "x": 0, "y": 0, "z": 0 }
        },
        "movement": {
          "type": "balletic_orbit",
          "axis": "xyz",
          "degrees": 25,
          "duration": 40000,
          "speed": 0.2,
          "smooth": 0.98,
          "easing": "easeInOutCubic",
          "description": "Graceful 3-axis ballet revealing golden ratio"
        },
        "keyframes": [
          { "time": 0, "position": { "x": 0, "y": 0, "z": 5 } },
          { "time": 10000, "position": { "x": 2, "y": 1, "z": 4.5 } },
          { "time": 20000, "position": { "x": 0, "y": 2, "z": 5.5 } },
          { "time": 30000, "position": { "x": -2, "y": 1, "z": 4.5 } },
          { "time": 40000, "position": { "x": 0, "y": 0, "z": 5 } }
        ]
      },
      "morphProfile": {
        "arrival": 0.95,
        "easing": "smoothstep",
        "elasticity": {
          "amplitude": 0.05,
          "frequency": 0.2
        }
      },
      "memoryFragments": {
        "ambient": [
          {
            "id": "harmony_context",
            "triggerPercent": 78,
            "trigger": {
              "percent": 78
            },
            "position": {
              "anchor": "center",
              "offset": {
                "x": 0,
                "y": -260
              }
            },
            "content": {
              "text": "2021 \u2022 Remote \u2022 Human + AI Ensemble",
              "fontSize": 14,
              "color": "#f59e0b"
            },
            "timing": {
              "fadeIn": 1000,
              "persist": 5000,
              "fadeOut": 1000
            },
            "type": "annotation",
            "duration": 5000
          }
        ],
        "interactive": {
          "id": "harmony_resonance",
          "hotspot": "orbit_chorus",
          "content": {
            "image": "harmony-waveform.png",
            "caption": "Balanced signal routing for conscious UI."
          },
          "particleEffect": {
            "behavior": "resonantGlow",
            "duration": 1500
          }
        },
        "climax": null
      }
    },
    "transcendence": {
      "label": "CONSCIOUSNESS TRANSCENDENCE",
      "ordinal": 6,
      "scrollRangePercent": [
        84,
        100
      ],
      "particlesBase": 15000,
      "word": "CONSCIOUSNESS",
      "palette": [
        "#ffffff",
        "#f59e0b",
        "#00ffcc"
      ],
      "tierMix": [
        0.5,
        0.2,
        0.15,
        0.15
      ],
      "motionBehaviors": {
        "tier0": "cosmic_dust_galaxy",
        "tier1": "galactic_arm_slow",
        "tier2": "consciousness_node_unified",
        "tier3": "transcendent_swarm"
      },
      "camera": {
        "initial": {
          "position": { "x": 0, "y": 0, "z": 5 },
          "lookAt": { "x": 0, "y": 0, "z": 0 }
        },
        "movement": {
          "type": "reverent_orbit",
          "axis": "y",
          "degrees": 30,
          "duration": 50000,
          "speed": 0.15,
          "pullback": {
            "enabled": true,
            "from": 5,
            "to": 7,
            "startTime": 35000,
            "duration": 10000,
            "easing": "easeOutQuad"
          },
          "description": "Slow orbit with reverent pullback for full view"
        },
        "keyframes": [
          { "time": 0, "position": { "x": 0, "y": 0, "z": 5 } },
          { "time": 25000, "position": { "x": 2.5, "y": 0, "z": 5 } },
          { "time": 35000, "position": { "x": 0, "y": 0, "z": 5 } },
          { "time": 45000, "position": { "x": 0, "y": 0, "z": 7 } }
        ]
      },
      "climax": {
        "arrivalMorph": 1,
        "dissolveAfterMs": 1800,
        "dissolveMorph": 0.6,
        "increaseSwirl": true
      },
      "morphProfile": {
        "arrival": 0.95,
        "easing": "smoothstep",
        "elasticity": {
          "amplitude": 0.05,
          "frequency": 0.2
        }
      },
      "hud": {
        "liveCounterText": "15,000 conscious moments"
      },
      "memoryFragments": {
        "ambient": [
          {
            "id": "transcendence_context",
            "triggerPercent": 92,
            "trigger": {
              "percent": 92
            },
            "position": {
              "anchor": "center",
              "offset": {
                "x": 0,
                "y": 220
              }
            },
            "content": {
              "text": "2025 \u2022 Worldwide \u2022 Conscious Collective",
              "fontSize": 14,
              "color": "#00ffcc"
            },
            "timing": {
              "fadeIn": 1000,
              "persist": 6000,
              "fadeOut": 1000
            },
            "type": "annotation",
            "duration": 6000
          }
        ],
        "interactive": {
          "id": "transcendence_portal",
          "hotspot": "galaxy_core",
          "content": {
            "image": "transcendence-portal.png",
            "caption": "Particles align into living memory constellations."
          },
          "particleEffect": {
            "behavior": "starlightCascade",
            "duration": 1600
          }
        },
        "climax": {
          "id": "transcendence_reveal",
          "trigger": {
            "type": "timeline",
            "time": 35000
          },
          "sequence": [
            {
              "action": "dissolve",
              "duration": 2000
            },
            {
              "action": "formPortrait",
              "duration": 3000,
              "hold": 2000
            },
            {
              "action": "reformText",
              "text": "CURTIS WHORTON",
              "duration": 2000
            },
            {
              "action": "reformText",
              "text": "AI-NATIVE ENGINEER",
              "duration": 2000
            },
            {
              "action": "formQRCode",
              "url": "https://curtisworton.com",
              "duration": 3000
            }
          ]
        }
      }
    }
  },
  "visual": {
    "system": "3d_kinetic_typography",
    "letterGeometry": {
      "genesis": {
        "word": "GENESIS",
        "font": "Courier Prime",
        "weight": 400,
        "depth": 0.3,
        "particlesPerLetter": 167,
        "spacing": 1.2,
        "scale": 1.0
      },
      "discipline": {
        "word": "STRUCTURE",
        "font": "Inter",
        "weight": 900,
        "depth": 0.8,
        "particlesPerLetter": 333,
        "spacing": 1.0,
        "scale": 1.1
      },
      "neural": {
        "word": "AWAKENING",
        "font": "Playfair Display",
        "weight": 600,
        "depth": 0.5,
        "particlesPerLetter": 556,
        "spacing": 1.1,
        "scale": 1.05
      },
      "velocity": {
        "word": "VELOCITY",
        "font": "Archivo Black",
        "weight": 900,
        "depth": 0.4,
        "particlesPerLetter": 1500,
        "spacing": 0.95,
        "scale": 1.15
      },
      "architecture": {
        "word": "SYSTEMS",
        "font": "JetBrains Mono",
        "weight": 500,
        "depth": 0.6,
        "particlesPerLetter": 1143,
        "spacing": 1.15,
        "scale": 1.0
      },
      "harmony": {
        "word": "FLOW STATE",
        "font": "Cormorant Garamond",
        "weight": 600,
        "depth": 0.5,
        "particlesPerLetter": 1200,
        "spacing": 1.08,
        "scale": 1.0
      },
      "transcendence": {
        "word": "CONSCIOUSNESS",
        "font": "Montserrat",
        "weight": 300,
        "depth": 0.7,
        "particlesPerLetter": 1154,
        "spacing": 1.05,
        "scale": 1.2
      }
    },
    "transitions": {
      "dissolveDuration": 1500,
      "reformDuration": 1500,
      "silenceDuration": 500,
      "description": "Stage-to-stage morph timings in milliseconds"
    },
    "stageWords": {
      "genesis": "GENESIS",
      "discipline": "STRUCTURE",
      "neural": "AWAKENING",
      "velocity": "VELOCITY",
      "architecture": "SYSTEMS",
      "harmony": "FLOW STATE",
      "transcendence": "CONSCIOUSNESS"
    },
    "camera": {
      "genesis": {
        "initial": {
          "x": 0,
          "y": 0,
          "z": 5
        },
        "reveal": {
          "timing": 8000,
          "duration": 2000,
          "target": {
            "x": 0.8,
            "y": 0.5,
            "z": 4.5
          }
        }
      },
      "velocity": {
        "movement": "dramatic_push",
        "startZ": 6,
        "endZ": 4,
        "shake": {
          "amplitude": 0.1,
          "frequency": 5
        },
        "duration": 40000
      },
      "discipline": {
        "angle": {
          "x": -20,
          "y": 0,
          "z": 5
        },
        "movement": "orbit_slow",
        "degrees": 10
      }
    }
  },
  "narrative": {
    "orchestration": {
      "mode": "narration-driven",
      "scrollLocked": true,
      "skipKey": "SPACE"
    },
    "beatSheets": {
      "genesis": {
        "totalDuration": 30000,
        "beats": [
          {
            "time": 1000,
            "narration": {
              "text": "Before the spark, before the system — there was curiosity.",
              "duration": 3000,
              "type": "chapter"
            },
            "visual": "gentle_drift"
          },
          {
            "time": 4000,
            "narration": {
              "text": "The Texas heat was finally breaking, and through my friend's window, that golden hour light made everything feel... possible.",
              "duration": 6000,
              "type": "context"
            },
            "visual": "no_change"
          },
          {
            "time": 10000,
            "narration": {
              "text": "His mom had this programming book. The computer - a Commodore 64 - sat there like some kind of oracle. Waiting.",
              "duration": 6000,
              "type": "context"
            },
            "visual": "tier3_subtle_pulse"
          },
          {
            "time": 16000,
            "narration": {
              "text": "I typed those lines exactly as the book showed. When I pressed RUN and the screen came alive...",
              "duration": 5000,
              "type": "important"
            },
            "visual": "tier2_flicker_increase"
          },
          {
            "time": 22000,
            "narration": {
              "text": "...something lit up inside me. A spark that would wait 39 years to fully ignite.",
              "duration": 5000,
              "type": "important"
            },
            "visual": "tier3_glow_pulse"
          }
        ]
      },
      "discipline": {
        "totalDuration": 35000,
        "beats": [
          {
            "time": 2000,
            "narration": {
              "text": "That spark? It got buried. Had to.",
              "duration": 3000
            },
            "visual": "reform_as_structure"
          },
          {
            "time": 5000,
            "narration": {
              "text": "Home was chaos - unpredictable, unsafe. But then came the Marines. Everything changed.",
              "duration": 6000
            },
            "visual": "particles_begin_columns"
          },
          {
            "time": 11000,
            "narration": {
              "text": "'Adapt and overcome.' More than a motto - it became my operating system.",
              "duration": 5000
            },
            "visual": "tier2_lock_into_grid"
          },
          {
            "time": 16000,
            "narration": {
              "text": "The chaos didn't disappear, but now I had a framework. Structure. Discipline.",
              "duration": 5000
            },
            "visual": "tier3_cadence_pulse"
          },
          {
            "time": 21000,
            "narration": {
              "text": "For 39 years, I built systems. Logistics. Finance. Operations. Always solving, always building.",
              "duration": 6000
            },
            "visual": "breathing_rhythm"
          },
          {
            "time": 29000,
            "narration": {
              "text": "...that eight-year-old's spark never died. It was just waiting for the right moment to reignite.",
              "duration": 5000
            },
            "visual": "flicker_fade_back_to_blue"
          }
        ]
      },
      "neural": {
        "totalDuration": 40000,
        "beats": [
          {
            "time": 2000,
            "narration": {
              "text": "February 2022. I'm sitting in front of my laptop, staring at ChatGPT for the first time.",
              "duration": 5000
            },
            "visual": "reform_as_flow"
          },
          {
            "time": 7000,
            "narration": {
              "text": "It answered a question I'd been wrestling with for weeks. Not just answered - understood. Anticipated. Expanded.",
              "duration": 7000
            },
            "visual": "neural_pathways_light"
          },
          {
            "time": 14000,
            "narration": {
              "text": "Something fundamental shifted in that moment. This wasn't just a tool. This was a partner.",
              "duration": 5000
            },
            "visual": "tier3_synaptic_flash"
          },
          {
            "time": 19000,
            "narration": {
              "text": "I spent the next three years learning to think with AI. Not using it - thinking WITH it.",
              "duration": 6000
            },
            "visual": "connection_strengthen"
          },
          {
            "time": 25000,
            "narration": {
              "text": "Every project became a conversation. Every problem became a collaboration. Every solution emerged from synthesis.",
              "duration": 7000
            },
            "visual": "tier2_pulse_sync"
          },
          {
            "time": 32000,
            "narration": {
              "text": "That eight-year-old's dream? It was finally coming true - but bigger than I ever imagined.",
              "duration": 6000
            },
            "visual": "genesis_callback_purple"
          }
        ]
      },
      "velocity": {
        "totalDuration": 45000,
        "beats": [
          {
            "time": 2000,
            "narration": {
              "text": "Then came the explosion.",
              "duration": 3000
            },
            "visual": "particles_accelerate"
          },
          {
            "time": 5000,
            "narration": {
              "text": "Projects that used to take six weeks? Done in six hours. Systems I'd spent months designing? Architected in an afternoon.",
              "duration": 7000
            },
            "visual": "streak_trails_form"
          },
          {
            "time": 12000,
            "narration": {
              "text": "February 2025. The breakthrough came with a single question to Claude: 'How would you architect this entire system?'",
              "duration": 7000
            },
            "visual": "tier3_lightning_burst"
          },
          {
            "time": 19000,
            "narration": {
              "text": "What emerged wasn't my system or Claude's system. It was OUR system - something neither of us could have built alone.",
              "duration": 7000
            },
            "visual": "fusion_pattern"
          },
          {
            "time": 26000,
            "narration": {
              "text": "Questions led to insights. Insights led to patterns. Patterns led to architectures. Every answer opened ten new doors.",
              "duration": 8000
            },
            "visual": "cascade_acceleration"
          },
          {
            "time": 34000,
            "narration": {
              "text": "I wasn't just moving faster. I was thinking differently. The constraint wasn't time anymore - it was imagination.",
              "duration": 8000
            },
            "visual": "velocity_peak"
          }
        ]
      },
      "architecture": {
        "totalDuration": 42000,
        "beats": [
          {
            "time": 2000,
            "narration": {
              "text": "But speed without structure is just chaos.",
              "duration": 4000
            },
            "visual": "blueprint_grid_emerge"
          },
          {
            "time": 6000,
            "narration": {
              "text": "I started seeing patterns everywhere. Not just in code - in systems, in processes, in how information flows.",
              "duration": 7000
            },
            "visual": "isometric_view_rotate"
          },
          {
            "time": 13000,
            "narration": {
              "text": "The Marine Corps taught me tactical systems. Business taught me operational systems. AI taught me cognitive systems.",
              "duration": 7000
            },
            "visual": "layer_stack_reveal"
          },
          {
            "time": 20000,
            "narration": {
              "text": "March 2025. I documented the entire MetaCurtis architecture in a Single Source of Truth. Every decision traceable. Every component validated.",
              "duration": 8000
            },
            "visual": "blueprint_complete"
          },
          {
            "time": 28000,
            "narration": {
              "text": "Constitutional Development Protocol. Velocity Stack. Probe History. Not just tools - a methodology. A way of building that guarantees quality at speed.",
              "duration": 9000
            },
            "visual": "tier3_construction_guide"
          },
          {
            "time": 37000,
            "narration": {
              "text": "This wasn't just software architecture anymore. This was a blueprint for human-AI collaboration.",
              "duration": 5000
            },
            "visual": "master_plan_glow"
          }
        ]
      },
      "harmony": {
        "totalDuration": 38000,
        "beats": [
          {
            "time": 2000,
            "narration": {
              "text": "And then something unexpected happened. Flow state.",
              "duration": 4000
            },
            "visual": "golden_ratio_spiral"
          },
          {
            "time": 6000,
            "narration": {
              "text": "The boundaries started dissolving. Not between me and the AI - between thinking and building.",
              "duration": 6000
            },
            "visual": "orbit_sync_begin"
          },
          {
            "time": 12000,
            "narration": {
              "text": "I'd describe a vision, Claude would architect it, I'd refine the architecture, Claude would implement it. Back and forth, faster and faster.",
              "duration": 8000
            },
            "visual": "ballet_choreography"
          },
          {
            "time": 20000,
            "narration": {
              "text": "Until it wasn't back and forth anymore. It was just... flow. One continuous creative process.",
              "duration": 6000
            },
            "visual": "phase_lock_achieve"
          },
          {
            "time": 26000,
            "narration": {
              "text": "Three years of collaboration compressed into pure creative velocity. Building, testing, refining - all in harmony.",
              "duration": 7000
            },
            "visual": "laminar_flow_perfect"
          },
          {
            "time": 33000,
            "narration": {
              "text": "This is what mastery feels like in the age of AI. Not replacing human creativity - amplifying it to impossible levels.",
              "duration": 5000
            },
            "visual": "golden_ratio_complete"
          }
        ]
      },
      "transcendence": {
        "totalDuration": 50000,
        "beats": [
          {
            "time": 2000,
            "narration": {
              "text": "And here we are. October 2025.",
              "duration": 3000
            },
            "visual": "cosmic_dust_swirl"
          },
          {
            "time": 5000,
            "narration": {
              "text": "From that eight-year-old typing 'HELLO CURTIS' on a Commodore 64, to this moment - building impossible things with AI.",
              "duration": 7000
            },
            "visual": "consciousness_nodes_pulse"
          },
          {
            "time": 12000,
            "narration": {
              "text": "Every experience led here. The Marine Corps discipline. The business systems. The AI partnership. The velocity breakthroughs.",
              "duration": 8000
            },
            "visual": "all_stages_echo"
          },
          {
            "time": 20000,
            "narration": {
              "text": "This visualization you're experiencing? Built with Claude in six weeks. Traditional team? Six months, maybe more.",
              "duration": 7000
            },
            "visual": "galactic_arm_rotate"
          },
          {
            "time": 27000,
            "narration": {
              "text": "But it's not about speed. It's about what becomes possible when human creativity and AI capability truly merge.",
              "duration": 7000
            },
            "visual": "unified_field"
          },
          {
            "time": 34000,
            "narration": {
              "text": "I'm not a traditional developer. I'm something new - an AI-native engineer. And this is just the beginning.",
              "duration": 7000
            },
            "visual": "transcendent_integration"
          },
          {
            "time": 41000,
            "narration": {
              "text": "What impossible thing can we build together?",
              "duration": 5000
            },
            "visual": "question_expand"
          }
        ]
      }
    }
  },
  "visualEffects": {
    "description": "Mapping of beat sheet visual verbs to camera/particle directives",
    "version": "1.0.0",
    "particleEffects": {
      "no_change": {
        "type": "static",
        "description": "Maintain current state"
      },
      "gentle_drift": {
        "type": "motion",
        "tiers": [
          0,
          1
        ],
        "behavior": "perlin_drift",
        "speed": 0.2,
        "amplitude": 0.3
      },
      "tier2_flicker_increase": {
        "type": "flicker",
        "tiers": [
          2
        ],
        "probability": 0.05,
        "duration": 200
      },
      "tier3_subtle_pulse": {
        "type": "pulse",
        "tiers": [
          3
        ],
        "frequency": 0.3,
        "intensity": 0.2
      },
      "tier3_sparkle": {
        "type": "sparkle",
        "tiers": [
          3
        ],
        "count": 50,
        "duration": 500
      },
      "tier3_glow_pulse": {
        "type": "pulse",
        "tiers": [
          3
        ],
        "frequency": 0.5,
        "intensity": 0.6,
        "glow": true
      },
      "settle_to_form": {
        "type": "converge",
        "tiers": [
          0,
          1,
          2,
          3
        ],
        "duration": 2000,
        "easing": "easeOutQuad"
      },
      "static_hold": {
        "type": "lock",
        "tiers": [
          0,
          1,
          2,
          3
        ],
        "rigidity": 1
      },
      "particles_begin_columns": {
        "type": "formation",
        "pattern": "column",
        "tiers": [
          1,
          2
        ],
        "duration": 1500
      },
      "tier2_lock_into_grid": {
        "type": "grid_snap",
        "tiers": [
          2
        ],
        "gridSize": 2,
        "duration": 800
      },
      "tier3_cadence_pulse": {
        "type": "pulse",
        "tiers": [
          3
        ],
        "frequency": 2,
        "intensity": 0.4,
        "bpm": 120
      },
      "breathing_rhythm": {
        "type": "breathe",
        "tiers": [
          0,
          1,
          2
        ],
        "speed": 0.05,
        "amplitude": 0.1
      },
      "prepare_flicker": {
        "type": "prime",
        "tiers": [
          2,
          3
        ],
        "anticipation": 500
      },
      "green_flicker": {
        "type": "color_flash",
        "tiers": [
          0,
          1,
          2,
          3
        ],
        "color": "#00FF00",
        "duration": 300
      },
      "flicker_fade_back_to_blue": {
        "type": "color_transition",
        "tiers": [
          0,
          1,
          2,
          3
        ],
        "fromColor": "#00FF00",
        "toColor": "#3b82f6",
        "duration": 1000
      },
      "reform_as_structure": {
        "type": "formation",
        "pattern": "structure",
        "tiers": [
          1,
          2
        ],
        "duration": 2000,
        "easing": "easeOutQuad",
        "description": "Particles reform from chaos into structured geometry"
      },
      "particles_accelerate": {
        "type": "acceleration",
        "tiers": [
          0,
          1,
          2,
          3
        ],
        "speed": 2.5,
        "direction": "forward",
        "duration": 1500,
        "description": "All particles rapidly accelerate forward"
      },
      "streak_trails_form": {
        "type": "trail",
        "tiers": [
          1,
          2
        ],
        "trailLength": 3,
        "fadeSpeed": 0.7,
        "duration": 2000,
        "description": "Motion blur trails appear behind moving particles"
      },
      "reform_as_flow": { "label": "Reform as Flow" },
      "neural_pathways_light": { "label": "Neural Pathways Light" },
      "tier3_synaptic_flash": { "label": "Tier 3 Synaptic Flash" },
      "connection_strengthen": { "label": "Connection Strengthen" },
      "tier2_pulse_sync": { "label": "Tier 2 Pulse Sync" },
      "genesis_callback_purple": { "label": "Genesis Callback (Purple)" },
      "tier3_lightning_burst": { "label": "Tier 3 Lightning Burst" },
      "fusion_pattern": { "label": "Fusion Pattern" },
      "cascade_acceleration": { "label": "Cascade Acceleration" },
      "velocity_peak": { "label": "Velocity Peak" },
      "blueprint_grid_emerge": { "label": "Blueprint Grid Emerge" },
      "isometric_view_rotate": { "label": "Isometric View Rotate" },
      "layer_stack_reveal": { "label": "Layer Stack Reveal" },
      "blueprint_complete": { "label": "Blueprint Complete" },
      "tier3_construction_guide": { "label": "Tier 3 Construction Guide" },
      "master_plan_glow": { "label": "Master Plan Glow" },
      "golden_ratio_spiral": { "label": "Golden Ratio Spiral" },
      "orbit_sync_begin": { "label": "Orbit Sync Begin" },
      "ballet_choreography": { "label": "Ballet Choreography" },
      "phase_lock_achieve": { "label": "Phase Lock Achieve" },
      "laminar_flow_perfect": { "label": "Laminar Flow Perfect" },
      "golden_ratio_complete": { "label": "Golden Ratio Complete" },
      "cosmic_dust_swirl": { "label": "Cosmic Dust Swirl" },
      "consciousness_nodes_pulse": { "label": "Consciousness Nodes Pulse" },
      "all_stages_echo": { "label": "All Stages Echo" },
      "galactic_arm_rotate": { "label": "Galactic Arm Rotate" },
      "unified_field": { "label": "Unified Field" },
      "transcendent_integration": { "label": "Transcendent Integration" },
      "question_expand": { "label": "Question Expand" },
      "tier3_sparkle": {
        "type": "sparkle",
        "tiers": [
          3
        ],
        "count": 50,
        "duration": 500,
        "status": "reserved"
      },
      "settle_to_form": {
        "type": "converge",
        "tiers": [
          0,
          1,
          2,
          3
        ],
        "duration": 2000,
        "easing": "easeOutQuad",
        "status": "reserved"
      },
      "static_hold": {
        "type": "lock",
        "tiers": [
          0,
          1,
          2,
          3
        ],
        "rigidity": 1,
        "status": "reserved"
      },
      "prepare_flicker": {
        "type": "prime",
        "tiers": [
          2,
          3
        ],
        "anticipation": 500,
        "status": "reserved"
      },
      "green_flicker": {
        "type": "color_flash",
        "tiers": [
          0,
          1,
          2,
          3
        ],
        "color": "#00FF00",
        "duration": 300,
        "status": "reserved"
      }
    },
    "cameraEffects": {
      "static": {
        "type": "fixed",
        "description": "No camera movement"
      },
      "orbit_slow": {
        "type": "orbit",
        "degrees": 10,
        "duration": 35000,
        "axis": "y"
      },
      "orbit_discovery": {
        "type": "orbit",
        "degrees": 15,
        "speed": 0.3,
        "wobble": 0.1,
        "axis": "xy",
        "description": "Curious exploration movement"
      },
      "dramatic_push": {
        "type": "dolly",
        "startZ": 6,
        "endZ": 4,
        "duration": 40000,
        "shake": {
          "amplitude": 0.1,
          "frequency": 5
        }
      },
      "isometric_track": {
        "type": "track",
        "pattern": "isometric",
        "degrees": 12,
        "duration": 35000,
        "description": "Blueprint-style camera tracking"
      },
      "balletic_orbit": {
        "type": "orbit",
        "degrees": 25,
        "speed": 0.2,
        "smooth": 0.98,
        "axis": "xyz",
        "description": "Graceful 3-axis movement"
      },
      "reverent_orbit": {
        "type": "orbit",
        "degrees": 30,
        "speed": 0.15,
        "pullback": true,
        "description": "Slow orbit with pullback"
      }
    }
  },
  "performance": {
    "frameRate": {
      "target": 60,
      "targetFps": 60,
      "minimum": 55,
      "minFps": 55,
      "windowFrames": 60
    },
    "particleCount": {
      "genesis": 2000,
      "discipline": 3000,
      "neural": 5000,
      "velocity": 12000,
      "architecture": 8000,
      "harmony": 12000,
      "transcendence": 15000
    },
    "renderTimeMs": {
      "target": 16.67,
      "max": 18,
      "criticalPath": [
        "particleUpdate",
        "shaderExecution",
        "drawCalls"
      ]
    },
    "memory": {
      "heapLimitMB": 250,
      "leakToleranceMBPerMin": 0,
      "gcPauseMaxMs": 3
    },
    "adaptiveQuality": {
      "order": [
        "tier3",
        "tier2",
        "tier1",
        "tier0"
      ],
      "restoreAfterStableSec": 5
    },
    "lodThresholds": {
      "ultra": 0.9,
      "high": 0.75,
      "medium": 0.55,
      "low": 0.35
    }
  },
  "integrityRules": [
    {
      "id": "SINGLE_WRITER_GEOMETRY",
      "detection": "renderer_not_last_writer",
      "severity": "CRITICAL",
      "response": "IMMEDIATE_ROLLBACK",
      "message": "Geometry/uniforms written outside Renderer"
    },
    {
      "id": "RENDERER_SYNTHESIS",
      "detection": "renderer_fabricates_targets_or_reads_scroll",
      "severity": "HIGH",
      "response": "BLOCK_AND_LOG",
      "message": "Renderer must not fabricate targets or read scroll"
    },
    {
      "id": "EMIT_ONCE_FENCEPOST",
      "detection": "multiple_particles_emerged_events",
      "severity": "HIGH",
      "response": "BLOCK_AND_LOG",
      "message": "Renderer must emit PARTICLES_EMERGED exactly once"
    },
    {
      "id": "PERFORMANCE_DEGRADATION",
      "detection": "fps_below_55_for_60_frames",
      "severity": "HIGH",
      "response": "FEATURE_REDUCTION",
      "message": "Quality reduced to maintain 60 FPS"
    },
    {
      "id": "NARRATIVE_DESYNC",
      "detection": "morph_vs_stage_mismatch",
      "severity": "MEDIUM",
      "response": "RESYNC_TIMELINE",
      "message": "Realigning stage, morph, and tint"
    }
  ],
  "successMetrics": {
    "technical": {
      "fps": ">=60",
      "loadTimeSec": "<4",
      "errorRate": "<0.001%",
      "memoryStable": true
    },
    "experiential": {
      "completionRate": ">80%",
      "narrativeClarity": ">90%",
      "emotionalImpact": "high"
    },
    "business": {
      "shareRate": ">30%",
      "contactConversion": ">15%",
      "oneWeekRecall": ">90%"
    }
  },
  "implementationPhases": [
    {
      "phase": 1,
      "name": "Foundation",
      "duration": "1 day",
      "deliverables": [
        "v3.3 config loader",
        "Engine text-first blueprints",
        "Renderer binding + PARTICLES_EMERGED single-source",
        "v3.4 config loader (fallback to 3.3)",
        "Engine text-first blueprints (emergence mode:'emergence')",
        "Renderer binding + PARTICLES_EMERGED single-source (emit-once)",
        "ENGINE_VIEWPORT_HINT gate"
      ]
    },
    {
      "phase": 2,
      "name": "Visual Polish",
      "duration": "1 day",
      "deliverables": [
        "Gaussian falloff",
        "Tier behavior \u2192 glyph mapping",
        "Sprite atlas verification",
        "Chaos mesh rotation window"
      ]
    },
    {
      "phase": 3,
      "name": "Narrative Integration",
      "duration": "1 day",
      "deliverables": [
        "Opening beats timing",
        "Memory fragments",
        "Audio sync to emergence threshold",
        "Opening beats timing (chaos\u2192coalesce\u2192settle)",
        "START_NARRATIVE + AUDIO_START_STAGE",
        "BeatGlyph reveal timing"
      ]
    },
    {
      "phase": 4,
      "name": "Performance & Cross-Device",
      "duration": "1 day",
      "deliverables": [
        "60 FPS optimization",
        "Adaptive quality guardrails",
        "Mobile DPR/point-size audit"
      ]
    }
  ],
  "debugSurface": {
    "exposeGlobals": [
      "BeatBus",
      "EVENTS",
      "__consciousnessMaterial",
      "__particleGeometry",
      "consciousnessEngine"
    ],
    "devHud": {
      "stageSelector": true,
      "morphSlider": true,
      "pointSizeSlider": true,
      "perfOverlay": true
    }
  },
  "changeLog": [
    "Swap: anatomy \u2192 stage words (text3DPositions)",
    "Preserved: tiers, stage order, palettes, fragments, performance",
    "Clarified: event single-source (Renderer emits PARTICLES_EMERGED)",
    "Renderer: no synthesis, no scroll, no FOV scaling",
    "Transcendence: word arrival \u2192 galaxy dissolve",
    "Added opening fencepost contract and viewport gate",
    "BLUEPRINT_READY now carries optional mode:'emergence' for emergence blueprints",
    "Renderer emits ENGINE_VIEWPORT_HINT and PARTICLES_EMERGED (emit-once) by contract",
    "Stage-0 shot list embedded (chaos\u2192coalesce\u2192settle \u2192 narration \u2192 BeatGlyph)",
    "Opening rules: settle-before-scroll + Stage-0 color lock",
    "Optional polish uniforms (uChaosSpin/uTrailIntensity/uTrailPersistence/uBrightnessBoost) are non-breaking"
  ]
}

```

### File: src/config/canonical/canonicalAuthority.js

```
// CANONICAL AUTHORITY — SST v3.5 (Unified Single Source)
import sstRaw from '../sst-loader.js';
import { PARTICLE_EFFECTS as OVERRIDE_PARTICLE_EFFECTS, CAMERA_EFFECTS as OVERRIDE_CAMERA_EFFECTS } from './visualEffects.js';

/** Deep-freeze utility (keeps Canonical read-only) */
function deepFreeze(obj) {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    for (const k of Object.keys(obj)) deepFreeze(obj[k]);
  }
  return obj;
}

/** Safe clone */
function clone(obj) {
  try { return typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj)); }
  catch { return JSON.parse(JSON.stringify(obj)); }
}

const RENDER_UNIFORM_KEYS = [
  'uMotionMode',
  'uFlowTurbulence',
  'uParticleFlash',
  'uOpacityMin',
  'uOpacityMax',
  'uStreakIntensity',
  'tierHighlight',
  'pointSize',
  'uniforms',
  'activeCount',
  'drawCount',
];

// Conservative motion-map: stick to renderer-supported modes (0-4)
const MOTION_MODE_MAP = {
  drift_perlin: 3,
  flicker: 0,
  structuralLock: 1,
  vertexPulse: 0,
  grid_drift: 1,
  breathe: 0,
  edgeLock: 1,
  cadencePulse: 0,
  neural_flow: 2,
  strokeFlow: 2,
  synapseFlash: 3,
  hubNode: 1,
  lag: 3,
  streak: 3,
  burst: 3,
  lead: 3,
  grid_flow: 1,
  modular: 1,
  blueprintPulse: 0,
  constructionGuide: 1,
  laminar_flow: 2,
  orbit_sync: 4,
  ballet: 4,
  conductor: 1,
  cosmic_dust: 4,
  galactic_arm: 4,
  consciousness_node: 0,
  transcendent: 4,
};

/** True when the payload already contains renderer-ready fields */
function hasRendererUniforms(effect) {
  if (!effect || typeof effect !== 'object') return false;
  return RENDER_UNIFORM_KEYS.some((key) => effect[key] !== undefined && effect[key] !== null);
}

/** Lightweight mapper: SST-style effect → renderer-ready directive */
function translateToRendererDirective(verb, effect = {}) {
  if (!effect || effect.type === 'camera') return effect;

  // Preserve existing renderer-ready payloads
  const payload = { ...effect };
  if (!payload.source) payload.source = 'beat_visual';
  if (!payload.verb) payload.verb = verb;
  if (hasRendererUniforms(payload)) return payload;

  const verbKey = String(verb || '').toLowerCase();
  const translated = {
    source: payload.source,
    verb: payload.verb,
  };

  const normalizedType = String(effect.type || effect.behavior || effect.pattern || '').trim();
  const mappedMode = normalizedType ? MOTION_MODE_MAP[normalizedType] : undefined;
  if (mappedMode !== undefined) {
    translated.uMotionMode = mappedMode;
  }

  // Tier modes / params (shader actually uses uTierMode/uTierParams)
  const tierModesPayload = Array.isArray(effect.tierModes) ? effect.tierModes : null;
  const tierParamsPayload = Array.isArray(effect.tierParams) ? effect.tierParams : null;

  if (tierModesPayload) {
    translated.tierModes = tierModesPayload;
  } else {
    // Heuristic fallback for tierModes if we have a mappedMode
    const mode = translated.uMotionMode;
    if (mode !== undefined) {
      translated.tierModes = [mode, mode, mode, mode];
    } else if (verbKey.includes('grid') || verbKey.includes('structure') || verbKey.includes('column')) {
      translated.tierModes = [1, 1, 1, 1];
      translated.uMotionMode = 1;
    } else if (verbKey.includes('flow')) {
      translated.tierModes = [2, 2, 2, 2];
      translated.uMotionMode = 2;
    } else if (verbKey.includes('streak') || verbKey.includes('trail') || verbKey.includes('velocity')) {
      translated.tierModes = [3, 3, 3, 3];
      translated.uMotionMode = 3;
    } else if (verbKey.includes('orbit')) {
      translated.tierModes = [4, 4, 4, 4];
      translated.uMotionMode = 4;
    } else if (verbKey.includes('drift')) {
      translated.tierModes = [0, 0, 0, 0];
      translated.uMotionMode = 3;
    }
  }

  // Turbulence / speed
  if (typeof effect.speed === 'number') {
    translated.uFlowTurbulence = Math.max(0, Math.min(2, effect.speed));
  } else if (typeof effect.amplitude === 'number') {
    translated.uFlowTurbulence = Math.max(0, Math.min(2, effect.amplitude * 0.5));
  }

  // Flash / pulse intensity
  if (effect.pulse && typeof effect.pulse.intensity === 'number') {
    translated.uParticleFlash = Math.max(0, Math.min(1, effect.pulse.intensity));
  } else if (typeof effect.intensity === 'number' && verbKey.includes('pulse')) {
    translated.uParticleFlash = Math.max(0, Math.min(1, effect.intensity));
  } else if (typeof effect.probability === 'number') {
    translated.uParticleFlash = Math.max(0, Math.min(1, effect.probability));
  }

  // Streak intensity / trail length
  if (typeof effect.trailLength === 'number') {
    translated.uStreakIntensity = Math.min(effect.trailLength / 3, 1.0);
  } else if (typeof effect.streakIntensity === 'number') {
    translated.uStreakIntensity = effect.streakIntensity;
  }

  // Tier targeting
  if (Array.isArray(effect.tiers)) {
    translated.tierHighlight = effect.tiers;
  } else if (typeof effect.tiers === 'number') {
    translated.tierHighlight = [effect.tiers];
  }

  // Opacity range
  if (Array.isArray(effect.opacity) && effect.opacity.length >= 2) {
    translated.uOpacityMin = Math.max(0, Math.min(1, effect.opacity[0]));
    translated.uOpacityMax = Math.max(0, Math.min(1, effect.opacity[1]));
  } else if (typeof effect.opacity === 'number') {
    translated.uOpacityMin = Math.max(0, Math.min(1, effect.opacity));
  }
  if (typeof effect.fadeTrail === 'number') {
    translated.uOpacityMax = Math.max(0, Math.min(1, effect.fadeTrail));
  }
  if (translated.uOpacityMin === undefined && translated.uOpacityMax !== undefined) {
    translated.uOpacityMin = Math.max(0, Math.min(1, translated.uOpacityMax * 0.5));
  }
  if (translated.uOpacityMax === undefined && translated.uOpacityMin !== undefined) {
    translated.uOpacityMax = Math.max(translated.uOpacityMin, 1.0);
  }
  if (translated.uOpacityMin === undefined && translated.uOpacityMax === undefined) {
    translated.uOpacityMin = 0.5;
    translated.uOpacityMax = 1.0;
  }

  if (typeof effect.uSpreadFactor === 'number') {
    translated.uSpreadFactor = effect.uSpreadFactor;
  }

  // Tier params: use provided payload, otherwise derive from speed/amplitude/turbulence
  if (tierParamsPayload && tierParamsPayload.length >= 4) {
    translated.tierParams = tierParamsPayload;
  } else if (translated.tierModes) {
    const speed = typeof effect.speed === 'number' ? effect.speed : 0.8;
    const amp = typeof effect.amplitude === 'number' ? effect.amplitude : 0.2;
    const freq = typeof effect.frequency === 'number' ? effect.frequency : 0.5;
    const params = [speed, amp, freq, 0.0];
    translated.tierParams = [params, params, params, params];
  }

  // Drift-specific amplitude/frequency (for renderer + shader semantics)
  // Pass through explicit SST values, otherwise supply gentle defaults for drift verbs.
  if (typeof effect.amplitude === 'number') {
    translated.amplitude = effect.amplitude;
  } else if (verbKey.includes('drift') && translated.amplitude == null) {
    translated.amplitude = 0.25; // "breathing" baseline
  }

  if (typeof effect.frequency === 'number') {
    translated.frequency = effect.frequency;
  } else if (verbKey.includes('drift') && translated.frequency == null) {
    translated.frequency = 0.15;
  }

  // Point size from scale
  if (typeof effect.scale === 'number') {
    translated.pointSize = Math.max(0.5, Math.min(3.0, effect.scale));
  }

  return hasRendererUniforms(translated) ? translated : payload;
}

function buildCanonical(source) {
  const sst = clone(source);
  const stageOrder = Array.isArray(sst.stageOrder) ? sst.stageOrder.slice() : Object.keys(sst.stages || {});
  const letterGeometry = sst.visual?.letterGeometry || {};

  // Back-compat aliases for existing code paths
  for (const key of Object.keys(sst.stages || {})) {
    const st = sst.stages[key] || {};
    if (!st.name) st.name = key;
    if (Array.isArray(st.palette) && !st.colors) st.colors = st.palette.slice(0,3);
    if (typeof st.particlesBase === 'number' && !st.particleCount) st.particleCount = st.particlesBase;
    // 👇 add scrollRange alias for validators/tools that still expect it
    if (Array.isArray(st.scrollRangePercent) && !st.scrollRange) st.scrollRange = st.scrollRangePercent.slice(0,2);
    if (!st.label) st.label = key;
    if (!st.word && letterGeometry?.[key]?.word) {
      st.word = letterGeometry[key].word;
    }
  }

  const openingRules = (sst.opening && sst.opening.rules) || sst.openingRules || {};
  const openingTimeline = (sst.opening && sst.opening.timeline) || sst.stages?.genesis?.openingTimeline || {};
  const openingFencepost = (sst.opening && (sst.opening.fencepost || sst.opening.fencepostOrder)) || sst.openingFencepost || {};
  const opening = {
    ...(sst.opening || {}),
    rules: openingRules,
    timeline: openingTimeline,
    fencepost: openingFencepost
  };

  const narrativeStages = {};
  for (const stageName of stageOrder) {
    const stageNarrative = sst.narrative?.stages?.[stageName] ? clone(sst.narrative.stages[stageName]) : {};
    const stageData = sst.stages?.[stageName] || {};
    if (stageData.memoryFragments && !stageData.memoryFragment) {
      stageData.memoryFragment =
        stageData.memoryFragments.interactive ||
        stageData.memoryFragments.ambient ||
        stageData.memoryFragments.climax ||
        null;
    }
    if (!stageNarrative.word && letterGeometry?.[stageName]?.word) {
      stageNarrative.word = letterGeometry[stageName].word;
    }
    if (!stageNarrative.memoryFragments && stageData.memoryFragments) {
      stageNarrative.memoryFragments = clone(stageData.memoryFragments);
    }
    if (!stageNarrative.memoryFragment) {
      const primary =
        stageData.memoryFragments?.interactive ||
        stageData.memoryFragments?.ambient ||
        stageData.memoryFragment ||
        null;
      if (primary) {
        stageNarrative.memoryFragment = clone(primary);
      }
    }
    if (!stageNarrative.audio && stageData.audio) {
      stageNarrative.audio = stageData.audio;
    }
    if (!stageNarrative.timeline && stageData.openingTimeline) {
      stageNarrative.timeline = stageData.openingTimeline;
    }
    narrativeStages[stageName] = stageNarrative;
  }

  const narrative = {
    ...(sst.narrative || {}),
    stages: narrativeStages
  };

  const visualEffects = clone(sst.visualEffects || {});
  visualEffects.particleEffects = {
    ...(visualEffects.particleEffects || {}),
    ...(OVERRIDE_PARTICLE_EFFECTS || {}),
  };
  visualEffects.cameraEffects = {
    ...(visualEffects.cameraEffects || {}),
    ...(OVERRIDE_CAMERA_EFFECTS || {}),
  };

  const getVisualEffect = (visualVerb, type = 'particle') => {
    if (!visualVerb || visualVerb === 'no_change') return null;

    const effectKey = type === 'camera' ? 'cameraEffects' : 'particleEffects';
    const effects = visualEffects?.[effectKey];

    if (!effects) {
      if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn(`🎨 [Canonical] No ${effectKey} registry found`);
      }
      return null;
    }

    const effect = effects[visualVerb];

    if (!effect) {
      if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn(`🎨 [Canonical] Unknown visual verb: "${visualVerb}" (type: ${type})`);
      }
      return null;
    }

    const translated = translateToRendererDirective(visualVerb, effect);

    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log(`🎨 [Canonical] Resolved visual verb: "${visualVerb}" →`, translated);
    }
    return translated;
  };

  const getBeatSheet = (stageName) => {
    if (!stageName) return null;

    const beatSheets = sst.narrative?.beatSheets;
    if (!beatSheets) {
      if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn('🎨 [Canonical] No beat sheets found');
      }
      return null;
    }

    const key = String(stageName);
    const beatSheet = beatSheets[key];

    if (!beatSheet) {
      if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn(`🎨 [Canonical] No beat sheet for stage: "${key}"`);
      }
      return null;
    }

    return clone(beatSheet);
  };

  const getAllVisualVerbs = () => Object.keys(visualEffects?.particleEffects || {});
  const getCoverageStats = () => {
    const verbs = getAllVisualVerbs();
    let translatable = 0;
    let cameraOnly = 0;
    verbs.forEach((verb) => {
      const eff = visualEffects?.particleEffects?.[verb] || null;
      if (eff && eff.type === 'camera') {
        cameraOnly += 1;
        return;
      }
      const resolved = getVisualEffect(verb);
      if (resolved) translatable += 1;
    });
    const total = verbs.length;
    const untranslatable = Math.max(0, total - translatable - cameraOnly);
    const coverage = total > 0 ? ((translatable / total) * 100).toFixed(1) : '0.0';
    return { total, translatable, cameraOnly, untranslatable, coverage: `${coverage}%` };
  };

  const getStageByName = (name) => sst.stages?.[name] ?? null;
  const getStageByIndex = (index) => {
    const safe = Math.max(0, Math.min(stageOrder.length - 1, Number(index) | 0));
    const name = stageOrder[safe];
    return sst.stages?.[name] ?? null;
  };
  const getStageByScroll = (progress = 0) => {
    const raw = Number(progress);
    const percent = Number.isFinite(raw)
      ? (Math.abs(raw) > 1 ? Math.max(0, Math.min(100, raw)) : Math.max(0, Math.min(1, raw)) * 100)
      : 0;
    const bps = sst.scrollAndMorph?.stageBreakpointsPercent || [0,14,28,42,56,70,84,100];
    for (let i = 0; i < bps.length - 1; i++) {
      if (percent >= bps[i] && percent < bps[i + 1]) return getStageByIndex(i);
    }
    return getStageByIndex(stageOrder.length-1);
  };
  const isFeatureEnabled = (k) => Boolean(sst.features && sst.features[k]);
  const getFragmentsForStage = (stage) => {
    const st = getStageByName(stage);
    if (!st) return [];
    const source =
      (st.memoryFragments && typeof st.memoryFragments === 'object')
        ? st.memoryFragments
        : (st.memoryFragment
            ? { interactive: st.memoryFragment }
            : null);
    if (!source) return [];

    const fragments = [];
    for (const [tier, fragment] of Object.entries(source)) {
      if (!fragment || typeof fragment !== 'object') continue;
      const cloned = clone(fragment);
      const fallbackName = `${stage} ${tier}`.replace(/_/g, ' ');
      const normalized = {
        ...cloned,
        tier,
        stage,
      };
      if (!normalized.id) normalized.id = `${stage}_${tier}`;
      if (!normalized.name) normalized.name = normalized.title || fallbackName;
      if (!normalized.type) normalized.type = tier;
      fragments.push(normalized);
    }
    return fragments;
  };
  const getActiveFragments = (stage /*, scroll */) => getFragmentsForStage(stage);

  const SYSTEM_CONSTANTS = {
    TOTAL_STAGES: stageOrder.length,
    MIN_STAGE_INDEX: 0,
    MAX_STAGE_INDEX: stageOrder.length - 1,
    OPERATIONAL_PARTICLES: sst.quality?.maxParticles ?? 15000,
    SHOWCASE_PARTICLES: Math.min((sst.quality?.maxParticles ?? 15000)+2000, 17000),
    TARGET_FPS: sst.performance?.frameRate?.target ?? sst.performance?.frameRate?.targetFps ?? 60,
    LIGHTHOUSE_TARGET: 90
  };

  const Canonical = {
    meta: sst.meta || {},
    version: sst.meta?.version ?? '3.5',
    authority: sst.meta?.authority ?? 'ABSOLUTE',
    stages: sst.stages || {},
    stageOrder,
    visual: sst.visual || {},
    narrative,
    pipeline: sst.pipeline || {},
    features: sst.features || {},
    performance: sst.performance || {},
    quality: sst.quality || {},
    shaderContract: sst.shaderContract || {},
    events: sst.events || [],
    scrollAndMorph: sst.scrollAndMorph || {},
    openingFencepost: sst.openingFencepost || {},
    openingRules: sst.openingRules || {},
    opening,
    spriteSemantics: sst.spriteSemantics || {},
    integrityRules: sst.integrityRules || [],
    successMetrics: sst.successMetrics || {},
    implementationPhases: sst.implementationPhases || [],
    debugSurface: sst.debugSurface || {},
    changeLog: sst.changeLog || [],
    dialogue: narrative.stages || {},
    visualEffects,
    getStageByName, getStageByIndex, getStageByScroll,
    isFeatureEnabled, getFragmentsForStage, getActiveFragments,
    getVisualEffect, getBeatSheet,
    getCoverageStats, getAllVisualVerbs,
    SYSTEM_CONSTANTS
  };
  return deepFreeze(Canonical);
}

export const Canonical = buildCanonical(sstRaw);

/** Probe history with temporal analysis utilities (dev only) */
function createProbeHistory() {
  const maxSamples = 300;
  const samples = [];
  let isRecording = false;
  let startTime = null;

  const getDuration = () => (samples[samples.length - 1]?.time ?? 0);

  return {
    start() {
      isRecording = true;
      startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0;
      samples.length = 0;
      console.log('[PROBE HISTORY] Recording started');
      return this;
    },
    stop() {
      isRecording = false;
      console.log(`[PROBE HISTORY] Recording stopped (${samples.length} samples)`);
      return this;
    },
    clear() {
      samples.length = 0;
      console.log('[PROBE HISTORY] Samples cleared');
      return this;
    },
    record(snapshot = {}) {
      if (!isRecording) return;

      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const origin = startTime || 0;

      samples.push({
        time: now - origin,
        timestamp: Date.now(),
        ...snapshot
      });

      if (samples.length > maxSamples) samples.shift();
    },
    get samples() {
      return [...samples];
    },
    query(predicate) {
      return typeof predicate === 'function' ? samples.filter(predicate) : [];
    },
    analyze() {
      if (!samples.length) return { error: 'No samples recorded' };

      const fpsSamples = samples.map((s) => s.fps).filter((v) => typeof v === 'number');
      const memorySamples = samples.map((s) => s.memory).filter((v) => typeof v === 'number');

      const fps = fpsSamples.length
        ? {
            min: Math.min(...fpsSamples),
            max: Math.max(...fpsSamples),
            avg: fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length,
            drops: fpsSamples.filter((f) => f < 55).length
          }
        : null;

      const memory = memorySamples.length
        ? {
            min: Math.min(...memorySamples),
            max: Math.max(...memorySamples),
            trend: memorySamples[memorySamples.length - 1] > memorySamples[0] ? 'increasing' : 'stable'
          }
        : null;

      return {
        duration: getDuration(),
        sampleCount: samples.length,
        fps,
        memory
      };
    },
    plot(metric = 'fps') {
      const values = samples.map((s) => s[metric]).filter((v) => typeof v === 'number');
      if (!values.length) return `No data for metric "${metric}"`;

      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min || 1;

      return values
        .map((value, index) => {
          const normalized = (value - min) / range;
          const barLength = Math.floor(normalized * 40);
          return `${index.toString().padStart(3, ' ')}: ${'='.repeat(barLength)} ${value.toFixed(1)}`;
        })
        .join('\n');
    },
    export() {
      return {
        meta: {
          startTime,
          duration: getDuration(),
          sampleCount: samples.length
        },
        samples: [...samples]
      };
    }
  };
}

// DEV exposure
const isDev =
  (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') ||
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV);

if (typeof window !== 'undefined' && isDev) {
  try {
    Object.defineProperty(window, 'Canonical', {
      value: Canonical,
      writable: false,
      configurable: false
    });
    // Alias for tools expecting canonicalAuthority
    if (!window.canonicalAuthority) {
      Object.defineProperty(window, 'canonicalAuthority', {
        value: Canonical,
        writable: false,
        configurable: false
      });
    }
    Object.defineProperty(window, 'SST', {
      value: Canonical,
      writable: false,
      configurable: false
    });
    console.log(`📋 SST v${Canonical.version} loaded as window.Canonical + window.SST (read-only)`);
  } catch (err) {
    console.warn('Failed to expose SST canonical authority', err);
  }

  try {
    if (window.probe) {
      if (!window.probe.history) {
        window.probe.history = createProbeHistory();
      }

      if (typeof window.probe.draw === 'function' && !window.probe.__historyWrapped) {
        const originalDraw = window.probe.draw;
        window.probe.draw = function probeDrawWrapper(...args) {
          const result = originalDraw.apply(this, args);
          const history = window.probe.history;
          if (history && typeof history.record === 'function') {
            const fpsValue = typeof window.probe.fps === 'function' ? window.probe.fps() : undefined;
            const memoryValue =
              typeof performance !== 'undefined' && performance.memory
                ? performance.memory.usedJSHeapSize / 1048576
                : undefined;

            history.record({
              fps: typeof fpsValue === 'number' ? fpsValue : undefined,
              draw: result,
              memory: memoryValue
            });
          }
          return result;
        };
        window.probe.__historyWrapped = true;
      }

      console.log('✅ Probe History initialized');
    }
  } catch (err) {
    console.warn('Failed to initialize probe history', err);
  }
}

export default Canonical;

```


## Your Input Expectations
Architect spec + file list + relevant contracts.

## Your Output Expectations
List risks and approve minimal safe change surface.

---
## Instructions
- Stay within your mission and invariants.
- Respect existing contracts (schema, Canon, tests, single-writer).
- If you propose code changes, show them as diffs or full snippets.
- If you rely on behavior from other files not shown, state your assumptions.

## Begin your reasoning and output below:

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
import { glyphSpace } from '@/engine/GlyphSpace.js';

import vertexShaderSource from '../../shaders/templates/consciousness-vertex.glsl?raw';
import fragmentShaderSource from '../../shaders/templates/consciousness-fragment.glsl?raw';
import { exposeDiagnostics, exposeControlSurface, revokeControlSurface } from '@/utils/runtimeGuards.js';

const ATMO_FIT_X = 0.92;
const ATMO_FIT_Y = 0.85;
const TEXT_FIT_WIDTH = 0.9;
const TEXT_FIT_MAX_H = 0.8;
const BAND_FADE_WIDTH = 0.35;
const MORPH_WRITE_LOG_LIMIT = 400;
const LANDING_OPENING_PRESET = 'velocity_stage';

const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));
const computeBasePointSize = (dpr = 1) => Math.max(0.1, 3 * dpr); // final screen size = uPointSize * tier multipliers
const formatNumber = (value, precision = 3) => {
  if (!Number.isFinite(value)) return 'null';
  return Number(value).toFixed(precision);
};
const toArray = (value) => {
  if (value == null) return null;
  if (typeof value.toArray === 'function') {
    const tmp = [];
    value.toArray(tmp, 0);
    return tmp;
  }
  if (Array.isArray(value)) return value;
  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView?.(value)) {
    return Array.from(value);
  }
  if (typeof value.x === 'number' || typeof value.y === 'number') {
    return [value.x ?? 0, value.y ?? 0];
  }
  return null;
};
const formatVec2 = (value, precision = 3) => {
  const arr = toArray(value);
  if (!arr || arr.length < 2) return 'null';
  return `[${formatNumber(arr[0], precision)}, ${formatNumber(arr[1], precision)}]`;
};
const formatArray = (value, count = 4, precision = 2) => {
  const arr = toArray(value);
  if (!arr || arr.length === 0) return 'null';
  return `[${arr.slice(0, count).map((v) => formatNumber(v, precision)).join(', ')}]`;
};
const toVec3 = (value, fallback = null) => {
  if (Array.isArray(value) && value.length >= 3) {
    return new THREE.Vector3(
      Number(value[0]) || 0,
      Number(value[1]) || 0,
      Number(value[2]) || 0
    );
  }
  if (value && typeof value === 'object') {
    if (Number.isFinite(value.x) || Number.isFinite(value.y) || Number.isFinite(value.z)) {
      return new THREE.Vector3(
        Number(value.x) || 0,
        Number(value.y) || 0,
        Number(value.z) || 0
      );
    }
  }
  return fallback;
};
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

const applyVisualVerbDirective = (directive = {}, uniforms, origin = 'renderer', onUniformWrite = null) => {
  if (!uniforms) return;
  const verb = directive?.verb || directive?.effect?.verb;
  const setUniform = (name, value) => {
    if (typeof value !== 'number') return;
    const target = uniforms[name];
    if (!target) return;
    if (!guardUniformWrite(origin, name)) return;
    target.value = value;
    target.needsUpdate = true;
    if (typeof onUniformWrite === 'function') {
      onUniformWrite(name, value, { verb });
    }
  };
  const applyArrayUniform = (name, value) => {
    const uniform = uniforms[name];
    if (!uniform) return;
    if (!guardUniformWrite(origin, name)) return;
    if (Array.isArray(value)) {
      const current = uniform.value;
      const isTypedArray =
        current &&
        ArrayBuffer.isView(current) &&
        !(current instanceof DataView) &&
        typeof current.set === 'function';

      if (isTypedArray) {
        current.set(value);
      } else if (Array.isArray(current)) {
        for (let i = 0; i < Math.min(current.length, value.length); i += 1) {
          current[i] = value[i];
        }
      } else if (current?.set) {
        current.set(...value);
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
    // Demo verbs → apply motion/visibility baselines
    case 'pullIn': {
      // Gentle grid wobble - keep glyph readable
      setUniform('uMorphProgress', typeof directive?.uMorphProgress === 'number' ? directive.uMorphProgress : 0.97);
      applyArrayUniform('uGridSpacing', [0.08, 0.08]);
      applyArrayUniform('uTierMode', [1, 1, 1, 1]);
      applyArrayUniform('uTierParams0', [0.005, 0, 0, 0]);
      applyArrayUniform('uTierParams1', [0.004, 0, 0, 0]);
      applyArrayUniform('uTierParams2', [0.004, 0, 0, 0]);
      applyArrayUniform('uTierParams3', [0.003, 0, 0, 0]);
      setUniform('uOpacityMin', directive?.uOpacityMin ?? 0.5);
      setUniform('uOpacityMax', directive?.uOpacityMax ?? 1.0);
      break;
    }
    case 'morph': {
      // Subtle drift (all tiers) - stable text formation
      setUniform('uMorphProgress', typeof directive?.uMorphProgress === 'number' ? directive.uMorphProgress : 0.96);
      applyArrayUniform('uTierMode', [0, 0, 0, 0]);
      applyArrayUniform('uTierParams0', [0.4, 0.02, 0.3, 0]);
      applyArrayUniform('uTierParams1', [0.3, 0.015, 0.2, 0]);
      applyArrayUniform('uTierParams2', [0.25, 0.018, 0.25, 0]);
      applyArrayUniform('uTierParams3', [0.35, 0.022, 0.2, 0]);
      setUniform('uOpacityMin', directive?.uOpacityMin ?? 0.5);
      setUniform('uOpacityMax', directive?.uOpacityMax ?? 1.0);
      break;
    }
    case 'sparkDrift': {
      // Gentle flow vibe (but keep it readable) - drift-only + low turbulence/streak.
      const uniformFlowTurbulence = Number(directive?.uniforms?.uFlowTurbulence);
      const uniformStreakIntensity = Number(directive?.uniforms?.uStreakIntensity);
      setUniform('uMorphProgress', typeof directive?.uMorphProgress === 'number' ? directive.uMorphProgress : 0.96);
      setUniform(
        'uFlowTurbulence',
        typeof directive?.uFlowTurbulence === 'number'
          ? directive.uFlowTurbulence
          : (Number.isFinite(uniformFlowTurbulence) ? uniformFlowTurbulence : 0.3)
      );
      setUniform(
        'uStreakIntensity',
        typeof directive?.uStreakIntensity === 'number'
          ? directive.uStreakIntensity
          : (Number.isFinite(uniformStreakIntensity) ? uniformStreakIntensity : 0.2)
      );
      applyArrayUniform('uTierMode', [0, 0, 0, 0]);
      applyArrayUniform('uTierParams0', [0.5, 0.025, 0.35, 0]);
      applyArrayUniform('uTierParams1', [0.4, 0.02, 0.25, 0]);
      applyArrayUniform('uTierParams2', [0.45, 0.022, 0.3, 0]);
      applyArrayUniform('uTierParams3', [0.55, 0.028, 0.35, 0]);
      setUniform('uOpacityMin', directive?.uOpacityMin ?? 0.5);
      setUniform('uOpacityMax', directive?.uOpacityMax ?? 1.0);
      break;
    }
    case 'bloomPulse': {
      // Very gentle breathing drift - crystal clear glyph
      setUniform('uMorphProgress', typeof directive?.uMorphProgress === 'number' ? directive.uMorphProgress : 0.98);
      setUniform('uFlowTurbulence', typeof directive?.uFlowTurbulence === 'number' ? directive.uFlowTurbulence : 0.2);
      setUniform('uStreakIntensity', typeof directive?.uStreakIntensity === 'number' ? directive.uStreakIntensity : 0.0);
      applyArrayUniform('uTierMode', [0, 0, 0, 0]);
      applyArrayUniform('uTierParams0', [0.2, 0.01, 0.15, 0]);
      applyArrayUniform('uTierParams1', [0.15, 0.008, 0.1, 0]);
      applyArrayUniform('uTierParams2', [0.25, 0.012, 0.18, 0]);
      applyArrayUniform('uTierParams3', [0.3, 0.015, 0.22, 0]);
      setUniform('uOpacityMin', directive?.uOpacityMin ?? 0.5);
      setUniform('uOpacityMax', directive?.uOpacityMax ?? 1.0);
      break;
    }
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
  const s =
    Canonical?.getResolvedStageByName?.(stageName) ||
    Canonical?.stages?.[stageName] ||
    {};
  const colors = s.colors || ['#00ffcc', '#f59e0b', '#ffffff'];
  const order = Canonical?.stageOrder || [];
  const idx = Math.max(0, order.indexOf(stageName));
  const nextStage = order[Math.min(idx + 1, Math.max(0, order.length - 1))] || stageName;
  const nextStageConfig =
    Canonical?.getResolvedStageByName?.(nextStage) ||
    Canonical?.stages?.[nextStage] ||
    {};
  const nextColors = nextStageConfig?.colors || colors;
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

function isLandingVelocitySlice() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const slice = params.get('slice');
  const requestedPreset = params.get('preset');
  const resolvedPreset = window.Canonical?.landingStageSliceResolved?.preset;
  return slice === 'landing_stage' &&
    (resolvedPreset === LANDING_OPENING_PRESET || requestedPreset === LANDING_OPENING_PRESET);
}

function getLandingVelocityOpeningSeed() {
  if (typeof window === 'undefined') return null;
  const canonical = window.Canonical || Canonical;
  const resolved = canonical?.landingStageSliceResolved;
  if (!resolved || resolved.preset !== LANDING_OPENING_PRESET) return null;

  const beats =
    (resolved.demoKey && Array.isArray(canonical?.visualDemos?.[resolved.demoKey]?.beats)
      ? canonical.visualDemos[resolved.demoKey].beats
      : null) ||
    (Array.isArray(canonical?.visualDemos?.landing_preset_profiles?.[LANDING_OPENING_PRESET]?.beats)
      ? canonical.visualDemos.landing_preset_profiles[LANDING_OPENING_PRESET].beats
      : null);

  if (!Array.isArray(beats) || beats.length === 0) return null;

  const beat = beats.find((entry) => Number(entry?.atMs) === 0) || beats[0];
  const params = beat?.params && typeof beat.params === 'object' ? beat.params : null;
  if (!params) return null;

  const pointSizeRaw = Number(params.pointSize);
  return {
    camera: params.camera && typeof params.camera === 'object' ? params.camera : null,
    pointSize: Number.isFinite(pointSizeRaw) ? Math.max(0.5, Math.min(pointSizeRaw, 12.0)) : null,
    uniforms: params.uniforms && typeof params.uniforms === 'object' ? params.uniforms : {},
  };
}

const vec2Close = (a = [], b = [], eps = 1e-3) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  return Math.abs((a[0] ?? 0) - (b[0] ?? 0)) < eps
    && Math.abs((a[1] ?? 0) - (b[1] ?? 0)) < eps;
};

function WebGLBackground({ morphProgress = 0, scrollProgress = 0, cameraOverride = null }) {
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
  const restoreBlendRef = useRef(null);
  const restoreTransparentRef = useRef(null);
  // Optional: if your render loop advances uTime, guard it here
  const timeTickEnabledRef = useRef(true);
  const morphWriteLogRef = useRef([]);

  const shouldTrackMorphWrites = () =>
    DEV &&
    typeof window !== 'undefined';

  const trackMorphWrite = (source, value, meta = {}) => {
    if (!shouldTrackMorphWrites()) return;
    const now =
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();
    const stage = window.stageControls?.getCurrentStage?.() ?? window.stageAtom?.getState?.()?.currentStage ?? null;
    const stageIndex =
      window.stageControls?.getCurrentStageIndex?.() ??
      window.stageAtom?.getState?.()?.stageIndex ??
      null;
    const entry = {
      tMs: Math.round(now),
      source,
      value: Number(value),
      stage,
      stageIndex,
      ...meta,
    };
    const stack = new Error().stack;
    if (typeof stack === 'string') {
      entry.stack = stack
        .split('\n')
        .slice(1, 6)
        .map((line) => line.trim());
    }
    morphWriteLogRef.current.push(entry);
    if (morphWriteLogRef.current.length > MORPH_WRITE_LOG_LIMIT) {
      morphWriteLogRef.current.splice(0, morphWriteLogRef.current.length - MORPH_WRITE_LOG_LIMIT);
    }
  };

  const applyMorphUniformWrite = (uniforms, nextValue, source, meta = {}) => {
    if (!uniforms || !Number.isFinite(Number(nextValue))) return false;
    const value = Number(nextValue);
    let uniformName = null;
    if (uniforms.uMorphProgress) uniformName = 'uMorphProgress';
    else if (uniforms.morphProgress) uniformName = 'morphProgress';
    else if (uniforms.uMorph) uniformName = 'uMorph';
    else if (uniforms.morph) uniformName = 'morph';
    if (!uniformName) return false;

    const uniform = uniforms[uniformName];
    uniform.value = value;
    uniform.needsUpdate = true;
    trackMorphWrite(source, value, { uniformName, ...meta });
    return true;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.__dumpFormState = () => {
      const u = uniformsRef.current;
      const cam = cameraRef.current;
      const geo = geometryRef.current;
      const safe = (val) => (val && typeof val === 'object' && 'value' in val ? val.value : val);
      return {
        camera: cam
          ? {
              pos: cam.position.toArray(),
              fov: cam.fov,
              zoom: cam.zoom,
              near: cam.near,
              far: cam.far,
            }
          : null,
        drawRange: geo?.drawRange
          ? { start: geo.drawRange.start, count: geo.drawRange.count }
          : null,
        uniforms: u
          ? {
              uPointSize: safe(u.uPointSize),
              uOpacityMin: safe(u.uOpacityMin),
              uOpacityMax: safe(u.uOpacityMax),
              uFadeProgress: safe(u.uFadeProgress),
              uMorphProgress: safe(u.uMorphProgress),
              uStageIndex: safe(u.uStageIndex),
              uActiveCount: safe(u.uActiveCount),
              uGaussianSigma: safe(u.uGaussianSigma),
              uCenterWeighting: safe(u.uCenterWeighting),
              uFlowTurbulence: safe(u.uFlowTurbulence),
              uStreakIntensity: safe(u.uStreakIntensity),
              uSpreadFactor: safe(u.uSpreadFactor),
              uDepthFalloffPower: safe(u.uDepthFalloffPower),
              uDevicePixelRatio: safe(u.uDevicePixelRatio),
            }
          : null,
      };
    };
    if (DEV) {
      window.__dumpRendererState = () => {
        const mat = materialRef.current;
        const u = mat?.uniforms || null;
        const cam = cameraRef.current;
        const geo = geometryRef.current;

        const readUniform = (name) => {
          const uniform = u?.[name];
          if (!uniform) return null;
          const value = uniform.value;
          if (value == null) return value;
          if (Array.isArray(value)) return value.slice();
          if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
            return Array.from(value);
          }
          if (typeof value === 'object' && typeof value.toArray === 'function') {
            const out = [];
            value.toArray(out);
            return out;
          }
          return value;
        };

        const drawRange = geo?.drawRange
          ? { start: geo.drawRange.start, count: geo.drawRange.count }
          : null;
        const activeCountUniform = readUniform('uActiveCount');
        const activeCount = Number.isFinite(activeCountUniform)
          ? activeCountUniform
          : Number(drawRange?.count ?? 0);

        return {
          hasMaterial: !!mat,
          drawRange,
          activeCount,
          uniforms: {
            uMorphProgress: readUniform('uMorphProgress'),
            uPointSize: readUniform('uPointSize'),
            uOpacityMin: readUniform('uOpacityMin'),
            uOpacityMax: readUniform('uOpacityMax'),
            uGaussianSigma: readUniform('uGaussianSigma'),
            uDepthFalloffPower: readUniform('uDepthFalloffPower'),
            uTierCutoff: readUniform('uTierCutoff'),
            uFadeProgress: readUniform('uFadeProgress'),
            uCenterWeighting: readUniform('uCenterWeighting'),
            uFlowTurbulence: readUniform('uFlowTurbulence'),
            uStreakIntensity: readUniform('uStreakIntensity'),
            uSpreadFactor: readUniform('uSpreadFactor'),
          },
          camera: cam
            ? {
                pos: cam.position.toArray(),
                fov: cam.fov,
                zoom: cam.zoom,
                near: cam.near,
                far: cam.far,
              }
            : null,
        };
      };
      window.__dumpMorphWrites = () => morphWriteLogRef.current.slice();
      window.__clearMorphWrites = () => {
        morphWriteLogRef.current.length = 0;
      };
    }
    return () => {
      if (window.__dumpFormState) delete window.__dumpFormState;
      if (window.__dumpRendererState) delete window.__dumpRendererState;
      if (window.__dumpMorphWrites) delete window.__dumpMorphWrites;
      if (window.__clearMorphWrites) delete window.__clearMorphWrites;
    };
  }, []);

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
  const [materialReady, setMaterialReady] = useState(false);

  const lastFitStampRef = useRef({ geoId: null, width: 0, height: 0 });
  const lastUniformsRef = useRef({ atmo: [1, 1], text: [1, 1] });
  const stageNameRef = useRef(stageName);
  const blueprintRef = useRef(blueprint);
  const lastBlueprintMetaRef = useRef({});
  const hotspotMapRef = useRef({});
  const glyphTargetRef = useRef(null);
  const fitsLockedRef = useRef(false);
  const cameraOwnerRef = useRef('default'); // 'default' | 'directive' | 'demo'
  const cameraTargetRef = useRef({
    position: new THREE.Vector3(0, 0, 50),
    lookAt: new THREE.Vector3(0, 0, 0),
    startPosition: new THREE.Vector3(0, 0, 50),
    startLookAt: new THREE.Vector3(0, 0, 0),
    currentLookAt: new THREE.Vector3(0, 0, 0),
    fov: 100,
    startFov: 100,
    easingMode: 'ease-in-out',
    active: false,
    duration: 1000,
    startTime: 0,
  });
  const cameraLookAtTempRef = useRef(new THREE.Vector3(0, 0, 0));

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
  const morphDriftRef = useRef({
    active: false,
    tierModes: null,
    flowTurbulence: null,
    streakIntensity: null,
    spreadFactor: null,
    morphType: null,
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

  const uniformVec2 = (u, fallback = [1, 1]) => {
    const arr = toArray(u?.value ?? u);
    if (Array.isArray(arr) && arr.length >= 2) {
      const x = Number.isFinite(arr[0]) ? arr[0] : fallback[0];
      const y = Number.isFinite(arr[1]) ? arr[1] : fallback[1];
      return [x, y];
    }
    return fallback;
  };

  // Approximate shader finalPos on CPU for diagnostics (ignores tier motion/damping).
  const computeFinalPosDiag = (idx, ctx) => {
    const i3 = idx * 3;
    const ax = (ctx.atmoArr?.[i3] ?? 0) * ctx.atmoFit[0];
    const ay = (ctx.atmoArr?.[i3 + 1] ?? 0) * ctx.atmoFit[1];
    const az = ctx.atmoArr?.[i3 + 2] ?? 0;
    const tx = (ctx.textArr?.[i3] ?? ax) * ctx.textFit[0];
    const ty = (ctx.textArr?.[i3 + 1] ?? ay) * ctx.textFit[1];
    const tz = ctx.textArr?.[i3 + 2] ?? az;

    const morph = ctx.morph;
    const spread = Math.max(ctx.spread, 0);
    const isDissolve = Math.abs(ctx.morphType - MORPH_TYPE_ENUM.dissolve) < 0.5 ? 1 : 0;
    const isReform = Math.abs(ctx.morphType - MORPH_TYPE_ENUM.reform) < 0.5 ? 1 : 0;
    const dissolveAmt = Math.min(Math.max(1 - morph, 0), 1);
    const reformAmt = Math.min(Math.max(morph, 0), 1);

    const clamp = (v, mn, mx) => Math.min(mx, Math.max(mn, v));

    let atmoPosX = ax;
    let atmoPosY = ay;
    if (isDissolve) {
      const dissolveSpread = (1 - dissolveAmt) * 1.0 + dissolveAmt * clamp(spread, 1, 4);
      atmoPosX *= dissolveSpread;
      atmoPosY *= dissolveSpread;
    }

    let textPosX = tx;
    let textPosY = ty;
    if (isReform) {
      const reformScale = (1 - reformAmt) * 1.0 + reformAmt * clamp(spread, 0.4, 1.0);
      textPosX *= reformScale;
      textPosY *= reformScale;
    }

    const basePosX = atmoPosX * (1 - morph) + textPosX * morph;
    const basePosY = atmoPosY * (1 - morph) + textPosY * morph;
    const basePosZ = az * (1 - morph) + tz * morph;
    let finalX = basePosX;
    let finalY = basePosY;
    let finalZ = basePosZ;

    if (isDissolve) {
      const len = Math.max(Math.sqrt(basePosX * basePosX + basePosY * basePosY), 1e-4);
      const radialX = basePosX / len;
      const radialY = basePosY / len;
      const strength = (clamp(spread, 1, 4) - 1) * dissolveAmt * 6.0;
      finalX += radialX * strength;
      finalY += radialY * strength;
    }

    if (isReform) {
      const len = Math.max(Math.sqrt(textPosX * textPosX + textPosY * textPosY), 1e-4);
      const dirX = textPosX / len;
      const dirY = textPosY / len;
      const pull = Math.max(1 - clamp(spread, 0, 1), 0) * reformAmt * 4.0;
      finalX -= dirX * pull;
      finalY -= dirY * pull;
      const noiseX = Math.sin(idx * 0.1 + ctx.time) * (1 - morph) * 8.0;
      const noiseY = Math.cos(idx * 0.13 + ctx.time * 1.1) * (1 - morph) * 8.0;
      finalX += noiseX;
      finalY += noiseY;
    }

    return [finalX, finalY, finalZ];
  };

  const runReformDiagnostics = useCallback((morphValue = 0) => {
    const geo = geometryRef.current;
    const mat = materialRef.current;
    const uniforms = mat?.uniforms;
    if (!geo || !uniforms) return;

    const morphType = uniforms.uMorphType?.value ?? MORPH_TYPE_ENUM.steady;
    if (Math.abs(morphType - MORPH_TYPE_ENUM.reform) > 0.5) return;

    const atmoArr = geo.attributes?.atmosphericPosition?.array;
    const textArr = geo.attributes?.text3DPosition?.array || atmoArr;
    const count = geo.attributes?.position?.count ?? 0;
    if (!count || !atmoArr) return;

    const ctx = {
      atmoArr,
      textArr,
      atmoFit: uniformVec2(uniforms.uAtmoFit, [1, 1]),
      textFit: uniformVec2(uniforms.uTextFit, [1, 1]),
      spread: uniforms.uSpreadFactor?.value ?? 1.0,
      morph: morphValue,
      morphType,
      time: uniforms.uTime?.value ?? 0,
    };

    const sampleCount = Math.min(count, 20000);
    const xAll = new Float32Array(sampleCount);
    const yAll = new Float32Array(sampleCount);
    const first = [];

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let sumX = 0, sumY = 0;
    for (let i = 0; i < sampleCount; i += 1) {
      const [fx, fy, fz] = computeFinalPosDiag(i, ctx);
      xAll[i] = fx;
      yAll[i] = fy;
      if (first.length < 20) first.push([+fx.toFixed(2), +fy.toFixed(2), +fz.toFixed(2)]);
      if (fx < minX) minX = fx;
      if (fx > maxX) maxX = fx;
      if (fy < minY) minY = fy;
      if (fy > maxY) maxY = fy;
      sumX += fx;
      sumY += fy;
    }

    const nearEdge = (val, maxAbs) => (maxAbs > 1e-5 ? Math.abs(val) > maxAbs * 0.9 : false);
    let nearEdgeX = 0;
    let nearEdgeY = 0;
    const maxAbsX = Math.max(Math.abs(minX), Math.abs(maxX));
    const maxAbsY = Math.max(Math.abs(minY), Math.abs(maxY));
    for (let i = 0; i < sampleCount; i += 1) {
      if (nearEdge(xAll[i], maxAbsX)) nearEdgeX += 1;
      if (nearEdge(yAll[i], maxAbsY)) nearEdgeY += 1;
    }

    const quantiles = (arr) => {
      if (!arr?.length) return null;
      const copy = Array.from(arr);
      copy.sort((a, b) => a - b);
      const pick = (p) => {
        const idx = Math.min(copy.length - 1, Math.max(0, Math.floor(p * (copy.length - 1))));
        return copy[idx];
      };
      return {
        p05: pick(0.05),
        p25: pick(0.25),
        p50: pick(0.5),
        p75: pick(0.75),
        p95: pick(0.95),
      };
    };

    const hist = (arr, min, max, buckets = 6) => {
      if (!arr?.length || !Number.isFinite(min) || !Number.isFinite(max)) return [];
      const span = Math.max(max - min, 1e-6);
      const out = new Array(buckets).fill(0);
      for (let i = 0; i < arr.length; i += 1) {
        const t = Math.min(buckets - 1, Math.max(0, Math.floor(((arr[i] - min) / span) * buckets)));
        out[t] += 1;
      }
      return out.map((v) => +(v / arr.length).toFixed(3));
    };

    console.log('🔬 REFORM_DIAG', {
      morph: +morphValue.toFixed(3),
      count: sampleCount,
      first20: first,
      xStats: {
        min: +minX.toFixed(2),
        max: +maxX.toFixed(2),
        mean: +(sumX / sampleCount).toFixed(2),
        nearEdgeRatio: +(nearEdgeX / sampleCount).toFixed(3),
        hist: hist(xAll, minX, maxX),
        quantiles: quantiles(xAll),
      },
      yStats: {
        min: +minY.toFixed(2),
        max: +maxY.toFixed(2),
        mean: +(sumY / sampleCount).toFixed(2),
        nearEdgeRatio: +(nearEdgeY / sampleCount).toFixed(3),
        hist: hist(yAll, minY, maxY),
        quantiles: quantiles(yAll),
      },
      note: 'CPU approximation of vertex finalPos; tier motion/damping omitted.',
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
        applyMorphUniformWrite(uniforms, 1.0, 'emergence:finalize');
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

    const textAabb = computeAABB(geo, 'text3DPosition') || computeAABB(geo, 'position');
    if (!textAabb) return;

    // Generator already fits text/atmo to the viewport; keep renderer identity fits.
    const newAtmo = [1, 1];
    const newText = [1, 1];
    const [atmoFitX, atmoFitY] = newAtmo;
    const [textFitX, textFitY] = newText;

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
  const cameraRef = useRef(null);
  useEffect(() => {
    if (camera) {
      cameraRef.current = camera;
    }
  }, [camera]);

  // FORM camera override (rest -> threshold -> interior)
  useEffect(() => {
    if (!cameraOverride) return;
    const cam = cameraRef.current;
    const target = cameraTargetRef.current;
    if (!target) return;

    const mode = cameraOverride.mode || 'rest';
    const progress = Number.isFinite(cameraOverride.progress)
      ? Math.max(0, Math.min(1, cameraOverride.progress))
      : 0;

    const rest = new THREE.Vector3(0, 0, 60);
    const threshold = new THREE.Vector3(0, 6, 36);
    const interior = new THREE.Vector3(0, 0, 18);
    const isLandingStageSlice =
      (typeof globalThis !== 'undefined' && globalThis.__DEMO_KEY__ === 'landing_stage_slice') ||
      (typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('slice') === 'landing_stage');
    const useGlyphCamera =
      isLandingStageSlice === true ||
      (cameraOverride?.useGlyphCamera === true && cameraOverride?.targetGlyph);
    const glyphMode = typeof cameraOverride?.glyphMode === 'string' ? cameraOverride.glyphMode : 'enter';
    const glyphOccurrence = Number.isFinite(cameraOverride?.glyphOccurrence)
      ? cameraOverride.glyphOccurrence
      : 1;
    const glyphTarget = isLandingStageSlice === true ? 'O' : cameraOverride?.targetGlyph;
    const glyphCamera = useGlyphCamera && glyphTarget && typeof glyphSpace?.getCameraTarget === 'function'
      ? glyphSpace.getCameraTarget(glyphTarget, isLandingStageSlice === true ? 'enter' : glyphMode, glyphOccurrence)
      : null;
    let glyphPos = glyphCamera?.position ? toVec3(glyphCamera.position, null) : null;
    let glyphLookAt = glyphCamera?.lookAt ? toVec3(glyphCamera.lookAt, null) : null;
    if ((!glyphPos || !glyphLookAt) && glyphCamera?.center) {
      const center = toVec3(glyphCamera.center, null);
      if (center) {
        const depth = Number.isFinite(glyphCamera.depth) ? glyphCamera.depth : Math.abs(interior.z);
        const forward = new THREE.Vector3(0, 0, 1);
        if (!glyphPos) glyphPos = center.clone().add(forward.multiplyScalar(depth));
        if (!glyphLookAt) glyphLookAt = center;
      }
    }

    const resolvePosition = () => {
      if (mode === 'threshold') {
        return rest.clone().lerp(threshold, progress);
      }
      if (mode === 'interior') {
        const targetPos = glyphPos || interior;
        return threshold.clone().lerp(targetPos, progress);
      }
      return rest;
    };

    const nextPos = resolvePosition();
    const resolveLookAt = () => {
      if (mode === 'interior' && (glyphLookAt || glyphPos)) {
        const targetLook = glyphLookAt || glyphPos;
        return new THREE.Vector3(0, 0, 0).lerp(targetLook, progress);
      }
      return new THREE.Vector3(0, 0, 0);
    };
    const lookAt = resolveLookAt();

    cameraOwnerRef.current = 'directive';
    if (typeof window !== 'undefined') window.__cameraOwner = cameraOwnerRef.current;

    if (cam) {
      target.startPosition.copy(cam.position);
      target.startFov = cam.fov;
    } else {
      target.startPosition.copy(target.position);
      target.startFov = target.fov;
    }

    if (target.currentLookAt) {
      target.startLookAt.copy(target.currentLookAt);
    } else {
      target.startLookAt.copy(target.lookAt);
    }

    target.position.copy(nextPos);
    target.lookAt.copy(lookAt);
    target.duration = 900;
    target.easingMode = 'ease-in-out';
    target.active = true;
    target.startTime = typeof performance !== 'undefined' && performance.now
      ? performance.now()
      : Date.now();

    if (cameraOverride.targetGlyph && uniformsRef.current) {
      const uniforms = uniformsRef.current;
      const center = { x: 0, y: 0, z: 0 };
      const radius = 4;
      const intensity = 0.6;
      glyphTargetRef.current = {
        letter: cameraOverride.targetGlyph,
        occurrence: 1,
        center,
        radius,
        intensity,
      };
      if (uniforms.uGlyphTargetActive) uniforms.uGlyphTargetActive.value = 1.0;
      if (uniforms.uGlyphTargetCenter?.value?.set) {
        uniforms.uGlyphTargetCenter.value.set(center.x, center.y, center.z);
      }
      if (uniforms.uGlyphTargetRadius) uniforms.uGlyphTargetRadius.value = radius;
      if (uniforms.uGlyphPulseIntensity) uniforms.uGlyphPulseIntensity.value = intensity;
    }
  }, [cameraOverride]);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__cameraOwner = cameraOwnerRef.current;
    }
    return () => {
      if (typeof window !== 'undefined' && window.__cameraOwner === cameraOwnerRef.current) {
        delete window.__cameraOwner;
      }
    };
  }, []);

  const handleTextPositions = useCallback((payload = {}) => {
    const geo = geometryRef.current;
    if (!geo) return;

    const stage = payload?.stage;
    if (typeof stage === 'string' && stageNameRef.current && stage !== stageNameRef.current) {
      return;
    }

    const attr = geo.attributes?.text3DPosition;
    if (!attr?.array) {
      console.warn('[WBG] No text3DPosition attribute to update');
      return;
    }

    const positions = payload?.positions;
    const next = positions instanceof Float32Array
      ? positions
      : Array.isArray(positions)
        ? new Float32Array(positions)
        : null;
    if (!next) {
      console.warn('[WBG] Invalid text positions payload', payload);
      return;
    }

    const target = attr.array;
    const copyLength = Math.min(target.length, next.length);
    if (copyLength === 0) return;
    target.set(next.subarray(0, copyLength));
    if (copyLength !== target.length) {
      console.warn('[WBG] Text positions length mismatch', {
        expected: target.length,
        received: next.length,
      });
    }
    attr.needsUpdate = true;

    fitsLockedRef.current = false;
    lastFitStampRef.current = { geoId: null, width: 0, height: 0 };
    applyRendererFits(geo, viewportHintRef.current || window?.__viewportHint);
    const count = payload?.count || Math.floor(target.length / 3);
    console.log(`[WBG] Text positions updated for "${payload?.word || 'unknown'}" (${count} particles)`);
  }, [applyRendererFits]);

  const applyLandingVelocityOpeningSeed = useCallback((uniforms, options = {}) => {
    if (!uniforms) return false;
    const seed = getLandingVelocityOpeningSeed();
    if (!seed) return false;

    let changed = false;

    const applyNumber = (uniformName, value) => {
      const uniform = uniforms[uniformName];
      const numericValue = Number(value);
      if (!uniform || !Number.isFinite(numericValue)) return;
      uniform.value = numericValue;
      uniform.needsUpdate = true;
      changed = true;
    };

    const applyVectorish = (uniformName, value) => {
      const uniform = uniforms[uniformName];
      if (!uniform || !Array.isArray(value)) return;
      const current = uniform.value;
      const isTypedArray =
        current &&
        typeof ArrayBuffer !== 'undefined' &&
        typeof ArrayBuffer.isView === 'function' &&
        ArrayBuffer.isView(current) &&
        (typeof DataView !== 'function' || !(current instanceof DataView)) &&
        typeof current.set === 'function';

      if (isTypedArray) {
        current.set(value);
      } else if (Array.isArray(current)) {
        for (let i = 0; i < Math.min(current.length, value.length); i += 1) {
          current[i] = value[i];
        }
      } else if (current?.set) {
        current.set(...value);
      } else {
        uniform.value = value.slice();
      }
      uniform.needsUpdate = true;
      changed = true;
    };

    if (seed.pointSize != null) {
      applyNumber('uPointSize', seed.pointSize);
    }

    Object.entries(seed.uniforms).forEach(([key, value]) => {
      if (typeof value === 'number') {
        applyNumber(key, value);
        return;
      }
      if (Array.isArray(value)) {
        applyVectorish(key, value);
      }
    });

    if (options.applyCamera !== false && seed.camera) {
      const target = cameraTargetRef.current;
      const cam = cameraRef.current;
      const lookAt = toVec3(seed.camera.lookAt, new THREE.Vector3(0, 0, 0)) || new THREE.Vector3(0, 0, 0);
      const position = toVec3(seed.camera.position, new THREE.Vector3(0, 0, 50)) || new THREE.Vector3(0, 0, 50);
      target.position.copy(position);
      target.startPosition.copy(position);
      target.lookAt.copy(lookAt);
      target.startLookAt.copy(lookAt);
      if (target.currentLookAt) target.currentLookAt.copy(lookAt);
      if (Number.isFinite(seed.camera.fov)) {
        target.fov = Number(seed.camera.fov);
        target.startFov = Number(seed.camera.fov);
      }
      target.duration = 0;
      target.active = false;
      target.startTime =
        typeof performance !== 'undefined' && performance.now
          ? performance.now()
          : Date.now();
      if (cam) {
        cam.position.copy(position);
        if (Number.isFinite(seed.camera.fov)) {
          cam.fov = Number(seed.camera.fov);
          cam.updateProjectionMatrix();
        }
        cam.lookAt(lookAt);
      }
      changed = true;
    }

    return changed;
  }, []);

  const lastBlueprintIdRef = useRef(null);
  const fallbackMorphRef = useRef(0);
  const lastMorphProgressRef = useRef(null);
  const textMorphRef = useRef({
    active: false,
    timeoutId: null,
    stage: null,
  });
  const dissolveLogRef = useRef(false);
  const uniformOverlayRef = useRef(null);
  const uniformOverlayEnabledRef = useRef(false);
  const reformDiagRef = useRef({ lastMorphLogged: -1 });

  useEffect(() => {
    stageNameRef.current = stageName;
  }, [stageName]);

  useEffect(() => {
    blueprintRef.current = blueprint;
  }, [blueprint]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const ensureOverlay = () => {
      const params = new URLSearchParams(window.location.search);
      const enabled = params.get('debug') === 'uniforms';
      uniformOverlayEnabledRef.current = enabled;
      if (!enabled) {
        if (uniformOverlayRef.current) {
          uniformOverlayRef.current.remove();
          uniformOverlayRef.current = null;
        }
        return;
      }
      if (!uniformOverlayRef.current) {
        const el = document.createElement('div');
        el.style.position = 'fixed';
        el.style.top = '8px';
        el.style.left = '8px';
        el.style.zIndex = '10000';
        el.style.padding = '6px 8px';
        el.style.borderRadius = '4px';
        el.style.background = 'rgba(0, 0, 0, 0.6)';
        el.style.color = '#fff';
        el.style.fontSize = '11px';
        el.style.lineHeight = '1.4';
        el.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace';
        el.style.whiteSpace = 'pre';
        el.style.pointerEvents = 'none';
        el.textContent = 'uniform overlay';
        document.body.appendChild(el);
        uniformOverlayRef.current = el;
      }
    };
    ensureOverlay();
    window.addEventListener('popstate', ensureOverlay);
    window.addEventListener('hashchange', ensureOverlay);
    return () => {
      window.removeEventListener('popstate', ensureOverlay);
      window.removeEventListener('hashchange', ensureOverlay);
      if (uniformOverlayRef.current) {
        uniformOverlayRef.current.remove();
        uniformOverlayRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof BeatBus?.on !== 'function') {
      return undefined;
    }
    const off = BeatBus.on(EVENTS.TEXT_MORPH, (payload = {}) => {
      const stage = typeof payload.stage === 'string' ? payload.stage : null;
      if (stage && stageNameRef.current && stage !== stageNameRef.current) {
        return;
      }
      const durationMs = Number.isFinite(payload.transitionDuration)
        ? payload.transitionDuration
        : 2000;
      const bufferMs = 250;
      if (textMorphRef.current.timeoutId) {
        clearTimeout(textMorphRef.current.timeoutId);
        textMorphRef.current.timeoutId = null;
      }
      textMorphRef.current.active = true;
      textMorphRef.current.stage = stage;
      textMorphRef.current.timeoutId = setTimeout(() => {
        textMorphRef.current.active = false;
        textMorphRef.current.stage = null;
        textMorphRef.current.timeoutId = null;
      }, Math.max(0, durationMs + bufferMs));
      if (DEV) {
        console.log('[WBG] TEXT_MORPH received - forcing drift window', {
          word: payload?.word,
          stage: stage || stageNameRef.current,
          durationMs,
        });
      }
    });
    return () => {
      off?.();
      if (textMorphRef.current.timeoutId) {
        clearTimeout(textMorphRef.current.timeoutId);
        textMorphRef.current.timeoutId = null;
      }
    };
  }, []);

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

  // Point size (once) — base only; shader multiplies by tier/size multipliers
  useEffect(() => {
    const u = materialRef.current?.uniforms;
    if (!u?.uPointSize) return;
    const dpr = typeof gl?.getPixelRatio === 'function'
      ? Math.min(gl.getPixelRatio(), 1.5)
      : (typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1);
    u.uPointSize.value = computeBasePointSize(dpr);
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
    applyMorphUniformWrite(mat.uniforms, v, 'morph:__applyMorph');
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
      const st = p?.to ?? p?.name ?? String(p);
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
          console.log(`[WBG] Emitting fragment intent via ${EVENTS.PARTICLE_CLICK_HIT}`);
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
      console.log('[WBG] atmosphericPositions check:', {
        exists: 'atmosphericPositions' in raw,
        type: typeof raw.atmosphericPositions,
        isFloat32Array: raw.atmosphericPositions instanceof Float32Array,
        constructor: raw.atmosphericPositions?.constructor?.name,
        length: raw.atmosphericPositions?.length,
      });
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
      if (DEV) {
        console.log('[WBG] Geometry attributes:', Object.keys(geo.attributes || {}));
      }
      const inferredCount = primaryPositions instanceof Float32Array ? primaryPositions.length / 3 : 0;
      const drawCount = raw.activeCount || raw.particleCount || inferredCount;
      const idx = new Float32Array(drawCount > 0 ? drawCount : 0);
      for (let i = 0; i < idx.length; i++) idx[i] = i;
      geo.setAttribute('particleIndex', new THREE.BufferAttribute(idx, 1));
      runWithRenderGuard(() => geo.setDrawRange(0, drawCount));
      geometryRef.current = geo;
      geometryBoundOnceRef.current = true;
      fitsLockedRef.current = false;
      if (DEV) {
        const atmoAttr = geo.attributes?.atmosphericPosition;
        if (atmoAttr?.array && atmoAttr.array.length >= 30) {
          const arr = atmoAttr.array;
          console.log('[WBG] atmosphericPosition samples:', {
            p0: [arr[0], arr[1], arr[2]],
            p1: [arr[3], arr[4], arr[5]],
            p2: [arr[6], arr[7], arr[8]],
            xValues: [arr[0], arr[3], arr[6], arr[9], arr[12], arr[15], arr[18], arr[21], arr[24], arr[27]],
          });
        } else if (atmoAttr?.array) {
          console.log('[WBG] atmosphericPosition samples: insufficient data', {
            length: atmoAttr.array.length,
          });
        } else {
          console.log('[WBG] atmosphericPosition samples: attribute missing');
        }
      }
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
          if (DEV) {
            const atmoFit = mat.uniforms?.uAtmoFit?.value;
            const atmoFitValue = atmoFit?.toArray
              ? atmoFit.toArray().slice(0, 2)
              : (Array.isArray(atmoFit)
                  ? atmoFit.slice(0, 2)
                  : (atmoFit && typeof atmoFit.x === 'number' && typeof atmoFit.y === 'number')
                    ? [atmoFit.x, atmoFit.y]
                    : atmoFit);
            console.log('[WBG] uAtmoFit after bind:', atmoFitValue);
          }
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
            applyMorphUniformWrite(mat.uniforms, 1, 'blueprint:bind:qr');
            if (mat.uniforms.uStageProgress) mat.uniforms.uStageProgress.value = 1;
            if (mat.uniforms.uPostMorphFreeze) mat.uniforms.uPostMorphFreeze.value = 1;
          } else {
            applyMorphUniformWrite(mat.uniforms, 0, 'blueprint:bind:full');
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
            u.uPointSize.value = computeBasePointSize(dpr);
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
      if (!isEmergence && isLandingVelocitySlice() && mat?.uniforms) {
        const seededLandingOpening = applyLandingVelocityOpeningSeed(mat.uniforms, { applyCamera: true });
        if (seededLandingOpening) {
          mat.uniformsNeedUpdate = true;
          if (import.meta?.env?.DEV) {
            console.log('[WBG] Seeded landing velocity opening state on bind');
          }
        }
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
        if (uniformsNow?.uQrPhotoMode) {
          uniformsNow.uQrPhotoMode.value = 0.0;
          uniformsNow.uQrPhotoMode.needsUpdate = true;
        }
        qrModeRef.current = false;
        if (gl && restoreClearRef.current) {
          const [r, g, b, a] = restoreClearRef.current;
          gl.setClearColor(new THREE.Color(r, g, b), a);
        }
        if (materialRef.current && restoreBlendRef.current) {
          materialRef.current.blending = restoreBlendRef.current;
          materialRef.current.transparent = restoreTransparentRef.current ?? materialRef.current.transparent;
          materialRef.current.needsUpdate = true;
        }
        timeTickEnabledRef.current = true;
      }

      if (isQrBlueprint && !qrModeRef.current) {
        const renderer = gl;
        if (renderer) {
          const previousColor = renderer.getClearColor(new THREE.Color());
          const previousAlpha = typeof renderer.getClearAlpha === 'function' ? renderer.getClearAlpha() : 1;
          restoreClearRef.current = [previousColor.r, previousColor.g, previousColor.b, previousAlpha];
          // Keep QR on a dark canvas; modules render white via shader.
          renderer.setClearColor(new THREE.Color(0, 0, 0), 1);
        }
        const uniforms = materialRef.current?.uniforms;
        if (materialRef.current) {
          restoreBlendRef.current = materialRef.current.blending;
          restoreTransparentRef.current = materialRef.current.transparent;
          materialRef.current.blending = THREE.NormalBlending;
          materialRef.current.transparent = false;
          materialRef.current.needsUpdate = true;
        }
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
          // Enlarge modules for readability during QR.
          uniforms.uPointSize.value = Math.max(6.0, 6.0 * dpr);
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
        if (uniforms?.uQrPhotoMode) {
          uniforms.uQrPhotoMode.value = 1.0;
          uniforms.uQrPhotoMode.needsUpdate = true;
        }
        if (uniforms?.uBandFade) {
          uniforms.uBandFade.value = 0.0;
          uniforms.uBandFade.needsUpdate = true;
        }
        if (uniforms?.uBandHeight) {
          uniforms.uBandHeight.value = 0.0;
          uniforms.uBandHeight.needsUpdate = true;
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
    applyLandingVelocityOpeningSeed,
  ]);

  useEffect(() => {
    if (typeof BeatBus?.on !== 'function') return undefined;
    const off = BeatBus.on(EVENTS.TEXT_POSITIONS_READY, handleTextPositions);
    return () => off && off();
  }, [handleTextPositions]);

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

      const resolveDirectiveColor = () => {
        if (typeof payload?.color === 'string') return payload.color;
        if (typeof payload?.uColor === 'string') return payload.uColor;
        if (typeof payload?.uniforms?.uColor === 'string') return payload.uniforms.uColor;
        if (typeof payload?.effect?.uColor === 'string') return payload.effect.uColor;
        if (typeof payload?.effect?.uniforms?.uColor === 'string') return payload.effect.uniforms.uColor;
        return null;
      };

      const colorHex = resolveDirectiveColor();
      if (typeof colorHex === 'string' && colorHex.startsWith('#')) {
        let color = null;
        try {
          color = new THREE.Color(colorHex);
        } catch {}

        if (color) {
          const applyColorUniform = (uniform) => {
            if (!uniform) return;
            const target = uniform.value ?? uniform;
            if (target?.setRGB) {
              target.setRGB(color.r, color.g, color.b);
            } else if (ArrayBuffer.isView(target) && !(target instanceof DataView)) {
              target[0] = color.r;
              target[1] = color.g;
              target[2] = color.b;
            } else if (Array.isArray(target)) {
              target[0] = color.r;
              target[1] = color.g;
              target[2] = color.b;
            } else if (target?.set) {
              target.set(color.r, color.g, color.b);
            } else {
              uniform.value = [color.r, color.g, color.b];
            }
            uniform.needsUpdate = true;
          };

          applyColorUniform(uniforms.uColorCurrent);
          applyColorUniform(uniforms.uPalette0);
          console.log('[WBG] Applied directive color:', colorHex);
        }
      }

      const clamp01Local = (x) => Math.max(0, Math.min(1, Number(x)));

      const setUniformNumber = (uniformName, value) => {
        if (typeof value !== 'number') return;
        if (isScrollPhase && (uniformName === 'uMorphProgress' || uniformName === 'uStageProgress')) {
          if (uniformName === 'uMorphProgress') {
            trackMorphWrite('directive:setUniformNumber:blocked', value, {
              phase,
              blocked: true,
              reason: 'scroll_phase_block',
            });
          }
          if (DEV) console.warn('[WBG] Scroll-phase directive blocked morph write', { uniformName, value });
          return;
        }
        const uniform = uniforms[uniformName];
        if (!uniform) return;
        if (!guardUniformWrite(origin, uniformName)) return;
        uniform.value = value;
        uniform.needsUpdate = true;
        if (uniformName === 'uMorphProgress') {
          trackMorphWrite('directive:setUniformNumber:applied', value, {
            phase,
            blocked: false,
            reason: null,
            directiveSource,
            verb: payload?.verb || payload?.effect?.verb || null,
          });
        }
      };
      const applyUniformArray = (uniformName, uniform, value) => {
        if (!guardUniformWrite(origin, uniformName)) return;
        if (!uniform) return;
        if (Array.isArray(value)) {
          const current = uniform.value;
          const isTypedArray =
            current &&
            ArrayBuffer.isView(current) &&
            !(current instanceof DataView) &&
            typeof current.set === 'function';

          if (isTypedArray) {
            current.set(value);
          } else if (Array.isArray(current)) {
            for (let i = 0; i < Math.min(current.length, value.length); i += 1) {
              current[i] = value[i];
            }
          } else if (current?.set) {
            current.set(...value);
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
        // Seed a gentle drift template only when tier params are still unset.
        const template = [0.8, 0.2, 0.5, 0.0];
        const isUnsetTuple = (uniform) => {
          const current = uniform?.value;
          if (!current) return true;
          const length = current.length;
          if (typeof length !== 'number') return false;
          for (let i = 0; i < length; i += 1) {
            const n = current[i];
            if (Number.isFinite(n) && n !== 0) return false;
          }
          return true;
        };

        if (isUnsetTuple(uniforms.uTierParams0)) applyUniformArray('uTierParams0', uniforms.uTierParams0, template);
        if (uniforms.uTierParams1 && isUnsetTuple(uniforms.uTierParams1)) {
          applyUniformArray('uTierParams1', uniforms.uTierParams1, template);
        }
        if (uniforms.uTierParams2 && isUnsetTuple(uniforms.uTierParams2)) {
          applyUniformArray('uTierParams2', uniforms.uTierParams2, template);
        }
        if (uniforms.uTierParams3 && isUnsetTuple(uniforms.uTierParams3)) {
          applyUniformArray('uTierParams3', uniforms.uTierParams3, template);
        }
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
        applyVisualVerbDirective(payload, uniforms, origin, (uniformName, value, info = {}) => {
          if (uniformName !== 'uMorphProgress') return;
          trackMorphWrite('directive:applyVisualVerbDirective', value, {
            phase,
            directiveSource,
            verb: payload?.verb || payload?.effect?.verb || info?.verb || null,
          });
        });
      }

      if (payload?.clearGlyphTarget && uniforms) {
        glyphTargetRef.current = null;
        if (uniforms.uGlyphTargetActive) uniforms.uGlyphTargetActive.value = 0.0;
        if (uniforms.uGlyphPulseIntensity) uniforms.uGlyphPulseIntensity.value = 0.0;
      }

      if (payload?.targetGlyph && uniforms) {
        const target = payload.targetGlyph;
        const centroid = target.centroid;
        const bounds = target.bounds;
        const center = centroid
          ? { x: centroid.x ?? 0, y: centroid.y ?? 0, z: centroid.z ?? 0 }
          : bounds
            ? {
                x: (bounds.minX + bounds.maxX) * 0.5,
                y: (bounds.minY + bounds.maxY) * 0.5,
                z: (bounds.minZ + bounds.maxZ) * 0.5,
              }
            : { x: 0, y: 0, z: 0 };
        const width = bounds ? bounds.maxX - bounds.minX : 0;
        const height = bounds ? bounds.maxY - bounds.minY : 0;
        const depth = bounds ? bounds.maxZ - bounds.minZ : 0;
        const maxExtent = Math.max(width, height, depth, 1);
        const radius = Number.isFinite(target.radius)
          ? target.radius
          : maxExtent * 0.6;
        const intensity = Number.isFinite(target.intensity) ? target.intensity : 0.6;

        glyphTargetRef.current = {
          letter: target.letter || null,
          occurrence: target.occurrence || 1,
          center,
          radius,
          intensity,
        };

        if (uniforms.uGlyphTargetActive) uniforms.uGlyphTargetActive.value = 1.0;
        if (uniforms.uGlyphTargetCenter?.value?.set) {
          uniforms.uGlyphTargetCenter.value.set(center.x, center.y, center.z);
        }
        if (uniforms.uGlyphTargetRadius) uniforms.uGlyphTargetRadius.value = radius;
        if (uniforms.uGlyphPulseIntensity) uniforms.uGlyphPulseIntensity.value = intensity;
      }

      // Camera directive handling
      if (payload.kind === 'camera' || payload.camera) {
        const camPayload = payload.camera || payload;
        cameraOwnerRef.current = payload.source === 'demo' ? 'demo' : 'directive';
        if (typeof window !== 'undefined') window.__cameraOwner = cameraOwnerRef.current;
        const target = cameraTargetRef.current;
        const cam = cameraRef.current;
        if (cam) {
          target.startPosition.copy(cam.position);
          target.startFov = cam.fov;
        } else {
          target.startPosition.copy(target.position);
          target.startFov = target.fov;
        }
        if (target.currentLookAt) {
          target.startLookAt.copy(target.currentLookAt);
        } else {
          target.startLookAt.copy(target.lookAt);
        }
        if (camPayload.position) {
          if (Array.isArray(camPayload.position)) {
            target.position.set(
              camPayload.position[0] ?? 0,
              camPayload.position[1] ?? 0,
              camPayload.position[2] ?? 50
            );
          } else {
            target.position.set(
              camPayload.position.x ?? 0,
              camPayload.position.y ?? 0,
              camPayload.position.z ?? 50
            );
          }
        }
        if (camPayload.dolly) {
          target.position.x += camPayload.dolly.x ?? 0;
          target.position.y += camPayload.dolly.y ?? 0;
          target.position.z += camPayload.dolly.z ?? 0;
        }
        if (camPayload.lookAt) {
          if (Array.isArray(camPayload.lookAt)) {
            target.lookAt.set(
              camPayload.lookAt[0] ?? 0,
              camPayload.lookAt[1] ?? 0,
              camPayload.lookAt[2] ?? 0
            );
          } else {
            target.lookAt.set(
              camPayload.lookAt.x ?? 0,
              camPayload.lookAt.y ?? 0,
              camPayload.lookAt.z ?? 0
            );
          }
        }
        if (camPayload.fov !== undefined) {
          target.fov = camPayload.fov;
        }
        if (camPayload.durationMs !== undefined || camPayload.duration !== undefined) {
          const durationMs =
            camPayload.durationMs !== undefined
              ? camPayload.durationMs
              : camPayload.duration;
          target.duration = durationMs;
        }
        if (typeof camPayload.easingMode === 'string' && camPayload.easingMode.length) {
          target.easingMode = camPayload.easingMode;
        } else {
          target.easingMode = 'ease-in-out';
        }
        target.active = true;
        target.startTime = typeof performance !== 'undefined' && performance.now
          ? performance.now()
          : Date.now();
        console.log('[WBG] Camera directive received:', camPayload);
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
      const raw = payload?.progress ?? null;
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

      const mat = materialRef.current;
      const uniforms = mat?.uniforms;
      if (!uniforms) {
        if (DEV) console.warn('⚠️ [MORPH] Material uniforms missing');
        return;
      }

      const landingPreset =
        typeof window !== 'undefined'
          ? window.Canonical?.landingStageSliceResolved?.preset
          : null;
      const landingParams =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search)
          : null;
      const isLandingVelocityPreset =
        landingParams?.get('slice') === 'landing_stage' &&
        landingPreset === 'velocity_stage';
      const lockVelocityLandingMorph =
        isLandingVelocityPreset &&
        Number(uniforms.uPostMorphFreeze?.value ?? 0) >= 1;
      if (lockVelocityLandingMorph) {
        fallbackMorphRef.current = 1;
        __applyMorph(1);
        if (uniforms.uStageProgress) {
          uniforms.uStageProgress.value = 1;
          uniforms.uStageProgress.needsUpdate = true;
        }
        mat.uniformsNeedUpdate = true;
        return;
      }

      const lastMeta = lastBlueprintMetaRef.current || {};
      const setEnvUniform = (name, val) => {
        if (!uniforms[name]) return;
        uniforms[name].value = val;
        uniforms[name].needsUpdate = true;
      };

    const lastValue = lastMorphProgressRef.current;
    const landingMorphState =
      isLandingVelocityPreset && typeof window !== 'undefined'
        ? {
            floor: Number(window.__landingVelocityMorphFloor__ || 0),
            riseStarted: window.__landingVelocityMorphRiseStarted__ === true,
          }
        : null;
    const localMorphFloor =
      isLandingVelocityPreset && Number.isFinite(lastValue)
        ? lastValue
        : 0;
    const riseStartedNow = landingMorphState
      ? (landingMorphState.riseStarted || value >= 0.1)
      : false;
    const stagedValue = riseStartedNow ? value : 0;
    const postRiseFloor = riseStartedNow ? 0.1 : 0;
    const resolvedValue = isLandingVelocityPreset
      ? Math.max(stagedValue, localMorphFloor, landingMorphState?.floor || 0, postRiseFloor)
      : value;
    if (landingMorphState && typeof window !== 'undefined') {
      window.__landingVelocityMorphRiseStarted__ = riseStartedNow;
      window.__landingVelocityMorphFloor__ = Math.max(landingMorphState.floor, resolvedValue, postRiseFloor);
    }
      fallbackMorphRef.current = resolvedValue;

      const env = getMorphEnvelope(resolvedValue);
      setEnvUniform('uImplodeStrength', env.implode);
      setEnvUniform('uChaosStrength', env.chaos);
      setEnvUniform('uCoalesceStrength', env.coalesce);
      setEnvUniform('uSettleStrength', env.settle);

    __applyMorph(resolvedValue);

    const isAscending = Number.isFinite(lastValue) ? resolvedValue >= lastValue : false;
    const isAscendingStrict = Number.isFinite(lastValue) ? resolvedValue > lastValue : false;
    const isDescending = Number.isFinite(lastValue) ? resolvedValue < lastValue : false;
    lastMorphProgressRef.current = resolvedValue;

    const driftState = morphDriftRef.current;
    const forceDrift = !isLandingVelocityPreset && textMorphRef.current.active;
    if (!isLandingVelocityPreset && uniforms.uTierMode && uniforms.uTierMode.value) {
      const tierArr = uniforms.uTierMode.value;
      const dissolveThreshold = 0.5;
      const reformThreshold = 0.95;
      const shouldForce = forceDrift || resolvedValue <= dissolveThreshold;

      if (shouldForce) {
        if (!driftState.active) {
          driftState.active = true;
          const prevTierMode = Array.from(tierArr);
          driftState.tierModes = prevTierMode;
          console.log('[WBG] Morph dissolve - forcing drift mode', {
            morphProgress: resolvedValue,
            prevTierMode,
            newTierMode: [0, 0, 0, 0],
          });
          if (uniforms.uFlowTurbulence) {
            driftState.flowTurbulence = uniforms.uFlowTurbulence.value;
          }
          if (uniforms.uStreakIntensity) {
            driftState.streakIntensity = uniforms.uStreakIntensity.value;
          }
          if (uniforms.uSpreadFactor) {
            driftState.spreadFactor = uniforms.uSpreadFactor.value;
          }
          if (uniforms.uMorphType) {
            driftState.morphType = uniforms.uMorphType.value;
          }
        }

        let tierChanged = false;
        for (let i = 0; i < tierArr.length; i += 1) {
          if (tierArr[i] !== 0) {
            tierArr[i] = 0;
            tierChanged = true;
          }
        }
        if (tierChanged) {
          uniforms.uTierMode.needsUpdate = true;
          console.log('[WBG] uTierMode after override:', Array.from(tierArr));
        }
        if (forceDrift && isDescending && uniforms.uMorphType
          && uniforms.uMorphType.value !== MORPH_TYPE_ENUM.dissolve) {
          uniforms.uMorphType.value = MORPH_TYPE_ENUM.dissolve;
          uniforms.uMorphType.needsUpdate = true;
        } else if (forceDrift && isAscendingStrict && resolvedValue < reformThreshold && uniforms.uMorphType
          && uniforms.uMorphType.value !== MORPH_TYPE_ENUM.reform) {
          uniforms.uMorphType.value = MORPH_TYPE_ENUM.reform;
          uniforms.uMorphType.needsUpdate = true;
        }

        if (uniforms.uFlowTurbulence && uniforms.uFlowTurbulence.value !== 0.4) {
          uniforms.uFlowTurbulence.value = 0.4;
          uniforms.uFlowTurbulence.needsUpdate = true;
        }
        if (uniforms.uStreakIntensity && uniforms.uStreakIntensity.value !== 0.1) {
          uniforms.uStreakIntensity.value = 0.1;
          uniforms.uStreakIntensity.needsUpdate = true;
        }
        if (uniforms.uSpreadFactor) {
          const targetSpread = forceDrift && isDescending ? 2.0 : 1.2;
          if (uniforms.uSpreadFactor.value !== targetSpread) {
            uniforms.uSpreadFactor.value = targetSpread;
            uniforms.uSpreadFactor.needsUpdate = true;
          }
        }
      }

      if (driftState.active && isAscending && resolvedValue >= reformThreshold) {
        if (textMorphRef.current.active) {
          textMorphRef.current.active = false;
          if (textMorphRef.current.timeoutId) {
            clearTimeout(textMorphRef.current.timeoutId);
            textMorphRef.current.timeoutId = null;
          }
          textMorphRef.current.stage = null;
        }
        if (Array.isArray(driftState.tierModes)) {
          for (let i = 0; i < tierArr.length; i += 1) {
            tierArr[i] = driftState.tierModes[i] ?? tierArr[i];
          }
          uniforms.uTierMode.needsUpdate = true;
        }
        if (uniforms.uFlowTurbulence && Number.isFinite(driftState.flowTurbulence)) {
          uniforms.uFlowTurbulence.value = driftState.flowTurbulence;
          uniforms.uFlowTurbulence.needsUpdate = true;
        }
        if (uniforms.uStreakIntensity && Number.isFinite(driftState.streakIntensity)) {
          uniforms.uStreakIntensity.value = driftState.streakIntensity;
          uniforms.uStreakIntensity.needsUpdate = true;
        }
        if (uniforms.uSpreadFactor && Number.isFinite(driftState.spreadFactor)) {
          uniforms.uSpreadFactor.value = driftState.spreadFactor;
          uniforms.uSpreadFactor.needsUpdate = true;
        }
        if (uniforms.uMorphType && Number.isFinite(driftState.morphType)) {
          uniforms.uMorphType.value = driftState.morphType;
          uniforms.uMorphType.needsUpdate = true;
        }
        driftState.active = false;
        driftState.tierModes = null;
        driftState.flowTurbulence = null;
        driftState.streakIntensity = null;
        driftState.spreadFactor = null;
        driftState.morphType = null;
      }
    }

    if (isAscendingStrict && resolvedValue > 0.5) {
      const lastLogged = reformDiagRef.current.lastMorphLogged ?? -1;
      if (resolvedValue - lastLogged >= 0.1) {
        runReformDiagnostics(resolvedValue);
        reformDiagRef.current.lastMorphLogged = resolvedValue;
      }
    } else if (isDescending) {
      reformDiagRef.current.lastMorphLogged = -1;
    }

    if (!isLandingVelocityPreset && resolvedValue < 0.1) {
      if (!dissolveLogRef.current) {
        dissolveLogRef.current = true;
        console.log('[WBG] DISSOLVE UNIFORM STATE:', {
          uAtmoFit: mat.uniforms.uAtmoFit?.value,
          uTierMode: mat.uniforms.uTierMode?.value,
          uGridSpacing: mat.uniforms.uGridSpacing?.value,
          uMorphProgress: resolvedValue,
          uMorphType: mat.uniforms.uMorphType?.value,
          uSpreadFactor: mat.uniforms.uSpreadFactor?.value,
        });
      }
    } else if (resolvedValue > 0.8) {
      dissolveLogRef.current = false;
    }

    // Ensure visibility baseline on every morph tick (defensive)
    if (uniforms.uPostMorphFreeze && uniforms.uPostMorphFreeze.value !== 0.0) {
      uniforms.uPostMorphFreeze.value = 0.0;
      mat.uniformsNeedUpdate = true;
    }
    if (!isLandingVelocityPreset) {
      if (uniforms.uOpacityMin && uniforms.uOpacityMin.value < 0.4) {
        uniforms.uOpacityMin.value = 0.5;
        uniforms.uOpacityMin.needsUpdate = true;
      }
      if (uniforms.uOpacityMax && uniforms.uOpacityMax.value < 0.8) {
        uniforms.uOpacityMax.value = 1.0;
        uniforms.uOpacityMax.needsUpdate = true;
      }
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
        uniforms.uStageProgress.value = resolvedValue;
      }
      mat.uniformsNeedUpdate = true;
      mat.needsUpdate = true;

      const skipFreezeForOpening = isOpeningInProgress();
      const currentStage = stageNameRef.current || 'genesis';
      const isGenesis = currentStage === 'genesis';

      // Only auto-freeze non-Genesis stages after emergence completes.
      const allowAutoFreeze =
        !isGenesis && !skipFreezeForOpening;

      if (emergencePendingRef.current && !emittedEmergedRef.current && resolvedValue >= 0.995) {
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
        console.log('🔬 [MORPH] Updated:', resolvedValue.toFixed(3));
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
    const palette = pickStageColors(stageName);
    const landingPreset =
      typeof window !== 'undefined'
        ? window.Canonical?.landingStageSliceResolved?.preset
        : null;
    const isLandingVelocityPreset = landingPreset === 'velocity_stage';
    if (isLandingVelocityPreset) {
      fallbackMorphRef.current = 1;
    }
    const initialMorph = isLandingVelocityPreset ? 1 : clamp01(fallbackMorphRef.current);
    const blueprintCount = blueprint?.activeCount || blueprint?.particleCount || blueprint?.maxParticles || 0;
    const resolveDpr = () => {
      try { return Math.min(gl?.getPixelRatio?.() ?? window?.devicePixelRatio ?? 1, 1.5); }
      catch { return 1; }
    };
    const basePointSize = computeBasePointSize(resolveDpr());

    let mat = materialRef.current;
    let created = false;

    if (!mat) {
      created = true;
      mat = new THREE.ShaderMaterial({
        onBeforeCompile: () => { try { console.log('🧪 Shader compiled'); } catch {} },
        uniforms: {
          uTime:            { value: 0 },
          uMorphProgress:   { value: initialMorph },
          uScrollProgress:  { value: 0 },
          uStageProgress:   { value: initialMorph },
          uStageBlend:      { value: 0 },
          uAtlasTexture:    { value: atlasTexture },
          uTotalSprites:    { value: 16 },
          uPointSize:       { value: basePointSize },
          uDepthFalloffPower: { value: 1.0 },
          uMotionMode:      { value: 0.0 },
          uDevicePixelRatio:{ value: resolveDpr() },
          uResolution:      { value: new THREE.Vector2(1, 1) },
          uAtmoFit:         { value: new THREE.Vector2(1, 1) },
          uTextFit:         { value: new THREE.Vector2(1, 1) },
          uMoveDampStart:   { value: 0.96 },
          uMoveDampStartY:  { value: 0.9 },
          uPostMorphFreeze: { value: 0.0 },
          uActiveCount:     { value: blueprintCount },
          uTierCutoff:      { value: blueprintCount || 15000 },
          uFadeProgress:    { value: 1.0 },
          uOpacityMin:      { value: 0.5 },
          uOpacityMax:      { value: 1.0 },
          uGaussianSigma:   { value: 2.5 },
          uBandHeight:      { value: bandHeightRef.current || 0 },
          uBandFade:        { value: 0 },
          uQrPhotoMode:     { value: 0.0 },
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
          uGlyphTargetActive: { value: 0.0 },
          uGlyphTargetCenter: { value: new THREE.Vector3(0, 0, 0) },
          uGlyphTargetRadius: { value: 1.0 },
          uGlyphPulseIntensity: { value: 0.0 },
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
      setMaterialReady(true);
    }

    const uniforms = mat.uniforms || {};
    uniformsRef.current = mat.uniforms || uniformsRef.current;
    if (created && uniforms.uMorphProgress) {
      trackMorphWrite('material:init-default', uniforms.uMorphProgress.value, {
        phase: 'material_init',
      });
    }
    if (!uniforms.uSpreadFactor) uniforms.uSpreadFactor = { value: 1.0 };
    if (!uniforms.uDepthFalloffPower) uniforms.uDepthFalloffPower = { value: 1.0 };
    if (!uniforms.uMorphType) uniforms.uMorphType = { value: MORPH_TYPE_ENUM.steady };
    if (!uniforms.uOpacityMin) uniforms.uOpacityMin = { value: 0.5 };
    if (!uniforms.uOpacityMax) uniforms.uOpacityMax = { value: 1.0 };
    if (uniforms.uAtlasTexture) uniforms.uAtlasTexture.value = atlasTexture;
    if (uniforms.uStageIndex) uniforms.uStageIndex.value = stageIndex;
    if (uniforms.uBrainRegion) uniforms.uBrainRegion.value = stageIndex;
    if (uniforms.uPointSize) uniforms.uPointSize.value = basePointSize;
    if (uniforms.uDevicePixelRatio) {
      try { uniforms.uDevicePixelRatio.value = resolveDpr(); }
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.__cameraDebug = {
      getCamera: () => cameraRef.current,
      getTarget: () => cameraTargetRef.current,
      forceMove: (z = 30, fov = null) => {
        const cam = cameraRef.current;
        if (!cam) {
          console.warn('[CAM] No camera available to force move');
          return null;
        }
        cam.position.z = z;
        if (Number.isFinite(fov)) {
          cam.fov = fov;
          cam.updateProjectionMatrix();
        }
        cam.updateMatrixWorld?.();
        console.log('[CAM] Forced to', { z, fov });
        return { position: cam.position.toArray(), fov: cam.fov };
      },
    };
    let camLogInterval = null;
    if (import.meta?.env?.DEV) {
      camLogInterval = window.setInterval(() => {
        const cam = cameraRef.current;
        if (!cam) return;
        const pos = typeof cam.position?.toArray === 'function'
          ? cam.position.toArray().map((v) => Number.isFinite(v) ? Number(v.toFixed(2)) : v)
          : null;
        const fov = Number.isFinite(cam.fov) ? Number(cam.fov.toFixed(1)) : cam.fov;
        const zoom = Number.isFinite(cam.zoom) ? Number(cam.zoom.toFixed(2)) : cam.zoom;
        console.log('[CAM STATE]', { pos, fov, zoom });
      }, 1000);
    }
    return () => {
      if (camLogInterval) {
        window.clearInterval(camLogInterval);
      }
      if (window.__cameraDebug) delete window.__cameraDebug;
    };
  }, []);

  // Dev helper: full visual state snapshot + uniform accessor (direct from materialRef)
  useEffect(() => {
    if (typeof window === 'undefined' || !import.meta?.env?.DEV) return undefined;

    const readUniform = (name) => {
      const mat = materialRef.current;
      const uniform = mat?.uniforms?.[name];
      if (!uniform) return 'NOT FOUND';
      const val = uniform.value;
      if (val == null) return null;
      if (typeof val === 'number' || typeof val === 'string' || typeof val === 'boolean') return val;
      if (Array.isArray(val)) return [...val];
      if (val?.toArray) {
        const out = [];
        val.toArray(out);
        return out;
      }
      if (typeof val.x !== 'undefined' || typeof val.y !== 'undefined') {
        return [val.x, val.y, val.z].filter((v) => typeof v !== 'undefined');
      }
      return val;
    };

    window.__getUniform = readUniform;
    window.__fullVisualState = () => {
      const cam = window.__cameraDebug?.getCamera?.();
      return {
        camera: {
          position: cam?.position?.toArray?.() ?? null,
          fov: cam?.fov ?? null,
          zoom: cam?.zoom ?? null,
          near: cam?.near ?? null,
          far: cam?.far ?? null,
        },
        uniforms: {
          uTextFit: readUniform('uTextFit'),
          uAtmoFit: readUniform('uAtmoFit'),
          uPointSize: readUniform('uPointSize'),
          uSpreadFactor: readUniform('uSpreadFactor'),
          uMorphProgress: readUniform('uMorphProgress'),
          uStageBlend: readUniform('uStageBlend'),
        },
        viewport: {
          width: typeof window !== 'undefined' ? window.innerWidth : null,
          height: typeof window !== 'undefined' ? window.innerHeight : null,
          pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : null,
        },
      };
    };
    return () => {
      if (window.__fullVisualState) delete window.__fullVisualState;
      if (window.__getUniform) delete window.__getUniform;
    };
  }, []);


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
    const deterministicMode =
      typeof window !== 'undefined' && window.__DETERMINISTIC_MODE__ === true;
    if (deterministicMode) {
      timeTickEnabledRef.current = false;
      if (mat.uniforms.uPostMorphFreeze) {
        mat.uniforms.uPostMorphFreeze.value = 1.0;
        mat.uniforms.uPostMorphFreeze.needsUpdate = true;
      }
      if (mat.uniforms.uTime) {
        mat.uniforms.uTime.value = 0.0;
      }
    }
    if (timeTickEnabledRef.current && mat.uniforms.uTime) {
      mat.uniforms.uTime.value = state.clock.elapsedTime;
    }
    mat.uniforms.uScrollProgress.value = sp;
    mat.uniforms.uStageBlend.value     = (stageName === 'genesis') ? 0 : sp;
    mat.uniforms.uActiveCount.value    = activeCount;
    mat.uniforms.uTierCutoff.value     = activeCount;
    if (uniformOverlayEnabledRef.current && uniformOverlayRef.current) {
      const u = mat.uniforms;
      const atmoFit = u.uAtmoFit?.value ?? u.uAtmoFit;
      const tierMode = u.uTierMode?.value ?? u.uTierMode;
      const gridSpacing = u.uGridSpacing?.value ?? u.uGridSpacing;
      const morphValue = u.uMorphProgress?.value;
      uniformOverlayRef.current.textContent = [
        `uAtmoFit: ${formatVec2(atmoFit)}`,
        `uTierMode: ${formatArray(tierMode, 4, 2)}`,
        `uGridSpacing: ${formatVec2(gridSpacing)}`,
        `uMorphProgress: ${formatNumber(morphValue, 3)}`,
      ].join('\n');
    }

    const deltaSeconds = Number.isFinite(delta) ? delta : state.clock.getDelta();
    const target = cameraTargetRef.current;
    if (target?.active && (cameraRef.current || state?.camera)) {
      const cam = cameraRef.current || state.camera;
      const nowMs = typeof performance !== 'undefined' && performance.now
        ? performance.now()
        : Date.now();
      const durationMs = Number.isFinite(target.duration) && target.duration > 0 ? target.duration : 1;
      const elapsed = nowMs - (target.startTime || nowMs);
      const t = Math.min(Math.max(elapsed / durationMs, 0), 1);
      const easingMode = target.easingMode || 'ease-in-out';
      let eased = t * t * (3 - 2 * t);
      if (easingMode === 'linear') {
        eased = t;
      } else if (easingMode === 'ease-in') {
        eased = t * t;
      } else if (easingMode === 'ease-out') {
        eased = 1 - (1 - t) * (1 - t);
      }

      cam.position.lerpVectors(target.startPosition, target.position, eased);

      if (target.lookAt) {
        const lookAtTarget = cameraLookAtTempRef.current;
        lookAtTarget.lerpVectors(target.startLookAt, target.lookAt, eased);
        cam.lookAt(lookAtTarget);
        if (target.currentLookAt) {
          target.currentLookAt.copy(lookAtTarget);
        }
      }

      if (Number.isFinite(target.fov)) {
        const startFov = Number.isFinite(target.startFov) ? target.startFov : cam.fov;
        cam.fov = THREE.MathUtils.lerp(startFov, target.fov, eased);
        cam.updateProjectionMatrix();
      }

      if (target.debug) {
        console.log('[CAM] tick', {
          pos: cam.position.toArray(),
          fov: cam.fov,
          t: Number.isFinite(t) ? Number(t.toFixed(3)) : t,
          target: target.position.toArray(),
        });
      }

      if (t >= 1) {
        target.active = false;
        console.log('[WBG] Camera reached target');
      }
    }
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
      !emittedEmergedRef.current ||
      cameraTargetRef.current?.active;

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
  if (!atlasTexture || !blueprint || !materialReady || !materialRef.current || !geometryRef.current) {
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

/* eslint-disable no-empty */
// src/components/webgl/WebGLBackground.jsx
// Dumb renderer for BeatGlyph v3.3 — binds blueprint attributes & uniforms only.

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EVENTS } from '@/theater/events.js';
import BeatBus from '@modules/orchestration/core/BeatBus.js';

import { getPointSpriteAtlasSingleton } from './consciousness/PointSpriteAtlas.js';
import { Canonical } from '../../config/canonical/canonicalAuthority.js';

// Shaders
import vertexShaderSource from '../../shaders/templates/consciousness-vertex.glsl?raw';
import fragmentShaderSource from '../../shaders/templates/consciousness-fragment.glsl?raw';

const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));

// ───────────────── helpers ─────────────────
function pickStageColors(stageName) {
  const s = Canonical?.stages?.[stageName] || {};
  const colors = s.colors || ['#00ffcc', '#f59e0b', '#ffffff'];

  const order = Canonical?.stageOrder || [];
  const idx = Math.max(0, order.indexOf(stageName));
  const nextStage = order[Math.min(idx + 1, Math.max(0, order.length - 1))];
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
  return { bp, stageName, quality, cached };
}

// ──────────────── component ────────────────
function WebGLBackground({ morphProgress = 0, scrollProgress = 0 }) {
  // refs
  const meshRef = useRef();
  const geometryRef = useRef();
  const materialRef = useRef();
  const lastBlueprintIdRef = useRef(null);
  const lastFullStageRef = useRef(null);

  const { size, gl } = useThree();

  // state
  const [blueprint, setBlueprint] = useState(null);
  const [stageName, setStageName] = useState('genesis');
  const [atlasTexture, setAtlasTexture] = useState(null);
  const [activeCount, setActiveCount] = useState(0);

  // fallback morph if parent props not wired yet
  const fallbackMorphRef = useRef(0);

  // ── Dev morph sink
  const __applyMorph = (v) => {
    try {
      const mat =
        materialRef.current ||
        globalThis.__consciousnessMaterial ||
        (globalThis.__webglBackground && globalThis.__webglBackground.material) ||
        null;
      if (!mat || !mat.uniforms) return;
      const u = mat.uniforms;
      if (u.uMorphProgress) u.uMorphProgress.value = v;
      else if (u.morphProgress) u.morphProgress.value = v;
      else if (u.uMorph) u.uMorph.value = v;
      else if (u.morph) u.morph.value = v;
      mat.needsUpdate = true;
    } catch {}
  };

  // ── Stage tint sink
  const __applyStageTint = (stage) => {
    try {
      const mat = materialRef.current;
      if (!mat?.uniforms) return;
      const s = Canonical?.stages?.[stage] || {};
      const colors = s.colors || ['#00ffcc', '#f59e0b', '#ffffff'];
      const order = Canonical?.stageOrder || [];
      const idx = Math.max(0, order.indexOf(stage));
      const nextStage = order[Math.min(idx + 1, Math.max(0, order.length - 1))] || stage;
      const nextColors = Canonical?.stages?.[nextStage]?.colors || colors;

      const c0 = new THREE.Color(colors[0]);
      const c1 = new THREE.Color(nextColors[0]);
      const a1 = new THREE.Color(colors[1] || colors[0]);
      const a2 = new THREE.Color(colors[2] || colors[0]);

      const u = mat.uniforms;
      if (u.uColorCurrent) u.uColorCurrent.value = c0;
      if (u.uColorNext) u.uColorNext.value = c1;
      if (u.uColorAccent1) u.uColorAccent1.value = a1;
      if (u.uColorAccent2) u.uColorAccent2.value = a2;
      mat.needsUpdate = true;
    } catch {}
  };

  // ── BeatBus: morph progress
  useEffect(() => {
    const off = BeatBus?.on?.(EVENTS.MORPH_PROGRESS, (p) => {
      const v = clamp01(p?.value);
      fallbackMorphRef.current = v;
      __applyMorph(v);
    });
    return () => off && off();
  }, []);

  // ── BeatBus: stage change → tint
  useEffect(() => {
    const off = BeatBus?.on?.(EVENTS.STAGE_CHANGE, (p) => {
      const st = p?.stage || p?.name || String(p);
      setStageName(st);
      __applyStageTint(st);
    });
    return () => off && off();
  }, []);

  // ── Atlas init (one-time)
  useEffect(() => {
    const atlas = getPointSpriteAtlasSingleton();
    const texture = atlas.createWebGLTexture();
    setAtlasTexture(texture);
  }, []);

  // ── Opening emergence easing (dev convenience)
  useEffect(() => {
    const off = BeatBus?.on?.(EVENTS.PARTICLES_START_EMERGING, () => {
      const start = performance.now();
      const dur = 1400;
      const tick = (t0) => {
        const k = Math.min(1, (t0 - start) / dur);
        const v = k * k * (3 - 2 * k); // smoothstep
        fallbackMorphRef.current = v;
        __applyMorph(v);
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    return () => off && off();
  }, []);

  // ── BLUEPRINT_READY → bind full arrays (ignore minimal/emergence-only blueprints)
  useEffect(() => {
    const handleBlueprint = (payload) => {
      const { bp: raw, stageName: st, quality, cached } = normalizePayload(payload);

      // Skip emergence after first full stage, or cached emergence once full exists
      if (raw?.mode === 'emergence' && lastFullStageRef.current) return;
      if (cached && raw?.mode === 'emergence' && lastFullStageRef.current) return;

      const blueprintId = `${st}-${raw?.count || raw?.particleCount || raw?.activeCount || 0}-${raw?.mode || 'default'}`;
      if (blueprintId === lastBlueprintIdRef.current) return;
      lastBlueprintIdRef.current = blueprintId;

      // Require full arrays (renderer is a dumb sink)
      if (!(raw?.atmosphericPositions && raw?.text3DPositions)) {
        console.warn('HOTDORS: Ignoring minimal emergence blueprint; Engine must emit full arrays.');
        return;
      }

      lastFullStageRef.current = raw;
      setBlueprint(raw);
      setStageName(raw.stageName || st || 'genesis');
      setActiveCount(raw.activeCount || raw.particleCount || raw.maxParticles || 0);

      // Hot-swap into existing geometry if present
      if (geometryRef.current) {
        const geo = geometryRef.current;
        geo.setAttribute('position', new THREE.BufferAttribute(raw.atmosphericPositions, 3));
        geo.setAttribute('atmosphericPosition', new THREE.BufferAttribute(raw.atmosphericPositions, 3));
        geo.setAttribute('text3DPosition', new THREE.BufferAttribute(raw.text3DPositions, 3));
        if (raw.tierData) geo.setAttribute('tierData', new THREE.BufferAttribute(raw.tierData, 1));
        if (raw.sizeMultipliers) geo.setAttribute('sizeMultiplier', new THREE.BufferAttribute(raw.sizeMultipliers, 1));
        if (raw.opacityData) geo.setAttribute('opacityData', new THREE.BufferAttribute(raw.opacityData, 1));
        if (raw.atlasIndices) geo.setAttribute('atlasIndex', new THREE.BufferAttribute(raw.atlasIndices, 1));
        geo.attributes.position.needsUpdate = true;
        geo.setDrawRange(0, raw.activeCount || raw.particleCount);
      }

      console.log(
        `✅ Renderer: ${cached ? 'cached' : 'new'} BLUEPRINT_READY (full)`,
        `stage=${raw.stageName || st}, count=${raw.particleCount || raw.activeCount}, quality=${quality}`
      );
    };

    const off = BeatBus?.on?.(EVENTS.BLUEPRINT_READY, handleBlueprint);
    return () => off && off();
  }, []);

  // ── Build geometry from current blueprint
  const geometry = useMemo(() => {
    if (!blueprint) return null;

    const count =
      blueprint.activeCount ||
      blueprint.particleCount ||
      blueprint.maxParticles ||
      (blueprint.atmosphericPositions ? (blueprint.atmosphericPositions.length / 3) | 0 : 0);

    if (!count || !blueprint.atmosphericPositions || !blueprint.text3DPositions) return null;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(blueprint.atmosphericPositions, 3));
    geo.setAttribute('atmosphericPosition', new THREE.BufferAttribute(blueprint.atmosphericPositions, 3));
    geo.setAttribute('text3DPosition', new THREE.BufferAttribute(blueprint.text3DPositions, 3));

    if (blueprint.animationSeeds)
      geo.setAttribute('animationSeed', new THREE.BufferAttribute(blueprint.animationSeeds, 3));
    if (blueprint.sizeMultipliers)
      geo.setAttribute('sizeMultiplier', new THREE.BufferAttribute(blueprint.sizeMultipliers, 1));
    if (blueprint.opacityData)
      geo.setAttribute('opacityData', new THREE.BufferAttribute(blueprint.opacityData, 1));
    if (blueprint.atlasIndices)
      geo.setAttribute('atlasIndex', new THREE.BufferAttribute(blueprint.atlasIndices, 1));
    if (blueprint.tierData)
      geo.setAttribute('tierData', new THREE.BufferAttribute(blueprint.tierData, 1));

    const idx = new Float32Array(count);
    for (let i = 0; i < count; i++) idx[i] = i;
    geo.setAttribute('particleIndex', new THREE.BufferAttribute(idx, 1));
    geo.setDrawRange(0, activeCount || count);

    // dispose previous
    if (geometryRef.current) geometryRef.current.dispose();
    geometryRef.current = geo;
    return geo;
  }, [blueprint, activeCount]);

  // ── Build material & expose dev pointers
  const material = useMemo(() => {
    if (!atlasTexture || !blueprint) return null;

    const { current, next, acc1, acc2 } = pickStageColors(stageName);
    const stageIndex = Math.max(0, (Canonical?.stageOrder || []).indexOf(stageName));

    const POINT_SIZE_DEFAULT = Canonical?.features?.pointSizeDefault ?? 48.0;

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        // time + morph/scroll
        uTime: { value: 0 },
        uMorphProgress: { value: morphProgress },
        uScrollProgress: { value: scrollProgress },

        // aliases for compatibility
        uStageProgress: { value: morphProgress },
        uStageBlend: { value: scrollProgress },

        // colors
        uColorCurrent: { value: current },
        uColorNext: { value: next },
        uColorAccent1: { value: acc1 },
        uColorAccent2: { value: acc2 },

        // atlas
        uAtlasTexture: { value: atlasTexture },
        uTotalSprites: { value: 16 },

        // display
        uPointSize: { value: POINT_SIZE_DEFAULT },
        uDevicePixelRatio: { value: typeof gl?.getPixelRatio === 'function' ? gl.getPixelRatio() : 1 },
        uResolution: { value: new THREE.Vector2(size.width, size.height) },

        // tier/fade
        uActiveCount: { value: activeCount },
        uTierCutoff: { value: activeCount || 15000 },
        uFadeProgress: { value: 1.0 },
        uGaussianSigma: { value: 2.5 },
        uTierHighlight: { value: new Float32Array([1.0, 1.25, 1.5, 1.75]) },

        // feature toggles
        uGaussianFalloff: { value: Canonical?.features?.gaussianFalloff ?? 1.0 },
        uCenterWeighting: { value: Canonical?.features?.centerWeightingTier4 ?? 1.0 },

        // stage meta
        uStageIndex: { value: stageIndex },
        uBrainRegion: { value: stageIndex },
      },
      vertexShader: vertexShaderSource,
      fragmentShader: fragmentShaderSource,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });

    materialRef.current = mat;

    // dev console pointers
    if (typeof window !== 'undefined') {
      window.__webglBackground = { material: mat, meshRef, geometryRef };
      window.__consciousnessMaterial = mat;
      window.__particleGeometry = geometryRef.current || null;
    }

    // initial tint in case stage was set before mat existed
    __applyStageTint(stageName);

    return mat;
  }, [atlasTexture, blueprint, stageName, morphProgress, scrollProgress, size.width, size.height, gl, activeCount]);

  // ── Respond to resize / DPR changes
  useEffect(() => {
    const mat = materialRef.current;
    if (!mat || !mat.uniforms) return;

    const { width, height } = size || {};
    if (mat.uniforms.uResolution && width && height) {
      mat.uniforms.uResolution.value.set(width, height);
    }
    if (mat.uniforms.uDevicePixelRatio && typeof gl?.getPixelRatio === 'function') {
      mat.uniforms.uDevicePixelRatio.value = gl.getPixelRatio();
    }
    mat.uniformsNeedUpdate = true;
  }, [size?.width, size?.height, gl]);

  // ── Per-frame uniform updates
  useFrame((state) => {
    const mat = materialRef.current;
    if (!meshRef.current || !mat || !blueprint) return;

    // props or fallback drivers
    const mp = Math.max(morphProgress, fallbackMorphRef.current);
    const sp = Math.max(0, Math.min(1, Number(scrollProgress) || 0)); // no renderer scroll reads

    // uniforms
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uMorphProgress.value = mp;
    mat.uniforms.uScrollProgress.value = sp;
    mat.uniforms.uStageProgress.value = mp;
    mat.uniforms.uStageBlend.value = sp;
    mat.uniforms.uActiveCount.value = activeCount;
    mat.uniforms.uTierCutoff.value = activeCount;

    // stage choreography (optional, purely visual)
    const camCfg = Canonical?.stages?.[stageName]?.camera;
    if (camCfg?.movement === 'balletic_orbit') {
      const t = state.clock.elapsedTime * 0.1;
      meshRef.current.rotation.y = Math.sin(t) * 0.5;
      meshRef.current.rotation.x = Math.sin(t * 2) * 0.1;
    } else if (camCfg?.movement === 'dramatic_pullback' && camCfg?.shake) {
      const shake = Math.sin(state.clock.elapsedTime * 10) * 0.01;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.02 + shake;
      meshRef.current.rotation.x = shake * 0.5;
    } else if (camCfg?.movement === 'reverent_orbit') {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.01;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  if (!geometry || !material || !blueprint) return null;

  return (
    <points
      ref={meshRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      scale={[1, 1, 1]}
    />
  );
}

export default React.memo(WebGLBackground);

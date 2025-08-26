// src/components/webgl/WebGLBackground.jsx
// SST v3.0 COMPLIANT — Emergence morphing + stage tint + shader uniform compatibility

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EVENTS } from '@/theater/events.js';
import BeatBus from '@modules/orchestration/core/BeatBus.js';
const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));

// Atlas / canon
import { getPointSpriteAtlasSingleton } from './consciousness/PointSpriteAtlas.js';
import { Canonical } from '../../config/canonical/canonicalAuthority.js';

// BeatBus + canonical events

// Shaders
import vertexShaderSource from '../../shaders/templates/consciousness-vertex.glsl?raw';
import fragmentShaderSource from '../../shaders/templates/consciousness-fragment.glsl?raw';

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

function ensureArraysFromEmergence(bp) {
  if (bp?.atmosphericPositions && bp?.allenAtlasPositions) return bp;

  const positions = bp?.positions;
  if (!positions) return bp;

  const count = bp.count ?? ((positions.length / 3) | 0);
  const tiersU8 = bp.tiers || new Uint8Array(count);

  const sizeByTier = [0.6, 0.8, 1.2, 1.5];
  const opacityByTier = [0.5, 0.6, 0.75, 0.9];
  const atlasByTier = [7, 1, 4, 1];

  const sizeMultipliers = new Float32Array(count);
  const opacityData = new Float32Array(count);
  const atlasIndices = new Float32Array(count);
  const tierData = new Float32Array(count);
  const animationSeeds = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const t = tiersU8[i] | 0;
    tierData[i] = t;
    sizeMultipliers[i] = sizeByTier[t] ?? 1.0;
    opacityData[i] = opacityByTier[t] ?? 0.8;
    atlasIndices[i] = atlasByTier[t] ?? 1;
    const j = i * 3;
    animationSeeds[j + 0] = Math.random();
    animationSeeds[j + 1] = Math.random();
    animationSeeds[j + 2] = Math.random();
  }

  const atmosphericPositions = positions;
  const allenAtlasPositions = positions.slice
    ? positions.slice()
    : new Float32Array(positions);

  return {
    ...bp,
    stageName: bp.stageName || 'genesis',
    maxParticles: count,
    particleCount: count,
    activeCount: count,
    atmosphericPositions,
    allenAtlasPositions,
    animationSeeds,
    sizeMultipliers,
    opacityData,
    atlasIndices,
    tierData,
  };
}

// ──────────────── component ────────────────

function WebGLBackground({ morphProgress = 0, scrollProgress = 0 }) {
  // MORPH_V2: uniform sink
  const __applyMorph = (v) => {
    try {
      const mat = (typeof materialRef!=='undefined' && materialRef && materialRef.current) ||
                  globalThis.__consciousnessMaterial || globalThis.bgMaterial ||
                  (globalThis.__webglBackground && globalThis.__webglBackground.material) || null;
      if (!mat || !mat.uniforms) return;
      const u = mat.uniforms;
      if (u.uMorphProgress) u.uMorphProgress.value = v;
      else if (u.morphProgress) u.morphProgress.value = v;
      else if (u.uMorph) u.uMorph.value = v;
      else if (u.morph) u.morph.value = v;
      mat.needsUpdate = true;
    } catch { /* no-op */ }
  };

  const meshRef = useRef();
  const geometryRef = useRef();
  const materialRef = useRef();
  const lastBlueprintIdRef = useRef(null);
  const lastFullStageRef = useRef(null);

  const { size, gl, camera } = useThree();

  const [blueprint, setBlueprint] = useState(null);
  const [stageName, setStageName] = useState('genesis');
  const [atlasTexture, setAtlasTexture] = useState(null);
  const [activeCount, setActiveCount] = useState(0);

  // Fallback drivers when parent props aren't wired yet
  const fallbackMorphRef = useRef(0);
  const fallbackScrollRef = useRef(0);

  // HOTDORS_MORPH_LISTENER
  useEffect(() => {
    const off = BeatBus?.on?.(EVENTS.MORPH_PROGRESS, (p) => {
      try { 
        const v = clamp01(p?.value);
        fallbackMorphRef.current = v;
        __applyMorph(v);
      } catch { /* no-op */ }
    });
    return () => off && off();
  }, []);

  // HOTDORS_STAGE_TINT
  useEffect(() => {
    const off = BeatBus?.on?.(EVENTS.STAGE_CHANGE, (p) => {
      try { 
        const st = p?.stage || p?.name || String(p);
        setStageName(st);
        __applyStageTint(st);
      } catch { /* no-op */ }
    });
    return () => off && off();
  }, []);

  // Update tint uniforms based on stage
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
    } catch {
      /* no-op */
    }
  };

  // Atlas initialization
  useEffect(() => {
    const atlas = getPointSpriteAtlasSingleton();
    const texture = atlas.createWebGLTexture();
    setAtlasTexture(texture);
  }, []);

  // Fallback: scroll → normalized progress (0..1)
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const denom = Math.max(1, doc.scrollHeight - doc.clientHeight);
      fallbackScrollRef.current = doc.scrollTop / denom;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Emergence animation (ease-in morph when particles start emerging)
  useEffect(() => {
    const off = BeatBus?.on?.(EVENTS.PARTICLES_START_EMERGING, () => {
      const start = performance.now();
      const dur = 1400;
      const tick = (t0) => {
        const k = Math.min(1, (t0 - start) / dur);
        // smoothstep
        const v = k * k * (3 - 2 * k);
        fallbackMorphRef.current = v;
        __applyMorph(v);
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    return () => off && off();
  }, []);

  // BLUEPRINT_READY → set geometry sources (full or synthesized emergence)
  useEffect(() => {
    const handleBlueprint = (payload) => {
      const { bp: raw, stageName: st, quality, cached } = normalizePayload(payload);

  // Skip emergence after initial stage is set
  if (raw?.mode === 'emergence' && lastFullStageRef.current) {
    return;
  }

 // Skip cached emergence blueprints when we have real stage data
 if (cached && raw?.mode === 'emergence' && lastFullStageRef.current) {
   return;
 }

      // Skip duplicate blueprints
      const blueprintId = `${st}-${raw?.count || raw?.particleCount || raw?.activeCount || 0}-${raw?.mode || 'default'}`;
      if (blueprintId === lastBlueprintIdRef.current) return;
      lastBlueprintIdRef.current = blueprintId;

      // Full stage blueprint
      if (raw?.atmosphericPositions && raw?.allenAtlasPositions) {
        lastFullStageRef.current = raw;
        setBlueprint(raw);
        setStageName(raw.stageName || st || 'genesis');
        setActiveCount(raw.activeCount || raw.particleCount || raw.maxParticles || 0);
        
        // UPDATE GEOMETRY IF IT EXISTS
        if (geometryRef.current) {
          const geo = geometryRef.current;
          geo.setAttribute('position', new THREE.BufferAttribute(raw.atmosphericPositions, 3));
          geo.setAttribute('atmosphericPosition', new THREE.BufferAttribute(raw.atmosphericPositions, 3));
          geo.setAttribute('allenAtlasPosition', new THREE.BufferAttribute(raw.allenAtlasPositions, 3));
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
        return;
      }

      // Minimal emergence blueprint → synthesize arrays
      let bp = ensureArraysFromEmergence(raw);
      const count = bp.activeCount || bp.particleCount || bp.maxParticles || 0;

      // Scale emergence text so it's clearly visible
      try {
        const fovRad = (camera?.fov ?? 75) * Math.PI / 180;
        const z = camera?.position?.z ?? 80;
        const viewH = 2 * z * Math.tan(fovRad / 2);
        const desiredH = viewH * 0.65;
        const assumedTextH = 10.0;
        const textScale = desiredH / assumedTextH;

        for (let i = 0; i < bp.atmosphericPositions.length; i += 3) {
          bp.atmosphericPositions[i + 0] *= textScale;
          bp.atmosphericPositions[i + 1] *= textScale;
        }
      } catch {
        /* keep original scale if camera not ready */
      }

      // Target positions: use last full stage target if available; else sphere
      let targetAllen = lastFullStageRef.current?.allenAtlasPositions;
      if (targetAllen && targetAllen.length >= 3) {
        const srcCount = targetAllen.length / 3;
        const allen = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          const si = (i % srcCount) * 3;
          const di = i * 3;
          allen[di + 0] = targetAllen[si + 0];
          allen[di + 1] = targetAllen[si + 1];
          allen[di + 2] = targetAllen[si + 2];
        }
        bp.allenAtlasPositions = allen;
      } else {
        const allen = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          const di = i * 3;
          const theta = Math.random() * Math.PI * 2;
          const u = Math.random() * 2 - 1;
          const phi = Math.acos(u);
          const r = 22 + Math.random() * 10;
          allen[di + 0] = r * Math.sin(phi) * Math.cos(theta);
          allen[di + 1] = r * Math.sin(phi) * Math.sin(theta);
          allen[di + 2] = r * Math.cos(phi);
        }
        bp.allenAtlasPositions = allen;
      }

      setBlueprint(bp);
      setStageName(bp.stageName || st || 'genesis');
      setActiveCount(count);

      // UPDATE GEOMETRY IF IT EXISTS
      if (geometryRef.current && bp.atmosphericPositions) {
        const geo = geometryRef.current;
        geo.setAttribute('position', new THREE.BufferAttribute(bp.atmosphericPositions, 3));
        geo.setAttribute('atmosphericPosition', new THREE.BufferAttribute(bp.atmosphericPositions, 3));
        geo.setAttribute('allenAtlasPosition', new THREE.BufferAttribute(bp.allenAtlasPositions, 3));
        if (bp.tierData) geo.setAttribute('tierData', new THREE.BufferAttribute(bp.tierData, 1));
        if (bp.sizeMultipliers) geo.setAttribute('sizeMultiplier', new THREE.BufferAttribute(bp.sizeMultipliers, 1));
        if (bp.opacityData) geo.setAttribute('opacityData', new THREE.BufferAttribute(bp.opacityData, 1));
        if (bp.atlasIndices) geo.setAttribute('atlasIndex', new THREE.BufferAttribute(bp.atlasIndices, 1));
        geo.attributes.position.needsUpdate = true;
        geo.setDrawRange(0, count);
      }

      console.log(
        `✅ Renderer: ${cached ? 'cached' : 'new'} BLUEPRINT_READY (emergence→merged)`,
        `stage=${bp.stageName || st}, count=${count}, quality=${quality}`
      );

      if (bp.mode === 'emergence') {
        setTimeout(() => BeatBus?.emit?.(EVENTS.PARTICLES_EMERGED), 1200);
      }
    };

    const off = BeatBus?.on?.(EVENTS.BLUEPRINT_READY, handleBlueprint);
    return () => off && off();
  }, [camera]);

  // Geometry (stable attribute names)
  const geometry = useMemo(() => {
    if (!blueprint) return null;

    const count =
      blueprint.maxParticles ||
      blueprint.particleCount ||
      blueprint.activeCount ||
      (blueprint.positions ? (blueprint.positions.length / 3) | 0 : 0);

    if (!count) return null;

    const atmos = blueprint.atmosphericPositions;
    const allen = blueprint.allenAtlasPositions;
    if (!atmos || !allen) return null;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(atmos, 3));
    geo.setAttribute('atmosphericPosition', new THREE.BufferAttribute(atmos, 3));
    geo.setAttribute('allenAtlasPosition', new THREE.BufferAttribute(allen, 3));

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

    if (geometryRef.current) geometryRef.current.dispose();
    geometryRef.current = geo;
    return geo;
  }, [blueprint, activeCount]);

  // Material (shader + all uniforms; guard GPU capabilities)
  const material = useMemo(() => {
    if (!atlasTexture || !blueprint) return null;

    const { current, next, acc1, acc2 } = pickStageColors(stageName);
    const stageIndex = Math.max(0, (Canonical?.stageOrder || []).indexOf(stageName));

    // GPU-safe point size detection
    const glCtx = gl.getContext?.();
    let POINT_SIZE_DEFAULT = 48.0;
    try {
      if (glCtx) {
        const range = glCtx.getParameter(glCtx.ALIASED_POINT_SIZE_RANGE);
        if (range && range.length) {
          POINT_SIZE_DEFAULT = Math.min(64, range[1] * 0.85);
        }
      }
    } catch {
      POINT_SIZE_DEFAULT = 48.0;
    }

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        // Time + morph/scroll progress
        uTime: { value: 0 },
        uMorphProgress: { value: morphProgress },
        uScrollProgress: { value: scrollProgress },

        // Compatibility aliases (some shaders expect these)
        uStageProgress: { value: morphProgress },
        uStageBlend: { value: scrollProgress },

        // Colors
        uColorCurrent: { value: current },
        uColorNext: { value: next },
        uColorAccent1: { value: acc1 },
        uColorAccent2: { value: acc2 },

        // Atlas
        uAtlasTexture: { value: atlasTexture },
        uTotalSprites: { value: 16 },

        // Display
        uPointSize: { value: POINT_SIZE_DEFAULT },
        uDevicePixelRatio: { value: gl.getPixelRatio() },
        uResolution: { value: new THREE.Vector2(size.width, size.height) },

        // Tier & fade
        uActiveCount: { value: activeCount },
        uTierCutoff: { value: activeCount || 15000 },
        uFadeProgress: { value: 1.0 },
        uGaussianSigma: { value: 2.5 },
        uTierHighlight: { value: new Float32Array([1.0, 1.25, 1.5, 1.75]) },

        // Feature toggles from canon
        uGaussianFalloff: { value: Canonical?.features?.gaussianFalloff ?? 1.0 },
        uCenterWeighting: { value: Canonical?.features?.centerWeightingTier4 ?? 1.0 },

        // Stage meta
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

    mat.uniformsNeedUpdate = true;
    materialRef.current = mat;

    // expose for dev taps (DEV only if you gate elsewhere)
    if (typeof window !== 'undefined') {
      window.__webglBackground = { material: mat, meshRef, geometryRef };
      window.__consciousnessMaterial = mat;
      window.__particleGeometry = geometryRef.current;
    }

    return mat;
  }, [atlasTexture, blueprint, stageName, morphProgress, scrollProgress, size, gl, activeCount]);

  // Respond to resize / DPR changes
  useEffect(() => {
    const mat = materialRef.current;
    if (!mat) return;
    mat.uniforms.uResolution.value.set(size.width, size.height);
    mat.uniforms.uDevicePixelRatio.value = gl.getPixelRatio();
    mat.uniformsNeedUpdate = true;
  }, [size, gl]);

  // Animation frame (keeps uniforms fresh and drives motion)
  useFrame((state) => {
    const mat = materialRef.current;
    if (!meshRef.current || !mat || !blueprint) return;

    // Use props or fallback drivers
    const mp = Math.max(morphProgress, fallbackMorphRef.current);
    const sp = Math.max(scrollProgress, fallbackScrollRef.current);

    // Update uniforms every frame
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uMorphProgress.value = mp;
    mat.uniforms.uScrollProgress.value = sp;
    mat.uniforms.uStageProgress.value = mp;
    mat.uniforms.uStageBlend.value = sp;
    mat.uniforms.uActiveCount.value = activeCount;
    mat.uniforms.uTierCutoff.value = activeCount;

    // Camera-driven choreography (stage-specific)
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
    } else {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  if (!geometry || !material || !blueprint) return null;

  return (
    <points
      ref={meshRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      scale={[1.6, 1.6, 1.6]}
    />
  );
}

export default React.memo(WebGLBackground);
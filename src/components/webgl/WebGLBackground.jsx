// src/components/webgl/WebGLBackground.jsx
// WebGLBackground — Text-first morph (no allen*), behind-camera swirl emergence, camera fit

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EVENTS } from '@/theater/events.js';
import BeatBus from '@/modules/orchestration/core/BeatBus.js';

import { getPointSpriteAtlasSingleton } from './consciousness/PointSpriteAtlas.js';
import { Canonical } from '../../config/canonical/canonicalAuthority.js';

// Raw shaders (we’ll patch strings for swirl & larger clamp)
import vertexShaderRaw from '../../shaders/templates/consciousness-vertex.glsl?raw';
import fragmentShaderRaw from '../../shaders/templates/consciousness-fragment.glsl?raw';

const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));

function pickStageColors(stageName) {
  const s = Canonical?.stages?.[stageName] || {};
  const colors = s.colors || ['#00ffcc', '#f59e0b', '#ffffff'];
  const order = Canonical?.stageOrder || [];
  const idx = Math.max(0, order.indexOf(stageName));
  const nextStage = order[Math.min(idx + 1, Math.max(0, order.length - 1))];
  const nextColors = Canonical?.stages?.[nextStage]?.colors || colors;
  return {
    current: new THREE.Color(colors[0]),
    next:    new THREE.Color(nextColors[0]),
    acc1:    new THREE.Color(colors[1] || colors[0]),
    acc2:    new THREE.Color(colors[2] || colors[0]),
  };
}

function ensureArraysFromEmergence(bp, fallbackCount=0) {
  // Map legacy shapes to text3DPositions if needed (but DO NOT expose any allen* attribute)
  if (!bp?.text3DPositions && bp?.allenAtlasPositions) {
    bp = { ...bp, text3DPositions: bp.allenAtlasPositions };
  }

  if (bp?.atmosphericPositions && bp?.text3DPositions) return bp;

  const positions = bp?.positions;
  const count = bp?.count ?? (positions ? ((positions.length / 3) | 0) : (fallbackCount | 0));

  const sizeMultipliers = new Float32Array(count).fill(1);
  const opacityData     = new Float32Array(count).fill(1);
  const atlasIndices    = new Float32Array(count).fill(1);
  const tierData        = new Float32Array(count).fill(1);
  const seeds           = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const j = i * 3;
    seeds[j + 0] = Math.random();
    seeds[j + 1] = Math.random();
    seeds[j + 2] = Math.random();
  }

  const atmos = positions || new Float32Array(count * 3);
  const text  = positions ? positions.slice() : new Float32Array(count * 3);

  return {
    ...bp,
    stageName: bp?.stageName || bp?.stage || 'genesis',
    atmosphericPositions: atmos,
    text3DPositions: text,
    animationSeeds: seeds,
    sizeMultipliers, opacityData, atlasIndices, tierData,
    maxParticles: count, particleCount: count, activeCount: count
  };
}

function bboxFromAttr(attr) {
  if (!attr) return null;
  const a = attr.array;
  let minX = 1e9, minY = 1e9, minZ = 1e9, maxX = -1e9, maxY = -1e9, maxZ = -1e9;
  for (let i = 0; i < a.length; i += 3) {
    const x = a[i], y = a[i + 1], z = a[i + 2];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
  const w = maxX - minX, h = maxY - minY, d = maxZ - minZ;
  return { minX, minY, minZ, maxX, maxY, maxZ, cx, cy, cz, w, h, d, radius: 0.5 * Math.max(w, h) };
}

export default React.memo(function WebGLBackground({ morphProgress = 0, scrollProgress = 0 }) {
  const meshRef = useRef(null);
  const geometryRef = useRef(null);
  const materialRef = useRef(null);
  const lastFullStageRef = useRef(null);

  const { size, gl, camera } = useThree();

  const [blueprint, setBlueprint] = useState(null);
  const [stageName, setStageName] = useState('genesis');
  const [atlasTexture, setAtlasTexture] = useState(null);
  const [activeCount, setActiveCount] = useState(0);

  const fallbackMorphRef = useRef(0);
  const fallbackScrollRef = useRef(0);

  // BeatBus listeners
  useEffect(() => {
    const off = BeatBus?.on?.(EVENTS.MORPH_PROGRESS, p => {
      const v = clamp01(p?.value);
      fallbackMorphRef.current = v;
      const u = materialRef.current?.uniforms;
      if (u?.uMorphProgress) u.uMorphProgress.value = v;
    });
    return () => off && off();
  }, []);

  useEffect(() => {
    const off = BeatBus?.on?.(EVENTS.STAGE_CHANGE, p => {
      const st = p?.stage || p?.name || String(p);
      setStageName(st);
    });
    return () => off && off();
  }, []);

  useEffect(() => {
    const off = BeatBus?.on?.(EVENTS.PARTICLES_START_EMERGING, () => {
      // Ease morph 0 → 1 over ~1.2s
      const start = performance.now();
      const dur = 1200;
      const tick = (t0) => {
        const k = Math.min(1, (t0 - start) / dur);
        const v = k * k * (3 - 2 * k);
        fallbackMorphRef.current = v;
        const u = materialRef.current?.uniforms;
        if (u?.uMorphProgress) u.uMorphProgress.value = v;
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    return () => off && off();
  }, []);

  // Atlas once
  useEffect(() => {
    const atlas = getPointSpriteAtlasSingleton();
    setAtlasTexture(atlas.createWebGLTexture());
  }, []);

  // Scroll → 0..1 fallback
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const denom = Math.max(1, doc.scrollHeight - doc.clientHeight);
      fallbackScrollRef.current = doc.scrollTop / denom;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // BLUEPRINT_READY: install attributes, generate behind-camera atmos, fit camera
  useEffect(() => {
    const handleBlueprint = (payload) => {
      const raw = payload?.blueprint ?? payload;
      const stage = raw?.stageName || raw?.stage || 'genesis';
      const isEmergence = raw?.mode === 'emergence';

      // normalize, map any legacy fields to text3DPositions
      let bp = ensureArraysFromEmergence(raw);
      const count = bp.activeCount || bp.particleCount || bp.maxParticles || 0;

      if (bp.atmosphericPositions && bp.text3DPositions && !isEmergence) {
        lastFullStageRef.current = bp; // remember a full-stage blueprint
      }

      const text = bp.text3DPositions;
      if (!text || !text.length) return;

      // (A) geometry with stable names (no allen*)
      const geo = geometryRef.current || new THREE.BufferGeometry();
      if (!geometryRef.current) geometryRef.current = geo;

      geo.setAttribute('text3DPosition', new THREE.BufferAttribute(text, 3));

      // (B) behind-camera atmos seed (no more “square” spawns)
      {
        const bb = bboxFromAttr(geo.getAttribute('text3DPosition'));
        const aNew = new Float32Array(count * 3);
        const swirlR = (bb?.radius || 12) * 0.35;
        const camZ = camera.position.z;
        // camera looks down -Z; "behind camera" is at z > camZ
        const zMin = camZ + 20, zMax = camZ + 60;

        for (let i = 0; i < count; i++) {
          const j = i * 3;
          const ang = Math.random() * Math.PI * 2;
          const r = Math.sqrt(Math.random()) * swirlR;
          const x = (bb?.cx || 0) + Math.cos(ang) * r;
          const y = (bb?.cy || 0) + Math.sin(ang) * r;
          const z = zMin + Math.random() * (zMax - zMin);
          aNew[j + 0] = x; aNew[j + 1] = y; aNew[j + 2] = z;
        }

        geo.setAttribute('atmosphericPosition', new THREE.BufferAttribute(aNew, 3));
        geo.setAttribute('position', new THREE.BufferAttribute(aNew, 3)); // start here
      }

      // (C) per-particle attrs
      if (bp.animationSeeds)  geo.setAttribute('animationSeed',  new THREE.BufferAttribute(bp.animationSeeds, 3));
      if (bp.sizeMultipliers) geo.setAttribute('sizeMultiplier', new THREE.BufferAttribute(bp.sizeMultipliers, 1));
      if (bp.opacityData)     geo.setAttribute('opacityData',    new THREE.BufferAttribute(bp.opacityData, 1));
      if (bp.atlasIndices)    geo.setAttribute('atlasIndex',     new THREE.BufferAttribute(bp.atlasIndices, 1));
      if (bp.tierData)        geo.setAttribute('tierData',       new THREE.BufferAttribute(bp.tierData, 1));
      const idx = new Float32Array(count); for (let i = 0; i < count; i++) idx[i] = i;
      geo.setAttribute('particleIndex', new THREE.BufferAttribute(idx, 1));
      geo.setDrawRange(0, count);

      setBlueprint(bp);
      setStageName(stage);
      setActiveCount(count);

      // (D) fit camera & scale word to ~90% viewport width (without cropping)
      if (meshRef.current) {
        const bb = bboxFromAttr(geo.getAttribute('text3DPosition'));
        meshRef.current.position.set(-bb.cx, -bb.cy, meshRef.current.position.z);

        const vfov = (camera.fov || 60) * Math.PI / 180;
        const strictDist = (bb.h * 1.25 * 0.5) / Math.tan(vfov / 2); // 25% vertical pad
        const dist = strictDist * 1.8; // pull back further so we see the approach
        camera.position.set(0, 0, dist + Math.abs(bb.cz));

        const aspect = (size.width / size.height);
        const viewHalfH = dist * Math.tan(vfov / 2);
        const viewHalfW = viewHalfH * aspect;
        const desiredW = viewHalfW * 2 * 0.90; // 90% screen width
        const scaleXY = desiredW / Math.max(1e-3, bb.w);
        meshRef.current.scale.set(scaleXY, scaleXY, 1);

        camera.near = 0.1; camera.far = 5000; camera.updateProjectionMatrix();
      }

      if (isEmergence) {
        // allow settle time, then declare emerged
        setTimeout(() => BeatBus?.emit?.(EVENTS.PARTICLES_EMERGED), 1100);
      }

      // Log once per blueprint type
      console.log(`✅ Renderer: BLUEPRINT_READY (${isEmergence ? 'emergence' : 'full'}) stage=${stage}, count=${count}`);
    };

    const off = BeatBus?.on?.(EVENTS.BLUEPRINT_READY, handleBlueprint);
    return () => off && off();
  }, [camera, size]);

  // Geometry memo
  const geometry = useMemo(() => geometryRef.current || null, [blueprint, activeCount]);

  // Material (patch vertex shader: add swirl; raise point-size clamp to 64; remove any allen refs)
  const material = useMemo(() => {
    if (!atlasTexture || !blueprint) return null;

    const { current, next, acc1, acc2 } = pickStageColors(stageName);
    const order = Canonical?.stageOrder || [];
    const stageIndex = Math.max(0, order.indexOf(stageName));

    // Patch: remove allen*, add swirl, raise clamp
    let vsrc = String(vertexShaderRaw)
      .replace(/allenAtlasPosition/g, 'text3DPosition')
      .replace(
        /vec3 finalPos\s*=\s*basePos\s*\+\s*movement\s*;/,
        [
          '/* HOTDORS_SWIRL_PATCH */',
          'float kMorph = 1.0 - smoothstep(0.0, 0.7, uMorphProgress);',
          'float spinSeed = (animationSeed.x > 0.0) ? animationSeed.x : fract(vParticleIndex * 0.6180339);',
          'float ang = uTime * 1.2 + spinSeed * 6.2831853;',
          'vec3 swirl = vec3(cos(ang), sin(ang), 0.0) * (kMorph * 6.0);',
          'vec3 finalPos = basePos + movement + swirl;'
        ].join('\n')
      )
      .replace(/clamp\s*\(\s*gl_PointSize\s*,\s*1\.0\s*,\s*32\.0\s*\)/g, 'clamp(gl_PointSize, 1.0, 64.0)');

    const fscr = String(fragmentShaderRaw);

    // GPU-safe default point size
    const glCtx = gl.getContext?.();
    let POINT_SIZE_DEFAULT = 48.0;
    try {
      if (glCtx) {
        const range = glCtx.getParameter(glCtx.ALIASED_POINT_SIZE_RANGE);
        if (range && range.length) POINT_SIZE_DEFAULT = Math.min(64, range[1] * 0.85);
      }
    } catch {}

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMorphProgress: { value: morphProgress },
        uScrollProgress: { value: scrollProgress },
        uStageProgress: { value: morphProgress },
        uStageBlend: { value: scrollProgress },

        uColorCurrent: { value: current },
        uColorNext:    { value: next },
        uColorAccent1: { value: acc1 },
        uColorAccent2: { value: acc2 },

        uAtlasTexture: { value: atlasTexture },
        uTotalSprites: { value: 16 },

        uPointSize: { value: POINT_SIZE_DEFAULT },
        uDevicePixelRatio: { value: gl.getPixelRatio() },
        uResolution: { value: new THREE.Vector2(size.width, size.height) },

        uActiveCount: { value: activeCount },
        uTierCutoff:  { value: activeCount },
        uFadeProgress:{ value: 1.0 },
        uGaussianSigma:{ value: 2.5 },
        uTierHighlight:{ value: new Float32Array([1.0, 1.25, 1.5, 1.75]) },

        uGaussianFalloff: { value: Canonical?.features?.gaussianFalloff ?? 1.0 },
        uCenterWeighting: { value: Canonical?.features?.centerWeightingTier4 ?? 1.0 },

        uStageIndex:  { value: stageIndex },
        uBrainRegion: { value: stageIndex },
      },
      vertexShader: vsrc,
      fragmentShader: fscr,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });

    materialRef.current = mat;

    // Expose cleanly for console/devtools
    if (typeof window !== 'undefined') {
      window.__webglBackground = { material: mat, meshRef, geometryRef, camera };
      window.__consciousnessMaterial = mat;
      window.__particleGeometry = geometryRef.current;
      window.__r3fCamera = camera;
    }

    return mat;
  }, [atlasTexture, blueprint, stageName, morphProgress, scrollProgress, size, gl, activeCount]);

  // Respond to resize / DPR
  useEffect(() => {
    const mat = materialRef.current;
    if (!mat) return;
    mat.uniforms.uResolution.value.set(size.width, size.height);
    mat.uniforms.uDevicePixelRatio.value = gl.getPixelRatio();
    mat.uniformsNeedUpdate = true;
  }, [size, gl]);

  // Per-frame updates
  useFrame((state) => {
    const mat = materialRef.current;
    if (!meshRef.current || !mat || !blueprint) return;

    const mp = Math.max(morphProgress, fallbackMorphRef.current);
    const sp = Math.max(scrollProgress, fallbackScrollRef.current);

    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uMorphProgress.value = mp;
    mat.uniforms.uScrollProgress.value = sp;
    mat.uniforms.uStageProgress.value = mp;
    mat.uniforms.uStageBlend.value = sp;
    mat.uniforms.uActiveCount.value = activeCount;
    mat.uniforms.uTierCutoff.value = activeCount;

    // Optional gentle motion by stage (kept very subtle for readability)
    const camCfg = Canonical?.stages?.[stageName]?.camera;
    if (camCfg?.movement === 'reverent_orbit') {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.01;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    } else if (camCfg?.movement === 'dramatic_pullback' && camCfg?.shake) {
      const shake = Math.sin(state.clock.elapsedTime * 10) * 0.01;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.02 + shake;
      meshRef.current.rotation.x = shake * 0.5;
    } else {
      // keep still for maximum legibility
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
});

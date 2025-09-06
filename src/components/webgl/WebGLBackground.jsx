/* eslint-disable no-empty */
// src/components/webgl/WebGLBackground.jsx
// Dumb renderer for BeatGlyph v3.3 — binds blueprint attributes & uniforms only.

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EVENTS } from '@/theater/events.js';
import BeatBus from '@/theater/bus';

import { getPointSpriteAtlasSingleton } from './consciousness/PointSpriteAtlas.js';
import { Canonical } from '../../config/canonical/canonicalAuthority.js';

import vertexShaderSource from '../../shaders/templates/consciousness-vertex.glsl?raw';
import fragmentShaderSource from '../../shaders/templates/consciousness-fragment.glsl?raw';

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

function WebGLBackground({ morphProgress = 0, scrollProgress = 0 }) {
  const emergencePendingRef = React.useRef(false);
  const emittedEmergedRef   = React.useRef(false);

  const meshRef = useRef();
  const geometryRef = useRef();
  const materialRef = useRef();
  const lastBlueprintIdRef = useRef(null);

  const { size, gl, camera } = useThree();

  const [blueprint, setBlueprint] = useState(null);
  const [stageName, setStageName] = useState('genesis');
  const [atlasTexture, setAtlasTexture] = useState(null);
  const [activeCount, setActiveCount] = useState(0);

  const fallbackMorphRef = useRef(0);

  // 1) send viewport hint (world-space) to engine
  useEffect(() => {
    const fovRad = (camera.fov * Math.PI) / 180;
    const viewHeight = 2 * Math.abs(camera.position.z) * Math.tan(fovRad / 2);
    const viewWidth  = viewHeight * (size.width / size.height);

    BeatBus.emit(EVENTS.ENGINE_VIEWPORT_HINT, {
      width: viewWidth,
      height: viewHeight,
      aspect: size.width / size.height
    });
    console.log('📐 Renderer: Sent viewport hint', {
      width: viewWidth.toFixed(1),
      height: viewHeight.toFixed(1),
      cameraZ: camera.position.z
    });
  }, [size.width, size.height, camera]);

  const __applyMorph = (v) => {
    try {
      const mat = materialRef.current
        || globalThis.__consciousnessMaterial
        || (globalThis.__webglBackground && globalThis.__webglBackground.material)
        || null;
      if (!mat?.uniforms) return;
      const u = mat.uniforms;
      if (u.uMorphProgress) u.uMorphProgress.value = v;
      else if (u.morphProgress) u.morphProgress.value = v;
      else if (u.uMorph) u.uMorph.value = v;
      else if (u.morph) u.morph.value = v;
      mat.needsUpdate = true;
    } catch {}
  };

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
      if (u.uColorNext)    u.uColorNext.value    = c1;
      if (u.uColorAccent1) u.uColorAccent1.value = a1;
      if (u.uColorAccent2) u.uColorAccent2.value = a2;
      mat.needsUpdate = true;
    } catch {}
  };

  // Listen for MORPH_PROGRESS
  useEffect(() => {
    const off = BeatBus?.on?.(EVENTS.MORPH_PROGRESS, (p) => {
      const v = clamp01(p?.value);
      fallbackMorphRef.current = v;
      __applyMorph(v);
    });
    return () => off && off();
  }, []);

  // STAGE_CHANGE → tint sink
  useEffect(() => {
    const off = BeatBus?.on?.(EVENTS.STAGE_CHANGE, (p) => {
      const st = p?.stage || p?.name || String(p);
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

  // mark emergence window
  useEffect(() => {
    const off = BeatBus?.on?.(EVENTS.PARTICLES_START_EMERGING, () => {
      console.log('🔍 Setting emergence pending flag');
      emergencePendingRef.current = true;
      emittedEmergedRef.current = false;

      // small arrival easing only; do not emit here
      const start = performance.now();
      const dur = 1400;
      const tick = (t0) => {
        const k = Math.min(1, (t0 - start) / dur);
        const v = k * k * (3 - 2 * k);
        fallbackMorphRef.current = v;
        __applyMorph(v);
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    return () => off && off();
  }, []);

  // AABB helper
  const bounds = (arr) => {
    let minX=1e9,minY=1e9,minZ=1e9,maxX=-1e9,maxY=-1e9,maxZ=-1e9;
    for (let i=0;i<arr.length;i+=3){ const x=arr[i],y=arr[i+1],z=arr[i+2];
      if(x<minX)minX=x;if(y<minY)minY=y;if(z<minZ)minZ=z;
      if(x>maxX)maxX=x;if(y>maxY)maxY=y;if(z>maxZ)maxZ=z;
    }
    return {
      minX: minX.toFixed(1), maxX: maxX.toFixed(1),
      minY: minY.toFixed(1), maxY: maxY.toFixed(1),
      minZ: minZ.toFixed(1), maxZ: maxZ.toFixed(1)
    };
  };

  // BLUEPRINT_READY → bind
  useEffect(() => {
    const handleBlueprint = (payload) => {
      const { bp: raw, stageName: st, quality, cached, mode } = normalizePayload(payload);

      const id = `${st}-${raw?.count || raw?.particleCount || raw?.activeCount || 0}-${mode || 'default'}`;
      if (id === lastBlueprintIdRef.current) return;
      lastBlueprintIdRef.current = id;

      if (!(raw?.atmosphericPositions && raw?.text3DPositions)) {
        console.warn('HOTDORS: Ignoring minimal blueprint; Engine must emit full arrays.');
        return;
      }

      console.log('[AABB]', mode||'full',
        'atmos', bounds(raw.atmosphericPositions),
        'text',  bounds(raw.text3DPositions));

      const isEmergence = mode === 'emergence' || raw?.mode === 'emergence';

      // Always bind the incoming arrays
      setBlueprint(raw);
      setStageName(isEmergence ? 'genesis' : (raw.stageName || st || 'genesis'));
      setActiveCount(raw.activeCount || raw.particleCount || raw.maxParticles || 0);

      if (geometryRef.current) {
        const geo = geometryRef.current;
        geo.setAttribute('position',            new THREE.BufferAttribute(raw.atmosphericPositions, 3));
        geo.setAttribute('atmosphericPosition', new THREE.BufferAttribute(raw.atmosphericPositions, 3));
        geo.setAttribute('text3DPosition',      new THREE.BufferAttribute(raw.text3DPositions, 3));
        if (raw.animationSeeds) geo.setAttribute('animationSeed',  new THREE.BufferAttribute(raw.animationSeeds, 3));
        if (raw.sizeMultipliers)geo.setAttribute('sizeMultiplier', new THREE.BufferAttribute(raw.sizeMultipliers, 1));
        if (raw.opacityData)    geo.setAttribute('opacityData',    new THREE.BufferAttribute(raw.opacityData, 1));
        if (raw.atlasIndices)   geo.setAttribute('atlasIndex',     new THREE.BufferAttribute(raw.atlasIndices, 1));
        if (raw.tierData)       geo.setAttribute('tierData',       new THREE.BufferAttribute(raw.tierData, 1));
        geo.attributes.position.needsUpdate = true;
        geo.setDrawRange(0, raw.activeCount || raw.particleCount);
      }

      if (isEmergence) {
        console.log('✅ Renderer: emergence BLUEPRINT_READY (bound) stage=genesis',
          `count=${raw.particleCount || raw.activeCount}`, `quality=${quality}`);
        
        // HOTDORS_MICRO_BURST: drive morph 0→1 rapidly to show the explosion
        try {
          const start = performance.now(); const dur = 700;
          const burst = (t0)=>{ const k = Math.min(1, (t0 - start)/dur); const v = k*k*(3-2*k);
            fallbackMorphRef.current = v; __applyMorph(v); if (k<1) requestAnimationFrame(burst); };
          requestAnimationFrame(burst);
        } catch {}
emergencePendingRef.current = true;  // Set the flag for emergence
      } else {
        console.log(`✅ Renderer: ${cached ? 'cached' : 'new'} BLUEPRINT_READY (full)`,
          `stage=${raw.stageName || st}`, `count=${raw.particleCount || raw.activeCount}`, `quality=${quality}`);

        // Emit PARTICLES_EMERGED for first full genesis after emergence
        if (raw.stageName === 'genesis' && emergencePendingRef.current && !emittedEmergedRef.current) {
          BeatBus.emit(EVENTS.PARTICLES_EMERGED);
          emittedEmergedRef.current = true;
          emergencePendingRef.current = false;
          console.log('🎯 Renderer: PARTICLES_EMERGED emitted');
        }
      }
    };

    const off = BeatBus?.on?.(EVENTS.BLUEPRINT_READY, handleBlueprint);
    return () => off && off();
  }, []);

  // Build geometry
  const geometry = useMemo(() => {
    if (!blueprint) return null;

    const count =
      blueprint.activeCount ||
      blueprint.particleCount ||
      blueprint.maxParticles ||
      (blueprint.atmosphericPositions ? (blueprint.atmosphericPositions.length / 3) | 0 : 0);

    if (!count || !blueprint.atmosphericPositions || !blueprint.text3DPositions) return null;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position',            new THREE.BufferAttribute(blueprint.atmosphericPositions, 3));
    geo.setAttribute('atmosphericPosition', new THREE.BufferAttribute(blueprint.atmosphericPositions, 3));
    geo.setAttribute('text3DPosition',      new THREE.BufferAttribute(blueprint.text3DPositions, 3));

    if (blueprint.animationSeeds)  geo.setAttribute('animationSeed',  new THREE.BufferAttribute(blueprint.animationSeeds, 3));
    if (blueprint.sizeMultipliers) geo.setAttribute('sizeMultiplier', new THREE.BufferAttribute(blueprint.sizeMultipliers, 1));
    if (blueprint.opacityData)     geo.setAttribute('opacityData',    new THREE.BufferAttribute(blueprint.opacityData, 1));
    if (blueprint.atlasIndices)    geo.setAttribute('atlasIndex',     new THREE.BufferAttribute(blueprint.atlasIndices, 1));
    if (blueprint.tierData)        geo.setAttribute('tierData',       new THREE.BufferAttribute(blueprint.tierData, 1));

    const idx = new Float32Array(count);
    for (let i = 0; i < count; i++) idx[i] = i;
    geo.setAttribute('particleIndex', new THREE.BufferAttribute(idx, 1));
    geo.setDrawRange(0, activeCount || count);

    if (geometryRef.current) geometryRef.current.dispose();
    geometryRef.current = geo;
    return geo;
  }, [blueprint, activeCount]);

  // Build material
  const material = useMemo(() => {
    if (!atlasTexture || !blueprint) return null;

    const isGenesis = stageName === 'genesis';
    const { current, next, acc1, acc2 } = pickStageColors(stageName);
    const stageIndex = Math.max(0, (Canonical?.stageOrder || []).indexOf(stageName));
    const POINT_SIZE_DEFAULT = Canonical?.features?.pointSizeDefault ?? 48.0;

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMorphProgress:  { value: morphProgress },
        uScrollProgress: { value: scrollProgress },

        uStageProgress: { value: morphProgress },
        uStageBlend:    { value: scrollProgress },

        // Stage-0 green lock
        uColorCurrent: { value: current },
        uColorNext:    { value: isGenesis ? current : next },
        uColorAccent1: { value: acc1 },
        uColorAccent2: { value: acc2 },

        uAtlasTexture:  { value: atlasTexture },
        uTotalSprites:  { value: 16 },

        uPointSize:        { value: POINT_SIZE_DEFAULT },
        uDevicePixelRatio: { value: typeof gl?.getPixelRatio === 'function' ? gl.getPixelRatio() : 1 },
        uResolution:       { value: new THREE.Vector2(size.width, size.height) },

        uActiveCount:   { value: activeCount },
        uTierCutoff:    { value: activeCount || 15000 },
        uFadeProgress:  { value: 1.0 },
        uGaussianSigma: { value: 2.5 },
        uTierHighlight: { value: new Float32Array([1.0, 1.25, 1.5, 1.75]) },

        uGaussianFalloff: { value: Canonical?.features?.gaussianFalloff ?? 1.0 },
        uCenterWeighting: { value: Canonical?.features?.centerWeightingTier4 ?? 1.0 },

        uStageIndex:  { value: stageIndex },
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

    if (typeof window !== 'undefined') {
      window.__webglBackground = { material: mat, meshRef, geometryRef };
      window.__consciousnessMaterial = mat;
      window.__particleGeometry = geometryRef.current || null;
    }

    __applyStageTint(stageName);
    return mat;
  }, [atlasTexture, blueprint, stageName, morphProgress, scrollProgress, size.width, size.height, gl, activeCount]);

  // Resize / DPR
  useEffect(() => {
    const mat = materialRef.current;
    if (!mat?.uniforms) return;
    const { width, height } = size || {};
    if (mat.uniforms.uResolution && width && height) {
      mat.uniforms.uResolution.value.set(width, height);
    }
    if (mat.uniforms.uDevicePixelRatio && typeof gl?.getPixelRatio === 'function') {
      mat.uniforms.uDevicePixelRatio.value = gl.getPixelRatio();
    }
    mat.uniformsNeedUpdate = true;
  }, [size, gl]);

  // Per-frame uniforms
  useFrame((state) => {
    const mat = materialRef.current;
    if (!meshRef.current || !mat || !blueprint) return;

    const mp = Math.max(morphProgress, fallbackMorphRef.current);
    const sp = Math.max(0, Math.min(1, Number(scrollProgress) || 0));

    mat.uniforms.uTime.value          = state.clock.elapsedTime;
    mat.uniforms.uMorphProgress.value = mp;
    mat.uniforms.uScrollProgress.value= sp;
    mat.uniforms.uStageProgress.value = mp;

    // Stage-0 green lock
    mat.uniforms.uStageBlend.value    = (stageName === 'genesis') ? 0 : sp;
    mat.uniforms.uActiveCount.value   = activeCount;
    mat.uniforms.uTierCutoff.value    = activeCount;
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
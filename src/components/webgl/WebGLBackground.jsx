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

import { getPointSpriteAtlasSingleton } from './consciousness/PointSpriteAtlas.js';
import { Canonical } from '../../config/canonical/canonicalAuthority.js';
import { VC } from '@/config/visual-controls.js';

import vertexShaderSource from '../../shaders/templates/consciousness-vertex.glsl?raw';
import fragmentShaderSource from '../../shaders/templates/consciousness-fragment.glsl?raw';

const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));

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

function WebGLBackground({ morphProgress = 0, scrollProgress = 0 }) {
  const emergencePendingRef = useRef(false);
  const emittedEmergedRef   = useRef(false);

  const meshRef = useRef();
  const geometryRef = useRef(null);
  const materialRef = useRef(null);

  const lastBlueprintIdRef = useRef(null);
  const fallbackMorphRef = useRef(0);
  const { size, gl, camera } = useThree();

  const [blueprint, setBlueprint] = useState(null);
  const [stageName, setStageName] = useState('genesis');
  const [atlasTexture, setAtlasTexture] = useState(null);
  const [activeCount, setActiveCount] = useState(0);

  // Point size (once) -- base only; shader multiplies by uDevicePixelRatio
  useEffect(() => {
    const u = materialRef.current?.uniforms;
    if (!u?.uPointSize) return;
    const base = Canonical?.features?.pointSizeDefault ?? 48.0;
    u.uPointSize.value = base;
  }, []);

  // Viewport hint from projection matrix
  const emitViewportHint = useCallback(() => {
    try {
      const m11 = camera?.projectionMatrix?.elements?.[5] || 1; // 1/tan(fov/2)
      const tanHalfFov = 1 / m11;
      const dist = Math.abs(camera?.position?.z || 1);
      const viewHeight = 2 * dist * tanHalfFov;
      const viewWidth  = viewHeight * (size.width / size.height);
      BeatBus.emit(EVENTS.ENGINE_VIEWPORT_HINT, {
        width: viewWidth, height: viewHeight, aspect: size.width / size.height,
      });
      // expose last hint for probes (DEV only reads)
      if (typeof window !== 'undefined') {
        window.__viewportHint = { width: viewWidth, height: viewHeight, aspect: size.width / size.height };
      }
      console.log('📐 Renderer: Sent viewport hint (proj-matrix)', {
        width: viewWidth.toFixed(1), height: viewHeight.toFixed(1), cameraZ: dist
      });
    } catch (e) { console.warn('Viewport hint emit failed', e); }
  }, [size.width, size.height, camera]);

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
    mat.needsUpdate = true;
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
    mat.needsUpdate = true;
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
    mat.needsUpdate = true;
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

      if (isEmergence) {
        console.log('✅ Renderer: BR(emergence) bound', `count=${raw.particleCount || raw.activeCount}`, `quality=${quality}`);
        emergencePendingRef.current = true;
      } else {
        console.log(`✅ Renderer: ${cached ? 'cached' : 'new'} BR(full)`, `stage=${raw.stageName || st}`, `count=${raw.particleCount || raw.activeCount}`, `quality=${quality}`);
        if ((raw.stageName || st) === 'genesis' && emergencePendingRef.current && !emittedEmergedRef.current) {
          BeatBus.emit(EVENTS.PARTICLES_EMERGED);
          emittedEmergedRef.current = true;
          emergencePendingRef.current = false;
          console.log('EMERGED once');
        }
      }
    };

    const off = BeatBus?.on?.(EVENTS.BLUEPRINT_READY, handleBlueprint);
    return () => off && off();
  }, []);

  // build material once atlas+blueprint exist
  useEffect(() => {
    if (!atlasTexture || !blueprint) return;
    const isGenesis = stageName === 'genesis';
    const { current, next, acc1, acc2 } = pickStageColors(stageName);
    const stageIndex = Math.max(0, (Canonical?.stageOrder || []).indexOf(stageName));
    const POINT_SIZE_DEFAULT = Canonical?.features?.pointSizeDefault ?? 48.0;

    const mat = new THREE.ShaderMaterial({
      onBeforeCompile: () => { try { console.log('🧪 Shader compiled'); } catch {} },
      uniforms: {
        uTime: { value: 0 },
        uMorphProgress:  { value: morphProgress },
        uScrollProgress: { value: scrollProgress },
        uStageProgress:  { value: morphProgress },
        uStageBlend:     { value: scrollProgress },

        uColorCurrent: { value: current },
        uColorNext:    { value: isGenesis ? current : next },
        uColorAccent1: { value: acc1 },
        uColorAccent2: { value: acc2 },

        uAtlasTexture:  { value: atlasTexture },
        uTotalSprites:  { value: 16 },

        uPointSize:        { value: POINT_SIZE_DEFAULT },
        // clamp device pixel ratio to keep sprites from "exploding" on HiDPI
        uDevicePixelRatio: { value: (() => {
          try { return Math.min(gl?.getPixelRatio?.() ?? 1, 1.5); } catch { return 1; }
        })() },
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
  }, [atlasTexture, blueprint, stageName, morphProgress, scrollProgress, size.width, size.height, gl, activeCount]);

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

  // RENDER_DIRECTIVE sink (apply data-only; no timers)
  useEffect(() => {
    const off = BeatBus?.on?.(EVENTS.RENDER_DIRECTIVE, (d = {}) => {
      const mat = materialRef.current, geo = geometryRef.current;
      if (!mat?.uniforms || !geo) return;
      const u = mat.uniforms;
      if (typeof d.morphProgress === 'number' && u.uMorphProgress) {
        const v = clamp01(d.morphProgress);
        u.uMorphProgress.value = v;
        if (u.uStageProgress) u.uStageProgress.value = v;
      }
      if (typeof d.activeCount === 'number') {
        const n = Math.max(0, d.activeCount | 0);
        setActiveCount(n);
        geo.setDrawRange(0, n);
        if (u.uActiveCount) u.uActiveCount.value = n;
        if (u.uTierCutoff)  u.uTierCutoff.value  = n;
      } else if (typeof d.drawCount === 'number') {
        geo.setDrawRange(0, Math.max(0, d.drawCount | 0));
      }
      if (typeof d.pointSize === 'number'     && u.uPointSize)     u.uPointSize.value     = d.pointSize;
      if (typeof d.gaussianSigma === 'number' && u.uGaussianSigma) u.uGaussianSigma.value = d.gaussianSigma;
      if (Array.isArray(d.tierHighlight) && u.uTierHighlight?.value) {
        const arr = u.uTierHighlight.value;
        for (let i = 0; i < Math.min(arr.length, d.tierHighlight.length); i++) arr[i] = d.tierHighlight[i];
      }
      if (d.uniforms) for (const k in d.uniforms) if (u[k]) u[k].value = d.uniforms[k];
      mat.needsUpdate = true;
    });
    return () => off && off();
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

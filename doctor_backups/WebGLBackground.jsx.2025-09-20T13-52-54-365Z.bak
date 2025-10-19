/* eslint-disable no-empty */
// src/components/webgl/WebGLBackground.jsx
// HOT‑DORS one‑touch, idempotent renderer — projection‑matrix viewport + ATS self‑verify
// Single writer: binds geometry/material, emits PARTICLES_EMERGED exactly once.

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
  
  // set uPointSize once (DPR-aware) — __POINTSIZE_ONCE_PATCH__
  useEffect(() => {
    if (!materialRef?.current?.uniforms?.uPointSize) return;
    const base = (Canonical?.features?.pointSizeDefault ?? 48.0);
    const dpr  = Math.min(window.devicePixelRatio || 1, 2);
    materialRef.current.uniforms.uPointSize.value = dpr >= 2 ? base * 0.75 : base;
  }, []);
  
  const lastBlueprintIdRef = useRef(null);

  const { size, gl, camera } = useThree();

  const [blueprint, setBlueprint] = useState(null);
  const [stageName, setStageName] = useState('genesis');
  const [atlasTexture, setAtlasTexture] = useState(null);
  const [activeCount, setActiveCount] = useState(0);

  const fallbackMorphRef = useRef(0);

  // ────────────────────────────────────────────────────────────────────────────
  // 1) Projection‑matrix viewport hint (NO camera["fov"] usage)
  //    This clears the RENDERER_FOV_TWEAK warning.
  // ────────────────────────────────────────────────────────────────────────────
  const emitViewportHint = React.useCallback(() => {
    try {
      // m11 = 1 / tan(fov/2)
      const m11 = camera?.projectionMatrix?.elements?.[5] || 1; 
      const tanHalfFov = 1 / m11;
      const dist = Math.abs(camera?.position?.z || 1);
      const viewHeight = 2 * dist * tanHalfFov;
      const viewWidth  = viewHeight * (size.width / size.height);

      BeatBus.emit(EVENTS.ENGINE_VIEWPORT_HINT, {
        width: viewWidth,
        height: viewHeight,
        aspect: size.width / size.height,
      });
      console.log('📐 Renderer: Sent viewport hint (proj-matrix)', {
        width: viewWidth.toFixed(1), height: viewHeight.toFixed(1), cameraZ: dist
      });
    } catch (e) {
      console.warn('Viewport hint emit failed', e);
    }
  }, [size.width, size.height, camera]);

  useEffect(() => { emitViewportHint(); }, [emitViewportHint]);

  /* Re-emit viewport hint on mount + for 1.5s and on resize — __HINT_REEMIT_PATCH__ */
  useEffect(() => {
    let stopped=false;
    const onResize = () => { try { emitViewportHint(); } catch {} };
    const t0 = performance.now();
    const iv = setInterval(() => {
      try { emitViewportHint(); } catch {}
      if (performance.now() - t0 > 1500) { clearInterval(iv); }
    }, 250);
    window.addEventListener('resize', onResize);
    return () => { clearInterval(iv); window.removeEventListener('resize', onResize); stopped=true; };
  }, [emitViewportHint]);

  // ────────────────────────────────────────────────────────────────────────────
  // 2) Morph sink (idempotent)
  // ────────────────────────────────────────────────────────────────────────────
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

  // Stage tint sink
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

  // Emergence window flag
  useEffect(() => {
    const off = BeatBus?.on?.(EVENTS.PARTICLES_START_EMERGING, () => {
      emergencePendingRef.current = true;
      emittedEmergedRef.current = false;
      // soft arrival ease (does not emit fencepost)
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

  // AABB helper (diagnostic)
  const bounds = (arr) => {
    let minX=1e9,minY=1e9,minZ=1e9,maxX=-1e9,maxY=-1e9,maxZ=-1e9;
    for (let i=0;i<arr.length;i+=3){ const x=arr[i],y=arr[i+1],z=arr[i+2];
      if(x<minX)minX=x;if(y<minY)minY=y;if(z<minZ)minZ=z;
      if(x>maxX)maxX=x;if(y>maxY)maxY=y;if(z>maxZ)maxZ=z;
    }
    return { minX: minX.toFixed(1), maxX: maxX.toFixed(1), minY: minY.toFixed(1), maxY: maxY.toFixed(1), minZ: minZ.toFixed(1), maxZ: maxZ.toFixed(1) };
  };

  // BLUEPRINT_READY → bind (single writer)
  useEffect(() => {
    const handleBlueprint = (payload) => {
      const { bp: raw, stageName: st, quality, cached, mode } = normalizePayload(payload);
      const id = `${st}-${raw?.count || raw?.particleCount || raw?.activeCount || 0}-${mode || 'default'}`;
      if (id === lastBlueprintIdRef.current) return;
      lastBlueprintIdRef.current = id;

      if (!(raw?.atmosphericPositions && raw?.text3DPositions)) {
        console.warn('HOT‑DORS: Ignoring minimal blueprint; Engine must emit full arrays.');
        return;
      }

      const isEmergence = mode === 'emergence' || raw?.mode === 'emergence';

      // Ignore non‑genesis full while emergence pending (pre‑scroll)
      if (!isEmergence && emergencePendingRef.current) {
        if ((raw.stageName || st) !== 'genesis') {
          console.warn('🖼️ Renderer: ignoring pre‑scroll full for stage=', raw.stageName || st);
          return;
        }
      }

      // Ignore late emergence after handoff
      if (isEmergence && emittedEmergedRef.current) {
        console.warn('🖼️ Renderer: ignoring late emergence after handoff');
        return;
      }

      // Bind arrays
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
        console.log('✅ Renderer: emergence BLUEPRINT_READY (bound) stage=genesis', `count=${raw.particleCount || raw.activeCount}`, `quality=${quality}`);
        // Micro‑burst ease to visually confirm arrival (does not own choreography)
        try {
          const start = performance.now(); const dur = 700;
          const burst = (t0)=>{ const k = Math.min(1, (t0 - start)/dur); const v = k*k*(3-2*k);
            fallbackMorphRef.current = v; __applyMorph(v); if (k<1) requestAnimationFrame(burst); };
          requestAnimationFrame(burst);
        } catch {}
        emergencePendingRef.current = true;
      } else {
        console.log(`✅ Renderer: ${cached ? 'cached' : 'new'} BLUEPRINT_READY (full)`, `stage=${raw.stageName || st}`, `count=${raw.particleCount || raw.activeCount}`, `quality=${quality}`);
        if ((raw.stageName || st) === 'genesis' && emergencePendingRef.current && !emittedEmergedRef.current) {
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

        // Stage‑0 green lock
        uColorCurrent: { value: current },
        uColorNext:    { value: isGenesis ? current : next },
        uColorAccent1: { value: acc1 },
        uColorAccent2: { value: acc2 },

        uAtlasTexture:  { value: atlasTexture },
        uTotalSprites:  { value: 16 },

        uPointSize:        { value: POINT_SIZE_DEFAULT }, // canon‑driven, set once
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

  // Resize / DPR (does not change point size heuristics per frame)
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

  // Per‑frame uniforms + chaos swirl window
  useFrame((state, delta) => {
    const mat = materialRef.current;
    if (!meshRef.current || !mat || !blueprint) return;

    const mp = Math.max(morphProgress, fallbackMorphRef.current);
    const sp = Math.max(0, Math.min(1, Number(scrollProgress) || 0));

    mat.uniforms.uTime.value          = state.clock.elapsedTime;
    mat.uniforms.uMorphProgress.value = mp;
    mat.uniforms.uScrollProgress.value= sp;
    mat.uniforms.uStageProgress.value = mp;

    // Stage‑0 green lock
    mat.uniforms.uStageBlend.value    = (stageName === 'genesis') ? 0 : sp;
    mat.uniforms.uActiveCount.value   = activeCount;
    mat.uniforms.uTierCutoff.value    = activeCount;

    // Chaos swirl only during emergence window
    if (emergencePendingRef.current && !emittedEmergedRef.current) {
      meshRef.current.rotation.z += delta * 0.55;
      meshRef.current.rotation.y += delta * 0.25;
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // HOT‑DORS: self‑bootstrapping console helpers + ATS self‑verify (idempotent)
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (globalThis.hotdors?.installed) return; // idempotent

    const eventLog = [];
    const taps = [
      BeatBus.on(EVENTS.ENGINE_VIEWPORT_HINT, (p) => eventLog.push({ ev: 'hint', t: performance.now(), p })),
      BeatBus.on(EVENTS.PARTICLES_START_EMERGING, () => eventLog.push({ ev: 'start', t: performance.now() })),
      BeatBus.on(EVENTS.BLUEPRINT_READY, (p) => eventLog.push({ ev: (p?.mode==='emergence'||p?.blueprint?.mode==='emergence')?'emergence':'full', stage: p?.stage||p?.blueprint?.stageName, t: performance.now() })),
      BeatBus.on(EVENTS.PARTICLES_EMERGED, () => eventLog.push({ ev: 'emerged', t: performance.now() })),
      BeatBus.on(EVENTS.STAGE_CHANGE, (p) => eventLog.push({ ev: 'stage', stage: p?.stage||p, t: performance.now() })),
      BeatBus.on(EVENTS.ENABLE_SCROLL, () => eventLog.push({ ev: 'scroll', t: performance.now() })),
    ];

    const subseq = (names) => {
      let i = 0; const out = [];
      for (const e of eventLog) { if (e.ev === names[i]) { out.push(e); i++; if (i===names.length) break; } }
      return i === names.length ? out : null;
    };

    const verify = () => {
      const mat = materialRef.current;
      const geo = geometryRef.current;
      const u = mat?.uniforms || {};
      const ok = !!(u.uPointSize && u.uResolution && u.uDevicePixelRatio);
      const once = emittedEmergedRef.current ? 'yes' : 'pending';
      console.groupCollapsed('✅ HOT‑DORS verify');
      console.log('uniforms:', Object.keys(u));
      console.log('geometry attrs:', geo ? Object.keys(geo.attributes) : '(none)');
      console.log('PARTICLES_EMERGED emitted once:', once);
      console.log('eventLog:', eventLog);
      console.groupEnd();
      return ok;
    };

    const fit = () => {
      try {
        const m11 = camera?.projectionMatrix?.elements?.[5] || 1;
        const tanHalfFov = 1 / m11; // derived, not using camera["fov"]
        const dist = Math.abs(camera?.position?.z || 1);
        const viewHeight = 2 * dist * tanHalfFov;
        const px = Math.min(size.width, size.height);
        const recommended = Math.max(24, Math.min(96, (px / viewHeight) * 18));
        const mat = materialRef.current; if (!mat?.uniforms?.uPointSize) return recommended;
        mat.uniforms.uPointSize.value = recommended; mat.needsUpdate = true;
        console.log('HOT‑DORS: uPointSize set once →', recommended.toFixed(2));
        return recommended;
      } catch (e) { console.warn('fit() failed', e); return null; }
    };

    const selfverifyATS = () => {
      const exp = ['hint','start','emergence','full','emerged','stage','scroll'];
      const seq = subseq(exp);
      const pass = !!seq;
      console.groupCollapsed(pass ? '🟢 ATS PASS — opening fencepost order' : '🟡 ATS WAIT/FAIL — missing fenceposts');
      console.table(eventLog.map(e=>({ ev:e.ev, stage:e.stage||'', t:Math.round(e.t%60000) })));
      if (!pass) console.log('Expected subsequence:', exp);
      console.groupEnd();
      return pass;
    };

    globalThis.hotdors = Object.assign(globalThis.hotdors || {}, {
      installed: true,
      verify,
      fit,
      selfverifyATS,
      setPointSize(n){ try{ const m=materialRef.current; if(m?.uniforms?.uPointSize){ m.uniforms.uPointSize.value = Number(n)||48; m.needsUpdate = true; console.log('uPointSize →', m.uniforms.uPointSize.value);} }catch{} },
      densify(n){ try{ const geo=geometryRef.current; if(!geo) return; const max = n|0; geo.setDrawRange(0, max); console.log('drawRange →', max);}catch{} },
      _eventLog: eventLog,
    });

    console.log('✅ HOT‑DORS installed. Dev helpers: hotdors.verify(), hotdors.fit(), hotdors.selfverifyATS()');

    return () => { taps.forEach(off => off && off()); };
  }, [camera, size.width, size.height]);

  /* Vision: expose root for chaos spin sampling (one-shot) */
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try { 
        if (meshRef?.current) {
          window.__webglRoot = meshRef.current;
        }
      } catch {}
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Render early‑out if not ready
  if (!blueprint || !atlasTexture) return null;

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